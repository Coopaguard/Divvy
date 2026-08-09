import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

const browserLocale = navigator.language.split('-')[0]
const supportedLocales = ['fr', 'en']
const defaultLocale = supportedLocales.includes(browserLocale) ? browserLocale : 'fr'
const savedLocale = localStorage.getItem('divvy-locale') ?? defaultLocale

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'fr',
  messages: { fr, en },
})
