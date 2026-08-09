// Tests: ConfirmDialog component
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '@/ui/components/ConfirmDialog.vue'
import { globalPlugins } from './helpers'

function mountDialog(props: { open: boolean; message: string }) {
  return mount(ConfirmDialog, {
    props,
    global: globalPlugins(),
    attachTo: document.body,
  })
}

describe('ConfirmDialog', () => {
  it('renders nothing when open is false', () => {
    const wrapper = mountDialog({ open: false, message: 'Are you sure?' })
    expect(document.querySelector('.dialog')).toBeNull()
    wrapper.unmount()
  })

  it('renders dialog when open is true', () => {
    const wrapper = mountDialog({ open: true, message: 'Are you sure?' })
    expect(document.querySelector('.dialog')).not.toBeNull()
    wrapper.unmount()
  })

  it('displays the message prop', () => {
    const wrapper = mountDialog({ open: true, message: 'Delete this item?' })
    expect(document.querySelector('.dialog-message')?.textContent).toBe('Delete this item?')
    wrapper.unmount()
  })

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mountDialog({ open: true, message: 'Sure?' })
    const cancelBtn = document.querySelector<HTMLButtonElement>('.btn-secondary')
    cancelBtn?.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('cancel')).toBeTruthy()
    wrapper.unmount()
  })

  it('emits confirm when confirm button is clicked', async () => {
    const wrapper = mountDialog({ open: true, message: 'Sure?' })
    const confirmBtn = document.querySelector<HTMLButtonElement>('.btn-danger')
    confirmBtn?.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('confirm')).toBeTruthy()
    wrapper.unmount()
  })
})
