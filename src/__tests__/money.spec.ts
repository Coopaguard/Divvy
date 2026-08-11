// Tests: money helpers — amounts are integer cents end to end
import { describe, it, expect } from 'vitest'
import { centsToInput, formatCents, parseAmountToCents, sumCents } from '@/domains/shared/money'

describe('parseAmountToCents', () => {
  it.each([
    ['12', 1200],
    ['12.5', 1250],
    ['12.50', 1250],
    ['0.01', 1],
    ['1234567.89', 123456789],
  ])('parses %s as %i cents', (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected)
  })

  it('accepts a comma as decimal separator', () => {
    expect(parseAmountToCents('12,50')).toBe(1250)
  })

  it('ignores surrounding whitespace', () => {
    expect(parseAmountToCents('  7.25  ')).toBe(725)
  })

  it.each([
    ['', 'empty'],
    ['abc', 'not a number'],
    ['-5', 'negative'],
    ['12.345', 'more than two decimals'],
    ['1e3', 'scientific notation'],
    ['1.2.3', 'malformed'],
    ['12€', 'currency symbol'],
  ])('rejects %s (%s)', (input) => {
    expect(parseAmountToCents(input)).toBeNull()
  })

  it('does not lose a cent to floating point rounding', () => {
    // 10.1 * 100 is 1009.9999... in IEEE-754; naive truncation would give 1009.
    expect(parseAmountToCents('10.1')).toBe(1010)
    expect(parseAmountToCents('1.15')).toBe(115)
  })
})

describe('sumCents', () => {
  it('sums without floating point drift', () => {
    // 0.1 + 0.2 !== 0.3 in decimal; in cents it is exact.
    expect(sumCents([10, 20])).toBe(30)
  })

  it('returns 0 for an empty list', () => {
    expect(sumCents([])).toBe(0)
  })
})

describe('centsToInput', () => {
  it('renders cents as a two-decimal string for a form field', () => {
    expect(centsToInput(1250)).toBe('12.50')
    expect(centsToInput(5)).toBe('0.05')
    expect(centsToInput(0)).toBe('0.00')
  })

  it('round-trips through parseAmountToCents', () => {
    for (const cents of [1, 99, 100, 1250, 123456789]) {
      expect(parseAmountToCents(centsToInput(cents))).toBe(cents)
    }
  })
})

describe('formatCents', () => {
  it('formats as currency in the given locale', () => {
    const formatted = formatCents(1250, 'fr')
    expect(formatted).toContain('12')
    expect(formatted).toContain('50')
  })

  it('renders the same amount differently across locales', () => {
    expect(formatCents(1250, 'fr')).not.toBe(formatCents(1250, 'en'))
  })
})
