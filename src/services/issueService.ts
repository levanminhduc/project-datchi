/**
 * Issue Service
 * Xuất kho sản xuất - Issue to Production
 *
 * Handles all HTTP operations for thread issuance management
 * Uses fetchApi for consistent error handling
 */

import { fetchApi } from './api'
import type { ApiResponse } from '@/types'
import type {
  IssueRequest,
  IssueItem,
  CreateIssueRequestDTO,
  AddIssueItemDTO,
  IssueRequestFilters,
  QuotaCheck,
} from '@/types/thread/issue'

export const issueService = {
  /**
   * Tạo phiếu xuất kho mới
   * @param data - Issue request form data
   * @returns Created issue request
   */
  async create(data: CreateIssueRequestDTO): Promise<IssueRequest> {
    const response = await fetchApi<ApiResponse<IssueRequest>>('/api/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.data) throw new Error(response.error || 'Không thể tạo phiếu xuất')
    return response.data
  },

  /**
   * Lấy danh sách phiếu xuất với bộ lọc
   * @param filters - Optional filter parameters
   * @returns Paginated list of issue requests
   */
  async list(filters?: IssueRequestFilters): Promise<{ data: IssueRequest[]; total: number }> {
    const params = new URLSearchParams()
    if (filters?.po_id) params.set('po_id', String(filters.po_id))
    if (filters?.style_id) params.set('style_id', String(filters.style_id))
    if (filters?.color_id) params.set('color_id', String(filters.color_id))
    if (filters?.status) params.set('status', filters.status)
    if (filters?.department) params.set('department', filters.department)
    if (filters?.date_from) params.set('date_from', filters.date_from)
    if (filters?.date_to) params.set('date_to', filters.date_to)

    const queryString = params.toString()
    const url = queryString ? `/api/issues?${queryString}` : '/api/issues'

    const response = await fetchApi<ApiResponse<{ data: IssueRequest[]; total: number }>>(url)
    return response.data || { data: [], total: 0 }
  },

  /**
   * Lấy chi tiết phiếu xuất theo ID
   * @param id - Issue request ID
   * @returns Issue request with items
   */
  async get(id: number): Promise<IssueRequest & { items: IssueItem[] }> {
    const response = await fetchApi<ApiResponse<IssueRequest & { items: IssueItem[] }>>(
      `/api/issues/${id}`
    )
    if (!response.data) throw new Error(response.error || 'Không tìm thấy phiếu xuất')
    return response.data
  },

  /**
   * Cập nhật phiếu xuất
   * @param id - Issue request ID
   * @param data - Update data (notes or status)
   * @returns Updated issue request
   */
  async update(
    id: number,
    data: { notes?: string; status?: 'CANCELLED' }
  ): Promise<IssueRequest> {
    const response = await fetchApi<ApiResponse<IssueRequest>>(`/api/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (!response.data) throw new Error(response.error || 'Không thể cập nhật')
    return response.data
  },

  /**
   * Kiểm tra định mức còn lại
   * @param poId - Purchase Order ID
   * @param styleId - Style ID
   * @param colorId - Color ID
   * @param threadTypeId - Thread Type ID
   * @returns Quota check result
   */
  async checkQuota(
    poId: number,
    styleId: number,
    colorId: number,
    threadTypeId: number
  ): Promise<QuotaCheck> {
    const response = await fetchApi<ApiResponse<QuotaCheck>>(
      `/api/issues/quota/${poId}/${styleId}/${colorId}/${threadTypeId}`
    )
    if (!response.data) throw new Error(response.error || 'Không thể kiểm tra định mức')
    return response.data
  },

  /**
   * Thêm cuộn chỉ vào phiếu xuất
   * @param issueId - Issue request ID
   * @param data - Item data (cone_id, allocation_id, notes)
   * @returns Created issue item
   */
  async addItem(issueId: number, data: AddIssueItemDTO): Promise<IssueItem> {
    const response = await fetchApi<ApiResponse<IssueItem>>(`/api/issues/${issueId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.data) throw new Error(response.error || 'Không thể thêm cuộn')
    return response.data
  },

  /**
   * Xóa cuộn chỉ khỏi phiếu xuất
   * @param issueId - Issue request ID
   * @param itemId - Issue item ID
   */
  async removeItem(issueId: number, itemId: number): Promise<void> {
    const response = await fetchApi<ApiResponse<void>>(
      `/api/issues/${issueId}/items/${itemId}`,
      {
        method: 'DELETE',
      }
    )
    if (response.error) throw new Error(response.error)
  },
}
