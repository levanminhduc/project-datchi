import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'

const styleThreadSpecs = new Hono()

// Helper function to get error message
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
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
        thread_types:tex_id (id, tex_number, name, color)
      `)
      .order('created_at', { ascending: false })

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
        thread_types:tex_id (id, tex_number, name, color)
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
    const { data, error } = await supabase
      .from('style_thread_specs')
      .insert([{
        style_id: body.style_id,
        supplier_id: body.supplier_id,
        process_name: body.process_name,
        tex_id: body.tex_id,
        meters_per_unit: body.meters_per_unit || 0,
        notes: body.notes,
      }])
      .select()
      .single()

    if (error) throw error

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

    const { data, error } = await supabase
      .from('style_thread_specs')
      .update({
        style_id: body.style_id,
        supplier_id: body.supplier_id,
        process_name: body.process_name,
        tex_id: body.tex_id,
        meters_per_unit: body.meters_per_unit,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy định mức chỉ' }, 404)
      }
      throw error
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
        colors:color_id (id, name, hex_code),
        thread_types:thread_type_id (id, tex_number, name, color, supplier_id)
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
    
    if (!body.color_id) {
      return c.json({ data: null, error: 'Mã màu (color_id) là bắt buộc' }, 400)
    }
    if (!body.thread_type_id) {
      return c.json({ data: null, error: 'Loại chỉ (thread_type_id) là bắt buộc' }, 400)
    }

    const { data, error } = await supabase
      .from('style_color_thread_specs')
      .insert([{
        style_thread_spec_id: styleThreadSpecId,
        color_id: body.color_id,
        thread_type_id: body.thread_type_id,
        notes: body.notes,
      }])
      .select()
      .single()

    if (error) throw error

    return c.json({ data, error: null, message: 'Them dinh muc chi theo mau thanh cong' })
  } catch (err) {
    console.error('Error creating color spec:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default styleThreadSpecs
