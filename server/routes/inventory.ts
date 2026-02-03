import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import type { ThreadApiResponse, ConeRow, ReceiveStockDTO, StocktakeDTO, StocktakeResult, ConeSummaryRow, ConeWarehouseBreakdown, ConeStatus } from '../types/thread'

const inventory = new Hono()

const BATCH_SIZE = 1000

// GET /api/inventory - List inventory with filters and batch support
inventory.get('/', async (c) => {
  try {
    const search = c.req.query('search') || ''
    const threadTypeId = c.req.query('thread_type_id')
    const warehouseId = c.req.query('warehouse_id')
    const status = c.req.query('status')
    const isPartial = c.req.query('is_partial')
    const limit = c.req.query('limit')

    // If limit=0, fetch all with batch
    if (limit === '0') {
      const allData: ConeRow[] = []
      let offset = 0
      let hasMore = true

      while (hasMore) {
        let query = supabase
          .from('thread_inventory')
          .select('*, thread_types(code, name, color, color_code)')
          .order('created_at', { ascending: false })
          .range(offset, offset + BATCH_SIZE - 1)

        if (search) {
          query = query.or(`cone_id.ilike.%${search}%,lot_number.ilike.%${search}%`)
        }
        if (threadTypeId) {
          query = query.eq('thread_type_id', parseInt(threadTypeId))
        }
        if (warehouseId) {
          query = query.eq('warehouse_id', parseInt(warehouseId))
        }
        if (status) {
          query = query.eq('status', status)
        }
        if (isPartial !== undefined) {
          query = query.eq('is_partial', isPartial === 'true')
        }

        const { data, error } = await query

        if (error) {
          return c.json<ThreadApiResponse<null>>({
            data: null,
            error: 'Lỗi khi tải danh sách tồn kho'
          }, 500)
        }

        if (!data || data.length === 0) {
          hasMore = false
        } else {
          allData.push(...data as ConeRow[])
          offset += BATCH_SIZE
          if (data.length < BATCH_SIZE) {
            hasMore = false
          }
        }
      }

      return c.json<ThreadApiResponse<ConeRow[]>>({
        data: allData,
        error: null,
        message: `Đã tải ${allData.length} cuộn chỉ`
      })
    }

    // Normal paginated query
    let query = supabase
      .from('thread_inventory')
      .select('*, thread_types(code, name, color, color_code)')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`cone_id.ilike.%${search}%,lot_number.ilike.%${search}%`)
    }
    if (threadTypeId) {
      query = query.eq('thread_type_id', parseInt(threadTypeId))
    }
    if (warehouseId) {
      query = query.eq('warehouse_id', parseInt(warehouseId))
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (isPartial !== undefined) {
      query = query.eq('is_partial', isPartial === 'true')
    }

    const { data, error } = await query

    if (error) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách tồn kho'
      }, 500)
    }

    return c.json<ThreadApiResponse<ConeRow[]>>({
      data: data as ConeRow[],
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

// GET /api/inventory/available/summary - Get available stock summary for allocation
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
inventory.get('/available/summary', async (c) => {
  try {
    const threadTypeId = c.req.query('thread_type_id')

    let query = supabase
      .from('thread_inventory')
      .select('thread_type_id, quantity_meters, is_partial')
      .eq('status', 'AVAILABLE')

    if (threadTypeId) {
      query = query.eq('thread_type_id', parseInt(threadTypeId))
    }

    const { data, error } = await query

    if (error) {
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
inventory.get('/by-barcode/:coneId', async (c) => {
  try {
    const coneId = c.req.param('coneId')

    const { data, error } = await supabase
      .from('thread_inventory')
      .select('*, thread_types(code, name, color, color_code, density_grams_per_meter), warehouses(name)')
      .eq('cone_id', coneId)
      .single()

    if (error || !data) {
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
inventory.get('/by-warehouse/:warehouseId', async (c) => {
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
      const { data, error } = await supabase
        .from('thread_inventory')
        .select('id, cone_id, thread_type_id, lot_number, weight_grams, quantity_meters, status, is_partial, thread_types(code, name)')
        .eq('warehouse_id', parsedId)
        .in('status', ['AVAILABLE', 'ALLOCATED', 'RECEIVED'])
        .order('cone_id', { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1)

      if (error) {
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
// Groups inventory by thread_type, counting full and partial cones
inventory.get('/summary/by-cone', async (c) => {
  try {
    const warehouseId = c.req.query('warehouse_id')
    const material = c.req.query('material')
    const search = c.req.query('search')

    // Statuses representing usable stock in warehouse
    // Excludes: IN_PRODUCTION, PARTIAL_RETURN, PENDING_WEIGH, CONSUMED, WRITTEN_OFF, QUARANTINE
    const usableStatuses: ConeStatus[] = [
      'RECEIVED',
      'INSPECTED', 
      'AVAILABLE',
      'SOFT_ALLOCATED',
      'HARD_ALLOCATED'
    ]

    // Fetch all usable cones with thread type details
    let query = supabase
      .from('thread_inventory')
      .select(`
        thread_type_id,
        quantity_meters,
        weight_grams,
        is_partial,
        thread_types(
          code, name, color, color_code, material, tex_number, meters_per_cone
        )
      `)
      .in('status', usableStatuses)

    if (warehouseId) {
      query = query.eq('warehouse_id', parseInt(warehouseId))
    }

    const { data: cones, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải tổng hợp tồn kho'
      }, 500)
    }

    // Aggregate by thread_type_id
    const summaryMap: Map<number, ConeSummaryRow> = new Map()

    for (const cone of cones || []) {
      const ttRaw = cone.thread_types
      const tt = (Array.isArray(ttRaw) ? ttRaw[0] : ttRaw) as {
        code: string
        name: string
        color: string | null
        color_code: string | null
        material: string
        tex_number: number | null
        meters_per_cone: number | null
      } | null

      if (!tt) continue

      // Apply material filter
      if (material && tt.material !== material) continue

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch = 
          tt.code.toLowerCase().includes(searchLower) ||
          tt.name.toLowerCase().includes(searchLower) ||
          (tt.color && tt.color.toLowerCase().includes(searchLower))
        if (!matchesSearch) continue
      }

      if (!summaryMap.has(cone.thread_type_id)) {
        summaryMap.set(cone.thread_type_id, {
          thread_type_id: cone.thread_type_id,
          thread_code: tt.code,
          thread_name: tt.name,
          color: tt.color,
          color_code: tt.color_code,
          material: tt.material as ConeSummaryRow['material'],
          tex_number: tt.tex_number,
          meters_per_cone: tt.meters_per_cone,
          full_cones: 0,
          partial_cones: 0,
          partial_meters: 0,
          partial_weight_grams: 0
        })
      }

      const row = summaryMap.get(cone.thread_type_id)!
      if (cone.is_partial) {
        row.partial_cones++
        row.partial_meters += cone.quantity_meters || 0
        row.partial_weight_grams += cone.weight_grams || 0
      } else {
        row.full_cones++
      }
    }

    const summaryList = Array.from(summaryMap.values())
      .sort((a, b) => a.thread_code.localeCompare(b.thread_code))

    return c.json<ThreadApiResponse<ConeSummaryRow[]>>({
      data: summaryList,
      error: null,
      message: `Tổng hợp ${summaryList.length} loại chỉ`
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
inventory.get('/summary/by-cone/:threadTypeId/warehouses', async (c) => {
  try {
    const threadTypeId = parseInt(c.req.param('threadTypeId'))

    if (isNaN(threadTypeId)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID loại chỉ không hợp lệ'
      }, 400)
    }

    // Statuses representing usable stock in warehouse
    const usableStatuses: ConeStatus[] = [
      'RECEIVED',
      'INSPECTED', 
      'AVAILABLE',
      'SOFT_ALLOCATED',
      'HARD_ALLOCATED'
    ]

    // Fetch all usable cones for this thread type with warehouse info
    const { data: cones, error } = await supabase
      .from('thread_inventory')
      .select(`
        warehouse_id,
        quantity_meters,
        is_partial,
        location,
        warehouses(code, name)
      `)
      .eq('thread_type_id', threadTypeId)
      .in('status', usableStatuses)

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải chi tiết kho'
      }, 500)
    }

    // Aggregate by warehouse
    const breakdownMap: Map<number, ConeWarehouseBreakdown> = new Map()

    for (const cone of cones || []) {
      const whRaw = cone.warehouses
      const wh = (Array.isArray(whRaw) ? whRaw[0] : whRaw) as { code: string; name: string } | null

      if (!breakdownMap.has(cone.warehouse_id)) {
        breakdownMap.set(cone.warehouse_id, {
          warehouse_id: cone.warehouse_id,
          warehouse_code: wh?.code || '',
          warehouse_name: wh?.name || '',
          location: cone.location,
          full_cones: 0,
          partial_cones: 0,
          partial_meters: 0
        })
      }

      const row = breakdownMap.get(cone.warehouse_id)!
      if (cone.is_partial) {
        row.partial_cones++
        row.partial_meters += cone.quantity_meters || 0
      } else {
        row.full_cones++
      }
    }

    const breakdownList = Array.from(breakdownMap.values())
      .sort((a, b) => a.warehouse_code.localeCompare(b.warehouse_code))

    return c.json<ThreadApiResponse<ConeWarehouseBreakdown[]>>({
      data: breakdownList,
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

// GET /api/inventory/:id - Get single cone
inventory.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Guard: skip if id matches a known static route name
    // This prevents parameterized route from capturing static routes
    if (id === 'available' || id === 'by-barcode' || id === 'by-warehouse' || id === 'summary') {
      return c.notFound()
    }

    const parsedId = parseInt(id)
    if (isNaN(parsedId)) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'ID không hợp lệ'
      }, 400)
    }

    const { data, error } = await supabase
      .from('thread_inventory')
      .select('*, thread_types(code, name, color, color_code, density_grams_per_meter)')
      .eq('id', parsedId)
      .single()

    if (error || !data) {
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
inventory.post('/receive', async (c) => {
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
    const { data: threadType, error: threadError } = await supabase
      .from('thread_types')
      .select('meters_per_cone, density_grams_per_meter')
      .eq('id', body.thread_type_id)
      .single()

    if (threadError || !threadType) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy loại chỉ'
      }, 404)
    }

    // Verify warehouse exists
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id')
      .eq('id', body.warehouse_id)
      .single()

    if (warehouseError || !warehouse) {
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy kho'
      }, 404)
    }

    const cones: Partial<ConeRow>[] = []
    const timestamp = Date.now()

    for (let i = 0; i < body.quantity_cones; i++) {
      // Generate unique cone_id with format: CONE-{timestamp}-{sequence}
      const coneId = `CONE-${timestamp}-${String(i + 1).padStart(4, '0')}`
      
      // Calculate meters from weight or use standard
      let quantityMeters = threadType.meters_per_cone || 0
      if (body.weight_per_cone_grams && threadType.density_grams_per_meter) {
        quantityMeters = body.weight_per_cone_grams / threadType.density_grams_per_meter
      }

      cones.push({
        cone_id: coneId,
        thread_type_id: body.thread_type_id,
        warehouse_id: body.warehouse_id,
        quantity_cones: 1,
        quantity_meters: quantityMeters,
        weight_grams: body.weight_per_cone_grams,
        is_partial: false,
        status: 'RECEIVED' as ConeRow['status'],
        lot_number: body.lot_number,
        expiry_date: body.expiry_date,
        location: body.location
      })
    }

    const { data, error } = await supabase
      .from('thread_inventory')
      .insert(cones)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadApiResponse<null>>({
        data: null,
        error: 'Lỗi khi nhập kho: ' + error.message
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
inventory.post('/stocktake', async (c) => {
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
    const { data: dbCones, error: dbError } = await supabase
      .from('thread_inventory')
      .select('cone_id')
      .eq('warehouse_id', body.warehouse_id)
      .not('status', 'in', '("CONSUMED","WRITTEN_OFF")')

    if (dbError) {
      console.error('Supabase error:', dbError)
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
    const { data: stocktake, error: insertError } = await supabase
      .from('stocktakes')
      .insert({
        warehouse_id: body.warehouse_id,
        total_in_db: dbConeIds.size,
        total_scanned: body.scanned_cone_ids.length,
        matched_count: matched.length,
        missing_cone_ids: missing,
        extra_cone_ids: extra,
        match_rate: matchRate,
        notes: body.notes,
        performed_by: body.performed_by,
      })
      .select()
      .single()

    if (insertError) {
      // If stocktakes table doesn't exist, just return the result without saving
      console.warn('Could not save stocktake (table may not exist):', insertError.message)
      
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
