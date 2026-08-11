import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // Relative base: assets are resolved against the document, so the build works
  // whatever the path it is served from. GitHub Pages serves a project site
  // under the repository name with its exact casing (/Divvy/), which a hardcoded
  // base cannot follow without breaking on every rename.
  base: './',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
