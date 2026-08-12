<script setup lang="ts">
// SettlementView — étape 5 : qui rembourse qui
//
// Deux tableaux, dans cet ordre : d'abord la quote-part de chacun (pourquoi il
// doit ce qu'il doit), ensuite les virements à faire (quoi faire concrètement).
// L'ordre compte — un remboursement qu'on ne sait pas justifier ne se paie pas.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useExpenseStore } from '@/stores/expenseStore'
import { usePeopleStore } from '@/stores/peopleStore'
import { useVacationStore } from '@/stores/vacationStore'
import { computeBalances, optimiseTransfers, shareDayRate } from '@/domains/settlement/settle'
import { SPLIT_METHODS, type SplitMethod } from '@/domains/settlement/types'
import { formatCents } from '@/domains/shared/money'
import { useCurrency } from '@/ui/composables/useCurrency'

const { t, locale } = useI18n()
const { currency } = useCurrency()
const vacationStore = useVacationStore()
const peopleStore = usePeopleStore()
const expenseStore = useExpenseStore()

const failure = ref<string | null>(null)

const method = computed({
  get: () => vacationStore.splitMethod,
  set: async (chosen: SplitMethod) => {
    failure.value = null
    const saved = await vacationStore.setSplitMethod(chosen)
    if (!saved) failure.value = t('common.error.saveFailed')
  },
})

const methodOptions = computed(() =>
  SPLIT_METHODS.map((name) => ({ name, label: t(`settlement.methods.${name}`) })),
)

/** The formula in words, so the figures below can be checked by hand. */
const methodHint = computed(() => t(`settlement.methodHints.${vacationStore.splitMethod}`))

/** Days only weigh under the day-based methods; showing them otherwise misleads. */
const showsDays = computed(() => vacationStore.splitMethod !== 'shares')

/**
 * Ce que vaut une part pour une journée. Ce prix n'existe que sous la méthode
 * par jour : la simple ignore les dates, et celle par dépense n'a pas de cote
 * unique — chaque dépense a la sienne.
 */
const rate = computed(() =>
  vacationStore.splitMethod === 'shareDays'
    ? shareDayRate(balances.value, totalCents.value)
    : null,
)

const balances = computed(() =>
  computeBalances(peopleStore.people, expenseStore.expenses, {
    method: vacationStore.splitMethod,
    vacation: vacationStore.vacation,
  }),
)

/** Owed money first, then those who owe — the list reads as a ranking. */
const sortedBalances = computed(() =>
  [...balances.value].sort(
    (a, b) => b.balanceCents - a.balanceCents || a.name.localeCompare(b.name),
  ),
)

const transfers = computed(() => optimiseTransfers(balances.value))

const nameById = computed(
  () => new Map(peopleStore.people.map((person) => [person.id, person.name])),
)

const hasSomethingToSettle = computed(
  () => peopleStore.people.length > 0 && expenseStore.expenses.length > 0,
)

/** Everyone paid exactly their share — rare, but it deserves a real message. */
const allSquare = computed(() => hasSomethingToSettle.value && transfers.value.length === 0)

const totalCents = computed(() => expenseStore.totalCents)

function amount(cents: number): string {
  return formatCents(cents, locale.value, currency.value)
}

function personName(id: string): string {
  return nameById.value.get(id) ?? '—'
}
</script>

<template>
  <section id="section-settlement" class="section-card">
    <h2 class="section-title">{{ t('settlement.title') }}</h2>

    <p v-if="!hasSomethingToSettle" class="empty-state">{{ t('settlement.empty') }}</p>

    <template v-else>
      <div class="option">
        <label class="option-label" for="split-method">{{ t('settlement.method') }}</label>
        <select id="split-method" v-model="method" class="method-select">
          <option v-for="entry in methodOptions" :key="entry.name" :value="entry.name">
            {{ entry.label }}
          </option>
        </select>
        <!-- How the chosen method works, spelled out: the point is that the
             figures below can be redone by hand. -->
        <p class="method-info" role="note">
          <span class="method-info-icon" aria-hidden="true">i</span>
          <span>{{ methodHint }}</span>
        </p>
      </div>

      <p v-if="failure" class="form-failure" role="alert">{{ failure }}</p>

      <div v-if="rate" class="rate">
        <div class="rate-head">
          <span class="rate-title">{{ t('settlement.rateTitle') }}</span>
          <span class="rate-value">{{ amount(rate.rateCents) }}</span>
        </div>
        <span class="rate-units">{{ t('settlement.rateUnits', rate.units) }}</span>
        <!-- Le total ne se divise presque jamais en un compte rond de centimes :
             on le dit, plutôt que de laisser croire à une incohérence. -->
        <span class="rate-note">{{ t('settlement.rateRounded') }}</span>
      </div>

      <h3 class="subsection-title">{{ t('settlement.sharesTitle') }}</h3>
      <div class="table-scroll">
        <table class="settlement-table">
          <thead>
            <tr>
              <th>{{ t('people.fields.name') }}</th>
              <th class="numeric">{{ t('people.fields.shares') }}</th>
              <th v-if="showsDays" class="numeric">{{ t('settlement.days') }}</th>
              <th class="numeric">{{ t('settlement.owed') }}</th>
              <th class="numeric">{{ t('results.paid') }}</th>
              <th class="numeric">{{ t('settlement.balance') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="balance in sortedBalances" :key="balance.personId">
              <td>{{ balance.name }}</td>
              <td class="numeric">{{ balance.shares }}</td>
              <td v-if="showsDays" class="numeric">{{ balance.days }}</td>
              <td class="numeric">{{ amount(balance.owedCents) }}</td>
              <td class="numeric">{{ amount(balance.paidCents) }}</td>
              <td
                class="numeric balance"
                :class="{
                  positive: balance.balanceCents > 0,
                  negative: balance.balanceCents < 0,
                }"
              >
                {{ amount(balance.balanceCents) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td :colspan="showsDays ? 3 : 2">{{ t('expenses.total') }}</td>
              <td class="numeric total">{{ amount(totalCents) }}</td>
              <td class="numeric total">{{ amount(totalCents) }}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <h3 class="subsection-title">{{ t('settlement.transfersTitle') }}</h3>

      <p v-if="allSquare" class="all-square">{{ t('settlement.allSquare') }}</p>

      <ul v-else class="transfers">
        <li v-for="(transfer, index) in transfers" :key="index" class="transfer">
          <span class="transfer-from">{{ personName(transfer.fromId) }}</span>
          <span class="transfer-arrow" aria-hidden="true">→</span>
          <span class="transfer-to">{{ personName(transfer.toId) }}</span>
          <span class="transfer-amount">{{ amount(transfer.amountCents) }}</span>
        </li>
      </ul>

      <p v-if="!allSquare" class="transfers-count">
        {{ t('settlement.transferCount', transfers.length) }}
      </p>
    </template>
  </section>
</template>

<style scoped>
.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-lg);
}

.subsection-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text);
  margin: var(--space-xl) 0 var(--space-md);
}

.empty-state {
  color: var(--muted);
  font-size: var(--font-size-sm);
  padding: var(--space-lg) 0;
  text-align: center;
}

.option {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.method-select {
  width: 100%;
  max-width: 26rem;
}

.option-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text);
}

.method-info {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-left: 3px solid var(--info);
  background: var(--info-soft);
  border-radius: 0 var(--radius) var(--radius) 0;
  font-size: var(--font-size-xs);
  line-height: 1.5;
  color: var(--text);
}

.method-info-icon {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: var(--info);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  font-style: italic;
  line-height: 1;
}

.form-failure {
  font-size: var(--font-size-sm);
  color: #cf222e;
  margin-top: var(--space-sm);
}

.rate {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: var(--space-lg);
  padding: var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.rate-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-md);
}

.rate-title {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text);
}

.rate-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.rate-units {
  font-size: var(--font-size-xs);
  color: var(--muted);
}

.rate-note {
  font-size: var(--font-size-xs);
  color: var(--muted);
  font-style: italic;
}

/* Wide tables scroll inside their own box rather than the page. */
.table-scroll {
  overflow-x: auto;
}

.settlement-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.settlement-table th,
.settlement-table td {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}

.settlement-table th {
  color: var(--muted);
  font-weight: 500;
}

.settlement-table .numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.settlement-table tbody tr:last-child td {
  border-bottom: none;
}

.settlement-table tfoot td {
  border-top: 1px solid var(--border);
  border-bottom: none;
  color: var(--muted);
}

.settlement-table tfoot .total {
  font-weight: 700;
  color: var(--text);
}

.balance {
  font-weight: 600;
}

/* Sign carries the meaning; colour only reinforces it. */
.balance.positive {
  color: #1a7f37;
}

.balance.negative {
  color: #cf222e;
}

.transfers {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.transfer {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
}

.transfer-from,
.transfer-to {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transfer-from {
  color: var(--text);
}

.transfer-to {
  color: var(--text);
  font-weight: 600;
}

.transfer-arrow {
  color: var(--muted);
}

.transfer-amount {
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.transfers-count,
.all-square {
  font-size: var(--font-size-sm);
  color: var(--muted);
  margin-top: var(--space-sm);
}
</style>
