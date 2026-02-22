import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { sanitizeFilterValue } from '../utils/sanitize'
import type {
  LotRow,
  LotStatus,
  CreateLotRequest,
  UpdateLotRequest,
  BatchApiResponse
} from '../types/batch'

const lots = new Hono()

/**
 * POST /api/lots - Create new lot
 */
lots.post('/', requirePermission('thread.lots.manage'), async (c) => {
  try {
    const body = await c.req.json<CreateLotRequest>()

    // Validate required fields
    if (!body.lot_number || !body.thread_type_id || !body.warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: lot_number, thread_type_id, warehouse_id'
      }, 400)
    }

    // Check for duplicate lot_number
    const { data: existing } = await supabase
      .from('lots')
      .select('id')
      .eq('lot_number', body.lot_number)
      .single()

    if (existing) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Mã lô đã tồn tại'
      }, 409)
    }

    const { data, error } = await supabase
      .from('lots')
      .insert({
        lot_number: body.lot_number,
        thread_type_id: body.thread_type_id,
        warehouse_id: body.warehouse_id,
        production_date: body.production_date || null,
        expiry_date: body.expiry_date || null,
        supplier_id: body.supplier_id || null,
        notes: body.notes || null,
        status: 'ACTIVE',
        total_cones: 0,
        available_cones: 0
      })
      .select(`
        *,
        thread_type:thread_types(id, code, name, color_data:colors!color_id(name, hex_code)),
        warehouse:warehouses(id, code, name),
        supplier_data:suppliers(id, code, name)
      `)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tạo lô: ' + error.message
      }, 500)
    }

    return c.json<BatchApiResponse<LotRow>>({
      data: data as LotRow,
      error: null,
      message: 'Đã tạo lô mới'
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/lots - List lots with filters
 * Query params: status, warehouse_id, thread_type_id, search, supplier_id
 * Returns joined supplier_data from FK relationship
 */
lots.get('/', requirePermission('thread.lots.view'), async (c) => {
  try {
    const status = c.req.query('status') as LotStatus | undefined
    const warehouseId = c.req.query('warehouse_id')
    const threadTypeId = c.req.query('thread_type_id')
    const supplierId = c.req.query('supplier_id')
    const search = c.req.query('search')

    // LEFT JOIN suppliers table for related data
    let query = supabase
      .from('lots')
      .select(`
        *,
        thread_type:thread_types(id, code, name, color_data:colors!color_id(name, hex_code)),
        warehouse:warehouses(id, code, name),
        supplier_data:suppliers(id, code, name)
      `)

    if (status) {
      query = query.eq('status', status)
    }
    if (warehouseId) {
      const { data: conesInWarehouse } = await supabase
        .from('thread_inventory')
        .select('lot_id, lot_number')
        .eq('warehouse_id', parseInt(warehouseId))
        .in('status', ['AVAILABLE', 'RECEIVED'])

      const lotIds: number[] = []
      const lotNumbers: string[] = []

      for (const cone of conesInWarehouse || []) {
        if (cone.lot_id !== null) {
          lotIds.push(cone.lot_id)
        } else if (cone.lot_number) {
          lotNumbers.push(cone.lot_number)
        }
      }

      const uniqueLotIds = [...new Set(lotIds)]
      const uniqueLotNumbers = [...new Set(lotNumbers)]

      if (uniqueLotIds.length === 0 && uniqueLotNumbers.length === 0) {
        return c.json<BatchApiResponse<LotRow[]>>({
          data: [],
          error: null,
          message: 'Không có lô nào có chỉ trong kho này'
        })
      }

      if (uniqueLotIds.length > 0 && uniqueLotNumbers.length > 0) {
        query = query.or(`id.in.(${uniqueLotIds.join(',')}),lot_number.in.(${uniqueLotNumbers.join(',')})`)
      } else if (uniqueLotIds.length > 0) {
        query = query.in('id', uniqueLotIds)
      } else {
        query = query.in('lot_number', uniqueLotNumbers)
      }
    }
    if (threadTypeId) {
      query = query.eq('thread_type_id', parseInt(threadTypeId))
    }
    if (supplierId) {
      query = query.eq('supplier_id', parseInt(supplierId))
    }
    if (search) {
      query = query.ilike('lot_number', `%${sanitizeFilterValue(search)}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách lô'
      }, 500)
    }

    return c.json<BatchApiResponse<LotRow[]>>({
      data: data as LotRow[],
      error: null,
      message: `Đã tải ${data.length} lô`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/lots/:id - Get lot details with cone count
 */
lots.get('/:id', requirePermission('thread.lots.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    const { data, error } = await supabase
      .from('lots')
      .select(`
        *,
        thread_type:thread_types(id, code, name, color_data:colors!color_id(name, hex_code)),
        warehouse:warehouses(id, code, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<BatchApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy lô'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin lô'
      }, 500)
    }

    return c.json<BatchApiResponse<LotRow>>({
      data: data as LotRow,
      error: null
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * PATCH /api/lots/:id - Update lot metadata and status
 */
lots.patch('/:id', requirePermission('thread.lots.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<UpdateLotRequest>()

    // Build update object with only provided fields
    const updateData: Partial<LotRow> = {}
    if (body.production_date !== undefined) updateData.production_date = body.production_date
    if (body.expiry_date !== undefined) updateData.expiry_date = body.expiry_date
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes

    if (body.supplier_id !== undefined) updateData.supplier_id = body.supplier_id

    if (Object.keys(updateData).length === 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Không có thông tin cần cập nhật'
      }, 400)
    }

    const { data, error } = await supabase
      .from('lots')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        thread_type:thread_types(id, code, name, color_data:colors!color_id(name, hex_code)),
        warehouse:warehouses(id, code, name),
        supplier_data:suppliers(id, code, name)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<BatchApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy lô'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật lô'
      }, 500)
    }

    return c.json<BatchApiResponse<LotRow>>({
      data: data as LotRow,
      error: null,
      message: 'Đã cập nhật thông tin lô'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/lots/:id/cones - Get cones belonging to lot
 */
lots.get('/:id/cones', requirePermission('thread.lots.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    const { data, error } = await supabase
      .from('thread_inventory')
      .select(`
        *,
        thread_type:thread_types(id, code, name, color_data:colors!color_id(name, hex_code)),
        warehouse:warehouses(id, code, name)
      `)
      .eq('lot_id', id)
      .order('cone_id', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách cuộn'
      }, 500)
    }

    return c.json<BatchApiResponse<unknown[]>>({
      data: data,
      error: null,
      message: `Đã tải ${data.length} cuộn`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/lots/:id/transactions - Get transaction history for lot
 */
lots.get('/:id/transactions', requirePermission('thread.lots.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    const { data, error } = await supabase
      .from('batch_transactions')
      .select(`
        *,
        lot:lots(id, lot_number),
        from_warehouse:warehouses!batch_transactions_from_warehouse_id_fkey(id, code, name),
        to_warehouse:warehouses!batch_transactions_to_warehouse_id_fkey(id, code, name)
      `)
      .eq('lot_id', id)
      .order('performed_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải lịch sử thao tác'
      }, 500)
    }

    return c.json<BatchApiResponse<unknown[]>>({
      data: data,
      error: null,
      message: `Đã tải ${data.length} thao tác`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<BatchApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

export default lots
