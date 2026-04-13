import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
import type { AppEnv } from '../types/hono-env'

const styleThreadSpecs = new Hono<AppEnv>()

styleThreadSpecs.use('*', requirePermission('thread.types.view'))

async function ensureColorSpecs(
  specId: number,
  styleId: number,
  threadTypeId: number | null,
  oldThreadTypeId?: number | null,
) {
  if (!threadTypeId) return

  const { data: styleColors } = await supabase
    .from('style_colors')
    .select('id')
    .eq('style_id', styleId)

  if (!styleColors || styleColors.length === 0) return

  const { data: existing } = await supabase
    .from('style_color_thread_specs')
    .select('id, style_color_id, thread_type_id')
    .eq('style_thread_spec_id', specId)

  const existingColorIds = new Set((existing || []).map(e => e.style_color_id))
  const missing = styleColors.filter(sc => !existingColorIds.has(sc.id))

  if (missing.length > 0) {
    await supabase
      .from('style_color_thread_specs')
      .insert(missing.map(sc => ({
        style_thread_spec_id: specId,
        style_color_id: sc.id,
        thread_type_id: threadTypeId,
      })))
  }

  if (oldThreadTypeId && oldThreadTypeId !== threadTypeId && existing && existing.length > 0) {
    const staleIds = existing
      .filter(e => e.thread_type_id === oldThreadTypeId)
      .map(e => e.id)

    if (staleIds.length > 0) {
      await supabase
        .from('style_color_thread_specs')
        .update({ thread_type_id: threadTypeId, updated_at: new Date().toISOString() })
        .in('id', staleIds)
    }
  }
}

/**
 * GET /api/style-thread-specs - List all style thread specs with optional filtering
 */
styleThreadSpecs.get('/', async (c) => {
  try {
    const query = c.req.query()
    
    let dbQuery = supabase
      .from('style_thread_specs')
      .select(`
        *,
        styles:style_id (id, style_code, style_name),
        suppliers:supplier_id (id, name),
        thread_types:thread_type_id (id, tex_number, tex_label, name, meters_per_cone, color_data:colors!color_id(name, hex_code))
      `)
      .order('display_order', { ascending: true })

    // Apply filters
    if (query.style_id) {
      dbQuery = dbQuery.eq('style_id', query.style_id)
    }
    if (query.supplier_id) {
      dbQuery = dbQuery.eq('supplier_id', query.supplier_id)
    }

    const { data, error } = await dbQuery

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching style thread specs:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/style-thread-specs/process-names - Distinct process names
 */
styleThreadSpecs.get('/process-names', async (c) => {
  try {
    const { data, error } = await supabase
      .from('style_thread_specs')
      .select('process_name')
      .not('process_name', 'eq', '')
      .not('process_name', 'is', null)
      .order('process_name')

    if (error) throw error

    const names = [...new Set((data || []).map(r => r.process_name as string))]
    return c.json({ data: names, error: null })
  } catch (err) {
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/style-thread-specs/:id - Get a single style thread spec by ID
 */
styleThreadSpecs.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('style_thread_specs')
      .select(`
        *,
        styles:style_id (id, style_code, style_name),
        suppliers:supplier_id (id, name),
        thread_types:thread_type_id (id, tex_number, tex_label, name, meters_per_cone, color_data:colors!color_id(name, hex_code))
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức chỉ' }, 404)
      }
      throw error
    }

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching style thread spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/style-thread-specs - Create a new style thread spec
 */
styleThreadSpecs.post('/', async (c) => {
  try {
    const body = await c.req.json()
    
    // Validate required fields
    if (!body.style_id) {
      return c.json({ data: null, error: 'Mã hàng (style_id) là bắt buộc' }, 400)
    }
    if (!body.supplier_id) {
      return c.json({ data: null, error: 'Nhà cung cấp (supplier_id) là bắt buộc' }, 400)
    }

    const auth = c.get('auth')
    let createdBy: string | null = null
    if (auth?.employeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      createdBy = emp?.full_name || null
    }

    const addToTop = body.add_to_top === true
    let displayOrder = 0

    if (addToTop) {
      await supabase.rpc('fn_increment_style_thread_spec_order', { p_style_id: body.style_id })
      displayOrder = 0
    } else {
      // Get MAX display_order + 1 for this style
      const { data: maxRow } = await supabase
        .from('style_thread_specs')
        .select('display_order')
        .eq('style_id', body.style_id)
        .order('display_order', { ascending: false })
        .limit(1)
        .single()
      
      displayOrder = maxRow ? maxRow.display_order + 1 : 0
    }

    const { data, error } = await supabase
      .from('style_thread_specs')
      .insert([{
        style_id: body.style_id,
        supplier_id: body.supplier_id,
        process_name: body.process_name,
        thread_type_id: body.thread_type_id,
        meters_per_unit: body.meters_per_unit || 0,
        notes: body.notes,
        display_order: displayOrder,
        created_by: createdBy,
        updated_by: createdBy,
      }])
      .select()
      .single()

    if (error) throw error

    await ensureColorSpecs(data.id, body.style_id, body.thread_type_id)

    return c.json({ data, error: null, message: 'Tạo định mức chỉ thành công' })
  } catch (err) {
    console.error('Error creating style thread spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PUT /api/style-thread-specs/:id - Update a style thread spec
 */
styleThreadSpecs.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    const auth = c.get('auth')
    let updatedBy: string | null = null
    if (auth?.employeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      updatedBy = emp?.full_name || null
    }

    let oldThreadTypeId: number | null = null
    if (body.thread_type_id) {
      const { data: oldSpec } = await supabase
        .from('style_thread_specs')
        .select('thread_type_id')
        .eq('id', id)
        .single()
      oldThreadTypeId = oldSpec?.thread_type_id ?? null
    }

    const { data, error } = await supabase
      .from('style_thread_specs')
      .update({
        style_id: body.style_id,
        supplier_id: body.supplier_id,
        process_name: body.process_name,
        thread_type_id: body.thread_type_id,
        meters_per_unit: body.meters_per_unit,
        notes: body.notes,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        suppliers:supplier_id (id, name),
        thread_types:thread_type_id (id, tex_number, tex_label, name, meters_per_cone, color_data:colors!color_id(name, hex_code))
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức chỉ' }, 404)
      }
      throw error
    }

    if (body.thread_type_id) {
      const styleId = body.style_id || data.style_id
      await ensureColorSpecs(id, styleId, body.thread_type_id, oldThreadTypeId)
    }

    return c.json({ data, error: null, message: 'Cập nhật định mức chỉ thành công' })
  } catch (err) {
    console.error('Error updating style thread spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * DELETE /api/style-thread-specs/:id - Delete a style thread spec
 */
styleThreadSpecs.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { error } = await supabase
      .from('style_thread_specs')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức chỉ' }, 404)
      }
      throw error
    }

    return c.json({ data: null, error: null, message: 'Xoa dinh muc chi thanh cong' })
  } catch (err) {
    console.error('Error deleting style thread spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/style-thread-specs/:id/color-specs - Get color-specific specs for a template
 */
styleThreadSpecs.get('/:id/color-specs', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('style_color_thread_specs')
      .select(`
        *,
        style_color:style_colors!style_color_id (id, color_name, hex_code, style_id),
        thread_types:thread_type_id (id, tex_number, tex_label, name, meters_per_cone, color_data:colors!color_id(name, hex_code), supplier_id),
        thread_color:colors!thread_color_id (id, name, hex_code)
      `)
      .eq('style_thread_spec_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching color specs:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/style-thread-specs/:id/color-specs - Add color-specific spec
 */
styleThreadSpecs.post('/:id/color-specs', async (c) => {
  try {
    const styleThreadSpecId = parseInt(c.req.param('id'))
    
    if (isNaN(styleThreadSpecId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()
    
    if (!body.style_color_id) {
      return c.json({ data: null, error: 'Mã màu hàng (style_color_id) là bắt buộc' }, 400)
    }

    const insertData: Record<string, unknown> = {
      style_thread_spec_id: styleThreadSpecId,
      style_color_id: body.style_color_id,
      notes: body.notes,
    }
    if (body.thread_type_id) insertData.thread_type_id = body.thread_type_id
    if (body.thread_color_id) insertData.thread_color_id = body.thread_color_id

    const { data, error } = await supabase
      .from('style_color_thread_specs')
      .insert([insertData])
      .select(`
        *,
        style_color:style_colors!style_color_id (id, color_name, hex_code, style_id),
        thread_types:thread_type_id (id, tex_number, tex_label, name, meters_per_cone, color_data:colors!color_id(name, hex_code), supplier_id),
        thread_color:colors!thread_color_id (id, name, hex_code)
      `)
      .single()

    if (error) throw error

    return c.json({ data, error: null, message: 'Them dinh muc chi theo mau thanh cong' })
  } catch (err) {
    console.error('Error creating color spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/style-thread-specs/by-style/:styleId/all-color-specs
 * Batch fetch ALL color specs for ALL specs belonging to a style.
 * Returns flat array of color specs with joined color + thread_type data.
 */
styleThreadSpecs.get('/by-style/:styleId/all-color-specs', async (c) => {
  try {
    const styleId = parseInt(c.req.param('styleId'))

    if (isNaN(styleId)) {
      return c.json({ data: null, error: 'Style ID không hợp lệ' }, 400)
    }

    // First get all spec IDs for this style
    const { data: specs, error: specsError } = await supabase
      .from('style_thread_specs')
      .select('id')
      .eq('style_id', styleId)

    if (specsError) throw specsError

    if (!specs || specs.length === 0) {
      return c.json({ data: [], error: null })
    }

    const specIds = specs.map(s => s.id)

    // Fetch all color specs for these spec IDs
    const { data, error } = await supabase
      .from('style_color_thread_specs')
      .select(`
        *,
        style_color:style_colors!style_color_id (id, color_name, hex_code, style_id),
        thread_types:thread_type_id (id, tex_number, tex_label, name, color_data:colors!color_id(name, hex_code), supplier_id, meters_per_cone),
        thread_color:colors!thread_color_id (id, name, hex_code)
      `)
      .in('style_thread_spec_id', specIds)
      .order('created_at', { ascending: true })

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching all color specs for style:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PUT /api/style-thread-specs/color-specs/:id - Update a color spec (inline edit)
 */
styleThreadSpecs.put('/color-specs/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.thread_type_id !== undefined) updateData.thread_type_id = body.thread_type_id
    if (body.thread_color_id !== undefined) updateData.thread_color_id = body.thread_color_id
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data, error } = await supabase
      .from('style_color_thread_specs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        style_color:style_colors!style_color_id (id, color_name, hex_code, style_id),
        thread_types:thread_type_id (id, tex_number, tex_label, name, color_data:colors!color_id(name, hex_code), supplier_id, meters_per_cone),
        thread_color:colors!thread_color_id (id, name, hex_code)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức màu' }, 404)
      }
      throw error
    }

    return c.json({ data, error: null, message: 'Cập nhật định mức màu thành công' })
  } catch (err) {
    console.error('Error updating color spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * DELETE /api/style-thread-specs/color-specs/by-style-color/:styleColorId
 * Batch delete ALL color specs for a given style_color_id (1 query thay vì N)
 */
styleThreadSpecs.delete('/color-specs/by-style-color/:styleColorId', async (c) => {
  try {
    const styleColorId = parseInt(c.req.param('styleColorId'))

    if (isNaN(styleColorId)) {
      return c.json({ data: null, error: 'Style Color ID không hợp lệ' }, 400)
    }

    const { error, count } = await supabase
      .from('style_color_thread_specs')
      .delete({ count: 'exact' })
      .eq('style_color_id', styleColorId)

    if (error) throw error

    return c.json({ data: { deleted: count }, error: null, message: `Đã xóa ${count ?? 0} định mức màu` })
  } catch (err) {
    console.error('Error batch deleting color specs by style_color:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * DELETE /api/style-thread-specs/color-specs/:id - Delete a color spec
 */
styleThreadSpecs.delete('/color-specs/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { error } = await supabase
      .from('style_color_thread_specs')
      .delete()
      .eq('id', id)

    if (error) throw error

    return c.json({ data: null, error: null, message: 'Xóa định mức màu thành công' })
  } catch (err) {
    console.error('Error deleting color spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default styleThreadSpecs
