/**
 * Batch Service
 *
 * API client for batch operations (receive, transfer, issue, return).
 */

import { fetchApi } from './api'
import type {
  BatchReceiveRequest,
  BatchTransferRequest,
  BatchIssueRequest,
  BatchReturnRequest,
  BatchOperationResponse,
  BatchTransaction,
  BatchTransactionFilters,
  TransferableSummaryItem,
  TransferHistoryFilters,
  TransferHistoryResponse,
  TransferHistorySummaryResponse
} from '@/types/thread/batch'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

function convertDateFormat(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return dateStr
}

export const batchService = {
  /**
   * Nhập kho hàng loạt
   */
  async receive(data: BatchReceiveRequest): Promise<BatchOperationResponse> {
    const response = await fetchApi<ApiResponse<BatchOperationResponse>>('/api/batch/receive', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Chuyển kho hàng loạt
   */
  async transfer(data: BatchTransferRequest): Promise<BatchOperationResponse> {
    const response = await fetchApi<ApiResponse<BatchOperationResponse>>('/api/batch/transfer', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Xuất kho hàng loạt
   */
  async issue(data: BatchIssueRequest): Promise<BatchOperationResponse> {
    const response = await fetchApi<ApiResponse<BatchOperationResponse>>('/api/batch/issue', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Trả lại cuộn
   */
  async return(data: BatchReturnRequest): Promise<BatchOperationResponse> {
    const response = await fetchApi<ApiResponse<BatchOperationResponse>>('/api/batch/return', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Lấy danh sách thao tác batch
   */
  async getTransactions(filters?: BatchTransactionFilters): Promise<BatchTransaction[]> {
    const params = new URLSearchParams()
    if (filters?.operation_type) params.append('operation_type', filters.operation_type)
    if (filters?.lot_id) params.append('lot_id', filters.lot_id.toString())
    if (filters?.warehouse_id) params.append('warehouse_id', filters.warehouse_id.toString())
    if (filters?.from_date) params.append('from_date', convertDateFormat(filters.from_date))
    if (filters?.to_date) params.append('to_date', convertDateFormat(filters.to_date))

    const url = `/api/batch/transactions${params.toString() ? '?' + params.toString() : ''}`
    const response = await fetchApi<ApiResponse<BatchTransaction[]>>(url)
    return response.data || []
  },

  /**
   * Lấy chi tiết thao tác
   */
  async getTransaction(id: number): Promise<BatchTransaction> {
    const response = await fetchApi<ApiResponse<BatchTransaction>>(`/api/batch/transactions/${id}`)
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  async getTransferableSummary(warehouseId: number): Promise<TransferableSummaryItem[]> {
    const response = await fetchApi<ApiResponse<TransferableSummaryItem[]>>(
      `/api/batch/transferable-summary?warehouse_id=${warehouseId}`
    )
    if (response.error) throw new Error(response.error)
    return response.data || []
  },

  async getTransferHistory(params: {
    filters: TransferHistoryFilters
    page: number
    pageSize: number
    sortBy: string
    descending: boolean
  }): Promise<TransferHistoryResponse> {
    const urlParams = new URLSearchParams()
    urlParams.append('page', params.page.toString())
    urlParams.append('page_size', params.pageSize.toString())
    urlParams.append('sort_by', params.sortBy)
    urlParams.append('descending', params.descending.toString())

    const { filters } = params
    if (filters.from_warehouse_id) urlParams.append('from_warehouse_id', filters.from_warehouse_id.toString())
    if (filters.to_warehouse_id) urlParams.append('to_warehouse_id', filters.to_warehouse_id.toString())
    if (filters.from_date) urlParams.append('from_date', convertDateFormat(filters.from_date))
    if (filters.to_date) urlParams.append('to_date', convertDateFormat(filters.to_date))
    if (filters.search) urlParams.append('search', filters.search)

    const response = await fetchApi<TransferHistoryResponse>(`/api/batch/transfer-history?${urlParams.toString()}`)
    if (response.error) throw new Error(response.error)
    return response
  },

  async getTransferHistorySummary(filters: TransferHistoryFilters): Promise<TransferHistorySummaryResponse> {
    const urlParams = new URLSearchParams()
    if (filters.from_warehouse_id) urlParams.append('from_warehouse_id', filters.from_warehouse_id.toString())
    if (filters.to_warehouse_id) urlParams.append('to_warehouse_id', filters.to_warehouse_id.toString())
    if (filters.from_date) urlParams.append('from_date', convertDateFormat(filters.from_date))
    if (filters.to_date) urlParams.append('to_date', convertDateFormat(filters.to_date))
    if (filters.search) urlParams.append('search', filters.search)

    const qs = urlParams.toString()
    const response = await fetchApi<TransferHistorySummaryResponse>(`/api/batch/transfer-history/summary${qs ? '?' + qs : ''}`)
    if (response.error) throw new Error(response.error)
    return response
  }
}
