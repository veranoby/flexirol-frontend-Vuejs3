// ARCHIVO: src/main.js (REEMPLAZAR COMPLETO)
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

// ✅ ORDEN CORRECTO: Vuetify primero, luego Tailwind, luego custom
import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'

// ✅ Tailwind después de Vuetify
import 'tailwindcss'

// ✅ CSS personalizado al final (máxima especificidad)
import './assets/flexirol.css'

const app = createApp(App)
const pinia = createPinia()

// ✅ Usar configuración personalizada de Vuetify
app.use(vuetify)
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

app.mount('#app')
