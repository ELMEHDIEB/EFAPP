# UI RECONSTRUCTION AUDIT
> Date: 2026-06-24

## 1. Visual Regressions & Inconsistencies
- **Typography**: The app lacks a unified typography scale. Headers are mixed between `text-xl`, `text-2xl`, and raw inline styles.
- **Spacing**: Margins and paddings are completely ad-hoc (`mb-4`, `my-6`, `p-5`). Needs a standardized token system.
- **Color Inconsistencies**: Backgrounds switch between `bg-ink`, `bg-background`, `bg-[#1a1a2e]` arbitrarily.

## 2. Component Audits
- **Dashboard**: Overcrowded. Action buttons are misaligned on mobile.
- **DataTable**: Table implementations are duplicated across Analytics, Leaderboard, and BilanTracker. They lack sticky headers and have inconsistent row heights.
- **HeroHeader**: Paddings are inconsistent. Subtitles are sometimes `text-textdim`, sometimes `text-textmuted`.

## Severity List
- **Critical**: Duplicate table implementations causing diverging UX.
- **High**: Lack of a unified typography/spacing scale causing layout shifts.
- **Medium**: Mobile overflow on SpinTracker charts.
