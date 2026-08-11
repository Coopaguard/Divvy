// Shared async state for Pinia stores — loading flag + explicit error capture.

import { ref } from 'vue'
import { toErrorMessage } from '@/domains/shared/entity'

/** Outcome of a storage operation: never throws, always inspectable. */
export type AsyncResult<T> = { ok: true; value: T } | { ok: false; message: string }

export function useAsyncState() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Runs a storage operation while exposing its progress through `loading`.
   * A failure is captured in `error` and returned as `{ ok: false }` instead
   * of escaping as an unhandled rejection, so callers can keep the in-memory
   * state consistent with what was actually persisted.
   */
  async function run<T>(operation: () => Promise<T>): Promise<AsyncResult<T>> {
    loading.value = true
    error.value = null
    try {
      return { ok: true, value: await operation() }
    } catch (cause) {
      const message = toErrorMessage(cause)
      error.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  return { loading, error, run, clearError }
}
