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
