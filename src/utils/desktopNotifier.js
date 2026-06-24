/**
 * Helper to trigger native desktop notifications when running in Electron.
 * Fails silently if running in a standard web browser.
 * 
 * @param {string} title - The notification title
 * @param {string} body - The notification body
 */
export function triggerDesktopNotification(title, body) {
  if (window.electronAPI && window.electronAPI.showNotification) {
    window.electronAPI.showNotification(title, body);
  }
}
