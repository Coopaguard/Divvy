// Domain types — Dépenses

export interface Expense {
  id: string
  vacationId: string
  payerId: string // Person.id — qui a avancé l'argent
  amountCents: number // entier, en centimes (voir domains/shared/money.ts)
  label: string
  date: string // ISO date string YYYY-MM-DD
  createdAt: string
  updatedAt: string
}

export type ExpenseDraft = Omit<Expense, 'id' | 'vacationId' | 'createdAt' | 'updatedAt'>
