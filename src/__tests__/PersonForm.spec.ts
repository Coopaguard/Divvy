// Tests: PersonForm component
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PersonForm from '@/ui/components/PersonForm.vue'
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

describe('PersonForm', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountForm(props: { person?: object | null } = {}) {
    return mount(PersonForm, { props, global: globalPlugins() })
  }

  it('renders name, shares, arrival and departure inputs', () => {
    const wrapper = mountForm()
    expect(wrapper.find('#person-name').exists()).toBe(true)
    expect(wrapper.find('#person-shares').exists()).toBe(true)
    expect(wrapper.find('#person-arrival').exists()).toBe(true)
    expect(wrapper.find('#person-departure').exists()).toBe(true)
  })

  it('shows validation errors when saving with empty fields', async () => {
    const wrapper = mountForm()
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()
    const errors = wrapper.findAll('.field-error')
    expect(errors.length).toBeGreaterThan(0)
  })

  it('emits save with draft when form is valid', async () => {
    const wrapper = mountForm()
    await wrapper.find('#person-name').setValue('Alice')
    await wrapper.find('#person-shares').setValue('1')
    await wrapper.find('#person-arrival').setValue('2025-07-01')
    await wrapper.find('#person-departure').setValue('2025-07-10')
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()
    const saveEvents = wrapper.emitted('save')
    expect(saveEvents).toBeTruthy()
    expect(saveEvents?.[0]?.[0]).toMatchObject({ name: 'Alice', shares: 1 })
  })

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mountForm()
    await wrapper.find('.btn-secondary').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('shows departure before arrival error', async () => {
    const wrapper = mountForm()
    await wrapper.find('#person-name').setValue('Bob')
    await wrapper.find('#person-arrival').setValue('2025-07-10')
    await wrapper.find('#person-departure').setValue('2025-07-01')
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.vm.$nextTick()
    const errors = wrapper.findAll('.field-error')
    expect(errors.length).toBeGreaterThan(0)
  })

  it('pre-fills fields when person prop is provided', () => {
    const person = {
      id: 'p1',
      vacationId: 'v1',
      name: 'Charlie',
      shares: 2,
      arrivalDate: '2025-08-01',
      departureDate: '2025-08-15',
      createdAt: '',
      updatedAt: '',
    }
    const wrapper = mountForm({ person })
    expect((wrapper.find('#person-name').element as HTMLInputElement).value).toBe('Charlie')
    expect((wrapper.find('#person-shares').element as HTMLInputElement).value).toBe('2')
  })
})
