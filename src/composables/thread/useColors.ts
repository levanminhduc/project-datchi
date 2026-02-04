/**
 * Colors Management Composable
 *
 * Provides reactive state and CRUD operations for color master data management.
 * Follows patterns from useThreadTypes.ts
 */

import { ref, computed } from 'vue'
import { colorService } from '@/services/colorService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import type { Color, ColorFormData, ColorFilters } from '@/types/thread/color'

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  // Success messages
  CREATE_SUCCESS: 'Tạo màu thành công',
  UPDATE_SUCCESS: 'Cập nhật màu thành công',
  DELETE_SUCCESS: 'Đã ngừng sử dụng màu',
  FETCH_SUCCESS: 'Tải danh sách màu thành công',

  // Error messages
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra mạng',
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau',
  TIMEOUT_ERROR: 'Yêu cầu quá thời gian. Vui lòng thử lại',
  CREATE_ERROR: 'Tạo màu thất bại',
  UPDATE_ERROR: 'Cập nhật màu thất bại',
  DELETE_ERROR: 'Xóa màu thất bại',
  FETCH_ERROR: 'Không thể tải danh sách màu',
  NOT_FOUND: 'Không tìm thấy màu',
  DUPLICATE_NAME: 'Tên màu đã tồn tại',
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
      return MESSAGES.DUPLICATE_NAME
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

export function useColors() {
  // State
  const colors = ref<Color[]>([])
  const error = ref<string | null>(null)
  const selectedColor = ref<Color | null>(null)
  const filters = ref<ColorFilters>({})

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasColors = computed(() => colors.value.length > 0)
  const colorCount = computed(() => colors.value.length)
  const activeColors = computed(() => {
    return colors.value.filter((c) => c.is_active)
  })

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all colors from API
   * @param newFilters - Optional filters to apply
   */
  const fetchColors = async (newFilters?: ColorFilters): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await colorService.getAll(filters.value)
      })

      colors.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useColors] fetchColors error:', err)
    }
  }

  /**
   * Create a new color
   * @param data - Color form data
   * @returns Created color or null on error
   */
  const createColor = async (data: ColorFormData): Promise<Color | null> => {
    clearError()

    try {
      const newColor = await loading.withLoading(async () => {
        return await colorService.create(data)
      })

      // Add to local state at the beginning (newest first)
      colors.value = [newColor, ...colors.value]
      snackbar.success(MESSAGES.CREATE_SUCCESS)

      return newColor
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useColors] createColor error:', err)

      return null
    }
  }

  /**
   * Update an existing color
   * @param id - Color ID
   * @param data - Partial color data to update
   * @returns Updated color or null on error
   */
  const updateColor = async (
    id: number,
    data: Partial<ColorFormData> & { is_active?: boolean }
  ): Promise<Color | null> => {
    clearError()

    try {
      const updatedColor = await loading.withLoading(async () => {
        return await colorService.update(id, data)
      })

      // Update local state
      colors.value = colors.value.map((color) =>
        color.id === id ? updatedColor : color
      )

      // Update selected if it was the one updated
      if (selectedColor.value?.id === id) {
        selectedColor.value = updatedColor
      }

      snackbar.success(MESSAGES.UPDATE_SUCCESS)

      return updatedColor
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useColors] updateColor error:', err)

      return null
    }
  }

  /**
   * Delete a color (soft delete)
   * @param id - Color ID
   * @returns true if successful, false on error
   */
  const deleteColor = async (id: number): Promise<boolean> => {
    clearError()

    try {
      await loading.withLoading(async () => {
        await colorService.remove(id)
      })

      // Update local state - mark as inactive instead of removing
      colors.value = colors.value.map((color) =>
        color.id === id ? { ...color, is_active: false } : color
      )

      // Clear selected if it was the one deleted
      if (selectedColor.value?.id === id) {
        selectedColor.value = null
      }

      snackbar.success(MESSAGES.DELETE_SUCCESS)

      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useColors] deleteColor error:', err)

      return false
    }
  }

  /**
   * Select a color for viewing/editing
   * @param color - Color to select, or null to deselect
   */
  const selectColor = (color: Color | null): void => {
    selectedColor.value = color
  }

  /**
   * Find a color by ID from local state
   * @param id - Color ID
   * @returns Color or undefined if not found
   */
  const getColorById = (id: number): Color | undefined => {
    return colors.value.find((color) => color.id === id)
  }

  /**
   * Set filters and refetch
   * @param newFilters - New filters to apply
   */
  const setFilters = async (newFilters: ColorFilters): Promise<void> => {
    filters.value = newFilters
    await fetchColors()
  }

  /**
   * Clear all filters and refetch
   */
  const clearFilters = async (): Promise<void> => {
    filters.value = {}
    await fetchColors()
  }

  /**
   * Reset all state to initial values
   */
  const reset = (): void => {
    colors.value = []
    error.value = null
    selectedColor.value = null
    filters.value = {}
    loading.reset()
  }

  return {
    // State
    colors,
    loading: isLoading,
    error,
    selectedColor,
    filters,

    // Computed
    hasColors,
    colorCount,
    activeColors,

    // Methods
    fetchColors,
    createColor,
    updateColor,
    deleteColor,
    selectColor,
    getColorById,
    setFilters,
    clearFilters,
    clearError,
    reset,
  }
}
