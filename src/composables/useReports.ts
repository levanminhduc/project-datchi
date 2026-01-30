/**
 * Reports Composable
 *
 * Provides reactive state and methods for allocation reports.
 * Follows useDashboard.ts pattern for structure and error handling.
 */

import { ref, computed } from 'vue'
import {
  reportService,
  type AllocationReportData,
  type AllocationReportRow,
  type ReportFilters,
} from '@/services/reportService'
import { useLoading } from './useLoading'
import { useSnackbar } from './useSnackbar'

/**
 * Vietnamese messages for user feedback
 */
const MESSAGES = {
  FETCH_SUCCESS: 'Đã tạo báo cáo',
  FETCH_ERROR: 'Không thể tạo báo cáo',
  EXPORT_SUCCESS: 'Đã xuất báo cáo thành công',
  EXPORT_ERROR: 'Lỗi xuất file',
  NO_DATA_EXPORT: 'Không có dữ liệu để xuất',
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

export function useReports() {
  // State
  const reportData = ref<AllocationReportData | null>(null)
  const error = ref<string | null>(null)
  const filters = ref<ReportFilters>({
    from_date: undefined,
    to_date: undefined,
    thread_type_id: undefined,
    status: undefined,
  })

  // Composables
  const loading = useLoading()
  const snackbar = useSnackbar()

  // Computed
  const isLoading = computed(() => loading.isLoading.value)
  const hasData = computed(
    () => reportData.value !== null && reportData.value.allocations.length > 0
  )

  const summary = computed(() => {
    if (!reportData.value) return null
    return {
      totalAllocations: reportData.value.total_allocations,
      totalRequested: reportData.value.total_requested_meters,
      totalAllocated: reportData.value.total_allocated_meters,
      fulfillmentRate: reportData.value.overall_fulfillment_rate,
      avgTransitionHours: reportData.value.avg_transition_hours,
    }
  })

  const allocations = computed<AllocationReportRow[]>(() => reportData.value?.allocations || [])

  // Methods
  const clearError = () => {
    error.value = null
  }

  /**
   * Fetch allocation report with filters
   * Uses provided filters or current state
   */
  const fetchAllocationReport = async (reportFilters?: ReportFilters): Promise<void> => {
    clearError()

    // Use provided filters or current state
    const activeFilters = reportFilters || filters.value

    try {
      const data = await loading.withLoading(async () => {
        return await reportService.getAllocationReport(activeFilters)
      })

      reportData.value = data
      snackbar.success(`${MESSAGES.FETCH_SUCCESS} với ${data.total_allocations} phân bổ`)
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[useReports] fetchAllocationReport error:', err)
    }
  }

  /**
   * Export report data to XLSX file
   * Uses dynamic import to reduce bundle size
   */
  const exportToXlsx = async (): Promise<void> => {
    if (!reportData.value || reportData.value.allocations.length === 0) {
      snackbar.warning(MESSAGES.NO_DATA_EXPORT)
      return
    }

    try {
      // Dynamic import to reduce bundle size
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Báo Cáo Phân Bổ')

      // Add header row
      worksheet.columns = [
        { header: 'Mã Đơn Hàng', key: 'order_id', width: 15 },
        { header: 'Mô Tả', key: 'order_reference', width: 25 },
        { header: 'Mã Loại Chỉ', key: 'thread_type_code', width: 12 },
        { header: 'Tên Loại Chỉ', key: 'thread_type_name', width: 20 },
        { header: 'Yêu Cầu (m)', key: 'requested_meters', width: 12 },
        { header: 'Đã Phân Bổ (m)', key: 'allocated_meters', width: 14 },
        { header: 'Tỷ Lệ (%)', key: 'fulfillment_rate', width: 10 },
        { header: 'Trạng Thái', key: 'status', width: 12 },
        { header: 'Ưu Tiên', key: 'priority', width: 10 },
        { header: 'Ngày Tạo', key: 'created_at', width: 18 },
        { header: 'Thời Gian Xử Lý (giờ)', key: 'transition_hours', width: 18 },
      ]

      // Style header row
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' },
      }
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

      // Add data rows
      reportData.value.allocations.forEach((row) => {
        worksheet.addRow({
          order_id: row.order_id,
          order_reference: row.order_reference || '',
          thread_type_code: row.thread_type_code,
          thread_type_name: row.thread_type_name,
          requested_meters: row.requested_meters,
          allocated_meters: row.allocated_meters,
          fulfillment_rate: row.fulfillment_rate,
          status: row.status,
          priority: row.priority,
          created_at: new Date(row.created_at).toLocaleString('vi-VN'),
          transition_hours: row.transition_hours ?? 'N/A',
        })
      })

      // Add summary row at the end
      const summaryRow = worksheet.addRow({
        order_id: 'TỔNG CỘNG',
        requested_meters: reportData.value.total_requested_meters,
        allocated_meters: reportData.value.total_allocated_meters,
        fulfillment_rate: reportData.value.overall_fulfillment_rate,
        transition_hours: reportData.value.avg_transition_hours ?? 'N/A',
      })
      summaryRow.font = { bold: true }

      // Generate blob and download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const today = new Date().toISOString().split('T')[0]
      link.href = url
      link.download = `bao-cao-phan-bo-${today}.xlsx`
      link.click()
      URL.revokeObjectURL(url)

      snackbar.success(MESSAGES.EXPORT_SUCCESS)
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      snackbar.error(`${MESSAGES.EXPORT_ERROR}: ${errorMessage}`)
      console.error('[useReports] exportToXlsx error:', err)
    }
  }

  /**
   * Update filters with partial new values
   */
  const setFilters = (newFilters: Partial<ReportFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  /**
   * Clear all filters and report data
   */
  const clearFilters = () => {
    filters.value = {
      from_date: undefined,
      to_date: undefined,
      thread_type_id: undefined,
      status: undefined,
    }
    reportData.value = null
  }

  return {
    // State
    reportData,
    filters,
    error,

    // Computed
    isLoading,
    hasData,
    summary,
    allocations,

    // Methods
    fetchAllocationReport,
    exportToXlsx,
    setFilters,
    clearFilters,
    clearError,
  }
}
