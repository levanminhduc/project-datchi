import type { ThreadMaterial } from './enums'
import type { Color } from './color'
import type { Supplier } from './supplier'
import type { ThreadTypeSupplierWithRelations } from './thread-type-supplier'

export interface ThreadType {
  id: number
  code: string
  name: string
  color_id: number | null
  supplier_id: number | null
  color_supplier_id: number | null
  material: ThreadMaterial
  tex_number: number | null
  density_grams_per_meter: number
  meters_per_cone: number | null
  reorder_level_meters: number
  lead_time_days: number
  is_active: boolean
  created_at: string
  updated_at: string
  color_data?: {
    id: number
    name: string
    hex_code: string
    pantone_code: string | null
  } | null
  supplier_data?: {
    id: number
    code: string
    name: string
  } | null
}

export interface ThreadTypeFormData {
  code: string
  name: string
  color_id?: number | null
  supplier_id?: number | null
  color_supplier_id?: number | null
  material: ThreadMaterial
  tex_number?: number
  density_grams_per_meter: number
  meters_per_cone?: number
  reorder_level_meters?: number
  lead_time_days?: number
  is_active?: boolean
}

export interface ThreadTypeFilters {
  search?: string
  color_id?: number
  supplier_id?: number
  material?: ThreadMaterial
  is_active?: boolean
}

export interface ThreadTypeWithRelations extends ThreadType {
  color_data?: Color | null
  supplier_data?: Supplier | null
  suppliers?: ThreadTypeSupplierWithRelations[]
}
