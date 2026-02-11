/**
 * Thread Issue Returns Management Composable
 * Nhập lại cuộn lẻ - Return Partial Cones
 *
 * Provides reactive state and operations for returning partially used cones.
 * Handles percentage-based return calculations and return submissions.
 */

import { ref, computed } from 'vue'
import { issueReturnService } from '@/services/issueReturnService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type { IssueReturn, CreateIssueReturnDTO } from '@/types/thread/issue'

export function useIssueReturns() {
  // State
  const returns = ref<IssueReturn[]>([])
  const selectedPercentage = ref<number>(100)
  const error = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Percentage options for return (10% increments)
  const percentageOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const totalReturnedMeters = computed(() =>
    returns.value.reduce((sum, r) => sum + r.calculated_remaining_meters, 0)
  )
  const returnCount = computed(() => returns.value.length)
  const hasReturns = computed(() => returns.value.length > 0)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all returns, optionally filtered by issue request
   * @param issueRequestId - Optional issue request ID to filter by
   */
  const fetchReturns = async (issueRequestId?: number): Promise<void> => {
    clearError()

    try {
      returns.value = await loading.withLoading(async () => {
        return await issueReturnService.list({ issue_request_id: issueRequestId })
      })
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tải danh sách nhập lại')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueReturns] fetchReturns error:', err)
    }
  }

  /**
   * Create a new return record
   * @param data - Return creation data
   * @returns Created return record or null on error
   */
  const createReturn = async (data: CreateIssueReturnDTO): Promise<IssueReturn | null> => {
    clearError()

    try {
      const created = await loading.withLoading(async () => {
        return await issueReturnService.create(data)
      })

      returns.value.push(created)
      snackbar.success('Đã nhập lại cuộn thành công')
      return created
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể nhập lại cuộn')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueReturns] createReturn error:', err)
      return null
    }
  }

  /**
   * Calculate remaining meters based on original meters and percentage
   * @param originalMeters - Original cone meters
   * @param percentage - Remaining percentage (10-100)
   * @returns Calculated remaining meters
   */
  const calculateRemainingMeters = (originalMeters: number, percentage: number): number => {
    return (originalMeters * percentage) / 100
  }

  /**
   * Get return by ID
   * @param returnId - Issue return ID
   * @returns Issue return or undefined if not found
   */
  const getReturnById = (returnId: number): IssueReturn | undefined => {
    return returns.value.find((r) => r.id === returnId)
  }

  /**
   * Set the selected percentage for return
   * @param percentage - Percentage value (10-100)
   */
  const setSelectedPercentage = (percentage: number) => {
    if (percentageOptions.includes(percentage as typeof percentageOptions[number])) {
      selectedPercentage.value = percentage
    }
  }

  /**
   * Clear all returns
   */
  const clearReturns = () => {
    returns.value = []
  }

  /**
   * Reset selected percentage to default (100%)
   */
  const resetSelectedPercentage = () => {
    selectedPercentage.value = 100
  }

  return {
    // State
    returns,
    selectedPercentage,
    percentageOptions,
    error,
    // Computed
    isLoading,
    totalReturnedMeters,
    returnCount,
    hasReturns,
    // Actions
    fetchReturns,
    createReturn,
    calculateRemainingMeters,
    getReturnById,
    setSelectedPercentage,
    clearReturns,
    resetSelectedPercentage,
    clearError,
  }
}
