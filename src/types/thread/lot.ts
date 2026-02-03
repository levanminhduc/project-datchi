/**
 * Lot Types
 *
 * Type definitions for lot/batch entity and related types.
 */

/**
 * Lot status enum matching database lot_status type
 */
export type LotStatus = 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'QUARANTINE'

/**
 * Lot entity matching database schema
 */
export interface Lot {
  id: number
  lot_number: string
  thread_type_id: number
  warehouse_id: number

  // Metadata
  production_date: string | null
  expiry_date: string | null
  supplier: string | null

  // Counts (denormalized)
  total_cones: number
  available_cones: number

  // Status
  status: LotStatus

  // Additional
  notes: string | null
  created_at: string
  updated_at: string

  // Joined data (optional)
  thread_type?: {
    id: number
    code: string
    name: string
    color_code: string | null
  }
  warehouse?: {
    id: number
    code: string
    name: string
  }
}

/**
 * Lot creation request
 */
export interface CreateLotRequest {
  lot_number: string
  thread_type_id: number
  warehouse_id: number
  production_date?: string
  expiry_date?: string
  supplier?: string
  notes?: string
}

/**
 * Lot update request
 */
export interface UpdateLotRequest {
  production_date?: string | null
  expiry_date?: string | null
  supplier?: string | null
  status?: LotStatus
  notes?: string | null
}

/**
 * Lot list filters
 */
export interface LotFilters {
  status?: LotStatus
  warehouse_id?: number
  thread_type_id?: number
  search?: string
}

/**
 * Lot with cones count summary
 */
export interface LotWithSummary extends Lot {
  cones_count?: number
  available_meters?: number
  total_weight_grams?: number
}

/**
 * Unassigned thread group - virtual "lot" for cones without lot assignment
 * Used in LotSelector to allow selecting and transferring unassigned cones
 */
export interface UnassignedThreadGroup {
  thread_type_id: number
  thread_type_name: string
  thread_type_code: string
  color_code: string | null
  cone_count: number
  cone_ids: number[]
}
