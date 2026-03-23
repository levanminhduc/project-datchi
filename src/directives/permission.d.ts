import type { Directive } from 'vue';
type PermissionValue = string | string[];
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
export declare const vPermission: Directive<HTMLElement, PermissionValue>;
export {};
