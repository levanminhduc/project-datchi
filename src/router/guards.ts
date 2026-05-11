// src/router/guards.ts

import type { Router } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import type { RouteMeta } from '@/types/auth'
import { useSidebar } from '@/composables/useSidebar'
import type { NavItem } from '@/types/navigation'

const APP_TITLE = 'Hòa Thọ Điện Bàn'

interface NavLabelResult {
  label: string
  parentLabel: string | null
}

function findNavLabelWithParent(navItems: NavItem[], path: string, parentLabel: string | null = null): NavLabelResult | null {
  const normalizedPath = path.replace(/#.*$/, '')
  for (const item of navItems) {
    const itemPath = item.to?.replace(/#.*$/, '')
    if (itemPath === normalizedPath) {
      return { label: item.label, parentLabel }
    }
    if (item.children) {
      const result = findNavLabelWithParent(item.children, path, item.label)
      if (result) return result
    }
  }
  return null
}

/**
 * Setup router navigation guards for authentication and authorization
 *
 * IMPORTANT: All routes require authentication BY DEFAULT.
 * Only routes explicitly marked with `public: true` can be accessed without login.
 *
 * Permission check order:
 * 1. Public routes (meta.public: true) - allow without auth
 * 2. Auth check - redirect to login if not authenticated
 * 3. ROOT check - if user is ROOT, bypass all permission checks
 * 4. Admin check - if route requires admin
 * 5. Permission checks - OR logic or AND logic
 */
export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    const auth = useAuth()
    const meta = to.meta as RouteMeta

    // Initialize auth state if not done (restores session from Supabase Auth)
    await auth.init()

    // Check if route is public (explicitly marked as public: true)
    // Also support legacy requiresAuth: false for backward compatibility
    const isPublicRoute = meta.public === true || meta.requiresAuth === false

    if (isPublicRoute) {
      // Public route - allow access
      // But redirect to home if already authenticated and trying to access login
      if (to.path === '/login' && auth.isAuthenticated.value) {
        return next('/')
      }
      return next()
    }

    // All other routes require authentication by default
    if (!auth.isAuthenticated.value) {
      return next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }

    // ROOT bypasses ALL permission checks
    if (auth.checkIsRoot()) {
      return next()
    }

    // Check if route requires ROOT only
    if (meta.requiresRoot) {
      return next('/forbidden') // Not ROOT, deny access
    }

    // Check if route requires admin (ROOT or admin role)
    if (meta.requiresAdmin) {
      if (!auth.isAdmin()) {
        return next('/forbidden')
      }
      // Admin check passed, continue
    }

    // Check permissions (OR logic)
    if (meta.permissions && meta.permissions.length > 0) {
      const hasAccess = auth.hasAnyPermission(meta.permissions)

      if (!hasAccess) {
        return next(meta.redirectTo || '/forbidden')
      }
    }

    // Check all permissions (AND logic)
    if (meta.allPermissions && meta.allPermissions.length > 0) {
      const hasAllAccess = auth.hasAllPermissions(meta.allPermissions)

      if (!hasAllAccess) {
        return next(meta.redirectTo || '/forbidden')
      }
    }

    // All checks passed
    next()
  })

  // Update page title from route meta or sidebar nav label
  router.afterEach((to) => {
    const meta = to.meta as RouteMeta
    const { navItems } = useSidebar()

    // Home page - just show app title
    if (to.path === '/' || to.path === '/#top') {
      document.title = APP_TITLE
      return
    }

    // Find page label and parent from sidebar
    const navResult = findNavLabelWithParent(navItems, to.path)
    const pageTitle = meta.title || navResult?.label

    if (pageTitle) {
      // If has parent: "Page | Parent", else "Page | App Title"
      const suffix = navResult?.parentLabel || APP_TITLE
      document.title = `${pageTitle} | ${suffix}`
    } else {
      document.title = APP_TITLE
    }
  })
}
