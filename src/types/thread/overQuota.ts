export interface OverQuotaFilters {
  date_from: string | undefined
  date_to: string | undefined
  po_ids: number[]
  style_ids: number[]
  departments: string[]
  reason: 'all' | 'ky_thuat' | 'rai_dau_may'
  only_over_quota: boolean
}

export interface OverQuotaSummary {
  total_over_events: number
  total_excess_cones: number
  over_rate_pct: number
  top_style: { id: number; code: string; name: string; excess_cones: number } | null
  top_dept: { name: string; over_count: number } | null
  top_reason: string | null
}

export interface StyleOverQuotaItem {
  style_id: number
  style_code: string
  style_name: string
  total_quota: number
  total_issued: number
  total_excess: number
  over_count: number
  over_rate_pct: number
  top_reason: string | null
  reason_breakdown: { ky_thuat: number; rai_dau_may: number; khac: number }
  dept_breakdown: { dept: string; count: number }[]
}

export interface TrendDataPoint {
  period: string
  period_label: string
  over_count: number
  excess_cones: number
}

export interface DeptBreakdownItem {
  dept: string
  count: number
}

export interface OverQuotaDetailRow {
  issue_id: number
  issue_code: string
  department: string
  issue_date: string
  po_number: string
  style_id: number
  style_code: string
  style_name: string
  color_name: string
  thread_code: string
  thread_name: string
  quota_cones: number
  consumed_equivalent_cones: number
  excess_cones: number
  consumption_pct: number
  over_quota_notes: string | null
  reason_category: string
}

export interface OverQuotaDetailResponse {
  rows: OverQuotaDetailRow[]
  total: number
  page: number
  page_size: number
}

export function createDefaultFilters(): OverQuotaFilters {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date_from: `${pad(firstDay.getDate())}/${pad(firstDay.getMonth() + 1)}/${firstDay.getFullYear()}`,
    date_to: `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`,
    po_ids: [],
    style_ids: [],
    departments: [],
    reason: 'all',
    only_over_quota: true,
  }
}
