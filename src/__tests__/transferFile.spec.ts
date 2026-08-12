// Tests: browser side of the transfer — sharing capability and outcomes
import { describe, it, expect, afterEach, vi } from 'vitest'
import { canShareFiles, readFileText, shareFile } from '@/domains/importExport/file'

const original = { canShare: navigator.canShare, share: navigator.share }

function stubNavigator(parts: Partial<Navigator>): void {
  for (const [key, value] of Object.entries(parts)) {
    Object.defineProperty(navigator, key, { value, configurable: true, writable: true })
  }
}

afterEach(() => {
  stubNavigator(original as Partial<Navigator>)
  vi.restoreAllMocks()
})

describe('canShareFiles', () => {
  it('is false when the browser cannot share at all', () => {
    stubNavigator({ canShare: undefined })
    expect(canShareFiles()).toBe(false)
  })

  it('is false when the browser shares, but not files', () => {
    stubNavigator({ canShare: () => false })
    expect(canShareFiles()).toBe(false)
  })

  it('is false when probing throws', () => {
    stubNavigator({
      canShare: () => {
        throw new Error('nope')
      },
    })
    expect(canShareFiles()).toBe(false)
  })

  it('is true when files can be shared', () => {
    stubNavigator({ canShare: () => true })
    expect(canShareFiles()).toBe(true)
  })
})

describe('shareFile', () => {
  it('reports unsupported rather than throwing', async () => {
    stubNavigator({ canShare: undefined })
    expect(await shareFile('x.divvy', '{}')).toBe('unsupported')
  })

  it('shares the file', async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>().mockResolvedValue(undefined)
    stubNavigator({ canShare: () => true, share })

    expect(await shareFile('corse.divvy', '{"a":1}')).toBe('shared')
    const shared = share.mock.calls[0]![0].files![0] as File
    expect(shared.name).toBe('corse.divvy')
  })

  it('treats a dismissed share sheet as a cancellation, not a failure', async () => {
    const abort = new Error('dismissed')
    abort.name = 'AbortError'
    stubNavigator({ canShare: () => true, share: vi.fn<(data: ShareData) => Promise<void>>().mockRejectedValue(abort) })

    expect(await shareFile('x.divvy', '{}')).toBe('cancelled')
  })

  it('reports a real failure', async () => {
    stubNavigator({ canShare: () => true, share: vi.fn<(data: ShareData) => Promise<void>>().mockRejectedValue(new Error('boom')) })
    expect(await shareFile('x.divvy', '{}')).toBe('failed')
  })
})

describe('readFileText', () => {
  it('reads the contents', async () => {
    expect(await readFileText(new Blob(['{"a":1}']))).toBe('{"a":1}')
  })

  it('returns null rather than throwing when the read fails', async () => {
    const unreadable = { text: () => Promise.reject(new Error('io')) } as unknown as Blob
    expect(await readFileText(unreadable)).toBeNull()
  })
})
