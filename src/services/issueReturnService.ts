/**
 * Issue Return Service
 * Nhập lại cuộn lẻ - Return Partial Cones
 *
 * Handles all HTTP operations for returning partially used cones
 * Uses fetchApi for consistent error handling
 */

import { fetchApi } from './api'
import type { ApiResponse } from '@/types'
import type { IssueReturn, CreateIssueReturnDTO } from '@/types/thread/issue'

export const issueReturnService = {
  /**
   * Tạo phiếu nhập lại cuộn lẻ
   * @param data - Return data (issue_item_id, cone_id, remaining_percentage, notes)
   * @returns Created issue return record
   */
  async create(data: CreateIssueReturnDTO): Promise<IssueReturn> {
    const response = await fetchApi<ApiResponse<IssueReturn>>('/api/issues/returns', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.data) throw new Error(response.error || 'Không thể nhập lại cuộn')
    return response.data
  },

  /**
   * Lấy danh sách phiếu nhập lại
   * @param filters - Optional filter parameters
   * @returns List of issue returns
   */
  async list(filters?: { issue_request_id?: number }): Promise<IssueReturn[]> {
    const params = new URLSearchParams()
    if (filters?.issue_request_id) {
      params.set('issue_request_id', String(filters.issue_request_id))
    }

    const queryString = params.toString()
    const url = queryString ? `/api/issues/returns?${queryString}` : '/api/issues/returns'

    const response = await fetchApi<ApiResponse<IssueReturn[]>>(url)
    return response.data || []
  },

  /**
   * Lấy chi tiết phiếu nhập lại theo ID
   * @param id - Issue return ID
   * @returns Issue return record
   */
  async get(id: number): Promise<IssueReturn> {
    const response = await fetchApi<ApiResponse<IssueReturn>>(`/api/issues/returns/${id}`)
    if (!response.data) throw new Error(response.error || 'Không tìm thấy phiếu nhập lại')
    return response.data
  },
}
