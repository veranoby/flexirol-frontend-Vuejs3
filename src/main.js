import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Tailwind CSS
import 'tailwindcss'
import '@fortawesome/fontawesome-free/css/all.css'
// Global styles
import './assets/flexirol.css'

const app = createApp(App)
const vuetify = createVuetify({
  components,
  directives,
})

app.use(vuetify) // ✅ Añadir Vuetify
app.use(createPinia())
app.use(router)

app.mount('#app')
