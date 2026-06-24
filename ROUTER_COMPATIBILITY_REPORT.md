# ROUTER COMPATIBILITY REPORT

## Current Implementation Audit
- The web app relies on `react-router-dom` using `BrowserRouter` inside `src/main.jsx`.
- Vite uses `base: './'` which allows `index.html` to load its initial JS/CSS from relative paths in Electron.

## Mechanism of Failure
`BrowserRouter` utilizes the HTML5 History API (`window.history.pushState`). When the user navigates from the dashboard to `/accounts`, the URL in the Chromium instance changes to `file:///C:/.../release/win-unpacked/resources/app/dist/accounts`.

As long as the application remains active, React intercepts these navigation events. **However**, if the application is refreshed (Ctrl+R/F5) or restarted restoring the last URL, Electron attempts to load the actual file path `/dist/accounts` from the OS file system. Since this file does not exist (only `index.html` exists), Electron crashes with a white screen or a "File Not Found" error.

## Validation Decision
**Migration to HashRouter is strictly required.**
`HashRouter` modifies the URL to `file:///C:/.../dist/index.html#/accounts`. A refresh correctly re-loads `index.html` from the file system, and React parses the `#` fragment to mount the correct UI component. This provides 100% stability without requiring a custom protocol interceptor in the main process.
