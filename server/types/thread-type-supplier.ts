// Thread Type - Supplier Junction Table Backend Types
// Links thread types to suppliers with supplier-specific item codes and pricing
// Each thread type can be sourced from multiple suppliers

// ============ DATABASE ROW TYPES ============

/**
 * ThreadTypeSupplierRow - Maps directly to thread_type_supplier table in database
 */
export interface ThreadTypeSupplierRow {
  id: number
  thread_type_id: number
  supplier_id: number
  supplier_item_code: string    // Mã hàng của NCC (e.g., Astra-9700, Perma-9700)
  unit_price: number | null     // Giá mỗi đơn vị
  meters_per_cone: number | null // Số mét chỉ trên mỗi cone
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * ThreadTypeSupplierWithRelations - Includes joined thread_type and supplier data
 */
export interface ThreadTypeSupplierWithRelations extends ThreadTypeSupplierRow {
  thread_type?: ThreadTypeSummary
  supplier?: SupplierSummary
}

/**
 * Minimal thread_type info for joined queries
 */
export interface ThreadTypeSummary {
  id: number
  code: string
  name: string
  material: string
  tex_number: number | null
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
 * CreateThreadTypeSupplierDTO - Data for linking a thread type to a supplier
 */
export interface CreateThreadTypeSupplierDTO {
  thread_type_id: number
  supplier_id: number
  supplier_item_code: string
  unit_price?: number
  meters_per_cone?: number
  notes?: string
}

/**
 * UpdateThreadTypeSupplierDTO - Partial data for updating a link
 */
export interface UpdateThreadTypeSupplierDTO {
  supplier_item_code?: string
  unit_price?: number
  meters_per_cone?: number
  is_active?: boolean
  notes?: string
}

/**
 * LinkSupplierDTO - Simplified DTO for linking from thread type endpoint
 */
export interface LinkSupplierDTO {
  supplier_id: number
  supplier_item_code: string
  unit_price?: number
  meters_per_cone?: number
  notes?: string
}

// ============ FILTERS ============

/**
 * ThreadTypeSupplierFilters - Query parameters for listing links
 */
export interface ThreadTypeSupplierFilters {
  thread_type_id?: number
  supplier_id?: number
  is_active?: boolean
  search?: string  // Search by supplier_item_code
}

// ============ API RESPONSE ============

/**
 * ThreadTypeSupplierApiResponse - Standard API response wrapper
 */
export interface ThreadTypeSupplierApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}
