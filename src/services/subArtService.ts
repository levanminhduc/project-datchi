import { fetchApi, fetchApiRaw } from './api'
import type { ApiResponse } from '@/types'
import type { SubArt, ImportSubArtResult } from '@/types/thread/subArt'

const BASE = '/api/sub-arts'

export const subArtService = {
  async getAllCodes(): Promise<string[]> {
    const response = await fetchApi<ApiResponse<string[]>>(`${BASE}/codes`)
    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể tải danh sách mã Sub-Art')
    }
    return response.data
  },

  async getByStyleId(styleId: number, poId?: number): Promise<SubArt[]> {
    let url = `${BASE}?style_id=${styleId}`
    if (poId) url += `&po_id=${poId}`
    const response = await fetchApi<ApiResponse<SubArt[]>>(url)
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

  async downloadTemplate(): Promise<void> {
    const response = await fetchApiRaw(`${BASE}/template`)
    if (!response.ok) {
      throw new Error('Không thể tải file mẫu')
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-import-sub-art.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}
