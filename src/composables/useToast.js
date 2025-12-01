import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

export function useToast() {
  function show(message, type = 'success', duration = 2500) {
    const id = ++toastId
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      remove(id)
    }, duration)

    return id
  }

  function remove(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  function success(message, duration) {
    return show(message, 'success', duration)
  }

  function error(message, duration) {
    return show(message, 'error', duration)
  }

  function info(message, duration) {
    return show(message, 'info', duration)
  }

  return {
    toasts,
    show,
    remove,
    success,
    error,
    info
  }
}
