// Domain types — Vacations

export interface Vacation {
  id: string
  name: string
  startDate: string // ISO date string YYYY-MM-DD
  endDate: string   // ISO date string YYYY-MM-DD
  createdAt: string
  updatedAt: string
}

export type VacationDraft = Omit<Vacation, 'id' | 'createdAt' | 'updatedAt'>
