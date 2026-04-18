/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans:    ['"Inter Tight"', "system-ui", "sans-serif"],
        mono:    ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          950: "#0b0a08",
          900: "#15120e",
          800: "#1f1b15",
          700: "#2a241b",
          600: "#3a3226",
          500: "#4e4434",
        },
        amber: {
          50:  "#fdf9f0",
          100: "#fbf1d9",
          200: "#f6dfa5",
          300: "#eec56a",
          400: "#e5a93d",
          500: "#d48b1e",
          600: "#b26d14",
          700: "#8d5311",
          800: "#5f3a0c",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: "translateY(12px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
