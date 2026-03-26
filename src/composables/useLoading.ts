import { ref, computed } from 'vue'

export function useLoading(initialState = false) {
  const isLoading = ref(initialState)
  const loadingCount = ref(0)

  const start = () => {
    loadingCount.value++
    isLoading.value = true
  }

  const stop = () => {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
    if (loadingCount.value === 0) {
      isLoading.value = false
    }
  }

  const reset = () => {
    loadingCount.value = 0
    isLoading.value = false
  }

  // Wrapper cho async functions
  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    start()
    try {
      return await fn()
    } finally {
      stop()
    }
  }

  return {
    isLoading: computed(() => isLoading.value),
    loadingCount: computed(() => loadingCount.value),
    start,
    stop,
    reset,
    withLoading
  }
}
