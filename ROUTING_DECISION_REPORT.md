# ROUTING DECISION REPORT

## Analysis of Current Routing System
The current system in `src/main.jsx` utilizes `BrowserRouter` from `react-router-dom`.

## Electron Compatibility Context
In a standard web environment, `BrowserRouter` uses the HTML5 History API to manipulate the URL (e.g., `http://localhost/accounts`). The web server is configured to catch all routes and return `index.html`.

In Electron production, the application is loaded via the file system: `file:///C:/.../dist/index.html`. 
When navigating to `/accounts`, `BrowserRouter` attempts to change the URL to `file:///C:/.../dist/accounts`. 

**The breaking condition:** If the user refreshes the page (Ctrl+R), Electron attempts to load the file named `accounts` on the disk, which does not exist, resulting in a blank screen or a "File Not Found" error.

## Decision
**MIGRATE TO HASHROUTER.**

To ensure 100% stability in the Electron desktop environment without needing a custom protocol handler, we must migrate to `HashRouter`. 
This changes URLs to `file:///C:/.../dist/index.html#/accounts`. A refresh will correctly reload `index.html` and React Router will parse the hash to mount the correct component.

**Action Required:** Modify `src/main.jsx` to replace `BrowserRouter` with `HashRouter`.
