<script setup lang="ts">
// VacationForm — edit vacation title and dates
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVacationStore } from '@/stores/vacationStore'
import type { VacationDraft } from '@/domains/vacations/types'

const { t } = useI18n()
const vacationStore = useVacationStore()

const name = ref(vacationStore.vacation?.name ?? '')
const startDate = ref(vacationStore.vacation?.startDate ?? '')
const endDate = ref(vacationStore.vacation?.endDate ?? '')
const saving = ref(false)
const errors = ref<Record<string, string>>({})

// Keep form in sync if store updates externally
watch(
  () => vacationStore.vacation,
  (v) => {
    if (v) {
      name.value = v.name
      startDate.value = v.startDate
      endDate.value = v.endDate
    }
  },
)

function validate(): boolean {
  errors.value = {}
  if (!name.value.trim()) errors.value.name = t('vacations.errors.nameRequired')
  if (!startDate.value) errors.value.startDate = t('vacations.errors.startDateRequired')
  if (!endDate.value) errors.value.endDate = t('vacations.errors.endDateRequired')
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    errors.value.endDate = t('vacations.errors.endBeforeStart')
  }
  return Object.keys(errors.value).length === 0
}

async function save(): Promise<void> {
  if (!validate()) return
  saving.value = true
  const draft: VacationDraft = {
    name: name.value.trim(),
    startDate: startDate.value,
    endDate: endDate.value,
  }
  if (vacationStore.vacation) {
    await vacationStore.updateVacation(draft)
  } else {
    await vacationStore.createVacation(draft)
  }
  saving.value = false
}
</script>

<template>
  <section id="section-vacations" class="section-card">
    <h2 class="section-title">{{ t('vacations.title') }}</h2>
    <form class="vacation-form" @submit.prevent="save">
      <div class="field">
        <label for="vacation-name">{{ t('vacations.fields.name') }}</label>
        <input
          id="vacation-name"
          v-model="name"
          type="text"
          :class="{ error: errors.name }"
          :placeholder="t('vacations.fields.name')"
          autocomplete="off"
        />
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="vacation-start">{{ t('vacations.fields.startDate') }}</label>
          <input
            id="vacation-start"
            v-model="startDate"
            type="date"
            :class="{ error: errors.startDate }"
          />
          <span v-if="errors.startDate" class="field-error">{{ errors.startDate }}</span>
        </div>
        <div class="field">
          <label for="vacation-end">{{ t('vacations.fields.endDate') }}</label>
          <input
            id="vacation-end"
            v-model="endDate"
            type="date"
            :class="{ error: errors.endDate }"
          />
          <span v-if="errors.endDate" class="field-error">{{ errors.endDate }}</span>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--space-lg);
  color: var(--text);
}

.vacation-form {
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
  padding-top: var(--space-xs);
}

@media (max-width: 600px) {
  .field-row {
    flex-direction: column;
  }
}
</style>
