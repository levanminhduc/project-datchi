import { z } from 'zod'

// ============================================================================
// Zod Schemas for Permission CRUD API
// ============================================================================

const permissionCodeRegex = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*){1,3}$/

export const createPermissionSchema = z.object({
  code: z
    .string()
    .min(1, 'Mã quyền là bắt buộc')
    .max(100, 'Mã quyền tối đa 100 ký tự')
    .regex(permissionCodeRegex, 'Mã quyền không hợp lệ (ví dụ: module.resource.action)'),
  name: z.string().min(1, 'Tên quyền là bắt buộc').max(255, 'Tên quyền tối đa 255 ký tự'),
  description: z.string().optional(),
  module: z.string().min(1, 'Module là bắt buộc').max(50, 'Module tối đa 50 ký tự'),
  resource: z.string().min(1, 'Resource là bắt buộc').max(50, 'Resource tối đa 50 ký tự'),
  action: z.enum(['view', 'create', 'edit', 'delete', 'manage'], {
    errorMap: () => ({ message: 'Hành động không hợp lệ' }),
  }),
  routePath: z.string().optional(),
  isPageAccess: z.boolean().optional().default(false),
  sortOrder: z.number().optional().default(0),
})

export const updatePermissionSchema = createPermissionSchema
  .omit({ code: true })
  .partial()

export type CreatePermissionDTO = z.infer<typeof createPermissionSchema>
export type UpdatePermissionDTO = z.infer<typeof updatePermissionSchema>
