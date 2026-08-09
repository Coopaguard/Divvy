// Pinia store — Vacations

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { vacationStorage } from '@/domains/storage/db'
import type { Vacation, VacationDraft } from '@/domains/vacations/types'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function now(): string {
  return new Date().toISOString()
}

export const useVacationStore = defineStore('vacations', () => {
  const vacation = ref<Vacation | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadFromStorage(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const all = await vacationStorage.getAll()
      // Only one active vacation for MVP — take the most recently updated
      if (all.length > 0) {
        vacation.value = all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createVacation(draft: VacationDraft): Promise<Vacation> {
    const newVacation: Vacation = {
      id: generateId(),
      ...draft,
      createdAt: now(),
      updatedAt: now(),
    }
    await vacationStorage.save(newVacation)
    vacation.value = newVacation
    return newVacation
  }

  async function updateVacation(draft: VacationDraft): Promise<void> {
    if (!vacation.value) return
    const updated: Vacation = {
      ...vacation.value,
      ...draft,
      updatedAt: now(),
    }
    await vacationStorage.save(updated)
    vacation.value = updated
  }

  async function deleteVacation(): Promise<void> {
    if (!vacation.value) return
    await vacationStorage.delete(vacation.value.id)
    vacation.value = null
  }

  function hasVacation(): boolean {
    return vacation.value !== null
  }

  return {
    vacation,
    loading,
    error,
    loadFromStorage,
    createVacation,
    updateVacation,
    deleteVacation,
    hasVacation,
  }
})
