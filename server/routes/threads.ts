import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import type {
  ThreadApiResponse,
  ThreadTypeRow,
  ThreadTypeWithRelations,
  CreateThreadTypeDTO,
  UpdateThreadTypeDTO,
} from '../types/thread'

const threads = new Hono()

/**
 * Helper: Lookup color name from color_id for dual-write
 */
async function lookupColorName(colorId: number): Promise<{ name: string; hex_code: string } | null> {
  const { data } = await supabase
    .from('colors')
    .select('name, hex_code')
    .eq('id', colorId)
    .single()
  return data
}

/**
 * Helper: Lookup supplier name from supplier_id for dual-write
 */
async function lookupSupplierName(supplierId: number): Promise<string | null> {
  const { data } = await supabase
    .from('suppliers')
    .select('name')
    .eq('id', supplierId)
    .single()
  return data?.name || null
}

/**
 * GET /api/threads - List all thread types with filters
 * Supports search, color, material, supplier, and is_active filters
 * Returns joined color_data and supplier_data from FK relationships
 */
threads.get('/', async (c) => {
  try {
    const search = c.req.query('search') || ''
    const color = c.req.query('color')
    const colorId = c.req.query('color_id')
    const material = c.req.query('material')
    const supplier = c.req.query('supplier')
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
      .order('created_at', { ascending: false })

    // Apply search filter - searches code and name
    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Apply individual filters
    if (colorId) {
      // Filter by color FK (new way)
      query = query.eq('color_id', parseInt(colorId))
    } else if (color) {
      // Filter by color text (legacy)
      query = query.eq('color', color)
    }
    if (material) {
      query = query.eq('material', material)
    }
    if (supplierId) {
      // Filter by supplier FK (new way)
      query = query.eq('supplier_id', parseInt(supplierId))
    } else if (supplier) {
      // Filter by supplier text (legacy)
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
 * Implements dual-write: writes both FK fields and legacy text fields
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

    // Dual-write: If color_id provided, lookup color name for legacy field
    let colorName = body.color?.trim() || null
    let colorCode = body.color_code?.trim() || null
    if (body.color_id) {
      const colorData = await lookupColorName(body.color_id)
      if (colorData) {
        colorName = colorData.name
        colorCode = colorData.hex_code
      }
    }

    // Dual-write: If supplier_id provided, lookup supplier name for legacy field
    let supplierName = body.supplier?.trim() || null
    if (body.supplier_id) {
      const name = await lookupSupplierName(body.supplier_id)
      if (name) {
        supplierName = name
      }
    }

    // Insert with FK and legacy fields
    const insertData = {
      code: body.code.trim(),
      name: body.name.trim(),
      density_grams_per_meter: body.density_grams_per_meter,
      color: colorName,
      color_code: colorCode,
      color_id: body.color_id || null,
      supplier: supplierName,
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
 * Implements dual-write: writes both FK fields and legacy text fields
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

    // Dual-write: Handle color_id and color fields
    if (body.color_id !== undefined) {
      updateData.color_id = body.color_id
      if (body.color_id) {
        const colorData = await lookupColorName(body.color_id)
        if (colorData) {
          updateData.color = colorData.name
          updateData.color_code = colorData.hex_code
        }
      } else {
        // Clearing color_id, also clear legacy fields if not explicitly set
        if (body.color === undefined) updateData.color = null
        if (body.color_code === undefined) updateData.color_code = null
      }
    } else {
      // Legacy: update text fields directly
      if (body.color !== undefined) updateData.color = body.color?.trim() || null
      if (body.color_code !== undefined) updateData.color_code = body.color_code?.trim() || null
    }

    // Dual-write: Handle supplier_id and supplier fields
    if (body.supplier_id !== undefined) {
      updateData.supplier_id = body.supplier_id
      if (body.supplier_id) {
        const supplierName = await lookupSupplierName(body.supplier_id)
        if (supplierName) {
          updateData.supplier = supplierName
        }
      } else {
        // Clearing supplier_id, also clear legacy field if not explicitly set
        if (body.supplier === undefined) updateData.supplier = null
      }
    } else {
      // Legacy: update text field directly
      if (body.supplier !== undefined) updateData.supplier = body.supplier?.trim() || null
    }

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
