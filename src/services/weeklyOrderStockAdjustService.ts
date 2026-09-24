import { fetchApi } from './api'

const BASE = '/api/weekly-orders'

export interface StockAdjustConeRow {
  id: number
  cone_id: string
  status: string
  warehouse_name: string | null
  received_date: string | null
  lot_number: string | null
}

export interface StockAdjustPreview {
  current_cones: number
  locked_cones: number
  actual_cones: number
  write_off_cones: number
  cones: StockAdjustConeRow[]
}

export interface StockAdjustResult {
  success: boolean
  written_off: number
  cone_ids: number[]
}

export interface RevertReceiveResult {
  success: boolean
  week_id: number
  delivery_id: number
  reverted_quantity: number
  written_off: number
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export const weeklyOrderStockAdjustService = {
  async preview(
    weekId: number,
    threadTypeId: number,
    threadColorId: number | null,
    actualCones: number,
  ): Promise<StockAdjustPreview> {
    const response = await fetchApi<ApiResponse<StockAdjustPreview>>(
      `${BASE}/${weekId}/stock-adjust/preview`,
      {
        method: 'POST',
        body: JSON.stringify({
          thread_type_id: threadTypeId,
          thread_color_id: threadColorId,
          actual_cones: actualCones,
        }),
      },
    )

    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể xem trước điều chỉnh tồn kho')
    }

    return response.data
  },

  async adjust(
    weekId: number,
    threadTypeId: number,
    threadColorId: number | null,
    actualCones: number,
    reason: string,
    expectedCurrentCones: number,
  ): Promise<StockAdjustResult> {
    const response = await fetchApi<ApiResponse<StockAdjustResult>>(`${BASE}/${weekId}/stock-adjust`, {
      method: 'POST',
      body: JSON.stringify({
        thread_type_id: threadTypeId,
        thread_color_id: threadColorId,
        actual_cones: actualCones,
        reason,
        expected_current_cones: expectedCurrentCones,
      }),
    })

    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể điều chỉnh tồn kho')
    }

    return response.data
  },

  async revertReceive(logId: number, reason: string): Promise<RevertReceiveResult> {
    const response = await fetchApi<ApiResponse<RevertReceiveResult>>(
      `${BASE}/deliveries/receive-logs/${logId}/revert`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    )

    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể hoàn tác lần nhập kho')
    }

    return response.data
  },
}
