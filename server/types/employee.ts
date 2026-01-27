export interface Employee {
  id: number
  employee_id: string
  full_name: string
  department: string
  chuc_vu: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateEmployeeDTO {
  employee_id: string
  full_name: string
  department: string
  chuc_vu: string
}

export interface UpdateEmployeeDTO {
  employee_id?: string
  full_name?: string
  department?: string
  chuc_vu?: string
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
