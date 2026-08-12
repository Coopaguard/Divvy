// Tests: detecting an already-installed app, and snoozing the offer
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  clearSnooze,
  isInstalled,
  isIos,
  isSnoozed,
  snooze,
} from '@/domains/pwa/install'

/** jsdom has no matchMedia: each test says which display modes are in force. */
function withDisplayModes(...active: string[]) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: active.some((mode) => query.includes(mode)),
      media: query,
    })),
  )
}

/** jsdom's navigator has no maxTouchPoints at all, so it has to be defined
 *  rather than spied on. Configurable, so the next test can redefine it. */
function withUserAgent(userAgent: string, platform = 'Linux', maxTouchPoints = 0) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform)
  Object.defineProperty(navigator, 'maxTouchPoints', { value: maxTouchPoints, configurable: true })
}

describe('isInstalled', () => {
  beforeEach(() => {
    withDisplayModes('browser')
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('says no in a plain browser tab', () => {
    expect(isInstalled()).toBe(false)
  })

  it('recognises the standalone window an install opens', () => {
    withDisplayModes('standalone')
    expect(isInstalled()).toBe(true)
  })

  it('recognises the desktop window-controls overlay', () => {
    withDisplayModes('window-controls-overlay')
    expect(isInstalled()).toBe(true)
  })

  it('recognises Safari iOS, whose only signal is navigator.standalone', () => {
    // No display-mode match there — the media query answers no.
    vi.stubGlobal('navigator', { ...navigator, standalone: true })
    expect(isInstalled()).toBe(true)
  })

  it('recognises an Android app embedding the site', () => {
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('android-app://com.example')
    expect(isInstalled()).toBe(true)
  })
})

describe('isIos', () => {
  afterEach(() => vi.restoreAllMocks())

  it('spots an iPhone', () => {
    withUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    expect(isIos()).toBe(true)
  })

  it('spots an iPad that claims to be a Mac', () => {
    // Recent iPadOS reports MacIntel; only the touchscreen gives it away.
    withUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5)
    expect(isIos()).toBe(true)
  })

  it('leaves a real Mac alone', () => {
    withUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0)
    expect(isIos()).toBe(false)
  })

  it('leaves Android alone — there the native prompt does the job', () => {
    withUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8)')
    expect(isIos()).toBe(false)
  })
})

describe('snooze', () => {
  beforeEach(() => localStorage.clear())

  it('offers the install when nothing was ever dismissed', () => {
    expect(isSnoozed()).toBe(false)
  })

  it('stays quiet for the days after a dismissal', () => {
    const now = Date.parse('2026-01-01T12:00:00Z')
    snooze(now)

    expect(isSnoozed(now + 29 * 24 * 3600_000)).toBe(true)
  })

  it('offers again a month later, in case the banner was closed unread', () => {
    const now = Date.parse('2026-01-01T12:00:00Z')
    snooze(now)

    expect(isSnoozed(now + 31 * 24 * 3600_000)).toBe(false)
  })

  it('forgets the snooze once the app is installed', () => {
    snooze()
    clearSnooze()
    expect(isSnoozed()).toBe(false)
  })

  it('treats unreadable storage as a snooze rather than nagging', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('private mode')
    })
    expect(isSnoozed()).toBe(true)
    vi.restoreAllMocks()
  })

  it('survives storage refusing to write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => snooze()).not.toThrow()
    vi.restoreAllMocks()
  })
})
