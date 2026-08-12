// useInstallPrompt — l'état de la proposition d'installation
//
// Le navigateur décide seul du moment où il juge l'application installable et
// émet alors `beforeinstallprompt`. On l'intercepte pour l'ouvrir nous-mêmes,
// au bon endroit dans l'interface, plutôt que de laisser la bannière native
// s'inviter par-dessus le contenu.

import { onMounted, onUnmounted, readonly, ref } from 'vue'
import {
  clearSnooze,
  isInstalled,
  isIos,
  isSnoozed,
  snooze,
  type InstallPromptEvent,
} from '@/domains/pwa/install'

export function useInstallPrompt() {
  /** L'événement mis de côté. Non réactif : c'est un objet du DOM, pas un état. */
  let deferred: InstallPromptEvent | null = null

  /** Une invite native est prête : on peut afficher un vrai bouton. */
  const canInstall = ref(false)
  /** iOS : pas d'API, seulement le geste à expliquer. */
  const showsIosHint = ref(false)

  function onBeforeInstallPrompt(event: Event): void {
    // Sans cela, le navigateur affiche sa propre bannière au moment qui
    // l'arrange. On garde la main sur le moment et la place.
    event.preventDefault()
    deferred = event as InstallPromptEvent
    canInstall.value = true
  }

  function onInstalled(): void {
    deferred = null
    canInstall.value = false
    showsIosHint.value = false
    clearSnooze()
  }

  onMounted(() => {
    // Déjà installée, ou écartée il y a peu : on ne propose rien, et on
    // n'écoute même pas — l'événement ne servirait à rien.
    if (isInstalled() || isSnoozed()) return

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    // iOS n'émettra jamais l'événement : la consigne est le seul recours.
    showsIosHint.value = isIos()
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onInstalled)
  })

  /**
   * Ouvre l'invite du navigateur. Un refus ne se distingue pas d'un report :
   * dans les deux cas la bannière disparaît, et l'invite n'est pas réutilisable
   * — le navigateur en émettra une nouvelle s'il le juge bon.
   */
  async function install(): Promise<void> {
    const event = deferred
    if (!event) return

    deferred = null
    canInstall.value = false

    await event.prompt()
    const { outcome } = await event.userChoice
    if (outcome === 'dismissed') snooze()
  }

  /** « Plus tard » : on se tait un mois. */
  function dismiss(): void {
    canInstall.value = false
    showsIosHint.value = false
    snooze()
  }

  return {
    canInstall: readonly(canInstall),
    showsIosHint: readonly(showsIosHint),
    install,
    dismiss,
  }
}
