// Tests: vacationStore
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVacationStore } from '@/stores/vacationStore'
import type { Vacation } from '@/domains/vacations/types'

// Mock the storage layer so tests don't need IndexedDB
vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

function storedVacation(id: string, updatedAt: string): Vacation {
  return {
    id,
    name: `Vacation ${id}`,
    startDate: '2025-03-01',
    endDate: '2025-03-10',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt,
  }
}

describe('vacationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initialises with no vacation', () => {
    const store = useVacationStore()
    expect(store.vacation).toBeNull()
    expect(store.vacations).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('hasVacation() returns false when no vacation is set', () => {
    const store = useVacationStore()
    expect(store.hasVacation).toBe(false)
  })

  it('createVacation sets vacation and returns it', async () => {
    const store = useVacationStore()
    const draft = { name: 'Summer', startDate: '2025-07-01', endDate: '2025-07-15' }
    const result = await store.createVacation(draft)
    expect(result?.name).toBe('Summer')
    expect(result?.startDate).toBe('2025-07-01')
    expect(result?.endDate).toBe('2025-07-15')
    expect(typeof result?.id).toBe('string')
    expect(store.vacation).not.toBeNull()
    expect(store.hasVacation).toBe(true)
  })

  it('createVacation adds to the list and selects the new one', async () => {
    const store = useVacationStore()
    const first = await store.createVacation({
      name: 'First',
      startDate: '2025-01-01',
      endDate: '2025-01-10',
    })
    const second = await store.createVacation({
      name: 'Second',
      startDate: '2025-02-01',
      endDate: '2025-02-10',
    })

    expect(store.vacations).toHaveLength(2)
    expect(store.selectedId).toBe(second?.id)
    expect(store.vacation?.name).toBe('Second')
    expect(first?.id).not.toBe(second?.id)
  })

  it('updateVacation updates the current vacation', async () => {
    const store = useVacationStore()
    await store.createVacation({ name: 'Old', startDate: '2025-06-01', endDate: '2025-06-10' })
    await store.updateVacation({ name: 'New', startDate: '2025-06-01', endDate: '2025-06-15' })
    expect(store.vacation?.name).toBe('New')
    expect(store.vacation?.endDate).toBe('2025-06-15')
  })

  it('updateVacation leaves the other vacations untouched', async () => {
    const store = useVacationStore()
    const kept = await store.createVacation({
      name: 'Kept',
      startDate: '2025-01-01',
      endDate: '2025-01-10',
    })
    await store.createVacation({ name: 'Edited', startDate: '2025-02-01', endDate: '2025-02-10' })
    await store.updateVacation({ name: 'Renamed', startDate: '2025-02-01', endDate: '2025-02-10' })

    expect(store.vacations.find((item) => item.id === kept?.id)?.name).toBe('Kept')
    expect(store.vacation?.name).toBe('Renamed')
  })

  it('updateVacation does nothing when there is no vacation', async () => {
    const store = useVacationStore()
    const updated = await store.updateVacation({
      name: 'X',
      startDate: '2025-01-01',
      endDate: '2025-01-10',
    })
    expect(updated).toBe(false)
    expect(store.vacation).toBeNull()
  })

  it('deleteVacation clears the current vacation', async () => {
    const store = useVacationStore()
    await store.createVacation({ name: 'Del', startDate: '2025-01-01', endDate: '2025-01-10' })
    await store.deleteVacation()
    expect(store.vacation).toBeNull()
    expect(store.vacations).toEqual([])
    expect(store.hasVacation).toBe(false)
  })

  it('deleteVacation removes a vacation by id without touching the selection', async () => {
    const store = useVacationStore()
    const other = await store.createVacation({
      name: 'Other',
      startDate: '2025-01-01',
      endDate: '2025-01-10',
    })
    const selected = await store.createVacation({
      name: 'Selected',
      startDate: '2025-02-01',
      endDate: '2025-02-10',
    })

    expect(await store.deleteVacation(other?.id)).toBe(true)
    expect(store.vacations).toHaveLength(1)
    expect(store.selectedId).toBe(selected?.id)
    expect(store.hasVacation).toBe(true)
  })

  it('deleteVacation asks storage to delete, which cascades to attached records', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    const store = useVacationStore()
    const created = await store.createVacation({
      name: 'Del',
      startDate: '2025-01-01',
      endDate: '2025-01-10',
    })
    await store.deleteVacation()
    expect(vi.mocked(vacationStorage.delete)).toHaveBeenCalledWith(created?.id)
  })

  it('deleteVacation does nothing when there is no vacation', async () => {
    const store = useVacationStore()
    expect(await store.deleteVacation()).toBe(false)
  })

  it('loadFromStorage prunes orphan records left by earlier versions', async () => {
    const { pruneOrphanRecords } = await import('@/domains/storage/db')
    const store = useVacationStore()
    await store.loadFromStorage()
    expect(vi.mocked(pruneOrphanRecords)).toHaveBeenCalled()
  })

  it('captures a storage failure instead of throwing', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    vi.mocked(vacationStorage.save).mockRejectedValueOnce(new Error('quota exceeded'))

    const store = useVacationStore()
    const created = await store.createVacation({
      name: 'Fails',
      startDate: '2025-01-01',
      endDate: '2025-01-10',
    })

    expect(created).toBeNull()
    expect(store.vacation).toBeNull()
    expect(store.vacations).toEqual([])
    expect(store.error).toBe('quota exceeded')
    expect(store.loading).toBe(false)
  })

  it('keeps the vacation active when the cascade delete fails', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    const store = useVacationStore()
    await store.createVacation({ name: 'Keep', startDate: '2025-01-01', endDate: '2025-01-10' })
    vi.mocked(vacationStorage.delete).mockRejectedValueOnce(new Error('delete failed'))

    expect(await store.deleteVacation()).toBe(false)
    expect(store.vacation).not.toBeNull()
    expect(store.vacations).toHaveLength(1)
    expect(store.error).toBe('delete failed')
  })

  describe('selection', () => {
    it('loadFromStorage lists the stored vacations without selecting one', async () => {
      const { vacationStorage } = await import('@/domains/storage/db')
      vi.mocked(vacationStorage.getAll).mockResolvedValueOnce([
        storedVacation('abc', '2025-01-02T00:00:00.000Z'),
      ])

      const store = useVacationStore()
      await store.loadFromStorage()

      expect(store.vacations).toHaveLength(1)
      // The journey starts on the choice: nothing is picked for the user.
      expect(store.vacation).toBeNull()
      expect(store.hasVacation).toBe(false)
    })

    it('select activates a loaded vacation', async () => {
      const { vacationStorage } = await import('@/domains/storage/db')
      vi.mocked(vacationStorage.getAll).mockResolvedValueOnce([
        storedVacation('abc', '2025-01-02T00:00:00.000Z'),
      ])

      const store = useVacationStore()
      await store.loadFromStorage()

      expect(store.select('abc')).toBe(true)
      expect(store.vacation?.id).toBe('abc')
      expect(store.hasVacation).toBe(true)
    })

    it('select ignores an unknown id', () => {
      const store = useVacationStore()
      expect(store.select('nope')).toBe(false)
      expect(store.hasVacation).toBe(false)
    })

    it('clearSelection locks the later steps again', async () => {
      const store = useVacationStore()
      await store.createVacation({ name: 'S', startDate: '2025-01-01', endDate: '2025-01-10' })
      expect(store.hasVacation).toBe(true)

      store.clearSelection()
      expect(store.hasVacation).toBe(false)
      // The vacation itself is untouched — only the selection was dropped.
      expect(store.vacations).toHaveLength(1)
    })

    it('drops a selection whose vacation vanished from storage', async () => {
      const { vacationStorage } = await import('@/domains/storage/db')
      const store = useVacationStore()
      await store.createVacation({ name: 'Gone', startDate: '2025-01-01', endDate: '2025-01-10' })
      expect(store.hasVacation).toBe(true)

      // Deleted elsewhere (another tab) — the reload must not keep pointing at it.
      vi.mocked(vacationStorage.getAll).mockResolvedValueOnce([])
      await store.loadFromStorage()

      expect(store.hasVacation).toBe(false)
      expect(store.selectedId).toBeNull()
    })

    it('sortedVacations lists the most recently updated first', async () => {
      const { vacationStorage } = await import('@/domains/storage/db')
      vi.mocked(vacationStorage.getAll).mockResolvedValueOnce([
        storedVacation('old', '2025-01-01T00:00:00.000Z'),
        storedVacation('recent', '2025-06-01T00:00:00.000Z'),
        storedVacation('middle', '2025-03-01T00:00:00.000Z'),
      ])

      const store = useVacationStore()
      await store.loadFromStorage()

      expect(store.sortedVacations.map((item) => item.id)).toEqual(['recent', 'middle', 'old'])
    })
  })
})
