import { Hono } from 'hono'
import { ZodError } from 'zod'
import { supabaseAdmin as supabase } from '../db/supabase'
import { getErrorMessage } from '../utils/errorHelper'
import {
  CreateWeeklyOrderSchema,
  UpdateWeeklyOrderSchema,
  UpdateStatusSchema,
  SaveResultsSchema,
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
