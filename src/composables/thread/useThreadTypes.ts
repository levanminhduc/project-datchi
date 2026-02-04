/**
 * Thread Types Management Composable
 *
 * Provides reactive state and CRUD operations for thread type management.
 * Follows patterns from useEmployees.ts
 */

import { ref, computed } from 'vue'
import { threadService } from '@/services/threadService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { createErrorHandler } from '@/utils/errorMessages'
import type { ThreadType, ThreadTypeFormData, ThreadTypeFilters } from '@/types/thread'

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  // Success messages
  CREATE_SUCCESS: 'Tạo loại chỉ thành công',
  UPDATE_SUCCESS: 'Cập nhật loại chỉ thành công',
  DELETE_SUCCESS: 'Xóa loại chỉ thành công',
}

/**
 * Domain-specific error handler for thread type operations
 */
const getErrorMessage = createErrorHandler({
  duplicate: 'Mã loại chỉ đã tồn tại',
  notFound: 'Không tìm thấy loại chỉ',
})

export function useThreadTypes() {
  // State
  const threadTypes = ref<ThreadType[]>([])
  const error = ref<string | null>(null)
  const selectedThreadType = ref<ThreadType | null>(null)
  const filters = ref<ThreadTypeFilters>({})

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasThreadTypes = computed(() => threadTypes.value.length > 0)
  const threadTypeCount = computed(() => threadTypes.value.length)
  const activeThreadTypes = computed(() => {
    return threadTypes.value.filter((t) => t.is_active)
  })

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all thread types from API
   * @param newFilters - Optional filters to apply
   */
  const fetchThreadTypes = async (newFilters?: ThreadTypeFilters): Promise<void> => {
    clearError()

    // Update filters if provided
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await threadService.getAll(filters.value)
      })

      threadTypes.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadTypes] fetchThreadTypes error:', err)
    }
  }

  /**
   * Create a new thread type
   * @param data - Thread type form data
   * @returns Created thread type or null on error
   */
  const createThreadType = async (
    data: ThreadTypeFormData
  ): Promise<ThreadType | null> => {
    clearError()

    try {
      const newThreadType = await loading.withLoading(async () => {
        return await threadService.create(data)
      })

      // Add to local state at the beginning (newest first)
      threadTypes.value = [newThreadType, ...threadTypes.value]
      snackbar.success(MESSAGES.CREATE_SUCCESS)

      return newThreadType
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadTypes] createThreadType error:', err)

      return null
    }
  }

  /**
   * Update an existing thread type
   * @param id - Thread type ID
   * @param data - Partial thread type data to update
   * @returns Updated thread type or null on error
   */
  const updateThreadType = async (
    id: number,
    data: Partial<ThreadTypeFormData>
  ): Promise<ThreadType | null> => {
    clearError()

    try {
      const updatedThreadType = await loading.withLoading(async () => {
        return await threadService.update(id, data)
      })

      // Update local state
      threadTypes.value = threadTypes.value.map((type) =>
        type.id === id ? updatedThreadType : type
      )

      // Update selected if it was the one updated
      if (selectedThreadType.value?.id === id) {
        selectedThreadType.value = updatedThreadType
      }

      snackbar.success(MESSAGES.UPDATE_SUCCESS)

      return updatedThreadType
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadTypes] updateThreadType error:', err)

      return null
    }
  }

  /**
   * Delete a thread type (soft delete)
   * @param id - Thread type ID
   * @returns true if successful, false on error
   */
  const deleteThreadType = async (id: number): Promise<boolean> => {
    clearError()

    try {
      await loading.withLoading(async () => {
        await threadService.remove(id)
      })

      // Update local state - mark as inactive instead of removing
      threadTypes.value = threadTypes.value.map((type) =>
        type.id === id ? { ...type, is_active: false } : type
      )

      // Clear selected if it was the one deleted
      if (selectedThreadType.value?.id === id) {
        selectedThreadType.value = null
      }

      snackbar.success(MESSAGES.DELETE_SUCCESS)

      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useThreadTypes] deleteThreadType error:', err)

      return false
    }
  }

  /**
   * Select a thread type for viewing/editing
   * @param threadType - Thread type to select, or null to deselect
   */
  const selectThreadType = (threadType: ThreadType | null): void => {
    selectedThreadType.value = threadType
  }

  /**
   * Find a thread type by ID from local state
   * @param id - Thread type ID
   * @returns Thread type or undefined if not found
   */
  const getThreadTypeById = (id: number): ThreadType | undefined => {
    return threadTypes.value.find((type) => type.id === id)
  }

  /**
   * Set filters and refetch
   * @param newFilters - New filters to apply
   */
  const setFilters = async (newFilters: ThreadTypeFilters): Promise<void> => {
    filters.value = newFilters
    await fetchThreadTypes()
  }

  /**
   * Clear all filters and refetch
   */
  const clearFilters = async (): Promise<void> => {
    filters.value = {}
    await fetchThreadTypes()
  }

  /**
   * Reset all state to initial values
   */
  const reset = (): void => {
    threadTypes.value = []
    error.value = null
    selectedThreadType.value = null
    filters.value = {}
    loading.reset()
  }

  return {
    // State
    threadTypes,
    loading: isLoading,
    error,
    selectedThreadType,
    filters,

    // Computed
    hasThreadTypes,
    threadTypeCount,
    activeThreadTypes,

    // Methods
    fetchThreadTypes,
    createThreadType,
    updateThreadType,
    deleteThreadType,
    selectThreadType,
    getThreadTypeById,
    setFilters,
    clearFilters,
    clearError,
    reset,
  }
}
