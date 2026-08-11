// IndexedDB storage — Divvy
// Stores: vacations, people (expenses and settlement added in later phases)

import type { Vacation } from '@/domains/vacations/types'
import type { Person } from '@/domains/people/types'

const DB_NAME = 'divvy'
const DB_VERSION = 1

export type DivvyStore = 'vacations' | 'people'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('vacations')) {
        db.createObjectStore('vacations', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('people')) {
        const peopleStore = db.createObjectStore('people', { keyPath: 'id' })
        peopleStore.createIndex('vacationId', 'vacationId', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getAll<T>(storeName: DivvyStore): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

async function getById<T>(storeName: DivvyStore, id: string): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

async function put<T>(storeName: DivvyStore, record: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.put(record)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function remove(storeName: DivvyStore, id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function getAllByIndex<T>(
  storeName: DivvyStore,
  indexName: string,
  value: IDBValidKey,
): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

// Vacation helpers
export const vacationStorage = {
  getAll: () => getAll<Vacation>('vacations'),
  getById: (id: string) => getById<Vacation>('vacations', id),
  save: (vacation: Vacation) => put<Vacation>('vacations', vacation),
  delete: (id: string) => remove('vacations', id),
}

// People helpers
export const peopleStorage = {
  getAll: () => getAll<Person>('people'),
  getByVacationId: (vacationId: string) =>
    getAllByIndex<Person>('people', 'vacationId', vacationId),
  save: (person: Person) => put<Person>('people', person),
  delete: (id: string) => remove('people', id),
}
