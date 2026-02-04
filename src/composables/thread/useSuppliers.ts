/**
 * Suppliers Management Composable
 *
 * Provides reactive state and CRUD operations for supplier master data management.
 * Follows patterns from useThreadTypes.ts
 */

import { ref, computed } from 'vue'
import { supplierService } from '@/services/supplierService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import type { Supplier, SupplierFormData, SupplierFilters } from '@/types/thread/supplier'

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  // Success messages
  CREATE_SUCCESS: 'Tạo nhà cung cấp thành công',
  UPDATE_SUCCESS: 'Cập nhật nhà cung cấp thành công',
  DELETE_SUCCESS: 'Đã ngừng hợp tác với nhà cung cấp',
  FETCH_SUCCESS: 'Tải danh sách nhà cung cấp thành công',

  // Error messages
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra mạng',
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau',
  TIMEOUT_ERROR: 'Yêu cầu quá thời gian. Vui lòng thử lại',
  CREATE_ERROR: 'Tạo nhà cung cấp thất bại',
  UPDATE_ERROR: 'Cập nhật nhà cung cấp thất bại',
  DELETE_ERROR: 'Xóa nhà cung cấp thất bại',
  FETCH_ERROR: 'Không thể tải danh sách nhà cung cấp',
  NOT_FOUND: 'Không tìm thấy nhà cung cấp',
  DUPLICATE_CODE: 'Mã nhà cung cấp đã tồn tại',
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
    if (message.includes('timeout')) {
      return MESSAGES.TIMEOUT_ERROR
    }
    if (message.includes('đã tồn tại') || message.includes('duplicate')) {
      return MESSAGES.DUPLICATE_CODE
    }
    if (message.includes('not found') || message.includes('không tìm thấy')) {
      return MESSAGES.NOT_FOUND
    }

    // Return the error message if it's already in Vietnamese
    if (/[\u00C0-\u1EF9]/.test(error.message)) {
      return error.message
    }
  }

  return MESSAGES.SERVER_ERROR
}

export function useSuppliers() {
  // State
  const suppliers = ref<Supplier[]>([])
  const error = ref<string | null>(null)
  const selectedSupplier = ref<Supplier | null>(null)
  const filters = ref<SupplierFilters>({})

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasSuppliers = computed(() => suppliers.value.length > 0)
  const supplierCount = computed(() => suppliers.value.length)
  const activeSuppliers = computed(() => {
    return suppliers.value.filter((s) => s.is_active)
  })

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all suppliers from API
   * @param newFilters - Optional filters to apply
   */
  const fetchSuppliers = async (newFilters?: SupplierFilters): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await supplierService.getAll(filters.value)
      })

      suppliers.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useSuppliers] fetchSuppliers error:', err)
    }
  }

  /**
   * Create a new supplier
   * @param data - Supplier form data
   * @returns Created supplier or null on error
   */
  const createSupplier = async (data: SupplierFormData): Promise<Supplier | null> => {
    clearError()

    try {
      const newSupplier = await loading.withLoading(async () => {
        return await supplierService.create(data)
      })

      // Add to local state at the beginning (newest first)
      suppliers.value = [newSupplier, ...suppliers.value]
      snackbar.success(MESSAGES.CREATE_SUCCESS)

      return newSupplier
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useSuppliers] createSupplier error:', err)

      return null
    }
  }

  /**
   * Update an existing supplier
   * @param id - Supplier ID
   * @param data - Partial supplier data to update
   * @returns Updated supplier or null on error
   */
  const updateSupplier = async (
    id: number,
    data: Partial<SupplierFormData> & { is_active?: boolean }
  ): Promise<Supplier | null> => {
    clearError()

    try {
      const updatedSupplier = await loading.withLoading(async () => {
        return await supplierService.update(id, data)
      })

      // Update local state
      suppliers.value = suppliers.value.map((supplier) =>
        supplier.id === id ? updatedSupplier : supplier
      )

      // Update selected if it was the one updated
      if (selectedSupplier.value?.id === id) {
        selectedSupplier.value = updatedSupplier
      }

      snackbar.success(MESSAGES.UPDATE_SUCCESS)

      return updatedSupplier
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useSuppliers] updateSupplier error:', err)

      return null
    }
  }

  /**
   * Delete a supplier (soft delete)
   * @param id - Supplier ID
   * @returns true if successful, false on error
   */
  const deleteSupplier = async (id: number): Promise<boolean> => {
    clearError()

    try {
      await loading.withLoading(async () => {
        await supplierService.remove(id)
      })

      // Update local state - mark as inactive instead of removing
      suppliers.value = suppliers.value.map((supplier) =>
        supplier.id === id ? { ...supplier, is_active: false } : supplier
      )

      // Clear selected if it was the one deleted
      if (selectedSupplier.value?.id === id) {
        selectedSupplier.value = null
      }

      snackbar.success(MESSAGES.DELETE_SUCCESS)

      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useSuppliers] deleteSupplier error:', err)

      return false
    }
  }

  /**
   * Select a supplier for viewing/editing
   * @param supplier - Supplier to select, or null to deselect
   */
  const selectSupplier = (supplier: Supplier | null): void => {
    selectedSupplier.value = supplier
  }

  /**
   * Find a supplier by ID from local state
   * @param id - Supplier ID
   * @returns Supplier or undefined if not found
   */
  const getSupplierById = (id: number): Supplier | undefined => {
    return suppliers.value.find((supplier) => supplier.id === id)
  }

  /**
   * Set filters and refetch
   * @param newFilters - New filters to apply
   */
  const setFilters = async (newFilters: SupplierFilters): Promise<void> => {
    filters.value = newFilters
    await fetchSuppliers()
  }

  /**
   * Clear all filters and refetch
   */
  const clearFilters = async (): Promise<void> => {
    filters.value = {}
    await fetchSuppliers()
  }

  /**
   * Reset all state to initial values
   */
  const reset = (): void => {
    suppliers.value = []
    error.value = null
    selectedSupplier.value = null
    filters.value = {}
    loading.reset()
  }

  return {
    // State
    suppliers,
    loading: isLoading,
    error,
    selectedSupplier,
    filters,

    // Computed
    hasSuppliers,
    supplierCount,
    activeSuppliers,

    // Methods
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    selectSupplier,
    getSupplierById,
    setFilters,
    clearFilters,
    clearError,
    reset,
  }
}
