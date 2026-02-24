import { Hono } from 'hono'
import { supabaseAdmin } from '../db/supabase'
import {
  requireAdmin,
  canManageEmployee,
  type AuthContext,
} from '../middleware/auth'
import { createPermissionSchema, updatePermissionSchema } from '../validation/auth'
import { sanitizeFilterValue } from '../utils/sanitize'

const auth = new Hono()

auth.get('/me', async (c) => {
  const { employeeId } = c.get('auth') as AuthContext

  try {
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select(`
        id,
        employee_id,
        full_name,
        department,
        chuc_vu,
        is_active,
        must_change_password,
        last_login_at,
        created_at
      `)
      .eq('id', employeeId)
      .single()

    if (error || !employee) {
      return c.json({ error: true, message: 'Nhân viên không tồn tại' }, 404)
    }

    const { data: employeeRoles } = await supabaseAdmin
      .from('employee_roles')
      .select('roles(id, code, name, description, level)')
      .eq('employee_id', employeeId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roles = employeeRoles?.map((er: any) => er.roles) ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isRoot = roles.some((r: any) => r.code === 'root')

    return c.json({
      data: {
        id: employee.id,
        employeeId: employee.employee_id,
        fullName: employee.full_name,
        department: employee.department,
        chucVu: employee.chuc_vu,
        isActive: employee.is_active,
        mustChangePassword: employee.must_change_password,
        lastLoginAt: employee.last_login_at,
        createdAt: employee.created_at,
        roles,
        isRoot,
      },
      error: false,
    })
  } catch (err) {
    console.error('Get me error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.get('/permissions', async (c) => {
  const authContext = c.get('auth') as AuthContext & { permissions: string[] }

  if (authContext.isRoot) {
    return c.json({
      data: ['*'],
      error: false,
    })
  }

  return c.json({
    data: authContext.permissions,
    error: false,
  })
})

auth.post('/change-password', async (c) => {
  const { employeeId } = c.get('auth') as AuthContext
  const { currentPassword, newPassword } = await c.req.json()

  if (!currentPassword || !newPassword) {
    return c.json(
      { error: true, message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' },
      400
    )
  }

  if (newPassword.length < 8) {
    return c.json(
      { error: true, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' },
      400
    )
  }

  try {
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('auth_user_id, employee_id')
      .eq('id', employeeId)
      .single()

    if (!employee?.auth_user_id) {
      return c.json({ error: true, message: 'Nhân viên không tồn tại' }, 404)
    }

    const email = `${employee.employee_id.toLowerCase()}@internal.datchi.local`

    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password: currentPassword,
    })

    if (signInError) {
      return c.json({ error: true, message: 'Mật khẩu hiện tại không đúng' }, 401)
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      employee.auth_user_id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Update password error:', updateError)
      return c.json({ error: true, message: 'Không thể đổi mật khẩu' }, 500)
    }

    await supabaseAdmin
      .from('employees')
      .update({
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', employeeId)

    return c.json({
      message: 'Đổi mật khẩu thành công',
      error: false,
    })
  } catch (err) {
    console.error('Change password error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.post('/reset-password/:id', requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))
  const { newPassword } = await c.req.json().catch(() => ({}))

  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      { error: true, message: 'Bạn không có quyền đặt lại mật khẩu cho nhân viên này' },
      403
    )
  }

  if (!newPassword) {
    return c.json(
      { error: true, message: 'Mật khẩu mới là bắt buộc' },
      400
    )
  }

  try {
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('auth_user_id')
      .eq('id', targetId)
      .single()

    if (!employee?.auth_user_id) {
      return c.json({ error: true, message: 'Nhân viên không tồn tại hoặc chưa có tài khoản' }, 404)
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      employee.auth_user_id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Reset password error:', updateError)
      return c.json({ error: true, message: 'Không thể đặt lại mật khẩu' }, 500)
    }

    await supabaseAdmin
      .from('employees')
      .update({
        must_change_password: true,
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq('id', targetId)

    return c.json({
      message: 'Đặt lại mật khẩu thành công',
      error: false,
    })
  } catch (err) {
    console.error('Reset password error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.put('/employees/:id/roles', requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))
  const { roleIds } = await c.req.json()

  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      { error: true, message: 'Bạn không có quyền quản lý nhân viên này' },
      403
    )
  }

  if (!authContext.isRoot) {
    const { data: rootRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'root')
      .single()

    if (rootRole && roleIds?.includes(rootRole.id)) {
      return c.json(
        { error: true, message: 'Chỉ ROOT mới có thể gán vai trò ROOT' },
        403
      )
    }
  }

  try {
    await supabaseAdmin.from('employee_roles').delete().eq('employee_id', targetId)

    if (roleIds?.length > 0) {
      const employeeRoles = roleIds.map((roleId: number) => ({
        employee_id: targetId,
        role_id: roleId,
        assigned_by: authContext.employeeId,
      }))

      await supabaseAdmin.from('employee_roles').insert(employeeRoles)
    }

    return c.json({
      message: 'Cập nhật vai trò thành công',
      error: false,
    })
  } catch (err) {
    console.error('Update employee roles error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.put('/employees/:id/permissions', requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))
  const { permissions } = await c.req.json()

  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      { error: true, message: 'Bạn không có quyền quản lý nhân viên này' },
      403
    )
  }

  try {
    await supabaseAdmin.from('employee_permissions').delete().eq('employee_id', targetId)

    if (permissions?.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const employeePerms = permissions.map((p: any) => ({
        employee_id: targetId,
        permission_id: p.permissionId,
        granted: p.granted ?? true,
        expires_at: p.expiresAt || null,
        assigned_by: authContext.employeeId,
      }))

      await supabaseAdmin.from('employee_permissions').insert(employeePerms)
    }

    return c.json({
      message: 'Cập nhật quyền thành công',
      error: false,
    })
  } catch (err) {
    console.error('Update employee permissions error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.post('/employees/:id/unlock', requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))

  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      { error: true, message: 'Bạn không có quyền mở khóa tài khoản này' },
      403
    )
  }

  try {
    await supabaseAdmin
      .from('employees')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq('id', targetId)

    return c.json({
      message: 'Đã mở khóa tài khoản',
      error: false,
    })
  } catch (err) {
    console.error('Unlock account error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.get('/roles', requireAdmin, async (c) => {
  try {
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('id, code, name, description, level, is_system, is_active')
      .eq('is_active', true)
      .order('level', { ascending: true })

    if (error) {
      console.error('Get roles error:', error)
      return c.json({ error: true, message: 'Không thể tải danh sách vai trò' }, 500)
    }

    return c.json({
      data: roles,
      error: false,
    })
  } catch (err) {
    console.error('Get roles error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.get('/permissions/all', requireAdmin, async (c) => {
  try {
    const { data: permissions, error } = await supabaseAdmin
      .from('permissions')
      .select('id, code, name, description, module, resource, action, route_path, is_page_access, sort_order')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Get permissions error:', error)
      return c.json({ error: true, message: 'Không thể tải danh sách quyền' }, 500)
    }

    return c.json({
      data: permissions,
      error: false,
    })
  } catch (err) {
    console.error('Get permissions error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.post('/permissions', requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext

  if (!authContext.isRoot) {
    return c.json({ success: false, error: 'FORBIDDEN', message: 'Chỉ ROOT mới có thể tạo quyền' }, 403)
  }

  const body = await c.req.json()
  const parsed = createPermissionSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: parsed.error.errors.map((e) => e.message).join(', '),
    }, 400)
  }

  const { code, name, description, module, resource, action, routePath, isPageAccess, sortOrder } = parsed.data

  try {
    const { data: existing } = await supabaseAdmin
      .from('permissions')
      .select('id')
      .eq('code', code)
      .single()

    if (existing) {
      return c.json({ success: false, error: 'DUPLICATE_CODE', message: 'Mã quyền đã tồn tại' }, 409)
    }

    const { data: permission, error } = await supabaseAdmin
      .from('permissions')
      .insert({
        code,
        name,
        description: description || null,
        module,
        resource,
        action,
        route_path: routePath || null,
        is_page_access: isPageAccess ?? false,
        sort_order: sortOrder ?? 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Create permission error:', error)
      return c.json({ success: false, message: 'Không thể tạo quyền' }, 500)
    }

    return c.json({ success: true, data: permission }, 201)
  } catch (err) {
    console.error('Create permission error:', err)
    return c.json({ success: false, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.put('/permissions/:id', requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext

  if (!authContext.isRoot) {
    return c.json({ success: false, error: 'FORBIDDEN', message: 'Chỉ ROOT mới có thể sửa quyền' }, 403)
  }

  const permId = parseInt(c.req.param('id'))
  const body = await c.req.json()

  delete body.code

  const parsed = updatePermissionSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: parsed.error.errors.map((e) => e.message).join(', '),
    }, 400)
  }

  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('permissions')
      .select('id')
      .eq('id', permId)
      .single()

    if (fetchError || !existing) {
      return c.json({ success: false, error: 'NOT_FOUND', message: 'Quyền không tồn tại' }, 404)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = { updated_at: new Date().toISOString() }
    const d = parsed.data
    if (d.name !== undefined) updates.name = d.name
    if (d.description !== undefined) updates.description = d.description
    if (d.module !== undefined) updates.module = d.module
    if (d.resource !== undefined) updates.resource = d.resource
    if (d.action !== undefined) updates.action = d.action
    if (d.routePath !== undefined) updates.route_path = d.routePath
    if (d.isPageAccess !== undefined) updates.is_page_access = d.isPageAccess
    if (d.sortOrder !== undefined) updates.sort_order = d.sortOrder

    const { data: permission, error } = await supabaseAdmin
      .from('permissions')
      .update(updates)
      .eq('id', permId)
      .select()
      .single()

    if (error) {
      console.error('Update permission error:', error)
      return c.json({ success: false, message: 'Không thể cập nhật quyền' }, 500)
    }

    return c.json({ success: true, data: permission })
  } catch (err) {
    console.error('Update permission error:', err)
    return c.json({ success: false, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.delete('/permissions/:id', requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext

  if (!authContext.isRoot) {
    return c.json({ success: false, error: 'FORBIDDEN', message: 'Chỉ ROOT mới có thể xóa quyền' }, 403)
  }

  const permId = parseInt(c.req.param('id'))

  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('permissions')
      .select('id')
      .eq('id', permId)
      .single()

    if (fetchError || !existing) {
      return c.json({ success: false, error: 'NOT_FOUND', message: 'Quyền không tồn tại' }, 404)
    }

    const { count: roleCount } = await supabaseAdmin
      .from('role_permissions')
      .select('id', { count: 'exact', head: true })
      .eq('permission_id', permId)

    const { count: empCount } = await supabaseAdmin
      .from('employee_permissions')
      .select('id', { count: 'exact', head: true })
      .eq('permission_id', permId)

    const totalRoles = roleCount ?? 0
    const totalEmps = empCount ?? 0

    if (totalRoles > 0 || totalEmps > 0) {
      return c.json({
        success: false,
        error: 'IN_USE',
        message: `Không thể xóa quyền đang được sử dụng bởi ${totalRoles} vai trò và ${totalEmps} nhân viên`,
      }, 409)
    }

    const { error } = await supabaseAdmin
      .from('permissions')
      .delete()
      .eq('id', permId)

    if (error) {
      console.error('Delete permission error:', error)
      return c.json({ success: false, message: 'Không thể xóa quyền' }, 500)
    }

    return c.json({ success: true, message: 'Xóa quyền thành công' })
  } catch (err) {
    console.error('Delete permission error:', err)
    return c.json({ success: false, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.post('/roles', requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext
  const { code, name, description, level, permissionIds } = await c.req.json()

  if (!authContext.isRoot) {
    return c.json(
      { error: true, message: 'Chỉ ROOT mới có thể tạo vai trò mới' },
      403
    )
  }

  if (!code || !name) {
    return c.json(
      { error: true, message: 'Mã vai trò và tên là bắt buộc' },
      400
    )
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', code)
      .single()

    if (existing) {
      return c.json(
        { error: true, message: 'Mã vai trò đã tồn tại' },
        409
      )
    }

    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .insert({
        code,
        name,
        description: description || null,
        level: level ?? 99,
        is_system: false,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Create role error:', error)
      return c.json({ error: true, message: 'Không thể tạo vai trò' }, 500)
    }

    if (permissionIds?.length > 0) {
      const rolePerms = permissionIds.map((permId: number) => ({
        role_id: role.id,
        permission_id: permId,
      }))

      await supabaseAdmin.from('role_permissions').insert(rolePerms)
    }

    return c.json({
      data: role,
      message: 'Tạo vai trò thành công',
      error: false,
    })
  } catch (err) {
    console.error('Create role error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.put('/roles/:id', requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext
  const roleId = parseInt(c.req.param('id'))
  const { name, description, level, isActive, permissionIds } = await c.req.json()

  try {
    const { data: existingRole, error: fetchError } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (fetchError || !existingRole) {
      return c.json({ error: true, message: 'Vai trò không tồn tại' }, 404)
    }

    if (!authContext.isRoot) {
      if (existingRole.is_system) {
        return c.json(
          { error: true, message: 'Chỉ ROOT mới có thể sửa vai trò hệ thống' },
          403
        )
      }
      if (level !== undefined && level < 2) {
        return c.json(
          { error: true, message: 'Chỉ ROOT mới có thể đặt level < 2' },
          403
        )
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (level !== undefined) updates.level = level
    if (isActive !== undefined) updates.is_active = isActive

    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .update(updates)
      .eq('id', roleId)
      .select()
      .single()

    if (error) {
      console.error('Update role error:', error)
      return c.json({ error: true, message: 'Không thể cập nhật vai trò' }, 500)
    }

    if (permissionIds !== undefined) {
      await supabaseAdmin.from('role_permissions').delete().eq('role_id', roleId)

      if (permissionIds.length > 0) {
        const rolePerms = permissionIds.map((permId: number) => ({
          role_id: roleId,
          permission_id: permId,
        }))
        await supabaseAdmin.from('role_permissions').insert(rolePerms)
      }
    }

    return c.json({
      data: role,
      message: 'Cập nhật vai trò thành công',
      error: false,
    })
  } catch (err) {
    console.error('Update role error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.delete('/roles/:id', requireAdmin, async (c) => {
  const authContext = c.get('auth') as AuthContext
  const roleId = parseInt(c.req.param('id'))

  if (!authContext.isRoot) {
    return c.json(
      { error: true, message: 'Chỉ ROOT mới có thể xóa vai trò' },
      403
    )
  }

  try {
    const { data: role, error: fetchError } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (fetchError || !role) {
      return c.json({ error: true, message: 'Vai trò không tồn tại' }, 404)
    }

    if (role.is_system) {
      return c.json(
        { error: true, message: 'Không thể xóa vai trò hệ thống' },
        403
      )
    }

    const { error } = await supabaseAdmin
      .from('roles')
      .delete()
      .eq('id', roleId)

    if (error) {
      console.error('Delete role error:', error)
      return c.json({ error: true, message: 'Không thể xóa vai trò' }, 500)
    }

    return c.json({
      message: 'Xóa vai trò thành công',
      error: false,
    })
  } catch (err) {
    console.error('Delete role error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.get('/roles/:id/permissions', requireAdmin, async (c) => {
  const roleId = parseInt(c.req.param('id'))

  try {
    const { data: rolePerms, error } = await supabaseAdmin
      .from('role_permissions')
      .select('permissions(*)')
      .eq('role_id', roleId)

    if (error) {
      console.error('Get role permissions error:', error)
      return c.json({ error: true, message: 'Không thể tải quyền của vai trò' }, 500)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permissions = rolePerms?.map((rp: any) => rp.permissions) ?? []

    return c.json({
      data: permissions,
      error: false,
    })
  } catch (err) {
    console.error('Get role permissions error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.get('/employees/search', requireAdmin, async (c) => {
  const query = c.req.query('q') || ''
  const limit = parseInt(c.req.query('limit') || '20')

  try {
    let queryBuilder = supabaseAdmin
      .from('employees')
      .select('id, employee_id, full_name, department, chuc_vu, is_active')
      .eq('is_active', true)
      .order('full_name', { ascending: true })
      .limit(limit)

    if (query) {
      const q = sanitizeFilterValue(query)
      queryBuilder = queryBuilder.or(
        `employee_id.ilike.%${q}%,full_name.ilike.%${q}%`
      )
    }

    const { data: employees, error } = await queryBuilder

    if (error) {
      console.error('Search employees error:', error)
      return c.json({ error: true, message: 'Không thể tìm kiếm nhân viên' }, 500)
    }

    const mappedEmployees = (employees || []).map((emp) => ({
      id: emp.id,
      employeeId: emp.employee_id,
      fullName: emp.full_name,
      department: emp.department,
      chucVu: emp.chuc_vu,
      isActive: emp.is_active,
    }))

    return c.json({
      data: mappedEmployees,
      error: false,
    })
  } catch (err) {
    console.error('Search employees error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.get('/employees/:id/roles-permissions', requireAdmin, async (c) => {
  const employeeId = parseInt(c.req.param('id'))

  try {
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, employee_id, full_name, department, chuc_vu')
      .eq('id', employeeId)
      .single()

    if (empError || !employee) {
      return c.json({ error: true, message: 'Không tìm thấy nhân viên' }, 404)
    }

    const { data: employeeRoles } = await supabaseAdmin
      .from('employee_roles')
      .select('roles(id, code, name, description, level, is_system, is_active)')
      .eq('employee_id', employeeId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roles = employeeRoles?.map((er: any) => er.roles).filter(Boolean) ?? []

    const isRoot = roles.some((r: { code: string }) => r.code === 'ROOT')

    const { data: employeePerms } = await supabaseAdmin
      .from('employee_permissions')
      .select('permission_id, granted, expires_at, permissions(id, code, name, module, action, description)')
      .eq('employee_id', employeeId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const directPermissions = employeePerms?.map((ep: any) => ({
      permission: ep.permissions,
      granted: ep.granted,
      expiresAt: ep.expires_at,
    })).filter((dp: { permission: unknown }) => dp.permission) ?? []

    let effectivePermissions: string[] = []

    if (isRoot) {
      effectivePermissions = ['*']
    } else {
      const roleIds = roles.map((r: { id: number }) => r.id)
      if (roleIds.length > 0) {
        const { data: rolePerms } = await supabaseAdmin
          .from('role_permissions')
          .select('permissions(code)')
          .in('role_id', roleIds)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rolePermCodes = rolePerms?.map((rp: any) => rp.permissions?.code).filter(Boolean) ?? []
        effectivePermissions = [...new Set(rolePermCodes)]
      }

      for (const dp of directPermissions) {
        const code = dp.permission?.code
        if (!code) continue

        if (dp.granted) {
          if (!effectivePermissions.includes(code)) {
            effectivePermissions.push(code)
          }
        } else {
          effectivePermissions = effectivePermissions.filter((p) => p !== code)
        }
      }
    }

    return c.json({
      data: {
        employee: {
          id: employee.id,
          employeeId: employee.employee_id,
          fullName: employee.full_name,
          department: employee.department,
          chucVu: employee.chuc_vu,
        },
        roles,
        directPermissions,
        effectivePermissions,
        isRoot,
      },
      error: false,
    })
  } catch (err) {
    console.error('Get employee roles/permissions error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

export default auth
