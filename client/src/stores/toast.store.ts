import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'info' | 'success' | 'error'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

let nextId = 0

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function push(message: string, type: ToastType = 'info', durationMs = 4000) {
    const id = ++nextId
    toasts.value = [...toasts.value, { id, message, type }]
    setTimeout(() => dismiss(id), durationMs)
  }

  function success(message: string) {
    push(message, 'success')
  }

  function error(message: string) {
    push(message, 'error', 5500)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, push, success, error, dismiss }
})
