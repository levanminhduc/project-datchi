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
