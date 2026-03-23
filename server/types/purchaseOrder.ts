export type POItemChangeType = 'CREATE' | 'UPDATE' | 'DELETE'

export interface POItem {
  id: number
  po_id: number
  style_id: number
  quantity: number
  finished_product_code: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  style?: {
    id: number
    style_code: string
    style_name: string
  }
}

export interface POItemHistory {
  id: number
  po_item_id: number
  change_type: POItemChangeType
  previous_quantity: number | null
  new_quantity: number | null
  changed_by: number
  notes: string | null
  created_at: string
  employee?: {
    id: number
    full_name: string
  }
}

export interface CreatePOItemDTO {
  style_id: number
  quantity: number
  finished_product_code?: string
  notes?: string
}

export interface UpdatePOItemDTO {
  quantity: number
  finished_product_code?: string
  notes?: string
}

export interface POItemApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export type POImportRowStatus = 'new' | 'update' | 'skip' | 'new_style'

export interface POImportRow {
  row_number: number
  customer_name?: string
  po_number: string
  style_code: string
  week?: string
  description?: string
  style_name?: string
  style_id?: number
  finished_product_code?: string
  quantity: number
  status: POImportRowStatus
}

export interface POImportErrorRow {
  row_number: number
  data: Record<string, unknown>
  error_message: string
}

export interface POImportSummary {
  total: number
  valid: number
  errors: number
  new_pos: number
  update_items: number
  skip_items: number
}

export interface POImportPreview {
  valid_rows: POImportRow[]
  error_rows: POImportErrorRow[]
  summary: POImportSummary
}

export interface POImportResult {
  created_pos: number
  created_items: number
  updated_items: number
  skipped_items: number
  failed_items: number
}

export interface POImportMappingConfig {
  sheet_index: number
  header_row: number
  data_start_row: number
  columns: {
    customer_name: string
    po_number: string
    style_code: string
    week?: string
    description?: string
    finished_product_code?: string
    quantity: string
  }
}
