import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSnackbar } from './useSnackbar'

export interface PendingOperation {
  id: string
  type: 'RECEIVE' | 'ISSUE' | 'RECOVERY' | 'WEIGH'
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE'
  data: Record<string, any>
  timestamp: number
  retries: number
}

const DB_NAME = 'thread-offline-db'
const STORE_NAME = 'pending-operations'

export function useOfflineSync() {
  const isOnline = ref(navigator.onLine)
  const pendingOperations = ref<PendingOperation[]>([])
  const isSyncing = ref(false)
  const lastSyncTime = ref<Date | null>(null)
  const error = ref<string | null>(null)

  const snackbar = useSnackbar()

  let db: IDBDatabase | null = null

  // Computed
  const pendingCount = computed(() => pendingOperations.value.length)
  const hasPending = computed(() => pendingCount.value > 0)

  // Initialize IndexedDB
  const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        db = request.result
        resolve(db)
      }

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  // Load pending operations from IndexedDB
  const loadPending = async (): Promise<void> => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        pendingOperations.value = request.result || []
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Add operation to queue
  const addPending = async (
    operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>
  ): Promise<string> => {
    if (!db) await initDB()

    const op: PendingOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    }

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add(op)

      request.onsuccess = () => {
        pendingOperations.value.push(op)
        resolve(op.id)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Remove operation from queue
  const removePending = async (id: string): Promise<void> => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        pendingOperations.value = pendingOperations.value.filter((op) => op.id !== id)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Sync a single operation
  const syncOperation = async (operation: PendingOperation): Promise<boolean> => {
    try {
      const response = await fetch(operation.endpoint, {
        method: operation.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation.data),
      })

      if (response.ok) {
        await removePending(operation.id)
        return true
      } else {
        // Update retry count
        operation.retries++
        if (operation.retries >= 3) {
          // Move to failed after 3 retries
          error.value = `Không thể đồng bộ: ${operation.type}`
        }
        return false
      }
    } catch {
      return false
    }
  }

  // Sync all pending operations
  const syncAll = async (): Promise<void> => {
    if (!isOnline.value || isSyncing.value || !hasPending.value) return

    isSyncing.value = true
    error.value = null

    try {
      // Sort by timestamp (oldest first)
      const sorted = [...pendingOperations.value].sort((a, b) => a.timestamp - b.timestamp)

      let successCount = 0
      let failCount = 0

      for (const operation of sorted) {
        const success = await syncOperation(operation)
        if (success) {
          successCount++
        } else {
          failCount++
        }
      }

      lastSyncTime.value = new Date()

      if (successCount > 0) {
        snackbar.success(`Đã đồng bộ ${successCount} thao tác`)
      }
      if (failCount > 0) {
        snackbar.warning(`${failCount} thao tác chưa thể đồng bộ`)
      }
    } finally {
      isSyncing.value = false
    }
  }

  // Queue operation (online: execute immediately, offline: queue)
  const queueOperation = async (
    type: PendingOperation['type'],
    endpoint: string,
    method: PendingOperation['method'],
    data: Record<string, any>
  ): Promise<{ success: boolean; queued: boolean; result?: any }> => {
    if (isOnline.value) {
      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          const result = await response.json()
          return { success: true, queued: false, result }
        }
      } catch {
        // Fall through to queue
      }
    }

    // Queue for later
    await addPending({ type, endpoint, method, data })
    snackbar.info('Thao tác đã lưu, sẽ đồng bộ khi có mạng')
    return { success: false, queued: true }
  }

  // Online/Offline handlers
  const handleOnline = () => {
    isOnline.value = true
    snackbar.success('Đã kết nối mạng')
    syncAll()
  }

  const handleOffline = () => {
    isOnline.value = false
    snackbar.warning('Mất kết nối mạng - Chế độ offline')
  }

  // Clear all pending
  const clearAll = async (): Promise<void> => {
    if (!db) await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        pendingOperations.value = []
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Lifecycle
  onMounted(async () => {
    await initDB()
    await loadPending()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Try to sync on mount if online
    if (isOnline.value && hasPending.value) {
      syncAll()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    // State
    isOnline,
    pendingOperations,
    pendingCount,
    hasPending,
    isSyncing,
    lastSyncTime,
    error,

    // Methods
    addPending,
    removePending,
    syncAll,
    queueOperation,
    clearAll,
    loadPending,
  }
}
