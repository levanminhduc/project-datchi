export type WeeklyOrderStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export interface ThreadOrderWeek {
  id: number
  week_name: string
  start_date: string | null
  end_date: string | null
  status: WeeklyOrderStatus
  notes: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  item_count?: number
  items?: ThreadOrderItem[]
}

export interface ThreadOrderItem {
  id: number
  week_id: number
  po_id: number | null
  style_id: number
  color_id: number
  quantity: number
  sub_art_id: number | null
  created_at: string
  style?: { id: number; style_code: string; style_name: string }
  color?: { id: number; name: string; hex_code: string }
  po?: { id: number; po_number: string }
  sub_art?: { id: number; sub_art_code: string }
}

export interface CreateWeeklyOrderDTO {
  week_name: string
  start_date?: string
  end_date?: string
  notes?: string
  items: Array<{
    po_id?: number | null
    style_id: number
    color_id: number
    quantity: number
    sub_art_id?: number | null
  }>
}

export interface UpdateWeeklyOrderDTO {
  week_name?: string
  start_date?: string
  end_date?: string
  notes?: string
  items?: Array<{
    po_id?: number | null
    style_id: number
    color_id: number
    quantity: number
    sub_art_id?: number | null
  }>
}

export interface SaveResultsDTO {
  calculation_data: any
  summary_data: any
}

export interface ColorEntryHistory {
  color_id: number
  color_name: string
  hex_code: string
  quantity: number
}

export interface StyleProgress {
  style_id: number
  style_code: string
  style_name: string
  po_quantity: number
  total_ordered: number
  this_week_quantity: number
  remaining: number
  progress_pct: number
  colors: ColorEntryHistory[]
}

export interface PoGroup {
  po_id: number | null
  po_number: string
  styles: StyleProgress[]
}

export interface WeekHistoryGroup {
  week_id: number
  week_name: string
  status: string
  created_by: string | null
  created_at: string
  total_quantity: number
  po_groups: PoGroup[]
}

// ============ RESERVE & LOAN TYPES ============

export interface ThreadOrderLoan {
  id: number
  from_week_id: number
  to_week_id: number
  thread_type_id: number
  quantity_cones: number
  quantity_meters: number | null
  reason: string | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined data
  from_week?: { id: number; week_name: string }
  to_week?: { id: number; week_name: string }
  thread_type?: { id: number; code: string; name: string }
}

export interface ReservationSummary {
  thread_type_id: number
  needed: number
  reserved: number
  shortage: number
}

export interface CreateLoanDTO {
  from_week_id: number
  thread_type_id: number
  quantity_cones: number
  reason?: string
}

export interface ConfirmWithReserveResult {
  week: ThreadOrderWeek
  reservation_summary: ReservationSummary[]
}

export interface ReservedCone {
  id: number
  cone_id: string
  thread_type_id: number
  quantity_meters: number
  warehouse_id: number
  lot_number: string | null
  expiry_date: string | null
  received_date: string
  thread_type?: { id: number; code: string; name: string }
  warehouse?: { id: number; code: string; name: string }
}
