// EFAPP V5 Design Tokens
// Centralized configuration for UI consistency

export const tokens = {
  typography: {
    h1: "text-3xl font-black tracking-tight",
    h2: "text-xl font-bold tracking-tight",
    h3: "text-sm font-bold uppercase tracking-widest",
    body: "text-sm font-medium",
    caption: "text-xs font-medium",
  },
  spacing: {
    xs: "gap-2 p-2",
    sm: "gap-4 p-4",
    md: "gap-6 p-6",
    lg: "gap-8 p-8",
    xl: "gap-12 p-12",
  },
  radius: {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-xl",
    full: "rounded-full",
  },
  shadows: {
    glow: "shadow-[0_0_15px_rgba(255,255,255,0.05)]",
    card: "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3),_0_2px_4px_-1px_rgba(0,0,0,0.2)]",
  },
  surfaces: {
    background: "bg-background",
    surface: "bg-surface",
    surfaceElevated: "bg-surfaceElevated",
    surfaceInteractive: "bg-surfaceInteractive",
  },
  animations: {
    fast: "transition-all duration-150 ease-out",
    normal: "transition-all duration-200 ease-out",
    slow: "transition-all duration-300 ease-out",
  }
};
