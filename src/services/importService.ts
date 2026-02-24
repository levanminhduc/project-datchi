import { fetchApi } from './api'
import { supabase } from '@/lib/supabase'
import type {
  ImportMappingConfig,
  ImportTexRow,
  ImportTexResponse,
  ImportColorRow,
  ImportColorResponse,
} from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

async function authenticatedDownload(endpoint: string, filename: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })

  if (!response.ok) {
    throw new Error('Không thể tải file mẫu')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const importService = {
  async getImportMapping(key: string): Promise<ImportMappingConfig> {
    const response = await fetchApi<ApiResponse<{ key: string; value: ImportMappingConfig }>>(`/api/settings/${key}`)
    if (!response.data) throw new Error(response.error || 'Không tìm thấy cấu hình import')
    return response.data.value
  },

  async importSupplierTex(rows: ImportTexRow[]): Promise<ImportTexResponse> {
    const response = await fetchApi<ApiResponse<ImportTexResponse>>('/api/import/supplier-tex', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    })
    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không nhận được kết quả import')
    return response.data
  },

  async importSupplierColors(supplierId: number, rows: ImportColorRow[]): Promise<ImportColorResponse> {
    const response = await fetchApi<ApiResponse<ImportColorResponse>>('/api/import/supplier-colors', {
      method: 'POST',
      body: JSON.stringify({ supplier_id: supplierId, rows }),
    })
    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không nhận được kết quả import')
    return response.data
  },

  async downloadTexTemplate(): Promise<void> {
    await authenticatedDownload('/api/import/template/supplier-tex', 'template-import-ncc-tex.xlsx')
  },

  async downloadColorTemplate(): Promise<void> {
    await authenticatedDownload('/api/import/template/supplier-colors', 'template-import-mau-ncc.xlsx')
  },
}
