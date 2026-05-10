import { fetchApi } from './api'
import type {
  ReservedByPoResponse,
  TransferReservedBody,
  TransferReservedResult,
  PoSearchResult,
  TransferByCalcResponse,
  ThreadTransferHistoryEntry,
  PoTransferTransaction,
} from '@/types/transferReserved'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export const transferReservedService = {
  async getReservedByPo(weekId: number, warehouseId: number, toWarehouseId?: number | null) {
    const params = new URLSearchParams({ warehouse_id: String(warehouseId) })
    if (toWarehouseId != null) params.set('to_warehouse_id', String(toWarehouseId))
    return fetchApi<ApiResponse<ReservedByPoResponse>>(
      `/api/weekly-orders/${weekId}/reserved-by-po?${params.toString()}`,
    )
  },

  async getTransferByCalculation(weekId: number, warehouseId: number, toWarehouseId?: number | null) {
    const params = new URLSearchParams({ warehouse_id: String(warehouseId) })
    if (toWarehouseId != null) params.set('to_warehouse_id', String(toWarehouseId))
    return fetchApi<ApiResponse<TransferByCalcResponse>>(
      `/api/weekly-orders/${weekId}/transfer-by-calculation?${params.toString()}`,
    )
  },

  async getThreadTransferHistory(weekId: number, threadTypeId: number, threadColorId: number) {
    const params = new URLSearchParams({
      thread_type_id: String(threadTypeId),
      thread_color_id: String(threadColorId),
    })
    return fetchApi<ApiResponse<ThreadTransferHistoryEntry[]>>(
      `/api/weekly-orders/${weekId}/transfer-history-thread?${params.toString()}`,
    )
  },

  async getPoTransferHistory(weekId: number, poId: number, toWarehouseId?: number | null) {
    const params = new URLSearchParams({ po_id: String(poId) })
    if (toWarehouseId != null) params.set('to_warehouse_id', String(toWarehouseId))
    return fetchApi<ApiResponse<PoTransferTransaction[]>>(
      `/api/weekly-orders/${weekId}/transfer-history-po?${params.toString()}`,
    )
  },

  async searchPo(q: string): Promise<ApiResponse<PoSearchResult[]>> {
    return fetchApi<ApiResponse<PoSearchResult[]>>(
      `/api/weekly-orders/search-po?q=${encodeURIComponent(q)}`,
    )
  },

  async submit(weekId: number, body: TransferReservedBody) {
    return fetchApi<ApiResponse<TransferReservedResult>>(
      `/api/weekly-orders/${weekId}/transfer-reserved-cones`,
      { method: 'POST', body: JSON.stringify(body) },
    )
  },
}
