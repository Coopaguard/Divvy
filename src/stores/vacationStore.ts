// Pinia store — Vacances
//
// Le store tient *toutes* les vacances enregistrées et celle qui est
// sélectionnée. La sélection est volontairement vide au démarrage : le parcours
// commence par le choix d'une vacance, et les étapes suivantes restent
// verrouillées tant qu'aucune n'est choisie.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { pruneOrphanRecords, vacationStorage } from '@/domains/storage/db'
import { generateId, nowIso } from '@/domains/shared/entity'
import { useAsyncState } from './asyncState'
import { DEFAULT_SPLIT_METHOD, type SplitMethod } from '@/domains/settlement/types'
import type { Vacation, VacationDraft } from '@/domains/vacations/types'

export const useVacationStore = defineStore('vacations', () => {
  const vacations = ref<Vacation[]>([])
  const selectedId = ref<string | null>(null)
  const { loading, error, run, clearError } = useAsyncState()

  /** The selected vacation, or null while the user has not picked one. */
  const vacation = computed<Vacation | null>(
    () => vacations.value.find((item) => item.id === selectedId.value) ?? null,
  )

  const hasVacation = computed(() => vacation.value !== null)

  /** Split method of the selected vacation, defaulted for older records. */
  const splitMethod = computed<SplitMethod>(
    () => vacation.value?.splitMethod ?? DEFAULT_SPLIT_METHOD,
  )

  /** Most recently updated first — the one the user is most likely to resume. */
  const sortedVacations = computed<Vacation[]>(() =>
    [...vacations.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  )

  /**
   * Loads every stored vacation. Deliberately does *not* select one: the first
   * step of the journey is choosing, so a fresh start shows the list.
   */
  async function loadFromStorage(): Promise<void> {
    const result = await run(async () => {
      // Housekeeping: drop records left behind by versions that deleted a
      // vacation without cascading. Best effort — never blocks the load.
      await pruneOrphanRecords().catch(() => undefined)
      return vacationStorage.getAll()
    })
    if (!result.ok) return
    vacations.value = result.value

    // A vacation deleted in another tab must not stay selected here.
    if (selectedId.value && !result.value.some((item) => item.id === selectedId.value)) {
      selectedId.value = null
    }
  }

  /** Selects an existing vacation. Unknown ids are ignored. */
  function select(id: string): boolean {
    if (!vacations.value.some((item) => item.id === id)) return false
    selectedId.value = id
    return true
  }

  /** Goes back to "no vacation chosen", which locks the later steps again. */
  function clearSelection(): void {
    selectedId.value = null
  }

  /** Creates a vacation and selects it. Null when the write failed. */
  async function createVacation(draft: VacationDraft): Promise<Vacation | null> {
    const timestamp = nowIso()
    const created: Vacation = {
      id: generateId(),
      ...draft,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const result = await run(() => vacationStorage.save(created))
    if (!result.ok) return null

    vacations.value.push(created)
    selectedId.value = created.id
    return created
  }

  /** Updates the selected vacation. False when there is none or the write failed. */
  async function updateVacation(draft: VacationDraft): Promise<boolean> {
    const current = vacation.value
    if (!current) return false

    const updated: Vacation = { ...current, ...draft, updatedAt: nowIso() }
    const result = await run(() => vacationStorage.save(updated))
    if (!result.ok) return false

    const index = vacations.value.findIndex((item) => item.id === updated.id)
    if (index !== -1) vacations.value[index] = updated
    return true
  }

  /** Changes how the selected vacation is split. False when the write failed. */
  async function setSplitMethod(method: SplitMethod): Promise<boolean> {
    const current = vacation.value
    if (!current) return false
    if ((current.splitMethod ?? DEFAULT_SPLIT_METHOD) === method) return true

    const updated: Vacation = { ...current, splitMethod: method, updatedAt: nowIso() }
    const result = await run(() => vacationStorage.save(updated))
    if (!result.ok) return false

    const index = vacations.value.findIndex((item) => item.id === updated.id)
    if (index !== -1) vacations.value[index] = updated
    return true
  }

  /**
   * Supprime une vacance **et tout ce qui lui est rattaché** (Personnes, puis
   * Dépenses et répartition). Sans argument, supprime la vacance sélectionnée.
   * Retourne false si la suppression a échoué — dans ce cas rien n'a été
   * supprimé et la sélection est inchangée.
   */
  async function deleteVacation(id?: string): Promise<boolean> {
    const targetId = id ?? selectedId.value
    if (!targetId) return false

    const result = await run(() => vacationStorage.delete(targetId))
    if (!result.ok) return false

    vacations.value = vacations.value.filter((item) => item.id !== targetId)
    // Deleting the vacation being worked on sends the user back to the choice.
    if (selectedId.value === targetId) selectedId.value = null
    return true
  }

  return {
    vacations,
    sortedVacations,
    selectedId,
    vacation,
    loading,
    error,
    hasVacation,
    splitMethod,
    setSplitMethod,
    loadFromStorage,
    select,
    clearSelection,
    createVacation,
    updateVacation,
    deleteVacation,
    clearError,
  }
})
