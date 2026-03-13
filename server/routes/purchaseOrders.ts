import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
import { CreatePOItemSchema, UpdatePOItemSchema } from '../validation/purchaseOrder'
import type { AuthContext } from '../types/auth'
import type { POItemApiResponse, POItem, POItemHistory } from '../types/purchaseOrder'

const purchaseOrders = new Hono()

/**
 * GET /api/purchase-orders - List all purchase orders with optional filtering
 * Query param: include=items to join po_items + styles
 */
purchaseOrders.get('/', requirePermission('thread.purchase-orders.view'), async (c) => {
  try {
    const query = c.req.query()
    const includeItems = query.include === 'items'

    const selectQuery = includeItems
      ? `*, items:po_items!inner(id, po_id, style_id, quantity, finished_product_code, style:styles(id, style_code, style_name, description))`
      : '*'

    let dbQuery = supabase
      .from('purchase_orders')
      .select(selectQuery)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (includeItems) {
      dbQuery = dbQuery.is('items.deleted_at', null)
    }

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status)
    }
    if (query.priority) {
      dbQuery = dbQuery.eq('priority', query.priority)
    }
    if (query.customer_name) {
      dbQuery = dbQuery.ilike('customer_name', `%${query.customer_name}%`)
    }
    if (query.po_number) {
      dbQuery = dbQuery.ilike('po_number', `%${query.po_number}%`)
    }

    const { data, error } = await dbQuery

    if (error) throw error

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching purchase orders:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/purchase-orders/:id/items/:itemId/history - Get history for item
 * Note: Must be BEFORE /:id to prevent :id from matching
 */
purchaseOrders.get('/:id/items/:itemId/history', requirePermission('thread.purchase-orders.view'), async (c) => {
  try {
    const poId = parseInt(c.req.param('id'))
    const itemId = parseInt(c.req.param('itemId'))

    if (isNaN(poId) || isNaN(itemId)) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data: item, error: itemError } = await supabase
      .from('po_items')
      .select('id, po_id')
      .eq('id', itemId)
      .eq('po_id', poId)
      .single()

    if (itemError) {
      if (itemError.code === 'PGRST116') {
        return c.json<POItemApiResponse<null>>({ data: null, error: 'Không tìm thấy mặt hàng' }, 404)
      }
      throw itemError
    }

    if (!item) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'Không tìm thấy mặt hàng' }, 404)
    }

    const { data: history, error: historyError } = await supabase
      .from('po_item_history')
      .select(`
        id,
        po_item_id,
        change_type,
        previous_quantity,
        new_quantity,
        changed_by,
        notes,
        created_at,
        employee:employees!po_item_history_changed_by_fkey(id, full_name)
      `)
      .eq('po_item_id', itemId)
      .order('created_at', { ascending: false })

    if (historyError) throw historyError

    return c.json<POItemApiResponse<POItemHistory[]>>({
      data: history as POItemHistory[],
      error: null
    })
  } catch (err) {
    console.error('Error fetching PO item history:', err)
    return c.json<POItemApiResponse<null>>({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * GET /api/purchase-orders/:id - Get a single purchase order by ID
 * Query param: include=items to join po_items + styles
 */
purchaseOrders.get('/:id', requirePermission('thread.purchase-orders.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const query = c.req.query()
    const includeItems = query.include === 'items'

    const selectQuery = includeItems
      ? `*, items:po_items(id, po_id, style_id, quantity, finished_product_code, notes, created_at, updated_at, deleted_at, style:styles(id, style_code, style_name, description))`
      : '*'

    const dbQuery = supabase
      .from('purchase_orders')
      .select(selectQuery)
      .eq('id', id)

    const { data, error } = await dbQuery.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy đơn hàng' }, 404)
      }
      throw error
    }

    if (includeItems && data?.items) {
      data.items = data.items.filter((item: { deleted_at: string | null }) => item.deleted_at === null)
    }

    return c.json({ data, error: null })
  } catch (err) {
    console.error('Error fetching purchase order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/purchase-orders - Create a new purchase order
 */
purchaseOrders.post('/', requirePermission('thread.purchase-orders.create'), async (c) => {
  try {
    const body = await c.req.json()

    if (!body.po_number) {
      return c.json({ data: null, error: 'Số hiệu đơn hàng (po_number) là bắt buộc' }, 400)
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([{
        po_number: body.po_number,
        customer_name: body.customer_name,
        week: body.week,
        order_date: body.order_date,
        delivery_date: body.delivery_date,
        status: body.status || 'PENDING',
        priority: body.priority || 'NORMAL',
        notes: body.notes,
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return c.json({ data: null, error: 'Số hiệu đơn hàng đã tồn tại' }, 400)
      }
      throw error
    }

    return c.json({ data, error: null, message: 'Tạo đơn hàng thành công' })
  } catch (err) {
    console.error('Error creating purchase order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * POST /api/purchase-orders/:id/items - Add item to PO
 */
purchaseOrders.post('/:id/items', requirePermission('thread.purchase-orders.create'), async (c) => {
  try {
    const poId = parseInt(c.req.param('id'))

    if (isNaN(poId)) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()
    const parseResult = CreatePOItemSchema.safeParse(body)

    if (!parseResult.success) {
      return c.json<POItemApiResponse<null>>({
        data: null,
        error: parseResult.error.issues.map(i => i.message).join(', ')
      }, 400)
    }

    const { style_id, quantity, finished_product_code, notes } = parseResult.data
    const auth = c.get('auth') as AuthContext & { permissions: string[] }

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('id')
      .eq('id', poId)
      .is('deleted_at', null)
      .single()

    if (poError || !po) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'Không tìm thấy đơn hàng' }, 404)
    }

    const { data: style, error: styleError } = await supabase
      .from('styles')
      .select('id')
      .eq('id', style_id)
      .is('deleted_at', null)
      .single()

    if (styleError || !style) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'Mã hàng không tồn tại' }, 400)
    }

    const { data: existingItem, error: existingError } = await supabase
      .from('po_items')
      .select('id')
      .eq('po_id', poId)
      .eq('style_id', style_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (existingError) throw existingError

    if (existingItem) {
      return c.json<POItemApiResponse<null>>({
        data: null,
        error: 'Mã hàng này đã có trong đơn hàng'
      }, 409)
    }

    const { data: newItem, error: insertError } = await supabase
      .from('po_items')
      .insert({
        po_id: poId,
        style_id,
        quantity,
        finished_product_code: finished_product_code || null,
        notes: notes || null
      })
      .select('*, style:styles(id, style_code, style_name, description)')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return c.json<POItemApiResponse<null>>({
          data: null,
          error: 'Mã hàng này đã có trong đơn hàng'
        }, 409)
      }
      throw insertError
    }

    await supabase.from('po_item_history').insert({
      po_item_id: newItem.id,
      change_type: 'CREATE',
      previous_quantity: null,
      new_quantity: quantity,
      changed_by: auth.employeeId,
      notes: 'Thêm mặt hàng mới'
    })

    return c.json<POItemApiResponse<POItem>>({
      data: newItem,
      error: null,
      message: 'Thêm mặt hàng thành công'
    }, 201)
  } catch (err) {
    console.error('Error adding PO item:', err)
    return c.json<POItemApiResponse<null>>({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PUT /api/purchase-orders/:id - Update a purchase order
 */
purchaseOrders.put('/:id', requirePermission('thread.purchase-orders.edit'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        po_number: body.po_number,
        customer_name: body.customer_name,
        week: body.week,
        order_date: body.order_date,
        delivery_date: body.delivery_date,
        status: body.status,
        priority: body.priority,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy đơn hàng' }, 404)
      }
      if (error.code === '23505') {
        return c.json({ data: null, error: 'Số hiệu đơn hàng đã tồn tại' }, 400)
      }
      throw error
    }

    return c.json({ data, error: null, message: 'Cập nhật đơn hàng thành công' })
  } catch (err) {
    console.error('Error updating purchase order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PUT /api/purchase-orders/:id/items/:itemId - Update item quantity
 */
purchaseOrders.put('/:id/items/:itemId', requirePermission('thread.purchase-orders.edit'), async (c) => {
  try {
    const poId = parseInt(c.req.param('id'))
    const itemId = parseInt(c.req.param('itemId'))

    if (isNaN(poId) || isNaN(itemId)) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const body = await c.req.json()
    const parseResult = UpdatePOItemSchema.safeParse(body)

    if (!parseResult.success) {
      return c.json<POItemApiResponse<null>>({
        data: null,
        error: parseResult.error.issues.map(i => i.message).join(', ')
      }, 400)
    }

    const { quantity, finished_product_code, notes } = parseResult.data
    const auth = c.get('auth') as AuthContext & { permissions: string[] }

    const { data: item, error: itemError } = await supabase
      .from('po_items')
      .select('id, po_id, style_id, quantity, finished_product_code')
      .eq('id', itemId)
      .eq('po_id', poId)
      .is('deleted_at', null)
      .single()

    if (itemError) {
      if (itemError.code === 'PGRST116') {
        return c.json<POItemApiResponse<null>>({ data: null, error: 'Không tìm thấy mặt hàng' }, 404)
      }
      throw itemError
    }

    const { data: orderedItems } = await supabase
      .from('thread_order_items')
      .select('quantity')
      .eq('po_id', poId)
      .eq('style_id', item.style_id)

    const totalOrdered = orderedItems?.reduce((sum, row) => sum + (row.quantity || 0), 0) || 0

    if (quantity < totalOrdered) {
      return c.json<POItemApiResponse<null>>({
        data: null,
        error: `Số lượng không được nhỏ hơn số đã đặt (${totalOrdered})`
      }, 400)
    }

    const previousQuantity = item.quantity

    const { data: updatedItem, error: updateError } = await supabase
      .from('po_items')
      .update({
        quantity,
        finished_product_code:
          finished_product_code !== undefined ? (finished_product_code || null) : undefined,
        notes: notes !== undefined ? notes : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select('*, style:styles(id, style_code, style_name, description)')
      .single()

    if (updateError) throw updateError

    if (previousQuantity !== quantity || finished_product_code !== undefined) {
      await supabase.from('po_item_history').insert({
        po_item_id: itemId,
        change_type: 'UPDATE',
        previous_quantity: previousQuantity,
        new_quantity: quantity,
        changed_by: auth.employeeId,
        notes: notes || (finished_product_code !== undefined ? 'Cập nhật mã TP KT' : null)
      })
    }

    return c.json<POItemApiResponse<POItem>>({
      data: updatedItem,
      error: null,
      message: 'Cập nhật mặt hàng thành công'
    })
  } catch (err) {
    console.error('Error updating PO item:', err)
    return c.json<POItemApiResponse<null>>({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * DELETE /api/purchase-orders/:id - Delete a purchase order
 */
purchaseOrders.delete('/:id', requirePermission('thread.purchase-orders.delete'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy đơn hàng' }, 404)
      }
      throw error
    }

    return c.json({ data, error: null, message: 'Xóa đơn hàng thành công' })
  } catch (err) {
    console.error('Error deleting purchase order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * DELETE /api/purchase-orders/:id/items/:itemId - Soft delete item
 */
purchaseOrders.delete('/:id/items/:itemId', requirePermission('thread.purchase-orders.delete'), async (c) => {
  try {
    const poId = parseInt(c.req.param('id'))
    const itemId = parseInt(c.req.param('itemId'))

    if (isNaN(poId) || isNaN(itemId)) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'ID không hợp lệ' }, 400)
    }

    const auth = c.get('auth') as AuthContext & { permissions: string[] }

    const { data: item, error: itemError } = await supabase
      .from('po_items')
      .select('id, po_id, style_id, quantity')
      .eq('id', itemId)
      .eq('po_id', poId)
      .is('deleted_at', null)
      .single()

    if (itemError) {
      if (itemError.code === 'PGRST116') {
        return c.json<POItemApiResponse<null>>({ data: null, error: 'Không tìm thấy mặt hàng' }, 404)
      }
      throw itemError
    }

    const { data: orderedItems } = await supabase
      .from('thread_order_items')
      .select('id')
      .eq('po_id', poId)
      .eq('style_id', item.style_id)
      .limit(1)

    if (orderedItems && orderedItems.length > 0) {
      return c.json<POItemApiResponse<null>>({
        data: null,
        error: 'Không thể xóa mặt hàng đã có đơn đặt hàng tuần'
      }, 400)
    }

    const { error: deleteError } = await supabase
      .from('po_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', itemId)

    if (deleteError) throw deleteError

    await supabase.from('po_item_history').insert({
      po_item_id: itemId,
      change_type: 'DELETE',
      previous_quantity: item.quantity,
      new_quantity: null,
      changed_by: auth.employeeId,
      notes: 'Xóa mặt hàng'
    })

    return c.json<POItemApiResponse<{ id: number }>>({
      data: { id: itemId },
      error: null,
      message: 'Xóa mặt hàng thành công'
    })
  } catch (err) {
    console.error('Error deleting PO item:', err)
    return c.json<POItemApiResponse<null>>({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default purchaseOrders
