import { fetchApi } from './api'
import type { DeliveryRecord, UpdateDeliveryDTO, DeliveryFilter, ReceiveDeliveryDTO, DeliveryReceiveLog } from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export interface AutoReturnDetail {
  loan_id: number
  from_week_id: number
  from_week_name: string
  cones_returned: number
  fully_settled: boolean
}

interface ReceiveDeliveryResponse {
  cones_created: number
  cones_reserved: number
  remaining_shortage: number
  lot_number: string
  auto_return: {
    settled: number
    returned_cones: number
    details: AutoReturnDetail[]
  }
}

const BASE = '/api/weekly-orders'

export const deliveryService = {
  async getByWeek(weekId: number): Promise<DeliveryRecord[]> {
    const response = await fetchApi<ApiResponse<DeliveryRecord[]>>(`${BASE}/${weekId}/deliveries`)
    if (response.error) throw new Error(response.error)
    return response.data || []
  },

  async update(deliveryId: number, dto: UpdateDeliveryDTO): Promise<DeliveryRecord> {
    const response = await fetchApi<ApiResponse<DeliveryRecord>>(`${BASE}/deliveries/${deliveryId}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    })
    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không thể cập nhật thông tin giao hàng')
    return response.data
  },

  async getOverview(filters?: DeliveryFilter): Promise<DeliveryRecord[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.week_id) params.append('week_id', String(filters.week_id))
    const queryString = params.toString()
    const url = queryString ? `${BASE}/deliveries/overview?${queryString}` : `${BASE}/deliveries/overview`

    const response = await fetchApi<ApiResponse<DeliveryRecord[]>>(url)
    if (response.error) throw new Error(response.error)
    return response.data || []
  },

  async receiveDelivery(deliveryId: number, dto: ReceiveDeliveryDTO): Promise<ReceiveDeliveryResponse> {
    const response = await fetchApi<ApiResponse<ReceiveDeliveryResponse>>(`${BASE}/deliveries/${deliveryId}/receive`, {
      method: 'POST',
      body: JSON.stringify(dto),
    })
    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Không thể nhập kho')
    return response.data
  },

  async getReceiveLogs(params: { delivery_id?: number; week_id?: number; limit?: number }): Promise<DeliveryReceiveLog[]> {
    const searchParams = new URLSearchParams()
    if (params.delivery_id) searchParams.append('delivery_id', String(params.delivery_id))
    if (params.week_id) searchParams.append('week_id', String(params.week_id))
    if (params.limit) searchParams.append('limit', String(params.limit))
    const queryString = searchParams.toString()
    const url = queryString ? `${BASE}/deliveries/receive-logs?${queryString}` : `${BASE}/deliveries/receive-logs`

    const response = await fetchApi<ApiResponse<DeliveryReceiveLog[]>>(url)
    if (response.error) throw new Error(response.error)
    return response.data || []
  },
}
