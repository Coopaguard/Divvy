import { createRouter, createWebHashHistory } from 'vue-router'
import { FIRST_STEP, STEPS, isStepReachable } from '@/domains/navigation/steps'
import { useVacationStore } from '@/stores/vacationStore'
import VacationsView from '@/views/VacationsView.vue'
import PeopleView from '@/views/PeopleView.vue'
import ExpensesView from '@/views/ExpensesView.vue'
import ResultsView from '@/views/ResultsView.vue'

// One route per step of the journey. No base is passed: the whole route lives
// after the '#', so it is independent of the path the app is served from (see
// the relative base in vite.config.ts) and a deep link never 404s on a static
// host such as GitHub Pages.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: { name: FIRST_STEP.name } },
    { path: '/vacations', name: 'vacations', component: VacationsView },
    { path: '/people', name: 'people', component: PeopleView },
    { path: '/expenses', name: 'expenses', component: ExpensesView },
    { path: '/results', name: 'results', component: ResultsView },
    // Unknown routes rejoin the journey rather than showing a blank page.
    { path: '/:pathMatch(.*)*', redirect: { name: FIRST_STEP.name } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

/**
 * Keeps the journey coherent: a step that needs a vacation is unreachable until
 * one is selected. Guards the URL as well as the UI — the timeline greys those
 * steps out, but nothing stops someone from typing the address by hand.
 */
router.beforeEach((to) => {
  const step = STEPS.find((candidate) => candidate.name === to.name)
  if (!step) return true

  const { hasVacation } = useVacationStore()
  return isStepReachable(step, hasVacation) ? true : { name: FIRST_STEP.name }
})

export default router
