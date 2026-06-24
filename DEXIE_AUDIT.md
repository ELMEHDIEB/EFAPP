# DEXIE AUDIT
> Generated: 2026-06-24 | Phase: V1.1

---

## useLiveQuery Usage Summary

| Page/Component | Queries | Tables Queried |
|----------------|---------|----------------|
| App.jsx | 1 | settings |
| Dashboard.jsx | 3 | accounts, coinLogs, settings |
| Analytics.jsx | 2 | accounts, coinLogs |
| BilanTracker.jsx | 2 | accounts, coinLogs |
| DataManagement.jsx | 5 | accounts, coinLogs, spinLogs, auditLogs, settings |
| Settings.jsx | 4 | settings, accounts, coinLogs, auditLogs |
| SpinTracker.jsx | 2 | accounts, spinLogs |
| Leaderboard.jsx | 1 | accounts |
| Achievements.jsx | 2 | accounts, coinLogs |
| ActivityTimeline.jsx | 4 | accounts, coinLogs, spinLogs, auditLogs |
| Accounts.jsx | 2 | accounts, coinLogs |
| PostLossRecovery.jsx | 2 | accounts, coinLogs |
| EmotionalJournal.jsx | 1 | spinLogs |
| CommandCenter.jsx | 1 | accounts |
| BulkBilanImport.jsx | 1 | accounts |
| AccountHistory.jsx | 1 | coinLogs (filtered) |

**Total: 34 useLiveQuery calls across 16 files**

---

## Duplication Analysis

| Query Pattern | Occurrences | Risk |
|---------------|-------------|------|
| `db.accounts.toArray()` | 12 | 🟢 LOW — Dexie caches internally. Each is in a separate component so cannot be easily shared without a context provider. |
| `db.coinLogs.toArray()` | 8 | 🟢 LOW — Same reasoning. |
| `db.settings.toArray()` | 3 | 🟢 LOW |
| `db.spinLogs.toArray()` | 3 | 🟢 LOW |
| `db.auditLogs.toArray()` | 3 | 🟢 LOW |

---

## Performance Concerns

| Issue | Severity | Detail |
|-------|----------|--------|
| **DataManagement loads ALL tables** | 🟡 MEDIUM | 5 `useLiveQuery` calls on mount. Acceptable for a settings/admin page that is rarely visited. |
| **ActivityTimeline loads 4 tables** | 🟡 MEDIUM | Combined timeline needs all event sources. Could benefit from pagination for large datasets. |
| **No pagination on any table** | 🟡 MEDIUM | All queries use `.toArray()` — loads entire table into memory. Fine for < 10k records, may degrade beyond that. |
| **Dashboard computes KPIs in render** | 🟡 MEDIUM | No `useMemo` wrapping — recalculates on every render. Should wrap in `useMemo` with `[accounts, coinLogs]` deps. |

---

## Recommendations

1. **No immediate action required** — current data volume is small (personal app, typically < 100 accounts).
2. **Future: add `useMemo` to Dashboard KPI computations** (performance polish, not a bug).
3. **Future: add pagination to ActivityTimeline** if user reports lag with large history.
4. **No duplicate DB reads within a single component** — all duplications are cross-component, which is the correct Dexie pattern.
