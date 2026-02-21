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

const EXPECTED_FIELD_KEYS = [
  'employee_id', 'full_name', 'department', 'chuc_vu', 'is_active',
  'created_at', 'updated_at', 'last_login_at', 'must_change_password',
  'password_changed_at', 'failed_login_attempts', 'locked_until',
] as const

const EmployeeDetailFieldSchema = z.object({
  key: z.enum(EXPECTED_FIELD_KEYS, {
    message: 'Trường không hợp lệ',
  }),
  label: z.string().min(1, 'Nhãn không được để trống'),
  visible: z.boolean(),
  order: z.number().int().min(1).max(12),
  required: z.boolean().optional(),
})

export const EmployeeDetailFieldsConfigSchema = z.object({
  fields: z
    .array(EmployeeDetailFieldSchema)
    .length(12, 'Cấu hình phải có đúng 12 trường')
    .refine(
      (fields) => {
        const keys = fields.map(f => f.key)
        return new Set(keys).size === 12
      },
      { message: 'Các trường phải có key duy nhất' }
    )
    .refine(
      (fields) => {
        const orders = fields.map(f => f.order).sort((a, b) => a - b)
        return JSON.stringify(orders) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
      },
      { message: 'Thứ tự phải là các giá trị duy nhất từ 1 đến 12' }
    )
    .refine(
      (fields) => {
        const empId = fields.find(f => f.key === 'employee_id')
        const fullName = fields.find(f => f.key === 'full_name')
        return empId?.required === true && empId?.visible === true
          && fullName?.required === true && fullName?.visible === true
      },
      { message: 'Mã nhân viên và Họ tên phải luôn bắt buộc và hiển thị' }
    ),
})

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
