/**
 * JBCONX design tokens — shared by the Admin web portal and the Field Agent portal.
 *
 * Brand blues are sampled from the official JBCONX logo:
 *   brand-600 #00529C  → outer drop (primary brand blue)
 *   brand-400 #6096BA  → inner drop (secondary brand blue)
 * The rest of the scale is derived from those two so every blue in the UI belongs to the brand.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F2F7FC',
          100: '#E3EDF8',
          200: '#C6DAEF',
          300: '#9CBFE2',
          400: '#6096BA',
          500: '#2C74B8',
          600: '#00529C',
          700: '#04437F',
          800: '#0A3665',
          900: '#0C2A4D',
          950: '#071A31',
        },
        canvas: '#F4F6FA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        raised: '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        overlay: '0 24px 48px -12px rgba(15, 23, 42, 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
        'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
};
