import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import { from } from '../db/sql-builder'
import { requirePermission } from '../middleware/auth'
import { getErrorMessage } from '../utils/errorHelper'
import { sanitizeFilterValue } from '../utils/sanitize'
import { CreatePOItemSchema, UpdatePOItemSchema } from '../validation/purchaseOrder'
import type { POItemApiResponse, POItem, POItemHistory } from '../types/purchaseOrder'
import type { AppEnv } from '../types/hono-env'

const purchaseOrders = new Hono<AppEnv>()

const ALLOWED_SORT_COLUMNS = ['po_number', 'customer_name', 'status', 'priority', 'order_date', 'delivery_date', 'created_at', 'week']

purchaseOrders.get('/', requirePermission('thread.purchase-orders.view'), async (c) => {
  try {
    const reqQuery = c.req.query()
    const includeItems = reqQuery.include === 'items'

    const page = Math.max(1, parseInt(reqQuery.page || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(reqQuery.pageSize || '25')))
    const sortBy = ALLOWED_SORT_COLUMNS.includes(reqQuery.sortBy || '') ? reqQuery.sortBy : 'created_at'
    const descending = reqQuery.descending !== 'false'

    const offset = (page - 1) * pageSize

    const conditions: string[] = ['po.deleted_at IS NULL']
    const params: unknown[] = []

    if (includeItems) {
      conditions.push('EXISTS (SELECT 1 FROM po_items pi2 WHERE pi2.po_id = po.id AND pi2.deleted_at IS NULL)')
    }

    if (reqQuery.status) {
      params.push(reqQuery.status)
      conditions.push(`po.status = $${params.length}`)
    }
    if (reqQuery.priority) {
      params.push(reqQuery.priority)
      conditions.push(`po.priority = $${params.length}`)
    }
    if (reqQuery.customer_name) {
      params.push(reqQuery.customer_name)
      conditions.push(`po.customer_name = $${params.length}`)
    }
    if (reqQuery.po_number) {
      const s = sanitizeFilterValue(reqQuery.po_number)
      params.push(`%${s}%`)
      conditions.push(`po.po_number ILIKE $${params.length}`)
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    const countRow = await queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM purchase_orders po ${whereClause}`,
      params
    )
    const count = countRow?.count ?? 0

    const itemsSelect = includeItems
      ? `,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', pi.id, 'po_id', pi.po_id, 'style_id', pi.style_id,
             'quantity', pi.quantity, 'finished_product_code', pi.finished_product_code,
             'style', CASE WHEN st.id IS NULL THEN NULL
                           ELSE json_build_object('id', st.id, 'style_code', st.style_code, 'style_name', st.style_name, 'description', st.description) END
           ))
           FROM po_items pi
           LEFT JOIN styles st ON st.id = pi.style_id
           WHERE pi.po_id = po.id AND pi.deleted_at IS NULL
         ), '[]'::json) AS items`
      : ''

    const dataParams = [...params, pageSize, offset]
    const data = await query<Record<string, unknown>>(
      `SELECT po.*${itemsSelect}
       FROM purchase_orders po
       ${whereClause}
       ORDER BY po.${sortBy} ${descending ? 'DESC' : 'ASC'}
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    )

    return c.json({ data, count, page, pageSize, error: null })
  } catch (err) {
    console.error('Error fetching purchase orders:', err)
    return c.json({ data: null, error: getErrorMessage(err) }, 500)
  }
})

purchaseOrders.get('/customers', requirePermission('thread.purchase-orders.view'), async (c) => {
  try {
    const data = await from('purchase_orders')
      .select('customer_name')
      .is('deleted_at', null)
      .isNotNull('customer_name')
      .order({ column: 'customer_name', ascending: true })
      .list<{ customer_name: string }>()

    const uniqueNames = [...new Set((data || []).map(r => r.customer_name as string))]

    return c.json({ data: uniqueNames, error: null })
  } catch (err) {
    console.error('Error fetching customer names:', err)
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

    const item = await queryOne<{ id: number; po_id: number }>(
      'SELECT id, po_id FROM po_items WHERE id = $1 AND po_id = $2',
      [itemId, poId]
    )

    if (!item) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'Không tìm thấy mặt hàng' }, 404)
    }

    const history = await query<Record<string, unknown>>(
      `SELECT
         h.id,
         h.po_item_id,
         h.change_type,
         h.previous_quantity,
         h.new_quantity,
         h.changed_by,
         h.notes,
         h.created_at,
         CASE WHEN e.id IS NULL THEN NULL
              ELSE json_build_object('id', e.id, 'full_name', e.full_name) END AS employee
       FROM po_item_history h
       LEFT JOIN employees e ON e.id = h.changed_by
       WHERE h.po_item_id = $1
       ORDER BY h.created_at DESC`,
      [itemId]
    )

    return c.json<POItemApiResponse<POItemHistory[]>>({
      data: history as unknown as POItemHistory[],
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

    const itemsSelect = includeItems
      ? `,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', pi.id, 'po_id', pi.po_id, 'style_id', pi.style_id,
             'quantity', pi.quantity, 'finished_product_code', pi.finished_product_code,
             'notes', pi.notes, 'created_at', pi.created_at, 'updated_at', pi.updated_at,
             'deleted_at', pi.deleted_at,
             'style', CASE WHEN st.id IS NULL THEN NULL
                           ELSE json_build_object('id', st.id, 'style_code', st.style_code, 'style_name', st.style_name, 'description', st.description) END
           ))
           FROM po_items pi
           LEFT JOIN styles st ON st.id = pi.style_id
           WHERE pi.po_id = po.id
         ), '[]'::json) AS items`
      : ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await queryOne<any>(
      `SELECT po.*${itemsSelect}
       FROM purchase_orders po
       WHERE po.id = $1`,
      [id]
    )

    if (!data) {
      return c.json({ data: null, error: 'Không tìm thấy đơn hàng' }, 404)
    }

    if (includeItems && data?.items) {
      data.items = data.items.filter((item: { deleted_at: string | null }) => item.deleted_at === null)

      const styleIds = [...new Set(data.items.map((item: { style_id: number }) => item.style_id))] as number[]
      const subArtStyleIds = new Set<number>()
      const subArtCodesMap = new Map<number, Array<{ id: number; code: string }>>()
      if (styleIds.length > 0) {
        const subArtRows = await from('sub_arts')
          .select('id, style_id, sub_art_code')
          .in('style_id', styleIds)
          .list<{ id: number; style_id: number; sub_art_code: string }>()
        if (subArtRows) {
          for (const row of subArtRows) {
            subArtStyleIds.add(row.style_id)
            const entries = subArtCodesMap.get(row.style_id) || []
            entries.push({ id: row.id, code: row.sub_art_code })
            subArtCodesMap.set(row.style_id, entries)
          }
        }
      }
      data.items = data.items.map((item: { style_id: number }) => ({
        ...item,
        has_sub_arts: subArtStyleIds.has(item.style_id),
        sub_arts: subArtCodesMap.get(item.style_id) || undefined,
      }))
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

    let data: Record<string, unknown> | null
    try {
      data = await queryOne<Record<string, unknown>>(
        `INSERT INTO purchase_orders
           (po_number, customer_name, week, order_date, delivery_date, status, priority, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          body.po_number,
          body.customer_name,
          body.week,
          body.order_date,
          body.delivery_date,
          body.status || 'PENDING',
          body.priority || 'NORMAL',
          body.notes,
        ]
      )
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        return c.json({ data: null, error: 'Số hiệu đơn hàng đã tồn tại' }, 400)
      }
      throw err
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
    const auth = c.get('auth')

    const po = await queryOne<{ id: number }>(
      'SELECT id FROM purchase_orders WHERE id = $1 AND deleted_at IS NULL',
      [poId]
    )

    if (!po) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'Không tìm thấy đơn hàng' }, 404)
    }

    const style = await queryOne<{ id: number }>(
      'SELECT id FROM styles WHERE id = $1 AND deleted_at IS NULL',
      [style_id]
    )

    if (!style) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'Mã hàng không tồn tại' }, 400)
    }

    const existingItem = await queryOne<{ id: number }>(
      'SELECT id FROM po_items WHERE po_id = $1 AND style_id = $2 AND deleted_at IS NULL',
      [poId, style_id]
    )

    if (existingItem) {
      return c.json<POItemApiResponse<null>>({
        data: null,
        error: 'Mã hàng này đã có trong đơn hàng'
      }, 409)
    }

    let inserted: { id: number }
    try {
      const ins = await queryOne<{ id: number }>(
        `INSERT INTO po_items (po_id, style_id, quantity, finished_product_code, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [poId, style_id, quantity, finished_product_code || null, notes || null]
      )
      inserted = ins as { id: number }
    } catch (insertErr) {
      if ((insertErr as { code?: string }).code === '23505') {
        return c.json<POItemApiResponse<null>>({
          data: null,
          error: 'Mã hàng này đã có trong đơn hàng'
        }, 409)
      }
      throw insertErr
    }

    const newItem = await queryOne<POItem>(
      `SELECT pi.*,
         CASE WHEN st.id IS NULL THEN NULL
              ELSE json_build_object('id', st.id, 'style_code', st.style_code, 'style_name', st.style_name, 'description', st.description) END AS style
       FROM po_items pi
       LEFT JOIN styles st ON st.id = pi.style_id
       WHERE pi.id = $1`,
      [inserted.id]
    ) as POItem

    await query(
      `INSERT INTO po_item_history (po_item_id, change_type, previous_quantity, new_quantity, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [inserted.id, 'CREATE', null, quantity, auth.employeeId, 'Thêm mặt hàng mới']
    )

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

    let data: Record<string, unknown> | null
    try {
      data = await queryOne<Record<string, unknown>>(
        `UPDATE purchase_orders SET
           po_number = $1, customer_name = $2, week = $3, order_date = $4,
           delivery_date = $5, status = $6, priority = $7, notes = $8, updated_at = $9
         WHERE id = $10
         RETURNING *`,
        [
          body.po_number,
          body.customer_name,
          body.week,
          body.order_date,
          body.delivery_date,
          body.status,
          body.priority,
          body.notes,
          new Date().toISOString(),
          id,
        ]
      )
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        return c.json({ data: null, error: 'Số hiệu đơn hàng đã tồn tại' }, 400)
      }
      throw err
    }

    if (!data) {
      return c.json({ data: null, error: 'Không tìm thấy đơn hàng' }, 404)
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
    const auth = c.get('auth')

    const item = await queryOne<{ id: number; po_id: number; style_id: number; quantity: number; finished_product_code: string | null }>(
      'SELECT id, po_id, style_id, quantity, finished_product_code FROM po_items WHERE id = $1 AND po_id = $2 AND deleted_at IS NULL',
      [itemId, poId]
    )

    if (!item) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'Không tìm thấy mặt hàng' }, 404)
    }

    const orderedItems = await from('thread_order_items')
      .select('quantity')
      .eq('po_id', poId)
      .eq('style_id', item.style_id)
      .list<{ quantity: number | null }>()

    const totalOrdered = orderedItems?.reduce((sum, row) => sum + (row.quantity || 0), 0) || 0

    if (quantity < totalOrdered) {
      return c.json<POItemApiResponse<null>>({
        data: null,
        error: `Số lượng không được nhỏ hơn số đã đặt (${totalOrdered})`
      }, 400)
    }

    const previousQuantity = item.quantity

    const setClauses: string[] = []
    const updateParams: unknown[] = []
    updateParams.push(quantity)
    setClauses.push(`quantity = $${updateParams.length}`)
    if (finished_product_code !== undefined) {
      updateParams.push(finished_product_code || null)
      setClauses.push(`finished_product_code = $${updateParams.length}`)
    }
    if (notes !== undefined) {
      updateParams.push(notes)
      setClauses.push(`notes = $${updateParams.length}`)
    }
    updateParams.push(new Date().toISOString())
    setClauses.push(`updated_at = $${updateParams.length}`)
    updateParams.push(itemId)

    await query(
      `UPDATE po_items SET ${setClauses.join(', ')} WHERE id = $${updateParams.length}`,
      updateParams
    )

    const updatedItem = await queryOne<POItem>(
      `SELECT pi.*,
         CASE WHEN st.id IS NULL THEN NULL
              ELSE json_build_object('id', st.id, 'style_code', st.style_code, 'style_name', st.style_name, 'description', st.description) END AS style
       FROM po_items pi
       LEFT JOIN styles st ON st.id = pi.style_id
       WHERE pi.id = $1`,
      [itemId]
    ) as POItem

    if (previousQuantity !== quantity || finished_product_code !== undefined) {
      await query(
        `INSERT INTO po_item_history (po_item_id, change_type, previous_quantity, new_quantity, changed_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          itemId,
          'UPDATE',
          previousQuantity,
          quantity,
          auth.employeeId,
          notes || (finished_product_code !== undefined ? 'Cập nhật mã TP KT' : null),
        ]
      )
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

    const data = await queryOne<Record<string, unknown>>(
      `UPDATE purchase_orders SET deleted_at = $1 WHERE id = $2 RETURNING *`,
      [new Date().toISOString(), id]
    )

    if (!data) {
      return c.json({ data: null, error: 'Không tìm thấy đơn hàng' }, 404)
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

    const auth = c.get('auth')

    const item = await queryOne<{ id: number; po_id: number; style_id: number; quantity: number }>(
      'SELECT id, po_id, style_id, quantity FROM po_items WHERE id = $1 AND po_id = $2 AND deleted_at IS NULL',
      [itemId, poId]
    )

    if (!item) {
      return c.json<POItemApiResponse<null>>({ data: null, error: 'Không tìm thấy mặt hàng' }, 404)
    }

    const orderedItems = await from('thread_order_items')
      .select('id')
      .eq('po_id', poId)
      .eq('style_id', item.style_id)
      .limit(1)
      .list<{ id: number }>()

    if (orderedItems && orderedItems.length > 0) {
      return c.json<POItemApiResponse<null>>({
        data: null,
        error: 'Không thể xóa mặt hàng đã có đơn đặt hàng tuần'
      }, 400)
    }

    await query(
      `UPDATE po_items SET deleted_at = $1 WHERE id = $2`,
      [new Date().toISOString(), itemId]
    )

    await query(
      `INSERT INTO po_item_history (po_item_id, change_type, previous_quantity, new_quantity, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [itemId, 'DELETE', item.quantity, null, auth.employeeId, 'Xóa mặt hàng']
    )

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
