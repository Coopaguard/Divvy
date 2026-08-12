import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

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
    VitePWA({
      // `prompt`, et non `autoUpdate` : celui-ci recharge la page dès qu'une
      // nouvelle version est prête, ce qui effacerait une dépense en cours de
      // saisie. On propose, l'utilisateur recharge quand il veut.
      registerType: 'prompt',
      // L'enregistrement automatique est désactivé : il se fait depuis
      // UpdatePrompt, qui a besoin des signaux de mise à jour pour prévenir.
      injectRegister: null,
      // Le manifeste et le service worker sont servis depuis le même dossier
      // que l'application ; tout est donc relatif, comme le reste du build.
      manifest: {
        name: 'Divvy — partage de dépenses',
        short_name: 'Divvy',
        description: 'Partagez simplement vos dépenses de vacances entre amis.',
        lang: 'fr',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#f57c00',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // L'application est autonome : tout ce qu'elle sert est précaché, et
        // il n'y a aucun appel réseau à l'exécution à mettre en cache.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
