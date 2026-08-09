// Tests: PeopleList component
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { usePeopleStore } from '@/stores/peopleStore'
import PeopleList from '@/ui/components/PeopleList.vue'
import { globalPlugins } from './helpers'

vi.mock('@/domains/storage/db', () => ({
  vacationStorage: {
    getAll: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  peopleStorage: {
    getByVacationId: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('PeopleList', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountList() {
    return mount(PeopleList, { global: globalPlugins() })
  }

  it('shows empty state when no people exist', () => {
    const wrapper = mountList()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })

  it('renders a table when people are present', () => {
    const wrapper = mountList()
    const store = usePeopleStore()
    store.people.push({
      id: 'p1',
      vacationId: 'v1',
      name: 'Alice',
      shares: 1,
      arrivalDate: '2025-07-01',
      departureDate: '2025-07-10',
      createdAt: '',
      updatedAt: '',
    })
    // trigger re-render
    return wrapper.vm.$nextTick().then(() => {
      expect(wrapper.find('.people-table').exists()).toBe(true)
      expect(wrapper.text()).toContain('Alice')
    })
  })

  it('shows the add-person form when add button is clicked', async () => {
    const wrapper = mountList()
    await wrapper.find('.btn-primary').trigger('click')
    expect(wrapper.find('.person-form').exists()).toBe(true)
  })

  it('hides the form when cancel is clicked inside PersonForm', async () => {
    const wrapper = mountList()
    await wrapper.find('.btn-primary').trigger('click')
    // PersonForm emits cancel via its cancel button
    await wrapper.find('.btn-secondary').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.person-form').exists()).toBe(false)
  })
})
