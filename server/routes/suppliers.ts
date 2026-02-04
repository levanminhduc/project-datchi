import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import type {
  SupplierRow,
  SupplierWithColors,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierApiResponse
} from '../types/supplier'

const suppliers = new Hono()

/**
 * GET /api/suppliers - List all suppliers
 * Query params: search, is_active
 */
suppliers.get('/', async (c) => {
  try {
    const search = c.req.query('search')
    const isActiveParam = c.req.query('is_active')

    let query = supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true })

    // Filter by is_active (default: only active)
    if (isActiveParam !== undefined) {
      query = query.eq('is_active', isActiveParam === 'true')
    } else {
      query = query.eq('is_active', true)
    }

    // Search by name or code
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách nhà cung cấp'
      }, 500)
    }

    return c.json<SupplierApiResponse<SupplierRow[]>>({
      data: data as SupplierRow[],
      error: null,
      message: `Đã tải ${data.length} nhà cung cấp`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<SupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/suppliers/:id - Get single supplier with colors
 */
suppliers.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    // Get supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()

    if (supplierError) {
      if (supplierError.code === 'PGRST116') {
        return c.json<SupplierApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy nhà cung cấp'
        }, 404)
      }
      console.error('Supabase error:', supplierError)
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin nhà cung cấp'
      }, 500)
    }

    // Get linked colors
    const { data: links } = await supabase
      .from('color_supplier')
      .select(`
        color:colors(id, name, hex_code)
      `)
      .eq('supplier_id', id)

    const result: SupplierWithColors = {
      ...supplier,
      colors: links?.map(l => l.color).filter(Boolean) || []
    }

    return c.json<SupplierApiResponse<SupplierWithColors>>({
      data: result,
      error: null
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<SupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * POST /api/suppliers - Create new supplier
 */
suppliers.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateSupplierDTO>()

    // Validate required fields
    if (!body.code || !body.name) {
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: code, name'
      }, 400)
    }

    // Check for duplicate code
    const { data: existing } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('code', body.code)
      .single()

    if (existing) {
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Mã nhà cung cấp đã tồn tại'
      }, 409)
    }

    // Create supplier
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        code: body.code.toUpperCase(),
        name: body.name,
        contact_name: body.contact_name || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        lead_time_days: body.lead_time_days ?? 7,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tạo nhà cung cấp: ' + error.message
      }, 500)
    }

    return c.json<SupplierApiResponse<SupplierRow>>({
      data: data as SupplierRow,
      error: null,
      message: 'Đã tạo nhà cung cấp mới'
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<SupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * PATCH /api/suppliers/:id - Update supplier
 */
suppliers.patch('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<UpdateSupplierDTO>()

    // Build update object
    const updateData: Partial<SupplierRow> = {}
    if (body.code !== undefined) updateData.code = body.code.toUpperCase()
    if (body.name !== undefined) updateData.name = body.name
    if (body.contact_name !== undefined) updateData.contact_name = body.contact_name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.address !== undefined) updateData.address = body.address
    if (body.lead_time_days !== undefined) updateData.lead_time_days = body.lead_time_days
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    if (Object.keys(updateData).length === 0) {
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Không có thông tin cần cập nhật'
      }, 400)
    }

    // Check code uniqueness if updating code
    if (body.code) {
      const { data: existing } = await supabase
        .from('suppliers')
        .select('id')
        .ilike('code', body.code)
        .neq('id', id)
        .single()

      if (existing) {
        return c.json<SupplierApiResponse<null>>({
          data: null,
          error: 'Mã nhà cung cấp đã tồn tại'
        }, 409)
      }
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<SupplierApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy nhà cung cấp'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật nhà cung cấp'
      }, 500)
    }

    return c.json<SupplierApiResponse<SupplierRow>>({
      data: data as SupplierRow,
      error: null,
      message: 'Đã cập nhật nhà cung cấp'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<SupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * DELETE /api/suppliers/:id - Soft delete supplier (set is_active=false)
 */
suppliers.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    // Always soft delete for suppliers (maintain history)
    const { data, error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<SupplierApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy nhà cung cấp'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi xóa nhà cung cấp'
      }, 500)
    }

    return c.json<SupplierApiResponse<SupplierRow>>({
      data: data as SupplierRow,
      error: null,
      message: 'Đã chuyển nhà cung cấp sang trạng thái ngừng hợp tác'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<SupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/suppliers/:id/colors - List colors for a supplier
 */
suppliers.get('/:id/colors', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    const { data, error } = await supabase
      .from('color_supplier')
      .select(`
        id,
        is_preferred,
        notes,
        color:colors(id, name, hex_code, pantone_code, is_active)
      `)
      .eq('supplier_id', id)
      .order('is_preferred', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách màu'
      }, 500)
    }

    return c.json<SupplierApiResponse<unknown[]>>({
      data: data,
      error: null,
      message: `Đã tải ${data.length} màu`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<SupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * POST /api/suppliers/:id/colors - Link color to supplier
 */
suppliers.post('/:id/colors', async (c) => {
  try {
    const supplierId = parseInt(c.req.param('id'))
    const body = await c.req.json<{ color_id: number; is_preferred?: boolean; notes?: string }>()

    if (!body.color_id) {
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: color_id'
      }, 400)
    }

    // Check if link already exists
    const { data: existing } = await supabase
      .from('color_supplier')
      .select('id')
      .eq('color_id', body.color_id)
      .eq('supplier_id', supplierId)
      .single()

    if (existing) {
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Màu đã được liên kết với nhà cung cấp này'
      }, 409)
    }

    const { data, error } = await supabase
      .from('color_supplier')
      .insert({
        color_id: body.color_id,
        supplier_id: supplierId,
        is_preferred: body.is_preferred ?? false,
        notes: body.notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi liên kết màu: ' + error.message
      }, 500)
    }

    return c.json<SupplierApiResponse<unknown>>({
      data: data,
      error: null,
      message: 'Đã liên kết màu với nhà cung cấp'
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<SupplierApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

export default suppliers
