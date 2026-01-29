/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import { Quasar } from 'quasar'
import { createPinia } from 'pinia'
import { quasarConfig } from './quasar'
import router from '../router'

// Types
import type { App } from 'vue'

// Create Pinia instance
const pinia = createPinia()

export function registerPlugins(app: App) {
  app
    .use(pinia)
    .use(Quasar, quasarConfig)
    .use(router)
}
