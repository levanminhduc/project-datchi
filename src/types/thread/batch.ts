/**
 * Batch Operation Types
 *
 * Type definitions for batch operations and transactions.
 */

import type { Lot } from './lot'

/**
 * Batch operation type enum matching database batch_operation_type
 */
export type BatchOperationType = 'RECEIVE' | 'TRANSFER' | 'ISSUE' | 'RETURN'

/**
 * Batch transaction entity matching database schema
 */
export interface BatchTransaction {
  id: number
  operation_type: BatchOperationType

  // References
  lot_id: number | null
  from_warehouse_id: number | null
  to_warehouse_id: number | null

  // What was moved
  cone_ids: number[]
  cone_count: number

  // Context
  reference_number: string | null
  recipient: string | null
  notes: string | null

  // Audit
  performed_by: string | null
  performed_at: string

  // Joined data (optional)
  lot?: Lot
  from_warehouse?: {
    id: number
    code: string
    name: string
  }
  to_warehouse?: {
    id: number
    code: string
    name: string
  }
}

/**
 * Batch receive request
 */
export interface BatchReceiveRequest {
  // Lot - either existing or new
  lot_id?: number
  lot_number?: string
  thread_type_id: number
  warehouse_id: number

  // Cones to receive
  cone_ids: string[]

  // Lot metadata (for new lot)
  production_date?: string
  expiry_date?: string
  supplier_id?: number
  notes?: string
}

/**
 * Batch transfer request
 */
export interface BatchTransferRequest {
  cone_ids?: number[]
  lot_id?: number
  thread_type_id?: number
  color_id?: number
  quantity?: number
  include_reserved?: boolean
  from_warehouse_id: number
  to_warehouse_id: number
  notes?: string
}

/**
 * Batch issue request
 */
export interface BatchIssueRequest {
  // Selection - either specific cones or entire lot
  cone_ids?: number[]
  lot_id?: number

  // Source
  warehouse_id: number

  // Recipient info
  recipient: string
  reference_number?: string
  notes?: string
}

/**
 * Batch return request
 */
export interface BatchReturnRequest {
  cone_ids: number[]
  warehouse_id: number
  notes?: string
}

/**
 * Batch operation response
 */
export interface BatchOperationResponse {
  transaction_id: number
  operation_type: BatchOperationType
  cone_count: number
  lot_id?: number
  message: string
  transferable_moved?: number
  reserved_moved?: number
}

export interface TransferableSummaryItem {
  thread_type_id: number
  thread_code: string
  thread_name: string
  supplier_name: string
  tex_number: string
  color_id: number
  color_name: string
  color_hex: string | null
  transferable_count: number
  reserved_count: number
  reserved_by_week: { week_id: number; week_name: string; count: number }[]
}

/**
 * Batch transaction filters
 */
export interface BatchTransactionFilters {
  operation_type?: BatchOperationType
  lot_id?: number
  warehouse_id?: number
  from_date?: string
  to_date?: string
  reference_number?: string
}

export interface TransferHistoryItem {
  id: number
  from_warehouse_id: number
  to_warehouse_id: number
  from_warehouse: { id: number; code: string; name: string }
  to_warehouse: { id: number; code: string; name: string }
  cone_ids: number[]
  cone_count: number
  lot_id: number | null
  lot: { id: number; lot_number: string } | null
  reference_number: string | null
  notes: string | null
  performed_by: string | null
  performed_at: string
}

export interface TransferHistorySummary {
  total_transfers: number
  total_cones: number
  top_source: { name: string; count: number } | null
  top_destination: { name: string; count: number } | null
}

export interface TransferHistoryFilters {
  from_warehouse_id?: number
  to_warehouse_id?: number
  from_date?: string
  to_date?: string
  search?: string
}

export interface TransferHistoryResponse {
  data: {
    items: TransferHistoryItem[]
    total: number
  }
  error: string | null
}

export interface TransferHistorySummaryResponse {
  data: TransferHistorySummary | null
  error: string | null
}

export interface ConeSummaryItem {
  thread_type_id: number
  supplier_name: string
  tex_number: string
  color_name: string
  color_hex: string | null
  cone_count: number
}
