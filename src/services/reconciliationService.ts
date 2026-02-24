/**
 * Reconciliation Service
 * Đối chiếu tiêu hao chỉ - Thread Consumption Reconciliation
 *
 * Handles all HTTP operations for reconciliation reports
 * Uses fetchApi for consistent error handling
 */

import { fetchApi } from './api'
import type { ApiResponse } from '@/types'
import type { ReconciliationReport, ReconciliationFilters } from '@/types/thread/reconciliation'

export const reconciliationService = {
  /**
   * Lấy báo cáo đối chiếu tiêu hao
   * @param filters - Optional filter parameters
   * @returns Reconciliation report with summary and rows
   */
  async getReport(filters?: ReconciliationFilters): Promise<ReconciliationReport> {
    const params = new URLSearchParams()
    if (filters?.po_id) params.set('po_id', String(filters.po_id))
    if (filters?.style_id) params.set('style_id', String(filters.style_id))
    if (filters?.color_id) params.set('color_id', String(filters.color_id))
    if (filters?.department) params.set('department', filters.department)
    if (filters?.date_from) params.set('date_from', filters.date_from)
    if (filters?.date_to) params.set('date_to', filters.date_to)

    const queryString = params.toString()
    const url = queryString
      ? `/api/issues/reconciliation?${queryString}`
      : '/api/issues/reconciliation'

    const response = await fetchApi<ApiResponse<ReconciliationReport>>(url)
    if (!response.data) throw new Error(response.error || 'Không thể lấy báo cáo')
    return response.data
  },

  /**
   * Xuất báo cáo đối chiếu ra Excel
   * @param filters - Optional filter parameters
   * @returns Blob containing Excel file
   */
  async exportExcel(filters?: ReconciliationFilters): Promise<Blob> {
    const params = new URLSearchParams()
    if (filters?.po_id) params.set('po_id', String(filters.po_id))
    if (filters?.style_id) params.set('style_id', String(filters.style_id))
    if (filters?.color_id) params.set('color_id', String(filters.color_id))
    if (filters?.department) params.set('department', filters.department)
    if (filters?.date_from) params.set('date_from', filters.date_from)
    if (filters?.date_to) params.set('date_to', filters.date_to)

    const queryString = params.toString()
    const url = queryString
      ? `/api/issues/reconciliation/export?${queryString}`
      : '/api/issues/reconciliation/export'

    // Use raw fetch for blob response (fetchApi expects JSON)
    const API_BASE_URL = import.meta.env.VITE_API_URL || ''
    const response = await fetch(`${API_BASE_URL}${url}`)

    if (!response.ok) {
      throw new Error('Không thể xuất Excel')
    }

    return response.blob()
  },
}
