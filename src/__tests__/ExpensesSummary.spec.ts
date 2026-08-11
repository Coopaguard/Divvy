// Tests: ExpensesSummary component — total paid per person
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ExpensesSummary from '@/ui/components/ExpensesSummary.vue'
import { useExpenseStore } from '@/stores/expenseStore'
import { usePeopleStore } from '@/stores/peopleStore'
import { globalPlugins } from './helpers'
import type { Person } from '@/domains/people/types'

vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

function makePerson(id: string, name: string): Person {
  return {
    id,
    vacationId: 'vac-1',
    name,
    shares: 1,
    arrivalDate: '2025-07-01',
    departureDate: '2025-07-15',
    createdAt: '',
    updatedAt: '',
  }
}

function addExpense(payerId: string, amountCents: number) {
  return useExpenseStore().addExpense('vac-1', {
    payerId,
    amountCents,
    label: 'X',
    date: '2025-07-02',
  })
}

describe('ExpensesSummary', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountSummary() {
    return mount(ExpensesSummary, { global: globalPlugins() })
  }

  it('shows an empty state when there is no expense', () => {
    usePeopleStore().people.push(makePerson('p1', 'Alice'))
    const wrapper = mountSummary()

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.totals-table').exists()).toBe(false)
  })

  it('shows an empty state when there is no person', () => {
    const wrapper = mountSummary()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })

  it('lists the total paid by each person', async () => {
    usePeopleStore().people.push(makePerson('p1', 'Alice'), makePerson('p2', 'Bob'))
    await addExpense('p1', 1000)
    await addExpense('p1', 500)
    await addExpense('p2', 250)

    const wrapper = mountSummary()
    await flushPromises()

    const rows = wrapper.findAll('.totals-table tbody tr').map((row) => row.text())
    expect(rows).toHaveLength(2)
    expect(rows[0]).toContain('Alice')
    expect(rows[0]).toContain('15')
    expect(rows[1]).toContain('Bob')
    expect(rows[1]).toContain('2')
  })

  it('sorts by amount paid, highest first', async () => {
    usePeopleStore().people.push(
      makePerson('p1', 'Alice'),
      makePerson('p2', 'Bob'),
      makePerson('p3', 'Chloe'),
    )
    await addExpense('p1', 100)
    await addExpense('p2', 5000)
    await addExpense('p3', 900)

    const wrapper = mountSummary()
    await flushPromises()

    const names = wrapper
      .findAll('.totals-table tbody tr td:first-child')
      .map((cell) => cell.text())
    expect(names).toEqual(['Bob', 'Chloe', 'Alice'])
  })

  it('includes a person who paid nothing, at zero', async () => {
    usePeopleStore().people.push(makePerson('p1', 'Alice'), makePerson('p2', 'Bob'))
    await addExpense('p1', 1000)

    const wrapper = mountSummary()
    await flushPromises()

    const rows = wrapper.findAll('.totals-table tbody tr').map((row) => row.text())
    expect(rows).toHaveLength(2)
    expect(rows[1]).toContain('Bob')
    expect(rows[1]).toMatch(/0[.,]00/)
  })

  it('shows the overall total', async () => {
    usePeopleStore().people.push(makePerson('p1', 'Alice'), makePerson('p2', 'Bob'))
    await addExpense('p1', 1010)
    await addExpense('p2', 2020)

    const wrapper = mountSummary()
    await flushPromises()

    expect(wrapper.find('.total').text()).toContain('30')
  })

  it('updates when an expense is added', async () => {
    usePeopleStore().people.push(makePerson('p1', 'Alice'))
    const wrapper = mountSummary()
    expect(wrapper.find('.totals-table').exists()).toBe(false)

    await addExpense('p1', 4200)
    await flushPromises()

    expect(wrapper.find('.totals-table').exists()).toBe(true)
    expect(wrapper.find('.total').text()).toContain('42')
  })
})
