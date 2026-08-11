// Montants monétaires — stockés en **centimes entiers**.
//
// Les flottants IEEE-754 ne représentent pas exactement 0.1 : additionner des
// euros en décimal ferait dériver les totaux, puis la répartition (phase 6).
// Toute la chaîne manipule donc des entiers ; la conversion n'a lieu qu'aux
// frontières — saisie utilisateur et affichage.

export const CENTS_PER_UNIT = 100

/** MVP mono-devise (le multi-devises est hors périmètre, voir ROADMAP). */
export const CURRENCY = 'EUR'

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

/** Formats cents as currency for display, in the active locale. */
export function formatCents(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: CURRENCY }).format(
    cents / CENTS_PER_UNIT,
  )
}

/** Formats cents as a plain decimal, to prefill a number input. */
export function centsToInput(cents: number): string {
  return (cents / CENTS_PER_UNIT).toFixed(2)
}

/** Sums cents. Kept here so every total goes through the same integer path. */
export function sumCents(amounts: readonly number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0)
}
