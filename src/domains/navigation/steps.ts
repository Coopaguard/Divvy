// Parcours en étapes — source unique de vérité
//
// La timeline, les boutons précédent/suivant et les gardes du routeur lisent
// tous cette liste : l'ordre des étapes n'est donc défini qu'à un seul endroit.
// Ajouter une étape = ajouter une entrée ici et la route correspondante.

export interface Step {
  /** Route name — also the step's identity everywhere else. */
  name: string
  /** i18n key for the label shown in the timeline. */
  labelKey: string
  /**
   * Whether the step needs a selected vacation. People, expenses and the split
   * are all attached to one, so they stay locked until the user picks it.
   */
  requiresVacation: boolean
}

export const STEPS: readonly Step[] = [
  { name: 'vacations', labelKey: 'steps.vacations', requiresVacation: false },
  { name: 'people', labelKey: 'steps.people', requiresVacation: true },
  { name: 'expenses', labelKey: 'steps.expenses', requiresVacation: true },
  { name: 'results', labelKey: 'steps.results', requiresVacation: true },
]

/** First step — where the app starts, and where a locked navigation falls back. */
export const FIRST_STEP = STEPS[0] as Step

export function stepIndex(name: string): number {
  return STEPS.findIndex((step) => step.name === name)
}

/** Neighbours of a step, or null at either end of the journey. */
export function neighbours(name: string): { previous: Step | null; next: Step | null } {
  const index = stepIndex(name)
  if (index === -1) return { previous: null, next: null }
  return {
    previous: STEPS[index - 1] ?? null,
    next: STEPS[index + 1] ?? null,
  }
}

/** A step is reachable once its vacation requirement is met. */
export function isStepReachable(step: Step, hasVacation: boolean): boolean {
  return !step.requiresVacation || hasVacation
}
