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

onMounted(async () => {
  await vacationStore.loadFromStorage()
  if (vacationStore.vacation) {
    await peopleStore.loadByVacation(vacationStore.vacation.id)
  }
})

// When a vacation becomes available, load its people
watch(
  () => vacationStore.vacation?.id,
  async (id) => {
    if (id) {
      await peopleStore.loadByVacation(id)
    } else {
      peopleStore.clear()
    }
  },
)
</script>

<template>
  <!-- Landing screen when no vacation is loaded -->
  <HomeScreen v-if="!vacationStore.vacation" />

  <!-- Main one-page app once a vacation is active -->
  <AppShell v-else>
    <VacationForm />
    <PeopleList />
  </AppShell>
</template>
