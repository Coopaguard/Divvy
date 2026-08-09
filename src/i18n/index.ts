import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

export const LOCALE_STORAGE_KEY = 'divvy-locale'
export const supportedLocales = ['fr', 'en'] as const

const browserLocale = navigator.language?.split('-')[0] ?? ''
const defaultLocale = (supportedLocales as readonly string[]).includes(browserLocale)
  ? browserLocale
  : 'fr'
const rawSaved = localStorage.getItem(LOCALE_STORAGE_KEY)
const savedLocale = rawSaved && (supportedLocales as readonly string[]).includes(rawSaved)
  ? rawSaved
  : defaultLocale

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'fr',
  messages: { fr, en },
})
