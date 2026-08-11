// Tests: VacationForm component
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import VacationForm from '@/ui/components/VacationForm.vue'
import ConfirmDialog from '@/ui/components/ConfirmDialog.vue'
import { useVacationStore } from '@/stores/vacationStore'
import { globalPlugins } from './helpers'

vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

describe('VacationForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function mountForm() {
    return mount(VacationForm, { global: globalPlugins(), attachTo: document.body })
  }

  async function withActiveVacation() {
    const store = useVacationStore()
    await store.createVacation({ name: 'Summer', startDate: '2025-07-01', endDate: '2025-07-15' })
    return store
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

  it('renders a delete button for the vacation', () => {
    const wrapper = mountForm()
    expect(wrapper.find('.btn-danger').exists()).toBe(true)
    wrapper.unmount()
  })

  it('asks for confirmation before deleting', async () => {
    await withActiveVacation()
    const wrapper = mountForm()
    await wrapper.find('.btn-danger').trigger('click')
    expect(document.querySelector('.dialog')).not.toBeNull()
    wrapper.unmount()
  })

  it('deletes the vacation in cascade once confirmed', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    const store = await withActiveVacation()
    const wrapper = mountForm()

    await wrapper.find('.btn-danger').trigger('click')
    wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    await flushPromises()

    expect(vi.mocked(vacationStorage.delete)).toHaveBeenCalledOnce()
    expect(store.vacation).toBeNull()
    wrapper.unmount()
  })

  it('keeps the vacation and shows an error when the delete fails', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    const store = await withActiveVacation()
    vi.mocked(vacationStorage.delete).mockRejectedValueOnce(new Error('boom'))
    const wrapper = mountForm()

    await wrapper.find('.btn-danger').trigger('click')
    wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    await flushPromises()

    expect(store.vacation).not.toBeNull()
    expect(wrapper.find('.form-failure').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows an error when saving fails', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    vi.mocked(vacationStorage.save).mockRejectedValueOnce(new Error('boom'))
    const wrapper = mountForm()

    await wrapper.find('#vacation-name').setValue('Summer')
    await wrapper.find('#vacation-start').setValue('2025-07-01')
    await wrapper.find('#vacation-end').setValue('2025-07-15')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.form-failure').text().length).toBeGreaterThan(0)
    wrapper.unmount()
  })
})
