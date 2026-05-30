export interface IssueExportHistoryRow {
  supplier_id: number
  supplier_name: string
  tex_number: string
  tex_label: string
  total_full_cones: number
  department?: string
  style_code?: string
}

export interface IssueExportHistoryFilters {
  from_date: string
  to_date: string
  warehouse_id: number | null
  mode: 'summary' | 'detailed'
}

export interface IssueExportHistoryMeta {
  from_date: string
  to_date: string
  warehouse_name: string
  report_number: string
  full_name: string
  mode: 'summary' | 'detailed'
}
