// Tests: IndexedDB storage layer — cascade delete and orphan pruning.
// These run against a real IndexedDB implementation (fake-indexeddb), not mocks.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  closeDB,
  deletePersonCascade,
  deleteVacationCascade,
  expenseStorage,
  peopleStorage,
  pruneOrphanRecords,
  totalDeleted,
  vacationStorage,
} from '@/domains/storage/db'
import type { Expense } from '@/domains/expenses/types'
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

function makeExpense(id: string, vacationId: string, payerId: string): Expense {
  return {
    id,
    vacationId,
    payerId,
    amountCents: 1250,
    label: `Expense ${id}`,
    date: '2025-07-05',
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

/**
 * vac-1: p1 (2 expenses) and p2 (1 expense).
 * vac-2: p3 (1 expense).
 */
async function seed(): Promise<void> {
  await vacationStorage.save(makeVacation('vac-1'))
  await vacationStorage.save(makeVacation('vac-2'))
  await peopleStorage.save(makePerson('p1', 'vac-1'))
  await peopleStorage.save(makePerson('p2', 'vac-1'))
  await peopleStorage.save(makePerson('p3', 'vac-2'))
  await expenseStorage.save(makeExpense('e1', 'vac-1', 'p1'))
  await expenseStorage.save(makeExpense('e2', 'vac-1', 'p1'))
  await expenseStorage.save(makeExpense('e3', 'vac-1', 'p2'))
  await expenseStorage.save(makeExpense('e4', 'vac-2', 'p3'))
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
    expect(report.expenses).toBe(3)
    expect(totalDeleted(report)).toBe(5)
  })

  it('deletes the expenses of the vacation too', async () => {
    await seed()
    await vacationStorage.delete('vac-1')
    expect(await expenseStorage.getByVacationId('vac-1')).toHaveLength(0)
  })

  it('leaves no orphan record behind', async () => {
    await seed()
    await vacationStorage.delete('vac-1')
    await vacationStorage.delete('vac-2')
    expect(await peopleStorage.getAll()).toHaveLength(0)
    expect(await expenseStorage.getAll()).toHaveLength(0)
  })

  it('is a no-op for an unknown vacation', async () => {
    await seed()
    const report = await deleteVacationCascade('does-not-exist')
    expect(totalDeleted(report)).toBe(0)
    expect(await peopleStorage.getAll()).toHaveLength(3)
    expect(await expenseStorage.getAll()).toHaveLength(4)
  })
})

describe('storage — cascade delete of a person', () => {
  beforeEach(resetDatabase)

  it('deletes the person', async () => {
    await seed()
    await peopleStorage.delete('p1')
    const remaining = await peopleStorage.getByVacationId('vac-1')
    expect(remaining.map((person) => person.id)).toEqual(['p2'])
  })

  it('deletes the expenses that person paid, and only those', async () => {
    await seed()
    const deleted = await deletePersonCascade('p1')

    expect(deleted).toBe(2)
    const remaining = await expenseStorage.getAll()
    expect(remaining.map((expense) => expense.id).sort()).toEqual(['e3', 'e4'])
  })

  it('is a no-op for a person with no expense', async () => {
    await vacationStorage.save(makeVacation('vac-1'))
    await peopleStorage.save(makePerson('solo', 'vac-1'))

    expect(await deletePersonCascade('solo')).toBe(0)
    expect(await peopleStorage.getAll()).toHaveLength(0)
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

  it('removes expenses whose payer no longer exists', async () => {
    await vacationStorage.save(makeVacation('vac-1'))
    await expenseStorage.save(makeExpense('ghost', 'vac-1', 'deleted-person'))

    const report = await pruneOrphanRecords()
    expect(report.expenses).toBe(1)
    expect(await expenseStorage.getAll()).toHaveLength(0)
  })

  it('removes the expenses of a person who is itself pruned', async () => {
    // The person is orphaned by their vacation; their expenses must not survive
    // the same pass just because the payer still existed when it started.
    await peopleStorage.save(makePerson('ghost', 'deleted-vacation'))
    await expenseStorage.save(makeExpense('e-ghost', 'deleted-vacation', 'ghost'))

    const report = await pruneOrphanRecords()
    expect(totalDeleted(report)).toBe(2)
    expect(await expenseStorage.getAll()).toHaveLength(0)
    expect(await peopleStorage.getAll()).toHaveLength(0)
  })

  it('keeps records whose owners still exist', async () => {
    await seed()
    const report = await pruneOrphanRecords()

    expect(totalDeleted(report)).toBe(0)
    expect(await peopleStorage.getAll()).toHaveLength(3)
    expect(await expenseStorage.getAll()).toHaveLength(4)
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
