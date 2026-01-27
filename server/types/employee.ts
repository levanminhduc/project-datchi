/**
 * Employee Management Type Definitions for Backend
 *
 * User-Provided Structure - do not modify field names or casing
 * Matches database schema and frontend types
 */

/**
 * Employee entity matching Supabase 'employees' table
 * Field names match actual database schema
 */
export interface Employee {
  id: number // ID from Supabase
  employee_id: string // Mã Nhân Viên (database column name)
  full_name: string // Tên Nhân Viên
  department: string // Phòng Ban
  chuc_vu: string // Chức Vụ (database column name)
  is_active: boolean // Trạng thái
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

/**
 * Data Transfer Object for creating new employees
 * Excludes id and timestamps which are managed by Supabase
 */
export interface CreateEmployeeDTO {
  employee_id: string
  full_name: string
  department: string
  chuc_vu: string
}

/**
 * Data Transfer Object for updating employees
 * All fields optional for partial updates
 */
export interface UpdateEmployeeDTO {
  employee_id?: string
  full_name?: string
  department?: string
  chuc_vu?: string
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
