/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        harvest: {
          50: '#eef8f0',
          100: '#d8eedc',
          500: '#24833b',
          600: '#1f7334',
          700: '#1a5d2c',
        },
        ink: '#17211b',
      },
      boxShadow: {
        soft: '0 16px 40px rgba(23, 33, 27, 0.08)',
      },
    },
  },
  plugins: [],
};
