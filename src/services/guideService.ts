import { fetchApi, fetchApiRaw } from './api'
import type { ApiResponse } from '@/types/employee'
import type { Guide, GuideListItem, CreateGuideData, UpdateGuideData } from '@/types/guides'

const BASE = '/api/guides'

export const guideService = {
  async getAll(search?: string): Promise<GuideListItem[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    const response = await fetchApi<ApiResponse<GuideListItem[]>>(`${BASE}${params}`)
    return response.data || []
  },

  async getBySlug(slug: string): Promise<Guide | null> {
    const response = await fetchApi<ApiResponse<Guide>>(`${BASE}/${slug}`)
    return response.data
  },

  async getById(id: string): Promise<Guide | null> {
    const response = await fetchApi<ApiResponse<Guide>>(`${BASE}/${id}`)
    return response.data
  },

  async create(data: CreateGuideData): Promise<Guide> {
    const response = await fetchApi<ApiResponse<Guide>>(BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data!
  },

  async update(id: string, data: UpdateGuideData): Promise<Guide> {
    const response = await fetchApi<ApiResponse<Guide>>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response.data!
  },

  async remove(id: string): Promise<void> {
    await fetchApi<ApiResponse<Guide>>(`${BASE}/${id}`, { method: 'DELETE' })
  },

  async togglePublish(id: string): Promise<Guide> {
    const response = await fetchApi<ApiResponse<Guide>>(`${BASE}/${id}/publish`, {
      method: 'PATCH',
    })
    return response.data!
  },

  async reorder(id: string, sortOrder: number): Promise<void> {
    await fetchApi<ApiResponse<Guide>>(`${BASE}/${id}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ sort_order: sortOrder }),
    })
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetchApiRaw(`${BASE}/upload-image`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => null)
      throw new Error((err as Record<string, string>)?.error || 'Lỗi khi tải ảnh lên')
    }

    const result = await response.json() as ApiResponse<{ url: string }>
    return result.data!.url
  },
}
