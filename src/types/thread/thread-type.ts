/**
 * Thread Type Definitions
 *
 * Types for thread type management (catalog/master data).
 * Field names match database columns.
 */

import type { ThreadMaterial } from './enums'
import type { Color } from './color'
import type { Supplier } from './supplier'
import type { ThreadTypeSupplierWithRelations } from './thread-type-supplier'

/**
 * Thread type entity matching database schema
 * Includes both legacy text fields and FK fields for dual-write pattern
 */
export interface ThreadType {
  id: number
  code: string
  name: string
  // Legacy text fields (kept for backward compatibility)
  color: string | null
  color_code: string | null
  supplier: string | null
  // FK fields (new normalized structure)
  color_id: number | null
  supplier_id: number | null
  color_supplier_id: number | null
  // Other fields
  material: ThreadMaterial
  tex_number: number | null
  density_grams_per_meter: number
  meters_per_cone: number | null
  reorder_level_meters: number
  lead_time_days: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined data (optional, populated by API LEFT JOIN)
  color_data?: {
    id: number
    name: string
    hex_code: string
    pantone_code: string | null
  } | null
  supplier_data?: {
    id: number
    code: string
    name: string
  } | null
}

/**
 * Form data for create/update thread type operations
 * Supports both legacy text fields and FK fields for dual-write
 */
export interface ThreadTypeFormData {
  code: string
  name: string
  // Legacy text fields (optional, auto-populated from FK if not provided)
  color?: string
  color_code?: string
  supplier?: string
  // FK fields (preferred for new submissions)
  color_id?: number | null
  supplier_id?: number | null
  color_supplier_id?: number | null
  // Other fields
  material: ThreadMaterial
  tex_number?: number
  density_grams_per_meter: number
  meters_per_cone?: number
  reorder_level_meters?: number
  lead_time_days?: number
  is_active?: boolean
}

/**
 * Filters for thread type search/filter functionality
 * Supports both legacy text filters and FK filters
 */
export interface ThreadTypeFilters {
  search?: string
  // Legacy text filters
  color?: string
  supplier?: string
  // FK filters (preferred)
  color_id?: number
  supplier_id?: number
  // Other filters
  material?: ThreadMaterial
  is_active?: boolean
}

/**
 * Thread type with full color and supplier data
 */
export interface ThreadTypeWithRelations extends ThreadType {
  color_data?: Color | null
  supplier_data?: Supplier | null
  // Multiple suppliers via junction table (new normalized structure)
  suppliers?: ThreadTypeSupplierWithRelations[]
}
