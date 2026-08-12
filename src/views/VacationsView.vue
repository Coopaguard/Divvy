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
import RowActions from '@/ui/components/RowActions.vue'
import type { RowAction } from '@/ui/components/RowActions.vue'
import { bundleFileName, parseDivvyFile, type ParseFailure } from '@/domains/importExport/format'
import { serialiseBundle } from '@/domains/importExport/format'
import { canShareFiles, downloadFile, readFileText, shareFile } from '@/domains/importExport/file'
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
const fileInput = ref<HTMLInputElement | null>(null)
const busy = ref(false)

// Le partage natif n'existe pas partout : plutôt qu'un bouton qui échoue, on ne
// le propose que là où il fonctionnera.
const sharingAvailable = canShareFiles()

const rowActions = computed<RowAction[]>(() => [
  { key: 'export', label: t('transfer.export') },
  ...(sharingAvailable ? [{ key: 'share', label: t('transfer.share') }] : []),
  { key: 'delete', label: t('common.delete'), danger: true },
])

async function onRowAction(key: string, vacation: Vacation): Promise<void> {
  if (key === 'delete') {
    pendingDelete.value = vacation
    return
  }

  failure.value = null
  busy.value = true
  const bundle = await vacationStore.collectBundle(vacation.id)
  busy.value = false
  if (!bundle) {
    failure.value = t('transfer.errors.exportFailed')
    return
  }

  const fileName = bundleFileName(vacation)
  const contents = serialiseBundle(bundle)

  if (key === 'export') {
    downloadFile(fileName, contents)
    return
  }

  const outcome = await shareFile(fileName, contents)
  // Refermer la feuille de partage n'est pas un échec à signaler.
  if (outcome === 'failed') failure.value = t('transfer.errors.shareFailed')
}

const importErrors: Record<ParseFailure, string> = {
  notJson: 'transfer.errors.notDivvy',
  notDivvy: 'transfer.errors.notDivvy',
  unsupportedVersion: 'transfer.errors.unsupportedVersion',
  invalidData: 'transfer.errors.invalidData',
}

async function onFileChosen(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Choisir deux fois le même fichier doit relancer un import : sans cela,
  // `change` ne se déclenche pas la seconde fois.
  input.value = ''
  if (!file) return

  failure.value = null
  busy.value = true

  const text = await readFileText(file)
  const parsed = text === null ? null : parseDivvyFile(text)

  if (!parsed) {
    busy.value = false
    failure.value = t('transfer.errors.readFailed')
    return
  }
  if (!parsed.ok) {
    busy.value = false
    failure.value = t(importErrors[parsed.reason])
    return
  }

  const imported = await vacationStore.importBundle(parsed.bundle)
  busy.value = false
  if (!imported) failure.value = t('transfer.errors.importFailed')
}

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
      <div v-if="!showNewForm" class="head-actions">
        <button class="btn-secondary" :disabled="busy" @click="fileInput?.click()">
          {{ t('transfer.import') }}
        </button>
        <button class="btn-primary" @click="showNewForm = true">
          {{ t('vacations.new') }}
        </button>
        <!-- Hors flux : le bouton ci-dessus lui sert de déclencheur. -->
        <input
          ref="fileInput"
          type="file"
          class="file-input"
          accept=".divvy,application/json"
          @change="onFileChosen"
        />
      </div>
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

        <RowActions
          :actions="rowActions"
          :label="`${t('common.actions')} — ${vacation.name}`"
          @select="onRowAction($event, vacation)"
        />
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

.head-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

/* Le champ fichier n'est jamais montré : le bouton l'actionne. */
.file-input {
  display: none;
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
