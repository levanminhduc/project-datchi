import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { query, queryOne } from '../db/query'
import { from } from '../db/sql-builder'
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

const BCRYPT_ROUNDS = 10

/**
 * GET /api/employees/unique-positions - Fetch all positions from positions table
 * Returns position objects with value (internal name) and label (display name)
 * for proper matching with employees.chuc_vu column
 */
employees.get('/unique-positions', requirePermission('employees.view'), async (c) => {
  try {
    // Fetch ALL positions from the positions table (no filtering by is_active)
    // This ensures the dropdown shows all available positions regardless of status
    let data: Array<{ name: string | null; display_name: string | null }>
    try {
      data = await from('positions')
        .select('name, display_name')
        .order({ column: 'display_name', ascending: true })
        .list<{ name: string | null; display_name: string | null }>()
    } catch (error) {
      console.error('Database error (falling back to defaults):', error)
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
      .filter((pos): pos is { name: string; display_name: string } => !!pos.name && !!pos.display_name)
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
    let count: number
    try {
      count = await from('employees')
        .eq('is_active', true)
        .is('deleted_at', null)
        .count()
    } catch (error) {
      console.error('Database error:', error)
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

employees.get('/issue-departments', async (c) => {
  try {
    let empData: Array<{ department: string | null }>
    try {
      empData = await from('employees')
        .select('department')
        .isNotNull('department')
        .eq('is_active', true)
        .is('deleted_at', null)
        .list<{ department: string | null }>()
    } catch (error) {
      console.error('Database error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Lỗi khi lấy danh sách bộ phận' },
        500
      )
    }

    let settingValue: { hidden?: string[]; custom?: string[] } | null = null
    try {
      const setting = await from('system_settings')
        .select('value')
        .eq('key', 'issue_department_options')
        .maybeSingle<{ value: { hidden?: string[]; custom?: string[] } }>()
      settingValue = setting?.value ?? null
    } catch (settingErr) {
      console.warn('Failed to load issue_department_options setting:', settingErr)
    }

    const uniqueDepts = [...new Set(
      (empData || [])
        .map(e => e.department)
        .filter((d): d is string => !!d)
    )]

    const config = settingValue ?? {}
    const hidden = config.hidden ?? []
    const custom = config.custom ?? []
    const filtered = uniqueDepts.filter(d => !hidden.includes(d))
    const final = [...new Set([...filtered, ...custom])].sort((a, b) => a.localeCompare(b, 'vi'))

    return c.json<ApiResponse<string[]>>({
      data: final,
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
employees.get('/departments', async (c) => {
  try {
    let data: Array<{ department: string | null }>
    try {
      data = await from('employees')
        .select('department')
        .isNotNull('department')
        .eq('is_active', true)
        .is('deleted_at', null)
        .list<{ department: string | null }>()
    } catch (error) {
      console.error('Database error:', error)
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

    const EMPLOYEE_LIST_COLUMNS = 'id, employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at, locked_until'

    if (limit > 0) {
      const offset = (page - 1) * limit

      const builder = from('employees')
        .select(EMPLOYEE_LIST_COLUMNS)
        .is('deleted_at', null)

      if (search) {
        const s = sanitizeFilterValue(search)
        builder.or([
          { column: 'full_name', op: 'ilike', value: `%${s}%` },
          { column: 'employee_id', op: 'ilike', value: `%${s}%` },
          { column: 'department', op: 'ilike', value: `%${s}%` },
        ])
      }

      let data: Employee[]
      let count: number
      try {
        count = await builder.count()
        data = await builder
          .order({ column: 'created_at', ascending: false })
          .range(offset, offset + limit - 1)
          .list<Employee>()
      } catch (error) {
        console.error('Database error:', error)
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
        locked_until: emp.locked_until,
      }))

      const response: PaginatedResponse<Employee> = {
        data: safeData,
        total: count || 0,
        page,
        pageSize: limit,
      }

      return c.json(response)
    }

    const allData: Employee[] = []

    {
      const batchBuilder = from('employees')
        .select(EMPLOYEE_LIST_COLUMNS)
        .is('deleted_at', null)

      if (search) {
        const s = sanitizeFilterValue(search)
        batchBuilder.or([
          { column: 'full_name', op: 'ilike', value: `%${s}%` },
          { column: 'employee_id', op: 'ilike', value: `%${s}%` },
          { column: 'department', op: 'ilike', value: `%${s}%` },
        ])
      }

      let batchData: Employee[]
      try {
        batchData = await batchBuilder
          .order({ column: 'created_at', ascending: false })
          .list<Employee>()
      } catch (batchError) {
        console.error('Database batch error:', batchError)
        return c.json<ApiResponse<null>>(
          { data: null, error: 'Lỗi khi tải danh sách nhân viên' },
          500
        )
      }

      for (const emp of batchData || []) {
        allData.push({
          id: emp.id,
          employee_id: emp.employee_id,
          full_name: emp.full_name,
          department: emp.department,
          chuc_vu: emp.chuc_vu,
          is_active: emp.is_active,
          created_at: emp.created_at,
          updated_at: emp.updated_at,
          locked_until: emp.locked_until,
        })
      }
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

    let data: EmployeeDetail | null
    try {
      data = await queryOne<EmployeeDetail>(
        `SELECT id, employee_id, full_name, department, chuc_vu, is_active, created_at, updated_at, last_login_at, must_change_password, password_changed_at, failed_login_attempts, locked_until
         FROM employees
         WHERE id = $1`,
        [numericId]
      )
    } catch (error) {
      console.error('Database error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Lỗi khi tải thông tin nhân viên' },
        500
      )
    }

    if (!data) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Không tìm thấy nhân viên' },
        404
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

    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM employees WHERE employee_id = $1',
      [body.employee_id]
    )

    if (existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Mã nhân viên đã tồn tại' },
        409
      )
    }

    const employeeCode = body.employee_id.trim()
    const defaultPassword = body.password || `${employeeCode}@123`
    const passwordHash = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS)

    let data: Employee | null
    try {
      data = await queryOne<Employee>(
        `INSERT INTO employees (full_name, employee_id, department, chuc_vu, is_active, password_hash, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          body.full_name.trim(),
          employeeCode,
          body.department.trim(),
          body.chuc_vu.trim(),
          true,
          passwordHash,
          true,
        ]
      )
    } catch (error) {
      console.error('Create employee error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Lỗi khi thêm nhân viên' },
        500
      )
    }

    return c.json<ApiResponse<Employee>>(
      {
        data: data as Employee,
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

    let existing: { id: number } | null
    try {
      existing = await queryOne<{ id: number }>(
        'SELECT id FROM employees WHERE id = $1',
        [numericId]
      )
    } catch {
      existing = null
    }

    if (!existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Không tìm thấy nhân viên' },
        404
      )
    }

    if (body.employee_id) {
      const duplicate = await queryOne<{ id: number }>(
        'SELECT id FROM employees WHERE employee_id = $1 AND id <> $2',
        [body.employee_id, numericId]
      )

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

    const sets: string[] = []
    const params: unknown[] = []
    for (const [key, value] of Object.entries(updateData)) {
      params.push(value)
      sets.push(`${key} = $${params.length}`)
    }

    let data: Employee | null
    if (sets.length === 0) {
      data = await queryOne<Employee>(
        'SELECT * FROM employees WHERE id = $1',
        [numericId]
      )
    } else {
      params.push(numericId)
      try {
        data = await queryOne<Employee>(
          `UPDATE employees SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
          params
        )
      } catch (error) {
        console.error('Database error:', error)
        return c.json<ApiResponse<null>>(
          { data: null, error: 'Cập nhật thất bại. Vui lòng thử lại' },
          500
        )
      }
    }

    return c.json<ApiResponse<Employee>>({
      data: data as Employee,
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

    let existing: { id: number } | null
    try {
      existing = await queryOne<{ id: number }>(
        'SELECT id FROM employees WHERE id = $1',
        [numericId]
      )
    } catch {
      existing = null
    }

    if (!existing) {
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Không tìm thấy nhân viên' },
        404
      )
    }

    try {
      await query(
        'UPDATE employees SET deleted_at = $1, is_active = $2 WHERE id = $3',
        [new Date().toISOString(), false, numericId]
      )
    } catch (error) {
      console.error('Delete employee error:', error)
      return c.json<ApiResponse<null>>(
        { data: null, error: 'Xóa thất bại. Vui lòng thử lại' },
        500
      )
    }

    try {
      await query(
        `UPDATE auth_refresh_tokens SET revoked_at = $1 WHERE employee_id = $2 AND revoked_at IS NULL`,
        [new Date().toISOString(), numericId]
      )
    } catch (revokeErr) {
      console.warn('Delete employee: failed to revoke refresh tokens:', revokeErr)
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
