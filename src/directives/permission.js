"use strict";
// src/directives/permission.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.vPermission = void 0;
var useAuth_1 = require("@/composables/useAuth");
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
exports.vPermission = {
    mounted: function (el, binding) {
        checkPermission(el, binding);
    },
    updated: function (el, binding) {
        checkPermission(el, binding);
    },
};
function checkPermission(el, binding) {
    var _a;
    var value = binding.value, arg = binding.arg, modifiers = binding.modifiers;
    var auth = (0, useAuth_1.useAuth)();
    if (!value)
        return;
    // ROOT bypasses all permission checks
    if (auth.checkIsRoot()) {
        el.style.display = '';
        return;
    }
    var permissions = Array.isArray(value) ? value : [value];
    var mode = arg === 'all' ? 'all' : 'any';
    var shouldHide = modifiers.hide;
    var hasAccess;
    if (mode === 'all') {
        hasAccess = auth.hasAllPermissions(permissions);
    }
    else {
        hasAccess = auth.hasAnyPermission(permissions);
    }
    if (!hasAccess) {
        if (shouldHide) {
            (_a = el.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(el);
        }
        else {
            el.style.display = 'none';
        }
    }
    else {
        el.style.display = '';
    }
}
// Register globally in main.ts
// app.directive('permission', vPermission)
