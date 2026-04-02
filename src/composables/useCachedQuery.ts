import { ref, onUnmounted, type Ref } from 'vue'
import { getCacheEntry, setCacheEntry } from '@/lib/api-cache'

interface UseCachedQueryOptions {
  ttl?: number
  enabled?: boolean
}

interface UseCachedQueryReturn<T> {
  data: Ref<T | null>
  isLoading: Ref<boolean>
  isRefreshing: Ref<boolean>
  error: Ref<string | null>
  refresh: () => Promise<void>
}

const DEFAULT_TTL = 60_000
const TAB_STALE_THRESHOLD = 5 * 60_000

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseCachedQueryOptions,
): UseCachedQueryReturn<T> {
  const ttl = options?.ttl ?? DEFAULT_TTL
  const enabled = options?.enabled ?? true

  const data = ref<T | null>(null) as Ref<T | null>
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const error = ref<string | null>(null)

  let lastFocusCheck = Date.now()

  async function fetchData(background = false): Promise<void> {
    if (!enabled) return

    if (!background) isLoading.value = true
    else isRefreshing.value = true

    error.value = null

    try {
      const result = await fetcher()
      data.value = result
      setCacheEntry(key, result, ttl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải dữ liệu'
      error.value = msg
    } finally {
      isLoading.value = false
      isRefreshing.value = false
    }
  }

  async function refresh(): Promise<void> {
    await fetchData(false)
  }

  function handleFocus() {
    const now = Date.now()
    if (now - lastFocusCheck < TAB_STALE_THRESHOLD) return
    lastFocusCheck = now

    const cached = getCacheEntry<T>(key)
    if (cached && cached.isStale) {
      fetchData(true)
    }
  }

  function init() {
    if (!enabled) return

    const cached = getCacheEntry<T>(key)

    if (cached) {
      data.value = cached.data

      if (cached.isStale) {
        fetchData(true)
      }
    } else {
      fetchData(false)
    }
  }

  window.addEventListener('focus', handleFocus)
  onUnmounted(() => {
    window.removeEventListener('focus', handleFocus)
  })

  init()

  return { data, isLoading, isRefreshing, error, refresh }
}
