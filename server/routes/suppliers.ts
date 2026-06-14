import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import { from } from '../db/sql-builder'
import { requirePermission } from '../middleware/auth'
import { sanitizeFilterValue } from '../utils/sanitize'
import type {
  SupplierRow,

  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierApiResponse
} from '../types/supplier'

const suppliers = new Hono()

/**
 * GET /api/suppliers - List all suppliers
 * Query params: search, is_active
 */
suppliers.get('/', requirePermission('thread.suppliers.view'), async (c) => {
  try {
    const search = c.req.query('search')
    const isActiveParam = c.req.query('is_active')

    const builder = from('suppliers')
      .select('*')
      .is('deleted_at', null)

    // Filter by is_active (default: only active)
    if (isActiveParam !== undefined) {
      builder.eq('is_active', isActiveParam === 'true')
    } else {
      builder.eq('is_active', true)
    }

    // Search by name or code
    if (search) {
      const s = sanitizeFilterValue(search)
      builder.or([
        { column: 'name', op: 'ilike', value: `%${s}%` },
        { column: 'code', op: 'ilike', value: `%${s}%` }
      ])
    }

    builder.order({ column: 'name', ascending: true })

    const data = await builder.list<SupplierRow>()

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
suppliers.get('/:id', requirePermission('thread.suppliers.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    // Get supplier
    const supplier = await queryOne<SupplierRow>(
      'SELECT * FROM suppliers WHERE id = $1',
      [id]
    )

    if (!supplier) {
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy nhà cung cấp'
      }, 404)
    }

    // Get linked colors
    const links = await query<{ color: { id: number; name: string; hex_code: string } | null }>(
      `SELECT json_build_object('id', c.id, 'name', c.name, 'hex_code', c.hex_code) AS color
       FROM color_supplier cs
       JOIN colors c ON c.id = cs.color_id
       WHERE cs.supplier_id = $1`,
      [id]
    )

    // Get unique tex numbers for this supplier via raw SQL (DISTINCT ON)
    const uniqueTexTypes = await query(
      'SELECT * FROM fn_get_supplier_unique_tex($1)',
      [id]
    )

    const result = {
      ...supplier,
      colors: links?.map(l => l.color).filter(Boolean) || [],
      thread_types: uniqueTexTypes || []
    }

    return c.json<SupplierApiResponse<typeof result>>({
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
suppliers.post('/', requirePermission('thread.suppliers.manage'), async (c) => {
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
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM suppliers WHERE code ILIKE $1',
      [body.code]
    )

    if (existing) {
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Mã nhà cung cấp đã tồn tại'
      }, 409)
    }

    // Create supplier
    let data: SupplierRow | null
    try {
      data = await queryOne<SupplierRow>(
        `INSERT INTO suppliers (code, name, contact_name, phone, email, address, lead_time_days, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          body.code.toUpperCase(),
          body.name,
          body.contact_name || null,
          body.phone || null,
          body.email || null,
          body.address || null,
          body.lead_time_days ?? 7,
          true
        ]
      )
    } catch (insertErr) {
      console.error('Insert error:', insertErr)
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi tạo nhà cung cấp: ' + ((insertErr as Error).message ?? '')
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
suppliers.patch('/:id', requirePermission('thread.suppliers.manage'), async (c) => {
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
      const existing = await queryOne<{ id: number }>(
        'SELECT id FROM suppliers WHERE code ILIKE $1 AND id <> $2',
        [body.code, id]
      )

      if (existing) {
        return c.json<SupplierApiResponse<null>>({
          data: null,
          error: 'Mã nhà cung cấp đã tồn tại'
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

    const data = await queryOne<SupplierRow>(
      `UPDATE suppliers SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    )

    if (!data) {
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy nhà cung cấp'
      }, 404)
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
suppliers.delete('/:id', requirePermission('thread.suppliers.manage'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    const data = await queryOne<SupplierRow>(
      `UPDATE suppliers SET is_active = false, deleted_at = $1 WHERE id = $2 RETURNING *`,
      [new Date().toISOString(), id]
    )

    if (!data) {
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Không tìm thấy nhà cung cấp'
      }, 404)
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
suppliers.get('/:id/colors', requirePermission('thread.suppliers.view'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))

    const allData = await query<Record<string, unknown>>(
      `SELECT
         cs.id,
         cs.is_active,
         json_build_object(
           'id', c.id,
           'name', c.name,
           'hex_code', c.hex_code,
           'pantone_code', c.pantone_code,
           'is_active', c.is_active
         ) AS color
       FROM color_supplier cs
       JOIN colors c ON c.id = cs.color_id
       WHERE cs.supplier_id = $1
       ORDER BY cs.created_at DESC`,
      [id]
    )

    return c.json<SupplierApiResponse<unknown[]>>({
      data: allData,
      error: null,
      message: `Đã tải ${allData.length} màu`
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
suppliers.post('/:id/colors', requirePermission('thread.suppliers.manage'), async (c) => {
  try {
    const supplierId = parseInt(c.req.param('id'))
    const body = await c.req.json<{ color_id: number }>()

    if (!body.color_id) {
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Thiếu thông tin bắt buộc: color_id'
      }, 400)
    }

    // Check if link already exists
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM color_supplier WHERE color_id = $1 AND supplier_id = $2',
      [body.color_id, supplierId]
    )

    if (existing) {
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Màu đã được liên kết với nhà cung cấp này'
      }, 409)
    }

    let data: Record<string, unknown> | null
    try {
      data = await queryOne<Record<string, unknown>>(
        `INSERT INTO color_supplier (color_id, supplier_id)
         VALUES ($1, $2)
         RETURNING *`,
        [body.color_id, supplierId]
      )
    } catch (insertErr) {
      console.error('Insert error:', insertErr)
      return c.json<SupplierApiResponse<null>>({
        data: null,
        error: 'Lỗi khi liên kết màu: ' + ((insertErr as Error).message ?? '')
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
