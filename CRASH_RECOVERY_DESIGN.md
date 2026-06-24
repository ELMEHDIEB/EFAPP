# CRASH RECOVERY DESIGN

## Crash Vectors Analyzed
1. **Renderer Process Crash (OOM, Native Crash):** 
   - *Detection:* `mainWindow.webContents.on('render-process-gone', (e, details) => {...})`
   - *Recovery:* We cannot trigger `createBackup()` because the renderer is dead. We must rely on the last successful interval/startup backup. We will log the crash in `CrashLogs` and present a recovery dialog to the user allowing them to restart the app.
2. **Main Process Uncaught Exceptions:**
   - *Detection:* `process.on('uncaughtException', ...)`
   - *Recovery:* Log the error to `Documents/EFAPP/CrashLogs`. If the error is fatal, attempt a graceful shutdown by asking the renderer to backup data before quitting (if renderer is still alive).
3. **Main Process Unhandled Rejections:**
   - *Detection:* `process.on('unhandledRejection', ...)`
   - *Recovery:* Log and monitor. Typically non-fatal, but logged for diagnostic purposes.

## Implementation Details
The `CrashRecoveryEngine.js` will wrap the application lifecycle. Upon detecting a crash, it will write a `crash_report_[timestamp].json` file containing the stack trace, memory state, and Electron version. On the subsequent successful launch, if a new crash file exists, a native Windows Notification will alert the user.
