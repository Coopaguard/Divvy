<script setup lang="ts">
// StepTimeline — les étapes du parcours, en haut de l'écran
//
// Une étape rattachée à une vacance reste grisée et non cliquable tant qu'aucune
// n'est sélectionnée : au démarrage, seule la première étape est ouverte.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { STEPS, isStepReachable, stepIndex } from '@/domains/navigation/steps'
import { useVacationStore } from '@/stores/vacationStore'

const { t } = useI18n()
const route = useRoute()
const vacationStore = useVacationStore()

const currentIndex = computed(() => stepIndex(String(route.name ?? '')))

const steps = computed(() =>
  STEPS.map((step, index) => ({
    name: step.name,
    label: t(step.labelKey),
    position: index + 1,
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

/* Connector between markers, drawn behind them. */
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
  background: var(--primary);
}

.step-link {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-xs);
  text-decoration: none;
  color: var(--muted);
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
  border: 2px solid var(--border);
  background: var(--bg-page);
  color: var(--muted);
  font-weight: 600;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.step-label {
  line-height: 1.2;
  /* A long single-word label wraps rather than widening its step. */
  overflow-wrap: anywhere;
}

/* Reachable but not visited yet */
.timeline-step:not(.locked) .step-link {
  color: var(--text);
  cursor: pointer;
}

.timeline-step:not(.locked) .step-link:hover .step-marker {
  border-color: var(--primary);
  color: var(--primary);
}

.timeline-step.done .step-marker {
  border-color: var(--primary);
  color: var(--primary);
}

.timeline-step.current .step-marker {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}

.timeline-step.current .step-label {
  color: var(--primary);
  font-weight: 700;
}

/* Locked: greyed out, no pointer, no interaction */
.timeline-step.locked .step-link {
  cursor: not-allowed;
  opacity: 0.45;
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
