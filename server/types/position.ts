export interface Position {
  id: number
  name: string          // e.g., "quan_ly", "nhan_vien", "truong_phong"
  display_name: string  // e.g., "Quản Lý", "Nhân Viên", "Trưởng Phòng"
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreatePositionDTO {
  name: string
  display_name: string
}

export interface UpdatePositionDTO {
  name?: string
  display_name?: string
  is_active?: boolean
}
