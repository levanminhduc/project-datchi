// server/middleware/auth.ts

import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../db/supabase'
import type { JwtPayload, AuthContext } from '../types/auth'

const JWT_SECRET = process.env.JWT_SECRET!

// Re-export types for convenience
export type { JwtPayload, AuthContext }

/**
 * Middleware to verify JWT and attach auth context
 * 
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Verify JWT signature and expiration
 * 3. Check if isRoot for fast bypass
 * 4. Fetch permissions (cached in JWT for ROOT)
 * 5. Attach AuthContext to request
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    // Verify JWT
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload

    // ROOT users get wildcard permission
    let permissions: string[]
    if (payload.isRoot) {
      permissions = ['*']
    } else {
      // Fetch actual permissions from database
      permissions = await getEmployeePermissions(payload.sub)
    }

    // Check if user is admin (root or has admin role)
    const isAdmin = payload.isRoot || payload.roles.includes('admin')

    // Attach auth context
    c.set('auth', {
      employeeId: payload.sub,
      employeeCode: payload.employeeId,
      roles: payload.roles,
      isRoot: payload.isRoot,
      isAdmin,
      permissions,
    } as AuthContext & { permissions: string[] })

    await next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return c.json({ error: true, message: 'Token đã hết hạn' }, 401)
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return c.json({ error: true, message: 'Token không hợp lệ' }, 401)
    }
    console.error('Auth middleware error:', err)
    return c.json({ error: true, message: 'Xác thực thất bại' }, 401)
  }
}

/**
 * Middleware to check specific permission(s)
 * ROOT bypasses all checks
 * 
 * Usage:
 * app.get('/api/items', authMiddleware, requirePermission('items.view'), handler)
 * app.delete('/api/items/:id', authMiddleware, requirePermission('items.delete', 'admin.full'), handler)
 */
export function requirePermission(...requiredPermissions: string[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth') as (AuthContext & { permissions: string[] }) | undefined

    if (!auth) {
      return c.json({ error: true, message: 'Chưa xác thực' }, 401)
    }

    // ROOT bypasses all permission checks
    if (auth.isRoot) {
      return next()
    }

    // Check if user has ANY of the required permissions (OR logic)
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

/**
 * Middleware to require all permissions (AND logic)
 */
export function requireAllPermissions(...requiredPermissions: string[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth') as (AuthContext & { permissions: string[] }) | undefined

    if (!auth) {
      return c.json({ error: true, message: 'Chưa xác thực' }, 401)
    }

    // ROOT bypasses all permission checks
    if (auth.isRoot) {
      return next()
    }

    // Check if user has ALL of the required permissions
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

/**
 * Middleware to require admin role (ROOT or admin)
 */
export async function requireAdmin(c: Context, next: Next) {
  const auth = c.get('auth') as AuthContext | undefined

  if (!auth) {
    return c.json({ error: true, message: 'Chưa xác thực' }, 401)
  }

  // ROOT is always admin
  if (auth.isRoot) {
    return next()
  }

  // Check for admin role
  if (!auth.roles.includes('admin')) {
    return c.json({ 
      error: true, 
      message: 'Chỉ quản trị viên mới có quyền thực hiện thao tác này' 
    }, 403)
  }

  await next()
}

/**
 * Middleware to require ROOT role only
 * Even admin cannot access
 */
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

/**
 * Get all permissions for an employee (from roles + direct assignments)
 * 
 * Permission sources:
 * 1. Role-based: employee_roles → roles → role_permissions → permissions
 * 2. Direct: employee_permissions (can grant or revoke)
 */
async function getEmployeePermissions(employeeId: number): Promise<string[]> {
  // Get role-based permissions
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

  // Get direct permissions (grants and revocations)
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
        // Revocation takes precedence
        permissionSet.delete(ep.permissions.code)
      }
    }
  })

  return Array.from(permissionSet)
}

/**
 * Helper to check if requesting user can manage target employee
 * - ROOT can manage anyone
 * - Admin can manage non-ROOT employees
 * - Cannot manage employees with higher or equal role level
 */
export async function canManageEmployee(
  requesterAuth: AuthContext, 
  targetEmployeeId: number
): Promise<boolean> {
  // ROOT can manage anyone
  if (requesterAuth.isRoot) {
    return true
  }

  // Get target's roles and check for ROOT
  const { data: targetRoles } = await supabaseAdmin
    .from('employee_roles')
    .select('roles(code, level)')
    .eq('employee_id', targetEmployeeId)

  // Check if target is ROOT
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isTargetRoot = targetRoles?.some((er: any) => er.roles?.code === 'root')
  if (isTargetRoot) {
    return false // Only ROOT can manage ROOT
  }

  // Get requester's minimum level (lower = higher privilege)
  const { data: requesterRoles } = await supabaseAdmin
    .from('employee_roles')
    .select('roles(level)')
    .eq('employee_id', requesterAuth.employeeId)

  const requesterMinLevel = Math.min(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(requesterRoles?.map((r: any) => r.roles?.level ?? 999) ?? [999])
  )

  // Get target's minimum level
  const targetMinLevel = Math.min(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(targetRoles?.map((r: any) => r.roles?.level ?? 999) ?? [999])
  )

  // Can only manage employees with higher level number (lower privilege)
  return requesterMinLevel < targetMinLevel
}
