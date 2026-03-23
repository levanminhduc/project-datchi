"use strict";
/**
 * Thread Inventory Management Composable
 *
 * Provides reactive state and operations for thread inventory management.
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
exports.useInventory = useInventory;
var vue_1 = require("vue");
var useRealtime_1 = require("../useRealtime");
var inventoryService_1 = require("@/services/inventoryService");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
var enums_1 = require("@/types/thread/enums");
/**
 * Vietnamese messages for user feedback
 */
var MESSAGES = {
    // Success messages
    RECEIVE_SUCCESS: 'Nhập kho thành công',
    // Error messages
    RECEIVE_ERROR: 'Nhập kho thất bại',
    SUMMARY_ERROR: 'Không thể tải thống kê tồn kho',
};
function useInventory() {
    var _this = this;
    // State
    var inventory = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    var selectedCone = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)({});
    var totalCount = (0, vue_1.ref)(0);
    var currentPage = (0, vue_1.ref)(1);
    var pageSize = (0, vue_1.ref)(25);
    var sortBy = (0, vue_1.ref)('received_date');
    var descending = (0, vue_1.ref)(true);
    var availableSummary = (0, vue_1.ref)({});
    // Realtime state
    var realtimeEnabled = (0, vue_1.ref)(false);
    var realtimeChannelName = (0, vue_1.ref)(null);
    var debounceTimer = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    var realtime = (0, useRealtime_1.useRealtime)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var hasInventory = (0, vue_1.computed)(function () { return inventory.value.length > 0; });
    var inventoryCount = (0, vue_1.computed)(function () { return inventory.value.length; });
    var availableCones = (0, vue_1.computed)(function () {
        return inventory.value.filter(function (cone) { return cone.status === enums_1.ConeStatus.AVAILABLE; });
    });
    var partialCones = (0, vue_1.computed)(function () { return inventory.value.filter(function (cone) { return cone.is_partial === true; }); });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch all inventory from API
     * @param newFilters - Optional filters to apply
     */
    var fetchInventory = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_1, errorMessage;
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
                                    case 0: return [4 /*yield*/, inventoryService_1.inventoryService.getPaginated({
                                            page: currentPage.value,
                                            pageSize: pageSize.value,
                                            sortBy: sortBy.value,
                                            descending: descending.value,
                                            search: filters.value.search,
                                            thread_type_id: filters.value.thread_type_id,
                                            warehouse_id: filters.value.warehouse_id,
                                            status: filters.value.status,
                                            is_partial: filters.value.is_partial,
                                        })];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _a.sent();
                    inventory.value = result.data;
                    totalCount.value = result.count;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useInventory] fetchInventory error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleTableRequest = function (props) { return __awaiter(_this, void 0, void 0, function () {
        var _a, page, rowsPerPage, sort, desc;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = props.pagination, page = _a.page, rowsPerPage = _a.rowsPerPage, sort = _a.sortBy, desc = _a.descending;
                    currentPage.value = page;
                    pageSize.value = rowsPerPage;
                    sortBy.value = sort || 'received_date';
                    descending.value = desc;
                    return [4 /*yield*/, fetchInventory()];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    /**
     * Receive new stock (create multiple cones)
     * @param data - ReceiveStockDTO with thread_type_id, warehouse_id, quantity_cones, etc.
     * @returns Array of created cones or null on error
     */
    var receiveStock = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var newCones, err_2, errorMessage;
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
                                    case 0: return [4 /*yield*/, inventoryService_1.inventoryService.receiveStock(data)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Add new cones to local state at the beginning (newest first)
                    ];
                case 2:
                    newCones = _a.sent();
                    // Add new cones to local state at the beginning (newest first)
                    inventory.value = __spreadArray(__spreadArray([], newCones, true), inventory.value, true);
                    snackbar.success(MESSAGES.RECEIVE_SUCCESS);
                    return [2 /*return*/, newCones];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2);
                    error.value = errorMessage;
                    snackbar.error(MESSAGES.RECEIVE_ERROR);
                    console.error('[useInventory] receiveStock error:', err_2);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Find a cone by ID from local state
     * @param id - Cone ID
     * @returns Cone or undefined if not found
     */
    var getConeById = function (id) {
        return inventory.value.find(function (cone) { return cone.id === id; });
    };
    /**
     * Fetch available summary statistics
     * @param threadTypeId - Optional filter by thread type ID
     */
    var fetchAvailableSummary = function (threadTypeId) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_3, errorMessage;
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
                                    case 0: return [4 /*yield*/, inventoryService_1.inventoryService.getAvailableSummary(threadTypeId)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    availableSummary.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_3);
                    error.value = errorMessage;
                    snackbar.error(MESSAGES.SUMMARY_ERROR);
                    console.error('[useInventory] fetchAvailableSummary error:', err_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Select a cone for viewing/editing
     * @param cone - Cone to select, or null to deselect
     */
    var selectCone = function (cone) {
        selectedCone.value = cone;
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
                    return [4 /*yield*/, fetchInventory()];
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
                    return [4 /*yield*/, fetchInventory()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    /**
     * Debounced refresh to batch rapid changes
     * @param delay - Debounce delay in milliseconds (default: 100ms)
     */
    var debouncedRefresh = function (delay) {
        if (delay === void 0) { delay = 100; }
        if (debounceTimer.value) {
            clearTimeout(debounceTimer.value);
        }
        debounceTimer.value = setTimeout(function () {
            currentPage.value = 1;
            fetchInventory();
            debounceTimer.value = null;
        }, delay);
    };
    /**
     * Enable real-time updates for inventory changes
     * Subscribes to thread_inventory table changes
     */
    var enableRealtime = function () {
        if (realtimeEnabled.value)
            return;
        realtimeChannelName.value = realtime.subscribe({
            table: 'thread_inventory',
            event: '*',
            schema: 'public',
        }, function (payload) {
            console.log('[useInventory] Real-time event:', payload.eventType);
            // Smart filter check: Only refresh if the changed record affects current view
            var shouldRefresh = function () {
                // If no filters applied, always refresh
                if (!filters.value.warehouse_id && !filters.value.thread_type_id && !filters.value.status) {
                    return true;
                }
                // Check if the change affects currently filtered data
                var newRecord = payload.new;
                var oldRecord = payload.old;
                // For UPDATE events (like batch transfer), check both old and new warehouse
                if (payload.eventType === 'UPDATE') {
                    var matchesOld = !filters.value.warehouse_id || (oldRecord === null || oldRecord === void 0 ? void 0 : oldRecord.warehouse_id) === filters.value.warehouse_id;
                    var matchesNew = !filters.value.warehouse_id || (newRecord === null || newRecord === void 0 ? void 0 : newRecord.warehouse_id) === filters.value.warehouse_id;
                    return matchesOld || matchesNew;
                }
                // For INSERT/DELETE, check if matches current filter
                var record = newRecord || oldRecord;
                if (!record)
                    return true;
                if (filters.value.warehouse_id && record.warehouse_id !== filters.value.warehouse_id) {
                    return false;
                }
                if (filters.value.thread_type_id && record.thread_type_id !== filters.value.thread_type_id) {
                    return false;
                }
                if (filters.value.status && record.status !== filters.value.status) {
                    return false;
                }
                return true;
            };
            if (shouldRefresh()) {
                debouncedRefresh(100);
            }
        });
        realtimeEnabled.value = true;
        snackbar.info('Đang theo dõi tồn kho theo thời gian thực');
    };
    /**
     * Disable real-time updates
     */
    var disableRealtime = function () {
        if (!realtimeEnabled.value || !realtimeChannelName.value)
            return;
        realtime.unsubscribe(realtimeChannelName.value);
        realtimeChannelName.value = null;
        realtimeEnabled.value = false;
        // Clear any pending debounce timer
        if (debounceTimer.value) {
            clearTimeout(debounceTimer.value);
            debounceTimer.value = null;
        }
    };
    /**
     * Reset all state to initial values
     */
    var reset = function () {
        inventory.value = [];
        error.value = null;
        selectedCone.value = null;
        filters.value = {};
        availableSummary.value = {};
        disableRealtime();
        loading.reset();
    };
    return {
        // State
        inventory: inventory,
        loading: isLoading,
        error: error,
        selectedCone: selectedCone,
        filters: filters,
        availableSummary: availableSummary,
        // Pagination
        totalCount: totalCount,
        currentPage: currentPage,
        pageSize: pageSize,
        sortBy: sortBy,
        descending: descending,
        // Computed
        isLoading: isLoading,
        hasInventory: hasInventory,
        inventoryCount: inventoryCount,
        availableCones: availableCones,
        partialCones: partialCones,
        // Methods
        fetchInventory: fetchInventory,
        handleTableRequest: handleTableRequest,
        receiveStock: receiveStock,
        getConeById: getConeById,
        fetchAvailableSummary: fetchAvailableSummary,
        selectCone: selectCone,
        setFilters: setFilters,
        clearFilters: clearFilters,
        clearError: clearError,
        reset: reset,
        enableRealtime: enableRealtime,
        disableRealtime: disableRealtime,
    };
}
