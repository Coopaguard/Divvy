<script setup lang="ts">
// AppPage — main one-page view (Phase 1: Vacances + Personnes)
import { onMounted, watch } from 'vue'
import { useVacationStore } from '@/stores/vacationStore'
import { usePeopleStore } from '@/stores/peopleStore'
import AppShell from '@/ui/layouts/AppShell.vue'
import HomeScreen from '@/ui/components/HomeScreen.vue'
import VacationForm from '@/ui/components/VacationForm.vue'
import PeopleList from '@/ui/components/PeopleList.vue'

const vacationStore = useVacationStore()
const peopleStore = usePeopleStore()

onMounted(() => vacationStore.loadFromStorage())

// Single source of truth for the people list: it always mirrors the active
// vacation. Deleting a vacation cascades in storage, so clearing the in-memory
// list here keeps both sides consistent.
watch(
  () => vacationStore.vacation?.id,
  async (vacationId) => {
    if (vacationId) {
      await peopleStore.loadByVacation(vacationId)
    } else {
      peopleStore.clear()
    }
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
  </AppShell>
</template>
