"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var layout_1 = require("@/components/ui/layout");
var cards_1 = require("@/components/ui/cards");
var feedback_1 = require("@/components/ui/feedback");
var useSnackbar_1 = require("@/composables/useSnackbar");
var useConfirm_1 = require("@/composables/useConfirm");
var usePermissionManagement_1 = require("@/composables/usePermissionManagement");
// Route protection - ROOT only
definePage({
    meta: {
        requiresRoot: true, // Only ROOT can access (auth required by default)
        title: 'Phân Quyền',
    },
});
var snackbar = (0, useSnackbar_1.useSnackbar)();
var confirm = (0, useConfirm_1.useConfirm)().confirm;
var permMgmt = (0, usePermissionManagement_1.usePermissionManagement)();
// ============================================
// Tab State
// ============================================
var activeTab = (0, vue_1.ref)('roles');
// ============================================
// Tab 1: Roles Management
// ============================================
var roleDialogOpen = (0, vue_1.ref)(false);
var roleDialogMode = (0, vue_1.ref)('create');
var selectedRole = (0, vue_1.ref)(null);
var roleForm = (0, vue_1.ref)({
    code: '',
    name: '',
    description: '',
    level: 10,
    permissionIds: [],
});
var rolePermissionIds = (0, vue_1.ref)([]);
var roleColumns = [
    { name: 'code', label: 'Mã', field: 'code', align: 'left', sortable: true },
    { name: 'name', label: 'Tên vai trò', field: 'name', align: 'left', sortable: true },
    { name: 'description', label: 'Mô tả', field: 'description', align: 'left' },
    { name: 'level', label: 'Cấp độ', field: 'level', align: 'center', sortable: true },
    {
        name: 'isSystem',
        label: 'Hệ thống',
        field: 'isSystem',
        align: 'center',
        format: function (val) { return (val ? 'Có' : 'Không'); },
    },
    {
        name: 'isActive',
        label: 'Trạng thái',
        field: 'isActive',
        align: 'center',
    },
    { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' },
];
function openCreateRoleDialog() {
    roleDialogMode.value = 'create';
    selectedRole.value = null;
    roleForm.value = {
        code: '',
        name: '',
        description: '',
        level: 10,
        permissionIds: [],
    };
    rolePermissionIds.value = [];
    roleDialogOpen.value = true;
}
function openEditRoleDialog(role) {
    return __awaiter(this, void 0, void 0, function () {
        var perms, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    roleDialogMode.value = 'edit';
                    selectedRole.value = role;
                    roleForm.value = {
                        code: role.code,
                        name: role.name,
                        description: role.description || '',
                        level: role.level,
                        permissionIds: [],
                    };
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, permMgmt.getRolePermissions(role.id)];
                case 2:
                    perms = _b.sent();
                    rolePermissionIds.value = perms.map(function (p) { return p.id; });
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    rolePermissionIds.value = [];
                    return [3 /*break*/, 4];
                case 4:
                    roleDialogOpen.value = true;
                    return [2 /*return*/];
            }
        });
    });
}
function saveRole() {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!(roleDialogMode.value === 'create')) return [3 /*break*/, 2];
                    return [4 /*yield*/, permMgmt.createRole(__assign(__assign({}, roleForm.value), { permissionIds: rolePermissionIds.value }))];
                case 1:
                    _a.sent();
                    snackbar.success('Tạo vai trò thành công');
                    return [3 /*break*/, 4];
                case 2:
                    if (!selectedRole.value) return [3 /*break*/, 4];
                    return [4 /*yield*/, permMgmt.updateRole(selectedRole.value.id, {
                            name: roleForm.value.name,
                            description: roleForm.value.description,
                            level: roleForm.value.level,
                            permissionIds: rolePermissionIds.value,
                        })];
                case 3:
                    _a.sent();
                    snackbar.success('Cập nhật vai trò thành công');
                    _a.label = 4;
                case 4:
                    roleDialogOpen.value = false;
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    snackbar.error(err_1 instanceof Error ? err_1.message : 'Có lỗi xảy ra');
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function confirmDeleteRole(role) {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (role.isSystem) {
                        snackbar.warning('Không thể xóa vai trò hệ thống');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, confirm("B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n x\u00F3a vai tr\u00F2 \"".concat(role.name, "\"?"))];
                case 1:
                    confirmed = _a.sent();
                    if (!confirmed)
                        return [2 /*return*/];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, permMgmt.deleteRole(role.id)];
                case 3:
                    _a.sent();
                    snackbar.success('Xóa vai trò thành công');
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _a.sent();
                    snackbar.error(err_2 instanceof Error ? err_2.message : 'Có lỗi xảy ra');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function toggleRolePermission(permId) {
    var idx = rolePermissionIds.value.indexOf(permId);
    if (idx >= 0) {
        rolePermissionIds.value.splice(idx, 1);
    }
    else {
        rolePermissionIds.value.push(permId);
    }
}
function isPermissionSelected(permId) {
    return rolePermissionIds.value.includes(permId);
}
function selectAllModulePermissions(module) {
    var modulePerms = permMgmt.permissionsByModule.value[module] || [];
    var allSelected = modulePerms.every(function (p) { return rolePermissionIds.value.includes(p.id); });
    if (allSelected) {
        // Deselect all in module
        for (var _i = 0, modulePerms_1 = modulePerms; _i < modulePerms_1.length; _i++) {
            var p = modulePerms_1[_i];
            var idx = rolePermissionIds.value.indexOf(p.id);
            if (idx >= 0)
                rolePermissionIds.value.splice(idx, 1);
        }
    }
    else {
        // Select all in module
        for (var _a = 0, modulePerms_2 = modulePerms; _a < modulePerms_2.length; _a++) {
            var p = modulePerms_2[_a];
            if (!rolePermissionIds.value.includes(p.id)) {
                rolePermissionIds.value.push(p.id);
            }
        }
    }
}
function isModuleAllSelected(module) {
    var modulePerms = permMgmt.permissionsByModule.value[module] || [];
    return modulePerms.length > 0 && modulePerms.every(function (p) { return rolePermissionIds.value.includes(p.id); });
}
function isModuleSomeSelected(module) {
    var modulePerms = permMgmt.permissionsByModule.value[module] || [];
    var selected = modulePerms.filter(function (p) { return rolePermissionIds.value.includes(p.id); });
    return selected.length > 0 && selected.length < modulePerms.length;
}
// ============================================
// Tab 2: Permissions List
// ============================================
var permissionFilter = (0, vue_1.ref)('');
var filteredPermissionsByModule = (0, vue_1.computed)(function () {
    var filter = permissionFilter.value.toLowerCase();
    if (!filter)
        return permMgmt.permissionsByModule.value;
    var result = {};
    for (var _i = 0, _a = Object.entries(permMgmt.permissionsByModule.value); _i < _a.length; _i++) {
        var _b = _a[_i], module_1 = _b[0], perms = _b[1];
        var filtered = perms.filter(function (p) {
            var _a;
            return p.code.toLowerCase().includes(filter) ||
                p.name.toLowerCase().includes(filter) ||
                ((_a = p.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(filter));
        });
        if (filtered.length > 0) {
            result[module_1] = filtered;
        }
    }
    return result;
});
var filteredModuleList = (0, vue_1.computed)(function () { return Object.keys(filteredPermissionsByModule.value).sort(); });
// Permission CRUD
var permDialogOpen = (0, vue_1.ref)(false);
var permDialogMode = (0, vue_1.ref)('create');
var selectedPermission = (0, vue_1.ref)(null);
var permForm = (0, vue_1.ref)({
    code: '',
    name: '',
    description: '',
    module: '',
    resource: '',
    action: 'VIEW',
    routePath: '',
    isPageAccess: false,
    sortOrder: 0,
});
var actionOptions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE'];
var existingModules = (0, vue_1.computed)(function () {
    var modules = new Set();
    for (var _i = 0, _a = permMgmt.permissions.value; _i < _a.length; _i++) {
        var perm = _a[_i];
        modules.add(perm.module);
    }
    return Array.from(modules).sort();
});
var moduleFilterOptions = (0, vue_1.ref)([]);
function filterModuleOptions(val, update) {
    update(function () {
        if (!val) {
            moduleFilterOptions.value = existingModules.value;
        }
        else {
            var needle_1 = val.toLowerCase();
            moduleFilterOptions.value = existingModules.value.filter(function (m) {
                return m.toLowerCase().includes(needle_1);
            });
        }
    });
}
function openCreatePermissionDialog() {
    permDialogMode.value = 'create';
    selectedPermission.value = null;
    permForm.value = {
        code: '',
        name: '',
        description: '',
        module: '',
        resource: '',
        action: 'VIEW',
        routePath: '',
        isPageAccess: false,
        sortOrder: 0,
    };
    permDialogOpen.value = true;
}
function openEditPermissionDialog(perm) {
    permDialogMode.value = 'edit';
    selectedPermission.value = perm;
    permForm.value = {
        code: perm.code,
        name: perm.name,
        description: perm.description || '',
        module: perm.module,
        resource: perm.resource,
        action: perm.action,
        routePath: perm.routePath || '',
        isPageAccess: perm.isPageAccess,
        sortOrder: perm.sortOrder,
    };
    permDialogOpen.value = true;
}
function savePermission() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _code, updateData, err_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    if (!(permDialogMode.value === 'create')) return [3 /*break*/, 2];
                    return [4 /*yield*/, permMgmt.createPermission(permForm.value)];
                case 1:
                    _b.sent();
                    snackbar.success('Tạo quyền thành công');
                    return [3 /*break*/, 4];
                case 2:
                    if (!selectedPermission.value) return [3 /*break*/, 4];
                    _a = permForm.value, _code = _a.code, updateData = __rest(_a, ["code"]);
                    return [4 /*yield*/, permMgmt.updatePermission(selectedPermission.value.id, updateData)];
                case 3:
                    _b.sent();
                    snackbar.success('Cập nhật quyền thành công');
                    _b.label = 4;
                case 4:
                    permDialogOpen.value = false;
                    return [3 /*break*/, 6];
                case 5:
                    err_3 = _b.sent();
                    snackbar.error(err_3 instanceof Error ? err_3.message : 'Có lỗi xảy ra');
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function confirmDeletePermission(perm) {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirm("B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n x\u00F3a quy\u1EC1n \"".concat(perm.name, "\" (").concat(perm.code, ")?"))];
                case 1:
                    confirmed = _a.sent();
                    if (!confirmed)
                        return [2 /*return*/];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, permMgmt.deletePermission(perm.id)];
                case 3:
                    _a.sent();
                    snackbar.success('Xóa quyền thành công');
                    return [3 /*break*/, 5];
                case 4:
                    err_4 = _a.sent();
                    snackbar.error(err_4 instanceof Error ? err_4.message : 'Có lỗi xảy ra');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// ============================================
// Tab 3: Employee Permissions
// ============================================
var employeeOptions = (0, vue_1.ref)([]);
var selectedEmployee = (0, vue_1.ref)(null);
var employeeData = (0, vue_1.ref)(null);
var employeeRoleIds = (0, vue_1.ref)([]);
var employeeDirectPerms = (0, vue_1.ref)(new Map());
var employeeLoading = (0, vue_1.ref)(false);
function filterEmployees(val, update) {
    return __awaiter(this, void 0, void 0, function () {
        var results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (val.length < 2) {
                        update(function () {
                            employeeOptions.value = [];
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, permMgmt.searchEmployees(val)];
                case 1:
                    results = _a.sent();
                    update(function () {
                        employeeOptions.value = results;
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function onEmployeeSelected(emp) {
    return __awaiter(this, void 0, void 0, function () {
        var data, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!emp) {
                        employeeData.value = null;
                        return [2 /*return*/];
                    }
                    employeeLoading.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, permMgmt.getEmployeeRolesPermissions(emp.id)];
                case 2:
                    data = _a.sent();
                    employeeData.value = data;
                    if (data) {
                        employeeRoleIds.value = data.roles.map(function (r) { return r.id; });
                        employeeDirectPerms.value = new Map(data.directPermissions.map(function (dp) { return [dp.permission.id, dp.granted]; }));
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_5 = _a.sent();
                    snackbar.error(err_5 instanceof Error ? err_5.message : 'Không thể tải thông tin');
                    return [3 /*break*/, 5];
                case 4:
                    employeeLoading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function toggleEmployeeRole(roleId) {
    var idx = employeeRoleIds.value.indexOf(roleId);
    if (idx >= 0) {
        employeeRoleIds.value.splice(idx, 1);
    }
    else {
        employeeRoleIds.value.push(roleId);
    }
}
function setDirectPermGranted(permId, checked) {
    if (checked) {
        // Nếu check "Cấp quyền" → set granted = true
        employeeDirectPerms.value.set(permId, true);
    }
    else {
        // Nếu uncheck "Cấp quyền" → xóa override (không còn override)
        var current = employeeDirectPerms.value.get(permId);
        if (current === true) {
            employeeDirectPerms.value.delete(permId);
        }
    }
}
function setDirectPermDenied(permId, checked) {
    if (checked) {
        // Nếu check "Từ chối" → set granted = false
        employeeDirectPerms.value.set(permId, false);
    }
    else {
        // Nếu uncheck "Từ chối" → xóa override
        var current = employeeDirectPerms.value.get(permId);
        if (current === false) {
            employeeDirectPerms.value.delete(permId);
        }
    }
}
function isDirectPermGranted(permId) {
    return employeeDirectPerms.value.get(permId) === true;
}
function isDirectPermDenied(permId) {
    return employeeDirectPerms.value.get(permId) === false;
}
function saveEmployeeRoles() {
    return __awaiter(this, void 0, void 0, function () {
        var err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedEmployee.value)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, permMgmt.updateEmployeeRoles(selectedEmployee.value.id, employeeRoleIds.value)];
                case 2:
                    _a.sent();
                    snackbar.success('Cập nhật vai trò thành công');
                    // Refresh data
                    return [4 /*yield*/, onEmployeeSelected(selectedEmployee.value)];
                case 3:
                    // Refresh data
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_6 = _a.sent();
                    snackbar.error(err_6 instanceof Error ? err_6.message : 'Có lỗi xảy ra');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function saveEmployeePermissions() {
    return __awaiter(this, void 0, void 0, function () {
        var updates, _i, _a, _b, permId, granted, err_7;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!selectedEmployee.value)
                        return [2 /*return*/];
                    updates = [];
                    for (_i = 0, _a = employeeDirectPerms.value.entries(); _i < _a.length; _i++) {
                        _b = _a[_i], permId = _b[0], granted = _b[1];
                        updates.push({ permissionId: permId, granted: granted });
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, permMgmt.updateEmployeePermissions(selectedEmployee.value.id, updates)];
                case 2:
                    _c.sent();
                    snackbar.success('Cập nhật quyền thành công');
                    // Refresh data
                    return [4 /*yield*/, onEmployeeSelected(selectedEmployee.value)];
                case 3:
                    // Refresh data
                    _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    err_7 = _c.sent();
                    snackbar.error(err_7 instanceof Error ? err_7.message : 'Có lỗi xảy ra');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// ============================================
// Lifecycle
// ============================================
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, permMgmt.initialize()];
            case 1:
                _b.sent();
                return [3 /*break*/, 3];
            case 2:
                _a = _b.sent();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPage | typeof __VLS_components.QPage | typeof __VLS_components.qPage | typeof __VLS_components.QPage} */
qPage;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    padding: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        padding: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.PageHeader} */
layout_1.PageHeader;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    title: "Phân Quyền",
    subtitle: "Quản lý vai trò và quyền truy cập hệ thống",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Phân Quyền",
        subtitle: "Quản lý vai trò và quyền truy cập hệ thống",
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
/** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
qTabs;
// @ts-ignore
var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12(__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey q-mt-md" }), { activeColor: "primary", indicatorColor: "primary", align: "left", narrowIndicator: true })));
var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey q-mt-md" }), { activeColor: "primary", indicatorColor: "primary", align: "left", narrowIndicator: true })], __VLS_functionalComponentArgsRest(__VLS_13), false));
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
var __VLS_17 = __VLS_15.slots.default;
var __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    name: "roles",
    label: "Vai trò",
    icon: "admin_panel_settings",
}));
var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{
        name: "roles",
        label: "Vai trò",
        icon: "admin_panel_settings",
    }], __VLS_functionalComponentArgsRest(__VLS_19), false));
var __VLS_23;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
    name: "permissions",
    label: "Danh sách quyền",
    icon: "security",
}));
var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
        name: "permissions",
        label: "Danh sách quyền",
        icon: "security",
    }], __VLS_functionalComponentArgsRest(__VLS_24), false));
var __VLS_28;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
    name: "employees",
    label: "Phân quyền nhân viên",
    icon: "people",
}));
var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([{
        name: "employees",
        label: "Phân quyền nhân viên",
        icon: "people",
    }], __VLS_functionalComponentArgsRest(__VLS_29), false));
// @ts-ignore
[activeTab,];
var __VLS_15;
var __VLS_33;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({}));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_34), false));
var __VLS_38;
/** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
qTabPanels;
// @ts-ignore
var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38(__assign({ modelValue: (__VLS_ctx.activeTab), animated: true }, { class: "q-mt-md" })));
var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.activeTab), animated: true }, { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_39), false));
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
var __VLS_43 = __VLS_41.slots.default;
var __VLS_44;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44(__assign({ name: "roles" }, { class: "q-pa-none" })));
var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([__assign({ name: "roles" }, { class: "q-pa-none" })], __VLS_functionalComponentArgsRest(__VLS_45), false));
/** @type {__VLS_StyleScopedClasses['q-pa-none']} */ ;
var __VLS_49 = __VLS_47.slots.default;
var __VLS_50;
/** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
cards_1.AppCard;
// @ts-ignore
var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({}));
var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_51), false));
var __VLS_55 = __VLS_53.slots.default;
var __VLS_56;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56(__assign({ class: "row items-center justify-between" })));
var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([__assign({ class: "row items-center justify-between" })], __VLS_functionalComponentArgsRest(__VLS_57), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
var __VLS_61 = __VLS_59.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
var __VLS_62;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm vai trò" })));
var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm vai trò" })], __VLS_functionalComponentArgsRest(__VLS_63), false));
var __VLS_67;
var __VLS_68 = ({ click: {} },
    { onClick: (__VLS_ctx.openCreateRoleDialog) });
var __VLS_65;
var __VLS_66;
// @ts-ignore
[activeTab, openCreateRoleDialog,];
var __VLS_59;
var __VLS_69;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
    rows: (__VLS_ctx.permMgmt.roles.value),
    columns: (__VLS_ctx.roleColumns),
    rowKey: "id",
    loading: (__VLS_ctx.permMgmt.loading.value),
    flat: true,
    bordered: true,
    pagination: ({ rowsPerPage: 10 }),
}));
var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([{
        rows: (__VLS_ctx.permMgmt.roles.value),
        columns: (__VLS_ctx.roleColumns),
        rowKey: "id",
        loading: (__VLS_ctx.permMgmt.loading.value),
        flat: true,
        bordered: true,
        pagination: ({ rowsPerPage: 10 }),
    }], __VLS_functionalComponentArgsRest(__VLS_70), false));
var __VLS_74 = __VLS_72.slots.default;
{
    var __VLS_75 = __VLS_72.slots["body-cell-isActive"];
    var props = __VLS_vSlot(__VLS_75)[0];
    var __VLS_76 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({
        props: (props),
    }));
    var __VLS_78 = __VLS_77.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_77), false));
    var __VLS_81 = __VLS_79.slots.default;
    var __VLS_82 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({
        color: (props.row.isActive ? 'positive' : 'negative'),
        textColor: "white",
        size: "sm",
        dense: true,
    }));
    var __VLS_84 = __VLS_83.apply(void 0, __spreadArray([{
            color: (props.row.isActive ? 'positive' : 'negative'),
            textColor: "white",
            size: "sm",
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_83), false));
    var __VLS_87 = __VLS_85.slots.default;
    (props.row.isActive ? 'Hoạt động' : 'Tắt');
    // @ts-ignore
    [permMgmt, permMgmt, roleColumns,];
    var __VLS_85;
    // @ts-ignore
    [];
    var __VLS_79;
    // @ts-ignore
    [];
}
{
    var __VLS_88 = __VLS_72.slots["body-cell-actions"];
    var props_1 = __VLS_vSlot(__VLS_88)[0];
    var __VLS_89 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
        props: (props_1),
    }));
    var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([{
            props: (props_1),
        }], __VLS_functionalComponentArgsRest(__VLS_90), false));
    var __VLS_94 = __VLS_92.slots.default;
    var __VLS_95 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_96 = __VLS_asFunctionalComponent1(__VLS_95, new __VLS_95(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, color: "primary", icon: "edit" })));
    var __VLS_97 = __VLS_96.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, color: "primary", icon: "edit" })], __VLS_functionalComponentArgsRest(__VLS_96), false));
    var __VLS_100 = void 0;
    var __VLS_101 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openEditRoleDialog(props_1.row);
                // @ts-ignore
                [openEditRoleDialog,];
            } });
    var __VLS_102 = __VLS_98.slots.default;
    var __VLS_103 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_104 = __VLS_asFunctionalComponent1(__VLS_103, new __VLS_103({}));
    var __VLS_105 = __VLS_104.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_104), false));
    var __VLS_108 = __VLS_106.slots.default;
    // @ts-ignore
    [];
    var __VLS_106;
    // @ts-ignore
    [];
    var __VLS_98;
    var __VLS_99;
    var __VLS_109 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, color: "negative", icon: "delete", disable: (props_1.row.isSystem) })));
    var __VLS_111 = __VLS_110.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, color: "negative", icon: "delete", disable: (props_1.row.isSystem) })], __VLS_functionalComponentArgsRest(__VLS_110), false));
    var __VLS_114 = void 0;
    var __VLS_115 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.confirmDeleteRole(props_1.row);
                // @ts-ignore
                [confirmDeleteRole,];
            } });
    var __VLS_116 = __VLS_112.slots.default;
    var __VLS_117 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117({}));
    var __VLS_119 = __VLS_118.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_118), false));
    var __VLS_122 = __VLS_120.slots.default;
    (props_1.row.isSystem ? 'Không thể xóa vai trò hệ thống' : 'Xóa');
    // @ts-ignore
    [];
    var __VLS_120;
    // @ts-ignore
    [];
    var __VLS_112;
    var __VLS_113;
    // @ts-ignore
    [];
    var __VLS_92;
    // @ts-ignore
    [];
}
{
    var __VLS_123 = __VLS_72.slots["no-data"];
    var __VLS_124 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.EmptyState} */
    feedback_1.EmptyState;
    // @ts-ignore
    var __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124({
        icon: "admin_panel_settings",
        title: "Chưa có vai trò",
        description: "Nhấn nút Thêm vai trò để tạo mới",
    }));
    var __VLS_126 = __VLS_125.apply(void 0, __spreadArray([{
            icon: "admin_panel_settings",
            title: "Chưa có vai trò",
            description: "Nhấn nút Thêm vai trò để tạo mới",
        }], __VLS_functionalComponentArgsRest(__VLS_125), false));
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_72;
// @ts-ignore
[];
var __VLS_53;
var __VLS_129;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129({
    modelValue: (__VLS_ctx.roleDialogOpen),
    persistent: true,
}));
var __VLS_131 = __VLS_130.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.roleDialogOpen),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_130), false));
var __VLS_134 = __VLS_132.slots.default;
var __VLS_135;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_136 = __VLS_asFunctionalComponent1(__VLS_135, new __VLS_135(__assign({ style: {} })));
var __VLS_137 = __VLS_136.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_136), false));
var __VLS_140 = __VLS_138.slots.default;
var __VLS_141;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_142 = __VLS_asFunctionalComponent1(__VLS_141, new __VLS_141(__assign({ class: "row items-center q-pb-none" })));
var __VLS_143 = __VLS_142.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_142), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_146 = __VLS_144.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
(__VLS_ctx.roleDialogMode === 'create' ? 'Tạo vai trò mới' : 'Sửa vai trò');
var __VLS_147;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({}));
var __VLS_149 = __VLS_148.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_148), false));
var __VLS_152;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_153 = __VLS_asFunctionalComponent1(__VLS_152, new __VLS_152({
    icon: "close",
    flat: true,
    round: true,
    dense: true,
}));
var __VLS_154 = __VLS_153.apply(void 0, __spreadArray([{
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_153), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[roleDialogOpen, roleDialogMode, vClosePopup,];
var __VLS_144;
var __VLS_157;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_158 = __VLS_asFunctionalComponent1(__VLS_157, new __VLS_157({}));
var __VLS_159 = __VLS_158.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_158), false));
var __VLS_162 = __VLS_160.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_163;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_164 = __VLS_asFunctionalComponent1(__VLS_163, new __VLS_163({
    modelValue: (__VLS_ctx.roleForm.code),
    label: "Mã vai trò *",
    readonly: (__VLS_ctx.roleDialogMode === 'edit'),
    outlined: true,
    dense: true,
    rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
}));
var __VLS_165 = __VLS_164.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.roleForm.code),
        label: "Mã vai trò *",
        readonly: (__VLS_ctx.roleDialogMode === 'edit'),
        outlined: true,
        dense: true,
        rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_164), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_168;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_169 = __VLS_asFunctionalComponent1(__VLS_168, new __VLS_168({
    modelValue: (__VLS_ctx.roleForm.name),
    label: "Tên vai trò *",
    outlined: true,
    dense: true,
    rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
}));
var __VLS_170 = __VLS_169.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.roleForm.name),
        label: "Tên vai trò *",
        outlined: true,
        dense: true,
        rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_169), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_173;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_174 = __VLS_asFunctionalComponent1(__VLS_173, new __VLS_173({
    modelValue: (__VLS_ctx.roleForm.level),
    modelModifiers: { number: true, },
    label: "Cấp độ (0=cao nhất)",
    type: "number",
    outlined: true,
    dense: true,
    rules: ([function (v) { return v >= 0 || 'Phải >= 0'; }]),
}));
var __VLS_175 = __VLS_174.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.roleForm.level),
        modelModifiers: { number: true, },
        label: "Cấp độ (0=cao nhất)",
        type: "number",
        outlined: true,
        dense: true,
        rules: ([function (v) { return v >= 0 || 'Phải >= 0'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_174), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_178;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_179 = __VLS_asFunctionalComponent1(__VLS_178, new __VLS_178({
    modelValue: (__VLS_ctx.roleForm.description),
    label: "Mô tả",
    outlined: true,
    dense: true,
}));
var __VLS_180 = __VLS_179.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.roleForm.description),
        label: "Mô tả",
        outlined: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_179), false));
var __VLS_183;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_184 = __VLS_asFunctionalComponent1(__VLS_183, new __VLS_183(__assign({ class: "q-my-md" })));
var __VLS_185 = __VLS_184.apply(void 0, __spreadArray([__assign({ class: "q-my-md" })], __VLS_functionalComponentArgsRest(__VLS_184), false));
/** @type {__VLS_StyleScopedClasses['q-my-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-sm" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ style: {} }));
var __VLS_188;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_189 = __VLS_asFunctionalComponent1(__VLS_188, new __VLS_188({
    bordered: true,
    separator: true,
}));
var __VLS_190 = __VLS_189.apply(void 0, __spreadArray([{
        bordered: true,
        separator: true,
    }], __VLS_functionalComponentArgsRest(__VLS_189), false));
var __VLS_193 = __VLS_191.slots.default;
var _loop_1 = function (module_2) {
    var __VLS_194 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qExpansionItem | typeof __VLS_components.QExpansionItem | typeof __VLS_components.qExpansionItem | typeof __VLS_components.QExpansionItem} */
    qExpansionItem;
    // @ts-ignore
    var __VLS_195 = __VLS_asFunctionalComponent1(__VLS_194, new __VLS_194({
        key: (module_2),
        label: (module_2),
        headerClass: "bg-grey-2",
        expandIconClass: "text-primary",
    }));
    var __VLS_196 = __VLS_195.apply(void 0, __spreadArray([{
            key: (module_2),
            label: (module_2),
            headerClass: "bg-grey-2",
            expandIconClass: "text-primary",
        }], __VLS_functionalComponentArgsRest(__VLS_195), false));
    var __VLS_199 = __VLS_197.slots.default;
    {
        var __VLS_200 = __VLS_197.slots.header;
        var __VLS_201 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_202 = __VLS_asFunctionalComponent1(__VLS_201, new __VLS_201({
            avatar: true,
        }));
        var __VLS_203 = __VLS_202.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_202), false));
        var __VLS_206 = __VLS_204.slots.default;
        var __VLS_207 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox} */
        qCheckbox;
        // @ts-ignore
        var __VLS_208 = __VLS_asFunctionalComponent1(__VLS_207, new __VLS_207(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onClick': {} }), { modelValue: (__VLS_ctx.isModuleAllSelected(module_2)), indeterminate: (__VLS_ctx.isModuleSomeSelected(module_2)) })));
        var __VLS_209 = __VLS_208.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onClick': {} }), { modelValue: (__VLS_ctx.isModuleAllSelected(module_2)), indeterminate: (__VLS_ctx.isModuleSomeSelected(module_2)) })], __VLS_functionalComponentArgsRest(__VLS_208), false));
        var __VLS_212 = void 0;
        var __VLS_213 = ({ 'update:modelValue': {} },
            { 'onUpdate:modelValue': function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    __VLS_ctx.selectAllModulePermissions(module_2);
                    // @ts-ignore
                    [permMgmt, roleDialogMode, roleForm, roleForm, roleForm, roleForm, isModuleAllSelected, isModuleSomeSelected, selectAllModulePermissions,];
                } });
        var __VLS_214 = ({ click: {} },
            { onClick: function () { } });
        // @ts-ignore
        [];
        var __VLS_215 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_216 = __VLS_asFunctionalComponent1(__VLS_215, new __VLS_215({}));
        var __VLS_217 = __VLS_216.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_216), false));
        var __VLS_220 = __VLS_218.slots.default;
        var __VLS_221 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221({}));
        var __VLS_223 = __VLS_222.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_222), false));
        var __VLS_226 = __VLS_224.slots.default;
        (module_2);
        // @ts-ignore
        [];
        var __VLS_227 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_228 = __VLS_asFunctionalComponent1(__VLS_227, new __VLS_227({
            caption: true,
        }));
        var __VLS_229 = __VLS_228.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_228), false));
        var __VLS_232 = __VLS_230.slots.default;
        ((__VLS_ctx.permMgmt.permissionsByModule.value[module_2] || []).length);
        // @ts-ignore
        [permMgmt,];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    }
    var __VLS_233 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_234 = __VLS_asFunctionalComponent1(__VLS_233, new __VLS_233({
        flat: true,
    }));
    var __VLS_235 = __VLS_234.apply(void 0, __spreadArray([{
            flat: true,
        }], __VLS_functionalComponentArgsRest(__VLS_234), false));
    var __VLS_238 = __VLS_236.slots.default;
    var __VLS_239 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_240 = __VLS_asFunctionalComponent1(__VLS_239, new __VLS_239(__assign({ class: "q-pt-none" })));
    var __VLS_241 = __VLS_240.apply(void 0, __spreadArray([__assign({ class: "q-pt-none" })], __VLS_functionalComponentArgsRest(__VLS_240), false));
    /** @type {__VLS_StyleScopedClasses['q-pt-none']} */ ;
    var __VLS_244 = __VLS_242.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    var _loop_5 = function (perm) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (perm.id) }, { class: "col-12 col-sm-6 col-md-4" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
        var __VLS_245 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox | typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox} */
        qCheckbox;
        // @ts-ignore
        var __VLS_246 = __VLS_asFunctionalComponent1(__VLS_245, new __VLS_245(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.isPermissionSelected(perm.id)), label: (perm.name), dense: true })));
        var __VLS_247 = __VLS_246.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.isPermissionSelected(perm.id)), label: (perm.name), dense: true })], __VLS_functionalComponentArgsRest(__VLS_246), false));
        var __VLS_250 = void 0;
        var __VLS_251 = ({ 'update:modelValue': {} },
            { 'onUpdate:modelValue': function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    __VLS_ctx.toggleRolePermission(perm.id);
                    // @ts-ignore
                    [permMgmt, isPermissionSelected, toggleRolePermission,];
                } });
        var __VLS_252 = __VLS_248.slots.default;
        if (perm.description) {
            var __VLS_253 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
            qTooltip;
            // @ts-ignore
            var __VLS_254 = __VLS_asFunctionalComponent1(__VLS_253, new __VLS_253({}));
            var __VLS_255 = __VLS_254.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_254), false));
            var __VLS_258 = __VLS_256.slots.default;
            (perm.description);
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    for (var _p = 0, _q = __VLS_vFor((__VLS_ctx.permMgmt.permissionsByModule.value[module_2])); _p < _q.length; _p++) {
        var perm = _q[_p][0];
        _loop_5(perm);
    }
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    // @ts-ignore
    [];
};
var __VLS_210, __VLS_211, __VLS_204, __VLS_224, __VLS_230, __VLS_218, __VLS_256, __VLS_248, __VLS_249, __VLS_242, __VLS_236, __VLS_197;
for (var _i = 0, _c = __VLS_vFor((__VLS_ctx.permMgmt.moduleList.value)); _i < _c.length; _i++) {
    var module_2 = _c[_i][0];
    _loop_1(module_2);
}
// @ts-ignore
[];
var __VLS_191;
// @ts-ignore
[];
var __VLS_160;
var __VLS_259;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_260 = __VLS_asFunctionalComponent1(__VLS_259, new __VLS_259(__assign({ align: "right" }, { class: "q-pa-md" })));
var __VLS_261 = __VLS_260.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_260), false));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_264 = __VLS_262.slots.default;
var __VLS_265;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_266 = __VLS_asFunctionalComponent1(__VLS_265, new __VLS_265({
    flat: true,
    label: "Hủy",
}));
var __VLS_267 = __VLS_266.apply(void 0, __spreadArray([{
        flat: true,
        label: "Hủy",
    }], __VLS_functionalComponentArgsRest(__VLS_266), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_270;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_271 = __VLS_asFunctionalComponent1(__VLS_270, new __VLS_270(__assign({ 'onClick': {} }, { color: "primary", label: (__VLS_ctx.roleDialogMode === 'create' ? 'Tạo' : 'Lưu'), loading: (__VLS_ctx.permMgmt.loading.value) })));
var __VLS_272 = __VLS_271.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: (__VLS_ctx.roleDialogMode === 'create' ? 'Tạo' : 'Lưu'), loading: (__VLS_ctx.permMgmt.loading.value) })], __VLS_functionalComponentArgsRest(__VLS_271), false));
var __VLS_275;
var __VLS_276 = ({ click: {} },
    { onClick: (__VLS_ctx.saveRole) });
var __VLS_273;
var __VLS_274;
// @ts-ignore
[permMgmt, roleDialogMode, vClosePopup, saveRole,];
var __VLS_262;
// @ts-ignore
[];
var __VLS_138;
// @ts-ignore
[];
var __VLS_132;
// @ts-ignore
[];
var __VLS_47;
var __VLS_277;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_278 = __VLS_asFunctionalComponent1(__VLS_277, new __VLS_277(__assign({ name: "permissions" }, { class: "q-pa-none" })));
var __VLS_279 = __VLS_278.apply(void 0, __spreadArray([__assign({ name: "permissions" }, { class: "q-pa-none" })], __VLS_functionalComponentArgsRest(__VLS_278), false));
/** @type {__VLS_StyleScopedClasses['q-pa-none']} */ ;
var __VLS_282 = __VLS_280.slots.default;
var __VLS_283;
/** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
cards_1.AppCard;
// @ts-ignore
var __VLS_284 = __VLS_asFunctionalComponent1(__VLS_283, new __VLS_283({}));
var __VLS_285 = __VLS_284.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_284), false));
var __VLS_288 = __VLS_286.slots.default;
var __VLS_289;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_290 = __VLS_asFunctionalComponent1(__VLS_289, new __VLS_289(__assign({ class: "row items-center q-col-gutter-md" })));
var __VLS_291 = __VLS_290.apply(void 0, __spreadArray([__assign({ class: "row items-center q-col-gutter-md" })], __VLS_functionalComponentArgsRest(__VLS_290), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
var __VLS_294 = __VLS_292.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-5" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-5']} */ ;
var __VLS_295;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_296 = __VLS_asFunctionalComponent1(__VLS_295, new __VLS_295({
    modelValue: (__VLS_ctx.permissionFilter),
    placeholder: "Tìm kiếm quyền...",
    outlined: true,
    dense: true,
    clearable: true,
}));
var __VLS_297 = __VLS_296.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.permissionFilter),
        placeholder: "Tìm kiếm quyền...",
        outlined: true,
        dense: true,
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_296), false));
var __VLS_300 = __VLS_298.slots.default;
{
    var __VLS_301 = __VLS_298.slots.prepend;
    var __VLS_302 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_303 = __VLS_asFunctionalComponent1(__VLS_302, new __VLS_302({
        name: "search",
    }));
    var __VLS_304 = __VLS_303.apply(void 0, __spreadArray([{
            name: "search",
        }], __VLS_functionalComponentArgsRest(__VLS_303), false));
    // @ts-ignore
    [permissionFilter,];
}
// @ts-ignore
[];
var __VLS_298;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3 text-right" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
var __VLS_307;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_308 = __VLS_asFunctionalComponent1(__VLS_307, new __VLS_307(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm quyền" })));
var __VLS_309 = __VLS_308.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm quyền" })], __VLS_functionalComponentArgsRest(__VLS_308), false));
var __VLS_312;
var __VLS_313 = ({ click: {} },
    { onClick: (__VLS_ctx.openCreatePermissionDialog) });
var __VLS_310;
var __VLS_311;
// @ts-ignore
[openCreatePermissionDialog,];
var __VLS_292;
var __VLS_314;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_315 = __VLS_asFunctionalComponent1(__VLS_314, new __VLS_314({
    bordered: true,
    separator: true,
}));
var __VLS_316 = __VLS_315.apply(void 0, __spreadArray([{
        bordered: true,
        separator: true,
    }], __VLS_functionalComponentArgsRest(__VLS_315), false));
var __VLS_319 = __VLS_317.slots.default;
var _loop_2 = function (module_3) {
    var __VLS_320 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qExpansionItem | typeof __VLS_components.QExpansionItem | typeof __VLS_components.qExpansionItem | typeof __VLS_components.QExpansionItem} */
    qExpansionItem;
    // @ts-ignore
    var __VLS_321 = __VLS_asFunctionalComponent1(__VLS_320, new __VLS_320({
        key: (module_3),
        label: (module_3),
        headerClass: "bg-grey-1 text-weight-medium",
        expandIconClass: "text-primary",
        defaultOpened: true,
    }));
    var __VLS_322 = __VLS_321.apply(void 0, __spreadArray([{
            key: (module_3),
            label: (module_3),
            headerClass: "bg-grey-1 text-weight-medium",
            expandIconClass: "text-primary",
            defaultOpened: true,
        }], __VLS_functionalComponentArgsRest(__VLS_321), false));
    var __VLS_325 = __VLS_323.slots.default;
    {
        var __VLS_326 = __VLS_323.slots.header;
        var __VLS_327 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_328 = __VLS_asFunctionalComponent1(__VLS_327, new __VLS_327({
            avatar: true,
        }));
        var __VLS_329 = __VLS_328.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_328), false));
        var __VLS_332 = __VLS_330.slots.default;
        var __VLS_333 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_334 = __VLS_asFunctionalComponent1(__VLS_333, new __VLS_333({
            name: "folder",
            color: "primary",
        }));
        var __VLS_335 = __VLS_334.apply(void 0, __spreadArray([{
                name: "folder",
                color: "primary",
            }], __VLS_functionalComponentArgsRest(__VLS_334), false));
        // @ts-ignore
        [filteredModuleList,];
        var __VLS_338 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_339 = __VLS_asFunctionalComponent1(__VLS_338, new __VLS_338({}));
        var __VLS_340 = __VLS_339.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_339), false));
        var __VLS_343 = __VLS_341.slots.default;
        var __VLS_344 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_345 = __VLS_asFunctionalComponent1(__VLS_344, new __VLS_344({}));
        var __VLS_346 = __VLS_345.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_345), false));
        var __VLS_349 = __VLS_347.slots.default;
        (module_3);
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        var __VLS_350 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_351 = __VLS_asFunctionalComponent1(__VLS_350, new __VLS_350({
            side: true,
        }));
        var __VLS_352 = __VLS_351.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_351), false));
        var __VLS_355 = __VLS_353.slots.default;
        var __VLS_356 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_357 = __VLS_asFunctionalComponent1(__VLS_356, new __VLS_356({
            color: "primary",
        }));
        var __VLS_358 = __VLS_357.apply(void 0, __spreadArray([{
                color: "primary",
            }], __VLS_functionalComponentArgsRest(__VLS_357), false));
        var __VLS_361 = __VLS_359.slots.default;
        ((__VLS_ctx.filteredPermissionsByModule[module_3] || []).length);
        // @ts-ignore
        [filteredPermissionsByModule,];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    }
    var __VLS_362 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_363 = __VLS_asFunctionalComponent1(__VLS_362, new __VLS_362({
        rows: (__VLS_ctx.filteredPermissionsByModule[module_3] || []),
        columns: ([
            { name: 'code', label: 'Mã quyền', field: 'code', align: 'left' },
            { name: 'name', label: 'Tên quyền', field: 'name', align: 'left' },
            { name: 'action', label: 'Hành động', field: 'action', align: 'center' },
            { name: 'description', label: 'Mô tả', field: 'description', align: 'left' },
            { name: 'routePath', label: 'Route', field: 'routePath', align: 'left' },
            { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' },
        ]),
        rowKey: "id",
        flat: true,
        dense: true,
        pagination: ({ rowsPerPage: 0 }),
        hidePagination: true,
    }));
    var __VLS_364 = __VLS_363.apply(void 0, __spreadArray([{
            rows: (__VLS_ctx.filteredPermissionsByModule[module_3] || []),
            columns: ([
                { name: 'code', label: 'Mã quyền', field: 'code', align: 'left' },
                { name: 'name', label: 'Tên quyền', field: 'name', align: 'left' },
                { name: 'action', label: 'Hành động', field: 'action', align: 'center' },
                { name: 'description', label: 'Mô tả', field: 'description', align: 'left' },
                { name: 'routePath', label: 'Route', field: 'routePath', align: 'left' },
                { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' },
            ]),
            rowKey: "id",
            flat: true,
            dense: true,
            pagination: ({ rowsPerPage: 0 }),
            hidePagination: true,
        }], __VLS_functionalComponentArgsRest(__VLS_363), false));
    var __VLS_367 = __VLS_365.slots.default;
    {
        var __VLS_368 = __VLS_365.slots["body-cell-action"];
        var props = __VLS_vSlot(__VLS_368)[0];
        var __VLS_369 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_370 = __VLS_asFunctionalComponent1(__VLS_369, new __VLS_369({
            props: (props),
        }));
        var __VLS_371 = __VLS_370.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_370), false));
        var __VLS_374 = __VLS_372.slots.default;
        var __VLS_375 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
        qChip;
        // @ts-ignore
        var __VLS_376 = __VLS_asFunctionalComponent1(__VLS_375, new __VLS_375({
            color: (props.row.action === 'VIEW'
                ? 'blue'
                : props.row.action === 'CREATE'
                    ? 'green'
                    : props.row.action === 'EDIT'
                        ? 'orange'
                        : props.row.action === 'DELETE'
                            ? 'red'
                            : 'grey'),
            textColor: "white",
            size: "sm",
            dense: true,
        }));
        var __VLS_377 = __VLS_376.apply(void 0, __spreadArray([{
                color: (props.row.action === 'VIEW'
                    ? 'blue'
                    : props.row.action === 'CREATE'
                        ? 'green'
                        : props.row.action === 'EDIT'
                            ? 'orange'
                            : props.row.action === 'DELETE'
                                ? 'red'
                                : 'grey'),
                textColor: "white",
                size: "sm",
                dense: true,
            }], __VLS_functionalComponentArgsRest(__VLS_376), false));
        var __VLS_380 = __VLS_378.slots.default;
        (props.row.action);
        // @ts-ignore
        [filteredPermissionsByModule,];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    }
    {
        var __VLS_381 = __VLS_365.slots["body-cell-actions"];
        var props_2 = __VLS_vSlot(__VLS_381)[0];
        var __VLS_382 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_383 = __VLS_asFunctionalComponent1(__VLS_382, new __VLS_382({
            props: (props_2),
        }));
        var __VLS_384 = __VLS_383.apply(void 0, __spreadArray([{
                props: (props_2),
            }], __VLS_functionalComponentArgsRest(__VLS_383), false));
        var __VLS_387 = __VLS_385.slots.default;
        var __VLS_388 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_389 = __VLS_asFunctionalComponent1(__VLS_388, new __VLS_388(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, color: "primary", icon: "edit", size: "sm" })));
        var __VLS_390 = __VLS_389.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, color: "primary", icon: "edit", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_389), false));
        var __VLS_393 = void 0;
        var __VLS_394 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    __VLS_ctx.openEditPermissionDialog(props_2.row);
                    // @ts-ignore
                    [openEditPermissionDialog,];
                } });
        var __VLS_395 = __VLS_391.slots.default;
        var __VLS_396 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_397 = __VLS_asFunctionalComponent1(__VLS_396, new __VLS_396({}));
        var __VLS_398 = __VLS_397.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_397), false));
        var __VLS_401 = __VLS_399.slots.default;
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        var __VLS_402 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_403 = __VLS_asFunctionalComponent1(__VLS_402, new __VLS_402(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, color: "negative", icon: "delete", size: "sm" })));
        var __VLS_404 = __VLS_403.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, color: "negative", icon: "delete", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_403), false));
        var __VLS_407 = void 0;
        var __VLS_408 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    __VLS_ctx.confirmDeletePermission(props_2.row);
                    // @ts-ignore
                    [confirmDeletePermission,];
                } });
        var __VLS_409 = __VLS_405.slots.default;
        var __VLS_410 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_411 = __VLS_asFunctionalComponent1(__VLS_410, new __VLS_410({}));
        var __VLS_412 = __VLS_411.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_411), false));
        var __VLS_415 = __VLS_413.slots.default;
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    // @ts-ignore
    [];
};
var __VLS_330, __VLS_347, __VLS_341, __VLS_359, __VLS_353, __VLS_378, __VLS_372, __VLS_399, __VLS_391, __VLS_392, __VLS_413, __VLS_405, __VLS_406, __VLS_385, __VLS_365, __VLS_323;
for (var _d = 0, _e = __VLS_vFor((__VLS_ctx.filteredModuleList)); _d < _e.length; _d++) {
    var module_3 = _e[_d][0];
    _loop_2(module_3);
}
// @ts-ignore
[];
var __VLS_317;
if (__VLS_ctx.filteredModuleList.length === 0) {
    var __VLS_416 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.EmptyState} */
    feedback_1.EmptyState;
    // @ts-ignore
    var __VLS_417 = __VLS_asFunctionalComponent1(__VLS_416, new __VLS_416({
        icon: "search_off",
        title: "Không tìm thấy quyền",
        description: (__VLS_ctx.permissionFilter ? 'Thử từ khóa khác' : 'Chưa có quyền nào trong hệ thống'),
    }));
    var __VLS_418 = __VLS_417.apply(void 0, __spreadArray([{
            icon: "search_off",
            title: "Không tìm thấy quyền",
            description: (__VLS_ctx.permissionFilter ? 'Thử từ khóa khác' : 'Chưa có quyền nào trong hệ thống'),
        }], __VLS_functionalComponentArgsRest(__VLS_417), false));
}
// @ts-ignore
[permissionFilter, filteredModuleList,];
var __VLS_286;
var __VLS_421;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_422 = __VLS_asFunctionalComponent1(__VLS_421, new __VLS_421({
    modelValue: (__VLS_ctx.permDialogOpen),
    persistent: true,
}));
var __VLS_423 = __VLS_422.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.permDialogOpen),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_422), false));
var __VLS_426 = __VLS_424.slots.default;
var __VLS_427;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_428 = __VLS_asFunctionalComponent1(__VLS_427, new __VLS_427(__assign({ style: {} })));
var __VLS_429 = __VLS_428.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_428), false));
var __VLS_432 = __VLS_430.slots.default;
var __VLS_433;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_434 = __VLS_asFunctionalComponent1(__VLS_433, new __VLS_433(__assign({ class: "row items-center q-pb-none" })));
var __VLS_435 = __VLS_434.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_434), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_438 = __VLS_436.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
(__VLS_ctx.permDialogMode === 'create' ? 'Tạo quyền mới' : 'Sửa quyền');
var __VLS_439;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_440 = __VLS_asFunctionalComponent1(__VLS_439, new __VLS_439({}));
var __VLS_441 = __VLS_440.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_440), false));
var __VLS_444;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_445 = __VLS_asFunctionalComponent1(__VLS_444, new __VLS_444({
    icon: "close",
    flat: true,
    round: true,
    dense: true,
}));
var __VLS_446 = __VLS_445.apply(void 0, __spreadArray([{
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_445), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[vClosePopup, permDialogOpen, permDialogMode,];
var __VLS_436;
var __VLS_449;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_450 = __VLS_asFunctionalComponent1(__VLS_449, new __VLS_449({}));
var __VLS_451 = __VLS_450.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_450), false));
var __VLS_454 = __VLS_452.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_455;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_456 = __VLS_asFunctionalComponent1(__VLS_455, new __VLS_455({
    modelValue: (__VLS_ctx.permForm.code),
    label: "Mã quyền *",
    readonly: (__VLS_ctx.permDialogMode === 'edit'),
    outlined: true,
    dense: true,
    hint: "Ví dụ: module.resource.action",
    rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
}));
var __VLS_457 = __VLS_456.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.permForm.code),
        label: "Mã quyền *",
        readonly: (__VLS_ctx.permDialogMode === 'edit'),
        outlined: true,
        dense: true,
        hint: "Ví dụ: module.resource.action",
        rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_456), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_460;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_461 = __VLS_asFunctionalComponent1(__VLS_460, new __VLS_460({
    modelValue: (__VLS_ctx.permForm.name),
    label: "Tên quyền *",
    outlined: true,
    dense: true,
    rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
}));
var __VLS_462 = __VLS_461.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.permForm.name),
        label: "Tên quyền *",
        outlined: true,
        dense: true,
        rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_461), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_465;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_466 = __VLS_asFunctionalComponent1(__VLS_465, new __VLS_465({
    modelValue: (__VLS_ctx.permForm.description),
    label: "Mô tả",
    outlined: true,
    dense: true,
}));
var __VLS_467 = __VLS_466.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.permForm.description),
        label: "Mô tả",
        outlined: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_466), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_470;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_471 = __VLS_asFunctionalComponent1(__VLS_470, new __VLS_470(__assign({ 'onFilter': {} }, { modelValue: (__VLS_ctx.permForm.module), label: "Module *", options: (__VLS_ctx.moduleFilterOptions), outlined: true, dense: true, useInput: true, newValueMode: "add-unique", rules: ([function (v) { return !!v || 'Bắt buộc'; }]) })));
var __VLS_472 = __VLS_471.apply(void 0, __spreadArray([__assign({ 'onFilter': {} }, { modelValue: (__VLS_ctx.permForm.module), label: "Module *", options: (__VLS_ctx.moduleFilterOptions), outlined: true, dense: true, useInput: true, newValueMode: "add-unique", rules: ([function (v) { return !!v || 'Bắt buộc'; }]) })], __VLS_functionalComponentArgsRest(__VLS_471), false));
var __VLS_475;
var __VLS_476 = ({ filter: {} },
    { onFilter: (__VLS_ctx.filterModuleOptions) });
var __VLS_473;
var __VLS_474;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_477;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_478 = __VLS_asFunctionalComponent1(__VLS_477, new __VLS_477({
    modelValue: (__VLS_ctx.permForm.resource),
    label: "Resource *",
    outlined: true,
    dense: true,
    rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
}));
var __VLS_479 = __VLS_478.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.permForm.resource),
        label: "Resource *",
        outlined: true,
        dense: true,
        rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_478), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_482;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_483 = __VLS_asFunctionalComponent1(__VLS_482, new __VLS_482({
    modelValue: (__VLS_ctx.permForm.action),
    label: "Hành động *",
    options: (__VLS_ctx.actionOptions),
    outlined: true,
    dense: true,
    rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
}));
var __VLS_484 = __VLS_483.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.permForm.action),
        label: "Hành động *",
        options: (__VLS_ctx.actionOptions),
        outlined: true,
        dense: true,
        rules: ([function (v) { return !!v || 'Bắt buộc'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_483), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_487;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_488 = __VLS_asFunctionalComponent1(__VLS_487, new __VLS_487({
    modelValue: (__VLS_ctx.permForm.routePath),
    label: "Route path",
    outlined: true,
    dense: true,
}));
var __VLS_489 = __VLS_488.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.permForm.routePath),
        label: "Route path",
        outlined: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_488), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_492;
/** @ts-ignore @type {typeof __VLS_components.qToggle | typeof __VLS_components.QToggle} */
qToggle;
// @ts-ignore
var __VLS_493 = __VLS_asFunctionalComponent1(__VLS_492, new __VLS_492({
    modelValue: (__VLS_ctx.permForm.isPageAccess),
    label: "Truy cập trang",
}));
var __VLS_494 = __VLS_493.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.permForm.isPageAccess),
        label: "Truy cập trang",
    }], __VLS_functionalComponentArgsRest(__VLS_493), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_497;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_498 = __VLS_asFunctionalComponent1(__VLS_497, new __VLS_497({
    modelValue: (__VLS_ctx.permForm.sortOrder),
    modelModifiers: { number: true, },
    label: "Thứ tự",
    type: "number",
    outlined: true,
    dense: true,
}));
var __VLS_499 = __VLS_498.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.permForm.sortOrder),
        modelModifiers: { number: true, },
        label: "Thứ tự",
        type: "number",
        outlined: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_498), false));
// @ts-ignore
[permDialogMode, permForm, permForm, permForm, permForm, permForm, permForm, permForm, permForm, permForm, moduleFilterOptions, filterModuleOptions, actionOptions,];
var __VLS_452;
var __VLS_502;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_503 = __VLS_asFunctionalComponent1(__VLS_502, new __VLS_502(__assign({ align: "right" }, { class: "q-pa-md" })));
var __VLS_504 = __VLS_503.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_503), false));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_507 = __VLS_505.slots.default;
var __VLS_508;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_509 = __VLS_asFunctionalComponent1(__VLS_508, new __VLS_508({
    flat: true,
    label: "Hủy",
}));
var __VLS_510 = __VLS_509.apply(void 0, __spreadArray([{
        flat: true,
        label: "Hủy",
    }], __VLS_functionalComponentArgsRest(__VLS_509), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_513;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_514 = __VLS_asFunctionalComponent1(__VLS_513, new __VLS_513(__assign({ 'onClick': {} }, { color: "primary", label: (__VLS_ctx.permDialogMode === 'create' ? 'Tạo' : 'Lưu'), loading: (__VLS_ctx.permMgmt.loading.value) })));
var __VLS_515 = __VLS_514.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: (__VLS_ctx.permDialogMode === 'create' ? 'Tạo' : 'Lưu'), loading: (__VLS_ctx.permMgmt.loading.value) })], __VLS_functionalComponentArgsRest(__VLS_514), false));
var __VLS_518;
var __VLS_519 = ({ click: {} },
    { onClick: (__VLS_ctx.savePermission) });
var __VLS_516;
var __VLS_517;
// @ts-ignore
[permMgmt, vClosePopup, permDialogMode, savePermission,];
var __VLS_505;
// @ts-ignore
[];
var __VLS_430;
// @ts-ignore
[];
var __VLS_424;
// @ts-ignore
[];
var __VLS_280;
var __VLS_520;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_521 = __VLS_asFunctionalComponent1(__VLS_520, new __VLS_520(__assign({ name: "employees" }, { class: "q-pa-none" })));
var __VLS_522 = __VLS_521.apply(void 0, __spreadArray([__assign({ name: "employees" }, { class: "q-pa-none" })], __VLS_functionalComponentArgsRest(__VLS_521), false));
/** @type {__VLS_StyleScopedClasses['q-pa-none']} */ ;
var __VLS_525 = __VLS_523.slots.default;
var __VLS_526;
/** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
cards_1.AppCard;
// @ts-ignore
var __VLS_527 = __VLS_asFunctionalComponent1(__VLS_526, new __VLS_526({}));
var __VLS_528 = __VLS_527.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_527), false));
var __VLS_531 = __VLS_529.slots.default;
var __VLS_532;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_533 = __VLS_asFunctionalComponent1(__VLS_532, new __VLS_532(__assign({ class: "row items-center q-col-gutter-md" })));
var __VLS_534 = __VLS_533.apply(void 0, __spreadArray([__assign({ class: "row items-center q-col-gutter-md" })], __VLS_functionalComponentArgsRest(__VLS_533), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
var __VLS_537 = __VLS_535.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_538;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect | typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_539 = __VLS_asFunctionalComponent1(__VLS_538, new __VLS_538(__assign(__assign({ 'onFilter': {} }, { 'onUpdate:modelValue': {} }), { modelValue: (__VLS_ctx.selectedEmployee), options: (__VLS_ctx.employeeOptions), optionLabel: "fullName", optionValue: "id", label: "Tìm nhân viên...", outlined: true, dense: true, useInput: true, clearable: true })));
var __VLS_540 = __VLS_539.apply(void 0, __spreadArray([__assign(__assign({ 'onFilter': {} }, { 'onUpdate:modelValue': {} }), { modelValue: (__VLS_ctx.selectedEmployee), options: (__VLS_ctx.employeeOptions), optionLabel: "fullName", optionValue: "id", label: "Tìm nhân viên...", outlined: true, dense: true, useInput: true, clearable: true })], __VLS_functionalComponentArgsRest(__VLS_539), false));
var __VLS_543;
var __VLS_544 = ({ filter: {} },
    { onFilter: (__VLS_ctx.filterEmployees) });
var __VLS_545 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onEmployeeSelected) });
var __VLS_546 = __VLS_541.slots.default;
{
    var __VLS_547 = __VLS_541.slots["no-option"];
    var __VLS_548 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_549 = __VLS_asFunctionalComponent1(__VLS_548, new __VLS_548({}));
    var __VLS_550 = __VLS_549.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_549), false));
    var __VLS_553 = __VLS_551.slots.default;
    var __VLS_554 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_555 = __VLS_asFunctionalComponent1(__VLS_554, new __VLS_554(__assign({ class: "text-grey" })));
    var __VLS_556 = __VLS_555.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_555), false));
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    var __VLS_559 = __VLS_557.slots.default;
    // @ts-ignore
    [selectedEmployee, employeeOptions, filterEmployees, onEmployeeSelected,];
    var __VLS_557;
    // @ts-ignore
    [];
    var __VLS_551;
    // @ts-ignore
    [];
}
{
    var __VLS_560 = __VLS_541.slots.option;
    var scope = __VLS_vSlot(__VLS_560)[0];
    var __VLS_561 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_562 = __VLS_asFunctionalComponent1(__VLS_561, new __VLS_561(__assign({}, (scope.itemProps))));
    var __VLS_563 = __VLS_562.apply(void 0, __spreadArray([__assign({}, (scope.itemProps))], __VLS_functionalComponentArgsRest(__VLS_562), false));
    var __VLS_566 = __VLS_564.slots.default;
    var __VLS_567 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_568 = __VLS_asFunctionalComponent1(__VLS_567, new __VLS_567({
        avatar: true,
    }));
    var __VLS_569 = __VLS_568.apply(void 0, __spreadArray([{
            avatar: true,
        }], __VLS_functionalComponentArgsRest(__VLS_568), false));
    var __VLS_572 = __VLS_570.slots.default;
    var __VLS_573 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
    qAvatar;
    // @ts-ignore
    var __VLS_574 = __VLS_asFunctionalComponent1(__VLS_573, new __VLS_573({
        color: "primary",
        textColor: "white",
        size: "sm",
    }));
    var __VLS_575 = __VLS_574.apply(void 0, __spreadArray([{
            color: "primary",
            textColor: "white",
            size: "sm",
        }], __VLS_functionalComponentArgsRest(__VLS_574), false));
    var __VLS_578 = __VLS_576.slots.default;
    (((_a = scope.opt.fullName) === null || _a === void 0 ? void 0 : _a.charAt(0)) || '?');
    // @ts-ignore
    [];
    var __VLS_576;
    // @ts-ignore
    [];
    var __VLS_570;
    var __VLS_579 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_580 = __VLS_asFunctionalComponent1(__VLS_579, new __VLS_579({}));
    var __VLS_581 = __VLS_580.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_580), false));
    var __VLS_584 = __VLS_582.slots.default;
    var __VLS_585 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_586 = __VLS_asFunctionalComponent1(__VLS_585, new __VLS_585({}));
    var __VLS_587 = __VLS_586.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_586), false));
    var __VLS_590 = __VLS_588.slots.default;
    (scope.opt.fullName);
    // @ts-ignore
    [];
    var __VLS_588;
    var __VLS_591 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_592 = __VLS_asFunctionalComponent1(__VLS_591, new __VLS_591({
        caption: true,
    }));
    var __VLS_593 = __VLS_592.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_592), false));
    var __VLS_596 = __VLS_594.slots.default;
    (scope.opt.employeeId);
    (scope.opt.department);
    // @ts-ignore
    [];
    var __VLS_594;
    // @ts-ignore
    [];
    var __VLS_582;
    // @ts-ignore
    [];
    var __VLS_564;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_541;
var __VLS_542;
// @ts-ignore
[];
var __VLS_535;
var __VLS_597;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_598 = __VLS_asFunctionalComponent1(__VLS_597, new __VLS_597({
    showing: (__VLS_ctx.employeeLoading),
}));
var __VLS_599 = __VLS_598.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.employeeLoading),
    }], __VLS_functionalComponentArgsRest(__VLS_598), false));
if (!__VLS_ctx.selectedEmployee) {
    var __VLS_602 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.EmptyState} */
    feedback_1.EmptyState;
    // @ts-ignore
    var __VLS_603 = __VLS_asFunctionalComponent1(__VLS_602, new __VLS_602({
        icon: "person_search",
        title: "Chọn nhân viên",
        description: "Tìm và chọn nhân viên để xem và chỉnh sửa quyền",
    }));
    var __VLS_604 = __VLS_603.apply(void 0, __spreadArray([{
            icon: "person_search",
            title: "Chọn nhân viên",
            description: "Tìm và chọn nhân viên để xem và chỉnh sửa quyền",
        }], __VLS_functionalComponentArgsRest(__VLS_603), false));
}
else if (__VLS_ctx.employeeData) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_607 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
    qAvatar;
    // @ts-ignore
    var __VLS_608 = __VLS_asFunctionalComponent1(__VLS_607, new __VLS_607({
        color: "primary",
        textColor: "white",
        size: "56px",
    }));
    var __VLS_609 = __VLS_608.apply(void 0, __spreadArray([{
            color: "primary",
            textColor: "white",
            size: "56px",
        }], __VLS_functionalComponentArgsRest(__VLS_608), false));
    var __VLS_612 = __VLS_610.slots.default;
    (((_b = __VLS_ctx.employeeData.employee.fullName) === null || _b === void 0 ? void 0 : _b.charAt(0)) || '?');
    // @ts-ignore
    [selectedEmployee, employeeLoading, employeeData, employeeData,];
    var __VLS_610;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    (__VLS_ctx.employeeData.employee.fullName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    (__VLS_ctx.employeeData.employee.employeeId);
    (__VLS_ctx.employeeData.employee.department);
    (__VLS_ctx.employeeData.employee.chucVu);
    if (__VLS_ctx.employeeData.isRoot) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_613 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
        qChip;
        // @ts-ignore
        var __VLS_614 = __VLS_asFunctionalComponent1(__VLS_613, new __VLS_613({
            color: "deep-purple",
            textColor: "white",
            icon: "verified_user",
        }));
        var __VLS_615 = __VLS_614.apply(void 0, __spreadArray([{
                color: "deep-purple",
                textColor: "white",
                icon: "verified_user",
            }], __VLS_functionalComponentArgsRest(__VLS_614), false));
        var __VLS_618 = __VLS_616.slots.default;
        // @ts-ignore
        [employeeData, employeeData, employeeData, employeeData, employeeData,];
        var __VLS_616;
    }
    var __VLS_619 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_620 = __VLS_asFunctionalComponent1(__VLS_619, new __VLS_619(__assign({ class: "q-mb-md" })));
    var __VLS_621 = __VLS_620.apply(void 0, __spreadArray([__assign({ class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_620), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_624 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_625 = __VLS_asFunctionalComponent1(__VLS_624, new __VLS_624(__assign({ name: "admin_panel_settings" }, { class: "q-mr-xs" })));
    var __VLS_626 = __VLS_625.apply(void 0, __spreadArray([__assign({ name: "admin_panel_settings" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_625), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var _loop_3 = function (role) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (role.id) }, { class: "col-12 col-sm-6 col-md-4" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
        var __VLS_629 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox | typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox} */
        qCheckbox;
        // @ts-ignore
        var __VLS_630 = __VLS_asFunctionalComponent1(__VLS_629, new __VLS_629(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.employeeRoleIds.includes(role.id)), label: (role.name), disable: (role.code === 'ROOT') })));
        var __VLS_631 = __VLS_630.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.employeeRoleIds.includes(role.id)), label: (role.name), disable: (role.code === 'ROOT') })], __VLS_functionalComponentArgsRest(__VLS_630), false));
        var __VLS_634 = void 0;
        var __VLS_635 = ({ 'update:modelValue': {} },
            { 'onUpdate:modelValue': function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(!__VLS_ctx.selectedEmployee))
                        return;
                    if (!(__VLS_ctx.employeeData))
                        return;
                    __VLS_ctx.toggleEmployeeRole(role.id);
                    // @ts-ignore
                    [permMgmt, employeeRoleIds, toggleEmployeeRole,];
                } });
        var __VLS_636 = __VLS_632.slots.default;
        if (role.description) {
            var __VLS_637 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
            qTooltip;
            // @ts-ignore
            var __VLS_638 = __VLS_asFunctionalComponent1(__VLS_637, new __VLS_637({}));
            var __VLS_639 = __VLS_638.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_638), false));
            var __VLS_642 = __VLS_640.slots.default;
            (role.description);
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_640, __VLS_632, __VLS_633;
    for (var _f = 0, _g = __VLS_vFor((__VLS_ctx.permMgmt.roles.value)); _f < _g.length; _f++) {
        var role = _g[_f][0];
        _loop_3(role);
    }
    var __VLS_643 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_644 = __VLS_asFunctionalComponent1(__VLS_643, new __VLS_643(__assign(__assign({ 'onClick': {} }, { color: "primary", label: "Lưu vai trò", icon: "save", loading: (__VLS_ctx.permMgmt.loading.value) }), { class: "q-mb-lg" })));
    var __VLS_645 = __VLS_644.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", label: "Lưu vai trò", icon: "save", loading: (__VLS_ctx.permMgmt.loading.value) }), { class: "q-mb-lg" })], __VLS_functionalComponentArgsRest(__VLS_644), false));
    var __VLS_648 = void 0;
    var __VLS_649 = ({ click: {} },
        { onClick: (__VLS_ctx.saveEmployeeRoles) });
    /** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
    var __VLS_646;
    var __VLS_647;
    var __VLS_650 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_651 = __VLS_asFunctionalComponent1(__VLS_650, new __VLS_650(__assign({ class: "q-mb-md" })));
    var __VLS_652 = __VLS_651.apply(void 0, __spreadArray([__assign({ class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_651), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_655 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_656 = __VLS_asFunctionalComponent1(__VLS_655, new __VLS_655(__assign({ name: "security" }, { class: "q-mr-xs" })));
    var __VLS_657 = __VLS_656.apply(void 0, __spreadArray([__assign({ name: "security" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_656), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ style: {} }));
    var __VLS_660 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_661 = __VLS_asFunctionalComponent1(__VLS_660, new __VLS_660({
        bordered: true,
        separator: true,
    }));
    var __VLS_662 = __VLS_661.apply(void 0, __spreadArray([{
            bordered: true,
            separator: true,
        }], __VLS_functionalComponentArgsRest(__VLS_661), false));
    var __VLS_665 = __VLS_663.slots.default;
    for (var _h = 0, _j = __VLS_vFor((__VLS_ctx.permMgmt.moduleList.value)); _h < _j.length; _h++) {
        var module_4 = _j[_h][0];
        var __VLS_666 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qExpansionItem | typeof __VLS_components.QExpansionItem | typeof __VLS_components.qExpansionItem | typeof __VLS_components.QExpansionItem} */
        qExpansionItem;
        // @ts-ignore
        var __VLS_667 = __VLS_asFunctionalComponent1(__VLS_666, new __VLS_666({
            key: (module_4),
            label: (module_4),
            headerClass: "bg-grey-1",
        }));
        var __VLS_668 = __VLS_667.apply(void 0, __spreadArray([{
                key: (module_4),
                label: (module_4),
                headerClass: "bg-grey-1",
            }], __VLS_functionalComponentArgsRest(__VLS_667), false));
        var __VLS_671 = __VLS_669.slots.default;
        var __VLS_672 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
        qCard;
        // @ts-ignore
        var __VLS_673 = __VLS_asFunctionalComponent1(__VLS_672, new __VLS_672({
            flat: true,
        }));
        var __VLS_674 = __VLS_673.apply(void 0, __spreadArray([{
                flat: true,
            }], __VLS_functionalComponentArgsRest(__VLS_673), false));
        var __VLS_677 = __VLS_675.slots.default;
        var __VLS_678 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
        qCardSection;
        // @ts-ignore
        var __VLS_679 = __VLS_asFunctionalComponent1(__VLS_678, new __VLS_678(__assign({ class: "q-pt-none" })));
        var __VLS_680 = __VLS_679.apply(void 0, __spreadArray([__assign({ class: "q-pt-none" })], __VLS_functionalComponentArgsRest(__VLS_679), false));
        /** @type {__VLS_StyleScopedClasses['q-pt-none']} */ ;
        var __VLS_683 = __VLS_681.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
        var _loop_4 = function (perm) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (perm.id) }, { class: "col-12 col-sm-6 col-md-4" }));
            /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-sm q-pa-xs rounded-borders" }, { class: (__VLS_ctx.isDirectPermGranted(perm.id) ? 'bg-green-1' : __VLS_ctx.isDirectPermDenied(perm.id) ? 'bg-red-1' : '') }));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-gutter-x-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-grow text-body2 ellipsis" }));
            /** @type {__VLS_StyleScopedClasses['col-grow']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
            /** @type {__VLS_StyleScopedClasses['ellipsis']} */ ;
            (perm.name);
            if (perm.description) {
                var __VLS_684 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
                qTooltip;
                // @ts-ignore
                var __VLS_685 = __VLS_asFunctionalComponent1(__VLS_684, new __VLS_684({}));
                var __VLS_686 = __VLS_685.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_685), false));
                var __VLS_689 = __VLS_687.slots.default;
                (perm.description);
                // @ts-ignore
                [permMgmt, permMgmt, permMgmt, saveEmployeeRoles, isDirectPermGranted, isDirectPermDenied,];
            }
            var __VLS_690 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox | typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox} */
            qCheckbox;
            // @ts-ignore
            var __VLS_691 = __VLS_asFunctionalComponent1(__VLS_690, new __VLS_690(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.isDirectPermGranted(perm.id)), color: "positive", dense: true, size: "sm" })));
            var __VLS_692 = __VLS_691.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.isDirectPermGranted(perm.id)), color: "positive", dense: true, size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_691), false));
            var __VLS_695 = void 0;
            var __VLS_696 = ({ 'update:modelValue': {} },
                { 'onUpdate:modelValue': (function (val) { return __VLS_ctx.setDirectPermGranted(perm.id, val); }) });
            var __VLS_697 = __VLS_693.slots.default;
            var __VLS_698 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
            qTooltip;
            // @ts-ignore
            var __VLS_699 = __VLS_asFunctionalComponent1(__VLS_698, new __VLS_698({}));
            var __VLS_700 = __VLS_699.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_699), false));
            var __VLS_703 = __VLS_701.slots.default;
            // @ts-ignore
            [isDirectPermGranted, setDirectPermGranted,];
            // @ts-ignore
            [];
            var __VLS_704 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox | typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox} */
            qCheckbox;
            // @ts-ignore
            var __VLS_705 = __VLS_asFunctionalComponent1(__VLS_704, new __VLS_704(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.isDirectPermDenied(perm.id)), color: "negative", dense: true, size: "sm" })));
            var __VLS_706 = __VLS_705.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.isDirectPermDenied(perm.id)), color: "negative", dense: true, size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_705), false));
            var __VLS_709 = void 0;
            var __VLS_710 = ({ 'update:modelValue': {} },
                { 'onUpdate:modelValue': (function (val) { return __VLS_ctx.setDirectPermDenied(perm.id, val); }) });
            var __VLS_711 = __VLS_707.slots.default;
            var __VLS_712 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
            qTooltip;
            // @ts-ignore
            var __VLS_713 = __VLS_asFunctionalComponent1(__VLS_712, new __VLS_712({}));
            var __VLS_714 = __VLS_713.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_713), false));
            var __VLS_717 = __VLS_715.slots.default;
            // @ts-ignore
            [isDirectPermDenied, setDirectPermDenied,];
            // @ts-ignore
            [];
            // @ts-ignore
            [];
        };
        var __VLS_687, __VLS_701, __VLS_693, __VLS_694, __VLS_715, __VLS_707, __VLS_708;
        for (var _k = 0, _l = __VLS_vFor((__VLS_ctx.permMgmt.permissionsByModule.value[module_4])); _k < _l.length; _k++) {
            var perm = _l[_k][0];
            _loop_4(perm);
        }
        // @ts-ignore
        [];
        var __VLS_681;
        // @ts-ignore
        [];
        var __VLS_675;
        // @ts-ignore
        [];
        var __VLS_669;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_663;
    var __VLS_718 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_719 = __VLS_asFunctionalComponent1(__VLS_718, new __VLS_718(__assign(__assign({ 'onClick': {} }, { color: "primary", label: "Lưu quyền trực tiếp", icon: "save", loading: (__VLS_ctx.permMgmt.loading.value) }), { class: "q-mt-md" })));
    var __VLS_720 = __VLS_719.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", label: "Lưu quyền trực tiếp", icon: "save", loading: (__VLS_ctx.permMgmt.loading.value) }), { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_719), false));
    var __VLS_723 = void 0;
    var __VLS_724 = ({ click: {} },
        { onClick: (__VLS_ctx.saveEmployeePermissions) });
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    var __VLS_721;
    var __VLS_722;
    var __VLS_725 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_726 = __VLS_asFunctionalComponent1(__VLS_725, new __VLS_725(__assign({ class: "q-my-md" })));
    var __VLS_727 = __VLS_726.apply(void 0, __spreadArray([__assign({ class: "q-my-md" })], __VLS_functionalComponentArgsRest(__VLS_726), false));
    /** @type {__VLS_StyleScopedClasses['q-my-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_730 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_731 = __VLS_asFunctionalComponent1(__VLS_730, new __VLS_730(__assign({ name: "verified" }, { class: "q-mr-xs" })));
    var __VLS_732 = __VLS_731.apply(void 0, __spreadArray([__assign({ name: "verified" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_731), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-xs']} */ ;
    for (var _m = 0, _o = __VLS_vFor((__VLS_ctx.employeeData.effectivePermissions)); _m < _o.length; _m++) {
        var permCode = _o[_m][0];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (permCode) }, { class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_735 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
        qChip;
        // @ts-ignore
        var __VLS_736 = __VLS_asFunctionalComponent1(__VLS_735, new __VLS_735({
            size: "sm",
            color: "primary",
            textColor: "white",
            dense: true,
        }));
        var __VLS_737 = __VLS_736.apply(void 0, __spreadArray([{
                size: "sm",
                color: "primary",
                textColor: "white",
                dense: true,
            }], __VLS_functionalComponentArgsRest(__VLS_736), false));
        var __VLS_740 = __VLS_738.slots.default;
        (permCode);
        // @ts-ignore
        [permMgmt, employeeData, saveEmployeePermissions,];
        var __VLS_738;
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.employeeData.effectivePermissions.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
}
// @ts-ignore
[employeeData,];
var __VLS_529;
// @ts-ignore
[];
var __VLS_523;
// @ts-ignore
[];
var __VLS_41;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
