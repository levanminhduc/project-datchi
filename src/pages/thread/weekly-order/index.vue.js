"use strict";
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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var quasar_1 = require("quasar");
var composables_1 = require("@/composables");
var purchaseOrderService_1 = require("@/services/purchaseOrderService");
var weeklyOrderService_1 = require("@/services/weeklyOrderService");
var enums_1 = require("@/types/thread/enums");
var POOrderCard_vue_1 = require("@/components/thread/weekly-order/POOrderCard.vue");
var AssignmentControlDialog_vue_1 = require("@/components/thread/weekly-order/AssignmentControlDialog.vue");
definePage({
    meta: {
        requiresAuth: true,
        permissions: ['thread.view'],
    },
});
// Composables
var $q = (0, quasar_1.useQuasar)();
var snackbar = (0, composables_1.useSnackbar)();
var _d = (0, composables_1.useWeeklyOrder)(), weeks = _d.weeks, selectedWeek = _d.selectedWeek, weekLoading = _d.loading, fetchWeeks = _d.fetchWeeks, createWeek = _d.createWeek, updateWeek = _d.updateWeek, loadWeek = _d.loadWeek, saveResults = _d.saveResults, loadResults = _d.loadResults;
var _e = (0, composables_1.useWeeklyOrderCalculation)(), orderEntries = _e.orderEntries, perStyleResults = _e.perStyleResults, aggregatedResults = _e.aggregatedResults, isCalculating = _e.isCalculating, isReordering = _e.isReordering, calculationProgress = _e.calculationProgress, calculationErrors = _e.calculationErrors, calculationWarnings = _e.calculationWarnings, canCalculate = _e.canCalculate, canCalculateReason = _e.canCalculateReason, hasResults = _e.hasResults, isResultsStale = _e.isResultsStale, hasOverLimitEntries = _e.hasOverLimitEntries, orderedQuantities = _e.orderedQuantities, subArtRequired = _e.subArtRequired, addStyle = _e.addStyle, removeStyle = _e.removeStyle, removePO = _e.removePO, addColorToStyle = _e.addColorToStyle, removeColorFromStyle = _e.removeColorFromStyle, updateColorQuantity = _e.updateColorQuantity, updateSubArt = _e.updateSubArt, calculateAll = _e.calculateAll, clearAll = _e.clearAll, setFromWeekItems = _e.setFromWeekItems, updateAdditionalOrder = _e.updateAdditionalOrder, updateQuotaCones = _e.updateQuotaCones, updateDeliveryDate = _e.updateDeliveryDate, mergeDeliveryDateOverrides = _e.mergeDeliveryDateOverrides, reorderResults = _e.reorderResults, fetchOrderedQuantities = _e.fetchOrderedQuantities;
var _f = (0, composables_1.usePurchaseOrders)(), poList = _f.purchaseOrders, posLoading = _f.isLoading, fetchAllPurchaseOrders = _f.fetchAllPurchaseOrders;
// Local state
var weekInfoCardRef = (0, vue_1.ref)(null);
var weekName = (0, vue_1.ref)('');
var startDate = (0, vue_1.ref)('');
var endDate = (0, vue_1.ref)('');
var notes = (0, vue_1.ref)('');
var selectedPOId = (0, vue_1.ref)(null);
var loadingPOId = (0, vue_1.ref)(null);
var loadedPOs = (0, vue_1.ref)([]);
var resultView = (0, vue_1.ref)('summary');
var showHistory = (0, vue_1.ref)(false);
var showAssignmentControl = (0, vue_1.ref)(false);
var confirmingWeek = (0, vue_1.ref)(false);
var resultsSaved = (0, vue_1.ref)(false);
// Computed
var poOptions = (0, vue_1.computed)(function () {
    return poList.value
        .filter(function (po) { return !loadedPOs.value.some(function (loaded) { return loaded.id === po.id; }); })
        .map(function (po) { return ({
        label: "".concat(po.po_number).concat(po.customer_name ? " - ".concat(po.customer_name) : ''),
        value: po.id,
    }); });
});
var canSave = (0, vue_1.computed)(function () {
    return orderEntries.value.length > 0;
});
// Handlers
var handleAddPO = function () { return __awaiter(void 0, void 0, void 0, function () {
    var poWithItems_1, pairs, err_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!selectedPOId.value)
                    return [2 /*return*/];
                loadingPOId.value = selectedPOId.value;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, 6, 7]);
                return [4 /*yield*/, purchaseOrderService_1.purchaseOrderService.getWithItems(selectedPOId.value)];
            case 2:
                poWithItems_1 = _b.sent();
                loadedPOs.value.push(poWithItems_1);
                if (!(poWithItems_1.items && poWithItems_1.items.length > 0)) return [3 /*break*/, 4];
                pairs = poWithItems_1.items.map(function (item) { return ({
                    po_id: poWithItems_1.id,
                    style_id: item.style_id,
                }); });
                return [4 /*yield*/, fetchOrderedQuantities(pairs, (_a = selectedWeek.value) === null || _a === void 0 ? void 0 : _a.id).catch(function () { })];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4:
                selectedPOId.value = null;
                return [3 /*break*/, 7];
            case 5:
                err_1 = _b.sent();
                snackbar.error('Không thể tải dữ liệu PO');
                console.error('[weekly-order] load PO error:', err_1);
                return [3 /*break*/, 7];
            case 6:
                loadingPOId.value = null;
                return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}); };
var handleRemovePO = function (poId) {
    loadedPOs.value = loadedPOs.value.filter(function (po) { return po.id !== poId; });
    removePO(poId);
};
var handleAddStyleFromPO = function (style) {
    addStyle({
        id: style.id,
        style_code: style.style_code,
        style_name: style.style_name,
        po_id: style.po_id,
        po_number: style.po_number,
        sub_art_id: style.sub_art_id,
        sub_art_code: style.sub_art_code,
    });
};
var handleUpdateAdditionalOrder = function (threadTypeId, value) {
    updateAdditionalOrder(threadTypeId, value);
};
// Debounce timer for quota_cones updates
var quotaConesDebounceTimer = null;
var handleUpdateQuotaCones = function (threadTypeId, value) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // Update local state immediately
        updateQuotaCones(threadTypeId, value);
        // Debounce API call
        if (quotaConesDebounceTimer) {
            clearTimeout(quotaConesDebounceTimer);
        }
        quotaConesDebounceTimer = setTimeout(function () { return __awaiter(void 0, void 0, void 0, function () {
            var err_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((_a = selectedWeek.value) === null || _a === void 0 ? void 0 : _a.id)) {
                            snackbar.warning('Vui long luu tuan dat hang truoc khi cap nhat dinh muc');
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.updateQuotaCones(selectedWeek.value.id, threadTypeId, value)];
                    case 2:
                        _b.sent();
                        snackbar.success('Da cap nhat dinh muc cuon');
                        return [3 /*break*/, 4];
                    case 3:
                        err_2 = _b.sent();
                        console.error('[weekly-order] update quota_cones error:', err_2);
                        snackbar.error('Khong the cap nhat dinh muc. Vui long thu lai.');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); }, 500);
        return [2 /*return*/];
    });
}); };
var handleCalculate = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                resultsSaved.value = false;
                return [4 /*yield*/, calculateAll((_a = selectedWeek.value) === null || _a === void 0 ? void 0 : _a.id)];
            case 1:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); };
var handleUpdateDeliveryDate = function (specId, date) {
    updateDeliveryDate(specId, date);
    // Update the row's delivery_date directly for immediate UI reflection
    for (var _i = 0, _a = perStyleResults.value; _i < _a.length; _i++) {
        var result = _a[_i];
        var calc = result.calculations.find(function (c) { return c.spec_id === specId; });
        if (calc) {
            calc.delivery_date = date;
            break;
        }
    }
};
var handleReorder = function (newOrder) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, reorderResults(newOrder)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var handleSave = function () { return __awaiter(void 0, void 0, void 0, function () {
    var items, created;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!weekName.value) {
                    snackbar.error('Vui lòng nhập thông tin Đơn đặt chỉ');
                    return [2 /*return*/];
                }
                // Merge any delivery date overrides into results before saving
                mergeDeliveryDateOverrides();
                items = orderEntries.value.flatMap(function (entry) {
                    return entry.colors
                        .filter(function (c) { return c.quantity > 0; })
                        .map(function (c) {
                        var _a;
                        return ({
                            po_id: entry.po_id,
                            style_id: entry.style_id,
                            color_id: c.color_id,
                            quantity: c.quantity,
                            sub_art_id: (_a = entry.sub_art_id) !== null && _a !== void 0 ? _a : null,
                            style_color_id: c.style_color_id,
                        });
                    });
                });
                if (!selectedWeek.value) return [3 /*break*/, 4];
                return [4 /*yield*/, updateWeek(selectedWeek.value.id, {
                        week_name: weekName.value,
                        start_date: startDate.value || undefined,
                        end_date: endDate.value || undefined,
                        notes: notes.value || undefined,
                        items: items,
                    })];
            case 1:
                _a.sent();
                if (!hasResults.value) return [3 /*break*/, 3];
                return [4 /*yield*/, saveResults(selectedWeek.value.id, perStyleResults.value, aggregatedResults.value)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                resultsSaved.value = true;
                return [3 /*break*/, 8];
            case 4: return [4 /*yield*/, createWeek({
                    week_name: weekName.value,
                    start_date: startDate.value || undefined,
                    end_date: endDate.value || undefined,
                    notes: notes.value || undefined,
                    items: items,
                })];
            case 5:
                created = _a.sent();
                if (!created) return [3 /*break*/, 8];
                selectedWeek.value = created;
                if (!hasResults.value) return [3 /*break*/, 7];
                return [4 /*yield*/, saveResults(created.id, perStyleResults.value, aggregatedResults.value)];
            case 6:
                _a.sent();
                _a.label = 7;
            case 7:
                resultsSaved.value = true;
                _a.label = 8;
            case 8: return [2 /*return*/];
        }
    });
}); };
var handleLoadWeek = function (weekId) { return __awaiter(void 0, void 0, void 0, function () {
    var week, poIds, _i, poIds_1, poId, poWithItems, _a, pairs, uniquePairs, savedResults;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, loadWeek(weekId)];
            case 1:
                week = _b.sent();
                if (!week)
                    return [2 /*return*/];
                showHistory.value = false;
                weekName.value = week.week_name;
                startDate.value = week.start_date || '';
                endDate.value = week.end_date || '';
                notes.value = week.notes || '';
                if (!(week.items && week.items.length > 0)) return [3 /*break*/, 10];
                setFromWeekItems(week.items);
                poIds = new Set(week.items.filter(function (item) { return item.po_id; }).map(function (item) { return item.po_id; }));
                loadedPOs.value = [];
                _i = 0, poIds_1 = poIds;
                _b.label = 2;
            case 2:
                if (!(_i < poIds_1.length)) return [3 /*break*/, 7];
                poId = poIds_1[_i];
                _b.label = 3;
            case 3:
                _b.trys.push([3, 5, , 6]);
                return [4 /*yield*/, purchaseOrderService_1.purchaseOrderService.getWithItems(poId)];
            case 4:
                poWithItems = _b.sent();
                loadedPOs.value.push(poWithItems);
                return [3 /*break*/, 6];
            case 5:
                _a = _b.sent();
                return [3 /*break*/, 6];
            case 6:
                _i++;
                return [3 /*break*/, 2];
            case 7:
                pairs = week.items
                    .filter(function (item) { return item.po_id; })
                    .map(function (item) { return ({ po_id: item.po_id, style_id: item.style_id }); });
                uniquePairs = __spreadArray([], new Map(pairs.map(function (p) { return ["".concat(p.po_id, "_").concat(p.style_id), p]; })).values(), true);
                if (!(uniquePairs.length > 0)) return [3 /*break*/, 9];
                return [4 /*yield*/, fetchOrderedQuantities(uniquePairs, weekId).catch(function () { })];
            case 8:
                _b.sent();
                _b.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                clearAll();
                loadedPOs.value = [];
                _b.label = 11;
            case 11: return [4 /*yield*/, loadResults(weekId)];
            case 12:
                savedResults = _b.sent();
                if (savedResults) {
                    if (savedResults.calculation_data) {
                        perStyleResults.value = savedResults.calculation_data;
                    }
                    if (savedResults.summary_data) {
                        aggregatedResults.value = savedResults.summary_data;
                    }
                    resultsSaved.value = true;
                    snackbar.info('Đã tải kết quả tính toán đã lưu');
                }
                else {
                    resultsSaved.value = false;
                }
                return [2 /*return*/];
        }
    });
}); };
var handleWeekNameBlur = function () { return __awaiter(void 0, void 0, void 0, function () {
    var trimmedName, result_1, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                trimmedName = weekName.value.trim();
                if (!trimmedName)
                    return [2 /*return*/];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.checkWeekNameExists(trimmedName)];
            case 2:
                result_1 = _b.sent();
                if (!result_1.exists || !result_1.week)
                    return [2 /*return*/];
                if (selectedWeek.value && result_1.week.id === selectedWeek.value.id)
                    return [2 /*return*/];
                $q.dialog({
                    title: 'Tuần đã tồn tại',
                    message: "Tu\u1EA7n \"".concat(result_1.week.week_name, "\" \u0111\u00E3 t\u1ED3n t\u1EA1i. B\u1EA1n mu\u1ED1n l\u00E0m g\u00EC?"),
                    persistent: true,
                    options: {
                        type: 'radio',
                        model: 'load',
                        items: [
                            { label: 'Tải và cập nhật tuần này', value: 'load' },
                            { label: 'Đổi tên mới', value: 'rename' },
                        ],
                    },
                }).onOk(function (action) { return __awaiter(void 0, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                if (!(action === 'load' && result_1.week)) return [3 /*break*/, 2];
                                return [4 /*yield*/, handleLoadWeek(result_1.week.id)];
                            case 1:
                                _b.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                if (action === 'rename') {
                                    (_a = weekInfoCardRef.value) === null || _a === void 0 ? void 0 : _a.focusWeekName();
                                }
                                _b.label = 3;
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
                return [3 /*break*/, 4];
            case 3:
                _a = _b.sent();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
var handleConfirmWeek = function () { return __awaiter(void 0, void 0, void 0, function () {
    var err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!hasResults.value)
                    return [2 /*return*/];
                if (!weekName.value) {
                    snackbar.error('Vui lòng nhập thông tin Đơn đặt chỉ');
                    return [2 /*return*/];
                }
                confirmingWeek.value = true;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, 6, 7]);
                return [4 /*yield*/, handleSave()];
            case 2:
                _a.sent();
                if (!selectedWeek.value) {
                    snackbar.error('Không thể lưu đơn hàng. Vui lòng thử lại.');
                    return [2 /*return*/];
                }
                if (selectedWeek.value.status === enums_1.OrderWeekStatus.CONFIRMED) {
                    snackbar.info('Đơn hàng đã được xác nhận');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.updateStatus(selectedWeek.value.id, enums_1.OrderWeekStatus.CONFIRMED)];
            case 3:
                _a.sent();
                selectedWeek.value.status = enums_1.OrderWeekStatus.CONFIRMED;
                snackbar.success('Đã xác nhận đặt hàng thành công');
                return [4 /*yield*/, fetchWeeks()];
            case 4:
                _a.sent();
                return [3 /*break*/, 7];
            case 5:
                err_3 = _a.sent();
                console.error('Failed to confirm week:', err_3);
                snackbar.error('Không thể xác nhận. Vui lòng thử lại.');
                return [3 /*break*/, 7];
            case 6:
                confirmingWeek.value = false;
                return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}); };
var handleExport = function () { return __awaiter(void 0, void 0, void 0, function () {
    var ExcelJS, workbook, worksheet_1, buffer, blob, url, link, err_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (aggregatedResults.value.length === 0) {
                    snackbar.warning('Chưa có dữ liệu để xuất');
                    return [2 /*return*/];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, Promise.resolve().then(function () { return require('exceljs'); })];
            case 2:
                ExcelJS = _a.sent();
                workbook = new ExcelJS.Workbook();
                worksheet_1 = workbook.addWorksheet('Đặt Hàng Chỉ');
                worksheet_1.columns = [
                    { header: 'Loại chỉ', key: 'thread_type_name', width: 25 },
                    { header: 'NCC', key: 'supplier_name', width: 20 },
                    { header: 'Tex', key: 'tex_number', width: 10 },
                    { header: 'Màu chỉ', key: 'thread_color', width: 15 },
                    { header: 'Tổng mét', key: 'total_meters', width: 15 },
                    { header: 'Tổng cuộn', key: 'total_cones', width: 12 },
                    { header: 'Định mức (cuộn)', key: 'quota_cones', width: 15 },
                    { header: 'Mét/cuộn', key: 'meters_per_cone', width: 12 },
                    { header: 'Tồn kho KD', key: 'inventory_cones', width: 12 },
                    { header: 'Cuộn nguyên', key: 'full_cones', width: 12 },
                    { header: 'Cuộn lẻ', key: 'partial_cones', width: 12 },
                    { header: 'Tồn kho QĐ', key: 'equivalent_cones', width: 12 },
                    { header: 'SL cần đặt', key: 'sl_can_dat', width: 12 },
                    { header: 'Đặt thêm', key: 'additional_order', width: 12 },
                    { header: 'Tổng chốt', key: 'total_final', width: 12 },
                ];
                // Style header row
                worksheet_1.getRow(1).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1976D2' },
                };
                worksheet_1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                aggregatedResults.value.forEach(function (r) {
                    var _a, _b, _c;
                    worksheet_1.addRow({
                        thread_type_name: r.thread_type_name,
                        supplier_name: r.supplier_name,
                        tex_number: r.tex_number,
                        thread_color: r.thread_color || '',
                        total_meters: Number(r.total_meters.toFixed(2)),
                        total_cones: r.total_cones,
                        quota_cones: r.quota_cones || r.total_cones || '',
                        meters_per_cone: r.meters_per_cone || '',
                        inventory_cones: r.inventory_cones || '',
                        full_cones: (_a = r.full_cones) !== null && _a !== void 0 ? _a : '',
                        partial_cones: (_b = r.partial_cones) !== null && _b !== void 0 ? _b : '',
                        equivalent_cones: (_c = r.equivalent_cones) !== null && _c !== void 0 ? _c : '',
                        sl_can_dat: r.sl_can_dat || '',
                        additional_order: r.additional_order || '',
                        total_final: r.total_final || '',
                    });
                });
                return [4 /*yield*/, workbook.xlsx.writeBuffer()];
            case 3:
                buffer = _a.sent();
                blob = new Blob([buffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                url = URL.createObjectURL(blob);
                link = document.createElement('a');
                link.href = url;
                link.download = "dat-hang-chi-".concat(weekName.value || 'tuan', ".xlsx");
                link.click();
                URL.revokeObjectURL(url);
                snackbar.success('Đã xuất file Excel');
                return [3 /*break*/, 5];
            case 4:
                err_4 = _a.sent();
                snackbar.error('Không thể xuất file Excel');
                console.error('[weekly-order] export error:', err_4);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([fetchAllPurchaseOrders(), fetchWeeks()])];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPage | typeof __VLS_components.QPage | typeof __VLS_components.qPage | typeof __VLS_components.QPage} */
qPage;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    padding: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        padding: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.PageHeader | typeof __VLS_components.PageHeader} */
PageHeader;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    title: "Đặt Hàng Chỉ Tuần",
    subtitle: "Quản lý đặt hàng chỉ theo tuần - Chọn PO → Mã hàng → Màu → Số lượng",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Đặt Hàng Chỉ Tuần",
        subtitle: "Quản lý đặt hàng chỉ theo tuần - Chọn PO → Mã hàng → Màu → Số lượng",
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
{
    var __VLS_13 = __VLS_10.slots.actions;
    var __VLS_14 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign({ 'onClick': {} }, { flat: true, icon: "assignment_turned_in", label: "Kiểm soát chỉ đã gán" })));
    var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, icon: "assignment_turned_in", label: "Kiểm soát chỉ đã gán" })], __VLS_functionalComponentArgsRest(__VLS_15), false));
    var __VLS_19 = void 0;
    var __VLS_20 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.showAssignmentControl = true;
                // @ts-ignore
                [showAssignmentControl,];
            } });
    var __VLS_17;
    var __VLS_18;
    var __VLS_21 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21(__assign({ 'onClick': {} }, { flat: true, icon: "history", label: "Lịch sử" })));
    var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, icon: "history", label: "Lịch sử" })], __VLS_functionalComponentArgsRest(__VLS_22), false));
    var __VLS_26 = void 0;
    var __VLS_27 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.showHistory = true;
                // @ts-ignore
                [showHistory,];
            } });
    var __VLS_24;
    var __VLS_25;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_10;
var __VLS_28;
/** @ts-ignore @type {typeof __VLS_components.WeekInfoCard} */
WeekInfoCard;
// @ts-ignore
var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign(__assign(__assign(__assign(__assign({ 'onUpdate:startDate': {} }, { 'onUpdate:endDate': {} }), { 'onUpdate:notes': {} }), { 'onBlur:weekName': {} }), { ref: "weekInfoCardRef", modelValue: (__VLS_ctx.weekName), startDate: (__VLS_ctx.startDate), endDate: (__VLS_ctx.endDate), notes: (__VLS_ctx.notes) }), { class: "q-mb-md" })));
var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign(__assign({ 'onUpdate:startDate': {} }, { 'onUpdate:endDate': {} }), { 'onUpdate:notes': {} }), { 'onBlur:weekName': {} }), { ref: "weekInfoCardRef", modelValue: (__VLS_ctx.weekName), startDate: (__VLS_ctx.startDate), endDate: (__VLS_ctx.endDate), notes: (__VLS_ctx.notes) }), { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_29), false));
var __VLS_33;
var __VLS_34 = ({ 'update:startDate': {} },
    { 'onUpdate:startDate': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.startDate = $event;
            // @ts-ignore
            [weekName, startDate, startDate, endDate, notes,];
        } });
var __VLS_35 = ({ 'update:endDate': {} },
    { 'onUpdate:endDate': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.endDate = $event;
            // @ts-ignore
            [endDate,];
        } });
var __VLS_36 = ({ 'update:notes': {} },
    { 'onUpdate:notes': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.notes = $event;
            // @ts-ignore
            [notes,];
        } });
var __VLS_37 = ({ 'blur:weekName': {} },
    { 'onBlur:weekName': (__VLS_ctx.handleWeekNameBlur) });
var __VLS_38 = {};
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_31;
var __VLS_32;
var __VLS_40;
/** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
AppCard;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40(__assign({ flat: true, bordered: true }, { class: "q-mb-md" })));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_41), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_45 = __VLS_43.slots.default;
var __VLS_46;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({}));
var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_47), false));
var __VLS_51 = __VLS_49.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm q-mb-md items-end" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_52;
/** @ts-ignore @type {typeof __VLS_components.AppSelect | typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
    modelValue: (__VLS_ctx.selectedPOId),
    options: (__VLS_ctx.poOptions),
    label: "Chọn PO",
    dense: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
    hideBottomSpace: true,
    clearable: true,
    loading: (__VLS_ctx.posLoading),
}));
var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.selectedPOId),
        options: (__VLS_ctx.poOptions),
        label: "Chọn PO",
        dense: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        hideBottomSpace: true,
        clearable: true,
        loading: (__VLS_ctx.posLoading),
    }], __VLS_functionalComponentArgsRest(__VLS_53), false));
var __VLS_57 = __VLS_55.slots.default;
{
    var __VLS_58 = __VLS_55.slots["no-option"];
    var __VLS_59 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59({}));
    var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_60), false));
    var __VLS_64 = __VLS_62.slots.default;
    var __VLS_65 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65(__assign({ class: "text-grey" })));
    var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_66), false));
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    var __VLS_70 = __VLS_68.slots.default;
    // @ts-ignore
    [handleWeekNameBlur, selectedPOId, poOptions, posLoading,];
    var __VLS_68;
    // @ts-ignore
    [];
    var __VLS_62;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_55;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
/** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
var __VLS_71;
/** @ts-ignore @type {typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm PO", disable: (!__VLS_ctx.selectedPOId), loading: (__VLS_ctx.loadingPOId !== null && __VLS_ctx.loadingPOId === __VLS_ctx.selectedPOId) })));
var __VLS_73 = __VLS_72.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm PO", disable: (!__VLS_ctx.selectedPOId), loading: (__VLS_ctx.loadingPOId !== null && __VLS_ctx.loadingPOId === __VLS_ctx.selectedPOId) })], __VLS_functionalComponentArgsRest(__VLS_72), false));
var __VLS_76;
var __VLS_77 = ({ click: {} },
    { onClick: (__VLS_ctx.handleAddPO) });
var __VLS_74;
var __VLS_75;
for (var _i = 0, _g = __VLS_vFor((__VLS_ctx.loadedPOs)); _i < _g.length; _i++) {
    var po = _g[_i][0];
    var __VLS_78 = POOrderCard_vue_1.default;
    // @ts-ignore
    var __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onRemovePo': {} }, { 'onAddStyle': {} }), { 'onRemoveStyle': {} }), { 'onAddColor': {} }), { 'onRemoveColor': {} }), { 'onUpdateQuantity': {} }), { 'onUpdateSubArt': {} }), { key: (po.id), po: (po), entries: (__VLS_ctx.orderEntries), orderedQuantities: (__VLS_ctx.orderedQuantities), subArtRequired: (__VLS_ctx.subArtRequired) })));
    var __VLS_80 = __VLS_79.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign(__assign(__assign(__assign({ 'onRemovePo': {} }, { 'onAddStyle': {} }), { 'onRemoveStyle': {} }), { 'onAddColor': {} }), { 'onRemoveColor': {} }), { 'onUpdateQuantity': {} }), { 'onUpdateSubArt': {} }), { key: (po.id), po: (po), entries: (__VLS_ctx.orderEntries), orderedQuantities: (__VLS_ctx.orderedQuantities), subArtRequired: (__VLS_ctx.subArtRequired) })], __VLS_functionalComponentArgsRest(__VLS_79), false));
    var __VLS_83 = void 0;
    var __VLS_84 = ({ removePo: {} },
        { onRemovePo: (__VLS_ctx.handleRemovePO) });
    var __VLS_85 = ({ addStyle: {} },
        { onAddStyle: (__VLS_ctx.handleAddStyleFromPO) });
    var __VLS_86 = ({ removeStyle: {} },
        { onRemoveStyle: (function (styleId, poId, subArtId) { return __VLS_ctx.removeStyle(styleId, poId, subArtId); }) });
    var __VLS_87 = ({ addColor: {} },
        { onAddColor: (function (styleId, color, poId, subArtId) { return __VLS_ctx.addColorToStyle(styleId, color, poId, subArtId); }) });
    var __VLS_88 = ({ removeColor: {} },
        { onRemoveColor: (function (styleId, colorId, poId, subArtId) { return __VLS_ctx.removeColorFromStyle(styleId, colorId, poId, subArtId); }) });
    var __VLS_89 = ({ updateQuantity: {} },
        { onUpdateQuantity: (function (styleId, colorId, qty, poId, subArtId) { return __VLS_ctx.updateColorQuantity(styleId, colorId, qty, poId, subArtId); }) });
    var __VLS_90 = ({ updateSubArt: {} },
        { onUpdateSubArt: (function (styleId, poId, subArtId, subArtCode, oldSubArtId) { return __VLS_ctx.updateSubArt(styleId, poId, subArtId, subArtCode, oldSubArtId); }) });
    var __VLS_81;
    var __VLS_82;
    // @ts-ignore
    [selectedPOId, selectedPOId, loadingPOId, loadingPOId, handleAddPO, loadedPOs, orderEntries, orderedQuantities, subArtRequired, handleRemovePO, handleAddStyleFromPO, removeStyle, addColorToStyle, removeColorFromStyle, updateColorQuantity, updateSubArt,];
}
if (__VLS_ctx.loadedPOs.length === 0) {
    var __VLS_91 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.EmptyState} */
    EmptyState;
    // @ts-ignore
    var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91({
        icon: "assignment",
        title: "Chưa có PO nào",
        subtitle: "Chọn PO từ danh sách để bắt đầu",
        iconColor: "grey-4",
    }));
    var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([{
            icon: "assignment",
            title: "Chưa có PO nào",
            subtitle: "Chọn PO từ danh sách để bắt đầu",
            iconColor: "grey-4",
        }], __VLS_functionalComponentArgsRest(__VLS_92), false));
}
// @ts-ignore
[loadedPOs,];
var __VLS_49;
// @ts-ignore
[];
var __VLS_43;
if (__VLS_ctx.hasOverLimitEntries) {
    var __VLS_96 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96(__assign({ dense: true, rounded: true }, { class: "bg-red-1 text-negative q-mb-md" })));
    var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([__assign({ dense: true, rounded: true }, { class: "bg-red-1 text-negative q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_97), false));
    /** @type {__VLS_StyleScopedClasses['bg-red-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_101 = __VLS_99.slots.default;
    {
        var __VLS_102 = __VLS_99.slots.avatar;
        var __VLS_103 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_104 = __VLS_asFunctionalComponent1(__VLS_103, new __VLS_103({
            name: "error",
            color: "negative",
        }));
        var __VLS_105 = __VLS_104.apply(void 0, __spreadArray([{
                name: "error",
                color: "negative",
            }], __VLS_functionalComponentArgsRest(__VLS_104), false));
        // @ts-ignore
        [hasOverLimitEntries,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    // @ts-ignore
    [];
    var __VLS_99;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_108;
/** @ts-ignore @type {typeof __VLS_components.AppButton | typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108(__assign({ 'onClick': {} }, { color: "primary", icon: "calculate", label: "Tính toán", loading: (__VLS_ctx.isCalculating), disable: (!__VLS_ctx.canCalculate || __VLS_ctx.hasOverLimitEntries) })));
var __VLS_110 = __VLS_109.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "calculate", label: "Tính toán", loading: (__VLS_ctx.isCalculating), disable: (!__VLS_ctx.canCalculate || __VLS_ctx.hasOverLimitEntries) })], __VLS_functionalComponentArgsRest(__VLS_109), false));
var __VLS_113;
var __VLS_114 = ({ click: {} },
    { onClick: (__VLS_ctx.handleCalculate) });
var __VLS_115 = __VLS_111.slots.default;
if (!__VLS_ctx.canCalculate && __VLS_ctx.canCalculateReason) {
    var __VLS_116 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppTooltip | typeof __VLS_components.AppTooltip} */
    AppTooltip;
    // @ts-ignore
    var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({}));
    var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_117), false));
    var __VLS_121 = __VLS_119.slots.default;
    (__VLS_ctx.canCalculateReason);
    // @ts-ignore
    [hasOverLimitEntries, isCalculating, canCalculate, canCalculate, handleCalculate, canCalculateReason, canCalculateReason,];
    var __VLS_119;
}
// @ts-ignore
[];
var __VLS_111;
var __VLS_112;
if (__VLS_ctx.isResultsStale) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-warning" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
}
var __VLS_122;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122({}));
var __VLS_124 = __VLS_123.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_123), false));
if (__VLS_ctx.isCalculating) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-grey" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    (__VLS_ctx.calculationProgress.current);
    (__VLS_ctx.calculationProgress.total);
}
if (__VLS_ctx.calculationErrors.length > 0) {
    var __VLS_127 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppBanner | typeof __VLS_components.AppBanner} */
    AppBanner;
    // @ts-ignore
    var __VLS_128 = __VLS_asFunctionalComponent1(__VLS_127, new __VLS_127(__assign({ class: "bg-negative text-white q-mb-md" }, { rounded: true })));
    var __VLS_129 = __VLS_128.apply(void 0, __spreadArray([__assign({ class: "bg-negative text-white q-mb-md" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_128), false));
    /** @type {__VLS_StyleScopedClasses['bg-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_132 = __VLS_130.slots.default;
    {
        var __VLS_133 = __VLS_130.slots.avatar;
        var __VLS_134 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({
            name: "warning",
        }));
        var __VLS_136 = __VLS_135.apply(void 0, __spreadArray([{
                name: "warning",
            }], __VLS_functionalComponentArgsRest(__VLS_135), false));
        // @ts-ignore
        [isCalculating, isResultsStale, calculationProgress, calculationProgress, calculationErrors,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    for (var _h = 0, _j = __VLS_vFor((__VLS_ctx.calculationErrors)); _h < _j.length; _h++) {
        var err = _j[_h][0];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (err.style_id) }, { class: "text-caption" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        (err.style_code);
        (err.error);
        // @ts-ignore
        [calculationErrors,];
    }
    // @ts-ignore
    [];
    var __VLS_130;
}
if (__VLS_ctx.calculationWarnings.length > 0) {
    var __VLS_139 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_140 = __VLS_asFunctionalComponent1(__VLS_139, new __VLS_139(__assign({ rounded: true }, { class: "bg-amber-1 q-mb-md" })));
    var __VLS_141 = __VLS_140.apply(void 0, __spreadArray([__assign({ rounded: true }, { class: "bg-amber-1 q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_140), false));
    /** @type {__VLS_StyleScopedClasses['bg-amber-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_144 = __VLS_142.slots.default;
    {
        var __VLS_145 = __VLS_142.slots.avatar;
        var __VLS_146 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_147 = __VLS_asFunctionalComponent1(__VLS_146, new __VLS_146({
            name: "warning",
            color: "warning",
        }));
        var __VLS_148 = __VLS_147.apply(void 0, __spreadArray([{
                name: "warning",
                color: "warning",
            }], __VLS_functionalComponentArgsRest(__VLS_147), false));
        // @ts-ignore
        [calculationWarnings,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-xs text-warning" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)(__assign({ class: "q-ma-none q-pl-md" }));
    /** @type {__VLS_StyleScopedClasses['q-ma-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pl-md']} */ ;
    for (var _k = 0, _l = __VLS_vFor((__VLS_ctx.calculationWarnings)); _k < _l.length; _k++) {
        var _m = _l[_k], w = _m[0], i = _m[1];
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)(__assign({ key: (i) }, { class: "text-body2" }));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        (w);
        // @ts-ignore
        [calculationWarnings,];
    }
    // @ts-ignore
    [];
    var __VLS_142;
}
if (__VLS_ctx.hasResults) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mr-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mr-md']} */ ;
    var __VLS_151 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.ButtonToggle} */
    ButtonToggle;
    // @ts-ignore
    var __VLS_152 = __VLS_asFunctionalComponent1(__VLS_151, new __VLS_151({
        modelValue: (__VLS_ctx.resultView),
        options: ([
            { label: 'Chi tiết', value: 'detail' },
            { label: 'Tổng hợp', value: 'summary' }
        ]),
        color: "grey-4",
        toggleColor: "primary",
        dense: true,
    }));
    var __VLS_153 = __VLS_152.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.resultView),
            options: ([
                { label: 'Chi tiết', value: 'detail' },
                { label: 'Tổng hợp', value: 'summary' }
            ]),
            color: "grey-4",
            toggleColor: "primary",
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_152), false));
    if (__VLS_ctx.resultView === 'detail') {
        var __VLS_156 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.ResultsDetailView} */
        ResultsDetailView;
        // @ts-ignore
        var __VLS_157 = __VLS_asFunctionalComponent1(__VLS_156, new __VLS_156(__assign(__assign({ 'onUpdate:deliveryDate': {} }, { 'onReorder': {} }), { results: (__VLS_ctx.perStyleResults), orderEntries: (__VLS_ctx.orderEntries), isSaved: (__VLS_ctx.resultsSaved), isReordering: (__VLS_ctx.isReordering) })));
        var __VLS_158 = __VLS_157.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:deliveryDate': {} }, { 'onReorder': {} }), { results: (__VLS_ctx.perStyleResults), orderEntries: (__VLS_ctx.orderEntries), isSaved: (__VLS_ctx.resultsSaved), isReordering: (__VLS_ctx.isReordering) })], __VLS_functionalComponentArgsRest(__VLS_157), false));
        var __VLS_161 = void 0;
        var __VLS_162 = ({ 'update:deliveryDate': {} },
            { 'onUpdate:deliveryDate': (__VLS_ctx.handleUpdateDeliveryDate) });
        var __VLS_163 = ({ reorder: {} },
            { onReorder: (__VLS_ctx.handleReorder) });
        var __VLS_159;
        var __VLS_160;
    }
    if (__VLS_ctx.resultView === 'summary') {
        var __VLS_164 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.ResultsSummaryTable} */
        ResultsSummaryTable;
        // @ts-ignore
        var __VLS_165 = __VLS_asFunctionalComponent1(__VLS_164, new __VLS_164(__assign(__assign({ 'onUpdate:additionalOrder': {} }, { 'onUpdate:quotaCones': {} }), { rows: (__VLS_ctx.aggregatedResults) })));
        var __VLS_166 = __VLS_165.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:additionalOrder': {} }, { 'onUpdate:quotaCones': {} }), { rows: (__VLS_ctx.aggregatedResults) })], __VLS_functionalComponentArgsRest(__VLS_165), false));
        var __VLS_169 = void 0;
        var __VLS_170 = ({ 'update:additionalOrder': {} },
            { 'onUpdate:additionalOrder': (__VLS_ctx.handleUpdateAdditionalOrder) });
        var __VLS_171 = ({ 'update:quotaCones': {} },
            { 'onUpdate:quotaCones': (__VLS_ctx.handleUpdateQuotaCones) });
        var __VLS_167;
        var __VLS_168;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-sm q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    var __VLS_172 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_173 = __VLS_asFunctionalComponent1(__VLS_172, new __VLS_172(__assign({ 'onClick': {} }, { color: "primary", icon: "save", label: "Lưu Đơn Hàng", loading: (__VLS_ctx.weekLoading), disable: (!__VLS_ctx.hasResults) })));
    var __VLS_174 = __VLS_173.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "save", label: "Lưu Đơn Hàng", loading: (__VLS_ctx.weekLoading), disable: (!__VLS_ctx.hasResults) })], __VLS_functionalComponentArgsRest(__VLS_173), false));
    var __VLS_177 = void 0;
    var __VLS_178 = ({ click: {} },
        { onClick: (__VLS_ctx.handleSave) });
    var __VLS_175;
    var __VLS_176;
    var __VLS_179 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton | typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_180 = __VLS_asFunctionalComponent1(__VLS_179, new __VLS_179(__assign({ 'onClick': {} }, { color: "positive", icon: "check_circle", label: "Xác Nhận Đặt Hàng", disable: (!__VLS_ctx.hasResults || ((_a = __VLS_ctx.selectedWeek) === null || _a === void 0 ? void 0 : _a.status) === __VLS_ctx.OrderWeekStatus.CONFIRMED), loading: (__VLS_ctx.confirmingWeek) })));
    var __VLS_181 = __VLS_180.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "positive", icon: "check_circle", label: "Xác Nhận Đặt Hàng", disable: (!__VLS_ctx.hasResults || ((_b = __VLS_ctx.selectedWeek) === null || _b === void 0 ? void 0 : _b.status) === __VLS_ctx.OrderWeekStatus.CONFIRMED), loading: (__VLS_ctx.confirmingWeek) })], __VLS_functionalComponentArgsRest(__VLS_180), false));
    var __VLS_184 = void 0;
    var __VLS_185 = ({ click: {} },
        { onClick: (__VLS_ctx.handleConfirmWeek) });
    var __VLS_186 = __VLS_182.slots.default;
    if (((_c = __VLS_ctx.selectedWeek) === null || _c === void 0 ? void 0 : _c.status) === __VLS_ctx.OrderWeekStatus.CONFIRMED) {
        var __VLS_187 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.AppTooltip | typeof __VLS_components.AppTooltip} */
        AppTooltip;
        // @ts-ignore
        var __VLS_188 = __VLS_asFunctionalComponent1(__VLS_187, new __VLS_187({}));
        var __VLS_189 = __VLS_188.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_188), false));
        var __VLS_192 = __VLS_190.slots.default;
        // @ts-ignore
        [orderEntries, hasResults, hasResults, hasResults, resultView, resultView, resultView, perStyleResults, resultsSaved, isReordering, handleUpdateDeliveryDate, handleReorder, aggregatedResults, handleUpdateAdditionalOrder, handleUpdateQuotaCones, weekLoading, handleSave, selectedWeek, selectedWeek, enums_1.OrderWeekStatus, enums_1.OrderWeekStatus, confirmingWeek, handleConfirmWeek,];
        var __VLS_190;
    }
    // @ts-ignore
    [];
    var __VLS_182;
    var __VLS_183;
    var __VLS_193 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_194 = __VLS_asFunctionalComponent1(__VLS_193, new __VLS_193(__assign({ 'onClick': {} }, { flat: true, icon: "file_download", label: "Xuất Excel" })));
    var __VLS_195 = __VLS_194.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, icon: "file_download", label: "Xuất Excel" })], __VLS_functionalComponentArgsRest(__VLS_194), false));
    var __VLS_198 = void 0;
    var __VLS_199 = ({ click: {} },
        { onClick: (__VLS_ctx.handleExport) });
    var __VLS_196;
    var __VLS_197;
}
var __VLS_200;
/** @ts-ignore @type {typeof __VLS_components.WeekHistoryDialog} */
WeekHistoryDialog;
// @ts-ignore
var __VLS_201 = __VLS_asFunctionalComponent1(__VLS_200, new __VLS_200(__assign({ 'onLoad': {} }, { modelValue: (__VLS_ctx.showHistory), weeks: (__VLS_ctx.weeks), loading: (__VLS_ctx.weekLoading) })));
var __VLS_202 = __VLS_201.apply(void 0, __spreadArray([__assign({ 'onLoad': {} }, { modelValue: (__VLS_ctx.showHistory), weeks: (__VLS_ctx.weeks), loading: (__VLS_ctx.weekLoading) })], __VLS_functionalComponentArgsRest(__VLS_201), false));
var __VLS_205;
var __VLS_206 = ({ load: {} },
    { onLoad: (__VLS_ctx.handleLoadWeek) });
var __VLS_203;
var __VLS_204;
var __VLS_207 = AssignmentControlDialog_vue_1.default;
// @ts-ignore
var __VLS_208 = __VLS_asFunctionalComponent1(__VLS_207, new __VLS_207({
    modelValue: (__VLS_ctx.showAssignmentControl),
}));
var __VLS_209 = __VLS_208.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showAssignmentControl),
    }], __VLS_functionalComponentArgsRest(__VLS_208), false));
// @ts-ignore
[showAssignmentControl, showHistory, weekLoading, handleExport, weeks, handleLoadWeek,];
var __VLS_3;
// @ts-ignore
var __VLS_39 = __VLS_38;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
