interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry>()
const accessOrder: string[] = []
const MAX_ENTRIES = 50

function touchAccessOrder(key: string) {
  const idx = accessOrder.indexOf(key)
  if (idx > -1) accessOrder.splice(idx, 1)
  accessOrder.push(key)
}

function evictIfNeeded() {
  while (cache.size >= MAX_ENTRIES && accessOrder.length > 0) {
    const oldest = accessOrder.shift()!
    cache.delete(oldest)
  }
}

export function getCacheEntry<T>(key: string): { data: T; isStale: boolean } | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  touchAccessOrder(key)
  const age = Date.now() - entry.timestamp
  return { data: entry.data, isStale: age >= entry.ttl }
}

export function setCacheEntry<T>(key: string, data: T, ttl: number): void {
  evictIfNeeded()
  cache.set(key, { data, timestamp: Date.now(), ttl })
  touchAccessOrder(key)
}

export function invalidateCache(prefix: string): void {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
      const idx = accessOrder.indexOf(key)
      if (idx > -1) accessOrder.splice(idx, 1)
    }
  }
}

export function clearAllCache(): void {
  cache.clear()
  accessOrder.length = 0
}

export function getCacheSize(): number {
  return cache.size
}
