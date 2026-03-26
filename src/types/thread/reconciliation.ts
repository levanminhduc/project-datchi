/**
 * Reconciliation Types
 * Đối chiếu tiêu hao chỉ - Thread Consumption Reconciliation
 *
 * Types for comparing quota vs actual consumption.
 * Field names match database columns and view definitions.
 */

/**
 * Single row in reconciliation report
 * Represents consumption data for a specific PO/Style/Color/ThreadType combination
 */
export interface ReconciliationRow {
  po_id: number
  po_number: string
  style_id: number
  style_code: string
  color_id: number
  color_name: string
  thread_type_id: number
  thread_name: string // API returns thread_name from view
  quota_meters: number
  total_issued_meters: number
  total_returned_meters: number
  consumed_meters: number
  consumption_percentage: number
  over_limit_count: number
}

/**
 * Summary statistics for reconciliation report
 */
export interface ReconciliationSummary {
  total_quota: number
  total_issued: number
  total_returned: number
  total_consumed: number
  overall_consumption_percentage: number
  total_over_limit_count: number
}

/**
 * Filters for reconciliation report
 */
export interface ReconciliationFilters {
  po_id?: number
  style_id?: number
  color_id?: number
  department?: string
  date_from?: string
  date_to?: string
}

/**
 * Complete reconciliation report response
 */
export interface ReconciliationReport {
  filters: ReconciliationFilters
  summary: ReconciliationSummary
  rows: ReconciliationRow[]
  generated_at: string
}
