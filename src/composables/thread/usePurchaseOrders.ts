/**
 * Purchase Orders Composable
 *
 * Provides reactive state and operations for purchase order management.
 */

import { ref, computed } from 'vue'
import { purchaseOrderService } from '@/services'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  PurchaseOrder,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  PurchaseOrderFilter,
} from '@/types/thread'

export function usePurchaseOrders() {
  // State
  const purchaseOrders = ref<PurchaseOrder[]>([])
  const error = ref<string | null>(null)
  const filters = ref<PurchaseOrderFilter>({})
  const selectedPurchaseOrder = ref<PurchaseOrder | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const purchaseOrderCount = computed(() => purchaseOrders.value.length)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all purchase orders from API
   * @param newFilters - Optional filters to apply
   */
  const fetchPurchaseOrders = async (newFilters?: PurchaseOrderFilter): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await purchaseOrderService.getAll(filters.value)
      })

      purchaseOrders.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[usePurchaseOrders] fetchPurchaseOrders error:', err)
    }
  }

  /**
   * Fetch a single purchase order by ID
   * @param id - Purchase order ID
   */
  const fetchPurchaseOrderById = async (id: number): Promise<void> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await purchaseOrderService.getById(id)
      })

      selectedPurchaseOrder.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[usePurchaseOrders] fetchPurchaseOrderById error:', err)
    }
  }

  /**
   * Create a new purchase order
   * @param data - Purchase order creation data
   */
  const createPurchaseOrder = async (data: CreatePurchaseOrderDTO): Promise<PurchaseOrder | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await purchaseOrderService.create(data)
      })

      snackbar.success('Tao don hang thanh cong')
      await fetchPurchaseOrders()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[usePurchaseOrders] createPurchaseOrder error:', err)
      return null
    }
  }

  /**
   * Update a purchase order
   * @param id - Purchase order ID
   * @param data - Purchase order update data
   */
  const updatePurchaseOrder = async (id: number, data: UpdatePurchaseOrderDTO): Promise<PurchaseOrder | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await purchaseOrderService.update(id, data)
      })

      snackbar.success('Cap nhat don hang thanh cong')
      await fetchPurchaseOrders()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[usePurchaseOrders] updatePurchaseOrder error:', err)
      return null
    }
  }

  /**
   * Delete a purchase order
   * @param id - Purchase order ID
   */
  const deletePurchaseOrder = async (id: number): Promise<boolean> => {
    clearError()
    try {
      await loading.withLoading(async () => {
        return await purchaseOrderService.delete(id)
      })

      snackbar.success('Xoa don hang thanh cong')
      await fetchPurchaseOrders()
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[usePurchaseOrders] deletePurchaseOrder error:', err)
      return false
    }
  }

  return {
    // State
    purchaseOrders,
    error,
    filters,
    selectedPurchaseOrder,
    // Computed
    isLoading,
    purchaseOrderCount,
    // Actions
    clearError,
    fetchPurchaseOrders,
    fetchPurchaseOrderById,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
  }
}
