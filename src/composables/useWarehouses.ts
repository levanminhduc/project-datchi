/**
 * Warehouse Management Composable
 *
 * Provides centralized warehouse options for dropdowns.
 * Supports hierarchy with LOCATION (địa điểm) and STORAGE (kho) types.
 * Fetches data from /api/warehouses endpoint.
 */

import { ref, computed } from 'vue'
import { warehouseService, type Warehouse, type WarehouseTreeNode } from '@/services/warehouseService'
import { useSnackbar } from './useSnackbar'
import { useLoading } from './useLoading'

export interface WarehouseOption {
  label: string
  value: number
  type?: 'LOCATION' | 'STORAGE'
  disabled?: boolean
}

export interface GroupedWarehouseOption {
  label: string
  value: number | null
  type: 'LOCATION' | 'STORAGE'
  disabled: boolean
  parentId: number | null
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
  const warehouseTree = ref<WarehouseTreeNode[]>([])
  const error = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)

  /**
   * Get only LOCATION type warehouses
   */
  const locations = computed<Warehouse[]>(() => {
    return warehouses.value.filter(w => w.type === 'LOCATION')
  })

  /**
   * Get only STORAGE type warehouses
   */
  const storageWarehouses = computed<Warehouse[]>(() => {
    return warehouses.value.filter(w => w.type === 'STORAGE')
  })

  /**
   * Group warehouses by location
   * Returns a map of locationId -> storage warehouses
   */
  const warehousesByLocation = computed<Map<number, Warehouse[]>>(() => {
    const map = new Map<number, Warehouse[]>()
    for (const w of storageWarehouses.value) {
      if (w.parent_id) {
        const existing = map.get(w.parent_id) || []
        existing.push(w)
        map.set(w.parent_id, existing)
      }
    }
    return map
  })

  /**
   * Transform warehouses to dropdown options (flat list - backward compatible)
   * Format: "Tên Kho (MÃ KHO)"
   */
  const warehouseOptions = computed<WarehouseOption[]>(() => {
    return warehouses.value.map((w) => ({
      label: `${w.name} (${w.code})`,
      value: w.id,
      type: w.type,
      disabled: w.type === 'LOCATION', // LOCATION is not selectable for inventory
    }))
  })

  /**
   * Transform to grouped options for QSelect with headers
   * LOCATIONs appear as disabled headers, STORAGEs are selectable
   */
  const groupedWarehouseOptions = computed<GroupedWarehouseOption[]>(() => {
    const options: GroupedWarehouseOption[] = []

    for (const location of warehouseTree.value) {
      // Add location as header (disabled)
      options.push({
        label: location.name,
        value: null,
        type: 'LOCATION',
        disabled: true,
        parentId: null,
      })

      // Add children as selectable options
      for (const storage of location.children) {
        options.push({
          label: `  ${storage.name}`,  // Indented
          value: storage.id,
          type: 'STORAGE',
          disabled: false,
          parentId: location.id,
        })
      }
    }

    return options
  })

  /**
   * Get only storage options (for inventory operations)
   */
  const storageOptions = computed<WarehouseOption[]>(() => {
    return storageWarehouses.value.map((w) => ({
      label: `${w.name} (${w.code})`,
      value: w.id,
      type: 'STORAGE',
    }))
  })

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all warehouses from API (flat list)
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
   * Fetch warehouse tree structure
   */
  const fetchWarehouseTree = async (): Promise<void> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await warehouseService.getTree()
      })

      warehouseTree.value = data
      
      // Also populate flat list from tree for backward compatibility
      const flatList: Warehouse[] = []
      for (const location of data) {
        flatList.push(location)
        flatList.push(...location.children)
      }
      warehouses.value = flatList
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useWarehouses] fetchWarehouseTree error:', err)
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

  /**
   * Get parent location name for a storage warehouse
   * @param warehouseId - Storage warehouse ID
   * @returns Location name or empty string
   */
  const getLocationName = (warehouseId: number): string => {
    const warehouse = getWarehouseById(warehouseId)
    if (!warehouse || !warehouse.parent_id) return ''
    
    const location = getWarehouseById(warehouse.parent_id)
    return location?.name || ''
  }

  /**
   * Get all storage warehouses under a location
   * @param locationId - Location warehouse ID
   * @returns Array of storage warehouses
   */
  const getStoragesForLocation = (locationId: number): Warehouse[] => {
    return warehousesByLocation.value.get(locationId) || []
  }

  return {
    // State
    warehouses,
    warehouseTree,
    loading: isLoading,
    error,

    // Computed - hierarchy
    locations,
    storageWarehouses,
    warehousesByLocation,

    // Computed - options
    warehouseOptions,
    groupedWarehouseOptions,
    storageOptions,

    // Methods
    fetchWarehouses,
    fetchWarehouseTree,
    getWarehouseLabel,
    getWarehouseById,
    getLocationName,
    getStoragesForLocation,
    clearError,
  }
}
