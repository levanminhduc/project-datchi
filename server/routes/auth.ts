import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { query, queryOne, tx } from '../db/query'
import { from } from '../db/sql-builder'
import {
  requireAdmin,
  canManageEmployee,
} from '../middleware/auth'
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../auth/jwt'
import { recordRotation, getGraceChild } from '../auth/refresh-grace-cache'
import {
  createPermissionSchema,
  updatePermissionSchema,
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
} from '../validation/auth'
import { sanitizeFilterValue } from '../utils/sanitize'
import type { AppEnv } from '../types/hono-env'

const auth = new Hono<AppEnv>()

const BCRYPT_ROUNDS = 10
const MAX_FAILED_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000

async function getRoleCodesAndRoot(employeeId: number): Promise<{ roles: string[]; isRoot: boolean }> {
  const rows = await query<{ code: string | null }>(
    `SELECT r.code
     FROM employee_roles er
     JOIN roles r ON r.id = er.role_id
     WHERE er.employee_id = $1`,
    [employeeId]
  )
  const roles = rows
    .map((r) => r.code)
    .filter((code: unknown): code is string => typeof code === 'string')
  return { roles, isRoot: roles.includes('root') }
}

async function issueTokensForEmployee(employee: {
  id: number
  employee_id: string
}): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const { roles, isRoot } = await getRoleCodesAndRoot(employee.id)

  const access = await signAccessToken({
    employeeId: employee.id,
    employeeCode: employee.employee_id,
    roles,
    isRoot,
  })

  const refresh = generateRefreshToken()

  await query(
    `INSERT INTO auth_refresh_tokens (token_hash, employee_id, expires_at)
     VALUES ($1, $2, $3)`,
    [refresh.tokenHash, employee.id, refresh.expiresAt.toISOString()]
  )

  return {
    accessToken: access.token,
    refreshToken: refresh.token,
    expiresAt: access.expiresAt,
  }
}

auth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: true, message: parsed.error.issues.map((e: { message: string }) => e.message).join(', ') },
      400
    )
  }

  const employeeCode = parsed.data.employeeId.trim().toUpperCase()
  const { password } = parsed.data

  try {
    const employee = await queryOne<{
      id: number
      employee_id: string
      password_hash: string | null
      is_active: boolean
      deleted_at: string | null
      failed_login_attempts: number | null
      locked_until: string | null
    }>(
      `SELECT id, employee_id, password_hash, is_active, deleted_at, failed_login_attempts, locked_until
       FROM employees
       WHERE employee_id = $1
       LIMIT 1`,
      [employeeCode]
    )

    if (!employee || employee.deleted_at) {
      return c.json({ error: true, message: 'Mã nhân viên hoặc mật khẩu không đúng' }, 401)
    }

    if (!employee.is_active) {
      return c.json({ error: true, message: 'Tài khoản đã bị vô hiệu hóa' }, 403)
    }

    if (employee.locked_until && new Date(employee.locked_until) > new Date()) {
      return c.json(
        { error: true, message: 'Tài khoản đang tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau' },
        403
      )
    }

    const passwordOk = employee.password_hash
      ? await bcrypt.compare(password, employee.password_hash)
      : false

    if (!passwordOk) {
      const attempts = (employee.failed_login_attempts ?? 0) + 1
      const lockedUntil =
        attempts >= MAX_FAILED_LOGIN_ATTEMPTS
          ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
          : null
      try {
        await query(
          `UPDATE employees SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
          [attempts, lockedUntil, employee.id]
        )
      } catch (lockErr) {
        console.warn('Login: failed to update lockout counters:', lockErr)
      }
      return c.json({ error: true, message: 'Mã nhân viên hoặc mật khẩu không đúng' }, 401)
    }

    try {
      await query(
        `UPDATE employees SET failed_login_attempts = $1, locked_until = $2, last_login_at = $3 WHERE id = $4`,
        [0, null, new Date().toISOString(), employee.id]
      )
    } catch (resetErr) {
      console.warn('Login: failed to reset lockout counters:', resetErr)
    }

    const tokens = await issueTokensForEmployee(employee)

    return c.json({
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
      error: false,
    })
  } catch (err) {
    console.error('Login error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = refreshSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: true, message: 'Thiếu refresh token' }, 400)
  }

  const tokenHash = hashRefreshToken(parsed.data.refreshToken)

  try {
    const claimed = await tx(async (client) => {
      const claimRes = await client.query<{ id: string; employee_id: number }>(
        `UPDATE auth_refresh_tokens
         SET revoked_at = now()
         WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
         RETURNING id, employee_id`,
        [tokenHash]
      )

      if (claimRes.rows.length === 0) {
        return null
      }

      const stored = claimRes.rows[0]

      const employee = await queryOne<{
        id: number
        employee_id: string
        is_active: boolean
        deleted_at: string | null
      }>(
        `SELECT id, employee_id, is_active, deleted_at FROM employees WHERE id = $1 LIMIT 1`,
        [stored.employee_id]
      )

      if (!employee || employee.deleted_at) {
        return { kind: 'account_gone' as const }
      }
      if (!employee.is_active) {
        return { kind: 'account_inactive' as const }
      }

      const { roles, isRoot } = await getRoleCodesAndRoot(employee.id)
      const access = await signAccessToken({
        employeeId: employee.id,
        employeeCode: employee.employee_id,
        roles,
        isRoot,
      })
      const newRefresh = generateRefreshToken()

      await client.query(
        `INSERT INTO auth_refresh_tokens (token_hash, employee_id, expires_at, rotated_from)
         VALUES ($1, $2, $3, $4)`,
        [newRefresh.tokenHash, employee.id, newRefresh.expiresAt.toISOString(), stored.id]
      )

      return {
        kind: 'rotated' as const,
        accessToken: access.token,
        refreshToken: newRefresh.token,
        expiresAt: access.expiresAt,
      }
    })

    if (claimed && claimed.kind === 'rotated') {
      recordRotation(tokenHash, {
        token: claimed.accessToken,
        refreshToken: claimed.refreshToken,
        expiresAt: claimed.expiresAt,
      })
      return c.json({
        data: {
          accessToken: claimed.accessToken,
          refreshToken: claimed.refreshToken,
          expiresAt: claimed.expiresAt,
        },
        error: false,
      })
    }

    if (claimed && claimed.kind === 'account_gone') {
      return c.json({ error: true, message: 'Tài khoản không tồn tại hoặc đã bị xóa' }, 403)
    }
    if (claimed && claimed.kind === 'account_inactive') {
      return c.json({ error: true, message: 'Tài khoản đã bị vô hiệu hóa' }, 403)
    }

    const grace = getGraceChild(tokenHash)
    if (grace) {
      return c.json({
        data: {
          accessToken: grace.token,
          refreshToken: grace.refreshToken,
          expiresAt: grace.expiresAt,
        },
        error: false,
      })
    }

    const stored = await queryOne<{ id: string; employee_id: number; expires_at: string; revoked_at: string | null }>(
      `SELECT id, employee_id, expires_at, revoked_at
       FROM auth_refresh_tokens
       WHERE token_hash = $1
       LIMIT 1`,
      [tokenHash]
    )

    if (!stored) {
      return c.json({ error: true, message: 'Phiên đăng nhập đã hết hạn' }, 401)
    }

    if (new Date(stored.expires_at) <= new Date()) {
      return c.json({ error: true, message: 'Phiên đăng nhập đã hết hạn' }, 401)
    }

    const recentChild = await queryOne<{ id: string }>(
      `SELECT id FROM auth_refresh_tokens
       WHERE rotated_from = $1 AND revoked_at IS NULL
         AND created_at > now() - interval '30 seconds'
       ORDER BY created_at DESC
       LIMIT 1`,
      [stored.id]
    )

    if (recentChild) {
      return c.json({ error: true, message: 'Đang làm mới phiên, vui lòng thử lại' }, 409)
    }

    await query(
      `UPDATE auth_refresh_tokens SET revoked_at = now()
       WHERE employee_id = $1 AND revoked_at IS NULL`,
      [stored.employee_id]
    )
    return c.json({ error: true, message: 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại' }, 401)
  } catch (err) {
    console.error('Refresh error:', err)
    return c.json({ error: true, message: 'Lỗi hệ thống' }, 500)
  }
})

auth.post('/logout', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : null

  if (refreshToken) {
    try {
      await query(
        `UPDATE auth_refresh_tokens SET revoked_at = $1 WHERE token_hash = $2 AND revoked_at IS NULL`,
        [new Date().toISOString(), hashRefreshToken(refreshToken)]
      )
    } catch (logoutErr) {
      console.warn('Logout: failed to revoke refresh token:', logoutErr)
    }
  }

  return c.json({ error: false, message: 'Đã đăng xuất' })
})


auth.get('/health', async (c) => {
  const authContext = c.get('auth')

  return c.json({
    data: {
      employeeId: authContext.employeeId,
      employeeCode: authContext.employeeCode,
      isRoot: authContext.isRoot,
      valid: true,
    },
    error: false,
  })
})

auth.get('/me', async (c) => {
  const { employeeId } = c.get('auth')

  try {
    let employee: {
      id: number
      employee_id: string
      full_name: string | null
      department: string | null
      chuc_vu: string | null
      is_active: boolean
      must_change_password: boolean
      last_login_at: string | null
      created_at: string | null
    } | null = null
    try {
      employee = await queryOne(
        `SELECT id, employee_id, full_name, department, chuc_vu, is_active, must_change_password, last_login_at, created_at
         FROM employees
         WHERE id = $1`,
        [employeeId]
      )
    } catch (selectErr) {
      console.error('Get me select error:', selectErr)
      employee = null
    }

    if (!employee) {
      return c.json({ error: true, message: 'Phiên đăng nhập không hợp lệ' }, 401)
    }

    let employeeRoles: Array<{ roles: { id: number; code: string; name: string; description: string | null; level: number | null } | null }> = []
    try {
      employeeRoles = await query(
        `SELECT json_build_object('id', r.id, 'code', r.code, 'name', r.name, 'description', r.description, 'level', r.level) AS roles
         FROM employee_roles er
         JOIN roles r ON r.id = er.role_id
         WHERE er.employee_id = $1`,
        [employeeId]
      )
    } catch (rolesErr) {
      console.warn('Get me roles error:', rolesErr)
      employeeRoles = []
    }

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
  const authContext = c.get('auth')

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
  const { employeeId } = c.get('auth')

  const body = await c.req.json().catch(() => ({}))
  const parsed = changePasswordSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: true, message: parsed.error.issues.map((e: { message: string }) => e.message).join(', ') },
      400
    )
  }

  const { currentPassword, newPassword } = parsed.data

  try {
    const employee = await queryOne<{ password_hash: string | null; employee_id: string }>(
      'SELECT password_hash, employee_id FROM employees WHERE id = $1',
      [employeeId]
    )

    if (!employee) {
      return c.json({ error: true, message: 'Nhân viên không tồn tại' }, 404)
    }

    const currentOk = employee.password_hash
      ? await bcrypt.compare(currentPassword, employee.password_hash)
      : false

    if (!currentOk) {
      return c.json({ error: true, message: 'Mật khẩu hiện tại không đúng' }, 401)
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

    try {
      await query(
        `UPDATE employees SET password_hash = $1, must_change_password = $2, password_changed_at = $3 WHERE id = $4`,
        [newHash, false, new Date().toISOString(), employeeId]
      )
    } catch (updateErr) {
      console.error('Change password: failed to update employee:', updateErr)
      return c.json({ error: true, message: 'Không thể đổi mật khẩu' }, 500)
    }

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
  const authContext = c.get('auth')
  const targetId = parseInt(c.req.param('id'))
  const body = await c.req.json().catch(() => ({}))
  const parsed = resetPasswordSchema.safeParse(body)

  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      { error: true, message: 'Bạn không có quyền đặt lại mật khẩu cho nhân viên này' },
      403
    )
  }

  if (!parsed.success) {
    return c.json(
      { error: true, message: parsed.error.issues.map((e: { message: string }) => e.message).join(', ') },
      400
    )
  }

  const { newPassword } = parsed.data

  try {
    const employee = await queryOne<{ id: number; employee_id: string }>(
      'SELECT id, employee_id FROM employees WHERE id = $1',
      [targetId]
    )

    if (!employee) {
      return c.json({ error: true, message: 'Nhân viên không tồn tại' }, 404)
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

    try {
      await query(
        `UPDATE employees
         SET password_hash = $1, must_change_password = $2, failed_login_attempts = $3, locked_until = $4, password_changed_at = $5
         WHERE id = $6`,
        [newHash, true, 0, null, new Date().toISOString(), targetId]
      )
    } catch (updateErr) {
      console.error('Reset password: failed to update employee:', updateErr)
      return c.json({ error: true, message: 'Không thể đặt lại mật khẩu' }, 500)
    }

    try {
      await query(
        `UPDATE auth_refresh_tokens SET revoked_at = $1 WHERE employee_id = $2 AND revoked_at IS NULL`,
        [new Date().toISOString(), targetId]
      )
    } catch (revokeErr) {
      console.warn('Reset password: failed to revoke refresh tokens:', revokeErr)
    }

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
  const authContext = c.get('auth')
  const targetId = parseInt(c.req.param('id'))
  const { roleIds } = await c.req.json()

  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      { error: true, message: 'Bạn không có quyền quản lý nhân viên này' },
      403
    )
  }

  if (!authContext.isRoot) {
    const rootRole = await queryOne<{ id: number }>(
      'SELECT id FROM roles WHERE code = $1',
      ['root']
    )

    if (rootRole && roleIds?.includes(rootRole.id)) {
      return c.json(
        { error: true, message: 'Chỉ ROOT mới có thể gán vai trò ROOT' },
        403
      )
    }
  }

  try {
    try {
      await query('DELETE FROM employee_roles WHERE employee_id = $1', [targetId])
    } catch (deleteErr) {
      console.warn('Update employee roles: delete failed:', deleteErr)
    }

    if (roleIds?.length > 0) {
      const valueRows: string[] = []
      const params: unknown[] = []
      for (const roleId of roleIds as number[]) {
        const base = params.length
        valueRows.push(`($${base + 1}, $${base + 2}, $${base + 3})`)
        params.push(targetId, roleId, authContext.employeeId)
      }
      try {
        await query(
          `INSERT INTO employee_roles (employee_id, role_id, assigned_by) VALUES ${valueRows.join(', ')}`,
          params
        )
      } catch (insertErr) {
        console.warn('Update employee roles: insert failed:', insertErr)
      }
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
  const authContext = c.get('auth')
  const targetId = parseInt(c.req.param('id'))
  const { permissions } = await c.req.json()

  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      { error: true, message: 'Bạn không có quyền quản lý nhân viên này' },
      403
    )
  }

  try {
    try {
      await query('DELETE FROM employee_permissions WHERE employee_id = $1', [targetId])
    } catch (deleteErr) {
      console.warn('Update employee permissions: delete failed:', deleteErr)
    }

    if (permissions?.length > 0) {
      const valueRows: string[] = []
      const params: unknown[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of permissions as any[]) {
        const base = params.length
        valueRows.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`)
        params.push(
          targetId,
          p.permissionId,
          p.granted ?? true,
          p.expiresAt || null,
          authContext.employeeId
        )
      }
      try {
        await query(
          `INSERT INTO employee_permissions (employee_id, permission_id, granted, expires_at, assigned_by) VALUES ${valueRows.join(', ')}`,
          params
        )
      } catch (insertErr) {
        console.warn('Update employee permissions: insert failed:', insertErr)
      }
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
  const authContext = c.get('auth')
  const targetId = parseInt(c.req.param('id'))

  if (!(await canManageEmployee(authContext, targetId))) {
    return c.json(
      { error: true, message: 'Bạn không có quyền mở khóa tài khoản này' },
      403
    )
  }

  try {
    try {
      await query(
        `UPDATE employees SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
        [0, null, targetId]
      )
    } catch (updateErr) {
      console.warn('Unlock account: update failed:', updateErr)
    }

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
    let roles: unknown[]
    try {
      roles = await from('roles')
        .select('id, code, name, description, level, is_system, is_active')
        .eq('is_active', true)
        .order({ column: 'level', ascending: true })
        .list()
    } catch (error) {
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
    let permissions: unknown[]
    try {
      permissions = await from('permissions')
        .select('id, code, name, description, module, resource, action, route_path, is_page_access, sort_order')
        .order({ column: 'sort_order', ascending: true })
        .list()
    } catch (error) {
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
  const authContext = c.get('auth')

  if (!authContext.isRoot) {
    return c.json({ success: false, error: 'FORBIDDEN', message: 'Chỉ ROOT mới có thể tạo quyền' }, 403)
  }

  const body = await c.req.json()
  const parsed = createPermissionSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: parsed.error.issues.map((e: { message: string }) => e.message).join(', '),
    }, 400)
  }

  const { code, name, description, module, resource, action, routePath, isPageAccess, sortOrder } = parsed.data

  try {
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM permissions WHERE code = $1',
      [code]
    )

    if (existing) {
      return c.json({ success: false, error: 'DUPLICATE_CODE', message: 'Mã quyền đã tồn tại' }, 409)
    }

    let permission: unknown
    try {
      permission = await queryOne(
        `INSERT INTO permissions (code, name, description, module, resource, action, route_path, is_page_access, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          code,
          name,
          description || null,
          module,
          resource,
          action,
          routePath || null,
          isPageAccess ?? false,
          sortOrder ?? 0,
        ]
      )
    } catch (error) {
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
  const authContext = c.get('auth')

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
      message: parsed.error.issues.map((e: { message: string }) => e.message).join(', '),
    }, 400)
  }

  try {
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM permissions WHERE id = $1',
      [permId]
    )

    if (!existing) {
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

    const sets: string[] = []
    const params: unknown[] = []
    for (const [key, value] of Object.entries(updates)) {
      params.push(value)
      sets.push(`${key} = $${params.length}`)
    }
    params.push(permId)

    let permission: unknown
    try {
      permission = await queryOne(
        `UPDATE permissions SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      )
    } catch (error) {
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
  const authContext = c.get('auth')

  if (!authContext.isRoot) {
    return c.json({ success: false, error: 'FORBIDDEN', message: 'Chỉ ROOT mới có thể xóa quyền' }, 403)
  }

  const permId = parseInt(c.req.param('id'))

  try {
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM permissions WHERE id = $1',
      [permId]
    )

    if (!existing) {
      return c.json({ success: false, error: 'NOT_FOUND', message: 'Quyền không tồn tại' }, 404)
    }

    const roleCount = await from('role_permissions')
      .eq('permission_id', permId)
      .count()

    const empCount = await from('employee_permissions')
      .eq('permission_id', permId)
      .count()

    const totalRoles = roleCount ?? 0
    const totalEmps = empCount ?? 0

    if (totalRoles > 0 || totalEmps > 0) {
      return c.json({
        success: false,
        error: 'IN_USE',
        message: `Không thể xóa quyền đang được sử dụng bởi ${totalRoles} vai trò và ${totalEmps} nhân viên`,
      }, 409)
    }

    try {
      await query('DELETE FROM permissions WHERE id = $1', [permId])
    } catch (error) {
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
  const authContext = c.get('auth')
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
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM roles WHERE code = $1',
      [code]
    )

    if (existing) {
      return c.json(
        { error: true, message: 'Mã vai trò đã tồn tại' },
        409
      )
    }

    let role: { id: number } | null
    try {
      role = await queryOne<{ id: number }>(
        `INSERT INTO roles (code, name, description, level, is_system, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          code,
          name,
          description || null,
          level ?? 99,
          false,
          true,
        ]
      )
    } catch (error) {
      console.error('Create role error:', error)
      return c.json({ error: true, message: 'Không thể tạo vai trò' }, 500)
    }

    if (role && permissionIds?.length > 0) {
      const valueRows: string[] = []
      const params: unknown[] = []
      for (const permId of permissionIds as number[]) {
        const base = params.length
        valueRows.push(`($${base + 1}, $${base + 2})`)
        params.push(role.id, permId)
      }
      try {
        await query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ${valueRows.join(', ')}`,
          params
        )
      } catch (insertErr) {
        console.warn('Create role: role_permissions insert failed:', insertErr)
      }
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
  const authContext = c.get('auth')
  const roleId = parseInt(c.req.param('id'))
  const { name, description, level, isActive, permissionIds } = await c.req.json()

  try {
    const existingRole = await queryOne<{ is_system: boolean }>(
      'SELECT * FROM roles WHERE id = $1',
      [roleId]
    )

    if (!existingRole) {
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

    const sets: string[] = []
    const params: unknown[] = []
    for (const [key, value] of Object.entries(updates)) {
      params.push(value)
      sets.push(`${key} = $${params.length}`)
    }
    params.push(roleId)

    let role: unknown
    try {
      role = await queryOne(
        `UPDATE roles SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      )
    } catch (error) {
      console.error('Update role error:', error)
      return c.json({ error: true, message: 'Không thể cập nhật vai trò' }, 500)
    }

    if (permissionIds !== undefined) {
      try {
        await query('DELETE FROM role_permissions WHERE role_id = $1', [roleId])
      } catch (deleteErr) {
        console.warn('Update role: role_permissions delete failed:', deleteErr)
      }

      if (permissionIds.length > 0) {
        const valueRows: string[] = []
        const insertParams: unknown[] = []
        for (const permId of permissionIds as number[]) {
          const base = insertParams.length
          valueRows.push(`($${base + 1}, $${base + 2})`)
          insertParams.push(roleId, permId)
        }
        try {
          await query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ${valueRows.join(', ')}`,
            insertParams
          )
        } catch (insertErr) {
          console.warn('Update role: role_permissions insert failed:', insertErr)
        }
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
  const authContext = c.get('auth')
  const roleId = parseInt(c.req.param('id'))

  if (!authContext.isRoot) {
    return c.json(
      { error: true, message: 'Chỉ ROOT mới có thể xóa vai trò' },
      403
    )
  }

  try {
    const role = await queryOne<{ is_system: boolean }>(
      'SELECT * FROM roles WHERE id = $1',
      [roleId]
    )

    if (!role) {
      return c.json({ error: true, message: 'Vai trò không tồn tại' }, 404)
    }

    if (role.is_system) {
      return c.json(
        { error: true, message: 'Không thể xóa vai trò hệ thống' },
        403
      )
    }

    try {
      await query('DELETE FROM roles WHERE id = $1', [roleId])
    } catch (error) {
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
    let rolePerms: Array<{ permissions: Record<string, unknown> | null }>
    try {
      rolePerms = await query(
        `SELECT to_json(p.*) AS permissions
         FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role_id = $1`,
        [roleId]
      )
    } catch (error) {
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
  const searchText = c.req.query('q') || ''
  const limit = parseInt(c.req.query('limit') || '20')

  try {
    const builder = from('employees')
      .select('id, employee_id, full_name, department, chuc_vu, is_active')
      .eq('is_active', true)

    if (searchText) {
      const q = sanitizeFilterValue(searchText)
      builder.or([
        { column: 'employee_id', op: 'ilike', value: `%${q}%` },
        { column: 'full_name', op: 'ilike', value: `%${q}%` },
      ])
    }

    let employees: Array<{
      id: number
      employee_id: string
      full_name: string | null
      department: string | null
      chuc_vu: string | null
      is_active: boolean
    }>
    try {
      employees = await builder
        .order({ column: 'full_name', ascending: true })
        .limit(limit)
        .list()
    } catch (error) {
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
    const employee = await queryOne<{
      id: number
      employee_id: string
      full_name: string | null
      department: string | null
      chuc_vu: string | null
    }>(
      'SELECT id, employee_id, full_name, department, chuc_vu FROM employees WHERE id = $1',
      [employeeId]
    )

    if (!employee) {
      return c.json({ error: true, message: 'Không tìm thấy nhân viên' }, 404)
    }

    let employeeRoles: Array<{ roles: { id: number; code: string } | null }> = []
    try {
      employeeRoles = await query(
        `SELECT json_build_object('id', r.id, 'code', r.code, 'name', r.name, 'description', r.description, 'level', r.level, 'is_system', r.is_system, 'is_active', r.is_active) AS roles
         FROM employee_roles er
         JOIN roles r ON r.id = er.role_id
         WHERE er.employee_id = $1`,
        [employeeId]
      )
    } catch (rolesErr) {
      console.warn('Get employee roles/permissions: roles error:', rolesErr)
      employeeRoles = []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roles = employeeRoles?.map((er: any) => er.roles).filter(Boolean) ?? []

    const isRoot = roles.some((r: { code: string }) => r.code === 'ROOT')

    let employeePerms: Array<{ permission_id: number; granted: boolean; expires_at: string | null; permissions: Record<string, unknown> | null }> = []
    try {
      employeePerms = await query(
        `SELECT ep.permission_id, ep.granted, ep.expires_at,
                CASE WHEN p.id IS NULL THEN NULL ELSE json_build_object('id', p.id, 'code', p.code, 'name', p.name, 'module', p.module, 'action', p.action, 'description', p.description) END AS permissions
         FROM employee_permissions ep
         LEFT JOIN permissions p ON p.id = ep.permission_id
         WHERE ep.employee_id = $1`,
        [employeeId]
      )
    } catch (permsErr) {
      console.warn('Get employee roles/permissions: permissions error:', permsErr)
      employeePerms = []
    }

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
        let rolePerms: Array<{ permissions: { code: string } | null }> = []
        try {
          rolePerms = await query(
            `SELECT json_build_object('code', p.code) AS permissions
             FROM role_permissions rp
             JOIN permissions p ON p.id = rp.permission_id
             WHERE rp.role_id = ANY($1)`,
            [roleIds]
          )
        } catch (rolePermsErr) {
          console.warn('Get employee roles/permissions: role permissions error:', rolePermsErr)
          rolePerms = []
        }

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
