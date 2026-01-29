import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import type {
  ThreadApiResponse,
  ThreadTypeRow,
  CreateThreadTypeDTO,
  UpdateThreadTypeDTO,
} from '../types/thread'

const threads = new Hono()

/**
 * GET /api/threads - List all thread types with filters
 * Supports search, color, material, supplier, and is_active filters
 */
threads.get('/', async (c) => {
  try {
    const search = c.req.query('search') || ''
    const color = c.req.query('color')
    const material = c.req.query('material')
    const supplier = c.req.query('supplier')
    const isActive = c.req.query('is_active')

    let query = supabase
      .from('thread_types')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply search filter - searches code and name
    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Apply individual filters
    if (color) {
      query = query.eq('color', color)
    }
    if (material) {
      query = query.eq('material', material)
    }
    if (supplier) {
      query = query.ilike('supplier', `%${supplier}%`)
    }
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>(
        {
          data: null,
          error: 'Lỗi khi tải danh sách loại chỉ',
        },
        500
      )
    }

    return c.json<ThreadApiResponse<ThreadTypeRow[]>>({
      data,
      error: null,
      message: 'Thành công',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

/**
 * GET /api/threads/:id - Get single thread type by ID
 */
threads.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'ID không hợp lệ' },
        400
      )
    }

    const { data, error } = await supabase
      .from('thread_types')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: 'Không tìm thấy loại chỉ' },
          404
        )
      }
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Lỗi khi tải thông tin loại chỉ' },
        500
      )
    }

    return c.json<ThreadApiResponse<ThreadTypeRow>>({
      data,
      error: null,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

/**
 * POST /api/threads - Create thread type
 * Checks for duplicate code before insert (returns 409)
 */
threads.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateThreadTypeDTO>()

    // Validate required fields
    if (!body.code || !body.name || !body.density_grams_per_meter) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Vui lòng điền đầy đủ thông tin bắt buộc' },
        400
      )
    }

    // Check for duplicate code before insert
    const { data: existing } = await supabase
      .from('thread_types')
      .select('id')
      .eq('code', body.code)
      .single()

    if (existing) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: `Mã loại chỉ "${body.code}" đã tồn tại` },
        409
      )
    }

    // Insert with default values for optional fields
    const insertData = {
      code: body.code.trim(),
      name: body.name.trim(),
      density_grams_per_meter: body.density_grams_per_meter,
      ...(body.color && { color: body.color.trim() }),
      ...(body.color_code && { color_code: body.color_code.trim() }),
      ...(body.material && { material: body.material }),
      ...(body.tex_number !== undefined && { tex_number: body.tex_number }),
      ...(body.meters_per_cone !== undefined && { meters_per_cone: body.meters_per_cone }),
      ...(body.supplier && { supplier: body.supplier.trim() }),
      ...(body.reorder_level_meters !== undefined && { reorder_level_meters: body.reorder_level_meters }),
      ...(body.lead_time_days !== undefined && { lead_time_days: body.lead_time_days }),
    }

    const { data, error } = await supabase
      .from('thread_types')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Lỗi khi tạo loại chỉ: ' + error.message },
        500
      )
    }

    return c.json<ThreadApiResponse<ThreadTypeRow>>(
      {
        data,
        error: null,
        message: 'Tạo loại chỉ thành công',
      },
      201
    )
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

/**
 * PUT /api/threads/:id - Update thread type
 * If updating code, checks for duplicates (excludes current record)
 */
threads.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<UpdateThreadTypeDTO>()

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'ID không hợp lệ' },
        400
      )
    }

    // Check if record exists
    const { data: existing, error: findError } = await supabase
      .from('thread_types')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Không tìm thấy loại chỉ' },
        404
      )
    }

    // If updating code, check for duplicates (excluding current record)
    if (body.code) {
      const { data: duplicate } = await supabase
        .from('thread_types')
        .select('id')
        .eq('code', body.code)
        .neq('id', id)
        .single()

      if (duplicate) {
        return c.json<ThreadApiResponse<null>>(
          { data: null, error: `Mã loại chỉ "${body.code}" đã tồn tại` },
          409
        )
      }
    }

    // Build update data (only include defined fields)
    const updateData: Record<string, unknown> = {}
    if (body.code !== undefined) updateData.code = body.code.trim()
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.color !== undefined) updateData.color = body.color?.trim() || null
    if (body.color_code !== undefined) updateData.color_code = body.color_code?.trim() || null
    if (body.material !== undefined) updateData.material = body.material
    if (body.tex_number !== undefined) updateData.tex_number = body.tex_number
    if (body.density_grams_per_meter !== undefined) updateData.density_grams_per_meter = body.density_grams_per_meter
    if (body.meters_per_cone !== undefined) updateData.meters_per_cone = body.meters_per_cone
    if (body.supplier !== undefined) updateData.supplier = body.supplier?.trim() || null
    if (body.reorder_level_meters !== undefined) updateData.reorder_level_meters = body.reorder_level_meters
    if (body.lead_time_days !== undefined) updateData.lead_time_days = body.lead_time_days
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabase
      .from('thread_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Lỗi khi cập nhật loại chỉ' },
        500
      )
    }

    return c.json<ThreadApiResponse<ThreadTypeRow>>({
      data,
      error: null,
      message: 'Cập nhật thành công',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

/**
 * DELETE /api/threads/:id - Soft delete thread type
 * Sets is_active to false instead of hard delete
 */
threads.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'ID không hợp lệ' },
        400
      )
    }

    // Check if record exists
    const { data: existing, error: findError } = await supabase
      .from('thread_types')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Không tìm thấy loại chỉ' },
        404
      )
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('thread_types')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Lỗi khi xóa loại chỉ' },
        500
      )
    }

    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: null,
      message: 'Xóa loại chỉ thành công',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

export default threads
