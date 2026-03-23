import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import type {
  ColorRow,
  ColorWithSuppliers,
  CreateColorDTO,
  UpdateColorDTO,
  ColorApiResponse
} from '../types/color'

const colors = new Hono()

/**
 * GET /api/colors - List all colors
 * Query params: search, is_active
 */
colors.get('/', requirePermission('thread.colors.view'), async (c) => {
  try {
    const search = c.req.query('search')
    const isActiveParam = c.req.query('is_active')

    let query = supabase
      .from('colors')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    // Filter by is_active (default: only active)
    if (isActiveParam !== undefined) {
      query = query.eq('is_active', isActiveParam === 'true')
    } else {
      query = query.eq('is_active', true)
    }

    // Search by name
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách màu'
      }, 500)
    }

    return c.json<ColorApiResponse<ColorRow[]>>({
      data: data as ColorRow[],
      error: null,
      message: `Đã tải ${data.length} màu`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ColorApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/colors/:id - Get single color with suppliers
 */
colors.get('/:id', requirePermission('thread.colors.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    // Get color with linked suppliers via junction table
    const { data: color, error: colorError } = await supabase
      .from('colors')
      .select('*')
      .eq('id', id)
      .single()

    if (colorError) {
      if (colorError.code === 'PGRST116') {
        return c.json<ColorApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy màu'
        }, 404)
      }
      console.error('Supabase error:', colorError)
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải thông tin màu'
      }, 500)
    }

    // Get linked suppliers
    const { data: links } = await supabase
      .from('color_supplier')
      .select(`
        supplier:suppliers(id, code, name)
      `)
      .eq('color_id', id)

    const result: ColorWithSuppliers = {
      ...color,
      suppliers: links?.map(l => l.supplier).filter(Boolean) || []
    }

    return c.json<ColorApiResponse<ColorWithSuppliers>>({
      data: result,
      error: null
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ColorApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * POST /api/colors - Create new color
 */
colors.post('/', requirePermission('thread.colors.manage'), async (c) => {
  try {
    const body = await c.req.json<CreateColorDTO>()

    // Validate required fields
    if (!body.name || !body.hex_code) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: name, hex_code'
      }, 400)
    }

    // Validate hex_code format
    if (!/^#[0-9A-Fa-f]{6}$/.test(body.hex_code)) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Mã màu hex không hợp lệ (phải là #RRGGBB)'
      }, 400)
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('colors')
      .select('id')
      .ilike('name', body.name)
      .single()

    if (existing) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Tên màu đã tồn tại'
      }, 409)
    }

    // Create color
    const { data, error } = await supabase
      .from('colors')
      .insert({
        name: body.name,
        hex_code: body.hex_code.toUpperCase(),
        pantone_code: body.pantone_code || null,
        ral_code: body.ral_code || null,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tạo màu: ' + error.message
      }, 500)
    }

    return c.json<ColorApiResponse<ColorRow>>({
      data: data as ColorRow,
      error: null,
      message: 'Đã tạo màu mới'
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ColorApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * PATCH /api/colors/:id - Update color
 */
colors.patch('/:id', requirePermission('thread.colors.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const body = await c.req.json<UpdateColorDTO>()

    // Build update object
    const updateData: Partial<ColorRow> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.hex_code !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(body.hex_code)) {
        return c.json<ColorApiResponse<null>>({
          data: null,
          error: 'Mã màu hex không hợp lệ (phải là #RRGGBB)'
        }, 400)
      }
      updateData.hex_code = body.hex_code.toUpperCase()
    }
    if (body.pantone_code !== undefined) updateData.pantone_code = body.pantone_code
    if (body.ral_code !== undefined) updateData.ral_code = body.ral_code
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    if (Object.keys(updateData).length === 0) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Không có thông tin cần cập nhật'
      }, 400)
    }

    // Check name uniqueness if updating name
    if (body.name) {
      const { data: existing } = await supabase
        .from('colors')
        .select('id')
        .ilike('name', body.name)
        .neq('id', id)
        .single()

      if (existing) {
        return c.json<ColorApiResponse<null>>({
          data: null,
          error: 'Tên màu đã tồn tại'
        }, 409)
      }
    }

    const { data, error } = await supabase
      .from('colors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ColorApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy màu'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật màu'
      }, 500)
    }

    return c.json<ColorApiResponse<ColorRow>>({
      data: data as ColorRow,
      error: null,
      message: 'Đã cập nhật màu'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ColorApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * DELETE /api/colors/:id - Soft delete color (set is_active=false)
 */
colors.delete('/:id', requirePermission('thread.colors.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    // Check if color is in use by thread_types
    const { data: usedBy } = await supabase
      .from('thread_types')
      .select('id')
      .eq('color_id', id)
      .limit(1)

    if (usedBy && usedBy.length > 0) {
      const { data, error } = await supabase
        .from('colors')
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return c.json<ColorApiResponse<null>>({
            data: null,
            error: 'Không tìm thấy màu'
          }, 404)
        }
        console.error('Supabase error:', error)
        return c.json<ColorApiResponse<null>>({
          data: null,
          error: 'Lỗi khi xóa màu'
        }, 500)
      }

      return c.json<ColorApiResponse<ColorRow>>({
        data: data as ColorRow,
        error: null,
        message: 'Màu đang được sử dụng, đã chuyển sang trạng thái ngừng dùng'
      })
    }

    const { data, error } = await supabase
      .from('colors')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ColorApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy màu'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Lỗi khi xóa màu'
      }, 500)
    }

    return c.json<ColorApiResponse<ColorRow>>({
      data: data as ColorRow,
      error: null,
      message: 'Đã xóa màu'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ColorApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * GET /api/colors/:id/suppliers - List suppliers for a color
 */
colors.get('/:id/suppliers', requirePermission('thread.colors.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    const { data, error } = await supabase
      .from('color_supplier')
      .select(`
        id,
        color_id,
        supplier_id,
        price_per_kg,
        min_order_qty,
        is_active,
        created_at,
        updated_at,
        supplier:suppliers(id, code, name, contact_name, phone, email, is_active)
      `)
      .eq('color_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tải danh sách nhà cung cấp'
      }, 500)
    }

    return c.json<ColorApiResponse<unknown[]>>({
      data: data,
      error: null,
      message: `Đã tải ${data.length} nhà cung cấp`
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ColorApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * POST /api/colors/:id/suppliers - Link supplier to color
 */
colors.post('/:id/suppliers', requirePermission('thread.colors.manage'), async (c) => {
  try {
    const colorId = parseInt(c.req.param('id'))
    const body = await c.req.json<{ supplier_id: number; price_per_kg?: number; min_order_qty?: number }>()

    if (!body.supplier_id) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: supplier_id'
      }, 400)
    }

    // Check if link already exists
    const { data: existing } = await supabase
      .from('color_supplier')
      .select('id')
      .eq('color_id', colorId)
      .eq('supplier_id', body.supplier_id)
      .single()

    if (existing) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Nhà cung cấp đã được liên kết với màu này'
      }, 409)
    }

    const { data, error } = await supabase
      .from('color_supplier')
      .insert({
        color_id: colorId,
        supplier_id: body.supplier_id,
        price_per_kg: body.price_per_kg || null,
        min_order_qty: body.min_order_qty || null
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Lỗi khi liên kết nhà cung cấp: ' + error.message
      }, 500)
    }

    return c.json<ColorApiResponse<unknown>>({
      data: data,
      error: null,
      message: 'Đã liên kết nhà cung cấp với màu'
    }, 201)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ColorApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * PATCH /api/colors/:id/suppliers/:linkId - Update link pricing
 */
colors.patch('/:id/suppliers/:linkId', requirePermission('thread.colors.manage'), async (c) => {
  try {
    const linkId = parseInt(c.req.param('linkId'))
    const body = await c.req.json<{ price_per_kg?: number | null; min_order_qty?: number | null; is_active?: boolean }>()

    const updateData: Record<string, unknown> = {}
    if (body.price_per_kg !== undefined) updateData.price_per_kg = body.price_per_kg
    if (body.min_order_qty !== undefined) updateData.min_order_qty = body.min_order_qty
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    if (Object.keys(updateData).length === 0) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Không có thông tin cần cập nhật'
      }, 400)
    }

    const { data, error } = await supabase
      .from('color_supplier')
      .update(updateData)
      .eq('id', linkId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ColorApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy liên kết'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Lỗi khi cập nhật liên kết'
      }, 500)
    }

    return c.json<ColorApiResponse<unknown>>({
      data: data,
      error: null,
      message: 'Đã cập nhật thông tin liên kết'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ColorApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

/**
 * DELETE /api/colors/:id/suppliers/:linkId - Unlink supplier from color
 */
colors.delete('/:id/suppliers/:linkId', requirePermission('thread.colors.manage'), async (c) => {
  try {
    const linkId = parseInt(c.req.param('linkId'))

    const { error } = await supabase
      .from('color_supplier')
      .delete()
      .eq('id', linkId)

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ColorApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy liên kết'
        }, 404)
      }
      console.error('Supabase error:', error)
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Lỗi khi xóa liên kết'
      }, 500)
    }

    return c.json<ColorApiResponse<null>>({
      data: null,
      error: null,
      message: 'Đã gỡ liên kết nhà cung cấp'
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ColorApiResponse<null>>({
      data: null,
      error: 'Lỗi hệ thống'
    }, 500)
  }
})

export default colors
