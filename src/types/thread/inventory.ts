/**
 * Thread Inventory Type Definitions
 *
 * Types for cone inventory management.
 * Field names match database columns.
 */

import type { ConeStatus } from './enums'
import type { ThreadType } from './thread-type'

/**
 * Cone entity matching database schema
 * Represents a single cone or batch of cones in inventory
 */
export interface Cone {
  id: number
  cone_id: string              // Barcode ID
  thread_type_id: number
  thread_type?: ThreadType     // Joined data
  warehouse_id: number
  warehouse_code?: string      // Joined
  quantity_cones: number
  quantity_meters: number
  weight_grams: number | null
  is_partial: boolean
  status: ConeStatus
  lot_number: string | null
  expiry_date: string | null
  received_date: string
  location: string | null
  created_at: string
  updated_at: string
}

/**
 * Filters for inventory search/filter functionality
 */
export interface InventoryFilters {
  search?: string
  thread_type_id?: number
  warehouse_id?: number
  status?: ConeStatus
  is_partial?: boolean
  expiry_before?: string
}

/**
 * DTO for receiving new stock
 */
export interface ReceiveStockDTO {
  thread_type_id: number
  warehouse_id: number
  quantity_cones: number
  weight_per_cone_grams?: number
  lot_number?: string
  expiry_date?: string
  location?: string
}

/**
 * Summary statistics for inventory dashboard
 */
export interface InventorySummary {
  total_cones: number
  total_meters: number
  available_cones: number
  available_meters: number
  allocated_cones: number
  partial_cones: number
  critical_low_count: number
}
