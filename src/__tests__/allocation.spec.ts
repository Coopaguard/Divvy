// Tests: integer allocation (largest remainder)
import { describe, it, expect } from 'vitest'
import { distribute } from '@/domains/shared/allocation'

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

describe('distribute', () => {
  it('splits an exact division evenly', () => {
    expect(distribute([1, 1, 1, 1], 100)).toEqual([25, 25, 25, 25])
  })

  it('never loses the remainder of an uneven division', () => {
    const parts = distribute([1, 1, 1], 100)
    expect(sum(parts)).toBe(100)
    expect(parts).toEqual([34, 33, 33])
  })

  it('keeps a cent split three ways adding up to the cent', () => {
    // The phase 6 case: 10,00 € between three shares.
    const parts = distribute([1, 1, 1], 1000)
    expect(sum(parts)).toBe(1000)
    expect(parts).toEqual([334, 333, 333])
  })

  it('follows the weights', () => {
    expect(distribute([3, 1], 100)).toEqual([75, 25])
  })

  it('gives the extra unit to whoever was cut the most', () => {
    // Exact shares 16.66 / 33.33 / 50.0 — the first two are cut, the largest
    // remainder wins the spare unit.
    const parts = distribute([1, 2, 3], 100)
    expect(sum(parts)).toBe(100)
    expect(parts).toEqual([17, 33, 50])
  })

  it('breaks ties deterministically, earliest first', () => {
    expect(distribute([1, 1, 1], 100)).toEqual(distribute([1, 1, 1], 100))
    expect(distribute([1, 1], 5)).toEqual([3, 2])
  })

  it('always sums to the total, whatever the weights', () => {
    const cases: [number[], number][] = [
      [[7, 11, 13], 100],
      [[1, 1, 1, 1, 1, 1, 7], 1000],
      [[999, 1], 3],
      [[5], 7],
      [[1, 2, 3, 4, 5, 6, 7, 8, 9], 12345],
    ]
    for (const [weights, total] of cases) {
      expect(sum(distribute(weights, total))).toBe(total)
    }
  })

  it('gives one part per weight', () => {
    expect(distribute([1, 2, 3], 10)).toHaveLength(3)
  })

  it('returns zeros when nothing can be shared', () => {
    expect(distribute([], 100)).toEqual([])
    expect(distribute([0, 0], 100)).toEqual([0, 0])
    expect(distribute([1, 1], 0)).toEqual([0, 0])
  })

  it('refuses negative weights rather than inventing a split', () => {
    expect(distribute([-1, 2], 100)).toEqual([0, 0])
  })

  it('ignores a non-finite total', () => {
    expect(distribute([1, 1], Number.NaN)).toEqual([0, 0])
  })
})
