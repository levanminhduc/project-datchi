/**
 * useOfflineOperation Composable
 *
 * Wraps API operations with offline-aware behavior.
 * Automatically queues operations when offline and syncs when back online.
 */

import { computed } from 'vue'
import { useOfflineQueueStore, type QueuedOperation } from '@/stores/thread/offlineQueue'
import { storeToRefs } from 'pinia'
import { useSnackbar } from '@/composables/useSnackbar'

export type OperationType = QueuedOperation['type']

export interface OfflineOperationOptions<T> {
  /** Operation type for queue categorization */
  type: OperationType
  /** The API function to execute when online */
  onlineExecutor: () => Promise<T>
  /** Payload to store for offline sync */
  payload: Record<string, unknown>
  /** Optional: Success message (shown on successful online execution) */
  successMessage?: string
  /** Optional: Queued message (shown when operation is queued offline) */
  queuedMessage?: string
}

export interface OfflineOperationResult<T> {
  /** Whether the operation was executed online successfully */
  success: boolean
  /** Whether the operation was queued for later sync */
  queued: boolean
  /** The result data (only when success=true) */
  data?: T
  /** Error message (only when success=false and not queued) */
  error?: string
}

const MESSAGES = {
  QUEUED: 'Thao tác đã lưu, sẽ đồng bộ khi có mạng',
  NETWORK_ERROR: 'Lỗi kết nối mạng',
}

export function useOfflineOperation() {
  const store = useOfflineQueueStore()
  const snackbar = useSnackbar()

  const {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    conflictCount,
    hasConflicts,
  } = storeToRefs(store)

  /**
   * Execute an operation with offline-aware behavior.
   * - If online: attempts to execute immediately
   * - If offline or execution fails: queues for later sync
   */
  async function execute<T>(
    options: OfflineOperationOptions<T>
  ): Promise<OfflineOperationResult<T>> {
    const { type, onlineExecutor, payload, successMessage, queuedMessage } = options

    // Ensure store is initialized
    if (!store.isInitialized) {
      await store.initialize()
    }

    // If online, try to execute immediately
    if (isOnline.value) {
      try {
        const data = await onlineExecutor()

        if (successMessage) {
          snackbar.success(successMessage)
        }

        return {
          success: true,
          queued: false,
          data,
        }
      } catch (err) {
        // Network error or server unavailable - queue for later
        const isNetworkError =
          err instanceof Error &&
          (err.message.includes('fetch') ||
            err.message.includes('network') ||
            err.message.includes('Failed to fetch'))

        if (isNetworkError) {
          // Queue the operation
          await store.enqueue({ type, payload })
          snackbar.info(queuedMessage || MESSAGES.QUEUED)

          return {
            success: false,
            queued: true,
          }
        }

        // Other errors - don't queue, report as failure
        const errorMessage = err instanceof Error ? err.message : MESSAGES.NETWORK_ERROR
        snackbar.error(errorMessage)

        return {
          success: false,
          queued: false,
          error: errorMessage,
        }
      }
    }

    // Offline - queue the operation
    await store.enqueue({ type, payload })
    snackbar.info(queuedMessage || MESSAGES.QUEUED)

    return {
      success: false,
      queued: true,
    }
  }

  /**
   * Create an offline-aware wrapper for an API function.
   * Returns a new function that automatically handles offline queueing.
   */
  function createOfflineWrapper<TArgs extends Record<string, unknown>, TResult>(
    type: OperationType,
    apiFunction: (args: TArgs) => Promise<TResult>,
    options?: {
      successMessage?: string
      queuedMessage?: string
    }
  ) {
    return async (args: TArgs): Promise<OfflineOperationResult<TResult>> => {
      return execute({
        type,
        onlineExecutor: () => apiFunction(args),
        payload: args,
        successMessage: options?.successMessage,
        queuedMessage: options?.queuedMessage,
      })
    }
  }

  /**
   * Manually trigger sync of pending operations
   */
  async function syncNow() {
    if (!isOnline.value) {
      snackbar.warning('Không có kết nối mạng')
      return null
    }

    if (isSyncing.value) {
      snackbar.info('Đang đồng bộ...')
      return null
    }

    const result = await store.sync()

    if (result.success > 0) {
      snackbar.success(`Đã đồng bộ ${result.success} thao tác`)
    }
    if (result.failed > 0) {
      snackbar.warning(`${result.failed} thao tác chưa đồng bộ được`)
    }
    if (result.conflicts > 0) {
      snackbar.error(`${result.conflicts} xung đột cần xử lý`)
    }

    return result
  }

  /**
   * Get the list of pending operations
   */
  const pendingOperations = computed(() => store.pendingOperations)

  /**
   * Get the list of conflict operations
   */
  const conflictOperations = computed(() => store.conflictOperations)

  /**
   * Get the list of failed operations
   */
  const failedOperations = computed(() => store.failedOperations)

  return {
    // State
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    conflictCount,
    hasConflicts,

    // Operations
    pendingOperations,
    conflictOperations,
    failedOperations,

    // Methods
    execute,
    createOfflineWrapper,
    syncNow,

    // Store access for advanced usage
    initialize: store.initialize,
    resolveConflict: store.resolveConflict,
    retryFailed: store.retryFailed,
    clearAll: store.clearAll,
    cleanup: store.cleanup,
  }
}
