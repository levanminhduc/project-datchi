import { fetchApi } from './api'
import type { ApiResponse } from '@/types'
import type {
  DeptAllocationSummary,
  DeptAllocateResponse,
  DeptAllocationLog,
} from '@/types/thread/deptAllocation'

const BASE = '/api/dept-allocations'

export const deptAllocationService = {
  async getSummary(poId: number, styleId: number, styleColorId: number): Promise<DeptAllocationSummary> {
    const params = new URLSearchParams({
      po_id: String(poId),
      style_id: String(styleId),
      style_color_id: String(styleColorId),
    })
    const response = await fetchApi<ApiResponse<DeptAllocationSummary>>(`${BASE}/summary?${params}`)
    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể tải thông tin phân bổ')
    }
    return response.data
  },

  async allocate(data: {
    po_id: number
    style_id: number
    style_color_id: number
    department: string
    add_quantity: number
    created_by: string
  }): Promise<DeptAllocateResponse> {
    const response = await fetchApi<ApiResponse<DeptAllocateResponse>>(`${BASE}/allocate`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể phân bổ sản phẩm')
    }
    return response.data
  },

  async getLogs(
    poId: number,
    styleId: number,
    styleColorId: number,
    department?: string
  ): Promise<DeptAllocationLog[]> {
    const params = new URLSearchParams({
      po_id: String(poId),
      style_id: String(styleId),
      style_color_id: String(styleColorId),
    })
    if (department) params.append('department', department)
    const response = await fetchApi<ApiResponse<DeptAllocationLog[]>>(`${BASE}/logs?${params}`)
    if (response.error) {
      throw new Error(response.error)
    }
    return response.data || []
  },
}
