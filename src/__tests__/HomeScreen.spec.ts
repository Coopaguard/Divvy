// Tests: HomeScreen component
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import HomeScreen from '@/ui/components/HomeScreen.vue'
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

describe('HomeScreen', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountScreen() {
    return mount(HomeScreen, { global: globalPlugins() })
  }

  it('renders the app name', () => {
    const wrapper = mountScreen()
    expect(wrapper.find('.app-name').text()).toBe('Divvy')
  })

  it('shows "New vacation" button by default', () => {
    const wrapper = mountScreen()
    expect(wrapper.find('.btn-primary').exists()).toBe(true)
  })

  it('shows the creation form after clicking new button', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.btn-primary').trigger('click')
    expect(wrapper.find('form.new-form').exists()).toBe(true)
  })

  it('hides the form and returns to landing after cancel', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.find('.btn-secondary').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('form.new-form').exists()).toBe(false)
    expect(wrapper.find('.home-actions').exists()).toBe(true)
  })

  it('shows validation errors on empty submit', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.find('form.new-form').trigger('submit')
    await wrapper.vm.$nextTick()
    const errors = wrapper.findAll('.field-error')
    expect(errors.length).toBeGreaterThan(0)
  })

  it('calls createVacation with valid data', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    const wrapper = mountScreen()
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.find('#new-name').setValue('Beach Trip')
    await wrapper.find('#new-start').setValue('2025-08-01')
    await wrapper.find('#new-end').setValue('2025-08-15')
    await wrapper.find('form.new-form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(vi.mocked(vacationStorage.save)).toHaveBeenCalled()
  })
})
