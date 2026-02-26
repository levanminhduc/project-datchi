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

interface DeductionResult {
  lot_number: string | null
  qty_full: number
  qty_partial: number
}

const ACTIVE_STATUSES = ['AVAILABLE', 'RECEIVED', 'INSPECTED', 'SOFT_ALLOCATED', 'HARD_ALLOCATED']

const stock = new Hono()

// ============================================================================
// GET /api/stock - List stock records aggregated from thread_inventory
// ============================================================================
stock.get('/', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const rawParams = {
      thread_type_id: c.req.query('thread_type_id'),
      warehouse_id: c.req.query('warehouse_id'),
      lot_number: c.req.query('lot_number'),
    }

    const parseResult = StockFiltersSchema.safeParse(rawParams)
    if (!parseResult.success) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: parseResult.error.errors[0]?.message || 'Tham số không hợp lệ',
      }, 400)
    }

    const filters = parseResult.data

    let query = supabase
      .from('thread_inventory')
      .select('id, thread_type_id, warehouse_id, lot_number, is_partial, received_date, lot_id')
      .in('status', ACTIVE_STATUSES)

    if (filters.thread_type_id) {
      query = query.eq('thread_type_id', filters.thread_type_id)
    }
    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id)
    }
    if (filters.lot_number) {
      query = query.ilike('lot_number', `%${filters.lot_number}%`)
    }

    const { data: cones, error: conesError } = await query

    if (conesError) {
      console.error('Supabase error:', conesError)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Lỗi khi tải danh sách tồn kho',
      }, 500)
    }

    const grouped = new Map<string, {
      min_id: number
      thread_type_id: number
      warehouse_id: number
      lot_number: string | null
      lot_id: number | null
      qty_full_cones: number
      qty_partial_cones: number
      received_date: string | null
    }>()

    for (const cone of cones || []) {
      const key = `${cone.thread_type_id}-${cone.warehouse_id}-${cone.lot_number || 'NULL'}`
      const existing = grouped.get(key)
      if (existing) {
        if (cone.is_partial) {
          existing.qty_partial_cones += 1
        } else {
          existing.qty_full_cones += 1
        }
        if (cone.id < existing.min_id) existing.min_id = cone.id
        if (cone.received_date && (!existing.received_date || cone.received_date < existing.received_date)) {
          existing.received_date = cone.received_date
        }
      } else {
        grouped.set(key, {
          min_id: cone.id,
          thread_type_id: cone.thread_type_id,
          warehouse_id: cone.warehouse_id,
          lot_number: cone.lot_number,
          lot_id: cone.lot_id,
          qty_full_cones: cone.is_partial ? 0 : 1,
          qty_partial_cones: cone.is_partial ? 1 : 0,
          received_date: cone.received_date,
        })
      }
    }

    const threadTypeIds = [...new Set(Array.from(grouped.values()).map(g => g.thread_type_id))]
    const warehouseIds = [...new Set(Array.from(grouped.values()).map(g => g.warehouse_id))]
    const lotIds = [...new Set(Array.from(grouped.values()).map(g => g.lot_id).filter((id): id is number => id != null))]

    const [threadTypesResult, warehousesResult, lotsResult] = await Promise.all([
      threadTypeIds.length > 0
        ? supabase.from('thread_types').select('id, code, name').in('id', threadTypeIds)
        : { data: [], error: null },
      warehouseIds.length > 0
        ? supabase.from('warehouses').select('id, name, code').in('id', warehouseIds)
        : { data: [], error: null },
      lotIds.length > 0
        ? supabase.from('lots').select('id, notes').in('id', lotIds)
        : { data: [], error: null },
    ])

    const ttMap = new Map((threadTypesResult.data || []).map(t => [t.id, t]))
    const whMap = new Map((warehousesResult.data || []).map(w => [w.id, w]))
    const lotNotesMap = new Map((lotsResult.data || []).map(l => [l.id, l.notes]))

    const result = Array.from(grouped.values())
      .map(g => ({
        id: g.min_id,
        thread_type_id: g.thread_type_id,
        warehouse_id: g.warehouse_id,
        lot_number: g.lot_number,
        qty_full_cones: g.qty_full_cones,
        qty_partial_cones: g.qty_partial_cones,
        received_date: g.received_date,
        notes: g.lot_id ? (lotNotesMap.get(g.lot_id) || null) : null,
        thread_type: ttMap.get(g.thread_type_id) || null,
        warehouse: whMap.get(g.warehouse_id) || null,
      }))
      .sort((a, b) => (a.received_date || '').localeCompare(b.received_date || ''))

    return c.json<StockApiResponse<typeof result>>({
      success: true,
      data: result,
      message: `Đã tải ${result.length} bản ghi tồn kho`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<StockApiResponse<null>>({
      success: false,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

// ============================================================================
// GET /api/stock/summary - Aggregate stock by thread type from thread_inventory
// ============================================================================
stock.get('/summary', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const rawParams = {
      warehouse_id: c.req.query('warehouse_id'),
    }

    const parseResult = StockSummaryFiltersSchema.safeParse(rawParams)
    if (!parseResult.success) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: parseResult.error.errors[0]?.message || 'Tham số không hợp lệ',
      }, 400)
    }

    const filters = parseResult.data

    let query = supabase
      .from('thread_inventory')
      .select('thread_type_id, is_partial')
      .in('status', ['AVAILABLE', 'RECEIVED', 'INSPECTED'])

    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id)
    }

    const { data: cones, error: conesError } = await query

    if (conesError) {
      console.error('Supabase error:', conesError)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Lỗi khi tải tồn kho',
      }, 500)
    }

    if (!cones || cones.length === 0) {
      return c.json<StockApiResponse<[]>>({
        success: true,
        data: [],
        message: 'Không có dữ liệu tồn kho',
      })
    }

    const aggregated = new Map<number, { total_full: number; total_partial: number }>()

    for (const cone of cones) {
      const existing = aggregated.get(cone.thread_type_id) || { total_full: 0, total_partial: 0 }
      if (cone.is_partial) {
        existing.total_partial += 1
      } else {
        existing.total_full += 1
      }
      aggregated.set(cone.thread_type_id, existing)
    }

    const threadTypeIds = [...aggregated.keys()]
    const { data: threadTypes, error: threadError } = await supabase
      .from('thread_types')
      .select('id, code, name')
      .in('id', threadTypeIds)

    if (threadError) {
      console.error('Supabase error:', threadError)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Lỗi khi tải thông tin loại chỉ',
      }, 500)
    }

    const threadTypeMap = new Map(
      (threadTypes || []).map(t => [t.id, { code: t.code, name: t.name }])
    )

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
      message: `Tổng hợp ${summary.length} loại chỉ`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<StockApiResponse<null>>({
      success: false,
      error: 'Lỗi hệ thống',
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
// POST /api/stock/deduct - Deduct stock using FEFO on thread_inventory
// ============================================================================
stock.post('/deduct', requirePermission('thread.batch.issue'), async (c) => {
  try {
    const body = await c.req.json()

    const parseResult = DeductStockSchema.safeParse(body)
    if (!parseResult.success) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ',
      }, 400)
    }

    const data = parseResult.data
    const requestedFull = data.qty_full
    const requestedPartial = data.qty_partial || 0

    let fullQuery = supabase
      .from('thread_inventory')
      .select('id, cone_id, lot_number, is_partial')
      .eq('thread_type_id', data.thread_type_id)
      .eq('status', 'AVAILABLE')
      .eq('is_partial', false)
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .order('received_date', { ascending: true })
      .limit(requestedFull)

    let partialQuery = supabase
      .from('thread_inventory')
      .select('id, cone_id, lot_number, is_partial')
      .eq('thread_type_id', data.thread_type_id)
      .eq('status', 'AVAILABLE')
      .eq('is_partial', true)
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .order('received_date', { ascending: true })
      .limit(requestedPartial)

    if (data.warehouse_id) {
      fullQuery = fullQuery.eq('warehouse_id', data.warehouse_id)
      partialQuery = partialQuery.eq('warehouse_id', data.warehouse_id)
    }

    const [fullResult, partialResult] = await Promise.all([
      requestedFull > 0 ? fullQuery : { data: [], error: null },
      requestedPartial > 0 ? partialQuery : { data: [], error: null },
    ])

    if (fullResult.error || partialResult.error) {
      console.error('Supabase error:', fullResult.error || partialResult.error)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Lỗi khi tải tồn kho',
      }, 500)
    }

    const availableFull = fullResult.data || []
    const availablePartial = partialResult.data || []

    if (requestedFull > availableFull.length) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: `Không đủ tồn kho. Yêu cầu: ${requestedFull} cuộn nguyên, Có: ${availableFull.length}`,
      }, 400)
    }

    if (requestedPartial > availablePartial.length) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: `Không đủ tồn kho. Yêu cầu: ${requestedPartial} cuộn lẻ, Có: ${availablePartial.length}`,
      }, 400)
    }

    const selectedFullCones = availableFull.slice(0, requestedFull)
    const selectedPartialCones = availablePartial.slice(0, requestedPartial)
    const allSelectedIds = [
      ...selectedFullCones.map(c => c.id),
      ...selectedPartialCones.map(c => c.id),
    ]

    if (allSelectedIds.length > 0) {
      const { error: updateError } = await supabase
        .from('thread_inventory')
        .update({ status: 'HARD_ALLOCATED', updated_at: new Date().toISOString() })
        .in('id', allSelectedIds)

      if (updateError) {
        console.error('Error updating cone status:', updateError)
        return c.json<StockApiResponse<null>>({
          success: false,
          error: 'Lỗi khi cập nhật tồn kho',
        }, 500)
      }
    }

    const lotGroups = new Map<string, { qty_full: number; qty_partial: number }>()
    for (const cone of selectedFullCones) {
      const lotKey = cone.lot_number || '__null__'
      const existing = lotGroups.get(lotKey) || { qty_full: 0, qty_partial: 0 }
      existing.qty_full += 1
      lotGroups.set(lotKey, existing)
    }
    for (const cone of selectedPartialCones) {
      const lotKey = cone.lot_number || '__null__'
      const existing = lotGroups.get(lotKey) || { qty_full: 0, qty_partial: 0 }
      existing.qty_partial += 1
      lotGroups.set(lotKey, existing)
    }

    const deductedFrom: DeductionResult[] = Array.from(lotGroups.entries()).map(([key, val]) => ({
      lot_number: key === '__null__' ? null : key,
      qty_full: val.qty_full,
      qty_partial: val.qty_partial,
    }))

    return c.json<StockApiResponse<{
      deducted_from: DeductionResult[]
      total_deducted_full: number
      total_deducted_partial: number
    }>>({
      success: true,
      data: {
        deducted_from: deductedFrom,
        total_deducted_full: selectedFullCones.length,
        total_deducted_partial: selectedPartialCones.length,
      },
      message: `Đã xuất ${selectedFullCones.length} cuộn nguyên, ${selectedPartialCones.length} cuộn lẻ từ ${deductedFrom.length} lô`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<StockApiResponse<null>>({
      success: false,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

// ============================================================================
// POST /api/stock/return - Return stock → creates new thread_inventory cones
// ============================================================================
stock.post('/return', requirePermission('thread.batch.issue'), async (c) => {
  try {
    const body = await c.req.json()

    const parseResult = ReturnStockSchema.safeParse(body)
    if (!parseResult.success) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ',
      }, 400)
    }

    const data = parseResult.data

    const { data: threadType, error: threadError } = await supabase
      .from('thread_types')
      .select('meters_per_cone')
      .eq('id', data.thread_type_id)
      .single()

    if (threadError || !threadType) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Không tìm thấy loại chỉ',
      }, 404)
    }

    const { data: ratioResult } = await supabase.rpc('fn_get_partial_cone_ratio')
    const partialConeRatio = Number(ratioResult) || 0.3

    const metersPerCone = threadType.meters_per_cone || 0
    const partialMeters = metersPerCone * partialConeRatio

    const now = new Date()
    const receivedDate = now.toISOString().split('T')[0]
    const totalCones = data.qty_full + data.qty_partial

    const lotNumber = data.lot_number || `RTN-LOT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

    let lotId: number

    if (data.lot_number) {
      const { data: existingLot } = await supabase
        .from('lots')
        .select('id, thread_type_id, warehouse_id')
        .eq('lot_number', data.lot_number)
        .maybeSingle()

      if (existingLot) {
        if (existingLot.thread_type_id !== data.thread_type_id || existingLot.warehouse_id !== data.warehouse_id) {
          return c.json<StockApiResponse<null>>({
            success: false,
            error: 'Lô hàng đã tồn tại với loại chỉ hoặc kho khác',
          }, 400)
        }
        lotId = existingLot.id
      } else {
        const { data: newLot, error: lotError } = await supabase
          .from('lots')
          .insert({
            lot_number: lotNumber,
            thread_type_id: data.thread_type_id,
            warehouse_id: data.warehouse_id,
            total_cones: totalCones,
            available_cones: totalCones,
            status: 'ACTIVE',
          })
          .select('id')
          .single()

        if (lotError || !newLot) {
          console.error('Lot creation error:', lotError)
          return c.json<StockApiResponse<null>>({
            success: false,
            error: 'Lỗi khi tạo lô hàng',
          }, 500)
        }
        lotId = newLot.id
      }
    } else {
      const { data: newLot, error: lotError } = await supabase
        .from('lots')
        .insert({
          lot_number: lotNumber,
          thread_type_id: data.thread_type_id,
          warehouse_id: data.warehouse_id,
          total_cones: totalCones,
          available_cones: totalCones,
          status: 'ACTIVE',
        })
        .select('id')
        .single()

      if (lotError || !newLot) {
        console.error('Lot creation error:', lotError)
        return c.json<StockApiResponse<null>>({
          success: false,
          error: 'Lỗi khi tạo lô hàng',
        }, 500)
      }
      lotId = newLot.id
    }

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
    }> = []

    for (let i = 0; i < data.qty_full; i++) {
      cones.push({
        cone_id: `RTN-${timestamp}-${String(cones.length + 1).padStart(4, '0')}`,
        thread_type_id: data.thread_type_id,
        warehouse_id: data.warehouse_id,
        quantity_cones: 1,
        quantity_meters: metersPerCone,
        is_partial: false,
        status: 'AVAILABLE',
        lot_number: lotNumber,
        lot_id: lotId,
        received_date: receivedDate,
      })
    }

    for (let i = 0; i < data.qty_partial; i++) {
      cones.push({
        cone_id: `RTN-${timestamp}-${String(cones.length + 1).padStart(4, '0')}`,
        thread_type_id: data.thread_type_id,
        warehouse_id: data.warehouse_id,
        quantity_cones: 1,
        quantity_meters: partialMeters,
        is_partial: true,
        status: 'AVAILABLE',
        lot_number: lotNumber,
        lot_id: lotId,
        received_date: receivedDate,
      })
    }

    const { error: insertError } = await supabase
      .from('thread_inventory')
      .insert(cones)

    if (insertError) {
      console.error('Cone insert error:', insertError)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Lỗi khi tạo cuộn chỉ trả lại',
      }, 500)
    }

    return c.json<StockApiResponse<{
      cones_created: number
      lot_number: string
    }>>({
      success: true,
      data: {
        cones_created: cones.length,
        lot_number: lotNumber,
      },
      message: `Trả lại thành công: ${data.qty_full} cuộn nguyên, ${data.qty_partial} cuộn lẻ`,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<StockApiResponse<null>>({
      success: false,
      error: 'Lỗi hệ thống',
    }, 500)
  }
})

export default stock
