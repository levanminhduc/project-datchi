"use strict";
// src/composables/usePermissionManagement.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePermissionManagement = usePermissionManagement;
var vue_1 = require("vue");
var authService_1 = require("@/services/authService");
var API_URL = import.meta.env.VITE_API_URL || '';
// ============================================
// Composable
// ============================================
function usePermissionManagement() {
    // State
    var roles = (0, vue_1.ref)([]);
    var permissions = (0, vue_1.ref)([]);
    var loading = (0, vue_1.ref)(false);
    var error = (0, vue_1.ref)(null);
    // Computed
    var permissionsByModule = (0, vue_1.computed)(function () {
        var grouped = {};
        for (var _i = 0, _a = permissions.value; _i < _a.length; _i++) {
            var perm = _a[_i];
            if (!grouped[perm.module]) {
                grouped[perm.module] = [];
            }
            grouped[perm.module].push(perm);
        }
        // Sort permissions within each module by sortOrder
        for (var module_1 in grouped) {
            grouped[module_1].sort(function (a, b) { return a.sortOrder - b.sortOrder; });
        }
        return grouped;
    });
    var moduleList = (0, vue_1.computed)(function () { return Object.keys(permissionsByModule.value).sort(); });
    // ============================================
    // Roles API
    // ============================================
    function fetchRoles() {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_1, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/roles"))];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (!response.ok || result.error) {
                            throw new Error(result.message || 'Không thể tải danh sách vai trò');
                        }
                        roles.value = result.data;
                        return [2 /*return*/, result.data];
                    case 4:
                        err_1 = _a.sent();
                        msg = err_1 instanceof Error ? err_1.message : 'Lỗi khi tải vai trò';
                        error.value = msg;
                        throw err_1;
                    case 5:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function createRole(data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_2, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/roles"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data),
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (!response.ok || result.error) {
                            throw new Error(result.message || 'Không thể tạo vai trò');
                        }
                        // Refresh roles list
                        return [4 /*yield*/, fetchRoles()];
                    case 4:
                        // Refresh roles list
                        _a.sent();
                        return [2 /*return*/, result.data];
                    case 5:
                        err_2 = _a.sent();
                        msg = err_2 instanceof Error ? err_2.message : 'Lỗi khi tạo vai trò';
                        error.value = msg;
                        throw err_2;
                    case 6:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    function updateRole(id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_3, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/roles/").concat(id), {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data),
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (!response.ok || result.error) {
                            throw new Error(result.message || 'Không thể cập nhật vai trò');
                        }
                        // Refresh roles list
                        return [4 /*yield*/, fetchRoles()];
                    case 4:
                        // Refresh roles list
                        _a.sent();
                        return [2 /*return*/, result.data];
                    case 5:
                        err_3 = _a.sent();
                        msg = err_3 instanceof Error ? err_3.message : 'Lỗi khi cập nhật vai trò';
                        error.value = msg;
                        throw err_3;
                    case 6:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    function deleteRole(id) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_4, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/roles/").concat(id), {
                                method: 'DELETE',
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (!response.ok || result.error) {
                            throw new Error(result.message || 'Không thể xóa vai trò');
                        }
                        // Refresh roles list
                        return [4 /*yield*/, fetchRoles()];
                    case 4:
                        // Refresh roles list
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 5:
                        err_4 = _a.sent();
                        msg = err_4 instanceof Error ? err_4.message : 'Lỗi khi xóa vai trò';
                        error.value = msg;
                        throw err_4;
                    case 6:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    function getRolePermissions(roleId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_5, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/roles/").concat(roleId, "/permissions"))];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        if (!response.ok || result.error) {
                            throw new Error(result.message || 'Không thể tải quyền của vai trò');
                        }
                        return [2 /*return*/, result.data];
                    case 3:
                        err_5 = _a.sent();
                        msg = err_5 instanceof Error ? err_5.message : 'Lỗi khi tải quyền';
                        error.value = msg;
                        throw err_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // ============================================
    // Permissions API
    // ============================================
    function fetchPermissions() {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_6, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/permissions/all"))];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (!response.ok || result.error) {
                            throw new Error(result.message || 'Không thể tải danh sách quyền');
                        }
                        permissions.value = result.data;
                        return [2 /*return*/, result.data];
                    case 4:
                        err_6 = _a.sent();
                        msg = err_6 instanceof Error ? err_6.message : 'Lỗi khi tải quyền';
                        error.value = msg;
                        throw err_6;
                    case 5:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function createPermission(data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_7, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/permissions"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data),
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (!response.ok || !result.success) {
                            throw new Error(result.message || 'Không thể tạo quyền');
                        }
                        return [4 /*yield*/, fetchPermissions()];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, result.data];
                    case 5:
                        err_7 = _a.sent();
                        msg = err_7 instanceof Error ? err_7.message : 'Lỗi khi tạo quyền';
                        error.value = msg;
                        throw err_7;
                    case 6:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    function updatePermission(id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_8, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/permissions/").concat(id), {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data),
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (!response.ok || !result.success) {
                            throw new Error(result.message || 'Không thể cập nhật quyền');
                        }
                        return [4 /*yield*/, fetchPermissions()];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, result.data];
                    case 5:
                        err_8 = _a.sent();
                        msg = err_8 instanceof Error ? err_8.message : 'Lỗi khi cập nhật quyền';
                        error.value = msg;
                        throw err_8;
                    case 6:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    function deletePermission(id) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_9, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/permissions/").concat(id), {
                                method: 'DELETE',
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (!response.ok || !result.success) {
                            throw new Error(result.message || 'Không thể xóa quyền');
                        }
                        return [4 /*yield*/, fetchPermissions()];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 5:
                        err_9 = _a.sent();
                        msg = err_9 instanceof Error ? err_9.message : 'Lỗi khi xóa quyền';
                        error.value = msg;
                        throw err_9;
                    case 6:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    // ============================================
    // Employee Permissions API
    // ============================================
    function searchEmployees(query) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!query || query.length < 2)
                            return [2 /*return*/, []];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/employees/search?q=").concat(encodeURIComponent(query)))];
                    case 2:
                        response = _b.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _b.sent();
                        if (!response.ok || result.error) {
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, result.data];
                    case 4:
                        _a = _b.sent();
                        return [2 /*return*/, []];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function getEmployeeRolesPermissions(employeeId) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_10, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/employees/").concat(employeeId, "/roles-permissions"))];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (!response.ok || result.error) {
                            throw new Error(result.message || 'Không thể tải thông tin phân quyền');
                        }
                        return [2 /*return*/, result.data];
                    case 4:
                        err_10 = _a.sent();
                        msg = err_10 instanceof Error ? err_10.message : 'Lỗi khi tải thông tin';
                        error.value = msg;
                        throw err_10;
                    case 5:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function updateEmployeeRoles(employeeId, roleIds) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_11, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/employees/").concat(employeeId, "/roles"), {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ roleIds: roleIds }),
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (!response.ok || result.error) {
                            throw new Error(result.message || 'Không thể cập nhật vai trò');
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        err_11 = _a.sent();
                        msg = err_11 instanceof Error ? err_11.message : 'Lỗi khi cập nhật vai trò';
                        error.value = msg;
                        throw err_11;
                    case 5:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function updateEmployeePermissions(employeeId, permissionUpdates) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, err_12, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loading.value = true;
                        error.value = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, authService_1.authService.authenticatedFetch("".concat(API_URL, "/api/auth/employees/").concat(employeeId, "/permissions"), {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ permissions: permissionUpdates }),
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        if (!response.ok || result.error) {
                            throw new Error(result.message || 'Không thể cập nhật quyền');
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        err_12 = _a.sent();
                        msg = err_12 instanceof Error ? err_12.message : 'Lỗi khi cập nhật quyền';
                        error.value = msg;
                        throw err_12;
                    case 5:
                        loading.value = false;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    // ============================================
    // Initialize
    // ============================================
    function initialize() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([fetchRoles(), fetchPermissions()])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    return {
        // State
        roles: roles,
        permissions: permissions,
        loading: loading,
        error: error,
        // Computed
        permissionsByModule: permissionsByModule,
        moduleList: moduleList,
        // Roles methods
        fetchRoles: fetchRoles,
        createRole: createRole,
        updateRole: updateRole,
        deleteRole: deleteRole,
        getRolePermissions: getRolePermissions,
        // Permissions methods
        fetchPermissions: fetchPermissions,
        createPermission: createPermission,
        updatePermission: updatePermission,
        deletePermission: deletePermission,
        // Employee methods
        searchEmployees: searchEmployees,
        getEmployeeRolesPermissions: getEmployeeRolesPermissions,
        updateEmployeeRoles: updateEmployeeRoles,
        updateEmployeePermissions: updateEmployeePermissions,
        // Initialize
        initialize: initialize,
    };
}
