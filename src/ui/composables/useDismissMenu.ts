// Menu déroulant : ouverture, fermeture au clic extérieur et à Échap
//
// Trois menus partagent ce comportement (langue, devise, actions de ligne).
// Recopié à chaque fois, c'est trois occasions d'oublier de retirer un écouteur
// et de laisser un composant démonté réagir à un clic.

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export interface DismissMenu {
  /** Whether the menu is showing. */
  open: Ref<boolean>
  /** Bind to the wrapper element: clicks inside it do not dismiss. */
  root: Ref<HTMLElement | null>
  toggle: () => void
  close: () => void
}

export function useDismissMenu(): DismissMenu {
  const open = ref(false)
  const root = ref<HTMLElement | null>(null)

  function close(): void {
    open.value = false
  }

  function toggle(): void {
    open.value = !open.value
  }

  function onPointerDown(event: MouseEvent): void {
    if (root.value && !root.value.contains(event.target as Node)) close()
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') close()
  }

  onMounted(() => {
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeydown)
  })

  // Left behind, these would keep reaching into a torn-down component.
  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onPointerDown)
    document.removeEventListener('keydown', onKeydown)
  })

  return { open, root, toggle, close }
}
