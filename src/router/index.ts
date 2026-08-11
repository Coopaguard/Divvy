import { createRouter, createWebHashHistory } from 'vue-router'
import AppPage from '@/views/AppPage.vue'

// Single-page app — all navigation is anchor-based within one route
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
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
