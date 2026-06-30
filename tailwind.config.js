/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "375px",
        /** Matches Flutter `ResponsiveLayout.adminPersistentSidebar` (900px). */
        sidebar: "900px",
      },
      spacing: {
        safe: "env(safe-area-inset-bottom, 0px)",
        "safe-top": "env(safe-area-inset-top, 0px)",
      },
      colors: {
        cream: "rgb(255 251 235 / <alpha-value>)",
        foam: "rgb(254 249 195 / <alpha-value>)",
        crema: "rgb(187 247 208 / <alpha-value>)",
        yellow: {
          DEFAULT: "rgb(250 204 21 / <alpha-value>)",
          deep: "rgb(234 179 8 / <alpha-value>)",
          light: "rgb(254 249 195 / <alpha-value>)",
        },
        emerald: {
          DEFAULT: "rgb(5 150 105 / <alpha-value>)",
          deep: "rgb(6 95 70 / <alpha-value>)",
          bar: "rgb(6 78 59 / <alpha-value>)",
          light: "rgb(236 253 245 / <alpha-value>)",
        },
        /** Legacy token names → yellow/emerald (keeps existing class names working). */
        orange: {
          DEFAULT: "rgb(250 204 21 / <alpha-value>)",
          deep: "rgb(234 179 8 / <alpha-value>)",
        },
        brown: {
          DEFAULT: "rgb(6 95 70 / <alpha-value>)",
          deep: "rgb(6 95 70 / <alpha-value>)",
          bar: "rgb(6 78 59 / <alpha-value>)",
        },
        muted: "#6B9080",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Lato"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        hero: "1.75rem",
        card: "1.125rem",
      },
      boxShadow: {
        pill: "0 14px 38px rgba(6, 78, 59, 0.38)",
        card: "0 8px 28px rgba(6, 95, 70, 0.12)",
      },
      maxWidth: {
        content: "32rem",
        customer: "42rem",
        customerWide: "48rem",
        guest: "72rem",
        site: "80rem",
        admin: "75rem",
      },
    },
  },
  plugins: [],
  safelist: ["max-w-site"],
};
