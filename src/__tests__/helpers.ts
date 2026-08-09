// Test mounting helpers — Pinia + vue-i18n + vue-router stubs
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
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

/** Returns global mounting options with Pinia, i18n and a stub router. */
export function globalPlugins(locale = 'en'): MountingOptions<Component>['global'] {
  return {
    plugins: [makePinia(), makeI18n(locale), makeRouter()],
  }
}
