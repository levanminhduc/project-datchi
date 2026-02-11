/**
 * System Settings Service
 * Cai dat he thong - System Settings Management
 *
 * Handles all HTTP operations for system settings
 * Uses fetchApi for consistent error handling
 */

import { fetchApi } from './api'

/**
 * Type for system setting row from database
 */
export interface SystemSetting {
  id: number
  key: string
  value: unknown
  description: string | null
  updated_at: string
}

/**
 * API Response type for settings endpoints
 */
interface SettingsApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

export const settingsService = {
  /**
   * Lay danh sach tat ca cai dat he thong
   * @returns Array of system settings
   */
  async getAll(): Promise<SystemSetting[]> {
    const response = await fetchApi<SettingsApiResponse<SystemSetting[]>>('/api/settings')
    return response.data || []
  },

  /**
   * Lay gia tri cai dat theo key
   * @param key - Setting key (e.g., 'partial_cone_ratio')
   * @returns System setting or throws error if not found
   */
  async get(key: string): Promise<SystemSetting> {
    const response = await fetchApi<SettingsApiResponse<SystemSetting>>(`/api/settings/${key}`)
    if (!response.data) throw new Error(response.error || 'Khong tim thay cai dat')
    return response.data
  },

  /**
   * Cap nhat gia tri cai dat
   * @param key - Setting key
   * @param value - New value (can be any valid JSON)
   * @returns Updated system setting
   */
  async update(key: string, value: unknown): Promise<SystemSetting> {
    const response = await fetchApi<SettingsApiResponse<SystemSetting>>(`/api/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    })
    if (!response.data) throw new Error(response.error || 'Khong the cap nhat cai dat')
    return response.data
  },
}
