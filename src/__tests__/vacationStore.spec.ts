// Tests: vacationStore
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVacationStore } from '@/stores/vacationStore'

// Mock the storage layer so tests don't need IndexedDB
vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

describe('vacationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initialises with no vacation', () => {
    const store = useVacationStore()
    expect(store.vacation).toBeNull()
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

  it('updateVacation updates the current vacation', async () => {
    const store = useVacationStore()
    await store.createVacation({ name: 'Old', startDate: '2025-06-01', endDate: '2025-06-10' })
    await store.updateVacation({ name: 'New', startDate: '2025-06-01', endDate: '2025-06-15' })
    expect(store.vacation?.name).toBe('New')
    expect(store.vacation?.endDate).toBe('2025-06-15')
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
    expect(store.hasVacation).toBe(false)
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
    expect(store.error).toBe('delete failed')
  })

  it('loadFromStorage sets vacation from persisted data', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    const stored = {
      id: 'abc',
      name: 'Stored',
      startDate: '2025-03-01',
      endDate: '2025-03-10',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    }
    vi.mocked(vacationStorage.getAll).mockResolvedValueOnce([stored])

    const store = useVacationStore()
    await store.loadFromStorage()
    expect(store.vacation?.id).toBe('abc')
    expect(store.vacation?.name).toBe('Stored')
  })
})
