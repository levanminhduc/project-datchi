/**
 * Thread Consumption Reconciliation Composable
 * Đối chiếu tiêu hao chỉ - Reconciliation Report
 *
 * Provides reactive state and operations for thread consumption reconciliation.
 * Handles fetching reports, filtering, and Excel export.
 */

import { ref, computed } from 'vue'
import { reconciliationService } from '@/services/reconciliationService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  ReconciliationReport,
  ReconciliationFilters,
  ReconciliationRow,
  ReconciliationSummary,
} from '@/types/thread/reconciliation'

export function useReconciliation() {
  // State
  const report = ref<ReconciliationReport | null>(null)
  const filters = ref<ReconciliationFilters>({})
  const error = ref<string | null>(null)

  // Composables
  const snackbar = useSnackbar()
  const loading = useLoading()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const rows = computed<ReconciliationRow[]>(() => report.value?.rows ?? [])
  const summary = computed<ReconciliationSummary | null>(() => report.value?.summary ?? null)
  const hasData = computed(() => rows.value.length > 0)
  const rowCount = computed(() => rows.value.length)
  const generatedAt = computed(() => report.value?.generated_at ?? null)

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch reconciliation report from API
   * @param newFilters - Optional filters to apply
   */
  const fetchReport = async (newFilters?: ReconciliationFilters): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      report.value = await loading.withLoading(async () => {
        return await reconciliationService.getReport(filters.value)
      })
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể tải báo cáo đối chiếu')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useReconciliation] fetchReport error:', err)
    }
  }

  /**
   * Export reconciliation report to Excel
   */
  const exportExcel = async (): Promise<void> => {
    clearError()

    try {
      const blob = await loading.withLoading(async () => {
        return await reconciliationService.exportExcel(filters.value)
      })

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `doi-chieu-tieu-hao-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      snackbar.success('Đã xuất Excel thành công')
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể xuất Excel')
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useReconciliation] exportExcel error:', err)
    }
  }

  /**
   * Update filters and optionally refetch
   * @param newFilters - New filter values
   * @param refetch - Whether to refetch report after updating filters (default: true)
   */
  const updateFilters = async (
    newFilters: Partial<ReconciliationFilters>,
    refetch = true
  ): Promise<void> => {
    filters.value = { ...filters.value, ...newFilters }
    if (refetch) {
      await fetchReport()
    }
  }

  /**
   * Clear all filters and optionally refetch
   * @param refetch - Whether to refetch report after clearing filters (default: true)
   */
  const clearFilters = async (refetch = true): Promise<void> => {
    filters.value = {}
    if (refetch) {
      await fetchReport()
    }
  }

  /**
   * Clear report data
   */
  const clearReport = () => {
    report.value = null
  }

  /**
   * Get rows filtered by consumption status
   * @param type - 'over' for over-quota, 'under' for under-quota, 'normal' for within tolerance
   * @param tolerancePercent - Tolerance percentage (default: 5%)
   * @returns Filtered rows
   */
  const getRowsByConsumption = (
    type: 'over' | 'under' | 'normal',
    tolerancePercent = 5
  ): ReconciliationRow[] => {
    return rows.value.filter((row) => {
      // Calculate variance: quota - consumed (positive = under, negative = over)
      const varianceMeters = row.quota_meters - row.consumed_meters
      const variancePercent = row.quota_meters > 0
        ? (varianceMeters / row.quota_meters) * 100
        : 0

      switch (type) {
        case 'over':
          return variancePercent < -tolerancePercent // Negative variance = over quota
        case 'under':
          return variancePercent > tolerancePercent // Positive variance = under quota
        case 'normal':
          return Math.abs(variancePercent) <= tolerancePercent
        default:
          return true
      }
    })
  }

  /**
   * Get count of rows that are over quota
   */
  const overQuotaCount = computed(() => getRowsByConsumption('over').length)

  return {
    // State
    report,
    filters,
    error,
    // Computed
    isLoading,
    rows,
    summary,
    hasData,
    rowCount,
    generatedAt,
    overQuotaCount,
    // Actions
    fetchReport,
    exportExcel,
    updateFilters,
    clearFilters,
    clearReport,
    getRowsByConsumption,
    clearError,
  }
}
