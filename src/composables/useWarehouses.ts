/**
 * Warehouse Management Composable
 *
 * Provides centralized warehouse options for dropdowns.
 * Fetches data from /api/warehouses endpoint.
 * Follows pattern from useThreadTypes.ts
 */

import { ref, computed } from 'vue'
import { warehouseService, type Warehouse } from '@/services/warehouseService'
import { useSnackbar } from './useSnackbar'
import { useLoading } from './useLoading'

export interface WarehouseOption {
  label: string
  value: number
}

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  FETCH_ERROR: 'Không thể tải danh sách kho',
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

export function useWarehouses() {
  // State
  const warehouses = ref<Warehouse[]>([])
  const error = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)

  /**
   * Transform warehouses to dropdown options
   * Format: "Tên Kho (MÃ KHO)"
   */
  const warehouseOptions = computed<WarehouseOption[]>(() =>
    warehouses.value.map((w) => ({
      label: `${w.name} (${w.code})`,
      value: w.id,
    }))
  )

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all warehouses from API
   */
  const fetchWarehouses = async (): Promise<void> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await warehouseService.getAll()
      })

      warehouses.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useWarehouses] fetchWarehouses error:', err)
    }
  }

  /**
   * Get warehouse label by ID
   * @param id - Warehouse ID
   * @returns Warehouse label or empty string if not found
   */
  const getWarehouseLabel = (id: number): string => {
    const warehouse = warehouses.value.find((w) => w.id === id)
    if (!warehouse) return ''
    return `${warehouse.name} (${warehouse.code})`
  }

  /**
   * Find a warehouse by ID from local state
   * @param id - Warehouse ID
   * @returns Warehouse or undefined if not found
   */
  const getWarehouseById = (id: number): Warehouse | undefined => {
    return warehouses.value.find((w) => w.id === id)
  }

  return {
    // State
    warehouses,
    loading: isLoading,
    error,

    // Computed
    warehouseOptions,

    // Methods
    fetchWarehouses,
    getWarehouseLabel,
    getWarehouseById,
    clearError,
  }
}
