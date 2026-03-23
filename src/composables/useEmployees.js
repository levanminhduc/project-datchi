"use strict";
/**
 * Employee Management Composable
 *
 * Provides reactive state and CRUD operations for employee management
 * Follows patterns from useDialog.ts and useLoading.ts
 */
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEmployees = useEmployees;
var vue_1 = require("vue");
var employeeService_1 = require("@/services/employeeService");
var useSnackbar_1 = require("./useSnackbar");
var useLoading_1 = require("./useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
/**
 * Vietnamese messages for user feedback
 */
var MESSAGES = {
    // Success messages
    CREATE_SUCCESS: 'Thêm nhân viên thành công',
    UPDATE_SUCCESS: 'Cập nhật thành công',
    DELETE_SUCCESS: 'Xóa nhân viên thành công',
};
/**
 * Domain-specific error handler for employee operations
 */
var getErrorMessage = (0, errorMessages_1.createErrorHandler)({
    duplicate: 'Mã nhân viên đã tồn tại',
    notFound: 'Không tìm thấy nhân viên',
});
function useEmployees() {
    var _this = this;
    // State
    var employees = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    var selectedEmployee = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var hasEmployees = (0, vue_1.computed)(function () { return employees.value.length > 0; });
    var employeeCount = (0, vue_1.computed)(function () { return employees.value.length; });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch all employees from API
     */
    var fetchEmployees = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, err_1, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, employeeService_1.employeeService.getAll()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    employees.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = getErrorMessage(err_1);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useEmployees] fetchEmployees error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Create a new employee
     * @param data - Employee form data
     * @returns Created employee or null on error
     */
    var createEmployee = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var newEmployee, err_2, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, employeeService_1.employeeService.create(data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Add to local state
                    ];
                case 2:
                    newEmployee = _a.sent();
                    // Add to local state
                    employees.value = __spreadArray(__spreadArray([], employees.value, true), [newEmployee], false);
                    snackbar.success(MESSAGES.CREATE_SUCCESS);
                    return [2 /*return*/, newEmployee];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = getErrorMessage(err_2);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useEmployees] createEmployee error:', err_2);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Update an existing employee
     * @param id - Employee ID
     * @param data - Partial employee data to update
     * @returns Updated employee or null on error
     */
    var updateEmployee = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var updatedEmployee_1, err_3, errorMessage;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    clearError();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, employeeService_1.employeeService.update(id, data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Update local state
                    ];
                case 2:
                    updatedEmployee_1 = _b.sent();
                    // Update local state
                    employees.value = employees.value.map(function (emp) {
                        return emp.id === id ? updatedEmployee_1 : emp;
                    });
                    // Update selected if it was the one updated
                    if (((_a = selectedEmployee.value) === null || _a === void 0 ? void 0 : _a.id) === id) {
                        selectedEmployee.value = updatedEmployee_1;
                    }
                    snackbar.success(MESSAGES.UPDATE_SUCCESS);
                    return [2 /*return*/, updatedEmployee_1];
                case 3:
                    err_3 = _b.sent();
                    errorMessage = getErrorMessage(err_3);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useEmployees] updateEmployee error:', err_3);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Delete an employee
     * @param id - Employee ID
     * @returns true if successful, false on error
     */
    var deleteEmployee = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var err_4, errorMessage;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    clearError();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, employeeService_1.employeeService.delete(id)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })
                        // Remove from local state
                    ];
                case 2:
                    _b.sent();
                    // Remove from local state
                    employees.value = employees.value.filter(function (emp) { return emp.id !== id; });
                    // Clear selected if it was the one deleted
                    if (((_a = selectedEmployee.value) === null || _a === void 0 ? void 0 : _a.id) === id) {
                        selectedEmployee.value = null;
                    }
                    snackbar.success(MESSAGES.DELETE_SUCCESS);
                    return [2 /*return*/, true];
                case 3:
                    err_4 = _b.sent();
                    errorMessage = getErrorMessage(err_4);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useEmployees] deleteEmployee error:', err_4);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Select an employee for viewing/editing
     * @param employee - Employee to select, or null to deselect
     */
    var selectEmployee = function (employee) {
        selectedEmployee.value = employee;
    };
    /**
     * Find an employee by ID from local state
     * @param id - Employee ID
     * @returns Employee or undefined if not found
     */
    var getEmployeeById = function (id) {
        return employees.value.find(function (emp) { return emp.id === id; });
    };
    /**
     * Reset all state to initial values
     */
    var reset = function () {
        employees.value = [];
        error.value = null;
        selectedEmployee.value = null;
        loading.reset();
    };
    return {
        // State
        employees: employees,
        loading: isLoading,
        error: error,
        selectedEmployee: selectedEmployee,
        // Computed
        hasEmployees: hasEmployees,
        employeeCount: employeeCount,
        // Methods
        fetchEmployees: fetchEmployees,
        createEmployee: createEmployee,
        updateEmployee: updateEmployee,
        deleteEmployee: deleteEmployee,
        selectEmployee: selectEmployee,
        getEmployeeById: getEmployeeById,
        clearError: clearError,
        reset: reset,
    };
}
