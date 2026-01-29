/**
 * Allocation Service
 *
 * API client for thread allocation operations.
 * Handles soft/hard allocation, issuing, and conflict management.
 */

import { fetchApi } from './api'
import type {
  Allocation,
  AllocationFilters,
  CreateAllocationDTO,
  AllocationConflict,
} from '@/types/thread'
import { AllocationPriority } from '@/types/thread/enums'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

/**
 * Build query string from allocation filters
 */
function buildQueryString(filters?: AllocationFilters): string {
  if (!filters) return ''

  const params = new URLSearchParams()

  if (filters.order_id) params.append('order_id', filters.order_id)
  if (filters.thread_type_id !== undefined) params.append('thread_type_id', String(filters.thread_type_id))
  if (filters.status) params.append('status', filters.status)
  if (filters.priority) params.append('priority', filters.priority)
  if (filters.from_date) params.append('from_date', filters.from_date)
  if (filters.to_date) params.append('to_date', filters.to_date)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const allocationService = {
  /**
   * Lấy danh sách tất cả phân bổ với bộ lọc
   * @param filters - Optional filters for order_id, thread_type_id, status, priority, date range
   * @returns Array of allocations
   */
  async getAll(filters?: AllocationFilters): Promise<Allocation[]> {
    const queryString = buildQueryString(filters)
    const separator = queryString ? '&' : '?'
    const response = await fetchApi<ApiResponse<Allocation[]>>(
      `/api/allocations${queryString}${separator}limit=0`
    )

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Lấy thông tin phân bổ theo ID
   * @param id - Allocation ID
   * @returns Allocation with allocated cones
   * @throws Error if not found
   */
  async getById(id: number): Promise<Allocation> {
    const response = await fetchApi<ApiResponse<Allocation>>(`/api/allocations/${id}`)

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không tìm thấy phân bổ')
    }

    return response.data
  },

  /**
   * Tạo yêu cầu phân bổ mới (trạng thái PENDING)
   * @param data - CreateAllocationDTO with order_id, thread_type_id, requested_meters, priority
   * @returns Created allocation
   */
  async create(data: CreateAllocationDTO): Promise<Allocation> {
    const response = await fetchApi<ApiResponse<Allocation>>('/api/allocations', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể tạo phân bổ')
    }

    return response.data
  },

  /**
   * Thực hiện phân bổ mềm - đặt chỗ cone cho đơn hàng
   * Chuyển trạng thái từ PENDING -> SOFT
   * Cone được đánh dấu SOFT_ALLOCATED
   * @param id - Allocation ID
   * @returns Updated allocation with allocated cones
   */
  async execute(id: number): Promise<Allocation> {
    const response = await fetchApi<ApiResponse<Allocation>>(
      `/api/allocations/${id}/execute`,
      { method: 'POST' }
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể thực hiện phân bổ')
    }

    return response.data
  },

  /**
   * Xuất cone đã phân bổ cho sản xuất
   * Chuyển trạng thái từ SOFT/HARD -> ISSUED
   * Cone được đánh dấu IN_PRODUCTION
   * @param id - Allocation ID
   * @returns Updated allocation
   */
  async issue(id: number): Promise<Allocation> {
    const response = await fetchApi<ApiResponse<Allocation>>(
      `/api/allocations/${id}/issue`,
      { method: 'POST' }
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể xuất phân bổ')
    }

    return response.data
  },

  /**
   * Hủy phân bổ - giải phóng cone đã đặt chỗ
   * Chuyển trạng thái -> CANCELLED
   * Cone được trả về trạng thái AVAILABLE
   * @param id - Allocation ID
   * @returns Updated allocation
   */
  async cancel(id: number): Promise<Allocation> {
    const response = await fetchApi<ApiResponse<Allocation>>(
      `/api/allocations/${id}/cancel`,
      { method: 'POST' }
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể hủy phân bổ')
    }

    return response.data
  },

  /**
   * Lấy danh sách xung đột phân bổ đang hoạt động
   * Xung đột xảy ra khi tổng yêu cầu > tồn kho có sẵn
   * @returns Array of active conflicts
   */
  async getConflicts(): Promise<AllocationConflict[]> {
    const response = await fetchApi<ApiResponse<AllocationConflict[]>>(
      '/api/allocations/conflicts'
    )

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Giải quyết xung đột bằng cách điều chỉnh ưu tiên
   * Phân bổ có ưu tiên cao hơn sẽ được xử lý trước
   * @param id - Conflict ID
   * @param newPriority - New priority to apply
   * @returns Updated conflict with resolution
   */
  async resolveConflict(
    id: number,
    newPriority: AllocationPriority
  ): Promise<AllocationConflict> {
    const response = await fetchApi<ApiResponse<AllocationConflict>>(
      `/api/allocations/${id}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify({ priority: newPriority }),
      }
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể giải quyết xung đột')
    }

    return response.data
  },
}
