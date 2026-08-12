// Tests: settlement — shares, share-days, and transfer optimisation
import { describe, it, expect } from 'vitest'
import { computeBalances, daysPresent, optimiseTransfers } from '@/domains/settlement/settle'
import type { Expense } from '@/domains/expenses/types'
import type { Person } from '@/domains/people/types'
import type { Vacation } from '@/domains/vacations/types'

function person(
  id: string,
  shares = 1,
  arrivalDate = '2025-07-01',
  departureDate = '2025-07-10',
): Person {
  return {
    id,
    vacationId: 'v1',
    name: id.toUpperCase(),
    shares,
    arrivalDate,
    departureDate,
    createdAt: '',
    updatedAt: '',
  }
}

function expense(payerId: string, amountCents: number, date = '2025-07-02'): Expense {
  return {
    id: `e-${payerId}-${amountCents}-${date}`,
    vacationId: 'v1',
    payerId,
    amountCents,
    label: 'X',
    date,
    createdAt: '',
    updatedAt: '',
  }
}

const vacation: Vacation = {
  id: 'v1',
  name: 'Trip',
  startDate: '2025-07-01',
  endDate: '2025-07-10',
  createdAt: '',
  updatedAt: '',
}

const sumOwed = (balances: { owedCents: number }[]) =>
  balances.reduce((total, balance) => total + balance.owedCents, 0)
const sumBalance = (balances: { balanceCents: number }[]) =>
  balances.reduce((total, balance) => total + balance.balanceCents, 0)

describe('daysPresent', () => {
  it('counts both ends of the stay', () => {
    expect(daysPresent(person('a', 1, '2025-07-01', '2025-07-10'))).toBe(10)
  })

  it('counts a same-day stay as one day, not zero', () => {
    expect(daysPresent(person('a', 1, '2025-07-03', '2025-07-03'))).toBe(1)
  })

  it('clips the stay to the vacation window', () => {
    // Arrives a month early, leaves a month late — only the trip counts.
    expect(daysPresent(person('a', 1, '2025-06-01', '2025-08-01'), vacation)).toBe(10)
  })

  it('returns zero when the stay misses the vacation entirely', () => {
    expect(daysPresent(person('a', 1, '2025-09-01', '2025-09-05'), vacation)).toBe(0)
  })

  it('returns zero on a reversed stay', () => {
    expect(daysPresent(person('a', 1, '2025-07-10', '2025-07-01'))).toBe(0)
  })

  it('returns zero on an unparsable date', () => {
    expect(daysPresent(person('a', 1, 'nope', '2025-07-10'))).toBe(0)
  })

  it('is unaffected by the local timezone', () => {
    // Parsed at UTC midnight: a negative-offset zone must not eat a day.
    expect(daysPresent(person('a', 1, '2025-03-30', '2025-03-31'))).toBe(2)
  })
})

describe('computeBalances — shares', () => {
  it('splits evenly between equal shares', () => {
    const balances = computeBalances([person('a'), person('b')], [expense('a', 1000)])
    expect(balances.map((balance) => balance.owedCents)).toEqual([500, 500])
    expect(balances.map((balance) => balance.balanceCents)).toEqual([500, -500])
  })

  it('weights by shares', () => {
    const balances = computeBalances(
      [person('a', 3), person('b', 1)],
      [expense('a', 1000)],
    )
    expect(balances.map((balance) => balance.owedCents)).toEqual([750, 250])
  })

  it('never loses a cent on an indivisible total', () => {
    // 10,00 € between three: 333 + 333 + 333 leaves one cent behind.
    const balances = computeBalances(
      [person('a'), person('b'), person('c')],
      [expense('a', 1000)],
    )
    expect(balances.map((balance) => balance.owedCents)).toEqual([334, 333, 333])
    expect(sumOwed(balances)).toBe(1000)
  })

  it('makes the balances cancel out exactly', () => {
    const balances = computeBalances(
      [person('a'), person('b'), person('c')],
      [expense('a', 1000), expense('b', 731)],
    )
    expect(sumBalance(balances)).toBe(0)
  })

  it('ignores dates entirely', () => {
    const brief = person('b', 1, '2025-07-09', '2025-07-10')
    const balances = computeBalances([person('a'), brief], [expense('a', 1000)])
    // Two days or ten, the share is the same under this method.
    expect(balances.map((balance) => balance.owedCents)).toEqual([500, 500])
  })

  it('still reports the days, for information', () => {
    const brief = person('b', 1, '2025-07-09', '2025-07-10')
    const balances = computeBalances([person('a'), brief], [expense('a', 1000)], {
      vacation,
    })
    expect(balances.map((balance) => balance.days)).toEqual([10, 2])
  })

  it('gives everyone a zero balance when nothing was spent', () => {
    const balances = computeBalances([person('a'), person('b')], [])
    expect(balances.map((balance) => balance.balanceCents)).toEqual([0, 0])
  })

  it('handles an empty group', () => {
    expect(computeBalances([], [expense('a', 1000)])).toEqual([])
  })
})

describe('computeBalances — shareDays', () => {
  const options = { method: 'shareDays' as const, vacation }

  it('charges a share by the day', () => {
    // A: 10 days, B: 5 days → 15 share-days, 30 € → 2 €/share-day.
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-06', '2025-07-10')
    const balances = computeBalances([a, b], [expense('a', 3000)], options)

    expect(balances.map((balance) => balance.days)).toEqual([10, 5])
    expect(balances.map((balance) => balance.owedCents)).toEqual([2000, 1000])
  })

  it('combines shares and days', () => {
    // A: 2 shares × 10 days = 20; B: 1 share × 5 days = 5 → 25 units.
    const a = person('a', 2, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-06', '2025-07-10')
    const balances = computeBalances([a, b], [expense('a', 2500)], options)

    expect(balances.map((balance) => balance.owedCents)).toEqual([2000, 500])
  })

  it('spreads every expense across the stays, dates of spending ignored', () => {
    // The difference with `presence`: B left on the 2nd yet still carries a
    // fraction of the expense dated the 8th, because the whole total is spread.
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-01', '2025-07-02')
    const balances = computeBalances([a, b], [expense('a', 1200, '2025-07-08')], options)

    expect(balances[1]!.owedCents).toBeGreaterThan(0)
    expect(sumOwed(balances)).toBe(1200)
  })

  it('charges nothing to someone who was never there', () => {
    const away = person('b', 1, '2025-09-01', '2025-09-02')
    const balances = computeBalances([person('a'), away], [expense('a', 1000)], options)
    expect(balances[1]!.owedCents).toBe(0)
    expect(balances[0]!.owedCents).toBe(1000)
  })

  it('still sums to the exact total', () => {
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-04', '2025-07-06')
    const c = person('c', 2, '2025-07-02', '2025-07-08')
    const balances = computeBalances([a, b, c], [expense('a', 9997)], options)

    expect(sumOwed(balances)).toBe(9997)
    expect(sumBalance(balances)).toBe(0)
  })

  it('falls back to shares when no one has a usable day', () => {
    const a = person('a', 1, '2025-01-01', '2025-01-02')
    const b = person('b', 1, '2025-01-01', '2025-01-02')
    const balances = computeBalances([a, b], [expense('a', 1000)], options)

    expect(sumOwed(balances)).toBe(1000)
    expect(balances.map((balance) => balance.owedCents)).toEqual([500, 500])
  })
})

describe('computeBalances — presence', () => {
  const options = { method: 'presence' as const, vacation }

  it('spares someone an expense made after they left', () => {
    // Le cas demandé : B repart le 2, la dépense du 3 ne le concerne plus.
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-01', '2025-07-02')
    const balances = computeBalances([a, b], [expense('a', 1000, '2025-07-03')], options)

    expect(balances[1]!.owedCents).toBe(0)
    expect(balances[0]!.owedCents).toBe(1000)
  })

  it('charges the day someone leaves, but not the day after', () => {
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-01', '2025-07-02')
    const balances = computeBalances(
      [a, b],
      [expense('a', 1000, '2025-07-02'), expense('a', 1000, '2025-07-03')],
      options,
    )

    // Departure day is still a day present: B takes half of the first, none
    // of the second.
    expect(balances[1]!.owedCents).toBe(500)
    expect(balances[0]!.owedCents).toBe(1500)
  })

  it('charges the day someone arrives', () => {
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const late = person('b', 1, '2025-07-05', '2025-07-10')
    const balances = computeBalances([a, late], [expense('a', 1000, '2025-07-05')], options)
    expect(balances[1]!.owedCents).toBe(500)
  })

  it('splits each expense between the people there that day, by shares', () => {
    const a = person('a', 3, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-01', '2025-07-10')
    const balances = computeBalances([a, b], [expense('a', 1000, '2025-07-02')], options)
    expect(balances.map((balance) => balance.owedCents)).toEqual([750, 250])
  })

  it('treats each expense on its own date', () => {
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-01', '2025-07-05')
    const balances = computeBalances(
      [a, b],
      [
        expense('a', 1000, '2025-07-02'), // both there
        expense('a', 1000, '2025-07-08'), // A alone
      ],
      options,
    )
    expect(balances.map((balance) => balance.owedCents)).toEqual([1500, 500])
  })

  it('keeps the total intact when nobody was there that day', () => {
    // Otherwise the shares would no longer add up to what was spent, and the
    // transfers could not settle.
    const a = person('a', 1, '2025-07-01', '2025-07-02')
    const b = person('b', 1, '2025-07-01', '2025-07-02')
    const balances = computeBalances([a, b], [expense('a', 1000, '2025-12-25')], options)

    expect(sumOwed(balances)).toBe(1000)
    expect(balances.map((balance) => balance.owedCents)).toEqual([500, 500])
  })

  it('falls back on the group when the expense date is unreadable', () => {
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-01', '2025-07-10')
    const balances = computeBalances([a, b], [expense('a', 1000, 'not-a-date')], options)
    expect(sumOwed(balances)).toBe(1000)
  })

  it('still sums to the exact total, expense by expense', () => {
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-04', '2025-07-06')
    const c = person('c', 2, '2025-07-02', '2025-07-08')
    const balances = computeBalances(
      [a, b, c],
      [
        expense('a', 3331, '2025-07-05'),
        expense('b', 997, '2025-07-09'),
        expense('c', 4441, '2025-07-03'),
      ],
      options,
    )

    expect(sumOwed(balances)).toBe(3331 + 997 + 4441)
    expect(sumBalance(balances)).toBe(0)
  })

  it('reports the days of presence alongside', () => {
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-06', '2025-07-10')
    const balances = computeBalances([a, b], [expense('a', 1000, '2025-07-07')], options)
    expect(balances.map((balance) => balance.days)).toEqual([10, 5])
  })

  it('never charges an expense to someone who was never there at all', () => {
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const away = person('b', 1, '2025-09-01', '2025-09-05')
    const balances = computeBalances([a, away], [expense('a', 1000, '2025-07-03')], options)
    expect(balances[1]!.owedCents).toBe(0)
    expect(balances[1]!.balanceCents).toBe(0)
  })
})

describe('optimiseTransfers', () => {
  function balancesFrom(entries: [string, number][]) {
    return entries.map(([personId, balanceCents]) => ({
      personId,
      name: personId,
      shares: 1,
      days: 1,
      owedCents: 0,
      paidCents: 0,
      balanceCents,
    }))
  }

  it('settles a single debt', () => {
    const transfers = optimiseTransfers(balancesFrom([['a', 500], ['b', -500]]))
    expect(transfers).toEqual([{ fromId: 'b', toId: 'a', amountCents: 500 }])
  })

  it('returns nothing when everyone is square', () => {
    expect(optimiseTransfers(balancesFrom([['a', 0], ['b', 0]]))).toEqual([])
  })

  it('clears every balance it is given', () => {
    const balances = balancesFrom([['a', 1500], ['b', -400], ['c', -1100]])
    const transfers = optimiseTransfers(balances)

    const net = new Map(balances.map((balance) => [balance.personId, balance.balanceCents]))
    for (const transfer of transfers) {
      net.set(transfer.fromId, net.get(transfer.fromId)! + transfer.amountCents)
      net.set(transfer.toId, net.get(transfer.toId)! - transfer.amountCents)
    }
    expect([...net.values()].every((value) => value === 0)).toBe(true)
  })

  it('never needs more than one transfer per person minus one', () => {
    const balances = balancesFrom([
      ['a', 1000],
      ['b', 800],
      ['c', -600],
      ['d', -700],
      ['e', -500],
    ])
    expect(optimiseTransfers(balances).length).toBeLessThanOrEqual(balances.length - 1)
  })

  it('pairs the biggest debtor with the biggest creditor, so each pays once', () => {
    // C owes 1100 and A is owed 1500: one payment covers C entirely.
    const transfers = optimiseTransfers(
      balancesFrom([['a', 1500], ['b', -400], ['c', -1100]]),
    )
    expect(transfers).toEqual([
      { fromId: 'c', toId: 'a', amountCents: 1100 },
      { fromId: 'b', toId: 'a', amountCents: 400 },
    ])
  })

  it('gives each person as few counterparties as it can', () => {
    const transfers = optimiseTransfers(
      balancesFrom([['a', 900], ['b', 100], ['c', -500], ['d', -500]]),
    )
    // Four people, three transfers: only one person has to split a payment.
    const counterparties = new Map<string, Set<string>>()
    for (const transfer of transfers) {
      counterparties.set(
        transfer.fromId,
        (counterparties.get(transfer.fromId) ?? new Set()).add(transfer.toId),
      )
    }
    expect([...counterparties.values()].filter((set) => set.size > 1)).toHaveLength(1)
  })

  it('is deterministic on ties', () => {
    const entries: [string, number][] = [['a', 500], ['b', 500], ['c', -500], ['d', -500]]
    expect(optimiseTransfers(balancesFrom(entries))).toEqual(
      optimiseTransfers(balancesFrom(entries)),
    )
  })

  it('produces no zero-value transfer', () => {
    const transfers = optimiseTransfers(
      balancesFrom([['a', 300], ['b', 0], ['c', -300]]),
    )
    expect(transfers.every((transfer) => transfer.amountCents > 0)).toBe(true)
  })
})

describe('settlement end to end', () => {
  it('turns real spending into payments that square everyone up', () => {
    const people = [person('a'), person('b'), person('c')]
    const expenses = [expense('a', 6000), expense('b', 3000)]
    const balances = computeBalances(people, expenses)
    const transfers = optimiseTransfers(balances)

    // 90 € over three: 30 € each. A advanced 60, B 30, C nothing.
    expect(balances.map((balance) => balance.owedCents)).toEqual([3000, 3000, 3000])
    expect(transfers).toEqual([{ fromId: 'c', toId: 'a', amountCents: 3000 }])
  })

  it('the three methods differ on the same data, and all balance', () => {
    const a = person('a', 1, '2025-07-01', '2025-07-10')
    const b = person('b', 1, '2025-07-01', '2025-07-02')
    const expenses = [expense('a', 1000, '2025-07-02'), expense('a', 1000, '2025-07-08')]

    const owed = (method: 'shares' | 'shareDays' | 'presence') =>
      computeBalances([a, b], expenses, { method, vacation }).map((x) => x.owedCents)

    // Simple: half each. By day: B carries 2 of the 12 share-days. By expense:
    // B only takes half of the one they were there for.
    expect(owed('shares')).toEqual([1000, 1000])
    expect(owed('shareDays')).toEqual([1667, 333])
    expect(owed('presence')).toEqual([1500, 500])

    for (const method of ['shares', 'shareDays', 'presence'] as const) {
      expect(owed(method).reduce((sum, value) => sum + value, 0)).toBe(2000)
    }
  })
})
