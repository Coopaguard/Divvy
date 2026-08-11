<script setup lang="ts">
// LanguageMenu — les langues regroupées sous un seul drapeau
//
// Deux drapeaux côte à côte laissaient croire à deux boutons d'action. Un menu
// montre la langue *active* et n'ouvre les autres qu'à la demande.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { applyDocumentLocale, persistLocale, supportedLocales, type SupportedLocale } from '@/i18n'

const { t, locale } = useI18n()

const FLAGS: Record<SupportedLocale, { flag: string; label: string }> = {
  fr: { flag: '🇫🇷', label: 'Français' },
  en: { flag: '🇬🇧', label: 'English' },
}

const languages = computed(() =>
  supportedLocales.map((code) => ({ code, ...FLAGS[code] })),
)

const current = computed(() => FLAGS[locale.value as SupportedLocale] ?? FLAGS.en)

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function choose(code: SupportedLocale): void {
  locale.value = code
  persistLocale(code)
  applyDocumentLocale(code)
  open.value = false
}

/** Clicking anywhere else, or pressing Escape, closes the menu. */
function onDocumentPointerDown(event: MouseEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', onDocumentPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="lang-menu">
    <button
      class="lang-trigger"
      type="button"
      :aria-label="`${t('common.language')} — ${current.label}`"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="open = !open"
    >
      <span class="lang-flag">{{ current.flag }}</span>
      <span class="lang-caret" aria-hidden="true">▾</span>
    </button>

    <ul v-if="open" class="lang-list" role="menu">
      <li v-for="lang in languages" :key="lang.code">
        <button
          class="lang-option"
          type="button"
          role="menuitemradio"
          :aria-checked="locale === lang.code"
          :class="{ active: locale === lang.code }"
          @click="choose(lang.code)"
        >
          <span class="lang-flag">{{ lang.flag }}</span>
          <span class="lang-name">{{ lang.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lang-menu {
  position: relative;
}

.lang-trigger {
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  padding: 2px var(--space-xs);
  line-height: 1;
}

.lang-trigger:hover {
  border-color: var(--primary);
}

.lang-flag {
  font-size: 1.3rem;
  line-height: 1;
}

.lang-caret {
  font-size: 0.7rem;
  color: var(--muted);
}

.lang-list {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 30;
  list-style: none;
  min-width: 10rem;
  padding: var(--space-xs);
  background: var(--bg-page);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 6px 18px rgb(0 0 0 / 12%);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-xs) var(--space-sm);
  background: none;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  font-size: var(--font-size-sm);
  color: var(--text);
}

.lang-option:hover {
  background: var(--primary-soft);
}

.lang-option.active {
  color: var(--primary);
  font-weight: 600;
}
</style>
