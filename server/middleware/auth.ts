import { Context, Next } from 'hono'
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload } from 'jose'
import { supabaseAdmin } from '../db/supabase'
import type { JwtPayload, AuthContext } from '../types/auth'

export type { JwtPayload, AuthContext }

const DB_RETRY_CODES = new Set(['PGRST000', 'PGRST503', '57P01', '57P03', '08006'])
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 300

function isTransientDbError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code && DB_RETRY_CODES.has(error.code)) return true
  return typeof error.message === 'string' && error.message.includes('recovery mode')
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function retryOnDbError<T extends { error: { code?: string; message?: string } | null }>(
  fn: () => PromiseLike<T>,
): Promise<T> {
  let lastResult = await fn()
  for (let attempt = 1; attempt <= MAX_RETRIES && isTransientDbError(lastResult.error); attempt++) {
    console.warn(`[Auth] DB transient error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS * attempt}ms...`)
    await sleep(RETRY_DELAY_MS * attempt)
    lastResult = await fn()
  }
  return lastResult
}

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET
  ? new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET)
  : null

function resolveSupabaseBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''

  if (fromEnv && !fromEnv.startsWith('/')) {
    return fromEnv.replace(/\/$/, '')
  }

  return 'http://127.0.0.1:55421'
}

const supabaseJwksUrl = new URL('/auth/v1/.well-known/jwks.json', `${resolveSupabaseBaseUrl()}/`)
const supabaseJwks = createRemoteJWKSet(supabaseJwksUrl)

async function verifySupabaseToken(token: string): Promise<JWTPayload> {
  const protectedHeader = decodeProtectedHeader(token)

  if (protectedHeader.alg === 'HS256') {
    if (!SUPABASE_JWT_SECRET) {
      throw new Error('SUPABASE_JWT_SECRET is missing for HS256 verification')
    }
    const { payload } = await jwtVerify(token, SUPABASE_JWT_SECRET, {
      algorithms: ['HS256'],
    })
    return payload
  }

  const { payload } = await jwtVerify(token, supabaseJwks, {
    algorithms: ['RS256', 'ES256'],
  })
  return payload
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const payload = await verifySupabaseToken(token)
    const jwtPayload = payload as unknown as JwtPayload

    if (!jwtPayload.employee_id || !jwtPayload.employee_code) {
      console.error('Auth middleware: JWT missing custom claims (employee_id, employee_code). Check custom_access_token_hook is enabled in Supabase Auth.')
      return c.json({ error: true, message: 'Token thiếu thông tin nhân viên. Vui lòng đăng nhập lại.' }, 401)
    }

    const { data: employeeStatus, error: employeeStatusError } = await retryOnDbError(() =>
      supabaseAdmin
        .from('employees')
        .select('id, is_active, deleted_at')
        .eq('id', jwtPayload.employee_id)
        .maybeSingle()
    )

    if (employeeStatusError) {
      console.error('Auth middleware: failed to fetch employee status:', employeeStatusError)
      const isDbDown = isTransientDbError(employeeStatusError)
      return c.json(
        { error: true, message: isDbDown ? 'Hệ thống đang khởi động lại, vui lòng thử lại sau' : 'Xác thực thất bại' },
        isDbDown ? 503 : 401
      )
    }

    if (!employeeStatus || employeeStatus.deleted_at) {
      return c.json({ error: true, message: 'Tài khoản không tồn tại hoặc đã bị xóa' }, 403)
    }

    if (!employeeStatus.is_active) {
      return c.json({ error: true, message: 'Tài khoản đã bị vô hiệu hóa' }, 403)
    }

    let permissions: string[]
    if (jwtPayload.is_root) {
      permissions = ['*']
    } else {
      permissions = await getEmployeePermissions(jwtPayload.employee_id)
    }

    const roles = Array.isArray(jwtPayload.roles) ? jwtPayload.roles : []
    const isAdmin = jwtPayload.is_root || roles.includes('admin')

    c.set('auth', {
      employeeId: jwtPayload.employee_id,
      employeeCode: jwtPayload.employee_code,
      roles,
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
