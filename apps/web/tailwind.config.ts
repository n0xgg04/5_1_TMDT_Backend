import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edfdf9",
          100: "#d3f8ef",
          200: "#abefdf",
          300: "#75dec9",
          400: "#3dc5ac",
          500: "#1ca890",
          600: "#128674",
          700: "#106b5f",
          800: "#11564d",
          900: "#124740",
          950: "#062b28",
        },
        gold: {
          50: "#fff8e7",
          100: "#ffedbd",
          200: "#ffdc78",
          300: "#ffc84a",
          400: "#f7a91c",
          500: "#dc8310",
          600: "#b75f0c",
          700: "#934513",
          800: "#783916",
          900: "#663118",
        },
        coral: {
          50: "#fff1ed",
          100: "#ffe0d6",
          200: "#ffc5b4",
          300: "#ff9d82",
          400: "#fb7250",
          500: "#ed4f2c",
          600: "#cf371b",
          700: "#ab2a18",
          800: "#8d271b",
          900: "#75241b",
        },
        ink: {
          50: "#f5f7f8",
          100: "#e9eef1",
          200: "#d5dee4",
          300: "#b4c4cf",
          400: "#8da3b2",
          500: "#6f8798",
          600: "#596d7d",
          700: "#495a68",
          800: "#3f4c57",
          900: "#26313a",
          950: "#141c24",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(20 28 36 / 0.04), 0 14px 34px -24px rgb(20 28 36 / 0.24)",
        lift: "0 18px 48px -32px rgb(20 28 36 / 0.38)",
        focus: "0 0 0 4px rgb(28 168 144 / 0.16)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
      },
    },
  },
  plugins: [forms],
} satisfies Config;
