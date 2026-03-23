import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
import { getPartialConeRatio } from '../utils/settings-helper'
import { broadcastNotification, getWarehouseEmployeeIds } from '../utils/notificationService'
import {
  CreateWeeklyOrderSchema,
  UpdateWeeklyOrderSchema,
  UpdateStatusSchema,
  SaveResultsSchema,
  EnrichInventorySchema,
  UpdateDeliverySchema,
  ReceiveDeliverySchema,
  UpdateQuotaConesSchema,
  OrderedQuantitiesQuerySchema,
  HistoryByWeekQuerySchema,
  CreateLoanSchema,
  CreateBatchLoanSchema,
  ReserveFromStockSchema,
  ManualReturnSchema,
} from '../validation/weeklyOrder'
import type { WeeklyOrderStatus } from '../types/weeklyOrder'

const weeklyOrder = new Hono()

function formatZodError(err: ZodError): string {
  return err.issues.map((e) => e.message).join('; ')
}

const VALID_STATUS_TRANSITIONS: Record<WeeklyOrderStatus, WeeklyOrderStatus[]> = {
  DRAFT: ['CONFIRMED'],
  CONFIRMED: ['CANCELLED'],
  CANCELLED: [],
  COMPLETED: [],
}

async function validateSubArtIds(
  items: Array<{ style_id: number; sub_art_id?: number | null }>,
): Promise<string | null> {
  for (const item of items) {
    if (!item.sub_art_id) continue

    const { data: subArt } = await supabase
      .from('sub_arts')
      .select('id')
      .eq('id', item.sub_art_id)
      .eq('style_id', item.style_id)
      .single()

    if (!subArt) {
      return `Sub-art ID ${item.sub_art_id} không tồn tại hoặc không thuộc mã hàng ID ${item.style_id}`
    }
  }
  return null
}

async function validatePOQuantityLimits(
  items: Array<{ po_id?: number | null; style_id: number; quantity: number }>,
  excludeWeekId?: number,
): Promise<{ valid: boolean; errors: string[] }> {
  const groups = new Map<string, { po_id: number; style_id: number; total: number }>()
  for (const item of items) {
    if (!item.po_id) continue
    const key = `${item.po_id}-${item.style_id}`
    const existing = groups.get(key)
    if (existing) {
      existing.total += item.quantity
    } else {
      groups.set(key, { po_id: item.po_id, style_id: item.style_id, total: item.quantity })
    }
  }

  if (groups.size === 0) return { valid: true, errors: [] }

  const errors: string[] = []

  for (const [, group] of groups) {
    const { data: poItem } = await supabase
      .from('po_items')
      .select('quantity')
      .eq('po_id', group.po_id)
      .eq('style_id', group.style_id)
      .is('deleted_at', null)
      .single()

    if (!poItem) continue

    let existingQuery = supabase
      .from('thread_order_items')
      .select('quantity, week:thread_order_weeks!inner(id, status)')
      .eq('po_id', group.po_id)
      .eq('style_id', group.style_id)
      .neq('week.status', 'CANCELLED')

    if (excludeWeekId) {
      existingQuery = existingQuery.neq('week.id', excludeWeekId)
    }

    const { data: existingItems } = await existingQuery

    const existingTotal = (existingItems || []).reduce(
      (sum: number, row: any) => sum + (row.quantity || 0),
      0,
    )

    if (existingTotal + group.total > poItem.quantity) {
      const { data: po } = await supabase
        .from('purchase_orders')
        .select('po_number')
        .eq('id', group.po_id)
        .single()

      const { data: style } = await supabase
        .from('styles')
        .select('style_code')
        .eq('id', group.style_id)
        .single()

      const poNumber = po?.po_number || `PO#${group.po_id}`
      const styleCode = style?.style_code || `Style#${group.style_id}`
      const remaining = poItem.quantity - existingTotal

      errors.push(
        `${poNumber} - ${styleCode}: vượt quá số lượng PO (PO: ${poItem.quantity}, đã đặt: ${existingTotal}, đang đặt: ${group.total}, còn lại: ${remaining})`,
      )
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * GET /api/weekly-orders - List weekly orders with optional status filter and pagination
 *
 * Query params:
 *   status  - filter by status
 *   page    - page number (1-based), enables pagination
 *   limit   - items per page (default 20, max 100)
 */
weeklyOrder.get('/', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const query = c.req.query()

    const page = query.page ? parseInt(query.page) : null
    const limit = query.limit ? Math.min(Math.max(parseInt(query.limit), 1), 100) : 20
    const isPaginated = page !== null && !isNaN(page) && page >= 1

    let dbQuery = supabase
      .from('thread_order_weeks')
      .select(
        `
        *,
        item_count:thread_order_items(count)
      `,
        isPaginated ? { count: 'exact' } : undefined,
      )
      .order('created_at', { ascending: false })

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status)
    }

    if (isPaginated) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      dbQuery = dbQuery.range(from, to)
    }

    const { data, error, count } = await dbQuery

    if (error) throw error

    // Flatten the count from Supabase's aggregate format
    const result = (data || []).map((row: any) => ({
      ...row,
      item_count: row.item_count?.[0]?.count ?? 0,
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

/**
 * POST /api/weekly-orders/enrich-inventory - Enrich summary rows with inventory data
 */
weeklyOrder.post('/enrich-inventory', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const body = await c.req.json()

    let validated
    try {
      validated = EnrichInventorySchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const { summary_rows, current_week_id } = validated

    // Extract unique thread_type_ids
    const threadTypeIds = [...new Set(summary_rows.map((r) => r.thread_type_id))]

    const partialConeRatio = await getPartialConeRatio()

    // Query inventory counts grouped by thread_type_id and is_partial (avoids Supabase 1000-row default limit)
    const { data: inventoryCounts, error: invError } = await supabase.rpc('fn_count_available_cones', {
      p_thread_type_ids: threadTypeIds,
    })

    if (invError) throw invError

    const fullMap = new Map<number, number>()
    const partialMap = new Map<number, number>()
    for (const row of inventoryCounts || []) {
      if (row.is_partial) {
        partialMap.set(row.thread_type_id, row.cone_count)
      } else {
        fullMap.set(row.thread_type_id, row.cone_count)
      }
    }

    // Query committed cones from other CONFIRMED weeks via their saved summary_data
    const committedMap = new Map<number, number>()
    if (threadTypeIds.length > 0) {
      // Get total_cones from summary_data of other CONFIRMED weeks
      let confirmedQuery = supabase
        .from('thread_order_results')
        .select('week_id, summary_data, thread_order_weeks!inner(status)')
        .eq('thread_order_weeks.status', 'CONFIRMED')

      if (current_week_id) {
        confirmedQuery = confirmedQuery.neq('week_id', current_week_id)
      }

      const { data: confirmedData, error: confirmedError } = await confirmedQuery

      if (confirmedError) {
        console.error('[enrich-inventory] confirmedError:', confirmedError)
      }

      for (const result of confirmedData || []) {
        const summaryRows = result.summary_data as Array<{ thread_type_id: number; total_cones: number }> | null
        if (!summaryRows) continue
        for (const row of summaryRows) {
          if (threadTypeIds.includes(row.thread_type_id)) {
            const current = committedMap.get(row.thread_type_id) || 0
            committedMap.set(row.thread_type_id, current + (row.total_cones || 0))
          }
        }
      }
    }

    // SL cần đặt = max(0, ⌈Nhu Cầu - Tồn Kho QĐ⌉)
    // Cuộn đã reserve (RESERVED_FOR_ORDER) không nằm trong AVAILABLE → tự trừ
    const enrichedRows = summary_rows.map((row) => {
      const full_cones = fullMap.get(row.thread_type_id) || 0
      const partial_cones = partialMap.get(row.thread_type_id) || 0
      const inventory_cones = full_cones + partial_cones
      const equivalent_cones = Math.round((full_cones + partial_cones * partialConeRatio) * 10) / 10
      const sl_can_dat = Math.max(0, Math.ceil(row.total_cones - equivalent_cones))
      const additional_order = 0
      const total_final = sl_can_dat

      return {
        ...row,
        full_cones,
        partial_cones,
        inventory_cones,
        equivalent_cones,
        sl_can_dat,
        additional_order,
        total_final,
      }
    })

    return c.json({ data: enrichedRows, error: null })
  } catch (err) {
    console.error('Error enriching inventory data:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PUT /api/weekly-orders/items/:id/quota - Update quota_cones for a thread type in a week
 * Body: { thread_type_id: number, quota_cones: number }
 */
weeklyOrder.put('/items/:id/quota', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    if (isNaN(weekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = UpdateQuotaConesSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const { thread_type_id, quota_cones } = validated

    // 1. Get all order items for this week with this thread type
    // First, we need to find items that use this thread type through style/color relationships
    // Since thread_order_items stores style_id and color_id, we need to update summary_data in thread_order_results

    // 2. Check if week exists
    const { error: weekError } = await supabase
      .from('thread_order_weeks')
      .select('id')
      .eq('id', weekId)
      .single()

    if (weekError) {
      if (weekError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
      }
      throw weekError
    }

    // 3. Get current results
    const { data: results, error: resultsError } = await supabase
      .from('thread_order_results')
      .select('*')
      .eq('week_id', weekId)
      .single()

    if (resultsError) {
      if (resultsError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Chưa có kết quả tính toán cho tuần này' }, 404)
      }
      throw resultsError
    }

    // 4. Update quota_cones in summary_data
    let updated = false
    const summaryData = results.summary_data as any[]
    for (const row of summaryData) {
      if (row.thread_type_id === thread_type_id) {
        row.quota_cones = quota_cones
        updated = true
        break
      }
    }

    if (!updated) {
      return c.json({ data: null, error: 'Không tìm thấy loại chỉ trong kết quả tuần này' }, 404)
    }

    // 5. Save updated summary_data
    const { error: updateError } = await supabase
      .from('thread_order_results')
      .update({
        summary_data: summaryData,
      })
      .eq('week_id', weekId)
      .select()
      .single()

    if (updateError) throw updateError

    return c.json({
      data: { thread_type_id, quota_cones },
      error: null,
      message: `Đã cập nhật định mức cuộn cho loại chỉ`,
    })
  } catch (err) {
    console.error('Error updating quota cones:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/weekly-orders/deliveries/overview - List all deliveries across weeks
 */
weeklyOrder.get('/deliveries/overview', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const status = c.req.query('status')
    const weekId = c.req.query('week_id')

    let query = supabase
      .from('thread_order_deliveries')
      .select(`
        *,
        supplier:suppliers(id, name),
        thread_type:thread_types(id, name, tex_number, color_data:colors!color_id(name, hex_code)),
        week:thread_order_weeks(id, week_name)
      `)
      .order('delivery_date', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }
    if (weekId) {
      query = query.eq('week_id', parseInt(weekId))
    }

    const { data, error } = await query

    if (error) throw error

    // Get all unique week_ids to fetch summary_data
    const weekIds = [...new Set((data || []).map((row: any) => row.week_id))]

    // Fetch summary_data for all weeks
    const { data: resultsData } = await supabase
      .from('thread_order_results')
      .select('week_id, summary_data')
      .in('week_id', weekIds)

    // Build a map: week_id -> thread_type_id -> { total_final, thread_color, thread_color_code }
    const summaryMap = new Map<number, Map<number, { total_final: number; thread_color?: string; thread_color_code?: string }>>()
    for (const result of resultsData || []) {
      if (result.summary_data && Array.isArray(result.summary_data)) {
        const threadMap = new Map<number, { total_final: number; thread_color?: string; thread_color_code?: string }>()
        for (const row of result.summary_data as Array<{ thread_type_id: number; total_final?: number; thread_color?: string; thread_color_code?: string }>) {
          if (row.thread_type_id && row.total_final !== undefined) {
            threadMap.set(row.thread_type_id, {
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
    const enrichedRows = (data || [])
      .map((row: any) => {
        const deliveryDate = new Date(row.delivery_date)
        deliveryDate.setHours(0, 0, 0, 0)
        const days_remaining = Math.ceil((deliveryDate.getTime() - now.getTime()) / 86400000)

        // Get total_final from summary_data
        const threadMap = summaryMap.get(row.week_id)
        const summaryInfo = threadMap?.get(row.thread_type_id)
        const total_cones = summaryInfo?.total_final ?? null

        return {
          ...row,
          supplier_name: row.supplier?.name || '',
          thread_type_name: row.thread_type?.name || '',
          tex_number: row.thread_type?.tex_number || '',
          color_name: row.thread_type?.color_data?.name || summaryInfo?.thread_color || '',
          color_hex: row.thread_type?.color_data?.hex_code || summaryInfo?.thread_color_code || '',
          week_name: row.week?.week_name || '',
          days_remaining,
          is_overdue: days_remaining < 0 && row.status === 'PENDING',
          total_cones,
        }
      })
      // Hide stale PENDING rows that are no longer present in summary_data.
      .filter((row: any) => {
        if (row.total_cones === null) {
          return row.status === 'DELIVERED' || (row.received_quantity || 0) > 0
        }
        return row.total_cones >= 1
      })

    // Defensive dedupe for legacy duplicated rows by (week_id, thread_type_id).
    const dedupeMap = new Map<string, any>()
    const toTimestamp = (value: unknown) => {
      const ts = new Date(String(value || '')).getTime()
      return Number.isNaN(ts) ? 0 : ts
    }

    for (const row of enrichedRows) {
      const key = `${row.week_id}_${row.thread_type_id}`
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

    const { data: loanAggs } = await supabase
      .from('thread_order_loans')
      .select('from_week_id, to_week_id, thread_type_id, quantity_cones')
      .eq('status', 'ACTIVE')
      .is('deleted_at', null)
      .not('from_week_id', 'is', null)

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

    return c.json({ data: withLoanContext, error: null })
  } catch (err) {
    console.error('Error fetching deliveries overview:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PATCH /api/weekly-orders/deliveries/:deliveryId - Update a delivery record
 */
weeklyOrder.patch('/deliveries/:deliveryId', requirePermission('thread.allocations.manage'), async (c) => {
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

    const { data, error } = await supabase
      .from('thread_order_deliveries')
      .update(updateFields)
      .eq('id', deliveryId)
      .select(`
        *,
        supplier:suppliers(id, name),
        thread_type:thread_types(id, name, tex_number)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy bản ghi giao hàng' }, 404)
      }
      throw error
    }

    // Keep weekly order summary_data in sync when delivery_date is edited from delivery tracking page.
    if (validated.delivery_date !== undefined) {
      const updatedDelivery = data as { week_id: number; thread_type_id: number }

      const { data: resultRow, error: resultFetchError } = await supabase
        .from('thread_order_results')
        .select('id, summary_data')
        .eq('week_id', updatedDelivery.week_id)
        .maybeSingle()

      if (resultFetchError) {
        console.warn('Error fetching weekly result for delivery-date sync:', resultFetchError)
      } else if (resultRow?.summary_data && Array.isArray(resultRow.summary_data)) {
        let changed = false
        const nextSummary = (resultRow.summary_data as Array<Record<string, unknown>>).map((row) => {
          if (row.thread_type_id === updatedDelivery.thread_type_id) {
            changed = true
            return { ...row, delivery_date: validated.delivery_date }
          }
          return row
        })

        if (changed) {
          const { error: resultUpdateError } = await supabase
            .from('thread_order_results')
            .update({ summary_data: nextSummary })
            .eq('id', resultRow.id)

          if (resultUpdateError) {
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

/**
 * POST /api/weekly-orders/deliveries/:deliveryId/receive - Receive delivery into inventory
 * Creates individual thread_inventory cones (not thread_stock aggregate) and updates delivery status
 */
weeklyOrder.post('/deliveries/:deliveryId/receive', requirePermission('thread.allocations.manage'), async (c) => {
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

    const { data: delivery, error: deliveryError } = await supabase
      .from('thread_order_deliveries')
      .select('id, status, week_id, thread_type_id')
      .eq('id', deliveryId)
      .single()

    if (deliveryError) {
      if (deliveryError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy delivery' }, 404)
      }
      throw deliveryError
    }

    if (delivery.status !== 'DELIVERED') {
      return c.json({ data: null, error: 'Chỉ có thể nhập kho cho đơn đã giao' }, 400)
    }

    const { data: result, error: rpcError } = await supabase.rpc('fn_receive_delivery', {
      p_delivery_id: deliveryId,
      p_received_qty: quantity,
      p_warehouse_id: warehouse_id,
      p_received_by: received_by,
      p_expiry_date: expiry_date || null,
    })

    if (rpcError) {
      console.error('fn_receive_delivery error:', rpcError)
      return c.json({ data: null, error: rpcError.message }, 500)
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

weeklyOrder.get('/ordered-quantities', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const query = c.req.query()

    let validated
    try {
      validated = OrderedQuantitiesQuerySchema.parse(query)
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

    const results = []

    for (const pair of pairs) {
      if (!pair.po_id || !pair.style_id) continue

      let itemsQuery = supabase
        .from('thread_order_items')
        .select('quantity, week:thread_order_weeks!inner(id, status)')
        .eq('po_id', pair.po_id)
        .eq('style_id', pair.style_id)
        .neq('week.status', 'CANCELLED')

      if (excludeWeekId) {
        itemsQuery = itemsQuery.neq('week.id', excludeWeekId)
      }

      const { data: items } = await itemsQuery

      const orderedQuantity = (items || []).reduce(
        (sum: number, row: any) => sum + (row.quantity || 0),
        0,
      )

      const { data: poItem } = await supabase
        .from('po_items')
        .select('quantity')
        .eq('po_id', pair.po_id)
        .eq('style_id', pair.style_id)
        .is('deleted_at', null)
        .single()

      const poQuantity = poItem?.quantity || 0
      const remaining = Math.max(0, poQuantity - orderedQuantity)

      results.push({
        po_id: pair.po_id,
        style_id: pair.style_id,
        po_quantity: poQuantity,
        ordered_quantity: orderedQuantity,
        remaining,
      })
    }

    return c.json({ data: results, error: null })
  } catch (err) {
    console.error('Error fetching ordered quantities:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

weeklyOrder.get('/history-by-week', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const query = c.req.query()

    let validated
    try {
      validated = HistoryByWeekQuerySchema.parse(query)
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
      let itemQuery = supabase
        .from('thread_order_items')
        .select('week_id, week:thread_order_weeks!inner(status)')

      if (validated.po_id) {
        itemQuery = itemQuery.eq('po_id', parseInt(validated.po_id))
      }
      if (validated.style_id) {
        itemQuery = itemQuery.eq('style_id', parseInt(validated.style_id))
      }
      itemQuery = itemQuery.neq('week.status', 'CANCELLED')

      const { data: matchingItems } = await itemQuery
      weekIds = [...new Set((matchingItems || []).map((i: any) => i.week_id))]

      if (weekIds.length === 0) {
        return c.json({
          data: [],
          error: null,
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
    }

    let countQuery = supabase
      .from('thread_order_weeks')
      .select('id', { count: 'exact', head: true })

    let weeksQuery = supabase
      .from('thread_order_weeks')
      .select('id, week_name, status, created_by, created_at')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    const statusParam = validated.status
    if (statusParam === 'ALL') {
      // No status filter
    } else if (statusParam && ['DRAFT', 'CONFIRMED', 'CANCELLED'].includes(statusParam)) {
      countQuery = countQuery.eq('status', statusParam)
      weeksQuery = weeksQuery.eq('status', statusParam)
    } else {
      countQuery = countQuery.neq('status', 'CANCELLED')
      weeksQuery = weeksQuery.neq('status', 'CANCELLED')
    }

    if (weekIds !== null) {
      countQuery = countQuery.in('id', weekIds)
      weeksQuery = weeksQuery.in('id', weekIds)
    }

    if (validated.from_date) {
      const fromIso = validated.from_date.includes('/')
        ? validated.from_date.split('/').reverse().join('-')
        : validated.from_date
      countQuery = countQuery.gte('created_at', `${fromIso}T00:00:00.000Z`)
      weeksQuery = weeksQuery.gte('created_at', `${fromIso}T00:00:00.000Z`)
    }
    if (validated.to_date) {
      const toIso = validated.to_date.includes('/')
        ? validated.to_date.split('/').reverse().join('-')
        : validated.to_date
      const toDateEnd = toIso.includes('T') ? toIso : `${toIso}T23:59:59.999Z`
      countQuery = countQuery.lte('created_at', toDateEnd)
      weeksQuery = weeksQuery.lte('created_at', toDateEnd)
    }

    if (validated.created_by) {
      countQuery = countQuery.ilike('created_by', `%${validated.created_by}%`)
      weeksQuery = weeksQuery.ilike('created_by', `%${validated.created_by}%`)
    }

    const [{ count }, { data: weeks, error: weeksError }] = await Promise.all([countQuery, weeksQuery])

    if (weeksError) throw weeksError
    if (!weeks || weeks.length === 0) {
      return c.json({
        data: [],
        error: null,
        pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
      })
    }

    const pageWeekIds = weeks.map((w: any) => w.id)

    let itemsQuery = supabase
      .from('thread_order_items')
      .select(`
        id, week_id, po_id, style_id, style_color_id, quantity,
        style:styles(id, style_code, style_name),
        style_color:style_colors(id, color_name, hex_code),
        po:purchase_orders(id, po_number)
      `)
      .in('week_id', pageWeekIds)

    if (validated.po_id) {
      itemsQuery = itemsQuery.eq('po_id', parseInt(validated.po_id))
    }
    if (validated.style_id) {
      itemsQuery = itemsQuery.eq('style_id', parseInt(validated.style_id))
    }

    const { data: items, error: itemsError } = await itemsQuery
    if (itemsError) throw itemsError

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

    for (const pair of uniquePairs.values()) {
      const { data: orderedItems } = await supabase
        .from('thread_order_items')
        .select('quantity, week:thread_order_weeks!inner(id, status)')
        .eq('po_id', pair.po_id)
        .eq('style_id', pair.style_id)
        .neq('week.status', 'CANCELLED')

      const totalOrdered = (orderedItems || []).reduce(
        (sum: number, row: any) => sum + (row.quantity || 0),
        0,
      )

      const { data: poItem } = await supabase
        .from('po_items')
        .select('quantity')
        .eq('po_id', pair.po_id)
        .eq('style_id', pair.style_id)
        .is('deleted_at', null)
        .single()

      const poQuantity = poItem?.quantity || 0

      progressMap.set(`${pair.po_id}-${pair.style_id}`, {
        po_quantity: poQuantity,
        total_ordered: totalOrdered,
      })
    }

    const result = weeks.map((week: any) => {
      const weekItems = (items || []).filter((i: any) => i.week_id === week.id)

      const poMap = new Map<string, { po_id: number | null; po_number: string; items: any[] }>()
      for (const item of weekItems) {
        const poKey = item.po_id ? String(item.po_id) : 'null'
        if (!poMap.has(poKey)) {
          poMap.set(poKey, {
            po_id: item.po_id,
            po_number: item.po?.po_number || 'Không có PO',
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

/**
 * GET /api/weekly-orders/check-name - Check if week name exists
 * Returns { exists: boolean, week?: { id, week_name, status } }
 */
weeklyOrder.get('/check-name', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const rawName = c.req.query('name')
    const name = rawName?.trim()

    if (!name) {
      return c.json({ data: null, error: 'Thiếu tên tuần' }, 400)
    }

    const { data: week, error } = await supabase
      .from('thread_order_weeks')
      .select('id, week_name, status')
      .eq('week_name', name)
      .maybeSingle()

    if (error) throw error

    if (week) {
      return c.json({ data: { exists: true, week }, error: null })
    }

    return c.json({ data: { exists: false }, error: null })
  } catch (err) {
    console.error('Error checking week name:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/weekly-orders/assignment-summary - Aggregate assignment data across weeks
 * Query params:
 *   status - filter by week status (DRAFT, CONFIRMED, COMPLETED, CANCELLED)
 */
weeklyOrder.get('/assignment-summary', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const statusFilter = c.req.query('status')

    // 1. Get weeks with optional status filter
    let weeksQuery = supabase
      .from('thread_order_weeks')
      .select('id, week_name, status')
      .order('created_at', { ascending: false })

    if (statusFilter) {
      weeksQuery = weeksQuery.eq('status', statusFilter)
    }

    const { data: weeks, error: weeksError } = await weeksQuery
    if (weeksError) throw weeksError
    if (!weeks || weeks.length === 0) {
      return c.json({ data: [], error: null })
    }

    const weekIds = weeks.map((w: any) => w.id)

    // 2. Get planned cones from thread_order_results.summary_data JSONB
    const { data: resultsData, error: resultsError } = await supabase
      .from('thread_order_results')
      .select('week_id, summary_data')
      .in('week_id', weekIds)

    if (resultsError) throw resultsError

    // Build map: week_id -> thread_type_id -> planned_cones
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

    // 3. Count reserved cones from thread_inventory by reserved_week_id
    const { data: reservedData, error: reservedError } = await supabase
      .from('thread_inventory')
      .select('reserved_week_id, thread_type_id')
      .in('reserved_week_id', weekIds)
      .eq('status', 'RESERVED_FOR_ORDER')

    if (reservedError) throw reservedError

    // Build map: week_id -> thread_type_id -> count
    const reservedMap = new Map<number, Map<number, number>>()
    for (const cone of reservedData || []) {
      if (!reservedMap.has(cone.reserved_week_id)) {
        reservedMap.set(cone.reserved_week_id, new Map())
      }
      const typeMap = reservedMap.get(cone.reserved_week_id)!
      typeMap.set(cone.thread_type_id, (typeMap.get(cone.thread_type_id) || 0) + 1)
    }

    // 4. Sum allocated cones from thread_allocations by week_id
    // Join with thread_types to get meters_per_cone
    // ISSUED = đã cấp phát, HARD = đã confirm cứng
    const { data: allocData, error: allocError } = await supabase
      .from('thread_allocations')
      .select('week_id, thread_type_id, allocated_meters, thread_type:thread_types(meters_per_cone)')
      .in('week_id', weekIds)
      .in('status', ['ISSUED', 'HARD'])

    if (allocError) throw allocError

    // Build map: week_id -> thread_type_id -> allocated_cones
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

    // 5. Aggregate results
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

/**
 * POST /api/weekly-orders/:id/items/:itemId/complete - Mark item as issuance complete
 */
weeklyOrder.post('/:id/items/:itemId/complete', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    const itemId = parseInt(c.req.param('itemId'))
    if (isNaN(weekId) || isNaN(itemId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', weekId)
      .single()

    if (weekError || !week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }
    if (week.status !== 'CONFIRMED') {
      return c.json({ data: null, error: 'Chỉ có thể đánh dấu hoàn tất khi tuần ở trạng thái CONFIRMED' }, 400)
    }

    const { data: item, error: itemError } = await supabase
      .from('thread_order_items')
      .select('id')
      .eq('id', itemId)
      .eq('week_id', weekId)
      .single()

    if (itemError || !item) {
      return c.json({ data: null, error: 'Sản phẩm không thuộc tuần này' }, 404)
    }

    const claims = c.get('jwtPayload' as never) as any
    const performedBy = claims?.employee_code || claims?.email || 'system'

    const { data, error } = await supabase
      .from('thread_order_item_completions')
      .upsert({ item_id: itemId, completed_by: performedBy }, { onConflict: 'item_id' })
      .select()
      .single()

    if (error) throw error

    return c.json({ data, error: null, message: 'Đã đánh dấu hoàn tất xuất chỉ' })
  } catch (err) {
    console.error('Error marking item complete:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * DELETE /api/weekly-orders/:id/items/:itemId/complete - Undo item completion
 */
weeklyOrder.delete('/:id/items/:itemId/complete', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    const itemId = parseInt(c.req.param('itemId'))
    if (isNaN(weekId) || isNaN(itemId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', weekId)
      .single()

    if (weekError || !week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }
    if (week.status !== 'CONFIRMED') {
      return c.json({ data: null, error: 'Không thể bỏ đánh dấu khi tuần không ở trạng thái CONFIRMED' }, 400)
    }

    const { data: item, error: itemError } = await supabase
      .from('thread_order_items')
      .select('id')
      .eq('id', itemId)
      .eq('week_id', weekId)
      .single()

    if (itemError || !item) {
      return c.json({ data: null, error: 'Sản phẩm không thuộc tuần này' }, 404)
    }

    const { error } = await supabase
      .from('thread_order_item_completions')
      .delete()
      .eq('item_id', itemId)

    if (error) throw error

    return c.json({ data: null, error: null, message: 'Đã bỏ đánh dấu hoàn tất' })
  } catch (err) {
    console.error('Error unmarking item complete:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/weekly-orders/:id/completions - Get all completions for a week
 */
weeklyOrder.get('/:id/completions', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    if (isNaN(weekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('thread_order_item_completions')
      .select('*, item:thread_order_items!inner(id, week_id)')
      .eq('item.week_id', weekId)

    if (error) throw error

    return c.json({ data: data || [], error: null })
  } catch (err) {
    console.error('Error fetching completions:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/weekly-orders/:id/surplus-preview - Preview surplus release
 */
weeklyOrder.get('/:id/surplus-preview', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    if (isNaN(weekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', weekId)
      .single()

    if (weekError || !week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
    }

    const { count: totalCones, error: coneError } = await supabase
      .from('thread_inventory')
      .select('id', { count: 'exact', head: true })
      .eq('reserved_week_id', weekId)
      .eq('status', 'RESERVED_FOR_ORDER')

    if (coneError) throw coneError

    const { count: totalItems } = await supabase
      .from('thread_order_items')
      .select('id', { count: 'exact', head: true })
      .eq('week_id', weekId)

    const { count: completedItems } = await supabase
      .from('thread_order_item_completions')
      .select('id', { count: 'exact', head: true })
      .in(
        'item_id',
        (await supabase.from('thread_order_items').select('id').eq('week_id', weekId)).data?.map((i: any) => i.id) || [],
      )

    const allCompleted = (totalItems ?? 0) > 0 && (completedItems ?? 0) >= (totalItems ?? 0)
    const canRelease = allCompleted && week.status === 'CONFIRMED'

    // Breakdown query — wrapped in try-catch for graceful fallback (D3)
    let breakdown:
      | {
          thread_type_id: number
          supplier_name: string
          tex_number: string
          color_name: string
          own_cones: number
          borrowed_cones: number
          borrowed_groups: { original_week_id: number; week_name: string; count: number; action: 're-reserve' | 'release' }[]
        }[]
      | undefined

    try {
      const { data: cones, error: conesError } = await supabase
        .from('thread_inventory')
        .select(
          `id, thread_type_id, original_week_id,
          thread_type:thread_types(tex_number, supplier:suppliers(name)),
          color:colors!color_id(name)`,
        )
        .eq('reserved_week_id', weekId)
        .eq('status', 'RESERVED_FOR_ORDER')

      if (!conesError && cones && cones.length > 0) {
        // Batch-fetch distinct original week statuses (no N+1)
        const borrowedWeekIds = [
          ...new Set(
            cones
              .filter((c: any) => c.original_week_id != null && c.original_week_id !== weekId)
              .map((c: any) => c.original_week_id as number),
          ),
        ]

        const origWeekMap = new Map<number, { status: string; week_name: string }>()
        if (borrowedWeekIds.length > 0) {
          const { data: origWeeks } = await supabase
            .from('thread_order_weeks')
            .select('id, status, week_name')
            .in('id', borrowedWeekIds)
          for (const w of origWeeks ?? []) {
            origWeekMap.set(w.id, { status: w.status, week_name: w.week_name })
          }
        }

        // Group by thread_type_id
        type BorrowedGroupAccum = { week_name: string; count: number; action: 're-reserve' | 'release' }
        type TypeAccum = {
          thread_type_id: number
          supplier_name: string
          tex_number: string
          color_name: string
          own_cones: number
          borrowed_cones: number
          borrowed_groups: Map<number, BorrowedGroupAccum>
        }
        const byType = new Map<number, TypeAccum>()

        for (const cone of cones as any[]) {
          const tt = cone.thread_type ?? {}
          const typeId: number = cone.thread_type_id
          if (!byType.has(typeId)) {
            byType.set(typeId, {
              thread_type_id: typeId,
              supplier_name: tt.supplier?.name ?? '-',
              tex_number: tt.tex_number != null ? String(tt.tex_number) : '-',
              color_name: cone.color?.name ?? '-',
              own_cones: 0,
              borrowed_cones: 0,
              borrowed_groups: new Map(),
            })
          }
          const grp = byType.get(typeId)!

          const origId: number | null = cone.original_week_id
          if (origId != null && origId !== weekId) {
            const origWeek = origWeekMap.get(origId)
            if (origWeek?.status === 'CONFIRMED') {
              grp.borrowed_cones++
              const bg = grp.borrowed_groups.get(origId)
              if (bg) {
                bg.count++
              } else {
                grp.borrowed_groups.set(origId, { week_name: origWeek.week_name, count: 1, action: 're-reserve' })
              }
            } else {
              grp.own_cones++
            }
          } else {
            grp.own_cones++
          }
        }

        breakdown = Array.from(byType.values()).map((g) => ({
          thread_type_id: g.thread_type_id,
          supplier_name: g.supplier_name,
          tex_number: g.tex_number,
          color_name: g.color_name,
          own_cones: g.own_cones,
          borrowed_cones: g.borrowed_cones,
          borrowed_groups: Array.from(g.borrowed_groups.entries()).map(([origWeekId, bg]) => ({
            original_week_id: origWeekId,
            week_name: bg.week_name,
            count: bg.count,
            action: bg.action,
          })),
        }))
      } else if (!conesError && cones) {
        breakdown = []
      }
    } catch (breakdownErr) {
      console.error('Breakdown query failed (fallback to total-only):', breakdownErr)
    }

    return c.json({
      data: {
        total_cones: totalCones ?? 0,
        total_items: totalItems ?? 0,
        completed_items: completedItems ?? 0,
        can_release: canRelease,
        ...(breakdown !== undefined ? { breakdown } : {}),
      },
      error: null,
    })
  } catch (err) {
    console.error('Error fetching surplus preview:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/weekly-orders/:id/release-surplus - Execute surplus release (CONFIRMED → COMPLETED)
 */
weeklyOrder.post('/:id/release-surplus', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))
    if (isNaN(weekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const claims = c.get('jwtPayload' as never) as any
    const performedBy = claims?.employee_code || claims?.email || 'system'

    const { data: rpcResult, error: rpcError } = await supabase.rpc('fn_complete_week_and_release', {
      p_week_id: weekId,
      p_performed_by: performedBy,
    })

    if (rpcError) {
      if (rpcError.message?.includes('Tuần đã được hoàn tất')) {
        return c.json({ data: null, error: 'Tuần đã được hoàn tất' }, 409)
      }
      if (rpcError.message?.includes('Chưa hoàn tất tất cả')) {
        return c.json({ data: null, error: rpcError.message }, 400)
      }
      if (rpcError.message?.includes('CONFIRMED')) {
        return c.json({ data: null, error: rpcError.message }, 400)
      }
      throw rpcError
    }

    return c.json({
      data: rpcResult,
      error: null,
      message: 'Hoàn tất tuần và trả dư thành công',
    })
  } catch (err) {
    console.error('Error releasing surplus:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/weekly-orders/:id/loan-detail-by-type - Per-thread-type loan breakdown for a week
 */
weeklyOrder.get('/:id/loan-detail-by-type', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase.rpc('fn_loan_detail_by_thread_type', {
      p_week_id: id,
    })

    if (error) throw error

    return c.json({ data: data || [], error: null })
  } catch (err) {
    console.error('Error fetching loan detail by type:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/weekly-orders/:id/deliveries - List deliveries for a specific week
 */
weeklyOrder.get('/:id/deliveries', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const [deliveriesResult, loansResult, summaryResult] = await Promise.all([
      supabase
        .from('thread_order_deliveries')
        .select(`
          *,
          supplier:suppliers(id, name),
          thread_type:thread_types(id, name, tex_number, color_data:colors!color_id(name, hex_code))
        `)
        .eq('week_id', id)
        .order('delivery_date', { ascending: true }),
      supabase
        .from('thread_order_loans')
        .select('thread_type_id, from_week_id, to_week_id, quantity_cones')
        .or(`from_week_id.eq.${id},to_week_id.eq.${id}`)
        .eq('status', 'ACTIVE')
        .is('deleted_at', null),
      supabase
        .from('thread_order_results')
        .select('summary_data')
        .eq('week_id', id)
        .single(),
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

/**
 * GET /api/weekly-orders/:id - Get single weekly order with items
 */
weeklyOrder.get('/:id', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('thread_order_weeks')
      .select(
        `
        *,
        items:thread_order_items (
          id,
          week_id,
          po_id,
          style_id,
          style_color_id,
          quantity,
          sub_art_id,
          created_at,
          style:styles (id, style_code, style_name),
          style_color:style_colors (id, color_name, hex_code),
          po:purchase_orders (id, po_number),
          sub_art:sub_arts (id, sub_art_code)
        )
      `,
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
      }
      throw error
    }

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/weekly-orders - Create weekly order with items
 */
weeklyOrder.post('/', requirePermission('thread.allocations.manage'), async (c) => {
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
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      createdBy = emp?.full_name || null
    }

    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .insert([
        {
          week_name: validated.week_name.trim(),
          start_date: validated.start_date || null,
          end_date: validated.end_date || null,
          status: 'DRAFT',
          notes: validated.notes || null,
          created_by: createdBy,
        },
      ])
      .select()
      .single()

    if (weekError) {
      if (weekError.code === '23505') {
        return c.json({ data: null, error: 'Tên tuần đã tồn tại' }, 409)
      }
      throw weekError
    }

    // Insert items
    const itemRows = validated.items.map((item) => ({
      week_id: week.id,
      po_id: item.po_id || null,
      style_id: item.style_id,
      style_color_id: item.style_color_id,
      quantity: item.quantity,
      sub_art_id: item.sub_art_id || null,
    }))

    const { data: items, error: itemsError } = await supabase
      .from('thread_order_items')
      .insert(itemRows)
      .select(
        `
        id,
        week_id,
        po_id,
        style_id,
        style_color_id,
        quantity,
        sub_art_id,
        created_at,
        style:styles (id, style_code, style_name),
        style_color:style_colors (id, color_name, hex_code),
        po:purchase_orders (id, po_number),
        sub_art:sub_arts (id, sub_art_code)
      `,
      )

    if (itemsError) throw itemsError

    return c.json(
      { data: { ...week, items }, error: null, message: 'Tạo tuần đặt hàng thành công' },
      201,
    )
  } catch (err) {
    console.error('Error creating weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PUT /api/weekly-orders/:id - Update weekly order (draft only)
 */
weeklyOrder.put('/:id', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    // Check current status
    const { data: existing, error: fetchError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
      }
      throw fetchError
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

    // Update the week record
    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (validated.week_name !== undefined) updateFields.week_name = validated.week_name.trim()
    if (validated.start_date !== undefined) updateFields.start_date = validated.start_date || null
    if (validated.end_date !== undefined) updateFields.end_date = validated.end_date || null
    if (validated.notes !== undefined) updateFields.notes = validated.notes || null

    const auth = c.get('auth')
    if (auth?.employeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      updateFields.updated_by = emp?.full_name || null
    }

    const { data: week, error: updateError } = await supabase
      .from('thread_order_weeks')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === '23505') {
        return c.json({ data: null, error: 'Tên tuần đã tồn tại' }, 409)
      }
      throw updateError
    }

    // Replace items if provided
    let items: Record<string, unknown>[] | null = null
    if (validated.items !== undefined) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('thread_order_items')
        .delete()
        .eq('week_id', id)

      if (deleteError) throw deleteError

      // Insert new items
      if (validated.items.length > 0) {
        const itemRows = validated.items.map((item) => ({
          week_id: id,
          po_id: item.po_id || null,
          style_id: item.style_id,
          style_color_id: item.style_color_id,
          quantity: item.quantity,
          sub_art_id: item.sub_art_id || null,
        }))

        const { data: newItems, error: insertError } = await supabase
          .from('thread_order_items')
          .insert(itemRows)
          .select(
            `
            id,
            week_id,
            po_id,
            style_id,
            style_color_id,
            quantity,
            sub_art_id,
            created_at,
            style:styles (id, style_code, style_name),
            style_color:style_colors (id, color_name, hex_code),
            po:purchase_orders (id, po_number),
            sub_art:sub_arts (id, sub_art_code)
          `,
          )

        if (insertError) throw insertError
        items = newItems
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

/**
 * DELETE /api/weekly-orders/:id - Delete weekly order (draft only, no results)
 */
weeklyOrder.delete('/:id', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    // Check current status
    const { data: existing, error: fetchError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
      }
      throw fetchError
    }

    if (existing.status !== 'DRAFT') {
      return c.json(
        { data: null, error: 'Chỉ có thể xóa tuần ở trạng thái nháp (DRAFT)' },
        400,
      )
    }

    // Check if results exist
    const { data: results, error: resultsError } = await supabase
      .from('thread_order_results')
      .select('id')
      .eq('week_id', id)
      .limit(1)

    if (resultsError) throw resultsError

    if (results && results.length > 0) {
      return c.json(
        {
          data: null,
          error: 'Không thể xóa vì đã có kết quả tính toán. Hãy xóa kết quả trước.',
        },
        409,
      )
    }

    // Delete items first (FK constraint)
    const { error: itemsDeleteError } = await supabase
      .from('thread_order_items')
      .delete()
      .eq('week_id', id)

    if (itemsDeleteError) throw itemsDeleteError

    // Delete the week
    const { error: deleteError } = await supabase
      .from('thread_order_weeks')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return c.json({ data: null, error: null, message: 'Xóa tuần đặt hàng thành công' })
  } catch (err) {
    console.error('Error deleting weekly order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PATCH /api/weekly-orders/:id/status - Update status with transition validation
 * Tasks 6.1-6.5: Atomic confirm with reserve, cancel with loan check
 */
weeklyOrder.patch('/:id/status', requirePermission('thread.allocations.manage'), async (c) => {
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

    // Get current status
    const { data: existing, error: fetchError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
      }
      throw fetchError
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

    // Task 6.1: When CONFIRMED, call fn_confirm_week_with_reserve (atomic)
    if (newStatus === 'CONFIRMED') {
      // Task 6.2: Retry logic for SKIP LOCKED
      let result = null
      let lastError = null
      const maxRetries = 3
      const retryDelay = 100

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('fn_confirm_week_with_reserve', {
          p_week_id: id,
        })

        if (rpcError) {
          lastError = rpcError
          // If function doesn't exist or has issues, fallback to simple update
          if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
            lastError = null
            break
          }
          break
        }

        result = rpcResult
        // Check if we need to retry (skipped_locked > 0 in any summary)
        const summaries = result?.reservation_summary || []
        const hasSkipped = summaries.some((s: any) => s.skipped_locked > 0)

        if (!hasSkipped) {
          break // Success, no need to retry
        }

        // Wait before retry
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
      }

      if (lastError) {
        console.error('[PATCH status] fn_confirm_week_with_reserve error:', lastError)
        return c.json({ data: null, error: lastError.message }, 500)
      }

      // If RPC succeeded, return with reservation_summary
      if (result) {
        // Task 6.3: Return response with reservation_summary
        const { data: week } = await supabase
          .from('thread_order_weeks')
          .select('*')
          .eq('id', id)
          .single()

        const statusLabels: Record<string, string> = { CONFIRMED: 'xác nhận', CANCELLED: 'hủy' }
        const warehouseIds = await getWarehouseEmployeeIds()
        broadcastNotification({
          employeeIds: warehouseIds,
          type: 'WEEKLY_ORDER',
          title: `Đơn đặt hàng tuần #${id} đã được ${statusLabels[newStatus] || newStatus}`,
          actionUrl: '/thread/weekly-order',
          metadata: { weekly_order_id: id, new_status: newStatus },
        })

        return c.json({
          data: {
            week,
            reservation_summary: result?.reservation_summary || [],
          },
          error: null,
          message: 'Xác nhận và đặt trước thành công',
        })
      }
      // else: fallback to simple update below
    }

    // Task 6.4: When CANCELLED, check for active loans first
    if (newStatus === 'CANCELLED') {
      const { data: activeLoans, error: loansError } = await supabase
        .from('thread_order_loans')
        .select('id')
        .or(`from_week_id.eq.${id},to_week_id.eq.${id}`)
        .is('deleted_at', null)
        .limit(1)

      if (loansError) throw loansError

      if (activeLoans && activeLoans.length > 0) {
        return c.json(
          {
            data: null,
            error: 'Không thể hủy khi còn khoản mượn/cho mượn chưa thanh toán',
          },
          400,
        )
      }

      // Task 6.5: Call fn_release_week_reservations
      const { error: releaseError } = await supabase.rpc('fn_release_week_reservations', {
        p_week_id: id,
      })

      if (releaseError) {
        return c.json({ data: null, error: releaseError.message }, 500)
      }
    }

    // Update status (for CANCELLED case, or fallback)
    const { data, error } = await supabase
      .from('thread_order_weeks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const statusLabels: Record<string, string> = {
      CONFIRMED: 'xác nhận',
      CANCELLED: 'hủy',
    }
    const warehouseIds = await getWarehouseEmployeeIds()
    broadcastNotification({
      employeeIds: warehouseIds,
      type: 'WEEKLY_ORDER',
      title: `Đơn đặt hàng tuần #${id} đã được ${statusLabels[newStatus] || newStatus}`,
      actionUrl: '/thread/weekly-order',
      metadata: { weekly_order_id: id, new_status: newStatus },
    })

    return c.json({ data, error: null, message: 'Cập nhật trạng thái thành công' })
  } catch (err) {
    console.error('Error updating weekly order status:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/weekly-orders/:id/results - Save/replace calculation results (upsert)
 */
weeklyOrder.post('/:id/results', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    // Verify week exists
    const { error: fetchError } = await supabase
      .from('thread_order_weeks')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy tuần đặt hàng' }, 404)
      }
      throw fetchError
    }

    const body = await c.req.json()

    let validated
    try {
      validated = SaveResultsSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    // Task 5.1: Compute quota_cones for each row in summary_data
    let enrichedSummaryData = validated.summary_data || null
    if (validated.summary_data && Array.isArray(validated.summary_data)) {
      const summaryRows = validated.summary_data as Array<{
        thread_type_id: number
        total_meters?: number
        meters_per_cone?: number
        [key: string]: unknown
      }>

      // Get thread_type_ids to fetch meters_per_cone
      const threadTypeIds = [...new Set(summaryRows.map((r) => r.thread_type_id))]

      // Fetch meters_per_cone for all thread types
      const { data: threadTypes, error: threadError } = await supabase
        .from('thread_types')
        .select('id, meters_per_cone')
        .in('id', threadTypeIds)

      if (threadError) {
        console.warn('Error fetching thread types for quota calculation:', threadError)
      }

      // Build a map of thread_type_id -> meters_per_cone
      const metersPerConeMap = new Map<number, number>()
      for (const tt of threadTypes || []) {
        // Default to 2000 if meters_per_cone is null
        metersPerConeMap.set(tt.id, tt.meters_per_cone || 2000)
      }

      // Compute quota_cones for each row
      enrichedSummaryData = summaryRows.map((row) => {
        const totalMeters = row.total_meters || 0
        const metersPerCone = row.meters_per_cone || metersPerConeMap.get(row.thread_type_id) || 2000

        // quota_cones = CEILING(total_meters / meters_per_cone)
        const quotaCones = totalMeters > 0 ? Math.ceil(totalMeters / metersPerCone) : 0

        // Log warning if meters_per_cone was missing
        if (!row.meters_per_cone && !metersPerConeMap.has(row.thread_type_id)) {
          console.warn(`Thread type ${row.thread_type_id} has no meters_per_cone, using default 2000`)
        }

        return {
          ...row,
          quota_cones: quotaCones,
        }
      })
    }

    const { data, error } = await supabase
      .from('thread_order_results')
      .upsert(
        {
          week_id: id,
          calculation_data: validated.calculation_data,
          summary_data: enrichedSummaryData,
          calculated_at: new Date().toISOString(),
        },
        { onConflict: 'week_id' },
      )
      .select()
      .single()

    if (error) throw error

    // Auto-create delivery records from summary_data (use enrichedSummaryData with quota_cones)
    if (enrichedSummaryData && Array.isArray(enrichedSummaryData)) {
      const summaryRows = enrichedSummaryData as Array<{
        thread_type_id: number
        supplier_id?: number | null
        delivery_date?: string | null
        lead_time_days?: number | null
        total_final?: number | null
        total_cones?: number | null
        [key: string]: unknown
      }>

      // Get existing delivery records for this week (Task 3.5: include quantity_cones)
      const { data: existingDeliveries } = await supabase
        .from('thread_order_deliveries')
        .select('id, thread_type_id, supplier_id, delivery_date, status, received_quantity, quantity_cones')
        .eq('week_id', id)

      // Build desired delivery rows from current summary data.
      // Deduplicate by thread_type_id to prevent repeated rows in tracking tab.
      // Task 3.1-3.3: Include quantity_cones from total_final
      const desiredDeliveryMap = new Map<number, {
        week_id: number
        thread_type_id: number
        supplier_id: number
        delivery_date: string
        status: 'PENDING'
        quantity_cones: number
      }>()

      for (const row of summaryRows) {
        // Task 3.1: Read total_final from each summary_data row
        const plannedCones = row.total_final ?? row.total_cones ?? 0
        // Task 3.2: Filter - only process rows with valid supplier_id (skip aggregated rows)
        if (!row.supplier_id || plannedCones < 1) continue

        if (!desiredDeliveryMap.has(row.thread_type_id)) {
          const leadTime = (row.lead_time_days && row.lead_time_days > 0) ? row.lead_time_days : 7
          const deliveryDate = row.delivery_date || (() => {
            const d = new Date()
            d.setDate(d.getDate() + leadTime)
            return d.toISOString().split('T')[0]
          })()

          desiredDeliveryMap.set(row.thread_type_id, {
            week_id: id,
            thread_type_id: row.thread_type_id,
            supplier_id: row.supplier_id!,
            delivery_date: deliveryDate,
            status: 'PENDING',
            quantity_cones: plannedCones, // Task 3.3: Include quantity_cones
          })
        } else {
          // Accumulate quantity_cones for same thread_type_id
          const existing = desiredDeliveryMap.get(row.thread_type_id)!
          existing.quantity_cones += plannedCones
        }
      }

      const desiredDeliveryRows = Array.from(desiredDeliveryMap.values())
      const desiredThreadTypeIds = new Set(desiredDeliveryRows.map((row) => row.thread_type_id))
      const existingThreadTypeIds = new Set(
        (existingDeliveries || []).map((d: { thread_type_id: number }) => d.thread_type_id)
      )

      // Insert NEW rows only.
      const newDeliveryRows = desiredDeliveryRows
        .filter((row) => !existingThreadTypeIds.has(row.thread_type_id))

      if (newDeliveryRows.length > 0) {
        // Task 3.5: Log delivery creation for audit trail
        for (const row of newDeliveryRows) {
          console.info(`[saveResults] Creating delivery for week=${id} thread_type=${row.thread_type_id}: quantity_cones=${row.quantity_cones}`)
        }

        const { error: deliveryError } = await supabase
          .from('thread_order_deliveries')
          .insert(newDeliveryRows)

        if (deliveryError) {
          console.warn('Error creating delivery records:', deliveryError)
          // Don't throw - delivery creation is secondary to results saving
        }
      }

      // Sync existing pending rows with the latest summary data.
      // Keep delivered/received rows unchanged to preserve execution history.
      // Task 3.4: Also update quantity_cones when syncing
      const existingByThreadType = new Map(
        (existingDeliveries || []).map((row: {
          id: number
          thread_type_id: number
          supplier_id: number | null
          delivery_date: string
          status: string
          received_quantity: number | null
          quantity_cones: number | null
        }) => [row.thread_type_id, row])
      )

      const rowsToSync = desiredDeliveryRows.filter((row) => {
        const existing = existingByThreadType.get(row.thread_type_id)
        if (!existing) return false
        if (existing.status !== 'PENDING') return false
        if ((existing.received_quantity || 0) > 0) return false

        const sameSupplier = (existing.supplier_id ?? null) === (row.supplier_id ?? null)
        const sameQuantity = (existing.quantity_cones ?? 0) === row.quantity_cones
        // Task 3.4: Only sync supplier_id and quantity_cones, preserve manual delivery_date edits
        return !(sameSupplier && sameQuantity)
      })

      if (rowsToSync.length > 0) {
        const nowIso = new Date().toISOString()
        for (const row of rowsToSync) {
          const existing = existingByThreadType.get(row.thread_type_id)
          if (!existing) continue

          // Task 3.5: Log delivery quantity changes for audit trail
          console.info(`[saveResults] Syncing delivery for week=${id} thread_type=${row.thread_type_id}: quantity_cones ${existing.quantity_cones ?? 0} -> ${row.quantity_cones}`)

          const { error: syncError } = await supabase
            .from('thread_order_deliveries')
            .update({
              supplier_id: row.supplier_id,
              // Note: delivery_date is NOT updated to preserve manual edits (per spec)
              quantity_cones: row.quantity_cones, // Task 3.4: Sync quantity_cones
              updated_at: nowIso,
            })
            .eq('id', existing.id)

          if (syncError) {
            console.warn('Error syncing existing pending delivery row:', syncError)
          }
        }
      }

      // Task 3.4: Unmatched summary rows - keep existing delivery records unchanged (no delete)
      // Stale pending rows that are no longer in current summary are left as-is per spec.
      // This preserves delivery tracking history even when thread types are removed from results.
    }

    // Create allocation records for shortage items from calculation_data
    if (validated.calculation_data && Array.isArray(validated.calculation_data)) {
      const allocationRows: Array<{
        order_id: string
        order_reference: string
        thread_type_id: number
        requested_meters: number
        priority: string
        status: string
      }> = []

      for (const result of validated.calculation_data as Array<{
        style_id: number
        style_code: string
        style_name: string
        calculations: Array<{
          spec_id: number
          process_name: string
          shortage_cones?: number
          is_fully_stocked?: boolean
          meters_per_cone?: number | null
          color_breakdown?: Array<{
            thread_type_id: number
            color_name: string
            total_meters: number
          }>
        }>
      }>) {
        for (const calc of result.calculations) {
          // Skip fully stocked items - no allocation needed
          if (calc.is_fully_stocked === true) continue

          // Only create allocation if there's a shortage
          const shortageCones = calc.shortage_cones || 0
          if (shortageCones <= 0) continue

          const metersPerCone = calc.meters_per_cone || 0
          if (metersPerCone <= 0) continue

          // Get thread_type_id from color_breakdown
          if (calc.color_breakdown && calc.color_breakdown.length > 0) {
            // Create one allocation per thread_type_id in color_breakdown
            const threadTypeMap = new Map<number, number>()
            for (const cb of calc.color_breakdown) {
              const cbNeededCones = Math.ceil(cb.total_meters / metersPerCone)
              const current = threadTypeMap.get(cb.thread_type_id) || 0
              threadTypeMap.set(cb.thread_type_id, current + cbNeededCones)
            }

            for (const [threadTypeId, neededCones] of threadTypeMap) {
              // Calculate shortage proportion
              const totalCones = [...threadTypeMap.values()].reduce((a, b) => a + b, 0)
              const shortageForThisType = Math.ceil((shortageCones / totalCones) * neededCones)

              if (shortageForThisType > 0) {
                allocationRows.push({
                  order_id: `WO-${id}-${result.style_code}-${calc.spec_id}`,
                  order_reference: `Tuần ${id} - ${result.style_name} - ${calc.process_name}`,
                  thread_type_id: threadTypeId,
                  requested_meters: shortageForThisType * metersPerCone,
                  priority: 'NORMAL',
                  status: 'PENDING',
                  week_id: id, // Task 5.2: Store week_id on allocation for WO context
                })
              }
            }
          }
        }
      }

      // Batch insert allocation records
      if (allocationRows.length > 0) {
        const { error: allocError } = await supabase
          .from('thread_allocations')
          .insert(allocationRows)

        if (allocError) {
          console.warn('Error creating allocation records:', allocError)
          // Don't throw - allocation creation is secondary to results saving
        }
      }
    }

    return c.json({ data, error: null, message: 'Lưu kết quả tính toán thành công' })
  } catch (err) {
    console.error('Error saving weekly order results:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/weekly-orders/:id/results - Get saved calculation results
 */
weeklyOrder.get('/:id/results', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('thread_order_results')
      .select('*')
      .eq('week_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Chưa có kết quả tính toán cho tuần này' }, 404)
      }
      throw error
    }

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching weekly order results:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

// ============================================================================
// LOAN & RESERVATION ENDPOINTS
// ============================================================================

/**
 * GET /api/weekly-orders/loans/summary
 * Aggregate: per-week cones needed, reserved, shortage, NCC delivery, active loans
 */
weeklyOrder.get('/loans/summary', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const { data, error } = await supabase.rpc('fn_loan_dashboard_summary')

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching loan dashboard summary:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/weekly-orders/loans/all - Get all loans across all weeks
 * Static route MUST be before /:id/loans
 */
weeklyOrder.get('/loans/all', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const { data: loans, error } = await supabase
      .from('thread_order_loans')
      .select(
        `
        *,
        from_week:thread_order_weeks!thread_order_loans_from_week_id_fkey(id, week_name),
        to_week:thread_order_weeks!thread_order_loans_to_week_id_fkey(id, week_name),
        thread_type:thread_types(id, code, name, tex_number, supplier:suppliers(name))
      `,
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    const weekIds = [
      ...new Set(
        (loans || []).flatMap((l: any) => [l.from_week_id, l.to_week_id].filter(Boolean)),
      ),
    ]

    const summaryMap = new Map<number, Map<number, { supplier_name: string; tex_number: string; thread_color: string }>>()
    if (weekIds.length > 0) {
      const { data: resultsData } = await supabase
        .from('thread_order_results')
        .select('week_id, summary_data')
        .in('week_id', weekIds)

      for (const result of resultsData || []) {
        if (result.summary_data && Array.isArray(result.summary_data)) {
          const threadMap = new Map<number, { supplier_name: string; tex_number: string; thread_color: string }>()
          for (const row of result.summary_data as Array<{ thread_type_id: number; supplier_name?: string; tex_number?: string; thread_color?: string }>) {
            if (row.thread_type_id) {
              threadMap.set(row.thread_type_id, {
                supplier_name: row.supplier_name || '',
                tex_number: row.tex_number || '',
                thread_color: row.thread_color || '',
              })
            }
          }
          summaryMap.set(result.week_id, threadMap)
        }
      }
    }

    const enriched = (loans || []).map((loan: any) => {
      const weekId = loan.to_week_id || loan.from_week_id
      const threadMap = summaryMap.get(weekId)
      const info = threadMap?.get(loan.thread_type_id)
      return {
        ...loan,
        supplier_name: loan.thread_type?.supplier?.name || info?.supplier_name || '',
        tex_number: loan.thread_type?.tex_number || info?.tex_number || '',
        color_name: info?.thread_color || '',
      }
    })

    return c.json({ data: enriched, error: null })
  } catch (err) {
    console.error('Error fetching all loans:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/weekly-orders/loans/:loanId/return-logs
 * Return history for a loan (newest first)
 * Static route MUST be before /:id/loans
 */
weeklyOrder.get('/loans/:loanId/return-logs', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const loanId = parseInt(c.req.param('loanId'))
    if (isNaN(loanId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data: logs, error } = await supabase
      .from('thread_loan_return_logs')
      .select('*')
      .eq('loan_id', loanId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return c.json({ data: logs || [], error: null })
  } catch (err) {
    console.error('Error fetching loan return logs:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/weekly-orders/:weekId/loans/:loanId/manual-return
 * Manual return of borrowed cones via fn_manual_return_loan RPC
 * Specific route MUST be before POST /:id/loans
 */
weeklyOrder.post('/:weekId/loans/:loanId/manual-return', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const loanId = parseInt(c.req.param('loanId'))
    if (isNaN(loanId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = ManualReturnSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const auth = c.get('auth')
    let returnedBy = 'unknown'
    if (auth?.employeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      returnedBy = emp?.full_name || auth.employeeCode || 'unknown'
    }

    const { data: result, error: rpcError } = await supabase.rpc('fn_manual_return_loan', {
      p_loan_id: loanId,
      p_quantity: validated.quantity,
      p_returned_by: returnedBy,
      p_notes: validated.notes || null,
    })

    if (rpcError) {
      return c.json({ data: null, error: rpcError.message }, 400)
    }

    return c.json({ data: result, error: null, message: `Đã trả ${validated.quantity} cuộn thành công` })
  } catch (err) {
    console.error('Error processing manual return:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/weekly-orders/:id/loans - Create manual borrow
 * Uses fn_borrow_thread RPC, created_by from auth context
 */
weeklyOrder.post('/:id/loans', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const toWeekId = parseInt(c.req.param('id'))

    if (isNaN(toWeekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = CreateLoanSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    // ISSUE-1 FIX: Use c.get('auth') pattern and lookup employee full_name
    const auth = c.get('auth')
    let createdBy = 'unknown'
    if (auth?.employeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      createdBy = emp?.full_name || auth.employeeCode || 'unknown'
    }

    const { data: result, error: rpcError } = await supabase.rpc('fn_borrow_thread', {
      p_from_week_id: validated.from_week_id,
      p_to_week_id: toWeekId,
      p_thread_type_id: validated.thread_type_id,
      p_quantity: validated.quantity_cones,
      p_reason: validated.reason || null,
      p_user: createdBy,
    })

    if (rpcError) {
      return c.json({ data: null, error: rpcError.message }, 400)
    }

    return c.json({
      data: result,
      error: null,
      message: 'Mượn chỉ thành công',
    })
  } catch (err) {
    console.error('Error creating loan:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

weeklyOrder.post('/:id/loans/batch', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const toWeekId = parseInt(c.req.param('id'))

    if (isNaN(toWeekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = CreateBatchLoanSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    const auth = c.get('auth')
    let createdBy = 'unknown'
    if (auth?.employeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      createdBy = emp?.full_name || auth.employeeCode || 'unknown'
    }

    const { data: result, error: rpcError } = await supabase.rpc('fn_batch_borrow_thread', {
      p_from_week_id: validated.from_week_id,
      p_to_week_id: toWeekId,
      p_items: JSON.stringify(validated.items),
      p_reason: validated.reason || null,
      p_user: createdBy,
    })

    if (rpcError) {
      return c.json({ data: null, error: rpcError.message }, 400)
    }

    return c.json({
      data: result,
      error: null,
      message: `Mượn ${validated.items.length} loại chỉ thành công`,
    })
  } catch (err) {
    console.error('Error creating batch loan:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * Task 8.2: GET /api/weekly-orders/:id/loans - Get loan history (given and received)
 * Filters deleted_at IS NULL
 */
weeklyOrder.get('/:id/loans', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    // Get loans where this week is either lender or borrower
    const { data: loans, error } = await supabase
      .from('thread_order_loans')
      .select(
        `
        *,
        from_week:thread_order_weeks!thread_order_loans_from_week_id_fkey(id, week_name),
        to_week:thread_order_weeks!thread_order_loans_to_week_id_fkey(id, week_name),
        thread_type:thread_types(id, code, name, tex_number, supplier:suppliers(name))
      `,
      )
      .or(`from_week_id.eq.${id},to_week_id.eq.${id}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    const weekIds = [
      ...new Set(
        (loans || []).flatMap((l: any) => [l.from_week_id, l.to_week_id].filter(Boolean)),
      ),
    ]

    const summaryMap = new Map<number, Map<number, { supplier_name: string; tex_number: string; thread_color: string }>>()
    if (weekIds.length > 0) {
      const { data: resultsData } = await supabase
        .from('thread_order_results')
        .select('week_id, summary_data')
        .in('week_id', weekIds)

      for (const result of resultsData || []) {
        if (result.summary_data && Array.isArray(result.summary_data)) {
          const threadMap = new Map<number, { supplier_name: string; tex_number: string; thread_color: string }>()
          for (const row of result.summary_data as Array<{ thread_type_id: number; supplier_name?: string; tex_number?: string; thread_color?: string }>) {
            if (row.thread_type_id) {
              threadMap.set(row.thread_type_id, {
                supplier_name: row.supplier_name || '',
                tex_number: row.tex_number || '',
                thread_color: row.thread_color || '',
              })
            }
          }
          summaryMap.set(result.week_id, threadMap)
        }
      }
    }

    const enrichLoan = (loan: any) => {
      const weekId = loan.to_week_id || loan.from_week_id
      const threadMap = summaryMap.get(weekId)
      const info = threadMap?.get(loan.thread_type_id)
      return {
        ...loan,
        supplier_name: loan.thread_type?.supplier?.name || info?.supplier_name || '',
        tex_number: loan.thread_type?.tex_number || info?.tex_number || '',
        color_name: info?.thread_color || '',
      }
    }

    const enrichedAll = (loans || []).map(enrichLoan)
    const given = enrichedAll.filter((l: any) => l.from_week_id === id)
    const received = enrichedAll.filter((l: any) => l.to_week_id === id)

    return c.json({
      data: { all: enrichedAll, given, received },
      error: null,
    })
  } catch (err) {
    console.error('Error fetching loans:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * Task 8.3: GET /api/weekly-orders/:id/reservations - Get reserved cones list
 * Queries thread_inventory WHERE reserved_week_id = :id (no deleted_at filter)
 */
weeklyOrder.get('/:id/reservations', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const [conesResult, resultsResult] = await Promise.all([
      supabase
        .from('thread_inventory')
        .select(
          `
          id,
          cone_id,
          thread_type_id,
          quantity_meters,
          warehouse_id,
          lot_number,
          expiry_date,
          received_date,
          thread_type:thread_types(id, code, name, tex_number, supplier:suppliers(name)),
          warehouse:warehouses(id, code, name)
        `,
        )
        .eq('reserved_week_id', id)
        .eq('status', 'RESERVED_FOR_ORDER')
        .order('thread_type_id')
        .order('expiry_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('thread_order_results')
        .select('summary_data')
        .eq('week_id', id)
        .maybeSingle(),
    ])

    if (conesResult.error) throw conesResult.error

    const cones = conesResult.data || []

    const colorMap = new Map<number, string>()
    if (resultsResult.data?.summary_data && Array.isArray(resultsResult.data.summary_data)) {
      for (const row of resultsResult.data.summary_data as Array<{ thread_type_id: number; thread_color?: string }>) {
        if (row.thread_type_id && row.thread_color) {
          colorMap.set(row.thread_type_id, row.thread_color)
        }
      }
    }

    const enrichedCones = cones.map((cone: any) => ({
      ...cone,
      thread_type: cone.thread_type
        ? { ...cone.thread_type, color_name: colorMap.get(cone.thread_type_id) || '' }
        : cone.thread_type,
    }))

    const summaryMap = new Map<number, { thread_type_id: number; count: number; total_meters: number }>()
    for (const cone of cones) {
      const existing = summaryMap.get(cone.thread_type_id)
      if (existing) {
        existing.count++
        existing.total_meters += cone.quantity_meters || 0
      } else {
        summaryMap.set(cone.thread_type_id, {
          thread_type_id: cone.thread_type_id,
          count: 1,
          total_meters: cone.quantity_meters || 0,
        })
      }
    }

    return c.json({
      data: {
        cones: enrichedCones,
        summary: Array.from(summaryMap.values()),
        total_cones: cones.length,
      },
      error: null,
    })
  } catch (err) {
    console.error('Error fetching reservations:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

// ============================================================================
// RESERVE FROM STOCK ENDPOINTS (Tasks 4 & 4B)
// ============================================================================

/**
 * Task 4B: GET /api/weekly-orders/:id/reservation-summary - Get reservation summary
 * Returns per-thread summary with needed, reserved, shortage, available_stock
 * ISSUE-2 FIX: Also include thread types from summary_data that don't have delivery rows
 */
weeklyOrder.get('/:id/reservation-summary', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    // 4B.2: Get delivery records for this week (needed = quantity_cones)
    const { data: deliveries, error: deliveryError } = await supabase
      .from('thread_order_deliveries')
      .select('thread_type_id, quantity_cones, thread_type:thread_types(id, name)')
      .eq('week_id', id)

    if (deliveryError) throw deliveryError

    // Build delivery map: thread_type_id -> quantity_cones
    const deliveryMap = new Map<number, number>()
    const threadTypeNameMap = new Map<number, string>()
    for (const d of deliveries || []) {
      deliveryMap.set(d.thread_type_id, d.quantity_cones || 0)
      if (d.thread_type && typeof d.thread_type === 'object' && 'name' in d.thread_type) {
        threadTypeNameMap.set(d.thread_type_id, (d.thread_type as { id: number; name: string }).name)
      }
    }

    // ISSUE-2 FIX: Also get thread types from summary_data that may not have delivery rows
    const { data: resultsData, error: resultsError } = await supabase
      .from('thread_order_results')
      .select('summary_data')
      .eq('week_id', id)
      .single()

    if (resultsError && resultsError.code !== 'PGRST116') throw resultsError

    // Extract thread types from summary_data (fallback when no delivery row)
    type SummaryRow = { thread_type_id?: number; thread_type_name?: string; total_final?: number }
    const summaryData: SummaryRow[] = resultsData?.summary_data || []
    const summaryMap = new Map<number, { name: string; totalFinal: number }>()
    for (const row of summaryData) {
      if (row.thread_type_id && row.total_final != null) {
        summaryMap.set(row.thread_type_id, {
          name: row.thread_type_name || '',
          totalFinal: row.total_final,
        })
        // Also populate name if missing from delivery
        if (!threadTypeNameMap.has(row.thread_type_id) && row.thread_type_name) {
          threadTypeNameMap.set(row.thread_type_id, row.thread_type_name)
        }
      }
    }

    // Combine thread types: from deliveries + from summary_data (no duplicates)
    const allThreadTypeIds = new Set<number>([...deliveryMap.keys(), ...summaryMap.keys()])

    if (allThreadTypeIds.size === 0) {
      return c.json({ data: [], error: null })
    }

    const threadTypeIds = Array.from(allThreadTypeIds)

    // 4B.4: Get reserved counts per thread_type
    const { data: reservedCounts, error: reservedError } = await supabase
      .from('thread_inventory')
      .select('thread_type_id')
      .eq('reserved_week_id', id)
      .eq('status', 'RESERVED_FOR_ORDER')
      .in('thread_type_id', threadTypeIds)

    if (reservedError) throw reservedError

    const reservedMap = new Map<number, number>()
    for (const r of reservedCounts || []) {
      const count = reservedMap.get(r.thread_type_id) || 0
      reservedMap.set(r.thread_type_id, count + 1)
    }

    // 4B.6: Get available stock per thread_type
    const { data: availableCounts, error: availableError } = await supabase
      .from('thread_inventory')
      .select('thread_type_id')
      .eq('status', 'AVAILABLE')
      .is('reserved_week_id', null)
      .in('thread_type_id', threadTypeIds)

    if (availableError) throw availableError

    const availableMap = new Map<number, number>()
    for (const a of availableCounts || []) {
      const count = availableMap.get(a.thread_type_id) || 0
      availableMap.set(a.thread_type_id, count + 1)
    }

    // Build summary array
    const summary = threadTypeIds.map((threadTypeId) => {
      const hasDeliveryRow = deliveryMap.has(threadTypeId)
      // 4B.3: needed = quantity_cones if delivery exists, else total_final from summary_data
      const needed = hasDeliveryRow
        ? (deliveryMap.get(threadTypeId) || 0)
        : (summaryMap.get(threadTypeId)?.totalFinal || 0)
      const reserved = reservedMap.get(threadTypeId) || 0
      const availableStock = availableMap.get(threadTypeId) || 0
      const shortage = Math.max(0, needed)
      // 4B.7: can_reserve = true only if delivery row exists
      const canReserve = hasDeliveryRow
      const cannotReserveReason = hasDeliveryRow ? undefined : 'Không có dữ liệu giao hàng cho loại chỉ này'
      const threadTypeName = threadTypeNameMap.get(threadTypeId) || ''

      return {
        thread_type_id: threadTypeId,
        thread_type_name: threadTypeName,
        needed,
        reserved,
        shortage,
        available_stock: availableStock,
        can_reserve: canReserve,
        cannot_reserve_reason: cannotReserveReason,
      }
    })

    return c.json({ data: summary, error: null })
  } catch (err) {
    console.error('Error fetching reservation summary:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * Task 4.2-4.5: POST /api/weekly-orders/:id/reserve-from-stock - Reserve available stock
 * Calls fn_reserve_from_stock RPC
 */
weeklyOrder.post('/:id/reserve-from-stock', requirePermission('thread.allocations.manage'), async (c) => {
  try {
    const weekId = parseInt(c.req.param('id'))

    if (isNaN(weekId)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    let validated
    try {
      validated = ReserveFromStockSchema.parse(body)
    } catch (err) {
      if (err instanceof ZodError) {
        return c.json({ data: null, error: formatZodError(err) }, 400)
      }
      throw err
    }

    // Task 4.3: Validate week exists and is CONFIRMED
    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', weekId)
      .single()

    if (weekError || !week) {
      return c.json({ data: null, error: 'Không tìm thấy tuần đơn hàng' }, 404)
    }

    if (week.status !== 'CONFIRMED') {
      return c.json({ data: null, error: 'Chỉ có thể lấy từ tồn kho cho tuần đã xác nhận' }, 400)
    }

    // ISSUE-1 FIX: Use c.get('auth') pattern and lookup employee full_name
    const auth = c.get('auth')
    let createdBy = 'unknown'
    if (auth?.employeeId) {
      const { data: emp } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', auth.employeeId)
        .single()
      createdBy = emp?.full_name || auth.employeeCode || 'unknown'
    }

    // Task 4.4: Call fn_reserve_from_stock RPC
    const { data: result, error: rpcError } = await supabase.rpc('fn_reserve_from_stock', {
      p_week_id: weekId,
      p_thread_type_id: validated.thread_type_id,
      p_quantity: validated.quantity,
      p_reason: validated.reason || null,
      p_user: createdBy,
    })

    if (rpcError) {
      return c.json({ data: null, error: rpcError.message }, 400)
    }

    // Task 4.5: Return result with loan_id
    return c.json({
      data: result,
      error: null,
      message: `Đã lấy ${result?.reserved || 0} cuộn từ tồn kho`,
    })
  } catch (err) {
    console.error('Error reserving from stock:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default weeklyOrder
