/**
 * Thread Inventory Management Composable
 *
 * Provides reactive state and operations for thread inventory management.
 * Follows patterns from useThreadTypes.ts
 */

import { ref, computed } from 'vue'
import { inventoryService } from '@/services/inventoryService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
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
  FETCH_ERROR: 'Không thể tải danh sách tồn kho',
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra mạng',
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau',
  TIMEOUT_ERROR: 'Yêu cầu quá thời gian. Vui lòng thử lại',
  SUMMARY_ERROR: 'Không thể tải thông tin tổng hợp tồn kho',
}

/**
 * Parse error and return appropriate Vietnamese message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Check for specific error types
    if (message.includes('network') || message.includes('fetch')) {
      return MESSAGES.NETWORK_ERROR
    }
    if (message.includes('timeout')) {
      return MESSAGES.TIMEOUT_ERROR
    }

    // Return the error message if it's already in Vietnamese
    if (/[\u00C0-\u1EF9]/.test(error.message)) {
      return error.message
    }
  }

  return MESSAGES.SERVER_ERROR
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

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

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
   * Reset all state to initial values
   */
  const reset = (): void => {
    inventory.value = []
    error.value = null
    selectedCone.value = null
    filters.value = {}
    availableSummary.value = {}
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
  }
}
