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
import { supabaseAdmin as supabase } from '../db/supabase'
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
    
    let query = supabase
      .from('positions')
      .select('id, name, display_name, is_active, created_at, updated_at')
      .order('display_name', { ascending: true })
    
    // Only filter by is_active if explicitly requested
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Lỗi khi tải danh sách chức vụ' },
        500
      )
    }

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

    const { data, error } = await supabase
      .from('positions')
      .select('id, name, display_name, is_active, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ApiResponse<null>>(
          { data: null, error: 'Không tìm thấy chức vụ' },
          404
        )
      }
      console.error('Supabase error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Lỗi khi tải thông tin chức vụ' },
        500
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
    const { data: existing } = await supabase
      .from('positions')
      .select('id')
      .eq('name', body.name)
      .single()

    if (existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Tên chức vụ đã tồn tại' },
        409
      )
    }

    const { data, error } = await supabase
      .from('positions')
      .insert({
        name: body.name.trim(),
        display_name: body.display_name.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
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

    const { data: existing, error: findError } = await supabase
      .from('positions')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Không tìm thấy chức vụ' },
        404
      )
    }

    // Check for duplicate name if updating name
    if (body.name) {
      const { data: duplicate } = await supabase
        .from('positions')
        .select('id')
        .eq('name', body.name)
        .neq('id', id)
        .single()

      if (duplicate) {
        return c.json<ApiResponse<null>>(
          { data: null, error: 'Tên chức vụ đã tồn tại' },
          409
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.display_name !== undefined) updateData.display_name = body.display_name.trim()
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabase
      .from('positions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
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

    const { data: existing, error: findError } = await supabase
      .from('positions')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Không tìm thấy chức vụ' },
        404
      )
    }

    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Xóa thất bại. Vui lòng thử lại' },
        500
      )
    }

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
