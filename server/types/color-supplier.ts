// Color-Supplier Junction Table Types
// Thread Restructure Phase 2 - Many-to-many relationship with pricing

// ============ DATABASE ROW TYPES ============

/**
 * ColorSupplierRow - Maps directly to color_supplier junction table
 */
export interface ColorSupplierRow {
  id: number
  color_id: number
  supplier_id: number
  price_per_kg: number | null
  min_order_qty: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * ColorSupplierWithDetails - Junction with expanded related data
 */
export interface ColorSupplierWithDetails extends ColorSupplierRow {
  color?: {
    id: number
    name: string
    hex_code: string
  }
  supplier?: {
    id: number
    code: string
    name: string
    contact_name?: string | null
    phone?: string | null
    email?: string | null
    is_active?: boolean
  }
}

// ============ DTOs ============

/**
 * CreateColorSupplierDTO - Link a color to a supplier with pricing
 */
export interface CreateColorSupplierDTO {
  color_id: number
  supplier_id: number
  price_per_kg?: number
  min_order_qty?: number
}

/**
 * UpdateColorSupplierDTO - Update link pricing/metadata
 */
export interface UpdateColorSupplierDTO {
  price_per_kg?: number | null
  min_order_qty?: number | null
  is_active?: boolean
}

// ============ API RESPONSE ============

export interface ColorSupplierApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}
