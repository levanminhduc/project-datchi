"use strict";
/**
 * Dashboard Composable
 *
 * Provides reactive state and operations for dashboard management.
 * Aggregates metrics, alerts, conflicts, pending items, and activity.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDashboard = useDashboard;
var vue_1 = require("vue");
var dashboardService_1 = require("@/services/dashboardService");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
/**
 * Vietnamese messages for user feedback
 */
var MESSAGES = {
    REFRESH_SUCCESS: 'Đã cập nhật dữ liệu',
    FETCH_ERROR: 'Không thể tải dữ liệu dashboard',
};
function useDashboard() {
    var _this = this;
    // State
    var summary = (0, vue_1.ref)(null);
    var alerts = (0, vue_1.ref)([]);
    var conflicts = (0, vue_1.ref)({
        total_conflicts: 0,
        pending_count: 0,
        conflicts: [],
    });
    var pending = (0, vue_1.ref)(null);
    var activity = (0, vue_1.ref)([]);
    var error = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var hasCriticalAlerts = (0, vue_1.computed)(function () {
        return alerts.value.some(function (alert) { return alert.severity === 'critical'; });
    });
    var criticalAlertCount = (0, vue_1.computed)(function () { return alerts.value.filter(function (alert) { return alert.severity === 'critical'; }).length; });
    var hasConflicts = (0, vue_1.computed)(function () { return conflicts.value.total_conflicts > 0; });
    var totalPendingActions = (0, vue_1.computed)(function () {
        if (!pending.value)
            return 0;
        return (pending.value.pending_allocations +
            pending.value.pending_recovery +
            pending.value.waitlisted_allocations +
            pending.value.overdue_allocations);
    });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch dashboard summary statistics
     */
    var fetchSummary = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, err_1, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, dashboardService_1.dashboardService.getSummary()];
                case 1:
                    data = _a.sent();
                    summary.value = data;
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1);
                    error.value = errorMessage;
                    console.error('[useDashboard] fetchSummary error:', err_1);
                    throw err_1;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch stock alerts
     */
    var fetchAlerts = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, err_2, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, dashboardService_1.dashboardService.getAlerts()];
                case 1:
                    data = _a.sent();
                    alerts.value = data;
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2);
                    error.value = errorMessage;
                    console.error('[useDashboard] fetchAlerts error:', err_2);
                    throw err_2;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch conflicts information
     */
    var fetchConflicts = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, err_3, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, dashboardService_1.dashboardService.getConflicts()];
                case 1:
                    data = _a.sent();
                    conflicts.value = data;
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_3);
                    error.value = errorMessage;
                    console.error('[useDashboard] fetchConflicts error:', err_3);
                    throw err_3;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch pending items counts
     */
    var fetchPending = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, err_4, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, dashboardService_1.dashboardService.getPending()];
                case 1:
                    data = _a.sent();
                    pending.value = data;
                    return [3 /*break*/, 3];
                case 2:
                    err_4 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_4);
                    error.value = errorMessage;
                    console.error('[useDashboard] fetchPending error:', err_4);
                    throw err_4;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch activity feed
     */
    var fetchActivity = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, err_5, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, dashboardService_1.dashboardService.getActivity()];
                case 1:
                    data = _a.sent();
                    activity.value = data;
                    return [3 /*break*/, 3];
                case 2:
                    err_5 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_5);
                    error.value = errorMessage;
                    console.error('[useDashboard] fetchActivity error:', err_5);
                    throw err_5;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Fetch all dashboard data at once
     * Uses Promise.allSettled to handle partial failures gracefully
     */
    var fetchAll = function () { return __awaiter(_this, void 0, void 0, function () {
        var err_6, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            var results, failures;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, Promise.allSettled([
                                            fetchSummary(),
                                            fetchAlerts(),
                                            fetchConflicts(),
                                            fetchPending(),
                                            fetchActivity(),
                                        ])
                                        // Check if any requests failed
                                    ];
                                    case 1:
                                        results = _a.sent();
                                        failures = results.filter(function (result) { return result.status === 'rejected'; });
                                        if (failures.length === results.length) {
                                            // All requests failed
                                            throw new Error(MESSAGES.FETCH_ERROR);
                                        }
                                        else if (failures.length > 0) {
                                            // Some requests failed - log but don't throw
                                            console.warn('[useDashboard] Some dashboard data failed to load:', failures);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_6 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_6);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useDashboard] fetchAll error:', err_6);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Refresh all dashboard data (alias for fetchAll with success notification)
     */
    var refreshDashboard = function () { return __awaiter(_this, void 0, void 0, function () {
        var err_7, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            var results, failures;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, Promise.allSettled([
                                            fetchSummary(),
                                            fetchAlerts(),
                                            fetchConflicts(),
                                            fetchPending(),
                                            fetchActivity(),
                                        ])
                                        // Check if any requests failed
                                    ];
                                    case 1:
                                        results = _a.sent();
                                        failures = results.filter(function (result) { return result.status === 'rejected'; });
                                        if (failures.length === results.length) {
                                            // All requests failed
                                            throw new Error(MESSAGES.FETCH_ERROR);
                                        }
                                        else if (failures.length > 0) {
                                            // Some requests failed - partial success
                                            console.warn('[useDashboard] Some dashboard data failed to refresh:', failures);
                                            snackbar.warning('Một số dữ liệu không thể cập nhật');
                                        }
                                        else {
                                            // All successful
                                            snackbar.success(MESSAGES.REFRESH_SUCCESS);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_7 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_7);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useDashboard] refreshDashboard error:', err_7);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Reset all state to initial values
     */
    var reset = function () {
        summary.value = null;
        alerts.value = [];
        conflicts.value = { total_conflicts: 0, pending_count: 0, conflicts: [] };
        pending.value = null;
        activity.value = [];
        error.value = null;
        loading.reset();
    };
    return {
        // State
        summary: summary,
        alerts: alerts,
        conflicts: conflicts,
        pending: pending,
        activity: activity,
        error: error,
        // Computed
        isLoading: isLoading,
        hasCriticalAlerts: hasCriticalAlerts,
        criticalAlertCount: criticalAlertCount,
        hasConflicts: hasConflicts,
        totalPendingActions: totalPendingActions,
        // Methods
        fetchSummary: fetchSummary,
        fetchAlerts: fetchAlerts,
        fetchConflicts: fetchConflicts,
        fetchPending: fetchPending,
        fetchActivity: fetchActivity,
        fetchAll: fetchAll,
        refreshDashboard: refreshDashboard,
        clearError: clearError,
        reset: reset,
    };
}
