// Tests: RowActions — row actions, inline on desktop and behind "…" on phones
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import RowActions from '@/ui/components/RowActions.vue'
import { globalPlugins } from './helpers'

describe('RowActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function mountActions() {
    return mount(RowActions, { global: globalPlugins(), attachTo: document.body })
  }

  it('renders both actions in the open, for wide screens', () => {
    const wrapper = mountActions()
    expect(wrapper.find('.inline-actions .btn-secondary').exists()).toBe(true)
    expect(wrapper.find('.inline-actions .btn-danger').exists()).toBe(true)
  })

  it('renders a "…" trigger for phones', () => {
    const wrapper = mountActions()
    const trigger = wrapper.find('.menu-trigger')
    expect(trigger.exists()).toBe(true)
    expect(trigger.text()).toBe('…')
  })

  it('keeps the menu shut until asked', () => {
    expect(mountActions().find('.menu').exists()).toBe(false)
  })

  it('opens the menu with both actions', async () => {
    const wrapper = mountActions()
    await wrapper.find('.menu-trigger').trigger('click')
    expect(wrapper.findAll('.menu-item')).toHaveLength(2)
  })

  it('emits edit from the inline button', async () => {
    const wrapper = mountActions()
    await wrapper.find('.inline-actions .btn-secondary').trigger('click')
    expect(wrapper.emitted('edit')).toHaveLength(1)
  })

  it('emits delete from the inline button', async () => {
    const wrapper = mountActions()
    await wrapper.find('.inline-actions .btn-danger').trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('emits edit from the menu, and closes it', async () => {
    const wrapper = mountActions()
    await wrapper.find('.menu-trigger').trigger('click')
    await wrapper.findAll('.menu-item')[0]!.trigger('click')

    expect(wrapper.emitted('edit')).toHaveLength(1)
    expect(wrapper.find('.menu').exists()).toBe(false)
  })

  it('emits delete from the menu, and closes it', async () => {
    const wrapper = mountActions()
    await wrapper.find('.menu-trigger').trigger('click')
    await wrapper.findAll('.menu-item')[1]!.trigger('click')

    expect(wrapper.emitted('delete')).toHaveLength(1)
    expect(wrapper.find('.menu').exists()).toBe(false)
  })

  it('closes on a click outside without acting', async () => {
    const wrapper = mountActions()
    await wrapper.find('.menu-trigger').trigger('click')

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.menu').exists()).toBe(false)
    expect(wrapper.emitted('edit')).toBeUndefined()
    expect(wrapper.emitted('delete')).toBeUndefined()
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
