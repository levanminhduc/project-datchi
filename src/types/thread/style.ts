// Style Types

export interface Style {
  id: number
  style_code: string
  style_name: string
  description: string | null
  fabric_type: string | null
  cm_price: string | null
  p_price: string | null
  t_price: string | null
  created_at: string
  updated_at: string
}

export interface CreateStyleDTO {
  style_code: string
  style_name: string
  description?: string
  fabric_type?: string
  cm_price?: string | null
  p_price?: string | null
  t_price?: string | null
}

export interface UpdateStyleDTO {
  style_code?: string
  style_name?: string
  description?: string
  fabric_type?: string
  cm_price?: string | null
  p_price?: string | null
  t_price?: string | null
}

export interface StyleFilter {
  style_code?: string
  style_name?: string
  fabric_type?: string
  sub_art_code?: string
}

export type StyleCmptPrices = {
  cm_price: string | null
  p_price: string | null
  t_price: string | null
}

export type StyleCmptRowStatus = 'UPDATE' | 'UNCHANGED' | 'STYLE_NOT_FOUND' | 'ERROR'

export interface StyleCmptImportRow {
  row_number: number
  style_code: string
  cm_price: string | number | null
  p_price: string | number | null
  t_price: string | number | null
}

export interface StyleCmptPreviewRow {
  row_number: number
  style_code: string
  style_id: number | null
  style_name: string | null
  status: StyleCmptRowStatus
  error_message: string | null
  old_prices: StyleCmptPrices | null
  new_prices: StyleCmptPrices
}

export interface StyleCmptPreview {
  rows: StyleCmptPreviewRow[]
  summary: { total: number; update: number; unchanged: number; errors: number }
}

export interface StyleCmptImportResult {
  updated: number
  unchanged: number
}
