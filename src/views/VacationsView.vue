<script setup lang="ts">
// VacationsView — étape 1 : choisir, créer ou supprimer une vacance
//
// C'est la seule étape accessible tant qu'aucune vacance n'est sélectionnée :
// tout le reste du parcours est rattaché à celle qu'on choisit ici.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVacationStore } from '@/stores/vacationStore'
import VacationForm from '@/ui/components/VacationForm.vue'
import ConfirmDialog from '@/ui/components/ConfirmDialog.vue'
import type { Vacation, VacationDraft } from '@/domains/vacations/types'

const { t, locale } = useI18n()
const vacationStore = useVacationStore()

const showNewForm = ref(false)
const newName = ref('')
const newStart = ref('')
const newEnd = ref('')
const creating = ref(false)
const failure = ref<string | null>(null)
const errors = ref<Record<string, string>>({})
const pendingDelete = ref<Vacation | null>(null)

const vacations = computed(() => vacationStore.sortedVacations)

function formatRange(vacation: Vacation): string {
  const format = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(locale.value, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  return `${format(vacation.startDate)} → ${format(vacation.endDate)}`
}

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

function resetNewForm(): void {
  showNewForm.value = false
  newName.value = ''
  newStart.value = ''
  newEnd.value = ''
  errors.value = {}
}

/** Creating a vacation also selects it — the journey can carry on right away. */
async function create(): Promise<void> {
  if (!validate()) return
  creating.value = true
  failure.value = null
  const draft: VacationDraft = {
    name: newName.value.trim(),
    startDate: newStart.value,
    endDate: newEnd.value,
  }
  const created = await vacationStore.createVacation(draft)
  creating.value = false
  if (!created) {
    failure.value = t('common.error.saveFailed')
    return
  }
  resetNewForm()
}

async function confirmDelete(): Promise<void> {
  const target = pendingDelete.value
  pendingDelete.value = null
  if (!target) return

  failure.value = null
  const deleted = await vacationStore.deleteVacation(target.id)
  if (!deleted) failure.value = t('common.error.deleteFailed')
}
</script>

<template>
  <section class="section-card">
    <header class="section-head">
      <h2 class="section-title">{{ t('vacations.title') }}</h2>
      <button v-if="!showNewForm" class="btn-primary" @click="showNewForm = true">
        {{ t('vacations.new') }}
      </button>
    </header>

    <form v-if="showNewForm" class="new-form" @submit.prevent="create">
      <div class="field">
        <label for="new-name">{{ t('vacations.fields.name') }}</label>
        <input
          id="new-name"
          v-model="newName"
          type="text"
          :class="{ error: errors.name }"
          :placeholder="t('vacations.fields.name')"
          autocomplete="off"
        />
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="new-start">{{ t('vacations.fields.startDate') }}</label>
          <input id="new-start" v-model="newStart" type="date" :class="{ error: errors.startDate }" />
          <span v-if="errors.startDate" class="field-error">{{ errors.startDate }}</span>
        </div>
        <div class="field">
          <label for="new-end">{{ t('vacations.fields.endDate') }}</label>
          <input id="new-end" v-model="newEnd" type="date" :class="{ error: errors.endDate }" />
          <span v-if="errors.endDate" class="field-error">{{ errors.endDate }}</span>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn-secondary" :disabled="creating" @click="resetNewForm">
          {{ t('common.cancel') }}
        </button>
        <button type="submit" class="btn-primary" :disabled="creating">
          {{ creating ? t('common.loading') : t('common.save') }}
        </button>
      </div>
    </form>

    <p v-if="failure" class="form-failure" role="alert">{{ failure }}</p>

    <p v-if="vacations.length === 0" class="empty-state">{{ t('vacations.empty') }}</p>

    <ul v-else class="vacation-list">
      <li
        v-for="vacation in vacations"
        :key="vacation.id"
        class="vacation-item"
        :class="{ selected: vacation.id === vacationStore.selectedId }"
      >
        <button
          type="button"
          class="vacation-choose"
          :aria-pressed="vacation.id === vacationStore.selectedId"
          @click="vacationStore.select(vacation.id)"
        >
          <span class="vacation-name">{{ vacation.name }}</span>
          <span class="vacation-dates">{{ formatRange(vacation) }}</span>
        </button>

        <span v-if="vacation.id === vacationStore.selectedId" class="badge">
          {{ t('vacations.selected') }}
        </span>

        <button
          type="button"
          class="btn-danger btn-small"
          :aria-label="`${t('common.delete')} — ${vacation.name}`"
          @click="pendingDelete = vacation"
        >
          {{ t('common.delete') }}
        </button>
      </li>
    </ul>

    <ConfirmDialog
      :open="pendingDelete !== null"
      :message="t('vacations.confirmDelete')"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />
  </section>

  <!-- Editing only makes sense once a vacation is chosen. -->
  <VacationForm v-if="vacationStore.hasVacation" />
</template>

<style scoped>
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text);
}

.empty-state {
  color: var(--muted);
  font-size: var(--font-size-sm);
  padding: var(--space-lg) 0;
  text-align: center;
}

.vacation-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.vacation-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.vacation-item.selected {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.vacation-choose {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
}

.vacation-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text);
}

.vacation-dates {
  font-size: var(--font-size-xs);
  color: var(--muted);
}

.badge {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--primary);
  border: 1px solid var(--primary);
  border-radius: var(--radius);
  padding: 2px var(--space-xs);
  white-space: nowrap;
}

.btn-small {
  font-size: var(--font-size-xs);
  padding: var(--space-xs) var(--space-sm);
}

.new-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
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

.form-failure {
  font-size: var(--font-size-sm);
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

  .vacation-item {
    flex-wrap: wrap;
  }
}
</style>
