<script setup lang="ts">
// AppShell — main layout: side nav (desktop), burger menu (mobile)
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVacationStore } from '@/stores/vacationStore'

const { t, locale } = useI18n()
const vacationStore = useVacationStore()

const languages = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
]

function setLocale(code: string): void {
  locale.value = code
  localStorage.setItem('divvy-locale', code)
}

const menuOpen = ref(false)
const activeSection = ref('section-vacations')

const navItems = [
  { id: 'section-vacations', label: 'nav.vacations' },
  { id: 'section-people', label: 'nav.people' },
  // phases 4-6 will add: expenses, results
]

function scrollTo(id: string): void {
  menuOpen.value = false
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
  activeSection.value = id
}

function onScroll(): void {
  for (const item of navItems) {
    const el = document.getElementById(item.id)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.top <= 120) activeSection.value = item.id
  }
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="app-shell">
    <!-- Desktop: floating left nav -->
    <nav class="side-nav" aria-label="Navigation">
      <div class="side-nav-logo">{{ t('app.name') }}</div>
      <ul class="side-nav-links">
        <li v-for="item in navItems" :key="item.id">
          <button
            :class="['nav-link', { active: activeSection === item.id }]"
            @click="scrollTo(item.id)"
          >
            {{ t(item.label) }}
          </button>
        </li>
      </ul>
      <div class="lang-selector">
        <button
          v-for="lang in languages"
          :key="lang.code"
          :class="['lang-btn', { active: locale === lang.code }]"
          :title="lang.label"
          @click="setLocale(lang.code)"
        >
          {{ lang.flag }}
        </button>
      </div>
    </nav>

    <!-- Mobile: header + burger -->
    <header class="mobile-header">
      <span class="mobile-logo">{{ t('app.name') }}</span>
      <button class="burger-btn" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
        <span class="burger-icon" :class="{ open: menuOpen }">
          <span /><span /><span />
        </span>
      </button>
    </header>

    <!-- Mobile: full-screen menu -->
    <div v-if="menuOpen" class="fullscreen-menu" @click.self="menuOpen = false">
      <ul class="fullscreen-links">
        <li v-for="item in navItems" :key="item.id">
          <button class="fullscreen-link" @click="scrollTo(item.id)">
            {{ t(item.label) }}
          </button>
        </li>
      </ul>
      <div class="lang-selector fullscreen-lang">
        <button
          v-for="lang in languages"
          :key="lang.code"
          :class="['lang-btn', { active: locale === lang.code }]"
          :title="lang.label"
          @click="setLocale(lang.code)"
        >
          {{ lang.flag }}
        </button>
      </div>
    </div>

    <!-- Main content -->
    <main class="main-content">
      <div class="vacation-title">
        {{ vacationStore.vacation?.name ?? t('app.name') }}
      </div>
      <slot />
    </main>
  </div>
</template>

<style scoped>
/* Layout */
.app-shell {
  min-height: 100vh;
  display: flex;
  background: var(--bg-page);
}

/* Side nav (desktop) */
.side-nav {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 200px;
  height: 100vh;
  border-right: 1px solid var(--border);
  padding: var(--space-xl) var(--space-md);
  flex-direction: column;
  gap: var(--space-lg);
  z-index: 10;
}

.side-nav-logo {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--primary);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border);
}

.side-nav-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.nav-link {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-xs) var(--space-sm);
  border: none;
  background: none;
  color: var(--text);
  font-size: var(--font-size-sm);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.nav-link:hover {
  background: var(--primary-soft);
  color: var(--primary);
}

.nav-link.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}

/* Main content */
.main-content {
  flex: 1;
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 800px;
  width: 100%;
}

.vacation-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text);
  padding-top: var(--space-sm);
}

/* Mobile header */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--border);
  background: var(--bg-page);
  z-index: 20;
}

.mobile-logo {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--primary);
}

.burger-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xs);
  display: flex;
  align-items: center;
}

.burger-icon {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 22px;
}

.burger-icon span {
  display: block;
  height: 2px;
  width: 100%;
  background: var(--text);
  border-radius: 2px;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.burger-icon.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.burger-icon.open span:nth-child(2) {
  opacity: 0;
}

.burger-icon.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Full-screen mobile menu */
.fullscreen-menu {
  position: fixed;
  inset: 0;
  background: var(--bg-page);
  z-index: 15;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.fullscreen-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.fullscreen-link {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius);
  transition: color 0.15s ease;
}

.fullscreen-link:hover {
  color: var(--primary);
}

/* Language selector */
.lang-selector {
  display: flex;
  gap: var(--space-xs);
  margin-top: auto;
  padding-top: var(--space-md);
  border-top: 1px solid var(--border);
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

.fullscreen-lang {
  margin-top: var(--space-lg);
  border-top: 1px solid var(--border);
  padding-top: var(--space-md);
  justify-content: center;
  font-size: 2rem;
}

/* Desktop breakpoint */
@media (min-width: 768px) {
  .side-nav {
    display: flex;
  }

  .mobile-header {
    display: none;
  }

  .main-content {
    margin-left: 200px;
    padding: var(--space-xl) var(--space-xl);
  }
}

@media (max-width: 767px) {
  .main-content {
    margin-top: 48px;
    padding: var(--space-md);
  }
}
</style>
