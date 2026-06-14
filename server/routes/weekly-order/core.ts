import { Hono } from 'hono'
import { ZodError } from 'zod'
import { query, queryOne, querySingle, queryCount } from '../../db/query'
import { requirePermission } from '../../middleware/auth'
import { getErrorMessage } from '../../utils/errorHelper'
import { broadcastNotification, getWarehouseEmployeeIds, getLeaderEmployeeIds } from '../../utils/notificationService'
import { dispatchExternalNotification } from '../../utils/external-notification-dispatcher'
import {
  dispatchOrderApprovalRequests,
  signWeeklyOrder,
  WeeklyOrderSignError,
} from '../../utils/weekly-order-approval-service'
import {
  CreateWeeklyOrderSchema,
  UpdateWeeklyOrderSchema,
  UpdateStatusSchema,
  OrderedQuantitiesQuerySchema,
  HistoryByWeekQuerySchema,
  RemovePOFromWeekSchema,
  WeekWarehouseFilterSchema,
} from '../../validation/weeklyOrder'
import type { WeeklyOrderStatus } from '../../types/weeklyOrder'
import type { AppEnv } from '../../types/hono-env'
import {
  formatZodError,
  VALID_STATUS_TRANSITIONS,
  validateSubArtIds,
  validatePOQuantityLimits,
} from './helpers'
import { syncDeliveries } from './save-results-helpers'
import { enrichWithInventory } from './enrich-helper'
import { reaggregateSummary, adjustCalcDataForRemainingItems } from './reaggregate-helper'
import { getInventoryDiffForWeek } from './inventory-diff-helper'

const core = new Hono<AppEnv>()

type OrderItemInsert = {
  week_id: number
  po_id: number | null
  style_id: number
  style_color_id: number | null
  quantity: number
  sub_art_id: number | null
}

async function insertOrderItemsWithEmbed(rows: OrderItemInsert[]): Promise<Record<string, unknown>[]> {
  if (rows.length === 0) return []
  return query<Record<string, unknown>>(
    `WITH input AS (
       SELECT * FROM json_to_recordset($1::json) AS x(
         week_id int, po_id int, style_id int, style_color_id int, quantity int, sub_art_id int
       )
     ),
     inserted AS (
       INSERT INTO thread_order_items (week_id, po_id, style_id, style_color_id, quantity, sub_art_id)
       SELECT week_id, po_id, style_id, style_color_id, quantity, sub_art_id FROM input
       RETURNING id, week_id, po_id, style_id, style_color_id, quantity, sub_art_id, created_at
     )
     SELECT i.id, i.week_id, i.po_id, i.style_id, i.style_color_id, i.quantity, i.sub_art_id, i.created_at,
       CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('id', s.id, 'style_code', s.style_code, 'style_name', s.style_name) END AS style,
       CASE WHEN sc.id IS NULL THEN NULL ELSE json_build_object('id', sc.id, 'color_name', sc.color_name, 'hex_code', sc.hex_code) END AS style_color,
       CASE WHEN po.id IS NULL THEN NULL ELSE json_build_object('id', po.id, 'po_number', po.po_number) END AS po,
       CASE WHEN sa.id IS NULL THEN NULL ELSE json_build_object('id', sa.id, 'sub_art_code', sa.sub_art_code) END AS sub_art
     FROM inserted i
     LEFT JOIN styles s ON s.id = i.style_id
     LEFT JOIN style_colors sc ON sc.id = i.style_color_id
     LEFT JOIN purchase_orders po ON po.id = i.po_id
     LEFT JOIN sub_arts sa ON sa.id = i.sub_art_id
     ORDER BY i.id ASC`,
    [JSON.stringify(rows)],
  )
}

core.get('/check-name', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const rawName = c.req.query('name')
    const name = rawName?.trim()

    if (!name) {
      return c.json({ data: null, error: 'Thiếu tên tuần' }, 400)
    }

    const week = await queryOne<{ id: number; week_name: string; status: string }>(
      `SELECT id, week_name, status FROM thread_order_weeks WHERE week_name = $1`,
      [name],
    )

    if (week) {
      return c.json({ data: { exists: true, week }, error: null })
    }

    return c.json({ data: { exists: false }, error: null })
  } catch (err) {
    console.error('Error checking week name:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/assignment-summary', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const statusFilter = c.req.query('status')

    const weeks = await query<{ id: number; week_name: string; status: string }>(
      `SELECT id, week_name, status FROM thread_order_weeks${statusFilter ? ' WHERE status = $1' : ''} ORDER BY created_at DESC`,
      statusFilter ? [statusFilter] : [],
    )
    if (!weeks || weeks.length === 0) {
      return c.json({ data: [], error: null })
    }

    const weekIds = weeks.map((w: any) => w.id)

    const resultsData = await query<{ week_id: number; summary_data: any }>(
      `SELECT week_id, summary_data FROM thread_order_results WHERE week_id = ANY($1) LIMIT 10000`,
      [weekIds],
    )

    const plannedMap = new Map<number, Map<number, { planned: number; code: string; name: string }>>()
    for (const result of resultsData || []) {
      const summaryRows: any[] = result.summary_data || []
      const typeMap = new Map<number, { planned: number; code: string; name: string }>()
      for (const row of summaryRows) {
        if (row.thread_type_id) {
          typeMap.set(row.thread_type_id, {
            planned: row.total_final ?? row.sl_can_dat ?? row.total_cones ?? 0,
            code: row.thread_type_code || row.code || '',
            name: row.thread_type_name || row.name || '',
          })
        }
      }
      plannedMap.set(result.week_id, typeMap)
    }

    const reservedData = await query<{ reserved_week_id: number; thread_type_id: number }>(
      `SELECT reserved_week_id, thread_type_id FROM thread_inventory
       WHERE reserved_week_id = ANY($1) AND status = 'RESERVED_FOR_ORDER' LIMIT 10000`,
      [weekIds],
    )

    const reservedMap = new Map<number, Map<number, number>>()
    for (const cone of reservedData || []) {
      if (!reservedMap.has(cone.reserved_week_id)) {
        reservedMap.set(cone.reserved_week_id, new Map())
      }
      const typeMap = reservedMap.get(cone.reserved_week_id)!
      typeMap.set(cone.thread_type_id, (typeMap.get(cone.thread_type_id) || 0) + 1)
    }

    const allocData = await query<{ week_id: number; thread_type_id: number; allocated_meters: number; thread_type: any }>(
      `SELECT ta.week_id, ta.thread_type_id, ta.allocated_meters,
         CASE WHEN tt.id IS NULL THEN NULL
              ELSE json_build_object('meters_per_cone', tt.meters_per_cone) END AS thread_type
       FROM thread_allocations ta
       LEFT JOIN thread_types tt ON tt.id = ta.thread_type_id
       WHERE ta.week_id = ANY($1) AND ta.status = ANY($2) LIMIT 10000`,
      [weekIds, ['ISSUED', 'HARD']],
    )

    const allocMap = new Map<number, Map<number, number>>()
    for (const alloc of allocData || []) {
      if (!alloc.week_id) continue
      if (!allocMap.has(alloc.week_id)) {
        allocMap.set(alloc.week_id, new Map())
      }
      const typeMap = allocMap.get(alloc.week_id)!
      const metersPerCone = (alloc.thread_type as any)?.meters_per_cone || 0
      const cones = metersPerCone > 0
        ? Number(alloc.allocated_meters) / metersPerCone
        : 0
      typeMap.set(alloc.thread_type_id, (typeMap.get(alloc.thread_type_id) || 0) + cones)
    }

    const rows: any[] = []
    for (const week of weeks) {
      const typeMap = plannedMap.get(week.id)
      if (!typeMap) continue

      for (const [threadTypeId, { planned, code, name }] of typeMap) {
        const reserved = reservedMap.get(week.id)?.get(threadTypeId) || 0
        const allocated = Math.round(allocMap.get(week.id)?.get(threadTypeId) || 0)
        const gap = reserved - planned

        rows.push({
          week_id: week.id,
          week_name: week.week_name,
          week_status: week.status,
          thread_type_id: threadTypeId,
          thread_type_code: code,
          thread_type_name: name,
          planned_cones: planned,
          reserved_cones: reserved,
          allocated_cones: allocated,
          gap,
        })
      }
    }

    return c.json({ data: rows, error: null })
  } catch (err) {
    console.error('Error fetching assignment summary:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/ordered-quantities', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const reqQuery = c.req.query()

    let validated
    try {
      validated = OrderedQuantitiesQuerySchema.parse(reqQuery)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    let pairs: Array<{ po_id: number; style_id: number }>
    try {
      pairs = JSON.parse(validated.po_style_pairs)
      if (!Array.isArray(pairs) || pairs.length === 0) {
        return c.json({ data: null, error: 'po_style_pairs phải là mảng không rỗng' }, 400)
      }
    } catch {
      return c.json({ data: null, error: 'po_style_pairs không phải JSON hợp lệ' }, 400)
    }

    const excludeWeekId = validated.exclude_week_id ? parseInt(validated.exclude_week_id) : undefined

    const validPairs = pairs.filter((p) => p.po_id && p.style_id)
    if (validPairs.length === 0) {
      return c.json({ data: [], error: null })
    }

    const poIds = [...new Set(validPairs.map((p) => p.po_id))]

    const orderItemsParams: unknown[] = [poIds]
    let orderItemsSql = `SELECT toi.po_id, toi.style_id, toi.quantity
      FROM thread_order_items toi
      INNER JOIN thread_order_weeks w ON w.id = toi.week_id
      WHERE toi.po_id = ANY($1) AND w.status <> 'CANCELLED'`

    if (excludeWeekId) {
      orderItemsParams.push(excludeWeekId)
      orderItemsSql += ` AND w.id <> $${orderItemsParams.length}`
    }
    orderItemsSql += ' LIMIT 10000'

    const [allOrderItems, allPoItems] = await Promise.all([
      query<{ po_id: number; style_id: number; quantity: number }>(orderItemsSql, orderItemsParams),
      query<{ po_id: number; style_id: number; quantity: number }>(
        `SELECT po_id, style_id, quantity FROM po_items
         WHERE po_id = ANY($1) AND deleted_at IS NULL LIMIT 10000`,
        [poIds],
      ),
    ])

    const orderedMap = new Map<string, number>()
    for (const row of (allOrderItems || []) as any[]) {
      const key = `${row.po_id}-${row.style_id}`
      orderedMap.set(key, (orderedMap.get(key) || 0) + (row.quantity || 0))
    }

    const poItemMap = new Map<string, number>()
    for (const pi of allPoItems || []) {
      poItemMap.set(`${pi.po_id}-${pi.style_id}`, pi.quantity)
    }

    const results = validPairs.map((pair) => {
      const key = `${pair.po_id}-${pair.style_id}`
      const orderedQuantity = orderedMap.get(key) || 0
      const poQuantity = poItemMap.get(key) || 0
      const remaining = Math.max(0, poQuantity - orderedQuantity)

      return {
        po_id: pair.po_id,
        style_id: pair.style_id,
        po_quantity: poQuantity,
        ordered_quantity: orderedQuantity,
        remaining_quantity: remaining,
      }
    })

    return c.json({ data: results, error: null })
  } catch (err) {
    console.error('Error fetching ordered quantities:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/history-by-week', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const reqQuery = c.req.query()

    let validated
    try {
      validated = HistoryByWeekQuerySchema.parse(reqQuery)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const page = validated.page ? Math.max(1, parseInt(validated.page)) : 1
    const limit = validated.limit ? Math.min(Math.max(1, parseInt(validated.limit)), 100) : 10
    const from = (page - 1) * limit

    let weekIds: number[] | null = null

    if (validated.po_id || validated.style_id) {
      const itemParams: unknown[] = []
      let itemSql = `SELECT toi.week_id
        FROM thread_order_items toi
        INNER JOIN thread_order_weeks w ON w.id = toi.week_id
        WHERE w.status <> 'CANCELLED'`

      if (validated.po_id) {
        itemParams.push(parseInt(validated.po_id))
        itemSql += ` AND toi.po_id = $${itemParams.length}`
      }
      if (validated.style_id) {
        itemParams.push(parseInt(validated.style_id))
        itemSql += ` AND toi.style_id = $${itemParams.length}`
      }
      itemSql += ' LIMIT 10000'

      const matchingItems = await query<{ week_id: number }>(itemSql, itemParams)
      weekIds = [...new Set((matchingItems || []).map((i) => i.week_id))]

      if (weekIds.length === 0) {
        return c.json({
          data: [],
          error: null,
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
    }

    const whereParts: string[] = []
    const whereParams: unknown[] = []
    const addWhere = (clause: string, value: unknown) => {
      whereParams.push(value)
      whereParts.push(clause.replace('$?', `$${whereParams.length}`))
    }

    const statusParam = validated.status
    if (statusParam && ['DRAFT', 'CONFIRMED', 'COMPLETED'].includes(statusParam)) {
      addWhere('status = $?', statusParam)
    } else {
      whereParts.push(`status <> 'CANCELLED'`)
    }

    if (weekIds !== null) {
      addWhere('id = ANY($?)', weekIds)
    }

    if (validated.from_date) {
      const fromIso = validated.from_date.includes('/')
        ? validated.from_date.split('/').reverse().join('-')
        : validated.from_date
      addWhere('created_at >= $?', `${fromIso}T00:00:00.000Z`)
    }
    if (validated.to_date) {
      const toIso = validated.to_date.includes('/')
        ? validated.to_date.split('/').reverse().join('-')
        : validated.to_date
      const toDateEnd = toIso.includes('T') ? toIso : `${toIso}T23:59:59.999Z`
      addWhere('created_at <= $?', toDateEnd)
    }

    if (validated.created_by) {
      addWhere('created_by ILIKE $?', `%${validated.created_by}%`)
    }

    const whereSql = whereParts.length > 0 ? ` WHERE ${whereParts.join(' AND ')}` : ''

    const weeksParams = [...whereParams, limit, from]
    const [count, weeks] = await Promise.all([
      queryCount(`SELECT count(*)::int AS count FROM thread_order_weeks${whereSql}`, whereParams),
      query<any>(
        `SELECT id, week_name, status, created_by, created_at FROM thread_order_weeks${whereSql}
         ORDER BY created_at DESC LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}`,
        weeksParams,
      ),
    ])

    if (!weeks || weeks.length === 0) {
      return c.json({
        data: [],
        error: null,
        pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
      })
    }

    const pageWeekIds = weeks.map((w: any) => w.id)

    const itemsParams: unknown[] = [pageWeekIds]
    let itemsSql = `SELECT toi.id, toi.week_id, toi.po_id, toi.style_id, toi.style_color_id, toi.quantity,
        CASE WHEN s.id IS NULL THEN NULL
             ELSE json_build_object('id', s.id, 'style_code', s.style_code, 'style_name', s.style_name) END AS style,
        CASE WHEN sc.id IS NULL THEN NULL
             ELSE json_build_object('id', sc.id, 'color_name', sc.color_name, 'hex_code', sc.hex_code) END AS style_color,
        CASE WHEN po.id IS NULL THEN NULL
             ELSE json_build_object('id', po.id, 'po_number', po.po_number) END AS po
      FROM thread_order_items toi
      LEFT JOIN styles s ON s.id = toi.style_id
      LEFT JOIN style_colors sc ON sc.id = toi.style_color_id
      LEFT JOIN purchase_orders po ON po.id = toi.po_id
      WHERE toi.week_id = ANY($1)`

    if (validated.po_id) {
      itemsParams.push(parseInt(validated.po_id))
      itemsSql += ` AND toi.po_id = $${itemsParams.length}`
    }
    if (validated.style_id) {
      itemsParams.push(parseInt(validated.style_id))
      itemsSql += ` AND toi.style_id = $${itemsParams.length}`
    }
    itemsSql += ' LIMIT 10000'

    const items = await query<any>(itemsSql, itemsParams)

    const uniquePairs = new Map<string, { po_id: number; style_id: number }>()
    for (const item of (items || [])) {
      if (item.po_id) {
        const key = `${item.po_id}-${item.style_id}`
        if (!uniquePairs.has(key)) {
          uniquePairs.set(key, { po_id: item.po_id, style_id: item.style_id })
        }
      }
    }

    const progressMap = new Map<string, { po_quantity: number; total_ordered: number }>()

    if (uniquePairs.size > 0) {
      const batchPoIds = [...new Set([...uniquePairs.values()].map((p) => p.po_id))]

      const [allOrderedItems, allPoItems] = await Promise.all([
        query<{ po_id: number; style_id: number; quantity: number }>(
          `SELECT toi.po_id, toi.style_id, toi.quantity
           FROM thread_order_items toi
           INNER JOIN thread_order_weeks w ON w.id = toi.week_id
           WHERE toi.po_id = ANY($1) AND w.status <> 'CANCELLED' LIMIT 10000`,
          [batchPoIds],
        ),
        query<{ po_id: number; style_id: number; quantity: number }>(
          `SELECT po_id, style_id, quantity FROM po_items
           WHERE po_id = ANY($1) AND deleted_at IS NULL LIMIT 10000`,
          [batchPoIds],
        ),
      ])

      const orderedTotalMap = new Map<string, number>()
      for (const row of (allOrderedItems || []) as any[]) {
        const key = `${row.po_id}-${row.style_id}`
        orderedTotalMap.set(key, (orderedTotalMap.get(key) || 0) + (row.quantity || 0))
      }

      const poItemMap = new Map<string, number>()
      for (const pi of allPoItems || []) {
        poItemMap.set(`${pi.po_id}-${pi.style_id}`, pi.quantity)
      }

      for (const pair of uniquePairs.values()) {
        const key = `${pair.po_id}-${pair.style_id}`
        progressMap.set(key, {
          po_quantity: poItemMap.get(key) || 0,
          total_ordered: orderedTotalMap.get(key) || 0,
        })
      }
    }

    const result = weeks.map((week: any) => {
      const weekItems = (items || []).filter((i: any) => i.week_id === week.id)

      const poMap = new Map<string, { po_id: number | null; po_number: string; items: any[] }>()
      for (const item of weekItems) {
        const poKey = item.po_id ? String(item.po_id) : 'null'
        if (!poMap.has(poKey)) {
          poMap.set(poKey, {
            po_id: item.po_id,
            po_number: (item.po as any)?.po_number || 'Không có PO',
            items: [],
          })
        }
        poMap.get(poKey)!.items.push(item)
      }

      const po_groups = Array.from(poMap.values()).map((poGroup) => {
        const styleMap = new Map<number, { style: any; colors: any[]; thisWeekQty: number }>()
        for (const item of poGroup.items) {
          if (!styleMap.has(item.style_id)) {
            styleMap.set(item.style_id, {
              style: item.style,
              colors: [],
              thisWeekQty: 0,
            })
          }
          const sg = styleMap.get(item.style_id)!
          sg.colors.push({
            style_color_id: item.style_color_id,
            color_name: item.style_color?.color_name || '',
            hex_code: item.style_color?.hex_code || '',
            quantity: item.quantity,
          })
          sg.thisWeekQty += item.quantity
        }

        const styles = Array.from(styleMap.entries()).map(([styleId, sg]) => {
          const progressKey = `${poGroup.po_id}-${styleId}`
          const progress = progressMap.get(progressKey)
          const poQuantity = progress?.po_quantity || 0
          const totalOrdered = progress?.total_ordered || 0
          const remaining = Math.max(0, poQuantity - totalOrdered)
          const progressPct = poQuantity > 0 ? Math.round((totalOrdered / poQuantity) * 100) : 0

          return {
            style_id: styleId,
            style_code: sg.style?.style_code || '',
            style_name: sg.style?.style_name || '',
            po_quantity: poQuantity,
            total_ordered: totalOrdered,
            this_week_quantity: sg.thisWeekQty,
            remaining,
            progress_pct: progressPct,
            colors: sg.colors,
          }
        })

        return {
          po_id: poGroup.po_id,
          po_number: poGroup.po_number,
          styles,
        }
      })

      const totalQuantity = weekItems.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0)

      return {
        week_id: week.id,
        week_name: week.week_name,
        status: week.status,
        created_by: week.created_by,
        created_at: week.created_at,
        total_quantity: totalQuantity,
        po_groups,
      }
    })

    const total = count ?? 0
    return c.json({
      data: result,
      error: null,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('Error fetching history by week:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/leader-review', requirePermission('thread.leader.sign'), async (c) => {
  try {
    const signed = c.req.query('signed') === 'true'
    const search = c.req.query('search')?.trim() || ''
    const page = c.req.query('page') ? Math.max(1, parseInt(c.req.query('page')!)) : 1
    const limit = c.req.query('limit') ? Math.min(Math.max(1, parseInt(c.req.query('limit')!)), 50) : 10
    const from = (page - 1) * limit

    const itemsAgg = `COALESCE((
        SELECT json_agg(json_build_object(
          'id', toi.id, 'po_id', toi.po_id, 'style_id', toi.style_id,
          'style_color_id', toi.style_color_id, 'quantity', toi.quantity, 'sub_art_id', toi.sub_art_id,
          'style', CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('id', s.id, 'style_code', s.style_code, 'style_name', s.style_name) END,
          'style_color', CASE WHEN sc.id IS NULL THEN NULL ELSE json_build_object('id', sc.id, 'color_name', sc.color_name, 'hex_code', sc.hex_code) END,
          'po', CASE WHEN po.id IS NULL THEN NULL ELSE json_build_object('id', po.id, 'po_number', po.po_number) END,
          'sub_art', CASE WHEN sa.id IS NULL THEN NULL ELSE json_build_object('id', sa.id, 'sub_art_code', sa.sub_art_code) END
        ))
        FROM thread_order_items toi
        LEFT JOIN styles s ON s.id = toi.style_id
        LEFT JOIN style_colors sc ON sc.id = toi.style_color_id
        LEFT JOIN purchase_orders po ON po.id = toi.po_id
        LEFT JOIN sub_arts sa ON sa.id = toi.sub_art_id
        WHERE toi.week_id = w.id
      ), '[]'::json) AS items`

    const selectFields = signed
      ? `w.id, w.week_name, w.start_date, w.status, w.created_by, w.created_at,
         w.leader_signed_by, w.leader_signed_at,
         CASE WHEN e.id IS NULL THEN NULL ELSE json_build_object('id', e.id, 'full_name', e.full_name) END AS leader,
         ${itemsAgg}`
      : `w.id, w.week_name, w.start_date, w.status, w.created_by, w.created_at,
         ${itemsAgg}`

    const fromClause = signed
      ? `FROM thread_order_weeks w LEFT JOIN employees e ON e.id = w.leader_signed_by`
      : `FROM thread_order_weeks w`

    const lrWhere: string[] = [`w.status = 'CONFIRMED'`]
    const lrParams: unknown[] = []
    if (search) {
      lrParams.push(`%${search}%`)
      lrWhere.push(`w.week_name ILIKE $${lrParams.length}`)
    }
    if (signed) {
      lrWhere.push('w.leader_signed_by IS NOT NULL')
    } else {
      lrWhere.push('w.leader_signed_by IS NULL')
    }
    const lrWhereSql = ` WHERE ${lrWhere.join(' AND ')}`

    const [count, weeks] = await Promise.all([
      queryCount(`SELECT count(*)::int AS count FROM thread_order_weeks w${lrWhereSql}`, lrParams),
      query<any>(
        `SELECT ${selectFields} ${fromClause}${lrWhereSql}
         ORDER BY w.created_at DESC LIMIT $${lrParams.length + 1} OFFSET $${lrParams.length + 2}`,
        [...lrParams, limit, from],
      ),
    ])

    const total = count ?? 0
    const totalPages = Math.ceil(total / limit)
    const pagination = { page, limit, total, totalPages }

    if (!weeks || weeks.length === 0) {
      return c.json({ data: [], error: null, pagination })
    }

    const weekIds = (weeks as unknown as Array<{ id: number }>).map((w) => w.id)
    const resultsData = await query<{ week_id: number; summary_data: any }>(
      `SELECT week_id, summary_data FROM thread_order_results WHERE week_id = ANY($1) LIMIT $2`,
      [weekIds, limit],
    )

    const summaryMap = new Map<number, unknown[]>()
    const summaryAllMap = new Map<number, unknown[]>()
    for (const r of resultsData || []) {
      const rows = (r.summary_data as Array<{ total_final?: number }>) || []
      summaryAllMap.set(r.week_id, rows)
      summaryMap.set(r.week_id, rows.filter((row) => (row.total_final ?? 0) > 0))
    }

    const result = weeks.map((w: any) => ({
      ...w,
      item_count: (w.items || []).length,
      summary_all: summaryAllMap.get(w.id) || [],
      summary_preview: summaryMap.get(w.id) || [],
      ...(signed && w.leader ? {
        leader_signed_by_name: w.leader.full_name,
      } : {}),
    }))

    return c.json({ data: result, error: null, pagination })
  } catch (err) {
    console.error('Error fetching leader review:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

// ============ WAREHOUSE FILTER PER WEEK ============

core.get('/:id/warehouses', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const week = await queryOne<{ id: number }>(
      `SELECT id FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    const data = await query<{ warehouse_id: number }>(
      `SELECT warehouse_id FROM thread_order_week_warehouses WHERE week_id = $1 LIMIT 100`,
      [week.id],
    )

    const warehouseIds = (data || []).map((row) => row.warehouse_id)
    return c.json({ data: warehouseIds, error: null })
  } catch (err) {
    console.error('Error fetching week warehouses:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.put('/:id/warehouses', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const week = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    if (week.status !== 'DRAFT') {
      return c.json({ data: null, error: 'Chỉ có thể thay đổi kho cho tuần ở trạng thái nháp' }, 400)
    }

    const body = await c.req.json()
    let validated
    try {
      validated = WeekWarehouseFilterSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }
    const { warehouse_ids } = validated

    await query(
      `DELETE FROM thread_order_week_warehouses WHERE week_id = $1`,
      [id],
    )

    if (warehouse_ids.length > 0) {
      await query(
        `INSERT INTO thread_order_week_warehouses (week_id, warehouse_id)
         SELECT $1, unnest($2::int[])`,
        [id, warehouse_ids],
      )
    }

    return c.json({
      data: warehouse_ids,
      error: null,
      message: warehouse_ids.length > 0
        ? `Đã lưu ${warehouse_ids.length} kho cho tuần`
        : 'Đã xóa bộ lọc kho (sử dụng tất cả kho)',
    })
  } catch (err) {
    console.error('Error saving week warehouses:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/:id/inventory-diff', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const week = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    const diffResult = await getInventoryDiffForWeek(id)
    return c.json({
      data: {
        week_status: week.status,
        ...diffResult,
      },
      error: null,
    })
  } catch (err) {
    console.error('[inventory-diff] Error:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/:id', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const data = await queryOne<Record<string, unknown>>(
      `SELECT w.*,
        CASE WHEN e.id IS NULL THEN NULL
             ELSE json_build_object('id', e.id, 'full_name', e.full_name) END AS leader,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', toi.id, 'week_id', toi.week_id, 'po_id', toi.po_id, 'style_id', toi.style_id,
            'style_color_id', toi.style_color_id, 'quantity', toi.quantity, 'sub_art_id', toi.sub_art_id,
            'created_at', toi.created_at,
            'style', CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object('id', s.id, 'style_code', s.style_code, 'style_name', s.style_name) END,
            'style_color', CASE WHEN sc.id IS NULL THEN NULL ELSE json_build_object('id', sc.id, 'color_name', sc.color_name, 'hex_code', sc.hex_code) END,
            'po', CASE WHEN po.id IS NULL THEN NULL ELSE json_build_object('id', po.id, 'po_number', po.po_number) END,
            'sub_art', CASE WHEN sa.id IS NULL THEN NULL ELSE json_build_object('id', sa.id, 'sub_art_code', sa.sub_art_code) END
          ))
          FROM thread_order_items toi
          LEFT JOIN styles s ON s.id = toi.style_id
          LEFT JOIN style_colors sc ON sc.id = toi.style_color_id
          LEFT JOIN purchase_orders po ON po.id = toi.po_id
          LEFT JOIN sub_arts sa ON sa.id = toi.sub_art_id
          WHERE toi.week_id = w.id
        ), '[]'::json) AS items
       FROM thread_order_weeks w
       LEFT JOIN employees e ON e.id = w.leader_signed_by
       WHERE w.id = $1`,
      [id],
    )

    if (!data) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    const result = {
      ...data,
      leader_signed_by_name: (data as any)?.leader?.full_name || null,
    }
    delete (result as any).leader

    return c.json({ data: result, error: null })
  } catch (err) {
    console.error('Error fetching weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.post('/', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = CreateWeeklyOrderSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const poValidation = await validatePOQuantityLimits(validated.items)
    if (!poValidation.valid) {
      return c.json({
        data: null,
        error: `Số lượng vượt quá PO:\n${poValidation.errors.join('\n')}`,
      }, 400)
    }

    const subArtError = await validateSubArtIds(validated.items)
    if (subArtError) {
      return c.json({ data: null, error: subArtError }, 400)
    }

    const auth = c.get('auth')
    let createdBy: string | null = null
    if (auth?.employeeId) {
      const emp = await queryOne<{ full_name: string }>(
        `SELECT full_name FROM employees WHERE id = $1`,
        [auth.employeeId],
      )
      createdBy = emp?.full_name || null
    }

    let week: Record<string, any>
    try {
      week = await querySingle<Record<string, any>>(
        `INSERT INTO thread_order_weeks (week_name, start_date, end_date, status, notes, created_by)
         VALUES ($1, $2, $3, 'DRAFT', $4, $5)
         RETURNING *`,
        [
          validated.week_name.trim(),
          validated.start_date || null,
          validated.end_date || null,
          validated.notes || null,
          createdBy,
        ],
      )
    } catch (weekErr) {
      if ((weekErr as { code?: string }).code === '23505') {
        return c.json({ data: null, error: 'Tên tuần đã tồn tại' }, 409)
      }
      throw weekErr
    }

    const itemRows = validated.items.map((item) => ({
      week_id: week.id,
      po_id: item.po_id || null,
      style_id: item.style_id,
      style_color_id: item.style_color_id,
      quantity: item.quantity,
      sub_art_id: item.sub_art_id || null,
    }))

    const items = await insertOrderItemsWithEmbed(itemRows)

    return c.json(
      { data: { ...week, items }, error: null, message: 'Tạo tuần đặt hàng thành công' },
      201,
    )
  } catch (err) {
    console.error('Error creating weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.post('/:id/remove-po', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()
    let validated
    try {
      validated = RemovePOFromWeekSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const week = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    if (week.status === 'COMPLETED' || week.status === 'CANCELLED') {
      return c.json({ data: null, error: 'Không thể xóa PO từ đơn đã hoàn thành hoặc đã hủy' }, 400)
    }

    const removedItems = await query<{ id: number; style_id: number }>(
      `DELETE FROM thread_order_items WHERE week_id = $1 AND po_id = $2 RETURNING id, style_id`,
      [id, validated.po_id],
    )

    const removedCount = removedItems?.length ?? 0
    console.info(`[remove-po] Removed ${removedCount} items from week=${id} po=${validated.po_id}`)

    let deliveriesSynced = false
    let reservationsReleased = 0
    let reservationsReserved = 0

    if (week.status === 'CONFIRMED' && removedCount > 0) {
      const remainingItems = await query<{ style_id: number; style_color_id: number | null; color_id: number | null; quantity: number }>(
        `SELECT style_id, style_color_id, color_id, quantity FROM thread_order_items
         WHERE week_id = $1 LIMIT 10000`,
        [id],
      )

      const resultsRow = await queryOne<{ id: number; calculation_data: any; summary_data: any }>(
        `SELECT id, calculation_data, summary_data FROM thread_order_results WHERE week_id = $1`,
        [id],
      )

      if (resultsRow?.calculation_data && Array.isArray(resultsRow.calculation_data)) {
        const itemsForAdjust = (remainingItems || []).map((i: { style_id: number; style_color_id: number | null; color_id: number | null; quantity: number }) => ({
          style_id: i.style_id,
          color_key: i.style_color_id ?? i.color_id ?? 0,
          quantity: i.quantity,
        }))

        const filteredCalcData = adjustCalcDataForRemainingItems(
          resultsRow.calculation_data as Parameters<typeof adjustCalcDataForRemainingItems>[0],
          itemsForAdjust,
        )

        const reaggregated = reaggregateSummary(
          filteredCalcData,
          Array.isArray(resultsRow.summary_data) ? resultsRow.summary_data as Array<{ thread_type_id: number; thread_color?: string | null; [key: string]: unknown }> : [],
        )

        let enrichedSummary = reaggregated
        try {
          enrichedSummary = await enrichWithInventory(
            reaggregated as Array<{ thread_type_id: number; total_cones: number; [key: string]: unknown }>,
            id,
            { preserveAdditionalOrder: false },
          )
        } catch (enrichErr) {
          console.warn('[remove-po] enrichWithInventory failed, using unenriched:', enrichErr)
        }

        await query(
          `UPDATE thread_order_results
           SET calculation_data = $1::jsonb, summary_data = $2::jsonb, calculated_at = $3
           WHERE id = $4`,
          [
            JSON.stringify(filteredCalcData),
            JSON.stringify(enrichedSummary),
            new Date().toISOString(),
            resultsRow.id,
          ],
        )

        console.info(`[remove-po] Updated results: calc ${(resultsRow.calculation_data as unknown[]).length} -> ${filteredCalcData.length}, summary reaggregated ${enrichedSummary.length} rows`)

        try {
          const rpcRows = await query<{ result: any }>(
            `SELECT fn_re_reserve_after_remove_po($1) AS result`,
            [id],
          )
          const rpcResult = rpcRows.length > 0 ? rpcRows[0].result : null
          if (rpcResult) {
            reservationsReleased = rpcResult.released ?? 0
            reservationsReserved = rpcResult.total_reserved ?? 0
            console.info(`[remove-po] Re-reserve: released=${reservationsReleased}, reserved=${reservationsReserved}, shortage=${rpcResult.total_shortage ?? 0}`)
          }
        } catch (rpcError) {
          console.error('[remove-po] fn_re_reserve_after_remove_po error:', rpcError)
        }

        try {
          await syncDeliveries(id, enrichedSummary as any)
          deliveriesSynced = true
        } catch (syncErr) {
          console.warn('[remove-po] syncDeliveries failed:', syncErr)
        }
      }
    }

    return c.json({
      data: {
        removed_count: removedCount,
        deliveries_synced: deliveriesSynced,
        reservations_released: reservationsReleased,
        reservations_reserved: reservationsReserved,
      },
      error: null,
      message: 'Đã xóa PO khỏi đơn đặt hàng',
    })
  } catch (err) {
    console.error('Error removing PO from weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.put('/:id', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const existing = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    if (!existing) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    if (existing.status !== 'DRAFT') {
      return c.json(
        { data: null, error: 'Chỉ có thể cập nhật tuần ở trạng thái nháp (DRAFT)' },
        400,
      )
    }

    const body = await c.req.json()

    let validated
    try {
      validated = UpdateWeeklyOrderSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    if (validated.items && validated.items.length > 0) {
      const poValidation = await validatePOQuantityLimits(validated.items, id)
      if (!poValidation.valid) {
        return c.json({
          data: null,
          error: `Số lượng vượt quá PO:\n${poValidation.errors.join('\n')}`,
        }, 400)
      }

      const subArtError = await validateSubArtIds(validated.items)
      if (subArtError) {
        return c.json({ data: null, error: subArtError }, 400)
      }
    }

    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (validated.week_name !== undefined) updateFields.week_name = validated.week_name.trim()
    if (validated.start_date !== undefined) updateFields.start_date = validated.start_date || null
    if (validated.end_date !== undefined) updateFields.end_date = validated.end_date || null
    if (validated.notes !== undefined) updateFields.notes = validated.notes || null

    const auth = c.get('auth')
    if (auth?.employeeId) {
      const emp = await queryOne<{ full_name: string }>(
        `SELECT full_name FROM employees WHERE id = $1`,
        [auth.employeeId],
      )
      updateFields.updated_by = emp?.full_name || null
    }

    const setKeys = Object.keys(updateFields)
    const setClause = setKeys.map((k, i) => `${k} = $${i + 1}`).join(', ')
    const updateParams = setKeys.map((k) => updateFields[k])
    updateParams.push(id)

    let week: Record<string, any>
    try {
      week = await querySingle<Record<string, any>>(
        `UPDATE thread_order_weeks SET ${setClause} WHERE id = $${updateParams.length} RETURNING *`,
        updateParams,
      )
    } catch (updateErr) {
      if ((updateErr as { code?: string }).code === '23505') {
        return c.json({ data: null, error: 'Tên tuần đã tồn tại' }, 409)
      }
      throw updateErr
    }

    let items: Record<string, unknown>[] | null = null
    if (validated.items !== undefined) {
      await query(
        `DELETE FROM thread_order_items WHERE week_id = $1`,
        [id],
      )

      if (validated.items.length > 0) {
        const itemRows = validated.items.map((item) => ({
          week_id: id,
          po_id: item.po_id || null,
          style_id: item.style_id,
          style_color_id: item.style_color_id,
          quantity: item.quantity,
          sub_art_id: item.sub_art_id || null,
        }))

        items = await insertOrderItemsWithEmbed(itemRows)
      } else {
        items = []
      }
    }

    const result = items !== null ? { ...week, items } : week

    return c.json({ data: result, error: null, message: 'Cập nhật tuần đặt hàng thành công' })
  } catch (err) {
    console.error('Error updating weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.delete('/:id', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const existing = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    if (!existing) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    if (existing.status !== 'DRAFT') {
      return c.json(
        { data: null, error: 'Chỉ có thể xóa tuần ở trạng thái nháp (DRAFT)' },
        400,
      )
    }

    const results = await query<{ id: number }>(
      `SELECT id FROM thread_order_results WHERE week_id = $1 LIMIT 1`,
      [id],
    )

    if (results && results.length > 0) {
      return c.json(
        {
          data: null,
          error: 'Không thể xóa vì đã có kết quả tính toán. Hãy xóa kết quả trước.',
        },
        409,
      )
    }

    await query(
      `DELETE FROM thread_order_items WHERE week_id = $1`,
      [id],
    )

    await query(
      `DELETE FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    return c.json({ data: null, error: null, message: 'Xóa tuần đặt hàng thành công' })
  } catch (err) {
    console.error('Error deleting weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.post('/:id/sync-deliveries', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const week = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    if (week.status !== 'CONFIRMED') {
      return c.json({ data: null, error: 'Tuần đặt hàng phải được xác nhận trước khi đồng bộ giao hàng' }, 400)
    }

    const resultsData = await queryOne<{ summary_data: any }>(
      `SELECT summary_data FROM thread_order_results WHERE week_id = $1`,
      [id],
    )

    if (resultsData?.summary_data && Array.isArray(resultsData.summary_data)) {
      await syncDeliveries(id, resultsData.summary_data as any)
    }

    return c.json({ data: { synced: true }, error: null })
  } catch (err) {
    console.error('Error syncing deliveries:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.post('/:id/notify', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const week = await queryOne<Record<string, any>>(
      `SELECT * FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    if (week.status !== 'CONFIRMED') {
      return c.json({ data: null, error: 'Tuần đặt hàng phải được xác nhận trước khi gửi thông báo' }, 400)
    }

    const warehouseIds = await getWarehouseEmployeeIds()
    broadcastNotification({
      employeeIds: warehouseIds,
      type: 'WEEKLY_ORDER',
      title: `Đơn đặt hàng tuần #${id} đã được xác nhận`,
      actionUrl: `/thread/weekly-order/${id}`,
      metadata: { weekly_order_id: id, new_status: 'CONFIRMED' },
    })

    const leaderIds = await getLeaderEmployeeIds()
    const uniqueLeaderIds = leaderIds.filter((lid) => !warehouseIds.includes(lid))
    if (uniqueLeaderIds.length > 0) {
      broadcastNotification({
        employeeIds: uniqueLeaderIds,
        type: 'WEEKLY_ORDER',
        title: `Đơn đặt hàng tuần #${id} cần ký duyệt`,
        actionUrl: `/thread/weekly-order/leader-review`,
        metadata: { weekly_order_id: id, new_status: 'CONFIRMED', action: 'LEADER_SIGN' },
      })
    }

    const resultsData = await queryOne<{ summary_data: any }>(
      `SELECT summary_data FROM thread_order_results WHERE week_id = $1`,
      [id],
    )

    const summaries = resultsData?.summary_data as any[] || []
    const itemCount = summaries.length
    const totalQuantity = summaries.reduce((sum: number, s: any) => sum + (s.sl_can_dat || 0), 0)

    dispatchExternalNotification('ORDER_CONFIRMED', {
      weekId: id,
      weekLabel: week.week_name || `#${id}`,
      createdBy: week.created_by || '',
      itemCount,
      totalQuantity,
    })

    dispatchOrderApprovalRequests({
      week: {
        id,
        week_name: week.week_name || null,
        start_date: week.start_date || null,
        end_date: week.end_date || null,
        created_by: week.created_by || null,
        leader_signed_at: week.leader_signed_at || null,
      },
      summaries,
    }).catch((err) => {
      console.error('[weekly-order notify] approval Telegram dispatch failed:', err)
    })

    return c.json({ data: { notified: true }, error: null })
  } catch (err) {
    console.error('Error sending notifications:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/:id/cancel-preview', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const week = await queryOne<Record<string, any>>(
      `SELECT id, week_name, status, start_date, end_date, created_by, created_at
       FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    if (!week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    if (week.status === 'CANCELLED') {
      return c.json({ data: null, error: 'Đơn hàng đã bị hủy trước đó' }, 400)
    }

    const [coneRows, deliveryRows, loanRows] = await Promise.all([
      query<{ id: number; quantity_meters: number; thread_type_id: number; color_id: number | null }>(
        `SELECT id, quantity_meters, thread_type_id, color_id FROM thread_inventory
         WHERE reserved_week_id = $1 LIMIT 10000`,
        [id],
      ),
      query<{ id: number; status: string; inventory_status: string }>(
        `SELECT id, status, inventory_status FROM thread_order_deliveries
         WHERE week_id = $1 LIMIT 10000`,
        [id],
      ),
      query<{ id: number }>(
        `SELECT id FROM thread_order_loans
         WHERE (from_week_id = $1 OR to_week_id = $1) AND deleted_at IS NULL LIMIT 1`,
        [id],
      ),
    ])

    const cones = coneRows || []
    const deliveries = deliveryRows || []
    const hasActiveLoans = (loanRows || []).length > 0

    const conesSummary = {
      total_cones: cones.length,
      total_meters: cones.reduce((sum, c) => sum + (c.quantity_meters || 0), 0),
      thread_types: new Set(cones.map((c) => c.thread_type_id)).size,
      colors: new Set(cones.map((c) => c.color_id).filter(Boolean)).size,
    }

    const deliveriesSummary = {
      total: deliveries.length,
      pending: deliveries.filter((d) => d.status === 'PENDING').length,
      delivered: deliveries.filter((d) => d.status === 'DELIVERED').length,
      received: deliveries.filter((d) => d.inventory_status === 'RECEIVED').length,
    }

    const warnings: string[] = []
    if (deliveriesSummary.received > 0) {
      warnings.push(`${deliveriesSummary.received} delivery đã nhập kho (RECEIVED) - không thể hoàn tác`)
    }
    if (hasActiveLoans) {
      warnings.push('Còn khoản mượn/cho mượn chưa thanh toán - không thể hủy')
    }

    return c.json({
      data: {
        week,
        cones_summary: conesSummary,
        deliveries_summary: deliveriesSummary,
        has_active_loans: hasActiveLoans,
        can_cancel: !hasActiveLoans,
        warnings,
      },
      error: null,
    })
  } catch (err) {
    console.error('Error fetching cancel preview:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.patch('/:id/leader-sign', requirePermission('thread.leader.sign'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const auth = c.get('auth')
    const employeeId = auth.employeeId

    const { week: updated } = await signWeeklyOrder({ weekId: id, employeeId })

    return c.json({ data: updated, error: null, message: 'Ký duyệt thành công' })
  } catch (err) {
    if (err instanceof WeeklyOrderSignError) {
      if (err.status === 404) return c.json({ data: null, error: err.message }, 404)
      if (err.status === 403) return c.json({ data: null, error: err.message }, 403)
      if (err.status === 409) return c.json({ data: null, error: err.message }, 409)
      if (err.status >= 500) return c.json({ data: null, error: err.message }, 500)
      return c.json({ data: null, error: err.message }, 400)
    }
    console.error('Error leader signing:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.patch('/:id/status', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = UpdateStatusSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const newStatus = validated.status as WeeklyOrderStatus

    const existing = await queryOne<{ id: number; status: string }>(
      `SELECT id, status FROM thread_order_weeks WHERE id = $1`,
      [id],
    )

    if (!existing) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    const currentStatus = existing.status as WeeklyOrderStatus
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || []

    if (!allowedTransitions.includes(newStatus)) {
      return c.json(
        {
          data: null,
          error: `Không thể chuyển từ '${currentStatus}' sang '${newStatus}'. Các trạng thái hợp lệ: ${allowedTransitions.join(', ') || 'không có'}`,
        },
        400,
      )
    }

    if (newStatus === 'CONFIRMED') {
      if (currentStatus === 'CONFIRMED') {
        const week = await queryOne<Record<string, unknown>>(
          `SELECT * FROM thread_order_weeks WHERE id = $1`,
          [id],
        )

        return c.json({
          data: { week, reservation_summary: [] },
          error: null,
          message: 'Tuần đã được xác nhận trước đó',
        })
      }

      try {
        const diffResult = await getInventoryDiffForWeek(id)
        if (diffResult.has_changed) {
          return c.json(
            {
              data: { diff: diffResult.diff },
              error: 'INVENTORY_CHANGED',
              message: 'Tồn kho đã thay đổi so với lúc lưu nháp. Vui lòng tính toán lại đơn hàng trước khi xác nhận.',
            },
            409,
          )
        }
      } catch (diffErr) {
        console.error('[PATCH status] inventory diff check failed:', diffErr)
        return c.json({ data: null, error: 'Không thể kiểm tra tồn kho. Vui lòng thử lại.' }, 500)
      }

      let result: any = null
      let lastError: { message: string } | null = null
      const maxRetries = 3
      const retryDelay = 100

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        let rpcResult: any
        try {
          const rpcRows = await query<{ result: any }>(
            `SELECT fn_confirm_week_with_reserve($1) AS result`,
            [id],
          )
          rpcResult = rpcRows.length > 0 ? rpcRows[0].result : null
        } catch (rpcError) {
          const code = (rpcError as { code?: string }).code
          const message = rpcError instanceof Error ? rpcError.message : String(rpcError)
          if (code === '42883' || message.includes('does not exist')) {
            console.error('[PATCH status] RPC function error (42883):', rpcError)
            return c.json({ data: null, error: `Lỗi RPC: ${message}` }, 500)
          }
          lastError = { message }
          break
        }

        result = rpcResult
        const summaries = result?.reservation_summary || []
        const hasSkipped = summaries.some((s: any) => s.skipped_locked > 0)

        if (!hasSkipped) {
          break
        }

        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
      }

      if (lastError) {
        console.error('[PATCH status] fn_confirm_week_with_reserve error:', lastError)
        return c.json({ data: null, error: lastError.message }, 500)
      }

      if (result) {
        const week = await queryOne<Record<string, unknown>>(
          `SELECT * FROM thread_order_weeks WHERE id = $1`,
          [id],
        )

        return c.json({
          data: {
            week,
            reservation_summary: result?.reservation_summary || [],
          },
          error: null,
          message: 'Xác nhận và đặt trước thành công',
        })
      }

      return c.json({ data: null, error: 'Không thể xác nhận tuần đặt hàng' }, 500)
    }

    if (newStatus === 'CANCELLED') {
      const activeLoans = await query<{ id: number }>(
        `SELECT id FROM thread_order_loans
         WHERE (from_week_id = $1 OR to_week_id = $1) AND deleted_at IS NULL
         LIMIT 1`,
        [id],
      )

      if (activeLoans.length > 0) {
        return c.json(
          {
            data: null,
            error: 'Không thể hủy khi còn khoản mượn/cho mượn chưa thanh toán',
          },
          400,
        )
      }

      try {
        await query(`SELECT fn_release_week_reservations($1) AS result`, [id])
      } catch (releaseError) {
        const message =
          releaseError instanceof Error ? releaseError.message : String(releaseError)
        return c.json({ data: null, error: message }, 500)
      }

      try {
        await query(
          `UPDATE thread_order_deliveries SET status = 'CANCELLED'
           WHERE week_id = $1 AND inventory_status = 'PENDING'`,
          [id],
        )
      } catch (cancelDeliveriesError) {
        console.warn('[PATCH status] Cancel pending deliveries warning:', cancelDeliveriesError)
      }
    }

    const data = await querySingle<Record<string, unknown>>(
      `UPDATE thread_order_weeks SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
      [newStatus, new Date().toISOString(), id],
    )

    const statusLabels: Record<string, string> = {
      CANCELLED: 'hủy',
    }
    const warehouseIds = await getWarehouseEmployeeIds()
    broadcastNotification({
      employeeIds: warehouseIds,
      type: 'WEEKLY_ORDER',
      title: `Đơn đặt hàng tuần #${id} đã được ${statusLabels[newStatus] || newStatus}`,
      actionUrl: `/thread/weekly-order/${id}`,
      metadata: { weekly_order_id: id, new_status: newStatus },
    })

    return c.json({ data, error: null, message: 'Cập nhật trạng thái thành công' })
  } catch (err) {
    console.error('Error updating weekly order status:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

core.get('/', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const reqQuery = c.req.query()

    const page = reqQuery.page ? parseInt(reqQuery.page) : null
    const limit = reqQuery.limit ? Math.min(Math.max(parseInt(reqQuery.limit), 1), 100) : 20
    const isPaginated = page !== null && !isNaN(page) && page >= 1

    const whereParts: string[] = []
    const params: unknown[] = []

    if (reqQuery.status) {
      params.push(reqQuery.status)
      whereParts.push(`status = $${params.length}`)
    }

    const auth = c.get('auth')
    if (auth && !auth.isAdmin) {
      const emp = await queryOne<{ full_name: string | null }>(
        `SELECT full_name FROM employees WHERE id = $1`,
        [auth.employeeId],
      )

      if (emp?.full_name) {
        params.push(emp.full_name)
        whereParts.push(`created_by = $${params.length}`)
      }
    }

    const whereClause = whereParts.length > 0 ? ` WHERE ${whereParts.join(' AND ')}` : ''

    let count: number | null = null
    if (isPaginated) {
      count = await queryCount(
        `SELECT count(*)::int AS count FROM thread_order_weeks${whereClause}`,
        params,
      )
    }

    let limitOffsetClause = ''
    if (isPaginated) {
      const from = (page - 1) * limit
      params.push(limit)
      const limitIdx = params.length
      params.push(from)
      const offsetIdx = params.length
      limitOffsetClause = ` LIMIT $${limitIdx} OFFSET $${offsetIdx}`
    }

    const data = await query<Record<string, unknown>>(
      `SELECT w.*,
        COALESCE((SELECT count(*)::int FROM thread_order_items i WHERE i.week_id = w.id), 0) AS item_count
       FROM thread_order_weeks w${whereClause}
       ORDER BY w.created_at DESC${limitOffsetClause}`,
      params,
    )

    const result = data.map((row) => ({
      ...row,
      item_count: row.item_count ?? 0,
    }))

    if (isPaginated) {
      const total = count ?? 0
      return c.json({
        data: result,
        error: null,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    return c.json({ data: result, error: null })
  } catch (err) {
    console.error('Error fetching weekly orders:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default core
