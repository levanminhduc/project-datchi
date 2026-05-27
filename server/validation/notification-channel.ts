import { z } from 'zod'

const channelTypeEnum = z.enum(['TELEGRAM', 'EMAIL'])
const eventTypeEnum = z.enum(['ORDER_CONFIRMED', 'ORDER_CANCELLED', 'ORDER_APPROVED', 'ORDER_APPROVAL_REQUESTED'])

const telegramConfigSchema = z.object({
  chat_id: z.string().min(1, 'Chat ID không được để trống'),
  telegram_user_id: z.string().regex(/^[1-9]\d*$/, 'Telegram User ID phải là số dương').optional(),
  name: z.string().optional(),
})

function requireApprovalTelegramUserId(
  data: {
    channel_type: z.infer<typeof channelTypeEnum>
    channel_config: z.infer<typeof telegramConfigSchema>
    event_types: Array<z.infer<typeof eventTypeEnum>>
  },
  ctx: z.RefinementCtx,
) {
  if (!data.event_types.includes('ORDER_APPROVAL_REQUESTED')) return

  if (data.channel_type !== 'TELEGRAM') {
    ctx.addIssue({
      code: 'custom',
      path: ['channel_type'],
      message: 'Duyệt đơn qua Telegram chỉ hỗ trợ kênh TELEGRAM',
    })
  }

  if (!data.channel_config.telegram_user_id) {
    ctx.addIssue({
      code: 'custom',
      path: ['channel_config', 'telegram_user_id'],
      message: 'Cần nhập Telegram User ID cho lãnh đạo duyệt đơn',
    })
  }

  if (!/^[1-9]\d*$/.test(data.channel_config.chat_id)) {
    ctx.addIssue({
      code: 'custom',
      path: ['channel_config', 'chat_id'],
      message: 'Telegram Chat ID của lãnh đạo phải là số dương',
    })
  }
}

export const CreateChannelSchema = z.object({
  employee_id: z.number().int().positive('Employee ID phải là số dương'),
  channel_type: channelTypeEnum,
  channel_config: telegramConfigSchema,
  event_types: z.array(eventTypeEnum).min(1, 'Phải chọn ít nhất 1 loại sự kiện'),
}).superRefine(requireApprovalTelegramUserId)

export const CreateGroupChannelSchema = z.object({
  channel_type: channelTypeEnum,
  channel_config: telegramConfigSchema,
  event_types: z.array(eventTypeEnum)
    .min(1, 'Phải chọn ít nhất 1 loại sự kiện')
    .refine(
      events => !events.includes('ORDER_APPROVAL_REQUESTED'),
      'Group Telegram không được cấu hình sự kiện duyệt đơn trực tiếp',
    ),
})

export const UpdateChannelSchema = z.object({
  channel_config: telegramConfigSchema.optional(),
  event_types: z.array(eventTypeEnum).min(1, 'Phải chọn ít nhất 1 loại sự kiện').optional(),
}).superRefine((data, ctx) => {
  if (!data.event_types?.includes('ORDER_APPROVAL_REQUESTED') || !data.channel_config) return
  if (data.channel_config?.chat_id && !/^[1-9]\d*$/.test(data.channel_config.chat_id)) {
    ctx.addIssue({
      code: 'custom',
      path: ['channel_config', 'chat_id'],
      message: 'Telegram Chat ID của lãnh đạo phải là số dương',
    })
  }
  if (!data.channel_config.telegram_user_id) {
    ctx.addIssue({
      code: 'custom',
      path: ['channel_config', 'telegram_user_id'],
      message: 'Cần nhập Telegram User ID cho lãnh đạo duyệt đơn',
    })
  }
})

export const TestMessageSchema = z.object({
  channel_type: channelTypeEnum,
  chat_id: z.string().min(1, 'Chat ID không được để trống'),
})

export const AssignTelegramIdentitySchema = z.object({
  employee_id: z.number().int().positive('Employee ID phải là số dương'),
  mode: z.enum(['REGULAR', 'APPROVAL']),
  event_types: z.array(eventTypeEnum).optional(),
})

export type CreateChannelDTO = z.infer<typeof CreateChannelSchema>
export type CreateGroupChannelDTO = z.infer<typeof CreateGroupChannelSchema>
export type UpdateChannelDTO = z.infer<typeof UpdateChannelSchema>
export type TestMessageDTO = z.infer<typeof TestMessageSchema>
export type AssignTelegramIdentityDTO = z.infer<typeof AssignTelegramIdentitySchema>
