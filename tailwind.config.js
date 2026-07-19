/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // SmartTech Academy brand — Blue / Orange / White
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdbff',
          300: '#8ec4ff',
          400: '#59a3ff',
          500: '#3380ff',
          600: '#1b5ef5',
          700: '#1449e1',
          800: '#173cb6',
          900: '#19388f',
          950: '#142457',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        ink: {
          DEFAULT: '#0b1526',
          soft: '#3d4c63',
          faint: '#68778f',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f5f8fc',
          line: '#e3eaf3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,21,38,.05), 0 8px 24px -12px rgba(11,21,38,.12)',
        lift: '0 2px 4px rgba(11,21,38,.06), 0 16px 40px -16px rgba(20,73,225,.25)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
