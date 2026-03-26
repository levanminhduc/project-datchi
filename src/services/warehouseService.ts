/**
 * Warehouse Service
 *
 * API client for warehouse management operations.
 * Handles all HTTP operations for warehouses.
 */

import { fetchApi } from './api'

// ============ TYPES ============

export type WarehouseType = 'LOCATION' | 'STORAGE'

export interface Warehouse {
  id: number
  code: string
  name: string
  location: string | null
  parent_id: number | null
  type: WarehouseType
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WarehouseTreeNode extends Warehouse {
  children: Warehouse[]
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

// ============ SERVICE ============

export const warehouseService = {
  /**
   * Lấy danh sách tất cả kho (flat list - backward compatible)
   * @returns Array of all warehouses
   */
  async getAll(): Promise<Warehouse[]> {
    const response = await fetchApi<ApiResponse<Warehouse[]>>('/api/warehouses')
    return response.data || []
  },

  /**
   * Lấy danh sách kho dạng cây (LOCATION chứa children STORAGE)
   * @returns Array of location nodes with storage children
   */
  async getTree(): Promise<WarehouseTreeNode[]> {
    const response = await fetchApi<ApiResponse<WarehouseTreeNode[]>>('/api/warehouses?format=tree')
    return response.data || []
  },

  /**
   * Lấy chỉ các kho lưu trữ (STORAGE) - dùng cho inventory forms
   * @param locationId - Lọc theo địa điểm (optional)
   * @returns Array of storage warehouses only
   */
  async getStorageOnly(locationId?: number): Promise<Warehouse[]> {
    const url = locationId
      ? `/api/warehouses/storage?location_id=${locationId}`
      : '/api/warehouses/storage'
    const response = await fetchApi<ApiResponse<Warehouse[]>>(url)
    return response.data || []
  },

  /**
   * Lấy chỉ các địa điểm (LOCATION)
   * @returns Array of location warehouses only
   */
  async getLocations(): Promise<Warehouse[]> {
    const response = await fetchApi<ApiResponse<Warehouse[]>>('/api/warehouses/locations')
    return response.data || []
  },

  /**
   * Lấy kho theo location ID
   * @param locationId - ID của địa điểm
   * @returns Array of storage warehouses under the location
   */
  async getByLocation(locationId: number): Promise<Warehouse[]> {
    return this.getStorageOnly(locationId)
  },
}
