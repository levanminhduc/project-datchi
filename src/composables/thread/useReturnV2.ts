/**
 * Thread Return V2 Composable
 * Nhap lai chi - Return Thread Cones
 *
 * Provides API calls for returning issued thread cones.
 * IMPORTANT: This composable only makes API calls and displays results.
 * All calculations are done by the backend.
 */

import { ref, computed } from 'vue'
import { fetchApi } from '@/services/api'
import type { ApiResponse } from '@/types'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  IssueV2,
  IssueV2WithLines,
  ReturnIssueV2DTO,
  ReturnLog,
} from '@/types/thread/issueV2'

/**
 * Return line input from user
 */
export interface ReturnLineInput {
  line_id: number
  returned_full: number
  returned_partial: number
}

export function useReturnV2() {
  // State
  const confirmedIssues = ref<IssueV2[]>([])
  const selectedIssue = ref<IssueV2WithLines | null>(null)
  const returnLogs = ref<ReturnLog[]>([])
  const error = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasConfirmedIssues = computed(() => confirmedIssues.value.length > 0)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Load confirmed issues that have outstanding items to return
   * Calls GET /api/issues/v2?status=CONFIRMED
   */
  const loadConfirmedIssues = async (): Promise<void> => {
    clearError()

    try {
      const result = await loading.withLoading(async () => {
        const response = await fetchApi<ApiResponse<{ data: IssueV2[]; total: number }>>(
          '/api/issues/v2?status=CONFIRMED'
        )
        return response.data || { data: [], total: 0 }
      })

      confirmedIssues.value = result.data
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tải danh sách phiếu xuất')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useReturnV2] loadConfirmedIssues error:', err)
    }
  }

  /**
   * Load issue details with lines for return
   * Calls GET /api/issues/v2/:id
   * @param issueId - Issue ID to load
   */
  const loadIssueDetails = async (issueId: number): Promise<void> => {
    clearError()

    try {
      selectedIssue.value = await loading.withLoading(async () => {
        const response = await fetchApi<ApiResponse<IssueV2WithLines>>(
          `/api/issues/v2/${issueId}`
        )
        if (!response.data) {
          throw new Error(response.error || 'Không tìm thấy phiếu xuất')
        }
        return response.data
      })
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tải chi tiết phiếu xuất')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useReturnV2] loadIssueDetails error:', err)
    }
  }

  /**
   * Submit return for an issue
   * Calls POST /api/issues/v2/:id/return
   * @param issueId - Issue ID to return
   * @param lines - Lines with return quantities
   * @returns true on success, false on failure
   */
  const submitReturn = async (
    issueId: number,
    lines: ReturnLineInput[]
  ): Promise<boolean> => {
    clearError()

    // Filter out lines with no return quantities
    const linesToSubmit = lines.filter(
      (line) => line.returned_full > 0 || line.returned_partial > 0
    )

    if (linesToSubmit.length === 0) {
      snackbar.warning('Vui lòng nhập số lượng trả')
      return false
    }

    try {
      await loading.withLoading(async () => {
        const dto: ReturnIssueV2DTO = { lines: linesToSubmit }
        const response = await fetchApi<ApiResponse<IssueV2WithLines>>(
          `/api/issues/v2/${issueId}/return`,
          {
            method: 'POST',
            body: JSON.stringify(dto),
          }
        )
        if (response.error) {
          throw new Error(response.error)
        }
        // Update selected issue with response
        if (response.data) {
          selectedIssue.value = response.data
        }
      })

      snackbar.success('Đã nhập lại thành công')
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể nhập lại')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useReturnV2] submitReturn error:', err)
      return false
    }
  }

  /**
   * Clear selected issue
   */
  const loadReturnLogs = async (issueId: number): Promise<void> => {
    try {
      const result = await loading.withLoading(async () => {
        const response = await fetchApi<ApiResponse<ReturnLog[]>>(
          `/api/issues/v2/${issueId}/return-logs`
        )
        return response.data || []
      })
      returnLogs.value = result
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tải lịch sử trả kho')
      snackbar.error(errorMessage)
      console.error('[useReturnV2] loadReturnLogs error:', err)
    }
  }

  const clearSelectedIssue = () => {
    selectedIssue.value = null
  }

  /**
   * Validate return quantities locally (for UI feedback)
   * Uses total-based validation to allow cross-type returns
   * Rule 1: returned_full <= issued_full (can't create full cones from nothing)
   * Rule 2: total_returned <= total_issued (total can't exceed total issued)
   */
  const validateReturnQuantities = (
    lines: ReturnLineInput[],
    issueLines: IssueV2WithLines['lines']
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    for (const line of lines) {
      const issueLine = issueLines.find((l) => l.id === line.line_id)
      if (!issueLine) continue

      const totalReturnedFull = issueLine.returned_full + line.returned_full
      const totalReturnedPartial = issueLine.returned_partial + line.returned_partial
      const totalReturned = totalReturnedFull + totalReturnedPartial
      const totalIssued = issueLine.issued_full + issueLine.issued_partial

      // Rule 1: returned_full cannot exceed issued_full
      if (totalReturnedFull > issueLine.issued_full) {
        errors.push(
          `${issueLine.thread_name || issueLine.thread_code}: Số cuộn nguyên trả (${totalReturnedFull}) vượt quá số đã xuất (${issueLine.issued_full})`
        )
      }

      // Rule 2: total returned cannot exceed total issued
      if (totalReturned > totalIssued) {
        errors.push(
          `${issueLine.thread_name || issueLine.thread_code}: Tổng trả (${totalReturned}) vượt quá tổng đã xuất (${totalIssued})`
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  return {
    // State
    confirmedIssues,
    selectedIssue,
    returnLogs,
    error,
    // Computed
    isLoading,
    hasConfirmedIssues,
    // Actions
    loadConfirmedIssues,
    loadIssueDetails,
    loadReturnLogs,
    submitReturn,
    clearError,
    clearSelectedIssue,
    validateReturnQuantities,
  }
}
