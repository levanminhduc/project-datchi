import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import { requirePermission } from '../middleware/auth'
import { sanitizeFilterValue } from '../utils/sanitize'
import type {
  LotRow,
  LotStatus,
  CreateLotRequest,
  UpdateLotRequest,
  BatchApiResponse
} from '../types/batch'

const lots = new Hono()

const LOT_EMBED_FULL = `
        CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
          'id', tt.id, 'code', tt.code, 'name', tt.name,
          'color_data', CASE WHEN col.id IS NULL THEN NULL ELSE json_build_object('name', col.name, 'hex_code', col.hex_code) END
        ) END AS thread_type,
        CASE WHEN w.id IS NULL THEN NULL ELSE json_build_object('id', w.id, 'code', w.code, 'name', w.name) END AS warehouse,
        CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('id', s.id, 'code', s.code, 'name', s.name) END AS supplier_data`

const LOT_JOINS_FULL = `
      LEFT JOIN thread_types tt ON tt.id = l.thread_type_id
      LEFT JOIN colors col ON col.id = tt.color_id
      LEFT JOIN warehouses w ON w.id = l.warehouse_id
      LEFT JOIN suppliers s ON s.id = l.supplier_id`

/**
 * POST /api/lots - Create new lot
 */
lots.post('/', requirePermission('thread.lots.manage'), async (c) => {
  try {
    const body = await c.req.json<CreateLotRequest>()

    // Validate required fields
    if (!body.lot_number || !body.thread_type_id || !body.warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: lot_number, thread_type_id, warehouse_id'
      }, 400)
    }

    // Check for duplicate lot_number
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM lots WHERE lot_number = $1',
      [body.lot_number]
    )

    if (existing) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Mã lô đã tồn tại'
      }, 409)
    }

    let data: LotRow | null
    try {
      const inserted = await queryOne<{ id: number }>(
        `INSERT INTO lots (
           lot_number, thread_type_id, warehouse_id, production_date,
           expiry_date, supplier_id, notes, status, total_cones, available_cones
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', 0, 0)
         RETURNING id`,
        [
          body.lot_number,
          body.thread_type_id,
          body.warehouse_id,
          body.production_date || null,
          body.expiry_date || null,
          body.supplier_id || null,
          body.notes || null
        ]
      )

      data = await queryOne<LotRow>(
        `SELECT l.*, ${LOT_EMBED_FULL}
         FROM lots l${LOT_JOINS_FULL}
         WHERE l.id = $1`,
        [inserted!.id]
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tạo lô: ' + ((error as Error).message ?? '')
      }, 500)
    }

    return c.json<BatchApiResponse<LotRow>>({
      data: data as LotRow,
      error: null,
      message: 'Đã tạo lô mới'
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/lots - List lots with filters
 * Query params: status, warehouse_id, thread_type_id, search, supplier_id
 * Returns joined supplier_data from FK relationship
 */
lots.get('/', requirePermission('thread.lots.view'), async (c) => {
  try {
    const status = c.req.query('status') as LotStatus | undefined
    const warehouseId = c.req.query('warehouse_id')
    const threadTypeId = c.req.query('thread_type_id')
    const supplierId = c.req.query('supplier_id')
    const search = c.req.query('search')

    const conditions: string[] = []
    const params: unknown[] = []

    if (status) {
      params.push(status)
      conditions.push(`l.status = $${params.length}`)
    }
    if (warehouseId) {
      const conesInWarehouse = await query<{ lot_id: number | null; lot_number: string | null }>(
        `SELECT lot_id, lot_number FROM thread_inventory
         WHERE warehouse_id = $1 AND status = ANY($2)`,
        [parseInt(warehouseId), ['AVAILABLE', 'RECEIVED']]
      )

      const lotIds: number[] = []
      const lotNumbers: string[] = []

      for (const cone of conesInWarehouse || []) {
        if (cone.lot_id !== null) {
          lotIds.push(cone.lot_id)
        } else if (cone.lot_number) {
          lotNumbers.push(cone.lot_number)
        }
      }

      const uniqueLotIds = [...new Set(lotIds)]
      const uniqueLotNumbers = [...new Set(lotNumbers)]

      if (uniqueLotIds.length === 0 && uniqueLotNumbers.length === 0) {
        return c.json<BatchApiResponse<LotRow[]>>({
          data: [],
          error: null,
          message: 'Không có lô nào có chỉ trong kho này'
        })
      }

      if (uniqueLotIds.length > 0 && uniqueLotNumbers.length > 0) {
        params.push(uniqueLotIds)
        const idsPlaceholder = `$${params.length}`
        params.push(uniqueLotNumbers)
        const numbersPlaceholder = `$${params.length}`
        conditions.push(`(l.id = ANY(${idsPlaceholder}) OR l.lot_number = ANY(${numbersPlaceholder}))`)
      } else if (uniqueLotIds.length > 0) {
        params.push(uniqueLotIds)
        conditions.push(`l.id = ANY($${params.length})`)
      } else {
        params.push(uniqueLotNumbers)
        conditions.push(`l.lot_number = ANY($${params.length})`)
      }
    }
    if (threadTypeId) {
      params.push(parseInt(threadTypeId))
      conditions.push(`l.thread_type_id = $${params.length}`)
    }
    if (supplierId) {
      params.push(parseInt(supplierId))
      conditions.push(`l.supplier_id = $${params.length}`)
    }
    if (search) {
      params.push(`%${sanitizeFilterValue(search)}%`)
      conditions.push(`l.lot_number ILIKE $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    let data: LotRow[]
    try {
      data = await query<LotRow>(
        `SELECT l.*, ${LOT_EMBED_FULL}
         FROM lots l${LOT_JOINS_FULL}
         ${whereClause}
         ORDER BY l.created_at DESC`,
        params
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách lô'
      }, 500)
    }

    return c.json<BatchApiResponse<LotRow[]>>({
      data: data as LotRow[],
      error: null,
      message: `Đã tải ${data.length} lô`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/lots/:id - Get lot details with cone count
 */
lots.get('/:id', requirePermission('thread.lots.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    let data: LotRow | null
    try {
      data = await queryOne<LotRow>(
        `SELECT l.*,
           CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
             'id', tt.id, 'code', tt.code, 'name', tt.name,
             'color_data', CASE WHEN col.id IS NULL THEN NULL ELSE json_build_object('name', col.name, 'hex_code', col.hex_code) END
           ) END AS thread_type,
           CASE WHEN w.id IS NULL THEN NULL ELSE json_build_object('id', w.id, 'code', w.code, 'name', w.name) END AS warehouse
         FROM lots l
         LEFT JOIN thread_types tt ON tt.id = l.thread_type_id
         LEFT JOIN colors col ON col.id = tt.color_id
         LEFT JOIN warehouses w ON w.id = l.warehouse_id
         WHERE l.id = $1`,
        [id]
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin lô'
      }, 500)
    }

    if (!data) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy lô'
      }, 404)
    }

    return c.json<BatchApiResponse<LotRow>>({
      data: data as LotRow,
      error: null
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * PATCH /api/lots/:id - Update lot metadata and status
 */
lots.patch('/:id', requirePermission('thread.lots.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<UpdateLotRequest>()

    // Build update object with only provided fields
    const updateData: Partial<LotRow> = {}
    if (body.production_date !== undefined) updateData.production_date = body.production_date
    if (body.expiry_date !== undefined) updateData.expiry_date = body.expiry_date
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes

    if (body.supplier_id !== undefined) updateData.supplier_id = body.supplier_id

    if (Object.keys(updateData).length === 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Không có thông tin cần cập nhật'
      }, 400)
    }

    const sets: string[] = []
    const params: unknown[] = []
    for (const [key, value] of Object.entries(updateData)) {
      params.push(value)
      sets.push(`${key} = $${params.length}`)
    }
    params.push(id)

    let data: LotRow | null
    try {
      const updated = await queryOne<{ id: number }>(
        `UPDATE lots SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING id`,
        params
      )

      if (!updated) {
        return c.json<BatchApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy lô'
        }, 404)
      }

      data = await queryOne<LotRow>(
        `SELECT l.*, ${LOT_EMBED_FULL}
         FROM lots l${LOT_JOINS_FULL}
         WHERE l.id = $1`,
        [updated.id]
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật lô'
      }, 500)
    }

    return c.json<BatchApiResponse<LotRow>>({
      data: data as LotRow,
      error: null,
      message: 'Đã cập nhật thông tin lô'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/lots/:id/cones - Get cones belonging to lot
 */
lots.get('/:id/cones', requirePermission('thread.lots.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    let data: unknown[]
    try {
      data = await query<Record<string, unknown>>(
        `SELECT ti.*,
           CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
             'id', tt.id, 'code', tt.code, 'name', tt.name,
             'color_data', CASE WHEN col.id IS NULL THEN NULL ELSE json_build_object('name', col.name, 'hex_code', col.hex_code) END
           ) END AS thread_type,
           CASE WHEN w.id IS NULL THEN NULL ELSE json_build_object('id', w.id, 'code', w.code, 'name', w.name) END AS warehouse
         FROM thread_inventory ti
         LEFT JOIN thread_types tt ON tt.id = ti.thread_type_id
         LEFT JOIN colors col ON col.id = tt.color_id
         LEFT JOIN warehouses w ON w.id = ti.warehouse_id
         WHERE ti.lot_id = $1
         ORDER BY ti.cone_id ASC`,
        [id]
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách cuộn'
      }, 500)
    }

    return c.json<BatchApiResponse<unknown[]>>({
      data: data,
      error: null,
      message: `Đã tải ${data.length} cuộn`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/lots/:id/transactions - Get transaction history for lot
 */
lots.get('/:id/transactions', requirePermission('thread.lots.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    let data: unknown[]
    try {
      data = await query<Record<string, unknown>>(
        `SELECT bt.*,
           CASE WHEN l.id IS NULL THEN NULL ELSE json_build_object('id', l.id, 'lot_number', l.lot_number) END AS lot,
           CASE WHEN fw.id IS NULL THEN NULL ELSE json_build_object('id', fw.id, 'code', fw.code, 'name', fw.name) END AS from_warehouse,
           CASE WHEN tw.id IS NULL THEN NULL ELSE json_build_object('id', tw.id, 'code', tw.code, 'name', tw.name) END AS to_warehouse
         FROM batch_transactions bt
         LEFT JOIN lots l ON l.id = bt.lot_id
         LEFT JOIN warehouses fw ON fw.id = bt.from_warehouse_id
         LEFT JOIN warehouses tw ON tw.id = bt.to_warehouse_id
         WHERE bt.lot_id = $1
         ORDER BY bt.performed_at DESC`,
        [id]
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải lịch sử thao tác'
      }, 500)
    }

    return c.json<BatchApiResponse<unknown[]>>({
      data: data,
      error: null,
      message: `Đã tải ${data.length} thao tác`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

export default lots
