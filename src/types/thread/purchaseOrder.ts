import type { POStatus } from './enums'

export interface PurchaseOrder {
  id: number
  po_number: string
  customer_name: string | null
  week: string | null
  order_date: string | null
  delivery_date: string | null
  status: POStatus
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreatePurchaseOrderDTO {
  po_number: string
  customer_name?: string
  week?: string
  order_date?: string
  delivery_date?: string
  status?: POStatus
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes?: string
}

export interface UpdatePurchaseOrderDTO {
  po_number?: string
  customer_name?: string
  week?: string
  order_date?: string
  delivery_date?: string
  status?: POStatus
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes?: string
}

export interface PurchaseOrderFilter {
  status?: string
  priority?: string
  customer_name?: string
  po_number?: string
}

export interface POItem {
  id: number
  po_id: number
  style_id: number
  quantity: number
  finished_product_code?: string | null
  deleted_at?: string | null
  style?: { id: number; style_code: string; style_name: string; description?: string | null }
  ordered_quantity?: number // Sum of weekly order quantities for this PO/style
  has_sub_arts?: boolean
  sub_arts?: Array<{ id: number; code: string }>
}

export interface POItemHistory {
  id: number
  po_item_id: number
  change_type: 'CREATE' | 'UPDATE' | 'DELETE'
  previous_quantity: number | null
  new_quantity: number | null
  changed_by: number
  created_at: string
  notes: string | null
  employee_name?: string
}

export interface CreatePOItemDTO {
  style_id: number
  quantity: number
  finished_product_code?: string
}

export interface UpdatePOItemDTO {
  quantity: number
  finished_product_code?: string
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items?: POItem[]
}

// PO Import types
export type POImportRowStatus = 'new' | 'update' | 'skip' | 'new_style'

export interface POImportRow {
  row_number?: number
  customer_name?: string
  po_number: string
  style_code: string
  week?: string
  description?: string
  style_name?: string
  finished_product_code?: string
  quantity: number
  status: POImportRowStatus
  style_id?: number
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
