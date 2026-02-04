/**
 * Lot Types
 *
 * Type definitions for lot/batch entity and related types.
 */

import type { Supplier } from './supplier'

/**
 * Lot status enum matching database lot_status type
 */
export type LotStatus = 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'QUARANTINE'

/**
 * Lot entity matching database schema
 * Includes both legacy text field and FK field for dual-write pattern
 */
export interface Lot {
  id: number
  lot_number: string
  thread_type_id: number
  warehouse_id: number

  // Metadata
  production_date: string | null
  expiry_date: string | null
  // Legacy text field (kept for backward compatibility)
  supplier: string | null
  // FK field (new normalized structure)
  supplier_id: number | null

  // Counts (denormalized)
  total_cones: number
  available_cones: number

  // Status
  status: LotStatus

  // Additional
  notes: string | null
  created_at: string
  updated_at: string

  // Joined data (optional, populated by API LEFT JOIN)
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
  supplier_data?: {
    id: number
    code: string
    name: string
  } | null
}

/**
 * Lot creation request
 * Supports both legacy text field and FK field for dual-write
 */
export interface CreateLotRequest {
  lot_number: string
  thread_type_id: number
  warehouse_id: number
  production_date?: string
  expiry_date?: string
  // Legacy text field (optional, auto-populated from FK if not provided)
  supplier?: string
  // FK field (preferred for new submissions)
  supplier_id?: number
  notes?: string
}

/**
 * Lot update request
 * Supports both legacy text field and FK field for dual-write
 */
export interface UpdateLotRequest {
  production_date?: string | null
  expiry_date?: string | null
  // Legacy text field
  supplier?: string | null
  // FK field (preferred)
  supplier_id?: number | null
  status?: LotStatus
  notes?: string | null
}

/**
 * Lot list filters
 * Supports both legacy search and FK filter
 */
export interface LotFilters {
  status?: LotStatus
  warehouse_id?: number
  thread_type_id?: number
  supplier_id?: number
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
 * Lot with full supplier data
 */
export interface LotWithSupplier extends Lot {
  supplier_data?: Supplier | null
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
