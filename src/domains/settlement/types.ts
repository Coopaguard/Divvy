// Domain types — Remboursements

/** How each person's share of the total is worked out. */
export type SplitMethod =
  /** Parts seules : chacun paie au prorata de ses parts, dates ignorées. */
  | 'shares'
  /**
   * Présence : chaque dépense n'est partagée qu'entre les personnes présentes
   * le jour où elle a été faite, au prorata de leurs parts.
   */
  | 'presence'

export const DEFAULT_SPLIT_METHOD: SplitMethod = 'shares'

/** What one person owes, what they advanced, and the gap between the two. */
export interface Balance {
  personId: string
  name: string
  shares: number
  /** Days of presence, clipped to the vacation — shown, never used as a weight. */
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
