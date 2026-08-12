// Tests: UpdatePrompt — offering the new version rather than imposing it
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import UpdatePrompt from '@/ui/components/UpdatePrompt.vue'
import { globalPlugins } from './helpers'

const needRefresh = ref(false)
const updateServiceWorker = vi.fn<(reload?: boolean) => Promise<void>>().mockResolvedValue()

vi.mock('virtual:pwa-register/vue', () => ({
  useRegisterSW: () => ({ needRefresh, updateServiceWorker }),
}))

describe('UpdatePrompt', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    needRefresh.value = false
    updateServiceWorker.mockClear()
  })

  function mountPrompt() {
    return mount(UpdatePrompt, { global: globalPlugins() })
  }

  it('stays out of the way while the version is current', () => {
    expect(mountPrompt().find('.update-prompt').exists()).toBe(false)
  })

  it('announces a new version once one is ready', async () => {
    const wrapper = mountPrompt()
    needRefresh.value = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.update-prompt').text()).toContain('A new version is available')
  })

  it('never reloads on its own', async () => {
    const wrapper = mountPrompt()
    needRefresh.value = true
    await wrapper.vm.$nextTick()

    // Reloading unasked would wipe an expense being typed.
    expect(updateServiceWorker).not.toHaveBeenCalled()
  })

  it('applies the update when asked, and reloads', async () => {
    const wrapper = mountPrompt()
    needRefresh.value = true
    await wrapper.vm.$nextTick()

    await wrapper.find('.btn-primary').trigger('click')

    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('can be dismissed without updating', async () => {
    const wrapper = mountPrompt()
    needRefresh.value = true
    await wrapper.vm.$nextTick()

    await wrapper.find('.btn-secondary').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.update-prompt').exists()).toBe(false)
    expect(updateServiceWorker).not.toHaveBeenCalled()
  })

  it('is announced to assistive tech without stealing focus', async () => {
    const wrapper = mountPrompt()
    needRefresh.value = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.update-prompt').attributes('role')).toBe('status')
  })
})
