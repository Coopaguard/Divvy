// Installation de l'application — détection et proposition
//
// Divvy tourne aussi bien dans un onglet qu'installée sur l'écran d'accueil,
// mais installée elle démarre plus vite, s'ouvre sans barre d'adresse et se
// retrouve comme n'importe quelle autre application. Encore faut-il savoir que
// c'est possible : rien dans une page web ne le dit.
//
// Ce module répond à deux questions, et rien d'autre — l'affichage est ailleurs.

/** L'événement Chromium qui précède l'installation. Absent des types du DOM. */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Clé du report, avec la date : une fois écartée, la proposition se tait. */
const SNOOZE_KEY = 'divvy.install.snoozedAt'

/** Un mois. Assez long pour ne pas harceler, assez court pour laisser une
 *  seconde chance à qui a fermé la bannière sans la lire. */
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000

/**
 * L'application tourne-t-elle **déjà** installée ?
 *
 * Quatre signaux, parce qu'aucun ne couvre tout le parc : `standalone` est le
 * cas courant, `window-controls-overlay` le bureau, `navigator.standalone` le
 * seul que connaisse Safari iOS, et un référent `android-app://` trahit une
 * application Android qui nous embarque.
 */
export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false

  const displayed = (mode: string) => window.matchMedia?.(`(display-mode: ${mode})`).matches === true
  if (displayed('standalone') || displayed('window-controls-overlay') || displayed('fullscreen')) {
    return true
  }

  // Propriété non standard, propre à Safari iOS.
  if ((window.navigator as { standalone?: boolean }).standalone === true) return true

  return document.referrer.startsWith('android-app://')
}

/**
 * Safari iOS n'émet pas `beforeinstallprompt` et n'expose aucune API : là-bas,
 * l'installation passe forcément par le menu de partage, à la main. On ne peut
 * donc qu'expliquer le geste — d'où la nécessité de reconnaître le terrain.
 *
 * L'iPad récent se présente comme un Mac ; l'écran tactile le distingue.
 */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  const { userAgent, platform, maxTouchPoints } = navigator
  if (/iPad|iPhone|iPod/.test(userAgent)) return true
  return platform === 'MacIntel' && maxTouchPoints > 1
}

/** A-t-on écarté la proposition récemment ? Un stockage indisponible ne doit
 *  pas empêcher l'application de tourner : dans le doute, on ne propose rien. */
export function isSnoozed(now: number = Date.now()): boolean {
  try {
    const stored = window.localStorage.getItem(SNOOZE_KEY)
    if (stored === null) return false
    const at = Number(stored)
    return Number.isFinite(at) && now - at < SNOOZE_MS
  } catch {
    return true
  }
}

/** Écarte la proposition pour un mois. */
export function snooze(now: number = Date.now()): void {
  try {
    window.localStorage.setItem(SNOOZE_KEY, String(now))
  } catch {
    // Mode privé, quota plein : tant pis pour le report, rien de vital.
  }
}

/** Oublie le report — l'installation faite, il n'a plus lieu d'être. */
export function clearSnooze(): void {
  try {
    window.localStorage.removeItem(SNOOZE_KEY)
  } catch {
    // Idem.
  }
}
