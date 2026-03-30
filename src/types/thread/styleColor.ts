export interface StyleColor {
  id: number
  style_id: number
  color_name: string
  hex_code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateStyleColorDTO {
  color_name: string
  hex_code?: string
}

export interface CloneStyleColorDTO {
  source_color_id: number
  color_name: string
  hex_code?: string
}
