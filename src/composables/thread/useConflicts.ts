/**
 * Thread Conflict Management Composable
 *
 * Provides reactive state and operations for thread allocation conflict management.
 * Handles fetching, resolving, and monitoring conflicts between competing allocations.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { allocationService } from '@/services/allocationService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { useRealtime } from '../useRealtime'
import type { AllocationConflict, Allocation } from '@/types/thread'
import { AllocationPriority } from '@/types/thread/enums'

/**
 * Extended conflict interface with UI-specific fields
 * Maps to the spec interface ThreadConflict
 */
export interface ThreadConflict extends AllocationConflict {
  thread_type_code?: string
  thread_type_name?: string
}

/**
 * Conflict allocation info for display
 */
export interface ConflictAllocation {
  allocation_id: number
  production_order_id: string
  production_order_code: string
  requested_quantity: number
  allocated_quantity: number
  priority: AllocationPriority
  priority_score: number
  requested_date: string
  status: string
}

/**
 * Resolution types for conflict resolution
 */
export type ConflictResolutionType = 'priority' | 'cancel' | 'split' | 'escalate'

/**
 * DTO for resolving a conflict
 */
export interface ResolveConflictDTO {
  conflictId: number
  resolutionType: ConflictResolutionType
  allocationId?: number
  newPriority?: AllocationPriority
  splitQuantity?: number
  notes?: string
}

/**
 * Conflict filter options
 */
export interface ConflictFilters {
  status?: 'PENDING' | 'RESOLVED' | 'ESCALATED'
  thread_type_id?: number
  from_date?: string
  to_date?: string
}

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  // Success messages
  FETCH_SUCCESS: 'Đã tải danh sách xung đột',
  RESOLVE_SUCCESS: 'Đã giải quyết xung đột thành công',
  PRIORITY_UPDATE_SUCCESS: 'Đã cập nhật mức ưu tiên',
  CANCEL_SUCCESS: 'Đã hủy phân bổ xung đột',
  SPLIT_SUCCESS: 'Đã chia nhỏ phân bổ thành công',
  ESCALATE_SUCCESS: 'Đã leo thang xung đột lên cấp trên',

  // Error messages
  FETCH_ERROR: 'Không thể tải danh sách xung đột',
  RESOLVE_ERROR: 'Không thể giải quyết xung đột',
  PRIORITY_UPDATE_ERROR: 'Không thể cập nhật mức ưu tiên',
  CANCEL_ERROR: 'Không thể hủy phân bổ',
  SPLIT_ERROR: 'Không thể chia nhỏ phân bổ',
  ESCALATE_ERROR: 'Không thể leo thang xung đột',
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra mạng',
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau',

  // Real-time messages
  REALTIME_CONNECTED: 'Đang theo dõi xung đột theo thời gian thực',
  NEW_CONFLICT: 'Có xung đột phân bổ mới',
  CONFLICT_RESOLVED: 'Một xung đột đã được giải quyết',
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
      return MESSAGES.NETWORK_ERROR
    }

    // Return the error message if it's already in Vietnamese
    if (/[\u00C0-\u1EF9]/.test(error.message)) {
      return error.message
    }
  }

  return MESSAGES.SERVER_ERROR
}

/**
 * Thread Conflict Management Composable
 *
 * @example
 * ```ts
 * const {
 *   conflicts,
 *   isLoading,
 *   fetchConflicts,
 *   resolveByPriority,
 *   cancelConflictingAllocation,
 *   enableRealtime,
 * } = useConflicts()
 *
 * onMounted(() => {
 *   fetchConflicts()
 *   enableRealtime()
 * })
 * ```
 */
export function useConflicts() {
  // State
  const conflicts = ref<ThreadConflict[]>([])
  const error = ref<string | null>(null)
  const filters = ref<ConflictFilters>({})
  const selectedConflict = ref<ThreadConflict | null>(null)
  const realtimeEnabled = ref(false)
  const realtimeChannelName = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()
  const realtime = useRealtime()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const conflictCount = computed(() => conflicts.value.length)
  const pendingConflicts = computed(() =>
    conflicts.value.filter((c) => c.status === 'PENDING')
  )
  const resolvedConflicts = computed(() =>
    conflicts.value.filter((c) => c.status === 'RESOLVED')
  )
  const escalatedConflicts = computed(() =>
    conflicts.value.filter((c) => c.status === 'ESCALATED')
  )
  const hasActiveConflicts = computed(() => pendingConflicts.value.length > 0)
  const totalShortage = computed(() =>
    pendingConflicts.value.reduce((sum, c) => sum + c.shortage, 0)
  )

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all conflicts from API
   * @param newFilters - Optional filters to apply
   */
  const fetchConflicts = async (newFilters?: ConflictFilters): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await allocationService.getConflicts()
      })

      // Map to ThreadConflict with additional UI fields
      conflicts.value = data.map((conflict) => ({
        ...conflict,
        thread_type_code: conflict.thread_type?.code,
        thread_type_name: conflict.thread_type?.name,
      }))
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useConflicts] fetchConflicts error:', err)
    }
  }

  /**
   * Get conflict by ID
   * @param id - Conflict ID
   */
  const getConflictById = (id: number): ThreadConflict | undefined => {
    return conflicts.value.find((c) => c.id === id)
  }

  /**
   * Get allocations affected by a conflict
   * @param conflict - The conflict to get allocations for
   */
  const getConflictAllocations = (conflict: ThreadConflict): ConflictAllocation[] => {
    return (conflict.competing_allocations || []).map((allocation: Allocation) => ({
      allocation_id: allocation.id,
      production_order_id: allocation.order_id,
      production_order_code: allocation.order_reference || allocation.order_id,
      requested_quantity: allocation.requested_meters,
      allocated_quantity: allocation.allocated_meters,
      priority: allocation.priority,
      priority_score: allocation.priority_score,
      requested_date: allocation.requested_date,
      status: allocation.status,
    }))
  }

  /**
   * Resolve conflict by adjusting allocation priority
   * @param conflictId - Conflict ID (or allocation ID for priority change)
   * @param allocationId - Allocation ID to update
   * @param newPriority - New priority level
   */
  const resolveByPriority = async (
    conflictId: number,
    allocationId: number,
    newPriority: AllocationPriority
  ): Promise<boolean> => {
    clearError()

    try {
      await loading.withLoading(async () => {
        return await allocationService.resolveConflict(allocationId, newPriority)
      })

      snackbar.success(MESSAGES.PRIORITY_UPDATE_SUCCESS)
      await fetchConflicts()
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(MESSAGES.PRIORITY_UPDATE_ERROR)
      console.error('[useConflicts] resolveByPriority error:', err)
      return false
    }
  }

  /**
   * Cancel a conflicting allocation to resolve the conflict
   * @param allocationId - Allocation ID to cancel
   */
  const cancelConflictingAllocation = async (allocationId: number): Promise<boolean> => {
    clearError()

    try {
      await loading.withLoading(async () => {
        return await allocationService.cancel(allocationId)
      })

      snackbar.success(MESSAGES.CANCEL_SUCCESS)
      await fetchConflicts()
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(MESSAGES.CANCEL_ERROR)
      console.error('[useConflicts] cancelConflictingAllocation error:', err)
      return false
    }
  }

  /**
   * Split an allocation to partially resolve a conflict
   * Note: This requires a backend endpoint - placeholder implementation
   * @param allocationId - Allocation ID to split
   * @param splitQuantity - Quantity to allocate (rest will be pending)
   */
  const splitAllocation = async (
    allocationId: number,
    splitQuantity: number
  ): Promise<boolean> => {
    clearError()

    try {
      // TODO: Implement when backend endpoint is available
      // await loading.withLoading(async () => {
      //   return await allocationService.split(allocationId, splitQuantity)
      // })

      console.warn('[useConflicts] splitAllocation: Backend endpoint not yet implemented')
      snackbar.warning('Chức năng chia nhỏ phân bổ chưa được triển khai')
      return false
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(MESSAGES.SPLIT_ERROR)
      console.error('[useConflicts] splitAllocation error:', err)
      return false
    }
  }

  /**
   * Escalate a conflict for manual resolution
   * Note: This requires a backend endpoint - placeholder implementation
   * @param conflictId - Conflict ID to escalate
   * @param notes - Optional notes for escalation
   */
  const escalateConflict = async (
    conflictId: number,
    notes?: string
  ): Promise<boolean> => {
    clearError()

    try {
      // TODO: Implement when backend endpoint is available
      // await loading.withLoading(async () => {
      //   return await allocationService.escalate(conflictId, notes)
      // })

      console.warn('[useConflicts] escalateConflict: Backend endpoint not yet implemented')
      snackbar.warning('Chức năng leo thang xung đột chưa được triển khai')
      return false
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(MESSAGES.ESCALATE_ERROR)
      console.error('[useConflicts] escalateConflict error:', err)
      return false
    }
  }

  /**
   * Generic resolve method that dispatches to specific resolution handlers
   * @param dto - Resolution DTO with type and parameters
   */
  const resolveConflict = async (dto: ResolveConflictDTO): Promise<boolean> => {
    switch (dto.resolutionType) {
      case 'priority':
        if (dto.allocationId && dto.newPriority) {
          return resolveByPriority(dto.conflictId, dto.allocationId, dto.newPriority)
        }
        snackbar.error('Thiếu thông tin để cập nhật ưu tiên')
        return false

      case 'cancel':
        if (dto.allocationId) {
          return cancelConflictingAllocation(dto.allocationId)
        }
        snackbar.error('Thiếu ID phân bổ để hủy')
        return false

      case 'split':
        if (dto.allocationId && dto.splitQuantity) {
          return splitAllocation(dto.allocationId, dto.splitQuantity)
        }
        snackbar.error('Thiếu thông tin để chia nhỏ phân bổ')
        return false

      case 'escalate':
        return escalateConflict(dto.conflictId, dto.notes)

      default:
        snackbar.error('Loại giải quyết không hợp lệ')
        return false
    }
  }

  /**
   * Enable real-time updates for conflicts
   */
  const enableRealtime = (): void => {
    if (realtimeEnabled.value) return

    realtimeChannelName.value = realtime.subscribe(
      {
        table: 'allocation_conflicts',
        event: '*',
        schema: 'public',
      },
      (payload) => {
        console.log('[useConflicts] Real-time event:', payload.eventType)

        switch (payload.eventType) {
          case 'INSERT':
            snackbar.warning(MESSAGES.NEW_CONFLICT)
            fetchConflicts() // Refresh to get full data with joins
            break
          case 'UPDATE':
            fetchConflicts() // Refresh to get updated data
            break
          case 'DELETE':
            // Remove from local state
            if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
              const deletedId = (payload.old as { id: number }).id
              conflicts.value = conflicts.value.filter((c) => c.id !== deletedId)
            }
            break
        }
      }
    )

    realtimeEnabled.value = true
    snackbar.info(MESSAGES.REALTIME_CONNECTED)
  }

  /**
   * Disable real-time updates
   */
  const disableRealtime = (): void => {
    if (!realtimeEnabled.value || !realtimeChannelName.value) return

    realtime.unsubscribe(realtimeChannelName.value)
    realtimeChannelName.value = null
    realtimeEnabled.value = false
  }

  /**
   * Select a conflict for viewing/editing
   * @param conflict - Conflict to select, or null to deselect
   */
  const selectConflict = (conflict: ThreadConflict | null): void => {
    selectedConflict.value = conflict
  }

  /**
   * Set filters and refetch
   * @param newFilters - New filters to apply
   */
  const setFilters = async (newFilters: ConflictFilters): Promise<void> => {
    filters.value = newFilters
    await fetchConflicts()
  }

  /**
   * Clear all filters and refetch
   */
  const clearFilters = async (): Promise<void> => {
    filters.value = {}
    await fetchConflicts()
  }

  /**
   * Reset all state to initial values
   */
  const reset = (): void => {
    conflicts.value = []
    error.value = null
    selectedConflict.value = null
    filters.value = {}
    disableRealtime()
    loading.reset()
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disableRealtime()
  })

  return {
    // State
    conflicts,
    error,
    filters,
    selectedConflict,
    realtimeEnabled,

    // Computed
    isLoading,
    conflictCount,
    pendingConflicts,
    resolvedConflicts,
    escalatedConflicts,
    hasActiveConflicts,
    totalShortage,

    // Methods
    fetchConflicts,
    getConflictById,
    getConflictAllocations,
    resolveConflict,
    resolveByPriority,
    cancelConflictingAllocation,
    splitAllocation,
    escalateConflict,
    enableRealtime,
    disableRealtime,
    selectConflict,
    setFilters,
    clearFilters,
    clearError,
    reset,
  }
}
