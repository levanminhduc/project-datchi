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
import { getErrorMessage } from '@/utils/errorMessages'
import { getCacheEntry, setCacheEntry } from '@/lib/api-cache'

const MESSAGES = {
  REFRESH_SUCCESS: 'Đã cập nhật dữ liệu',
  FETCH_ERROR: 'Không thể tải dữ liệu dashboard',
}

const CACHE_TTL = 10_000

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

  const fetchSummary = async (): Promise<void> => {
    const cacheKey = '/api/dashboard:summary'
    const cached = getCacheEntry<DashboardSummary>(cacheKey)
    if (cached && !cached.isStale) {
      summary.value = cached.data
      return
    }
    try {
      const data = await dashboardService.getSummary()
      summary.value = data
      setCacheEntry(cacheKey, data, CACHE_TTL)
    } catch (err) {
      if (cached) { summary.value = cached.data; return }
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      console.error('[useDashboard] fetchSummary error:', err)
      throw err
    }
  }

  const fetchAlerts = async (): Promise<void> => {
    const cacheKey = '/api/dashboard:alerts'
    const cached = getCacheEntry<StockAlert[]>(cacheKey)
    if (cached && !cached.isStale) {
      alerts.value = cached.data
      return
    }
    try {
      const data = await dashboardService.getAlerts()
      alerts.value = data
      setCacheEntry(cacheKey, data, CACHE_TTL)
    } catch (err) {
      if (cached) { alerts.value = cached.data; return }
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      console.error('[useDashboard] fetchAlerts error:', err)
      throw err
    }
  }

  const fetchConflicts = async (): Promise<void> => {
    const cacheKey = '/api/dashboard:conflicts'
    const cached = getCacheEntry<ConflictsSummary>(cacheKey)
    if (cached && !cached.isStale) {
      conflicts.value = cached.data
      return
    }
    try {
      const data = await dashboardService.getConflicts()
      conflicts.value = data
      setCacheEntry(cacheKey, data, CACHE_TTL)
    } catch (err) {
      if (cached) { conflicts.value = cached.data; return }
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      console.error('[useDashboard] fetchConflicts error:', err)
      throw err
    }
  }

  const fetchPending = async (): Promise<void> => {
    const cacheKey = '/api/dashboard:pending'
    const cached = getCacheEntry<PendingItems>(cacheKey)
    if (cached && !cached.isStale) {
      pending.value = cached.data
      return
    }
    try {
      const data = await dashboardService.getPending()
      pending.value = data
      setCacheEntry(cacheKey, data, CACHE_TTL)
    } catch (err) {
      if (cached) { pending.value = cached.data; return }
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      console.error('[useDashboard] fetchPending error:', err)
      throw err
    }
  }

  const fetchActivity = async (): Promise<void> => {
    const cacheKey = '/api/dashboard:activity'
    const cached = getCacheEntry<ActivityItem[]>(cacheKey)
    if (cached && !cached.isStale) {
      activity.value = cached.data
      return
    }
    try {
      const data = await dashboardService.getActivity()
      activity.value = data
      setCacheEntry(cacheKey, data, CACHE_TTL)
    } catch (err) {
      if (cached) { activity.value = cached.data; return }
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
