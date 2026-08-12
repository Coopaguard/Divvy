// Tests: StepTimeline component
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import StepTimeline from '@/ui/components/StepTimeline.vue'
import { useVacationStore } from '@/stores/vacationStore'
import { STEPS } from '@/domains/navigation/steps'
import { SERIES_COLORS } from '@/domains/shared/palette'
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
    expect(labels).toEqual(['Vacations', 'People', 'Expenses', 'Summary', 'Reimbursements'])
  })

  describe('colours', () => {
    it('gives every step its own hue', async () => {
      await selectVacation()
      const wrapper = await mountTimeline()

      const colours = wrapper
        .findAll('.timeline-step')
        .map((step) => step.attributes('style'))
      expect(new Set(colours).size).toBe(STEPS.length)
    })

    it('takes the hues from the shared palette, in order', async () => {
      await selectVacation()
      const wrapper = await mountTimeline()

      const first = wrapper.findAll('.timeline-step')[0]!.attributes('style')
      expect(first).toContain(SERIES_COLORS[0])
    })

    it('keeps a hue tied to its step, whatever the current step is', async () => {
      await selectVacation()
      const onStepOne = await mountTimeline('vacations')
      const onStepFour = await mountTimeline('results')

      const hueOf = (wrapper: typeof onStepOne, index: number) =>
        wrapper.findAll('.timeline-step')[index]!.attributes('style')

      expect(hueOf(onStepFour, 1)).toBe(hueOf(onStepOne, 1))
    })

    it('leaves the labels in ink rather than in the series colour', async () => {
      await selectVacation()
      const wrapper = await mountTimeline()
      // Three of these hues fall under 3:1 against the page, so no word or
      // figure may be painted with them.
      const label = wrapper.find('.step-label')
      expect(label.attributes('style')).toBeUndefined()
    })
  })

  describe('narrow screens', () => {
    it('names the current step in a caption, in full', async () => {
      await selectVacation()
      const wrapper = await mountTimeline('settlement')
      // Five long words cannot share one phone-width row; the caption carries
      // the name so the markers never have to chop it.
      expect(wrapper.find('.current-label').text()).toBe('Reimbursements')
    })

    it('follows the current step', async () => {
      await selectVacation()
      const wrapper = await mountTimeline('people')
      expect(wrapper.find('.current-label').text()).toBe('People')
    })
  })
})
