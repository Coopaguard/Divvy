<script setup lang="ts">
// AppPage — main one-page view (Vacances, Personnes, Dépenses, Résultats)
import { onMounted, watch } from 'vue'
import { useVacationStore } from '@/stores/vacationStore'
import { usePeopleStore } from '@/stores/peopleStore'
import { useExpenseStore } from '@/stores/expenseStore'
import AppShell from '@/ui/layouts/AppShell.vue'
import HomeScreen from '@/ui/components/HomeScreen.vue'
import VacationForm from '@/ui/components/VacationForm.vue'
import PeopleList from '@/ui/components/PeopleList.vue'
import ExpenseList from '@/ui/components/ExpenseList.vue'
import ExpensesSummary from '@/ui/components/ExpensesSummary.vue'

const vacationStore = useVacationStore()
const peopleStore = usePeopleStore()
const expenseStore = useExpenseStore()

onMounted(() => vacationStore.loadFromStorage())

// Single source of truth for the lists: they always mirror the active vacation.
// Deleting a vacation cascades in storage, so clearing the in-memory lists here
// keeps both sides consistent.
watch(
  () => vacationStore.vacation?.id,
  async (vacationId) => {
    if (!vacationId) {
      peopleStore.clear()
      expenseStore.clear()
      return
    }
    await Promise.all([
      peopleStore.loadByVacation(vacationId),
      expenseStore.loadByVacation(vacationId),
    ])
  },
  { immediate: true },
)
</script>

<template>
  <!-- Landing screen when no vacation is loaded -->
  <HomeScreen v-if="!vacationStore.hasVacation" />

  <!-- Main one-page app once a vacation is active -->
  <AppShell v-else>
    <VacationForm />
    <PeopleList />
    <ExpenseList />
    <ExpensesSummary />
  </AppShell>
</template>
