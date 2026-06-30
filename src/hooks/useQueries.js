import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

/**
 * Custom hooks for data fetching (Repository Pattern)
 * This centralizes all Dexie queries, decoupling the UI from the database implementation.
 */

export function useAccounts(orderBy = "id") {
  return useLiveQuery(() => {
    let query = db.accounts;
    if (orderBy === "name") return query.orderBy("name").toArray();
    return query.toArray();
  }, [orderBy]);
}

export function useAccountsCount() {
  return useLiveQuery(() => db.accounts.count(), []) || 0;
}

export function useCoinLogs(limit = null, reverse = false) {
  return useLiveQuery(() => {
    let query = db.coinLogs;
    if (reverse) query = query.reverse();
    if (limit) query = query.limit(limit);
    return query.toArray();
  }, [limit, reverse]);
}

export function useCoinLogsCount() {
  return useLiveQuery(() => db.coinLogs.count(), []) || 0;
}

export function useSpinLogs(limit = null, reverse = false) {
  return useLiveQuery(() => {
    let query = db.spinLogs;
    if (reverse) query = query.reverse();
    if (limit) query = query.limit(limit);
    return query.toArray();
  }, [limit, reverse]);
}

export function useSpinLogsCount() {
  return useLiveQuery(() => db.spinLogs.count(), []) || 0;
}

export function usePlayers(orderBy = "id") {
  return useLiveQuery(() => {
    let query = db.players;
    if (orderBy === "name") return query.orderBy("name").toArray();
    return query.toArray();
  }, [orderBy]);
}

export function useSettings() {
  return useLiveQuery(() => db.settings.toArray(), []) || [];
}

export function useAuditLogs(limit = null, reverse = false) {
  return useLiveQuery(() => {
    // If order by id and reverse: db.auditLogs.orderBy('id').reverse()
    let query = db.auditLogs.orderBy('id');
    if (reverse) query = query.reverse();
    if (limit) query = query.limit(limit);
    return query.toArray();
  }, [limit, reverse]) || [];
}

export function useAuditLogsCount() {
  return useLiveQuery(() => db.auditLogs.count(), []) || 0;
}

// Special custom queries needed by specific components

export function useTodaysCheckins(dateString) {
  return useLiveQuery(() => db.coinLogs.where("date").equals(dateString).and(l => l.action === "daily_checkin").toArray(), [dateString]);
}

export function useFirstSpinLog() {
  return useLiveQuery(() => db.spinLogs.orderBy("id").first(), []);
}

export function useLastSpinLog() {
  return useLiveQuery(() => db.spinLogs.orderBy("id").reverse().first(), []);
}

export function useFirstCoinLog() {
  return useLiveQuery(() => db.coinLogs.orderBy("id").first(), []);
}

export function useLastCoinLog() {
  return useLiveQuery(() => db.coinLogs.orderBy("id").reverse().first(), []);
}
