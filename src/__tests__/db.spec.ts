// Tests: IndexedDB storage layer — cascade delete and orphan pruning.
// These run against a real IndexedDB implementation (fake-indexeddb), not mocks.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  closeDB,
  deleteVacationCascade,
  peopleStorage,
  pruneOrphanRecords,
  totalDeleted,
  vacationStorage,
} from '@/domains/storage/db'
import type { Person } from '@/domains/people/types'
import type { Vacation } from '@/domains/vacations/types'

function makeVacation(id: string): Vacation {
  return {
    id,
    name: `Vacation ${id}`,
    startDate: '2025-07-01',
    endDate: '2025-07-15',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }
}

function makePerson(id: string, vacationId: string): Person {
  return {
    id,
    vacationId,
    name: `Person ${id}`,
    shares: 1,
    arrivalDate: '2025-07-01',
    departureDate: '2025-07-15',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }
}

async function resetDatabase(): Promise<void> {
  await closeDB()
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('divvy')
    request.onsuccess = () => resolve()
    request.onblocked = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/** One vacation with two people, plus a second vacation with one person. */
async function seed(): Promise<void> {
  await vacationStorage.save(makeVacation('vac-1'))
  await vacationStorage.save(makeVacation('vac-2'))
  await peopleStorage.save(makePerson('p1', 'vac-1'))
  await peopleStorage.save(makePerson('p2', 'vac-1'))
  await peopleStorage.save(makePerson('p3', 'vac-2'))
}

describe('storage — basic persistence', () => {
  beforeEach(resetDatabase)

  it('saves and reads back a vacation', async () => {
    await vacationStorage.save(makeVacation('vac-1'))
    const stored = await vacationStorage.getById('vac-1')
    expect(stored?.name).toBe('Vacation vac-1')
  })

  it('getByVacationId only returns people of that vacation', async () => {
    await seed()
    const people = await peopleStorage.getByVacationId('vac-1')
    expect(people.map((person) => person.id).sort()).toEqual(['p1', 'p2'])
  })

  it('save overwrites an existing record instead of duplicating it', async () => {
    await vacationStorage.save(makeVacation('vac-1'))
    await vacationStorage.save({ ...makeVacation('vac-1'), name: 'Renamed' })
    const all = await vacationStorage.getAll()
    expect(all).toHaveLength(1)
    expect(all[0]?.name).toBe('Renamed')
  })
})

describe('storage — cascade delete', () => {
  beforeEach(resetDatabase)

  it('deletes the vacation itself', async () => {
    await seed()
    await vacationStorage.delete('vac-1')
    expect(await vacationStorage.getById('vac-1')).toBeUndefined()
  })

  it('deletes every person attached to the vacation', async () => {
    await seed()
    await vacationStorage.delete('vac-1')
    expect(await peopleStorage.getByVacationId('vac-1')).toHaveLength(0)
  })

  it('leaves other vacations and their people untouched', async () => {
    await seed()
    await vacationStorage.delete('vac-1')

    expect(await vacationStorage.getById('vac-2')).toBeDefined()
    const remaining = await peopleStorage.getAll()
    expect(remaining.map((person) => person.id)).toEqual(['p3'])
  })

  it('reports how many attached records were removed', async () => {
    await seed()
    const report = await deleteVacationCascade('vac-1')
    expect(report.people).toBe(2)
    expect(totalDeleted(report)).toBe(2)
  })

  it('leaves no orphan record behind', async () => {
    await seed()
    await vacationStorage.delete('vac-1')
    await vacationStorage.delete('vac-2')
    expect(await peopleStorage.getAll()).toHaveLength(0)
  })

  it('is a no-op for an unknown vacation', async () => {
    await seed()
    const report = await deleteVacationCascade('does-not-exist')
    expect(totalDeleted(report)).toBe(0)
    expect(await peopleStorage.getAll()).toHaveLength(3)
  })
})

describe('storage — orphan pruning', () => {
  beforeEach(resetDatabase)

  it('removes people whose vacation no longer exists', async () => {
    // Written directly: an orphan is exactly what the cascade prevents.
    await peopleStorage.save(makePerson('ghost', 'deleted-vacation'))
    const report = await pruneOrphanRecords()

    expect(report.people).toBe(1)
    expect(await peopleStorage.getAll()).toHaveLength(0)
  })

  it('keeps people whose vacation still exists', async () => {
    await seed()
    const report = await pruneOrphanRecords()

    expect(totalDeleted(report)).toBe(0)
    expect(await peopleStorage.getAll()).toHaveLength(3)
  })

  it('removes only the orphans, leaving valid records in place', async () => {
    await seed()
    await peopleStorage.save(makePerson('ghost', 'deleted-vacation'))

    const report = await pruneOrphanRecords()
    expect(report.people).toBe(1)

    const remaining = await peopleStorage.getAll()
    expect(remaining.map((person) => person.id).sort()).toEqual(['p1', 'p2', 'p3'])
  })
})
