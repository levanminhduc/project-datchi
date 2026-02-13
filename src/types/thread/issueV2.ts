/**
 * Thread Issue V2 Types
 * Types for the simplified issue management system
 *
 * Key changes from V1:
 * - Quantity-based tracking (full cones + partial cones) instead of meters
 * - Multi-line issues (one issue can have multiple thread types)
 * - Quota in cones from thread_order_items
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Issue V2 status matching database ENUM
 */
export enum IssueV2Status {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  RETURNED = 'RETURNED',
}

// ============================================================================
// Entities
// ============================================================================

/**
 * Thread Issue V2 header entity
 * Matches thread_issues table structure
 */
export interface IssueV2 {
  id: number
  issue_code: string
  department: string
  status: IssueV2Status
  created_by: string
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Thread Issue V2 line entity
 * Matches thread_issue_lines table structure
 */
export interface IssueLineV2 {
  id: number
  issue_id: number
  po_id: number | null
  style_id: number | null
  color_id: number | null
  thread_type_id: number
  quota_cones: number | null
  issued_full: number
  issued_partial: number
  returned_full: number
  returned_partial: number
  over_quota_notes: string | null
  created_at: string
}

/**
 * Issue line with computed fields (returned from API)
 */
export interface IssueLineV2WithComputed extends IssueLineV2 {
  // Computed fields from backend
  issued_equivalent: number
  is_over_quota: boolean
  stock_available_full: number
  stock_available_partial: number
  // Joined data
  thread_name?: string
  thread_code?: string
  po_number?: string
  style_code?: string
  style_name?: string
  color_name?: string
}

/**
 * Issue with lines (returned from GET /api/issues/v2/:id)
 */
export interface IssueV2WithLines extends IssueV2 {
  lines: IssueLineV2WithComputed[]
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * DTO for creating new issue
 */
export interface CreateIssueV2DTO {
  department: string
  created_by: string
  notes?: string
}

export interface CreateIssueWithLineDTO {
  department: string
  created_by: string
  notes?: string
  po_id?: number | null
  style_id?: number | null
  color_id?: number | null
  thread_type_id: number
  issued_full?: number
  issued_partial?: number
  over_quota_notes?: string | null
}

export interface AddIssueLineV2DTO {
  po_id?: number | null
  style_id?: number | null
  color_id?: number | null
  thread_type_id: number
  issued_full?: number
  issued_partial?: number
  over_quota_notes?: string | null
}

/**
 * DTO for validating line before adding
 */
export interface ValidateIssueLineV2DTO {
  thread_type_id: number
  issued_full?: number
  issued_partial?: number
  po_id?: number | null
  style_id?: number | null
  color_id?: number | null
}

/**
 * Response from validate line API
 */
export interface ValidateLineResponse {
  issued_equivalent: number
  is_over_quota: boolean
  stock_sufficient: boolean
  quota_cones: number | null
  stock_available_full: number
  stock_available_partial: number
  message?: string
}

/**
 * DTO for returning issued items
 */
export interface ReturnLineDTO {
  line_id: number
  returned_full: number
  returned_partial: number
}

export interface ReturnIssueV2DTO {
  lines: ReturnLineDTO[]
}

// ============================================================================
// Form Data Types
// ============================================================================

/**
 * Thread type with quota and stock for form display
 * Returned from GET /api/issues/v2/form-data
 */
export interface ThreadTypeForIssue {
  thread_type_id: number
  thread_code: string
  thread_name: string
  quota_cones: number | null
  stock_available_full: number
  stock_available_partial: number
}

/**
 * Response from form-data API
 */
export interface IssueFormData {
  thread_types: ThreadTypeForIssue[]
}

// ============================================================================
// List / Filter Types
// ============================================================================

/**
 * Filters for listing issues
 */
export interface IssueV2Filters {
  department?: string
  status?: IssueV2Status
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
  page?: number
  limit?: number
}

/**
 * Paginated list response
 */
export interface IssueV2ListResponse {
  data: IssueV2[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================================================
// Create Response
// ============================================================================

/**
 * Response from create issue API
 */
export interface CreateIssueV2Response {
  issue_id: number
  issue_code: string
}

// ============================================================================
// Order Options Types (for cascading dropdowns)
// ============================================================================

/**
 * PO option from confirmed weekly orders
 */
export interface OrderOptionPO {
  id: number
  po_number: string
}

/**
 * Style option for a specific PO
 */
export interface OrderOptionStyle {
  id: number
  style_code: string
  style_name: string
}

/**
 * Color option for a specific PO/Style combination
 */
export interface OrderOptionColor {
  id: number
  name: string
  hex_code: string | null
}

/**
 * Union type for order options response
 */
export type OrderOptionsResponse = OrderOptionPO[] | OrderOptionStyle[] | OrderOptionColor[]

// ============================================================================
// Return Log Types
// ============================================================================

export interface ReturnLog {
  id: number
  issue_id: number
  line_id: number
  returned_full: number
  returned_partial: number
  created_by: string | null
  created_at: string
  thread_name: string
  thread_code: string
  color_name: string | null
}
