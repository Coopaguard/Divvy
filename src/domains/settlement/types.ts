// Domain types — Remboursements

/** How each person's share of the total is worked out. */
export type SplitMethod =
  /** Parts seules : chacun paie au prorata de ses parts. */
  | 'shares'
  /** Parts × jours de présence : une part coûte un prix par jour. */
  | 'shareDays'

export const DEFAULT_SPLIT_METHOD: SplitMethod = 'shares'

/** What one person owes, what they advanced, and the gap between the two. */
export interface Balance {
  personId: string
  name: string
  shares: number
  /** Days counted for this person — always 1 under the `shares` method. */
  days: number
  /** Weight used in the split: shares, or shares × days. */
  weight: number
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
