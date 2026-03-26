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

export interface EmployeeDetail extends Employee {
  last_login_at: string | null
  must_change_password: boolean | null
  password_changed_at: string | null
  failed_login_attempts: number | null
  locked_until: string | null
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
