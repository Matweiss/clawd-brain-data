import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Ink-black background stack
        ink: {
          950: "#08080a",
          900: "#0a0a0c",
          800: "#101013",
          700: "#16161a",
          600: "#1d1d22",
          500: "#26262c",
        },
        // Bone-warm text stack
        bone: {
          50: "#f7f3ec",
          100: "#ece6da",
          200: "#cfc7b6",
          300: "#9c9486",
          400: "#6b6457",
          500: "#4a4438",
        },
        // Single warm accent — used sparingly for live/active state
        ember: {
          400: "#f5b35c",
          500: "#e69838",
          600: "#c87d20",
        },
        // Status semantics
        status: {
          open: "#7fb069",
          progress: "#f5b35c",
          blocked: "#d96b5e",
          done: "#6b6457",
        },
      },
      fontFamily: {
        // Display: editorial sharp serif
        display: ['"Instrument Serif"', "Georgia", "serif"],
        // Body: refined geometric sans
        sans: ["Geist", "system-ui", "sans-serif"],
        // Mono: IDs, timestamps, codes
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        // Tight display tracking, generous tracking on caps labels
        tightest: "-0.04em",
        capwide: "0.18em",
      },
      keyframes: {
        "row-arrive": {
          "0%": {
            opacity: "0",
            transform: "translateY(6px)",
            backgroundColor: "rgba(245, 179, 92, 0.08)",
          },
          "60%": {
            opacity: "1",
            transform: "translateY(0)",
            backgroundColor: "rgba(245, 179, 92, 0.06)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
            backgroundColor: "rgba(245, 179, 92, 0)",
          },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "row-arrive": "row-arrive 1400ms ease-out",
        "pulse-soft": "pulse-soft 2200ms ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
