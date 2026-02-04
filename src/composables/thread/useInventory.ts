/**
 * Thread Inventory Management Composable
 *
 * Provides reactive state and operations for thread inventory management.
 * Follows patterns from useThreadTypes.ts
 */

import { ref, computed } from 'vue'
import { useRealtime } from '../useRealtime'
import { inventoryService } from '@/services/inventoryService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type { Cone, InventoryFilters, ReceiveStockDTO } from '@/types/thread'
import { ConeStatus } from '@/types/thread/enums'

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  // Success messages
  RECEIVE_SUCCESS: 'Nhập kho thành công',
  // Error messages
  RECEIVE_ERROR: 'Nhập kho thất bại',
  SUMMARY_ERROR: 'Không thể tải thống kê tồn kho',
}

export function useInventory() {
  // State
  const inventory = ref<Cone[]>([])
  const error = ref<string | null>(null)
  const selectedCone = ref<Cone | null>(null)
  const filters = ref<InventoryFilters>({})
  const availableSummary = ref<
    Record<number, { total_meters: number; full_cones: number; partial_cones: number }>
  >({})
  // Realtime state
  const realtimeEnabled = ref(false)
  const realtimeChannelName = ref<string | null>(null)
  const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()
  const realtime = useRealtime()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasInventory = computed(() => inventory.value.length > 0)
  const inventoryCount = computed(() => inventory.value.length)
  const availableCones = computed(() =>
    inventory.value.filter((cone) => cone.status === ConeStatus.AVAILABLE)
  )
  const partialCones = computed(() => inventory.value.filter((cone) => cone.is_partial === true))

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all inventory from API
   * @param newFilters - Optional filters to apply
   */
  const fetchInventory = async (newFilters?: InventoryFilters): Promise<void> => {
    clearError()

    // Update filters if provided
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await inventoryService.getAll(filters.value)
      })

      inventory.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useInventory] fetchInventory error:', err)
    }
  }

  /**
   * Receive new stock (create multiple cones)
   * @param data - ReceiveStockDTO with thread_type_id, warehouse_id, quantity_cones, etc.
   * @returns Array of created cones or null on error
   */
  const receiveStock = async (data: ReceiveStockDTO): Promise<Cone[] | null> => {
    clearError()

    try {
      const newCones = await loading.withLoading(async () => {
        return await inventoryService.receiveStock(data)
      })

      // Add new cones to local state at the beginning (newest first)
      inventory.value = [...newCones, ...inventory.value]
      snackbar.success(MESSAGES.RECEIVE_SUCCESS)

      return newCones
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(MESSAGES.RECEIVE_ERROR)
      console.error('[useInventory] receiveStock error:', err)

      return null
    }
  }

  /**
   * Find a cone by ID from local state
   * @param id - Cone ID
   * @returns Cone or undefined if not found
   */
  const getConeById = (id: number): Cone | undefined => {
    return inventory.value.find((cone) => cone.id === id)
  }

  /**
   * Fetch available summary statistics
   * @param threadTypeId - Optional filter by thread type ID
   */
  const fetchAvailableSummary = async (threadTypeId?: number): Promise<void> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await inventoryService.getAvailableSummary(threadTypeId)
      })

      availableSummary.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(MESSAGES.SUMMARY_ERROR)
      console.error('[useInventory] fetchAvailableSummary error:', err)
    }
  }

  /**
   * Select a cone for viewing/editing
   * @param cone - Cone to select, or null to deselect
   */
  const selectCone = (cone: Cone | null): void => {
    selectedCone.value = cone
  }

  /**
   * Set filters and refetch
   * @param newFilters - New filters to apply
   */
  const setFilters = async (newFilters: InventoryFilters): Promise<void> => {
    filters.value = newFilters
    await fetchInventory()
  }

  /**
   * Clear all filters and refetch
   */
  const clearFilters = async (): Promise<void> => {
    filters.value = {}
    await fetchInventory()
  }

  /**
   * Debounced refresh to batch rapid changes
   * @param delay - Debounce delay in milliseconds (default: 100ms)
   */
  const debouncedRefresh = (delay: number = 100): void => {
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
    }
    debounceTimer.value = setTimeout(() => {
      fetchInventory()
      debounceTimer.value = null
    }, delay)
  }

  /**
   * Enable real-time updates for inventory changes
   * Subscribes to thread_inventory table changes
   */
  const enableRealtime = (): void => {
    if (realtimeEnabled.value) return

    realtimeChannelName.value = realtime.subscribe(
      {
        table: 'thread_inventory',
        event: '*',
        schema: 'public',
      },
      (payload) => {
        console.log('[useInventory] Real-time event:', payload.eventType)

        // Smart filter check: Only refresh if the changed record affects current view
        const shouldRefresh = (): boolean => {
          // If no filters applied, always refresh
          if (!filters.value.warehouse_id && !filters.value.thread_type_id && !filters.value.status) {
            return true
          }

          // Check if the change affects currently filtered data
          const newRecord = payload.new as Cone | null
          const oldRecord = payload.old as Cone | null

          // For UPDATE events (like batch transfer), check both old and new warehouse
          if (payload.eventType === 'UPDATE') {
            const matchesOld = !filters.value.warehouse_id || oldRecord?.warehouse_id === filters.value.warehouse_id
            const matchesNew = !filters.value.warehouse_id || newRecord?.warehouse_id === filters.value.warehouse_id
            return matchesOld || matchesNew
          }

          // For INSERT/DELETE, check if matches current filter
          const record = newRecord || oldRecord
          if (!record) return true

          if (filters.value.warehouse_id && record.warehouse_id !== filters.value.warehouse_id) {
            return false
          }
          if (filters.value.thread_type_id && record.thread_type_id !== filters.value.thread_type_id) {
            return false
          }
          if (filters.value.status && record.status !== filters.value.status) {
            return false
          }

          return true
        }

        if (shouldRefresh()) {
          debouncedRefresh(100)
        }
      }
    )

    realtimeEnabled.value = true
    snackbar.info('Đang theo dõi tồn kho theo thời gian thực')
  }

  /**
   * Disable real-time updates
   */
  const disableRealtime = (): void => {
    if (!realtimeEnabled.value || !realtimeChannelName.value) return

    realtime.unsubscribe(realtimeChannelName.value)
    realtimeChannelName.value = null
    realtimeEnabled.value = false

    // Clear any pending debounce timer
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
      debounceTimer.value = null
    }
  }

  /**
   * Reset all state to initial values
   */
  const reset = (): void => {
    inventory.value = []
    error.value = null
    selectedCone.value = null
    filters.value = {}
    availableSummary.value = {}
    disableRealtime()
    loading.reset()
  }

  return {
    // State
    inventory,
    loading: isLoading,
    error,
    selectedCone,
    filters,
    availableSummary,

    // Computed
    isLoading,
    hasInventory,
    inventoryCount,
    availableCones,
    partialCones,

    // Methods
    fetchInventory,
    receiveStock,
    getConeById,
    fetchAvailableSummary,
    selectCone,
    setFilters,
    clearFilters,
    clearError,
    reset,
    enableRealtime,
    disableRealtime,
  }
}
