// Tests: currency setting — codes, symbols and persistence
import { describe, it, expect, beforeEach } from 'vitest'
import {
  CURRENCY_STORAGE_KEY,
  FALLBACK_CURRENCY,
  currencySymbol,
  isSupportedCurrency,
  persistCurrency,
  resolveInitialCurrency,
  supportedCurrencies,
} from '@/domains/shared/currency'

describe('currency', () => {
  beforeEach(() => localStorage.clear())

  it('offers a generic option tied to no country', () => {
    expect(supportedCurrencies).toContain('XXX')
  })

  it('renders the generic code as the currency sign', () => {
    expect(currencySymbol('XXX', 'fr')).toBe('¤')
    expect(currencySymbol('XXX', 'en')).toBe('¤')
  })

  it('renders the usual symbols', () => {
    expect(currencySymbol('EUR', 'fr')).toBe('€')
    expect(currencySymbol('GBP', 'en')).toBe('£')
    expect(currencySymbol('USD', 'en')).toBe('$')
  })

  it('rejects anything outside the list', () => {
    expect(isSupportedCurrency('EUR')).toBe(true)
    expect(isSupportedCurrency('BTC')).toBe(false)
    expect(isSupportedCurrency(null)).toBe(false)
  })

  it('starts on the generic sign, presuming no country', () => {
    expect(FALLBACK_CURRENCY).toBe('XXX')
    expect(resolveInitialCurrency()).toBe(FALLBACK_CURRENCY)
  })

  it('restores a saved choice', () => {
    persistCurrency('GBP')
    expect(localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe('GBP')
    expect(resolveInitialCurrency()).toBe('GBP')
  })

  it('ignores a stored value that is no longer supported', () => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, 'ITL')
    expect(resolveInitialCurrency()).toBe(FALLBACK_CURRENCY)
  })
})
