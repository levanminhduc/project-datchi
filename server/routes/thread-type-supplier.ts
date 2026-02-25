import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import type {
  ThreadTypeSupplierRow,
  ThreadTypeSupplierWithRelations,
  CreateThreadTypeSupplierDTO,
  UpdateThreadTypeSupplierDTO,
  LinkSupplierDTO,
  ThreadTypeSupplierApiResponse
} from '../types/thread-type-supplier'

const threadTypeSuppliers = new Hono()

threadTypeSuppliers.use('*', requirePermission('thread.suppliers.view'))

/**
 * GET /api/thread-type-suppliers - List all thread type-supplier links
 * Query params: thread_type_id, supplier_id, is_active, search
 */
threadTypeSuppliers.get('/', async (c) => {
  try {
    const threadTypeId = c.req.query('thread_type_id')
    const supplierId = c.req.query('supplier_id')
    const isActiveParam = c.req.query('is_active')
    const search = c.req.query('search')

    let query = supabase
      .from('thread_type_supplier')
      .select(`
        *,
        thread_type:thread_types(id, code, name, material, tex_number, color_id, color_data:colors(id, name, hex_code)),
        supplier:suppliers(id, code, name)
      `)
      .order('created_at', { ascending: false })

    // Filter by thread_type_id
    if (threadTypeId) {
      query = query.eq('thread_type_id', parseInt(threadTypeId))
    }

    // Filter by supplier_id
    if (supplierId) {
      query = query.eq('supplier_id', parseInt(supplierId))
    }

    // Filter by is_active (default: all)
    if (isActiveParam !== undefined) {
      query = query.eq('is_active', isActiveParam === 'true')
    }

    // Search by supplier_item_code
    if (search) {
      query = query.ilike('supplier_item_code', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách liên kết loại chỉ - nhà cung cấp'
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations[]>>({
      data: data as ThreadTypeSupplierWithRelations[],
      error: null,
      message: `Đã tải ${data.length} liên kết`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/thread-type-suppliers/:id - Get single link
 */
threadTypeSuppliers.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    const { data, error } = await supabase
      .from('thread_type_supplier')
      .select(`
        *,
        thread_type:thread_types(id, code, name, material, tex_number, color_id, color_data:colors(id, name, hex_code)),
        supplier:suppliers(id, code, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ThreadTypeSupplierApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy liên kết'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin liên kết'
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations>>({
      data: data as ThreadTypeSupplierWithRelations,
      error: null
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * POST /api/thread-type-suppliers - Create new link
 */
threadTypeSuppliers.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateThreadTypeSupplierDTO>()

    // Validate required fields
    if (!body.thread_type_id || !body.supplier_id || !body.supplier_item_code) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: thread_type_id, supplier_id, supplier_item_code'
      }, 400)
    }

    // Check if link already exists
    const { data: existing } = await supabase
      .from('thread_type_supplier')
      .select('id')
      .eq('thread_type_id', body.thread_type_id)
      .eq('supplier_id', body.supplier_id)
      .single()

    if (existing) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Loại chỉ này đã được liên kết với nhà cung cấp này'
      }, 409)
    }

    // Check if supplier_item_code is unique for this supplier
    const { data: existingCode } = await supabase
      .from('thread_type_supplier')
      .select('id')
      .eq('supplier_id', body.supplier_id)
      .eq('supplier_item_code', body.supplier_item_code)
      .single()

    if (existingCode) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Mã hàng này đã tồn tại với nhà cung cấp này'
      }, 409)
    }

    // Create link
    const { data, error } = await supabase
      .from('thread_type_supplier')
      .insert({
        thread_type_id: body.thread_type_id,
        supplier_id: body.supplier_id,
        supplier_item_code: body.supplier_item_code,
        unit_price: body.unit_price ?? null,
        notes: body.notes || null,
        is_active: true
      })
      .select(`
        *,
        thread_type:thread_types(id, code, name, material, tex_number, color_id, color_data:colors(id, name, hex_code)),
        supplier:suppliers(id, code, name)
      `)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tạo liên kết: ' + error.message
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations>>({
      data: data as ThreadTypeSupplierWithRelations,
      error: null,
      message: 'Đã liên kết loại chỉ với nhà cung cấp'
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * PATCH /api/thread-type-suppliers/:id - Update link
 */
threadTypeSuppliers.patch('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<UpdateThreadTypeSupplierDTO>()

    // Build update object
    const updateData: Partial<ThreadTypeSupplierRow> = {}
    if (body.supplier_item_code !== undefined) updateData.supplier_item_code = body.supplier_item_code
    if (body.unit_price !== undefined) updateData.unit_price = body.unit_price
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.notes !== undefined) updateData.notes = body.notes

    if (Object.keys(updateData).length === 0) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Không có thông tin cần cập nhật'
      }, 400)
    }

    // If updating supplier_item_code, check uniqueness
    if (body.supplier_item_code) {
      const { data: current } = await supabase
        .from('thread_type_supplier')
        .select('supplier_id')
        .eq('id', id)
        .single()

      if (current) {
        const { data: existingCode } = await supabase
          .from('thread_type_supplier')
          .select('id')
          .eq('supplier_id', current.supplier_id)
          .eq('supplier_item_code', body.supplier_item_code)
          .neq('id', id)
          .single()

        if (existingCode) {
          return c.json<ThreadTypeSupplierApiResponse<null>>({
            data: null,
            error: 'Mã hàng này đã tồn tại với nhà cung cấp này'
          }, 409)
        }
      }
    }

    const { data, error } = await supabase
      .from('thread_type_supplier')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        thread_type:thread_types(id, code, name, material, tex_number, color_id, color_data:colors(id, name, hex_code)),
        supplier:suppliers(id, code, name)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ThreadTypeSupplierApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy liên kết'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật liên kết'
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations>>({
      data: data as ThreadTypeSupplierWithRelations,
      error: null,
      message: 'Đã cập nhật liên kết'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * DELETE /api/thread-type-suppliers/:id - Delete link (hard delete)
 */
threadTypeSuppliers.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    const { data, error } = await supabase
      .from('thread_type_supplier')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ThreadTypeSupplierApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy liên kết'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi xóa liên kết'
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierRow>>({
      data: data as ThreadTypeSupplierRow,
      error: null,
      message: 'Đã xóa liên kết loại chỉ - nhà cung cấp'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

// ============ NESTED ROUTES FOR THREAD TYPES ============

/**
 * GET /api/thread-type-suppliers/by-thread/:threadTypeId - List suppliers for a thread type
 */
threadTypeSuppliers.get('/by-thread/:threadTypeId', async (c) => {
  try {
    const threadTypeId = parseInt(c.req.param('threadTypeId'))
    const isActiveParam = c.req.query('is_active')

    let query = supabase
      .from('thread_type_supplier')
      .select(`
        *,
        thread_type:thread_types(id, code, name, material, tex_number, color_id, color_data:colors(id, name, hex_code)),
        supplier:suppliers(id, code, name, is_active)
      `)
      .eq('thread_type_id', threadTypeId)
      .order('supplier_item_code', { ascending: true })

    // Filter by is_active
    if (isActiveParam !== undefined) {
      query = query.eq('is_active', isActiveParam === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách nhà cung cấp'
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations[]>>({
      data: data as ThreadTypeSupplierWithRelations[],
      error: null,
      message: `Đã tải ${data.length} nhà cung cấp cho loại chỉ này`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * POST /api/thread-type-suppliers/by-thread/:threadTypeId - Link supplier to thread type
 */
threadTypeSuppliers.post('/by-thread/:threadTypeId', async (c) => {
  try {
    const threadTypeId = parseInt(c.req.param('threadTypeId'))
    const body = await c.req.json<LinkSupplierDTO>()

    if (!body.supplier_id || !body.supplier_item_code) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: supplier_id, supplier_item_code'
      }, 400)
    }

    // Check if link already exists
    const { data: existing } = await supabase
      .from('thread_type_supplier')
      .select('id')
      .eq('thread_type_id', threadTypeId)
      .eq('supplier_id', body.supplier_id)
      .single()

    if (existing) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Loại chỉ này đã được liên kết với nhà cung cấp này'
      }, 409)
    }

    // Check if supplier_item_code is unique for this supplier
    const { data: existingCode } = await supabase
      .from('thread_type_supplier')
      .select('id')
      .eq('supplier_id', body.supplier_id)
      .eq('supplier_item_code', body.supplier_item_code)
      .single()

    if (existingCode) {
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Mã hàng này đã tồn tại với nhà cung cấp này'
      }, 409)
    }

    const { data, error } = await supabase
      .from('thread_type_supplier')
      .insert({
        thread_type_id: threadTypeId,
        supplier_id: body.supplier_id,
        supplier_item_code: body.supplier_item_code,
        unit_price: body.unit_price ?? null,
        notes: body.notes || null,
        is_active: true
      })
      .select(`
        *,
        thread_type:thread_types(id, code, name, material, tex_number, color_id, color_data:colors(id, name, hex_code)),
        supplier:suppliers(id, code, name)
      `)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ThreadTypeSupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi liên kết nhà cung cấp: ' + error.message
      }, 500)
    }

    return c.json<ThreadTypeSupplierApiResponse<ThreadTypeSupplierWithRelations>>({
      data: data as ThreadTypeSupplierWithRelations,
      error: null,
      message: 'Đã liên kết nhà cung cấp với loại chỉ'
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ThreadTypeSupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

export default threadTypeSuppliers
