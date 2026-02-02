/**
 * Thread Requests Composable
 *
 * Provides reactive state and workflow operations for thread request management.
 * Follows patterns from useEmployees.ts
 */

import { ref, computed } from 'vue'
import { allocationService } from '@/services/allocationService'
import { useSnackbar } from './useSnackbar'
import { useLoading } from './useLoading'
import type { Allocation, AllocationFilters, CreateAllocationDTO } from '@/types/thread'
import { AllocationStatus } from '@/types/thread/enums'

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  // Success messages
  CREATE_SUCCESS: 'Tạo yêu cầu chỉ thành công',
  APPROVE_SUCCESS: 'Đã duyệt yêu cầu',
  REJECT_SUCCESS: 'Đã từ chối yêu cầu',
  READY_SUCCESS: 'Đã chuẩn bị xong, sẵn sàng nhận',
  RECEIVE_SUCCESS: 'Đã xác nhận nhận chỉ',
  CANCEL_SUCCESS: 'Đã hủy yêu cầu',
  FETCH_SUCCESS: 'Tải danh sách yêu cầu thành công',

  // Error messages
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra mạng',
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau',
  FETCH_ERROR: 'Không thể tải danh sách yêu cầu',
  CREATE_ERROR: 'Tạo yêu cầu thất bại',
  APPROVE_ERROR: 'Không thể duyệt yêu cầu',
  REJECT_ERROR: 'Không thể từ chối yêu cầu',
  READY_ERROR: 'Không thể đánh dấu sẵn sàng',
  RECEIVE_ERROR: 'Không thể xác nhận nhận hàng',
  NOT_FOUND: 'Không tìm thấy yêu cầu',
}

/**
 * Parse error and return appropriate Vietnamese message
 */
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    // Return the error message if it's already in Vietnamese
    if (/[\u00C0-\u1EF9]/.test(error.message)) {
      return error.message
    }

    const message = error.message.toLowerCase()
    if (message.includes('network') || message.includes('fetch')) {
      return MESSAGES.NETWORK_ERROR
    }
    if (message.includes('not found') || message.includes('không tìm thấy')) {
      return MESSAGES.NOT_FOUND
    }
  }

  return fallback
}

export function useThreadRequests() {
  // State
  const requests = ref<Allocation[]>([])
  const error = ref<string | null>(null)
  const selectedRequest = ref<Allocation | null>(null)
  const filters = ref<AllocationFilters>({})

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasRequests = computed(() => requests.value.length > 0)
  const requestCount = computed(() => requests.value.length)

  // Filter by status
  const pendingRequests = computed(() =>
    requests.value.filter((r) => r.status === AllocationStatus.PENDING)
  )
  const approvedRequests = computed(() =>
    requests.value.filter((r) => r.status === AllocationStatus.APPROVED)
  )
  const readyForPickupRequests = computed(() =>
    requests.value.filter((r) => r.status === AllocationStatus.READY_FOR_PICKUP)
  )
  const receivedRequests = computed(() =>
    requests.value.filter((r) => r.status === AllocationStatus.RECEIVED)
  )
  const rejectedRequests = computed(() =>
    requests.value.filter((r) => r.status === AllocationStatus.REJECTED)
  )

  // Counts
  const pendingCount = computed(() => pendingRequests.value.length)
  const readyForPickupCount = computed(() => readyForPickupRequests.value.length)

  // ============ FETCH ============

  /**
   * Fetch all thread requests with optional filters
   */
  async function fetchRequests(newFilters?: AllocationFilters): Promise<void> {
    if (newFilters) {
      filters.value = { ...newFilters }
    }

    try {
      error.value = null
      const data = await loading.withLoading(() => allocationService.getRequests(filters.value))
      requests.value = data
    } catch (err) {
      error.value = getErrorMessage(err, MESSAGES.FETCH_ERROR)
      snackbar.error(error.value)
      requests.value = []
    }
  }

  /**
   * Fetch single request by ID
   */
  async function fetchById(id: number): Promise<Allocation | null> {
    try {
      error.value = null
      const data = await loading.withLoading(() => allocationService.getById(id))
      selectedRequest.value = data
      return data
    } catch (err) {
      error.value = getErrorMessage(err, MESSAGES.NOT_FOUND)
      snackbar.error(error.value)
      return null
    }
  }

  // ============ CREATE ============

  /**
   * Create new thread request
   */
  async function createRequest(data: CreateAllocationDTO): Promise<Allocation | null> {
    try {
      error.value = null
      const created = await loading.withLoading(() => allocationService.create(data))

      // Add to local list
      requests.value = [created, ...requests.value]

      snackbar.success(MESSAGES.CREATE_SUCCESS)
      return created
    } catch (err) {
      error.value = getErrorMessage(err, MESSAGES.CREATE_ERROR)
      snackbar.error(error.value)
      return null
    }
  }

  // ============ WORKFLOW ACTIONS ============

  /**
   * Approve pending request
   */
  async function approve(id: number, approvedBy: string): Promise<Allocation | null> {
    try {
      error.value = null
      const updated = await loading.withLoading(() => allocationService.approve(id, approvedBy))

      // Update local list
      updateLocalRequest(updated)

      snackbar.success(MESSAGES.APPROVE_SUCCESS)
      return updated
    } catch (err) {
      error.value = getErrorMessage(err, MESSAGES.APPROVE_ERROR)
      snackbar.error(error.value)
      return null
    }
  }

  /**
   * Reject pending request
   */
  async function reject(
    id: number,
    rejectedBy: string,
    reason: string
  ): Promise<Allocation | null> {
    try {
      error.value = null
      const updated = await loading.withLoading(() =>
        allocationService.reject(id, rejectedBy, reason)
      )

      // Update local list
      updateLocalRequest(updated)

      snackbar.success(MESSAGES.REJECT_SUCCESS)
      return updated
    } catch (err) {
      error.value = getErrorMessage(err, MESSAGES.REJECT_ERROR)
      snackbar.error(error.value)
      return null
    }
  }

  /**
   * Mark as ready for pickup (also allocates cones)
   */
  async function markReady(id: number): Promise<Allocation | null> {
    try {
      error.value = null
      const updated = await loading.withLoading(() => allocationService.markReady(id))

      // Update local list
      updateLocalRequest(updated)

      snackbar.success(MESSAGES.READY_SUCCESS)
      return updated
    } catch (err) {
      error.value = getErrorMessage(err, MESSAGES.READY_ERROR)
      snackbar.error(error.value)
      return null
    }
  }

  /**
   * Confirm receipt at workshop
   */
  async function confirmReceived(id: number, receivedBy: string): Promise<Allocation | null> {
    try {
      error.value = null
      const updated = await loading.withLoading(() =>
        allocationService.confirmReceived(id, receivedBy)
      )

      // Update local list
      updateLocalRequest(updated)

      snackbar.success(MESSAGES.RECEIVE_SUCCESS)
      return updated
    } catch (err) {
      error.value = getErrorMessage(err, MESSAGES.RECEIVE_ERROR)
      snackbar.error(error.value)
      return null
    }
  }

  /**
   * Cancel request
   */
  async function cancelRequest(id: number): Promise<Allocation | null> {
    try {
      error.value = null
      const updated = await loading.withLoading(() => allocationService.cancel(id))

      // Update local list
      updateLocalRequest(updated)

      snackbar.success(MESSAGES.CANCEL_SUCCESS)
      return updated
    } catch (err) {
      error.value = getErrorMessage(err, 'Không thể hủy yêu cầu')
      snackbar.error(error.value)
      return null
    }
  }

  // ============ HELPERS ============

  /**
   * Update a request in the local list
   */
  function updateLocalRequest(updated: Allocation): void {
    const index = requests.value.findIndex((r) => r.id === updated.id)
    if (index !== -1) {
      requests.value[index] = updated
    }
    if (selectedRequest.value?.id === updated.id) {
      selectedRequest.value = updated
    }
  }

  /**
   * Clear all state
   */
  function reset(): void {
    requests.value = []
    error.value = null
    selectedRequest.value = null
    filters.value = {}
  }

  return {
    // State
    requests,
    error,
    selectedRequest,
    filters,

    // Computed
    isLoading,
    hasRequests,
    requestCount,
    pendingRequests,
    approvedRequests,
    readyForPickupRequests,
    receivedRequests,
    rejectedRequests,
    pendingCount,
    readyForPickupCount,

    // Actions
    fetchRequests,
    fetchById,
    createRequest,
    approve,
    reject,
    markReady,
    confirmReceived,
    cancelRequest,
    reset,
  }
}
