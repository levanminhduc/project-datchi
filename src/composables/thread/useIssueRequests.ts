/**
 * Thread Issue Requests Management Composable
 * Xuất kho sản xuất - Issue to Production
 *
 * Provides reactive state and operations for thread issuance management.
 * Handles fetching, creating, updating, and cancelling issue requests.
 */

import { ref, computed } from 'vue'
import { issueService } from '@/services/issueService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  IssueRequest,
  IssueItem,
  CreateIssueRequestDTO,
  IssueRequestFilters,
  QuotaCheck,
} from '@/types/thread/issue'

export function useIssueRequests() {
  // State
  const issueRequests = ref<IssueRequest[]>([])
  const currentRequest = ref<(IssueRequest & { items: IssueItem[] }) | null>(null)
  const total = ref(0)
  const filters = ref<IssueRequestFilters>({})
  const quotaInfo = ref<QuotaCheck | null>(null)
  const error = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasRequests = computed(() => issueRequests.value.length > 0)
  const isOverQuota = computed(() => quotaInfo.value?.is_over_quota ?? false)
  const requestCount = computed(() => issueRequests.value.length)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all issue requests from API
   * @param newFilters - Optional filters to apply
   */
  const fetchRequests = async (newFilters?: IssueRequestFilters): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const result = await loading.withLoading(async () => {
        return await issueService.list(filters.value)
      })

      issueRequests.value = result.data
      total.value = result.total
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tải danh sách phiếu xuất')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueRequests] fetchRequests error:', err)
    }
  }

  /**
   * Fetch a single issue request by ID
   * @param id - Issue request ID
   */
  const fetchRequest = async (id: number): Promise<void> => {
    clearError()

    try {
      currentRequest.value = await loading.withLoading(async () => {
        return await issueService.get(id)
      })
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tải phiếu xuất')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueRequests] fetchRequest error:', err)
    }
  }

  /**
   * Create a new issue request
   * @param data - Issue request creation data
   * @returns Created issue request or null on error
   */
  const createRequest = async (data: CreateIssueRequestDTO): Promise<IssueRequest | null> => {
    clearError()

    try {
      const created = await loading.withLoading(async () => {
        return await issueService.create(data)
      })

      snackbar.success('Đã tạo phiếu xuất ' + created.issue_code)
      await fetchRequests()
      return created
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tạo phiếu xuất')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueRequests] createRequest error:', err)
      return null
    }
  }

  /**
   * Cancel an issue request
   * @param id - Issue request ID
   * @returns true on success, false on failure
   */
  const cancelRequest = async (id: number): Promise<boolean> => {
    clearError()

    try {
      await loading.withLoading(async () => {
        await issueService.update(id, { status: 'CANCELLED' })
      })

      snackbar.success('Đã hủy phiếu xuất')
      await fetchRequests()
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể hủy phiếu xuất')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueRequests] cancelRequest error:', err)
      return false
    }
  }

  /**
   * Update issue request notes
   * @param id - Issue request ID
   * @param notes - New notes value
   * @returns Updated issue request or null on error
   */
  const updateNotes = async (id: number, notes: string): Promise<IssueRequest | null> => {
    clearError()

    try {
      const updated = await loading.withLoading(async () => {
        return await issueService.update(id, { notes })
      })

      snackbar.success('Đã cập nhật ghi chú')
      return updated
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể cập nhật ghi chú')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useIssueRequests] updateNotes error:', err)
      return null
    }
  }

  /**
   * Check quota remaining for a PO/Style/Color/ThreadType combination
   * @param poId - Purchase Order ID
   * @param styleId - Style ID
   * @param colorId - Color ID
   * @param threadTypeId - Thread Type ID
   * @returns Quota check result or null on error
   */
  const checkQuota = async (
    poId: number,
    styleId: number,
    colorId: number,
    threadTypeId: number
  ): Promise<QuotaCheck | null> => {
    try {
      quotaInfo.value = await loading.withLoading(async () => {
        return await issueService.checkQuota(poId, styleId, colorId, threadTypeId)
      })
      return quotaInfo.value
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể kiểm tra định mức')
      snackbar.error(errorMessage)
      console.error('[useIssueRequests] checkQuota error:', err)
      return null
    }
  }

  /**
   * Clear quota info state
   */
  const clearQuotaInfo = () => {
    quotaInfo.value = null
  }

  /**
   * Clear current request state
   */
  const clearCurrentRequest = () => {
    currentRequest.value = null
  }

  return {
    // State
    issueRequests,
    currentRequest,
    total,
    filters,
    quotaInfo,
    error,
    // Computed
    isLoading,
    hasRequests,
    isOverQuota,
    requestCount,
    // Actions
    fetchRequests,
    fetchRequest,
    createRequest,
    cancelRequest,
    updateNotes,
    checkQuota,
    clearError,
    clearQuotaInfo,
    clearCurrentRequest,
  }
}
