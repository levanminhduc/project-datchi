/**
 * useLots Composable
 *
 * State management for lot operations.
 */

import { ref, computed } from 'vue'
import { lotService } from '@/services/lotService'
import { useSnackbar } from './useSnackbar'
import type { Lot, LotFilters, CreateLotRequest, UpdateLotRequest } from '@/types/thread/lot'
import type { Cone } from '@/types/thread/inventory'

export function useLots() {
  const snackbar = useSnackbar()

  const lots = ref<Lot[]>([])
  const currentLot = ref<Lot | null>(null)
  const currentCones = ref<Cone[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const activeLots = computed(() => lots.value.filter(l => l.status === 'ACTIVE'))
  const hasLots = computed(() => lots.value.length > 0)

  /**
   * Tải danh sách lô
   */
  async function fetchLots(filters?: LotFilters) {
    loading.value = true
    error.value = null
    try {
      lots.value = await lotService.getAll(filters)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi tải danh sách lô'
      snackbar.error(error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * Tải chi tiết lô
   */
  async function fetchLot(id: number) {
    loading.value = true
    error.value = null
    try {
      currentLot.value = await lotService.getById(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi tải thông tin lô'
      snackbar.error(error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * Tải danh sách cuộn trong lô
   */
  async function fetchLotCones(lotId: number) {
    loading.value = true
    try {
      currentCones.value = await lotService.getCones(lotId)
    } catch {
      snackbar.error('Lỗi khi tải danh sách cuộn')
    } finally {
      loading.value = false
    }
  }

  /**
   * Tạo lô mới
   */
  async function createLot(data: CreateLotRequest): Promise<Lot | null> {
    loading.value = true
    error.value = null
    try {
      const newLot = await lotService.create(data)
      lots.value.unshift(newLot)
      snackbar.success('Đã tạo lô mới')
      return newLot
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi tạo lô'
      snackbar.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Cập nhật lô
   */
  async function updateLot(id: number, data: UpdateLotRequest): Promise<Lot | null> {
    loading.value = true
    error.value = null
    try {
      const updated = await lotService.update(id, data)
      const index = lots.value.findIndex(l => l.id === id)
      if (index !== -1) lots.value[index] = updated
      if (currentLot.value?.id === id) currentLot.value = updated
      snackbar.success('Đã cập nhật thông tin lô')
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi khi cập nhật lô'
      snackbar.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Đặt trạng thái quarantine
   */
  async function quarantineLot(id: number): Promise<boolean> {
    const result = await updateLot(id, { status: 'QUARANTINE' })
    return result !== null
  }

  /**
   * Giải phóng khỏi quarantine
   */
  async function releaseLot(id: number): Promise<boolean> {
    const result = await updateLot(id, { status: 'ACTIVE' })
    return result !== null
  }

  /**
   * Reset state
   */
  function reset() {
    lots.value = []
    currentLot.value = null
    currentCones.value = []
    error.value = null
  }

  return {
    // State
    lots,
    currentLot,
    currentCones,
    loading,
    error,

    // Computed
    activeLots,
    hasLots,

    // Actions
    fetchLots,
    fetchLot,
    fetchLotCones,
    createLot,
    updateLot,
    quarantineLot,
    releaseLot,
    reset
  }
}
