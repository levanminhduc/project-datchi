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
  supplier_id?: number | null
  delivery_date?: string | null
  lead_time_days?: number | null
  // Inventory preview fields
  inventory_available?: number    // Cones available from stock for this item
  shortage_cones?: number         // Cones that need to be ordered
  is_fully_stocked?: boolean      // True if inventory covers full requirement
}

export interface ColorCalculationResult {
  color_id: number
  color_name: string
  quantity: number
  thread_type_id: number
  thread_type_name: string
  thread_color: string | null
  thread_color_code: string | null
  total_meters: number
  process_name: string
  supplier_name: string
  tex_number: string
  meters_per_unit: number
  meters_per_cone: number | null
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
