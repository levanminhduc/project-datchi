export type ChatAssistantIntent = 'stock' | 'usage'

export interface ChatAssistantStockRow {
  thread_type_id: number
  thread_code: string
  thread_name: string
  supplier_name: string | null
  tex_number: string | null
  color_name: string | null
  available_full_cones: number
  available_partial_cones: number
  partial_meters: number
  partial_weight_grams: number
}

export interface ChatAssistantUsageRow {
  style_id: number
  style_code: string
  style_name: string | null
  style_color_name: string | null
  process_names: string[]
  meters_per_unit: number
}

export interface ChatAssistantResult {
  answer: string
  term: string | null
  tex: string | null
  intents: ChatAssistantIntent[]
  stock: ChatAssistantStockRow[]
  usage: ChatAssistantUsageRow[]
  suggestions: string[]
  source_endpoints?: string[]
  context?: unknown
}

export interface SummaryRpcRow {
  thread_type_id: number
  thread_code: string
  thread_name: string
  color_id: number | null
  color_name: string | null
  tex_number: string | number | null
  supplier_id: number | null
  full_cones: number
  partial_cones: number
  partial_meters: number
  partial_weight_grams: number
}

export interface ThreadLookup {
  id: number
  code: string
  name: string
  tex_number: string | number | null
  supplier_id: number | null
  color_id: number | null
}

export interface StyleSpecRow {
  id: number
  style_id: number
  process_name: string | null
  meters_per_unit: number | string | null
}

export interface ColorSpecRow {
  style_thread_spec_id: number
  style_color_id: number | null
}

export interface StyleRow {
  id: number
  style_code: string
  style_name: string | null
}
