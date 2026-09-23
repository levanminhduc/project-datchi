import { Hono } from 'hono'
import { query, queryOne, querySingle } from '../db/query'
import { requirePermission } from '../middleware/auth'
import { sanitizeFilterValue } from '../utils/sanitize'
import type {
  ThreadApiResponse,
  ThreadTypeWithRelations,
  CreateThreadTypeDTO,
  UpdateThreadTypeDTO,
} from '../types/thread'

const threads = new Hono()

const COLOR_DATA_JSON = `CASE WHEN col.id IS NULL THEN NULL ELSE json_build_object(
  'id', col.id, 'name', col.name, 'hex_code', col.hex_code, 'pantone_code', col.pantone_code
) END AS color_data`

const SUPPLIER_DATA_JSON = `CASE WHEN sup.id IS NULL THEN NULL ELSE json_build_object(
  'id', sup.id, 'code', sup.code, 'name', sup.name
) END AS supplier_data`

const SUPPLIERS_JUNCTION_JSON = `COALESCE((
  SELECT json_agg(json_build_object(
    'id', tts.id,
    'thread_type_id', tts.thread_type_id,
    'supplier_id', tts.supplier_id,
    'supplier_item_code', tts.supplier_item_code,
    'unit_price', tts.unit_price,
    'is_active', tts.is_active,
    'supplier', CASE WHEN js.id IS NULL THEN NULL ELSE json_build_object(
      'id', js.id, 'code', js.code, 'name', js.name
    ) END
  ))
  FROM thread_type_supplier tts
  LEFT JOIN suppliers js ON js.id = tts.supplier_id
  WHERE tts.thread_type_id = tt.id
), '[]'::json) AS suppliers`

/**
 * GET /api/threads - List all thread types with filters
 * Supports search, color, material, supplier, and is_active filters
 * Returns joined color_data and supplier_data from FK relationships
 */
threads.get('/', requirePermission('thread.types.view'), async (c) => {
  try {
    const search = c.req.query('search') || ''
    const colorId = c.req.query('color_id')
    const material = c.req.query('material')
    const supplierId = c.req.query('supplier_id')
    const isActive = c.req.query('is_active')

    const conditions: string[] = ['tt.deleted_at IS NULL']
    const params: unknown[] = []

    // Apply search filter - searches code and name
    if (search) {
      const s = sanitizeFilterValue(search)
      params.push(`%${s}%`)
      const p = `$${params.length}`
      conditions.push(`(tt.code ILIKE ${p} OR tt.name ILIKE ${p})`)
    }

    // Apply individual filters
    if (colorId) {
      params.push(parseInt(colorId))
      conditions.push(`tt.color_id = $${params.length}`)
    }
    if (material) {
      params.push(material)
      conditions.push(`tt.material = $${params.length}`)
    }
    if (supplierId) {
      const sid = parseInt(supplierId)
      params.push(sid)
      const p = `$${params.length}`
      conditions.push(
        `(tt.supplier_id = ${p} OR tt.id IN (
           SELECT thread_type_id FROM thread_type_supplier
           WHERE supplier_id = ${p} AND is_active = TRUE
         ))`
      )
    }
    if (isActive !== undefined) {
      params.push(isActive === 'true')
      conditions.push(`tt.is_active = $${params.length}`)
    }

    let data: ThreadTypeWithRelations[]
    try {
      data = await query<ThreadTypeWithRelations>(
        `SELECT tt.*,
                ${COLOR_DATA_JSON},
                ${SUPPLIER_DATA_JSON},
                ${SUPPLIERS_JUNCTION_JSON}
         FROM thread_types tt
         LEFT JOIN colors col ON col.id = tt.color_id
         LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY tt.created_at DESC`,
        params
      )
    } catch (error) {
      console.error('Thread types list error:', error)
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
 * GET /api/threads/tex-options?supplier_id=X
 * Returns distinct tex values for a supplier (lightweight, ~4 rows)
 */
threads.get('/tex-options', requirePermission('thread.types.view'), async (c) => {
  try {
    const supplierId = c.req.query('supplier_id')

    if (!supplierId) {
      return c.json({ data: null, error: 'supplier_id là bắt buộc' }, 400)
    }

    const sid = parseInt(supplierId)

    const data = await query('SELECT * FROM fn_get_tex_options_by_supplier($1)', [sid])

    return c.json({ data: data || [], error: null })
  } catch (err) {
    console.error('Error fetching tex options:', err)
    return c.json({ data: null, error: err instanceof Error ? err.message : 'Lỗi hệ thống' }, 500)
  }
})

/**
 * GET /api/threads/:id - Get single thread type by ID
 * Returns joined color_data, supplier_data, and suppliers from junction table
 */
threads.get('/:id', requirePermission('thread.types.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'ID không hợp lệ' },
        400
      )
    }

    const data = await queryOne<ThreadTypeWithRelations>(
      `SELECT tt.*,
              ${COLOR_DATA_JSON},
              ${SUPPLIER_DATA_JSON},
              ${SUPPLIERS_JUNCTION_JSON}
       FROM thread_types tt
       LEFT JOIN colors col ON col.id = tt.color_id
       LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
       WHERE tt.id = $1`,
      [id]
    )

    if (!data) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Không tìm thấy loại chỉ' },
        404
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
threads.post('/', requirePermission('thread.types.create'), async (c) => {
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
    const existing = await queryOne<{ id: number }>(
      `SELECT id FROM thread_types WHERE code = $1`,
      [body.code]
    )

    if (existing) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: `Mã loại chỉ "${body.code}" đã tồn tại` },
        409
      )
    }

    const insertData: Record<string, unknown> = {
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

    const insertCols = Object.keys(insertData)
    const insertVals = Object.values(insertData)
    const insertPlaceholders = insertCols.map((_, i) => `$${i + 1}`)

    let data: ThreadTypeWithRelations | null
    try {
      data = await querySingle<ThreadTypeWithRelations>(
        `WITH ins AS (
           INSERT INTO thread_types (${insertCols.join(', ')})
           VALUES (${insertPlaceholders.join(', ')})
           RETURNING *
         )
         SELECT ins.*,
                ${COLOR_DATA_JSON},
                ${SUPPLIER_DATA_JSON}
         FROM ins AS tt
         LEFT JOIN colors col ON col.id = tt.color_id
         LEFT JOIN suppliers sup ON sup.id = tt.supplier_id`,
        insertVals
      )
    } catch (error) {
      console.error('Thread type insert error:', error)
      const msg = error instanceof Error ? error.message : String(error)
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Lỗi khi tạo loại chỉ: ' + msg },
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
threads.put('/:id', requirePermission('thread.types.edit'), async (c) => {
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
    const existing = await queryOne<{ id: number }>(
      `SELECT id FROM thread_types WHERE id = $1`,
      [id]
    )

    if (!existing) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Không tìm thấy loại chỉ' },
        404
      )
    }

    // If updating code, check for duplicates (excluding current record)
    if (body.code) {
      const duplicate = await queryOne<{ id: number }>(
        `SELECT id FROM thread_types WHERE code = $1 AND id <> $2`,
        [body.code, id]
      )

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

    const sets: string[] = []
    const params: unknown[] = []
    for (const [key, value] of Object.entries(updateData)) {
      params.push(value)
      sets.push(`${key} = $${params.length}`)
    }
    params.push(id)
    const idPlaceholder = `$${params.length}`

    let data: ThreadTypeWithRelations | null
    try {
      if (sets.length === 0) {
        data = await queryOne<ThreadTypeWithRelations>(
          `SELECT tt.*,
                  ${COLOR_DATA_JSON},
                  ${SUPPLIER_DATA_JSON}
           FROM thread_types tt
           LEFT JOIN colors col ON col.id = tt.color_id
           LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
           WHERE tt.id = ${idPlaceholder}`,
          [id]
        )
      } else {
        data = await querySingle<ThreadTypeWithRelations>(
          `WITH upd AS (
             UPDATE thread_types SET ${sets.join(', ')}
             WHERE id = ${idPlaceholder}
             RETURNING *
           )
           SELECT upd.*,
                  ${COLOR_DATA_JSON},
                  ${SUPPLIER_DATA_JSON}
           FROM upd AS tt
           LEFT JOIN colors col ON col.id = tt.color_id
           LEFT JOIN suppliers sup ON sup.id = tt.supplier_id`,
          params
        )
      }
    } catch (error) {
      console.error('Thread type update error:', error)
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
threads.delete('/:id', requirePermission('thread.types.delete'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'ID không hợp lệ' },
        400
      )
    }

    // Check if record exists
    const existing = await queryOne<{ id: number }>(
      `SELECT id FROM thread_types WHERE id = $1`,
      [id]
    )

    if (!existing) {
      return c.json<ThreadApiResponse<null>>(
        { data: null, error: 'Không tìm thấy loại chỉ' },
        404
      )
    }

    try {
      await query(
        `UPDATE thread_types SET is_active = false, deleted_at = $1 WHERE id = $2`,
        [new Date().toISOString(), id]
      )
    } catch (error) {
      console.error('Thread type delete error:', error)
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
