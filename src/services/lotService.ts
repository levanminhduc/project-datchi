/**
 * Lot Service
 *
 * API client for lot management operations.
 */

import { fetchApi } from './api'
import type { Lot, LotStatus, CreateLotRequest, UpdateLotRequest, LotFilters } from '@/types/thread/lot'
import type { Cone } from '@/types/thread/inventory'
import type { BatchTransaction } from '@/types/thread/batch'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export const lotService = {
  /**
   * Tạo lô mới
   */
  async create(data: CreateLotRequest): Promise<Lot> {
    const response = await fetchApi<ApiResponse<Lot>>('/api/lots', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Lấy danh sách lô với filters
   */
  async getAll(filters?: LotFilters): Promise<Lot[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.warehouse_id) params.append('warehouse_id', filters.warehouse_id.toString())
    if (filters?.thread_type_id) params.append('thread_type_id', filters.thread_type_id.toString())
    if (filters?.search) params.append('search', filters.search)

    const url = `/api/lots${params.toString() ? '?' + params.toString() : ''}`
    const response = await fetchApi<ApiResponse<Lot[]>>(url)
    return response.data || []
  },

  /**
   * Lấy thông tin chi tiết lô
   */
  async getById(id: number): Promise<Lot> {
    const response = await fetchApi<ApiResponse<Lot>>(`/api/lots/${id}`)
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Cập nhật thông tin lô
   */
  async update(id: number, data: UpdateLotRequest): Promise<Lot> {
    const response = await fetchApi<ApiResponse<Lot>>(`/api/lots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Lấy danh sách cuộn trong lô
   */
  async getCones(lotId: number): Promise<Cone[]> {
    const response = await fetchApi<ApiResponse<Cone[]>>(`/api/lots/${lotId}/cones`)
    return response.data || []
  },

  /**
   * Lấy lịch sử thao tác của lô
   */
  async getTransactions(lotId: number): Promise<BatchTransaction[]> {
    const response = await fetchApi<ApiResponse<BatchTransaction[]>>(`/api/lots/${lotId}/transactions`)
    return response.data || []
  },

  /**
   * Thay đổi trạng thái lô (quarantine/release)
   */
  async setStatus(id: number, status: LotStatus): Promise<Lot> {
    return this.update(id, { status })
  }
}
