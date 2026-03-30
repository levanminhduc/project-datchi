import { fetchApi } from './api'
import type { StyleColor, CreateStyleColorDTO, CloneStyleColorDTO } from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/style-colors'

export const styleColorService = {
  async getByStyleId(styleId: number): Promise<StyleColor[]> {
    const response = await fetchApi<ApiResponse<StyleColor[]>>(`${BASE}/${styleId}`)
    if (response.error) throw new Error(response.error)
    return response.data || []
  },

  async create(styleId: number, data: CreateStyleColorDTO): Promise<StyleColor> {
    const response = await fetchApi<ApiResponse<StyleColor>>(`${BASE}/${styleId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không thể tạo màu hàng')
    return response.data
  },

  async update(
    styleId: number,
    id: number,
    data: Partial<CreateStyleColorDTO & { is_active: boolean }>,
  ): Promise<StyleColor> {
    const response = await fetchApi<ApiResponse<StyleColor>>(`${BASE}/${styleId}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không thể cập nhật')
    return response.data
  },

  async remove(styleId: number, id: number): Promise<void> {
    const response = await fetchApi<ApiResponse<void>>(`${BASE}/${styleId}/${id}`, {
      method: 'DELETE',
    })
    if (response.error) throw new Error(response.error)
  },

  async clone(styleId: number, data: CloneStyleColorDTO): Promise<StyleColor> {
    const response = await fetchApi<ApiResponse<StyleColor>>(`${BASE}/${styleId}/clone`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không thể copy màu hàng')
    return response.data
  },
}
