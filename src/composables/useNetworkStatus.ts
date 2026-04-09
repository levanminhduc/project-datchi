import { ref, readonly } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const wasOffline = ref(false)

let initialized = false

function handleOnline(snackbar: ReturnType<typeof useSnackbar>) {
  isOnline.value = true
  if (wasOffline.value) {
    snackbar.success('Đã kết nối mạng trở lại')
  }
}

function handleOffline(snackbar: ReturnType<typeof useSnackbar>) {
  isOnline.value = false
  wasOffline.value = true
  snackbar.warning('Mất kết nối mạng')
}

export function initNetworkStatus() {
  if (initialized) return

  initialized = true
  const snackbar = useSnackbar()

  window.addEventListener('online', () => handleOnline(snackbar))
  window.addEventListener('offline', () => handleOffline(snackbar))
}

export function useNetworkStatus() {
  return {
    isOnline: readonly(isOnline),
    wasOffline: readonly(wasOffline),
    initNetworkStatus,
  }
}
