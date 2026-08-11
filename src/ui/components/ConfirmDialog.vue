<script setup lang="ts">
// ConfirmDialog — modal confirmation before destructive actions
import { useI18n } from 'vue-i18n'

defineProps<{
  open: boolean
  message: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dialog-backdrop" @click.self="emit('cancel')">
      <div class="dialog" role="dialog" aria-modal="true">
        <p class="dialog-message">{{ message }}</p>
        <div class="dialog-actions">
          <button class="btn-secondary" @click="emit('cancel')">{{ t('common.cancel') }}</button>
          <button class="btn-danger" @click="emit('confirm')">{{ t('common.delete') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-lg);
  max-width: 360px;
  width: calc(100% - 2 * var(--space-lg));
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.dialog-message {
  font-size: var(--font-size-base);
  color: var(--text);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}
</style>
