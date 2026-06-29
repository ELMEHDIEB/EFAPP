# UI/UX PRO MAX SKILL

## 1. Principles

- **Premium Aesthetics**: Aim for Linear, Vercel, Stripe, and Notion quality.
- **Glassmorphism & Minimalism**: Use subtle gradients, pure blacks, and dark greys. Avoid solid blocks of overwhelming colors. Use low opacity (10-20%) for hover states and active indicators.
- **Micro-interactions**: Subtle transitions (`duration-200 ease-out`), tight focus rings, and soft shadows.
- **Data Density**: High but breathable. Use typography (size and weight) to establish hierarchy, not heavy borders.
- **Zero Placeholders**: If data doesn't exist, show a beautifully designed empty state, not a zero or a dash.

## 2. Design System

- **Backgrounds**:
  - `ink`: `#000000` (Pure black for deep contrast)
  - `panel`: `#0A0A0A` (Elevated surfaces)
  - `panel2`: `#111111` (Higher surfaces, inputs, modals)
- **Borders**:
  - `border`: `#27272A` (Barely visible boundaries)
- **Accents**:
  - Primary: `#10b981` (Emerald 500)
  - Warning: `#f59e0b` (Amber 500)
  - Danger: `#ef4444` (Red 500)
- **Typography**:
  - Font: `Inter` (sans-serif)
  - Display: `text-3xl font-black tracking-tighter`
  - Body: `text-sm text-textdim`
  - Caption: `text-[10px] uppercase tracking-widest`

## 3. Empty States & Loading

Every screen must have an elegantly designed empty state that serves as an onboarding guide.

- Use `lucide-react` or SVG icons scaled up with low opacity for visual interest.
- Provide a clear Call to Action (CTA) button.

## 4. Dashboards & Cards

- Use `.pro-card` for a standardized minimal look.
- Use `.pro-heading` for consistent section titles.
- Hide scrollbars where possible.
- Use flex and grid for perfect alignment.
