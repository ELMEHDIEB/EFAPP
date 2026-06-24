# UI COMPONENT INVENTORY
> Date: 2026-06-24 | Phase 0

## src/components/
- **AccountHistory.jsx**: Used. Vital for history.
- **BulkBilanImport.jsx**: Used.
- **CommandCenter.jsx**: Used.
- **ErrorBoundary.jsx**: Used. Vital for app stability.
- **ExportCenter.jsx**: Used.
- **GoalRadar.jsx**: Used.
- **MilestoneTimeline.jsx**: Used.
- **Preview.jsx**: Unused/Replaceable. Candidate for deletion.
- **Sidebar.jsx**: Used. Core navigation.

## src/components/ui/
- **CommandPalette.jsx**: Used.
- **ConfirmContext.jsx**: Used.
- **DataTable.jsx**: **Exists**. Do not recreate. (Will be used in Phase 5 to replace raw tables).
- **EmptyState.jsx**: **Exists**. Do not recreate. (Will be used to unify empty states).
- **HeroHeader.jsx**: **Exists**. Do not recreate. (Will be used to unify page headers).
- **InfoCard.jsx / MetricCard.jsx / StatusCard.jsx**: Replaceable/Duplicate candidates. Should be unified into `StatCard.jsx`.
- **ToastContext.jsx**: Used.
- **typewriter.jsx**: Decorative. Candidate for deletion if it clashes with unified UX.

## Conclusion
Core generic UI primitives (`HeroHeader`, `EmptyState`, `DataTable`) have already been created in previous sessions. We will *not* recreate them, but rather enforce their usage across all pages during Phase 4 and 5.
