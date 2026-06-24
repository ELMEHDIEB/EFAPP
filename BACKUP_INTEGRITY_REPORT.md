# BACKUP INTEGRITY REPORT
> Date: 2026-06-24 | Phase: V1.3

## 1. Local Storage Architecture
- **Engine**: Dexie.js (IndexedDB wrapper)
- **Database Name**: `efootball_coin_manager`
- **Location**: Chromium User Data Directory (LevelDB)
- **Schema Version**: 3

## 2. Export / Import Mechanism
- **Export Method**: Full JSON serialization of all defined tables.
- **Import Method**: Full wipe and overwrite (`clear()` -> `bulkAdd()`) within a single transactional block `db.transaction('rw')`.
- **Integrity Check**: Pre-flight validation checks if the uploaded file is valid JSON and contains at least one recognized table array before triggering the wipe.

## 3. Desktop IPC Bridge Validation
- The backup engine seamlessly detects the Electron context (`window.electronAPI.saveBackup`).
- Generates the Blob, extracts JSON, and sends it via an IPC payload.
- Fallback to browser-native `<a>` download works flawlessly when in web mode.
- Storage writes synchronously to `Documents/EFAPP/Backups`.
- Automatic retention policy limits backups to the 30 most recent files.

## 4. Risks & Mitigations
- **Risk**: Database structure migration (e.g., adding v4 schema).
- **Mitigation**: The backup dumps JSON verbatim. On restore, it relies on Dexie's auto-upgrade paths if schemas are changed.
- **Risk**: Crash mid-restore.
- **Mitigation**: Uses a Dexie transaction block. If an error occurs, the transaction rolls back, preserving the previous data state.

**Status**: 🟢 EXCELLENT
The backup mechanism is robust, transactional, and securely integrated with the desktop file system.
