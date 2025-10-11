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

  return {
    subscribe,
    show: (message: string, type: ToastType = 'info', duration = 3000) => {
      const id = crypto.randomUUID()
      const toast: Toast = { id, message, type, duration }

      update((toasts) => [...toasts, toast])

      if (duration > 0) {
        setTimeout(() => {
          update((toasts) => toasts.filter((t) => t.id !== id))
        }, duration)
      }

      return id
    },
    dismiss: (id: string) => {
      update((toasts) => toasts.filter((t) => t.id !== id))
    },
    clear: () => {
      update(() => [])
    },
  }
}

export const toastStore = createToastStore()
