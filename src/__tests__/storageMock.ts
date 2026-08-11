// Shared storage mock — keeps store and component tests off IndexedDB.
// Used through `vi.mock('@/domains/storage/db', ...)`; the real storage layer
// is exercised for real in db.spec.ts.

import { vi } from 'vitest'
import type { Person } from '@/domains/people/types'
import type { Vacation } from '@/domains/vacations/types'
import type { CascadeReport } from '@/domains/storage/db'

export const EMPTY_CASCADE_REPORT: CascadeReport = { people: 0 }

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
      delete: vi.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined),
    },
    pruneOrphanRecords: vi
      .fn<() => Promise<CascadeReport>>()
      .mockResolvedValue(EMPTY_CASCADE_REPORT),
    closeDB: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  }
}
