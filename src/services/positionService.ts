/**
 * Position API Service
 * 
 * Handles fetching positions from positions table
 * Uses fetchApi for consistent error handling
 */

import { fetchApi } from './api'
import type { ApiResponse } from '@/types'

export interface PositionOption {
  value: string  // Internal name (e.g., 'nhan_vien')
  label: string  // Display name (e.g., 'Nhân Viên')
}

export const positionService = {
  /**
   * Lấy danh sách chức vụ từ bảng positions
   * @returns Array of position options with value (name) and label (display_name)
   */
  async getUniquePositions(): Promise<PositionOption[]> {
    const response = await fetchApi<ApiResponse<PositionOption[]>>('/api/employees/unique-positions')
    return response.data || []
  },
}
