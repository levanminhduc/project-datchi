// src/directives/permission.ts

import type { Directive, DirectiveBinding } from 'vue'
import { useAuth } from '@/composables/useAuth'

type PermissionValue = string | string[]

/**
 * v-permission directive for conditional rendering based on permissions
 *
 * ROOT users bypass all permission checks - elements are always visible.
 *
 * Usage:
 * v-permission="'thread.inventory.view'"
 * v-permission="['thread.inventory.view', 'thread.inventory.edit']"
 * v-permission:all="['admin.users.view', 'admin.users.manage']"
 * v-permission.hide="'admin.roles.view'"
 */
export const vPermission: Directive<HTMLElement, PermissionValue> = {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  },
}

function checkPermission(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
  const { value, arg, modifiers } = binding
  const auth = useAuth()

  if (!value) return

  // ROOT bypasses all permission checks
  if (auth.checkIsRoot()) {
    el.style.display = ''
    return
  }

  const permissions = Array.isArray(value) ? value : [value]
  const mode = arg === 'all' ? 'all' : 'any'
  const shouldHide = modifiers.hide

  let hasAccess: boolean

  if (mode === 'all') {
    hasAccess = auth.hasAllPermissions(permissions)
  } else {
    hasAccess = auth.hasAnyPermission(permissions)
  }

  if (!hasAccess) {
    if (shouldHide) {
      el.parentNode?.removeChild(el)
    } else {
      el.style.display = 'none'
    }
  } else {
    el.style.display = ''
  }
}

// Register globally in main.ts
// app.directive('permission', vPermission)
