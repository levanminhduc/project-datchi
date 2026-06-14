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
const BATCH_SIZE = 1000

deliveries.get('/deliveries/overview', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const status = c.req.query('status')
    const weekId = c.req.query('week_id')
    const inventoryStatus = c.req.query('inventory_status')
    const inventoryStatusNot = c.req.query('inventory_status_not')
    const search = (c.req.query('search') || '').trim().toLowerCase()
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

    const allDeliveries: any[] = []
    let offset = 0

    while (true) {
      const params: unknown[] = []
      const conds: string[] = []

      if (status) {
        params.push(status)
        conds.push(`d.status = $${params.length}`)
      } else {
        // Mặc định ẩn deliveries đã hủy
        params.push('CANCELLED')
        conds.push(`d.status <> $${params.length}`)
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

      const whereClause = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : ''
      params.push(BATCH_SIZE)
      const limitPh = `$${params.length}`
      params.push(offset)
      const offsetPh = `$${params.length}`

      const data = await query<any>(
        `SELECT d.*,
          CASE WHEN sup.id IS NULL THEN NULL ELSE json_build_object('id', sup.id, 'name', sup.name) END AS supplier,
          CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
            'id', tt.id, 'name', tt.name, 'tex_number', tt.tex_number,
            'color_data', CASE WHEN co.id IS NULL THEN NULL ELSE json_build_object('name', co.name, 'hex_code', co.hex_code) END
          ) END AS thread_type,
          CASE WHEN w.id IS NULL THEN NULL ELSE json_build_object('id', w.id, 'week_name', w.week_name, 'status', w.status) END AS week
         FROM thread_order_deliveries d
         LEFT JOIN suppliers sup ON sup.id = d.supplier_id
         LEFT JOIN thread_types tt ON tt.id = d.thread_type_id
         LEFT JOIN colors co ON co.id = tt.color_id
         LEFT JOIN thread_order_weeks w ON w.id = d.week_id
         ${whereClause}
         ORDER BY d.delivery_date ASC
         LIMIT ${limitPh} OFFSET ${offsetPh}`,
        params,
      )

      if (!data || data.length === 0) break
      allDeliveries.push(...data)

      if (data.length < BATCH_SIZE) break
      offset += BATCH_SIZE
    }

    const weekIds = [...new Set(allDeliveries.map((row: any) => row.week_id))]
    const resultsData: Array<{ week_id: number; summary_data: unknown[] | null }> = []

    if (weekIds.length > 0) {
      const WEEK_IDS_BATCH_SIZE = 200
      for (let i = 0; i < weekIds.length; i += WEEK_IDS_BATCH_SIZE) {
        const chunk = weekIds.slice(i, i + WEEK_IDS_BATCH_SIZE)
        const chunkData = await query<{ week_id: number; summary_data: unknown[] | null }>(
          `SELECT week_id, summary_data FROM thread_order_results WHERE week_id = ANY($1)`,
          [chunk],
        )

        if (chunkData && chunkData.length > 0) {
          resultsData.push(...chunkData)
        }
      }
    }

    const summaryMap = new Map<number, Map<string, { total_final: number; thread_color?: string; thread_color_code?: string }>>()
    for (const result of resultsData || []) {
      if (result.summary_data && Array.isArray(result.summary_data)) {
        const threadMap = new Map<string, { total_final: number; thread_color?: string; thread_color_code?: string }>()
        for (const row of result.summary_data as Array<{ thread_type_id: number; total_final?: number; thread_color?: string; thread_color_code?: string }>) {
          if (row.thread_type_id && row.total_final !== undefined) {
            const key = `${row.thread_type_id}_${row.thread_color ?? ''}`
            threadMap.set(key, {
              total_final: row.total_final,
              thread_color: row.thread_color || undefined,
              thread_color_code: row.thread_color_code || undefined,
            })
          }
        }
        summaryMap.set(result.week_id, threadMap)
      }
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const enrichedRows = allDeliveries
      .map((row: any) => {
        const deliveryDate = new Date(row.delivery_date)
        deliveryDate.setHours(0, 0, 0, 0)
        const days_remaining = Math.ceil((deliveryDate.getTime() - now.getTime()) / 86400000)

        const threadMap = summaryMap.get(row.week_id)
        const compositeKey = `${row.thread_type_id}_${row.thread_color ?? ''}`
        let summaryInfo = threadMap?.get(compositeKey)
        if (!summaryInfo && !row.thread_color && threadMap) {
          let fallbackTotal = 0
          for (const [key, val] of threadMap) {
            if (key.startsWith(`${row.thread_type_id}_`)) fallbackTotal += val.total_final
          }
          if (fallbackTotal > 0) summaryInfo = { total_final: fallbackTotal }
        }
        const total_cones = summaryInfo?.total_final ?? null

        return {
          ...row,
          supplier_name: row.supplier?.name || '',
          thread_type_name: row.thread_type?.name || '',
          tex_number: row.thread_type?.tex_number || '',
          color_name: row.thread_color || row.thread_type?.color_data?.name || summaryInfo?.thread_color || '',
          color_hex: row.thread_color_code || row.thread_type?.color_data?.hex_code || summaryInfo?.thread_color_code || '',
          week_name: row.week?.week_name || '',
          days_remaining,
          is_overdue: days_remaining < 0 && row.status === 'PENDING',
          total_cones,
        }
      })
      .filter((row: any) => {
        // Ẩn deliveries của đơn hàng tuần đã hủy (trừ khi đang xem CANCELLED)
        if (!showCancelled && row.week?.status === 'CANCELLED') return false

        const quantityCones = Number(row.quantity_cones || 0)
        const receivedQuantity = Number(row.received_quantity || 0)
        const hasSupplier = row.supplier_id !== null && row.supplier_id !== undefined

        if (hasSupplier && quantityCones >= 1) return true
        return row.status === 'DELIVERED' || receivedQuantity > 0
      })

    const dedupeMap = new Map<string, any>()
    const toTimestamp = (value: unknown) => {
      const ts = new Date(String(value || '')).getTime()
      return Number.isNaN(ts) ? 0 : ts
    }

    for (const row of enrichedRows) {
      const key = `${row.week_id}_${row.thread_type_id}_${row.thread_color ?? ''}_${row.supplier_id ?? ''}`
      const existing = dedupeMap.get(key)
      if (!existing) {
        dedupeMap.set(key, row)
        continue
      }

      const existingDelivered = existing.status === 'DELIVERED'
      const currentDelivered = row.status === 'DELIVERED'
      const existingUpdatedAt = toTimestamp(existing.updated_at ?? existing.created_at)
      const currentUpdatedAt = toTimestamp(row.updated_at ?? row.created_at)

      if ((!existingDelivered && currentDelivered) || currentUpdatedAt > existingUpdatedAt) {
        dedupeMap.set(key, row)
      }
    }

    const enriched = Array.from(dedupeMap.values())
      .sort((a, b) => String(a.delivery_date).localeCompare(String(b.delivery_date)))

    const loanAggs = await query<{ from_week_id: number | null; to_week_id: number | null; thread_type_id: number; quantity_cones: number }>(
      `SELECT from_week_id, to_week_id, thread_type_id, quantity_cones FROM thread_order_loans
       WHERE status = 'ACTIVE' AND deleted_at IS NULL AND from_week_id IS NOT NULL`,
    )

    const borrowedMap = new Map<string, number>()
    const lentMap = new Map<string, number>()
    for (const loan of loanAggs || []) {
      const borrowKey = `${loan.to_week_id}_${loan.thread_type_id}`
      borrowedMap.set(borrowKey, (borrowedMap.get(borrowKey) || 0) + loan.quantity_cones)
      const lentKey = `${loan.from_week_id}_${loan.thread_type_id}`
      lentMap.set(lentKey, (lentMap.get(lentKey) || 0) + loan.quantity_cones)
    }

    const withLoanContext = enriched.map((row: any) => {
      const key = `${row.week_id}_${row.thread_type_id}`
      return {
        ...row,
        borrowed_in: borrowedMap.get(key) || 0,
        lent_out: lentMap.get(key) || 0,
      }
    })

    const includesSearch = (value: unknown) => String(value || '').toLowerCase().includes(search)
    const responseRows = search
      ? withLoanContext.filter(row =>
        includesSearch(row.supplier_name)
        || includesSearch(row.tex_number)
        || includesSearch(row.color_name)
        || includesSearch(row.week_name)
        || includesSearch(row.thread_type_name),
      )
      : withLoanContext

    const total = responseRows.length
    if (c.req.query('page')) {
      const start = (page - 1) * limit
      const paginated = responseRows.slice(start, start + limit)
      return c.json({ data: paginated, total, error: null })
    }

    return c.json({ data: responseRows, total, error: null })
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
    const search = (parsed.search || '').trim().toLowerCase()
    const page = Math.max(1, parsed.page ? parseInt(parsed.page) : 1)
    const limit = Math.min(parsed.limit ? parseInt(parsed.limit) : 25, 100)

    let deliveryIdFilter: number[] | undefined
    if (weekId) {
      const weekDeliveries = await query<{ id: number }>(
        `SELECT id FROM thread_order_deliveries WHERE week_id = $1`,
        [weekId],
      )
      deliveryIdFilter = (weekDeliveries || []).map((d: any) => d.id)
      if (deliveryIdFilter.length === 0) {
        return c.json({ data: [], total: 0, error: null })
      }
    }

    const allLogs: any[] = []
    let offset = 0
    while (true) {
      const params: unknown[] = []
      const conds: string[] = []

      if (deliveryId) {
        params.push(deliveryId)
        conds.push(`l.delivery_id = $${params.length}`)
      }
      if (deliveryIdFilter) {
        params.push(deliveryIdFilter)
        conds.push(`l.delivery_id = ANY($${params.length})`)
      }

      const whereClause = conds.length > 0 ? `WHERE ${conds.join(' AND ')}` : ''
      params.push(BATCH_SIZE)
      const limitPh = `$${params.length}`
      params.push(offset)
      const offsetPh = `$${params.length}`

      const data = await query<any>(
        `SELECT
          l.id,
          l.delivery_id,
          l.quantity,
          l.warehouse_id,
          l.received_by,
          l.notes,
          l.created_at,
          CASE WHEN d.id IS NULL THEN NULL ELSE json_build_object(
            'thread_type_id', d.thread_type_id,
            'week_id', d.week_id,
            'quantity_cones', d.quantity_cones,
            'received_quantity', d.received_quantity,
            'thread_color', d.thread_color,
            'thread_color_code', d.thread_color_code,
            'thread_type', CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
              'name', tt.name, 'tex_number', tt.tex_number,
              'supplier', CASE WHEN sup.id IS NULL THEN NULL ELSE json_build_object('name', sup.name) END,
              'color_data', CASE WHEN co.id IS NULL THEN NULL ELSE json_build_object('name', co.name, 'hex_code', co.hex_code) END
            ) END,
            'week', CASE WHEN w.id IS NULL THEN NULL ELSE json_build_object('week_name', w.week_name) END
          ) END AS delivery,
          CASE WHEN wh.id IS NULL THEN NULL ELSE json_build_object('name', wh.name) END AS warehouse
         FROM delivery_receive_logs l
         LEFT JOIN thread_order_deliveries d ON d.id = l.delivery_id
         LEFT JOIN thread_types tt ON tt.id = d.thread_type_id
         LEFT JOIN suppliers sup ON sup.id = tt.supplier_id
         LEFT JOIN colors co ON co.id = tt.color_id
         LEFT JOIN thread_order_weeks w ON w.id = d.week_id
         LEFT JOIN warehouses wh ON wh.id = l.warehouse_id
         ${whereClause}
         ORDER BY l.created_at DESC
         LIMIT ${limitPh} OFFSET ${offsetPh}`,
        params,
      )

      if (!data || data.length === 0) break
      allLogs.push(...data)
      if (data.length < BATCH_SIZE) break
      offset += BATCH_SIZE
    }

    let enriched = allLogs.map((row: any) => ({
      id: row.id,
      delivery_id: row.delivery_id,
      quantity: row.quantity,
      warehouse_id: row.warehouse_id,
      received_by: row.received_by,
      notes: row.notes,
      created_at: row.created_at,
      thread_type_name: row.delivery?.thread_type?.name || '',
      tex_number: row.delivery?.thread_type?.tex_number || '',
      supplier_name: row.delivery?.thread_type?.supplier?.name || '',
      color_name: row.delivery?.thread_color || row.delivery?.thread_type?.color_data?.name || '',
      color_hex: row.delivery?.thread_color_code || row.delivery?.thread_type?.color_data?.hex_code || '',
      week_name: row.delivery?.week?.week_name || '',
      warehouse_name: row.warehouse?.name || '',
      quantity_cones: row.delivery?.quantity_cones || 0,
      received_quantity: row.delivery?.received_quantity || 0,
    }))

    if (search) {
      enriched = enriched.filter(row =>
        row.supplier_name.toLowerCase().includes(search)
        || row.tex_number.toLowerCase().includes(search)
        || row.color_name.toLowerCase().includes(search)
        || row.week_name.toLowerCase().includes(search)
        || row.warehouse_name.toLowerCase().includes(search)
        || row.received_by.toLowerCase().includes(search),
      )
    }

    const total = enriched.length
    const start = (page - 1) * limit
    const paginated = enriched.slice(start, start + limit)

    return c.json({ data: paginated, total, error: null })
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
      const updatedDelivery = data as { week_id: number; thread_type_id: number }

      const resultRow = await queryOne<{ id: number; summary_data: unknown }>(
        `SELECT id, summary_data FROM thread_order_results WHERE week_id = $1 LIMIT 1`,
        [updatedDelivery.week_id],
      )

      if (resultRow?.summary_data && Array.isArray(resultRow.summary_data)) {
        let changed = false
        const nextSummary = (resultRow.summary_data as Array<Record<string, unknown>>).map((row) => {
          if (row.thread_type_id === updatedDelivery.thread_type_id) {
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

    const { warehouse_id, quantity, received_by, expiry_date } = validated

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
        `SELECT fn_receive_delivery($1, $2, $3, $4, $5) AS result`,
        [deliveryId, quantity, warehouse_id, received_by, expiry_date || null],
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
      message: `Đã nhập ${quantity} cuộn chỉ vào kho`,
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
