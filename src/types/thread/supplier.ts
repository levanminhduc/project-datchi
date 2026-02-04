/**
 * Supplier Type Definitions
 *
 * Types for supplier master data management.
 * Used for vendor/supplier information with contact details.
 */

/**
 * Supplier entity matching API response / database schema
 */
export interface Supplier {
  id: number
  code: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  lead_time_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Minimal color info for joined supplier queries
 */
export interface ColorSummary {
  id: number
  name: string
  hex_code: string
}

/**
 * Supplier with linked colors array (from color_supplier junction)
 */
export interface SupplierWithColors extends Supplier {
  colors?: ColorSummary[]
}

/**
 * Form data for create/update supplier operations
 */
export interface SupplierFormData {
  code: string
  name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  lead_time_days?: number
}

/**
 * Filters for supplier search/filter functionality
 */
export interface SupplierFilters {
  search?: string
  is_active?: boolean
}
