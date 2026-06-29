/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Legacy colors (kept for existing components during transition)
        ink: "#000000",       
        panel: "#0A0A0A",     
        panel2: "#111111",    
        
        // Premium SaaS Dark Mode Surfaces (Linear/Vercel style)
        background: "#000000",          // Deepest level (Page background)
        surface: "#0A0A0A",             // Base level (Cards, panels)
        surfaceElevated: "#141414",     // Elevated level (Modals, popovers, active states)
        surfaceInteractive: "#1F1F1F",  // Interactive level (Hover states, pressed buttons)
        border: "#27272A",              // Zinc 800

        // Semantic Colors
        primary: "#FAFAFA",   // For Shadcn components
        accent: "#10b981",    // Emerald 500
        accent2: "#059669",   // Emerald 600
        warn: "#f59e0b",      // Amber 500
        danger: "#ef4444",    // Red 500
        success: "#10B981",   // Emerald 500
        textdim: "#A1A1AA",   // Zinc 400
        textmuted: "#52525B", // Zinc 600
        white: "#FAFAFA",     // Zinc 50
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        'glow': '0 0 15px var(--tw-shadow-color)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
    },
  },
  plugins: [],
};
