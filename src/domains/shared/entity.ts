// Shared entity helpers — identifiers and timestamps
// Centralised so every domain produces ids and dates the same way.

/** Generates a unique identifier for a new record. */
export function generateId(): string {
  // randomUUID is only exposed in secure contexts (https / localhost).
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Current date/time as an ISO string, used for createdAt / updatedAt. */
export function nowIso(): string {
  return new Date().toISOString()
}

/** Turns anything thrown into a readable message for the UI. */
export function toErrorMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message
  if (typeof cause === 'string') return cause
  return String(cause)
}
