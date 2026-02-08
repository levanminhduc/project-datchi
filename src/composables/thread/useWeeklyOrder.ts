/**
 * Weekly Order Composable
 *
 * Provides reactive state and CRUD operations for weekly thread orders.
 */

import { ref, computed } from 'vue'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { useSnackbar } from '../useSnackbar'
import { useConfirm } from '../useConfirm'
import { useLoading } from '../useLoading'
import { createErrorHandler } from '@/utils/errorMessages'
import type {
  ThreadOrderWeek,
  CreateWeeklyOrderDTO,
  UpdateWeeklyOrderDTO,
  WeeklyOrderResults,
  CalculationResult,
  AggregatedRow,
} from '@/types/thread'

const MESSAGES = {
  CREATE_SUCCESS: 'Tạo tuần đặt hàng thành công',
  UPDATE_SUCCESS: 'Cập nhật tuần đặt hàng thành công',
  DELETE_SUCCESS: 'Xóa tuần đặt hàng thành công',
  SAVE_RESULTS_SUCCESS: 'Lưu kết quả tính toán thành công',
}

const getErrorMessage = createErrorHandler({
  duplicate: 'Tên tuần đã tồn tại',
  notFound: 'Không tìm thấy tuần đặt hàng',
  validation: 'Dữ liệu không hợp lệ',
})

export function useWeeklyOrder() {
  // State
  const weeks = ref<ThreadOrderWeek[]>([])
  const selectedWeek = ref<ThreadOrderWeek | null>(null)
  const error = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const confirm = useConfirm()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)

  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch all weeks from API
   */
  const fetchWeeks = async (): Promise<void> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await weeklyOrderService.getAll()
      })

      weeks.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useWeeklyOrder] fetchWeeks error:', err)
    }
  }

  /**
   * Create a new weekly order
   */
  const createWeek = async (dto: CreateWeeklyOrderDTO): Promise<ThreadOrderWeek | null> => {
    clearError()

    try {
      const result = await loading.withLoading(async () => {
        return await weeklyOrderService.create(dto)
      })

      snackbar.success(MESSAGES.CREATE_SUCCESS)
      await fetchWeeks()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useWeeklyOrder] createWeek error:', err)
      return null
    }
  }

  /**
   * Update an existing weekly order
   */
  const updateWeek = async (
    id: number,
    dto: UpdateWeeklyOrderDTO
  ): Promise<ThreadOrderWeek | null> => {
    clearError()

    try {
      const result = await loading.withLoading(async () => {
        return await weeklyOrderService.update(id, dto)
      })

      // Update local state
      weeks.value = weeks.value.map((w) => (w.id === id ? result : w))

      if (selectedWeek.value?.id === id) {
        selectedWeek.value = result
      }

      snackbar.success(MESSAGES.UPDATE_SUCCESS)
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useWeeklyOrder] updateWeek error:', err)
      return null
    }
  }

  /**
   * Delete a weekly order after confirmation
   */
  const deleteWeek = async (id: number): Promise<boolean> => {
    const week = weeks.value.find((w) => w.id === id)
    const weekName = week?.week_name || `#${id}`

    const confirmed = await confirm.confirmDelete({
      itemName: weekName,
      title: 'Xác nhận xóa tuần đặt hàng',
      message: `Bạn có chắc chắn muốn xóa "${weekName}"? Tất cả dữ liệu items và kết quả tính toán sẽ bị xóa.`,
    })

    if (!confirmed) return false

    clearError()

    try {
      await loading.withLoading(async () => {
        await weeklyOrderService.remove(id)
      })

      weeks.value = weeks.value.filter((w) => w.id !== id)

      if (selectedWeek.value?.id === id) {
        selectedWeek.value = null
      }

      snackbar.success(MESSAGES.DELETE_SUCCESS)
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useWeeklyOrder] deleteWeek error:', err)
      return false
    }
  }

  /**
   * Load a single week with its items
   */
  const loadWeek = async (id: number): Promise<ThreadOrderWeek | null> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await weeklyOrderService.getById(id)
      })

      selectedWeek.value = data
      return data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useWeeklyOrder] loadWeek error:', err)
      return null
    }
  }

  /**
   * Save calculation results for a weekly order
   */
  const saveResults = async (
    weekId: number,
    calculationData: CalculationResult[],
    summaryData: AggregatedRow[]
  ): Promise<WeeklyOrderResults | null> => {
    clearError()

    try {
      const result = await loading.withLoading(async () => {
        return await weeklyOrderService.saveResults(weekId, {
          calculation_data: calculationData,
          summary_data: summaryData,
        })
      })

      snackbar.success(MESSAGES.SAVE_RESULTS_SUCCESS)
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useWeeklyOrder] saveResults error:', err)
      return null
    }
  }

  /**
   * Load saved calculation results for a weekly order
   */
  const loadResults = async (weekId: number): Promise<WeeklyOrderResults | null> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await weeklyOrderService.getResults(weekId)
      })

      return data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useWeeklyOrder] loadResults error:', err)
      return null
    }
  }

  return {
    // State
    weeks,
    selectedWeek,
    loading: isLoading,
    error,

    // Actions
    clearError,
    fetchWeeks,
    createWeek,
    updateWeek,
    deleteWeek,
    loadWeek,
    saveResults,
    loadResults,
  }
}
