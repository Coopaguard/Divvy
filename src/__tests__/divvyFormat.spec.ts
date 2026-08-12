// Tests: .divvy file format — writing, reading back, and refusing bad input
import { describe, it, expect } from 'vitest'
import {
  DIVVY_FORMAT_VERSION,
  bundleFileName,
  parseDivvyFile,
  serialiseBundle,
  withFreshIds,
  type DivvyBundle,
} from '@/domains/importExport/format'

function bundle(): DivvyBundle {
  return {
    vacation: {
      id: 'v1',
      name: 'Corse',
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
      splitMethod: 'presence',
    },
    people: [
      {
        id: 'p1',
        vacationId: 'v1',
        name: 'Alice',
        shares: 2,
        arrivalDate: '2026-07-01',
        departureDate: '2026-07-10',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'p2',
        vacationId: 'v1',
        name: 'Bob',
        shares: 1,
        arrivalDate: '2026-07-01',
        departureDate: '2026-07-02',
        createdAt: '',
        updatedAt: '',
      },
    ],
    expenses: [
      {
        id: 'e1',
        vacationId: 'v1',
        payerId: 'p1',
        amountCents: 4250,
        label: 'Courses',
        date: '2026-07-02',
        createdAt: '',
        updatedAt: '',
      },
    ],
  }
}

/** Serialised bundle with one field tampered with. */
function tampered(mutate: (file: Record<string, unknown>) => void): string {
  const file = JSON.parse(serialiseBundle(bundle())) as Record<string, unknown>
  mutate(file)
  return JSON.stringify(file)
}

describe('serialiseBundle', () => {
  it('stamps the format and its version', () => {
    const file = JSON.parse(serialiseBundle(bundle()))
    expect(file.format).toBe('divvy')
    expect(file.version).toBe(DIVVY_FORMAT_VERSION)
    expect(typeof file.exportedAt).toBe('string')
  })

  it('carries the vacation, its people and its expenses', () => {
    const file = JSON.parse(serialiseBundle(bundle()))
    expect(file.vacation.name).toBe('Corse')
    expect(file.people).toHaveLength(2)
    expect(file.expenses).toHaveLength(1)
  })
})

describe('parseDivvyFile', () => {
  it('reads back exactly what was written', () => {
    const result = parseDivvyFile(serialiseBundle(bundle()))
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.bundle.vacation).toEqual(bundle().vacation)
    expect(result.bundle.people).toEqual(bundle().people)
    expect(result.bundle.expenses).toEqual(bundle().expenses)
  })

  it('keeps the split method chosen for that vacation', () => {
    const result = parseDivvyFile(serialiseBundle(bundle()))
    expect(result.ok && result.bundle.vacation.splitMethod).toBe('presence')
  })

  it('drops a split method it does not recognise rather than trusting it', () => {
    const result = parseDivvyFile(tampered((f) => {
      ;(f.vacation as Record<string, unknown>).splitMethod = 'byVibes'
    }))
    expect(result.ok && result.bundle.vacation.splitMethod).toBeUndefined()
  })

  it('rejects something that is not JSON at all', () => {
    const result = parseDivvyFile('not a file')
    expect(result).toEqual({ ok: false, reason: 'notJson' })
  })

  it('rejects JSON that is not one of ours', () => {
    expect(parseDivvyFile('{"hello":"world"}')).toEqual({ ok: false, reason: 'notDivvy' })
  })

  it('refuses a file from a newer version', () => {
    const result = parseDivvyFile(tampered((f) => {
      f.version = DIVVY_FORMAT_VERSION + 1
    }))
    expect(result).toEqual({ ok: false, reason: 'unsupportedVersion' })
  })

  it('accepts a file from an older version', () => {
    const result = parseDivvyFile(tampered((f) => {
      f.version = 0
    }))
    expect(result.ok).toBe(true)
  })

  it.each([
    ['a vacation without a name', (f: Record<string, unknown>) => {
      ;(f.vacation as Record<string, unknown>).name = ''
    }],
    ['a malformed date', (f: Record<string, unknown>) => {
      ;(f.vacation as Record<string, unknown>).startDate = '01/07/2026'
    }],
    ['people that are not a list', (f: Record<string, unknown>) => {
      f.people = 'Alice'
    }],
    ['negative shares', (f: Record<string, unknown>) => {
      ;(f.people as Record<string, unknown>[])[0]!.shares = -1
    }],
    ['a fractional amount', (f: Record<string, unknown>) => {
      ;(f.expenses as Record<string, unknown>[])[0]!.amountCents = 42.5
    }],
    ['a negative amount', (f: Record<string, unknown>) => {
      ;(f.expenses as Record<string, unknown>[])[0]!.amountCents = -100
    }],
  ])('refuses %s', (_label, mutate) => {
    expect(parseDivvyFile(tampered(mutate))).toEqual({ ok: false, reason: 'invalidData' })
  })

  it('refuses an expense whose payer is missing from the file', () => {
    // Importing it would leave the settlement computing against nobody.
    const result = parseDivvyFile(tampered((f) => {
      ;(f.expenses as Record<string, unknown>[])[0]!.payerId = 'ghost'
    }))
    expect(result).toEqual({ ok: false, reason: 'invalidData' })
  })

  it('accepts a vacation with nothing in it yet', () => {
    const empty: DivvyBundle = { ...bundle(), people: [], expenses: [] }
    const result = parseDivvyFile(serialiseBundle(empty))
    expect(result.ok).toBe(true)
  })

  it('reattaches everything to the vacation in the file', () => {
    // Even if the file claims otherwise, ownership follows the vacation it
    // travels with — a stale vacationId cannot orphan a record.
    const result = parseDivvyFile(tampered((f) => {
      ;(f.people as Record<string, unknown>[])[0]!.vacationId = 'elsewhere'
    }))
    expect(result.ok && result.bundle.people[0]!.vacationId).toBe('v1')
  })
})

describe('withFreshIds', () => {
  it('gives the vacation a new identity', () => {
    const fresh = withFreshIds(bundle())
    expect(fresh.vacation.id).not.toBe('v1')
    expect(fresh.vacation.name).toBe('Corse')
  })

  it('keeps every record attached to the new vacation', () => {
    const fresh = withFreshIds(bundle())
    for (const record of [...fresh.people, ...fresh.expenses]) {
      expect(record.vacationId).toBe(fresh.vacation.id)
    }
  })

  it('follows the payer to their new identity', () => {
    const fresh = withFreshIds(bundle())
    const alice = fresh.people.find((person) => person.name === 'Alice')!
    expect(fresh.expenses[0]!.payerId).toBe(alice.id)
    expect(alice.id).not.toBe('p1')
  })

  it('produces a different identity every time, so a re-import never overwrites', () => {
    const first = withFreshIds(bundle())
    const second = withFreshIds(bundle())
    expect(first.vacation.id).not.toBe(second.vacation.id)
  })

  it('leaves the amounts untouched', () => {
    expect(withFreshIds(bundle()).expenses[0]!.amountCents).toBe(4250)
  })
})

describe('bundleFileName', () => {
  it('builds a file name from the title', () => {
    expect(bundleFileName({ name: 'Corse 2026' })).toBe('corse-2026.divvy')
  })

  it('strips accents and punctuation a file system would trip on', () => {
    expect(bundleFileName({ name: 'Été à Nice / Été!' })).toBe('ete-a-nice-ete.divvy')
  })

  it('falls back to a neutral name rather than producing a bare extension', () => {
    expect(bundleFileName({ name: '???' })).toBe('vacances.divvy')
    expect(bundleFileName({ name: '' })).toBe('vacances.divvy')
  })

  it('keeps the name short enough for any file system', () => {
    expect(bundleFileName({ name: 'x'.repeat(200) }).length).toBeLessThanOrEqual(66)
  })
})
