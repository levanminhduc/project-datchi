import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import {
  UpdateSettingSchema,
  EmployeeDetailFieldsConfigSchema,
  type SystemSettingRow,
  type SettingsApiResponse,
} from '../validation/settings'
import { requireRoot, requirePermission } from '../middleware/auth'

const settings = new Hono()
settings.use('*', requirePermission('settings.view'))
const rootOnlySettingsKeys = new Set([
  'employee_detail_fields',
  'import_supplier_tex_mapping',
  'import_supplier_color_mapping',
  'import_po_items_mapping',
  'issue_department_options',
])

/**
 * GET /api/settings - List all system settings
 * Returns all settings as an array
 */
settings.get('/', async (c) => {
  try {
    let data: SystemSettingRow[]
    try {
      data = await query<SystemSettingRow>(
        'SELECT * FROM system_settings ORDER BY key ASC'
      )
    } catch (error) {
      console.error('Database error:', error)
      return c.json<SettingsApiResponse<null>>(
        {
          data: null,
          error: 'Lỗi khi tải danh sách cài đặt hệ thống',
        },
        500
      )
    }

    return c.json<SettingsApiResponse<SystemSettingRow[]>>({
      data: data as SystemSettingRow[],
      error: null,
      message: `Đã tải ${data.length} cài đặt`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<SettingsApiResponse<null>>(
      {
        data: null,
        error: 'Lỗi hệ thống',
      },
      500
    )
  }
})

/**
 * GET /api/settings/:key - Get single setting by key
 * Returns 404 if setting not found
 */
settings.get('/:key', async (c) => {
  try {
    const key = c.req.param('key')

    if (!key) {
      return c.json<SettingsApiResponse<null>>(
        {
          data: null,
          error: 'Thiếu key cài đặt',
        },
        400
      )
    }

    if (rootOnlySettingsKeys.has(key)) {
      const denied = await requireRoot(c, async () => {})
      if (denied) return denied
    }

    let data: SystemSettingRow | null
    try {
      data = await queryOne<SystemSettingRow>(
        'SELECT * FROM system_settings WHERE key = $1',
        [key]
      )
    } catch (error) {
      console.error('Database error:', error)
      return c.json<SettingsApiResponse<null>>(
        {
          data: null,
          error: 'Lỗi khi tải cài đặt',
        },
        500
      )
    }

    if (!data) {
      return c.json<SettingsApiResponse<null>>(
        {
          data: null,
          error: `Không tìm thấy cài đặt với key: ${key}`,
        },
        404
      )
    }

    return c.json<SettingsApiResponse<SystemSettingRow>>({
      data: data as SystemSettingRow,
      error: null,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<SettingsApiResponse<null>>(
      {
        data: null,
        error: 'Lỗi hệ thống',
      },
      500
    )
  }
})

/**
 * PUT /api/settings/:key - Update setting value by key
 * Returns 404 if setting not found
 * Value can be any valid JSON (JSONB column)
 */
settings.put('/:key', async (c, next) => {
  const key = c.req.param('key')
  if (rootOnlySettingsKeys.has(key)) {
    return requireRoot(c, next)
  }
  await next()
}, async (c) => {
  try {
    const key = c.req.param('key')

    if (!key) {
      return c.json<SettingsApiResponse<null>>(
        {
          data: null,
          error: 'Thiếu key cài đặt',
        },
        400
      )
    }

    const body = await c.req.json()
    const parseResult = UpdateSettingSchema.safeParse(body)

    if (!parseResult.success) {
      return c.json<SettingsApiResponse<null>>(
        {
          data: null,
          error: 'Dữ liệu không hợp lệ: ' + parseResult.error.issues.map((e) => e.message).join(', '),
        },
        400
      )
    }

    if (key === 'employee_detail_fields') {
      const configResult = EmployeeDetailFieldsConfigSchema.safeParse(parseResult.data.value)
      if (!configResult.success) {
        return c.json<SettingsApiResponse<null>>(
          {
            data: null,
            error: 'Cấu hình không hợp lệ: ' + configResult.error.issues.map((e) => e.message).join(', '),
          },
          400
        )
      }
    }

    let existing: { id: number } | null
    try {
      existing = await queryOne<{ id: number }>(
        'SELECT id FROM system_settings WHERE key = $1',
        [key]
      )
    } catch (findError) {
      console.error('Database error:', findError)
      return c.json<SettingsApiResponse<null>>(
        {
          data: null,
          error: 'Lỗi khi kiểm tra cài đặt',
        },
        500
      )
    }

    if (!existing) {
      return c.json<SettingsApiResponse<null>>(
        {
          data: null,
          error: `Không tìm thấy cài đặt với key: ${key}`,
        },
        404
      )
    }

    let data: SystemSettingRow | null
    try {
      data = await queryOne<SystemSettingRow>(
        `UPDATE system_settings
         SET value = $1, updated_at = $2
         WHERE key = $3
         RETURNING *`,
        [parseResult.data.value, new Date().toISOString(), key]
      )
    } catch (error) {
      console.error('Database error:', error)
      return c.json<SettingsApiResponse<null>>(
        {
          data: null,
          error: 'Lỗi khi cập nhật cài đặt',
        },
        500
      )
    }

    return c.json<SettingsApiResponse<SystemSettingRow>>({
      data: data as SystemSettingRow,
      error: null,
      message: `Đã cập nhật cài đặt: ${key}`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<SettingsApiResponse<null>>(
      {
        data: null,
        error: 'Lỗi hệ thống',
      },
      500
    )
  }
})

export default settings
