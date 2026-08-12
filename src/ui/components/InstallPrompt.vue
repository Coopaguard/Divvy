<script setup lang="ts">
// InstallPrompt — propose d'installer l'application sur l'appareil
//
// Ne s'affiche que dans un onglet : installée, l'application n'a plus rien à
// proposer. Deux formes, selon ce que le navigateur permet — un bouton là où
// une invite existe, la consigne du geste là où il n'y en a pas (iOS).
import { useI18n } from 'vue-i18n'
import { useInstallPrompt } from '@/ui/composables/useInstallPrompt'

const { t } = useI18n()
const { canInstall, showsIosHint, install, dismiss } = useInstallPrompt()
</script>

<template>
  <div v-if="canInstall || showsIosHint" class="install-prompt" role="status">
    <div class="install-text">
      <span class="install-title">{{ t('install.title') }}</span>
      <span class="install-hint">{{ showsIosHint ? t('install.iosHint') : t('install.why') }}</span>
    </div>
    <div class="install-actions">
      <button type="button" class="btn-secondary btn-sm" @click="dismiss">
        {{ t('install.later') }}
      </button>
      <!-- Aucun bouton sur iOS : il n'y aurait rien à déclencher. -->
      <button v-if="canInstall" type="button" class="btn-primary btn-sm" @click="install">
        {{ t('install.action') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.install-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
  padding: var(--space-md);
  /* Teinte de l'application, quand la mise à jour prend le bleu d'information :
     deux bannières superposées doivent se distinguer d'un coup d'œil. */
  border: 1px solid var(--primary);
  border-left-width: 3px;
  border-radius: var(--radius);
  background: var(--primary-soft);
  box-shadow: 0 6px 18px rgb(0 0 0 / 14%);
  font-size: var(--font-size-sm);
  color: var(--text);
}

.install-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.install-title {
  font-weight: 600;
}

.install-hint {
  font-size: var(--font-size-xs);
  color: var(--muted);
}

.install-actions {
  display: flex;
  gap: var(--space-sm);
}

.btn-sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}
</style>
