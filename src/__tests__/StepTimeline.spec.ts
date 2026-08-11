// Tests: StepTimeline component
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import StepTimeline from '@/ui/components/StepTimeline.vue'
import { useVacationStore } from '@/stores/vacationStore'
import { STEPS } from '@/domains/navigation/steps'
import { globalPlugins, routerAt } from './helpers'

vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

describe('StepTimeline', () => {
  beforeEach(() => setActivePinia(createPinia()))

  async function mountTimeline(stepName = 'vacations') {
    const router = await routerAt(stepName)
    return mount(StepTimeline, { global: globalPlugins('en', router) })
  }

  async function selectVacation() {
    await useVacationStore().createVacation({
      name: 'Trip',
      startDate: '2025-07-01',
      endDate: '2025-07-15',
    })
  }

  it('renders every step of the journey', async () => {
    const wrapper = await mountTimeline()
    expect(wrapper.findAll('.timeline-step')).toHaveLength(STEPS.length)
  })

  it('numbers the steps in order', async () => {
    const wrapper = await mountTimeline()
    const markers = wrapper.findAll('.step-marker').map((node) => node.text())
    expect(markers).toEqual(['1', '2', '3', '4', '5'])
  })

  it('greys out the later steps while no vacation is selected', async () => {
    const wrapper = await mountTimeline()
    const locked = wrapper.findAll('.timeline-step.locked')
    expect(locked).toHaveLength(STEPS.length - 1)
    // Only the vacation choice is open at that point.
    expect(wrapper.findAll('.timeline-step')[0]!.classes()).not.toContain('locked')
  })

  it('renders no link for a locked step, so it cannot be clicked', async () => {
    const wrapper = await mountTimeline()
    expect(wrapper.findAll('a.step-link')).toHaveLength(1)
    expect(wrapper.findAll('span.step-link')).toHaveLength(STEPS.length - 1)
  })

  it('unlocks every step once a vacation is selected', async () => {
    await selectVacation()
    const wrapper = await mountTimeline()
    expect(wrapper.findAll('.timeline-step.locked')).toHaveLength(0)
    expect(wrapper.findAll('a.step-link')).toHaveLength(STEPS.length)
  })

  it('locks the steps again when the selection is cleared', async () => {
    await selectVacation()
    const wrapper = await mountTimeline()
    expect(wrapper.findAll('.timeline-step.locked')).toHaveLength(0)

    useVacationStore().clearSelection()
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.timeline-step.locked')).toHaveLength(STEPS.length - 1)
  })

  it('marks the current step', async () => {
    await selectVacation()
    const wrapper = await mountTimeline('expenses')
    const current = wrapper.find('.timeline-step.current')
    expect(current.text()).toContain('Expenses')
    expect(current.find('[aria-current="step"]').exists()).toBe(true)
  })

  it('marks the steps already walked through as done', async () => {
    await selectVacation()
    const wrapper = await mountTimeline('expenses')
    expect(wrapper.findAll('.timeline-step.done')).toHaveLength(2)
  })

  it('labels the steps with the section vocabulary', async () => {
    await selectVacation()
    const wrapper = await mountTimeline()
    const labels = wrapper.findAll('.step-label').map((node) => node.text())
    expect(labels).toEqual(['Vacations', 'People', 'Expenses', 'Split', 'Reimbursements'])
  })
})
