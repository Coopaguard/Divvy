// Tests: StepNav component — previous / next buttons
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import StepNav from '@/ui/components/StepNav.vue'
import { useVacationStore } from '@/stores/vacationStore'
import { globalPlugins, routerAt } from './helpers'
import type { Router } from 'vue-router'

vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

describe('StepNav', () => {
  beforeEach(() => setActivePinia(createPinia()))

  async function mountNav(stepName: string) {
    const router: Router = await routerAt(stepName)
    const wrapper = mount(StepNav, { global: globalPlugins('en', router) })
    return { wrapper, router }
  }

  async function selectVacation() {
    await useVacationStore().createVacation({
      name: 'Trip',
      startDate: '2025-07-01',
      endDate: '2025-07-15',
    })
  }

  function buttons(wrapper: ReturnType<typeof mount>) {
    const all = wrapper.findAll('button')
    return { previous: all[0]!, next: all[1]! }
  }

  it('always renders both buttons', async () => {
    const { wrapper } = await mountNav('vacations')
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('disables "previous" on the first step', async () => {
    const { wrapper } = await mountNav('vacations')
    expect(buttons(wrapper).previous.attributes('disabled')).toBeDefined()
  })

  it('disables "next" on the last step', async () => {
    await selectVacation()
    const { wrapper } = await mountNav('results')
    expect(buttons(wrapper).next.attributes('disabled')).toBeDefined()
  })

  it('disables "next" while no vacation is selected', async () => {
    const { wrapper } = await mountNav('vacations')
    expect(buttons(wrapper).next.attributes('disabled')).toBeDefined()
  })

  it('explains why "next" is blocked', async () => {
    const { wrapper } = await mountNav('vacations')
    expect(buttons(wrapper).next.attributes('title')).toBe('Pick a vacation first')
  })

  it('enables "next" once a vacation is selected', async () => {
    await selectVacation()
    const { wrapper } = await mountNav('vacations')
    expect(buttons(wrapper).next.attributes('disabled')).toBeUndefined()
  })

  it('moves forward to the following step', async () => {
    await selectVacation()
    const { wrapper, router } = await mountNav('people')
    await buttons(wrapper).next.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('expenses')
  })

  it('moves back to the previous step', async () => {
    await selectVacation()
    const { wrapper, router } = await mountNav('people')
    await buttons(wrapper).previous.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('vacations')
  })

  it('reacts to the selection being cleared', async () => {
    await selectVacation()
    const { wrapper } = await mountNav('vacations')
    expect(buttons(wrapper).next.attributes('disabled')).toBeUndefined()

    useVacationStore().clearSelection()
    await wrapper.vm.$nextTick()

    expect(buttons(wrapper).next.attributes('disabled')).toBeDefined()
  })
})
