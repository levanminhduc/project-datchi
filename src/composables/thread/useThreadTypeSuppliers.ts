/**
 * Thread Type Suppliers Management Composable
 *
 * Provides reactive state and CRUD operations for managing the
 * thread type - supplier relationships (junction table).
 * 
 * Each thread type can be sourced from multiple suppliers,
 * each with their own supplier_item_code and unit_price.
 */

import { ref, computed } from 'vue'
import { threadTypeSupplierService } from '@/services/threadTypeSupplierService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { createErrorHandler } from '@/utils/errorMessages'
import type {
  ThreadTypeSupplierWithRelations,
  ThreadTypeSupplierFormData,
  LinkSupplierFormData,
  ThreadTypeSupplierFilters
} from '@/types/thread/thread-type-supplier'

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  LINK_SUCCESS: 'Đã liên kết nhà cung cấp với loại chỉ',
  UPDATE_SUCCESS: 'Đã cập nhật thông tin nhà cung cấp',
  UNLINK_SUCCESS: 'Đã xóa liên kết nhà cung cấp',
}

/**
 * Domain-specific error handler for thread type supplier operations
 */
const getErrorMessage = createErrorHandler({
  duplicate: 'Liên kết này đã tồn tại',
  notFound: 'Không tìm thấy liên kết',
})

/**
 * Composable for managing thread type - supplier relationships
 * @param threadTypeId - Optional thread type ID to scope operations
 */
export function useThreadTypeSuppliers(threadTypeId?: number) {
  // State
  const suppliers = ref<ThreadTypeSupplierWithRelations[]>([])
  const error = ref<string | null>(null)
  const selectedLink = ref<ThreadTypeSupplierWithRelations | null>(null)
  const filters = ref<ThreadTypeSupplierFilters>(
    threadTypeId ? { thread_type_id: threadTypeId } : {}
  )

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
   * Fetch suppliers for a thread type
   * @param targetThreadTypeId - Thread type ID (uses scoped ID if not provided)
   */
  const fetchSuppliers = async (targetThreadTypeId?: number): Promise<void> => {
    clearError()
    const id = targetThreadTypeId ?? threadTypeId

    if (!id) {
      console.warn('[useThreadTypeSuppliers] No thread_type_id provided')
      return
    }

    try {
      const data = await loading.withLoading(async () => {
        return await threadTypeSupplierService.getSuppliersByThreadType(id)
      })

      suppliers.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadTypeSuppliers] fetchSuppliers error:', err)
    }
  }

  /**
   * Fetch all links with filters (not scoped to a thread type)
   * @param newFilters - Optional filters to apply
   */
  const fetchAll = async (newFilters?: ThreadTypeSupplierFilters): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await threadTypeSupplierService.getAll(filters.value)
      })

      suppliers.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadTypeSuppliers] fetchAll error:', err)
    }
  }

  /**
   * Link a supplier to a thread type
   * @param targetThreadTypeId - Thread type ID
   * @param data - Supplier link data
   * @returns Created link or null on error
   */
  const linkSupplier = async (
    targetThreadTypeId: number,
    data: LinkSupplierFormData
  ): Promise<ThreadTypeSupplierWithRelations | null> => {
    clearError()

    try {
      const newLink = await loading.withLoading(async () => {
        return await threadTypeSupplierService.linkSupplierToThread(targetThreadTypeId, data)
      })

      // Add to local state if we're scoped to this thread type
      if (!threadTypeId || threadTypeId === targetThreadTypeId) {
        suppliers.value = [newLink, ...suppliers.value]
      }

      snackbar.success(MESSAGES.LINK_SUCCESS)
      return newLink
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadTypeSuppliers] linkSupplier error:', err)
      return null
    }
  }

  /**
   * Create a new link (full form)
   * @param data - Full link data including thread_type_id
   * @returns Created link or null on error
   */
  const createLink = async (
    data: ThreadTypeSupplierFormData
  ): Promise<ThreadTypeSupplierWithRelations | null> => {
    clearError()

    try {
      const newLink = await loading.withLoading(async () => {
        return await threadTypeSupplierService.create(data)
      })

      // Add to local state
      suppliers.value = [newLink, ...suppliers.value]
      snackbar.success(MESSAGES.LINK_SUCCESS)
      return newLink
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadTypeSuppliers] createLink error:', err)
      return null
    }
  }

  /**
   * Update a link
   * @param id - Link ID
   * @param data - Partial update data
   * @returns Updated link or null on error
   */
  const updateLink = async (
    id: number,
    data: Partial<Omit<ThreadTypeSupplierFormData, 'thread_type_id' | 'supplier_id'>> & { is_active?: boolean }
  ): Promise<ThreadTypeSupplierWithRelations | null> => {
    clearError()

    try {
      const updatedLink = await loading.withLoading(async () => {
        return await threadTypeSupplierService.update(id, data)
      })

      // Update local state
      suppliers.value = suppliers.value.map((link) =>
        link.id === id ? updatedLink : link
      )

      // Update selected if it was the one updated
      if (selectedLink.value?.id === id) {
        selectedLink.value = updatedLink
      }

      snackbar.success(MESSAGES.UPDATE_SUCCESS)
      return updatedLink
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadTypeSuppliers] updateLink error:', err)
      return null
    }
  }

  /**
   * Delete a link (hard delete)
   * @param id - Link ID
   * @returns true if successful, false on error
   */
  const deleteLink = async (id: number): Promise<boolean> => {
    clearError()

    try {
      await loading.withLoading(async () => {
        await threadTypeSupplierService.remove(id)
      })

      // Remove from local state
      suppliers.value = suppliers.value.filter((link) => link.id !== id)

      // Clear selected if it was the one deleted
      if (selectedLink.value?.id === id) {
        selectedLink.value = null
      }

      snackbar.success(MESSAGES.UNLINK_SUCCESS)
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadTypeSuppliers] deleteLink error:', err)
      return false
    }
  }

  /**
   * Select a link for viewing/editing
   * @param link - Link to select, or null to deselect
   */
  const selectLink = (link: ThreadTypeSupplierWithRelations | null): void => {
    selectedLink.value = link
  }

  /**
   * Find a link by ID from local state
   * @param id - Link ID
   * @returns Link or undefined if not found
   */
  const getLinkById = (id: number): ThreadTypeSupplierWithRelations | undefined => {
    return suppliers.value.find((link) => link.id === id)
  }

  /**
   * Reset all state to initial values
   */
  const reset = (): void => {
    suppliers.value = []
    error.value = null
    selectedLink.value = null
    filters.value = threadTypeId ? { thread_type_id: threadTypeId } : {}
    loading.reset()
  }

  return {
    // State
    suppliers,
    loading: isLoading,
    error,
    selectedLink,
    filters,

    // Computed
    hasSuppliers,
    supplierCount,
    activeSuppliers,

    // Methods
    fetchSuppliers,
    fetchAll,
    linkSupplier,
    createLink,
    updateLink,
    deleteLink,
    selectLink,
    getLinkById,
    clearError,
    reset,
  }
}
