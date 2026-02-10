import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../db/supabase'
import { getErrorMessage } from '../utils/errorHelper'
import {
  CreateWeeklyOrderSchema,
  UpdateWeeklyOrderSchema,
  UpdateStatusSchema,
  SaveResultsSchema,
  EnrichInventorySchema,
  UpdateDeliverySchema,
} from '../validation/weeklyOrder'
import type { WeeklyOrderStatus } from '../types/weeklyOrder'

const weeklyOrder = new Hono()

function formatZodError(err: ZodError): string {
  return err.issues.map((e) => e.message).join('; ')
}

const VALID_STATUS_TRANSITIONS: Record<WeeklyOrderStatus, WeeklyOrderStatus[]> = {
  draft: ['confirmed'],
  confirmed: ['cancelled'],
  cancelled: [],
}

/**
 * GET /api/weekly-orders - List weekly orders with optional status filter and pagination
 *
 * Query params:
 *   status  - filter by status
 *   page    - page number (1-based), enables pagination
 *   limit   - items per page (default 20, max 100)
 */
weeklyOrder.get('/', async (c) => {
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
weeklyOrder.post('/enrich-inventory', async (c) => {
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
 * GET /api/weekly-orders/deliveries/overview - List all deliveries across weeks
 */
weeklyOrder.get('/deliveries/overview', async (c) => {
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
        week_name: row.week?.week_name || '',
        days_remaining,
        is_overdue: days_remaining < 0 && row.status === 'pending',
      }
    })

    return c.json({ data: enriched, error: null })
  } catch (err) {
    console.error('Error fetching deliveries overview:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PATCH /api/weekly-orders/deliveries/:deliveryId - Update a delivery record
 */
weeklyOrder.patch('/deliveries/:deliveryId', async (c) => {
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
 * GET /api/weekly-orders/:id/deliveries - List deliveries for a specific week
 */
weeklyOrder.get('/:id/deliveries', async (c) => {
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
        is_overdue: days_remaining < 0 && row.status === 'pending',
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
weeklyOrder.get('/:id', async (c) => {
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
weeklyOrder.post('/', async (c) => {
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

    // Insert the week
    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .insert([
        {
          week_name: validated.week_name,
          start_date: validated.start_date || null,
          end_date: validated.end_date || null,
          status: 'draft',
          notes: validated.notes || null,
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
weeklyOrder.put('/:id', async (c) => {
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

    if (existing.status !== 'draft') {
      return c.json(
        { data: null, error: 'Chỉ có thể cập nhật tuần ở trạng thái nháp (draft)' },
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

    // Update the week record
    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (validated.week_name !== undefined) updateFields.week_name = validated.week_name
    if (validated.start_date !== undefined) updateFields.start_date = validated.start_date || null
    if (validated.end_date !== undefined) updateFields.end_date = validated.end_date || null
    if (validated.notes !== undefined) updateFields.notes = validated.notes || null

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
weeklyOrder.delete('/:id', async (c) => {
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

    if (existing.status !== 'draft') {
      return c.json(
        { data: null, error: 'Chỉ có thể xóa tuần ở trạng thái nháp (draft)' },
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
weeklyOrder.patch('/:id/status', async (c) => {
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

    return c.json({ data, error: null, message: 'Cập nhật trạng thái thành công' })
  } catch (err) {
    console.error('Error updating weekly order status:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/weekly-orders/:id/results - Save/replace calculation results (upsert)
 */
weeklyOrder.post('/:id/results', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    // Verify week exists
    const { data: existing, error: fetchError } = await supabase
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

    const { data, error } = await supabase
      .from('thread_order_results')
      .upsert(
        {
          week_id: id,
          calculation_data: validated.calculation_data,
          summary_data: validated.summary_data || null,
          calculated_at: new Date().toISOString(),
        },
        { onConflict: 'week_id' },
      )
      .select()
      .single()

    if (error) throw error

    // Auto-create delivery records from summary_data
    if (validated.summary_data && Array.isArray(validated.summary_data)) {
      const summaryRows = validated.summary_data as Array<{
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
            status: 'pending',
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

    return c.json({ data, error: null, message: 'Lưu kết quả tính toán thành công' })
  } catch (err) {
    console.error('Error saving weekly order results:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/weekly-orders/:id/results - Get saved calculation results
 */
weeklyOrder.get('/:id/results', async (c) => {
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
