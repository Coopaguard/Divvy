// Tests: InstallPrompt — offering the install, never nagging about it
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import InstallPrompt from '@/ui/components/InstallPrompt.vue'
import { globalPlugins } from './helpers'

/** The Chromium event, reduced to what the component actually uses. */
function installEvent(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
  event.prompt = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
  event.userChoice = Promise.resolve({ outcome })
  return event
}

function inBrowserTab() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: false, media: query })),
  )
}

function mountPrompt() {
  return mount(InstallPrompt, { global: globalPlugins() })
}

describe('InstallPrompt', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    inBrowserTab()
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('')
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Chrome on Android')
    // Absent from jsdom's navigator: it has to be defined, not spied on.
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows nothing until the browser says the app is installable', () => {
    expect(mountPrompt().find('.install-prompt').exists()).toBe(false)
  })

  it('offers the install once the browser announces one', async () => {
    const wrapper = mountPrompt()
    window.dispatchEvent(installEvent())
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.install-prompt').text()).toContain('Install Divvy')
    expect(wrapper.find('.btn-primary').exists()).toBe(true)
  })

  it('keeps the native banner from appearing on its own terms', async () => {
    const wrapper = mountPrompt()
    const event = installEvent()
    const prevented = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(prevented).toHaveBeenCalled()
  })

  it('opens the browser prompt when asked', async () => {
    const wrapper = mountPrompt()
    const event = installEvent()
    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    await wrapper.find('.btn-primary').trigger('click')

    expect(event.prompt).toHaveBeenCalled()
  })

  it('stays quiet for a while once dismissed', async () => {
    const wrapper = mountPrompt()
    window.dispatchEvent(installEvent())
    await wrapper.vm.$nextTick()

    await wrapper.find('.btn-secondary').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.install-prompt').exists()).toBe(false)
    // A fresh visit must not bring it straight back.
    const later = mountPrompt()
    window.dispatchEvent(installEvent())
    await later.vm.$nextTick()
    expect(later.find('.install-prompt').exists()).toBe(false)
  })

  it('says nothing at all once the app runs installed', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: query.includes('standalone'), media: query })),
    )

    const wrapper = mountPrompt()
    window.dispatchEvent(installEvent())
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.install-prompt').exists()).toBe(false)
  })

  it('explains the gesture on iOS, where there is no prompt to open', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS)')

    const wrapper = mountPrompt()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.install-prompt').text()).toContain('Add to Home Screen')
    // No button: there would be nothing behind it.
    expect(wrapper.find('.btn-primary').exists()).toBe(false)
  })

  it('is announced to assistive tech without stealing focus', async () => {
    const wrapper = mountPrompt()
    window.dispatchEvent(installEvent())
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.install-prompt').attributes('role')).toBe('status')
  })
})
