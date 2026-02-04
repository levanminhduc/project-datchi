/**
 * Batch Types - Server Side
 *
 * Request/Response types for batch operations API.
 */

/**
 * Lot status enum
 */
export type LotStatus = 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'QUARANTINE'

/**
 * Batch operation type enum
 */
export type BatchOperationType = 'RECEIVE' | 'TRANSFER' | 'ISSUE' | 'RETURN'

/**
 * Lot row from database
 */
export interface LotRow {
  id: number
  lot_number: string
  thread_type_id: number
  warehouse_id: number
  production_date: string | null
  expiry_date: string | null
  supplier: string | null
  total_cones: number
  available_cones: number
  status: LotStatus
  notes: string | null
  created_at: string
  updated_at: string
  // Thread restructure FK field (nullable during migration)
  supplier_id: number | null
}

/**
 * Lot with joined supplier data
 */
export interface LotWithSupplier extends LotRow {
  supplier_data?: {
    id: number
    code: string
    name: string
  } | null
}

/**
 * Batch transaction row from database
 */
export interface BatchTransactionRow {
  id: number
  operation_type: BatchOperationType
  lot_id: number | null
  from_warehouse_id: number | null
  to_warehouse_id: number | null
  cone_ids: number[]
  cone_count: number
  reference_number: string | null
  recipient: string | null
  notes: string | null
  performed_by: string | null
  performed_at: string
}

/**
 * Create lot request
 */
export interface CreateLotRequest {
  lot_number: string
  thread_type_id: number
  warehouse_id: number
  production_date?: string
  expiry_date?: string
  supplier?: string
  notes?: string
  // Thread restructure FK field (dual-write)
  supplier_id?: number
}

/**
 * Update lot request
 */
export interface UpdateLotRequest {
  production_date?: string | null
  expiry_date?: string | null
  supplier?: string | null
  status?: LotStatus
  notes?: string | null
  // Thread restructure FK field (dual-write)
  supplier_id?: number | null
}

/**
 * Batch receive request
 */
export interface BatchReceiveRequest {
  lot_id?: number
  lot_number?: string
  thread_type_id: number
  warehouse_id: number
  cone_ids: string[]
  production_date?: string
  expiry_date?: string
  supplier?: string
  notes?: string
  quantity_meters_per_cone?: number
  weight_per_cone_grams?: number
}

/**
 * Batch transfer request
 */
export interface BatchTransferRequest {
  cone_ids?: number[]
  lot_id?: number
  from_warehouse_id: number
  to_warehouse_id: number
  notes?: string
}

/**
 * Batch issue request
 */
export interface BatchIssueRequest {
  cone_ids?: number[]
  lot_id?: number
  warehouse_id: number
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
 * Generic API response
 */
export interface BatchApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  transaction_id: number
  operation_type: BatchOperationType
  cone_count: number
  lot_id?: number
}

/**
 * Max cones per batch operation
 */
export const MAX_BATCH_SIZE = 500
