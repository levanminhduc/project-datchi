"use strict";
/**
 * Reports Composable
 *
 * Provides reactive state and methods for allocation reports.
 * Follows useDashboard.ts pattern for structure and error handling.
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
exports.useReports = useReports;
var vue_1 = require("vue");
var reportService_1 = require("@/services/reportService");
var useLoading_1 = require("./useLoading");
var useSnackbar_1 = require("./useSnackbar");
var errorMessages_1 = require("@/utils/errorMessages");
/**
 * Vietnamese messages for user feedback
 */
var MESSAGES = {
    FETCH_SUCCESS: 'Đã tạo báo cáo',
    EXPORT_SUCCESS: 'Đã xuất báo cáo thành công',
    EXPORT_ERROR: 'Xuất báo cáo thất bại',
    NO_DATA_EXPORT: 'Không có dữ liệu để xuất',
};
function useReports() {
    var _this = this;
    // State
    var reportData = (0, vue_1.ref)(null);
    var error = (0, vue_1.ref)(null);
    var filters = (0, vue_1.ref)({
        from_date: undefined,
        to_date: undefined,
        thread_type_id: undefined,
        status: undefined,
    });
    // Composables
    var loading = (0, useLoading_1.useLoading)();
    var snackbar = (0, useSnackbar_1.useSnackbar)();
    // Computed
    var isLoading = (0, vue_1.computed)(function () { return loading.isLoading.value; });
    var hasData = (0, vue_1.computed)(function () { return reportData.value !== null && reportData.value.allocations.length > 0; });
    var summary = (0, vue_1.computed)(function () {
        if (!reportData.value)
            return null;
        return {
            totalAllocations: reportData.value.total_allocations,
            totalRequested: reportData.value.total_requested_meters,
            totalAllocated: reportData.value.total_allocated_meters,
            fulfillmentRate: reportData.value.overall_fulfillment_rate,
            avgTransitionHours: reportData.value.avg_transition_hours,
        };
    });
    var allocations = (0, vue_1.computed)(function () { var _a; return ((_a = reportData.value) === null || _a === void 0 ? void 0 : _a.allocations) || []; });
    // Methods
    var clearError = function () {
        error.value = null;
    };
    /**
     * Fetch allocation report with filters
     * Uses provided filters or current state
     */
    var fetchAllocationReport = function (reportFilters) { return __awaiter(_this, void 0, void 0, function () {
        var activeFilters, data, err_1, errorMessage;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clearError();
                    activeFilters = reportFilters || filters.value;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, loading.withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, reportService_1.reportService.getAllocationReport(activeFilters)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                case 2:
                    data = _a.sent();
                    reportData.value = data;
                    snackbar.success("".concat(MESSAGES.FETCH_SUCCESS, " v\u1EDBi ").concat(data.total_allocations, " ph\u00E2n b\u1ED5"));
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_1);
                    error.value = errorMessage;
                    snackbar.error(errorMessage);
                    console.error('[useReports] fetchAllocationReport error:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Export report data to XLSX file
     * Uses dynamic import to reduce bundle size
     */
    var exportToXlsx = function () { return __awaiter(_this, void 0, void 0, function () {
        var ExcelJS, workbook, worksheet_1, summaryRow, buffer, blob, url, link, today, err_2, errorMessage;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!reportData.value || reportData.value.allocations.length === 0) {
                        snackbar.warning(MESSAGES.NO_DATA_EXPORT);
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('exceljs'); })];
                case 2:
                    ExcelJS = _b.sent();
                    workbook = new ExcelJS.Workbook();
                    worksheet_1 = workbook.addWorksheet('Báo Cáo Phân Bổ');
                    // Add header row
                    worksheet_1.columns = [
                        { header: 'Mã Đơn Hàng', key: 'order_id', width: 15 },
                        { header: 'Mô Tả', key: 'order_reference', width: 25 },
                        { header: 'Mã Loại Chỉ', key: 'thread_type_code', width: 12 },
                        { header: 'Tên Loại Chỉ', key: 'thread_type_name', width: 20 },
                        { header: 'Yêu Cầu (m)', key: 'requested_meters', width: 12 },
                        { header: 'Đã Phân Bổ (m)', key: 'allocated_meters', width: 14 },
                        { header: 'Tỷ Lệ (%)', key: 'fulfillment_rate', width: 10 },
                        { header: 'Trạng Thái', key: 'status', width: 12 },
                        { header: 'Ưu Tiên', key: 'priority', width: 10 },
                        { header: 'Ngày Tạo', key: 'created_at', width: 18 },
                        { header: 'Thời Gian Xử Lý (giờ)', key: 'transition_hours', width: 18 },
                    ];
                    // Style header row
                    worksheet_1.getRow(1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF1976D2' },
                    };
                    worksheet_1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    // Add data rows
                    reportData.value.allocations.forEach(function (row) {
                        var _a;
                        worksheet_1.addRow({
                            order_id: row.order_id,
                            order_reference: row.order_reference || '',
                            thread_type_code: row.thread_type_code,
                            thread_type_name: row.thread_type_name,
                            requested_meters: row.requested_meters,
                            allocated_meters: row.allocated_meters,
                            fulfillment_rate: row.fulfillment_rate,
                            status: row.status,
                            priority: row.priority,
                            created_at: new Date(row.created_at).toLocaleString('vi-VN'),
                            transition_hours: (_a = row.transition_hours) !== null && _a !== void 0 ? _a : 'N/A',
                        });
                    });
                    summaryRow = worksheet_1.addRow({
                        order_id: 'TỔNG CỘNG',
                        requested_meters: reportData.value.total_requested_meters,
                        allocated_meters: reportData.value.total_allocated_meters,
                        fulfillment_rate: reportData.value.overall_fulfillment_rate,
                        transition_hours: (_a = reportData.value.avg_transition_hours) !== null && _a !== void 0 ? _a : 'N/A',
                    });
                    summaryRow.font = { bold: true };
                    return [4 /*yield*/, workbook.xlsx.writeBuffer()];
                case 3:
                    buffer = _b.sent();
                    blob = new Blob([buffer], {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    });
                    url = URL.createObjectURL(blob);
                    link = document.createElement('a');
                    today = new Date().toISOString().split('T')[0];
                    link.href = url;
                    link.download = "bao-cao-phan-bo-".concat(today, ".xlsx");
                    link.click();
                    URL.revokeObjectURL(url);
                    snackbar.success(MESSAGES.EXPORT_SUCCESS);
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _b.sent();
                    errorMessage = (0, errorMessages_1.getErrorMessage)(err_2);
                    snackbar.error("".concat(MESSAGES.EXPORT_ERROR, ": ").concat(errorMessage));
                    console.error('[useReports] exportToXlsx error:', err_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    /**
     * Update filters with partial new values
     */
    var setFilters = function (newFilters) {
        filters.value = __assign(__assign({}, filters.value), newFilters);
    };
    /**
     * Clear all filters and report data
     */
    var clearFilters = function () {
        filters.value = {
            from_date: undefined,
            to_date: undefined,
            thread_type_id: undefined,
            status: undefined,
        };
        reportData.value = null;
    };
    return {
        // State
        reportData: reportData,
        filters: filters,
        error: error,
        // Computed
        isLoading: isLoading,
        hasData: hasData,
        summary: summary,
        allocations: allocations,
        // Methods
        fetchAllocationReport: fetchAllocationReport,
        exportToXlsx: exportToXlsx,
        setFilters: setFilters,
        clearFilters: clearFilters,
        clearError: clearError,
    };
}
