// Tests: LanguageMenu — the flags grouped under one trigger
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import LanguageMenu from '@/ui/components/LanguageMenu.vue'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { globalPlugins } from './helpers'

describe('LanguageMenu', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.body.innerHTML = ''
  })

  function mountMenu(locale = 'en') {
    return mount(LanguageMenu, { global: globalPlugins(locale), attachTo: document.body })
  }

  it('shows only the active language until opened', () => {
    const wrapper = mountMenu('en')
    expect(wrapper.find('.lang-trigger').text()).toContain('🇬🇧')
    expect(wrapper.find('.lang-list').exists()).toBe(false)
  })

  it('opens the list of languages', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.lang-trigger').trigger('click')

    const options = wrapper.findAll('.lang-option').map((option) => option.text())
    expect(options.some((text) => text.includes('🇫🇷'))).toBe(true)
    expect(options.some((text) => text.includes('🇬🇧'))).toBe(true)
  })

  it('names each language, so the flag is not the only clue', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.lang-trigger').trigger('click')

    const names = wrapper.findAll('.lang-name').map((node) => node.text())
    expect(names).toEqual(['Français', 'English'])
  })

  it('marks the active language', async () => {
    const wrapper = mountMenu('en')
    await wrapper.find('.lang-trigger').trigger('click')

    const active = wrapper.find('.lang-option.active')
    expect(active.text()).toContain('English')
    expect(active.attributes('aria-checked')).toBe('true')
  })

  it('switches the language and persists it', async () => {
    const wrapper = mountMenu('en')
    await wrapper.find('.lang-trigger').trigger('click')

    const french = wrapper.findAll('.lang-option').find((o) => o.text().includes('Français'))!
    await french.trigger('click')

    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('fr')
    expect(wrapper.find('.lang-trigger').text()).toContain('🇫🇷')
  })

  it('closes once a language is picked', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.lang-trigger').trigger('click')
    await wrapper.findAll('.lang-option')[0]!.trigger('click')

    expect(wrapper.find('.lang-list').exists()).toBe(false)
  })

  it('closes on a click outside', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.lang-trigger').trigger('click')
    expect(wrapper.find('.lang-list').exists()).toBe(true)

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.lang-list').exists()).toBe(false)
    wrapper.unmount()
  })

  it('closes on Escape', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.lang-trigger').trigger('click')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.lang-list').exists()).toBe(false)
    wrapper.unmount()
  })

  it('announces its state to assistive tech', async () => {
    const wrapper = mountMenu()
    const trigger = wrapper.find('.lang-trigger')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(trigger.attributes('aria-haspopup')).toBe('menu')

    await trigger.trigger('click')
    expect(wrapper.find('.lang-trigger').attributes('aria-expanded')).toBe('true')
  })

  it('stops listening once unmounted', () => {
    const wrapper = mountMenu()
    wrapper.unmount()

    // Listeners left on `document` would reach into a torn-down component.
    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    }).not.toThrow()
  })
})
