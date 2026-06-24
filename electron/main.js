import { app, BrowserWindow, shell, ipcMain, Notification } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// -----------------------------------------------------------------------
// SINGLE INSTANCE LOCK
// -----------------------------------------------------------------------
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      if (windows[0].isMinimized()) windows[0].restore();
      windows[0].focus();
    }
  });

  // -----------------------------------------------------------------------
  // WINDOW STATE PERSISTENCE (Lightweight custom store)
  // -----------------------------------------------------------------------
  const stateFilePath = path.join(app.getPath('userData'), 'window-state.json');

  function getSavedWindowState() {
    try {
      if (fs.existsSync(stateFilePath)) {
        return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
      }
    } catch (err) {
      console.error('Error reading window state', err);
    }
    return null;
  }

  function saveWindowState(win) {
    try {
      const bounds = win.getBounds();
      fs.writeFileSync(stateFilePath, JSON.stringify(bounds));
    } catch (err) {
      console.error('Error saving window state', err);
    }
  }

  let stateSaveTimer;
  function debounceStateSave(win) {
    clearTimeout(stateSaveTimer);
    stateSaveTimer = setTimeout(() => saveWindowState(win), 500);
  }

  // -----------------------------------------------------------------------
  // CREATE WINDOW
  // -----------------------------------------------------------------------
  function createWindow() {
    const savedState = getSavedWindowState() || {};
    
    const mainWindow = new BrowserWindow({
      x: savedState.x,
      y: savedState.y,
      width: savedState.width || 1600,
      height: savedState.height || 1000,
      minWidth: 1200,
      minHeight: 800,
      title: 'EFAPP Desktop',
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    if (isDev) {
      mainWindow.loadURL('http://localhost:5173');
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Save state on resize and move
    mainWindow.on('resize', () => debounceStateSave(mainWindow));
    mainWindow.on('move', () => debounceStateSave(mainWindow));

    // Intercept external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        if (isDev && url.startsWith('http://localhost')) return;
        event.preventDefault();
        shell.openExternal(url);
      }
    });
  }

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // -----------------------------------------------------------------------
  // IPC HANDLERS
  // -----------------------------------------------------------------------

  // BACKUP SYSTEM
  ipcMain.handle('save-backup', async (event, jsonStr) => {
    try {
      const docsPath = app.getPath('documents');
      const backupDir = path.join(docsPath, 'EFAPP', 'Backups');
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `efapp-backup-${timestamp}.json`;
      const filePath = path.join(backupDir, fileName);

      fs.writeFileSync(filePath, jsonStr, 'utf8');

      // Retention policy: Keep only last 30 backups
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('efapp-backup-') && f.endsWith('.json'))
        .map(f => ({ name: f, path: path.join(backupDir, f), time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 30) {
        const filesToDelete = files.slice(30);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.error('Failed to delete old backup', e);
          }
        });
      }

      return { success: true, path: filePath };
    } catch (error) {
      console.error('Backup save failed:', error);
      return { success: false, error: error.message };
    }
  });

  // NATIVE NOTIFICATIONS
  ipcMain.on('show-notification', (event, title, body) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });
}