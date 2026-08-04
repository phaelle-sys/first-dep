import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark, premium real-estate palette
        ink: {
          950: "#0a0b0f",
          900: "#0f1115",
          850: "#141721",
          800: "#181c27",
          700: "#212636",
          600: "#2b3145",
          500: "#3a4158",
        },
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8ecdff",
          400: "#59b0ff",
          500: "#3391ff",
          600: "#1b72f5",
          700: "#155ce1",
          800: "#184bb6",
          900: "#1a428f",
        },
        gold: {
          400: "#e8c877",
          500: "#d4af37",
          600: "#b8952b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)",
        glow: "0 0 0 1px rgba(51,145,255,0.25), 0 8px 30px rgba(51,145,255,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
