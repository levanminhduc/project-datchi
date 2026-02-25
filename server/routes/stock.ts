import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import {
  StockFiltersSchema,
  StockSummaryFiltersSchema,
  AddStockSchema,
  DeductStockSchema,
  ReturnStockSchema,
} from '../validation/stock'

interface StockApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface StockRow {
  id: number
  thread_type_id: number
  warehouse_id: number
  lot_number: string | null
  qty_full_cones: number
  qty_partial_cones: number
  received_date: string
  expiry_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface DeductionResult {
  lot_number: string | null
  qty_full: number
  qty_partial: number
}

const stock = new Hono()

// ============================================================================
// GET /api/stock - List stock records with optional filters
// ============================================================================
stock.get('/', requirePermission('thread.inventory.view'), async (c) => {
  try {
    // Parse and validate query parameters
    const rawParams = {
      thread_type_id: c.req.query('thread_type_id'),
      warehouse_id: c.req.query('warehouse_id'),
      lot_number: c.req.query('lot_number'),
    }

    const parseResult = StockFiltersSchema.safeParse(rawParams)
    if (!parseResult.success) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: parseResult.error.errors[0]?.message || 'Tham so khong hop le',
      }, 400)
    }

    const filters = parseResult.data

    // Build query with joins
    let query = supabase
      .from('thread_stock')
      .select(`
        *,
        thread_type:thread_types(id, code, name),
        warehouse:warehouses(id, name, code)
      `)
      .order('received_date', { ascending: true })

    // Apply filters
    if (filters.thread_type_id) {
      query = query.eq('thread_type_id', filters.thread_type_id)
    }
    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id)
    }
    if (filters.lot_number) {
      query = query.ilike('lot_number', `%${filters.lot_number}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Loi khi tai danh sach ton kho',
      }, 500)
    }

    return c.json<StockApiResponse<typeof data>>({
      success: true,
      data: data || [],
      message: `Da tai ${data?.length || 0} ban ghi ton kho`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<StockApiResponse<null>>({
      success: false,
      error: 'Loi he thong',
    }, 500)
  }
})

// ============================================================================
// GET /api/stock/summary - Aggregate stock by thread type
// ============================================================================
stock.get('/summary', requirePermission('thread.inventory.view'), async (c) => {
  try {
    // Parse and validate query parameters
    const rawParams = {
      warehouse_id: c.req.query('warehouse_id'),
    }

    const parseResult = StockSummaryFiltersSchema.safeParse(rawParams)
    if (!parseResult.success) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: parseResult.error.errors[0]?.message || 'Tham so khong hop le',
      }, 400)
    }

    const filters = parseResult.data

    // Build aggregation query
    // We need to do manual aggregation since Supabase doesn't support GROUP BY directly
    let query = supabase
      .from('thread_stock')
      .select('thread_type_id, warehouse_id, qty_full_cones, qty_partial_cones')

    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id)
    }

    const { data: stockData, error: stockError } = await query

    if (stockError) {
      console.error('Supabase error:', stockError)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Loi khi tai ton kho',
      }, 500)
    }

    // Get thread type info
    const threadTypeIds = [...new Set((stockData || []).map(s => s.thread_type_id))]

    if (threadTypeIds.length === 0) {
      return c.json<StockApiResponse<[]>>({
        success: true,
        data: [],
        message: 'Khong co du lieu ton kho',
      })
    }

    const { data: threadTypes, error: threadError } = await supabase
      .from('thread_types')
      .select('id, code, name')
      .in('id', threadTypeIds)

    if (threadError) {
      console.error('Supabase error:', threadError)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Loi khi tai thong tin loai chi',
      }, 500)
    }

    // Build thread type map
    const threadTypeMap = new Map(
      (threadTypes || []).map(t => [t.id, { code: t.code, name: t.name }])
    )

    // Aggregate by thread_type_id
    const aggregated = new Map<number, { total_full: number; total_partial: number }>()

    for (const row of stockData || []) {
      const existing = aggregated.get(row.thread_type_id) || { total_full: 0, total_partial: 0 }
      existing.total_full += row.qty_full_cones || 0
      existing.total_partial += row.qty_partial_cones || 0
      aggregated.set(row.thread_type_id, existing)
    }

    // Build summary result
    const summary = Array.from(aggregated.entries()).map(([threadTypeId, totals]) => {
      const threadInfo = threadTypeMap.get(threadTypeId)
      return {
        thread_type_id: threadTypeId,
        thread_code: threadInfo?.code || '',
        thread_name: threadInfo?.name || '',
        total_full_cones: totals.total_full,
        total_partial_cones: totals.total_partial,
      }
    })

    return c.json<StockApiResponse<typeof summary>>({
      success: true,
      data: summary,
      message: `Tong hop ${summary.length} loai chi`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<StockApiResponse<null>>({
      success: false,
      error: 'Loi he thong',
    }, 500)
  }
})

// ============================================================================
// POST /api/stock - Manual stock entry → creates individual thread_inventory cones
// ============================================================================
stock.post('/', requirePermission('thread.batch.receive'), async (c) => {
  try {
    const body = await c.req.json()

    const parseResult = AddStockSchema.safeParse(body)
    if (!parseResult.success) {
      return c.json({
        data: null,
        error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ',
      }, 400)
    }

    const data = parseResult.data
    const totalCones = data.qty_full_cones + (data.qty_partial_cones || 0)

    if (totalCones <= 0) {
      return c.json({
        data: null,
        error: 'Phải có ít nhất 1 cuộn (nguyên hoặc lẻ)',
      }, 400)
    }

    const { data: threadType, error: threadError } = await supabase
      .from('thread_types')
      .select('meters_per_cone')
      .eq('id', data.thread_type_id)
      .single()

    if (threadError || !threadType) {
      return c.json({
        data: null,
        error: 'Không tìm thấy loại chỉ',
      }, 404)
    }

    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id')
      .eq('id', data.warehouse_id)
      .single()

    if (warehouseError || !warehouse) {
      return c.json({
        data: null,
        error: 'Không tìm thấy kho',
      }, 404)
    }

    const { data: ratioResult } = await supabase.rpc('fn_get_partial_cone_ratio')
    const partialConeRatio = Number(ratioResult) || 0.3

    const metersPerCone = threadType.meters_per_cone || 0
    const partialMeters = metersPerCone * partialConeRatio

    const now = new Date()
    const lotNumber = data.lot_number || `MC-LOT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

    const { data: lotRecord, error: lotError } = await supabase
      .from('lots')
      .insert({
        lot_number: lotNumber,
        thread_type_id: data.thread_type_id,
        warehouse_id: data.warehouse_id,
        supplier_id: data.supplier_id || null,
        expiry_date: data.expiry_date || null,
        total_cones: totalCones,
        available_cones: totalCones,
        status: 'ACTIVE',
        notes: data.notes || null,
      })
      .select('id')
      .single()

    if (lotError || !lotRecord) {
      console.error('Lot creation error:', lotError)
      return c.json({
        data: null,
        error: 'Lỗi khi tạo lô hàng: ' + (lotError?.message || 'Không thể tạo lô'),
      }, 500)
    }

    const lotId = lotRecord.id

    const timestamp = Date.now()
    const cones: Array<{
      cone_id: string
      thread_type_id: number
      warehouse_id: number
      quantity_cones: number
      quantity_meters: number
      is_partial: boolean
      status: string
      lot_number: string
      lot_id: number
      received_date: string
      expiry_date: string | null
    }> = []

    for (let i = 0; i < data.qty_full_cones; i++) {
      cones.push({
        cone_id: `MC-${timestamp}-${String(cones.length + 1).padStart(4, '0')}`,
        thread_type_id: data.thread_type_id,
        warehouse_id: data.warehouse_id,
        quantity_cones: 1,
        quantity_meters: metersPerCone,
        is_partial: false,
        status: 'AVAILABLE',
        lot_number: lotNumber,
        lot_id: lotId,
        received_date: data.received_date,
        expiry_date: data.expiry_date || null,
      })
    }

    const qtyPartial = data.qty_partial_cones || 0
    for (let i = 0; i < qtyPartial; i++) {
      cones.push({
        cone_id: `MC-${timestamp}-${String(cones.length + 1).padStart(4, '0')}`,
        thread_type_id: data.thread_type_id,
        warehouse_id: data.warehouse_id,
        quantity_cones: 1,
        quantity_meters: partialMeters,
        is_partial: true,
        status: 'AVAILABLE',
        lot_number: lotNumber,
        lot_id: lotId,
        received_date: data.received_date,
        expiry_date: data.expiry_date || null,
      })
    }

    const { data: insertedCones, error: insertError } = await supabase
      .from('thread_inventory')
      .insert(cones)
      .select('cone_id')

    if (insertError) {
      console.error('Cone insert error:', insertError)
      return c.json({
        data: null,
        error: 'Lỗi khi tạo cuộn chỉ: ' + insertError.message,
      }, 500)
    }

    return c.json({
      data: {
        cones_created: cones.length,
        lot_number: lotNumber,
        cone_ids: (insertedCones || []).map((r: { cone_id: string }) => r.cone_id),
      },
      error: null,
      message: `Nhập kho thành công ${data.qty_full_cones} cuộn nguyên, ${qtyPartial} cuộn lẻ (Lô: ${lotNumber})`,
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json({
      data: null,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

// ============================================================================
// POST /api/stock/deduct - Deduct stock with FEFO (First Expired First Out)
// ============================================================================
stock.post('/deduct', requirePermission('thread.batch.issue'), async (c) => {
  try {
    const body = await c.req.json()

    // Validate request body
    const parseResult = DeductStockSchema.safeParse(body)
    if (!parseResult.success) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: parseResult.error.errors[0]?.message || 'Du lieu khong hop le',
      }, 400)
    }

    const data = parseResult.data
    let remainingFull = data.qty_full
    let remainingPartial = data.qty_partial || 0

    // Get available stock ordered by received_date (FEFO)
    let query = supabase
      .from('thread_stock')
      .select('*')
      .eq('thread_type_id', data.thread_type_id)
      .order('received_date', { ascending: true })

    if (data.warehouse_id) {
      query = query.eq('warehouse_id', data.warehouse_id)
    }

    const { data: stockRows, error: fetchError } = await query

    if (fetchError) {
      console.error('Supabase error:', fetchError)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Loi khi tai ton kho',
      }, 500)
    }

    if (!stockRows || stockRows.length === 0) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Khong co ton kho cho loai chi nay',
      }, 400)
    }

    // Calculate total available
    const totalFullAvailable = stockRows.reduce((sum, row) => sum + (row.qty_full_cones || 0), 0)
    const totalPartialAvailable = stockRows.reduce((sum, row) => sum + (row.qty_partial_cones || 0), 0)

    if (remainingFull > totalFullAvailable) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: `Khong du ton kho. Yeu cau: ${remainingFull} cuon nguyen, Co: ${totalFullAvailable}`,
      }, 400)
    }

    if (remainingPartial > totalPartialAvailable) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: `Khong du ton kho. Yeu cau: ${remainingPartial} cuon le, Co: ${totalPartialAvailable}`,
      }, 400)
    }

    // Deduct from stock using FEFO
    const deductedFrom: DeductionResult[] = []
    const updatePromises: Promise<unknown>[] = []

    for (const row of stockRows) {
      if (remainingFull <= 0 && remainingPartial <= 0) break

      let deductFull = 0
      let deductPartial = 0

      // Deduct full cones
      if (remainingFull > 0 && row.qty_full_cones > 0) {
        deductFull = Math.min(remainingFull, row.qty_full_cones)
        remainingFull -= deductFull
      }

      // Deduct partial cones
      if (remainingPartial > 0 && row.qty_partial_cones > 0) {
        deductPartial = Math.min(remainingPartial, row.qty_partial_cones)
        remainingPartial -= deductPartial
      }

      if (deductFull > 0 || deductPartial > 0) {
        deductedFrom.push({
          lot_number: row.lot_number,
          qty_full: deductFull,
          qty_partial: deductPartial,
        })

        // Queue update
        updatePromises.push(
          supabase
            .from('thread_stock')
            .update({
              qty_full_cones: row.qty_full_cones - deductFull,
              qty_partial_cones: row.qty_partial_cones - deductPartial,
              updated_at: new Date().toISOString(),
            })
            .eq('id', row.id)
        )
      }
    }

    // Execute all updates
    const results = await Promise.all(updatePromises)
    const hasError = results.some((r: unknown) => (r as { error?: unknown })?.error)

    if (hasError) {
      console.error('Error updating stock records')
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Loi khi cap nhat ton kho',
      }, 500)
    }

    const totalDeductedFull = deductedFrom.reduce((sum, d) => sum + d.qty_full, 0)
    const totalDeductedPartial = deductedFrom.reduce((sum, d) => sum + d.qty_partial, 0)

    return c.json<StockApiResponse<{
      deducted_from: DeductionResult[]
      total_deducted_full: number
      total_deducted_partial: number
    }>>({
      success: true,
      data: {
        deducted_from: deductedFrom,
        total_deducted_full: totalDeductedFull,
        total_deducted_partial: totalDeductedPartial,
      },
      message: `Da xuat ${totalDeductedFull} cuon nguyen, ${totalDeductedPartial} cuon le tu ${deductedFrom.length} lo`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<StockApiResponse<null>>({
      success: false,
      error: 'Loi he thong',
    }, 500)
  }
})

// ============================================================================
// POST /api/stock/return - Return stock (add back to inventory)
// ============================================================================
stock.post('/return', requirePermission('thread.batch.issue'), async (c) => {
  try {
    const body = await c.req.json()

    // Validate request body
    const parseResult = ReturnStockSchema.safeParse(body)
    if (!parseResult.success) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: parseResult.error.errors[0]?.message || 'Du lieu khong hop le',
      }, 400)
    }

    const data = parseResult.data

    // Check if stock record exists for this thread/warehouse/lot combination
    let query = supabase
      .from('thread_stock')
      .select('id, qty_full_cones, qty_partial_cones')
      .eq('thread_type_id', data.thread_type_id)
      .eq('warehouse_id', data.warehouse_id)

    if (data.lot_number) {
      query = query.eq('lot_number', data.lot_number)
    } else {
      query = query.is('lot_number', null)
    }

    const { data: existing, error: findError } = await query.maybeSingle()

    if (findError) {
      console.error('Supabase error:', findError)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Loi khi kiem tra ton kho',
      }, 500)
    }

    let result: StockRow

    if (existing) {
      // Update existing record - add quantities back
      const { data: updated, error: updateError } = await supabase
        .from('thread_stock')
        .update({
          qty_full_cones: existing.qty_full_cones + data.qty_full,
          qty_partial_cones: existing.qty_partial_cones + data.qty_partial,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('Supabase error:', updateError)
        return c.json<StockApiResponse<null>>({
          success: false,
          error: 'Loi khi cap nhat ton kho',
        }, 500)
      }

      result = updated as StockRow
    } else {
      // Create new stock record for the return
      const { data: created, error: insertError } = await supabase
        .from('thread_stock')
        .insert({
          thread_type_id: data.thread_type_id,
          warehouse_id: data.warehouse_id,
          lot_number: data.lot_number || null,
          qty_full_cones: data.qty_full,
          qty_partial_cones: data.qty_partial,
          received_date: new Date().toISOString().split('T')[0], // Today's date
        })
        .select()
        .single()

      if (insertError) {
        console.error('Supabase error:', insertError)
        return c.json<StockApiResponse<null>>({
          success: false,
          error: 'Loi khi them ton kho tra lai',
        }, 500)
      }

      result = created as StockRow
    }

    return c.json<StockApiResponse<StockRow>>({
      success: true,
      data: result,
      message: `Tra lai thanh cong: ${data.qty_full} cuon nguyen, ${data.qty_partial} cuon le`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<StockApiResponse<null>>({
      success: false,
      error: 'Loi he thong',
    }, 500)
  }
})

export default stock
