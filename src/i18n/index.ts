// i18n — FR / EN
// Initial locale: saved preference > browser language > fallback.

import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

export const LOCALE_STORAGE_KEY = 'divvy-locale'
export const supportedLocales = ['fr', 'en'] as const
export const FALLBACK_LOCALE = 'en'

export type SupportedLocale = (typeof supportedLocales)[number]

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (supportedLocales as readonly string[]).includes(value)
}

// localStorage throws instead of returning null in some privacy modes, so every
// access is guarded: a missing preference is never a reason to break the app.

function readStoredLocale(): SupportedLocale | null {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isSupportedLocale(saved) ? saved : null
  } catch {
    return null
  }
}

/** Saves the user's language preference for the next visit. */
export function persistLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // The preference just won't survive a reload — not worth failing the UI.
  }
}

function detectBrowserLocale(): SupportedLocale | null {
  const language = globalThis.navigator?.language?.split('-')[0]
  return isSupportedLocale(language) ? language : null
}

/** Locale to start with: saved preference, then browser language, then fallback. */
export function resolveInitialLocale(): SupportedLocale {
  return readStoredLocale() ?? detectBrowserLocale() ?? FALLBACK_LOCALE
}

/** Keeps <html lang> in sync so assistive tech announces the right language. */
export function applyDocumentLocale(locale: SupportedLocale): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

const initialLocale = resolveInitialLocale()
applyDocumentLocale(initialLocale)

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: FALLBACK_LOCALE,
  messages: { fr, en },
})
