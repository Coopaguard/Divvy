// Pinia store — Vacances

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { pruneOrphanRecords, vacationStorage } from '@/domains/storage/db'
import { generateId, nowIso } from '@/domains/shared/entity'
import { useAsyncState } from './asyncState'
import type { Vacation, VacationDraft } from '@/domains/vacations/types'

/** MVP: a single vacation is active at a time — the most recently updated one. */
function mostRecentlyUpdated(vacations: Vacation[]): Vacation | null {
  return (
    vacations.reduce<Vacation | null>(
      (latest, current) =>
        !latest || current.updatedAt.localeCompare(latest.updatedAt) > 0 ? current : latest,
      null,
    ) ?? null
  )
}

export const useVacationStore = defineStore('vacations', () => {
  const vacation = ref<Vacation | null>(null)
  const { loading, error, run, clearError } = useAsyncState()

  const hasVacation = computed(() => vacation.value !== null)

  /** Restores the active vacation from storage. */
  async function loadFromStorage(): Promise<void> {
    const result = await run(async () => {
      // Housekeeping: drop records left behind by versions that deleted a
      // vacation without cascading. Best effort — never blocks the load.
      await pruneOrphanRecords().catch(() => undefined)
      return vacationStorage.getAll()
    })
    if (!result.ok) return
    vacation.value = mostRecentlyUpdated(result.value)
  }

  /** Creates a vacation and makes it the active one. Null when the write failed. */
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

    vacation.value = created
    return created
  }

  /** Updates the active vacation. Returns false when there is none or the write failed. */
  async function updateVacation(draft: VacationDraft): Promise<boolean> {
    const current = vacation.value
    if (!current) return false

    const updated: Vacation = { ...current, ...draft, updatedAt: nowIso() }
    const result = await run(() => vacationStorage.save(updated))
    if (!result.ok) return false

    vacation.value = updated
    return true
  }

  /**
   * Supprime la vacance active **et tout ce qui lui est rattaché** (Personnes,
   * puis Dépenses et répartition). Retourne false si la suppression a échoué —
   * dans ce cas rien n'a été supprimé et la vacance reste active.
   */
  async function deleteVacation(): Promise<boolean> {
    const current = vacation.value
    if (!current) return false

    const result = await run(() => vacationStorage.delete(current.id))
    if (!result.ok) return false

    vacation.value = null
    return true
  }

  return {
    vacation,
    loading,
    error,
    hasVacation,
    loadFromStorage,
    createVacation,
    updateVacation,
    deleteVacation,
    clearError,
  }
})
