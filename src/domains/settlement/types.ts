// Domain types — Remboursements

/** How each person's share of the total is worked out. */
export type SplitMethod =
  /** Simple : total ÷ parts. Les dates ne comptent pas. */
  | 'shares'
  /**
   * Prorata par jour : total ÷ parts ÷ jours. Une part coûte un prix par jour,
   * et l'ensemble des dépenses est étalé uniformément sur les séjours.
   */
  | 'shareDays'
  /**
   * Prorata par dépense : chaque dépense ÷ son jour ÷ parts. Seuls les présents
   * à la date d'une dépense la portent — le calcul le plus fidèle aux faits.
   */
  | 'presence'

/** Every method, in the order they are offered — simplest first. */
export const SPLIT_METHODS: readonly SplitMethod[] = ['shares', 'shareDays', 'presence']

export const DEFAULT_SPLIT_METHOD: SplitMethod = 'shares'

/** What one person owes, what they advanced, and the gap between the two. */
export interface Balance {
  personId: string
  name: string
  shares: number
  /** Days of presence, clipped to the vacation. A weight under `shareDays`. */
  days: number
  /** Their share of the total spend. */
  owedCents: number
  /** What they actually paid out. */
  paidCents: number
  /** paid − owed. Positive: they are owed money. Negative: they owe. */
  balanceCents: number
}

/** One payment to make: `fromId` hands `amountCents` to `toId`. */
export interface Transfer {
  fromId: string
  toId: string
  amountCents: number
}
