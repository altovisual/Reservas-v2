/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f5f5',
          100: '#ccebeb',
          200: '#99d6d6',
          300: '#66c2c2',
          400: '#33adad',
          500: '#2d7d7d',
          600: '#256969',
          700: '#1e5454',
          800: '#164040',
          900: '#0f2b2b',
        }
      }
    },
  },
  plugins: [],
}
