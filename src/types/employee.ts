/**
 * Employee Management Type Definitions
 * 
 * User-Provided Structure - do not modify field names or casing
 */

/**
 * Employee entity matching database schema
 * Field names match actual database columns
 */
export interface Employee {
  id: number              // ID from Supabase
  employee_id: string     // Mã Nhân Viên (database column)
  full_name: string       // Tên Nhân Viên
  department: string      // Phòng Ban
  chuc_vu: string         // Chức Vụ (database column)
  is_active: boolean      // Trạng thái
  created_at: string      // ISO timestamp
  updated_at: string      // ISO timestamp
}

/**
 * Form data for create/update operations
 * Excludes id and timestamps which are managed by backend
 */
export interface EmployeeFormData {
  employee_id: string     // Mã Nhân Viên
  full_name: string       // Tên Nhân Viên
  department: string      // Phòng Ban
  chuc_vu: string         // Chức Vụ
}

/**
 * Filters for employee search/filter functionality
 */
export interface EmployeeFilters {
  search?: string         // Tìm kiếm theo tên, mã, phòng ban
  department?: string     // Lọc theo Phòng Ban
  chuc_vu?: string        // Lọc theo Chức Vụ
}

/**
 * Generic API response wrapper
 * Used for single entity responses
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
