// Test mounting helpers — Pinia + vue-i18n + vue-router stubs
import { createI18n } from 'vue-i18n'
import { createPinia, getActivePinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
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

export function makeRouter() {
  return createRouter({ history: createWebHashHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
}

/**
 * Global mounting options with Pinia, i18n and a stub router.
 *
 * Reuses the pinia installed by the test's `setActivePinia`: creating a new one
 * here would give the mounted component a different store than the one the test
 * inspects, so assertions would silently target the wrong instance.
 */
export function globalPlugins(locale = 'en'): MountingOptions<Component>['global'] {
  return {
    plugins: [getActivePinia() ?? makePinia(), makeI18n(locale), makeRouter()],
  }
}
