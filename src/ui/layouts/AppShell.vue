<script setup lang="ts">
// AppShell — coque commune : en-tête, timeline des étapes, contenu, navigation
//
// La timeline remplace l'ancienne navigation par ancres : chaque étape est
// maintenant une route à part entière, et le contenu de l'étape courante arrive
// par le slot (`<RouterView>` côté App).
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVacationStore } from '@/stores/vacationStore'
import { usePeopleStore } from '@/stores/peopleStore'
import { useExpenseStore } from '@/stores/expenseStore'
import StepTimeline from '@/ui/components/StepTimeline.vue'
import StepNav from '@/ui/components/StepNav.vue'
import LanguageMenu from '@/ui/components/LanguageMenu.vue'
import CurrencyMenu from '@/ui/components/CurrencyMenu.vue'
import UpdatePrompt from '@/ui/components/UpdatePrompt.vue'
import InstallPrompt from '@/ui/components/InstallPrompt.vue'

const { t } = useI18n()
const vacationStore = useVacationStore()
const peopleStore = usePeopleStore()
const expenseStore = useExpenseStore()

void vacationStore.loadFromStorage()

// Single source of truth for the lists: they always mirror the selected
// vacation. Selecting another one — or none — swaps them in one place, so no
// step can ever display data belonging to a different vacation.
watch(
  () => vacationStore.selectedId,
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
  <div class="app-shell">
    <header class="app-header">
      <div class="header-top">
        <span class="app-logo">{{ t('app.name') }}</span>
        <div class="header-menus">
          <CurrencyMenu />
          <LanguageMenu />
        </div>
      </div>
      <StepTimeline />
    </header>

    <main class="main-content">
      <h1 class="vacation-title">
        {{ vacationStore.vacation?.name ?? t('app.tagline') }}
      </h1>
      <slot />
      <StepNav />
    </main>

    <!-- Bannières empilées, la plus urgente en bas, près du pouce. Le conteneur
         n'intercepte rien : hors bannière, on touche la page derrière. -->
    <div class="app-prompts">
      <InstallPrompt />
      <UpdatePrompt />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

/* Header + timeline stay in view while the step content scrolls. */
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--bg-page);
  border-bottom: 1px solid var(--border);
  padding: var(--space-sm) var(--space-md) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.header-menus {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.app-logo {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--primary);
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-lg) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.vacation-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text);
}

.app-prompts {
  position: fixed;
  left: var(--space-md);
  right: var(--space-md);
  /* Au-dessus de la barre système sur les téléphones à encoche. */
  bottom: calc(var(--space-md) + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-width: 520px;
  margin: 0 auto;
  /* Vide, la pile couvre tout de même le bas de l'écran : elle laisse donc
     passer les clics, et chaque bannière les reprend pour elle. */
  pointer-events: none;
}

.app-prompts > * {
  pointer-events: auto;
}

@media (min-width: 768px) {
  .app-header {
    padding: var(--space-md) var(--space-xl);
  }

  .main-content {
    padding: var(--space-xl);
  }
}
</style>
