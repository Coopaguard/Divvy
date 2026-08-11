<script setup lang="ts">
// RowActions — actions d'une ligne : en clair sur grand écran, sous un « … »
// sur téléphone
//
// Deux boutons par ligne mangent toute la largeur utile d'un tableau sur mobile
// et poussent les colonnes qui portent l'information. Repliés sous un menu, ils
// restent à un geste sans disputer la place aux données.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits<{ edit: []; delete: [] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function run(action: 'edit' | 'delete'): void {
  open.value = false
  if (action === 'edit') emit('edit')
  else emit('delete')
}

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
  <div ref="root" class="row-actions">
    <!-- Wide screens: both actions in the open -->
    <div class="inline-actions">
      <button class="btn-secondary btn-sm" type="button" @click="run('edit')">
        {{ t('common.edit') }}
      </button>
      <button class="btn-danger btn-sm" type="button" @click="run('delete')">
        {{ t('common.delete') }}
      </button>
    </div>

    <!-- Phones: the same two actions behind a menu -->
    <button
      class="menu-trigger"
      type="button"
      :aria-label="t('common.actions')"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="open = !open"
    >
      …
    </button>

    <ul v-if="open" class="menu" role="menu">
      <li>
        <button class="menu-item" type="button" role="menuitem" @click="run('edit')">
          {{ t('common.edit') }}
        </button>
      </li>
      <li>
        <button
          class="menu-item danger"
          type="button"
          role="menuitem"
          @click="run('delete')"
        >
          {{ t('common.delete') }}
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
