import { Context, Next } from 'hono'
import { jwtVerify } from 'jose'
import { supabaseAdmin } from '../db/supabase'
import type { JwtPayload, AuthContext } from '../types/auth'

export type { JwtPayload, AuthContext }

const SUPABASE_JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_JWT_SECRET!
)

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const { payload } = await jwtVerify(token, SUPABASE_JWT_SECRET, {
      algorithms: ['HS256'],
    })

    const jwtPayload = payload as unknown as JwtPayload

    let permissions: string[]
    if (jwtPayload.is_root) {
      permissions = ['*']
    } else {
      permissions = await getEmployeePermissions(jwtPayload.employee_id)
    }

    const isAdmin = jwtPayload.is_root || jwtPayload.roles.includes('admin')

    c.set('auth', {
      employeeId: jwtPayload.employee_id,
      employeeCode: jwtPayload.employee_code,
      roles: jwtPayload.roles,
      isRoot: jwtPayload.is_root,
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
  const { data: rolePerms } = await supabaseAdmin
    .from('employee_roles')
    .select(`
      roles!inner(
        role_permissions(
          permissions(code)
        )
      )
    `)
    .eq('employee_id', employeeId)

  const permissionSet = new Set<string>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rolePerms?.forEach((er: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    er.roles?.role_permissions?.forEach((rp: any) => {
      if (rp.permissions?.code) {
        permissionSet.add(rp.permissions.code)
      }
    })
  })

  const { data: directPerms } = await supabaseAdmin
    .from('employee_permissions')
    .select('permissions(code), granted, expires_at')
    .eq('employee_id', employeeId)

  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  directPerms?.forEach((ep: any) => {
    const isExpired = ep.expires_at && ep.expires_at < now
    if (!isExpired && ep.permissions?.code) {
      if (ep.granted) {
        permissionSet.add(ep.permissions.code)
      } else {
        permissionSet.delete(ep.permissions.code)
      }
    }
  })

  return Array.from(permissionSet)
}

export async function canManageEmployee(
  requesterAuth: AuthContext,
  targetEmployeeId: number
): Promise<boolean> {
  if (requesterAuth.isRoot) {
    return true
  }

  const { data: targetRoles } = await supabaseAdmin
    .from('employee_roles')
    .select('roles(code, level)')
    .eq('employee_id', targetEmployeeId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTargetRoot = targetRoles?.some((er: any) => er.roles?.code === 'root')
  if (isTargetRoot) {
    return false
  }

  const { data: requesterRoles } = await supabaseAdmin
    .from('employee_roles')
    .select('roles(level)')
    .eq('employee_id', requesterAuth.employeeId)

  const requesterMinLevel = Math.min(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(requesterRoles?.map((r: any) => r.roles?.level ?? 999) ?? [999])
  )

  const targetMinLevel = Math.min(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(targetRoles?.map((r: any) => r.roles?.level ?? 999) ?? [999])
  )

  return requesterMinLevel < targetMinLevel
}
