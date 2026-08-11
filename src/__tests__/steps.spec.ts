// Tests: step journey definition
import { describe, it, expect } from 'vitest'
import {
  FIRST_STEP,
  STEPS,
  isStepReachable,
  neighbours,
  stepIndex,
} from '@/domains/navigation/steps'
import fr from '@/i18n/locales/fr.json'
import en from '@/i18n/locales/en.json'

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

  // One vocabulary, not two: a step is named exactly like the section it opens.
  // Renaming one side without the other is what this guards against.
  //
  // The locale files are read through a loose shape on purpose: the assertion
  // is about two keys matching, not about the catalogue's structure.
  type Messages = Record<string, Record<string, unknown>>

  describe.each<[string, Messages]>([
    ['fr', fr],
    ['en', en],
  ])('%s labels', (_locale, messages) => {
    it.each(STEPS.map((step) => step.name))('names the %s step after its section', (name) => {
      const stepLabel = messages.steps?.[name]
      const sectionTitle = messages[name]?.title

      expect(stepLabel).toBeTruthy()
      expect(stepLabel).toBe(sectionTitle)
    })
  })
})
