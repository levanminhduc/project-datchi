// Style Types

export interface Style {
  id: number
  style_code: string
  style_name: string
  description: string | null
  fabric_type: string | null
  created_at: string
  updated_at: string
}

export interface CreateStyleDTO {
  style_code: string
  style_name: string
  description?: string
  fabric_type?: string
}

export interface UpdateStyleDTO {
  style_code?: string
  style_name?: string
  description?: string
  fabric_type?: string
}

export interface StyleFilter {
  style_code?: string
  style_name?: string
  fabric_type?: string
}
