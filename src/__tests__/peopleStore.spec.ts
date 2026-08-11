// Tests: peopleStore
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePeopleStore } from '@/stores/peopleStore'

vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

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
    expect(person?.name).toBe('Alice')
    expect(person?.vacationId).toBe('vac-1')
    expect(typeof person?.id).toBe('string')
  })

  it('updatePerson modifies existing person', async () => {
    const store = usePeopleStore()
    const person = await store.addPerson('vac-1', draft)
    await store.updatePerson(person!.id, { ...draft, name: 'Bob', shares: 2 })
    expect(store.people[0]?.name).toBe('Bob')
    expect(store.people[0]?.shares).toBe(2)
  })

  it('updatePerson with unknown id does nothing', async () => {
    const store = usePeopleStore()
    await store.addPerson('vac-1', draft)
    const updated = await store.updatePerson('nonexistent', { ...draft, name: 'Ghost' })
    expect(updated).toBe(false)
    expect(store.people[0]?.name).toBe('Alice')
  })

  it('deletePerson removes person from list', async () => {
    const store = usePeopleStore()
    const person = await store.addPerson('vac-1', draft)
    await store.deletePerson(person!.id)
    expect(store.people).toHaveLength(0)
  })

  it('clear() empties the list', async () => {
    const store = usePeopleStore()
    await store.addPerson('vac-1', draft)
    store.clear()
    expect(store.people).toHaveLength(0)
  })

  it('does not add the person when the write fails', async () => {
    const { peopleStorage } = await import('@/domains/storage/db')
    vi.mocked(peopleStorage.save).mockRejectedValueOnce(new Error('write failed'))

    const store = usePeopleStore()
    const person = await store.addPerson('vac-1', draft)

    expect(person).toBeNull()
    expect(store.people).toHaveLength(0)
    expect(store.error).toBe('write failed')
    expect(store.loading).toBe(false)
  })

  it('keeps the person in the list when the delete fails', async () => {
    const { peopleStorage } = await import('@/domains/storage/db')
    const store = usePeopleStore()
    const person = await store.addPerson('vac-1', draft)
    vi.mocked(peopleStorage.delete).mockRejectedValueOnce(new Error('delete failed'))

    expect(await store.deletePerson(person!.id)).toBe(false)
    expect(store.people).toHaveLength(1)
    expect(store.error).toBe('delete failed')
  })

  it('deleting a person drops the expenses they paid from memory too', async () => {
    const { useExpenseStore } = await import('@/stores/expenseStore')
    const expenseStore = useExpenseStore()
    const store = usePeopleStore()
    const person = await store.addPerson('vac-1', draft)

    await expenseStore.addExpense('vac-1', {
      payerId: person!.id,
      amountCents: 500,
      label: 'Sienne',
      date: '2025-07-02',
    })
    await expenseStore.addExpense('vac-1', {
      payerId: 'someone-else',
      amountCents: 900,
      label: "D'un autre",
      date: '2025-07-03',
    })

    await store.deletePerson(person!.id)

    // Storage cascades; the in-memory list must follow, and only for that payer.
    expect(expenseStore.expenses.map((expense) => expense.label)).toEqual(["D'un autre"])
  })

  it('leaves the list empty when loading fails', async () => {
    const { peopleStorage } = await import('@/domains/storage/db')
    vi.mocked(peopleStorage.getByVacationId).mockRejectedValueOnce(new Error('read failed'))

    const store = usePeopleStore()
    await store.loadByVacation('vac-1')

    expect(store.people).toHaveLength(0)
    expect(store.error).toBe('read failed')
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
