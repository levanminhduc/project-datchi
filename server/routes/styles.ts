import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'

const styles = new Hono()

styles.use('*', requirePermission('thread.types.view'))

/**
 * GET /api/styles - List all styles with optional filtering
 * Query params:
 *   - search: unified search on style_code OR style_name
 *   - style_code: filter by style_code (legacy)
 *   - style_name: filter by style_name (legacy)
 *   - fabric_type: filter by fabric_type
 *   - exclude_ids: comma-separated IDs to exclude (e.g., "1,2,3")
 *   - limit: max results (1-100, default: no limit)
 */
styles.get('/', async (c) => {
  try {
    const query = c.req.query()

    let dbQuery = supabase
      .from('styles')
      .select('*')
      .is('deleted_at', null)
      .order('style_code', { ascending: true })

    // Unified search (style_code OR style_name)
    if (query.search) {
      const search = query.search.trim()
      if (search) {
        dbQuery = dbQuery.or(`style_code.ilike.%${search}%,style_name.ilike.%${search}%`)
      }
    }

    // Legacy individual filters (backwards compat)
    if (query.style_code) {
      dbQuery = dbQuery.ilike('style_code', `%${query.style_code}%`)
    }
    if (query.style_name) {
      dbQuery = dbQuery.ilike('style_name', `%${query.style_name}%`)
    }
    if (query.fabric_type) {
      dbQuery = dbQuery.ilike('fabric_type', `%${query.fabric_type}%`)
    }

    // Filter by sub_art_code (2-step: find style_ids from sub_arts, then filter)
    if (query.sub_art_code) {
      const { data: subArtRows } = await supabase
        .from('sub_arts')
        .select('style_id')
        .ilike('sub_art_code', `%${query.sub_art_code.trim()}%`)

      const styleIds = [...new Set((subArtRows || []).map(r => r.style_id))]
      if (styleIds.length === 0) {
        return c.json({ data: [], error: null })
      }
      dbQuery = dbQuery.in('id', styleIds)
    }

    // Exclude specific IDs (for dropdowns with existing selections)
    if (query.exclude_ids) {
      const ids = query.exclude_ids.split(',').map(Number).filter((n: number) => !isNaN(n))
      if (ids.length > 0) {
        dbQuery = dbQuery.not('id', 'in', `(${ids.join(',')})`)
      }
    }

    // Limit results
    if (query.limit) {
      const limit = parseInt(query.limit)
      if (!isNaN(limit) && limit > 0 && limit <= 100) {
        dbQuery = dbQuery.limit(limit)
      }
    }

    const { data, error } = await dbQuery

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching styles:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

styles.get('/with-specs', async (c) => {
  try {
    const query = c.req.query()

    const page = Math.max(1, parseInt(query.page || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || '25') || 25))
    const search = (query.search || '').trim()
    const descending = query.descending === 'true'

    const allowedSortColumns = ['style_code', 'style_name', 'spec_count', 'first_spec_created_at', 'last_spec_updated_at']
    const sortBy = allowedSortColumns.includes(query.sortBy || '') ? query.sortBy! : 'style_code'

    const offset = (page - 1) * pageSize

    let dbQuery = supabase
      .from('v_styles_with_specs')
      .select('*', { count: 'exact' })

    if (search) {
      dbQuery = dbQuery.or(`style_code.ilike.%${search}%,style_name.ilike.%${search}%`)
    }

    dbQuery = dbQuery
      .order(sortBy, { ascending: !descending })
      .range(offset, offset + pageSize - 1)

    const { data, error, count } = await dbQuery

    if (error) throw error

    return c.json({
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      error: null,
    })
  } catch (err) {
    console.error('Error fetching styles with specs:', err)
    return c.json({ data: [], total: 0, error: getErrorMessage(err) }, 500)
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

    const { data, error } = await supabase
      .from('styles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Khong tim thay ma hang' }, 404)
      }
      throw error
    }

    return c.json({ data, error: null, message: 'Xoa ma hang thanh cong' })
  } catch (err) {
    console.error('Error deleting style:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/styles/:id/spec-colors - Get active garment colors for a style
 */
styles.get('/:id/spec-colors', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { data, error } = await supabase
      .from('style_colors')
      .select('id, color_name, hex_code')
      .eq('style_id', id)
      .eq('is_active', true)
      .order('color_name', { ascending: true })

    if (error) throw error
    return c.json({ data, error: null })
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
        suppliers:supplier_id (id, name),
        thread_types:thread_type_id (id, tex_number, tex_label, name)
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
