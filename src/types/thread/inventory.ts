/**
 * Thread Inventory Type Definitions
 *
 * Types for cone inventory management.
 * Field names match database columns.
 */

import type { ConeStatus } from './enums'
import type { ThreadType } from './thread-type'
import type { Lot } from './lot'

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
  lot_id: number | null        // FK to lots table
  lot?: Lot                    // Joined lot data
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

/**
 * Cone-based summary row grouped by thread type
 */
export interface ConeSummaryRow {
  thread_type_id: number
  thread_code: string
  thread_name: string
  color: string | null
  color_code: string | null
  material: string
  tex_number: number | null
  meters_per_cone: number | null
  full_cones: number
  partial_cones: number
  partial_meters: number
  partial_weight_grams: number
}

/**
 * Warehouse breakdown for a specific thread type
 */
export interface ConeWarehouseBreakdown {
  warehouse_id: number
  warehouse_code: string
  warehouse_name: string
  location: string | null
  full_cones: number
  partial_cones: number
  partial_meters: number
}

/**
 * Supplier breakdown for a specific thread type
 * Used for drill-down view showing supplier distribution
 */
export interface SupplierBreakdown {
  supplier_id: number | null
  supplier_code: string | null
  supplier_name: string
  full_cones: number
  partial_cones: number
  partial_meters: number
}

/**
 * Filters for cone summary view
 */
export interface ConeSummaryFilters {
  warehouse_id?: number
  material?: string
  search?: string
}
