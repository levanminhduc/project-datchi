/**
 * plugins/quasar.ts
 *
 * Framework documentation: https://quasar.dev
 */

// Quasar (CSS is imported in main.ts to avoid duplicates)
import { Quasar, Dialog, Notify, Loading, BottomSheet, ClosePopup, Ripple } from 'quasar'
import type { QuasarPluginOptions } from 'quasar'

export default Quasar

export const quasarConfig: QuasarPluginOptions = {
  plugins: {
    Dialog,
    Notify,
    Loading,
    BottomSheet,
  },
  directives: {
    ClosePopup,
    Ripple,
  },
  config: {
    dark: 'auto' as const,
  },
}
