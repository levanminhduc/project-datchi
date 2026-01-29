/**
 * Thread Recovery Management Composable
 *
 * Provides reactive state and operations for cone recovery management.
 * Handles fetching, initiating returns, weighing, confirming, and writing off.
 */

import { ref, computed } from 'vue'
import { recoveryService } from '@/services/recoveryService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { RecoveryStatus } from '@/types/thread/enums'
import type {
  Recovery,
  RecoveryFilters,
  InitiateReturnDTO,
  WeighConeDTO,
  WriteOffDTO,
} from '@/types/thread'

/**
 * Vietnamese messages for recovery operations
 */
const MESSAGES = {
  INITIATE_SUCCESS: 'Khởi tạo hoàn trả thành công',
  WEIGH_SUCCESS: 'Đã cân và tính toán số mét còn lại',
  CONFIRM_SUCCESS: 'Xác nhận hoàn trả thành công',
  WRITEOFF_SUCCESS: 'Đã loại bỏ cuộn chỉ',
  INITIATE_ERROR: 'Khởi tạo hoàn trả thất bại',
  WEIGH_ERROR: 'Lỗi khi cân cuộn chỉ',
  CONFIRM_ERROR: 'Xác nhận hoàn trả thất bại',
  WRITEOFF_ERROR: 'Loại bỏ cuộn chỉ thất bại',
  FETCH_ERROR: 'Không thể tải danh sách hoàn trả',
}

/**
 * Get error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Đã xảy ra lỗi không xác định'
}

export function useRecovery() {
  // State
  const recoveries = ref<Recovery[]>([])
  const error = ref<string | null>(null)
  const selectedRecovery = ref<Recovery | null>(null)
  const filters = ref<RecoveryFilters>({})

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasRecoveries = computed(() => recoveries.value.length > 0)
  const pendingWeighCount = computed(
    () =>
      recoveries.value.filter(
        (r) => r.status === RecoveryStatus.PENDING_WEIGH
      ).length
  )
  const recoveryCount = computed(() => recoveries.value.length)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all recovery records from API
   * @param newFilters - Optional filters to apply
   */
  const fetchRecoveries = async (newFilters?: RecoveryFilters): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const data = await loading.withLoading(async () => {
        return await recoveryService.getAll(filters.value)
      })

      recoveries.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(MESSAGES.FETCH_ERROR)
      console.error('[useRecovery] fetchRecoveries error:', err)
    }
  }

  /**
   * Fetch a single recovery by ID
   * @param id - Recovery ID
   */
  const fetchRecoveryById = async (id: number): Promise<Recovery | null> => {
    try {
      const data = await loading.withLoading(async () => {
        return await recoveryService.getById(id)
      })
      selectedRecovery.value = data
      return data
    } catch (err) {
      snackbar.error(getErrorMessage(err))
      return null
    }
  }

  /**
   * Initiate a return from barcode scan
   * @param data - InitiateReturnDTO with cone_id (barcode), returned_by, notes
   */
  const initiateReturn = async (data: InitiateReturnDTO): Promise<Recovery | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await recoveryService.initiate(data)
      })

      snackbar.success(MESSAGES.INITIATE_SUCCESS)
      await fetchRecoveries()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(`${MESSAGES.INITIATE_ERROR}: ${errorMessage}`)
      return null
    }
  }

  /**
   * Record weight for a cone and calculate remaining meters
   * @param id - Recovery ID
   * @param data - WeighConeDTO with weight_grams
   */
  const weighCone = async (id: number, data: WeighConeDTO): Promise<Recovery | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await recoveryService.weigh(id, data)
      })

      snackbar.success(MESSAGES.WEIGH_SUCCESS)
      await fetchRecoveries()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(`${MESSAGES.WEIGH_ERROR}: ${errorMessage}`)
      return null
    }
  }

  /**
   * Confirm recovery and return cone to inventory
   * @param id - Recovery ID
   * @param confirmedBy - Optional confirmer name
   */
  const confirmRecovery = async (id: number, confirmedBy?: string): Promise<boolean> => {
    try {
      await loading.withLoading(async () => {
        await recoveryService.confirm(id, confirmedBy)
      })
      snackbar.success(MESSAGES.CONFIRM_SUCCESS)
      await fetchRecoveries()
      return true
    } catch (err) {
      snackbar.error(`${MESSAGES.CONFIRM_ERROR}: ${getErrorMessage(err)}`)
      return false
    }
  }

  /**
   * Write off a cone (mark as unsuitable for use)
   * @param id - Recovery ID
   * @param data - WriteOffDTO with reason and approved_by
   */
  const writeOffCone = async (id: number, data: WriteOffDTO): Promise<boolean> => {
    try {
      await loading.withLoading(async () => {
        await recoveryService.writeOff(id, data)
      })
      snackbar.success(MESSAGES.WRITEOFF_SUCCESS)
      await fetchRecoveries()
      return true
    } catch (err) {
      snackbar.error(`${MESSAGES.WRITEOFF_ERROR}: ${getErrorMessage(err)}`)
      return false
    }
  }

  /**
   * Fetch pending weigh recoveries (shortcut)
   */
  const fetchPending = async (): Promise<void> => {
    await fetchRecoveries({ status: RecoveryStatus.PENDING_WEIGH })
  }

  return {
    // State
    recoveries,
    error,
    selectedRecovery,
    filters,

    // Computed
    isLoading,
    hasRecoveries,
    pendingWeighCount,
    recoveryCount,

    // Actions
    fetchRecoveries,
    fetchRecoveryById,
    initiateReturn,
    weighCone,
    confirmRecovery,
    writeOffCone,
    fetchPending,
    clearError,
  }
}
