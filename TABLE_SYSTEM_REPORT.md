# TABLE SYSTEM REPORT
> Date: 2026-06-24

## Current Implementations
- **BilanTracker.jsx**: Uses standard HTML `<table>` with manual map logic. Lacks sorting.
- **Leaderboard.jsx**: Custom grid/flex layouts simulating tables.
- **Analytics.jsx**: Simple list maps simulating tables.

## Reconstruction Requirements (Phase 5)
A new unified `<DataTable />` component must be built to replace all ad-hoc tables.
- **Architecture**: It must accept `columns` and `data` props.
- **Features**: 
  - Sticky Headers for long scrolls.
  - Sorting logic built-in.
  - Responsive collapse: On mobile, rows should transform into cards (Stripe pattern).
  - Empty state and Loading state handling out of the box.
