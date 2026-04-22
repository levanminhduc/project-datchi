import { fetchApi } from './api'
import type {
  ReservedByPoResponse,
  TransferReservedBody,
  TransferReservedResult,
} from '@/types/transferReserved'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export const transferReservedService = {
  async getReservedByPo(weekId: number, warehouseId: number) {
    return fetchApi<ApiResponse<ReservedByPoResponse>>(
      `/api/weekly-orders/${weekId}/reserved-by-po?warehouse_id=${warehouseId}`,
    )
  },

  async submit(weekId: number, body: TransferReservedBody) {
    return fetchApi<ApiResponse<TransferReservedResult>>(
      `/api/weekly-orders/${weekId}/transfer-reserved-cones`,
      { method: 'POST', body: JSON.stringify(body) },
    )
  },
}
