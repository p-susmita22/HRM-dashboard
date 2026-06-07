/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A84FF',
          dark: '#006CE6',
        },
        secondary: '#FFFFFF',
        accent: '#E6F2FF',
        textDark: '#333333',
        textLight: '#777777',
        bgGray: '#F5F7FA',
        status: {
          present: '#34C759',
          absent: '#FF3B30',
          holiday: '#5AC8FA',
          leave: '#FFCC00',
        }
      }
    },
  },
  plugins: [],
}
