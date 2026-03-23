"use strict";
/**
 * Thread Type Suppliers Management Composable
 *
 * Provides reactive state and CRUD operations for managing the
 * thread type - supplier relationships (junction table).
 *
 * Each thread type can be sourced from multiple suppliers,
 * each with their own supplier_item_code and unit_price.
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
exports.useThreadTypeSuppliers = useThreadTypeSuppliers;
var vue_1 = require("vue");
var threadTypeSupplierService_1 = require("@/services/threadTypeSupplierService");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
/**
 * Vietnamese messages for user feedback
 */
var MESSAGES = {
    LINK_SUCCESS: 'Đã liên kết nhà cung cấp với loại chỉ',
    UPDATE_SUCCESS: 'Đã cập nhật thông tin nhà cung cấp',
    UNLINK_SUCCESS: 'Đã xóa liên kết nhà cung cấp',
};
/**
 * Domain-specific error handler for thread type supplier operations
 */
var getErrorMessage = (0, errorMessages_1.createErrorHandler)({
    duplicate: 'Liên kết này đã tồn tại',
    notFound: 'Không tìm thấy liên kết',
});
/**
 * Composable for managing thread type - supplier relationships
 * @param threadTypeId - Optional thread type ID to scope operations
 */
function useThreadTypeSuppliers(threadTypeId) {
    var _this = this;
    // State
    var suppliers = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    var selectedLink = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)(threadTypeId ? { thread_type_id: threadTypeId } : {});
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
     * Fetch suppliers for a thread type
     * @param targetThreadTypeId - Thread type ID (uses scoped ID if not provided)
     */
    var fetchSuppliers = function (targetThreadTypeId) { return __awaiter(_this, void 0, void 0, function () {
        var id, data, err_1, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    id = targetThreadTypeId !== null && targetThreadTypeId !== void 0 ? targetThreadTypeId : threadTypeId;
                    if (!id) {
                        console.warn('[useThreadTypeSuppliers] No thread_type_id provided');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, threadTypeSupplierService_1.threadTypeSupplierService.getSuppliersByThreadType(id)];
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
                    console.error('[useThreadTypeSuppliers] fetchSuppliers error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch all links with filters (not scoped to a thread type)
     * @param newFilters - Optional filters to apply
     */
    var fetchAll = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_2, errorMessage;
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
                                    case 0: return [4 /*yield*/, threadTypeSupplierService_1.threadTypeSupplierService.getAll(filters.value)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    suppliers.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = getErrorMessage(err_2);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useThreadTypeSuppliers] fetchAll error:', err_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Link a supplier to a thread type
     * @param targetThreadTypeId - Thread type ID
     * @param data - Supplier link data
     * @returns Created link or null on error
     */
    var linkSupplier = function (targetThreadTypeId, data) { return __awaiter(_this, void 0, void 0, function () {
        var newLink, err_3, errorMessage;
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
                                    case 0: return [4 /*yield*/, threadTypeSupplierService_1.threadTypeSupplierService.linkSupplierToThread(targetThreadTypeId, data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Add to local state if we're scoped to this thread type
                    ];
                case 2:
                    newLink = _a.sent();
                    // Add to local state if we're scoped to this thread type
                    if (!threadTypeId || threadTypeId === targetThreadTypeId) {
                        suppliers.value = __spreadArray([newLink], suppliers.value, true);
                    }
                    snackbar.success(MESSAGES.LINK_SUCCESS);
                    return [2 /*return*/, newLink];
                case 3:
                    err_3 = _a.sent();
                    errorMessage = getErrorMessage(err_3);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useThreadTypeSuppliers] linkSupplier error:', err_3);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Create a new link (full form)
     * @param data - Full link data including thread_type_id
     * @returns Created link or null on error
     */
    var createLink = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var newLink, err_4, errorMessage;
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
                                    case 0: return [4 /*yield*/, threadTypeSupplierService_1.threadTypeSupplierService.create(data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Add to local state
                    ];
                case 2:
                    newLink = _a.sent();
                    // Add to local state
                    suppliers.value = __spreadArray([newLink], suppliers.value, true);
                    snackbar.success(MESSAGES.LINK_SUCCESS);
                    return [2 /*return*/, newLink];
                case 3:
                    err_4 = _a.sent();
                    errorMessage = getErrorMessage(err_4);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useThreadTypeSuppliers] createLink error:', err_4);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Update a link
     * @param id - Link ID
     * @param data - Partial update data
     * @returns Updated link or null on error
     */
    var updateLink = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var updatedLink_1, err_5, errorMessage;
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
                                    case 0: return [4 /*yield*/, threadTypeSupplierService_1.threadTypeSupplierService.update(id, data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Update local state
                    ];
                case 2:
                    updatedLink_1 = _b.sent();
                    // Update local state
                    suppliers.value = suppliers.value.map(function (link) {
                        return link.id === id ? updatedLink_1 : link;
                    });
                    // Update selected if it was the one updated
                    if (((_a = selectedLink.value) === null || _a === void 0 ? void 0 : _a.id) === id) {
                        selectedLink.value = updatedLink_1;
                    }
                    snackbar.success(MESSAGES.UPDATE_SUCCESS);
                    return [2 /*return*/, updatedLink_1];
                case 3:
                    err_5 = _b.sent();
                    errorMessage = getErrorMessage(err_5);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useThreadTypeSuppliers] updateLink error:', err_5);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Delete a link (hard delete)
     * @param id - Link ID
     * @returns true if successful, false on error
     */
    var deleteLink = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var err_6, errorMessage;
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
                                    case 0: return [4 /*yield*/, threadTypeSupplierService_1.threadTypeSupplierService.remove(id)];
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
                    suppliers.value = suppliers.value.filter(function (link) { return link.id !== id; });
                    // Clear selected if it was the one deleted
                    if (((_a = selectedLink.value) === null || _a === void 0 ? void 0 : _a.id) === id) {
                        selectedLink.value = null;
                    }
                    snackbar.success(MESSAGES.UNLINK_SUCCESS);
                    return [2 /*return*/, true];
                case 3:
                    err_6 = _b.sent();
                    errorMessage = getErrorMessage(err_6);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useThreadTypeSuppliers] deleteLink error:', err_6);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Select a link for viewing/editing
     * @param link - Link to select, or null to deselect
     */
    var selectLink = function (link) {
        selectedLink.value = link;
    };
    /**
     * Find a link by ID from local state
     * @param id - Link ID
     * @returns Link or undefined if not found
     */
    var getLinkById = function (id) {
        return suppliers.value.find(function (link) { return link.id === id; });
    };
    /**
     * Reset all state to initial values
     */
    var reset = function () {
        suppliers.value = [];
        error.value = null;
        selectedLink.value = null;
        filters.value = threadTypeId ? { thread_type_id: threadTypeId } : {};
        loading.reset();
    };
    return {
        // State
        suppliers: suppliers,
        loading: isLoading,
        error: error,
        selectedLink: selectedLink,
        filters: filters,
        // Computed
        hasSuppliers: hasSuppliers,
        supplierCount: supplierCount,
        activeSuppliers: activeSuppliers,
        // Methods
        fetchSuppliers: fetchSuppliers,
        fetchAll: fetchAll,
        linkSupplier: linkSupplier,
        createLink: createLink,
        updateLink: updateLink,
        deleteLink: deleteLink,
        selectLink: selectLink,
        getLinkById: getLinkById,
        clearError: clearError,
        reset: reset,
    };
}
