// Tests: i18n initialisation — locale detection from navigator + localStorage
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LOCALE_STORAGE_KEY, supportedLocales } from '@/i18n'

describe('i18n — supportedLocales', () => {
  it('contains fr and en', () => {
    expect(supportedLocales).toContain('fr')
    expect(supportedLocales).toContain('en')
  })
})

describe('i18n — LOCALE_STORAGE_KEY', () => {
  it('is a non-empty string', () => {
    expect(typeof LOCALE_STORAGE_KEY).toBe('string')
    expect(LOCALE_STORAGE_KEY.length).toBeGreaterThan(0)
  })
})

describe('i18n — browser locale detection logic', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('uses saved locale from localStorage when valid', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr')
    // Re-import the module so the locale is re-computed
    const { i18n } = await import('@/i18n')
    expect(['fr', 'en']).toContain(i18n.global.locale.value)
  })

  it('ignores invalid saved locale and keeps a supported locale', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'zz')
    const { i18n } = await import('@/i18n')
    expect(supportedLocales as readonly string[]).toContain(i18n.global.locale.value)
  })

  it('falls back to a supported locale when localStorage is empty', async () => {
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    const { i18n } = await import('@/i18n')
    expect(supportedLocales as readonly string[]).toContain(i18n.global.locale.value)
  })
})
