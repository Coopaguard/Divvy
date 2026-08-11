// Tests: VacationsView — choose, create or delete a vacation
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import VacationsView from '@/views/VacationsView.vue'
import ConfirmDialog from '@/ui/components/ConfirmDialog.vue'
import { useVacationStore } from '@/stores/vacationStore'
import { globalPlugins } from './helpers'

vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

describe('VacationsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function mountView() {
    return mount(VacationsView, { global: globalPlugins(), attachTo: document.body })
  }

  async function createVacation(name: string) {
    return useVacationStore().createVacation({
      name,
      startDate: '2025-07-01',
      endDate: '2025-07-15',
    })
  }

  it('shows an empty state when nothing is stored', () => {
    const wrapper = mountView()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.vacation-list').exists()).toBe(false)
  })

  it('opens the creation form on demand', async () => {
    const wrapper = mountView()
    expect(wrapper.find('form.new-form').exists()).toBe(false)

    await wrapper.find('.btn-primary').trigger('click')

    expect(wrapper.find('form.new-form').exists()).toBe(true)
  })

  it('shows validation errors on empty submit', async () => {
    const wrapper = mountView()
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.find('form.new-form').trigger('submit')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.field-error').length).toBeGreaterThan(0)
  })

  it('creates a vacation and closes the form', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    const wrapper = mountView()

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.find('#new-name').setValue('Beach Trip')
    await wrapper.find('#new-start').setValue('2025-08-01')
    await wrapper.find('#new-end').setValue('2025-08-15')
    await wrapper.find('form.new-form').trigger('submit')
    await flushPromises()

    expect(vi.mocked(vacationStorage.save)).toHaveBeenCalled()
    expect(wrapper.find('form.new-form').exists()).toBe(false)
    expect(useVacationStore().vacation?.name).toBe('Beach Trip')
  })

  it('cancelling the form clears what was typed', async () => {
    const wrapper = mountView()
    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.find('#new-name').setValue('Draft')
    await wrapper.find('.btn-secondary').trigger('click')
    await wrapper.vm.$nextTick()

    await wrapper.find('.btn-primary').trigger('click')
    expect((wrapper.find('#new-name').element as HTMLInputElement).value).toBe('')
  })

  it('lists the stored vacations', async () => {
    await createVacation('First')
    await createVacation('Second')
    const wrapper = mountView()

    expect(wrapper.findAll('.vacation-item')).toHaveLength(2)
  })

  it('selects a vacation when its row is clicked', async () => {
    const first = await createVacation('First')
    await createVacation('Second')
    const store = useVacationStore()
    const wrapper = mountView()

    const rows = wrapper.findAll('.vacation-choose')
    const target = rows.find((row) => row.text().includes('First'))!
    await target.trigger('click')

    expect(store.selectedId).toBe(first?.id)
  })

  it('marks the selected vacation', async () => {
    await createVacation('Only')
    const wrapper = mountView()
    expect(wrapper.find('.vacation-item.selected').exists()).toBe(true)
    expect(wrapper.find('.badge').exists()).toBe(true)
  })

  it('shows the edit form only when a vacation is selected', async () => {
    const wrapper = mountView()
    expect(wrapper.find('#vacation-name').exists()).toBe(false)

    await createVacation('Picked')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#vacation-name').exists()).toBe(true)
  })

  it('asks for confirmation before deleting', async () => {
    await createVacation('Doomed')
    const wrapper = mountView()

    await wrapper.find('.btn-danger').trigger('click')

    expect(document.querySelector('.dialog')).not.toBeNull()
    wrapper.unmount()
  })

  it('deletes the vacation in cascade once confirmed', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    const created = await createVacation('Doomed')
    const store = useVacationStore()
    const wrapper = mountView()

    await wrapper.find('.btn-danger').trigger('click')
    wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    await flushPromises()

    expect(vi.mocked(vacationStorage.delete)).toHaveBeenCalledWith(created?.id)
    expect(store.vacations).toHaveLength(0)
    expect(store.hasVacation).toBe(false)
    wrapper.unmount()
  })

  it('deleting a vacation other than the selected one keeps the selection', async () => {
    const other = await createVacation('Other')
    const selected = await createVacation('Selected')
    const store = useVacationStore()
    const wrapper = mountView()

    const rows = wrapper.findAll('.vacation-item')
    const otherRow = rows.find((row) => row.text().includes('Other'))!
    await otherRow.find('.btn-danger').trigger('click')
    wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    await flushPromises()

    expect(vi.mocked((await import('@/domains/storage/db')).vacationStorage.delete)).toHaveBeenCalledWith(
      other?.id,
    )
    expect(store.selectedId).toBe(selected?.id)
    wrapper.unmount()
  })

  it('keeps the vacation and reports the failure when the delete fails', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    await createVacation('Kept')
    const store = useVacationStore()
    vi.mocked(vacationStorage.delete).mockRejectedValueOnce(new Error('boom'))
    const wrapper = mountView()

    await wrapper.find('.btn-danger').trigger('click')
    wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    await flushPromises()

    expect(store.vacations).toHaveLength(1)
    expect(wrapper.find('.form-failure').exists()).toBe(true)
    wrapper.unmount()
  })

  it('reports a creation failure and keeps the form open', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    vi.mocked(vacationStorage.save).mockRejectedValueOnce(new Error('quota'))
    const wrapper = mountView()

    await wrapper.find('.btn-primary').trigger('click')
    await wrapper.find('#new-name').setValue('Doomed')
    await wrapper.find('#new-start').setValue('2025-08-01')
    await wrapper.find('#new-end').setValue('2025-08-15')
    await wrapper.find('form.new-form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.form-failure').exists()).toBe(true)
    expect(wrapper.find('form.new-form').exists()).toBe(true)
  })
})
