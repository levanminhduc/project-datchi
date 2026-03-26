/**
 * Color Service
 *
 * API client for color master data management.
 */

import { fetchApi } from './api'
import type {
  Color,
  ColorWithSuppliers,
  ColorFormData,
  ColorFilters
} from '@/types/thread/color'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

/**
 * ColorSupplierLink - Junction table row with supplier details
 */
export interface ColorSupplierLink {
  id: number
  color_id: number
  supplier_id: number
  price_per_kg: number | null
  min_order_qty: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  supplier: {
    id: number
    code: string
    name: string
    contact_name?: string | null
    phone?: string | null
    email?: string | null
    is_active?: boolean
  }
}

export const colorService = {
  /**
   * Lấy danh sách màu với filters
   */
  async getAll(filters?: ColorFilters): Promise<Color[]> {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString())

    const url = `/api/colors${params.toString() ? '?' + params.toString() : ''}`
    const response = await fetchApi<ApiResponse<Color[]>>(url)
    return response.data || []
  },

  /**
   * Lấy thông tin chi tiết màu với danh sách nhà cung cấp
   */
  async getById(id: number): Promise<ColorWithSuppliers> {
    const response = await fetchApi<ApiResponse<ColorWithSuppliers>>(`/api/colors/${id}`)
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Tạo màu mới
   */
  async create(data: ColorFormData): Promise<Color> {
    const response = await fetchApi<ApiResponse<Color>>('/api/colors', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Cập nhật thông tin màu
   */
  async update(id: number, data: Partial<ColorFormData> & { is_active?: boolean }): Promise<Color> {
    const response = await fetchApi<ApiResponse<Color>>(`/api/colors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Xóa màu (soft delete - chuyển is_active = false)
   */
  async remove(id: number): Promise<void> {
    const response = await fetchApi<ApiResponse<Color | null>>(`/api/colors/${id}`, {
      method: 'DELETE'
    })
    if (response.error) throw new Error(response.error)
  },

  /**
   * Lấy danh sách nhà cung cấp liên kết với màu
   */
  async getSuppliers(colorId: number): Promise<ColorSupplierLink[]> {
    const response = await fetchApi<ApiResponse<ColorSupplierLink[]>>(`/api/colors/${colorId}/suppliers`)
    return response.data || []
  },

  /**
   * Liên kết nhà cung cấp với màu
   */
  async linkSupplier(
    colorId: number,
    supplierId: number,
    pricePerKg?: number,
    minOrderQty?: number
  ): Promise<ColorSupplierLink> {
    const response = await fetchApi<ApiResponse<ColorSupplierLink>>(`/api/colors/${colorId}/suppliers`, {
      method: 'POST',
      body: JSON.stringify({
        supplier_id: supplierId,
        price_per_kg: pricePerKg,
        min_order_qty: minOrderQty
      })
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Cập nhật thông tin liên kết (giá, MOQ)
   */
  async updateLink(
    colorId: number,
    linkId: number,
    data: { price_per_kg?: number | null; min_order_qty?: number | null; is_active?: boolean }
  ): Promise<ColorSupplierLink> {
    const response = await fetchApi<ApiResponse<ColorSupplierLink>>(`/api/colors/${colorId}/suppliers/${linkId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Gỡ liên kết nhà cung cấp khỏi màu
   */
  async unlinkSupplier(colorId: number, linkId: number): Promise<void> {
    const response = await fetchApi<ApiResponse<null>>(`/api/colors/${colorId}/suppliers/${linkId}`, {
      method: 'DELETE'
    })
    if (response.error) throw new Error(response.error)
  }
}
