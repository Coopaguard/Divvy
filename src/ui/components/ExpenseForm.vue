<script setup lang="ts">
// ExpenseForm — add or edit an expense
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePeopleStore } from '@/stores/peopleStore'
import { centsToInput, parseAmountToCents } from '@/domains/shared/money'
import type { Expense, ExpenseDraft } from '@/domains/expenses/types'

const props = withDefaults(
  defineProps<{
    expense?: Expense | null
    /** Blocks the actions while the parent persists the draft. */
    disabled?: boolean
  }>(),
  { expense: null, disabled: false },
)

const emit = defineEmits<{
  save: [draft: ExpenseDraft]
  cancel: []
}>()

const { t } = useI18n()
const peopleStore = usePeopleStore()

/** Today, as YYYY-MM-DD in the user's timezone (toISOString would shift it). */
function today(): string {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

const payerId = ref('')
const amount = ref('')
const label = ref('')
const date = ref('')
const errors = ref<Record<string, string>>({})

function reset(expense: Expense | null): void {
  payerId.value = expense?.payerId ?? peopleStore.people[0]?.id ?? ''
  amount.value = expense ? centsToInput(expense.amountCents) : ''
  label.value = expense?.label ?? ''
  date.value = expense?.date ?? today()
  errors.value = {}
}

reset(props.expense)
watch(() => props.expense, reset)

function validate(): number | null {
  errors.value = {}

  if (!payerId.value) errors.value.payerId = t('expenses.errors.payerRequired')
  if (!label.value.trim()) errors.value.label = t('expenses.errors.labelRequired')
  if (!date.value) errors.value.date = t('expenses.errors.dateRequired')

  const raw = amount.value.trim()
  let amountCents: number | null = null
  if (!raw) {
    errors.value.amount = t('expenses.errors.amountRequired')
  } else {
    amountCents = parseAmountToCents(raw)
    if (amountCents === null) errors.value.amount = t('expenses.errors.amountInvalid')
    else if (amountCents <= 0) errors.value.amount = t('expenses.errors.amountPositive')
  }

  return Object.keys(errors.value).length === 0 ? amountCents : null
}

function submit(): void {
  const amountCents = validate()
  if (amountCents === null) return

  emit('save', {
    payerId: payerId.value,
    amountCents,
    label: label.value.trim(),
    date: date.value,
  })
}
</script>

<template>
  <div class="expense-form">
    <div class="field">
      <label for="expense-label">{{ t('expenses.fields.label') }}</label>
      <input
        id="expense-label"
        v-model="label"
        type="text"
        :class="{ error: errors.label }"
        :placeholder="t('expenses.fields.label')"
        autocomplete="off"
      />
      <span v-if="errors.label" class="field-error">{{ errors.label }}</span>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="expense-payer">{{ t('expenses.fields.payer') }}</label>
        <select id="expense-payer" v-model="payerId" :class="{ error: errors.payerId }">
          <option v-for="person in peopleStore.people" :key="person.id" :value="person.id">
            {{ person.name }}
          </option>
        </select>
        <span v-if="errors.payerId" class="field-error">{{ errors.payerId }}</span>
      </div>

      <div class="field">
        <label for="expense-amount">{{ t('expenses.fields.amount') }}</label>
        <input
          id="expense-amount"
          v-model="amount"
          type="text"
          inputmode="decimal"
          :class="{ error: errors.amount }"
          placeholder="0.00"
          autocomplete="off"
        />
        <span v-if="errors.amount" class="field-error">{{ errors.amount }}</span>
      </div>

      <div class="field">
        <label for="expense-date">{{ t('expenses.fields.date') }}</label>
        <input id="expense-date" v-model="date" type="date" :class="{ error: errors.date }" />
        <span v-if="errors.date" class="field-error">{{ errors.date }}</span>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" :disabled="disabled" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </button>
      <button type="button" class="btn-primary" :disabled="disabled" @click="submit">
        {{ disabled ? t('common.loading') : t('common.save') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.expense-form {
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
  padding-top: var(--space-xs);
}

@media (max-width: 600px) {
  .field-row {
    flex-direction: column;
  }
}
</style>
