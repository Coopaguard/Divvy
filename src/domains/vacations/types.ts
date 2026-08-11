// Domain types — Vacations

import type { SplitMethod } from '@/domains/settlement/types'

export interface Vacation {
  id: string
  name: string
  startDate: string // ISO date string YYYY-MM-DD
  endDate: string   // ISO date string YYYY-MM-DD
  createdAt: string
  updatedAt: string
  /**
   * How this vacation's expenses are split. Optional: records written before
   * the settlement step simply fall back to the default, so no migration is
   * needed — IndexedDB stores whole objects, not columns.
   */
  splitMethod?: SplitMethod
}

export type VacationDraft = Omit<Vacation, 'id' | 'createdAt' | 'updatedAt'>
