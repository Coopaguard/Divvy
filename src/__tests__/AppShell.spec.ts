// Tests: AppShell component — header, timeline and step navigation
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AppShell from '@/ui/layouts/AppShell.vue'
import StepTimeline from '@/ui/components/StepTimeline.vue'
import StepNav from '@/ui/components/StepNav.vue'
import LanguageMenu from '@/ui/components/LanguageMenu.vue'
import { useVacationStore } from '@/stores/vacationStore'
import { usePeopleStore } from '@/stores/peopleStore'
import { useExpenseStore } from '@/stores/expenseStore'
import { globalPlugins } from './helpers'

vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

describe('AppShell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  function mountShell(locale = 'en') {
    return mount(AppShell, {
      global: globalPlugins(locale),
      slots: { default: '<div id="slot-content">content</div>' },
    })
  }

  it('delegates the language choice to its own menu', () => {
    const wrapper = mountShell()
    expect(wrapper.findComponent(LanguageMenu).exists()).toBe(true)
  })

  it('renders slot content', () => {
    const wrapper = mountShell()
    expect(wrapper.find('#slot-content').exists()).toBe(true)
  })

  it('renders the step timeline above the content', () => {
    const wrapper = mountShell()
    expect(wrapper.findComponent(StepTimeline).exists()).toBe(true)
  })

  it('renders the previous / next buttons below the content', () => {
    const wrapper = mountShell()
    expect(wrapper.findComponent(StepNav).exists()).toBe(true)
  })

  it('falls back to the tagline while no vacation is selected', () => {
    const wrapper = mountShell('en')
    expect(wrapper.find('.vacation-title').text()).toBe('Easily split vacation expenses')
  })

  it('shows the selected vacation name as the page title', async () => {
    const wrapper = mountShell()
    await useVacationStore().createVacation({
      name: 'Corsica',
      startDate: '2025-07-01',
      endDate: '2025-07-15',
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.vacation-title').text()).toBe('Corsica')
  })

  it('loads the stored vacations on mount', async () => {
    const { vacationStorage } = await import('@/domains/storage/db')
    mountShell()
    await flushPromises()
    expect(vi.mocked(vacationStorage.getAll)).toHaveBeenCalled()
  })

  it('loads people and expenses of the vacation being selected', async () => {
    const { peopleStorage, expenseStorage } = await import('@/domains/storage/db')
    mountShell()
    const created = await useVacationStore().createVacation({
      name: 'Corsica',
      startDate: '2025-07-01',
      endDate: '2025-07-15',
    })
    await flushPromises()

    expect(vi.mocked(peopleStorage.getByVacationId)).toHaveBeenCalledWith(created?.id)
    expect(vi.mocked(expenseStorage.getByVacationId)).toHaveBeenCalledWith(created?.id)
  })

  it('empties the lists when the selection is cleared', async () => {
    mountShell()
    const store = useVacationStore()
    await store.createVacation({ name: 'C', startDate: '2025-07-01', endDate: '2025-07-15' })
    await flushPromises()

    store.clearSelection()
    await flushPromises()

    expect(usePeopleStore().people).toEqual([])
    expect(useExpenseStore().expenses).toEqual([])
  })
})
