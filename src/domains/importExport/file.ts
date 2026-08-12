// Sortie d'un fichier vers l'utilisateur — téléchargement ou partage natif
//
// Séparé du format : ce module ne connaît que des octets et le navigateur, il
// ne sait rien de ce qu'est une vacance.

import { DIVVY_EXTENSION, DIVVY_MIME_TYPE } from './format'

/**
 * Habillages successifs du **même contenu**, du plus fidèle au plus universel.
 *
 * Les navigateurs n'acceptent de partager qu'une liste de types de fichiers, et
 * `.divvy` n'y figure évidemment pas : sans repli, le partage serait indisponible
 * partout. Le contenu ne change jamais — seuls le nom et le type annoncés varient
 * — et la lecture à l'import valide le contenu, pas l'extension : un fichier
 * revenu en `.txt` se réimporte donc sans rien perdre.
 */
export function shareCandidates(fileName: string): { name: string; type: string }[] {
  const stem = fileName.endsWith(DIVVY_EXTENSION)
    ? fileName.slice(0, -DIVVY_EXTENSION.length)
    : fileName
  return [
    { name: `${stem}${DIVVY_EXTENSION}`, type: DIVVY_MIME_TYPE },
    { name: `${stem}${DIVVY_EXTENSION}.json`, type: DIVVY_MIME_TYPE },
    { name: `${stem}${DIVVY_EXTENSION}.txt`, type: 'text/plain' },
  ]
}

/** Premier habillage que le navigateur accepte de partager, sinon null. */
function shareableFile(fileName: string, contents: string): File | null {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return null

  for (const { name, type } of shareCandidates(fileName)) {
    const file = new File([contents], name, { type })
    try {
      if (navigator.canShare({ files: [file] })) return file
    } catch {
      // Ce navigateur refuse d'examiner celui-ci : on essaie le suivant.
    }
  }
  return null
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
 * n'est donc proposée que lorsqu'elle marchera vraiment — en éprouvant tous les
 * habillages, pas seulement le nôtre.
 */
export function canShareFiles(): boolean {
  return shareableFile(`vacances${DIVVY_EXTENSION}`, '{}') !== null
}

export type ShareOutcome = 'shared' | 'cancelled' | 'unsupported' | 'failed'

/** Ouvre le partage du téléphone. Une annulation n'est pas une erreur. */
export async function shareFile(fileName: string, contents: string): Promise<ShareOutcome> {
  const file = shareableFile(fileName, contents)
  if (!file) return 'unsupported'
  try {
    await navigator.share({ files: [file] })
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
