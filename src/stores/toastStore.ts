import { writable } from 'svelte/store'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([])
  // Track timeout IDs to prevent memory leaks when toasts are manually dismissed
  const timeoutIds = new Map<string, ReturnType<typeof setTimeout>>()

  return {
    subscribe,
    show: (message: string, type: ToastType = 'info', duration = 3000) => {
      const id = crypto.randomUUID()
      const toast: Toast = { id, message, type, duration }

      update((toasts) => [...toasts, toast])

      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          timeoutIds.delete(id)
          update((toasts) => toasts.filter((t) => t.id !== id))
        }, duration)
        timeoutIds.set(id, timeoutId)
      }

      return id
    },
    dismiss: (id: string) => {
      // Clear the timeout if it exists to prevent orphaned timeouts
      const timeoutId = timeoutIds.get(id)
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutIds.delete(id)
      }
      update((toasts) => toasts.filter((t) => t.id !== id))
    },
    clear: () => {
      // Clear all pending timeouts
      for (const timeoutId of timeoutIds.values()) {
        clearTimeout(timeoutId)
      }
      timeoutIds.clear()
      update(() => [])
    },
  }
}

export const toastStore = createToastStore()
