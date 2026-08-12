<script setup lang="ts">
// StepTimeline — les étapes du parcours, en haut de l'écran
//
// Une étape rattachée à une vacance reste grisée et non cliquable tant qu'aucune
// n'est sélectionnée : au démarrage, seule la première étape est ouverte.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { STEPS, isStepReachable, stepIndex } from '@/domains/navigation/steps'
import { SERIES_COLORS } from '@/domains/shared/palette'
import { useVacationStore } from '@/stores/vacationStore'

const { t } = useI18n()
const route = useRoute()
const vacationStore = useVacationStore()

const currentIndex = computed(() => stepIndex(String(route.name ?? '')))

const currentLabel = computed(() => {
  const step = STEPS[currentIndex.value]
  return step ? t(step.labelKey) : ''
})

const steps = computed(() =>
  STEPS.map((step, index) => ({
    name: step.name,
    label: t(step.labelKey),
    position: index + 1,
    // Each step owns a hue, in the same fixed order as the chart series, so a
    // step keeps its colour whatever the journey does.
    color: SERIES_COLORS[index % SERIES_COLORS.length]!,
    reachable: isStepReachable(step, vacationStore.hasVacation),
    current: index === currentIndex.value,
    // "Done" is only meaningful once the journey has actually started.
    done: currentIndex.value > index,
  })),
)
</script>

<template>
  <nav class="timeline" :aria-label="t('steps.label')">
    <ol class="timeline-steps">
      <li
        v-for="step in steps"
        :key="step.name"
        class="timeline-step"
        :class="{ current: step.current, done: step.done, locked: !step.reachable }"
        :style="{ '--step-color': step.color }"
      >
        <RouterLink
          v-if="step.reachable"
          :to="{ name: step.name }"
          class="step-link"
          :aria-current="step.current ? 'step' : undefined"
        >
          <span class="step-marker">{{ step.position }}</span>
          <span class="step-label">{{ step.label }}</span>
        </RouterLink>

        <!-- Locked: rendered as plain text so it is neither clickable nor a
             tab stop, with the reason exposed to assistive tech. -->
        <span v-else class="step-link" :title="t('steps.locked')" :aria-disabled="true">
          <span class="step-marker">{{ step.position }}</span>
          <span class="step-label">{{ step.label }}</span>
          <span class="sr-only">— {{ t('steps.locked') }}</span>
        </span>
      </li>
    </ol>

    <!-- Phones: five long words cannot share one row without being chopped
         mid-syllable, so only the markers stay inline and the step being
         viewed is named in full underneath. -->
    <p v-if="currentLabel" class="current-label">{{ currentLabel }}</p>
  </nav>
</template>

<style scoped>
.timeline {
  width: 100%;
  overflow-x: auto;
  /* Flex items refuse to shrink below their content unless told to. Without
     this the timeline widens the whole page instead of scrolling itself. */
  min-width: 0;
}

.timeline-steps {
  display: flex;
  align-items: flex-start;
  list-style: none;
  min-width: min-content;
}

.timeline-step {
  flex: 1 1 0;
  /* Narrow enough that five steps still fit a small phone without scrolling. */
  min-width: 4rem;
  position: relative;
  display: flex;
  justify-content: center;
}

/* Connector between markers, drawn behind them. Coloured once walked past. */
.timeline-step::before {
  content: '';
  position: absolute;
  top: 0.9rem;
  right: 50%;
  left: -50%;
  height: 2px;
  background: var(--border);
}

.timeline-step:first-child::before {
  display: none;
}

.timeline-step.done::before,
.timeline-step.current::before {
  background: var(--step-color);
}

.step-link {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-xs);
  /* Without this the link sizes to its text and spills over its neighbours:
     `break-word` only breaks inside an already-constrained box. */
  max-width: 100%;
  min-width: 0;
  text-decoration: none;
  /* Text keeps its ink: three of these hues sit under 3:1 against the page, so
     the colour lives in the marker and never in a word or a figure. */
  color: var(--text);
  font-size: var(--font-size-xs);
  text-align: center;
  border-radius: var(--radius);
}

.step-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  border: 2px solid var(--step-color);
  background: var(--bg-page);
  color: var(--text);
  font-weight: 600;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.current-label {
  margin-top: var(--space-xs);
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text);
}

.step-label {
  display: none;
  line-height: 1.2;
  /* A centred flex child sizes to its content, so it escapes the link's
     max-width unless it is bounded in turn. */
  max-width: 100%;
  /* A long label wraps rather than widening its step — hyphenated at a real
     syllable break (the document carries `lang`), not chopped mid-word. */
  hyphens: auto;
  overflow-wrap: break-word;
}

.timeline-step:not(.locked) .step-link {
  cursor: pointer;
}

.timeline-step:not(.locked) .step-link:hover .step-marker {
  background: color-mix(in srgb, var(--step-color) 14%, var(--bg-page));
}

/* Walked past: filled with a tint light enough to keep the figure readable. */
.timeline-step.done .step-marker {
  background: color-mix(in srgb, var(--step-color) 18%, var(--bg-page));
}

/* Current: the same tint plus a ring, so position never rests on hue alone. */
.timeline-step.current .step-marker {
  background: color-mix(in srgb, var(--step-color) 22%, var(--bg-page));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--step-color) 22%, var(--bg-page));
}

.timeline-step.current .step-label {
  font-weight: 700;
}

/* Locked: greyed out, colour suppressed, no pointer, no interaction */
.timeline-step.locked {
  --step-color: var(--border);
}

.timeline-step.locked .step-link {
  cursor: not-allowed;
  color: var(--muted);
  opacity: 0.65;
}

.timeline-step.locked .step-marker {
  color: var(--muted);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (min-width: 768px) {
  /* Room enough for every name: the caption becomes redundant. */
  .current-label {
    display: none;
  }

  .step-label {
    display: block;
  }

  .timeline-step {
    min-width: 5.5rem;
  }

  .step-link {
    font-size: var(--font-size-sm);
  }

  .step-marker {
    width: 2.1rem;
    height: 2.1rem;
  }

  .timeline-step::before {
    top: 1.05rem;
  }
}
</style>
