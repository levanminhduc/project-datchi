export interface AggregatedStockRecord {
  id: number
  thread_type_id: number
  warehouse_id: number
  lot_number: string | null
  qty_full_cones: number
  qty_partial_cones: number
  received_date: string | null
  notes: string | null
  thread_type: {
    id: number
    code: string
    name: string
  } | null
  warehouse: {
    id: number
    name: string
    code: string
  } | null
}

export interface ThreadStockSummary {
  thread_type_id: number
  thread_name: string
  thread_code?: string
  total_full_cones: number
  total_partial_cones: number
  total_equivalent?: number
  warehouse_id?: number
  warehouse_name?: string
}

export interface ThreadStockFilters {
  thread_type_id?: number
  warehouse_id?: number
  lot_number?: string
}

export interface AddStockDTO {
  thread_type_id: number
  warehouse_id: number
  supplier_id?: number | null
  lot_number?: string | null
  qty_full_cones: number
  qty_partial_cones?: number
  received_date: string
  expiry_date?: string | null
  notes?: string | null
}

export interface DeductStockDTO {
  thread_type_id: number
  warehouse_id?: number
  qty_full: number
  qty_partial?: number
}

export interface DeductionResult {
  lot_number: string | null
  qty_full: number
  qty_partial: number
}

export interface DeductStockResponse {
  deducted_from: DeductionResult[]
  total_deducted_full: number
  total_deducted_partial: number
}

export interface ReturnStockDTO {
  thread_type_id: number
  warehouse_id: number
  lot_number?: string | null
  qty_full: number
  qty_partial: number
}

export interface StockApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
