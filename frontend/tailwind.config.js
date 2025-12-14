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
          50: '#e6f0f5',
          100: '#cce1eb',
          200: '#99c3d7',
          300: '#66a5c3',
          400: '#3387af',
          500: '#0074B7', // Primary blue
          600: '#005d92',
          700: '#00466e',
          800: '#002f49',
          900: '#001725',
        },
        secondary: {
          50: '#f5ebe6',
          100: '#ebd7cc',
          200: '#d7af99',
          300: '#c38766',
          400: '#af5f33',
          500: '#8B4513', // Primary brown
          600: '#6f370f',
          700: '#53290b',
          800: '#381c08',
          900: '#1c0e04',
        },
        accent: {
          50: '#e8f5ed',
          100: '#d1ebdb',
          200: '#a3d7b7',
          300: '#75c393',
          400: '#47af6f',
          500: '#2E8B57', // Accent green
          600: '#256f46',
          700: '#1c5334',
          800: '#133823',
          900: '#091c11',
        },
      },
    },
  },
  plugins: [],
};
