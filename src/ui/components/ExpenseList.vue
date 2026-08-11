<script setup lang="ts">
// ExpenseList — list expenses (most recent first) with add/edit/delete actions
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useExpenseStore } from '@/stores/expenseStore'
import { usePeopleStore } from '@/stores/peopleStore'
import { useVacationStore } from '@/stores/vacationStore'
import { formatCents } from '@/domains/shared/money'
import ExpenseForm from './ExpenseForm.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import type { Expense, ExpenseDraft } from '@/domains/expenses/types'

const { t, locale } = useI18n()
const expenseStore = useExpenseStore()
const peopleStore = usePeopleStore()
const vacationStore = useVacationStore()

const showForm = ref(false)
const editingExpense = ref<Expense | null>(null)
const confirmDeleteId = ref<string | null>(null)
const saving = ref(false)
const failure = ref<string | null>(null)

// An expense needs a payer, so the form stays closed until someone exists.
const canAddExpense = computed(() => peopleStore.people.length > 0)

const payerNames = computed(
  () => new Map(peopleStore.people.map((person) => [person.id, person.name])),
)

function payerName(payerId: string): string {
  return payerNames.value.get(payerId) ?? '—'
}

function amount(cents: number): string {
  return formatCents(cents, locale.value)
}

function formatDate(date: string): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(locale.value)
}

function openAdd(): void {
  editingExpense.value = null
  failure.value = null
  showForm.value = true
}

function openEdit(expense: Expense): void {
  editingExpense.value = expense
  failure.value = null
  showForm.value = true
}

function cancelForm(): void {
  showForm.value = false
  editingExpense.value = null
  failure.value = null
}

async function saveExpense(draft: ExpenseDraft): Promise<void> {
  const vacation = vacationStore.vacation
  if (!vacation) return

  saving.value = true
  failure.value = null
  const editing = editingExpense.value
  const saved = editing
    ? await expenseStore.updateExpense(editing.id, draft)
    : (await expenseStore.addExpense(vacation.id, draft)) !== null
  saving.value = false

  // Keep the form open on failure so the input is not lost.
  if (!saved) {
    failure.value = t('common.error.saveFailed')
    return
  }
  showForm.value = false
  editingExpense.value = null
}

async function confirmDelete(id: string): Promise<void> {
  failure.value = null
  const deleted = await expenseStore.deleteExpense(id)
  if (!deleted) failure.value = t('common.error.deleteFailed')
  confirmDeleteId.value = null
}
</script>

<template>
  <section id="section-expenses" class="section-card">
    <div class="section-header">
      <h2 class="section-title">{{ t('expenses.title') }}</h2>
      <button v-if="canAddExpense" class="btn-primary" @click="openAdd">
        + {{ t('expenses.add') }}
      </button>
    </div>

    <!-- No payer can be selected yet -->
    <p v-if="!canAddExpense" class="empty-state">{{ t('expenses.noPeople') }}</p>

    <!-- Empty state -->
    <p v-else-if="expenseStore.expenses.length === 0 && !showForm" class="empty-state">
      {{ t('expenses.empty') }}
    </p>

    <!-- Expense table -->
    <table
      v-else-if="expenseStore.expenses.length > 0 && !showForm"
      class="expense-table"
    >
      <thead>
        <tr>
          <th>{{ t('expenses.fields.date') }}</th>
          <th>{{ t('expenses.fields.label') }}</th>
          <th>{{ t('expenses.fields.payer') }}</th>
          <th class="numeric">{{ t('expenses.fields.amount') }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="expense in expenseStore.sortedExpenses" :key="expense.id">
          <td>{{ formatDate(expense.date) }}</td>
          <td>{{ expense.label }}</td>
          <td>{{ payerName(expense.payerId) }}</td>
          <td class="numeric">{{ amount(expense.amountCents) }}</td>
          <td class="row-actions">
            <button class="btn-secondary btn-sm" @click="openEdit(expense)">
              {{ t('common.edit') }}
            </button>
            <button class="btn-danger btn-sm" @click="confirmDeleteId = expense.id">
              {{ t('common.delete') }}
            </button>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3">{{ t('expenses.total') }}</td>
          <td class="numeric total">{{ amount(expenseStore.totalCents) }}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <!-- Inline form (add/edit) -->
    <div v-if="showForm" class="form-panel">
      <h3 class="form-panel-title">
        {{ editingExpense ? t('expenses.actions.edit') : t('expenses.add') }}
      </h3>
      <ExpenseForm
        :expense="editingExpense"
        :disabled="saving"
        @save="saveExpense"
        @cancel="cancelForm"
      />
    </div>

    <p v-if="failure" class="list-failure" role="alert">{{ failure }}</p>

    <!-- Confirm delete dialog -->
    <ConfirmDialog
      :open="confirmDeleteId !== null"
      :message="t('expenses.confirmDelete')"
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

.expense-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.expense-table th,
.expense-table td {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.expense-table th {
  color: var(--muted);
  font-weight: 500;
  white-space: nowrap;
}

.expense-table .numeric {
  text-align: right;
  white-space: nowrap;
}

.expense-table tbody tr:last-child td {
  border-bottom: none;
}

.expense-table tfoot td {
  border-top: 1px solid var(--border);
  border-bottom: none;
  color: var(--muted);
}

.expense-table tfoot .total {
  font-weight: 700;
  color: var(--text);
}

.row-actions {
  display: flex;
  gap: var(--space-xs);
  justify-content: flex-end;
}

.btn-sm {
  padding: 2px var(--space-sm);
  font-size: var(--font-size-xs);
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

@media (max-width: 600px) {
  .expense-table th:nth-child(3),
  .expense-table td:nth-child(3) {
    display: none;
  }
}
</style>
