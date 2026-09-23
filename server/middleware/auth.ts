import { Context, Next } from 'hono'
import { verifyAccessToken } from '../auth/jwt'
import { query, queryOne } from '../db/query'
import type { JwtPayload, AuthContext } from '../types/auth'

export type { JwtPayload, AuthContext }

const DB_RETRY_CODES = new Set(['57P01', '57P03', '08006', '08000', '08003', '08004', '53300', 'XX000'])
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 300

function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: string }).code
  if (code && DB_RETRY_CODES.has(code)) return true
  const message = (error as { message?: string }).message
  return typeof message === 'string' && message.includes('recovery mode')
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function retryOnDbError<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0
  for (;;) {
    try {
      return await fn()
    } catch (err) {
      if (attempt < MAX_RETRIES && isTransientDbError(err)) {
        attempt++
        console.warn(`[Auth] DB transient error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS * attempt}ms...`)
        await sleep(RETRY_DELAY_MS * attempt)
        continue
      }
      throw err
    }
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const jwtPayload = await verifyAccessToken(token)

    const resolvedEmployeeId = jwtPayload.employee_id
    const resolvedEmployeeCode = jwtPayload.employee_code

    if (!resolvedEmployeeId || !resolvedEmployeeCode) {
      return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
    }

    let employeeStatus: { id: number; employee_id: string; is_active: boolean; deleted_at: string | null } | null
    try {
      employeeStatus = await retryOnDbError(() =>
        queryOne<{ id: number; employee_id: string; is_active: boolean; deleted_at: string | null }>(
          'SELECT id, employee_id, is_active, deleted_at FROM employees WHERE id = $1 LIMIT 1',
          [resolvedEmployeeId]
        )
      )
    } catch (employeeStatusError) {
      console.error('Auth middleware: failed to fetch employee status:', employeeStatusError)
      return c.json(
        { error: true, message: 'Hệ thống đang khởi động lại, vui lòng thử lại sau' },
        503
      )
    }

    if (!employeeStatus || employeeStatus.deleted_at) {
      return c.json({ error: true, message: 'Tài khoản không tồn tại hoặc đã bị xóa' }, 403)
    }

    if (!employeeStatus.is_active) {
      return c.json({ error: true, message: 'Tài khoản đã bị vô hiệu hóa' }, 403)
    }

    let roles: string[]
    try {
      roles = await retryOnDbError(() => getEmployeeRoleCodes(resolvedEmployeeId))
    } catch (roleErr) {
      console.error('Auth middleware: failed to fetch role codes:', roleErr)
      return c.json(
        { error: true, message: 'Hệ thống đang khởi động lại, vui lòng thử lại sau' },
        503
      )
    }
    const isRoot = roles.includes('root')

    let permissions: string[]
    if (isRoot) {
      permissions = ['*']
    } else {
      permissions = await getEmployeePermissions(resolvedEmployeeId)
    }

    const isAdmin = isRoot || roles.includes('admin')

    c.set('auth', {
      employeeId: resolvedEmployeeId,
      employeeCode: resolvedEmployeeCode,
      roles,
      isRoot,
      isAdmin,
      permissions,
    } as AuthContext & { permissions: string[] })

    await next()
  } catch (err) {
    if (err instanceof Error && err.message.includes('expired')) {
      return c.json({ error: true, message: 'Token đã hết hạn' }, 401)
    }
    if (err instanceof Error && (err.message.includes('signature') || err.message.includes('JWS'))) {
      return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
    }
    console.error('Auth middleware error:', err)
    return c.json({ error: true, message: 'Xác thực thất bại' }, 401)
  }
}

export function requirePermission(...requiredPermissions: string[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth') as (AuthContext & { permissions: string[] }) | undefined

    if (!auth) {
      return c.json({ error: true, message: 'Chưa xác thực' }, 401)
    }

    if (auth.isRoot) {
      return next()
    }

    const hasPermission = requiredPermissions.some(p => auth.permissions.includes(p))

    if (!hasPermission) {
      return c.json({
        error: true,
        message: 'Bạn không có quyền thực hiện thao tác này'
      }, 403)
    }

    await next()
  }
}

export function requireAllPermissions(...requiredPermissions: string[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth') as (AuthContext & { permissions: string[] }) | undefined

    if (!auth) {
      return c.json({ error: true, message: 'Chưa xác thực' }, 401)
    }

    if (auth.isRoot) {
      return next()
    }

    const hasAllPermissions = requiredPermissions.every(p => auth.permissions.includes(p))

    if (!hasAllPermissions) {
      return c.json({
        error: true,
        message: 'Bạn không có đủ quyền thực hiện thao tác này'
      }, 403)
    }

    await next()
  }
}

export async function requireAdmin(c: Context, next: Next) {
  const auth = c.get('auth') as AuthContext | undefined

  if (!auth) {
    return c.json({ error: true, message: 'Chưa xác thực' }, 401)
  }

  if (auth.isRoot) {
    return next()
  }

  if (!auth.roles.includes('admin')) {
    return c.json({
      error: true,
      message: 'Chỉ quản trị viên mới có quyền thực hiện thao tác này'
    }, 403)
  }

  await next()
}

export async function requireRoot(c: Context, next: Next) {
  const auth = c.get('auth') as AuthContext | undefined

  if (!auth) {
    return c.json({ error: true, message: 'Chưa xác thực' }, 401)
  }

  if (!auth.isRoot) {
    return c.json({
      error: true,
      message: 'Chỉ ROOT mới có quyền thực hiện thao tác này'
    }, 403)
  }

  await next()
}

async function getEmployeePermissions(employeeId: number): Promise<string[]> {
  const permissionSet = new Set<string>()

  try {
    const rolePerms = await query<{ code: string }>(
      `SELECT DISTINCT p.code
       FROM employee_roles er
       JOIN roles r ON r.id = er.role_id
       JOIN role_permissions rp ON rp.role_id = r.id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE er.employee_id = $1`,
      [employeeId]
    )

    rolePerms.forEach((rp) => {
      if (rp.code) {
        permissionSet.add(rp.code)
      }
    })
  } catch (err) {
    console.error('Auth middleware: failed to fetch role permissions:', err)
  }

  try {
    const directPerms = await query<{ code: string | null; granted: boolean; expires_at: string | null }>(
      `SELECT p.code, ep.granted, ep.expires_at
       FROM employee_permissions ep
       JOIN permissions p ON p.id = ep.permission_id
       WHERE ep.employee_id = $1`,
      [employeeId]
    )

    const now = new Date().toISOString()

    directPerms.forEach((ep) => {
      const isExpired = ep.expires_at && ep.expires_at < now
      if (!isExpired && ep.code) {
        if (ep.granted) {
          permissionSet.add(ep.code)
        } else {
          permissionSet.delete(ep.code)
        }
      }
    })
  } catch (err) {
    console.error('Auth middleware: failed to fetch direct permissions:', err)
  }

  return Array.from(permissionSet)
}

async function getEmployeeRoleCodes(employeeId: number): Promise<string[]> {
  const employeeRoles = await query<{ code: string | null }>(
    `SELECT r.code
     FROM employee_roles er
     JOIN roles r ON r.id = er.role_id
     WHERE er.employee_id = $1`,
    [employeeId]
  )

  return employeeRoles
    .map((er) => er.code)
    .filter((code: unknown): code is string => typeof code === 'string')
}

export async function canManageEmployee(
  requesterAuth: AuthContext,
  targetEmployeeId: number
): Promise<boolean> {
  if (requesterAuth.isRoot) {
    return true
  }

  const targetRoles = await query<{ code: string | null; level: number | null }>(
    `SELECT r.code, r.level
     FROM employee_roles er
     JOIN roles r ON r.id = er.role_id
     WHERE er.employee_id = $1`,
    [targetEmployeeId]
  )

  const isTargetRoot = targetRoles.some((er) => er.code === 'root')
  if (isTargetRoot) {
    return false
  }

  const requesterRoles = await query<{ level: number | null }>(
    `SELECT r.level
     FROM employee_roles er
     JOIN roles r ON r.id = er.role_id
     WHERE er.employee_id = $1`,
    [requesterAuth.employeeId]
  )

  const requesterMinLevel = Math.min(
    ...(requesterRoles.map((r) => r.level ?? 999).length > 0
      ? requesterRoles.map((r) => r.level ?? 999)
      : [999])
  )

  const targetMinLevel = Math.min(
    ...(targetRoles.map((r) => r.level ?? 999).length > 0
      ? targetRoles.map((r) => r.level ?? 999)
      : [999])
  )

  return requesterMinLevel < targetMinLevel
}
