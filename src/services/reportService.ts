/**
 * Report Service
 *
 * API client for generating allocation reports.
 * Handles HTTP operations for report endpoints.
 */

import { fetchApi } from './api'

// Types
export interface ReportFilters {
  from_date?: string // YYYY-MM-DD
  to_date?: string // YYYY-MM-DD
  thread_type_id?: number
  status?: string
}

export interface AllocationReportRow {
  id: number
  order_id: string
  order_reference: string | null
  thread_type_id: number
  thread_type_code: string
  thread_type_name: string
  requested_meters: number
  allocated_meters: number
  fulfillment_rate: number
  status: string
  priority: string
  created_at: string
  soft_at: string | null
  issued_at: string | null
  transition_hours: number | null
}

export interface AllocationReportData {
  total_allocations: number
  total_requested_meters: number
  total_allocated_meters: number
  overall_fulfillment_rate: number
  avg_transition_hours: number | null
  allocations: AllocationReportRow[]
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

/**
 * Build query string from report filters
 * Only includes defined values
 */
function buildReportQueryString(filters?: ReportFilters): string {
  if (!filters) return ''

  const params = new URLSearchParams()

  if (filters.from_date) params.append('from_date', filters.from_date)
  if (filters.to_date) params.append('to_date', filters.to_date)
  if (filters.thread_type_id !== undefined) {
    params.append('thread_type_id', String(filters.thread_type_id))
  }
  if (filters.status) params.append('status', filters.status)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const reportService = {
  /**
   * Lấy báo cáo phân bổ với bộ lọc
   * @param filters - Bộ lọc: from_date, to_date, thread_type_id, status
   * @returns Report data with allocations and summary
   */
  async getAllocationReport(filters?: ReportFilters): Promise<AllocationReportData> {
    const queryString = buildReportQueryString(filters)
    const response = await fetchApi<ApiResponse<AllocationReportData>>(
      `/api/reports/allocations${queryString}`
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không có dữ liệu báo cáo')
    }

    return response.data
  },
}
