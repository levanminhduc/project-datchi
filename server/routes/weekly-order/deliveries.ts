import { Hono } from 'hono'
import { ZodError } from 'zod'
import { query, queryOne } from '../../db/query'
import { requirePermission } from '../../middleware/auth'
import { getErrorMessage } from '../../utils/errorHelper'
import {
  UpdateDeliverySchema,
  ReceiveDeliverySchema,
  ReceiveLogsQuerySchema,
} from '../../validation/weeklyOrder'
import type { AppEnv } from '../../types/hono-env'
import { formatZodError } from './helpers'
import { getWeeklyOrderDeliverySummary } from './delivery-summary-helper'

const deliveries = new Hono<AppEnv>()

deliveries.get('/deliveries/overview', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const status = c.req.query('status')
    const weekId = c.req.query('week_id')
    const inventoryStatus = c.req.query('inventory_status')
    const inventoryStatusNot = c.req.query('inventory_status_not')
    const search = (c.req.query('search') || '').trim()
    const hasPage = Boolean(c.req.query('page'))
    const page = Math.max(1, parseInt(c.req.query('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')))
    const showCancelled = status === 'CANCELLED'
    const validDeliveryStatuses = new Set(['PENDING', 'DELIVERED', 'CANCELLED'])
    const validInventoryStatuses = new Set(['PENDING', 'PARTIAL', 'RECEIVED'])

    if (status && !validDeliveryStatuses.has(status)) {
      return c.json({ data: null, error: 'Trạng thái giao hàng không hợp lệ' }, 400)
    }
    if (inventoryStatus && !validInventoryStatuses.has(inventoryStatus)) {
      return c.json({ data: null, error: 'Trạng thái nhập kho không hợp lệ' }, 400)
    }
    if (inventoryStatusNot && !validInventoryStatuses.has(inventoryStatusNot)) {
      return c.json({ data: null, error: 'Trạng thái nhập kho không hợp lệ' }, 400)
    }

    const params: unknown[] = []
    const conds: string[] = []

    if (status) {
      params.push(status)
      conds.push(`d.status = $${params.length}`)
    } else {
      params.push('CANCELLED')
      conds.push(`d.status <> $${params.length}`)
    }
    if (!showCancelled) {
      conds.push(`w.status <> 'CANCELLED'`)
    }
    if (weekId) {
      params.push(parseInt(weekId))
      conds.push(`d.week_id = $${params.length}`)
    }
    if (inventoryStatus) {
      params.push(inventoryStatus)
      conds.push(`d.inventory_status = $${params.length}`)
    }
    if (inventoryStatusNot) {
      params.push(inventoryStatusNot)
      conds.push(`d.inventory_status <> $${params.length}`)
    }
    conds.push(`(d.quantity_cones >= 1 OR d.status = 'DELIVERED' OR d.received_quantity > 0)`)
    if (search) {
      params.push(`%${search}%`)
      const ph = `$${params.length}`
      conds.push(`(sup.name ILIKE ${ph} OR tt.tex_number ILIKE ${ph} OR COALESCE(d.thread_color, '') ILIKE ${ph} OR tt.name ILIKE ${ph} OR w.week_name ILIKE ${ph})`)
    }

    let pagination = ''
    if (hasPage) {
      params.push(limit)
      pagination = ` LIMIT $${params.length}`
      params.push((page - 1) * limit)
      pagination += ` OFFSET $${params.length}`
    }

    const rows = await query<any>(
      `SELECT d.*,
         sup.name AS supplier_name,
         tt.name AS thread_type_name,
         tt.tex_number,
         w.week_name,
         COALESCE(d.thread_color, '') AS color_name,
         COALESCE(d.thread_color_code, '') AS color_hex,
         (d.delivery_date - (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS days_remaining,
         (d.delivery_date < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AND d.status = 'PENDING') AS is_overdue,
         COALESCE(bl.borrowed_in, 0)::int AS borrowed_in,
         COALESCE(ll.lent_out, 0)::int AS lent_out,
         COUNT(*) OVER() AS total_count
       FROM thread_order_deliveries d
       LEFT JOIN suppliers sup ON sup.id = d.supplier_id
       LEFT JOIN thread_types tt ON tt.id = d.thread_type_id
       LEFT JOIN thread_order_weeks w ON w.id = d.week_id
       LEFT JOIN (
         SELECT to_week_id, thread_type_id, SUM(quantity_cones) AS borrowed_in
         FROM thread_order_loans
         WHERE status = 'ACTIVE' AND deleted_at IS NULL AND from_week_id IS NOT NULL
         GROUP BY to_week_id, thread_type_id
       ) bl ON bl.to_week_id = d.week_id AND bl.thread_type_id = d.thread_type_id
       LEFT JOIN (
         SELECT from_week_id, thread_type_id, SUM(quantity_cones) AS lent_out
         FROM thread_order_loans
         WHERE status = 'ACTIVE' AND deleted_at IS NULL AND from_week_id IS NOT NULL
         GROUP BY from_week_id, thread_type_id
       ) ll ON ll.from_week_id = d.week_id AND ll.thread_type_id = d.thread_type_id
       WHERE ${conds.join(' AND ')}
       ORDER BY d.delivery_date ASC, d.id ASC${pagination}`,
      params,
    )

    const total = rows.length > 0 ? Number(rows[0].total_count) : 0
    const data = rows.map((row: any) => {
      const { total_count: _total_count, ...rest } = row
      return rest
    })

    return c.json({ data, total, error: null })
  } catch (err) {
    console.error('Error fetching deliveries overview:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

deliveries.get('/deliveries/receive-logs', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const rawQuery = {
      delivery_id: c.req.query('delivery_id'),
      week_id: c.req.query('week_id'),
      limit: c.req.query('limit'),
      page: c.req.query('page'),
      search: c.req.query('search'),
    }
    const parsed = ReceiveLogsQuerySchema.parse(rawQuery)

    const deliveryId = parsed.delivery_id ? parseInt(parsed.delivery_id) : undefined
    const weekId = parsed.week_id ? parseInt(parsed.week_id) : undefined
    const search = (parsed.search || '').trim()
    const page = Math.max(1, parsed.page ? parseInt(parsed.page) : 1)
    const limit = Math.min(parsed.limit ? parseInt(parsed.limit) : 25, 100)

    const params: unknown[] = []
    const conds: string[] = []

    if (deliveryId) {
      params.push(deliveryId)
      conds.push(`l.delivery_id = $${params.length}`)
    }
    if (weekId) {
      params.push(weekId)
      conds.push(`d.week_id = $${params.length}`)
    }
    if (search) {
      params.push(`%${search}%`)
      const ph = `$${params.length}`
      conds.push(`(sup.name ILIKE ${ph} OR tt.tex_number ILIKE ${ph} OR COALESCE(d.thread_color, '') ILIKE ${ph} OR w.week_name ILIKE ${ph} OR COALESCE(wh.name, '') ILIKE ${ph} OR l.received_by ILIKE ${ph})`)
    }

    const whereClause = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : ''
    params.push(limit)
    const limitPh = `$${params.length}`
    params.push((page - 1) * limit)
    const offsetPh = `$${params.length}`

    const rows = await query<any>(
      `SELECT
         l.id,
         l.delivery_id,
         l.quantity,
         l.warehouse_id,
         l.received_by,
         l.notes,
         l.created_at,
         COALESCE(tt.name, '') AS thread_type_name,
         COALESCE(tt.tex_number, '') AS tex_number,
         COALESCE(sup.name, '') AS supplier_name,
         COALESCE(d.thread_color, '') AS color_name,
         COALESCE(d.thread_color_code, '') AS color_hex,
         COALESCE(w.week_name, '') AS week_name,
         COALESCE(wh.name, '') AS warehouse_name,
         COALESCE(d.quantity_cones, 0) AS quantity_cones,
         COALESCE(d.received_quantity, 0) AS received_quantity,
         COUNT(*) OVER() AS total_count
       FROM delivery_receive_logs l
       LEFT JOIN thread_order_deliveries d ON d.id = l.delivery_id
       LEFT JOIN thread_types tt ON tt.id = d.thread_type_id
       LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
       LEFT JOIN thread_order_weeks w ON w.id = d.week_id
       LEFT JOIN warehouses wh ON wh.id = l.warehouse_id
       ${whereClause}
       ORDER BY l.created_at DESC, l.id DESC
       LIMIT ${limitPh} OFFSET ${offsetPh}`,
      params,
    )

    const total = rows.length > 0 ? Number(rows[0].total_count) : 0
    const data = rows.map((row: any) => {
      const { total_count: _total_count, ...rest } = row
      return rest
    })

    return c.json({ data, total, error: null })
  } catch (err) {
    console.error('Error fetching receive logs:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

deliveries.patch('/deliveries/:deliveryId', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const deliveryId = parseInt(c.req.param('deliveryId'))
    if (isNaN(deliveryId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = UpdateDeliverySchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (validated.delivery_date !== undefined) updateFields.delivery_date = validated.delivery_date
    if (validated.actual_delivery_date !== undefined) updateFields.actual_delivery_date = validated.actual_delivery_date
    if (validated.status !== undefined) updateFields.status = validated.status
    if (validated.notes !== undefined) updateFields.notes = validated.notes

    const setParams: unknown[] = []
    const setParts: string[] = []
    for (const [col, val] of Object.entries(updateFields)) {
      setParams.push(val)
      setParts.push(`${col} = $${setParams.length}`)
    }
    setParams.push(deliveryId)
    const idPh = `$${setParams.length}`

    const data = await queryOne<any>(
      `WITH upd AS (
         UPDATE thread_order_deliveries SET ${setParts.join(', ')}
         WHERE id = ${idPh}
         RETURNING *
       )
       SELECT upd.*,
         CASE WHEN sup.id IS NULL THEN NULL ELSE json_build_object('id', sup.id, 'name', sup.name) END AS supplier,
         CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object('id', tt.id, 'name', tt.name, 'tex_number', tt.tex_number) END AS thread_type
       FROM upd
       LEFT JOIN suppliers sup ON sup.id = upd.supplier_id
       LEFT JOIN thread_types tt ON tt.id = upd.thread_type_id`,
      setParams,
    )

    if (!data) {
      return c.json({ data: null, error: 'Không tìm thấy bản ghi giao hàng' }, 404)
    }

    if (validated.delivery_date !== undefined) {
      const updatedDelivery = data as { week_id: number; thread_type_id: number; thread_color: string | null }

      const resultRow = await queryOne<{ id: number; summary_data: unknown }>(
        `SELECT id, summary_data FROM thread_order_results WHERE week_id = $1 LIMIT 1`,
        [updatedDelivery.week_id],
      )

      if (resultRow?.summary_data && Array.isArray(resultRow.summary_data)) {
        let changed = false
        const nextSummary = (resultRow.summary_data as Array<Record<string, unknown>>).map((row) => {
          const sameType = row.thread_type_id === updatedDelivery.thread_type_id
          const sameColor = String(row.thread_color ?? '') === String(updatedDelivery.thread_color ?? '')
          if (sameType && sameColor) {
            changed = true
            return { ...row, delivery_date: validated.delivery_date }
          }
          return row
        })

        if (changed) {
          try {
            await query(
              `UPDATE thread_order_results SET summary_data = $1::jsonb WHERE id = $2`,
              [JSON.stringify(nextSummary), resultRow.id],
            )
          } catch (resultUpdateError) {
            console.warn('Error syncing delivery_date into summary_data:', resultUpdateError)
          }
        }
      }
    }

    return c.json({
      data: {
        ...data,
        supplier_name: (data as any).supplier?.name || '',
        thread_type_name: (data as any).thread_type?.name || '',
        tex_number: (data as any).thread_type?.tex_number || '',
      },
      error: null,
      message: 'Cập nhật thông tin giao hàng thành công',
    })
  } catch (err) {
    console.error('Error updating delivery:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

deliveries.post('/deliveries/:deliveryId/receive', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const deliveryId = parseInt(c.req.param('deliveryId'))
    if (isNaN(deliveryId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = ReceiveDeliverySchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const { warehouse_id, quantity, received_by, expiry_date, idempotency_key } = validated

    const delivery = await queryOne<{ id: number; status: string; week_id: number; thread_type_id: number }>(
      `SELECT id, status, week_id, thread_type_id FROM thread_order_deliveries WHERE id = $1 LIMIT 1`,
      [deliveryId],
    )

    if (!delivery) {
      return c.json({ data: null, error: 'Không tìm thấy delivery' }, 404)
    }

    if (delivery.status !== 'DELIVERED') {
      return c.json({ data: null, error: 'Chỉ có thể nhập kho cho đơn đã giao' }, 400)
    }

    let result: any
    try {
      const rows = await query<{ result: any }>(
        `SELECT fn_receive_delivery($1, $2, $3, $4, $5, $6) AS result`,
        [deliveryId, quantity, warehouse_id, received_by, expiry_date || null, idempotency_key || null],
      )
      result = rows.length > 0 ? rows[0].result : null
    } catch (rpcError) {
      console.error('fn_receive_delivery error:', rpcError)
      return c.json({ data: null, error: getErrorMessage(rpcError) }, 500)
    }

    return c.json({
      data: {
        cones_created: result?.cones_created ?? quantity,
        cones_reserved: result?.cones_reserved ?? 0,
        remaining_shortage: result?.remaining_shortage ?? 0,
        lot_number: result?.lot_number ?? null,
        auto_return: result?.auto_return ?? { settled: 0, returned_cones: 0, details: [] },
      },
      error: null,
      message: result?.duplicate
        ? 'Yêu cầu này đã được xử lý trước đó'
        : `Đã nhập ${quantity} cuộn chỉ vào kho`,
    })
  } catch (err) {
    console.error('Error receiving delivery:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

deliveries.get('/:weekId/delivery-summary', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const weekIdParam = parseInt(c.req.param('weekId'))
    if (isNaN(weekIdParam)) {
      return c.json({ data: null, error: 'weekId không hợp lệ' }, 400)
    }

    const summary = await getWeeklyOrderDeliverySummary(weekIdParam)
    return c.json({ data: summary, error: null })
  } catch (err) {
    console.error('Error fetching delivery summary:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

deliveries.get('/:id/deliveries', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const [deliveriesResult, loansResult, summaryResult] = await Promise.all([
      query<any>(
        `SELECT d.*,
           CASE WHEN sup.id IS NULL THEN NULL ELSE json_build_object('id', sup.id, 'name', sup.name) END AS supplier,
           CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
             'id', tt.id, 'name', tt.name, 'tex_number', tt.tex_number,
             'color_data', CASE WHEN co.id IS NULL THEN NULL ELSE json_build_object('name', co.name, 'hex_code', co.hex_code) END
           ) END AS thread_type
         FROM thread_order_deliveries d
         LEFT JOIN suppliers sup ON sup.id = d.supplier_id
         LEFT JOIN thread_types tt ON tt.id = d.thread_type_id
         LEFT JOIN colors co ON co.id = tt.color_id
         WHERE d.week_id = $1
         ORDER BY d.delivery_date ASC`,
        [id],
      ).then((data) => ({ data, error: null as unknown })).catch((error) => ({ data: null as any[] | null, error })),
      query<{ thread_type_id: number; from_week_id: number | null; to_week_id: number | null; quantity_cones: number }>(
        `SELECT thread_type_id, from_week_id, to_week_id, quantity_cones FROM thread_order_loans
         WHERE (from_week_id = $1 OR to_week_id = $1) AND status = 'ACTIVE' AND deleted_at IS NULL`,
        [id],
      ).then((data) => ({ data })).catch(() => ({ data: [] as Array<{ thread_type_id: number; from_week_id: number | null; to_week_id: number | null; quantity_cones: number }> })),
      queryOne<{ summary_data: unknown }>(
        `SELECT summary_data FROM thread_order_results WHERE week_id = $1 LIMIT 1`,
        [id],
      ).then((data) => ({ data })).catch(() => ({ data: null as { summary_data: unknown } | null })),
    ])

    if (deliveriesResult.error) throw deliveriesResult.error

    const summaryColorMap = new Map<number, { thread_color: string; thread_color_code: string }>()
    if (summaryResult.data?.summary_data && Array.isArray(summaryResult.data.summary_data)) {
      for (const row of summaryResult.data.summary_data as Array<{ thread_type_id: number; thread_color?: string; thread_color_code?: string }>) {
        if (row.thread_type_id && row.thread_color) {
          summaryColorMap.set(row.thread_type_id, {
            thread_color: row.thread_color,
            thread_color_code: row.thread_color_code || '',
          })
        }
      }
    }

    const loanRows = loansResult.data || []
    const loanAggregates = new Map<number, { borrowed_in: number; lent_out: number }>()
    for (const loan of loanRows) {
      if (!loanAggregates.has(loan.thread_type_id)) {
        loanAggregates.set(loan.thread_type_id, { borrowed_in: 0, lent_out: 0 })
      }
      const agg = loanAggregates.get(loan.thread_type_id)!
      if (loan.to_week_id === id && loan.from_week_id !== null) {
        agg.borrowed_in += loan.quantity_cones
      }
      if (loan.from_week_id === id) {
        agg.lent_out += loan.quantity_cones
      }
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const enriched = (deliveriesResult.data || []).map((row: any) => {
      const deliveryDate = new Date(row.delivery_date)
      deliveryDate.setHours(0, 0, 0, 0)
      const days_remaining = Math.ceil((deliveryDate.getTime() - now.getTime()) / 86400000)
      const loanData = loanAggregates.get(row.thread_type_id) || { borrowed_in: 0, lent_out: 0 }
      const summaryColor = summaryColorMap.get(row.thread_type_id)
      return {
        ...row,
        supplier_name: row.supplier?.name || '',
        thread_type_name: row.thread_type?.name || '',
        tex_number: row.thread_type?.tex_number || '',
        color_name: row.thread_type?.color_data?.name || summaryColor?.thread_color || '',
        color_hex: row.thread_type?.color_data?.hex_code || summaryColor?.thread_color_code || '',
        days_remaining,
        is_overdue: days_remaining < 0 && row.status === 'PENDING',
        borrowed_in: loanData.borrowed_in,
        lent_out: loanData.lent_out,
      }
    })

    return c.json({ data: enriched, error: null })
  } catch (err) {
    console.error('Error fetching week deliveries:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default deliveries
