import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { getErrorMessage } from '../utils/errorHelper'

const styles = new Hono()

/**
 * GET /api/styles - List all styles with optional filtering
 */
styles.get('/', async (c) => {
  try {
    const query = c.req.query()
    
    let dbQuery = supabase
      .from('styles')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (query.style_code) {
      dbQuery = dbQuery.ilike('style_code', `%${query.style_code}%`)
    }
    if (query.style_name) {
      dbQuery = dbQuery.ilike('style_name', `%${query.style_name}%`)
    }
    if (query.fabric_type) {
      dbQuery = dbQuery.ilike('fabric_type', `%${query.fabric_type}%`)
    }

    const { data, error } = await dbQuery

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching styles:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/styles/:id - Get a single style by ID
 */
styles.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { data, error } = await supabase
      .from('styles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Khong tim thay ma hang' }, 404)
      }
      throw error
    }

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching style:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/styles - Create a new style
 */
styles.post('/', async (c) => {
  try {
    const body = await c.req.json()
    
    // Validate required fields
    if (!body.style_code) {
      return c.json({ data: null, error: 'Ma hang (style_code) la bat buoc' }, 400)
    }
    if (!body.style_name) {
      return c.json({ data: null, error: 'Ten ma hang (style_name) la bat buoc' }, 400)
    }

    const { data, error } = await supabase
      .from('styles')
      .insert([{
        style_code: body.style_code,
        style_name: body.style_name,
        description: body.description,
        fabric_type: body.fabric_type,
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return c.json({ data: null, error: 'Ma hang da ton tai' }, 400)
      }
      throw error
    }

    return c.json({ data, error: null, message: 'Tao ma hang thanh cong' })
  } catch (err) {
    console.error('Error creating style:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PUT /api/styles/:id - Update a style
 */
styles.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const body = await c.req.json()

    const { data, error } = await supabase
      .from('styles')
      .update({
        style_code: body.style_code,
        style_name: body.style_name,
        description: body.description,
        fabric_type: body.fabric_type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Khong tim thay ma hang' }, 404)
      }
      if (error.code === '23505') {
        return c.json({ data: null, error: 'Ma hang da ton tai' }, 400)
      }
      throw error
    }

    return c.json({ data, error: null, message: 'Cap nhat ma hang thanh cong' })
  } catch (err) {
    console.error('Error updating style:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * DELETE /api/styles/:id - Delete a style
 */
styles.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { error } = await supabase
      .from('styles')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Khong tim thay ma hang' }, 404)
      }
      throw error
    }

    return c.json({ data: null, error: null, message: 'Xoa ma hang thanh cong' })
  } catch (err) {
    console.error('Error deleting style:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/styles/:id/spec-colors - Get unique colors that have thread specs configured for a style
 */
styles.get('/:id/spec-colors', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { data, error } = await supabase
      .from('style_color_thread_specs')
      .select(`
        color_id,
        style_thread_spec:style_thread_specs!inner(style_id),
        color:colors!inner(id, name, hex_code)
      `)
      .eq('style_thread_specs.style_id', id)

    if (error) throw error

    // Deduplicate by color_id
    const colorMap = new Map<number, { id: number; name: string; hex_code: string }>()
    if (data) {
      for (const row of data) {
        const color = row.color as unknown as { id: number; name: string; hex_code: string }
        if (!colorMap.has(color.id)) {
          colorMap.set(color.id, { id: color.id, name: color.name, hex_code: color.hex_code })
        }
      }
    }

    return c.json({ data: Array.from(colorMap.values()), error: null })
  } catch (err) {
    console.error('Error fetching spec colors:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/styles/:id/thread-specs - Get thread specs for a style
 */
styles.get('/:id/thread-specs', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { data, error } = await supabase
      .from('style_thread_specs')
      .select(`
        *,
        suppliers:s supplier_id (id, name),
        thread_types:tex_id (id, tex_number, name)
      `)
      .eq('style_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching thread specs:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default styles
