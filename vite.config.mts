import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import Components from 'unplugin-vue-components/vite'
import { QuasarResolver } from 'unplugin-vue-components/resolvers'
import Vue from '@vitejs/plugin-vue'
import Fonts from 'unplugin-fonts/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    VueRouter({
      dts: 'src/typed-router.d.ts',
    }),
    Vue({
      template: { transformAssetUrls },
    }),
    quasar({
      sassVariables: fileURLToPath(new URL('src/styles/quasar-variables.scss', import.meta.url)),
    }),
    Components({
      dts: 'src/components.d.ts',
      dirs: ['src/components'],
      resolvers: [
        QuasarResolver(),
      ],
    }),
    Fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [400, 500, 700],
            styles: ['normal'],
          },
        ],
      },
    }),
  ],
  define: { 'process.env': {} },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
              return 'vendor-vue'
            }
            if (id.includes('quasar') || id.includes('@quasar')) {
              return 'vendor-quasar'
            }
            if (id.includes('date-fns') || id.includes('@vueuse') || id.includes('zod')) {
              return 'vendor-utils'
            }
            if (id.includes('exceljs') || id.includes('vuedraggable') || id.includes('qrcode') || id.includes('tiptap')) {
              return 'vendor-heavy'
            }
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  server: {
    port: 5173,
    allowedHosts: ['datchi.ithoathodb.xyz'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
