import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import { from } from '../db/sql-builder'
import { requirePermission } from '../middleware/auth'
import type {
  ColorRow,
  ColorWithSuppliers,
  CreateColorDTO,
  UpdateColorDTO,
  ColorApiResponse,
  SupplierSummary
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

    const builder = from('colors')
      .select('*')
      .is('deleted_at', null)

    // Filter by is_active (default: only active)
    if (isActiveParam !== undefined) {
      builder.eq('is_active', isActiveParam === 'true')
    } else {
      builder.eq('is_active', true)
    }

    // Search by name
    if (search) {
      builder.ilike('name', `%${search}%`)
    }

    builder.order({ column: 'name', ascending: true })

    const data = await builder.list<ColorRow>()

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
    const color = await queryOne<ColorRow>(
      'SELECT * FROM colors WHERE id = $1',
      [id]
    )

    if (!color) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy màu'
      }, 404)
    }

    // Get linked suppliers
    const links = await query<{ supplier: { id: number; code: string; name: string } | null }>(
      `SELECT json_build_object('id', s.id, 'code', s.code, 'name', s.name) AS supplier
       FROM color_supplier cs
       JOIN suppliers s ON s.id = cs.supplier_id
       WHERE cs.color_id = $1`,
      [id]
    )

    const result: ColorWithSuppliers = {
      ...color,
      suppliers: links?.map(l => l.supplier).filter((s): s is SupplierSummary => s !== null) || []
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
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM colors WHERE name ILIKE $1',
      [body.name]
    )

    if (existing) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Tên màu đã tồn tại'
      }, 409)
    }

    // Create color
    let data: ColorRow | null
    try {
      data = await queryOne<ColorRow>(
        `INSERT INTO colors (name, hex_code, pantone_code, ral_code, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          body.name,
          body.hex_code.toUpperCase(),
          body.pantone_code || null,
          body.ral_code || null,
          true
        ]
      )
    } catch (insertErr) {
      console.error('Insert error:', insertErr)
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tạo màu: ' + ((insertErr as Error).message ?? '')
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
      const existing = await queryOne<{ id: number }>(
        'SELECT id FROM colors WHERE name ILIKE $1 AND id <> $2',
        [body.name, id]
      )

      if (existing) {
        return c.json<ColorApiResponse<null>>({
          data: null,
          error: 'Tên màu đã tồn tại'
        }, 409)
      }
    }

    const sets: string[] = []
    const params: unknown[] = []
    for (const [key, value] of Object.entries(updateData)) {
      params.push(value)
      sets.push(`${key} = $${params.length}`)
    }
    params.push(id)

    const data = await queryOne<ColorRow>(
      `UPDATE colors SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    )

    if (!data) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy màu'
      }, 404)
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
    const usedBy = await query<{ id: number }>(
      'SELECT id FROM thread_types WHERE color_id = $1 LIMIT 1',
      [id]
    )

    if (usedBy && usedBy.length > 0) {
      const data = await queryOne<ColorRow>(
        `UPDATE colors SET is_active = false, deleted_at = $1 WHERE id = $2 RETURNING *`,
        [new Date().toISOString(), id]
      )

      if (!data) {
        return c.json<ColorApiResponse<null>>({
          data: null,
          error: 'Không tìm thấy màu'
        }, 404)
      }

      return c.json<ColorApiResponse<ColorRow>>({
        data: data as ColorRow,
        error: null,
        message: 'Màu đang được sử dụng, đã chuyển sang trạng thái ngừng dùng'
      })
    }

    const data = await queryOne<ColorRow>(
      `UPDATE colors SET is_active = false, deleted_at = $1 WHERE id = $2 RETURNING *`,
      [new Date().toISOString(), id]
    )

    if (!data) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy màu'
      }, 404)
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

    const data = await query<Record<string, unknown>>(
      `SELECT
         cs.id,
         cs.color_id,
         cs.supplier_id,
         cs.price_per_kg,
         cs.min_order_qty,
         cs.is_active,
         cs.created_at,
         cs.updated_at,
         json_build_object(
           'id', s.id,
           'code', s.code,
           'name', s.name,
           'contact_name', s.contact_name,
           'phone', s.phone,
           'email', s.email,
           'is_active', s.is_active
         ) AS supplier
       FROM color_supplier cs
       JOIN suppliers s ON s.id = cs.supplier_id
       WHERE cs.color_id = $1
       ORDER BY cs.created_at DESC`,
      [id]
    )

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
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM color_supplier WHERE color_id = $1 AND supplier_id = $2',
      [colorId, body.supplier_id]
    )

    if (existing) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Nhà cung cấp đã được liên kết với màu này'
      }, 409)
    }

    let data: Record<string, unknown> | null
    try {
      data = await queryOne<Record<string, unknown>>(
        `INSERT INTO color_supplier (color_id, supplier_id, price_per_kg, min_order_qty)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          colorId,
          body.supplier_id,
          body.price_per_kg || null,
          body.min_order_qty || null
        ]
      )
    } catch (insertErr) {
      console.error('Insert error:', insertErr)
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Lỗi khi liên kết nhà cung cấp: ' + ((insertErr as Error).message ?? '')
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

    const sets: string[] = []
    const params: unknown[] = []
    for (const [key, value] of Object.entries(updateData)) {
      params.push(value)
      sets.push(`${key} = $${params.length}`)
    }
    params.push(linkId)

    const data = await queryOne<Record<string, unknown>>(
      `UPDATE color_supplier SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    )

    if (!data) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy liên kết'
      }, 404)
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

    const deleted = await query<{ id: number }>(
      'DELETE FROM color_supplier WHERE id = $1 RETURNING id',
      [linkId]
    )

    if (!deleted || deleted.length === 0) {
      return c.json<ColorApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy liên kết'
      }, 404)
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
