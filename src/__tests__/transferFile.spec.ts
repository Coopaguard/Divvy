// Tests: browser side of the transfer — sharing capability and outcomes
import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  canShareFiles,
  readFileText,
  shareCandidates,
  shareFile,
} from '@/domains/importExport/file'

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

describe('shareCandidates', () => {
  it('offers the app format first, then ever more ordinary ones', () => {
    expect(shareCandidates('corse.divvy').map((c) => c.name)).toEqual([
      'corse.divvy',
      'corse.divvy.json',
      'corse.divvy.txt',
    ])
  })

  it('ends on a type every browser will share', () => {
    const candidats = shareCandidates('corse.divvy')
    const last = candidats[candidats.length - 1]!
    expect(last.type).toBe('text/plain')
  })

  it('does not double the extension', () => {
    expect(shareCandidates('corse').map((c) => c.name)[0]).toBe('corse.divvy')
  })
})

describe('canShareFiles', () => {
  it('is false when the browser cannot share at all', () => {
    stubNavigator({ canShare: undefined })
    expect(canShareFiles()).toBe(false)
  })

  it('is false when the browser shares nothing we can offer', () => {
    stubNavigator({ canShare: () => false })
    expect(canShareFiles()).toBe(false)
  })

  it('is true when only the plainest wrapping is accepted', () => {
    // Chrome only shares a known list of file types, and `.divvy` is not on it.
    // Without the fallback the option would be missing on every phone.
    stubNavigator({
      canShare: (data: ShareData) => data.files?.[0]?.name.endsWith('.txt') === true,
    })
    expect(canShareFiles()).toBe(true)
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

  it('shares the file under our own extension when allowed', async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>().mockResolvedValue(undefined)
    stubNavigator({ canShare: () => true, share })

    expect(await shareFile('corse.divvy', '{"a":1}')).toBe('shared')
    const shared = share.mock.calls[0]![0].files![0] as File
    expect(shared.name).toBe('corse.divvy')
  })

  it('falls back to a wrapping the browser accepts, contents unchanged', async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>().mockResolvedValue(undefined)
    stubNavigator({
      canShare: (data: ShareData) => data.files?.[0]?.name.endsWith('.txt') === true,
      share,
    })

    expect(await shareFile('corse.divvy', '{"a":1}')).toBe('shared')
    const shared = share.mock.calls[0]![0].files![0] as File
    expect(shared.name).toBe('corse.divvy.txt')
    expect(await shared.text()).toBe('{"a":1}')
  })

  it('reports unsupported only when no wrapping at all is accepted', async () => {
    stubNavigator({ canShare: () => false, share: vi.fn<(data: ShareData) => Promise<void>>() })
    expect(await shareFile('corse.divvy', '{}')).toBe('unsupported')
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
