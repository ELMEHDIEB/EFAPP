# ELECTRON SECURITY AUDIT

## 1. Context Isolation
**Status: SECURE.**
`contextIsolation: true` is explicitly enabled in `main.js`. This guarantees that the `preload.js` script and the web renderer execute in separate JavaScript contexts, preventing prototype pollution attacks and direct global object manipulation.

## 2. Node Integration
**Status: SECURE.**
`nodeIntegration: false` is explicitly set. The React application has zero access to Node.js APIs (`fs`, `child_process`), ensuring that RCE (Remote Code Execution) vulnerabilities via XSS are mitigated.

## 3. IPC Exposure (Preload)
**Status: REQUIRES REFACTORING.**
The current preload script exposes `platform` and `version`.
For the new features, the IPC bridge must be strictly defined. We will use `contextBridge.exposeInMainWorld('electronAPI', { ... })` exposing ONLY specific functions (`triggerBackup`, `saveBackup`, `sendNotification`, `getDiagnostics`). We will NOT expose the generic `ipcRenderer.send` or `ipcRenderer.invoke`, as that is an anti-pattern.

## 4. File System Access
**Status: SECURE.**
React has no direct access. All file operations (Backups, Crash Logs) happen exclusively in the Main Process (`DesktopBackupEngine.js`).

## 5. External Link Handling
**Status: VULNERABLE (Pending Fix).**
Currently, `window.open` or `<a target="_blank">` would open inside the Chromium instance, potentially loading untrusted web content with app-level privileges. 
*Fix in Implementation:* We will add `webContents.setWindowOpenHandler` in `main.js` to intercept all `new-window` requests and route them to `shell.openExternal()`.
