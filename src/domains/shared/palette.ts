// Palette catégorielle — une teinte par entité
//
// Validée contre la surface blanche de l'application : bande de luminosité,
// plancher de chroma, séparation daltonisme (ΔE ≥ 8 sur les paires voisines) et
// plancher vision normale. Trois de ces teintes passent sous 3:1 de contraste
// avec la page : elles ne portent donc jamais une information à elles seules —
// un libellé ou un chiffre en encre l'accompagne toujours.
//
// L'ordre est fixe et ne se recycle pas : la 9ᵉ entité n'invente pas une teinte,
// elle rejoint le groupe « Autres ».

export const SERIES_COLORS = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
] as const

/** Recessive grey for a folded tail — a bucket, not a series. */
export const OTHER_COLOR = '#8c8c88'

/** Hue owned by the entity at `index`, or null once the palette runs out. */
export function seriesColor(index: number): string | null {
  return SERIES_COLORS[index] ?? null
}
