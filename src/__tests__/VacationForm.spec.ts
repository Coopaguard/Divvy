// Tests: VacationForm component
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import VacationForm from '@/ui/components/VacationForm.vue'
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

describe('VacationForm', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountForm() {
    return mount(VacationForm, { global: globalPlugins() })
  }

  it('renders the title input', () => {
    const wrapper = mountForm()
    expect(wrapper.find('#vacation-name').exists()).toBe(true)
  })

  it('renders start and end date inputs', () => {
    const wrapper = mountForm()
    expect(wrapper.find('#vacation-start').exists()).toBe(true)
    expect(wrapper.find('#vacation-end').exists()).toBe(true)
  })

  it('renders a save button', () => {
    const wrapper = mountForm()
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('shows validation errors when submitting empty form', async () => {
    const wrapper = mountForm()
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    const errors = wrapper.findAll('.field-error')
    expect(errors.length).toBeGreaterThan(0)
  })

  it('calls vacationStore.createVacation with valid data', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    const wrapper = mountForm()
    await wrapper.find('#vacation-name').setValue('Summer')
    await wrapper.find('#vacation-start').setValue('2025-07-01')
    await wrapper.find('#vacation-end').setValue('2025-07-15')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(vi.mocked(vacationStorage.save)).toHaveBeenCalled()
  })

  it('shows endBeforeStart error when end is before start', async () => {
    const wrapper = mountForm()
    await wrapper.find('#vacation-name').setValue('X')
    await wrapper.find('#vacation-start').setValue('2025-07-10')
    await wrapper.find('#vacation-end').setValue('2025-07-01')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    const errors = wrapper.findAll('.field-error')
    const messages = errors.map((e) => e.text())
    expect(messages.some((m) => m.length > 0)).toBe(true)
  })
})
