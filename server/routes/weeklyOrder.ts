import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import type {
  CreateWeeklyOrderDTO,
  UpdateWeeklyOrderDTO,
  SaveResultsDTO,
  WeeklyOrderStatus,
} from '../types/weeklyOrder'

const weeklyOrder = new Hono()

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

const VALID_STATUS_TRANSITIONS: Record<WeeklyOrderStatus, WeeklyOrderStatus[]> = {
  draft: ['confirmed'],
  confirmed: ['cancelled'],
  cancelled: [],
}

/**
 * GET /api/weekly-orders - List weekly orders with optional status filter
 */
weeklyOrder.get('/', async (c) => {
  try {
    const query = c.req.query()

    let dbQuery = supabase
      .from('thread_order_weeks')
      .select(`
        *,
        item_count:thread_order_items(count)
      `)
      .order('created_at', { ascending: false })

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status)
    }

    const { data, error } = await dbQuery

    if (error) throw error

    // Flatten the count from Supabase's aggregate format
    const result = (data || []).map((row: any) => ({
      ...row,
      item_count: row.item_count?.[0]?.count ?? 0,
    }))

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
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { data, error } = await supabase
      .from('thread_order_weeks')
      .select(`
        *,
        items:thread_order_items (
          id,
          week_id,
          style_id,
          color_id,
          quantity,
          created_at,
          style:styles (id, style_code, style_name),
          color:colors (id, name, hex_code)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Khong tim thay tuan dat hang' }, 404)
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
    const body: CreateWeeklyOrderDTO = await c.req.json()

    if (!body.week_name || !body.week_name.trim()) {
      return c.json({ data: null, error: 'Ten tuan (week_name) la bat buoc' }, 400)
    }

    if (!body.items || body.items.length === 0) {
      return c.json({ data: null, error: 'Can it nhat mot san pham' }, 400)
    }

    // Insert the week
    const { data: week, error: weekError } = await supabase
      .from('thread_order_weeks')
      .insert([{
        week_name: body.week_name.trim(),
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        status: 'draft',
        notes: body.notes || null,
      }])
      .select()
      .single()

    if (weekError) {
      if (weekError.code === '23505') {
        return c.json({ data: null, error: 'Ten tuan da ton tai' }, 409)
      }
      throw weekError
    }

    // Insert items
    const itemRows = body.items.map((item) => ({
      week_id: week.id,
      style_id: item.style_id,
      color_id: item.color_id,
      quantity: item.quantity,
    }))

    const { data: items, error: itemsError } = await supabase
      .from('thread_order_items')
      .insert(itemRows)
      .select(`
        id,
        week_id,
        style_id,
        color_id,
        quantity,
        created_at,
        style:styles (id, style_code, style_name),
        color:colors (id, name, hex_code)
      `)

    if (itemsError) throw itemsError

    return c.json(
      { data: { ...week, items }, error: null, message: 'Tao tuan dat hang thanh cong' },
      201
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
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    // Check current status
    const { data: existing, error: fetchError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Khong tim thay tuan dat hang' }, 404)
      }
      throw fetchError
    }

    if (existing.status !== 'draft') {
      return c.json(
        { data: null, error: 'Chi co the cap nhat tuan o trang thai nhap (draft)' },
        400
      )
    }

    const body: UpdateWeeklyOrderDTO = await c.req.json()

    // Update the week record
    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (body.week_name !== undefined) updateFields.week_name = body.week_name.trim()
    if (body.start_date !== undefined) updateFields.start_date = body.start_date || null
    if (body.end_date !== undefined) updateFields.end_date = body.end_date || null
    if (body.notes !== undefined) updateFields.notes = body.notes || null

    const { data: week, error: updateError } = await supabase
      .from('thread_order_weeks')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === '23505') {
        return c.json({ data: null, error: 'Ten tuan da ton tai' }, 409)
      }
      throw updateError
    }

    // Replace items if provided
    let items = null
    if (body.items !== undefined) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('thread_order_items')
        .delete()
        .eq('week_id', id)

      if (deleteError) throw deleteError

      // Insert new items
      if (body.items.length > 0) {
        const itemRows = body.items.map((item) => ({
          week_id: id,
          style_id: item.style_id,
          color_id: item.color_id,
          quantity: item.quantity,
        }))

        const { data: newItems, error: insertError } = await supabase
          .from('thread_order_items')
          .insert(itemRows)
          .select(`
            id,
            week_id,
            style_id,
            color_id,
            quantity,
            created_at,
            style:styles (id, style_code, style_name),
            color:colors (id, name, hex_code)
          `)

        if (insertError) throw insertError
        items = newItems
      } else {
        items = []
      }
    }

    const result = items !== null ? { ...week, items } : week

    return c.json({ data: result, error: null, message: 'Cap nhat tuan dat hang thanh cong' })
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
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    // Check current status
    const { data: existing, error: fetchError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Khong tim thay tuan dat hang' }, 404)
      }
      throw fetchError
    }

    if (existing.status !== 'draft') {
      return c.json(
        { data: null, error: 'Chi co the xoa tuan o trang thai nhap (draft)' },
        400
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
        { data: null, error: 'Khong the xoa vi da co ket qua tinh toan. Hay xoa ket qua truoc.' },
        409
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

    return c.json({ data: null, error: null, message: 'Xoa tuan dat hang thanh cong' })
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
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const body = await c.req.json()
    const newStatus = body.status as WeeklyOrderStatus

    if (!newStatus) {
      return c.json({ data: null, error: 'Trang thai (status) la bat buoc' }, 400)
    }

    // Get current status
    const { data: existing, error: fetchError } = await supabase
      .from('thread_order_weeks')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Khong tim thay tuan dat hang' }, 404)
      }
      throw fetchError
    }

    const currentStatus = existing.status as WeeklyOrderStatus
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || []

    if (!allowedTransitions.includes(newStatus)) {
      return c.json(
        {
          data: null,
          error: `Khong the chuyen tu '${currentStatus}' sang '${newStatus}'. Cac trang thai hop le: ${allowedTransitions.join(', ') || 'khong co'}`,
        },
        400
      )
    }

    const { data, error } = await supabase
      .from('thread_order_weeks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return c.json({ data, error: null, message: 'Cap nhat trang thai thanh cong' })
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
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    // Verify week exists
    const { data: existing, error: fetchError } = await supabase
      .from('thread_order_weeks')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return c.json({ data: null, error: 'Khong tim thay tuan dat hang' }, 404)
      }
      throw fetchError
    }

    const body: SaveResultsDTO = await c.req.json()

    if (!body.calculation_data) {
      return c.json({ data: null, error: 'Du lieu tinh toan (calculation_data) la bat buoc' }, 400)
    }

    const { data, error } = await supabase
      .from('thread_order_results')
      .upsert(
        {
          week_id: id,
          calculation_data: body.calculation_data,
          summary_data: body.summary_data || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'week_id' }
      )
      .select()
      .single()

    if (error) throw error

    return c.json({ data, error: null, message: 'Luu ket qua tinh toan thanh cong' })
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
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { data, error } = await supabase
      .from('thread_order_results')
      .select('*')
      .eq('week_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Chua co ket qua tinh toan cho tuan nay' }, 404)
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
