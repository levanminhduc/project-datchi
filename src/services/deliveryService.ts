import { fetchApi } from './api'
import type { DeliveryRecord, UpdateDeliveryDTO, DeliveryFilter, ReceiveDeliveryDTO } from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

interface ReceiveDeliveryResponse {
  delivery: DeliveryRecord
  cones_created: number
  lot_number: string
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
}
