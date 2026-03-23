// Supplier Management Backend Types
// Thread Restructure Phase 2 - Suppliers master table types

// ============ DATABASE ROW TYPES ============

/**
 * SupplierRow - Maps directly to suppliers table in database
 */
export interface SupplierRow {
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
 * Supplier with joined colors (for GET /:id)
 */
export interface SupplierWithColors extends SupplierRow {
  colors?: ColorSummary[]
}

/**
 * Minimal color info for joined queries
 */
export interface ColorSummary {
  id: number
  name: string
  hex_code: string
}

// ============ DTOs ============

/**
 * CreateSupplierDTO - Data for creating a new supplier
 */
export interface CreateSupplierDTO {
  code: string
  name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  lead_time_days?: number
}

/**
 * UpdateSupplierDTO - Partial data for updating supplier
 */
export interface UpdateSupplierDTO extends Partial<CreateSupplierDTO> {
  is_active?: boolean
}

// ============ FILTERS ============

/**
 * SupplierFilters - Query parameters for listing suppliers
 */
export interface SupplierFilters {
  search?: string
  is_active?: boolean
}

// ============ API RESPONSE ============

/**
 * SupplierApiResponse - Standard API response wrapper
 */
export interface SupplierApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}
