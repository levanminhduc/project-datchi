/**
 * Style Service
 *
 * API client for style operations.
 */

import { fetchApi } from './api'
import type {
  Style,
  CreateStyleDTO,
  UpdateStyleDTO,
  StyleFilter,
  StyleThreadSpec,
} from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/styles'

function buildQueryString(filters?: StyleFilter): string {
  if (!filters) return ''

  const params = new URLSearchParams()

  if (filters.style_code) params.append('style_code', filters.style_code)
  if (filters.style_name) params.append('style_name', filters.style_name)
  if (filters.fabric_type) params.append('fabric_type', filters.fabric_type)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const styleService = {
  /**
   * Lấy danh sách tất cả mã hàng
   * @param filters - Optional filters
   * @returns Array of styles
   */
  async getAll(filters?: StyleFilter): Promise<Style[]> {
    const queryString = buildQueryString(filters)
    const response = await fetchApi<ApiResponse<Style[]>>(`${BASE}${queryString}`)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Lấy thông tin mã hàng theo ID
   * @param id - Style ID
   * @returns Style
   */
  async getById(id: number): Promise<Style> {
    const response = await fetchApi<ApiResponse<Style>>(`${BASE}/${id}`)

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không tìm thấy mã hàng')
    }

    return response.data
  },

  /**
   * Tạo mã hàng mới
   * @param data - CreateStyleDTO
   * @returns Created style
   */
  async create(data: CreateStyleDTO): Promise<Style> {
    const response = await fetchApi<ApiResponse<Style>>(BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể tạo mã hàng')
    }

    return response.data
  },

  /**
   * Cập nhật mã hàng
   * @param id - Style ID
   * @param data - UpdateStyleDTO
   * @returns Updated style
   */
  async update(id: number, data: UpdateStyleDTO): Promise<Style> {
    const response = await fetchApi<ApiResponse<Style>>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể cập nhật mã hàng')
    }

    return response.data
  },

  /**
   * Xóa mã hàng
   * @param id - Style ID
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
   * Lấy định mức chỉ của mã hàng
   * @param id - Style ID
   * @returns Array of style thread specs
   */
  async getThreadSpecs(id: number): Promise<StyleThreadSpec[]> {
    const response = await fetchApi<ApiResponse<StyleThreadSpec[]>>(`${BASE}/${id}/thread-specs`)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Lấy danh sách màu có định mức chỉ của mã hàng
   * @param id - Style ID
   * @returns Array of colors with thread specs configured
   */
  async getSpecColors(id: number): Promise<Array<{ id: number; name: string; hex_code: string }>> {
    const response = await fetchApi<ApiResponse<Array<{ id: number; name: string; hex_code: string }>>>(`${BASE}/${id}/spec-colors`)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },
}
