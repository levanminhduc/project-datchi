/**
 * Supplier Service
 *
 * API client for supplier master data management.
 */

import { fetchApi } from './api'
import type {
  Supplier,
  SupplierWithColors,
  SupplierFormData,
  SupplierFilters
} from '@/types/thread/supplier'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export const supplierService = {
  /**
   * Lấy danh sách nhà cung cấp với filters
   */
  async getAll(filters?: SupplierFilters): Promise<Supplier[]> {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString())

    const url = `/api/suppliers${params.toString() ? '?' + params.toString() : ''}`
    const response = await fetchApi<ApiResponse<Supplier[]>>(url)
    return response.data || []
  },

  /**
   * Lấy thông tin chi tiết nhà cung cấp với danh sách màu
   */
  async getById(id: number): Promise<SupplierWithColors> {
    const response = await fetchApi<ApiResponse<SupplierWithColors>>(`/api/suppliers/${id}`)
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Tạo nhà cung cấp mới
   */
  async create(data: SupplierFormData): Promise<Supplier> {
    const response = await fetchApi<ApiResponse<Supplier>>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Cập nhật thông tin nhà cung cấp
   */
  async update(id: number, data: Partial<SupplierFormData> & { is_active?: boolean }): Promise<Supplier> {
    const response = await fetchApi<ApiResponse<Supplier>>(`/api/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Xóa nhà cung cấp (soft delete - chuyển is_active = false)
   */
  async remove(id: number): Promise<void> {
    const response = await fetchApi<ApiResponse<Supplier | null>>(`/api/suppliers/${id}`, {
      method: 'DELETE'
    })
    if (response.error) throw new Error(response.error)
  },

  /**
   * Lấy danh sách màu cho một nhà cung cấp
   */
  async getColors(supplierId: number): Promise<unknown[]> {
    const response = await fetchApi<ApiResponse<unknown[]>>(`/api/suppliers/${supplierId}/colors`)
    return response.data || []
  },

  /**
   * Liên kết màu với nhà cung cấp
   */
  async linkColor(supplierId: number, colorId: number, isPreferred = false): Promise<void> {
    const response = await fetchApi<ApiResponse<unknown>>(`/api/suppliers/${supplierId}/colors`, {
      method: 'POST',
      body: JSON.stringify({ color_id: colorId, is_preferred: isPreferred })
    })
    if (response.error) throw new Error(response.error)
  }
}
