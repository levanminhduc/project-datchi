"use strict";
/**
 * Thread Conflict Management Composable
 *
 * Provides reactive state and operations for thread allocation conflict management.
 * Handles fetching, resolving, and monitoring conflicts between competing allocations.
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
exports.useConflicts = useConflicts;
var vue_1 = require("vue");
var allocationService_1 = require("@/services/allocationService");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var useRealtime_1 = require("../useRealtime");
var errorMessages_1 = require("@/utils/errorMessages");
/**
 * Vietnamese messages for user feedback
 */
var MESSAGES = {
    // Success messages
    FETCH_SUCCESS: 'Đã tải danh sách xung đột',
    RESOLVE_SUCCESS: 'Đã giải quyết xung đột thành công',
    PRIORITY_UPDATE_SUCCESS: 'Đã cập nhật mức ưu tiên',
    CANCEL_SUCCESS: 'Đã hủy phân bổ xung đột',
    SPLIT_SUCCESS: 'Đã chia nhỏ phân bổ thành công',
    ESCALATE_SUCCESS: 'Đã leo thang xung đột lên cấp trên',
    // Error messages
    PRIORITY_UPDATE_ERROR: 'Cập nhật mức ưu tiên thất bại',
    CANCEL_ERROR: 'Hủy phân bổ thất bại',
    SPLIT_ERROR: 'Chia nhỏ phân bổ thất bại',
    // Real-time messages
    REALTIME_CONNECTED: 'Đang theo dõi xung đột theo thời gian thực',
    NEW_CONFLICT: 'Có xung đột phân bổ mới',
    CONFLICT_RESOLVED: 'Một xung đột đã được giải quyết',
};
/**
 * Thread Conflict Management Composable
 *
 * @example
 * ```ts
 * const {
 *   conflicts,
 *   isLoading,
 *   fetchConflicts,
 *   resolveByPriority,
 *   cancelConflictingAllocation,
 *   enableRealtime,
 * } = useConflicts()
 *
 * onMounted(() => {
 *   fetchConflicts()
 *   enableRealtime()
 * })
 * ```
 */
function useConflicts() {
    var _this = this;
    // State
    var conflicts = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)({});
    var selectedConflict = (0, vue_1.ref)(null);
    var realtimeEnabled = (0, vue_1.ref)(false);
    var realtimeChannelName = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    var realtime = (0, useRealtime_1.useRealtime)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var conflictCount = (0, vue_1.computed)(function () { return conflicts.value.length; });
    var pendingConflicts = (0, vue_1.computed)(function () {
        return conflicts.value.filter(function (c) { return c.status === 'PENDING'; });
    });
    var resolvedConflicts = (0, vue_1.computed)(function () {
        return conflicts.value.filter(function (c) { return c.status === 'RESOLVED'; });
    });
    var escalatedConflicts = (0, vue_1.computed)(function () {
        return conflicts.value.filter(function (c) { return c.status === 'ESCALATED'; });
    });
    var hasActiveConflicts = (0, vue_1.computed)(function () { return pendingConflicts.value.length > 0; });
    var totalShortage = (0, vue_1.computed)(function () {
        return pendingConflicts.value.reduce(function (sum, c) { return sum + c.shortage; }, 0);
    });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch all conflicts from API
     * @param newFilters - Optional filters to apply
     */
    var fetchConflicts = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
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
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.getConflicts()];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Map to ThreadConflict with additional UI fields
                    ];
                case 2:
                    data = _a.sent();
                    // Map to ThreadConflict with additional UI fields
                    conflicts.value = data.map(function (conflict) {
                        var _a, _b;
                        return (__assign(__assign({}, conflict), { thread_type_code: (_a = conflict.thread_type) === null || _a === void 0 ? void 0 : _a.code, thread_type_name: (_b = conflict.thread_type) === null || _b === void 0 ? void 0 : _b.name }));
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useConflicts] fetchConflicts error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Get conflict by ID
     * @param id - Conflict ID
     */
    var getConflictById = function (id) {
        return conflicts.value.find(function (c) { return c.id === id; });
    };
    /**
     * Get allocations affected by a conflict
     * @param conflict - The conflict to get allocations for
     */
    var getConflictAllocations = function (conflict) {
        return (conflict.competing_allocations || []).map(function (allocation) { return ({
            allocation_id: allocation.id,
            production_order_id: allocation.order_id,
            production_order_code: allocation.order_reference || allocation.order_id,
            requested_quantity: allocation.requested_meters,
            allocated_quantity: allocation.allocated_meters,
            priority: allocation.priority,
            priority_score: allocation.priority_score,
            requested_date: allocation.requested_date,
            status: allocation.status,
        }); });
    };
    /**
     * Resolve conflict by adjusting allocation priority
     * @param conflictId - Conflict ID (or allocation ID for priority change)
     * @param allocationId - Allocation ID to update
     * @param newPriority - New priority level
     */
    var resolveByPriority = function (conflictId, allocationId, newPriority) { return __awaiter(_this, void 0, void 0, function () {
        var err_2, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.resolveConflict(allocationId, newPriority)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    snackbar.success(MESSAGES.PRIORITY_UPDATE_SUCCESS);
                    return [4 /*yield*/, fetchConflicts()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, true];
                case 4:
                    err_2 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2);
                    error.value = errorMessage;
                    snackbar.error(MESSAGES.PRIORITY_UPDATE_ERROR);
                    console.error('[useConflicts] resolveByPriority error:', err_2);
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Cancel a conflicting allocation to resolve the conflict
     * @param allocationId - Allocation ID to cancel
     */
    var cancelConflictingAllocation = function (allocationId) { return __awaiter(_this, void 0, void 0, function () {
        var err_3, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.cancel(allocationId)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    snackbar.success(MESSAGES.CANCEL_SUCCESS);
                    return [4 /*yield*/, fetchConflicts()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, true];
                case 4:
                    err_3 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_3);
                    error.value = errorMessage;
                    snackbar.error(MESSAGES.CANCEL_ERROR);
                    console.error('[useConflicts] cancelConflictingAllocation error:', err_3);
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Split an allocation to partially resolve a conflict
     * Releases all allocated cones and sets both allocations to PENDING
     * @param allocationId - Allocation ID to split
     * @param splitQuantity - Number of meters for the new allocation
     * @param reason - Optional reason for the split
     * @returns true if split was successful
     */
    var splitAllocation = function (allocationId, splitQuantity, reason) { return __awaiter(_this, void 0, void 0, function () {
        var result, err_4, errorMessage;
        var _this = this;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    clearError();
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.split(allocationId, splitQuantity, reason)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    result = _c.sent();
                    if (!((_a = result === null || result === void 0 ? void 0 : result.result) === null || _a === void 0 ? void 0 : _a.success)) return [3 /*break*/, 4];
                    snackbar.success(MESSAGES.SPLIT_SUCCESS);
                    // Refresh conflicts list after split
                    return [4 /*yield*/, fetchConflicts()];
                case 3:
                    // Refresh conflicts list after split
                    _c.sent();
                    return [2 /*return*/, true];
                case 4:
                    snackbar.error(((_b = result === null || result === void 0 ? void 0 : result.result) === null || _b === void 0 ? void 0 : _b.message) || MESSAGES.SPLIT_ERROR);
                    return [2 /*return*/, false];
                case 5: return [3 /*break*/, 7];
                case 6:
                    err_4 = _c.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_4);
                    error.value = errorMessage;
                    snackbar.error(MESSAGES.SPLIT_ERROR);
                    console.error('[useConflicts] splitAllocation error:', err_4);
                    return [2 /*return*/, false];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Escalate a conflict for manual resolution
     * @param conflictId - Conflict ID to escalate
     * @param notes - Optional notes for escalation
     */
    var escalateConflict = function (conflictId, notes) { return __awaiter(_this, void 0, void 0, function () {
        var err_5, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, allocationService_1.allocationService.escalate(conflictId, notes)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    snackbar.success(MESSAGES.ESCALATE_SUCCESS);
                    // Refresh data
                    return [4 /*yield*/, fetchConflicts()];
                case 3:
                    // Refresh data
                    _a.sent();
                    return [2 /*return*/, true];
                case 4:
                    err_5 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_5);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useConflicts] escalateConflict error:', err_5);
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Generic resolve method that dispatches to specific resolution handlers
     * @param dto - Resolution DTO with type and parameters
     */
    var resolveConflict = function (dto) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (dto.resolutionType) {
                case 'priority':
                    if (dto.allocationId && dto.newPriority) {
                        return [2 /*return*/, resolveByPriority(dto.conflictId, dto.allocationId, dto.newPriority)];
                    }
                    snackbar.error('Thiếu thông tin để cập nhật ưu tiên');
                    return [2 /*return*/, false];
                case 'cancel':
                    if (dto.allocationId) {
                        return [2 /*return*/, cancelConflictingAllocation(dto.allocationId)];
                    }
                    snackbar.error('Thiếu ID phân bổ để hủy');
                    return [2 /*return*/, false];
                case 'split':
                    if (dto.allocationId && dto.splitQuantity) {
                        return [2 /*return*/, splitAllocation(dto.allocationId, dto.splitQuantity)];
                    }
                    snackbar.error('Thiếu thông tin để chia nhỏ phân bổ');
                    return [2 /*return*/, false];
                case 'escalate':
                    return [2 /*return*/, escalateConflict(dto.conflictId, dto.notes)];
                default:
                    snackbar.error('Loại giải quyết không hợp lệ');
                    return [2 /*return*/, false];
            }
            return [2 /*return*/];
        });
    }); };
    /**
     * Enable real-time updates for conflicts
     */
    var enableRealtime = function () {
        if (realtimeEnabled.value)
            return;
        realtimeChannelName.value = realtime.subscribe({
            table: 'allocation_conflicts',
            event: '*',
            schema: 'public',
        }, function (payload) {
            console.log('[useConflicts] Real-time event:', payload.eventType);
            switch (payload.eventType) {
                case 'INSERT':
                    snackbar.warning(MESSAGES.NEW_CONFLICT);
                    fetchConflicts(); // Refresh to get full data with joins
                    break;
                case 'UPDATE':
                    fetchConflicts(); // Refresh to get updated data
                    break;
                case 'DELETE':
                    // Remove from local state
                    if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
                        var deletedId_1 = payload.old.id;
                        conflicts.value = conflicts.value.filter(function (c) { return c.id !== deletedId_1; });
                    }
                    break;
            }
        });
        realtimeEnabled.value = true;
        snackbar.info(MESSAGES.REALTIME_CONNECTED);
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
    };
    /**
     * Select a conflict for viewing/editing
     * @param conflict - Conflict to select, or null to deselect
     */
    var selectConflict = function (conflict) {
        selectedConflict.value = conflict;
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
                    return [4 /*yield*/, fetchConflicts()];
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
                    return [4 /*yield*/, fetchConflicts()];
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
        conflicts.value = [];
        error.value = null;
        selectedConflict.value = null;
        filters.value = {};
        disableRealtime();
        loading.reset();
    };
    // Cleanup on unmount
    (0, vue_1.onUnmounted)(function () {
        disableRealtime();
    });
    return {
        // State
        conflicts: conflicts,
        error: error,
        filters: filters,
        selectedConflict: selectedConflict,
        realtimeEnabled: realtimeEnabled,
        // Computed
        isLoading: isLoading,
        conflictCount: conflictCount,
        pendingConflicts: pendingConflicts,
        resolvedConflicts: resolvedConflicts,
        escalatedConflicts: escalatedConflicts,
        hasActiveConflicts: hasActiveConflicts,
        totalShortage: totalShortage,
        // Methods
        fetchConflicts: fetchConflicts,
        getConflictById: getConflictById,
        getConflictAllocations: getConflictAllocations,
        resolveConflict: resolveConflict,
        resolveByPriority: resolveByPriority,
        cancelConflictingAllocation: cancelConflictingAllocation,
        splitAllocation: splitAllocation,
        escalateConflict: escalateConflict,
        enableRealtime: enableRealtime,
        disableRealtime: disableRealtime,
        selectConflict: selectConflict,
        setFilters: setFilters,
        clearFilters: clearFilters,
        clearError: clearError,
        reset: reset,
    };
}
