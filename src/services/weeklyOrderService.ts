/**
 * Weekly Order Service
 *
 * API client for weekly thread ordering operations.
 * Handles CRUD for weekly orders and calculation results.
 */

import { fetchApi } from './api'
import type {
  ThreadOrderWeek,
  CreateWeeklyOrderDTO,
  UpdateWeeklyOrderDTO,
  WeeklyOrderResults,
  AggregatedRow,
  OrderedQuantityInfo,
  WeekHistoryGroup,
  HistoryByWeekFilter,
} from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}


const BASE = '/api/weekly-orders'

export const weeklyOrderService = {
  /**
   * Lấy danh sách tất cả tuần đặt hàng
   * @param params - Optional filters (status)
   * @returns Array of weekly orders
   */
  async getAll(params?: { status?: string }): Promise<ThreadOrderWeek[]> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append('status', params.status)

    const queryString = searchParams.toString()
    const url = queryString ? `${BASE}?${queryString}` : BASE

    const response = await fetchApi<ApiResponse<ThreadOrderWeek[]>>(url)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Lấy thông tin tuần đặt hàng theo ID
   * @param id - Weekly order ID
   * @returns Weekly order with items
   */
  async getById(id: number): Promise<ThreadOrderWeek> {
    const response = await fetchApi<ApiResponse<ThreadOrderWeek>>(`${BASE}/${id}`)

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không tìm thấy tuần đặt hàng')
    }

    return response.data
  },

  /**
   * Tạo tuần đặt hàng mới với danh sách items
   * @param dto - CreateWeeklyOrderDTO with week_name and items
   * @returns Created weekly order
   */
  async create(dto: CreateWeeklyOrderDTO): Promise<ThreadOrderWeek> {
    const response = await fetchApi<ApiResponse<ThreadOrderWeek>>(BASE, {
      method: 'POST',
      body: JSON.stringify(dto),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể tạo tuần đặt hàng')
    }

    return response.data
  },

  /**
   * Cập nhật tuần đặt hàng
   * @param id - Weekly order ID
   * @param dto - UpdateWeeklyOrderDTO with fields to update
   * @returns Updated weekly order
   */
  async update(id: number, dto: UpdateWeeklyOrderDTO): Promise<ThreadOrderWeek> {
    const response = await fetchApi<ApiResponse<ThreadOrderWeek>>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể cập nhật tuần đặt hàng')
    }

    return response.data
  },

  /**
   * Xóa tuần đặt hàng
   * @param id - Weekly order ID
   */
  async remove(id: number): Promise<void> {
    const response = await fetchApi<ApiResponse<null>>(`${BASE}/${id}`, {
      method: 'DELETE',
    })

    if (response.error) {
      throw new Error(response.error)
    }
  },

  /**
   * Cập nhật trạng thái tuần đặt hàng (draft -> confirmed -> cancelled)
   * @param id - Weekly order ID
   * @param status - New status
   * @returns Updated weekly order
   */
  async updateStatus(id: number, status: string): Promise<ThreadOrderWeek> {
    const response = await fetchApi<ApiResponse<ThreadOrderWeek>>(`${BASE}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể cập nhật trạng thái')
    }

    return response.data
  },

  /**
   * Lưu kết quả tính toán định mức cho tuần đặt hàng
   * @param id - Weekly order ID
   * @param data - Calculation and summary data
   * @returns Saved results
   */
  async saveResults(
    id: number,
    data: { calculation_data: unknown; summary_data: unknown }
  ): Promise<WeeklyOrderResults> {
    const response = await fetchApi<ApiResponse<WeeklyOrderResults>>(`${BASE}/${id}/results`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể lưu kết quả tính toán')
    }

    return response.data
  },

  /**
   * Lấy kết quả tính toán định mức đã lưu
   * @param id - Weekly order ID
   * @returns Calculation results
   */
  async getResults(id: number): Promise<WeeklyOrderResults> {
    const response = await fetchApi<ApiResponse<WeeklyOrderResults>>(`${BASE}/${id}/results`)

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không tìm thấy kết quả tính toán')
    }

    return response.data
  },

  async enrichInventory(rows: AggregatedRow[]): Promise<AggregatedRow[]> {
    const response = await fetchApi<ApiResponse<AggregatedRow[]>>(`${BASE}/enrich-inventory`, {
      method: 'POST',
      body: JSON.stringify({ summary_rows: rows }),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || rows
  },

  /**
   * Cập nhật định mức (quota_cones) cho một loại chỉ
   * @param weekId - Weekly order ID
   * @param threadTypeId - Thread type ID
   * @param quotaCones - New quota value
   */
  async updateQuotaCones(weekId: number, threadTypeId: number, quotaCones: number): Promise<void> {
    const response = await fetchApi<ApiResponse<unknown>>(`${BASE}/items/${weekId}/quota`, {
      method: 'PUT',
      body: JSON.stringify({ thread_type_id: threadTypeId, quota_cones: quotaCones }),
    })

    if (response.error) {
      throw new Error(response.error)
    }
  },

  async getOrderedQuantities(
    pairs: Array<{ po_id: number; style_id: number }>,
    excludeWeekId?: number,
  ): Promise<OrderedQuantityInfo[]> {
    const searchParams = new URLSearchParams()
    searchParams.append('po_style_pairs', JSON.stringify(pairs))
    if (excludeWeekId) searchParams.append('exclude_week_id', String(excludeWeekId))

    const response = await fetchApi<ApiResponse<OrderedQuantityInfo[]>>(
      `${BASE}/ordered-quantities?${searchParams.toString()}`,
    )

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  async getHistoryByWeek(
    filters: HistoryByWeekFilter,
  ): Promise<{ data: WeekHistoryGroup[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const searchParams = new URLSearchParams()
    if (filters.po_id) searchParams.append('po_id', String(filters.po_id))
    if (filters.style_id) searchParams.append('style_id', String(filters.style_id))
    if (filters.from_date) searchParams.append('from_date', filters.from_date)
    if (filters.to_date) searchParams.append('to_date', filters.to_date)
    if (filters.status) searchParams.append('status', filters.status)
    if (filters.page) searchParams.append('page', String(filters.page))
    if (filters.limit) searchParams.append('limit', String(filters.limit))

    const response = await fetchApi<any>(
      `${BASE}/history-by-week?${searchParams.toString()}`,
    )

    if (response.error) {
      throw new Error(response.error)
    }

    return {
      data: response.data || [],
      pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    }
  },
}
