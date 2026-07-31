import { z } from 'zod'

export const CreateUnlockSchema = z.object({
  week_id: z.number().int().positive('week_id phải là số nguyên dương'),
  duration_minutes: z
    .number()
    .int('Thời hạn phải là số nguyên phút')
    .min(15, 'Thời hạn tối thiểu là 15 phút')
    .max(480, 'Thời hạn tối đa là 480 phút'),
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do mở khóa'),
})

export type CreateUnlockInput = z.infer<typeof CreateUnlockSchema>
