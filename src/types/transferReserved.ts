export interface ReservedThreadLine {
  thread_type_id: number
  color_id: number
  supplier_name: string
  tex_number: string
  color_name: string
  reserved_cones_at_source: number
  reserved_meters_at_source: number
  reserved_full_cones_at_source: number
  reserved_partial_cones_at_source: number
  total_reserved_for_week: number
  already_at_destination: number
}

export interface PoSearchWeek {
  week_id: number
  week_name: string
  total_cones: number
}

export interface PoSearchResult {
  po_id: number
  po_number: string
  weeks: PoSearchWeek[]
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
  full_quantity: number
  partial_quantity: number
  po_id?: number | null
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
  per_item: Array<{
    thread_type_id: number
    color_id: number
    moved_full: number
    moved_partial: number
    moved: number
  }>
}

export interface ThreadLineLastTransfer {
  transferred_at: string
  by_user_name: string
  full_cones: number
  partial_cones: number
}

export interface TransferThreadLine {
  thread_type_id: number
  thread_color_id: number
  supplier_name: string
  tex_number: string
  color_name: string
  quota_cones: number
  shared_with_pos: number[]
  reserved_at_source: number
  reserved_at_destination: number
  transferred_for_po: number
  pending_for_po: number
  last_transfer: ThreadLineLastTransfer | null
}

export interface TransferPoGroup {
  po_id: number | null
  po_number: string
  display_order: number
  summary: {
    total_needed: number
    total_transferred: number
    total_pending: number
  }
  thread_lines: TransferThreadLine[]
}

export interface TransferAdditionalLine {
  thread_type_id: number
  thread_color_id: number
  supplier_name: string
  tex_number: string
  color_name: string
  additional_quantity: number
  reserved_at_source: number
  reserved_at_destination: number
  is_overflow: boolean
}

export interface TransferByCalcResponse {
  week: { id: number; week_name: string; status: string }
  source_warehouse: { id: number; code: string; name: string }
  destination_warehouse: { id: number; code: string; name: string } | null
  pos: TransferPoGroup[]
  additional: TransferAdditionalLine[]
}

export interface ThreadTransferHistoryEntry {
  transaction_id: number
  transferred_at: string
  by_user_name: string
  source_warehouse_name: string
  destination_warehouse_name: string
  full_cones: number
  partial_cones: number
  total_cones: number
}

export interface PoTransferTransactionLine {
  thread_type_id: number
  thread_color_id: number
  supplier_name: string
  tex_number: string
  color_name: string
  cones: number
}

export interface PoTransferTransaction {
  transaction_id: number
  performed_at: string
  by_user_name: string
  source_warehouse_name: string
  destination_warehouse_name: string
  total_cones: number
  lines: PoTransferTransactionLine[]
}
