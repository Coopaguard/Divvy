import { createRouter, createWebHashHistory } from 'vue-router'
import AppPage from '@/views/AppPage.vue'

// Single-page app — all navigation is anchor-based within one route.
// No base is passed: the whole route lives after the '#', so it is independent
// of the path the app is served from (see the relative base in vite.config.ts).
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: AppPage,
    },
  ],
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

export default router
