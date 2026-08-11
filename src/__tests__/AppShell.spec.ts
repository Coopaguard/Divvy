// Tests: AppShell component — language selector
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AppShell from '@/ui/layouts/AppShell.vue'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { globalPlugins } from './helpers'

vi.mock('@/domains/storage/db', async () => (await import('./storageMock')).createStorageMock())

describe('AppShell — language selector', () => {
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

  it('renders the flag buttons in the side nav', () => {
    const wrapper = mountShell()
    const langBtns = wrapper.findAll('.lang-btn')
    expect(langBtns.length).toBeGreaterThanOrEqual(2)
  })

  it('shows the French flag button', () => {
    const wrapper = mountShell()
    const flags = wrapper.findAll('.lang-btn').map((b) => b.text())
    expect(flags).toContain('🇫🇷')
  })

  it('shows the English flag button', () => {
    const wrapper = mountShell()
    const flags = wrapper.findAll('.lang-btn').map((b) => b.text())
    expect(flags).toContain('🇬🇧')
  })

  it('marks the active locale button with "active" class', () => {
    const wrapper = mountShell('en')
    const activeBtn = wrapper.find('.lang-btn.active')
    expect(activeBtn.exists()).toBe(true)
    expect(activeBtn.text()).toBe('🇬🇧')
  })

  it('clicking a flag button persists locale to localStorage', async () => {
    const wrapper = mountShell('en')
    const frBtn = wrapper.findAll('.lang-btn').find((b) => b.text() === '🇫🇷')
    expect(frBtn).toBeTruthy()
    await frBtn!.trigger('click')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('fr')
  })

  it('renders slot content', () => {
    const wrapper = mountShell()
    expect(wrapper.find('#slot-content').exists()).toBe(true)
  })
})
