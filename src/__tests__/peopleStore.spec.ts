// Tests: peopleStore
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePeopleStore } from '@/stores/peopleStore'

vi.mock('@/domains/storage/db', () => ({
  vacationStorage: {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  peopleStorage: {
    getAll: vi.fn().mockResolvedValue([]),
    getByVacationId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

const draft = {
  name: 'Alice',
  shares: 1,
  arrivalDate: '2025-07-01',
  departureDate: '2025-07-10',
}

describe('peopleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initialises with empty people list', () => {
    const store = usePeopleStore()
    expect(store.people).toHaveLength(0)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('addPerson appends to people list', async () => {
    const store = usePeopleStore()
    const person = await store.addPerson('vac-1', draft)
    expect(store.people).toHaveLength(1)
    expect(person.name).toBe('Alice')
    expect(person.vacationId).toBe('vac-1')
    expect(typeof person.id).toBe('string')
  })

  it('updatePerson modifies existing person', async () => {
    const store = usePeopleStore()
    const person = await store.addPerson('vac-1', draft)
    await store.updatePerson(person.id, { ...draft, name: 'Bob', shares: 2 })
    expect(store.people[0]?.name).toBe('Bob')
    expect(store.people[0]?.shares).toBe(2)
  })

  it('updatePerson with unknown id does nothing', async () => {
    const store = usePeopleStore()
    await store.addPerson('vac-1', draft)
    await store.updatePerson('nonexistent', { ...draft, name: 'Ghost' })
    expect(store.people[0]?.name).toBe('Alice')
  })

  it('deletePerson removes person from list', async () => {
    const store = usePeopleStore()
    const person = await store.addPerson('vac-1', draft)
    await store.deletePerson(person.id)
    expect(store.people).toHaveLength(0)
  })

  it('clear() empties the list', async () => {
    const store = usePeopleStore()
    await store.addPerson('vac-1', draft)
    store.clear()
    expect(store.people).toHaveLength(0)
  })

  it('loadByVacation populates people from storage', async () => {
    const { peopleStorage } = await import('@/domains/storage/db')
    const stored = {
      id: 'p1',
      vacationId: 'vac-1',
      name: 'Stored',
      shares: 1,
      arrivalDate: '2025-07-01',
      departureDate: '2025-07-10',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }
    vi.mocked(peopleStorage.getByVacationId).mockResolvedValueOnce([stored])

    const store = usePeopleStore()
    await store.loadByVacation('vac-1')
    expect(store.people).toHaveLength(1)
    expect(store.people[0]?.name).toBe('Stored')
  })
})
