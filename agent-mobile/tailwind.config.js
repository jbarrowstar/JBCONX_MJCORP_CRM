/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#274C77',   // Primary Blue
          secondary: '#6096BA', // Secondary Blue
          light: '#A3CEF1',     // Light Blue
          bg: '#E7ECEF',        // Background
          white: '#FFFFFF',     // White
          slate: '#8B8C89',     // Slate Grey
          dark: '#1B3B6F',      // Deep Blue
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

