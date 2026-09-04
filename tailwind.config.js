/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad visual VOOJ
        vooj: {
          black: '#0A0A0A', // sello de marca: fondo del logo (NO se invierte)
          bone: '#F5F0E8',  // superficie clara del sitio + texto del logo
          ink: '#161514',   // texto oscuro sobre fondo claro (casi negro)
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
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.28s ease both',
      },
    },
  },
  plugins: [],
}
