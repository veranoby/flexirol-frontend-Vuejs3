// ✅ ORDEN CORRECTO para evitar conflictos
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 1. Vuetify styles PRIMERO
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// 2. MDI icons
import '@mdi/font/css/materialdesignicons.css'

// 3. Tailwind DESPUÉS (sobrescribe selectivamente)
import 'tailwindcss'

// 4. Tus estilos ÚLTIMOS (máxima prioridad)
import './assets/flexirol.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#4a90a4', // Tu color
          secondary: '#5d8aa8', // Tu color
          accent: '#39711a', // Tu color
          warning: '#ff8c00', // Tu color
          error: '#dc3545', // Tu color
        },
      },
    },
  },
})

const app = createApp(App)
app.use(vuetify)
app.use(createPinia())
app.use(router)
app.mount('#app')
