import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron,
  saveBackup: (jsonStr) => ipcRenderer.invoke('save-backup', jsonStr),
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body),
});