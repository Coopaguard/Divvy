// Test mounting helpers — Pinia + vue-i18n + vue-router
import { createI18n } from 'vue-i18n'
import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { FIRST_STEP, STEPS } from '@/domains/navigation/steps'
import fr from '@/i18n/locales/fr.json'
import en from '@/i18n/locales/en.json'
import type { MountingOptions } from '@vue/test-utils'
import type { Component } from 'vue'

export function makeI18n(locale = 'en') {
  return createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { fr, en } })
}

export function makePinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * Router carrying the real step routes, with stub components.
 *
 * The timeline and the previous/next buttons resolve routes by name, so a
 * single-route stub would make every link fail to resolve. Memory history keeps
 * each test isolated — a hash left in jsdom's URL cannot leak into the next one.
 */
export function makeRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', redirect: { name: FIRST_STEP.name } },
      ...STEPS.map((step) => ({
        path: `/${step.name}`,
        name: step.name,
        component: { template: '<div />' },
      })),
    ],
  })
}

/** Router already sitting on a given step, ready to mount against. */
export async function routerAt(stepName: string): Promise<Router> {
  const router = makeRouter()
  await router.push({ name: stepName })
  await router.isReady()
  return router
}

/**
 * Global mounting options with Pinia, i18n and a router.
 *
 * Reuses the pinia installed by the test's `setActivePinia`: creating a new one
 * here would give the mounted component a different store than the one the test
 * inspects, so assertions would silently target the wrong instance.
 */
export function globalPlugins(
  locale = 'en',
  router: Router = makeRouter(),
): MountingOptions<Component>['global'] {
  return {
    plugins: [getActivePinia() ?? makePinia(), makeI18n(locale), router],
  }
}
