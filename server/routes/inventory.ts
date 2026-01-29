import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import type { ThreadApiResponse, ConeRow, ReceiveStockDTO } from '../types/thread'

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
      .select('*, thread_types(code, name, color, color_code, density_grams_per_meter)')
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

// GET /api/inventory/:id - Get single cone
inventory.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Guard: skip if id matches a known static route name
    // This prevents parameterized route from capturing static routes
    if (id === 'available' || id === 'by-barcode') {
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

export default inventory
