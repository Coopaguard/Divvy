// Shared storage mock — keeps store and component tests off IndexedDB.
// Used through `vi.mock('@/domains/storage/db', ...)`; the real storage layer
// is exercised for real in db.spec.ts.

import { vi } from 'vitest'
import type { Expense } from '@/domains/expenses/types'
import type { Person } from '@/domains/people/types'
import type { Vacation } from '@/domains/vacations/types'
import type { CascadeReport } from '@/domains/storage/db'

export const EMPTY_CASCADE_REPORT: CascadeReport = { people: 0, expenses: 0 }

/** Builds a fresh set of storage mocks mirroring the real module's exports. */
export function createStorageMock() {
  return {
    vacationStorage: {
      getAll: vi.fn<() => Promise<Vacation[]>>().mockResolvedValue([]),
      getById: vi.fn<(id: string) => Promise<Vacation | undefined>>().mockResolvedValue(undefined),
      save: vi.fn<(vacation: Vacation) => Promise<void>>().mockResolvedValue(undefined),
      delete: vi
        .fn<(id: string) => Promise<CascadeReport>>()
        .mockResolvedValue(EMPTY_CASCADE_REPORT),
    },
    peopleStorage: {
      getAll: vi.fn<() => Promise<Person[]>>().mockResolvedValue([]),
      getByVacationId: vi.fn<(vacationId: string) => Promise<Person[]>>().mockResolvedValue([]),
      save: vi.fn<(person: Person) => Promise<void>>().mockResolvedValue(undefined),
      // Cascades to the expenses paid by that person; resolves with their count.
      delete: vi.fn<(id: string) => Promise<number>>().mockResolvedValue(0),
    },
    expenseStorage: {
      getAll: vi.fn<() => Promise<Expense[]>>().mockResolvedValue([]),
      getByVacationId: vi.fn<(vacationId: string) => Promise<Expense[]>>().mockResolvedValue([]),
      getByPayerId: vi.fn<(payerId: string) => Promise<Expense[]>>().mockResolvedValue([]),
      save: vi.fn<(expense: Expense) => Promise<void>>().mockResolvedValue(undefined),
      delete: vi.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined),
    },
    deletePersonCascade: vi.fn<(id: string) => Promise<number>>().mockResolvedValue(0),
    pruneOrphanRecords: vi
      .fn<() => Promise<CascadeReport>>()
      .mockResolvedValue(EMPTY_CASCADE_REPORT),
    closeDB: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  }
}
