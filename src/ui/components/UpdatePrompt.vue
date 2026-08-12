<script setup lang="ts">
// UpdatePrompt — signale qu'une nouvelle version est prête
//
// L'application est mise en cache pour fonctionner hors ligne, ce qui a un
// revers : sans rien faire, un utilisateur resterait sur la version qu'il a
// visitée la première fois. Le service worker prévient donc dès qu'une
// nouvelle est prête.
//
// **Elle est proposée, jamais imposée.** Recharger d'autorité effacerait une
// dépense en cours de saisie ; l'utilisateur choisit son moment.
import { useI18n } from 'vue-i18n'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { t } = useI18n()

const { needRefresh, updateServiceWorker } = useRegisterSW()

function reload(): void {
  // `true` : on recharge la page une fois la nouvelle version active.
  void updateServiceWorker(true)
}
</script>

<template>
  <div v-if="needRefresh" class="update-prompt" role="status">
    <span class="update-text">{{ t('update.available') }}</span>
    <div class="update-actions">
      <button type="button" class="btn-secondary btn-sm" @click="needRefresh = false">
        {{ t('update.later') }}
      </button>
      <button type="button" class="btn-primary btn-sm" @click="reload">
        {{ t('update.reload') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.update-prompt {
  position: fixed;
  left: var(--space-md);
  right: var(--space-md);
  /* Au-dessus de la barre système sur les téléphones à encoche. */
  bottom: calc(var(--space-md) + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
  max-width: 520px;
  margin: 0 auto;
  padding: var(--space-md);
  border: 1px solid var(--info);
  border-left-width: 3px;
  border-radius: var(--radius);
  background: var(--info-soft);
  box-shadow: 0 6px 18px rgb(0 0 0 / 14%);
  font-size: var(--font-size-sm);
  color: var(--text);
}

.update-text {
  flex: 1;
  min-width: 0;
}

.update-actions {
  display: flex;
  gap: var(--space-sm);
}

.btn-sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}
</style>
