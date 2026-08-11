// Tests: ExpenseList component
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ExpenseList from '@/ui/components/ExpenseList.vue'
import ConfirmDialog from '@/ui/components/ConfirmDialog.vue'
import { useExpenseStore } from '@/stores/expenseStore'
import { usePeopleStore } from '@/stores/peopleStore'
import { useVacationStore } from '@/stores/vacationStore'
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

describe('ExpenseList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  async function withVacationAndPeople() {
    const vacationStore = useVacationStore()
    await vacationStore.createVacation({
      name: 'Summer',
      startDate: '2025-07-01',
      endDate: '2025-07-15',
    })
    usePeopleStore().people.push(makePerson('p1', 'Alice'), makePerson('p2', 'Bob'))
  }

  function mountList() {
    return mount(ExpenseList, { global: globalPlugins(), attachTo: document.body })
  }

  it('invites to add a person first when there is none', () => {
    const wrapper = mountList()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    // No payer can be picked, so adding an expense is not offered.
    expect(wrapper.find('.btn-primary').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows the empty state once people exist', async () => {
    await withVacationAndPeople()
    const wrapper = mountList()
    expect(wrapper.find('.btn-primary').exists()).toBe(true)
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    wrapper.unmount()
  })

  it('opens the form when the add button is clicked', async () => {
    await withVacationAndPeople()
    const wrapper = mountList()
    await wrapper.find('.btn-primary').trigger('click')
    expect(wrapper.find('.expense-form').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders a table with the payer name and formatted amount', async () => {
    await withVacationAndPeople()
    const expenseStore = useExpenseStore()
    await expenseStore.addExpense('vac-1', {
      payerId: 'p1',
      amountCents: 1250,
      label: 'Courses',
      date: '2025-07-02',
    })

    const wrapper = mountList()
    await flushPromises()

    expect(wrapper.find('.expense-table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Courses')
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('12')
    wrapper.unmount()
  })

  it('lists the most recent expense first', async () => {
    await withVacationAndPeople()
    const expenseStore = useExpenseStore()
    const base = { payerId: 'p1', amountCents: 100 }
    await expenseStore.addExpense('vac-1', { ...base, label: 'Ancienne', date: '2025-07-01' })
    await expenseStore.addExpense('vac-1', { ...base, label: 'Recente', date: '2025-07-10' })

    const wrapper = mountList()
    await flushPromises()

    const rows = wrapper.findAll('.expense-table tbody tr').map((row) => row.text())
    expect(rows[0]).toContain('Recente')
    expect(rows[1]).toContain('Ancienne')
    wrapper.unmount()
  })

  it('displays the total of the expenses', async () => {
    await withVacationAndPeople()
    const expenseStore = useExpenseStore()
    await expenseStore.addExpense('vac-1', {
      payerId: 'p1',
      amountCents: 1000,
      label: 'A',
      date: '2025-07-01',
    })
    await expenseStore.addExpense('vac-1', {
      payerId: 'p2',
      amountCents: 2050,
      label: 'B',
      date: '2025-07-02',
    })

    const wrapper = mountList()
    await flushPromises()

    expect(wrapper.find('.total').text()).toContain('30')
    wrapper.unmount()
  })

  it('persists a new expense through the store', async () => {
    const { expenseStorage } = await import('@/domains/storage/db')
    await withVacationAndPeople()
    const wrapper = mountList()

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.find('#expense-label').setValue('Restaurant')
    await wrapper.find('#expense-amount').setValue('42')
    await wrapper.find('.expense-form .btn-primary').trigger('click')
    await flushPromises()

    expect(vi.mocked(expenseStorage.save)).toHaveBeenCalled()
    expect(useExpenseStore().expenses).toHaveLength(1)
    wrapper.unmount()
  })

  it('deletes an expense once confirmed', async () => {
    await withVacationAndPeople()
    const expenseStore = useExpenseStore()
    await expenseStore.addExpense('vac-1', {
      payerId: 'p1',
      amountCents: 100,
      label: 'A',
      date: '2025-07-01',
    })

    const wrapper = mountList()
    await flushPromises()
    await wrapper.find('.expense-table .btn-danger').trigger('click')
    wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    await flushPromises()

    expect(expenseStore.expenses).toHaveLength(0)
    wrapper.unmount()
  })

  it('shows an error and keeps the form open when saving fails', async () => {
    const { expenseStorage } = await import('@/domains/storage/db')
    await withVacationAndPeople()
    vi.mocked(expenseStorage.save).mockRejectedValueOnce(new Error('boom'))
    const wrapper = mountList()

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.find('#expense-label').setValue('Restaurant')
    await wrapper.find('#expense-amount').setValue('42')
    await wrapper.find('.expense-form .btn-primary').trigger('click')
    await flushPromises()

    expect(wrapper.find('.list-failure').exists()).toBe(true)
    expect(wrapper.find('.expense-form').exists()).toBe(true)
    wrapper.unmount()
  })
})
