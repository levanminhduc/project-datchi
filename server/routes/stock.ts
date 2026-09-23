import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import { getErrorMessage } from '../utils/errorHelper'
import { requirePermission } from '../middleware/auth'
import { getPartialConeRatio } from '../utils/settings-helper'
import {
  StockFiltersSchema,
  StockSummaryFiltersSchema,
  AddStockSchema,
  DeductStockSchema,
  ReturnStockSchema,
  ManualHistoryQuerySchema,
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
        error: parseResult.error.issues[0]?.message || 'Tham số không hợp lệ',
      }, 400)
    }

    const filters = parseResult.data

    const conditions: string[] = ['status = ANY($1)']
    const params: unknown[] = [ACTIVE_STATUSES]

    if (filters.thread_type_id) {
      params.push(filters.thread_type_id)
      conditions.push(`thread_type_id = $${params.length}`)
    }
    if (filters.warehouse_id) {
      params.push(filters.warehouse_id)
      conditions.push(`warehouse_id = $${params.length}`)
    }
    if (filters.lot_number) {
      params.push(`%${filters.lot_number}%`)
      conditions.push(`lot_number ILIKE $${params.length}`)
    }

    let cones: Array<{
      id: number
      thread_type_id: number
      warehouse_id: number
      lot_number: string | null
      is_partial: boolean
      received_date: string | null
      lot_id: number | null
    }>
    try {
      cones = await query(
        `SELECT id, thread_type_id, warehouse_id, lot_number, is_partial, received_date, lot_id
         FROM thread_inventory
         WHERE ${conditions.join(' AND ')}`,
        params
      )
    } catch (conesError) {
      console.error('Database error:', conesError)
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
        ? query<{ id: number; code: string; name: string }>('SELECT id, code, name FROM thread_types WHERE id = ANY($1)', [threadTypeIds])
        : Promise.resolve([] as { id: number; code: string; name: string }[]),
      warehouseIds.length > 0
        ? query<{ id: number; name: string; code: string }>('SELECT id, name, code FROM warehouses WHERE id = ANY($1)', [warehouseIds])
        : Promise.resolve([] as { id: number; name: string; code: string }[]),
      lotIds.length > 0
        ? query<{ id: number; notes: string | null }>('SELECT id, notes FROM lots WHERE id = ANY($1)', [lotIds])
        : Promise.resolve([] as { id: number; notes: string | null }[]),
    ])

    const ttMap = new Map(threadTypesResult.map(t => [t.id, t]))
    const whMap = new Map(warehousesResult.map(w => [w.id, w]))
    const lotNotesMap = new Map(lotsResult.map(l => [l.id, l.notes]))

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
        error: parseResult.error.issues[0]?.message || 'Tham số không hợp lệ',
      }, 400)
    }

    const filters = parseResult.data

    const conditions: string[] = [`status = ANY($1)`]
    const params: unknown[] = [['AVAILABLE', 'RECEIVED', 'INSPECTED']]

    if (filters.warehouse_id) {
      params.push(filters.warehouse_id)
      conditions.push(`warehouse_id = $${params.length}`)
    }

    let cones: Array<{ thread_type_id: number; is_partial: boolean }>
    try {
      cones = await query(
        `SELECT thread_type_id, is_partial FROM thread_inventory WHERE ${conditions.join(' AND ')}`,
        params
      )
    } catch (conesError) {
      console.error('Database error:', conesError)
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
    let threadTypes: Array<{ id: number; code: string; name: string }>
    try {
      threadTypes = await query(
        'SELECT id, code, name FROM thread_types WHERE id = ANY($1)',
        [threadTypeIds]
      )
    } catch (threadError) {
      console.error('Database error:', threadError)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Lỗi khi tải thông tin loại chỉ',
      }, 500)
    }

    const threadTypeMap = new Map(
      threadTypes.map(t => [t.id, { code: t.code, name: t.name }])
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
// GET /api/stock/manual-history - Paginated history of manual stock entries
// ============================================================================
stock.get('/manual-history', requirePermission('thread.batch.receive'), async (c) => {
  try {
    const rawParams = {
      page: c.req.query('page'),
      pageSize: c.req.query('pageSize'),
    }

    const parseResult = ManualHistoryQuerySchema.safeParse(rawParams)
    if (!parseResult.success) {
      return c.json({
        data: null,
        error: parseResult.error.issues[0]?.message || 'Tham số không hợp lệ',
      }, 400)
    }

    const { page, pageSize } = parseResult.data
    const offset = (page - 1) * pageSize

    let lots: Array<{
      id: number
      lot_number: string
      thread_type_id: number
      warehouse_id: number
      supplier_id: number | null
      total_cones: number
      created_at: string
      created_by_employee_id: number | null
    }>
    let count: number
    try {
      const [rows, countResult] = await Promise.all([
        query<{
          id: number
          lot_number: string
          thread_type_id: number
          warehouse_id: number
          supplier_id: number | null
          total_cones: number
          created_at: string
          created_by_employee_id: number | null
        }>(
          `SELECT id, lot_number, thread_type_id, warehouse_id, supplier_id, total_cones, created_at, created_by_employee_id
           FROM lots
           WHERE lot_number LIKE $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          ['MC-LOT-%', pageSize, offset]
        ),
        query<{ count: string }>(
          'SELECT count(*)::int AS count FROM lots WHERE lot_number LIKE $1',
          ['MC-LOT-%']
        ),
      ])
      lots = rows
      count = countResult.length > 0 ? Number(countResult[0].count) : 0
    } catch (lotsError) {
      console.error('Manual history query error:', lotsError)
      return c.json({ data: null, error: 'Lỗi khi tải lịch sử nhập thủ công' }, 500)
    }

    if (!lots || lots.length === 0) {
      return c.json({ data: [], count: 0, page, pageSize, error: null })
    }

    const threadTypeIds = [...new Set(lots.map(l => l.thread_type_id))]
    const warehouseIds = [...new Set(lots.map(l => l.warehouse_id))]
    const supplierIds = [...new Set(lots.map(l => l.supplier_id).filter((id): id is number => id != null))]
    const employeeIds = [...new Set(lots.map(l => l.created_by_employee_id).filter((id): id is number => id != null))]
    const lotIds = lots.map(l => l.id)

    const [ttResult, whResult, suppResult, empResult, coneCountResult] = await Promise.all([
      query<{ id: number; code: string; name: string; color_id: number | null; tex_number: number | null }>('SELECT id, code, name, color_id, tex_number FROM thread_types WHERE id = ANY($1)', [threadTypeIds]),
      query<{ id: number; name: string }>('SELECT id, name FROM warehouses WHERE id = ANY($1)', [warehouseIds]),
      supplierIds.length > 0
        ? query<{ id: number; name: string }>('SELECT id, name FROM suppliers WHERE id = ANY($1)', [supplierIds])
        : Promise.resolve([] as { id: number; name: string }[]),
      employeeIds.length > 0
        ? query<{ id: number; full_name: string }>('SELECT id, full_name FROM employees WHERE id = ANY($1)', [employeeIds])
        : Promise.resolve([] as { id: number; full_name: string }[]),
      query<{ lot_id: number | null; is_partial: boolean; color_id: number | null }>('SELECT lot_id, is_partial, color_id FROM thread_inventory WHERE lot_id = ANY($1) LIMIT 5000', [lotIds]),
    ])

    const coneCountMap = new Map<number, { full_cones: number; partial_cones: number; color_id: number | null }>()
    for (const cone of coneCountResult) {
      if (!cone.lot_id) continue
      const existing = coneCountMap.get(cone.lot_id) || { full_cones: 0, partial_cones: 0, color_id: null }
      if (cone.is_partial) existing.partial_cones += 1
      else existing.full_cones += 1
      if (!existing.color_id && cone.color_id) existing.color_id = cone.color_id
      coneCountMap.set(cone.lot_id, existing)
    }

    const colorIds = [...new Set([...coneCountMap.values()].map(c => c.color_id).filter((id): id is number => id != null))]
    const colorResult = colorIds.length > 0
      ? await query<{ id: number; name: string; hex_code: string }>('SELECT id, name, hex_code FROM colors WHERE id = ANY($1)', [colorIds])
      : []

    const ttMap = new Map(ttResult.map(t => [t.id, t]))
    const whMap = new Map(whResult.map(w => [w.id, w]))
    const suppMap = new Map(suppResult.map(s => [s.id, s]))
    const empMap = new Map(empResult.map(e => [e.id, e]))
    const colorMap = new Map(colorResult.map(c => [c.id, c]))

    const rows = lots.map(lot => {
      const tt = ttMap.get(lot.thread_type_id)
      const coneCounts = coneCountMap.get(lot.id) || { full_cones: 0, partial_cones: 0, color_id: null }
      const color = coneCounts.color_id ? colorMap.get(coneCounts.color_id) : null

      return {
        id: lot.id,
        lot_number: lot.lot_number,
        created_at: lot.created_at,
        total_cones: lot.total_cones,
        full_cones: coneCounts.full_cones,
        partial_cones: coneCounts.partial_cones,
        thread_type: tt ? { code: tt.code, name: tt.name, tex_number: tt.tex_number || null, color: color ? { name: color.name, hex_code: color.hex_code } : null } : null,
        warehouse: whMap.get(lot.warehouse_id) ? { name: whMap.get(lot.warehouse_id)!.name } : null,
        supplier: lot.supplier_id ? (suppMap.get(lot.supplier_id) ? { name: suppMap.get(lot.supplier_id)!.name } : null) : null,
        created_by: lot.created_by_employee_id ? (empMap.get(lot.created_by_employee_id) ? { full_name: empMap.get(lot.created_by_employee_id)!.full_name } : null) : null,
      }
    })

    return c.json({ data: rows, count, page, pageSize, error: null })
  } catch (err) {
    console.error('Manual history error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
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
        error: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ',
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

    const auth = c.get('auth') as { employeeId: number }

    const threadType = await queryOne<{ meters_per_cone: number | null }>(
      'SELECT meters_per_cone FROM thread_types WHERE id = $1',
      [data.thread_type_id]
    )

    if (!threadType) {
      return c.json({
        data: null,
        error: 'Không tìm thấy loại chỉ',
      }, 404)
    }

    const warehouse = await queryOne<{ id: number }>(
      'SELECT id FROM warehouses WHERE id = $1',
      [data.warehouse_id]
    )

    if (!warehouse) {
      return c.json({
        data: null,
        error: 'Không tìm thấy kho',
      }, 404)
    }

    const partialConeRatio = await getPartialConeRatio()

    const metersPerCone = threadType.meters_per_cone || 0
    const partialMeters = metersPerCone * partialConeRatio

    const now = new Date()
    const lotNumber = data.lot_number || `MC-LOT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

    let lotRecord: { id: number } | null
    try {
      lotRecord = await queryOne<{ id: number }>(
        `INSERT INTO lots (
           lot_number, thread_type_id, warehouse_id, supplier_id, expiry_date,
           total_cones, available_cones, status, notes, created_by_employee_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          lotNumber,
          data.thread_type_id,
          data.warehouse_id,
          data.supplier_id || null,
          data.expiry_date || null,
          totalCones,
          totalCones,
          'ACTIVE',
          data.notes || null,
          auth.employeeId,
        ]
      )
    } catch (lotError) {
      console.error('Lot creation error:', lotError)
      return c.json({
        data: null,
        error: 'Lỗi khi tạo lô hàng: ' + (getErrorMessage(lotError) || 'Không thể tạo lô'),
      }, 500)
    }

    if (!lotRecord) {
      return c.json({
        data: null,
        error: 'Lỗi khi tạo lô hàng: Không thể tạo lô',
      }, 500)
    }

    const lotId = lotRecord.id

    const timestamp = Date.now()
    const cones: Array<{
      cone_id: string
      thread_type_id: number
      warehouse_id: number
      color_id: number | null
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
        color_id: data.color_id || null,
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
        color_id: data.color_id || null,
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

    let insertedCones: Array<{ cone_id: string }>
    try {
      const columns = [
        'cone_id', 'thread_type_id', 'warehouse_id', 'color_id', 'quantity_cones',
        'quantity_meters', 'is_partial', 'status', 'lot_number', 'lot_id',
        'received_date', 'expiry_date',
      ]
      const params: unknown[] = []
      const valueRows = cones.map((cone) => {
        const placeholders = [
          cone.cone_id, cone.thread_type_id, cone.warehouse_id, cone.color_id,
          cone.quantity_cones, cone.quantity_meters, cone.is_partial, cone.status,
          cone.lot_number, cone.lot_id, cone.received_date, cone.expiry_date,
        ].map((v) => {
          params.push(v)
          return `$${params.length}`
        })
        return `(${placeholders.join(', ')})`
      })

      insertedCones = await query<{ cone_id: string }>(
        `INSERT INTO thread_inventory (${columns.join(', ')})
         VALUES ${valueRows.join(', ')}
         RETURNING cone_id`,
        params
      )
    } catch (insertError) {
      console.error('Cone insert error:', insertError)
      return c.json({
        data: null,
        error: 'Lỗi khi tạo cuộn chỉ: ' + getErrorMessage(insertError),
      }, 500)
    }

    return c.json({
      data: {
        cones_created: cones.length,
        lot_number: lotNumber,
        cone_ids: insertedCones.map((r) => r.cone_id),
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
        error: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ',
      }, 400)
    }

    const data = parseResult.data
    const requestedFull = data.qty_full
    const requestedPartial = data.qty_partial || 0

    const buildFefoQuery = (isPartial: boolean, limitVal: number) => {
      const params: unknown[] = [data.thread_type_id, isPartial]
      let text = `SELECT id, cone_id, lot_number, is_partial
         FROM thread_inventory
         WHERE thread_type_id = $1 AND status = 'AVAILABLE' AND is_partial = $2`
      if (data.warehouse_id) {
        params.push(data.warehouse_id)
        text += ` AND warehouse_id = $${params.length}`
      }
      params.push(limitVal)
      text += ` ORDER BY expiry_date ASC NULLS LAST, received_date ASC LIMIT $${params.length}`
      return query<{ id: number; cone_id: string; lot_number: string | null; is_partial: boolean }>(text, params)
    }

    let availableFull: Array<{ id: number; cone_id: string; lot_number: string | null; is_partial: boolean }>
    let availablePartial: Array<{ id: number; cone_id: string; lot_number: string | null; is_partial: boolean }>
    try {
      const [fullResult, partialResult] = await Promise.all([
        requestedFull > 0 ? buildFefoQuery(false, requestedFull) : Promise.resolve([] as { id: number; cone_id: string; lot_number: string | null; is_partial: boolean }[]),
        requestedPartial > 0 ? buildFefoQuery(true, requestedPartial) : Promise.resolve([] as { id: number; cone_id: string; lot_number: string | null; is_partial: boolean }[]),
      ])
      availableFull = fullResult
      availablePartial = partialResult
    } catch (fefoError) {
      console.error('Database error:', fefoError)
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Lỗi khi tải tồn kho',
      }, 500)
    }

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
      try {
        await query(
          `UPDATE thread_inventory SET status = 'HARD_ALLOCATED', updated_at = $1 WHERE id = ANY($2)`,
          [new Date().toISOString(), allSelectedIds]
        )
      } catch (updateError) {
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
        error: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ',
      }, 400)
    }

    const data = parseResult.data

    const threadType = await queryOne<{ meters_per_cone: number | null }>(
      'SELECT meters_per_cone FROM thread_types WHERE id = $1',
      [data.thread_type_id]
    )

    if (!threadType) {
      return c.json<StockApiResponse<null>>({
        success: false,
        error: 'Không tìm thấy loại chỉ',
      }, 404)
    }

    const partialConeRatio = await getPartialConeRatio()

    const metersPerCone = threadType.meters_per_cone || 0
    const partialMeters = metersPerCone * partialConeRatio

    const now = new Date()
    const receivedDate = now.toISOString().split('T')[0]
    const totalCones = data.qty_full + data.qty_partial

    const lotNumber = data.lot_number || `RTN-LOT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

    let lotId: number

    if (data.lot_number) {
      const existingLot = await queryOne<{ id: number; thread_type_id: number; warehouse_id: number }>(
        'SELECT id, thread_type_id, warehouse_id FROM lots WHERE lot_number = $1',
        [data.lot_number]
      )

      if (existingLot) {
        if (existingLot.thread_type_id !== data.thread_type_id || existingLot.warehouse_id !== data.warehouse_id) {
          return c.json<StockApiResponse<null>>({
            success: false,
            error: 'Lô hàng đã tồn tại với loại chỉ hoặc kho khác',
          }, 400)
        }
        lotId = existingLot.id
      } else {
        let newLot: { id: number } | null
        try {
          newLot = await queryOne<{ id: number }>(
            `INSERT INTO lots (lot_number, thread_type_id, warehouse_id, total_cones, available_cones, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [lotNumber, data.thread_type_id, data.warehouse_id, totalCones, totalCones, 'ACTIVE']
          )
        } catch (lotError) {
          console.error('Lot creation error:', lotError)
          return c.json<StockApiResponse<null>>({
            success: false,
            error: 'Lỗi khi tạo lô hàng',
          }, 500)
        }
        if (!newLot) {
          console.error('Lot creation error: no row returned')
          return c.json<StockApiResponse<null>>({
            success: false,
            error: 'Lỗi khi tạo lô hàng',
          }, 500)
        }
        lotId = newLot.id
      }
    } else {
      let newLot: { id: number } | null
      try {
        newLot = await queryOne<{ id: number }>(
          `INSERT INTO lots (lot_number, thread_type_id, warehouse_id, total_cones, available_cones, status)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [lotNumber, data.thread_type_id, data.warehouse_id, totalCones, totalCones, 'ACTIVE']
        )
      } catch (lotError) {
        console.error('Lot creation error:', lotError)
        return c.json<StockApiResponse<null>>({
          success: false,
          error: 'Lỗi khi tạo lô hàng',
        }, 500)
      }
      if (!newLot) {
        console.error('Lot creation error: no row returned')
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

    try {
      const columns = [
        'cone_id', 'thread_type_id', 'warehouse_id', 'quantity_cones',
        'quantity_meters', 'is_partial', 'status', 'lot_number', 'lot_id', 'received_date',
      ]
      const params: unknown[] = []
      const valueRows = cones.map((cone) => {
        const placeholders = [
          cone.cone_id, cone.thread_type_id, cone.warehouse_id, cone.quantity_cones,
          cone.quantity_meters, cone.is_partial, cone.status, cone.lot_number,
          cone.lot_id, cone.received_date,
        ].map((v) => {
          params.push(v)
          return `$${params.length}`
        })
        return `(${placeholders.join(', ')})`
      })

      await query(
        `INSERT INTO thread_inventory (${columns.join(', ')}) VALUES ${valueRows.join(', ')}`,
        params
      )
    } catch (insertError) {
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
