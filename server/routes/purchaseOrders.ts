import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'

const purchaseOrders = new Hono()

// Helper function to get error message
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

/**
 * GET /api/purchase-orders - List all purchase orders with optional filtering
 */
purchaseOrders.get('/', async (c) => {
  try {
    const query = c.req.query()
    
    let dbQuery = supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
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
 * GET /api/purchase-orders/:id - Get a single purchase order by ID
 */
purchaseOrders.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Khong tim thay don hang' }, 404)
      }
      throw error
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
purchaseOrders.post('/', async (c) => {
  try {
    const body = await c.req.json()
    
    // Validate required fields
    if (!body.po_number) {
      return c.json({ data: null, error: 'So hieu don hang (po_number) la bat buoc' }, 400)
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([{
        po_number: body.po_number,
        customer_name: body.customer_name,
        order_date: body.order_date,
        delivery_date: body.delivery_date,
        status: body.status || 'pending',
        priority: body.priority || 'normal',
        notes: body.notes,
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return c.json({ data: null, error: 'So hieu don hang da ton tai' }, 400)
      }
      throw error
    }

    return c.json({ data, error: null, message: 'Tao don hang thanh cong' })
  } catch (err) {
    console.error('Error creating purchase order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * PUT /api/purchase-orders/:id - Update a purchase order
 */
purchaseOrders.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const body = await c.req.json()

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        po_number: body.po_number,
        customer_name: body.customer_name,
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
        return c.json({ data: null, error: 'Khong tim thay don hang' }, 404)
      }
      if (error.code === '23505') {
        return c.json({ data: null, error: 'So hieu don hang da ton tai' }, 400)
      }
      throw error
    }

    return c.json({ data, error: null, message: 'Cap nhat don hang thanh cong' })
  } catch (err) {
    console.error('Error updating purchase order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

/**
 * DELETE /api/purchase-orders/:id - Delete a purchase order
 */
purchaseOrders.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (isNaN(id)) {
      return c.json({ data: null, error: 'ID khong hop le' }, 400)
    }

    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Khong tim thay don hang' }, 404)
      }
      throw error
    }

    return c.json({ data: null, error: null, message: 'Xoa don hang thanh cong' })
  } catch (err) {
    console.error('Error deleting purchase order:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

export default purchaseOrders
