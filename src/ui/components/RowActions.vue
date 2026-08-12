<script setup lang="ts">
// RowActions — actions d'une ligne : en clair sur grand écran, sous un « … »
// sur téléphone
//
// Deux boutons par ligne mangent déjà toute la largeur utile d'un tableau sur
// mobile ; trois n'y tiennent pas. Repliés sous un menu, ils restent à un geste
// sans disputer la place aux données.
import { useDismissMenu } from '@/ui/composables/useDismissMenu'

export interface RowAction {
  key: string
  label: string
  /** Destructive: shown apart, in red. */
  danger?: boolean
}

defineProps<{ actions: readonly RowAction[]; label: string }>()
const emit = defineEmits<{ select: [key: string] }>()

const { open, root, toggle, close } = useDismissMenu()

function run(key: string): void {
  close()
  emit('select', key)
}
</script>

<template>
  <div ref="root" class="row-actions">
    <!-- Wide screens: every action in the open -->
    <div class="inline-actions">
      <button
        v-for="action in actions"
        :key="action.key"
        type="button"
        :class="action.danger ? 'btn-danger' : 'btn-secondary'"
        class="btn-sm"
        @click="run(action.key)"
      >
        {{ action.label }}
      </button>
    </div>

    <!-- Phones: the same actions behind a menu -->
    <button
      class="menu-trigger"
      type="button"
      :aria-label="label"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      …
    </button>

    <ul v-if="open" class="menu" role="menu">
      <li v-for="action in actions" :key="action.key">
        <button
          class="menu-item"
          :class="{ danger: action.danger }"
          type="button"
          role="menuitem"
          @click="run(action.key)"
        >
          {{ action.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.row-actions {
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.inline-actions {
  display: none;
  gap: var(--space-xs);
}

.btn-sm {
  padding: 2px var(--space-sm);
  font-size: var(--font-size-xs);
}

.menu-trigger {
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  cursor: pointer;
  /* Comfortable thumb target without widening the column. */
  min-width: 2rem;
  min-height: 1.9rem;
  line-height: 1;
  font-size: var(--font-size-base);
}

.menu-trigger:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 25;
  list-style: none;
  min-width: 8rem;
  padding: var(--space-xs);
  background: var(--bg-page);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 6px 18px rgb(0 0 0 / 12%);
}

.menu-item {
  display: block;
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

.menu-item:hover {
  background: var(--primary-soft);
}

.menu-item.danger {
  color: #cf222e;
}

.menu-item.danger:hover {
  background: #ffebe9;
}

@media (min-width: 768px) {
  .inline-actions {
    display: flex;
  }

  .menu-trigger,
  .menu {
    display: none;
  }
}
</style>
