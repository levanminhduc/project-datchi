/**
 * Thread Issue Items Management Composable
 * Quản lý cuộn chỉ trong phiếu xuất - Manage Issue Items
 *
 * Provides reactive state and operations for managing items within an issue request.
 * Handles adding, removing, and tracking issued cones.
 */

import { ref, computed } from 'vue'
import { issueService } from '@/services/issueService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type { IssueItem, AddIssueItemDTO } from '@/types/thread/issue'

export function useIssueItems() {
  // State
  const items = ref<IssueItem[]>([])
  const pendingItem = ref<AddIssueItemDTO | null>(null)
  const error = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const totalMeters = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity_meters, 0)
  )
  const itemCount = computed(() => items.value.length)
  const hasItems = computed(() => items.value.length > 0)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Add a cone to an issue request
   * @param issueId - Issue request ID
   * @param data - Item data (cone_id, allocation_id, notes)
   * @returns Created issue item or null on error
   */
  const addItem = async (issueId: number, data: AddIssueItemDTO): Promise<IssueItem | null> => {
    clearError()

    try {
      const item = await loading.withLoading(async () => {
        return await issueService.addItem(issueId, data)
      })

      items.value.push(item)
      snackbar.success('Đã thêm cuộn vào phiếu xuất')
      return item
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể thêm cuộn')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueItems] addItem error:', err)
      return null
    }
  }

  /**
   * Remove a cone from an issue request
   * @param issueId - Issue request ID
   * @param itemId - Issue item ID
   * @returns true on success, false on failure
   */
  const removeItem = async (issueId: number, itemId: number): Promise<boolean> => {
    clearError()

    try {
      await loading.withLoading(async () => {
        await issueService.removeItem(issueId, itemId)
      })

      items.value = items.value.filter((i) => i.id !== itemId)
      snackbar.success('Đã gỡ cuộn khỏi phiếu xuất')
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể gỡ cuộn')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueItems] removeItem error:', err)
      return false
    }
  }

  /**
   * Set items from external source (e.g., when loading issue request detail)
   * @param newItems - Array of issue items
   */
  const setItems = (newItems: IssueItem[]) => {
    items.value = newItems
  }

  /**
   * Clear all items
   */
  const clearItems = () => {
    items.value = []
  }

  /**
   * Set pending item for staged addition
   * @param data - Item data to stage
   */
  const setPendingItem = (data: AddIssueItemDTO | null) => {
    pendingItem.value = data
  }

  /**
   * Get item by ID
   * @param itemId - Issue item ID
   * @returns Issue item or undefined if not found
   */
  const getItemById = (itemId: number): IssueItem | undefined => {
    return items.value.find((item) => item.id === itemId)
  }

  /**
   * Check if a cone is already in the items list
   * @param coneId - Cone ID to check
   * @returns true if cone is already added
   */
  const hasCone = (coneId: number): boolean => {
    return items.value.some((item) => item.cone_id === coneId)
  }

  return {
    // State
    items,
    pendingItem,
    error,
    // Computed
    isLoading,
    totalMeters,
    itemCount,
    hasItems,
    // Actions
    addItem,
    removeItem,
    setItems,
    clearItems,
    setPendingItem,
    getItemById,
    hasCone,
    clearError,
  }
}
