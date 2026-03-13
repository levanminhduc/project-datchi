import { fetchApi, fetchApiRaw } from './api'
import type { ApiResponse } from '@/types'
import type { SubArt, ImportSubArtResult } from '@/types/thread/subArt'

const BASE = '/api/sub-arts'

export const subArtService = {
  async getByStyleId(styleId: number): Promise<SubArt[]> {
    const response = await fetchApi<ApiResponse<SubArt[]>>(`${BASE}?style_id=${styleId}`)
    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể tải danh sách Sub-Art')
    }
    return response.data
  },

  async importExcel(file: File): Promise<ImportSubArtResult> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetchApiRaw(`${BASE}/import`, {
      method: 'POST',
      body: formData,
    })
    const payload = await response.json() as ApiResponse<ImportSubArtResult>
    if (!response.ok || payload.error || !payload.data) {
      throw new Error(payload.error || 'Không thể import Sub-Art')
    }
    return payload.data
  },
}
