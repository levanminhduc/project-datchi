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
  // Request workflow filters
  if (filters.requesting_warehouse_id !== undefined) params.append('requesting_warehouse_id', String(filters.requesting_warehouse_id))
  if (filters.source_warehouse_id !== undefined) params.append('source_warehouse_id', String(filters.source_warehouse_id))
  if (filters.workflow_status) params.append('workflow_status', filters.workflow_status)
  if (filters.is_request) params.append('is_request', 'true')

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

  /**
   * Escalate a conflict to management
   * @param conflictId - Conflict ID to escalate
   * @param notes - Optional notes for escalation
   * @returns Updated conflict
   */
  async escalate(conflictId: number, notes?: string): Promise<AllocationConflict> {
    const response = await fetchApi<ApiResponse<AllocationConflict>>(
      `/api/allocations/conflicts/${conflictId}/escalate`,
      {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }
    )

    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể leo thang xung đột')
    }

    return response.data
  },

  /**
   * Chia nhỏ phân bổ thành hai phân bổ riêng biệt
   * Giải phóng tất cả cone đã phân bổ và đặt cả hai phân bổ về trạng thái PENDING
   * @param id - Allocation ID to split
   * @param splitMeters - Number of meters for the new allocation
   * @param reason - Optional reason for the split
   * @returns Split result with both allocations
   */
  async split(
    id: number,
    splitMeters: number,
    reason?: string
  ): Promise<{
    original: Allocation
    new_allocation: Allocation
    result: {
      success: boolean
      original_allocation_id: number
      new_allocation_id: number
      original_meters: number
      split_meters: number
      message: string
    }
  }> {
    const response = await fetchApi<
      ApiResponse<{
        original: Allocation
        new_allocation: Allocation
        result: {
          success: boolean
          original_allocation_id: number
          new_allocation_id: number
          original_meters: number
          split_meters: number
          message: string
        }
      }>
    >(`/api/allocations/${id}/split`, {
      method: 'POST',
      body: JSON.stringify({ split_meters: splitMeters, reason }),
    })

    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể chia nhỏ phân bổ')
    }

    return response.data
  },

  // ============ REQUEST WORKFLOW METHODS ============

  /**
   * Lấy danh sách yêu cầu chỉ (có requesting_warehouse_id)
   * @param filters - Optional filters
   * @returns Array of thread requests
   */
  async getRequests(filters?: AllocationFilters): Promise<Allocation[]> {
    return this.getAll({ ...filters, is_request: true })
  },

  /**
   * Duyệt yêu cầu chỉ
   * Chuyển trạng thái từ PENDING -> APPROVED
   * @param id - Request ID
   * @param approvedBy - Person approving
   * @returns Updated allocation
   */
  async approve(id: number, approvedBy: string): Promise<Allocation> {
    const response = await fetchApi<ApiResponse<Allocation>>(
      `/api/allocations/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ approved_by: approvedBy }),
      }
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể duyệt yêu cầu')
    }

    return response.data
  },

  /**
   * Từ chối yêu cầu chỉ
   * Chuyển trạng thái từ PENDING -> REJECTED
   * @param id - Request ID
   * @param rejectedBy - Person rejecting
   * @param reason - Rejection reason
   * @returns Updated allocation
   */
  async reject(id: number, rejectedBy: string, reason: string): Promise<Allocation> {
    const response = await fetchApi<ApiResponse<Allocation>>(
      `/api/allocations/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ rejected_by: rejectedBy, reason }),
      }
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể từ chối yêu cầu')
    }

    return response.data
  },

  /**
   * Đánh dấu sẵn sàng nhận
   * Chuyển trạng thái từ APPROVED -> READY_FOR_PICKUP
   * Thực hiện phân bổ mềm để đặt chỗ cone
   * @param id - Request ID
   * @returns Updated allocation with allocated cones
   */
  async markReady(id: number): Promise<Allocation> {
    const response = await fetchApi<ApiResponse<Allocation>>(
      `/api/allocations/${id}/ready`,
      { method: 'POST' }
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể đánh dấu sẵn sàng')
    }

    return response.data
  },

  /**
   * Xác nhận đã nhận chỉ
   * Chuyển trạng thái từ READY_FOR_PICKUP -> RECEIVED
   * Xuất cone cho xưởng
   * @param id - Request ID
   * @param receivedBy - Person receiving
   * @returns Updated allocation
   */
  async confirmReceived(id: number, receivedBy: string): Promise<Allocation> {
    const response = await fetchApi<ApiResponse<Allocation>>(
      `/api/allocations/${id}/receive`,
      {
        method: 'POST',
        body: JSON.stringify({ received_by: receivedBy }),
      }
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể xác nhận nhận hàng')
    }

    return response.data
  },
}
