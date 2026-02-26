export interface ImportMappingConfig {
  sheet_index: number
  header_row: number
  data_start_row: number
  columns: Record<string, string>
}

export interface ImportTexRow {
  row_number: number
  supplier_name: string
  tex_number: number
  meters_per_cone: number
  unit_price: number
  supplier_item_code?: string
  status: ImportRowStatus
  errors: string[]
}

export interface ImportColorRow {
  row_number: number
  color_name: string
  supplier_color_code?: string
  status: ImportRowStatus
  errors: string[]
}

export type ImportRowStatus = 'valid' | 'new_supplier' | 'new_tex' | 'new_color' | 'exists' | 'error'

export interface ImportTexSkipDetail {
  row_number: number
  supplier_name: string
  tex_number: number
  reason: string
}

export interface ImportTexResponse {
  imported: number
  skipped: number
  suppliers_created: number
  thread_types_created: number
  skipped_details: ImportTexSkipDetail[]
}

export interface ImportColorResponse {
  imported: number
  skipped: number
  colors_created: number
}
