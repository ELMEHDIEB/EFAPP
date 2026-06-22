import Dexie from "dexie";

// -----------------------------------------------------------------------
// PERSISTENCE NOTE
// -----------------------------------------------------------------------
// This file opens (or creates, on first run) an IndexedDB database named
// "efootball_coin_manager" directly in the browser. IndexedDB is permanent
// local storage: everything written here stays on disk and is reloaded
// automatically every time the app starts. You never need to re-enter
// data — closing the tab, restarting the app, or refreshing the page does
// NOT erase anything. Data is only removed if the user explicitly deletes
// it in the app, or clears their browser's site data for this app.
// -----------------------------------------------------------------------

export const db = new Dexie("efootball_coin_manager");

db.version(1).stores({
  // ++id = auto-incrementing primary key
  accounts: "++id, name, groupTag",
  coinLogs: "++id, accountId, date, action",
  spinLogs: "++id, accountId, date",
  spinPlayers: "++id, spinId",
  regretLogs: "++id, spinId",
  emotionalLogs: "++id, accountId, date",
  notifications: "++id, date, read",
  settings: "key",
});

export default db;
