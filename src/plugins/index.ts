/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import { Quasar } from 'quasar'
import { quasarConfig } from './quasar'
import router from '../router'

// Types
import type { App } from 'vue'

export function registerPlugins(app: App) {
  app
    .use(Quasar, quasarConfig)
    .use(router)
}
