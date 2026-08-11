// IndexedDB storage — Divvy
//
// Modèle de propriété : le store `vacations` est la racine. Tout autre store
// contient des enregistrements rattachés à exactement une vacance via leur champ
// `vacationId`. Supprimer une vacance supprime donc en cascade tout ce qui lui
// est rattaché, dans une seule transaction : soit tout part, soit rien ne part.
//
// Second niveau de rattachement : une Dépense pointe aussi vers la Personne qui
// l'a payée (`payerId`). Supprimer une personne supprime ses dépenses — sans
// quoi le calcul de répartition (phase 6) travaillerait sur un payeur inexistant.
//
// Pour brancher un nouveau domaine, il suffit de le déclarer dans SCHEMA et dans
// la liste de propriété correspondante, puis d'incrémenter DB_VERSION.

import type { Vacation } from '@/domains/vacations/types'
import type { Person } from '@/domains/people/types'
import type { Expense } from '@/domains/expenses/types'

const DB_NAME = 'divvy'
// v2 : ajout du store `expenses` (phase 4). Incrémenter à chaque évolution du
// schéma, sinon `onupgradeneeded` ne se déclenche pas et les bases existantes
// restent sans le nouveau store.
const DB_VERSION = 2

/** Root store — owns every other record. */
export const ROOT_STORE = 'vacations' as const

/** Field (and index) linking an owned record to its vacation. */
export const VACATION_ID_KEY = 'vacationId' as const

/** Field (and index) linking an expense to the person who paid it. */
export const PAYER_ID_KEY = 'payerId' as const

/** Stores whose records belong to a vacation and cascade with it. */
export const VACATION_OWNED_STORES = ['people', 'expenses'] as const

/** Stores whose records also belong to a person and cascade with them. */
export const PERSON_OWNED_STORES = ['expenses'] as const

export type VacationOwnedStore = (typeof VACATION_OWNED_STORES)[number]
export type PersonOwnedStore = (typeof PERSON_OWNED_STORES)[number]
export type DivvyStore = typeof ROOT_STORE | VacationOwnedStore

interface StoreSchema {
  name: DivvyStore
  indexes: readonly string[]
}

const SCHEMA: readonly StoreSchema[] = [
  { name: ROOT_STORE, indexes: [] },
  { name: 'people', indexes: [VACATION_ID_KEY] },
  { name: 'expenses', indexes: [VACATION_ID_KEY, PAYER_ID_KEY] },
]

/** How many records were removed from each owned store. */
export type CascadeReport = Record<VacationOwnedStore, number>

function emptyReport(): CascadeReport {
  return Object.fromEntries(VACATION_OWNED_STORES.map((name) => [name, 0])) as CascadeReport
}

/** Total number of records removed, all stores combined. */
export function totalDeleted(report: CascadeReport): number {
  return Object.values(report).reduce((sum, count) => sum + count, 0)
}

// --- Connection -------------------------------------------------------------

// A single connection is shared by every operation: reopening the database on
// each read/write leaked one IDBDatabase handle per call.
let connection: Promise<IDBDatabase> | null = null

/**
 * Creates missing stores and missing indexes. Idempotent, so it doubles as the
 * migration path: an existing database only gains what it does not already have.
 */
function applySchema(db: IDBDatabase, upgrade: IDBTransaction | null): void {
  for (const { name, indexes } of SCHEMA) {
    const store = db.objectStoreNames.contains(name)
      ? (upgrade?.objectStore(name) ?? null)
      : db.createObjectStore(name, { keyPath: 'id' })
    if (!store) continue

    for (const index of indexes) {
      if (!store.indexNames.contains(index)) {
        store.createIndex(index, index, { unique: false })
      }
    }
  }
}

function openDB(): Promise<IDBDatabase> {
  if (connection) return connection

  connection = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => applySchema(request.result, request.transaction)

    request.onsuccess = () => {
      const db = request.result
      // Forget the handle when the browser or another tab closes it, so the
      // next call reopens instead of reusing a dead connection.
      db.onclose = () => releaseConnection()
      db.onversionchange = () => {
        db.close()
        releaseConnection()
      }
      resolve(db)
    }

    request.onerror = () => {
      releaseConnection()
      reject(request.error)
    }
  })

  return connection
}

function releaseConnection(): void {
  connection = null
}

/** Closes the shared connection — used by tests and before a schema upgrade. */
export async function closeDB(): Promise<void> {
  const pending = connection
  releaseConnection()
  if (!pending) return
  try {
    ;(await pending).close()
  } catch {
    // Already closed or failed to open — nothing left to release.
  }
}

// --- Request / transaction helpers ------------------------------------------

function toPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Resolves once the transaction has committed, rejects if it aborts. */
function committed(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

async function transaction<T>(
  storeNames: DivvyStore | DivvyStore[],
  mode: IDBTransactionMode,
  run: (tx: IDBTransaction) => Promise<T>,
): Promise<T> {
  const db = await openDB()
  const tx = db.transaction(storeNames, mode)
  const done = committed(tx)
  try {
    const result = await run(tx)
    await done
    return result
  } catch (cause) {
    // Leave storage untouched when any step of the transaction failed.
    if (mode === 'readwrite') abortQuietly(tx)
    // The abort surfaces on `done` too; it is already reported through `cause`.
    done.catch(() => undefined)
    throw cause
  }
}

function abortQuietly(tx: IDBTransaction): void {
  try {
    tx.abort()
  } catch {
    // Already committed or aborted — nothing to undo.
  }
}

// --- Generic CRUD -----------------------------------------------------------

function getAll<T>(storeName: DivvyStore): Promise<T[]> {
  return transaction(storeName, 'readonly', (tx) =>
    toPromise(tx.objectStore(storeName).getAll() as IDBRequest<T[]>),
  )
}

function getById<T>(storeName: DivvyStore, id: string): Promise<T | undefined> {
  return transaction(storeName, 'readonly', (tx) =>
    toPromise(tx.objectStore(storeName).get(id) as IDBRequest<T | undefined>),
  )
}

function put<T>(storeName: DivvyStore, record: T): Promise<void> {
  return transaction(storeName, 'readwrite', async (tx) => {
    await toPromise(tx.objectStore(storeName).put(record))
  })
}

function getAllByIndex<T>(
  storeName: VacationOwnedStore,
  indexName: string,
  value: IDBValidKey,
): Promise<T[]> {
  return transaction(storeName, 'readonly', (tx) =>
    toPromise(tx.objectStore(storeName).index(indexName).getAll(value) as IDBRequest<T[]>),
  )
}

// --- Cascade ----------------------------------------------------------------

/**
 * Deletes every record of `storeName` whose `indexName` matches `value`.
 * Runs inside the caller's transaction so the whole cascade stays atomic.
 */
function deleteByIndex(
  tx: IDBTransaction,
  storeName: VacationOwnedStore,
  indexName: string,
  value: IDBValidKey,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const store = tx.objectStore(storeName)
    const request = store.index(indexName).openKeyCursor(IDBKeyRange.only(value))
    let deleted = 0

    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) {
        resolve(deleted)
        return
      }
      store.delete(cursor.primaryKey)
      deleted += 1
      cursor.continue()
    }
    request.onerror = () => reject(request.error)
  })
}

/** Deletes records whose owner (by `ownerKey`) is not part of `knownIds`. */
function deleteOrphansBy(
  tx: IDBTransaction,
  storeName: VacationOwnedStore,
  ownerKey: string,
  knownIds: ReadonlySet<IDBValidKey>,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = tx.objectStore(storeName).openCursor()
    let deleted = 0

    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) {
        resolve(deleted)
        return
      }
      const owner = (cursor.value as Record<string, unknown>)[ownerKey]
      if (typeof owner !== 'string' || !knownIds.has(owner)) {
        cursor.delete()
        deleted += 1
      }
      cursor.continue()
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Supprime une vacance **et tout ce qui lui est rattaché**, en une seule
 * transaction couvrant tous les stores : aucun enregistrement orphelin ne peut
 * subsister, et un échec en cours de route laisse le stockage inchangé.
 */
export function deleteVacationCascade(vacationId: string): Promise<CascadeReport> {
  return transaction([ROOT_STORE, ...VACATION_OWNED_STORES], 'readwrite', async (tx) => {
    tx.objectStore(ROOT_STORE).delete(vacationId)

    const report = emptyReport()
    for (const storeName of VACATION_OWNED_STORES) {
      report[storeName] = await deleteByIndex(tx, storeName, VACATION_ID_KEY, vacationId)
    }
    return report
  })
}

/**
 * Supprime une personne **et les dépenses qu'elle a payées**, en une seule
 * transaction. Retourne le nombre de dépenses supprimées.
 */
export function deletePersonCascade(personId: string): Promise<number> {
  return transaction(['people', ...PERSON_OWNED_STORES], 'readwrite', async (tx) => {
    tx.objectStore('people').delete(personId)

    let deleted = 0
    for (const storeName of PERSON_OWNED_STORES) {
      deleted += await deleteByIndex(tx, storeName, PAYER_ID_KEY, personId)
    }
    return deleted
  })
}

/**
 * Nettoie le stockage des enregistrements orphelins — ceux dont la vacance ou
 * le payeur n'existe plus. Les cascades empêchent d'en créer de nouveaux ; ce
 * nettoyage rattrape les données écrites avant leur mise en place.
 */
export function pruneOrphanRecords(): Promise<CascadeReport> {
  return transaction([ROOT_STORE, ...VACATION_OWNED_STORES], 'readwrite', async (tx) => {
    const report = emptyReport()

    const vacationIds = new Set(await toPromise(tx.objectStore(ROOT_STORE).getAllKeys()))
    for (const storeName of VACATION_OWNED_STORES) {
      report[storeName] = await deleteOrphansBy(tx, storeName, VACATION_ID_KEY, vacationIds)
    }

    // Second pass: the people set is read *after* the pass above, so people
    // dropped as orphans do not keep their expenses alive.
    const peopleIds = new Set(await toPromise(tx.objectStore('people').getAllKeys()))
    for (const storeName of PERSON_OWNED_STORES) {
      report[storeName] += await deleteOrphansBy(tx, storeName, PAYER_ID_KEY, peopleIds)
    }

    return report
  })
}

// --- Public API per domain --------------------------------------------------

export const vacationStorage = {
  getAll: () => getAll<Vacation>(ROOT_STORE),
  getById: (id: string) => getById<Vacation>(ROOT_STORE, id),
  save: (vacation: Vacation) => put(ROOT_STORE, vacation),
  /** Deletes the vacation and cascades to every attached record. */
  delete: (id: string) => deleteVacationCascade(id),
}

export const peopleStorage = {
  getAll: () => getAll<Person>('people'),
  getByVacationId: (vacationId: string) =>
    getAllByIndex<Person>('people', VACATION_ID_KEY, vacationId),
  save: (person: Person) => put('people', person),
  /** Deletes the person and cascades to the expenses they paid. */
  delete: (id: string) => deletePersonCascade(id),
}

export const expenseStorage = {
  getAll: () => getAll<Expense>('expenses'),
  getByVacationId: (vacationId: string) =>
    getAllByIndex<Expense>('expenses', VACATION_ID_KEY, vacationId),
  getByPayerId: (payerId: string) => getAllByIndex<Expense>('expenses', PAYER_ID_KEY, payerId),
  save: (expense: Expense) => put('expenses', expense),
  delete: (id: string) =>
    transaction('expenses', 'readwrite', async (tx) => {
      await toPromise(tx.objectStore('expenses').delete(id))
    }),
}
