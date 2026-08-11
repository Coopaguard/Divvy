// Tests: ExpenseForm component
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ExpenseForm from '@/ui/components/ExpenseForm.vue'
import { usePeopleStore } from '@/stores/peopleStore'
import { globalPlugins } from './helpers'
import type { Expense } from '@/domains/expenses/types'
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

describe('ExpenseForm', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountForm(props: { expense?: Expense | null } = {}) {
    const peopleStore = usePeopleStore()
    peopleStore.people.push(makePerson('p1', 'Alice'), makePerson('p2', 'Bob'))
    return mount(ExpenseForm, { props, global: globalPlugins() })
  }

  it('renders payer, amount, label and date inputs', () => {
    const wrapper = mountForm()
    expect(wrapper.find('#expense-payer').exists()).toBe(true)
    expect(wrapper.find('#expense-amount').exists()).toBe(true)
    expect(wrapper.find('#expense-label').exists()).toBe(true)
    expect(wrapper.find('#expense-date').exists()).toBe(true)
  })

  it('lists every person as a possible payer', () => {
    const wrapper = mountForm()
    const options = wrapper.findAll('#expense-payer option').map((option) => option.text())
    expect(options).toEqual(['Alice', 'Bob'])
  })

  it('preselects the first person and today as date', () => {
    const wrapper = mountForm()
    expect((wrapper.find('#expense-payer').element as HTMLSelectElement).value).toBe('p1')
    const date = (wrapper.find('#expense-date').element as HTMLInputElement).value
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('shows validation errors when saving an empty form', async () => {
    const wrapper = mountForm()
    await wrapper.find('.btn-primary').trigger('click')
    expect(wrapper.findAll('.field-error').length).toBeGreaterThan(0)
    expect(wrapper.emitted('save')).toBeFalsy()
  })

  it('emits save with the amount converted to cents', async () => {
    const wrapper = mountForm()
    await wrapper.find('#expense-label').setValue('Courses')
    await wrapper.find('#expense-amount').setValue('12.50')
    await wrapper.find('#expense-date').setValue('2025-07-04')
    await wrapper.find('.btn-primary').trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      payerId: 'p1',
      amountCents: 1250,
      label: 'Courses',
      date: '2025-07-04',
    })
  })

  it('accepts a comma as decimal separator', async () => {
    const wrapper = mountForm()
    await wrapper.find('#expense-label').setValue('Essence')
    await wrapper.find('#expense-amount').setValue('30,05')
    await wrapper.find('.btn-primary').trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ amountCents: 3005 })
  })

  it.each([['abc'], ['-5'], ['12.345']])('rejects the invalid amount %s', async (amount) => {
    const wrapper = mountForm()
    await wrapper.find('#expense-label').setValue('X')
    await wrapper.find('#expense-amount').setValue(amount)
    await wrapper.find('.btn-primary').trigger('click')

    expect(wrapper.emitted('save')).toBeFalsy()
    expect(wrapper.findAll('.field-error').length).toBeGreaterThan(0)
  })

  it('rejects a zero amount', async () => {
    const wrapper = mountForm()
    await wrapper.find('#expense-label').setValue('X')
    await wrapper.find('#expense-amount').setValue('0')
    await wrapper.find('.btn-primary').trigger('click')

    expect(wrapper.emitted('save')).toBeFalsy()
  })

  it('trims the label before emitting', async () => {
    const wrapper = mountForm()
    await wrapper.find('#expense-label').setValue('  Courses  ')
    await wrapper.find('#expense-amount').setValue('10')
    await wrapper.find('.btn-primary').trigger('click')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ label: 'Courses' })
  })

  it('emits cancel when the cancel button is clicked', async () => {
    const wrapper = mountForm()
    await wrapper.find('.btn-secondary').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('prefills the fields when editing an expense', () => {
    const expense: Expense = {
      id: 'e1',
      vacationId: 'vac-1',
      payerId: 'p2',
      amountCents: 4200,
      label: 'Restaurant',
      date: '2025-07-08',
      createdAt: '',
      updatedAt: '',
    }
    const wrapper = mountForm({ expense })

    expect((wrapper.find('#expense-payer').element as HTMLSelectElement).value).toBe('p2')
    expect((wrapper.find('#expense-amount').element as HTMLInputElement).value).toBe('42.00')
    expect((wrapper.find('#expense-label').element as HTMLInputElement).value).toBe('Restaurant')
    expect((wrapper.find('#expense-date').element as HTMLInputElement).value).toBe('2025-07-08')
  })
})
