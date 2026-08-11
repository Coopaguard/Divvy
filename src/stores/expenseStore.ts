// Pinia store — Dépenses

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { expenseStorage } from '@/domains/storage/db'
import { generateId, nowIso } from '@/domains/shared/entity'
import { sumCents } from '@/domains/shared/money'
import { useAsyncState } from './asyncState'
import type { Expense, ExpenseDraft } from '@/domains/expenses/types'

/** Most recent first, then by creation to keep same-day entries stable. */
function byDateDesc(a: Expense, b: Expense): number {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
}

export const useExpenseStore = defineStore('expenses', () => {
  const expenses = ref<Expense[]>([])
  const { loading, error, run, clearError } = useAsyncState()

  const sortedExpenses = computed(() => [...expenses.value].sort(byDateDesc))

  const totalCents = computed(() => sumCents(expenses.value.map((expense) => expense.amountCents)))

  /** Total paid by each person, keyed by payer id. Used by the summary phases. */
  const totalByPayer = computed(() => {
    const totals = new Map<string, number>()
    for (const expense of expenses.value) {
      totals.set(expense.payerId, (totals.get(expense.payerId) ?? 0) + expense.amountCents)
    }
    return totals
  })

  /** Loads every expense attached to a vacation. */
  async function loadByVacation(vacationId: string): Promise<void> {
    const result = await run(() => expenseStorage.getByVacationId(vacationId))
    expenses.value = result.ok ? result.value : []
  }

  /** Adds an expense. Returns null when it could not be persisted. */
  async function addExpense(vacationId: string, draft: ExpenseDraft): Promise<Expense | null> {
    const timestamp = nowIso()
    const expense: Expense = {
      id: generateId(),
      vacationId,
      ...draft,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const result = await run(() => expenseStorage.save(expense))
    if (!result.ok) return null

    expenses.value.push(expense)
    return expense
  }

  /** Updates an expense. Returns false on unknown id or failed write. */
  async function updateExpense(id: string, draft: ExpenseDraft): Promise<boolean> {
    const index = expenses.value.findIndex((expense) => expense.id === id)
    const existing = expenses.value[index]
    if (!existing) return false

    const updated: Expense = { ...existing, ...draft, updatedAt: nowIso() }
    const result = await run(() => expenseStorage.save(updated))
    if (!result.ok) return false

    expenses.value[index] = updated
    return true
  }

  /** Deletes an expense. Returns false when the write failed. */
  async function deleteExpense(id: string): Promise<boolean> {
    const result = await run(() => expenseStorage.delete(id))
    if (!result.ok) return false

    expenses.value = expenses.value.filter((expense) => expense.id !== id)
    return true
  }

  /**
   * Drops the expenses paid by a person, mirroring the cascade already applied
   * in storage when that person is deleted.
   */
  function removeByPayer(payerId: string): void {
    expenses.value = expenses.value.filter((expense) => expense.payerId !== payerId)
  }

  /** How many expenses a person paid — used to warn before deleting them. */
  function countByPayer(payerId: string): number {
    return expenses.value.filter((expense) => expense.payerId === payerId).length
  }

  /** Empties the in-memory list — storage is untouched. */
  function clear(): void {
    expenses.value = []
  }

  return {
    expenses,
    sortedExpenses,
    totalCents,
    totalByPayer,
    loading,
    error,
    loadByVacation,
    addExpense,
    updateExpense,
    deleteExpense,
    removeByPayer,
    countByPayer,
    clear,
    clearError,
  }
})
