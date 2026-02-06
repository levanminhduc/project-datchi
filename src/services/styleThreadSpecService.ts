/**
 * Style Thread Spec Service
 *
 * API client for style thread specification operations.
 */

import { fetchApi } from './api'
import type {
  StyleThreadSpec,
  StyleColorThreadSpec,
  CreateStyleThreadSpecDTO,
  UpdateStyleThreadSpecDTO,
  CreateStyleColorThreadSpecDTO,
  StyleThreadSpecFilter,
} from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/style-thread-specs'

function buildQueryString(filters?: StyleThreadSpecFilter): string {
  if (!filters) return ''

  const params = new URLSearchParams()

  if (filters.style_id) params.append('style_id', String(filters.style_id))
  if (filters.supplier_id) params.append('supplier_id', String(filters.supplier_id))

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const styleThreadSpecService = {
  /**
   * Lấy danh sách tất cả định mức chỉ
   * @param filters - Optional filters
   * @returns Array of style thread specs
   */
  async getAll(filters?: StyleThreadSpecFilter): Promise<StyleThreadSpec[]> {
    const queryString = buildQueryString(filters)
    const response = await fetchApi<ApiResponse<StyleThreadSpec[]>>(`${BASE}${queryString}`)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Lấy thông tin định mức chỉ theo ID
   * @param id - Style thread spec ID
   * @returns Style thread spec
   */
  async getById(id: number): Promise<StyleThreadSpec> {
    const response = await fetchApi<ApiResponse<StyleThreadSpec>>(`${BASE}/${id}`)

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không tìm thấy định mức chỉ')
    }

    return response.data
  },

  /**
   * Tạo định mức chỉ mới
   * @param data - CreateStyleThreadSpecDTO
   * @returns Created style thread spec
   */
  async create(data: CreateStyleThreadSpecDTO): Promise<StyleThreadSpec> {
    const response = await fetchApi<ApiResponse<StyleThreadSpec>>(BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể tạo định mức chỉ')
    }

    return response.data
  },

  /**
   * Cập nhật định mức chỉ
   * @param id - Style thread spec ID
   * @param data - UpdateStyleThreadSpecDTO
   * @returns Updated style thread spec
   */
  async update(id: number, data: UpdateStyleThreadSpecDTO): Promise<StyleThreadSpec> {
    const response = await fetchApi<ApiResponse<StyleThreadSpec>>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể cập nhật định mức chỉ')
    }

    return response.data
  },

  /**
   * Xóa định mức chỉ
   * @param id - Style thread spec ID
   */
  async delete(id: number): Promise<void> {
    const response = await fetchApi<ApiResponse<void>>(`${BASE}/${id}`, {
      method: 'DELETE',
    })

    if (response.error) {
      throw new Error(response.error)
    }
  },

  /**
   * Lấy danh sách định mức chỉ theo màu
   * @param specId - Style thread spec ID
   * @returns Array of color specs
   */
  async getColorSpecs(specId: number): Promise<StyleColorThreadSpec[]> {
    const response = await fetchApi<ApiResponse<StyleColorThreadSpec[]>>(`${BASE}/${specId}/color-specs`)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Thêm định mức chỉ theo màu
   * @param specId - Style thread spec ID
   * @param data - CreateStyleColorThreadSpecDTO
   * @returns Created color spec
   */
  async addColorSpec(specId: number, data: CreateStyleColorThreadSpecDTO): Promise<StyleColorThreadSpec> {
    const response = await fetchApi<ApiResponse<StyleColorThreadSpec>>(`${BASE}/${specId}/color-specs`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể thêm định mức chỉ theo màu')
    }

    return response.data
  },
}
