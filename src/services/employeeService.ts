/**
 * Employee API Service
 * 
 * Handles all HTTP operations for employee management
 * Uses fetchApi for consistent error handling
 */

import { fetchApi } from './api'
import type {
  Employee,
  EmployeeFormData,
  ApiResponse,
} from '@/types'

export const employeeService = {
  /**
   * Lấy danh sách tất cả nhân viên
   * Uses limit=0 to fetch all records for virtual scroll
   * @returns Array of employees
   */
  async getAll(): Promise<Employee[]> {
    // limit=0 tells backend to return all records without pagination
    const response = await fetchApi<ApiResponse<Employee[]>>('/api/employees?limit=0')
    return response.data || []
  },

  /**
   * Lấy thông tin nhân viên theo ID
   * @param id - Employee ID
   * @returns Employee or null if not found
   */
  async getById(id: number): Promise<Employee | null> {
    const response = await fetchApi<ApiResponse<Employee>>(`/api/employees/${id}`)
    return response.data
  },

  /**
   * Tạo nhân viên mới
   * @param data - Employee form data
   * @returns Created employee
   */
  async create(data: EmployeeFormData): Promise<Employee> {
    const response = await fetchApi<ApiResponse<Employee>>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data!
  },

  /**
   * Cập nhật thông tin nhân viên
   * @param id - Employee ID
   * @param data - Partial employee data to update
   * @returns Updated employee
   */
  async update(id: number, data: Partial<EmployeeFormData>): Promise<Employee> {
    const response = await fetchApi<ApiResponse<Employee>>(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response.data!
  },

  /**
   * Xóa nhân viên
   * @param id - Employee ID
   */
  async delete(id: number): Promise<void> {
    await fetchApi<ApiResponse<null>>(`/api/employees/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Lấy số lượng nhân viên đang hoạt động
   * @returns Count of active employees
   */
  async getActiveCount(): Promise<number> {
    const response = await fetchApi<ApiResponse<{ count: number }>>('/api/employees/count')
    return response.data?.count || 0
  },

  /**
   * Lấy danh sách các bộ phận (departments) duy nhất
   * @returns Array of unique department names
   */
  async getDepartments(): Promise<string[]> {
    const response = await fetchApi<ApiResponse<string[]>>('/api/employees/departments')
    return response.data || []
  },
}
