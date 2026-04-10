import { fetchApi } from './api'
import type { ApiResponse } from '@/types'
import type {
  OverQuotaFilters,
  OverQuotaSummary,
  StyleOverQuotaItem,
  TrendDataPoint,
  OverQuotaDetailResponse,
} from '@/types/thread/overQuota'

const BASE = '/api/over-quota'

function convertDateFormat(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return dateStr
}

function buildQueryString(filters: OverQuotaFilters): string {
  const params = new URLSearchParams()

  if (filters.date_from) params.append('date_from', convertDateFormat(filters.date_from))
  if (filters.date_to) params.append('date_to', convertDateFormat(filters.date_to))

  filters.po_ids.forEach((id) => params.append('po_ids', String(id)))
  filters.style_ids.forEach((id) => params.append('style_ids', String(id)))
  filters.departments.forEach((d) => params.append('departments', d))

  if (filters.reason !== 'all') params.append('reason', filters.reason)
  params.append('only_over_quota', String(filters.only_over_quota))

  return params.toString()
}

export const overQuotaService = {
  async getSummary(filters: OverQuotaFilters): Promise<OverQuotaSummary> {
    const qs = buildQueryString(filters)
    const response = await fetchApi<ApiResponse<OverQuotaSummary>>(`${BASE}/summary?${qs}`)
    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể tải dữ liệu tổng hợp')
    }
    return response.data
  },

  async getByStyle(filters: OverQuotaFilters): Promise<StyleOverQuotaItem[]> {
    const qs = buildQueryString(filters)
    const response = await fetchApi<ApiResponse<StyleOverQuotaItem[]>>(`${BASE}/by-style?${qs}`)
    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể tải dữ liệu theo mã hàng')
    }
    return response.data
  },

  async getTrend(
    filters: OverQuotaFilters,
    granularity: 'week' | 'month' = 'week',
  ): Promise<TrendDataPoint[]> {
    const qs = buildQueryString(filters)
    const response = await fetchApi<ApiResponse<TrendDataPoint[]>>(
      `${BASE}/trend?${qs}&granularity=${granularity}`,
    )
    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể tải dữ liệu xu hướng')
    }
    return response.data
  },

  async getDetail(
    filters: OverQuotaFilters,
    pagination: { page?: number; page_size?: number; sort_by?: string; descending?: boolean } = {},
  ): Promise<OverQuotaDetailResponse> {
    const qs = buildQueryString(filters)
    const params = new URLSearchParams(qs)

    if (pagination.page) params.set('page', String(pagination.page))
    if (pagination.page_size) params.set('page_size', String(pagination.page_size))
    if (pagination.sort_by) params.set('sort_by', pagination.sort_by)
    if (pagination.descending !== undefined) params.set('descending', String(pagination.descending))

    const response = await fetchApi<ApiResponse<OverQuotaDetailResponse>>(
      `${BASE}/detail?${params.toString()}`,
    )
    if (response.error || !response.data) {
      throw new Error(response.error || 'Không thể tải dữ liệu chi tiết')
    }
    return response.data
  },
}
