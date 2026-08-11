// Montants monétaires — stockés en **centimes entiers**.
//
// Les flottants IEEE-754 ne représentent pas exactement 0.1 : additionner des
// euros en décimal ferait dériver les totaux, puis la répartition (phase 6).
// Toute la chaîne manipule donc des entiers ; la conversion n'a lieu qu'aux
// frontières — saisie utilisateur et affichage.

import {
  FALLBACK_CURRENCY,
  GENERIC_SIGN,
  PLACEMENT_REFERENCE,
  type SupportedCurrency,
} from './currency'

export const CENTS_PER_UNIT = 100

/** Devise retenue quand l'appelant n'en impose pas (voir shared/currency.ts). */
export const CURRENCY: SupportedCurrency = FALLBACK_CURRENCY

// Décimal positif, deux décimales au plus. Rejette le vide, le négatif,
// la notation scientifique et les fractions de centime.
const AMOUNT_PATTERN = /^\d+([.]\d{1,2})?$/

/** Converts a user-typed amount ("12.50" or "12,50") to cents. Null when invalid. */
export function parseAmountToCents(input: string): number | null {
  const normalised = input.trim().replace(',', '.')
  if (!AMOUNT_PATTERN.test(normalised)) return null

  const cents = Math.round(Number(normalised) * CENTS_PER_UNIT)
  return Number.isSafeInteger(cents) ? cents : null
}

/**
 * Formats cents for display. The locale sets the *shape* — decimal separator,
 * where the symbol goes — and the currency sets the symbol. The two are
 * separate on purpose: reading in another language must never restate an
 * amount in another currency.
 */
export function formatCents(
  cents: number,
  locale: string,
  currency: SupportedCurrency = CURRENCY,
): string {
  const value = cents / CENTS_PER_UNIT

  // The generic sign is written by hand — see GENERIC_SIGN. Placement and
  // spacing still come from the locale, borrowed from a real currency, so
  // "¤600.00" and "600,00 ¤" both come out right.
  if (currency === 'XXX') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: PLACEMENT_REFERENCE,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(value)
      .map((part) => (part.type === 'currency' ? GENERIC_SIGN : part.value))
      .join('')
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(value)
}

/** Formats cents as a plain decimal, to prefill a number input. */
export function centsToInput(cents: number): string {
  return (cents / CENTS_PER_UNIT).toFixed(2)
}

/** Sums cents. Kept here so every total goes through the same integer path. */
export function sumCents(amounts: readonly number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0)
}
