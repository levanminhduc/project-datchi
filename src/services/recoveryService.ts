/**
 * Recovery API Service
 *
 * Handles API calls for thread cone recovery operations.
 * Supports initiating returns, weighing, confirming, and writing off cones.
 */

import { fetchApi } from './api'
import type {
  Recovery,
  RecoveryFilters,
  InitiateReturnDTO,
  WeighConeDTO,
  WriteOffDTO,
} from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

/**
 * Build query string from filters object
 * Handles undefined values by omitting them
 */
function buildQueryString(filters?: RecoveryFilters): string {
  if (!filters) return ''

  const params = new URLSearchParams()

  if (filters.status) params.append('status', filters.status)
  if (filters.cone_id) params.append('cone_id', filters.cone_id)
  if (filters.from_date) params.append('from_date', filters.from_date)
  if (filters.to_date) params.append('to_date', filters.to_date)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const recoveryService = {
  /**
   * Lấy tất cả bản ghi recovery với bộ lọc
   * @param filters - Optional filters for status, cone_id, date range
   * @returns Array of recovery records
   */
  async getAll(filters?: RecoveryFilters): Promise<Recovery[]> {
    const queryString = buildQueryString(filters)
    const separator = queryString ? '&' : '?'
    const response = await fetchApi<ApiResponse<Recovery[]>>(
      `/api/recovery${queryString}${separator}limit=0`
    )

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Lấy thông tin recovery theo ID
   * @param id - Recovery ID
   * @returns Recovery record with cone details
   */
  async getById(id: number): Promise<Recovery> {
    const response = await fetchApi<ApiResponse<Recovery>>(
      `/api/recovery/${id}`
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không tìm thấy bản ghi hoàn trả')
    }

    return response.data
  },

  /**
   * Khởi tạo hoàn trả cone (từ quét barcode)
   * Tạo bản ghi recovery với trạng thái INITIATED
   * @param data - InitiateReturnDTO with cone_id (barcode), returned_by, notes
   * @returns Created recovery record
   */
  async initiate(data: InitiateReturnDTO): Promise<Recovery> {
    const response = await fetchApi<ApiResponse<Recovery>>('/api/recovery', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể khởi tạo hoàn trả')
    }

    return response.data
  },

  /**
   * Ghi nhận trọng lượng cone đã hoàn trả
   * Tính toán số mét còn lại dựa trên trọng lượng
   * Chuyển trạng thái từ INITIATED/PENDING_WEIGH -> WEIGHED
   * @param id - Recovery ID
   * @param data - WeighConeDTO with weight_grams, optional tare_weight_grams
   * @returns Updated recovery with calculated meters
   */
  async weigh(id: number, data: WeighConeDTO): Promise<Recovery> {
    const response = await fetchApi<ApiResponse<Recovery>>(
      `/api/recovery/${id}/weigh`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể ghi nhận trọng lượng')
    }

    return response.data
  },

  /**
   * Xác nhận hoàn trả cone
   * Cập nhật inventory, chuyển trạng thái cone về AVAILABLE
   * Chuyển trạng thái recovery từ WEIGHED -> CONFIRMED
   * @param id - Recovery ID
   * @param confirmedBy - Optional confirmer name
   * @returns Updated recovery record
   */
  async confirm(id: number, confirmedBy?: string): Promise<Recovery> {
    const response = await fetchApi<ApiResponse<Recovery>>(
      `/api/recovery/${id}/confirm`,
      {
        method: 'POST',
        body: JSON.stringify({ confirmed_by: confirmedBy }),
      }
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể xác nhận hoàn trả')
    }

    return response.data
  },

  /**
   * Loại bỏ cone (write off)
   * Đánh dấu cone là WRITTEN_OFF, không trả về inventory
   * Dùng khi cone bị hỏng, lỗi, hoặc không đủ tiêu chuẩn
   * @param id - Recovery ID
   * @param data - WriteOffDTO with reason and approved_by
   * @returns Updated recovery record
   */
  async writeOff(id: number, data: WriteOffDTO): Promise<Recovery> {
    const response = await fetchApi<ApiResponse<Recovery>>(
      `/api/recovery/${id}/write-off`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể loại bỏ cuộn chỉ')
    }

    return response.data
  },

  /**
   * Lấy danh sách recovery đang chờ cân
   * Shortcut cho getAll với filter status = PENDING_WEIGH
   * @returns Array of pending weigh records
   */
  async getPending(): Promise<Recovery[]> {
    return this.getAll({ status: 'PENDING_WEIGH' as never })
  },
}
