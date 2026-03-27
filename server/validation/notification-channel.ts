import { z } from 'zod'

const channelTypeEnum = z.enum(['TELEGRAM', 'EMAIL'])
const eventTypeEnum = z.enum(['ORDER_CONFIRMED', 'ORDER_CANCELLED'])

export const CreateChannelSchema = z.object({
  employee_id: z.number().int().positive('Employee ID phải là số dương'),
  channel_type: channelTypeEnum,
  channel_config: z.object({
    chat_id: z.string().min(1, 'Chat ID không được để trống'),
    name: z.string().optional(),
  }),
  event_types: z.array(eventTypeEnum).min(1, 'Phải chọn ít nhất 1 loại sự kiện'),
})

export const CreateGroupChannelSchema = z.object({
  channel_type: channelTypeEnum,
  channel_config: z.object({
    chat_id: z.string().min(1, 'Chat ID không được để trống'),
    name: z.string().optional(),
  }),
  event_types: z.array(eventTypeEnum).min(1, 'Phải chọn ít nhất 1 loại sự kiện'),
})

export const UpdateChannelSchema = z.object({
  channel_config: z.object({
    chat_id: z.string().min(1, 'Chat ID không được để trống'),
    name: z.string().optional(),
  }).optional(),
  event_types: z.array(eventTypeEnum).min(1, 'Phải chọn ít nhất 1 loại sự kiện').optional(),
})

export const TestMessageSchema = z.object({
  channel_type: channelTypeEnum,
  chat_id: z.string().min(1, 'Chat ID không được để trống'),
})

export type CreateChannelDTO = z.infer<typeof CreateChannelSchema>
export type CreateGroupChannelDTO = z.infer<typeof CreateGroupChannelSchema>
export type UpdateChannelDTO = z.infer<typeof UpdateChannelSchema>
export type TestMessageDTO = z.infer<typeof TestMessageSchema>
