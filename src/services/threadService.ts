/**
 * Thread Service
 * 
 * API client for thread type management operations.
 * Handles all HTTP operations for thread types.
 */

import { fetchApi } from './api'
import type { ThreadType, ThreadTypeFormData, ThreadTypeFilters } from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

/**
 * Build query string from filters object
 */
function buildQueryString(filters?: ThreadTypeFilters): string {
  if (!filters) return ''

  const params = new URLSearchParams()

  if (filters.search) params.append('search', filters.search)
  if (filters.color_id) params.append('color_id', String(filters.color_id))
  if (filters.material) params.append('material', filters.material)
  if (filters.supplier_id) params.append('supplier_id', String(filters.supplier_id))
  if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active))

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const threadService = {
  /**
   * Lấy danh sách tất cả loại chỉ
   * @param filters - Optional filters for search, color, material, supplier, is_active
   * @returns Array of thread types
   */
  async getAll(filters?: ThreadTypeFilters): Promise<ThreadType[]> {
    const queryString = buildQueryString(filters)
    const response = await fetchApi<ApiResponse<ThreadType[]>>(`/api/threads${queryString}`)
    return response.data || []
  },

  /**
   * Lấy thông tin loại chỉ theo ID
   * @param id - Thread type ID
   * @returns Thread type or null if not found
   */
  async getById(id: number): Promise<ThreadType | null> {
    const response = await fetchApi<ApiResponse<ThreadType>>(`/api/threads/${id}`)
    return response.data
  },

  /**
   * Tạo loại chỉ mới
   * @param data - Thread type form data
   * @returns Created thread type
   */
  async create(data: ThreadTypeFormData): Promise<ThreadType> {
    const response = await fetchApi<ApiResponse<ThreadType>>('/api/threads', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data!
  },

  /**
   * Cập nhật thông tin loại chỉ
   * @param id - Thread type ID
   * @param data - Partial thread type data to update
   * @returns Updated thread type
   */
  async update(id: number, data: Partial<ThreadTypeFormData>): Promise<ThreadType> {
    const response = await fetchApi<ApiResponse<ThreadType>>(`/api/threads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response.data!
  },

  /**
   * Xóa loại chỉ (soft delete)
   * @param id - Thread type ID
   */
  async remove(id: number): Promise<void> {
    await fetchApi<ApiResponse<null>>(`/api/threads/${id}`, {
      method: 'DELETE',
    })
  },
}
