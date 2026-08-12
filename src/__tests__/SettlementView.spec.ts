// Tests: SettlementView — shares table, presence option, transfers
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SettlementView from '@/views/SettlementView.vue'
import { useExpenseStore } from '@/stores/expenseStore'
import { usePeopleStore } from '@/stores/peopleStore'
import { useVacationStore } from '@/stores/vacationStore'
import { globalPlugins } from './helpers'
import type { Person } from '@/domains/people/types'

vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

function addPerson(id: string, name: string, shares = 1, arrival = '2025-07-01', departure = '2025-07-10') {
  const person: Person = {
    id,
    vacationId: 'vac-1',
    name,
    shares,
    arrivalDate: arrival,
    departureDate: departure,
    createdAt: '',
    updatedAt: '',
  }
  usePeopleStore().people.push(person)
}

function addExpense(payerId: string, amountCents: number, date = '2025-07-02') {
  return useExpenseStore().addExpense('vac-1', {
    payerId,
    amountCents,
    label: 'X',
    date,
  })
}

async function selectVacation() {
  return useVacationStore().createVacation({
    name: 'Trip',
    startDate: '2025-07-01',
    endDate: '2025-07-10',
  })
}

describe('SettlementView', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountView() {
    return mount(SettlementView, { global: globalPlugins() })
  }

  it('asks for people and expenses before computing anything', () => {
    const wrapper = mountView()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.settlement-table').exists()).toBe(false)
  })

  it('lists each person’s share and balance', async () => {
    await selectVacation()
    addPerson('p1', 'Alice')
    addPerson('p2', 'Bob')
    await addExpense('p1', 1000)

    const wrapper = mountView()
    await flushPromises()

    const rows = wrapper.findAll('.settlement-table tbody tr')
    expect(rows).toHaveLength(2)
    // Alice advanced 10 €, owes 5 € — she is owed 5 €.
    expect(rows[0]!.text()).toContain('Alice')
    expect(rows[0]!.find('.balance').text()).toContain('5')
    expect(rows[0]!.find('.balance').classes()).toContain('positive')
    expect(rows[1]!.find('.balance').classes()).toContain('negative')
  })

  it('weights the share by the number of shares', async () => {
    await selectVacation()
    addPerson('p1', 'Alice', 3)
    addPerson('p2', 'Bob', 1)
    await addExpense('p1', 1000)

    const wrapper = mountView()
    await flushPromises()

    // Name, shares, days, then the share owed.
    const owed = wrapper
      .findAll('.settlement-table tbody tr')
      .map((row) => row.findAll('td')[3]!.text())
    expect(owed[0]).toContain('7.50')
    expect(owed[1]).toContain('2.50')
  })

  it('lists the payments to make', async () => {
    await selectVacation()
    addPerson('p1', 'Alice')
    addPerson('p2', 'Bob')
    await addExpense('p1', 1000)

    const wrapper = mountView()
    await flushPromises()

    const transfers = wrapper.findAll('.transfer')
    expect(transfers).toHaveLength(1)
    expect(transfers[0]!.find('.transfer-from').text()).toBe('Bob')
    expect(transfers[0]!.find('.transfer-to').text()).toBe('Alice')
    expect(transfers[0]!.find('.transfer-amount').text()).toContain('5')
  })

  it('says so when nobody owes anything', async () => {
    await selectVacation()
    addPerson('p1', 'Alice')
    addPerson('p2', 'Bob')
    await addExpense('p1', 1000)
    await addExpense('p2', 1000)

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.all-square').exists()).toBe(true)
    expect(wrapper.findAll('.transfer')).toHaveLength(0)
  })

  it('keeps the payments down to one per person at most', async () => {
    await selectVacation()
    for (const [id, name] of [['p1', 'A'], ['p2', 'B'], ['p3', 'C'], ['p4', 'D']]) {
      addPerson(id!, name!)
    }
    await addExpense('p1', 10000)
    await addExpense('p2', 2000)

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.findAll('.transfer').length).toBeLessThanOrEqual(3)
  })

  describe('split method', () => {
    const select = 'select#split-method'

    it('offers the three methods, simplest first', async () => {
      await selectVacation()
      addPerson('p1', 'Alice')
      await addExpense('p1', 1000)

      const wrapper = mountView()
      await flushPromises()

      const values = wrapper.findAll(`${select} option`).map((o) => o.attributes('value'))
      expect(values).toEqual(['shares', 'shareDays', 'presence'])
    })

    it('starts on the by-expense method, the truest to what happened', async () => {
      await selectVacation()
      addPerson('p1', 'Alice')
      await addExpense('p1', 1000)

      const wrapper = mountView()
      await flushPromises()

      expect((wrapper.find(select).element as HTMLSelectElement).value).toBe('presence')
      expect(wrapper.text()).toContain('Days')
    })

    it('drops the days column on the simple method, which ignores dates', async () => {
      await selectVacation()
      addPerson('p1', 'Alice')
      await addExpense('p1', 1000)

      const wrapper = mountView()
      await flushPromises()

      await wrapper.find(select).setValue('shares')
      await flushPromises()

      expect(wrapper.text()).not.toContain('Days')
    })

    it('explains the chosen method in words', async () => {
      await selectVacation()
      addPerson('p1', 'Alice')
      await addExpense('p1', 1000)

      const wrapper = mountView()
      await flushPromises()
      const presence = wrapper.find('.method-info').text()

      await wrapper.find(select).setValue('shares')
      await flushPromises()

      const simple = wrapper.find('.method-info').text()
      expect(simple).not.toBe(presence)
      // Long enough to actually describe the rule, not a one-line label.
      expect(presence.split(/\s+/).length).toBeGreaterThan(30)
    })

    it('spreads the total over shares and days under the by-day method', async () => {
      await selectVacation()
      addPerson('p1', 'Alice', 1, '2025-07-01', '2025-07-10') // 10 days
      addPerson('p2', 'Bob', 1, '2025-07-06', '2025-07-10') //  5 days
      await addExpense('p1', 3000)

      const wrapper = mountView()
      await flushPromises()
      await wrapper.find(select).setValue('shareDays')
      await flushPromises()

      // 15 share-days for 30 → 2 a day: Alice 20, Bob 10.
      const rows = wrapper.findAll('.settlement-table tbody tr')
      expect(rows[0]!.findAll('td')[3]!.text()).toContain('20')
      expect(rows[1]!.findAll('td')[3]!.text()).toContain('10')
    })

    it('spares someone an expense made after they left, under the by-expense method', async () => {
      await selectVacation()
      addPerson('p1', 'Alice', 1, '2025-07-01', '2025-07-10')
      addPerson('p2', 'Bob', 1, '2025-07-01', '2025-07-02')
      await addExpense('p1', 3000, '2025-07-03')

      const wrapper = mountView()
      await flushPromises()
      await wrapper.find(select).setValue('presence')
      await flushPromises()

      const rows = wrapper.findAll('.settlement-table tbody tr')
      const bob = rows.find((row) => row.text().includes('Bob'))!
      expect(bob.find('.balance').text()).toMatch(/0[.,]00/)
      expect(wrapper.findAll('.transfer')).toHaveLength(0)
    })

    it('shows the days column for both day-based methods', async () => {
      await selectVacation()
      addPerson('p1', 'Alice')
      await addExpense('p1', 1000)

      const wrapper = mountView()
      await flushPromises()

      for (const method of ['shareDays', 'presence']) {
        await wrapper.find(select).setValue(method)
        await flushPromises()
        expect(wrapper.text()).toContain('Days')
      }
    })

    it('shows what one share costs per day, under the by-day method only', async () => {
      await selectVacation()
      addPerson('p1', 'Alice', 1, '2025-07-01', '2025-07-10') // 10 share-days
      addPerson('p2', 'Bob', 1, '2025-07-06', '2025-07-10') //   5
      await addExpense('p1', 3000)

      const wrapper = mountView()
      await flushPromises()
      await wrapper.find(select).setValue('shares')
      await flushPromises()
      expect(wrapper.find('.rate').exists()).toBe(false)

      await wrapper.find(select).setValue('shareDays')
      await flushPromises()

      // 15 share-days for 30 → 2 a day.
      expect(wrapper.find('.rate-value').text()).toContain('2.00')
      expect(wrapper.find('.rate-units').text()).toContain('15')
    })

    it('gives no single rate under the by-expense method — there is none', async () => {
      await selectVacation()
      addPerson('p1', 'Alice')
      await addExpense('p1', 3000)

      const wrapper = mountView()
      await flushPromises()
      await wrapper.find(select).setValue('presence')
      await flushPromises()

      expect(wrapper.find('.rate').exists()).toBe(false)
    })

    it('gives each person their own rate under the by-expense method', async () => {
      await selectVacation()
      // Alice stays for both expenses, Bob only for the first. Same shares,
      // different rates — which is the whole point of showing one per person.
      addPerson('p1', 'Alice', 1, '2025-07-01', '2025-07-02')
      addPerson('p2', 'Bob', 1, '2025-07-01', '2025-07-01')
      await addExpense('p1', 1000, '2025-07-01')
      await addExpense('p1', 1000, '2025-07-02')

      const wrapper = mountView()
      await flushPromises()

      const rates = wrapper
        .findAll('.settlement-table tbody tr')
        .map((row) => row.find('.rate-cell').text())

      // Alice: 5 + 10 = 15 over 2 days. Bob: 5 over 1 day.
      expect(rates).toEqual(expect.arrayContaining([expect.stringMatching(/7[.,]50/)]))
      expect(rates).toEqual(expect.arrayContaining([expect.stringMatching(/5[.,]00/)]))
    })

    it('shows no per-person rate under the two group-wide methods', async () => {
      await selectVacation()
      addPerson('p1', 'Alice')
      await addExpense('p1', 3000)

      const wrapper = mountView()
      await flushPromises()

      for (const method of ['shares', 'shareDays']) {
        await wrapper.find(select).setValue(method)
        await flushPromises()
        expect(wrapper.find('.rate-cell').exists()).toBe(false)
      }
    })

    it('says the rate is rounded, so nobody reads it as a contradiction', async () => {
      await selectVacation()
      addPerson('p1', 'Alice', 1, '2025-07-01', '2025-07-03') // 3 share-days
      await addExpense('p1', 1000)

      const wrapper = mountView()
      await flushPromises()
      await wrapper.find(select).setValue('shareDays')
      await flushPromises()

      // 10 over 3 never falls on a round number of cents.
      expect(wrapper.find('.rate .rate-note').text().length).toBeGreaterThan(0)
    })

    it('stores the choice on the vacation so it survives a reload', async () => {
      const { vacationStorage } = await import('@/domains/storage/db')
      const created = await selectVacation()
      addPerson('p1', 'Alice')
      await addExpense('p1', 1000)

      const wrapper = mountView()
      await flushPromises()
      await wrapper.find(select).setValue('shareDays')
      await flushPromises()

      expect(useVacationStore().splitMethod).toBe('shareDays')
      expect(vi.mocked(vacationStorage.save)).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: created?.id, splitMethod: 'shareDays' }),
      )
    })

    it('reports a failure to save the choice', async () => {
      const { vacationStorage } = await import('@/domains/storage/db')
      await selectVacation()
      addPerson('p1', 'Alice')
      await addExpense('p1', 1000)

      const wrapper = mountView()
      await flushPromises()

      vi.mocked(vacationStorage.save).mockRejectedValueOnce(new Error('quota'))
      // Something other than the current method, or there is nothing to save.
      await wrapper.find(select).setValue('shareDays')
      await flushPromises()

      expect(wrapper.find('.form-failure').exists()).toBe(true)
    })

    it('starts on the method the vacation was saved with', async () => {
      const store = useVacationStore()
      await selectVacation()
      await store.setSplitMethod('presence')
      addPerson('p1', 'Alice')
      await addExpense('p1', 1000)

      const wrapper = mountView()
      await flushPromises()

      expect((wrapper.find(select).element as HTMLSelectElement).value).toBe('presence')
    })
  })
})
