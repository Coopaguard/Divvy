// Tests: VacationForm component — editing the selected vacation
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import VacationForm from '@/ui/components/VacationForm.vue'
import { useVacationStore } from '@/stores/vacationStore'
import { globalPlugins } from './helpers'

vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

describe('VacationForm', () => {
  beforeEach(() => setActivePinia(createPinia()))

  async function withSelectedVacation() {
    const store = useVacationStore()
    await store.createVacation({ name: 'Summer', startDate: '2025-07-01', endDate: '2025-07-15' })
    return store
  }

  function mountForm() {
    return mount(VacationForm, { global: globalPlugins() })
  }

  it('renders the title and date inputs', async () => {
    await withSelectedVacation()
    const wrapper = mountForm()
    expect(wrapper.find('#vacation-name').exists()).toBe(true)
    expect(wrapper.find('#vacation-start').exists()).toBe(true)
    expect(wrapper.find('#vacation-end').exists()).toBe(true)
  })

  it('prefills the fields with the selected vacation', async () => {
    await withSelectedVacation()
    const wrapper = mountForm()
    expect((wrapper.find('#vacation-name').element as HTMLInputElement).value).toBe('Summer')
    expect((wrapper.find('#vacation-start').element as HTMLInputElement).value).toBe('2025-07-01')
  })

  it('renders a save button', async () => {
    await withSelectedVacation()
    const wrapper = mountForm()
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('no longer offers deletion — that lives in the vacation list', async () => {
    await withSelectedVacation()
    const wrapper = mountForm()
    expect(wrapper.find('.btn-danger').exists()).toBe(false)
  })

  it('shows validation errors when submitting an emptied form', async () => {
    await withSelectedVacation()
    const wrapper = mountForm()
    await wrapper.find('#vacation-name').setValue('')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.field-error').length).toBeGreaterThan(0)
  })

  it('shows endBeforeStart error when end is before start', async () => {
    await withSelectedVacation()
    const wrapper = mountForm()
    await wrapper.find('#vacation-start').setValue('2025-07-10')
    await wrapper.find('#vacation-end').setValue('2025-07-01')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.field-error').length).toBeGreaterThan(0)
  })

  it('saves the edit to the selected vacation', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    const store = await withSelectedVacation()
    const wrapper = mountForm()

    await wrapper.find('#vacation-name').setValue('Autumn')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(vi.mocked(vacationStorage.save)).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: store.selectedId, name: 'Autumn' }),
    )
    expect(store.vacation?.name).toBe('Autumn')
  })

  it('shows an error when saving fails', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    await withSelectedVacation()
    const wrapper = mountForm()

    vi.mocked(vacationStorage.save).mockRejectedValueOnce(new Error('boom'))
    await wrapper.find('#vacation-name').setValue('Autumn')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.form-failure').text().length).toBeGreaterThan(0)
  })

  it('follows the store when another vacation is selected', async () => {
    const store = await withSelectedVacation()
    const other = await store.createVacation({
      name: 'Winter',
      startDate: '2025-12-01',
      endDate: '2025-12-20',
    })
    const wrapper = mountForm()

    store.select(other!.id)
    await flushPromises()

    expect((wrapper.find('#vacation-name').element as HTMLInputElement).value).toBe('Winter')
  })
})
