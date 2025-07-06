import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '@fortawesome/fontawesome-free/css/all.css'
// Global styles
//import './assets/main.css'
import './assets/flexirol.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
