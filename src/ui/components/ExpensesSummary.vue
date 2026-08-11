<script setup lang="ts">
// ExpensesSummary — combien chaque personne a avancé
//
// Périmètre volontairement réduit : on affiche ce qui a été *payé* par chacun.
// Ce n'est pas encore la répartition — qui doit combien à qui relève de la
// phase 6 (voir specs/07-repartition.md).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useExpenseStore } from '@/stores/expenseStore'
import { usePeopleStore } from '@/stores/peopleStore'
import { formatCents } from '@/domains/shared/money'

const { t, locale } = useI18n()
const expenseStore = useExpenseStore()
const peopleStore = usePeopleStore()

interface PersonTotal {
  id: string
  name: string
  paidCents: number
}

/**
 * Every person appears, including those who paid nothing: seeing a zero is the
 * point — it is what the settlement will later have to balance out.
 */
const totals = computed<PersonTotal[]>(() =>
  peopleStore.people
    .map((person) => ({
      id: person.id,
      name: person.name,
      paidCents: expenseStore.totalByPayer.get(person.id) ?? 0,
    }))
    .sort((a, b) => b.paidCents - a.paidCents || a.name.localeCompare(b.name)),
)

const hasSomethingToShow = computed(
  () => peopleStore.people.length > 0 && expenseStore.expenses.length > 0,
)

function amount(cents: number): string {
  return formatCents(cents, locale.value)
}
</script>

<template>
  <section id="section-results" class="section-card">
    <h2 class="section-title">{{ t('results.title') }}</h2>

    <p v-if="!hasSomethingToShow" class="empty-state">{{ t('results.empty') }}</p>

    <template v-else>
      <h3 class="subsection-title">{{ t('results.totalsByPerson') }}</h3>
      <table class="totals-table">
        <thead>
          <tr>
            <th>{{ t('people.fields.name') }}</th>
            <th class="numeric">{{ t('results.paid') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="person in totals" :key="person.id">
            <td>{{ person.name }}</td>
            <td class="numeric">{{ amount(person.paidCents) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>{{ t('expenses.total') }}</td>
            <td class="numeric total">{{ amount(expenseStore.totalCents) }}</td>
          </tr>
        </tfoot>
      </table>
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
  margin-bottom: var(--space-md);
}

.empty-state {
  color: var(--muted);
  font-size: var(--font-size-sm);
  padding: var(--space-lg) 0;
  text-align: center;
}

.totals-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.totals-table th,
.totals-table td {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.totals-table th {
  color: var(--muted);
  font-weight: 500;
  white-space: nowrap;
}

.totals-table .numeric {
  text-align: right;
  white-space: nowrap;
}

.totals-table tbody tr:last-child td {
  border-bottom: none;
}

.totals-table tfoot td {
  border-top: 1px solid var(--border);
  border-bottom: none;
  color: var(--muted);
}

.totals-table tfoot .total {
  font-weight: 700;
  color: var(--text);
}
</style>
