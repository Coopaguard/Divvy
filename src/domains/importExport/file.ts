// Sortie d'un fichier vers l'utilisateur — téléchargement ou partage natif
//
// Séparé du format : ce module ne connaît que des octets et le navigateur, il
// ne sait rien de ce qu'est une vacance.

import { DIVVY_MIME_TYPE } from './format'

function toFile(fileName: string, contents: string): File {
  return new File([contents], fileName, { type: DIVVY_MIME_TYPE })
}

/** Télécharge le contenu sous le nom donné. */
export function downloadFile(fileName: string, contents: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: DIVVY_MIME_TYPE }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Sans cela, le blob reste en mémoire jusqu'au rechargement de la page.
  URL.revokeObjectURL(url)
}

/**
 * Le partage natif n'existe pas partout : il demande un contexte sécurisé, et
 * la plupart des navigateurs de bureau ne partagent pas de fichiers. L'option
 * n'est donc proposée que lorsqu'elle marchera vraiment.
 */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false
  try {
    return navigator.canShare({ files: [toFile('probe.divvy', '{}')] })
  } catch {
    return false
  }
}

export type ShareOutcome = 'shared' | 'cancelled' | 'unsupported' | 'failed'

/** Ouvre le partage du téléphone. Une annulation n'est pas une erreur. */
export async function shareFile(fileName: string, contents: string): Promise<ShareOutcome> {
  if (!canShareFiles()) return 'unsupported'
  try {
    await navigator.share({ files: [toFile(fileName, contents)] })
    return 'shared'
  } catch (cause) {
    // Refermer la feuille de partage lève AbortError : l'utilisateur a
    // simplement changé d'avis, ce n'est pas un échec à lui signaler.
    if (cause instanceof Error && cause.name === 'AbortError') return 'cancelled'
    return 'failed'
  }
}

/** Lit un fichier choisi par l'utilisateur. Null si la lecture échoue. */
export async function readFileText(file: Blob): Promise<string | null> {
  try {
    return await file.text()
  } catch {
    return null
  }
}
