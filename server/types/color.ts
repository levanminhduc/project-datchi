// Color Management Backend Types
// Thread Restructure Phase 2 - Colors master table types

// ============ DATABASE ROW TYPES ============

/**
 * ColorRow - Maps directly to colors table in database
 */
export interface ColorRow {
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
 * Color with joined suppliers (for GET /:id)
 */
export interface ColorWithSuppliers extends ColorRow {
  suppliers?: SupplierSummary[]
}

/**
 * Minimal supplier info for joined queries
 */
export interface SupplierSummary {
  id: number
  code: string
  name: string
}

// ============ DTOs ============

/**
 * CreateColorDTO - Data for creating a new color
 */
export interface CreateColorDTO {
  name: string
  hex_code: string
  pantone_code?: string
  ral_code?: string
}

/**
 * UpdateColorDTO - Partial data for updating color
 */
export interface UpdateColorDTO extends Partial<CreateColorDTO> {
  is_active?: boolean
}

// ============ FILTERS ============

/**
 * ColorFilters - Query parameters for listing colors
 */
export interface ColorFilters {
  search?: string
  is_active?: boolean
}

// ============ API RESPONSE ============

/**
 * ColorApiResponse - Standard API response wrapper
 */
export interface ColorApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}
