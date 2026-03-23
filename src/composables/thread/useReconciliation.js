"use strict";
/**
 * Thread Consumption Reconciliation Composable
 * Đối chiếu tiêu hao chỉ - Reconciliation Report
 *
 * Provides reactive state and operations for thread consumption reconciliation.
 * Handles fetching reports, filtering, and Excel export.
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
exports.useReconciliation = useReconciliation;
var vue_1 = require("vue");
var reconciliationService_1 = require("@/services/reconciliationService");
var useSnackbar_1 = require("../useSnackbar");
var useLoading_1 = require("../useLoading");
var errorMessages_1 = require("@/utils/errorMessages");
function useReconciliation() {
    var _this = this;
    // State
    var report = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)({});
    var error = (0, vue_1.ref)(null);
    // Composables
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    var loading = (0, useLoading_1.useLoading)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var rows = (0, vue_1.computed)(function () { var _a, _b; return (_b = (_a = report.value) === null || _a === void 0 ? void 0 : _a.rows) !== null && _b !== void 0 ? _b : []; });
    var summary = (0, vue_1.computed)(function () { var _a, _b; return (_b = (_a = report.value) === null || _a === void 0 ? void 0 : _a.summary) !== null && _b !== void 0 ? _b : null; });
    var hasData = (0, vue_1.computed)(function () { return rows.value.length > 0; });
    var rowCount = (0, vue_1.computed)(function () { return rows.value.length; });
    var generatedAt = (0, vue_1.computed)(function () { var _a, _b; return (_b = (_a = report.value) === null || _a === void 0 ? void 0 : _a.generated_at) !== null && _b !== void 0 ? _b : null; });
    /**
     * Clear error state
     */
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch reconciliation report from API
     * @param newFilters - Optional filters to apply
     */
    var fetchReport = function (newFilters) { return __awaiter(_this, void 0, void 0, function () {
        var _a, err_1, errorMessage;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    clearError();
                    if (newFilters) {
                        filters.value = __assign(__assign({}, filters.value), newFilters);
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    _a = report;
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, reconciliationService_1.reconciliationService.getReport(filters.value)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _b.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1, 'Không thể tải báo cáo đối chiếu');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useReconciliation] fetchReport error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Export reconciliation report to Excel
     */
    var exportExcel = function () { return __awaiter(_this, void 0, void 0, function () {
        var blob, url, a, err_2, errorMessage;
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
                                    case 0: return [4 /*yield*/, reconciliationService_1.reconciliationService.exportExcel(filters.value)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })
                        // Create download link
                    ];
                case 2:
                    blob = _a.sent();
                    url = URL.createObjectURL(blob);
                    a = document.createElement('a');
                    a.href = url;
                    a.download = "doi-chieu-tieu-hao-".concat(new Date().toISOString().split('T')[0], ".xlsx");
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    snackbar.success('Đã xuất Excel thành công');
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2, 'Không thể xuất Excel');
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useReconciliation] exportExcel error:', err_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Update filters and optionally refetch
     * @param newFilters - New filter values
     * @param refetch - Whether to refetch report after updating filters (default: true)
     */
    var updateFilters = function (newFilters_1) {
        var args_1 = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args_1[_i - 1] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([newFilters_1], args_1, true), void 0, function (newFilters, refetch) {
            if (refetch === void 0) { refetch = true; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filters.value = __assign(__assign({}, filters.value), newFilters);
                        if (!refetch) return [3 /*break*/, 2];
                        return [4 /*yield*/, fetchReport()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear all filters and optionally refetch
     * @param refetch - Whether to refetch report after clearing filters (default: true)
     */
    var clearFilters = function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (refetch) {
            if (refetch === void 0) { refetch = true; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filters.value = {};
                        if (!refetch) return [3 /*break*/, 2];
                        return [4 /*yield*/, fetchReport()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear report data
     */
    var clearReport = function () {
        report.value = null;
    };
    /**
     * Get rows filtered by consumption status
     * @param type - 'over' for over-quota, 'under' for under-quota, 'normal' for within tolerance
     * @param tolerancePercent - Tolerance percentage (default: 5%)
     * @returns Filtered rows
     */
    var getRowsByConsumption = function (type, tolerancePercent) {
        if (tolerancePercent === void 0) { tolerancePercent = 5; }
        return rows.value.filter(function (row) {
            // Calculate variance: quota - consumed (positive = under, negative = over)
            var varianceMeters = row.quota_meters - row.consumed_meters;
            var variancePercent = row.quota_meters > 0
                ? (varianceMeters / row.quota_meters) * 100
                : 0;
            switch (type) {
                case 'over':
                    return variancePercent < -tolerancePercent; // Negative variance = over quota
                case 'under':
                    return variancePercent > tolerancePercent; // Positive variance = under quota
                case 'normal':
                    return Math.abs(variancePercent) <= tolerancePercent;
                default:
                    return true;
            }
        });
    };
    /**
     * Get count of rows that are over quota
     */
    var overQuotaCount = (0, vue_1.computed)(function () { return getRowsByConsumption('over').length; });
    return {
        // State
        report: report,
        filters: filters,
        error: error,
        // Computed
        isLoading: isLoading,
        rows: rows,
        summary: summary,
        hasData: hasData,
        rowCount: rowCount,
        generatedAt: generatedAt,
        overQuotaCount: overQuotaCount,
        // Actions
        fetchReport: fetchReport,
        exportExcel: exportExcel,
        updateFilters: updateFilters,
        clearFilters: clearFilters,
        clearReport: clearReport,
        getRowsByConsumption: getRowsByConsumption,
        clearError: clearError,
    };
}
