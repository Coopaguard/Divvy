// Pinia store — People

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { peopleStorage } from '@/domains/storage/db'
import type { Person, PersonDraft } from '@/domains/people/types'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function now(): string {
  return new Date().toISOString()
}

export const usePeopleStore = defineStore('people', () => {
  const people = ref<Person[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadByVacation(vacationId: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      people.value = await peopleStorage.getByVacationId(vacationId)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function addPerson(vacationId: string, draft: PersonDraft): Promise<Person> {
    const newPerson: Person = {
      id: generateId(),
      vacationId,
      ...draft,
      createdAt: now(),
      updatedAt: now(),
    }
    await peopleStorage.save(newPerson)
    people.value.push(newPerson)
    return newPerson
  }

  async function updatePerson(id: string, draft: PersonDraft): Promise<void> {
    const index = people.value.findIndex((p) => p.id === id)
    if (index === -1) return
    const existing = people.value[index]
    if (!existing) return
    const updated: Person = {
      ...existing,
      ...draft,
      updatedAt: now(),
    }
    await peopleStorage.save(updated)
    people.value[index] = updated
  }

  async function deletePerson(id: string): Promise<void> {
    await peopleStorage.delete(id)
    people.value = people.value.filter((p) => p.id !== id)
  }

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
  }
})
