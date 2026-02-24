import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission } from '../middleware/auth'
import { sanitizeFilterValue } from '../utils/sanitize'
import type {
  Employee,
  EmployeeDetail,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  ApiResponse,
  PaginatedResponse,
} from '../types/employee'

const employees = new Hono()

/**
 * GET /api/employees/unique-positions - Fetch all positions from positions table
 * Returns position objects with value (internal name) and label (display name)
 * for proper matching with employees.chuc_vu column
 */
employees.get('/unique-positions', requirePermission('employees.view'), async (c) => {
  try {
    // Fetch ALL positions from the positions table (no filtering by is_active)
    // This ensures the dropdown shows all available positions regardless of status
    const { data, error } = await supabase
      .from('positions')
      .select('name, display_name')
      .order('display_name', { ascending: true })

    // Fallback to default positions if table doesn't exist
    if (error) {
      console.error('Supabase error (falling back to defaults):', error)
      const defaultPositions = [
        { value: 'giam_doc', label: 'Giám Đốc' },
        { value: 'nhan_vien', label: 'Nhân Viên' },
        { value: 'nhan_vien_ky_thuat', label: 'Nhân Viên Kỹ Thuật' },
        { value: 'pho_giam_doc', label: 'Phó Giám Đốc' },
        { value: 'quan_ly', label: 'Quản Lý' },
        { value: 'truong_phong', label: 'Trưởng Phòng' },
      ]
      return c.json<ApiResponse<Array<{ value: string; label: string }>>>({
        data: defaultPositions,
        error: null,
      })
    }

    // Return position objects with value (name) and label (display_name)
    // employees.chuc_vu stores the 'name' field, so value must be 'name'
    const uniquePositions = (data || [])
      .filter(pos => pos.name && pos.display_name)
      .map(pos => ({
        value: pos.name,
        label: pos.display_name,
      }))

    return c.json<ApiResponse<Array<{ value: string; label: string }>>>({
      data: uniquePositions,
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
 * GET /api/employees/count - Get count of active employees
 * Returns the total count of employees where is_active = true
 */
employees.get('/count', requirePermission('employees.view'), async (c) => {
  try {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null)

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Lỗi khi lấy số lượng nhân viên' },
        500
      )
    }

    return c.json<ApiResponse<{ count: number }>>({
      data: { count: count || 0 },
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
 * GET /api/employees/departments - Get unique departments
 * Returns distinct department values from employees table
 */
employees.get('/departments', requirePermission('employees.view'), async (c) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('department')
      .not('department', 'is', null)
      .eq('is_active', true)
      .is('deleted_at', null)

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Lỗi khi lấy danh sách bộ phận' },
        500
      )
    }

    // Extract unique departments
    const uniqueDepartments = [...new Set(
      (data || [])
        .map(e => e.department)
        .filter((d): d is string => !!d)
    )].sort()

    return c.json<ApiResponse<string[]>>({
      data: uniqueDepartments,
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

employees.get('/', requirePermission('employees.view'), async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1', 10)
    const limitParam = c.req.query('limit') || '0'
    const limit = limitParam === 'all' ? 0 : parseInt(limitParam, 10)
    const search = c.req.query('search') || ''

    let query = supabase
      .from('employees')
      .select('id, employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (search) {
      const s = sanitizeFilterValue(search)
      query = query.or(
        `full_name.ilike.%${s}%,employee_id.ilike.%${s}%,department.ilike.%${s}%`
      )
    }

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

    const BATCH_SIZE = 1000
    const allData: Employee[] = []
    let offset = 0

    while (true) {
      let batchQuery = supabase
        .from('employees')
        .select('id, employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1)

      if (search) {
        const s = sanitizeFilterValue(search)
        batchQuery = batchQuery.or(
          `full_name.ilike.%${s}%,employee_id.ilike.%${s}%,department.ilike.%${s}%`
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

employees.get('/:id', requirePermission('employees.view'), async (c) => {
  try {
    const id = c.req.param('id')

    // Guard: skip if id matches a known static route name
    // This prevents parameterized route from capturing static routes
    if (id === 'count' || id === 'unique-positions') {
      return c.notFound()
    }

    // Validate numeric ID format (auto-increment integer)
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'ID không hợp lệ' },
        400
      )
    }

    const { data, error } = await supabase
      .from('employees')
      .select('id, employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at, last_login_at, must_change_password, password_changed_at, failed_login_attempts, locked_until')
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

    return c.json<ApiResponse<EmployeeDetail>>({
      data: data as EmployeeDetail,
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

employees.post('/', requirePermission('employees.create'), async (c) => {
  try {
    const body = await c.req.json<CreateEmployeeDTO & { password?: string }>()

    if (!body.full_name || !body.employee_id || !body.department || !body.chuc_vu) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Vui lòng điền đầy đủ thông tin' },
        400
      )
    }

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

    const employeeCode = body.employee_id.trim()
    const email = `${employeeCode.toLowerCase()}@internal.datchi.local`
    const defaultPassword = body.password || `${employeeCode}@123`

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
    })

    if (authError) {
      console.error('Supabase Auth error:', authError)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Lỗi khi tạo tài khoản đăng nhập' },
        500
      )
    }

    const { data, error } = await supabase
      .from('employees')
      .insert({
        full_name: body.full_name.trim(),
        employee_id: employeeCode,
        department: body.department.trim(),
        chuc_vu: body.chuc_vu.trim(),
        is_active: true,
        auth_user_id: authUser.user.id,
        must_change_password: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      await supabase.auth.admin.deleteUser(authUser.user.id)
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

employees.put('/:id', requirePermission('employees.edit'), async (c) => {
  try {
    const id = c.req.param('id')

    // Validate numeric ID format (auto-increment integer)
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'ID không hợp lệ' },
        400,
      )
    }

    const body = await c.req.json<UpdateEmployeeDTO>()

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

    const updateData: UpdateEmployeeDTO = {}
    if (body.full_name !== undefined) updateData.full_name = body.full_name.trim()
    if (body.employee_id !== undefined) updateData.employee_id = body.employee_id.trim()
    if (body.department !== undefined) updateData.department = body.department.trim()
    if (body.chuc_vu !== undefined) updateData.chuc_vu = body.chuc_vu.trim()

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

employees.delete('/:id', requirePermission('employees.delete'), async (c) => {
  try {
    const id = c.req.param('id')

    const numericId = Number(id)
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'ID không hợp lệ' },
        400,
      )
    }

    const { data: existing, error: findError } = await supabase
      .from('employees')
      .select('id, auth_user_id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Không tìm thấy nhân viên' },
        404
      )
    }

    const { error } = await supabase
      .from('employees')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Supabase error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Xóa thất bại. Vui lòng thử lại' },
        500
      )
    }

    if (existing.auth_user_id) {
      await supabase.auth.admin.updateUserById(existing.auth_user_id, {
        ban_duration: '876000h',
      })
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
