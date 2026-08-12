<script setup lang="ts">
// CurrencyMenu — le symbole monétaire de l'application
//
// Réglage unique, séparé de la langue à dessein : celle-ci ne décide que de la
// mise en forme. Lier les deux ferait passer 600 € à 600 £ sur une simple
// bascule de langue, sans conversion.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  currencySymbol,
  supportedCurrencies,
  type SupportedCurrency,
} from '@/domains/shared/currency'
import { useCurrency } from '@/ui/composables/useCurrency'
import { useDismissMenu } from '@/ui/composables/useDismissMenu'

const { t, locale } = useI18n()
const { currency, setCurrency } = useCurrency()
const { open, root, toggle, close } = useDismissMenu()

const options = computed(() =>
  supportedCurrencies.map((code) => ({
    code,
    symbol: currencySymbol(code, locale.value),
    name: t(`currencies.${code}`),
  })),
)

const currentSymbol = computed(() => currencySymbol(currency.value, locale.value))

function choose(code: SupportedCurrency): void {
  setCurrency(code)
  close()
}
</script>

<template>
  <div ref="root" class="currency-menu">
    <button
      class="currency-trigger"
      type="button"
      :aria-label="`${t('common.currency')} — ${t(`currencies.${currency}`)}`"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <span class="currency-symbol">{{ currentSymbol }}</span>
      <span class="currency-caret" aria-hidden="true">▾</span>
    </button>

    <ul v-if="open" class="currency-list" role="menu">
      <li v-for="option in options" :key="option.code">
        <button
          class="currency-option"
          type="button"
          role="menuitemradio"
          :aria-checked="currency === option.code"
          :class="{ active: currency === option.code }"
          @click="choose(option.code)"
        >
          <span class="currency-symbol">{{ option.symbol }}</span>
          <span class="currency-name">{{ option.name }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.currency-menu {
  position: relative;
}

.currency-trigger {
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  padding: 2px var(--space-xs);
  color: var(--text);
  line-height: 1;
  min-height: 1.9rem;
}

.currency-trigger:hover {
  border-color: var(--primary);
}

.currency-symbol {
  font-size: var(--font-size-base);
  font-weight: 600;
  min-width: 1.1rem;
  text-align: center;
}

.currency-caret {
  font-size: 0.7rem;
  color: var(--muted);
}

.currency-list {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 30;
  list-style: none;
  min-width: 12rem;
  padding: var(--space-xs);
  background: var(--bg-page);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 6px 18px rgb(0 0 0 / 12%);
}

.currency-option {
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
  white-space: nowrap;
}

.currency-option:hover {
  background: var(--primary-soft);
}

.currency-option.active {
  color: var(--primary);
  font-weight: 600;
}
</style>
