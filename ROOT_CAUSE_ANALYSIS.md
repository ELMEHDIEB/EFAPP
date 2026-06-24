# ROOT CAUSE ANALYSIS & BUG SWEEP
> Date: 2026-06-24

## 1. Sidebar Bugs
- **Collapse bug / Expand impossible**: *Fixed in V1.2*. The sidebar was stuck due to lost state. Fixed using a persistent `localStorage` toggle and a floating recovery button.
- **Mobile drawer recovery**: *Fixed in V1.2*. Escape key listener and backdrop click implemented.

## 2. Navigation Bugs
- **Data Management navigation**: *Fixed in V1.1*. Link in Sidebar updated from `/data` to `/data-management` to match `App.jsx`.

## 3. Analytics / BilanTracker Crashes
- **Empty Database Handling**: BilanTracker now guards against `accounts.length === 0`.
- **Leaderboard rendering issues**: React keys `key={index}` were replaced with stable `key={account.id}` preventing reconciliation errors.
