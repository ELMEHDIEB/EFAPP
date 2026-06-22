# Changelog

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
