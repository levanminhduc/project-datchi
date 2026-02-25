import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
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

    const { summary_rows } = validated

    // Extract unique thread_type_ids
    const threadTypeIds = [...new Set(summary_rows.map((r) => r.thread_type_id))]

    // Query available inventory
    const { data: inventory, error: invError } = await supabase
      .from('thread_inventory')
      .select('thread_type_id, is_partial')
      .eq('status', 'AVAILABLE')
      .in('thread_type_id', threadTypeIds)

    if (invError) throw invError

    // Aggregate counts per thread_type_id
    const inventoryMap = new Map<number, number>()
    for (const row of inventory || []) {
      const current = inventoryMap.get(row.thread_type_id) || 0
      inventoryMap.set(row.thread_type_id, current + 1)
    }

    // Enrich each summary row
    const enrichedRows = summary_rows.map((row) => {
      const inventory_cones = inventoryMap.get(row.thread_type_id) || 0
      const sl_can_dat = Math.max(0, row.total_cones - inventory_cones)
      const additional_order = 0
      const total_final = sl_can_dat

      return {
        ...row,
        inventory_cones,
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
        thread_type:thread_types(id, name, tex_number),
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

    // Build a map: week_id -> thread_type_id -> total_final
    const summaryMap = new Map<number, Map<number, number>>()
    for (const result of resultsData || []) {
      if (result.summary_data && Array.isArray(result.summary_data)) {
        const threadMap = new Map<number, number>()
        for (const row of result.summary_data as Array<{ thread_type_id: number; total_final?: number }>) {
          if (row.thread_type_id && row.total_final !== undefined) {
            threadMap.set(row.thread_type_id, row.total_final)
          }
        }
        summaryMap.set(result.week_id, threadMap)
      }
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const enriched = (data || [])
      .map((row: any) => {
        const deliveryDate = new Date(row.delivery_date)
        deliveryDate.setHours(0, 0, 0, 0)
        const days_remaining = Math.ceil((deliveryDate.getTime() - now.getTime()) / 86400000)

        // Get total_final from summary_data
        const threadMap = summaryMap.get(row.week_id)
        const total_cones = threadMap?.get(row.thread_type_id) ?? null

        return {
          ...row,
          supplier_name: row.supplier?.name || '',
          thread_type_name: row.thread_type?.name || '',
          tex_number: row.thread_type?.tex_number || '',
          week_name: row.week?.week_name || '',
          days_remaining,
          is_overdue: days_remaining < 0 && row.status === 'PENDING',
          total_cones,
        }
      })
      // Filter out records where total_cones < 1 (no need to order, inventory is sufficient)
      .filter((row: any) => row.total_cones === null || row.total_cones >= 1)

    return c.json({ data: enriched, error: null })
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
 * POST /api/weekly-orders/deliveries/:deliveryId/receive - Receive delivery into stock
 * Creates ONE thread_stock record (not individual cones) and updates delivery receiving status
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

    const { warehouse_id, quantity, received_by } = validated

    // 1. Get delivery record with thread_type info
    const { data: delivery, error: deliveryError } = await supabase
      .from('thread_order_deliveries')
      .select(`
        *,
        thread_type:thread_types(id, name, tex_number, meters_per_cone)
      `)
      .eq('id', deliveryId)
      .single()

    if (deliveryError) {
      if (deliveryError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy delivery' }, 404)
      }
      throw deliveryError
    }

    // 2. Validate delivery status
    if (delivery.status !== 'DELIVERED') {
      return c.json({ data: null, error: 'Chỉ có thể nhập kho cho đơn đã giao' }, 400)
    }

    // 3. Validate warehouse exists
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id, name')
      .eq('id', warehouse_id)
      .single()

    if (warehouseError || !warehouse) {
      return c.json({ data: null, error: 'Kho không tồn tại' }, 400)
    }

    // 4. Generate lot number: LOT-{YYYYMMDD}-{HHmmss}
    const now = new Date()
    const lotNumber = `LOT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

    // 5. Get thread_type_id from delivery
    const threadTypeId = delivery.thread_type_id

    // 6. Create ONE thread_stock record (not individual cones)
    const stockRecord = {
      thread_type_id: threadTypeId,
      warehouse_id: warehouse_id,
      lot_number: lotNumber,
      qty_full_cones: quantity,
      qty_partial_cones: 0,
      received_date: now.toISOString().split('T')[0],
    }

    // 7. Insert thread_stock record
    const { data: insertedStock, error: insertError } = await supabase
      .from('thread_stock')
      .insert(stockRecord)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting stock:', insertError)
      throw insertError
    }

    // 8. Update delivery record
    const newReceivedQuantity = (delivery.received_quantity || 0) + quantity

    // Get total_final from thread_order_results to calculate inventory_status
    const { data: results } = await supabase
      .from('thread_order_results')
      .select('summary_data')
      .eq('week_id', delivery.week_id)
      .single()

    let totalFinal = 0
    if (results?.summary_data) {
      const summaryRows = results.summary_data as any[]
      const matchingRow = summaryRows.find((row: any) => row.thread_type_id === threadTypeId)
      if (matchingRow) {
        totalFinal = matchingRow.total_final || matchingRow.total_cones || 0
      }
    }

    // Calculate inventory_status
    let inventoryStatus: 'PENDING' | 'PARTIAL' | 'RECEIVED' = 'PENDING'
    if (newReceivedQuantity > 0 && newReceivedQuantity < totalFinal) {
      inventoryStatus = 'PARTIAL'
    } else if (newReceivedQuantity >= totalFinal && totalFinal > 0) {
      inventoryStatus = 'RECEIVED'
    } else if (newReceivedQuantity > 0) {
      inventoryStatus = 'PARTIAL'
    }

    const { data: updatedDelivery, error: updateError } = await supabase
      .from('thread_order_deliveries')
      .update({
        received_quantity: newReceivedQuantity,
        inventory_status: inventoryStatus,
        warehouse_id: warehouse_id,
        received_by: received_by,
        received_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', deliveryId)
      .select()
      .single()

    if (updateError) throw updateError

    return c.json({
      data: {
        delivery: updatedDelivery,
        stock_id: insertedStock?.id || null,
        qty_full_cones: quantity,
        lot_number: lotNumber,
      },
      error: null,
      message: `Đã nhập ${quantity} cuộn chỉ vào kho ${warehouse.name}`,
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
        id, week_id, po_id, style_id, color_id, quantity,
        style:styles(id, style_code, style_name),
        color:colors(id, name, hex_code),
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
            color_id: item.color_id,
            color_name: item.color?.name || '',
            hex_code: item.color?.hex_code || '',
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
 * GET /api/weekly-orders/:id/deliveries - List deliveries for a specific week
 */
weeklyOrder.get('/:id/deliveries', requirePermission('thread.allocations.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('thread_order_deliveries')
      .select(`
        *,
        supplier:suppliers(id, name),
        thread_type:thread_types(id, name, tex_number)
      `)
      .eq('week_id', id)
      .order('delivery_date', { ascending: true })

    if (error) throw error

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const enriched = (data || []).map((row: any) => {
      const deliveryDate = new Date(row.delivery_date)
      deliveryDate.setHours(0, 0, 0, 0)
      const days_remaining = Math.ceil((deliveryDate.getTime() - now.getTime()) / 86400000)
      return {
        ...row,
        supplier_name: row.supplier?.name || '',
        thread_type_name: row.thread_type?.name || '',
        tex_number: row.thread_type?.tex_number || '',
        days_remaining,
        is_overdue: days_remaining < 0 && row.status === 'PENDING',
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
          color_id,
          quantity,
          created_at,
          style:styles (id, style_code, style_name),
          color:colors (id, name, hex_code),
          po:purchase_orders (id, po_number)
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
          week_name: validated.week_name,
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
      color_id: item.color_id,
      quantity: item.quantity,
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
        color_id,
        quantity,
        created_at,
        style:styles (id, style_code, style_name),
        color:colors (id, name, hex_code),
        po:purchase_orders (id, po_number)
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
    }

    // Update the week record
    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (validated.week_name !== undefined) updateFields.week_name = validated.week_name
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
          color_id: item.color_id,
          quantity: item.quantity,
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
            color_id,
            quantity,
            created_at,
            style:styles (id, style_code, style_name),
            color:colors (id, name, hex_code),
            po:purchase_orders (id, po_number)
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
        [key: string]: unknown
      }>

      // Get existing delivery records for this week
      const { data: existingDeliveries } = await supabase
        .from('thread_order_deliveries')
        .select('thread_type_id')
        .eq('week_id', id)

      const existingThreadTypeIds = new Set(
        (existingDeliveries || []).map((d: { thread_type_id: number }) => d.thread_type_id)
      )

      // Only insert NEW delivery records (preserve existing ones with manual edits)
      const newDeliveryRows = summaryRows
        .filter((row) => row.supplier_id && !existingThreadTypeIds.has(row.thread_type_id))
        .map((row) => {
          const leadTime = (row.lead_time_days && row.lead_time_days > 0) ? row.lead_time_days : 7
          const deliveryDate = row.delivery_date || (() => {
            const d = new Date()
            d.setDate(d.getDate() + leadTime)
            return d.toISOString().split('T')[0]
          })()

          return {
            week_id: id,
            thread_type_id: row.thread_type_id,
            supplier_id: row.supplier_id!,
            delivery_date: deliveryDate,
            status: 'PENDING',
          }
        })

      if (newDeliveryRows.length > 0) {
        const { error: deliveryError } = await supabase
          .from('thread_order_deliveries')
          .insert(newDeliveryRows)

        if (deliveryError) {
          console.warn('Error creating delivery records:', deliveryError)
          // Don't throw - delivery creation is secondary to results saving
        }
      }
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

export default weeklyOrder
