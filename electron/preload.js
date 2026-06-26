import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body),
  saveBackup: async (jsonStr) => {
    // Basic mock implementation for the backup feature.
    // In a full app, this would trigger a dialog.showSaveDialog in main.js
    return { success: false, error: 'Desktop save not fully implemented, falling back to browser' };
  }
});
