import type { CalculationResult } from './threadCalculation'

export interface ThreadOrderWeek {
  id: number
  week_name: string
  start_date: string | null
  end_date: string | null
  status: 'draft' | 'confirmed' | 'cancelled'
  notes: string | null
  created_by: string | null
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
}

export interface DeliveryRecord {
  id: number
  week_id: number
  thread_type_id: number
  supplier_id: number
  delivery_date: string
  actual_delivery_date: string | null
  status: 'pending' | 'delivered'
  notes: string | null
  created_at: string
  updated_at: string
  days_remaining?: number
  is_overdue?: boolean
  supplier_name?: string
  thread_type_name?: string
  tex_number?: string
  week_name?: string
}

export interface UpdateDeliveryDTO {
  delivery_date?: string
  actual_delivery_date?: string | null
  status?: 'pending' | 'delivered'
  notes?: string
}

export interface DeliveryFilter {
  status?: 'pending' | 'delivered'
  week_id?: number
}
