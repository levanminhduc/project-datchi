/**
 * Thread Type Definitions
 *
 * Types for thread type management (catalog/master data).
 * Field names match database columns.
 */

import type { ThreadMaterial } from './enums'

/**
 * Thread type entity matching database schema
 */
export interface ThreadType {
  id: number
  code: string
  name: string
  color: string | null
  color_code: string | null
  material: ThreadMaterial
  tex_number: number | null
  density_grams_per_meter: number
  meters_per_cone: number | null
  supplier: string | null
  reorder_level_meters: number
  lead_time_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Form data for create/update thread type operations
 * Excludes id and timestamps which are managed by backend
 */
export interface ThreadTypeFormData {
  code: string
  name: string
  color?: string
  color_code?: string
  material: ThreadMaterial
  tex_number?: number
  density_grams_per_meter: number
  meters_per_cone?: number
  supplier?: string
  reorder_level_meters?: number
  lead_time_days?: number
  is_active?: boolean
}

/**
 * Filters for thread type search/filter functionality
 */
export interface ThreadTypeFilters {
  search?: string
  color?: string
  material?: ThreadMaterial
  supplier?: string
  is_active?: boolean
}
