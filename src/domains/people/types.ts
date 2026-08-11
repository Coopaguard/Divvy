// Domain types — People

export interface Person {
  id: string
  vacationId: string
  name: string
  shares: number        // default: 1
  arrivalDate: string   // ISO date string YYYY-MM-DD
  departureDate: string // ISO date string YYYY-MM-DD
  createdAt: string
  updatedAt: string
}

export type PersonDraft = Omit<Person, 'id' | 'vacationId' | 'createdAt' | 'updatedAt'>
