// Calcul des remboursements
//
// Deux temps, volontairement séparés :
//
//   1. la **quote-part** de chacun — ce qu'il aurait dû payer ;
//   2. les **transferts** — qui rembourse qui, et combien.
//
// Tout est en centimes entiers d'un bout à l'autre. La somme des quotes-parts
// est exactement égale au total dépensé (le reste de division est distribué,
// jamais perdu), donc la somme des soldes vaut exactement zéro et les
// transferts soldent la situation au centime près.

import { distribute } from '@/domains/shared/allocation'
import { DEFAULT_SPLIT_METHOD, type Balance, type SplitMethod, type Transfer } from './types'
import type { Expense } from '@/domains/expenses/types'
import type { Person } from '@/domains/people/types'
import type { Vacation } from '@/domains/vacations/types'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Parses a YYYY-MM-DD date at UTC midnight — no timezone can shift the day. */
function parseDay(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [, year, month, day] = match
  const time = Date.UTC(Number(year), Number(month) - 1, Number(day))
  return Number.isNaN(time) ? null : time
}

/**
 * Nights slept, counted as days and **inclusive on both ends**: arriving and
 * leaving the same day is one day of presence, not zero.
 *
 * The stay is clipped to the vacation window when there is one: days outside
 * it were never part of what is being shared.
 */
export function daysPresent(person: Person, vacation?: Vacation | null): number {
  const arrival = parseDay(person.arrivalDate)
  const departure = parseDay(person.departureDate)
  if (arrival === null || departure === null) return 0

  const windowStart = vacation ? parseDay(vacation.startDate) : null
  const windowEnd = vacation ? parseDay(vacation.endDate) : null

  const from = windowStart === null ? arrival : Math.max(arrival, windowStart)
  const to = windowEnd === null ? departure : Math.min(departure, windowEnd)
  if (to < from) return 0

  return Math.round((to - from) / MS_PER_DAY) + 1
}

/** The weight each person carries in the split, under the chosen method. */
function weightOf(person: Person, days: number, method: SplitMethod): number {
  const shares = Math.max(0, person.shares)
  return method === 'shareDays' ? shares * days : shares
}

export interface BalanceOptions {
  method?: SplitMethod
  vacation?: Vacation | null
}

/**
 * Ce que chacun doit, ce qu'il a avancé, et l'écart entre les deux.
 *
 * La méthode `shareDays` retombe sur les parts seules quand les dates ne
 * donnent aucun jour de présence à personne : mieux vaut répartir sur les
 * parts que de conclure que personne ne doit rien.
 */
export function computeBalances(
  people: readonly Person[],
  expenses: readonly Expense[],
  options: BalanceOptions = {},
): Balance[] {
  const requested = options.method ?? DEFAULT_SPLIT_METHOD
  const vacation = options.vacation ?? null

  const days = people.map((person) =>
    requested === 'shareDays' ? daysPresent(person, vacation) : 1,
  )

  let method = requested
  let weights = people.map((person, index) => weightOf(person, days[index]!, method))

  if (weights.every((weight) => weight <= 0) && requested === 'shareDays') {
    method = 'shares'
    weights = people.map((person) => weightOf(person, 1, method))
  }

  const totalCents = expenses.reduce((total, expense) => total + expense.amountCents, 0)
  const owed = distribute(weights, totalCents)

  const paidByPerson = new Map<string, number>()
  for (const expense of expenses) {
    paidByPerson.set(expense.payerId, (paidByPerson.get(expense.payerId) ?? 0) + expense.amountCents)
  }

  return people.map((person, index) => {
    const paidCents = paidByPerson.get(person.id) ?? 0
    const owedCents = owed[index] ?? 0
    return {
      personId: person.id,
      name: person.name,
      shares: person.shares,
      days: method === 'shareDays' ? days[index]! : 1,
      weight: weights[index]!,
      owedCents,
      paidCents,
      balanceCents: paidCents - owedCents,
    }
  })
}

/**
 * Qui rembourse qui, en **aussi peu de virements que possible**.
 *
 * À chaque tour, le plus gros débiteur paie le plus gros créancier : l'un des
 * deux est soldé à chaque virement, ce qui borne le total à (n − 1) transferts
 * et donne à chacun le moins d'interlocuteurs possible — personne ne se
 * retrouve à faire trois petits virements là où un seul suffit.
 *
 * Les égalités sont départagées par identifiant, pour que deux exécutions sur
 * les mêmes données produisent exactement la même liste.
 */
export function optimiseTransfers(balances: readonly Balance[]): Transfer[] {
  const byAmountDesc = <T extends { id: string; amount: number }>(a: T, b: T) =>
    b.amount - a.amount || a.id.localeCompare(b.id)

  const debtors = balances
    .filter((balance) => balance.balanceCents < 0)
    .map((balance) => ({ id: balance.personId, amount: -balance.balanceCents }))
    .sort(byAmountDesc)

  const creditors = balances
    .filter((balance) => balance.balanceCents > 0)
    .map((balance) => ({ id: balance.personId, amount: balance.balanceCents }))
    .sort(byAmountDesc)

  const transfers: Transfer[] = []
  let debtorIndex = 0
  let creditorIndex = 0

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex]!
    const creditor = creditors[creditorIndex]!
    const amountCents = Math.min(debtor.amount, creditor.amount)

    if (amountCents > 0) {
      transfers.push({ fromId: debtor.id, toId: creditor.id, amountCents })
    }

    debtor.amount -= amountCents
    creditor.amount -= amountCents
    if (debtor.amount === 0) debtorIndex += 1
    if (creditor.amount === 0) creditorIndex += 1
  }

  return transfers
}
