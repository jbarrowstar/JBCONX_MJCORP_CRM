import jbconxPreset from '../shared/styles/tailwind.preset.mjs';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [jbconxPreset],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
