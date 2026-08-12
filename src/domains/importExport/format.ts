// Format de fichier `.divvy` — sérialisation et lecture
//
// Un fichier contient **une vacance et tout ce qui lui est rattaché** : les
// personnes et les dépenses. C'est la même unité que la cascade de suppression
// (voir `specs/06-stockage-et-cascade.md`) — ce qui part ensemble voyage
// ensemble.
//
// La lecture est **défensive** : le fichier vient de l'extérieur, il peut être
// tronqué, écrit par une autre version, ou n'avoir jamais été un `.divvy`.
// Chaque échec porte une raison distincte, pour que l'utilisateur sache s'il
// s'est trompé de fichier ou si le nôtre est corrompu.

import { generateId, nowIso } from '@/domains/shared/entity'
import type { Expense } from '@/domains/expenses/types'
import type { Person } from '@/domains/people/types'
import type { Vacation } from '@/domains/vacations/types'

export const DIVVY_FORMAT = 'divvy' as const
export const DIVVY_FORMAT_VERSION = 1
export const DIVVY_EXTENSION = '.divvy'
export const DIVVY_MIME_TYPE = 'application/json'

/** Une vacance et tout ce qui lui appartient. */
export interface DivvyBundle {
  vacation: Vacation
  people: Person[]
  expenses: Expense[]
}

interface DivvyFile extends DivvyBundle {
  format: typeof DIVVY_FORMAT
  version: number
  exportedAt: string
}

export type ParseFailure =
  /** Not JSON at all — a picture, a truncated download… */
  | 'notJson'
  /** Valid JSON, but not one of our files. */
  | 'notDivvy'
  /** Ours, but written by a newer version than this app understands. */
  | 'unsupportedVersion'
  /** Ours and readable, but the contents do not hold together. */
  | 'invalidData'

export type ParseResult =
  | { ok: true; bundle: DivvyBundle }
  | { ok: false; reason: ParseFailure }

// --- Écriture ---------------------------------------------------------------

export function serialiseBundle(bundle: DivvyBundle): string {
  const file: DivvyFile = {
    format: DIVVY_FORMAT,
    version: DIVVY_FORMAT_VERSION,
    exportedAt: nowIso(),
    ...bundle,
  }
  return JSON.stringify(file, null, 2)
}

/**
 * Nom de fichier tiré du titre de la vacance. Tout ce qui pourrait gêner un
 * système de fichiers est remplacé, et un titre vide ou entièrement exotique
 * retombe sur un nom neutre plutôt que de produire `.divvy` tout court.
 */
export function bundleFileName(vacation: Pick<Vacation, 'name'>): string {
  const slug = vacation.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${slug || 'vacances'}${DIVVY_EXTENSION}`
}

// --- Lecture ----------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function readVacation(value: unknown): Vacation | null {
  if (!isRecord(value)) return null
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.name)) return null
  if (!isIsoDate(value.startDate) || !isIsoDate(value.endDate)) return null

  return {
    id: value.id,
    name: value.name,
    startDate: value.startDate,
    endDate: value.endDate,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : nowIso(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : nowIso(),
    ...(value.splitMethod === 'shares' ||
    value.splitMethod === 'shareDays' ||
    value.splitMethod === 'presence'
      ? { splitMethod: value.splitMethod }
      : {}),
  }
}

function readPerson(value: unknown, vacationId: string): Person | null {
  if (!isRecord(value)) return null
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.name)) return null
  if (!isIsoDate(value.arrivalDate) || !isIsoDate(value.departureDate)) return null

  const shares = value.shares
  if (typeof shares !== 'number' || !Number.isFinite(shares) || shares < 0) return null

  return {
    id: value.id,
    vacationId,
    name: value.name,
    shares,
    arrivalDate: value.arrivalDate,
    departureDate: value.departureDate,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : nowIso(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : nowIso(),
  }
}

function readExpense(value: unknown, vacationId: string): Expense | null {
  if (!isRecord(value)) return null
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.payerId)) return null
  if (!isNonEmptyString(value.label) || !isIsoDate(value.date)) return null

  // Les montants sont des centimes entiers de bout en bout : un flottant ou un
  // négatif ici contaminerait tous les totaux (voir domains/shared/money.ts).
  const amountCents = value.amountCents
  if (!Number.isSafeInteger(amountCents) || (amountCents as number) < 0) return null

  return {
    id: value.id,
    vacationId,
    payerId: value.payerId,
    amountCents: amountCents as number,
    label: value.label,
    date: value.date,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : nowIso(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : nowIso(),
  }
}

export function parseDivvyFile(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'notJson' }
  }

  if (!isRecord(raw) || raw.format !== DIVVY_FORMAT) return { ok: false, reason: 'notDivvy' }

  const version = raw.version
  if (typeof version !== 'number' || version > DIVVY_FORMAT_VERSION) {
    return { ok: false, reason: 'unsupportedVersion' }
  }

  const vacation = readVacation(raw.vacation)
  if (!vacation) return { ok: false, reason: 'invalidData' }

  if (!Array.isArray(raw.people) || !Array.isArray(raw.expenses)) {
    return { ok: false, reason: 'invalidData' }
  }

  const people: Person[] = []
  for (const entry of raw.people) {
    const person = readPerson(entry, vacation.id)
    if (!person) return { ok: false, reason: 'invalidData' }
    people.push(person)
  }

  const knownPeople = new Set(people.map((person) => person.id))
  const expenses: Expense[] = []
  for (const entry of raw.expenses) {
    const expense = readExpense(entry, vacation.id)
    // Une dépense dont le payeur ne figure pas dans le fichier rendrait la
    // répartition incalculable : le fichier est rejeté plutôt qu'importé à
    // moitié.
    if (!expense || !knownPeople.has(expense.payerId)) {
      return { ok: false, reason: 'invalidData' }
    }
    expenses.push(expense)
  }

  return { ok: true, bundle: { vacation, people, expenses } }
}

/**
 * Réattribue des identifiants neufs à tout le contenu, en conservant les liens
 * internes (dépense → payeur).
 *
 * Un import **n'écrase jamais** ce qui est déjà enregistré : importer deux fois
 * le même fichier donne deux vacances distinctes, ce qui est réparable, là où
 * un écrasement silencieux ne le serait pas.
 */
export function withFreshIds(bundle: DivvyBundle): DivvyBundle {
  const timestamp = nowIso()
  const vacationId = generateId()

  const peopleIds = new Map(bundle.people.map((person) => [person.id, generateId()]))

  return {
    vacation: { ...bundle.vacation, id: vacationId, createdAt: timestamp, updatedAt: timestamp },
    people: bundle.people.map((person) => ({
      ...person,
      id: peopleIds.get(person.id)!,
      vacationId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    expenses: bundle.expenses.map((expense) => ({
      ...expense,
      id: generateId(),
      vacationId,
      payerId: peopleIds.get(expense.payerId) ?? expense.payerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  }
}
