<script setup lang="ts">
// PeopleList — list people with add/edit/delete actions
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '@/stores/peopleStore'
import { useVacationStore } from '@/stores/vacationStore'
import { useExpenseStore } from '@/stores/expenseStore'
import PersonForm from './PersonForm.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import RowActions from './RowActions.vue'
import type { RowAction } from './RowActions.vue'
import type { Person, PersonDraft } from '@/domains/people/types'

const { t } = useI18n()
const peopleStore = usePeopleStore()
const vacationStore = useVacationStore()
const expenseStore = useExpenseStore()

const showForm = ref(false)
const editingPerson = ref<Person | null>(null)
const confirmDeleteId = ref<string | null>(null)
const saving = ref(false)
const failure = ref<string | null>(null)

function openAdd(): void {
  editingPerson.value = null
  failure.value = null
  showForm.value = true
}

const rowActions = computed<RowAction[]>(() => [
  { key: 'edit', label: t('common.edit') },
  { key: 'delete', label: t('common.delete'), danger: true },
])

function onRowAction(key: string, person: Person): void {
  if (key === 'edit') openEdit(person)
  else confirmDeleteId.value = person.id
}

function openEdit(person: Person): void {
  editingPerson.value = person
  failure.value = null
  showForm.value = true
}

function cancelForm(): void {
  showForm.value = false
  editingPerson.value = null
  failure.value = null
}

async function savePerson(draft: PersonDraft): Promise<void> {
  const vacation = vacationStore.vacation
  if (!vacation) return

  saving.value = true
  failure.value = null
  const editing = editingPerson.value
  const saved = editing
    ? await peopleStore.updatePerson(editing.id, draft)
    : (await peopleStore.addPerson(vacation.id, draft)) !== null
  saving.value = false

  // Keep the form open on failure so the input is not lost.
  if (!saved) {
    failure.value = t('common.error.saveFailed')
    return
  }
  showForm.value = false
  editingPerson.value = null
}

async function confirmDelete(id: string): Promise<void> {
  failure.value = null
  const deleted = await peopleStore.deletePerson(id)
  if (!deleted) failure.value = t('common.error.deleteFailed')
  confirmDeleteId.value = null
}

// Deleting a person cascades to the expenses they paid: say so up front.
const deleteMessage = computed(() => {
  const id = confirmDeleteId.value
  const count = id ? expenseStore.countByPayer(id) : 0
  return count > 0
    ? t('people.confirmDeleteWithExpenses', { count }, count)
    : t('people.confirmDelete')
})

function formatDate(date: string): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <section id="section-people" class="section-card">
    <div class="section-header">
      <h2 class="section-title">{{ t('people.title') }}</h2>
      <button class="btn-primary" @click="openAdd">
        + {{ t('people.add') }}
      </button>
    </div>

    <!-- Empty state -->
    <p v-if="peopleStore.people.length === 0 && !showForm" class="empty-state">
      {{ t('people.empty') }}
    </p>

    <!-- People table -->
    <table v-else-if="peopleStore.people.length > 0 && !showForm" class="people-table">
      <thead>
        <tr>
          <th>{{ t('people.fields.name') }}</th>
          <th>{{ t('people.fields.shares') }}</th>
          <th>{{ t('people.fields.arrivalDate') }}</th>
          <th>{{ t('people.fields.departureDate') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="person in peopleStore.people" :key="person.id">
          <td>{{ person.name }}</td>
          <td>{{ person.shares }}</td>
          <td>{{ formatDate(person.arrivalDate) }}</td>
          <td>{{ formatDate(person.departureDate) }}</td>
          <td class="actions-cell">
            <RowActions
              :actions="rowActions"
              :label="t('common.actions')"
              @select="onRowAction($event, person)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Inline form (add/edit) -->
    <div v-if="showForm" class="form-panel">
      <h3 class="form-panel-title">
        {{ editingPerson ? t('people.actions.edit') : t('people.add') }}
      </h3>
      <PersonForm
        :person="editingPerson"
        :disabled="saving"
        @save="savePerson"
        @cancel="cancelForm"
      />
    </div>

    <p v-if="failure" class="list-failure" role="alert">{{ failure }}</p>

    <!-- Confirm delete dialog -->
    <ConfirmDialog
      :open="confirmDeleteId !== null"
      :message="deleteMessage"
      @confirm="confirmDelete(confirmDeleteId!)"
      @cancel="confirmDeleteId = null"
    />
  </section>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text);
}

.list-failure {
  font-size: var(--font-size-sm);
  color: #cf222e;
  padding-top: var(--space-md);
}

.empty-state {
  color: var(--muted);
  font-size: var(--font-size-sm);
  padding: var(--space-lg) 0;
  text-align: center;
}

.people-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.people-table th,
.people-table td {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.people-table th {
  color: var(--muted);
  font-weight: 500;
  white-space: nowrap;
}

.people-table tbody tr:last-child td {
  border-bottom: none;
}

.actions-cell {
  text-align: right;
  /* Shrink to the button: this column carries no data, only a way in. */
  width: 1%;
  white-space: nowrap;
}

.form-panel {
  border-top: 1px solid var(--border);
  padding-top: var(--space-lg);
  margin-top: var(--space-sm);
}

.form-panel-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--text);
}

/* Phones: the actions collapse into a menu, so the cells can give the columns
   that actually carry information the room they need. */
@media (max-width: 767px) {
  .people-table th,
  .people-table td {
    padding: var(--space-xs) var(--space-sm);
  }

  .actions-cell {
    padding-left: 0;
  }
}

@media (max-width: 600px) {
  .people-table th:nth-child(3),
  .people-table td:nth-child(3),
  .people-table th:nth-child(4),
  .people-table td:nth-child(4) {
    display: none;
  }
}
</style>
