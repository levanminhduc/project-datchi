export interface IssueExportHistoryRow {
  supplier_id: number
  supplier_name: string
  tex_number: string
  total_full_cones: number
}

export interface IssueExportHistoryFilters {
  from_date: string
  to_date: string
  warehouse_id: number | null
}

export interface IssueExportHistoryMeta {
  from_date: string
  to_date: string
  warehouse_name: string
  report_number: string
  full_name: string
}
