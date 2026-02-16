export type WeeklyOrderStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export interface ThreadOrderWeek {
  id: number
  week_name: string
  start_date: string | null
  end_date: string | null
  status: WeeklyOrderStatus
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

export interface SaveResultsDTO {
  calculation_data: any
  summary_data: any
}
