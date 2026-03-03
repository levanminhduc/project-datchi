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
      const data = await loading.withLoading(async () => {
        return await weeklyOrderService.getReservations(weekId)
      })

      reservationSummary.value = data.by_thread_type
      reservedCones.value = data.cones
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
