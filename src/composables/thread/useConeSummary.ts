/**
 * Cone Summary Composable
 *
 * Provides reactive state and operations for cone-based inventory summary.
 * Groups inventory by thread type, showing full and partial cone counts.
 */

import { ref, computed, type Ref } from 'vue'
import { inventoryService } from '@/services/inventoryService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { useRealtime } from '../useRealtime'
import type { ConeSummaryRow, ConeWarehouseBreakdown, ConeSummaryFilters } from '@/types/thread'

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  FETCH_ERROR: 'Không thể tải tổng hợp tồn kho theo cuộn',
  BREAKDOWN_ERROR: 'Không thể tải chi tiết phân bố kho',
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra mạng',
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau',
}

/**
 * Parse error and return appropriate Vietnamese message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return MESSAGES.NETWORK_ERROR
    }

    // Return the error message if it's already in Vietnamese
    if (/[\u00C0-\u1EF9]/.test(error.message)) {
      return error.message
    }
  }

  return MESSAGES.SERVER_ERROR
}

export function useConeSummary() {
  // State
  const summaryList = ref<ConeSummaryRow[]>([])
  const warehouseBreakdown = ref<ConeWarehouseBreakdown[]>([])
  const selectedThreadType = ref<ConeSummaryRow | null>(null)
  const filters = ref<ConeSummaryFilters>({})
  const error = ref<string | null>(null)
  const breakdownLoading = ref(false)
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
  const hasSummary = computed(() => summaryList.value.length > 0)
  const summaryCount = computed(() => summaryList.value.length)

  // Totals computed from summary list
  const totalFullCones = computed(() =>
    summaryList.value.reduce((sum, row) => sum + row.full_cones, 0)
  )
  const totalPartialCones = computed(() =>
    summaryList.value.reduce((sum, row) => sum + row.partial_cones, 0)
  )
  const totalPartialMeters = computed(() =>
    summaryList.value.reduce((sum, row) => sum + row.partial_meters, 0)
  )

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch cone summary from API
   * @param newFilters - Optional filters to apply
   */
  const fetchSummary = async (newFilters?: ConeSummaryFilters): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await inventoryService.getConeSummary(filters.value)
      })

      summaryList.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(MESSAGES.FETCH_ERROR)
      console.error('[useConeSummary] fetchSummary error:', err)
    }
  }

  /**
   * Fetch warehouse breakdown for a specific thread type
   * @param threadTypeId - Thread type ID
   */
  const fetchWarehouseBreakdown = async (threadTypeId: number): Promise<void> => {
    clearError()
    breakdownLoading.value = true

    try {
      const data = await inventoryService.getWarehouseBreakdown(threadTypeId)
      warehouseBreakdown.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(MESSAGES.BREAKDOWN_ERROR)
      console.error('[useConeSummary] fetchWarehouseBreakdown error:', err)
    } finally {
      breakdownLoading.value = false
    }
  }

  /**
   * Select a thread type row for drill-down
   * Automatically fetches warehouse breakdown
   * @param row - ConeSummaryRow to select, or null to deselect
   */
  const selectThreadType = async (row: ConeSummaryRow | null): Promise<void> => {
    selectedThreadType.value = row

    // Clear any pending debounced refresh to avoid race condition
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
      debounceTimer.value = null
    }

    if (row) {
      await fetchWarehouseBreakdown(row.thread_type_id)
    } else {
      warehouseBreakdown.value = []
    }
  }

  /**
   * Set filters and refetch
   * @param newFilters - New filters to apply
   */
  const setFilters = async (newFilters: ConeSummaryFilters): Promise<void> => {
    filters.value = newFilters
    await fetchSummary()
  }

  /**
   * Clear all filters and refetch
   */
  const clearFilters = async (): Promise<void> => {
    filters.value = {}
    await fetchSummary()
  }

  /**
   * Close drill-down view
   */
  const closeBreakdown = (): void => {
    selectedThreadType.value = null
    warehouseBreakdown.value = []
  }

  /**
   * Debounced refresh to batch rapid changes
   * @param delay - Debounce delay in milliseconds (default: 100ms)
   */
  const debouncedRefresh = (delay: number = 100): void => {
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
    }
    debounceTimer.value = setTimeout(async () => {
      await fetchSummary()
      // Also refresh breakdown if a thread type is selected
      if (selectedThreadType.value) {
        await fetchWarehouseBreakdown(selectedThreadType.value.thread_type_id)
      }
      debounceTimer.value = null
    }, delay)
  }

  /**
   * Enable real-time updates for cone summary
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
        // Smart filter check: Only refresh if the changed record affects current view
        const shouldRefresh = (): boolean => {
          // If no warehouse filter applied, always refresh
          if (!filters.value.warehouse_id) {
            return true
          }

          // Check if the change affects currently filtered warehouse
          const newRecord = payload.new as { warehouse_id?: number } | null
          const oldRecord = payload.old as { warehouse_id?: number } | null

          // For UPDATE events (like batch transfer), check both old and new warehouse
          if (payload.eventType === 'UPDATE') {
            const matchesOld = oldRecord?.warehouse_id === filters.value.warehouse_id
            const matchesNew = newRecord?.warehouse_id === filters.value.warehouse_id
            return matchesOld || matchesNew
          }

          // For INSERT/DELETE, check if matches current filter
          const record = newRecord || oldRecord
          if (!record) {
            return true
          }

          return record.warehouse_id === filters.value.warehouse_id
        }

        if (shouldRefresh()) {
          debouncedRefresh(100)
        }
      }
    )

    realtimeEnabled.value = true
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
    summaryList.value = []
    warehouseBreakdown.value = []
    selectedThreadType.value = null
    filters.value = {}
    error.value = null
    breakdownLoading.value = false
    disableRealtime()
    loading.reset()
  }

  return {
    // State
    summaryList,
    warehouseBreakdown,
    selectedThreadType,
    filters,
    error,

    // Loading states
    isLoading,
    breakdownLoading: breakdownLoading as Ref<boolean>,

    // Computed
    hasSummary,
    summaryCount,
    totalFullCones,
    totalPartialCones,
    totalPartialMeters,

    // Methods
    fetchSummary,
    fetchWarehouseBreakdown,
    selectThreadType,
    setFilters,
    clearFilters,
    closeBreakdown,
    clearError,
    reset,
    enableRealtime,
    disableRealtime,
  }
}
