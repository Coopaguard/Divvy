<script setup lang="ts">
// ExpensesPieChart — part de chaque payeur dans le total, en camembert
//
// Forme : part-à-tout lu d'un coup d'œil, ce que le camembert fait bien tant
// qu'il reste peu de parts. Au-delà de six, les petites tranches deviennent
// illisibles : la queue est donc regroupée sous « Autres », et le tableau
// juste en dessous reste la lecture exacte, part par part.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useExpenseStore } from '@/stores/expenseStore'
import { usePeopleStore } from '@/stores/peopleStore'
import { formatCents } from '@/domains/shared/money'
import { distribute } from '@/domains/shared/allocation'

const { t, locale } = useI18n()
const expenseStore = useExpenseStore()
const peopleStore = usePeopleStore()

/**
 * Categorical hues in fixed order, validated against the white chart surface
 * (lightness band, chroma floor, CVD separation, normal-vision floor).
 *
 * A hue belongs to a *person*, picked by their position in the people list —
 * never by their rank in the chart. Paying more must not repaint everyone.
 */
const SERIES_COLORS = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  '#e34948',
] as const

/** Recessive grey for the folded tail — it is a bucket, not a series. */
const OTHER_COLOR = '#8c8c88'

/** Above this, slices get too thin to compare; the tail folds into "Others". */
const MAX_SLICES = 6

const RADIUS = 40
const CENTER = 50

interface Slice {
  key: string
  label: string
  paidCents: number
  color: string
  percent: number
}

/** Payers only: a zero slice has no angle to draw, and the table already lists them. */
const payers = computed(() =>
  peopleStore.people
    .map((person, index) => ({
      key: person.id,
      label: person.name,
      paidCents: expenseStore.totalByPayer.get(person.id) ?? 0,
      // Beyond the palette, a person has no hue of their own and joins "Others".
      color: SERIES_COLORS[index] ?? null,
    }))
    .filter((entry) => entry.paidCents > 0)
    .sort((a, b) => b.paidCents - a.paidCents || a.label.localeCompare(b.label)),
)

const slices = computed<Slice[]>(() => {
  const all = payers.value
  const needsFolding = all.length > MAX_SLICES || all.some((entry) => entry.color === null)

  const shown = needsFolding ? all.slice(0, MAX_SLICES - 1) : all
  const folded = needsFolding ? all.slice(MAX_SLICES - 1) : []

  const entries: Omit<Slice, 'percent'>[] = shown.map((entry, index) => ({
    key: entry.key,
    label: entry.label,
    paidCents: entry.paidCents,
    color: entry.color ?? SERIES_COLORS[index]!,
  }))

  if (folded.length > 0) {
    entries.push({
      key: '__others__',
      label: t('results.others', folded.length),
      paidCents: folded.reduce((total, entry) => total + entry.paidCents, 0),
      color: OTHER_COLOR,
    })
  }

  // Percentages are shared out so they add up to exactly 100 — a legend whose
  // figures sum to 99 reads as a bug even when every amount is right.
  const percents = distribute(
    entries.map((entry) => entry.paidCents),
    100,
  )

  return entries.map((entry, index) => ({ ...entry, percent: percents[index]! }))
})

const totalCents = computed(() =>
  slices.value.reduce((total, slice) => total + slice.paidCents, 0),
)

const hasData = computed(() => slices.value.length > 0 && totalCents.value > 0)

/** A lone payer owns the whole circle, which no arc can draw — hence a disc. */
const isSingleSlice = computed(() => slices.value.length === 1)

function pointOnCircle(fraction: number): [number, number] {
  // Start at 12 o'clock and run clockwise, the direction a pie is read in.
  const angle = fraction * 2 * Math.PI - Math.PI / 2
  return [CENTER + RADIUS * Math.cos(angle), CENTER + RADIUS * Math.sin(angle)]
}

/** Slice paths, laid end to end around the circle. */
const paths = computed(() => {
  let start = 0
  return slices.value.map((slice) => {
    const fraction = slice.paidCents / totalCents.value
    const end = start + fraction
    const [x1, y1] = pointOnCircle(start)
    const [x2, y2] = pointOnCircle(end)
    const largeArc = fraction > 0.5 ? 1 : 0
    start = end

    return {
      key: slice.key,
      color: slice.color,
      d: `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`,
    }
  })
})

function amount(cents: number): string {
  return formatCents(cents, locale.value)
}

/** Spoken summary, so the figure is not a silent picture to a screen reader. */
const chartSummary = computed(() =>
  slices.value.map((slice) => `${slice.label} ${slice.percent}%`).join(', '),
)
</script>

<template>
  <figure v-if="hasData" class="chart">
    <figcaption class="chart-title">{{ t('results.chart') }}</figcaption>

    <div class="chart-body">
      <svg
        class="pie"
        viewBox="0 0 100 100"
        role="img"
        :aria-label="`${t('results.chart')}: ${chartSummary}`"
      >
        <!-- A 2px surface-coloured stroke separates neighbouring fills, which
             also keeps two close hues apart for a colourblind reader. -->
        <circle
          v-if="isSingleSlice"
          :cx="CENTER"
          :cy="CENTER"
          :r="RADIUS"
          :fill="slices[0]!.color"
        />
        <path
          v-for="path in paths"
          v-else
          :key="path.key"
          :d="path.d"
          :fill="path.color"
          stroke="var(--bg-page)"
          stroke-width="2"
          stroke-linejoin="round"
        />
      </svg>

      <!-- Values in text, not colour alone: three of these hues sit below 3:1
           against the page, so the figures have to be readable without them. -->
      <ul class="legend">
        <li v-for="slice in slices" :key="slice.key" class="legend-row">
          <span class="legend-swatch" :style="{ background: slice.color }" aria-hidden="true" />
          <span class="legend-label">{{ slice.label }}</span>
          <span class="legend-percent">{{ slice.percent }}%</span>
          <span class="legend-amount">{{ amount(slice.paidCents) }}</span>
        </li>
      </ul>
    </div>
  </figure>
</template>

<style scoped>
.chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  /* Breathing room before the table heading that follows in the slot. */
  margin-bottom: var(--space-xl);
}

.chart-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text);
}

.chart-body {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  flex-wrap: wrap;
}

.pie {
  width: 180px;
  height: 180px;
  flex-shrink: 0;
}

.legend {
  list-style: none;
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.legend-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-label {
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-percent,
.legend-amount {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.legend-amount {
  color: var(--text);
  font-weight: 600;
  min-width: 5.5rem;
  text-align: right;
}

@media (max-width: 600px) {
  .chart-body {
    gap: var(--space-lg);
    justify-content: center;
  }
}
</style>
