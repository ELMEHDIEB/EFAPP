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

import Dexie, { Table } from "dexie";
import { Account, CoinLog, SpinLog, Player, AuditLog, Setting } from "./types/models.ts";

export class MyDatabase extends Dexie {
  accounts!: Table<Account, number>;
  coinLogs!: Table<CoinLog, number>;
  spinLogs!: Table<SpinLog, number>;
  players!: Table<Player, number>;
  auditLogs!: Table<AuditLog, number>;
  settings!: Table<Setting, string>;

  constructor() {
    super("efootball_coin_manager");
    
    this.version(1).stores({
      accounts: "++id, name, groupTag",
      coinLogs: "++id, accountId, date, action",
      spinLogs: "++id, accountId, date",
      spinPlayers: "++id, spinId",
      regretLogs: "++id, spinId",
      emotionalLogs: "++id, accountId, date",
      notifications: "++id, date, read",
      settings: "key",
    });

    this.version(2).stores({
      auditLogs: "++id, date, actionType, details"
    });

    this.version(3).stores({
      players: "++id, name, cardType, isBooster, overall, position, club, nation, efhubId",
      spinPlayers: "++id, spinId, playerId"
    });

    this.version(4).stores({
      players: "++id, accountId, name, cardType, isBooster, overall, position, club, nation, efhubId"
    });
  }
}

export const db = new MyDatabase();
export default db;
