<script setup lang="ts">
// StepNav — « Précédent » / « Suivant » en bas de chaque étape
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { isStepReachable, neighbours } from '@/domains/navigation/steps'
import { useVacationStore } from '@/stores/vacationStore'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const vacationStore = useVacationStore()

const around = computed(() => neighbours(String(route.name ?? '')))

/**
 * Both ends of the journey leave a button with nowhere to go. It stays visible
 * but disabled, so the pair of buttons never shifts position between steps.
 */
const previous = computed(() => around.value.previous)

// Moving forward is blocked by the very rule the timeline shows: the next step
// needs a vacation and none is selected.
const next = computed(() => {
  const step = around.value.next
  if (!step) return null
  return isStepReachable(step, vacationStore.hasVacation) ? step : null
})

const nextExistsButLocked = computed(() => around.value.next !== null && next.value === null)

function go(name: string | undefined): void {
  if (name) router.push({ name })
}
</script>

<template>
  <nav class="step-nav" :aria-label="t('stepNav.label')">
    <button
      type="button"
      class="btn-secondary"
      :disabled="!previous"
      @click="go(previous?.name)"
    >
      ← {{ t('stepNav.previous') }}
    </button>

    <button
      type="button"
      class="btn-primary"
      :disabled="!next"
      :title="nextExistsButLocked ? t('steps.locked') : undefined"
      @click="go(next?.name)"
    >
      {{ t('stepNav.next') }} →
    </button>
  </nav>
</template>

<style scoped>
.step-nav {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  margin-top: auto;
  border-top: 1px solid var(--border);
}

.step-nav button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
