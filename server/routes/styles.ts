import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import { from } from '../db/sql-builder'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'

const styles = new Hono()

/**
 * GET /api/styles - List all styles with optional filtering
 * Query params:
 *   - search: unified search on style_code OR style_name
 *   - style_code: filter by style_code (legacy)
 *   - style_name: filter by style_name (legacy)
 *   - fabric_type: filter by fabric_type
 *   - exclude_ids: comma-separated IDs to exclude (e.g., "1,2,3")
 *   - limit: max results (1-2000, default: no limit)
 */
styles.get('/', requirePermission('thread.styles.view'), async (c) => {
  try {
    const query = c.req.query()

    const dbQuery = from('styles')
      .select('*')
      .is('deleted_at', null)

    // Unified search (style_code OR style_name)
    if (query.search) {
      const search = query.search.trim()
      if (search) {
        dbQuery.or([
          { column: 'style_code', op: 'ilike', value: `%${search}%` },
          { column: 'style_name', op: 'ilike', value: `%${search}%` }
        ])
      }
    }

    // Legacy individual filters (backwards compat)
    if (query.style_code) {
      dbQuery.ilike('style_code', `%${query.style_code}%`)
    }
    if (query.style_name) {
      dbQuery.ilike('style_name', `%${query.style_name}%`)
    }
    if (query.fabric_type) {
      dbQuery.ilike('fabric_type', `%${query.fabric_type}%`)
    }

    // Filter by sub_art_code (2-step: find style_ids from sub_arts, then filter)
    if (query.sub_art_code) {
      const subArtRows = await from('sub_arts')
        .select('style_id')
        .ilike('sub_art_code', `%${query.sub_art_code.trim()}%`)
        .list<{ style_id: number }>()

      const styleIds = [...new Set((subArtRows || []).map(r => r.style_id))]
      if (styleIds.length === 0) {
        return c.json({ data: [], error: null })
      }
      dbQuery.in('id', styleIds)
    }

    // Exclude specific IDs (for dropdowns with existing selections)
    if (query.exclude_ids) {
      const ids = query.exclude_ids.split(',').map(Number).filter((n: number) => !isNaN(n))
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(', ')
        dbQuery.rawWhere(`"id" NOT IN (${placeholders})`, ids)
      }
    }

    // Limit results
    if (query.limit) {
      const limit = parseInt(query.limit)
      if (!isNaN(limit) && limit > 0 && limit <= 2000) {
        dbQuery.limit(limit)
      }
    }

    dbQuery.order({ column: 'style_code', ascending: true })

    const data = await dbQuery.list()

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching styles:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

styles.get('/with-specs', requirePermission('thread.styles.view'), async (c) => {
  try {
    const query = c.req.query()

    const page = Math.max(1, parseInt(query.page || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || '25') || 25))
    const search = (query.search || '').trim()
    const descending = query.descending === 'true'

    const allowedSortColumns = ['style_code', 'style_name', 'spec_count', 'first_spec_created_at', 'last_spec_updated_at']
    const sortBy = allowedSortColumns.includes(query.sortBy || '') ? query.sortBy! : 'style_code'

    const offset = (page - 1) * pageSize

    const dbQuery = from('v_styles_with_specs')
      .select('*')

    if (search) {
      dbQuery.or([
        { column: 'style_code', op: 'ilike', value: `%${search}%` },
        { column: 'style_name', op: 'ilike', value: `%${search}%` }
      ])
    }

    const count = await dbQuery.count()

    const data = await dbQuery
      .order({ column: sortBy, ascending: !descending })
      .range(offset, offset + pageSize - 1)
      .list()

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
styles.get('/:id', requirePermission('thread.styles.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const data = await queryOne<Record<string, unknown>>(
      'SELECT * FROM styles WHERE id = $1',
      [id]
    )

    if (!data) {
      return c.json({ data: null, error: 'Khong tim thay ma hang' }, 404)
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
styles.post('/', requirePermission('thread.styles.create'), async (c) => {
  try {
    const body = await c.req.json()
    
    // Validate required fields
    if (!body.style_code) {
      return c.json({ data: null, error: 'Ma hang (style_code) la bat buoc' }, 400)
    }
    if (!body.style_name) {
      return c.json({ data: null, error: 'Ten ma hang (style_name) la bat buoc' }, 400)
    }

    let data: Record<string, unknown> | null
    try {
      data = await queryOne<Record<string, unknown>>(
        `INSERT INTO styles (style_code, style_name, description, fabric_type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          body.style_code,
          body.style_name,
          body.description ?? null,
          body.fabric_type ?? null,
        ]
      )
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        return c.json({ data: null, error: 'Ma hang da ton tai' }, 400)
      }
      throw err
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
styles.put('/:id', requirePermission('thread.styles.edit'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const body = await c.req.json()

    const updateData: Record<string, unknown> = {}
    if (body.style_code !== undefined) updateData.style_code = body.style_code
    if (body.style_name !== undefined) updateData.style_name = body.style_name
    if (body.description !== undefined) updateData.description = body.description
    if (body.fabric_type !== undefined) updateData.fabric_type = body.fabric_type
    updateData.updated_at = new Date().toISOString()

    const sets: string[] = []
    const params: unknown[] = []
    for (const [key, value] of Object.entries(updateData)) {
      params.push(value)
      sets.push(`${key} = $${params.length}`)
    }
    params.push(id)

    let data: Record<string, unknown> | null
    try {
      data = await queryOne<Record<string, unknown>>(
        `UPDATE styles SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      )
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        return c.json({ data: null, error: 'Ma hang da ton tai' }, 400)
      }
      throw err
    }

    if (!data) {
      return c.json({ data: null, error: 'Khong tim thay ma hang' }, 404)
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
styles.delete('/:id', requirePermission('thread.styles.delete'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const data = await queryOne<Record<string, unknown>>(
      `UPDATE styles SET deleted_at = $1 WHERE id = $2 RETURNING *`,
      [new Date().toISOString(), id]
    )

    if (!data) {
      return c.json({ data: null, error: 'Khong tim thay ma hang' }, 404)
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
styles.get('/:id/spec-colors', requirePermission('thread.styles.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const data = await from('style_colors')
      .select('id, color_name, hex_code')
      .eq('style_id', id)
      .eq('is_active', true)
      .order({ column: 'color_name', ascending: true })
      .list()

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching spec colors:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/styles/:id/thread-specs - Get thread specs for a style
 */
styles.get('/:id/thread-specs', requirePermission('thread.styles.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const data = await query<Record<string, unknown>>(
      `SELECT
         sts.*,
         CASE WHEN sup.id IS NULL THEN NULL
              ELSE json_build_object('id', sup.id, 'name', sup.name) END AS suppliers,
         CASE WHEN tt.id IS NULL THEN NULL
              ELSE json_build_object('id', tt.id, 'tex_number', tt.tex_number, 'tex_label', tt.tex_label, 'name', tt.name) END AS thread_types
       FROM style_thread_specs sts
       LEFT JOIN suppliers sup ON sup.id = sts.supplier_id
       LEFT JOIN thread_types tt ON tt.id = sts.thread_type_id
       WHERE sts.style_id = $1
       ORDER BY sts.created_at DESC`,
      [id]
    )

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching thread specs:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default styles
