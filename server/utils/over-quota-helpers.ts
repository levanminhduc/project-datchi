interface ViewRow {
  issue_id: number
  issue_code: string
  department: string
  issue_status: string
  issue_date: string
  line_id: number
  po_id: number
  po_number: string
  style_id: number
  style_code: string
  color_id: number
  color_name: string
  thread_type_id: number
  thread_code: string
  thread_name: string
  thread_color: string
  quota_cones: number | null
  consumed_equivalent_cones: number
  consumption_percentage: number | null
  is_over_quota: boolean
  over_quota_notes: string | null
}

export type { ViewRow }

export function categorizeReason(notes: string | null): string {
  if (!notes) return 'khac'
  const lower = notes.toLowerCase()
  if (lower.includes('ky thuat')) return 'ky_thuat'
  if (lower.includes('rai dau may') || lower.includes('rải đầu máy')) return 'rai_dau_may'
  return 'khac'
}

export function excessCones(row: ViewRow): number {
  const quota = row.quota_cones ?? 0
  if (quota <= 0) return 0
  return Math.max(row.consumed_equivalent_cones - quota, 0)
}

export function topReasonLabel(
  breakdown: { ky_thuat: number; rai_dau_may: number; khac: number },
): string | null {
  const { ky_thuat, rai_dau_may, khac } = breakdown
  if (ky_thuat === 0 && rai_dau_may === 0 && khac === 0) return null
  if (ky_thuat >= rai_dau_may && ky_thuat >= khac) return 'Vuot dinh muc Ky Thuat'
  if (rai_dau_may >= ky_thuat && rai_dau_may >= khac) return 'Rai dau may'
  return 'Khac'
}
