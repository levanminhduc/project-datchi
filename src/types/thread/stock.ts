/**
 * Thread Stock Types
 *
 * Type definitions for quantity-based stock management.
 * Groups inventory by thread type, warehouse, and optional lot number.
 */

/**
 * Stock record row from database
 */
export interface ThreadStockRow {
  id: number
  thread_type_id: number
  warehouse_id: number
  lot_number: string | null
  qty_full_cones: number
  qty_partial_cones: number
  received_date: string
  expiry_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Stock record with joined relations
 */
export interface ThreadStockWithRelations extends ThreadStockRow {
  thread_type?: {
    id: number
    code: string
    name: string
    color_data?: { name: string; hex_code: string } | null
  }
  warehouse?: {
    id: number
    name: string
    code?: string
  }
}

/**
 * Stock summary row - aggregated by thread type
 */
export interface ThreadStockSummary {
  thread_type_id: number
  thread_name: string
  thread_code?: string
  total_full_cones: number
  total_partial_cones: number
  total_equivalent?: number
  warehouse_id?: number
  warehouse_name?: string
}

/**
 * Filters for querying stock
 */
export interface ThreadStockFilters {
  thread_type_id?: number
  warehouse_id?: number
  lot_number?: string
}

/**
 * DTO for adding stock (receiving)
 */
export interface AddStockDTO {
  thread_type_id: number
  warehouse_id: number
  lot_number?: string | null
  qty_full_cones: number
  qty_partial_cones?: number
  received_date: string
  expiry_date?: string | null
  notes?: string | null
}

/**
 * DTO for deducting stock (issuing)
 */
export interface DeductStockDTO {
  thread_type_id: number
  warehouse_id?: number
  qty_full: number
  qty_partial?: number
}

/**
 * Result of stock deduction showing which lots were affected
 */
export interface DeductionResult {
  lot_number: string | null
  qty_full: number
  qty_partial: number
}

/**
 * Response from deduct stock API
 */
export interface DeductStockResponse {
  success: boolean
  deducted_from: DeductionResult[]
  total_deducted_full: number
  total_deducted_partial: number
}

/**
 * DTO for returning stock
 */
export interface ReturnStockDTO {
  thread_type_id: number
  warehouse_id: number
  lot_number?: string | null
  qty_full: number
  qty_partial: number
}

/**
 * API Response wrapper for stock operations
 */
export interface StockApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
