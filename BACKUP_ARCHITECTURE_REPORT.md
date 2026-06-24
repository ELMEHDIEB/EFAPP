# BACKUP ARCHITECTURE REPORT

## IndexedDB Limitations in Electron
EFAPP utilizes `Dexie.js` for IndexedDB operations. In Electron, IndexedDB is handled by the underlying Chromium engine and stored in the `app.getPath('userData')` directory (typically `AppData/Roaming/com.elmehdi.efapp/IndexedDB`) using LevelDB format.

The Electron Main Process (Node.js) **cannot** natively query IndexedDB, nor is it safe to copy the LevelDB files directly while the renderer is active, as this leads to corruption.

## Approved Backup Workflow
To avoid creating fake backups, we must utilize the **existing EFAPP export system** (`src/utils/backupActions.js`) via a secure IPC bridge.

1. **Trigger (Main Process):** The Main Process (`DesktopBackupEngine`) determines a backup is needed (e.g., startup, shutdown, interval). It sends a `trigger-backup` IPC message to the Renderer.
2. **Dump (Renderer Process):** The Renderer listens for this event, executes the existing `createBackup()` function, and generates the full JSON state.
3. **Transmission (IPC):** The Renderer sends the generated JSON string back to the Main process via `window.electronAPI.saveBackup(jsonString)`.
4. **Storage (Node.js):** The Main Process receives the string and writes it to `Documents/EFAPP/Backups/` using `fs.writeFile`, maintaining the 30-file retention policy.

This ensures 100% data integrity and reuses existing proven logic.
