/**
 * Styles Composable
 *
 * Provides reactive state and operations for style management.
 */

import { ref, computed } from 'vue'
import { styleService } from '@/services'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  Style,
  CreateStyleDTO,
  UpdateStyleDTO,
  StyleFilter,
  StyleThreadSpec,
} from '@/types/thread'

export function useStyles() {
  // State
  const styles = ref<Style[]>([])
  const error = ref<string | null>(null)
  const filters = ref<StyleFilter>({})
  const selectedStyle = ref<Style | null>(null)
  const styleThreadSpecs = ref<StyleThreadSpec[]>([])

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const styleCount = computed(() => styles.value.length)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all styles from API
   * @param newFilters - Optional filters to apply
   */
  const fetchStyles = async (newFilters?: StyleFilter): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await styleService.getAll(filters.value)
      })

      styles.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyles] fetchStyles error:', err)
    }
  }

  /**
   * Fetch a single style by ID
   * @param id - Style ID
   */
  const fetchStyleById = async (id: number): Promise<void> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await styleService.getById(id)
      })

      selectedStyle.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyles] fetchStyleById error:', err)
    }
  }

  /**
   * Create a new style
   * @param data - Style creation data
   */
  const createStyle = async (data: CreateStyleDTO): Promise<Style | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await styleService.create(data)
      })

      snackbar.success('Tao ma hang thanh cong')
      await fetchStyles()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyles] createStyle error:', err)
      return null
    }
  }

  /**
   * Update a style
   * @param id - Style ID
   * @param data - Style update data
   */
  const updateStyle = async (id: number, data: UpdateStyleDTO): Promise<Style | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await styleService.update(id, data)
      })

      snackbar.success('Cap nhat ma hang thanh cong')
      await fetchStyles()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyles] updateStyle error:', err)
      return null
    }
  }

  /**
   * Delete a style
   * @param id - Style ID
   */
  const deleteStyle = async (id: number): Promise<boolean> => {
    clearError()
    try {
      await loading.withLoading(async () => {
        return await styleService.delete(id)
      })

      snackbar.success('Xoa ma hang thanh cong')
      await fetchStyles()
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyles] deleteStyle error:', err)
      return false
    }
  }

  /**
   * Fetch thread specs for a style
   * @param id - Style ID
   */
  const fetchStyleThreadSpecs = async (id: number): Promise<void> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await styleService.getThreadSpecs(id)
      })

      styleThreadSpecs.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useStyles] fetchStyleThreadSpecs error:', err)
    }
  }

  return {
    // State
    styles,
    error,
    filters,
    selectedStyle,
    styleThreadSpecs,
    // Computed
    isLoading,
    styleCount,
    // Actions
    clearError,
    fetchStyles,
    fetchStyleById,
    createStyle,
    updateStyle,
    deleteStyle,
    fetchStyleThreadSpecs,
  }
}
