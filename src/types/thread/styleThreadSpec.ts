// Style Thread Spec Types

export interface StyleThreadSpec {
  id: number
  style_id: number
  supplier_id: number
  process_name: string
  thread_type_id: number | null
  meters_per_unit: number
  notes: string | null
  display_order: number
  created_at: string
  updated_at: string
  // Joined fields
  suppliers?: {
    id: number
    name: string
  }
  thread_types?: {
    id: number
    tex_number: string
    tex_label: string | null
    name: string
    meters_per_cone: number | null
  }
}

export interface StyleColorThreadSpec {
  id: number
  style_thread_spec_id: number
  style_color_id: number
  thread_type_id: number | null
  thread_color_id: number | null
  notes: string | null
  created_at: string
  updated_at: string
  style_color?: {
    id: number
    color_name: string
    hex_code: string | null
    style_id: number
  }
  thread_types?: {
    id: number
    name: string
    tex_number: string
    tex_label: string | null
    color_data?: { name: string; hex_code: string } | null
    supplier_id?: number | null
    meters_per_cone?: number | null
  }
  thread_color?: {
    id: number
    name: string
    hex_code: string
  } | null
}

export interface CreateStyleThreadSpecDTO {
  style_id: number
  supplier_id: number
  process_name: string
  thread_type_id?: number
  meters_per_unit: number
  notes?: string
  /** Whether to add new row at top (true) or bottom (false) of the list */
  add_to_top?: boolean
}

export interface UpdateStyleThreadSpecDTO {
  style_id?: number
  supplier_id?: number
  process_name?: string
  thread_type_id?: number
  meters_per_unit?: number
  notes?: string
}

export interface CreateStyleColorThreadSpecDTO {
  style_thread_spec_id: number
  style_color_id: number
  thread_type_id?: number
  thread_color_id?: number
  notes?: string
}

export interface StyleThreadSpecFilter {
  style_id?: number
  supplier_id?: number
}

export interface UpdateStyleColorThreadSpecDTO {
  thread_type_id?: number
  thread_color_id?: number | null
  notes?: string
}
