import { fetchApi, fetchApiRaw } from './api'
import { supabase } from '@/lib/supabase'
import type {
  ImportMappingConfig,
  ImportTexRow,
  ImportTexResponse,
  ImportColorRow,
  ImportColorResponse,
  ImportStreamEvent,
  ImportStreamProgress,
  ImportStreamDone,
  POImportPreview,
  POImportResult,
} from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

async function authenticatedDownload(endpoint: string, filename: string): Promise<void> {
  const response = await fetchApiRaw(endpoint)

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

function parseSSELine(line: string): { event?: string; data?: string } | null {
  if (line.startsWith('event: ')) return { event: line.slice(7) }
  if (line.startsWith('data: ')) return { data: line.slice(6) }
  return null
}

export const importService = {
  async getSupplierTexMapping(): Promise<ImportMappingConfig> {
    const response = await fetchApi<ApiResponse<ImportMappingConfig>>('/api/import/mapping/supplier-tex')
    if (!response.data) throw new Error(response.error || 'Không tìm thấy cấu hình import')
    return response.data
  },

  async getSupplierColorMapping(): Promise<ImportMappingConfig> {
    const response = await fetchApi<ApiResponse<ImportMappingConfig>>('/api/import/mapping/supplier-colors')
    if (!response.data) throw new Error(response.error || 'Không tìm thấy cấu hình import')
    return response.data
  },

  async previewSupplierTex(rows: ImportTexRow[]): Promise<ImportTexRow[]> {
    const response = await fetchApi<ApiResponse<{ rows: ImportTexRow[] }>>('/api/import/supplier-tex/preview', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    })
    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không nhận được dữ liệu xem trước')
    return response.data.rows
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

  async importSupplierColorsStream(
    supplierId: number,
    rows: ImportColorRow[],
    onProgress: (event: ImportStreamEvent) => void
  ): Promise<ImportColorResponse> {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) throw new Error('Chưa đăng nhập')

    const response = await fetch('/api/import/supplier-colors/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ supplier_id: supplierId, rows }),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw new Error(errorBody?.error || `Lỗi server: ${response.status}`)
    }

    if (!response.body) throw new Error('Server không hỗ trợ streaming')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finalResult: ImportColorResponse | null = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let currentEvent = ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) {
          currentEvent = ''
          continue
        }

        const parsed = parseSSELine(trimmed)
        if (!parsed) continue

        if (parsed.event) {
          currentEvent = parsed.event
        } else if (parsed.data && currentEvent) {
          try {
            const data = JSON.parse(parsed.data)

            if (currentEvent === 'progress') {
              onProgress({ type: 'progress', data: data as ImportStreamProgress })
            } else if (currentEvent === 'done') {
              finalResult = data as ImportColorResponse
              onProgress({ type: 'done', data: data as ImportStreamDone })
            } else if (currentEvent === 'error') {
              onProgress({ type: 'error', data })
              throw new Error(data.message || 'Lỗi khi import')
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) {
              console.error('SSE parse error:', parsed.data)
              continue
            }
            throw parseErr
          }
        }
      }
    }

    if (!finalResult) throw new Error('Không nhận được kết quả import')
    return finalResult
  },

  async downloadTexTemplate(): Promise<void> {
    await authenticatedDownload('/api/import/template/supplier-tex', 'template-import-ncc-tex.xlsx')
  },

  async downloadColorTemplate(): Promise<void> {
    await authenticatedDownload('/api/import/template/supplier-colors', 'template-import-mau-ncc.xlsx')
  },

  // ================== PO Items Import ==================

  async getPOImportMapping(): Promise<ImportMappingConfig> {
    const response = await fetchApi<ApiResponse<ImportMappingConfig>>('/api/import/mapping/po-items')
    if (!response.data) throw new Error(response.error || 'Không tìm thấy cấu hình import PO')
    return response.data
  },

  async parsePOItems(rows: Array<{
    row_number: number
    customer_name?: string
    po_number: string
    style_code: string
    week?: string
    description?: string
    finished_product_code?: string
    quantity: number
  }>): Promise<POImportPreview> {
    const response = await fetchApi<ApiResponse<POImportPreview>>('/api/import/po-items/parse', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    })
    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không nhận được dữ liệu preview')
    return response.data
  },

  async executePOImport(validRows: POImportPreview['valid_rows']): Promise<POImportResult> {
    const response = await fetchApi<ApiResponse<POImportResult>>('/api/import/po-items/execute', {
      method: 'POST',
      body: JSON.stringify({ rows: validRows }),
    })

    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không nhận được kết quả import')
    return response.data
  },

  async downloadPOTemplate(): Promise<void> {
    await authenticatedDownload('/api/import/template/po-items', 'template-import-po.xlsx')
  },
}
