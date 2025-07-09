// ARCHIVO: tailwind.config.js (crear en raíz del proyecto)
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  corePlugins: {
    // Deshabilitar conflictos con Vuetify
    preflight: false, // ✅ Evita reset CSS que compite con Vuetify
  },
  theme: {
    extend: {
      // ✅ Colores FlexiRol compatibles con Tailwind
      colors: {
        flexirol: {
          primary: '#4a90a4',
          secondary: '#5d8aa8',
          accent: '#39711a',
          warning: '#ff8c00',
          error: '#dc3545',
        },
      },
      // ✅ Variables CSS personalizadas
      backgroundColor: {
        glass: 'rgba(255, 255, 255, 0.6)',
      },
      backdropBlur: {
        glass: '10px',
      },
    },
  },
  plugins: [],
  // ✅ Importante: Aumenta especificidad para casos específicos
  important: '.tw-scope', // Prefijo para casos donde necesites forzar Tailwind
}
