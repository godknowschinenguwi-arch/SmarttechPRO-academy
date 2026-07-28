/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Herbal Wisdom Africa brand — earthy leaf green + terracotta/ochre
        leaf: {
          50: '#f1f8ee',
          100: '#dfefd8',
          200: '#c0dfb3',
          300: '#98c982',
          400: '#71ae58',
          500: '#4f9236',
          600: '#3c7628',
          700: '#305e22',
          800: '#284b1e',
          900: '#213e1b',
          950: '#10210c',
        },
        clay: {
          50: '#fdf5ee',
          100: '#f9e6d3',
          200: '#f2c8a1',
          300: '#e8a465',
          400: '#e08442',
          500: '#cc6a2b',
          600: '#ab5220',
          700: '#883f1c',
          800: '#6e341c',
          900: '#5b2c1a',
        },
        ink: {
          DEFAULT: '#1b1a15',
          soft: '#4a463c',
          faint: '#7a7566',
        },
        surface: {
          DEFAULT: '#fffdf8',
          soft: '#faf5ea',
          line: '#e9e0cd',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,26,21,.05), 0 8px 24px -12px rgba(27,26,21,.15)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
