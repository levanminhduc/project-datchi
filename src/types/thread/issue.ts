/**
 * Thread Issue Management Types
 * Xuất kho sản xuất - Issue to Production
 *
 * Types for managing thread issuance to production lines.
 * Field names match database columns.
 */

/**
 * Issue request status matching database ENUM
 * Do not modify values without corresponding database migration.
 */
export enum IssueRequestStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Issue Request entity matching database schema
 * Represents a thread issuance request (phiếu xuất kho)
 */
export interface IssueRequest {
  id: number
  issue_code: string
  po_id: number
  style_id: number
  color_id: number
  thread_type_id: number
  department: string
  quota_meters: number
  requested_meters: number
  issued_meters: number
  status: IssueRequestStatus
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined data (optional)
  po_number?: string
  style_code?: string
  style_name?: string
  color_name?: string
  color_hex?: string
  thread_type_name?: string
}

/**
 * Issue Item entity
 * Represents a cone issued to production (cuộn chỉ xuất)
 */
export interface IssueItem {
  id: number
  issue_request_id: number
  cone_id: number
  allocation_id: number | null
  quantity_meters: number
  batch_number: number
  over_limit_notes: string | null
  issued_by: string | null
  issued_at: string
  // Joined data
  cone_code?: string
  thread_type_name?: string
}

/**
 * Issue Return entity
 * Represents a partial cone return (nhập lại cuộn lẻ)
 */
export interface IssueReturn {
  id: number
  issue_item_id: number
  cone_id: number
  original_meters: number
  remaining_percentage: number
  calculated_remaining_meters: number
  notes: string | null
  returned_by: string | null
  returned_at: string
  // Joined data
  cone_code?: string
}

/**
 * DTO for creating new issue request
 */
export interface CreateIssueRequestDTO {
  po_id: number
  style_id: number
  color_id: number
  thread_type_id: number
  department: string
  requested_meters: number
  notes?: string
}

/**
 * DTO for adding issue item to a request
 */
export interface AddIssueItemDTO {
  cone_id: number
  allocation_id?: number
  over_limit_notes?: string
}

/**
 * DTO for creating issue return
 */
export interface CreateIssueReturnDTO {
  issue_item_id: number
  cone_id: number
  remaining_percentage: number // 10, 20, 30, ... 100
  notes?: string
}

/**
 * Quota check response from API
 */
export interface QuotaCheck {
  quota_meters: number
  issued_meters: number
  remaining_meters: number
  is_over_quota: boolean
}

/**
 * Filters for issue request search/filter functionality
 */
export interface IssueRequestFilters {
  po_id?: number
  style_id?: number
  color_id?: number
  department?: string
  status?: IssueRequestStatus
  date_from?: string
  date_to?: string
}
