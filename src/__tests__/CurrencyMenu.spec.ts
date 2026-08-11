// Tests: CurrencyMenu — the app-wide currency symbol
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CurrencyMenu from '@/ui/components/CurrencyMenu.vue'
import { CURRENCY_STORAGE_KEY, supportedCurrencies } from '@/domains/shared/currency'
import { useCurrency } from '@/ui/composables/useCurrency'
import { globalPlugins } from './helpers'

describe('CurrencyMenu', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.body.innerHTML = ''
    // The setting is a module-level singleton: reset it between tests.
    useCurrency().setCurrency('EUR')
  })

  function mountMenu(locale = 'en') {
    return mount(CurrencyMenu, { global: globalPlugins(locale), attachTo: document.body })
  }

  it('shows the active symbol', () => {
    expect(mountMenu().find('.currency-trigger').text()).toContain('€')
  })

  it('keeps the list shut until asked', () => {
    expect(mountMenu().find('.currency-list').exists()).toBe(false)
  })

  it('offers every supported currency', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.currency-trigger').trigger('click')
    expect(wrapper.findAll('.currency-option')).toHaveLength(supportedCurrencies.length)
  })

  it('names each currency, so the symbol is not the only clue', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.currency-trigger').trigger('click')
    const names = wrapper.findAll('.currency-name').map((node) => node.text())
    expect(names).toContain('Euro')
    expect(names).toContain('Pound sterling')
    expect(names).toContain('Generic (no country)')
  })

  it('switches the symbol and persists the choice', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.currency-trigger').trigger('click')

    const pound = wrapper.findAll('.currency-option').find((o) => o.text().includes('Pound'))!
    await pound.trigger('click')

    expect(localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe('GBP')
    expect(wrapper.find('.currency-trigger').text()).toContain('£')
  })

  it('offers a generic option showing the ¤ sign', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.currency-trigger').trigger('click')

    const generic = wrapper.findAll('.currency-option').find((o) => o.text().includes('Generic'))!
    expect(generic.text()).toContain('¤')

    await generic.trigger('click')
    expect(wrapper.find('.currency-trigger').text()).toContain('¤')
  })

  it('marks the active currency', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.currency-trigger').trigger('click')

    const active = wrapper.find('.currency-option.active')
    expect(active.text()).toContain('Euro')
    expect(active.attributes('aria-checked')).toBe('true')
  })

  it('closes once a currency is picked', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.currency-trigger').trigger('click')
    await wrapper.findAll('.currency-option')[0]!.trigger('click')
    expect(wrapper.find('.currency-list').exists()).toBe(false)
  })

  it('closes on Escape', async () => {
    const wrapper = mountMenu()
    await wrapper.find('.currency-trigger').trigger('click')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.currency-list').exists()).toBe(false)
    wrapper.unmount()
  })

  it('is independent of the language', async () => {
    // Mounted in French, the currency stays whatever was chosen — a language
    // must never restate an amount in another currency.
    const wrapper = mountMenu('fr')
    expect(wrapper.find('.currency-trigger').text()).toContain('€')

    useCurrency().setCurrency('USD')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.currency-trigger').text()).toContain('$')
  })
})
