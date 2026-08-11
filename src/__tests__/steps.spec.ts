// Tests: step journey definition
import { describe, it, expect } from 'vitest'
import {
  FIRST_STEP,
  STEPS,
  isStepReachable,
  neighbours,
  stepIndex,
} from '@/domains/navigation/steps'

describe('steps', () => {
  it('starts on the vacation choice', () => {
    expect(FIRST_STEP.name).toBe('vacations')
    expect(FIRST_STEP.requiresVacation).toBe(false)
  })

  it('gates every step after the first one on a selected vacation', () => {
    const [first, ...rest] = STEPS
    expect(first!.requiresVacation).toBe(false)
    expect(rest.every((step) => step.requiresVacation)).toBe(true)
  })

  it('walks the journey in order', () => {
    expect(STEPS.map((step) => step.name)).toEqual([
      'vacations',
      'people',
      'expenses',
      'results',
    ])
  })

  it('stepIndex returns -1 for an unknown step', () => {
    expect(stepIndex('nope')).toBe(-1)
  })

  it('neighbours links consecutive steps', () => {
    expect(neighbours('people')).toEqual({
      previous: STEPS[0],
      next: STEPS[2],
    })
  })

  it('neighbours has no previous on the first step', () => {
    expect(neighbours('vacations').previous).toBeNull()
  })

  it('neighbours has no next on the last step', () => {
    expect(neighbours('results').next).toBeNull()
  })

  it('neighbours of an unknown step are empty', () => {
    expect(neighbours('nope')).toEqual({ previous: null, next: null })
  })

  it('locks the vacation-bound steps until one is selected', () => {
    for (const step of STEPS) {
      expect(isStepReachable(step, false)).toBe(!step.requiresVacation)
      expect(isStepReachable(step, true)).toBe(true)
    }
  })
})
