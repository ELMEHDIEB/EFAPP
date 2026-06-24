# SIDEBAR RECOVERY PROTOCOL
> Version: 1.0 | Created: 2026-06-24

---

## Purpose
Prevent sidebar collapse/expand bugs from recurring in future versions by documenting all
state vectors, their persistence mechanisms, and recovery paths.

---

## State Vectors

| State | Type | Storage | Default | Scope |
|-------|------|---------|---------|-------|
| `isCollapsed` | `boolean` | `localStorage("sidebarCollapsed")` | `false` | Desktop only (hidden on mobile) |
| `isMobileOpen` | `boolean` | In-memory (React state) | `false` | Mobile only (`md:hidden`) |

---

## Persistence Rules

1. **`isCollapsed`** is persisted to `localStorage` after every change via `useEffect`.
2. **`isMobileOpen`** is NOT persisted — always starts closed on page load (intentional).
3. **`localStorage` is reserved for UI preferences only** — no user data (accounts, coins, logs).

---

## Recovery Mechanisms

### Desktop (≥768px)

| Scenario | Recovery Path |
|----------|---------------|
| Sidebar collapsed, toggle button hard to reach | **Floating expand button** (fixed bottom-left, z-60) always visible when collapsed |
| Sidebar collapsed, user refreshes page | `localStorage` restores `isCollapsed=true`; floating button available |
| Sidebar expanded, user refreshes page | `localStorage` restores `isCollapsed=false`; normal sidebar visible |

### Mobile (<768px)

| Scenario | Recovery Path |
|----------|---------------|
| Drawer closed, hamburger button visible | Click hamburger button (fixed top-left, z-50) |
| Drawer open, user presses Escape | `handleEscape` listener sets `isMobileOpen=false` |
| Drawer open, user clicks backdrop | Backdrop `onClick` sets `isMobileOpen=false` |
| Drawer open, user clicks a NavLink | `onClick` handler sets `isMobileOpen=false` |

---

## Keyboard Accessibility

| Key | Action | Context |
|-----|--------|---------|
| `Tab` | Focus next interactive element | All sidebar elements are tabbable |
| `Enter` / `Space` | Activate focused element | Command palette button, collapse toggle |
| `Escape` | Close mobile drawer | Mobile drawer open |

---

## Anti-Regression Checklist

Before releasing any sidebar change, verify:

- [ ] Collapse → Expand works ∞ times without dead state
- [ ] Refresh preserves collapsed state
- [ ] Floating button appears when collapsed (desktop)
- [ ] Floating button disappears when expanded
- [ ] Hamburger button always visible on mobile
- [ ] Escape closes mobile drawer
- [ ] Backdrop click closes mobile drawer
- [ ] NavLink click closes mobile drawer
- [ ] All interactive elements are keyboard-accessible
- [ ] `aria-label` present on all buttons
- [ ] `role="navigation"` on all `<nav>` elements
