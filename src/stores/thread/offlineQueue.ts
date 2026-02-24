/**
 * Offline Queue Store
 *
 * Pinia store for managing offline operations with IndexedDB persistence.
 * Queues operations when offline and syncs them when back online.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchApi } from '@/services/api'

// Types
export interface QueuedOperation {
  id: string
  type: 'stock_receipt' | 'issue' | 'recovery' | 'allocation'
  payload: Record<string, unknown>
  createdAt: string
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
  retryCount: number
  error?: string
  syncedAt?: string
}

export interface SyncResult {
  success: number
  failed: number
  conflicts: number
  total: number
}

type ConflictResolution = 'retry' | 'discard' | 'manual'

// Constants
const DB_NAME = 'thread-offline-queue'
const STORE_NAME = 'operations'
const DB_VERSION = 1
const MAX_RETRIES = 3

// Vietnamese messages
const MESSAGES = {
  SYNC_SUCCESS: 'Đã đồng bộ thành công',
  SYNC_PARTIAL: 'Một số thao tác chưa đồng bộ được',
  SYNC_FAILED: 'Không thể đồng bộ',
  CONFLICT_DETECTED: 'Phát hiện xung đột dữ liệu',
  QUEUED_OFFLINE: 'Đã lưu thao tác, sẽ đồng bộ khi có mạng',
  ONLINE: 'Đã kết nối mạng',
  OFFLINE: 'Mất kết nối - Chế độ offline',
  DB_ERROR: 'Lỗi cơ sở dữ liệu cục bộ',
}

// API endpoints for operation types
const OPERATION_ENDPOINTS: Record<QueuedOperation['type'], string> = {
  stock_receipt: '/api/inventory/receive',
  issue: '/api/inventory/issue',
  recovery: '/api/recovery',
  allocation: '/api/allocations',
}

/**
 * IndexedDB helper functions
 */
class OfflineDB {
  private db: IDBDatabase | null = null

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('[OfflineDB] Failed to open database:', request.error)
        reject(new Error(MESSAGES.DB_ERROR))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create operations store with indexes
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  async getAll(): Promise<QueuedOperation[]> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => {
        const operations = request.result || []
        // Sort by createdAt ascending (oldest first)
        operations.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        resolve(operations)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async add(operation: QueuedOperation): Promise<void> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add(operation)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async update(operation: QueuedOperation): Promise<void> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(operation)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async delete(id: string): Promise<void> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async deleteByStatus(status: QueuedOperation['status']): Promise<void> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('status')
      const request = index.openCursor(IDBKeyRange.only(status))

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clear(): Promise<void> {
    const db = await this.init()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

/**
 * Generate unique ID for operations
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Offline Queue Store
 */
export const useOfflineQueueStore = defineStore('offlineQueue', () => {
  // Database instance
  const db = new OfflineDB()

  // State
  const queue = ref<QueuedOperation[]>([])
  const isSyncing = ref(false)
  const lastSyncAt = ref<string | null>(null)
  const isOnline = ref(navigator.onLine)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // Getters
  const pendingCount = computed(() => queue.value.filter((op) => op.status === 'pending').length)

  const failedCount = computed(() => queue.value.filter((op) => op.status === 'failed').length)

  const hasConflicts = computed(() => queue.value.some((op) => op.status === 'conflict'))

  const conflictCount = computed(() => queue.value.filter((op) => op.status === 'conflict').length)

  const pendingOperations = computed(() => queue.value.filter((op) => op.status === 'pending'))

  const failedOperations = computed(() => queue.value.filter((op) => op.status === 'failed'))

  const conflictOperations = computed(() => queue.value.filter((op) => op.status === 'conflict'))

  // Online/Offline event handlers
  const handleOnline = () => {
    isOnline.value = true
    console.log('[OfflineQueue] Online - triggering sync')
    // Auto-sync when coming back online
    if (pendingCount.value > 0) {
      sync()
    }
  }

  const handleOffline = () => {
    isOnline.value = false
    console.log('[OfflineQueue] Offline mode activated')
  }

  /**
   * Initialize the store - load from IndexedDB
   */
  const initialize = async (): Promise<void> => {
    if (isInitialized.value) return

    try {
      queue.value = await db.getAll()
      isInitialized.value = true

      // Setup online/offline listeners
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      console.log(`[OfflineQueue] Initialized with ${queue.value.length} operations`)
    } catch (err) {
      console.error('[OfflineQueue] Initialization failed:', err)
      error.value = MESSAGES.DB_ERROR
    }
  }

  /**
   * Add operation to queue
   */
  const enqueue = async (
    operation: Omit<QueuedOperation, 'id' | 'createdAt' | 'status' | 'retryCount'>
  ): Promise<string> => {
    const newOperation: QueuedOperation = {
      ...operation,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    }

    try {
      await db.add(newOperation)
      queue.value.push(newOperation)

      console.log(`[OfflineQueue] Enqueued operation: ${newOperation.id} (${newOperation.type})`)

      // If online, try to sync immediately
      if (isOnline.value && !isSyncing.value) {
        sync()
      }

      return newOperation.id
    } catch (err) {
      console.error('[OfflineQueue] Failed to enqueue:', err)
      throw new Error(MESSAGES.DB_ERROR)
    }
  }

  /**
   * Remove operation from queue
   */
  const dequeue = async (id: string): Promise<void> => {
    try {
      await db.delete(id)
      queue.value = queue.value.filter((op) => op.id !== id)
      console.log(`[OfflineQueue] Dequeued operation: ${id}`)
    } catch (err) {
      console.error('[OfflineQueue] Failed to dequeue:', err)
      throw new Error(MESSAGES.DB_ERROR)
    }
  }

  /**
   * Sync a single operation
   */
  const syncOperation = async (operation: QueuedOperation): Promise<'synced' | 'failed' | 'conflict'> => {
    const endpoint = OPERATION_ENDPOINTS[operation.type]

    try {
      // Update status to syncing
      operation.status = 'syncing'
      await db.update(operation)

      // Make API call
      const response = await fetchApi<{ data: unknown; error?: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(operation.payload),
      })

      if (response.error) {
        // Check for conflict (409)
        if (response.error.includes('409') || response.error.includes('conflict')) {
          operation.status = 'conflict'
          operation.error = MESSAGES.CONFLICT_DETECTED
          await db.update(operation)
          return 'conflict'
        }

        throw new Error(response.error)
      }

      // Success - remove from queue
      await db.delete(operation.id)
      return 'synced'
    } catch (err) {
      operation.retryCount++

      if (operation.retryCount >= MAX_RETRIES) {
        operation.status = 'failed'
        operation.error = err instanceof Error ? err.message : MESSAGES.SYNC_FAILED
      } else {
        operation.status = 'pending'
      }

      await db.update(operation)
      console.error(`[OfflineQueue] Sync failed for ${operation.id}:`, err)

      return 'failed'
    }
  }

  /**
   * Sync all pending operations
   */
  const sync = async (): Promise<SyncResult> => {
    if (isSyncing.value || !isOnline.value) {
      return { success: 0, failed: 0, conflicts: 0, total: 0 }
    }

    isSyncing.value = true
    error.value = null

    const result: SyncResult = {
      success: 0,
      failed: 0,
      conflicts: 0,
      total: pendingOperations.value.length,
    }

    try {
      // Get pending operations (copy to avoid mutation during iteration)
      const operations = [...pendingOperations.value]

      for (const operation of operations) {
        const syncResult = await syncOperation(operation)

        switch (syncResult) {
          case 'synced':
            result.success++
            break
          case 'failed':
            result.failed++
            break
          case 'conflict':
            result.conflicts++
            break
        }
      }

      // Reload queue from DB to get accurate state
      queue.value = await db.getAll()

      lastSyncAt.value = new Date().toISOString()

      console.log('[OfflineQueue] Sync completed:', result)

      return result
    } finally {
      isSyncing.value = false
    }
  }

  /**
   * Clear all synced operations
   */
  const clearSynced = async (): Promise<void> => {
    try {
      await db.deleteByStatus('synced')
      queue.value = queue.value.filter((op) => op.status !== 'synced')
      console.log('[OfflineQueue] Cleared synced operations')
    } catch (err) {
      console.error('[OfflineQueue] Failed to clear synced:', err)
      throw new Error(MESSAGES.DB_ERROR)
    }
  }

  /**
   * Get all conflict operations
   */
  const getConflicts = (): QueuedOperation[] => {
    return conflictOperations.value
  }

  /**
   * Resolve a conflict
   */
  const resolveConflict = async (id: string, resolution: ConflictResolution): Promise<void> => {
    const operation = queue.value.find((op) => op.id === id)

    if (!operation || operation.status !== 'conflict') {
      throw new Error('Không tìm thấy xung đột')
    }

    switch (resolution) {
      case 'retry':
        // Reset and try again
        operation.status = 'pending'
        operation.retryCount = 0
        operation.error = undefined
        await db.update(operation)

        // Trigger sync if online
        if (isOnline.value) {
          sync()
        }
        break

      case 'discard':
        // Remove from queue
        await dequeue(id)
        break

      case 'manual':
        // Mark as synced (user handled it manually)
        operation.status = 'synced'
        operation.syncedAt = new Date().toISOString()
        await db.update(operation)
        break
    }

    // Reload queue
    queue.value = await db.getAll()

    console.log(`[OfflineQueue] Resolved conflict ${id} with ${resolution}`)
  }

  /**
   * Retry a failed operation
   */
  const retryFailed = async (id: string): Promise<void> => {
    const operation = queue.value.find((op) => op.id === id)

    if (!operation || operation.status !== 'failed') {
      throw new Error('Không tìm thấy thao tác thất bại')
    }

    operation.status = 'pending'
    operation.retryCount = 0
    operation.error = undefined
    await db.update(operation)

    // Update local state
    const index = queue.value.findIndex((op) => op.id === id)
    if (index !== -1) {
      queue.value[index] = { ...operation }
    }

    // Trigger sync if online
    if (isOnline.value) {
      sync()
    }
  }

  /**
   * Clear all operations
   */
  const clearAll = async (): Promise<void> => {
    try {
      await db.clear()
      queue.value = []
      console.log('[OfflineQueue] Cleared all operations')
    } catch (err) {
      console.error('[OfflineQueue] Failed to clear all:', err)
      throw new Error(MESSAGES.DB_ERROR)
    }
  }

  /**
   * Cleanup on unmount
   */
  const cleanup = () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }

  return {
    // State
    queue,
    isSyncing,
    lastSyncAt,
    isOnline,
    error,
    isInitialized,

    // Getters
    pendingCount,
    failedCount,
    hasConflicts,
    conflictCount,
    pendingOperations,
    failedOperations,
    conflictOperations,

    // Actions
    initialize,
    enqueue,
    dequeue,
    sync,
    clearSynced,
    getConflicts,
    resolveConflict,
    retryFailed,
    clearAll,
    cleanup,
  }
})
