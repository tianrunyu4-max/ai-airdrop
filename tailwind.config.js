/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
      }
    },
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#6366f1",
          secondary: "#8b5cf6",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#6366f1",
          secondary: "#8b5cf6",
        },
      },
    ],
  },
}

