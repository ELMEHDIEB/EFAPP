/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09090b",       // Zinc 950 App background
        panel: "#18181b",     // Zinc 900 Card background
        panel2: "#27272a",    // Zinc 800 Elevated surfaces
        border: "#3f3f46",    // Zinc 700 Subtle borders
        accent: "#10b981",    // Emerald 500
        accent2: "#059669",   // Emerald 600
        warn: "#f59e0b",      // Amber 500
        danger: "#ef4444",    // Red 500
        textdim: "#a1a1aa",   // Zinc 400
        white: "#fafafa",     // Zinc 50
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
