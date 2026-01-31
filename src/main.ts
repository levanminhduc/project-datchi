/**
 * main.ts
 *
 * Bootstraps Quasar and other plugins then mounts the App
 */

// Quasar styles (must be before plugins)
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Styles
import 'unfonts.css'
import './styles/global.scss'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
