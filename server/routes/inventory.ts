import { Hono } from 'hono'
import { query, queryOne, queryCount } from '../db/query'
import { requirePermission } from '../middleware/auth'
import { sanitizeFilterValue } from '../utils/sanitize'
import type { ThreadApiResponse, ConeRow, ReceiveStockDTO, StocktakeDTO, StocktakeResult, ConeSummaryRow, ConeWarehouseBreakdown, SupplierBreakdown, ConeStatus } from '../types/thread'

const inventory = new Hono()

const BATCH_SIZE = 1000

// GET /api/inventory - List inventory with server-side pagination
inventory.get('/', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const search = c.req.query('search') || ''
    const threadTypeId = c.req.query('thread_type_id')
    const warehouseId = c.req.query('warehouse_id')
    const status = c.req.query('status')
    const isPartial = c.req.query('is_partial')

    const page = Math.max(1, parseInt(c.req.query('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '25')))
    const sortBy = c.req.query('sortBy') || 'received_date'
    const descending = c.req.query('descending') !== 'false'

    const ALLOWED_SORT_COLUMNS = ['created_at', 'received_date', 'cone_id', 'quantity_meters', 'weight_grams', 'status', 'lot_number', 'is_partial']
    const safeSortBy = ALLOWED_SORT_COLUMNS.includes(sortBy) ? sortBy : 'received_date'

    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const filterParams: unknown[] = []

    if (search) {
      const s = sanitizeFilterValue(search)
      filterParams.push(`%${s}%`)
      const p = `$${filterParams.length}`
      conditions.push(`(ti.cone_id ILIKE ${p} OR ti.lot_number ILIKE ${p})`)
    }
    if (threadTypeId) {
      const parsedThreadTypeId = parseInt(threadTypeId)
      if (!isNaN(parsedThreadTypeId)) {
        filterParams.push(parsedThreadTypeId)
        conditions.push(`ti.thread_type_id = $${filterParams.length}`)
      }
    }
    if (warehouseId) {
      const parsedWarehouseId = parseInt(warehouseId)
      if (!isNaN(parsedWarehouseId)) {
        filterParams.push(parsedWarehouseId)
        conditions.push(`ti.warehouse_id = $${filterParams.length}`)
      }
    }
    if (status) {
      filterParams.push(status)
      conditions.push(`ti.status = $${filterParams.length}`)
    }
    if (isPartial !== undefined && isPartial !== '') {
      filterParams.push(isPartial === 'true')
      conditions.push(`ti.is_partial = $${filterParams.length}`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    let count: number
    try {
      count = await queryCount(
        `SELECT count(*)::int AS count FROM thread_inventory ti ${whereClause}`,
        filterParams
      )
    } catch (err) {
      console.error('Inventory count error:', err)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách tồn kho'
      }, 500)
    }

    const dataParams = [...filterParams, pageSize, offset]
    let data: ConeRow[]
    try {
      data = await query<ConeRow & Record<string, unknown>>(
        `SELECT ti.*,
           CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
             'code', tt.code,
             'name', tt.name,
             'color_data', CASE WHEN col.id IS NULL THEN NULL
                                ELSE json_build_object('name', col.name, 'hex_code', col.hex_code) END
           ) END AS thread_types
         FROM thread_inventory ti
         LEFT JOIN thread_types tt ON tt.id = ti.thread_type_id
         LEFT JOIN colors col ON col.id = tt.color_id
         ${whereClause}
         ORDER BY ti.${safeSortBy} ${descending ? 'DESC' : 'ASC'}
         LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      )
    } catch (err) {
      console.error('Inventory list error:', err)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách tồn kho'
      }, 500)
    }

    return c.json({
      data: data as ConeRow[],
      count: count ?? 0,
      page,
      pageSize,
      error: null,
      message: `Trang ${page}, ${count ?? 0} cuộn chỉ`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// GET /api/inventory/available/summary - Get available stock summary for allocation
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
inventory.get('/available/summary', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const threadTypeId = c.req.query('thread_type_id')

    const conditions: string[] = ['status = $1']
    const params: unknown[] = ['AVAILABLE']

    if (threadTypeId) {
      const parsedId = parseInt(threadTypeId)
      if (!isNaN(parsedId)) {
        params.push(parsedId)
        conditions.push(`thread_type_id = $${params.length}`)
      }
    }

    let data: Array<{ thread_type_id: number; quantity_meters: number; is_partial: boolean }>
    try {
      data = await query<{ thread_type_id: number; quantity_meters: number; is_partial: boolean }>(
        `SELECT thread_type_id, quantity_meters, is_partial
         FROM thread_inventory
         WHERE ${conditions.join(' AND ')}`,
        params
      )
    } catch (err) {
      console.error('Available summary error:', err)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải tồn kho khả dụng'
      }, 500)
    }

    // Aggregate by thread_type_id
    const summary: Record<number, { total_meters: number, full_cones: number, partial_cones: number }> = {}
    
    for (const cone of data || []) {
      if (!summary[cone.thread_type_id]) {
        summary[cone.thread_type_id] = { total_meters: 0, full_cones: 0, partial_cones: 0 }
      }
      summary[cone.thread_type_id].total_meters += cone.quantity_meters
      if (cone.is_partial) {
        summary[cone.thread_type_id].partial_cones++
      } else {
        summary[cone.thread_type_id].full_cones++
      }
    }

    return c.json<ThreadApiResponse<typeof summary>>({
      data: summary,
      error: null
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// GET /api/inventory/by-barcode/:coneId - Get cone by barcode
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
inventory.get('/by-barcode/:coneId', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const coneId = c.req.param('coneId')

    const data = await queryOne<ConeRow & Record<string, unknown>>(
      `SELECT ti.*,
         CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
           'code', tt.code,
           'name', tt.name,
           'color_data', CASE WHEN col.id IS NULL THEN NULL
                              ELSE json_build_object('name', col.name, 'hex_code', col.hex_code) END,
           'density_grams_per_meter', tt.density_grams_per_meter
         ) END AS thread_types,
         CASE WHEN wh.id IS NULL THEN NULL ELSE json_build_object('name', wh.name) END AS warehouses
       FROM thread_inventory ti
       LEFT JOIN thread_types tt ON tt.id = ti.thread_type_id
       LEFT JOIN colors col ON col.id = tt.color_id
       LEFT JOIN warehouses wh ON wh.id = ti.warehouse_id
       WHERE ti.cone_id = $1`,
      [coneId]
    )

    if (!data) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy cuộn chỉ với mã vạch này'
      }, 404)
    }

    return c.json<ThreadApiResponse<ConeRow>>({
      data: data as ConeRow,
      error: null
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// GET /api/inventory/by-warehouse/:warehouseId - Get all cones by warehouse for stocktake
inventory.get('/by-warehouse/:warehouseId', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const warehouseId = c.req.param('warehouseId')
    const parsedId = parseInt(warehouseId)
    
    if (isNaN(parsedId)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID kho không hợp lệ'
      }, 400)
    }

    // Fetch all cones in warehouse with batch support
    const allData: Partial<ConeRow>[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      let data: Partial<ConeRow>[]
      try {
        data = await query<Partial<ConeRow> & Record<string, unknown>>(
          `SELECT ti.id, ti.cone_id, ti.thread_type_id, ti.lot_number, ti.weight_grams,
                  ti.quantity_meters, ti.status, ti.is_partial,
                  CASE WHEN tt.id IS NULL THEN NULL
                       ELSE json_build_object('code', tt.code, 'name', tt.name) END AS thread_types
           FROM thread_inventory ti
           LEFT JOIN thread_types tt ON tt.id = ti.thread_type_id
           WHERE ti.warehouse_id = $1
             AND ti.status IN ('AVAILABLE', 'ALLOCATED', 'RECEIVED')
           ORDER BY ti.cone_id ASC
           LIMIT $2 OFFSET $3`,
          [parsedId, BATCH_SIZE, offset]
        )
      } catch (err) {
        console.error('By-warehouse list error:', err)
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Lỗi khi tải danh sách tồn kho'
        }, 500)
      }

      if (!data || data.length === 0) {
        hasMore = false
      } else {
        allData.push(...data as Partial<ConeRow>[])
        offset += BATCH_SIZE
        if (data.length < BATCH_SIZE) {
          hasMore = false
        }
      }
    }

    return c.json<ThreadApiResponse<Partial<ConeRow>[]>>({
      data: allData,
      error: null,
      message: `Tìm thấy ${allData.length} cuộn chỉ trong kho`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// GET /api/inventory/summary/by-cone - Cone-based inventory summary
inventory.get('/summary/by-cone', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const warehouseId = c.req.query('warehouse_id')
    const supplierId = c.req.query('supplier_id')
    const material = c.req.query('material')
    const search = c.req.query('search')

    type SummaryViewRow = {
      thread_type_id: number
      thread_code: string
      thread_name: string
      color_id: number | null
      color_name: string | null
      color_hex: string | null
      material: string
      tex_number: string | number | null
      meters_per_cone: number | null
      supplier_id: number | null
      full_cones: number
      partial_cones: number
      partial_meters: number
      partial_weight_grams: number
      total_full_cones: number
      total_partial_cones: number
    }

    const parsedWarehouseId = warehouseId ? parseInt(warehouseId) : null
    const parsedSupplierId = supplierId ? parseInt(supplierId) : null
    const sanitizedSearch = search ? `%${sanitizeFilterValue(search)}%` : null

    if (warehouseId && (parsedWarehouseId == null || Number.isNaN(parsedWarehouseId))) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID kho không hợp lệ'
      }, 400)
    }

    if (supplierId && (parsedSupplierId == null || Number.isNaN(parsedSupplierId))) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID nhà cung cấp không hợp lệ'
      }, 400)
    }

    let warehouseIds: number[] | null = null
    if (parsedWarehouseId) {
      const wh = await queryOne<{ id: number; type: string }>(
        'SELECT id, type FROM warehouses WHERE id = $1',
        [parsedWarehouseId]
      )

      if (wh?.type === 'LOCATION') {
        const children = await query<{ id: number }>(
          `SELECT id FROM warehouses
           WHERE parent_id = $1 AND is_active = TRUE AND deleted_at IS NULL`,
          [parsedWarehouseId]
        )
        warehouseIds = children?.map(c => c.id) ?? []
      } else {
        warehouseIds = [parsedWarehouseId]
      }
    }

    // Physical totals: all usable cones including allocated/reserved.
    const totalStatuses: ConeStatus[] = [
      'RECEIVED',
      'INSPECTED',
      'AVAILABLE',
      'SOFT_ALLOCATED',
      'HARD_ALLOCATED',
      'RESERVED_FOR_ORDER'
    ]

    // KD columns: only free cones.
    const kdStatuses: ConeStatus[] = ['RECEIVED', 'INSPECTED', 'AVAILABLE']

    let totalRpcRows: SummaryViewRow[]
    let kdRpcRows: SummaryViewRow[]
    try {
      const [totalResult, kdResult] = await Promise.all([
        query<SummaryViewRow>(
          'SELECT * FROM fn_cone_summary_filtered($1, $2, $3, $4, $5, $6)',
          [totalStatuses, warehouseIds, parsedSupplierId, material || null, sanitizedSearch, false]
        ),
        query<SummaryViewRow>(
          'SELECT * FROM fn_cone_summary_filtered($1, $2, $3, $4, $5, $6)',
          [kdStatuses, warehouseIds, parsedSupplierId, material || null, sanitizedSearch, true]
        )
      ])
      totalRpcRows = totalResult
      kdRpcRows = kdResult
    } catch (err) {
      console.error('RPC error:', err)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải tổng hợp tồn kho'
      }, 500)
    }

    const makeSummaryKey = (row: SummaryViewRow): string =>
      `${row.thread_type_id}|${row.color_id ?? 'null'}|${row.supplier_id ?? 'null'}`

    const kdMap = new Map<string, SummaryViewRow>()
    for (const row of kdRpcRows) {
      kdMap.set(makeSummaryKey(row), row)
    }

    const summaryData: SummaryViewRow[] = totalRpcRows.map((row) => {
      const kd = kdMap.get(makeSummaryKey(row))

      return {
        ...row,
        full_cones: Number(kd?.full_cones || 0),
        partial_cones: Number(kd?.partial_cones || 0),
        partial_meters: Number(kd?.partial_meters || 0),
        partial_weight_grams: Number(kd?.partial_weight_grams || 0),
      }
    })

    const threadTypeIds = [...new Set(summaryData.map(r => r.thread_type_id))]
    const supplierIds = [...new Set(summaryData.map(r => r.supplier_id).filter(Boolean))] as number[]
    const priceMap = new Map<number, number>()
    const texMap = new Map<number, { tex_number: string | null; tex_label: string | null }>()
    const supplierNameMap = new Map<number, string>()
    const idleMap = new Map<string, number>()

    const makeIdleKey = (threadTypeId: number, colorId: number | null): string =>
      `${threadTypeId}|${colorId ?? 'null'}`

    if (threadTypeIds.length > 0) {
      let threadTypes: Array<{ id: number; tex_number: string | number | null; tex_label: string | null }>
      try {
        threadTypes = await query<{ id: number; tex_number: string | number | null; tex_label: string | null }>(
          `SELECT id, tex_number, tex_label FROM thread_types WHERE id = ANY($1)`,
          [threadTypeIds]
        )
      } catch (threadTypesError) {
        console.error('Thread type tex lookup error:', threadTypesError)
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Lỗi khi tải thông tin Tex'
        }, 500)
      }

      for (const threadType of threadTypes || []) {
        texMap.set(threadType.id, {
          tex_number: threadType.tex_number != null ? String(threadType.tex_number) : null,
          tex_label: threadType.tex_label ?? null,
        })
      }

      if (supplierIds.length > 0) {
        const suppliers = await query<{ id: number; name: string }>(
          `SELECT id, name FROM suppliers WHERE id = ANY($1)`,
          [supplierIds]
        )
        for (const s of suppliers || []) {
          supplierNameMap.set(s.id, s.name)
        }
      }

      const prices = await query<{ thread_type_id: number; supplier_id: number; unit_price: number | null }>(
        `SELECT thread_type_id, supplier_id, unit_price
         FROM thread_type_supplier
         WHERE thread_type_id = ANY($1) AND is_active = TRUE`,
        [threadTypeIds]
      )

      if (prices) {
        const supplierMap = new Map<number, number | null>()
        for (const row of summaryData) {
          if (row.supplier_id && !supplierMap.has(row.thread_type_id)) {
            supplierMap.set(row.thread_type_id, row.supplier_id)
          }
        }
        for (const p of prices) {
          const defaultSupplierId = supplierMap.get(p.thread_type_id)
          if (defaultSupplierId && p.supplier_id === defaultSupplierId && p.unit_price != null) {
            priceMap.set(p.thread_type_id, Number(p.unit_price))
          }
        }
      }

      try {
        const idleRows = await query<{ thread_type_id: number; color_id: number | null; idle_days: number | null }>(
          `SELECT
             g.thread_type_id,
             g.color_id,
             EXTRACT(DAY FROM now() - COALESCE(li.last_issue, g.last_created))::int AS idle_days
           FROM (
             SELECT thread_type_id, color_id, MAX(created_at) AS last_created
             FROM thread_inventory
             WHERE thread_type_id = ANY($1)
             GROUP BY thread_type_id, color_id
           ) g
           LEFT JOIN (
             SELECT ti.thread_type_id, ti.color_id, MAX(mv.created_at) AS last_issue
             FROM thread_movements mv
             JOIN thread_inventory ti ON ti.id = mv.cone_id
             WHERE mv.movement_type = 'ISSUE'
               AND ti.thread_type_id = ANY($1)
             GROUP BY ti.thread_type_id, ti.color_id
           ) li
             ON li.thread_type_id = g.thread_type_id
             AND li.color_id IS NOT DISTINCT FROM g.color_id`,
          [threadTypeIds]
        )

        for (const r of idleRows || []) {
          if (r.idle_days != null) {
            idleMap.set(makeIdleKey(r.thread_type_id, r.color_id ?? null), Number(r.idle_days))
          }
        }
      } catch (idleError) {
        console.error('Idle days lookup error:', idleError)
      }
    }

    const getSummaryTex = (threadTypeId: number, fallback: string | number | null) => {
      const tex = texMap.get(threadTypeId)
      const texNumber = tex?.tex_number ?? (fallback != null ? String(fallback) : null)
      const texLabel = tex?.tex_label ?? texNumber

      return { texNumber, texLabel }
    }

    const mapped: ConeSummaryRow[] = summaryData.map((row) => {
      const { texNumber, texLabel } = getSummaryTex(row.thread_type_id, row.tex_number)

      return {
      thread_type_id: row.thread_type_id,
      thread_code: row.thread_code,
      thread_name: row.thread_name,
      supplier_name: row.supplier_id ? (supplierNameMap.get(row.supplier_id) ?? null) : null,
      color_id: row.color_id ?? null,
      color_data: row.color_name ? { name: row.color_name, hex_code: row.color_hex } : null,
      material: row.material as ConeSummaryRow['material'],
      tex_number: texNumber,
      tex_label: texLabel,
      meters_per_cone: row.meters_per_cone,
      unit_price: priceMap.get(row.thread_type_id) ?? null,
      full_cones: Number(row.full_cones),
      partial_cones: Number(row.partial_cones),
      partial_meters: Number(row.partial_meters),
      partial_weight_grams: Number(row.partial_weight_grams),
      total_full_cones: Number(row.total_full_cones),
      total_partial_cones: Number(row.total_partial_cones),
      idle_days: idleMap.get(makeIdleKey(row.thread_type_id, row.color_id ?? null)) ?? null,
      }
    })

    return c.json<ThreadApiResponse<ConeSummaryRow[]>>({
      data: mapped,
      error: null,
      message: `Tổng hợp ${mapped.length} loại chỉ`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// GET /api/inventory/summary/by-cone/:threadTypeId/warehouses - Warehouse breakdown for a thread type
inventory.get('/summary/by-cone/:threadTypeId/warehouses', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const threadTypeId = parseInt(c.req.param('threadTypeId'))
    const colorIdParam = c.req.query('color_id')
    const colorId = colorIdParam ? parseInt(colorIdParam) : null
    const warehouseIdParam = c.req.query('warehouse_id')
    const warehouseId = warehouseIdParam ? parseInt(warehouseIdParam) : null

    if (isNaN(threadTypeId)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID loại chỉ không hợp lệ'
      }, 400)
    }

    if (warehouseIdParam && (warehouseId == null || isNaN(warehouseId))) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID kho không hợp lệ'
      }, 400)
    }

    const usableStatuses: ConeStatus[] = [
      'RECEIVED',
      'INSPECTED',
      'AVAILABLE',
      'SOFT_ALLOCATED',
      'HARD_ALLOCATED',
      'RESERVED_FOR_ORDER'
    ]

    // Path A: no warehouse filter -> giữ nguyên flow cũ với 2 RPC.
    // Path B: có warehouse_id -> filter warehouse breakdown rows (lossless),
    // và re-derive supplier_breakdown từ thread_inventory MIRROR semantics
    // fn_supplier_breakdown (cùng usableStatuses, cùng COALESCE supplier from
    // lot/thread_type, cùng metrics) để tránh cross-warehouse leak.
    if (warehouseId == null) {
      let warehouseRows: Array<{ warehouse_id: number; warehouse_code: string; warehouse_name: string; locations: string | null; full_cones: number; partial_cones: number; partial_meters: number }>
      let supplierRows: SupplierBreakdown[]
      try {
        const [warehouseResult, supplierResult] = await Promise.all([
          query<{ warehouse_id: number; warehouse_code: string; warehouse_name: string; locations: string | null; full_cones: number; partial_cones: number; partial_meters: number }>(
            'SELECT * FROM fn_warehouse_breakdown($1, $2, $3)',
            [threadTypeId, usableStatuses, colorId]
          ),
          query<SupplierBreakdown>(
            'SELECT * FROM fn_supplier_breakdown($1, $2, $3)',
            [threadTypeId, usableStatuses, colorId]
          ),
        ])
        warehouseRows = warehouseResult
        supplierRows = supplierResult
      } catch (err) {
        console.error('RPC error:', err)
        return c.json<ThreadApiResponse<null>>({
          data: null,
          error: 'Lỗi khi tải chi tiết kho'
        }, 500)
      }

      const breakdownList: ConeWarehouseBreakdown[] = warehouseRows.map(
        (row) => ({
          ...row,
          location: row.locations,
          locations: undefined,
        })
      )

      const supplierBreakdown: SupplierBreakdown[] = supplierRows || []

      return c.json<ThreadApiResponse<ConeWarehouseBreakdown[]> & { supplier_breakdown: SupplierBreakdown[] }>({
        data: breakdownList,
        supplier_breakdown: supplierBreakdown,
        error: null,
        message: `Tìm thấy ${breakdownList.length} kho chứa loại chỉ này`
      })
    }

    // Path B: warehouse_id present
    let warehouseRowsB: Array<{ warehouse_id: number; warehouse_code: string; warehouse_name: string; locations: string | null; full_cones: number; partial_cones: number; partial_meters: number }>
    try {
      warehouseRowsB = await query<{ warehouse_id: number; warehouse_code: string; warehouse_name: string; locations: string | null; full_cones: number; partial_cones: number; partial_meters: number }>(
        'SELECT * FROM fn_warehouse_breakdown($1, $2, $3)',
        [threadTypeId, usableStatuses, colorId]
      )
    } catch (err) {
      console.error('RPC error:', err)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải chi tiết kho'
      }, 500)
    }

    const breakdownList: ConeWarehouseBreakdown[] = warehouseRowsB
      .filter((row) => row.warehouse_id === warehouseId)
      .map(
        (row) => ({
          ...row,
          location: row.locations,
          locations: undefined,
        })
      )

    // Query thread_inventory cho warehouse được chọn để re-derive supplier breakdown
    const coneConditions: string[] = ['thread_type_id = $1', 'warehouse_id = $2', 'status = ANY($3)']
    const coneParams: unknown[] = [threadTypeId, warehouseId, usableStatuses]
    if (colorId != null) {
      coneParams.push(colorId)
      coneConditions.push(`color_id = $${coneParams.length}`)
    }
    let coneRows: Array<{ is_partial: boolean; quantity_meters: number; lot_id: number | null; thread_type_id: number; color_id: number | null }>
    try {
      coneRows = await query<{ is_partial: boolean; quantity_meters: number; lot_id: number | null; thread_type_id: number; color_id: number | null }>(
        `SELECT is_partial, quantity_meters, lot_id, thread_type_id, color_id
         FROM thread_inventory
         WHERE ${coneConditions.join(' AND ')}`,
        coneParams
      )
    } catch (coneErr) {
      console.error('thread_inventory supplier re-derive error:', coneErr)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải chi tiết nhà cung cấp'
      }, 500)
    }

    const cones = coneRows || []
    const lotIds = Array.from(new Set(cones.map((r) => r.lot_id).filter((v): v is number => v != null)))

    let lotsData: Array<{ id: number; supplier_id: number | null }>
    let threadTypeData: { id: number; supplier_id: number | null } | null
    try {
      const [lotsResp, threadTypeResp] = await Promise.all([
        lotIds.length > 0
          ? query<{ id: number; supplier_id: number | null }>(
              `SELECT id, supplier_id FROM lots WHERE id = ANY($1)`,
              [lotIds]
            )
          : Promise.resolve([] as Array<{ id: number; supplier_id: number | null }>),
        queryOne<{ id: number; supplier_id: number | null }>(
          `SELECT id, supplier_id FROM thread_types WHERE id = $1`,
          [threadTypeId]
        ),
      ])
      lotsData = lotsResp
      threadTypeData = threadTypeResp
    } catch (err) {
      console.error('lots/thread_type fetch error:', err)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải chi tiết nhà cung cấp'
      }, 500)
    }

    const lotSupplierMap = new Map<number, number | null>()
    for (const lot of lotsData || []) {
      lotSupplierMap.set(lot.id, lot.supplier_id ?? null)
    }
    const threadTypeSupplierId = threadTypeData?.supplier_id ?? null

    const supplierAggMap = new Map<number | null, { full_cones: number; partial_cones: number; partial_meters: number }>()
    for (const row of cones) {
      const lotSupplier = row.lot_id != null ? lotSupplierMap.get(row.lot_id) ?? null : null
      const supplierId = lotSupplier != null ? lotSupplier : threadTypeSupplierId
      const key = supplierId
      let agg = supplierAggMap.get(key)
      if (!agg) {
        agg = { full_cones: 0, partial_cones: 0, partial_meters: 0 }
        supplierAggMap.set(key, agg)
      }
      if (row.is_partial) {
        agg.partial_cones += 1
        agg.partial_meters += Number(row.quantity_meters) || 0
      } else {
        agg.full_cones += 1
      }
    }

    const supplierIdsForLookup = Array.from(supplierAggMap.keys()).filter((v): v is number => v != null)
    let suppliersData: Array<{ id: number; code: string; name: string }>
    try {
      suppliersData = supplierIdsForLookup.length > 0
        ? await query<{ id: number; code: string; name: string }>(
            `SELECT id, code, name FROM suppliers WHERE id = ANY($1)`,
            [supplierIdsForLookup]
          )
        : []
    } catch (suppliersErr) {
      console.error('suppliers fetch error:', suppliersErr)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải chi tiết nhà cung cấp'
      }, 500)
    }

    const supplierInfoMap = new Map<number, { code: string; name: string }>()
    for (const s of suppliersData || []) {
      supplierInfoMap.set(s.id, { code: s.code, name: s.name })
    }

    const supplierBreakdown: SupplierBreakdown[] = []
    for (const [supplierId, agg] of supplierAggMap.entries()) {
      const info = supplierId != null ? supplierInfoMap.get(supplierId) : undefined
      supplierBreakdown.push({
        supplier_id: supplierId,
        supplier_code: info?.code ?? null,
        supplier_name: info?.name ?? 'Không xác định',
        full_cones: agg.full_cones,
        partial_cones: agg.partial_cones,
        partial_meters: agg.partial_meters,
      })
    }
    supplierBreakdown.sort((a, b) => (a.supplier_name || '').localeCompare(b.supplier_name || '', 'vi'))

    return c.json<ThreadApiResponse<ConeWarehouseBreakdown[]> & { supplier_breakdown: SupplierBreakdown[] }>({
      data: breakdownList,
      supplier_breakdown: supplierBreakdown,
      error: null,
      message: `Tìm thấy ${breakdownList.length} kho chứa loại chỉ này`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// GET /api/inventory/unassigned-by-thread-type - Get unassigned cones grouped by thread type
inventory.get('/unassigned-by-thread-type', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const warehouseId = c.req.query('warehouse_id')

    if (!warehouseId) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vui lòng cung cấp warehouse_id'
      }, 400)
    }

    const parsedWarehouseId = parseInt(warehouseId)
    if (isNaN(parsedWarehouseId)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID kho không hợp lệ'
      }, 400)
    }

    const transferableStatuses: ConeStatus[] = ['AVAILABLE', 'RECEIVED', 'INSPECTED']

    let cones: Array<{
      id: number
      thread_type_id: number
      thread_types: { id: number; code: string; name: string; color_data: { name: string; hex_code: string | null } | null } | null
    }>
    try {
      cones = await query<{
        id: number
        thread_type_id: number
        thread_types: { id: number; code: string; name: string; color_data: { name: string; hex_code: string | null } | null } | null
      }>(
        `SELECT ti.id, ti.thread_type_id,
           CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
             'id', tt.id,
             'code', tt.code,
             'name', tt.name,
             'color_data', CASE WHEN col.id IS NULL THEN NULL
                                ELSE json_build_object('name', col.name, 'hex_code', col.hex_code) END
           ) END AS thread_types
         FROM thread_inventory ti
         LEFT JOIN thread_types tt ON tt.id = ti.thread_type_id
         LEFT JOIN colors col ON col.id = tt.color_id
         WHERE ti.warehouse_id = $1 AND ti.lot_id IS NULL AND ti.status = ANY($2)`,
        [parsedWarehouseId, transferableStatuses]
      )
    } catch (err) {
      console.error('Unassigned cones query error:', err)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách cuộn chưa phân lô'
      }, 500)
    }

    interface UnassignedGroup {
      thread_type_id: number
      thread_type_name: string
      thread_type_code: string
      color_name: string | null
      color_hex: string | null
      cone_count: number
      cone_ids: number[]
    }

    const groupMap: Map<number, UnassignedGroup> = new Map()

    for (const cone of cones || []) {
      const ttRaw = cone.thread_types
      const tt = (Array.isArray(ttRaw) ? ttRaw[0] : ttRaw) as unknown as {
        id: number
        code: string
        name: string
        color_data: { name: string; hex_code: string | null } | null
      } | null

      if (!tt) continue

      if (!groupMap.has(cone.thread_type_id)) {
        groupMap.set(cone.thread_type_id, {
          thread_type_id: cone.thread_type_id,
          thread_type_name: tt.name,
          thread_type_code: tt.code,
          color_name: tt.color_data?.name || null,
          color_hex: tt.color_data?.hex_code || null,
          cone_count: 0,
          cone_ids: []
        })
      }

      const group = groupMap.get(cone.thread_type_id)!
      group.cone_count++
      group.cone_ids.push(cone.id)
    }

    const groups = Array.from(groupMap.values())
      .sort((a, b) => a.thread_type_name.localeCompare(b.thread_type_name))

    return c.json<ThreadApiResponse<UnassignedGroup[]>>({
      data: groups,
      error: null,
      message: `Tìm thấy ${groups.length} loại chỉ chưa phân lô`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// GET /api/inventory/:id - Get single cone
inventory.get('/:id', requirePermission('thread.inventory.view'), async (c) => {
  try {
    const id = c.req.param('id')

    // Guard: skip if id matches a known static route name
    // This prevents parameterized route from capturing static routes
    if (id === 'available' || id === 'by-barcode' || id === 'by-warehouse' || id === 'summary' || id === 'unassigned-by-thread-type') {
      return c.notFound()
    }

    const parsedId = parseInt(id)
    if (isNaN(parsedId)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ'
      }, 400)
    }

    const data = await queryOne<ConeRow & Record<string, unknown>>(
      `SELECT ti.*,
         CASE WHEN tt.id IS NULL THEN NULL ELSE json_build_object(
           'code', tt.code,
           'name', tt.name,
           'color_data', CASE WHEN col.id IS NULL THEN NULL
                              ELSE json_build_object('name', col.name, 'hex_code', col.hex_code) END,
           'density_grams_per_meter', tt.density_grams_per_meter
         ) END AS thread_types
       FROM thread_inventory ti
       LEFT JOIN thread_types tt ON tt.id = ti.thread_type_id
       LEFT JOIN colors col ON col.id = tt.color_id
       WHERE ti.id = $1`,
      [parsedId]
    )

    if (!data) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy cuộn chỉ'
      }, 404)
    }

    return c.json<ThreadApiResponse<ConeRow>>({
      data: data as ConeRow,
      error: null
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// POST /api/inventory/receive - Receive stock
inventory.post('/receive', requirePermission('thread.inventory.edit'), async (c) => {
  try {
    const body = await c.req.json<ReceiveStockDTO>()

    // Validate required fields
    if (!body.thread_type_id || !body.warehouse_id || !body.quantity_cones) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vui lòng điền đầy đủ thông tin: loại chỉ, kho và số lượng'
      }, 400)
    }

    if (body.quantity_cones <= 0) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Số lượng cuộn phải lớn hơn 0'
      }, 400)
    }

    // Get thread type to calculate meters
    const threadType = await queryOne<{ meters_per_cone: number | null; density_grams_per_meter: number | null }>(
      `SELECT meters_per_cone, density_grams_per_meter FROM thread_types WHERE id = $1`,
      [body.thread_type_id]
    )

    if (!threadType) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy loại chỉ'
      }, 404)
    }

    // Verify warehouse exists
    const warehouse = await queryOne<{ id: number }>(
      `SELECT id FROM warehouses WHERE id = $1`,
      [body.warehouse_id]
    )

    if (!warehouse) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy kho'
      }, 404)
    }

    const insertColumns = [
      'cone_id', 'thread_type_id', 'warehouse_id', 'color_id', 'quantity_cones',
      'quantity_meters', 'weight_grams', 'is_partial', 'status', 'lot_number',
      'expiry_date', 'location'
    ]
    const insertParams: unknown[] = []
    const valueRows: string[] = []
    const timestamp = Date.now()

    for (let i = 0; i < body.quantity_cones; i++) {
      // Generate unique cone_id with format: CONE-{timestamp}-{sequence}
      const coneId = `CONE-${timestamp}-${String(i + 1).padStart(4, '0')}`

      // Calculate meters from weight or use standard
      let quantityMeters = threadType.meters_per_cone || 0
      if (body.weight_per_cone_grams && threadType.density_grams_per_meter) {
        quantityMeters = body.weight_per_cone_grams / threadType.density_grams_per_meter
      }

      const rowValues = [
        coneId,
        body.thread_type_id,
        body.warehouse_id,
        body.color_id || null,
        1,
        quantityMeters,
        body.weight_per_cone_grams ?? null,
        false,
        'RECEIVED',
        body.lot_number ?? null,
        body.expiry_date ?? null,
        body.location ?? null,
      ]
      const placeholders = rowValues.map((v) => {
        insertParams.push(v)
        return `$${insertParams.length}`
      })
      valueRows.push(`(${placeholders.join(', ')})`)
    }

    let data: ConeRow[]
    try {
      data = await query<ConeRow>(
        `INSERT INTO thread_inventory (${insertColumns.join(', ')})
         VALUES ${valueRows.join(', ')}
         RETURNING *`,
        insertParams
      )
    } catch (err) {
      console.error('Receive stock insert error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi nhập kho: ' + msg
      }, 500)
    }

    return c.json<ThreadApiResponse<ConeRow[]>>({
      data: data as ConeRow[],
      error: null,
      message: `Nhập kho thành công ${body.quantity_cones} cuộn chỉ`
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// POST /api/inventory/stocktake - Save stocktake results
inventory.post('/stocktake', requirePermission('thread.inventory.edit'), async (c) => {
  try {
    const body = await c.req.json<StocktakeDTO>()

    // Validate required fields
    if (!body.warehouse_id || !body.scanned_cone_ids) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Vui lòng cung cấp warehouse_id và danh sách cone_ids đã quét'
      }, 400)
    }

    // Get all cones in the warehouse from database
    let dbCones: Array<{ cone_id: string }>
    try {
      dbCones = await query<{ cone_id: string }>(
        `SELECT cone_id FROM thread_inventory
         WHERE warehouse_id = $1 AND status NOT IN ('CONSUMED', 'WRITTEN_OFF')`,
        [body.warehouse_id]
      )
    } catch (dbError) {
      console.error('Stocktake cone query error:', dbError)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi truy vấn database'
      }, 500)
    }

    const dbConeIds = new Set((dbCones || []).map(c => c.cone_id))
    const scannedSet = new Set(body.scanned_cone_ids)

    // Calculate comparison
    const matched = body.scanned_cone_ids.filter(id => dbConeIds.has(id))
    const missing = [...dbConeIds].filter(id => !scannedSet.has(id))
    const extra = body.scanned_cone_ids.filter(id => !dbConeIds.has(id))
    const matchRate = dbConeIds.size > 0
      ? Math.round((matched.length / dbConeIds.size) * 100 * 10) / 10
      : 0

    // Save stocktake record
    let stocktake: { id: number; created_at: string } | null = null
    try {
      stocktake = await queryOne<{ id: number; created_at: string }>(
        `INSERT INTO stocktakes (
           warehouse_id, total_in_db, total_scanned, matched_count,
           missing_cone_ids, extra_cone_ids, match_rate, notes, performed_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          body.warehouse_id,
          dbConeIds.size,
          body.scanned_cone_ids.length,
          matched.length,
          missing,
          extra,
          matchRate,
          body.notes,
          body.performed_by,
        ]
      )
    } catch (insertError) {
      // If stocktakes table doesn't exist, just return the result without saving
      const insertMsg = insertError instanceof Error ? insertError.message : String(insertError)
      console.warn('Could not save stocktake (table may not exist):', insertMsg)

      const result: StocktakeResult = {
        stocktake_id: 0,
        warehouse_id: body.warehouse_id,
        total_in_db: dbConeIds.size,
        total_scanned: body.scanned_cone_ids.length,
        matched: matched.length,
        missing,
        extra,
        match_rate: matchRate,
        performed_at: new Date().toISOString(),
      }

      return c.json<ThreadApiResponse<StocktakeResult>>({
        data: result,
        error: null,
        message: `Kiểm kê hoàn tất: ${matched.length}/${dbConeIds.size} khớp (${matchRate}%)`
      })
    }

    if (!stocktake) {
      const result: StocktakeResult = {
        stocktake_id: 0,
        warehouse_id: body.warehouse_id,
        total_in_db: dbConeIds.size,
        total_scanned: body.scanned_cone_ids.length,
        matched: matched.length,
        missing,
        extra,
        match_rate: matchRate,
        performed_at: new Date().toISOString(),
      }

      return c.json<ThreadApiResponse<StocktakeResult>>({
        data: result,
        error: null,
        message: `Kiểm kê hoàn tất: ${matched.length}/${dbConeIds.size} khớp (${matchRate}%)`
      })
    }

    const result: StocktakeResult = {
      stocktake_id: stocktake.id,
      warehouse_id: body.warehouse_id,
      total_in_db: dbConeIds.size,
      total_scanned: body.scanned_cone_ids.length,
      matched: matched.length,
      missing,
      extra,
      match_rate: matchRate,
      performed_at: stocktake.created_at,
    }

    return c.json<ThreadApiResponse<StocktakeResult>>({
      data: result,
      error: null,
      message: `Kiểm kê hoàn tất: ${matched.length}/${dbConeIds.size} khớp (${matchRate}%)`
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

export default inventory
