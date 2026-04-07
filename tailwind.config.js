/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cetadmi: {
          cream: '#F8F1E3',
          navy: '#0A2342',
          blue: '#2E6F95',
          lightBlue: '#5FA8D3',
          red: '#C1121F',
          dark: '#111111'
        }
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
