import type { CalculationResult } from './threadCalculation'
import type { OrderWeekStatus, DeliveryStatus, InventoryReceiptStatus } from './enums'

export interface ThreadOrderWeek {
  id: number
  week_name: string
  start_date: string | null
  end_date: string | null
  status: OrderWeekStatus
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
  created_at: string
  style?: { id: number; style_code: string; style_name: string }
  color?: { id: number; name: string; hex_code: string }
  po?: { id: number; po_number: string }
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
  }>
}

export interface WeeklyOrderResults {
  calculation_data: CalculationResult[]
  summary_data: AggregatedRow[]
  calculated_at: string
}

export interface AggregatedRow {
  thread_type_id: number
  thread_type_name: string
  supplier_name: string
  tex_number: string
  total_meters: number
  total_cones: number
  meters_per_cone: number | null
  thread_color: string | null
  thread_color_code: string | null
  supplier_id?: number | null
  delivery_date?: string | null
  lead_time_days?: number | null
  inventory_cones?: number
  sl_can_dat?: number
  additional_order?: number
  total_final?: number
  quota_cones?: number
}

export interface StyleOrderEntry {
  po_id: number | null
  po_number: string
  style_id: number
  style_code: string
  style_name: string
  colors: Array<{
    color_id: number
    color_name: string
    hex_code: string
    quantity: number
  }>
  po_quantity?: number
  already_ordered?: number
}

export interface OrderedQuantityInfo {
  po_id: number
  style_id: number
  po_quantity: number
  ordered_quantity: number
  remaining_quantity: number
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

export interface HistoryByWeekFilter {
  po_id?: number
  style_id?: number
  from_date?: string
  to_date?: string
  status?: string
  page?: number
  limit?: number
}

export interface DeliveryRecord {
  id: number
  week_id: number
  thread_type_id: number
  supplier_id: number
  delivery_date: string
  actual_delivery_date: string | null
  status: DeliveryStatus
  notes: string | null
  created_at: string
  updated_at: string
  received_quantity: number
  inventory_status: InventoryReceiptStatus
  warehouse_id: number | null
  received_by: string | null
  received_at: string | null
  days_remaining?: number
  is_overdue?: boolean
  supplier_name?: string
  thread_type_name?: string
  tex_number?: string
  week_name?: string
  total_cones?: number | null
}

export interface ReceiveDeliveryDTO {
  warehouse_id: number
  quantity: number
  received_by: string
}

export interface UpdateDeliveryDTO {
  delivery_date?: string
  actual_delivery_date?: string | null
  status?: DeliveryStatus
  notes?: string
}

export interface DeliveryFilter {
  status?: DeliveryStatus
  week_id?: number
}
