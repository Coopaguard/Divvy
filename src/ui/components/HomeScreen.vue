<script setup lang="ts">
// HomeScreen — initial landing: resume or start a new vacation
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVacationStore } from '@/stores/vacationStore'
import type { VacationDraft } from '@/domains/vacations/types'

const { t } = useI18n()
const vacationStore = useVacationStore()

const showNewForm = ref(false)
const newName = ref('')
const newStart = ref('')
const newEnd = ref('')
const errors = ref<Record<string, string>>({})

function validate(): boolean {
  errors.value = {}
  if (!newName.value.trim()) errors.value.name = t('vacations.errors.nameRequired')
  if (!newStart.value) errors.value.startDate = t('vacations.errors.startDateRequired')
  if (!newEnd.value) errors.value.endDate = t('vacations.errors.endDateRequired')
  if (newStart.value && newEnd.value && newStart.value > newEnd.value) {
    errors.value.endDate = t('vacations.errors.endBeforeStart')
  }
  return Object.keys(errors.value).length === 0
}

async function startNew(): Promise<void> {
  if (!validate()) return
  const draft: VacationDraft = {
    name: newName.value.trim(),
    startDate: newStart.value,
    endDate: newEnd.value,
  }
  await vacationStore.createVacation(draft)
}
</script>

<template>
  <div class="home-screen">
    <div class="home-card section-card">
      <h1 class="app-name">{{ t('app.name') }}</h1>
      <p class="app-tagline">{{ t('app.tagline') }}</p>

      <div v-if="!showNewForm" class="home-actions">
        <button class="btn-primary" @click="showNewForm = true">
          {{ t('home.new') }}
        </button>
      </div>

      <form v-else class="new-form" @submit.prevent="startNew">
        <div class="field">
          <label for="new-name">{{ t('vacations.fields.name') }}</label>
          <input
            id="new-name"
            v-model="newName"
            type="text"
            :class="{ error: errors.name }"
            :placeholder="t('vacations.fields.name')"
            autocomplete="off"
            autofocus
          />
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="new-start">{{ t('vacations.fields.startDate') }}</label>
            <input
              id="new-start"
              v-model="newStart"
              type="date"
              :class="{ error: errors.startDate }"
            />
            <span v-if="errors.startDate" class="field-error">{{ errors.startDate }}</span>
          </div>
          <div class="field">
            <label for="new-end">{{ t('vacations.fields.endDate') }}</label>
            <input
              id="new-end"
              v-model="newEnd"
              type="date"
              :class="{ error: errors.endDate }"
            />
            <span v-if="errors.endDate" class="field-error">{{ errors.endDate }}</span>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="showNewForm = false">
            {{ t('common.cancel') }}
          </button>
          <button type="submit" class="btn-primary">
            {{ t('common.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.home-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-lg);
}

.home-card {
  max-width: 480px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.app-name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--primary);
}

.app-tagline {
  font-size: var(--font-size-base);
  color: var(--muted);
}

.home-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.new-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.field label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text);
}

.field-row {
  display: flex;
  gap: var(--space-md);
}

.field-row .field {
  flex: 1;
}

.field-error {
  font-size: var(--font-size-xs);
  color: #cf222e;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

@media (max-width: 600px) {
  .field-row {
    flex-direction: column;
  }
}
</style>
