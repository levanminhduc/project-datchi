import { ref } from 'vue'
import { weeklyOrderService } from '@/services/weeklyOrderService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import type { ReservationSummary, ReservedCone } from '@/types/thread'

export function useWeeklyOrderReservations() {
  const reservationSummary = ref<ReservationSummary[]>([])
  const reservedCones = ref<ReservedCone[]>([])

  const snackbar = useSnackbar()
  const loading = useLoading()

  const isLoading = loading.isLoading

  const fetchReservations = async (weekId: number): Promise<void> => {
    try {
      // Task 8.5: Use new reservation-summary endpoint which includes available_stock and can_reserve
      const [summaryData, reservationsData] = await loading.withLoading(async () => {
        return Promise.all([
          weeklyOrderService.getReservationSummary(weekId),
          weeklyOrderService.getReservations(weekId),
        ])
      })

      reservationSummary.value = summaryData
      reservedCones.value = reservationsData.cones || []
    } catch (err) {
      snackbar.error('Không thể tải danh sách đặt trước')
      console.error('[useWeeklyOrderReservations] fetchReservations error:', err)
    }
  }

  return {
    reservationSummary,
    reservedCones,
    isLoading,
    fetchReservations,
  }
}
