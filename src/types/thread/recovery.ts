/**
 * Thread Recovery Type Definitions
 *
 * Types for partial cone recovery workflow.
 * Field names match database columns.
 */

import type { RecoveryStatus } from './enums'
import type { Cone } from './inventory'

/**
 * Recovery entity matching database schema
 * Tracks the return and weighing of partial cones
 */
export interface Recovery {
  id: number
  cone_id: number
  cone?: Cone
  original_meters: number
  returned_weight_grams: number | null
  remaining_meters: number | null
  consumed_meters: number | null
  tare_weight_grams: number
  status: RecoveryStatus
  returned_by: string | null
  weighed_by: string | null
  confirmed_by: string | null
  notes: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

/**
 * DTO for initiating a cone return
 */
export interface InitiateReturnDTO {
  cone_id: string           // Barcode scan result
  returned_by?: string
  notes?: string
}

/**
 * DTO for weighing a returned cone
 */
export interface WeighConeDTO {
  weight_grams: number
  tare_weight_grams?: number   // Cone weight (default from thread type)
  weighed_by?: string
}

/**
 * DTO for writing off a cone
 */
export interface WriteOffDTO {
  reason: string
  approved_by: string
}

/**
 * Filters for recovery search/filter functionality
 */
export interface RecoveryFilters {
  status?: RecoveryStatus
  cone_id?: string
  from_date?: string
  to_date?: string
}
