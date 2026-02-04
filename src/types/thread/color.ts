/**
 * Color Type Definitions
 *
 * Types for color master data management.
 * Used for standardized color definitions with industry codes.
 */

/**
 * Color entity matching API response / database schema
 */
export interface Color {
  id: number
  name: string
  hex_code: string
  pantone_code: string | null
  ral_code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Minimal supplier info for joined color queries
 */
export interface SupplierSummary {
  id: number
  code: string
  name: string
}

/**
 * Color with linked suppliers array (from color_supplier junction)
 */
export interface ColorWithSuppliers extends Color {
  suppliers?: SupplierSummary[]
}

/**
 * Form data for create/update color operations
 */
export interface ColorFormData {
  name: string
  hex_code: string
  pantone_code?: string
  ral_code?: string
}

/**
 * Filters for color search/filter functionality
 */
export interface ColorFilters {
  search?: string
  is_active?: boolean
}
