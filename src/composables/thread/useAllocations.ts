/**
 * Thread Allocations Management Composable
 *
 * Provides reactive state and operations for thread allocation management.
 * Handles fetching, creating, executing, issuing, and cancelling allocations.
 */

import { ref, computed } from 'vue'
import { allocationService } from '@/services/allocationService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import type {
  Allocation,
  AllocationFilters,
  CreateAllocationDTO,
  AllocationConflict,
} from '@/types/thread'
/**
 * Get error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Đã xảy ra lỗi không xác định'
}

export function useAllocations() {
  // State
  const allocations = ref<Allocation[]>([])
  const conflicts = ref<AllocationConflict[]>([])
  const error = ref<string | null>(null)
  const filters = ref<AllocationFilters>({})
  const selectedAllocation = ref<Allocation | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const allocationCount = computed(() => allocations.value.length)
  const conflictCount = computed(() => conflicts.value.length)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all allocations from API
   * @param newFilters - Optional filters to apply
   */
  const fetchAllocations = async (newFilters?: AllocationFilters): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await allocationService.getAll(filters.value)
      })

      allocations.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useAllocations] fetchAllocations error:', err)
    }
  }

  /**
   * Fetch all active conflicts from API
   */
  const fetchConflicts = async (): Promise<void> => {
    try {
      const data = await loading.withLoading(async () => {
        return await allocationService.getConflicts()
      })
      conflicts.value = data
    } catch (err) {
      console.error('[useAllocations] fetchConflicts error:', err)
    }
  }

  /**
   * Create a new allocation request
   * @param data - Allocation creation data
   */
  const createAllocation = async (data: CreateAllocationDTO): Promise<Allocation | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await allocationService.create(data)
      })
      
      snackbar.success('Tạo yêu cầu phân bổ thành công')
      await fetchAllocations()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      return null
    }
  }

  /**
   * Execute soft allocation
   * @param id - Allocation ID
   */
  const executeAllocation = async (id: number): Promise<boolean> => {
    try {
      await loading.withLoading(async () => {
        await allocationService.execute(id)
      })
      snackbar.success('Đã thực hiện phân bổ mềm')
      await fetchAllocations()
      return true
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return false
    }
  }

  /**
   * Issue allocation to production
   * @param id - Allocation ID
   */
  const issueAllocation = async (id: number): Promise<boolean> => {
    try {
      await loading.withLoading(async () => {
        await allocationService.issue(id)
      })
      snackbar.success('Đã xuất chỉ cho sản xuất')
      await fetchAllocations()
      return true
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return false
    }
  }

  /**
   * Cancel an allocation
   * @param id - Allocation ID
   */
  const cancelAllocation = async (id: number): Promise<boolean> => {
    try {
      await loading.withLoading(async () => {
        await allocationService.cancel(id)
      })
      snackbar.success('Đã hủy phân bổ')
      await fetchAllocations()
      return true
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return false
    }
  }

  /**
   * Get allocation by ID with details
   * @param id - Allocation ID
   */
  const fetchAllocationById = async (id: number): Promise<Allocation | null> => {
    try {
      const data = await loading.withLoading(async () => {
        return await allocationService.getById(id)
      })
      selectedAllocation.value = data
      return data
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return null
    }
  }

  return {
    // State
    allocations,
    conflicts,
    error,
    filters,
    selectedAllocation,
    isLoading,
    allocationCount,
    conflictCount,

    // Actions
    fetchAllocations,
    fetchConflicts,
    createAllocation,
    executeAllocation,
    issueAllocation,
    cancelAllocation,
    fetchAllocationById,
  }
}
