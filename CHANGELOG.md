# Changelog

## 2026-06-24 — V1.1 Critical UX Fixes & Governance

### Fixed
* **BUG-001**: Data Management navigation broken — route mismatch fixed (`/settings/data-management` → `/data-management`).
* **BUG-002**: Sidebar collapse state not persisted — added `localStorage` persistence, floating expand button, Escape key handler.

### Added
* **HashRouter migration** — `BrowserRouter` replaced with `HashRouter` for Electron `file://` compatibility.
* **NotFound page** — catch-all `*` route with 404 UI and navigation buttons.
* **Sidebar floating expand button** — visible when collapsed, animated, keyboard-accessible.
* **Mobile drawer Escape key** — press Escape to close the navigation drawer.
* **Electron single-instance lock** — prevents multiple app windows and IndexedDB corruption.
* **Electron external link interception** — http(s) links open in default browser.
* **Keyboard accessibility** — ARIA labels, `tabIndex`, `role` attributes across sidebar.

### Documentation
* `AUDIT_BEFORE_IMPLEMENTATION.md` — Full source-tree audit.
* `ROOT_CAUSE_ANALYSIS.md` — Root cause for each bug fixed.
* `DEXIE_AUDIT.md` — Dexie/IndexedDB performance audit.
* `DESKTOP_READINESS_REPORT.md` — Electron readiness scoring.
* `CLEANUP_REPORT.md` — Orphan/unused code detection.
* `PROJECT_HEALTH.md` — Project health dashboard.
* `NAVIGATION_AUDIT.md` — Full route verification.
* `SIDEBAR_RECOVERY_PROTOCOL.md` — Sidebar state documentation.
* `ELECTRON_AUDIT.md` — Electron-specific audit.
* `AI_DEVELOPMENT_MEMORY.md` — Development memory initialized.

## 2026-06-22

### Implemented
* **Phase 3 - Advanced Behavioral Friction:**
  * Implemented Local PIN Lock mechanism (`settings.pinLock`).
  * Added optional Weekly Spend Limit configuration for accounts.
  * Integrated "Mode Urgence" (Emergency Mode) into SpinTracker with a 5-minute static cooldown for high-risk actions.
  * Added Anti-FOMO messaging during the cooldown period.
  * Created `PostLossRecovery` module to intercept users after severe coin losses (≥900 coins, satisfaction ≤4).
  * Implemented Pending Regret tracking on the Dashboard.

* **Phase 2 - Spin Tracker & Initial Mental Coach:**
  * Created atomic `createSpin` transaction linking `spinLogs`, `spinPlayers`, and `coinLogs`.
  * Built 4-Step Spin Wizard.
  * Added "Protection 900" evaluation.
  * Added Impulsivity Classification system.
  * Refactored Dashboard to prioritize behavioral metrics (Série, Coins préservés).

* **Phase 1 - Skeleton:**
  * Initial application routing and layout (TailwindCSS).
  * IndexedDB persistence setup (Dexie.js).
  * Account creation and modification.
  * JSON Backup Import/Export functionality.

### Initial GitHub Repository Setup
* Created Git repository and connected to GitHub.
