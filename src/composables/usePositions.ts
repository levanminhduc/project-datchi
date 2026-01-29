/**
 * Position Management Composable
 * 
 * Provides reactive state for positions (Chức Vụ)
 * Fetches positions from positions table with internal name and display name
 * Used by employee form dropdowns
 */

import { ref, computed } from 'vue'
import { positionService, type PositionOption } from '@/services/positionService'
import { useSnackbar } from './useSnackbar'
import { useLoading } from './useLoading'

/**
 * Vietnamese error messages for user feedback
 */
const MESSAGES = {
  FETCH_ERROR: 'Không thể tải danh sách chức vụ',
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau',
}

export type { PositionOption }

export function usePositions() {
  // State - stores position options with { value, label }
  const positions = ref<PositionOption[]>([])
  const error = ref<string | null>(null)
  
  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasPositions = computed(() => positions.value.length > 0)

  /**
   * Position options for dropdown select
   * Already in { label, value } format from API
   */
  const positionOptions = computed<PositionOption[]>(() => {
    return positions.value
  })

  /**
   * Position labels mapping (value -> label)
   * Maps internal name (e.g., 'nhan_vien') to display name (e.g., 'Nhân Viên')
   */
  const positionLabels = computed<Record<string, string>>(() => {
    const labels: Record<string, string> = {}
    for (const pos of positions.value) {
      labels[pos.value] = pos.label
    }
    return labels
  })

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch positions from positions table
   */
  const fetchPositions = async (): Promise<void> => {
    clearError()
    
    try {
      const data = await loading.withLoading(async () => {
        return await positionService.getUniquePositions()
      })
      
      positions.value = data
    } catch (err) {
      const errorMessage = err instanceof Error && /[\u00C0-\u1EF9]/.test(err.message)
        ? err.message
        : MESSAGES.FETCH_ERROR
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[usePositions] fetchPositions error:', err)
    }
  }

  /**
   * Get position display label by value
   * Returns display name for internal name (e.g., 'nhan_vien' -> 'Nhân Viên')
   */
  const getPositionLabel = (value: string): string => {
    return positionLabels.value[value] || value
  }

  return {
    // State
    positions,
    error,
    loading: isLoading,
    
    // Computed
    hasPositions,
    positionOptions,
    positionLabels,
    
    // Actions
    fetchPositions,
    clearError,
    getPositionLabel,
  }
}
