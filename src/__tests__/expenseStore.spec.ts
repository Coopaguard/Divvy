// Tests: expenseStore
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExpenseStore } from '@/stores/expenseStore'

vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

const draft = {
  payerId: 'p1',
  amountCents: 1250,
  label: 'Courses',
  date: '2025-07-02',
}

describe('expenseStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('initialises empty', () => {
    const store = useExpenseStore()
    expect(store.expenses).toHaveLength(0)
    expect(store.totalCents).toBe(0)
    expect(store.error).toBeNull()
  })

  it('addExpense appends and returns the expense', async () => {
    const store = useExpenseStore()
    const expense = await store.addExpense('vac-1', draft)

    expect(store.expenses).toHaveLength(1)
    expect(expense?.label).toBe('Courses')
    expect(expense?.vacationId).toBe('vac-1')
    expect(expense?.amountCents).toBe(1250)
  })

  it('updateExpense modifies an existing expense', async () => {
    const store = useExpenseStore()
    const expense = await store.addExpense('vac-1', draft)
    await store.updateExpense(expense!.id, { ...draft, amountCents: 999, label: 'Essence' })

    expect(store.expenses[0]?.label).toBe('Essence')
    expect(store.expenses[0]?.amountCents).toBe(999)
  })

  it('updateExpense with an unknown id does nothing', async () => {
    const store = useExpenseStore()
    await store.addExpense('vac-1', draft)
    expect(await store.updateExpense('nope', draft)).toBe(false)
    expect(store.expenses[0]?.label).toBe('Courses')
  })

  it('deleteExpense removes it from the list', async () => {
    const store = useExpenseStore()
    const expense = await store.addExpense('vac-1', draft)
    await store.deleteExpense(expense!.id)
    expect(store.expenses).toHaveLength(0)
  })

  it('totalCents sums the amounts', async () => {
    const store = useExpenseStore()
    await store.addExpense('vac-1', { ...draft, amountCents: 1010 })
    await store.addExpense('vac-1', { ...draft, amountCents: 2020 })
    expect(store.totalCents).toBe(3030)
  })

  it('totalByPayer groups amounts per payer', async () => {
    const store = useExpenseStore()
    await store.addExpense('vac-1', { ...draft, payerId: 'p1', amountCents: 1000 })
    await store.addExpense('vac-1', { ...draft, payerId: 'p1', amountCents: 500 })
    await store.addExpense('vac-1', { ...draft, payerId: 'p2', amountCents: 250 })

    expect(store.totalByPayer.get('p1')).toBe(1500)
    expect(store.totalByPayer.get('p2')).toBe(250)
  })

  it('sortedExpenses lists the most recent first', async () => {
    const store = useExpenseStore()
    await store.addExpense('vac-1', { ...draft, date: '2025-07-01', label: 'A' })
    await store.addExpense('vac-1', { ...draft, date: '2025-07-10', label: 'B' })
    await store.addExpense('vac-1', { ...draft, date: '2025-07-05', label: 'C' })

    expect(store.sortedExpenses.map((expense) => expense.label)).toEqual(['B', 'C', 'A'])
  })

  it('countByPayer counts the expenses a person paid', async () => {
    const store = useExpenseStore()
    await store.addExpense('vac-1', { ...draft, payerId: 'p1' })
    await store.addExpense('vac-1', { ...draft, payerId: 'p1' })
    await store.addExpense('vac-1', { ...draft, payerId: 'p2' })

    expect(store.countByPayer('p1')).toBe(2)
    expect(store.countByPayer('p2')).toBe(1)
    expect(store.countByPayer('ghost')).toBe(0)
  })

  it('removeByPayer drops the expenses of that person only', async () => {
    const store = useExpenseStore()
    await store.addExpense('vac-1', { ...draft, payerId: 'p1' })
    await store.addExpense('vac-1', { ...draft, payerId: 'p2' })

    store.removeByPayer('p1')
    expect(store.expenses).toHaveLength(1)
    expect(store.expenses[0]?.payerId).toBe('p2')
  })

  it('does not add the expense when the write fails', async () => {
    const { expenseStorage } = await import('@/domains/storage/db')
    vi.mocked(expenseStorage.save).mockRejectedValueOnce(new Error('write failed'))

    const store = useExpenseStore()
    const expense = await store.addExpense('vac-1', draft)

    expect(expense).toBeNull()
    expect(store.expenses).toHaveLength(0)
    expect(store.error).toBe('write failed')
    expect(store.loading).toBe(false)
  })

  it('keeps the expense when the delete fails', async () => {
    const { expenseStorage } = await import('@/domains/storage/db')
    const store = useExpenseStore()
    const expense = await store.addExpense('vac-1', draft)
    vi.mocked(expenseStorage.delete).mockRejectedValueOnce(new Error('delete failed'))

    expect(await store.deleteExpense(expense!.id)).toBe(false)
    expect(store.expenses).toHaveLength(1)
    expect(store.error).toBe('delete failed')
  })

  it('loadByVacation populates from storage', async () => {
    const { expenseStorage } = await import('@/domains/storage/db')
    vi.mocked(expenseStorage.getByVacationId).mockResolvedValueOnce([
      {
        id: 'e1',
        vacationId: 'vac-1',
        payerId: 'p1',
        amountCents: 4200,
        label: 'Stored',
        date: '2025-07-03',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ])

    const store = useExpenseStore()
    await store.loadByVacation('vac-1')

    expect(store.expenses).toHaveLength(1)
    expect(store.totalCents).toBe(4200)
  })
})
