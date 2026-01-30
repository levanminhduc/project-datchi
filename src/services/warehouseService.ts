/**
 * Warehouse Service
 *
 * API client for warehouse management operations.
 * Handles all HTTP operations for warehouses.
 */

import { fetchApi } from './api'

export interface Warehouse {
  id: number
  code: string
  name: string
  location: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export const warehouseService = {
  /**
   * Lấy danh sách tất cả kho
   * @returns Array of warehouses
   */
  async getAll(): Promise<Warehouse[]> {
    const response = await fetchApi<ApiResponse<Warehouse[]>>('/api/warehouses')
    return response.data || []
  },
}
