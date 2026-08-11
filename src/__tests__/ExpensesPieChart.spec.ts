// Tests: ExpensesPieChart component
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ExpensesPieChart from '@/ui/components/ExpensesPieChart.vue'
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

function addPeople(...names: string[]) {
  const store = usePeopleStore()
  names.forEach((name, index) => store.people.push(makePerson(`p${index + 1}`, name)))
}

describe('ExpensesPieChart', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountChart() {
    return mount(ExpensesPieChart, { global: globalPlugins() })
  }

  it('renders nothing without expenses', () => {
    addPeople('Alice')
    expect(mountChart().find('.chart').exists()).toBe(false)
  })

  it('draws one slice per payer', async () => {
    addPeople('Alice', 'Bob')
    await addExpense('p1', 6000)
    await addExpense('p2', 4000)

    const wrapper = mountChart()
    await flushPromises()

    expect(wrapper.findAll('.pie path')).toHaveLength(2)
    expect(wrapper.findAll('.legend-row')).toHaveLength(2)
  })

  it('draws a full disc for a lone payer, which no arc could describe', async () => {
    addPeople('Alice', 'Bob')
    await addExpense('p1', 5000)

    const wrapper = mountChart()
    await flushPromises()

    expect(wrapper.find('.pie circle').exists()).toBe(true)
    expect(wrapper.findAll('.pie path')).toHaveLength(0)
  })

  it('leaves out the people who paid nothing', async () => {
    addPeople('Alice', 'Bob')
    await addExpense('p1', 5000)

    const wrapper = mountChart()
    await flushPromises()

    expect(wrapper.findAll('.legend-row')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Bob')
  })

  it('orders the slices from the largest share down', async () => {
    addPeople('Alice', 'Bob', 'Chloe')
    await addExpense('p1', 1000)
    await addExpense('p2', 5000)
    await addExpense('p3', 3000)

    const wrapper = mountChart()
    await flushPromises()

    const names = wrapper.findAll('.legend-label').map((node) => node.text())
    expect(names).toEqual(['Bob', 'Chloe', 'Alice'])
  })

  it('shows the share and the amount as text, not colour alone', async () => {
    addPeople('Alice', 'Bob')
    await addExpense('p1', 7500)
    await addExpense('p2', 2500)

    const wrapper = mountChart()
    await flushPromises()

    const row = wrapper.findAll('.legend-row')[0]!
    expect(row.find('.legend-percent').text()).toBe('75%')
    expect(row.find('.legend-amount').text()).toContain('75')
  })

  it('makes the percentages add up to exactly 100', async () => {
    addPeople('Alice', 'Bob', 'Chloe')
    // Three equal shares: 33.33 each, which naive rounding renders as 99 %.
    await addExpense('p1', 1000)
    await addExpense('p2', 1000)
    await addExpense('p3', 1000)

    const wrapper = mountChart()
    await flushPromises()

    const percents = wrapper
      .findAll('.legend-percent')
      .map((node) => Number.parseInt(node.text(), 10))
    expect(percents).toEqual([34, 33, 33])
    expect(percents.reduce((sum, value) => sum + value, 0)).toBe(100)
  })

  it('keeps a hue tied to the person, not to their rank', async () => {
    addPeople('Alice', 'Bob')
    await addExpense('p1', 1000) // Alice behind
    await addExpense('p2', 5000)

    const wrapper = mountChart()
    await flushPromises()

    const colourOf = (name: string) =>
      wrapper
        .findAll('.legend-row')
        .find((row) => row.find('.legend-label').text() === name)!
        .find('.legend-swatch')
        .attributes('style')

    const aliceBefore = colourOf('Alice')

    // Alice overtakes Bob — her colour must not follow the new ranking.
    await addExpense('p1', 9000)
    await flushPromises()

    expect(wrapper.findAll('.legend-label')[0]!.text()).toBe('Alice')
    expect(colourOf('Alice')).toBe(aliceBefore)
  })

  it('folds the tail into a single "others" slice past six payers', async () => {
    addPeople('A', 'B', 'C', 'D', 'E', 'F', 'G')
    for (let index = 1; index <= 7; index += 1) {
      await addExpense(`p${index}`, index * 1000)
    }

    const wrapper = mountChart()
    await flushPromises()

    // Five named payers plus the folded bucket — never more than six slices.
    expect(wrapper.findAll('.legend-row')).toHaveLength(6)
    expect(wrapper.findAll('.pie path')).toHaveLength(6)
    expect(wrapper.text()).toContain('others')
  })

  it('keeps the folded slice worth the sum of what it hides', async () => {
    addPeople('A', 'B', 'C', 'D', 'E', 'F', 'G')
    for (let index = 1; index <= 7; index += 1) {
      await addExpense(`p${index}`, 1000)
    }

    const wrapper = mountChart()
    await flushPromises()

    // Seven equal payers: five keep a slice, so the bucket holds the last two
    // — 20 € of the 70 € total.
    const rows = wrapper.findAll('.legend-row')
    const last = rows[rows.length - 1]!
    expect(last.find('.legend-amount').text()).toContain('20')
    expect(last.find('.legend-label').text()).toContain('2 others')
  })

  it('describes itself for a screen reader', async () => {
    addPeople('Alice', 'Bob')
    await addExpense('p1', 7500)
    await addExpense('p2', 2500)

    const wrapper = mountChart()
    await flushPromises()

    const svg = wrapper.find('.pie')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toContain('Alice 75%')
    expect(svg.attributes('aria-label')).toContain('Bob 25%')
  })

  it('separates neighbouring fills with a surface-coloured gap', async () => {
    addPeople('Alice', 'Bob')
    await addExpense('p1', 5000)
    await addExpense('p2', 5000)

    const wrapper = mountChart()
    await flushPromises()

    const slice = wrapper.find('.pie path')
    expect(slice.attributes('stroke')).toBe('var(--bg-page)')
    expect(slice.attributes('stroke-width')).toBe('2')
  })

  it('sweeps the large-arc flag once a slice passes half the circle', async () => {
    addPeople('Alice', 'Bob')
    await addExpense('p1', 9000)
    await addExpense('p2', 1000)

    const wrapper = mountChart()
    await flushPromises()

    const [major, minor] = wrapper.findAll('.pie path')
    expect(major!.attributes('d')).toContain('A 40 40 0 1 1')
    expect(minor!.attributes('d')).toContain('A 40 40 0 0 1')
  })
})
