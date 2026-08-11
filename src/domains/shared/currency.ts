// Devise d'affichage
//
// **Un seul réglage pour toute l'application, indépendant de la langue.**
// La langue décide de la *mise en forme* — séparateur décimal, place du symbole
// — jamais de la devise : lier les deux ferait qu'une bascule FR → EN
// transformerait 600 € en 600 £ sans conversion, et les remboursements
// affichés seraient faux.
//
// `XXX` est le code ISO 4217 réservé à « aucune devise » ; les navigateurs le
// rendent avec le signe monétaire générique ¤. C'est le choix neutre, pour qui
// ne veut rattacher ses comptes à aucun pays.

export const CURRENCY_STORAGE_KEY = 'divvy-currency'

export const supportedCurrencies = ['XXX', 'EUR', 'GBP', 'USD', 'CHF'] as const

export type SupportedCurrency = (typeof supportedCurrencies)[number]

/**
 * Le signe monétaire générique (U+00A4).
 *
 * On l'écrit nous-mêmes : les moteurs ne s'accordent pas sur le rendu du code
 * ISO `XXX`. Node en fait « ¤ », Chromium laisse « XXX » — quel que soit le
 * mode d'affichage demandé. S'en remettre à `Intl` afficherait donc un code
 * technique à l'utilisateur selon son navigateur.
 */
export const GENERIC_SIGN = '¤'

/** Reference currency used only to learn where a locale puts its symbol. */
export const PLACEMENT_REFERENCE = 'EUR'

/** What the app displayed before the setting existed — kept as the default. */
export const FALLBACK_CURRENCY: SupportedCurrency = 'EUR'

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === 'string' && (supportedCurrencies as readonly string[]).includes(value)
}

/** The symbol alone, as the active locale writes it — for menus and triggers. */
export function currencySymbol(currency: SupportedCurrency, locale: string): string {
  if (currency === 'XXX') return GENERIC_SIGN

  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0)
  return parts.find((part) => part.type === 'currency')?.value ?? currency
}

// localStorage throws instead of returning null in some privacy modes, so every
// access is guarded: a missing preference is never a reason to break the app.

function readStoredCurrency(): SupportedCurrency | null {
  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY)
    return isSupportedCurrency(saved) ? saved : null
  } catch {
    return null
  }
}

/** Saves the choice for the next visit. */
export function persistCurrency(currency: SupportedCurrency): void {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency)
  } catch {
    // The preference just won't survive a reload — not worth failing the UI.
  }
}

export function resolveInitialCurrency(): SupportedCurrency {
  return readStoredCurrency() ?? FALLBACK_CURRENCY
}
