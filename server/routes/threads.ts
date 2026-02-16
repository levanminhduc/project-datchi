import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import type {
  ThreadApiResponse,
  ThreadTypeWithRelations,
  CreateThreadTypeDTO,
  UpdateThreadTypeDTO,
} from '../types/thread'

const threads = new Hono()

/**
 * GET /api/threads - List all thread types with filters
 * Supports search, color, material, supplier, and is_active filters
 * Returns joined color_data and supplier_data from FK relationships
 */
threads.get('/', async (c) => {
  try {
    const search = c.req.query('search') || ''
    const colorId = c.req.query('color_id')
    const material = c.req.query('material')
    const supplierId = c.req.query('supplier_id')
    const isActive = c.req.query('is_active')

    // LEFT JOIN colors and suppliers tables for related data
    // Also fetch suppliers from junction table (many-to-many)
    let query = supabase
      .from('thread_types')
      .select(`
        *,
        color_data:colors(id, name, hex_code, pantone_code),
        supplier_data:suppliers(id, code, name),
        suppliers:thread_type_supplier(id, supplier_item_code, unit_price, is_active, supplier:suppliers(id, code, name))
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply search filter - searches code and name
    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Apply individual filters
    if (colorId) {
      query = query.eq('color_id', parseInt(colorId))
    }
    if (material) {
      query = query.eq('material', material)
    }
    if (supplierId) {
      query = query.eq('supplier_id', parseInt(supplierId))
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

    return c.json<ThreadApiResponse<ThreadTypeWithRelations[]>>({
      data: data as ThreadTypeWithRelations[],
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
 * Returns joined color_data, supplier_data, and suppliers from junction table
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
      .select(`
        *,
        color_data:colors(id, name, hex_code, pantone_code),
        supplier_data:suppliers(id, code, name),
        suppliers:thread_type_supplier(id, supplier_item_code, unit_price, is_active, supplier:suppliers(id, code, name))
      `)
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

    return c.json<ThreadApiResponse<ThreadTypeWithRelations>>({
      data: data as ThreadTypeWithRelations,
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

    const insertData = {
      code: body.code.trim(),
      name: body.name.trim(),
      density_grams_per_meter: body.density_grams_per_meter,
      color_id: body.color_id || null,
      supplier_id: body.supplier_id || null,
      color_supplier_id: body.color_supplier_id || null,
      ...(body.material && { material: body.material }),
      ...(body.tex_number !== undefined && { tex_number: body.tex_number }),
      ...(body.meters_per_cone !== undefined && { meters_per_cone: body.meters_per_cone }),
      ...(body.reorder_level_meters !== undefined && { reorder_level_meters: body.reorder_level_meters }),
      ...(body.lead_time_days !== undefined && { lead_time_days: body.lead_time_days }),
    }

    const { data, error } = await supabase
      .from('thread_types')
      .insert(insertData)
      .select(`
        *,
        color_data:colors(id, name, hex_code, pantone_code),
        supplier_data:suppliers(id, code, name)
      `)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Lỗi khi tạo loại chỉ: ' + error.message },
        500
      )
    }

    return c.json<ThreadApiResponse<ThreadTypeWithRelations>>(
      {
        data: data as ThreadTypeWithRelations,
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
    if (body.material !== undefined) updateData.material = body.material
    if (body.tex_number !== undefined) updateData.tex_number = body.tex_number
    if (body.density_grams_per_meter !== undefined) updateData.density_grams_per_meter = body.density_grams_per_meter
    if (body.meters_per_cone !== undefined) updateData.meters_per_cone = body.meters_per_cone
    if (body.reorder_level_meters !== undefined) updateData.reorder_level_meters = body.reorder_level_meters
    if (body.lead_time_days !== undefined) updateData.lead_time_days = body.lead_time_days
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.color_supplier_id !== undefined) updateData.color_supplier_id = body.color_supplier_id
    if (body.color_id !== undefined) updateData.color_id = body.color_id
    if (body.supplier_id !== undefined) updateData.supplier_id = body.supplier_id

    const { data, error } = await supabase
      .from('thread_types')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        color_data:colors(id, name, hex_code, pantone_code),
        supplier_data:suppliers(id, code, name)
      `)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Lỗi khi cập nhật loại chỉ' },
        500
      )
    }

    return c.json<ThreadApiResponse<ThreadTypeWithRelations>>({
      data: data as ThreadTypeWithRelations,
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

    const { error } = await supabase
      .from('thread_types')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
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
