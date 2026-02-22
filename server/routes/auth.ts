// server/routes/auth.ts

import { Hono } from 'hono'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { supabaseAdmin } from '../db/supabase'
import {
  requireAdmin,
  canManageEmployee,
  type AuthContext,
  type JwtPayload,
} from '../middleware/auth'
import { createPermissionSchema, updatePermissionSchema } from '../validation/auth'
import { sanitizeFilterValue } from '../utils/sanitize'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

const auth = new Hono()

// ============================================================
// PUBLIC ROUTES (no auth required)
// ============================================================

/**
 * POST /api/auth/login - Authenticate employee
 *
 * Request: { employeeId: "NV001", password: "..." }
 * Response: { accessToken, refreshToken, employee }
 */
auth.post('/login', async (c) => {
  const { employeeId, password } = await c.req.json()

  if (!employeeId || !password) {
    return c.json(
      {
        error: true,
        message: 'Vui lòng nhập mã nhân viên và mật khẩu',
      },
      400
    )
  }

  try {
    // Find employee by employee_id (Mã NV)
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select(
        `
        id,
        employee_id,
        full_name,
        department,
        chuc_vu,
        is_active,
        password_hash,
        failed_login_attempts,
        locked_until,
        must_change_password,
        last_login_at
      `
      )
      .eq('employee_id', employeeId)
      .single()

    if (error || !employee) {
      return c.json(
        {
          error: true,
          message: 'Mã nhân viên hoặc mật khẩu không đúng',
        },
        401
      )
    }

    // Check if account is locked
    if (employee.locked_until) {
      const lockExpiry = new Date(employee.locked_until)
      if (lockExpiry > new Date()) {
        const minutesLeft = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000)
        return c.json(
          {
            error: true,
            message: `Tài khoản bị khóa. Vui lòng thử lại sau ${minutesLeft} phút.`,
          },
          423
        )
      }
    }

    // Check if account is active (using is_active field)
    if (!employee.is_active) {
      return c.json(
        {
          error: true,
          message: 'Tài khoản đã bị vô hiệu hóa. Liên hệ quản trị viên.',
        },
        403
      )
    }

    // Check if password is set
    if (!employee.password_hash) {
      return c.json(
        {
          error: true,
          message: 'Tài khoản chưa được thiết lập mật khẩu. Liên hệ quản trị viên.',
        },
        403
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, employee.password_hash)

    if (!isValidPassword) {
      // Increment failed attempts
      const newAttempts = (employee.failed_login_attempts || 0) + 1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: any = { failed_login_attempts: newAttempts }

      // Lock account after 5 failed attempts (30 minutes)
      if (newAttempts >= 5) {
        updates.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      }

      await supabaseAdmin.from('employees').update(updates).eq('id', employee.id)

      return c.json(
        {
          error: true,
          message: 'Mã nhân viên hoặc mật khẩu không đúng',
        },
        401
      )
    }

    // Successful login - reset failed attempts and update last_login
    await supabaseAdmin
      .from('employees')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', employee.id)

    // Get employee roles
    const { data: employeeRoles } = await supabaseAdmin
      .from('employee_roles')
      .select('roles(id, code, name, level)')
      .eq('employee_id', employee.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roles = employeeRoles?.map((er: any) => er.roles) ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleCodes = roles.map((r: any) => r.code)
    const isRoot = roleCodes.includes('root')

    // Generate tokens
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: employee.id,
      employeeId: employee.employee_id,
      roles: roleCodes,
      isRoot,
    }

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    })

    const refreshToken = jwt.sign({ sub: employee.id, type: 'refresh' }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    })

    // Store refresh token hash in database (for revocation)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10)
    await supabaseAdmin.from('employee_refresh_tokens').insert({
      employee_id: employee.id,
      token_hash: refreshTokenHash,
      expires_at: new Date(Date.now() + parseDuration(REFRESH_TOKEN_EXPIRES_IN)).toISOString(),
    })

    // Clean up old refresh tokens for this employee (keep last 5)
    const { data: oldTokens } = await supabaseAdmin
      .from('employee_refresh_tokens')
      .select('id')
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false })
      .range(5, 1000)

    if (oldTokens?.length) {
      await supabaseAdmin
        .from('employee_refresh_tokens')
        .delete()
        .in(
          'id',
          oldTokens.map((t) => t.id)
        )
    }

    // Return response (exclude sensitive fields)
    const { password_hash, failed_login_attempts, locked_until, ...safeEmployee } = employee

    return c.json({
      data: {
        accessToken,
        refreshToken,
        employee: {
          ...safeEmployee,
          roles,
          isRoot,
        },
        mustChangePassword: employee.must_change_password,
      },
      error: false,
    })
  } catch (err) {
    console.error('Login error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

/**
 * POST /api/auth/refresh - Refresh access token
 *
 * Request: { refreshToken: "..." }
 * Response: { accessToken }
 */
auth.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json()

  if (!refreshToken) {
    return c.json({ error: true, message: 'Refresh token là bắt buộc' }, 400)
  }

  try {
    // Verify refresh token
    const payload = jwt.verify(refreshToken, JWT_SECRET) as { sub: number; type: string }

    if (payload.type !== 'refresh') {
      return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
    }

    // Check if refresh token exists in database (not revoked)
    const { data: storedTokens } = await supabaseAdmin
      .from('employee_refresh_tokens')
      .select('id, token_hash, expires_at')
      .eq('employee_id', payload.sub)
      .gte('expires_at', new Date().toISOString())

    // Find matching token
    let validToken = null
    for (const stored of storedTokens ?? []) {
      const isMatch = await bcrypt.compare(refreshToken, stored.token_hash)
      if (isMatch) {
        validToken = stored
        break
      }
    }

    if (!validToken) {
      return c.json({ error: true, message: 'Refresh token đã hết hạn hoặc bị thu hồi' }, 401)
    }

    // Get fresh employee data
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('id, employee_id, is_active')
      .eq('id', payload.sub)
      .single()

    if (!employee || !employee.is_active) {
      // Revoke all tokens if account is inactive
      await supabaseAdmin.from('employee_refresh_tokens').delete().eq('employee_id', payload.sub)

      return c.json({ error: true, message: 'Tài khoản không còn hoạt động' }, 401)
    }

    // Get current roles
    const { data: employeeRoles } = await supabaseAdmin
      .from('employee_roles')
      .select('roles(code)')
      .eq('employee_id', employee.id)

    const roleCodes =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      employeeRoles?.map((er: any) => er.roles?.code).filter(Boolean) ?? []
    const isRoot = roleCodes.includes('root')

    // Generate new access token
    const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: employee.id,
      employeeId: employee.employee_id,
      roles: roleCodes,
      isRoot,
    }

    const accessToken = jwt.sign(newPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    })

    return c.json({
      data: { accessToken },
      error: false,
    })
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return c.json({ error: true, message: 'Refresh token đã hết hạn' }, 401)
    }
    console.error('Refresh error:', err)
    return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
  }
})

// ============================================================
// PROTECTED ROUTES (auth required)
// ============================================================

/**
 * POST /api/auth/logout - Revoke refresh token
 */
auth.post('/logout', async (c) => {
  const authContext = c.get('auth') as AuthContext
  const { refreshToken } = await c.req.json().catch(() => ({}))

  try {
    if (refreshToken) {
      // Revoke specific token
      const { data: storedTokens } = await supabaseAdmin
        .from('employee_refresh_tokens')
        .select('id, token_hash')
        .eq('employee_id', authContext.employeeId)

      for (const stored of storedTokens ?? []) {
        const isMatch = await bcrypt.compare(refreshToken, stored.token_hash)
        if (isMatch) {
          await supabaseAdmin.from('employee_refresh_tokens').delete().eq('id', stored.id)
          break
        }
      }
    } else {
      // Revoke all tokens for this employee
      await supabaseAdmin
        .from('employee_refresh_tokens')
        .delete()
        .eq('employee_id', authContext.employeeId)
    }

    return c.json({
      message: 'Đăng xuất thành công',
      error: false,
    })
  } catch (err) {
    console.error('Logout error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

/**
 * GET /api/auth/me - Get current employee profile
 */
auth.get('/me', async (c) => {
  const { employeeId } = c.get('auth') as AuthContext

  try {
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select(
        `
        id,
        employee_id,
        full_name,
        department,
        chuc_vu,
        is_active,
        must_change_password,
        last_login_at,
        created_at
      `
      )
      .eq('id', employeeId)
      .single()

    if (error || !employee) {
      return c.json({ error: true, message: 'Nhân viên không tồn tại' }, 404)
    }

    // Get roles
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
        ...employee,
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

/**
 * GET /api/auth/permissions - Get current employee's permissions
 */
auth.get('/permissions', async (c) => {
  const authContext = c.get('auth') as AuthContext & { permissions: string[] }

  // ROOT gets wildcard permission
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

/**
 * POST /api/auth/change-password - Change own password
 */
auth.post('/change-password', async (c) => {
  const { employeeId } = c.get('auth') as AuthContext
  const { currentPassword, newPassword } = await c.req.json()

  if (!currentPassword || !newPassword) {
    return c.json(
      {
        error: true,
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới',
      },
      400
    )
  }

  if (newPassword.length < 8) {
    return c.json(
      {
        error: true,
        message: 'Mật khẩu mới phải có ít nhất 8 ký tự',
      },
      400
    )
  }

  try {
    // Get current password hash
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('password_hash')
      .eq('id', employeeId)
      .single()

    if (!employee) {
      return c.json({ error: true, message: 'Nhân viên không tồn tại' }, 404)
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, employee.password_hash)
    if (!isValid) {
      return c.json({ error: true, message: 'Mật khẩu hiện tại không đúng' }, 401)
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12)

    // Update password
    await supabaseAdmin
      .from('employees')
      .update({
        password_hash: newHash,
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', employeeId)

    // Revoke all refresh tokens (force re-login on other devices)
    await supabaseAdmin.from('employee_refresh_tokens').delete().eq('employee_id', employeeId)

    return c.json({
      message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.',
      error: false,
    })
  } catch (err) {
    console.error('Change password error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

// ============================================================
// ADMIN ROUTES
// ============================================================

/**
 * POST /api/auth/reset-password/:id - Admin: Reset employee password
 */
auth.post('/reset-password/:id', requireAdmin,async (c) => {
  const authContext = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))
  const { newPassword } = await c.req.json().catch(() => ({}))

  // Check if can manage this employee
  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      {
        error: true,
        message: 'Bạn không có quyền đặt lại mật khẩu cho nhân viên này',
      },
      403
    )
  }

  if (!newPassword) {
    return c.json(
      {
        error: true,
        message: 'Mật khẩu mới là bắt buộc',
      },
      400
    )
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 12)

    await supabaseAdmin
      .from('employees')
      .update({
        password_hash: passwordHash,
        must_change_password: true, // Force change on next login
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq('id', targetId)

    // Revoke all refresh tokens
    await supabaseAdmin.from('employee_refresh_tokens').delete().eq('employee_id', targetId)

    return c.json({
      message: 'Đặt lại mật khẩu thành công',
      error: false,
    })
  } catch (err) {
    console.error('Reset password error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

/**
 * PUT /api/auth/employees/:id/roles - Admin: Update employee roles
 */
auth.put('/employees/:id/roles', requireAdmin,async (c) => {
  const authContext = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))
  const { roleIds } = await c.req.json()

  // Check if can manage this employee
  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      {
        error: true,
        message: 'Bạn không có quyền quản lý nhân viên này',
      },
      403
    )
  }

  // Check if trying to assign ROOT role (only ROOT can do this)
  if (!authContext.isRoot) {
    const { data: rootRole } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'root')
      .single()

    if (rootRole && roleIds?.includes(rootRole.id)) {
      return c.json(
        {
          error: true,
          message: 'Chỉ ROOT mới có thể gán vai trò ROOT',
        },
        403
      )
    }
  }

  try {
    // Delete existing roles
    await supabaseAdmin.from('employee_roles').delete().eq('employee_id', targetId)

    // Insert new roles
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

/**
 * PUT /api/auth/employees/:id/permissions - Admin: Update direct permissions
 */
auth.put('/employees/:id/permissions', requireAdmin,async (c) => {
  const authContext = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))
  const { permissions } = await c.req.json() // [{ permissionId, granted, expiresAt }]

  // Check if can manage this employee
  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      {
        error: true,
        message: 'Bạn không có quyền quản lý nhân viên này',
      },
      403
    )
  }

  try {
    // Delete existing direct permissions
    await supabaseAdmin.from('employee_permissions').delete().eq('employee_id', targetId)

    // Insert new permissions
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

/**
 * POST /api/auth/employees/:id/unlock - Admin: Unlock locked account
 */
auth.post('/employees/:id/unlock', requireAdmin,async (c) => {
  const authContext = c.get('auth') as AuthContext
  const targetId = parseInt(c.req.param('id'))

  // Check if can manage this employee
  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      {
        error: true,
        message: 'Bạn không có quyền mở khóa tài khoản này',
      },
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

/**
 * GET /api/auth/roles - Get all available roles
 */
auth.get('/roles', requireAdmin,async (c) => {
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

/**
 * GET /api/auth/permissions/all - Get all available permissions
 */
auth.get('/permissions/all', requireAdmin,async (c) => {
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

// ============================================================
// ROOT-ONLY ROUTES (Permissions Management)
// ============================================================

/**
 * POST /api/auth/permissions - Create new permission (ROOT only)
 */
auth.post('/permissions', requireAdmin,async (c) => {
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
    // Check for duplicate code
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

/**
 * PUT /api/auth/permissions/:id - Update permission (ROOT only)
 */
auth.put('/permissions/:id', requireAdmin,async (c) => {
  const authContext = c.get('auth') as AuthContext

  if (!authContext.isRoot) {
    return c.json({ success: false, error: 'FORBIDDEN', message: 'Chỉ ROOT mới có thể sửa quyền' }, 403)
  }

  const permId = parseInt(c.req.param('id'))
  const body = await c.req.json()

  // Remove code field if present (not updatable)
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
    // Check if permission exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('permissions')
      .select('id')
      .eq('id', permId)
      .single()

    if (fetchError || !existing) {
      return c.json({ success: false, error: 'NOT_FOUND', message: 'Quyền không tồn tại' }, 404)
    }

    // Build update object (snake_case for DB)
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

/**
 * DELETE /api/auth/permissions/:id - Delete permission (ROOT only)
 */
auth.delete('/permissions/:id', requireAdmin,async (c) => {
  const authContext = c.get('auth') as AuthContext

  if (!authContext.isRoot) {
    return c.json({ success: false, error: 'FORBIDDEN', message: 'Chỉ ROOT mới có thể xóa quyền' }, 403)
  }

  const permId = parseInt(c.req.param('id'))

  try {
    // Check if permission exists
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('permissions')
      .select('id')
      .eq('id', permId)
      .single()

    if (fetchError || !existing) {
      return c.json({ success: false, error: 'NOT_FOUND', message: 'Quyền không tồn tại' }, 404)
    }

    // Check usage in role_permissions
    const { count: roleCount } = await supabaseAdmin
      .from('role_permissions')
      .select('id', { count: 'exact', head: true })
      .eq('permission_id', permId)

    // Check usage in employee_permissions
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

// ============================================================
// ROOT-ONLY ROUTES (Roles Management)
// ============================================================

/**
 * POST /api/auth/roles - Create new role (ROOT only)
 */
auth.post('/roles', requireAdmin,async (c) => {
  const authContext = c.get('auth') as AuthContext
  const { code, name, description, level, permissionIds } = await c.req.json()

  // Only ROOT can create roles
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
    // Check if code already exists
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

    // Create role
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

    // Add permissions if provided
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

/**
 * PUT /api/auth/roles/:id - Update role (ROOT only)
 */
auth.put('/roles/:id', requireAdmin,async (c) => {
  const authContext = c.get('auth') as AuthContext
  const roleId = parseInt(c.req.param('id'))
  const { name, description, level, isActive, permissionIds } = await c.req.json()

  try {
    // Get existing role
    const { data: existingRole, error: fetchError } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (fetchError || !existingRole) {
      return c.json({ error: true, message: 'Vai trò không tồn tại' }, 404)
    }

    // Only ROOT can modify system roles or change level
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

    // Build update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (level !== undefined) updates.level = level
    if (isActive !== undefined) updates.is_active = isActive

    // Update role
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

    // Update permissions if provided
    if (permissionIds !== undefined) {
      // Delete existing
      await supabaseAdmin.from('role_permissions').delete().eq('role_id', roleId)

      // Insert new
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

/**
 * DELETE /api/auth/roles/:id - Delete role (ROOT only)
 */
auth.delete('/roles/:id', requireAdmin,async (c) => {
  const authContext = c.get('auth') as AuthContext
  const roleId = parseInt(c.req.param('id'))

  // Only ROOT can delete roles
  if (!authContext.isRoot) {
    return c.json(
      { error: true, message: 'Chỉ ROOT mới có thể xóa vai trò' },
      403
    )
  }

  try {
    // Check if role exists and is not system role
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

    // Delete role (CASCADE will handle role_permissions)
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

/**
 * GET /api/auth/roles/:id/permissions - Get role's permissions
 */
auth.get('/roles/:id/permissions', requireAdmin,async (c) => {
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

/**
 * GET /api/auth/employees/search - Search employees for permission assignment
 */
auth.get('/employees/search', requireAdmin,async (c) => {
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

    // Map snake_case to camelCase for frontend compatibility
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

/**
 * GET /api/auth/employees/:id/roles-permissions - Get employee's roles and permissions
 */
auth.get('/employees/:id/roles-permissions', requireAdmin,async (c) => {
  const employeeId = parseInt(c.req.param('id'))

  try {
    // Get employee info
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, employee_id, full_name, department, chuc_vu')
      .eq('id', employeeId)
      .single()

    if (empError || !employee) {
      return c.json({ error: true, message: 'Không tìm thấy nhân viên' }, 404)
    }

    // Get roles
    const { data: employeeRoles } = await supabaseAdmin
      .from('employee_roles')
      .select('roles(id, code, name, description, level, is_system, is_active)')
      .eq('employee_id', employeeId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roles = employeeRoles?.map((er: any) => er.roles).filter(Boolean) ?? []

    // Check if user is ROOT
    const isRoot = roles.some((r: { code: string }) => r.code === 'ROOT')

    // Get direct permissions
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

    // Calculate effective permissions
    let effectivePermissions: string[] = []

    if (isRoot) {
      // ROOT has all permissions
      effectivePermissions = ['*']
    } else {
      // Get permissions from roles
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

      // Apply direct permission overrides
      for (const dp of directPermissions) {
        const code = dp.permission?.code
        if (!code) continue

        if (dp.granted) {
          // Add if not already present
          if (!effectivePermissions.includes(code)) {
            effectivePermissions.push(code)
          }
        } else {
          // Remove (denied)
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

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Parse duration string to milliseconds
 * Supports: 15m, 1h, 7d, 30d
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([mhd])$/)
  if (!match) return 15 * 60 * 1000 // Default 15 minutes

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 'm':
      return value * 60 * 1000
    case 'h':
      return value * 60 * 60 * 1000
    case 'd':
      return value * 24 * 60 * 60 * 1000
    default:
      return 15 * 60 * 1000
  }
}

export default auth
