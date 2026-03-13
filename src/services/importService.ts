import { fetchApi, fetchApiRaw } from './api'
import type {
  ImportMappingConfig,
  ImportTexRow,
  ImportTexResponse,
  ImportColorRow,
  ImportColorResponse,
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
