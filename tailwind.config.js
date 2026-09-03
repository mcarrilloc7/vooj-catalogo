/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad visual VOOJ
        vooj: {
          black: '#0A0A0A', // fondo negro puro
          bone: '#F5F0E8',  // texto / acento hueso
        },
      },
      fontFamily: {
        // Sans minimalista. Jost/Inter con amplia caja; fallback de sistema.
        sans: ['Jost', 'Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        wordmark: '0.35em', // wordmark en mayúsculas, tracking amplio
        wide2: '0.2em',
      },
    },
  },
  plugins: [],
}
