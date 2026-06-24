# AUDIT BEFORE IMPLEMENTATION
> Generated: 2026-06-24 | Phase: V1.1 Critical UX Fixes

---

## 1. Route Inconsistencies

| Issue | Severity | File(s) | Detail |
|-------|----------|---------|--------|
| **Data Management route mismatch** | 🔴 CRITICAL | `Sidebar.jsx:35`, `App.jsx:106` | Sidebar link `to="/data-management"` but route is `path="/settings/data-management"` — navigation silently fails (blank page, no error). |
| **No catch-all route** | 🟡 MEDIUM | `App.jsx` | No `<Route path="*" />` — invalid URLs render empty `<main>`. |
| **BrowserRouter incompatible with Electron** | 🔴 CRITICAL | `main.jsx:3,9` | Uses `BrowserRouter`; Electron `file://` protocol breaks on refresh/deep-link. Must switch to `HashRouter`. |

---

## 2. Dead / Orphan Code

| File | Status | Verdict | Detail |
|------|--------|---------|--------|
| `src/{pages,components}/` | Empty directory | **Safe To Delete** | Literal bash glob was created as a directory name — contains nothing. |
| `src/components/ui/typewriter.jsx` | Orphan | **Needs Review** | Only imported by `Preview.jsx`, which is itself only imported by `CommandCenter.jsx` and `BulkBilanImport.jsx`. Verify if Preview is still used in those components. |

---

## 3. Duplicated Logic

| Pattern | Files | Detail |
|---------|-------|--------|
| `useLiveQuery(() => db.accounts.toArray(), [])` | 12 files | Every page independently queries all accounts. Not a bug, but a performance note — Dexie handles caching internally, so no immediate action needed. |
| `useLiveQuery(() => db.coinLogs.toArray(), [])` | 8 files | Same pattern. Acceptable with Dexie's live-query model. |

---

## 4. Unused Imports (Vite tree-shakes, but code hygiene)

| File | Import | Status |
|------|--------|--------|
| `electron/main.js:3` | `import { format } from 'url'` — **not present in current file** | N/A (already clean) |

---

## 5. Electron Incompatibilities

| Issue | Severity | Detail |
|-------|----------|--------|
| **BrowserRouter** | 🔴 CRITICAL | Will not work with `file://` protocol in production build. |
| **preload.js uses ESM import** | 🟡 MEDIUM | `import { contextBridge } from 'electron'` — Electron preload scripts historically require CJS. However, with `"type": "module"` in package.json and Electron ≥28 this works, but `electron-builder` bundling may fail. Needs verification at build time. |
| **Google Fonts CDN import** | 🟡 MEDIUM | `index.css:1` loads fonts from `fonts.googleapis.com`. Works in dev, may fail offline in packaged app. Consider bundling fonts locally. |
| **No single-instance lock** | 🟢 LOW | Multiple app instances can open simultaneously, risking IndexedDB corruption. |

---

## 6. React Anti-Patterns & Render Loop Risks

### Priority Pages Audit

| Page | `useEffect` deps | `setState` in render | `useMemo` safety | Verdict |
|------|-------------------|---------------------|------------------|---------|
| **Analytics.jsx** | `[accounts]` — ✅ correct, uses cancellation flag | No | ✅ `useMemo` returns all computed data with proper deps `[accounts, coinLogs]` | ✅ Safe |
| **BilanTracker.jsx** | Needs check — `disciplineData` is set via `useEffect` | No setState in render | Uses `useState` for `disciplineData` | ✅ Safe (fixed in V5.4) |
| **Dashboard.jsx** | No `useEffect` for data — all derived synchronously from `useLiveQuery` | Inline computations in render body (lines 43-50+), not setState | No `useMemo` wrapping heavy computations | 🟡 Performance — heavy computations run on every render |
| **Leaderboard.jsx** | No `useEffect` | No | Uses defensive `?? []` | ✅ Safe |
| **Settings.jsx** | `[settings, accounts, coinLogs, auditLogs]` — ✅ proper deps | No setState in render | N/A | ✅ Safe |

### Known Fixed Bugs (V5.4)
- `goalDistData is not defined` → Fixed: now inside `useMemo` return.
- `disciplineData is not defined` → Fixed: declared as `useState`.
- `Too many re-renders` → Was caused by IIFEs calling setState in render. Fixed in V5.4.

---

## 7. localStorage Synchronization Issues

| Issue | Severity | Detail |
|-------|----------|--------|
| **Sidebar collapse not persisted** | 🟡 MEDIUM | `useState(false)` in `Sidebar.jsx:41` — loses state on refresh. Must add `localStorage` persistence per approved plan. |
| **No other localStorage usage** | ✅ | All user data correctly uses Dexie/IndexedDB. |

---

## 8. designTokens.js Dependency

| Issue | Severity | Detail |
|-------|----------|--------|
| `designTokens.js` is imported by 3 files | 🟢 INFO | `Sidebar.jsx`, `HeroHeader.jsx`, `EmptyState.jsx`. User explicitly said **do not create a new designTokens.js**, but one already exists. These imports must remain functional. The file is kept as-is — it provides Tailwind class-name constants, not a parallel design system. |

---

## Summary

| Category | 🔴 Critical | 🟡 Medium | 🟢 Low/Info |
|----------|-------------|-----------|-------------|
| Routing | 2 | 1 | 0 |
| Dead Code | 0 | 0 | 2 |
| Electron | 1 | 2 | 1 |
| React Patterns | 0 | 1 | 0 |
| localStorage | 0 | 1 | 0 |
| **Total** | **3** | **5** | **3** |
