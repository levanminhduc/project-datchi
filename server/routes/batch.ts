import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { sanitizeFilterValue } from '../utils/sanitize'
import type {
  BatchReceiveRequest,
  BatchTransferRequest,
  BatchIssueRequest,
  BatchReturnRequest,
  BatchApiResponse,
  BatchOperationResult,
  BatchTransactionRow,
  LotRow,
} from '../types/batch'

const batch = new Hono()

const BATCH_LIMIT = 500

/**
 * POST /api/batch/receive - Batch receive cones into inventory
 */
batch.post('/receive', requirePermission('thread.batch.receive'), async (c) => {
  try {
    const body = await c.req.json<BatchReceiveRequest>()

    // Validate required fields
    if (!body.cone_ids || body.cone_ids.length === 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Danh sách cone_ids không được rỗng'
      }, 400)
    }

    if (body.cone_ids.length > BATCH_LIMIT) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `Vượt quá giới hạn ${BATCH_LIMIT} cuộn mỗi lần nhập`
      }, 400)
    }

    if (!body.thread_type_id || !body.warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: thread_type_id, warehouse_id'
      }, 400)
    }

    // Check for duplicate cone_ids in system
    const { data: existingCones } = await supabase
      .from('thread_inventory')
      .select('cone_id')
      .in('cone_id', body.cone_ids)

    if (existingCones && existingCones.length > 0) {
      const duplicates = existingCones.map(c => c.cone_id).join(', ')
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `Các mã cuộn đã tồn tại: ${duplicates}`
      }, 400)
    }

    let lotId = body.lot_id
    let lotNumber = body.lot_number

    // Create new lot if lot_id not provided
    if (!lotId && lotNumber) {
      // Check for duplicate lot_number
      const { data: existingLot } = await supabase
        .from('lots')
        .select('id')
        .eq('lot_number', lotNumber)
        .single()

      if (existingLot) {
        return c.json<BatchApiResponse<null>>({
          data: null,
          error: 'Mã lô đã tồn tại'
        }, 409)
      }

      // Create new lot
      const { data: newLot, error: lotError } = await supabase
        .from('lots')
        .insert({
          lot_number: lotNumber,
          thread_type_id: body.thread_type_id,
          warehouse_id: body.warehouse_id,
          production_date: body.production_date || null,
          expiry_date: body.expiry_date || null,
          notes: body.notes || null,
          status: 'ACTIVE',
          total_cones: 0,
          available_cones: 0
        })
        .select()
        .single()

      if (lotError) {
        console.error('Lot creation error:', lotError)
        return c.json<BatchApiResponse<null>>({
          data: null,
          error: 'Lỗi khi tạo lô mới'
        }, 500)
      }

      lotId = (newLot as LotRow).id
    } else if (lotId) {
      // Get lot_number from existing lot
      const { data: existingLot } = await supabase
        .from('lots')
        .select('lot_number')
        .eq('id', lotId)
        .single()

      if (existingLot) {
        lotNumber = existingLot.lot_number
      }
    }

    // Get thread type for meters calculation
    const { data: threadType } = await supabase
      .from('thread_types')
      .select('meters_per_cone, density_grams_per_meter')
      .eq('id', body.thread_type_id)
      .single()

    const metersPerCone = body.quantity_meters_per_cone || threadType?.meters_per_cone || 5000
    const weightPerCone = body.weight_per_cone_grams || null

    // Create cone records
    const cones = body.cone_ids.map(coneId => ({
      cone_id: coneId,
      thread_type_id: body.thread_type_id,
      warehouse_id: body.warehouse_id,
      quantity_cones: 1,
      quantity_meters: metersPerCone,
      weight_grams: weightPerCone,
      is_partial: false,
      status: 'RECEIVED' as const,
      lot_number: lotNumber || null,
      lot_id: lotId || null,
      expiry_date: body.expiry_date || null,
      received_date: new Date().toISOString().split('T')[0]
    }))

    const { data: insertedCones, error: insertError } = await supabase
      .from('thread_inventory')
      .insert(cones)
      .select('id')

    if (insertError) {
      console.error('Cone insertion error:', insertError)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi nhập cuộn: ' + insertError.message
      }, 500)
    }

    const coneDbIds = insertedCones?.map(c => c.id) || []

    // Update lot counts if lot was used
    if (lotId) {
      // Get current cone count for the lot
      const { count } = await supabase
        .from('thread_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('lot_id', lotId)

      const { count: availableCount } = await supabase
        .from('thread_inventory')
        .select('*', { count: 'exact', head: true })
        .eq('lot_id', lotId)
        .eq('status', 'AVAILABLE')

      await supabase
        .from('lots')
        .update({
          total_cones: count || cones.length,
          available_cones: availableCount || cones.length
        })
        .eq('id', lotId)
    }

    // Log transaction
    const { data: transaction, error: txError } = await supabase
      .from('batch_transactions')
      .insert({
        operation_type: 'RECEIVE',
        lot_id: lotId || null,
        to_warehouse_id: body.warehouse_id,
        cone_ids: coneDbIds,
        cone_count: cones.length,
        notes: body.notes || null,
        performed_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (txError) {
      console.error('Transaction log error:', txError)
    }

    return c.json<BatchApiResponse<BatchOperationResult>>({
      data: {
        transaction_id: transaction?.id || 0,
        operation_type: 'RECEIVE',
        cone_count: cones.length,
        lot_id: lotId || undefined
      },
      error: null,
      message: `Đã nhập ${cones.length} cuộn vào kho`
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
 * POST /api/batch/transfer - Batch transfer cones between warehouses
 */
batch.post('/transfer', requirePermission('thread.batch.transfer'), async (c) => {
  try {
    const body = await c.req.json<BatchTransferRequest>()

    // Validate warehouses
    if (!body.from_warehouse_id || !body.to_warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin kho nguồn hoặc kho đích'
      }, 400)
    }

    if (body.from_warehouse_id === body.to_warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Kho nguồn và kho đích không được trùng nhau'
      }, 400)
    }

    let coneIds: number[] = []

    // Get cones by lot or by explicit IDs
    if (body.lot_id) {
      const { data: lotCones } = await supabase
        .from('thread_inventory')
        .select('id, warehouse_id, status')
        .eq('lot_id', body.lot_id)
        .eq('warehouse_id', body.from_warehouse_id)
        .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED'])

      coneIds = lotCones?.map(c => c.id) || []
    } else if (body.cone_ids && body.cone_ids.length > 0) {
      coneIds = body.cone_ids
    }

    if (coneIds.length === 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Không có cuộn nào để chuyển'
      }, 400)
    }

    if (coneIds.length > BATCH_LIMIT) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `Vượt quá giới hạn ${BATCH_LIMIT} cuộn mỗi lần chuyển`
      }, 400)
    }

    // Validate all cones are in source warehouse with valid status
    const { data: validCones } = await supabase
      .from('thread_inventory')
      .select('id, warehouse_id, status')
      .in('id', coneIds)

    const invalidCones = validCones?.filter(
      c => c.warehouse_id !== body.from_warehouse_id ||
           !['AVAILABLE', 'RECEIVED', 'INSPECTED'].includes(c.status)
    ) || []

    if (invalidCones.length > 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `${invalidCones.length} cuộn không hợp lệ để chuyển (sai kho hoặc trạng thái)`
      }, 400)
    }

    // Update warehouse_id for all cones
    const { error: updateError } = await supabase
      .from('thread_inventory')
      .update({ warehouse_id: body.to_warehouse_id })
      .in('id', coneIds)

    if (updateError) {
      console.error('Transfer error:', updateError)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi chuyển cuộn'
      }, 500)
    }

    // Update lot warehouse if entire lot was transferred
    if (body.lot_id) {
      // Check if this is a full lot transfer (all cones from lot in source warehouse)
      const { count: remainingCount } = await supabase
        .from('thread_inventory')
        .select('id', { count: 'exact', head: true })
        .eq('lot_id', body.lot_id)
        .eq('warehouse_id', body.from_warehouse_id)
        .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED'])
      
      const isFullLotTransfer = remainingCount === 0
      
      if (isFullLotTransfer) {
        await supabase
          .from('lots')
          .update({ warehouse_id: body.to_warehouse_id })
          .eq('id', body.lot_id)
      }
    }

    // Log transaction
    const { data: transaction } = await supabase
      .from('batch_transactions')
      .insert({
        operation_type: 'TRANSFER',
        lot_id: body.lot_id || null,
        from_warehouse_id: body.from_warehouse_id,
        to_warehouse_id: body.to_warehouse_id,
        cone_ids: coneIds,
        cone_count: coneIds.length,
        notes: body.notes || null,
        performed_at: new Date().toISOString()
      })
      .select('id')
      .single()

    return c.json<BatchApiResponse<BatchOperationResult>>({
      data: {
        transaction_id: transaction?.id || 0,
        operation_type: 'TRANSFER',
        cone_count: coneIds.length,
        lot_id: body.lot_id || undefined
      },
      error: null,
      message: `Đã chuyển ${coneIds.length} cuộn`
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
 * POST /api/batch/issue - Batch issue cones from inventory
 */
batch.post('/issue', requirePermission('thread.batch.issue'), async (c) => {
  try {
    const body = await c.req.json<BatchIssueRequest>()

    // Validate required fields
    if (!body.warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin kho xuất'
      }, 400)
    }

    if (!body.recipient) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin người nhận'
      }, 400)
    }

    let coneIds: number[] = []

    // Get cones by lot or by explicit IDs
    if (body.lot_id) {
      const { data: lotCones } = await supabase
        .from('thread_inventory')
        .select('id')
        .eq('lot_id', body.lot_id)
        .eq('warehouse_id', body.warehouse_id)
        .eq('status', 'AVAILABLE')

      coneIds = lotCones?.map(c => c.id) || []
    } else if (body.cone_ids && body.cone_ids.length > 0) {
      coneIds = body.cone_ids
    }

    if (coneIds.length === 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Không có cuộn nào để xuất'
      }, 400)
    }

    if (coneIds.length > BATCH_LIMIT) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `Vượt quá giới hạn ${BATCH_LIMIT} cuộn mỗi lần xuất`
      }, 400)
    }

    // Validate all cones are available
    const { data: validCones } = await supabase
      .from('thread_inventory')
      .select('id, warehouse_id, status')
      .in('id', coneIds)

    const invalidCones = validCones?.filter(
      c => c.warehouse_id !== body.warehouse_id || c.status !== 'AVAILABLE'
    ) || []

    if (invalidCones.length > 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `${invalidCones.length} cuộn không hợp lệ để xuất`
      }, 400)
    }

    // Update status for all cones
    const { error: updateError } = await supabase
      .from('thread_inventory')
      .update({ status: 'HARD_ALLOCATED' })
      .in('id', coneIds)

    if (updateError) {
      console.error('Issue error:', updateError)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi xuất cuộn'
      }, 500)
    }

    // Update lot available_cones count
    if (body.lot_id) {
      const { data: remainingCount } = await supabase
        .from('thread_inventory')
        .select('id', { count: 'exact' })
        .eq('lot_id', body.lot_id)
        .eq('status', 'AVAILABLE')

      const remaining = remainingCount?.length || 0

      await supabase
        .from('lots')
        .update({
          available_cones: remaining,
          status: remaining === 0 ? 'DEPLETED' : 'ACTIVE'
        })
        .eq('id', body.lot_id)
    }

    // Log transaction
    const { data: transaction } = await supabase
      .from('batch_transactions')
      .insert({
        operation_type: 'ISSUE',
        lot_id: body.lot_id || null,
        from_warehouse_id: body.warehouse_id,
        cone_ids: coneIds,
        cone_count: coneIds.length,
        recipient: body.recipient,
        reference_number: body.reference_number || null,
        notes: body.notes || null,
        performed_at: new Date().toISOString()
      })
      .select('id')
      .single()

    return c.json<BatchApiResponse<BatchOperationResult>>({
      data: {
        transaction_id: transaction?.id || 0,
        operation_type: 'ISSUE',
        cone_count: coneIds.length,
        lot_id: body.lot_id || undefined
      },
      error: null,
      message: `Đã xuất ${coneIds.length} cuộn cho ${body.recipient}`
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
 * POST /api/batch/return - Return issued cones back to inventory
 */
batch.post('/return', requirePermission('thread.batch.issue'), async (c) => {
  try {
    const body = await c.req.json<BatchReturnRequest>()

    if (!body.cone_ids || body.cone_ids.length === 0) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Danh sách cuộn không được rỗng'
      }, 400)
    }

    if (!body.warehouse_id) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin kho nhận'
      }, 400)
    }

    if (body.cone_ids.length > BATCH_LIMIT) {
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: `Vượt quá giới hạn ${BATCH_LIMIT} cuộn mỗi lần trả`
      }, 400)
    }

    // Update status and warehouse for returned cones
    const { error: updateError } = await supabase
      .from('thread_inventory')
      .update({
        status: 'AVAILABLE',
        warehouse_id: body.warehouse_id
      })
      .in('id', body.cone_ids)

    if (updateError) {
      console.error('Return error:', updateError)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi trả cuộn'
      }, 500)
    }

    // Log transaction
    const { data: transaction } = await supabase
      .from('batch_transactions')
      .insert({
        operation_type: 'RETURN',
        to_warehouse_id: body.warehouse_id,
        cone_ids: body.cone_ids,
        cone_count: body.cone_ids.length,
        notes: body.notes || null,
        performed_at: new Date().toISOString()
      })
      .select('id')
      .single()

    return c.json<BatchApiResponse<BatchOperationResult>>({
      data: {
        transaction_id: transaction?.id || 0,
        operation_type: 'RETURN',
        cone_count: body.cone_ids.length
      },
      error: null,
      message: `Đã trả ${body.cone_ids.length} cuộn`
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
 * GET /api/batch/transactions - List all batch transactions
 */
batch.get('/transactions', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const operationType = c.req.query('operation_type')
    const lotId = c.req.query('lot_id')
    const warehouseId = c.req.query('warehouse_id')
    const fromDate = c.req.query('from_date')
    const toDate = c.req.query('to_date')

    let query = supabase
      .from('batch_transactions')
      .select(`
        *,
        lot:lots(id, lot_number),
        from_warehouse:warehouses!batch_transactions_from_warehouse_id_fkey(id, code, name),
        to_warehouse:warehouses!batch_transactions_to_warehouse_id_fkey(id, code, name)
      `)

    if (operationType) {
      query = query.eq('operation_type', operationType)
    }
    if (lotId) {
      query = query.eq('lot_id', parseInt(lotId))
    }
    if (warehouseId) {
      const whId = parseInt(warehouseId)
      query = query.or(`from_warehouse_id.eq.${sanitizeFilterValue(String(whId))},to_warehouse_id.eq.${sanitizeFilterValue(String(whId))}`)
    }
    if (fromDate) {
      query = query.gte('performed_at', fromDate)
    }
    if (toDate) {
      query = query.lte('performed_at', toDate + 'T23:59:59')
    }

    const { data, error } = await query.order('performed_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải lịch sử thao tác'
      }, 500)
    }

    return c.json<BatchApiResponse<BatchTransactionRow[]>>({
      data: data as BatchTransactionRow[],
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

/**
 * GET /api/batch/transactions/:id - Get transaction details
 */
batch.get('/transactions/:id', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    const { data, error } = await supabase
      .from('batch_transactions')
      .select(`
        *,
        lot:lots(id, lot_number, thread_type_id, warehouse_id),
        from_warehouse:warehouses!batch_transactions_from_warehouse_id_fkey(id, code, name),
        to_warehouse:warehouses!batch_transactions_to_warehouse_id_fkey(id, code, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<BatchApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy thao tác'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<BatchApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin thao tác'
      }, 500)
    }

    return c.json<BatchApiResponse<BatchTransactionRow>>({
      data: data as BatchTransactionRow,
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

export default batch
