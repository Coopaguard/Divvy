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
import { DEFAULT_SPLIT_METHOD, type Balance, type SplitMethod } from './types'
import type { Transfer } from './types'
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
 * it were never part of what is being shared. Informational only — the split
 * itself works date by date, not on this count.
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

/** Was this person there on that day? Both ends of the stay count as present. */
export function isPresentOn(person: Person, date: string): boolean {
  const day = parseDay(date)
  const arrival = parseDay(person.arrivalDate)
  const departure = parseDay(person.departureDate)
  if (day === null || arrival === null || departure === null) return false
  return day >= arrival && day <= departure
}

/**
 * Quote-part de chacun quand les dates comptent : **chaque dépense est
 * répartie séparément**, entre les seules personnes présentes le jour où elle
 * a été faite. Quelqu'un reparti la veille ne porte donc rien de la dépense du
 * lendemain.
 *
 * C'est plus juste qu'un prorata global sur le nombre de jours : ce dernier
 * étale toutes les dépenses uniformément sur les séjours, et fait donc payer
 * un absent pour une dépense faite après son départ.
 */
function owedByPresence(
  people: readonly Person[],
  expenses: readonly Expense[],
  shares: readonly number[],
): number[] {
  return expenses.reduce<number[]>((owed, expense) => {
    const present = people.map((person, index) =>
      isPresentOn(person, expense.date) ? shares[index]! : 0,
    )

    // Une dépense dont personne n'était témoin (date hors de tous les séjours,
    // ou date illisible) doit quand même être payée : elle retombe sur le
    // groupe entier, sinon le total réparti ne vaudrait plus le total dépensé.
    const weights = present.some((weight) => weight > 0) ? present : shares

    const parts = distribute(weights, expense.amountCents)
    return owed.map((value, index) => value + (parts[index] ?? 0))
  }, people.map(() => 0))
}

/**
 * Prorata global sur les jours : le total est réparti sur les jours-parts de
 * chacun (parts × jours de présence). Toutes les dépenses sont donc étalées
 * uniformément sur les séjours — simple et prévisible, mais quelqu'un reparti
 * tôt porte tout de même une fraction de ce qui a été dépensé après son départ.
 * La méthode `presence` est là pour qui veut éviter cela.
 *
 * Retombe sur les parts seules si personne n'a de jour exploitable : mieux vaut
 * répartir que de conclure que personne ne doit rien.
 */
function owedByShareDays(
  people: readonly Person[],
  totalCents: number,
  shares: readonly number[],
  days: readonly number[],
): number[] {
  const weights = people.map((_, index) => shares[index]! * days[index]!)
  const usable = weights.some((weight) => weight > 0) ? weights : shares
  return distribute(usable, totalCents)
}

export interface BalanceOptions {
  method?: SplitMethod
  vacation?: Vacation | null
}

/** Ce que chacun doit, ce qu'il a avancé, et l'écart entre les deux. */
export function computeBalances(
  people: readonly Person[],
  expenses: readonly Expense[],
  options: BalanceOptions = {},
): Balance[] {
  const method = options.method ?? DEFAULT_SPLIT_METHOD
  const vacation = options.vacation ?? null

  const shares = people.map((person) => Math.max(0, person.shares))
  const totalCents = expenses.reduce((total, expense) => total + expense.amountCents, 0)

  const days = people.map((person) => daysPresent(person, vacation))

  const owed =
    method === 'presence'
      ? owedByPresence(people, expenses, shares)
      : method === 'shareDays'
        ? owedByShareDays(people, totalCents, shares, days)
        : distribute(shares, totalCents)

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
      days: days[index]!,
      owedCents,
      paidCents,
      balanceCents: paidCents - owedCents,
    }
  })
}

/**
 * Ce que vaut **une part pour une journée**, sous la méthode `shareDays` : le
 * total divisé par la somme des jours-parts.
 *
 * Le résultat n'est pas un nombre entier de centimes, et ne peut pas l'être —
 * 480 € sur 35 jours-parts font 13,714… Cette cote est donc **indicative** :
 * les quote-parts sont calculées sur le total, pas en multipliant cette valeur,
 * sans quoi les arrondis ne boucleraient plus. L'appelant l'affiche comme telle.
 *
 * Null quand aucun jour-part n'est en jeu — il n'y a alors pas de cote à donner.
 */
export function shareDayRate(
  balances: readonly Balance[],
  totalCents: number,
): { units: number; rateCents: number } | null {
  const units = balances.reduce((sum, balance) => sum + balance.shares * balance.days, 0)
  if (units <= 0) return null
  return { units, rateCents: totalCents / units }
}

/**
 * Ce qu'une part a coûté par jour **à cette personne-là**.
 *
 * Sous `presence`, il n'y a pas de cote unique : chacun ne porte que les
 * dépenses des jours où il était là. Deux personnes aux mêmes parts n'ont donc
 * pas le même prix au jour-part — celui qui n'a vu que les grosses journées
 * paie plus cher la sienne. C'est précisément ce que cette valeur montre.
 *
 * Indicative comme la précédente, et null quand la personne n'a aucun jour-part.
 */
export function personDayRate(balance: Balance): number | null {
  const units = balance.shares * balance.days
  if (units <= 0) return null
  return balance.owedCents / units
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
