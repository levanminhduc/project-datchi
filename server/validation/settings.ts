import { z } from 'zod'

// ============================================================================
// Zod Schemas for System Settings API
// ============================================================================

/**
 * Schema for updating a system setting
 * Value can be any valid JSON (string, number, boolean, object, array, null)
 */
export const UpdateSettingSchema = z.object({
  value: z.any(),
})

export type UpdateSettingDTO = z.infer<typeof UpdateSettingSchema>

/**
 * Type for system_settings table row
 */
export interface SystemSettingRow {
  id: number
  key: string
  value: unknown
  description: string | null
  updated_at: string
}

/**
 * API Response type for settings endpoints
 */
export interface SettingsApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}
