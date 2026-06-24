# AI DEVELOPMENT MEMORY
> Append-only. Never delete entries.

---

## 2026-06-24 — V1.1 Critical UX Fixes & Governance

### Decisions Made
- **Electron reintroduced** as desktop wrapper (user-approved architecture change).
- **localStorage authorized** for UI preferences only (sidebar collapse, theme). User data stays in IndexedDB/Dexie.
- **HashRouter** is mandatory for Electron `file://` compatibility. `BrowserRouter` removed.
- **No new `designTokens.js`** — existing one kept since 3 components depend on it.
- **No `usePersistedState` hook** — simple `useState(() => localStorage.getItem(...))` + `useEffect` pattern used instead.
- **Data Management route** fixed: was `/settings/data-management`, now `/data-management` (aligned with Sidebar link).

### Bugs Fixed
- **BUG-001**: Data Management navigation broken due to route mismatch (Sidebar → `/data-management`, App.jsx → `/settings/data-management`).
- **BUG-002**: Sidebar collapse state not persisted. Added `localStorage` persistence + floating expand button + Escape key handler.

### Files Modified
- `src/main.jsx` — BrowserRouter → HashRouter
- `src/App.jsx` — Fixed Data Management route, added NotFound catch-all route
- `src/components/Sidebar.jsx` — Full rewrite with persistence, floating button, ARIA, keyboard support
- `electron/main.js` — Added single-instance lock, external link interception
- `src/pages/NotFound.jsx` — NEW catch-all 404 page

### Constraints (non-negotiable, inherited from all phases)
- `applyCoinChange()` is the unique entry point for balance modifications.
- 100% local. No backend, no cloud, no API.
- All user data in IndexedDB/Dexie only.
- `localStorage` reserved for UI preferences.
