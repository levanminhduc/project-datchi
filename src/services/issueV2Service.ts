/**
 * Issue V2 Service
 * API client for simplified issue management (quantity-based tracking)
 *
 * Uses fetchApi for consistent error handling.
 * All business logic is handled by the backend; this service only makes API calls.
 */

import { fetchApi } from './api'
import type { ApiResponse } from '@/types'
import type {
  IssueV2,
  IssueV2WithLines,
  CreateIssueV2DTO,
  CreateIssueV2Response,
  AddIssueLineV2DTO,
  ValidateIssueLineV2DTO,
  ValidateLineResponse,
  IssueFormData,
  IssueV2Filters,
  IssueV2ListResponse,
  IssueLineV2WithComputed,
  ReturnIssueV2DTO,
} from '@/types/thread/issueV2'

const BASE = '/api/issues/v2'

function buildQueryString(filters?: IssueV2Filters): string {
  if (!filters) return ''

  const params = new URLSearchParams()

  if (filters.department) params.append('department', filters.department)
  if (filters.status) params.append('status', filters.status)
  if (filters.from) params.append('from', filters.from)
  if (filters.to) params.append('to', filters.to)
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const issueV2Service = {
  /**
   * Tao phieu xuat moi (Create new issue)
   * @param data - CreateIssueV2DTO with department, created_by
   * @returns Created issue ID and code
   */
  async create(data: CreateIssueV2DTO): Promise<CreateIssueV2Response> {
    const response = await fetchApi<ApiResponse<CreateIssueV2Response>>(BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error || !response.data) {
      throw new Error(response.error || 'Khong the tao phieu xuat')
    }

    return response.data
  },

  /**
   * Lay chi tiet phieu xuat (Get issue by ID with lines)
   * @param id - Issue ID
   * @returns Issue with all lines including computed fields
   */
  async getById(id: number): Promise<IssueV2WithLines> {
    const response = await fetchApi<ApiResponse<IssueV2WithLines>>(`${BASE}/${id}`)

    if (response.error || !response.data) {
      throw new Error(response.error || 'Khong tim thay phieu xuat')
    }

    return response.data
  },

  /**
   * Lay danh sach phieu xuat (List issues with filters)
   * @param filters - Optional filters
   * @returns Paginated list of issues
   */
  async list(filters?: IssueV2Filters): Promise<IssueV2ListResponse> {
    const queryString = buildQueryString(filters)
    const response = await fetchApi<ApiResponse<IssueV2ListResponse>>(`${BASE}${queryString}`)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || { data: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  },

  /**
   * Lay du lieu form (Load thread types with quota & stock for a PO/Style/Color)
   * @param poId - Purchase Order ID
   * @param styleId - Style ID
   * @param colorId - Color ID
   * @returns Thread types with quota and stock info
   */
  async getFormData(poId: number, styleId: number, colorId: number): Promise<IssueFormData> {
    const params = new URLSearchParams({
      po_id: String(poId),
      style_id: String(styleId),
      color_id: String(colorId),
    })
    const response = await fetchApi<ApiResponse<IssueFormData>>(`${BASE}/form-data?${params}`)

    if (response.error || !response.data) {
      throw new Error(response.error || 'Khong the tai du lieu form')
    }

    return response.data
  },

  /**
   * Them dong vao phieu xuat (Add line to issue)
   * @param issueId - Issue ID
   * @param data - AddIssueLineV2DTO
   * @returns Added line with computed fields
   */
  async addLine(issueId: number, data: AddIssueLineV2DTO): Promise<IssueLineV2WithComputed> {
    const response = await fetchApi<ApiResponse<IssueLineV2WithComputed>>(`${BASE}/${issueId}/lines`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error || !response.data) {
      throw new Error(response.error || 'Khong the them dong')
    }

    return response.data
  },

  /**
   * Kiem tra dong truoc khi them (Validate line before adding)
   * Backend computes issued_equivalent, checks quota/stock
   * @param issueId - Issue ID
   * @param data - ValidateIssueLineV2DTO
   * @returns Validation result with computed fields
   */
  async validateLine(issueId: number, data: ValidateIssueLineV2DTO): Promise<ValidateLineResponse> {
    const response = await fetchApi<ApiResponse<ValidateLineResponse>>(`${BASE}/${issueId}/lines/validate`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error || !response.data) {
      throw new Error(response.error || 'Khong the kiem tra dong')
    }

    return response.data
  },

  /**
   * Xac nhan phieu xuat (Confirm issue and deduct stock)
   * @param issueId - Issue ID
   * @returns Updated issue with CONFIRMED status
   */
  async confirm(issueId: number): Promise<IssueV2WithLines> {
    const response = await fetchApi<ApiResponse<IssueV2WithLines>>(`${BASE}/${issueId}/confirm`, {
      method: 'POST',
    })

    if (response.error || !response.data) {
      throw new Error(response.error || 'Khong the xac nhan phieu xuat')
    }

    return response.data
  },

  /**
   * Xoa dong khoi phieu xuat (Remove line from issue)
   * @param issueId - Issue ID
   * @param lineId - Line ID
   */
  async removeLine(issueId: number, lineId: number): Promise<void> {
    const response = await fetchApi<ApiResponse<null>>(`${BASE}/${issueId}/lines/${lineId}`, {
      method: 'DELETE',
    })

    if (response.error) {
      throw new Error(response.error)
    }
  },

  /**
   * Cap nhat ghi chu dong (Update line notes)
   * @param issueId - Issue ID
   * @param lineId - Line ID
   * @param notes - Over quota notes
   * @returns Updated line
   */
  async updateLineNotes(issueId: number, lineId: number, notes: string): Promise<IssueLineV2WithComputed> {
    const response = await fetchApi<ApiResponse<IssueLineV2WithComputed>>(`${BASE}/${issueId}/lines/${lineId}`, {
      method: 'PATCH',
      body: JSON.stringify({ over_quota_notes: notes }),
    })

    if (response.error || !response.data) {
      throw new Error(response.error || 'Khong the cap nhat ghi chu')
    }

    return response.data
  },

  /**
   * Tra hang va them lai ton kho (Return items and add stock back)
   * @param issueId - Issue ID
   * @param data - ReturnIssueV2DTO with lines to return
   * @returns Updated issue
   */
  async returnItems(issueId: number, data: ReturnIssueV2DTO): Promise<IssueV2> {
    const response = await fetchApi<ApiResponse<IssueV2>>(`${BASE}/${issueId}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error || !response.data) {
      throw new Error(response.error || 'Khong the tra hang')
    }

    return response.data
  },
}
