// Répartition d'un entier au prorata de poids
//
// Une division ne tombe pas juste : 100 % partagés entre 3 donne 33 + 33 + 33,
// et il manque 1. Plutôt que de perdre ce reste à l'arrondi, on le distribue —
// la somme des parts reste donc **exactement** égale au total demandé.
//
// Utilisé pour les pourcentages du camembert, et prévu pour les centimes de la
// répartition (phase 6), où la contrainte est la même à l'euro près.

/**
 * Splits `total` into integer parts proportional to `weights`, using the
 * largest-remainder method. The parts always sum to exactly `total`.
 *
 * Ties on the remainder go to the earliest weight, so the same input always
 * produces the same output — no coin flip decides who gets the extra cent.
 *
 * Returns all zeros when the weights carry nothing to share (empty, all zero,
 * or negative): there is no meaningful proportion to apply.
 */
export function distribute(weights: readonly number[], total: number): number[] {
  const zeros = weights.map(() => 0)
  if (weights.some((weight) => weight < 0) || !Number.isFinite(total)) return zeros

  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  if (weightSum <= 0) return zeros

  const exact = weights.map((weight) => (total * weight) / weightSum)
  const parts = exact.map((value) => Math.floor(value))

  // What the flooring left on the table goes to whoever was cut the most.
  // Each part loses less than one unit, so there are always enough candidates.
  const remaining = total - parts.reduce((sum, part) => sum + part, 0)
  const bumped = new Set(
    exact
      .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
      .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
      .slice(0, Math.max(0, remaining))
      .map((entry) => entry.index),
  )

  return parts.map((part, index) => part + (bumped.has(index) ? 1 : 0))
}
