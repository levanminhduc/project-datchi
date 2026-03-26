/**
 * Style Thread Specs Composable
 *
 * Provides reactive state and operations for style thread specification management.
 */

import { ref, computed } from 'vue'
import { styleThreadSpecService } from '@/services'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  StyleThreadSpec,
  StyleColorThreadSpec,
  CreateStyleThreadSpecDTO,
  UpdateStyleThreadSpecDTO,
  CreateStyleColorThreadSpecDTO,
  UpdateStyleColorThreadSpecDTO,
  StyleThreadSpecFilter,
} from '@/types/thread'

export function useStyleThreadSpecs() {
  // State
  const styleThreadSpecs = ref<StyleThreadSpec[]>([])
  const colorSpecs = ref<StyleColorThreadSpec[]>([])
  const error = ref<string | null>(null)
  const filters = ref<StyleThreadSpecFilter>({})
  const selectedSpec = ref<StyleThreadSpec | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const specCount = computed(() => styleThreadSpecs.value.length)
  const colorSpecCount = computed(() => colorSpecs.value.length)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all style thread specs from API
   * @param newFilters - Optional filters to apply
   */
  const fetchStyleThreadSpecs = async (newFilters?: StyleThreadSpecFilter): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await styleThreadSpecService.getAll(filters.value)
      })

      styleThreadSpecs.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyleThreadSpecs] fetchStyleThreadSpecs error:', err)
    }
  }

  /**
   * Fetch a single style thread spec by ID
   * @param id - Spec ID
   */
  const fetchSpecById = async (id: number): Promise<void> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await styleThreadSpecService.getById(id)
      })

      selectedSpec.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyleThreadSpecs] fetchSpecById error:', err)
    }
  }

  /**
   * Create a new style thread spec
   * @param data - Spec creation data
   */
  const createSpec = async (data: CreateStyleThreadSpecDTO): Promise<StyleThreadSpec | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await styleThreadSpecService.create(data)
      })

      snackbar.success('Tạo định mức chỉ thành công')
      await fetchStyleThreadSpecs()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyleThreadSpecs] createSpec error:', err)
      return null
    }
  }

  /**
   * Update a style thread spec
   * @param id - Spec ID
   * @param data - Spec update data
   */
  const updateSpec = async (id: number, data: UpdateStyleThreadSpecDTO): Promise<StyleThreadSpec | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await styleThreadSpecService.update(id, data)
      })

      snackbar.success('Cập nhật định mức chỉ thành công')
      await fetchStyleThreadSpecs()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyleThreadSpecs] updateSpec error:', err)
      return null
    }
  }

  /**
   * Delete a style thread spec
   * @param id - Spec ID
   */
  const deleteSpec = async (id: number): Promise<boolean> => {
    clearError()
    try {
      await loading.withLoading(async () => {
        return await styleThreadSpecService.delete(id)
      })

      snackbar.success('Xóa định mức chỉ thành công')
      await fetchStyleThreadSpecs()
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyleThreadSpecs] deleteSpec error:', err)
      return false
    }
  }

  /**
   * Fetch color specs for a spec
   * @param specId - Style thread spec ID
   */
  const fetchColorSpecs = async (specId: number): Promise<void> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await styleThreadSpecService.getColorSpecs(specId)
      })

      colorSpecs.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyleThreadSpecs] fetchColorSpecs error:', err)
    }
  }

  /**
   * Add a color spec
   * @param specId - Style thread spec ID
   * @param data - Color spec creation data
   */
  const addColorSpec = async (specId: number, data: CreateStyleColorThreadSpecDTO): Promise<StyleColorThreadSpec | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await styleThreadSpecService.addColorSpec(specId, data)
      })

      snackbar.success('Thêm định mức chỉ theo màu thành công')
      await fetchColorSpecs(specId)
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyleThreadSpecs] addColorSpec error:', err)
      return null
    }
  }

  /**
   * Fetch ALL color specs for a style (batch - all specs at once)
   * @param styleId - Style ID
   */
  const fetchAllColorSpecsByStyle = async (styleId: number): Promise<void> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await styleThreadSpecService.getAllColorSpecsByStyle(styleId)
      })

      colorSpecs.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyleThreadSpecs] fetchAllColorSpecsByStyle error:', err)
    }
  }

  /**
   * Update a color spec (inline edit)
   * @param colorSpecId - Color spec ID
   * @param data - Update data
   */
  const updateColorSpec = async (colorSpecId: number, data: UpdateStyleColorThreadSpecDTO): Promise<StyleColorThreadSpec | null> => {
    clearError()
    try {
      const result = await styleThreadSpecService.updateColorSpec(colorSpecId, data)

      // Update local state
      const index = colorSpecs.value.findIndex(cs => cs.id === colorSpecId)
      if (index !== -1) {
        colorSpecs.value[index] = result
      }

      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyleThreadSpecs] updateColorSpec error:', err)
      return null
    }
  }

  /**
   * Delete a color spec
   * @param colorSpecId - Color spec ID
   */
  const deleteColorSpec = async (colorSpecId: number): Promise<boolean> => {
    clearError()
    try {
      await styleThreadSpecService.deleteColorSpec(colorSpecId)

      // Remove from local state
      colorSpecs.value = colorSpecs.value.filter(cs => cs.id !== colorSpecId)

      snackbar.success('Xóa định mức màu thành công')
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyleThreadSpecs] deleteColorSpec error:', err)
      return false
    }
  }

  return {
    // State
    styleThreadSpecs,
    colorSpecs,
    error,
    filters,
    selectedSpec,
    // Computed
    isLoading,
    specCount,
    colorSpecCount,
    // Actions
    clearError,
    fetchStyleThreadSpecs,
    fetchSpecById,
    createSpec,
    updateSpec,
    deleteSpec,
    fetchColorSpecs,
    addColorSpec,
    fetchAllColorSpecsByStyle,
    updateColorSpec,
    deleteColorSpec,
  }
}
