"use strict";
/**
 * Suppliers Management Composable
 *
 * Provides reactive state and CRUD operations for supplier master data management.
 * Follows patterns from useThreadTypes.ts
 */
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
exports.useSuppliers = useSuppliers;
var vue_1 = require("vue");
var supplierService_1 = require("@/services/supplierService");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
/**
 * Vietnamese messages for user feedback
 */
var MESSAGES = {
    // Success messages
    CREATE_SUCCESS: 'Tạo nhà cung cấp thành công',
    UPDATE_SUCCESS: 'Cập nhật nhà cung cấp thành công',
    DELETE_SUCCESS: 'Đã ngừng hợp tác với nhà cung cấp',
};
/**
 * Domain-specific error handler for supplier operations
 */
var getErrorMessage = (0, errorMessages_1.createErrorHandler)({
    duplicate: 'Mã nhà cung cấp đã tồn tại',
    notFound: 'Không tìm thấy nhà cung cấp',
});
function useSuppliers() {
    var _this = this;
    // State
    var suppliers = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    var selectedSupplier = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)({});
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var hasSuppliers = (0, vue_1.computed)(function () { return suppliers.value.length > 0; });
    var supplierCount = (0, vue_1.computed)(function () { return suppliers.value.length; });
    var activeSuppliers = (0, vue_1.computed)(function () {
        return suppliers.value.filter(function (s) { return s.is_active; });
    });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch all suppliers from API
     * @param newFilters - Optional filters to apply
     */
    var fetchSuppliers = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_1, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    if (newFilters) {
                        filters.value = __assign(__assign({}, filters.value), newFilters);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, supplierService_1.supplierService.getAll(filters.value)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    suppliers.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = getErrorMessage(err_1);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useSuppliers] fetchSuppliers error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Create a new supplier
     * @param data - Supplier form data
     * @returns Created supplier or null on error
     */
    var createSupplier = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var newSupplier, err_2, errorMessage;
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
                                    case 0: return [4 /*yield*/, supplierService_1.supplierService.create(data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Add to local state at the beginning (newest first)
                    ];
                case 2:
                    newSupplier = _a.sent();
                    // Add to local state at the beginning (newest first)
                    suppliers.value = __spreadArray([newSupplier], suppliers.value, true);
                    snackbar.success(MESSAGES.CREATE_SUCCESS);
                    return [2 /*return*/, newSupplier];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = getErrorMessage(err_2);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useSuppliers] createSupplier error:', err_2);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Update an existing supplier
     * @param id - Supplier ID
     * @param data - Partial supplier data to update
     * @returns Updated supplier or null on error
     */
    var updateSupplier = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var updatedSupplier_1, err_3, errorMessage;
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
                                    case 0: return [4 /*yield*/, supplierService_1.supplierService.update(id, data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Update local state
                    ];
                case 2:
                    updatedSupplier_1 = _b.sent();
                    // Update local state
                    suppliers.value = suppliers.value.map(function (supplier) {
                        return supplier.id === id ? updatedSupplier_1 : supplier;
                    });
                    // Update selected if it was the one updated
                    if (((_a = selectedSupplier.value) === null || _a === void 0 ? void 0 : _a.id) === id) {
                        selectedSupplier.value = updatedSupplier_1;
                    }
                    snackbar.success(MESSAGES.UPDATE_SUCCESS);
                    return [2 /*return*/, updatedSupplier_1];
                case 3:
                    err_3 = _b.sent();
                    errorMessage = getErrorMessage(err_3);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useSuppliers] updateSupplier error:', err_3);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Delete a supplier (soft delete)
     * @param id - Supplier ID
     * @returns true if successful, false on error
     */
    var deleteSupplier = function (id) { return __awaiter(_this, void 0, void 0, function () {
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
                                    case 0: return [4 /*yield*/, supplierService_1.supplierService.remove(id)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })
                        // Update local state - mark as inactive instead of removing
                    ];
                case 2:
                    _b.sent();
                    // Update local state - mark as inactive instead of removing
                    suppliers.value = suppliers.value.map(function (supplier) {
                        return supplier.id === id ? __assign(__assign({}, supplier), { is_active: false }) : supplier;
                    });
                    // Clear selected if it was the one deleted
                    if (((_a = selectedSupplier.value) === null || _a === void 0 ? void 0 : _a.id) === id) {
                        selectedSupplier.value = null;
                    }
                    snackbar.success(MESSAGES.DELETE_SUCCESS);
                    return [2 /*return*/, true];
                case 3:
                    err_4 = _b.sent();
                    errorMessage = getErrorMessage(err_4);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useSuppliers] deleteSupplier error:', err_4);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Select a supplier for viewing/editing
     * @param supplier - Supplier to select, or null to deselect
     */
    var selectSupplier = function (supplier) {
        selectedSupplier.value = supplier;
    };
    /**
     * Find a supplier by ID from local state
     * @param id - Supplier ID
     * @returns Supplier or undefined if not found
     */
    var getSupplierById = function (id) {
        return suppliers.value.find(function (supplier) { return supplier.id === id; });
    };
    /**
     * Set filters and refetch
     * @param newFilters - New filters to apply
     */
    var setFilters = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filters.value = newFilters;
                    return [4 /*yield*/, fetchSuppliers()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    /**
     * Clear all filters and refetch
     */
    var clearFilters = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filters.value = {};
                    return [4 /*yield*/, fetchSuppliers()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    /**
     * Reset all state to initial values
     */
    var reset = function () {
        suppliers.value = [];
        error.value = null;
        selectedSupplier.value = null;
        filters.value = {};
        loading.reset();
    };
    return {
        // State
        suppliers: suppliers,
        loading: isLoading,
        error: error,
        selectedSupplier: selectedSupplier,
        filters: filters,
        // Computed
        hasSuppliers: hasSuppliers,
        supplierCount: supplierCount,
        activeSuppliers: activeSuppliers,
        // Methods
        fetchSuppliers: fetchSuppliers,
        createSupplier: createSupplier,
        updateSupplier: updateSupplier,
        deleteSupplier: deleteSupplier,
        selectSupplier: selectSupplier,
        getSupplierById: getSupplierById,
        setFilters: setFilters,
        clearFilters: clearFilters,
        clearError: clearError,
        reset: reset,
    };
}
