// Thread Calculation Types

export interface CalculationInput {
  style_id: number
  quantity: number
  color_breakdown?: ColorBreakdownInput[]
}

export interface ColorBreakdownInput {
  color_id: number
  quantity: number
}

export interface CalculationResult {
  style_id: number
  style_code: string
  style_name: string
  total_quantity: number
  calculations: CalculationItem[]
}

export interface CalculationItem {
  spec_id: number
  process_name: string
  supplier_name: string
  tex_number: string
  meters_per_unit: number
  total_meters: number
  meters_per_cone?: number | null
  thread_color?: string | null
  thread_color_code?: string | null
  color_breakdown?: ColorCalculationResult[]
}

export interface ColorCalculationResult {
  color_id: number
  color_name: string
  quantity: number
  thread_type_id: number
  thread_type_name: string
  total_meters: number
}

export interface POCalculationResult {
  po_item_id: number
  style_id: number
  style_code: string
  style_name: string
  quantity: number
  calculations: CalculationItem[]
}

export interface CalculateByPOInput {
  po_id: number
}

export interface BatchCalculationInput {
  items: CalculationInput[]
}
