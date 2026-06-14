import { Hono } from 'hono'
import { query, queryOne, querySingle, queryCount } from '../db/query'
import { getErrorMessage } from '../utils/errorHelper'
import { requirePermission } from '../middleware/auth'
import { sanitizeFilterValue } from '../utils/sanitize'
import type {
  BatchReceiveRequest,
  BatchTransferRequest,
  BatchIssueRequest,
  BatchReturnRequest,
  BatchApiResponse,
  BatchOperationResult,
  BatchTransactionRow,
  LotRow,
} from '../types/batch'

const batch = new Hono()

const BATCH_LIMIT = 500
const TRANSFER_BATCH_LIMIT = 10000

/**
 * POST /api/batch/receive - Batch receive cones into inventory
 */
batch.post('/receive', requirePermission('thread.batch.receive'), async (c) => {
  try {
    const body = await c.req.json<BatchReceiveRequest>()

    // Validate required fields
    if (!body.cone_ids || body.cone_ids.length === 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Danh sách cone_ids không được rỗng'
      }, 400)
    }

    if (body.cone_ids.length > BATCH_LIMIT) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `Vượt quá giới hạn ${BATCH_LIMIT} cuộn mỗi lần nhập`
      }, 400)
    }

    if (!body.thread_type_id || !body.warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: thread_type_id, warehouse_id'
      }, 400)
    }

    // Check for duplicate cone_ids in system
    const existingCones = await query<{ cone_id: string }>(
      'SELECT cone_id FROM thread_inventory WHERE cone_id = ANY($1)',
      [body.cone_ids]
    )

    if (existingCones && existingCones.length > 0) {
      const duplicates = existingCones.map(c => c.cone_id).join(', ')
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `Các mã cuộn đã tồn tại: ${duplicates}`
      }, 400)
    }

    let lotId = body.lot_id
    let lotNumber = body.lot_number

    // Create new lot if lot_id not provided
    if (!lotId && lotNumber) {
      // Check for duplicate lot_number
      const existingLot = await queryOne<{ id: number }>(
        'SELECT id FROM lots WHERE lot_number = $1',
        [lotNumber]
      )

      if (existingLot) {
        return c.json<BatchApiResponse<null>>({
          data: null,
          error: 'Mã lô đã tồn tại'
        }, 409)
      }

      // Create new lot
      let newLot: LotRow | null
      try {
        newLot = await queryOne<LotRow>(
          `INSERT INTO lots
             (lot_number, thread_type_id, warehouse_id, production_date, expiry_date, notes, status, total_cones, available_cones)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            lotNumber,
            body.thread_type_id,
            body.warehouse_id,
            body.production_date || null,
            body.expiry_date || null,
            body.notes || null,
            'ACTIVE',
            0,
            0,
          ]
        )
      } catch (lotError) {
        console.error('Lot creation error:', lotError)
        return c.json<BatchApiResponse<null>>({
          data: null,
          error: 'Lỗi khi tạo lô mới'
        }, 500)
      }

      lotId = (newLot as LotRow).id
    } else if (lotId) {
      // Get lot_number from existing lot
      const existingLot = await queryOne<{ lot_number: string }>(
        'SELECT lot_number FROM lots WHERE id = $1',
        [lotId]
      )

      if (existingLot) {
        lotNumber = existingLot.lot_number
      }
    }

    // Get thread type for meters calculation + color_id
    const threadType = await queryOne<{ meters_per_cone: number | null; density_grams_per_meter: number | null; color_id: number | null }>(
      'SELECT meters_per_cone, density_grams_per_meter, color_id FROM thread_types WHERE id = $1',
      [body.thread_type_id]
    )

    const metersPerCone = body.quantity_meters_per_cone || threadType?.meters_per_cone || 5000
    const weightPerCone = body.weight_per_cone_grams || null

    // Create cone records
    const cones = body.cone_ids.map(coneId => ({
      cone_id: coneId,
      thread_type_id: body.thread_type_id,
      warehouse_id: body.warehouse_id,
      quantity_cones: 1,
      quantity_meters: metersPerCone,
      weight_grams: weightPerCone,
      is_partial: false,
      status: 'RECEIVED' as const,
      lot_number: lotNumber || null,
      lot_id: lotId || null,
      expiry_date: body.expiry_date || null,
      received_date: new Date().toISOString().split('T')[0],
      color_id: threadType?.color_id ?? null,
    }))

    const valuesClauses: string[] = []
    const insertParams: unknown[] = []
    for (const cone of cones) {
      const base = insertParams.length
      valuesClauses.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13})`
      )
      insertParams.push(
        cone.cone_id,
        cone.thread_type_id,
        cone.warehouse_id,
        cone.quantity_cones,
        cone.quantity_meters,
        cone.weight_grams,
        cone.is_partial,
        cone.status,
        cone.lot_number,
        cone.lot_id,
        cone.expiry_date,
        cone.received_date,
        cone.color_id,
      )
    }

    let insertedCones: { id: number }[]
    try {
      insertedCones = await query<{ id: number }>(
        `INSERT INTO thread_inventory
           (cone_id, thread_type_id, warehouse_id, quantity_cones, quantity_meters, weight_grams, is_partial, status, lot_number, lot_id, expiry_date, received_date, color_id)
         VALUES ${valuesClauses.join(', ')}
         RETURNING id`,
        insertParams
      )
    } catch (insertError) {
      console.error('Cone insertion error:', insertError)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi nhập cuộn: ' + getErrorMessage(insertError)
      }, 500)
    }

    const coneDbIds = insertedCones?.map(c => c.id) || []

    // Update lot counts if lot was used
    if (lotId) {
      // Get current cone count for the lot
      const count = await queryCount(
        'SELECT count(*)::int AS count FROM thread_inventory WHERE lot_id = $1',
        [lotId]
      )

      const availableCount = await queryCount(
        `SELECT count(*)::int AS count FROM thread_inventory WHERE lot_id = $1 AND status = $2`,
        [lotId, 'AVAILABLE']
      )

      await query(
        'UPDATE lots SET total_cones = $1, available_cones = $2 WHERE id = $3',
        [count || cones.length, availableCount || cones.length, lotId]
      )
    }

    // Log transaction
    let transaction: { id: number } | null = null
    try {
      transaction = await queryOne<{ id: number }>(
        `INSERT INTO batch_transactions
           (operation_type, lot_id, to_warehouse_id, cone_ids, cone_count, notes, performed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          'RECEIVE',
          lotId || null,
          body.warehouse_id,
          coneDbIds,
          cones.length,
          body.notes || null,
          new Date().toISOString(),
        ]
      )
    } catch (txError) {
      console.error('Transaction log error:', txError)
    }

    return c.json<BatchApiResponse<BatchOperationResult>>({
      data: {
        transaction_id: transaction?.id || 0,
        operation_type: 'RECEIVE',
        cone_count: cones.length,
        lot_id: lotId || undefined
      },
      error: null,
      message: `Đã nhập ${cones.length} cuộn vào kho`
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
 * GET /api/batch/transferable-summary - Aggregate transferable cones by thread type + color
 */
batch.get('/transferable-summary', requirePermission('thread.batch.transfer'), async (c) => {
  try {
    const warehouseId = Number(c.req.query('warehouse_id'))
    if (!warehouseId) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'warehouse_id là bắt buộc'
      }, 400)
    }

    const TRANSFERABLE_STATUSES = ['AVAILABLE', 'RECEIVED', 'INSPECTED']

    let cones: Array<{
      id: number
      thread_type_id: number
      color_id: number | null
      status: string | null
      reserved_week_id: number | null
      thread_types: { code: string; name: string; tex_number: string; supplier_id: number | null; suppliers: { name: string } | null } | null
      colors: { name: string; hex_code: string | null } | null
    }>
    try {
      cones = await query(
        `SELECT
           ti.id, ti.thread_type_id, ti.color_id, ti.status::text AS status,
           ti.reserved_week_id,
           json_build_object(
             'code', tt.code, 'name', tt.name, 'tex_number', tt.tex_number,
             'supplier_id', tt.supplier_id,
             'suppliers', CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('name', s.name) END
           ) AS thread_types,
           CASE WHEN co.id IS NULL THEN NULL
                ELSE json_build_object('name', co.name, 'hex_code', co.hex_code) END AS colors
         FROM thread_inventory ti
         JOIN thread_types tt ON tt.id = ti.thread_type_id
         LEFT JOIN suppliers s ON s.id = tt.supplier_id
         LEFT JOIN colors co ON co.id = ti.color_id
         WHERE ti.warehouse_id = $1
           AND ti.status::text = ANY($2)
         LIMIT 150000`,
        [warehouseId, [...TRANSFERABLE_STATUSES, 'RESERVED_FOR_ORDER']]
      )
    } catch (coneError) {
      console.error('Transferable summary error:', coneError)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải tổng hợp khả chuyển'
      }, 500)
    }

    interface GroupData {
      thread_type_id: number
      thread_code: string
      thread_name: string
      supplier_name: string
      tex_number: string
      color_id: number
      color_name: string
      color_hex: string | null
      transferable_count: number
      reserved_count: number
      reserved_by_week_map: Map<number, { week_id: number; week_name: string; count: number }>
    }

    const groups = new Map<string, GroupData>()

    const weekIds = new Set<number>()
    for (const cone of cones || []) {
      if ((cone as any).reserved_week_id) weekIds.add((cone as any).reserved_week_id)
    }

    const weekMap = new Map<number, string>()
    if (weekIds.size > 0) {
      const weeks = await query<{ id: number; week_name: string }>(
        'SELECT id, week_name FROM thread_order_weeks WHERE id = ANY($1)',
        [[...weekIds]]
      )
      for (const w of weeks || []) {
        weekMap.set(w.id, w.week_name)
      }
    }

    for (const cone of cones || []) {
      const tt = cone.thread_types as any
      const color = cone.colors as any
      const colorId = (cone as any).color_id || 0
      const key = `${cone.thread_type_id}-${colorId}`

      if (!groups.has(key)) {
        groups.set(key, {
          thread_type_id: cone.thread_type_id,
          thread_code: tt?.code || '',
          thread_name: tt?.name || '',
          supplier_name: tt?.suppliers?.name || '',
          tex_number: tt?.tex_number || '',
          color_id: colorId,
          color_name: color?.name || '',
          color_hex: color?.hex_code || null,
          transferable_count: 0,
          reserved_count: 0,
          reserved_by_week_map: new Map()
        })
      }

      const group = groups.get(key)!
      if (TRANSFERABLE_STATUSES.includes(cone.status!)) {
        group.transferable_count++
      } else if (cone.status === 'RESERVED_FOR_ORDER') {
        group.reserved_count++
        const weekId = (cone as any).reserved_week_id
        if (weekId) {
          if (!group.reserved_by_week_map.has(weekId)) {
            group.reserved_by_week_map.set(weekId, {
              week_id: weekId,
              week_name: weekMap.get(weekId) || `Week ${weekId}`,
              count: 0
            })
          }
          group.reserved_by_week_map.get(weekId)!.count++
        }
      }
    }

    const result = [...groups.values()].map(g => ({
      thread_type_id: g.thread_type_id,
      thread_code: g.thread_code,
      thread_name: g.thread_name,
      supplier_name: g.supplier_name,
      tex_number: g.tex_number,
      color_id: g.color_id,
      color_name: g.color_name,
      color_hex: g.color_hex,
      transferable_count: g.transferable_count,
      reserved_count: g.reserved_count,
      reserved_by_week: [...g.reserved_by_week_map.values()]
    }))

    return c.json<BatchApiResponse<typeof result>>({
      data: result,
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
 * POST /api/batch/transfer - Batch transfer cones between warehouses
 */
batch.post('/transfer', requirePermission('thread.batch.transfer'), async (c) => {
  try {
    const body = await c.req.json<BatchTransferRequest>()

    // Validate warehouses
    if (!body.from_warehouse_id || !body.to_warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin kho nguồn hoặc kho đích'
      }, 400)
    }

    if (body.from_warehouse_id === body.to_warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Kho nguồn và kho đích không được trùng nhau'
      }, 400)
    }

    let coneIds: number[] = []
    let transferableMoved = 0
    let reservedMoved = 0

    if (body.thread_type_id && body.color_id && body.quantity) {
      if (body.quantity > TRANSFER_BATCH_LIMIT) {
        return c.json<BatchApiResponse<null>>({
          data: null,
          error: `Tối đa ${TRANSFER_BATCH_LIMIT.toLocaleString()} cuộn mỗi lần chuyển`
        }, 400)
      }

      const TRANSFERABLE_STATUSES = ['AVAILABLE', 'RECEIVED', 'INSPECTED']
      let remaining = body.quantity

      const transferableCones = await query<{ id: number }>(
        `SELECT id FROM thread_inventory
         WHERE thread_type_id = $1 AND color_id = $2 AND warehouse_id = $3
           AND status::text = ANY($4)
         ORDER BY id ASC
         LIMIT $5`,
        [body.thread_type_id, body.color_id, body.from_warehouse_id, TRANSFERABLE_STATUSES, remaining]
      )

      const transferableIds = (transferableCones || []).map(c => c.id)
      transferableMoved = transferableIds.length
      coneIds.push(...transferableIds)
      remaining -= transferableIds.length

      if (remaining > 0 && body.include_reserved) {
        const reservedCones = await query<{ id: number }>(
          `SELECT id FROM thread_inventory
           WHERE thread_type_id = $1 AND color_id = $2 AND warehouse_id = $3
             AND status = $4
           ORDER BY id ASC
           LIMIT $5`,
          [body.thread_type_id, body.color_id, body.from_warehouse_id, 'RESERVED_FOR_ORDER', remaining]
        )

        const reservedIds = (reservedCones || []).map(c => c.id)
        reservedMoved = reservedIds.length
        coneIds.push(...reservedIds)
      }

    } else if (body.lot_id) {
      const lotCones = await query<{ id: number; warehouse_id: number; status: string }>(
        `SELECT id, warehouse_id, status::text AS status FROM thread_inventory
         WHERE lot_id = $1 AND warehouse_id = $2 AND status::text = ANY($3)`,
        [body.lot_id, body.from_warehouse_id, ['AVAILABLE', 'RECEIVED', 'INSPECTED']]
      )
      coneIds = lotCones?.map(c => c.id) || []
      transferableMoved = coneIds.length

    } else if (body.cone_ids && body.cone_ids.length > 0) {
      coneIds = body.cone_ids
      transferableMoved = coneIds.length
    }

    if (coneIds.length === 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Không có cuộn nào để chuyển'
      }, 400)
    }

    if (!body.thread_type_id && coneIds.length > BATCH_LIMIT) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `Vượt quá giới hạn ${BATCH_LIMIT} cuộn mỗi lần chuyển`
      }, 400)
    }

    if (!body.thread_type_id) {
      const validCones = await query<{ id: number; warehouse_id: number; status: string }>(
        'SELECT id, warehouse_id, status::text AS status FROM thread_inventory WHERE id = ANY($1)',
        [coneIds]
      )

      const invalidCones = validCones?.filter(
        c => c.warehouse_id !== body.from_warehouse_id ||
             !['AVAILABLE', 'RECEIVED', 'INSPECTED'].includes(c.status)
      ) || []

      if (invalidCones.length > 0) {
        return c.json<BatchApiResponse<null>>({
          data: null,
          error: `${invalidCones.length} cuộn không hợp lệ để chuyển (sai kho hoặc trạng thái)`
        }, 400)
      }
    }

    // Update warehouse_id for all cones
    try {
      await query(
        'UPDATE thread_inventory SET warehouse_id = $1 WHERE id = ANY($2)',
        [body.to_warehouse_id, coneIds]
      )
    } catch (updateError) {
      console.error('Transfer error:', updateError)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi chuyển cuộn'
      }, 500)
    }

    // Update lot warehouse if entire lot was transferred
    if (body.lot_id) {
      // Check if this is a full lot transfer (all cones from lot in source warehouse)
      const remainingCount = await queryCount(
        `SELECT count(*)::int AS count FROM thread_inventory
         WHERE lot_id = $1 AND warehouse_id = $2 AND status::text = ANY($3)`,
        [body.lot_id, body.from_warehouse_id, ['AVAILABLE', 'RECEIVED', 'INSPECTED']]
      )

      const isFullLotTransfer = remainingCount === 0

      if (isFullLotTransfer) {
        await query(
          'UPDATE lots SET warehouse_id = $1 WHERE id = $2',
          [body.to_warehouse_id, body.lot_id]
        )
      }
    }

    // Log transaction
    const transaction = await queryOne<{ id: number }>(
      `INSERT INTO batch_transactions
         (operation_type, lot_id, from_warehouse_id, to_warehouse_id, cone_ids, cone_count, notes, performed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        'TRANSFER',
        body.lot_id || null,
        body.from_warehouse_id,
        body.to_warehouse_id,
        coneIds,
        coneIds.length,
        body.notes || null,
        new Date().toISOString(),
      ]
    )

    return c.json<BatchApiResponse<BatchOperationResult & { transferable_moved?: number; reserved_moved?: number }>>({
      data: {
        transaction_id: transaction?.id || 0,
        operation_type: 'TRANSFER',
        cone_count: coneIds.length,
        lot_id: body.lot_id || undefined,
        transferable_moved: transferableMoved,
        reserved_moved: reservedMoved
      },
      error: null,
      message: `Đã chuyển ${coneIds.length} cuộn`
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
 * POST /api/batch/issue - Batch issue cones from inventory
 */
batch.post('/issue', requirePermission('thread.batch.issue'), async (c) => {
  try {
    const body = await c.req.json<BatchIssueRequest>()

    // Validate required fields
    if (!body.warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin kho xuất'
      }, 400)
    }

    if (!body.recipient) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin người nhận'
      }, 400)
    }

    let coneIds: number[] = []

    // Get cones by lot or by explicit IDs
    if (body.lot_id) {
      const lotCones = await query<{ id: number }>(
        `SELECT id FROM thread_inventory
         WHERE lot_id = $1 AND warehouse_id = $2 AND status = $3`,
        [body.lot_id, body.warehouse_id, 'AVAILABLE']
      )

      coneIds = lotCones?.map(c => c.id) || []
    } else if (body.cone_ids && body.cone_ids.length > 0) {
      coneIds = body.cone_ids
    }

    if (coneIds.length === 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Không có cuộn nào để xuất'
      }, 400)
    }

    if (coneIds.length > BATCH_LIMIT) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `Vượt quá giới hạn ${BATCH_LIMIT} cuộn mỗi lần xuất`
      }, 400)
    }

    // Validate all cones are available
    const validCones = await query<{ id: number; warehouse_id: number; status: string }>(
      'SELECT id, warehouse_id, status::text AS status FROM thread_inventory WHERE id = ANY($1)',
      [coneIds]
    )

    const invalidCones = validCones?.filter(
      c => c.warehouse_id !== body.warehouse_id || c.status !== 'AVAILABLE'
    ) || []

    if (invalidCones.length > 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `${invalidCones.length} cuộn không hợp lệ để xuất`
      }, 400)
    }

    // Update status for all cones
    try {
      await query(
        'UPDATE thread_inventory SET status = $1 WHERE id = ANY($2)',
        ['HARD_ALLOCATED', coneIds]
      )
    } catch (updateError) {
      console.error('Issue error:', updateError)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi xuất cuộn'
      }, 500)
    }

    // Update lot available_cones count
    if (body.lot_id) {
      const remaining = await queryCount(
        `SELECT count(*)::int AS count FROM thread_inventory
         WHERE lot_id = $1 AND status = $2`,
        [body.lot_id, 'AVAILABLE']
      )

      await query(
        'UPDATE lots SET available_cones = $1, status = $2 WHERE id = $3',
        [remaining, remaining === 0 ? 'DEPLETED' : 'ACTIVE', body.lot_id]
      )
    }

    // Log transaction
    const transaction = await queryOne<{ id: number }>(
      `INSERT INTO batch_transactions
         (operation_type, lot_id, from_warehouse_id, cone_ids, cone_count, recipient, reference_number, notes, performed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        'ISSUE',
        body.lot_id || null,
        body.warehouse_id,
        coneIds,
        coneIds.length,
        body.recipient,
        body.reference_number || null,
        body.notes || null,
        new Date().toISOString(),
      ]
    )

    return c.json<BatchApiResponse<BatchOperationResult>>({
      data: {
        transaction_id: transaction?.id || 0,
        operation_type: 'ISSUE',
        cone_count: coneIds.length,
        lot_id: body.lot_id || undefined
      },
      error: null,
      message: `Đã xuất ${coneIds.length} cuộn cho ${body.recipient}`
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
 * POST /api/batch/return - Return issued cones back to inventory
 */
batch.post('/return', requirePermission('thread.batch.issue'), async (c) => {
  try {
    const body = await c.req.json<BatchReturnRequest>()

    if (!body.cone_ids || body.cone_ids.length === 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Danh sách cuộn không được rỗng'
      }, 400)
    }

    if (!body.warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin kho nhận'
      }, 400)
    }

    if (body.cone_ids.length > BATCH_LIMIT) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `Vượt quá giới hạn ${BATCH_LIMIT} cuộn mỗi lần trả`
      }, 400)
    }

    // Update status and warehouse for returned cones
    try {
      await query(
        'UPDATE thread_inventory SET status = $1, warehouse_id = $2 WHERE id = ANY($3)',
        ['AVAILABLE', body.warehouse_id, body.cone_ids]
      )
    } catch (updateError) {
      console.error('Return error:', updateError)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi trả cuộn'
      }, 500)
    }

    // Log transaction
    const transaction = await queryOne<{ id: number }>(
      `INSERT INTO batch_transactions
         (operation_type, to_warehouse_id, cone_ids, cone_count, notes, performed_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        'RETURN',
        body.warehouse_id,
        body.cone_ids,
        body.cone_ids.length,
        body.notes || null,
        new Date().toISOString(),
      ]
    )

    return c.json<BatchApiResponse<BatchOperationResult>>({
      data: {
        transaction_id: transaction?.id || 0,
        operation_type: 'RETURN',
        cone_count: body.cone_ids.length
      },
      error: null,
      message: `Đã trả ${body.cone_ids.length} cuộn`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

batch.get('/transfer-history', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const rawPage = parseInt(c.req.query('page') || '1')
    const rawPageSize = parseInt(c.req.query('page_size') || '25')
    const rawFromWarehouse = c.req.query('from_warehouse_id')
    const rawToWarehouse = c.req.query('to_warehouse_id')
    const fromDate = c.req.query('from_date')
    const toDate = c.req.query('to_date')
    const search = c.req.query('search')
    const sortBy = c.req.query('sort_by') || 'performed_at'
    const descending = c.req.query('descending') !== 'false'

    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage
    const pageSize = isNaN(rawPageSize) ? 25 : Math.min(100, Math.max(1, rawPageSize))

    const fromWarehouseId = rawFromWarehouse ? parseInt(rawFromWarehouse) : undefined
    const toWarehouseId = rawToWarehouse ? parseInt(rawToWarehouse) : undefined
    if (rawFromWarehouse && isNaN(fromWarehouseId!)) {
      return c.json({ data: null, error: 'from_warehouse_id không hợp lệ' }, 400)
    }
    if (rawToWarehouse && isNaN(toWarehouseId!)) {
      return c.json({ data: null, error: 'to_warehouse_id không hợp lệ' }, 400)
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (fromDate && !dateRegex.test(fromDate)) {
      return c.json({ data: null, error: 'from_date phải có định dạng YYYY-MM-DD' }, 400)
    }
    if (toDate && !dateRegex.test(toDate)) {
      return c.json({ data: null, error: 'to_date phải có định dạng YYYY-MM-DD' }, 400)
    }

    const ALLOWED_SORT = ['performed_at', 'cone_count', 'id']
    const safeSortBy = ALLOWED_SORT.includes(sortBy) ? sortBy : 'performed_at'
    const offset = (page - 1) * pageSize

    const conditions: string[] = [`bt.operation_type = 'TRANSFER'`]
    const params: unknown[] = []

    if (fromWarehouseId) {
      params.push(fromWarehouseId)
      conditions.push(`bt.from_warehouse_id = $${params.length}`)
    }
    if (toWarehouseId) {
      params.push(toWarehouseId)
      conditions.push(`bt.to_warehouse_id = $${params.length}`)
    }
    if (fromDate) {
      params.push(fromDate)
      conditions.push(`bt.performed_at >= $${params.length}`)
    }
    if (toDate) {
      params.push(toDate + 'T23:59:59')
      conditions.push(`bt.performed_at <= $${params.length}`)
    }
    if (search) {
      const s = sanitizeFilterValue(search)
      params.push(`%${s}%`)
      conditions.push(
        `(bt.notes ILIKE $${params.length} OR bt.reference_number ILIKE $${params.length} OR bt.performed_by ILIKE $${params.length})`
      )
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    try {
      const count = await queryCount(
        `SELECT count(*)::int AS count FROM batch_transactions bt ${whereClause}`,
        params
      )

      const dataParams = [...params, pageSize, offset]
      const data = await query<Record<string, unknown>>(
        `SELECT
           bt.id, bt.from_warehouse_id, bt.to_warehouse_id, bt.cone_ids, bt.cone_count,
           bt.lot_id, bt.reference_number, bt.notes, bt.performed_by, bt.performed_at,
           CASE WHEN l.id IS NULL THEN NULL
                ELSE json_build_object('id', l.id, 'lot_number', l.lot_number) END AS lot,
           CASE WHEN fw.id IS NULL THEN NULL
                ELSE json_build_object('id', fw.id, 'code', fw.code, 'name', fw.name) END AS from_warehouse,
           CASE WHEN tw.id IS NULL THEN NULL
                ELSE json_build_object('id', tw.id, 'code', tw.code, 'name', tw.name) END AS to_warehouse
         FROM batch_transactions bt
         LEFT JOIN lots l ON l.id = bt.lot_id
         LEFT JOIN warehouses fw ON fw.id = bt.from_warehouse_id
         LEFT JOIN warehouses tw ON tw.id = bt.to_warehouse_id
         ${whereClause}
         ORDER BY bt.${safeSortBy} ${descending ? 'DESC' : 'ASC'}
         LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      )

      return c.json({
        data: {
          items: data || [],
          total: count || 0,
        },
        error: null
      })
    } catch (error) {
      console.error('[transfer-history] query error:', error)
      return c.json({ data: null, error: 'Lỗi khi tải lịch sử chuyển kho' }, 500)
    }
  } catch (err) {
    console.error('[transfer-history] server error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

batch.get('/transfer-history/summary', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const rawFromWarehouse = c.req.query('from_warehouse_id')
    const rawToWarehouse = c.req.query('to_warehouse_id')
    const fromDate = c.req.query('from_date')
    const toDate = c.req.query('to_date')
    const search = c.req.query('search')

    const fromWarehouseId = rawFromWarehouse ? parseInt(rawFromWarehouse) : null
    const toWarehouseId = rawToWarehouse ? parseInt(rawToWarehouse) : null
    if (rawFromWarehouse && isNaN(fromWarehouseId!)) {
      return c.json({ data: null, error: 'from_warehouse_id không hợp lệ' }, 400)
    }
    if (rawToWarehouse && isNaN(toWarehouseId!)) {
      return c.json({ data: null, error: 'to_warehouse_id không hợp lệ' }, 400)
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (fromDate && !dateRegex.test(fromDate)) {
      return c.json({ data: null, error: 'from_date phải có định dạng YYYY-MM-DD' }, 400)
    }
    if (toDate && !dateRegex.test(toDate)) {
      return c.json({ data: null, error: 'to_date phải có định dạng YYYY-MM-DD' }, 400)
    }

    const sanitizedSearch = search ? sanitizeFilterValue(search) : null
    let data: {
      total_transfers: number
      total_cones: number
      top_source_id: number | null
      top_source_name: string | null
      top_source_count: number | null
      top_dest_id: number | null
      top_dest_name: string | null
      top_dest_count: number | null
    }
    try {
      data = await querySingle(
        `SELECT
           total_transfers::int AS total_transfers,
           total_cones::int AS total_cones,
           top_source_id,
           top_source_name,
           top_source_count::int AS top_source_count,
           top_dest_id,
           top_dest_name,
           top_dest_count::int AS top_dest_count
         FROM fn_transfer_history_summary($1, $2, $3, $4, $5)`,
        [
          fromWarehouseId,
          toWarehouseId,
          fromDate || null,
          toDate ? toDate + 'T23:59:59' : null,
          sanitizedSearch,
        ]
      )
    } catch (error) {
      console.error('[transfer-history/summary] RPC error:', error)
      return c.json({ data: null, error: 'Lỗi khi tải thống kê' }, 500)
    }

    return c.json({
      data: {
        total_transfers: data.total_transfers || 0,
        total_cones: data.total_cones || 0,
        top_source: data.top_source_name
          ? { name: data.top_source_name, count: data.top_source_count }
          : null,
        top_destination: data.top_dest_name
          ? { name: data.top_dest_name, count: data.top_dest_count }
          : null,
      },
      error: null
    })
  } catch (err) {
    console.error('[transfer-history/summary] server error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

batch.get('/transfer-history/:id/cone-summary', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const tx = await queryOne<{ cone_ids: number[] | null; operation_type: string }>(
      'SELECT cone_ids, operation_type::text AS operation_type FROM batch_transactions WHERE id = $1',
      [id]
    )

    if (!tx) {
      return c.json({ data: null, error: 'Không tìm thấy phiếu chuyển kho' }, 404)
    }
    if (tx.operation_type !== 'TRANSFER') {
      return c.json({ data: null, error: 'Thao tác không phải chuyển kho' }, 400)
    }

    const coneIds: number[] = tx.cone_ids || []
    if (coneIds.length === 0) {
      return c.json({ data: [], error: null })
    }

    // Query 1: Get cones basic info (batch to avoid URI too long)
    const BATCH_SIZE = 500
    const cones: { thread_type_id: number; color_id: number | null }[] = []

    for (let i = 0; i < coneIds.length; i += BATCH_SIZE) {
      const batch = coneIds.slice(i, i + BATCH_SIZE)
      try {
        const data = await query<{ thread_type_id: number; color_id: number | null }>(
          'SELECT thread_type_id, color_id FROM thread_inventory WHERE id = ANY($1)',
          [batch]
        )
        if (data) cones.push(...data)
      } catch (error) {
        console.error('[cone-summary] cones query error:', error)
        return c.json({ data: null, error: `Lỗi khi tải thông tin cuộn chỉ: ${getErrorMessage(error)}` }, 500)
      }
    }

    if (cones.length === 0) {
      return c.json({ data: [], error: null })
    }

    // Collect unique IDs
    const threadTypeIds = [...new Set(cones.map((c) => c.thread_type_id).filter(Boolean))] as number[]
    const colorIds = [...new Set(cones.map((c) => c.color_id).filter(Boolean))] as number[]

    // Query 2: Get thread types with suppliers
    const ttMap = new Map<number, { tex_number: string; supplier_name: string }>()
    if (threadTypeIds.length > 0) {
      let threadTypes: { id: number; tex_number: string | null; supplier_id: number | null; suppliers: { name: string } | null }[]
      try {
        threadTypes = await query(
          `SELECT tt.id, tt.tex_number, tt.supplier_id,
             CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('name', s.name) END AS suppliers
           FROM thread_types tt
           LEFT JOIN suppliers s ON s.id = tt.supplier_id
           WHERE tt.id = ANY($1)`,
          [threadTypeIds]
        )
      } catch (ttError) {
        console.error('[cone-summary] thread_types query error:', ttError)
        return c.json({ data: null, error: `Lỗi khi tải loại chỉ: ${getErrorMessage(ttError)}` }, 500)
      }

      for (const tt of threadTypes || []) {
        const sup = Array.isArray(tt.suppliers) ? tt.suppliers[0] : tt.suppliers
        ttMap.set(tt.id, {
          tex_number: tt.tex_number || '?',
          supplier_name: (sup as { name: string } | null)?.name || 'Không xác định',
        })
      }
    }

    // Query 3: Get colors
    const colorMap = new Map<number, { name: string; hex_code: string | null }>()
    if (colorIds.length > 0) {
      let colors: { id: number; name: string; hex_code: string | null }[]
      try {
        colors = await query(
          'SELECT id, name, hex_code FROM colors WHERE id = ANY($1)',
          [colorIds]
        )
      } catch (colorError) {
        console.error('[cone-summary] colors query error:', colorError)
        return c.json({ data: null, error: `Lỗi khi tải màu: ${getErrorMessage(colorError)}` }, 500)
      }

      for (const color of colors || []) {
        colorMap.set(color.id, { name: color.name, hex_code: color.hex_code })
      }
    }

    // Aggregate
    const groupMap = new Map<string, {
      thread_type_id: number
      supplier_name: string
      tex_number: string
      color_name: string
      color_hex: string | null
      cone_count: number
    }>()

    for (const cone of cones) {
      const key = `${cone.thread_type_id}_${cone.color_id ?? 0}`
      const existing = groupMap.get(key)
      if (existing) {
        existing.cone_count++
      } else {
        const tt = ttMap.get(cone.thread_type_id)
        const color = cone.color_id ? colorMap.get(cone.color_id) : null
        groupMap.set(key, {
          thread_type_id: cone.thread_type_id,
          supplier_name: tt?.supplier_name ?? 'Không xác định',
          tex_number: tt?.tex_number ?? '?',
          color_name: color?.name ?? 'Không xác định',
          color_hex: color?.hex_code ?? null,
          cone_count: 1,
        })
      }
    }

    const summary = Array.from(groupMap.values())
      .sort((a, b) => b.cone_count - a.cone_count)

    return c.json({ data: summary, error: null })
  } catch (err) {
    console.error('[cone-summary] server error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

/**
 * GET /api/batch/transactions - List all batch transactions
 */
batch.get('/transactions', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const operationType = c.req.query('operation_type')
    const lotId = c.req.query('lot_id')
    const warehouseId = c.req.query('warehouse_id')
    const fromDate = c.req.query('from_date')
    const toDate = c.req.query('to_date')

    const conditions: string[] = []
    const params: unknown[] = []

    if (operationType) {
      params.push(operationType)
      conditions.push(`bt.operation_type = $${params.length}`)
    }
    if (lotId) {
      params.push(parseInt(lotId))
      conditions.push(`bt.lot_id = $${params.length}`)
    }
    if (warehouseId) {
      const whId = parseInt(warehouseId)
      params.push(whId)
      conditions.push(`(bt.from_warehouse_id = $${params.length} OR bt.to_warehouse_id = $${params.length})`)
    }
    if (fromDate) {
      params.push(fromDate)
      conditions.push(`bt.performed_at >= $${params.length}`)
    }
    if (toDate) {
      params.push(toDate + 'T23:59:59')
      conditions.push(`bt.performed_at <= $${params.length}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    let data: BatchTransactionRow[]
    try {
      data = await query<BatchTransactionRow>(
        `SELECT bt.*,
           CASE WHEN l.id IS NULL THEN NULL
                ELSE json_build_object('id', l.id, 'lot_number', l.lot_number) END AS lot,
           CASE WHEN fw.id IS NULL THEN NULL
                ELSE json_build_object('id', fw.id, 'code', fw.code, 'name', fw.name) END AS from_warehouse,
           CASE WHEN tw.id IS NULL THEN NULL
                ELSE json_build_object('id', tw.id, 'code', tw.code, 'name', tw.name) END AS to_warehouse
         FROM batch_transactions bt
         LEFT JOIN lots l ON l.id = bt.lot_id
         LEFT JOIN warehouses fw ON fw.id = bt.from_warehouse_id
         LEFT JOIN warehouses tw ON tw.id = bt.to_warehouse_id
         ${whereClause}
         ORDER BY bt.performed_at DESC`,
        params
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải lịch sử thao tác'
      }, 500)
    }

    return c.json<BatchApiResponse<BatchTransactionRow[]>>({
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

/**
 * GET /api/batch/transactions/:id - Get transaction details
 */
batch.get('/transactions/:id', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    let data: BatchTransactionRow | null
    try {
      data = await queryOne<BatchTransactionRow>(
        `SELECT bt.*,
           CASE WHEN l.id IS NULL THEN NULL
                ELSE json_build_object('id', l.id, 'lot_number', l.lot_number, 'thread_type_id', l.thread_type_id, 'warehouse_id', l.warehouse_id) END AS lot,
           CASE WHEN fw.id IS NULL THEN NULL
                ELSE json_build_object('id', fw.id, 'code', fw.code, 'name', fw.name) END AS from_warehouse,
           CASE WHEN tw.id IS NULL THEN NULL
                ELSE json_build_object('id', tw.id, 'code', tw.code, 'name', tw.name) END AS to_warehouse
         FROM batch_transactions bt
         LEFT JOIN lots l ON l.id = bt.lot_id
         LEFT JOIN warehouses fw ON fw.id = bt.from_warehouse_id
         LEFT JOIN warehouses tw ON tw.id = bt.to_warehouse_id
         WHERE bt.id = $1`,
        [id]
      )
    } catch (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin thao tác'
      }, 500)
    }

    if (!data) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy thao tác'
      }, 404)
    }

    return c.json<BatchApiResponse<BatchTransactionRow>>({
      data: data,
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

export default batch
