// Pinia store — Personnes

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { peopleStorage } from '@/domains/storage/db'
import { generateId, nowIso } from '@/domains/shared/entity'
import { useAsyncState } from './asyncState'
import { useExpenseStore } from './expenseStore'
import type { Person, PersonDraft } from '@/domains/people/types'

export const usePeopleStore = defineStore('people', () => {
  const people = ref<Person[]>([])
  const { loading, error, run, clearError } = useAsyncState()

  /** Loads every person attached to a vacation. */
  async function loadByVacation(vacationId: string): Promise<void> {
    const result = await run(() => peopleStorage.getByVacationId(vacationId))
    people.value = result.ok ? result.value : []
  }

  /** Adds a person. Returns null when it could not be persisted. */
  async function addPerson(vacationId: string, draft: PersonDraft): Promise<Person | null> {
    const timestamp = nowIso()
    const person: Person = {
      id: generateId(),
      vacationId,
      ...draft,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const result = await run(() => peopleStorage.save(person))
    if (!result.ok) return null
    people.value.push(person)
    return person
  }

  /** Updates a person. Returns false on unknown id or failed write. */
  async function updatePerson(id: string, draft: PersonDraft): Promise<boolean> {
    const index = people.value.findIndex((person) => person.id === id)
    const existing = people.value[index]
    if (!existing) return false

    const updated: Person = { ...existing, ...draft, updatedAt: nowIso() }
    const result = await run(() => peopleStorage.save(updated))
    if (!result.ok) return false

    people.value[index] = updated
    return true
  }

  /**
   * Deletes a person. Storage cascades to the expenses they paid, so the
   * in-memory expense list is cleared alongside to stay consistent.
   * Returns false when the write failed.
   */
  async function deletePerson(id: string): Promise<boolean> {
    const result = await run(() => peopleStorage.delete(id))
    if (!result.ok) return false

    people.value = people.value.filter((person) => person.id !== id)
    useExpenseStore().removeByPayer(id)
    return true
  }

  /** Empties the in-memory list — storage is untouched. */
  function clear(): void {
    people.value = []
  }

  return {
    people,
    loading,
    error,
    loadByVacation,
    addPerson,
    updatePerson,
    deletePerson,
    clear,
    clearError,
  }
})
