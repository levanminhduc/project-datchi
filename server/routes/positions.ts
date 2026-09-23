/**
 * Positions API Routes
 * 
 * Required database table: positions
 * 
 * CREATE TABLE positions (
 *   id SERIAL PRIMARY KEY,
 *   name VARCHAR(50) UNIQUE NOT NULL,           -- e.g., 'quan_ly', 'nhan_vien', 'truong_phong'
 *   display_name VARCHAR(100) NOT NULL,         -- e.g., 'Quản Lý', 'Nhân Viên', 'Trưởng Phòng'
 *   is_active BOOLEAN DEFAULT TRUE,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Initial data
 * INSERT INTO positions (name, display_name) VALUES
 *   ('quan_ly', 'Quản Lý'),
 *   ('nhan_vien', 'Nhân Viên'),
 *   ('truong_phong', 'Trưởng Phòng');
 */

import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import { from } from '../db/sql-builder'
import { requirePermission } from '../middleware/auth'
import type {
  Position,
  CreatePositionDTO,
  UpdatePositionDTO,
} from '../types/position'
import type { ApiResponse } from '../types/employee'

const positions = new Hono()

positions.use('*', requirePermission('employees.view'))

/**
 * GET /api/positions - Fetch all positions
 * Query params:
 *   - active_only: 'true' to filter only active positions, otherwise returns ALL
 * Returns positions sorted by display_name
 */
positions.get('/', async (c) => {
  try {
    const activeOnly = c.req.query('active_only') === 'true'

    const builder = from('positions')
      .select('id, name, display_name, is_active, created_at, updated_at')

    // Only filter by is_active if explicitly requested
    if (activeOnly) {
      builder.eq('is_active', true)
    }

    builder.order({ column: 'display_name', ascending: true })

    const data = await builder.list<Position>()

    const safeData: Position[] = (data || []).map((pos) => ({
      id: pos.id,
      name: pos.name,
      display_name: pos.display_name,
      is_active: pos.is_active,
      created_at: pos.created_at,
      updated_at: pos.updated_at,
    }))

    return c.json<ApiResponse<Position[]>>({
      data: safeData,
      error: null,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

/**
 * GET /api/positions/:id - Fetch a single position
 */
positions.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const data = await queryOne<Position>(
      'SELECT id, name, display_name, is_active, created_at, updated_at FROM positions WHERE id = $1',
      [id]
    )

    if (!data) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Không tìm thấy chức vụ' },
        404
      )
    }

    const safeData: Position = {
      id: data.id,
      name: data.name,
      display_name: data.display_name,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }

    return c.json<ApiResponse<Position>>({
      data: safeData,
      error: null,
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

/**
 * POST /api/positions - Create a new position
 */
positions.post('/', async (c) => {
  try {
    const body = await c.req.json<CreatePositionDTO>()

    if (!body.name || !body.display_name) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Vui lòng điền đầy đủ thông tin' },
        400
      )
    }

    // Check for duplicate name
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM positions WHERE name = $1',
      [body.name]
    )

    if (existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Tên chức vụ đã tồn tại' },
        409
      )
    }

    const data = await queryOne<Position>(
      `INSERT INTO positions (name, display_name)
       VALUES ($1, $2)
       RETURNING id, name, display_name, is_active, created_at, updated_at`,
      [body.name.trim(), body.display_name.trim()]
    )

    if (!data) {
      console.error('Insert position returned no row')
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Thêm chức vụ thất bại' },
        500
      )
    }

    return c.json<ApiResponse<Position>>(
      {
        data: {
          id: data.id,
          name: data.name,
          display_name: data.display_name,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
        error: null,
        message: 'Thêm chức vụ thành công',
      },
      201
    )
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

/**
 * PUT /api/positions/:id - Update a position
 */
positions.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<UpdatePositionDTO>()

    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM positions WHERE id = $1',
      [id]
    )

    if (!existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Không tìm thấy chức vụ' },
        404
      )
    }

    // Check for duplicate name if updating name
    if (body.name) {
      const duplicate = await queryOne<{ id: number }>(
        'SELECT id FROM positions WHERE name = $1 AND id <> $2',
        [body.name, id]
      )

      if (duplicate) {
        return c.json<ApiResponse<null>>(
          { data: null, error: 'Tên chức vụ đã tồn tại' },
          409
        )
      }
    }

    const sets: string[] = []
    const params: unknown[] = []
    if (body.name !== undefined) {
      params.push(body.name.trim())
      sets.push(`name = $${params.length}`)
    }
    if (body.display_name !== undefined) {
      params.push(body.display_name.trim())
      sets.push(`display_name = $${params.length}`)
    }
    if (body.is_active !== undefined) {
      params.push(body.is_active)
      sets.push(`is_active = $${params.length}`)
    }

    params.push(id)
    const data = await queryOne<Position>(
      `UPDATE positions SET ${sets.join(', ')} WHERE id = $${params.length}
       RETURNING id, name, display_name, is_active, created_at, updated_at`,
      params
    )

    if (!data) {
      console.error('Update position returned no row')
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Cập nhật thất bại. Vui lòng thử lại' },
        500
      )
    }

    return c.json<ApiResponse<Position>>({
      data: {
        id: data.id,
        name: data.name,
        display_name: data.display_name,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      error: null,
      message: 'Cập nhật chức vụ thành công',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

/**
 * DELETE /api/positions/:id - Delete a position
 */
positions.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM positions WHERE id = $1',
      [id]
    )

    if (!existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Không tìm thấy chức vụ' },
        404
      )
    }

    await query('DELETE FROM positions WHERE id = $1', [id])

    return c.json<ApiResponse<{ success: boolean }>>({
      data: { success: true },
      error: null,
      message: 'Xóa chức vụ thành công',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

export default positions
