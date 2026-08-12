// Tests: RowActions — row actions, inline on desktop and behind "…" on phones
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import RowActions from '@/ui/components/RowActions.vue'
import { globalPlugins } from './helpers'

const ACTIONS = [
  { key: 'edit', label: 'Edit' },
  { key: 'export', label: 'Export' },
  { key: 'delete', label: 'Delete', danger: true },
]

describe('RowActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function mountActions(actions = ACTIONS) {
    return mount(RowActions, {
      props: { actions, label: 'Actions' },
      global: globalPlugins(),
      attachTo: document.body,
    })
  }

  it('renders every action in the open, for wide screens', () => {
    const labels = mountActions()
      .findAll('.inline-actions button')
      .map((button) => button.text())
    expect(labels).toEqual(['Edit', 'Export', 'Delete'])
  })

  it('marks a destructive action apart', () => {
    const wrapper = mountActions()
    const destructive = wrapper.findAll('.inline-actions button').filter((b) => b.text() === 'Delete')
    expect(destructive[0]!.classes()).toContain('btn-danger')
  })

  it('renders a "…" trigger for phones', () => {
    const trigger = mountActions().find('.menu-trigger')
    expect(trigger.exists()).toBe(true)
    expect(trigger.text()).toBe('…')
  })

  it('keeps the menu shut until asked', () => {
    expect(mountActions().find('.menu').exists()).toBe(false)
  })

  it('opens the menu with the same actions', async () => {
    const wrapper = mountActions()
    await wrapper.find('.menu-trigger').trigger('click')
    expect(wrapper.findAll('.menu-item').map((item) => item.text())).toEqual([
      'Edit',
      'Export',
      'Delete',
    ])
  })

  it('emits the key of an inline action', async () => {
    const wrapper = mountActions()
    await wrapper.findAll('.inline-actions button')[1]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['export']])
  })

  it('emits the key from the menu, and closes it', async () => {
    const wrapper = mountActions()
    await wrapper.find('.menu-trigger').trigger('click')
    await wrapper.findAll('.menu-item')[2]!.trigger('click')

    expect(wrapper.emitted('select')).toEqual([['delete']])
    expect(wrapper.find('.menu').exists()).toBe(false)
  })

  it('adapts to a shorter action list', () => {
    const wrapper = mountActions([{ key: 'only', label: 'Only' }])
    expect(wrapper.findAll('.inline-actions button')).toHaveLength(1)
  })

  it('closes on a click outside without acting', async () => {
    const wrapper = mountActions()
    await wrapper.find('.menu-trigger').trigger('click')

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.menu').exists()).toBe(false)
    expect(wrapper.emitted('select')).toBeUndefined()
    wrapper.unmount()
  })

  it('closes on Escape', async () => {
    const wrapper = mountActions()
    await wrapper.find('.menu-trigger').trigger('click')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.menu').exists()).toBe(false)
    wrapper.unmount()
  })

  it('labels the trigger, which shows only an ellipsis', () => {
    const trigger = mountActions().find('.menu-trigger')
    expect(trigger.attributes('aria-label')).toBe('Actions')
    expect(trigger.attributes('aria-haspopup')).toBe('menu')
  })
})
