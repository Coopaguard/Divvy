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
import { applyDocumentLocale, persistLocale, type SupportedLocale } from '@/i18n'
import StepTimeline from '@/ui/components/StepTimeline.vue'
import StepNav from '@/ui/components/StepNav.vue'

const { t, locale } = useI18n()
const vacationStore = useVacationStore()
const peopleStore = usePeopleStore()
const expenseStore = useExpenseStore()

const languages: { code: SupportedLocale; flag: string; label: string }[] = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
]

function setLocale(code: SupportedLocale): void {
  locale.value = code
  persistLocale(code)
  applyDocumentLocale(code)
}

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
        <div class="lang-selector">
          <button
            v-for="lang in languages"
            :key="lang.code"
            :class="['lang-btn', { active: locale === lang.code }]"
            :title="lang.label"
            :aria-label="lang.label"
            :aria-pressed="locale === lang.code"
            @click="setLocale(lang.code)"
          >
            {{ lang.flag }}
          </button>
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

.lang-selector {
  display: flex;
  gap: var(--space-xs);
}

.lang-btn {
  background: none;
  border: 2px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 1.4rem;
  line-height: 1;
  padding: 2px 4px;
  transition: border-color 0.15s ease, opacity 0.15s ease;
  opacity: 0.5;
}

.lang-btn:hover {
  opacity: 0.85;
}

.lang-btn.active {
  border-color: var(--primary);
  opacity: 1;
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
