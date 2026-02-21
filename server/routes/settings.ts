import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import {
  UpdateSettingSchema,
  EmployeeDetailFieldsConfigSchema,
  type SystemSettingRow,
  type SettingsApiResponse,
} from '../validation/settings'
import { authMiddleware, requireRoot } from '../middleware/auth'

const settings = new Hono()

/**
 * GET /api/settings - List all system settings
 * Returns all settings as an array
 */
settings.get('/', async (c) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
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

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<SettingsApiResponse<null>>(
          {
            data: null,
            error: `Không tìm thấy cài đặt với key: ${key}`,
          },
          404
        )
      }
      console.error('Supabase error:', error)
      return c.json<SettingsApiResponse<null>>(
        {
          data: null,
          error: 'Lỗi khi tải cài đặt',
        },
        500
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
settings.put('/:key', authMiddleware, async (c, next) => {
  const key = c.req.param('key')
  if (key === 'employee_detail_fields') {
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

    const { data: existing, error: findError } = await supabase
      .from('system_settings')
      .select('id')
      .eq('key', key)
      .single()

    if (findError) {
      if (findError.code === 'PGRST116') {
        return c.json<SettingsApiResponse<null>>(
          {
            data: null,
            error: `Không tìm thấy cài đặt với key: ${key}`,
          },
          404
        )
      }
      console.error('Supabase error:', findError)
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

    const { data, error } = await supabase
      .from('system_settings')
      .update({
        value: parseResult.data.value,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
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
