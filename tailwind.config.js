/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-cream': '#FDFBF7',
        'brand-navy': '#002D5C',
        'brand-navy-light': '#004080',
        'brand-gold': '#C5A059',
        'brand-gold-light': '#D4B475',
        'brand-red': '#E41E26',
        'brand-blue': '#0054A6',
        cetadmi: {
          cream: '#FDFBF7',
          navy: '#002D5C',
          red: '#E41E26',
          blue: '#0054A6',
        },
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
      }
    },
  },
  plugins: [],
}
