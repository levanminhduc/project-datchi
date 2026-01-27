/**
 * Employee API Routes
 *
 * Provides CRUD endpoints for employee management
 * All responses use structured JSON format: { data, error, message }
 */

import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import type {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  ApiResponse,
  PaginatedResponse,
} from '../types/employee'

// Create router instance
const employees = new Hono()

/**
 * GET /api/employees
 * List all employees with optional pagination and search
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 0 = all, or specify number)
 * - search: Search term for filtering by full_name, employee_id, or department
 */
employees.get('/', async (c) => {
  try {
    // Parse pagination params
    const page = parseInt(c.req.query('page') || '1', 10)
    const limitParam = c.req.query('limit') || '0'
    const limit = limitParam === 'all' ? 0 : parseInt(limitParam, 10)
    const search = c.req.query('search') || ''

    // Build query
    let query = supabase
      .from('employees')
      .select('id, employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply search filter if provided
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,employee_id.ilike.%${search}%,department.ilike.%${search}%`
      )
    }

    // Apply pagination only if limit > 0
    if (limit > 0) {
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Supabase error:', error)
        return c.json<ApiResponse<null>>(
          { data: null, error: 'Lỗi khi tải danh sách nhân viên' },
          500
        )
      }

      // Filter to only include safe fields (exclude sensitive data)
      const safeData = (data || []).map((emp) => ({
        id: emp.id,
        employee_id: emp.employee_id,
        full_name: emp.full_name,
        department: emp.department,
        chuc_vu: emp.chuc_vu,
        is_active: emp.is_active,
        created_at: emp.created_at,
        updated_at: emp.updated_at,
      }))

      const response: PaginatedResponse<Employee> = {
        data: safeData,
        total: count || 0,
        page,
        pageSize: limit,
      }

      return c.json(response)
    }

    // Batch fetching for limit=0 (fetch all) to bypass Supabase's 1000-row max_rows limit
    // Supabase PostgREST enforces max_rows=1000 by default, so we paginate through batches
    const BATCH_SIZE = 1000
    let allData: Employee[] = []
    let offset = 0

    while (true) {
      // Build batch query with same filters
      let batchQuery = supabase
        .from('employees')
        .select('id, employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1)

      // Apply search filter if provided
      if (search) {
        batchQuery = batchQuery.or(
          `full_name.ilike.%${search}%,employee_id.ilike.%${search}%,department.ilike.%${search}%`
        )
      }

      const { data: batchData, error: batchError } = await batchQuery

      if (batchError) {
        console.error('Supabase batch error:', batchError)
        return c.json<ApiResponse<null>>(
          { data: null, error: 'Lỗi khi tải danh sách nhân viên' },
          500
        )
      }

      if (!batchData || batchData.length === 0) break

      // Add batch results to accumulated data (push is more efficient than spread in loops)
      for (const emp of batchData) {
        allData.push({
          id: emp.id,
          employee_id: emp.employee_id,
          full_name: emp.full_name,
          department: emp.department,
          chuc_vu: emp.chuc_vu,
          is_active: emp.is_active,
          created_at: emp.created_at,
          updated_at: emp.updated_at,
        })
      }

      // If this batch returned fewer than BATCH_SIZE, we've reached the end
      if (batchData.length < BATCH_SIZE) break

      offset += BATCH_SIZE
    }

    const response: PaginatedResponse<Employee> = {
      data: allData,
      total: allData.length,
      page: 1,
      pageSize: allData.length,
    }

    return c.json(response)
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

/**
 * GET /api/employees/:id
 * Get a single employee by ID
 */
employees.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const { data, error } = await supabase
      .from('employees')
      .select('id, employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json<ApiResponse<null>>(
          { data: null, error: 'Không tìm thấy nhân viên' },
          404
        )
      }
      console.error('Supabase error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Lỗi khi tải thông tin nhân viên' },
        500
      )
    }

    // Filter to only include safe fields
    const safeData = {
      id: data.id,
      employee_id: data.employee_id,
      full_name: data.full_name,
      department: data.department,
      chuc_vu: data.chuc_vu,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }

    return c.json<ApiResponse<Employee>>({
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
 * POST /api/employees
 * Create a new employee
 *
 * Request body: CreateEmployeeDTO
 */
employees.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateEmployeeDTO>()

    // Validate required fields
    if (!body.full_name || !body.employee_id || !body.department || !body.chuc_vu) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Vui lòng điền đầy đủ thông tin' },
        400
      )
    }

    // Check for duplicate employee_id
    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', body.employee_id)
      .single()

    if (existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Mã nhân viên đã tồn tại' },
        409
      )
    }

    // Insert new employee
    const { data, error } = await supabase
      .from('employees')
      .insert({
        full_name: body.full_name.trim(),
        employee_id: body.employee_id.trim(),
        department: body.department.trim(),
        chuc_vu: body.chuc_vu.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Lỗi khi thêm nhân viên' },
        500
      )
    }

    return c.json<ApiResponse<Employee>>(
      {
        data,
        error: null,
        message: 'Thêm nhân viên thành công',
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
 * PUT /api/employees/:id
 * Update an existing employee
 *
 * Request body: UpdateEmployeeDTO
 */
employees.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<UpdateEmployeeDTO>()

    // Check if employee exists
    const { data: existing, error: findError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Không tìm thấy nhân viên' },
        404
      )
    }

    // Check for duplicate employee_id if updating it
    if (body.employee_id) {
      const { data: duplicate } = await supabase
        .from('employees')
        .select('id')
        .eq('employee_id', body.employee_id)
        .neq('id', id)
        .single()

      if (duplicate) {
        return c.json<ApiResponse<null>>(
          { data: null, error: 'Mã nhân viên đã tồn tại' },
          409
        )
      }
    }

    // Build update object with trimmed values
    const updateData: UpdateEmployeeDTO = {}
    if (body.full_name !== undefined) updateData.full_name = body.full_name.trim()
    if (body.employee_id !== undefined) updateData.employee_id = body.employee_id.trim()
    if (body.department !== undefined) updateData.department = body.department.trim()
    if (body.chuc_vu !== undefined) updateData.chuc_vu = body.chuc_vu.trim()

    // Update employee
    const { data, error } = await supabase
      .from('employees')
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

    return c.json<ApiResponse<Employee>>({
      data,
      error: null,
      message: 'Cập nhật thành công',
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
 * DELETE /api/employees/:id
 * Delete an employee
 */
employees.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')

    // Check if employee exists
    const { data: existing, error: findError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Không tìm thấy nhân viên' },
        404
      )
    }

    // Delete employee
    const { error } = await supabase
      .from('employees')
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
      message: 'Xóa nhân viên thành công',
    })
  } catch (err) {
    console.error('Server error:', err)
    return c.json<ApiResponse<null>>(
      { data: null, error: 'Lỗi hệ thống' },
      500
    )
  }
})

export default employees
