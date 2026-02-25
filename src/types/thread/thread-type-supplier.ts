/**
 * Thread Type - Supplier Junction Types
 *
 * Types for managing the many-to-many relationship between thread types and suppliers.
 * Each thread type can be sourced from multiple suppliers, each with their own
 * supplier_item_code and unit_price.
 */

import type { Supplier } from './supplier'
import type { SupplierSummary } from './color'

/**
 * Minimal thread type info for joined queries
 */
export interface ThreadTypeSummary {
  id: number
  code: string
  name: string
  material: string
  tex_number: number | null
  color_id: number | null
  color_data?: { id: number; name: string; hex_code: string } | null
}

/**
 * Thread type - supplier link entity
 */
export interface ThreadTypeSupplier {
  id: number
  thread_type_id: number
  supplier_id: number
  supplier_item_code: string    // Mã hàng của NCC (e.g., Astra-9700, Perma-9700)
  unit_price: number | null     // Giá mỗi đơn vị
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Thread type supplier with joined data
 */
export interface ThreadTypeSupplierWithRelations extends ThreadTypeSupplier {
  thread_type?: ThreadTypeSummary
  supplier?: SupplierSummary | Supplier
}

/**
 * Form data for creating/updating a thread type - supplier link
 */
export interface ThreadTypeSupplierFormData {
  thread_type_id?: number
  supplier_id: number
  supplier_item_code: string
  unit_price?: number | null
  notes?: string
}

/**
 * Form data for linking a supplier from thread type context
 */
export interface LinkSupplierFormData {
  supplier_id: number | null
  supplier_item_code?: string
  unit_price?: number | null
  notes?: string
}

/**
 * Filters for thread type supplier queries
 */
export interface ThreadTypeSupplierFilters {
  thread_type_id?: number
  supplier_id?: number
  is_active?: boolean
  search?: string
}
