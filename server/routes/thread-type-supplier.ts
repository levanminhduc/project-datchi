import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import { requirePermission } from '../middleware/auth'
import type {
  ThreadTypeSupplierRow,
  ThreadTypeSupplierWithRelations,
  CreateThreadTypeSupplierDTO,
  UpdateThreadTypeSupplierDTO,
  LinkSupplierDTO,
  ThreadTypeSupplierApiResponse
} from '../types/thread-type-supplier'

const threadTypeSuppliers = new Hono()

const TTS_THREAD_TYPE_EMBED = `
        CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
          'id', tt.id, 'code', tt.code, 'name', tt.name, 'material', tt.material,
          'tex_number', tt.tex_number, 'tex_label', tt.tex_label, 'color_id', tt.color_id,
          'color_data', CASE WHEN col.id IS NULL THEN NULL ELSE json_build_object('id', col.id, 'name', col.name, 'hex_code', col.hex_code) END
        ) END AS thread_type`

const TTS_SUPPLIER_EMBED = `
        CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('id', s.id, 'code', s.code, 'name', s.name) END AS supplier`

const TTS_JOINS = `
      LEFT JOIN thread_types tt ON tt.id = tts.thread_type_id
      LEFT JOIN colors col ON col.id = tt.color_id
      LEFT JOIN suppliers s ON s.id = tts.supplier_id`

threadTypeSuppliers.use('*', requirePermission('thread.suppliers.view'))

/**
 * GET /api/thread-type-suppliers - List all thread type-supplier links
 * Query params: thread_type_id, supplier_id, is_active, search
 */
threadTypeSuppliers.get('/', async (c) => {
  try {
    const threadTypeId = c.req.query('thread_type_id')
    const supplierId = c.req.query('supplier_id')
    const isActiveParam = c.req.query('is_active')
    const search = c.req.query('search')

    const conditions: string[] = []
    const params: unknown[] = []

    // Filter by thread_type_id
    if (threadTypeId) {
      params.push(parseInt(threadTypeId))
      conditions.push(`tts.thread_type_id = $${params.length}`)
    }

    // Filter by supplier_id
    if (supplierId) {
      params.push(parseInt(supplierId))
      conditions.push(`tts.supplier_id = $${params.length}`)
    }

    // Filter by is_active (default: all)
    if (isActiveParam !== undefined) {
      params.push(isActiveParam === 'true')
      conditions.push(`tts.is_active = $${params.length}`)
    }

    // Search by supplier_item_code
    if (search) {
      params.push(`%${search}%`)
      conditions.push(`tts.supplier_item_code ILIKE $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    let data: ThreadTypeSupplierWithRelations[]
    try {
      data = await query<ThreadTypeSupplierWithRelations>(
        `SELECT tts.*, ${TTS_THREAD_TYPE_EMBED}, ${TTS_SUPPLIER_EMBED}
         FROM thread_type_supplier tts${TTS_JOINS}
         ${whereClause}
         ORDER BY tts.created_at DESC`,
        params
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách liên kết loại chỉ - nhà cung cấp'
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations[]>>({
      data: data as ThreadTypeSupplierWithRelations[],
      error: null,
      message: `Đã tải ${data.length} liên kết`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/thread-type-suppliers/:id - Get single link
 */
threadTypeSuppliers.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    let data: ThreadTypeSupplierWithRelations | null
    try {
      data = await queryOne<ThreadTypeSupplierWithRelations>(
        `SELECT tts.*, ${TTS_THREAD_TYPE_EMBED}, ${TTS_SUPPLIER_EMBED}
         FROM thread_type_supplier tts${TTS_JOINS}
         WHERE tts.id = $1`,
        [id]
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin liên kết'
      }, 500)
    }

    if (!data) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy liên kết'
      }, 404)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations>>({
      data: data as ThreadTypeSupplierWithRelations,
      error: null
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * POST /api/thread-type-suppliers - Create new link
 */
threadTypeSuppliers.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateThreadTypeSupplierDTO>()

    // Validate required fields
    if (!body.thread_type_id || !body.supplier_id || !body.supplier_item_code) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: thread_type_id, supplier_id, supplier_item_code'
      }, 400)
    }

    // Check if link already exists
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM thread_type_supplier WHERE thread_type_id = $1 AND supplier_id = $2',
      [body.thread_type_id, body.supplier_id]
    )

    if (existing) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Loại chỉ này đã được liên kết với nhà cung cấp này'
      }, 409)
    }

    // Check if supplier_item_code is unique for this supplier
    const existingCode = await queryOne<{ id: number }>(
      'SELECT id FROM thread_type_supplier WHERE supplier_id = $1 AND supplier_item_code = $2',
      [body.supplier_id, body.supplier_item_code]
    )

    if (existingCode) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Mã hàng này đã tồn tại với nhà cung cấp này'
      }, 409)
    }

    // Create link
    let data: ThreadTypeSupplierWithRelations | null
    try {
      const inserted = await queryOne<{ id: number }>(
        `INSERT INTO thread_type_supplier (thread_type_id, supplier_id, supplier_item_code, unit_price, notes, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id`,
        [
          body.thread_type_id,
          body.supplier_id,
          body.supplier_item_code,
          body.unit_price ?? null,
          body.notes || null
        ]
      )

      data = await queryOne<ThreadTypeSupplierWithRelations>(
        `SELECT tts.*, ${TTS_THREAD_TYPE_EMBED}, ${TTS_SUPPLIER_EMBED}
         FROM thread_type_supplier tts${TTS_JOINS}
         WHERE tts.id = $1`,
        [inserted!.id]
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tạo liên kết: ' + ((error as Error).message ?? '')
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations>>({
      data: data as ThreadTypeSupplierWithRelations,
      error: null,
      message: 'Đã liên kết loại chỉ với nhà cung cấp'
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * PATCH /api/thread-type-suppliers/:id - Update link
 */
threadTypeSuppliers.patch('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<UpdateThreadTypeSupplierDTO>()

    // Build update object
    const updateData: Partial<ThreadTypeSupplierRow> = {}
    if (body.supplier_item_code !== undefined) updateData.supplier_item_code = body.supplier_item_code
    if (body.unit_price !== undefined) updateData.unit_price = body.unit_price
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.notes !== undefined) updateData.notes = body.notes

    if (Object.keys(updateData).length === 0) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Không có thông tin cần cập nhật'
      }, 400)
    }

    // If updating supplier_item_code, check uniqueness
    if (body.supplier_item_code) {
      const current = await queryOne<{ supplier_id: number }>(
        'SELECT supplier_id FROM thread_type_supplier WHERE id = $1',
        [id]
      )

      if (current) {
        const existingCode = await queryOne<{ id: number }>(
          'SELECT id FROM thread_type_supplier WHERE supplier_id = $1 AND supplier_item_code = $2 AND id <> $3',
          [current.supplier_id, body.supplier_item_code, id]
        )

        if (existingCode) {
          return c.json<ThreadTypeSupplierApiResponse<null>>({
            data: null,
            error: 'Mã hàng này đã tồn tại với nhà cung cấp này'
          }, 409)
        }
      }
    }

    const sets: string[] = []
    const params: unknown[] = []
    for (const [key, value] of Object.entries(updateData)) {
      params.push(value)
      sets.push(`${key} = $${params.length}`)
    }
    params.push(id)

    let data: ThreadTypeSupplierWithRelations | null
    try {
      const updated = await queryOne<{ id: number }>(
        `UPDATE thread_type_supplier SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING id`,
        params
      )

      if (!updated) {
        return c.json<ThreadTypeSupplierApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy liên kết'
        }, 404)
      }

      data = await queryOne<ThreadTypeSupplierWithRelations>(
        `SELECT tts.*, ${TTS_THREAD_TYPE_EMBED}, ${TTS_SUPPLIER_EMBED}
         FROM thread_type_supplier tts${TTS_JOINS}
         WHERE tts.id = $1`,
        [updated.id]
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật liên kết'
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations>>({
      data: data as ThreadTypeSupplierWithRelations,
      error: null,
      message: 'Đã cập nhật liên kết'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * DELETE /api/thread-type-suppliers/:id - Delete link (hard delete)
 */
threadTypeSuppliers.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    let data: ThreadTypeSupplierRow | null
    try {
      data = await queryOne<ThreadTypeSupplierRow>(
        'DELETE FROM thread_type_supplier WHERE id = $1 RETURNING *',
        [id]
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi xóa liên kết'
      }, 500)
    }

    if (!data) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy liên kết'
      }, 404)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierRow>>({
      data: data as ThreadTypeSupplierRow,
      error: null,
      message: 'Đã xóa liên kết loại chỉ - nhà cung cấp'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// ============ NESTED ROUTES FOR THREAD TYPES ============

/**
 * GET /api/thread-type-suppliers/by-thread/:threadTypeId - List suppliers for a thread type
 */
threadTypeSuppliers.get('/by-thread/:threadTypeId', async (c) => {
  try {
    const threadTypeId = parseInt(c.req.param('threadTypeId'))
    const isActiveParam = c.req.query('is_active')

    const conditions: string[] = ['tts.thread_type_id = $1']
    const params: unknown[] = [threadTypeId]

    // Filter by is_active
    if (isActiveParam !== undefined) {
      params.push(isActiveParam === 'true')
      conditions.push(`tts.is_active = $${params.length}`)
    }

    let data: ThreadTypeSupplierWithRelations[]
    try {
      data = await query<ThreadTypeSupplierWithRelations>(
        `SELECT tts.*, ${TTS_THREAD_TYPE_EMBED},
           CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('id', s.id, 'code', s.code, 'name', s.name, 'is_active', s.is_active) END AS supplier
         FROM thread_type_supplier tts${TTS_JOINS}
         WHERE ${conditions.join(' AND ')}
         ORDER BY tts.supplier_item_code ASC`,
        params
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách nhà cung cấp'
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations[]>>({
      data: data as ThreadTypeSupplierWithRelations[],
      error: null,
      message: `Đã tải ${data.length} nhà cung cấp cho loại chỉ này`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * POST /api/thread-type-suppliers/by-thread/:threadTypeId - Link supplier to thread type
 */
threadTypeSuppliers.post('/by-thread/:threadTypeId', async (c) => {
  try {
    const threadTypeId = parseInt(c.req.param('threadTypeId'))
    const body = await c.req.json<LinkSupplierDTO>()

    if (!body.supplier_id || !body.supplier_item_code) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: supplier_id, supplier_item_code'
      }, 400)
    }

    // Check if link already exists
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM thread_type_supplier WHERE thread_type_id = $1 AND supplier_id = $2',
      [threadTypeId, body.supplier_id]
    )

    if (existing) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Loại chỉ này đã được liên kết với nhà cung cấp này'
      }, 409)
    }

    // Check if supplier_item_code is unique for this supplier
    const existingCode = await queryOne<{ id: number }>(
      'SELECT id FROM thread_type_supplier WHERE supplier_id = $1 AND supplier_item_code = $2',
      [body.supplier_id, body.supplier_item_code]
    )

    if (existingCode) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Mã hàng này đã tồn tại với nhà cung cấp này'
      }, 409)
    }

    let data: ThreadTypeSupplierWithRelations | null
    try {
      const inserted = await queryOne<{ id: number }>(
        `INSERT INTO thread_type_supplier (thread_type_id, supplier_id, supplier_item_code, unit_price, notes, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id`,
        [
          threadTypeId,
          body.supplier_id,
          body.supplier_item_code,
          body.unit_price ?? null,
          body.notes || null
        ]
      )

      data = await queryOne<ThreadTypeSupplierWithRelations>(
        `SELECT tts.*, ${TTS_THREAD_TYPE_EMBED}, ${TTS_SUPPLIER_EMBED}
         FROM thread_type_supplier tts${TTS_JOINS}
         WHERE tts.id = $1`,
        [inserted!.id]
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi liên kết nhà cung cấp: ' + ((error as Error).message ?? '')
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations>>({
      data: data as ThreadTypeSupplierWithRelations,
      error: null,
      message: 'Đã liên kết nhà cung cấp với loại chỉ'
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

export default threadTypeSuppliers
