/**
 * Dashboard Composable
 *
 * Provides reactive state and operations for dashboard management.
 * Aggregates metrics, alerts, conflicts, pending items, and activity.
 */

import { ref, computed } from 'vue'
import {
  dashboardService,
  type DashboardSummary,
  type StockAlert,
  type PendingItems,
  type ActivityItem,
  type ConflictsSummary,
} from '@/services/dashboardService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  FETCH_ERROR: 'Không thể tải dữ liệu dashboard',
  REFRESH_SUCCESS: 'Đã cập nhật dữ liệu',
  NETWORK_ERROR: 'Lỗi kết nối. Vui lòng kiểm tra mạng',
  SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau',
  TIMEOUT_ERROR: 'Yêu cầu quá thời gian. Vui lòng thử lại',
}

/**
 * Parse error and return appropriate Vietnamese message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Check for specific error types
    if (message.includes('network') || message.includes('fetch')) {
      return MESSAGES.NETWORK_ERROR
    }
    if (message.includes('timeout')) {
      return MESSAGES.TIMEOUT_ERROR
    }

    // Return the error message if it's already in Vietnamese
    if (/[\u00C0-\u1EF9]/.test(error.message)) {
      return error.message
    }
  }

  return MESSAGES.SERVER_ERROR
}

export function useDashboard() {
  // State
  const summary = ref<DashboardSummary | null>(null)
  const alerts = ref<StockAlert[]>([])
  const conflicts = ref<ConflictsSummary>({
    total_conflicts: 0,
    pending_count: 0,
    conflicts: [],
  })
  const pending = ref<PendingItems | null>(null)
  const activity = ref<ActivityItem[]>([])
  const error = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)

  const hasCriticalAlerts = computed(() =>
    alerts.value.some((alert) => alert.severity === 'critical')
  )

  const criticalAlertCount = computed(
    () => alerts.value.filter((alert) => alert.severity === 'critical').length
  )

  const hasConflicts = computed(() => conflicts.value.total_conflicts > 0)

  const totalPendingActions = computed(() => {
    if (!pending.value) return 0
    return (
      pending.value.pending_allocations +
      pending.value.pending_recovery +
      pending.value.waitlisted_allocations +
      pending.value.overdue_allocations
    )
  })

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch dashboard summary statistics
   */
  const fetchSummary = async (): Promise<void> => {
    try {
      const data = await dashboardService.getSummary()
      summary.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      console.error('[useDashboard] fetchSummary error:', err)
      throw err
    }
  }

  /**
   * Fetch stock alerts
   */
  const fetchAlerts = async (): Promise<void> => {
    try {
      const data = await dashboardService.getAlerts()
      alerts.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      console.error('[useDashboard] fetchAlerts error:', err)
      throw err
    }
  }

  /**
   * Fetch conflicts information
   */
  const fetchConflicts = async (): Promise<void> => {
    try {
      const data = await dashboardService.getConflicts()
      conflicts.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      console.error('[useDashboard] fetchConflicts error:', err)
      throw err
    }
  }

  /**
   * Fetch pending items counts
   */
  const fetchPending = async (): Promise<void> => {
    try {
      const data = await dashboardService.getPending()
      pending.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      console.error('[useDashboard] fetchPending error:', err)
      throw err
    }
  }

  /**
   * Fetch activity feed
   */
  const fetchActivity = async (): Promise<void> => {
    try {
      const data = await dashboardService.getActivity()
      activity.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      console.error('[useDashboard] fetchActivity error:', err)
      throw err
    }
  }

  /**
   * Fetch all dashboard data at once
   * Uses Promise.allSettled to handle partial failures gracefully
   */
  const fetchAll = async (): Promise<void> => {
    clearError()

    try {
      await loading.withLoading(async () => {
        const results = await Promise.allSettled([
          fetchSummary(),
          fetchAlerts(),
          fetchConflicts(),
          fetchPending(),
          fetchActivity(),
        ])

        // Check if any requests failed
        const failures = results.filter((result) => result.status === 'rejected')

        if (failures.length === results.length) {
          // All requests failed
          throw new Error(MESSAGES.FETCH_ERROR)
        } else if (failures.length > 0) {
          // Some requests failed - log but don't throw
          console.warn('[useDashboard] Some dashboard data failed to load:', failures)
        }
      })
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useDashboard] fetchAll error:', err)
    }
  }

  /**
   * Refresh all dashboard data (alias for fetchAll with success notification)
   */
  const refreshDashboard = async (): Promise<void> => {
    clearError()

    try {
      await loading.withLoading(async () => {
        const results = await Promise.allSettled([
          fetchSummary(),
          fetchAlerts(),
          fetchConflicts(),
          fetchPending(),
          fetchActivity(),
        ])

        // Check if any requests failed
        const failures = results.filter((result) => result.status === 'rejected')

        if (failures.length === results.length) {
          // All requests failed
          throw new Error(MESSAGES.FETCH_ERROR)
        } else if (failures.length > 0) {
          // Some requests failed - partial success
          console.warn('[useDashboard] Some dashboard data failed to refresh:', failures)
          snackbar.warning('Một số dữ liệu không thể cập nhật')
        } else {
          // All successful
          snackbar.success(MESSAGES.REFRESH_SUCCESS)
        }
      })
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useDashboard] refreshDashboard error:', err)
    }
  }

  /**
   * Reset all state to initial values
   */
  const reset = (): void => {
    summary.value = null
    alerts.value = []
    conflicts.value = { total_conflicts: 0, pending_count: 0, conflicts: [] }
    pending.value = null
    activity.value = []
    error.value = null
    loading.reset()
  }

  return {
    // State
    summary,
    alerts,
    conflicts,
    pending,
    activity,
    error,

    // Computed
    isLoading,
    hasCriticalAlerts,
    criticalAlertCount,
    hasConflicts,
    totalPendingActions,

    // Methods
    fetchSummary,
    fetchAlerts,
    fetchConflicts,
    fetchPending,
    fetchActivity,
    fetchAll,
    refreshDashboard,
    clearError,
    reset,
  }
}
