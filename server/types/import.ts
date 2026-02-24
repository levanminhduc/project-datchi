export interface ImportMappingConfig {
  sheet_index: number
  header_row: number
  data_start_row: number
  columns: Record<string, string>
}

export interface ImportTexRow {
  supplier_name: string
  tex_number: number
  meters_per_cone: number
  unit_price: number
  supplier_item_code?: string
}

export interface ImportTexRequest {
  rows: ImportTexRow[]
}

export interface ImportTexResponse {
  imported: number
  skipped: number
  suppliers_created: number
  thread_types_created: number
}

export interface ImportColorRow {
  color_name: string
  supplier_color_code?: string
}

export interface ImportColorRequest {
  supplier_id: number
  rows: ImportColorRow[]
}

export interface ImportColorResponse {
  imported: number
  skipped: number
  colors_created: number
}

export interface ImportApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}
