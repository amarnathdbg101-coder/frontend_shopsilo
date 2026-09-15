/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4f46e5",
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        background: {
          light: "#f8fafc",
          dark: "#090d16",
        },
        surface: {
          light: "#ffffff",
          dark: "#131b2e",
        },
        muted: {
          light: "#64748b",
          dark: "#94a3b8",
        },
      },
    },
  },
  plugins: [],
};
