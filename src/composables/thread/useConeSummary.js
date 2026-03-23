"use strict";
/**
 * Cone Summary Composable
 *
 * Provides reactive state and operations for cone-based inventory summary.
 * Groups inventory by thread type, showing full and partial cone counts.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useConeSummary = useConeSummary;
var vue_1 = require("vue");
var inventoryService_1 = require("@/services/inventoryService");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var useRealtime_1 = require("../useRealtime");
var errorMessages_1 = require("@/utils/errorMessages");
/**
 * Vietnamese messages for user feedback
 */
var MESSAGES = {
    FETCH_ERROR: 'Không thể tải dữ liệu tổng hợp',
    BREAKDOWN_ERROR: 'Không thể tải chi tiết theo kho',
};
function useConeSummary() {
    var _this = this;
    // State
    var summaryList = (0, vue_1.ref)([]);
    var warehouseBreakdown = (0, vue_1.ref)([]);
    var supplierBreakdown = (0, vue_1.ref)([]);
    var selectedThreadType = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)({});
    var error = (0, vue_1.ref)(null);
    var breakdownLoading = (0, vue_1.ref)(false);
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
    var hasSummary = (0, vue_1.computed)(function () { return summaryList.value.length > 0; });
    var summaryCount = (0, vue_1.computed)(function () { return summaryList.value.length; });
    // Totals computed from summary list
    var totalFullCones = (0, vue_1.computed)(function () {
        return summaryList.value.reduce(function (sum, row) { return sum + row.full_cones; }, 0);
    });
    var totalPartialCones = (0, vue_1.computed)(function () {
        return summaryList.value.reduce(function (sum, row) { return sum + row.partial_cones; }, 0);
    });
    var totalPartialMeters = (0, vue_1.computed)(function () {
        return summaryList.value.reduce(function (sum, row) { return sum + row.partial_meters; }, 0);
    });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch cone summary from API
     * @param newFilters - Optional filters to apply
     */
    var fetchSummary = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
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
                                    case 0: return [4 /*yield*/, inventoryService_1.inventoryService.getConeSummary(filters.value)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    summaryList.value = data;
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1);
                    error.value = errorMessage;
                    snackbar.error(MESSAGES.FETCH_ERROR);
                    console.error('[useConeSummary] fetchSummary error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch warehouse breakdown for a specific thread type
     * @param threadTypeId - Thread type ID
     */
    var fetchWarehouseBreakdown = function (threadTypeId, colorId) { return __awaiter(_this, void 0, void 0, function () {
        var response, err_2, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    breakdownLoading.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, inventoryService_1.inventoryService.getWarehouseBreakdown(threadTypeId, colorId)];
                case 2:
                    response = _a.sent();
                    warehouseBreakdown.value = response.data;
                    supplierBreakdown.value = response.supplier_breakdown;
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2);
                    error.value = errorMessage;
                    snackbar.error(MESSAGES.BREAKDOWN_ERROR);
                    console.error('[useConeSummary] fetchWarehouseBreakdown error:', err_2);
                    return [3 /*break*/, 5];
                case 4:
                    breakdownLoading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Select a thread type row for drill-down
     * Automatically fetches warehouse breakdown
     * @param row - ConeSummaryRow to select, or null to deselect
     */
    var selectThreadType = function (row) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    selectedThreadType.value = row;
                    // Clear any pending debounced refresh to avoid race condition
                    if (debounceTimer.value) {
                        clearTimeout(debounceTimer.value);
                        debounceTimer.value = null;
                    }
                    if (!row) return [3 /*break*/, 2];
                    return [4 /*yield*/, fetchWarehouseBreakdown(row.thread_type_id, row.color_id)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    warehouseBreakdown.value = [];
                    supplierBreakdown.value = [];
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Set filters and refetch
     * @param newFilters - New filters to apply
     */
    var setFilters = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filters.value = newFilters;
                    return [4 /*yield*/, fetchSummary()];
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
                    return [4 /*yield*/, fetchSummary()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    /**
     * Close drill-down view
     */
    var closeBreakdown = function () {
        selectedThreadType.value = null;
        warehouseBreakdown.value = [];
        supplierBreakdown.value = [];
    };
    /**
     * Debounced refresh to batch rapid changes
     * @param delay - Debounce delay in milliseconds (default: 100ms)
     */
    var debouncedRefresh = function (delay) {
        if (delay === void 0) { delay = 100; }
        if (debounceTimer.value) {
            clearTimeout(debounceTimer.value);
        }
        debounceTimer.value = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetchSummary()
                        // Also refresh breakdown if a thread type is selected
                    ];
                    case 1:
                        _a.sent();
                        if (!selectedThreadType.value) return [3 /*break*/, 3];
                        return [4 /*yield*/, fetchWarehouseBreakdown(selectedThreadType.value.thread_type_id, selectedThreadType.value.color_id)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        debounceTimer.value = null;
                        return [2 /*return*/];
                }
            });
        }); }, delay);
    };
    /**
     * Enable real-time updates for cone summary
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
            // Smart filter check: Only refresh if the changed record affects current view
            var shouldRefresh = function () {
                // If no warehouse filter applied, always refresh
                if (!filters.value.warehouse_id) {
                    return true;
                }
                // Check if the change affects currently filtered warehouse
                var newRecord = payload.new;
                var oldRecord = payload.old;
                // For UPDATE events (like batch transfer), check both old and new warehouse
                if (payload.eventType === 'UPDATE') {
                    var matchesOld = (oldRecord === null || oldRecord === void 0 ? void 0 : oldRecord.warehouse_id) === filters.value.warehouse_id;
                    var matchesNew = (newRecord === null || newRecord === void 0 ? void 0 : newRecord.warehouse_id) === filters.value.warehouse_id;
                    return matchesOld || matchesNew;
                }
                // For INSERT/DELETE, check if matches current filter
                var record = newRecord || oldRecord;
                if (!record) {
                    return true;
                }
                return record.warehouse_id === filters.value.warehouse_id;
            };
            if (shouldRefresh()) {
                debouncedRefresh(100);
            }
        });
        realtimeEnabled.value = true;
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
        summaryList.value = [];
        warehouseBreakdown.value = [];
        supplierBreakdown.value = [];
        selectedThreadType.value = null;
        filters.value = {};
        error.value = null;
        breakdownLoading.value = false;
        disableRealtime();
        loading.reset();
    };
    return {
        // State
        summaryList: summaryList,
        warehouseBreakdown: warehouseBreakdown,
        supplierBreakdown: supplierBreakdown,
        selectedThreadType: selectedThreadType,
        filters: filters,
        error: error,
        // Loading states
        isLoading: isLoading,
        breakdownLoading: breakdownLoading,
        // Computed
        hasSummary: hasSummary,
        summaryCount: summaryCount,
        totalFullCones: totalFullCones,
        totalPartialCones: totalPartialCones,
        totalPartialMeters: totalPartialMeters,
        // Methods
        fetchSummary: fetchSummary,
        fetchWarehouseBreakdown: fetchWarehouseBreakdown,
        selectThreadType: selectThreadType,
        setFilters: setFilters,
        clearFilters: clearFilters,
        closeBreakdown: closeBreakdown,
        clearError: clearError,
        reset: reset,
        enableRealtime: enableRealtime,
        disableRealtime: disableRealtime,
    };
}
