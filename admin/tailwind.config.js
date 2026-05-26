/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'lit-bg': '#0D0D0D',
        'lit-surface': '#1A1A1A',
        'lit-gold': '#C9A84C',
        'lit-text': '#F5F5F5',
        'lit-border': '#333333',
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
