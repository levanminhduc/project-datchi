export interface ReservedThreadLine {
  thread_type_id: number
  color_id: number
  supplier_name: string
  tex_number: string
  color_name: string
  reserved_cones_at_source: number
  reserved_meters_at_source: number
}

export interface ReservedPoGroup {
  po_id: number
  po_number: string
  thread_lines: ReservedThreadLine[]
}

export interface ReservedByPoResponse {
  week: { id: number; week_name: string; status: string }
  source_warehouse: { id: number; code: string; name: string }
  pos: ReservedPoGroup[]
  unassigned: { thread_lines: ReservedThreadLine[] }
}

export interface TransferReservedItem {
  thread_type_id: number
  color_id: number
  quantity: number
}

export interface TransferReservedBody {
  from_warehouse_id: number
  to_warehouse_id: number
  items: TransferReservedItem[]
  notes?: string
}

export interface TransferReservedResult {
  transaction_id: number
  total_cones: number
  per_item: Array<{ thread_type_id: number; color_id: number; moved: number }>
}
