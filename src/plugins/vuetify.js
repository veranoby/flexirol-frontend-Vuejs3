// ARCHIVO: src/plugins/vuetify.js (crear este archivo)
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// ✅ THEME PERSONALIZADO FLEXIROL
const flexirolTheme = {
  dark: false,
  colors: {
    // Colores principales FlexiRol
    primary: '#4a90a4',
    secondary: '#5d8aa8',
    accent: '#39711a',
    warning: '#ff8c00',
    error: '#dc3545',
    info: '#17a2b8',
    success: '#28a745',

    // Colores adicionales para compatibilidad
    'flexirol-primary': '#4a90a4',
    'flexirol-secondary': '#5d8aa8',
    'flexirol-tertiary': '#39711a',
    'flexirol-quaternary': '#ff8c00',
  },
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'flexirolTheme',
    themes: {
      flexirolTheme,
    },
    // ✅ Permitir variables CSS personalizadas
    variations: {
      colors: ['primary', 'secondary', 'accent', 'warning', 'error'],
      lighten: 5,
      darken: 5,
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
  // ✅ Configuración para permitir glass-morphism
  defaults: {
    global: {
      fontFamily: "'Ubuntu', sans-serif",
    },
    VAppBar: {
      // Permite override de estilos por defecto
      flat: true,
    },
    VCard: {
      variant: 'elevated',
    },
  },
})
