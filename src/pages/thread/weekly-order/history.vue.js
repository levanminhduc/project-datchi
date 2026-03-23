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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var quasar_1 = require("quasar");
var composables_1 = require("@/composables");
var weeklyOrderService_1 = require("@/services/weeklyOrderService");
var deliveryService_1 = require("@/services/deliveryService");
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var ThreadSummaryTable_vue_1 = require("@/components/thread/weekly-order/ThreadSummaryTable.vue");
var utils_1 = require("@/utils");
definePage({
    meta: {
        requiresAuth: true,
        permissions: ["thread.view"],
    },
});
var $q = (0, quasar_1.useQuasar)();
var snackbar = (0, composables_1.useSnackbar)();
var _c = (0, composables_1.usePurchaseOrders)(), poList = _c.purchaseOrders, posLoading = _c.isLoading, fetchAllPurchaseOrders = _c.fetchAllPurchaseOrders;
var _d = (0, composables_1.useStyles)(), styleList = _d.styles, stylesLoading = _d.isLoading, fetchStyles = _d.fetchStyles;
var weekGroups = (0, vue_1.ref)([]);
var loading = (0, vue_1.ref)(false);
var currentPage = (0, vue_1.ref)(1);
var totalPages = (0, vue_1.ref)(0);
var totalItems = (0, vue_1.ref)(0);
var expandedWeekId = (0, vue_1.ref)(null);
var threadSummary = (0, vue_1.ref)([]);
var threadSummaryLoading = (0, vue_1.ref)(false);
var filters = (0, vue_1.ref)({
    po_id: undefined,
    style_id: undefined,
    from_date: undefined,
    to_date: undefined,
    status: undefined,
    created_by: undefined,
});
var statusOptions = [
    { label: "Tất cả (trừ đã hủy)", value: undefined },
    { label: "Nháp", value: "DRAFT" },
    { label: "Đã xác nhận", value: "CONFIRMED" },
    { label: "Đã hủy", value: "CANCELLED" },
    { label: "Tất cả", value: "ALL" },
];
var poOptions = (0, vue_1.computed)(function () {
    return poList.value.map(function (po) { return ({
        label: "".concat(po.po_number).concat(po.customer_name ? " - ".concat(po.customer_name) : ""),
        value: po.id,
    }); });
});
var styleOptions = (0, vue_1.computed)(function () {
    return styleList.value.map(function (s) { return ({
        label: "".concat(s.style_code, " - ").concat(s.style_name),
        value: s.id,
    }); });
});
function formatDate(dateStr) {
    if (!dateStr)
        return "-";
    var d = new Date(dateStr);
    return "".concat(String(d.getDate()).padStart(2, "0"), "/").concat(String(d.getMonth() + 1).padStart(2, "0"), "/").concat(d.getFullYear());
}
function getStatusColor(status) {
    switch (status) {
        case "CONFIRMED":
            return "positive";
        case "CANCELLED":
            return "negative";
        default:
            return "grey";
    }
}
function getStatusLabel(status) {
    switch (status) {
        case "DRAFT":
            return "Nháp";
        case "CONFIRMED":
            return "Đã xác nhận";
        case "CANCELLED":
            return "Đã hủy";
        default:
            return status || "-";
    }
}
function getProgressColor(pct) {
    if (pct > 100)
        return "negative";
    if (pct === 100)
        return "positive";
    if (pct >= 80)
        return "warning";
    return "primary";
}
function loadThreadSummary(weekId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, resultsData, deliveries, pendingByType_1, _b;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (expandedWeekId.value === weekId && threadSummary.value.length > 0)
                        return [2 /*return*/];
                    expandedWeekId.value = weekId;
                    threadSummaryLoading.value = true;
                    threadSummary.value = [];
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all([
                            weeklyOrderService_1.weeklyOrderService.getResults(weekId),
                            deliveryService_1.deliveryService.getByWeek(weekId),
                        ])];
                case 2:
                    _a = _d.sent(), resultsData = _a[0], deliveries = _a[1];
                    if (!((_c = resultsData === null || resultsData === void 0 ? void 0 : resultsData.summary_data) === null || _c === void 0 ? void 0 : _c.length)) {
                        threadSummary.value = [];
                        return [2 /*return*/];
                    }
                    if (expandedWeekId.value !== weekId)
                        return [2 /*return*/];
                    pendingByType_1 = new Map();
                    deliveries
                        .filter(function (d) { return d.status === 'PENDING'; })
                        .forEach(function (d) {
                        var current = pendingByType_1.get(d.thread_type_id) || 0;
                        pendingByType_1.set(d.thread_type_id, current + (d.quantity_cones || 0));
                    });
                    threadSummary.value = resultsData.summary_data.map(function (row) {
                        var pending = pendingByType_1.get(row.thread_type_id) || 0;
                        var available = row.equivalent_cones || 0;
                        var totalCones = row.total_cones || 0;
                        return {
                            thread_type_id: row.thread_type_id,
                            thread_type_name: row.thread_type_name,
                            supplier_name: row.supplier_name,
                            tex_number: row.tex_number,
                            thread_color: row.thread_color || null,
                            total_cones: totalCones,
                            equivalent_cones: available,
                            pending_cones: pending,
                            shortage: Math.max(0, totalCones - available - pending),
                        };
                    });
                    return [3 /*break*/, 5];
                case 3:
                    _b = _d.sent();
                    snackbar.error('Không thể tải chi tiết loại chỉ');
                    return [3 /*break*/, 5];
                case 4:
                    threadSummaryLoading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function fetchHistory() {
    return __awaiter(this, void 0, void 0, function () {
        var result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    loading.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getHistoryByWeek(__assign(__assign({}, filters.value), { page: currentPage.value, limit: 10 }))];
                case 2:
                    result = _a.sent();
                    weekGroups.value = result.data;
                    totalPages.value = result.pagination.totalPages;
                    totalItems.value = result.pagination.total;
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error("[history-by-week] fetch error:", err_1);
                    snackbar.error("Không thể tải lịch sử đặt hàng");
                    return [3 /*break*/, 5];
                case 4:
                    loading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function onPageChange(page) {
    currentPage.value = page;
    fetchHistory();
}
var debounceTimer = null;
(0, vue_1.watch)(filters, function () {
    if (debounceTimer)
        clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
        currentPage.value = 1;
        fetchHistory();
    }, 250);
}, { deep: true });
function resetFilters() {
    filters.value = {
        po_id: undefined,
        style_id: undefined,
        from_date: undefined,
        to_date: undefined,
        status: undefined,
        created_by: undefined,
    };
}
function handleExportXlsx() {
    return __awaiter(this, void 0, void 0, function () {
        var ExcelJS, workbook, worksheet_1, buffer, blob, link, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (weekGroups.value.length === 0)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require("exceljs"); })];
                case 2:
                    ExcelJS = _a.sent();
                    workbook = new ExcelJS.Workbook();
                    worksheet_1 = workbook.addWorksheet("Lịch Sử Đặt Hàng");
                    worksheet_1.columns = [
                        { header: "Tuần", key: "week_name", width: 20 },
                        { header: "PO", key: "po_number", width: 18 },
                        { header: "Mã hàng", key: "style_code", width: 15 },
                        { header: "Tên mã hàng", key: "style_name", width: 25 },
                        { header: "Màu", key: "color_name", width: 15 },
                        { header: "SL (SP)", key: "quantity", width: 12 },
                        { header: "SL PO", key: "po_quantity", width: 12 },
                        { header: "Đã đặt", key: "total_ordered", width: 12 },
                        { header: "Còn lại", key: "remaining", width: 12 },
                        { header: "Tiến độ %", key: "progress_pct", width: 12 },
                        { header: "Người tạo", key: "created_by", width: 18 },
                        { header: "Ngày tạo", key: "created_at", width: 15 },
                        { header: "Trạng thái", key: "status", width: 15 },
                    ];
                    worksheet_1.getRow(1).fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FF1976D2" },
                    };
                    worksheet_1.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
                    weekGroups.value.forEach(function (week) {
                        week.po_groups.forEach(function (poGroup) {
                            poGroup.styles.forEach(function (style) {
                                style.colors.forEach(function (color) {
                                    worksheet_1.addRow({
                                        week_name: week.week_name,
                                        po_number: poGroup.po_number,
                                        style_code: style.style_code,
                                        style_name: style.style_name,
                                        color_name: color.color_name,
                                        quantity: color.quantity,
                                        po_quantity: style.po_quantity,
                                        total_ordered: style.total_ordered,
                                        remaining: style.remaining,
                                        progress_pct: style.progress_pct,
                                        created_by: week.created_by || "",
                                        created_at: formatDate(week.created_at),
                                        status: getStatusLabel(week.status),
                                    });
                                });
                            });
                        });
                    });
                    return [4 /*yield*/, workbook.xlsx.writeBuffer()];
                case 3:
                    buffer = _a.sent();
                    blob = new Blob([buffer], {
                        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });
                    link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = "lich-su-dat-hang-chi-".concat(new Date().toISOString().slice(0, 10), ".xlsx");
                    link.click();
                    URL.revokeObjectURL(link.href);
                    snackbar.success("Đã xuất file Excel");
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _a.sent();
                    console.error("[history-by-week] export error:", err_2);
                    snackbar.error("Không thể xuất file Excel");
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([fetchAllPurchaseOrders(), fetchStyles(), fetchHistory()])];
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ 'onClick': {} }, { flat: true, round: true, icon: "arrow_back", color: "primary" })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, icon: "arrow_back", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
var __VLS_13 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$router.push('/thread/weekly-order');
            // @ts-ignore
            [$router,];
        } });
var __VLS_10;
var __VLS_11;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-ml-md" }));
/** @type {__VLS_StyleScopedClasses['q-ml-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h5 q-my-none text-weight-bold" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6" }));
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
var __VLS_14;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_15), false));
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ 'onClick': {} }, { color: "primary", label: "Xuất Excel", icon: "download", disable: (__VLS_ctx.weekGroups.length === 0) })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Xuất Excel", icon: "download", disable: (__VLS_ctx.weekGroups.length === 0) })], __VLS_functionalComponentArgsRest(__VLS_20), false));
var __VLS_24;
var __VLS_25 = ({ click: {} },
    { onClick: (__VLS_ctx.handleExportXlsx) });
var __VLS_22;
var __VLS_23;
var __VLS_26;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26(__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })], __VLS_functionalComponentArgsRest(__VLS_27), false));
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_31 = __VLS_29.slots.default;
var __VLS_32;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({}));
var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_33), false));
var __VLS_37 = __VLS_35.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-end" }, { class: (__VLS_ctx.$q.screen.lt.sm ? 'q-col-gutter-sm' : 'q-col-gutter-md') }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_38;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
    modelValue: (__VLS_ctx.filters.po_id),
    options: (__VLS_ctx.poOptions),
    label: "PO",
    clearable: true,
    dense: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
    hideBottomSpace: true,
    emitValue: true,
    mapOptions: true,
    loading: (__VLS_ctx.posLoading),
}));
var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.po_id),
        options: (__VLS_ctx.poOptions),
        label: "PO",
        clearable: true,
        dense: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        hideBottomSpace: true,
        emitValue: true,
        mapOptions: true,
        loading: (__VLS_ctx.posLoading),
    }], __VLS_functionalComponentArgsRest(__VLS_39), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_43;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
    modelValue: (__VLS_ctx.filters.style_id),
    options: (__VLS_ctx.styleOptions),
    label: "Mã hàng",
    clearable: true,
    dense: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
    hideBottomSpace: true,
    emitValue: true,
    mapOptions: true,
    loading: (__VLS_ctx.stylesLoading),
}));
var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.style_id),
        options: (__VLS_ctx.styleOptions),
        label: "Mã hàng",
        clearable: true,
        dense: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        hideBottomSpace: true,
        emitValue: true,
        mapOptions: true,
        loading: (__VLS_ctx.stylesLoading),
    }], __VLS_functionalComponentArgsRest(__VLS_44), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_48;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
    modelValue: (__VLS_ctx.filters.status),
    options: (__VLS_ctx.statusOptions),
    label: "Trạng thái",
    dense: true,
    hideBottomSpace: true,
    emitValue: true,
    mapOptions: true,
}));
var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.status),
        options: (__VLS_ctx.statusOptions),
        label: "Trạng thái",
        dense: true,
        hideBottomSpace: true,
        emitValue: true,
        mapOptions: true,
    }], __VLS_functionalComponentArgsRest(__VLS_49), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_53;
/** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
    modelValue: (__VLS_ctx.filters.from_date),
    label: "Từ ngày",
    placeholder: "DD/MM/YYYY",
    rules: ([__VLS_ctx.dateRules.date]),
    dense: true,
    clearable: true,
    hideBottomSpace: true,
}));
var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.from_date),
        label: "Từ ngày",
        placeholder: "DD/MM/YYYY",
        rules: ([__VLS_ctx.dateRules.date]),
        dense: true,
        clearable: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_54), false));
var __VLS_58 = __VLS_56.slots.default;
{
    var __VLS_59 = __VLS_56.slots.append;
    var __VLS_60 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_61), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_65 = __VLS_63.slots.default;
    var __VLS_66 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_68 = __VLS_67.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_67), false));
    var __VLS_71 = __VLS_69.slots.default;
    var __VLS_72 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
        modelValue: (__VLS_ctx.filters.from_date),
    }));
    var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.filters.from_date),
        }], __VLS_functionalComponentArgsRest(__VLS_73), false));
    // @ts-ignore
    [weekGroups, handleExportXlsx, $q, filters, filters, filters, filters, filters, poOptions, posLoading, styleOptions, stylesLoading, statusOptions, utils_1.dateRules,];
    var __VLS_69;
    // @ts-ignore
    [];
    var __VLS_63;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_56;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_77;
/** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({
    modelValue: (__VLS_ctx.filters.to_date),
    label: "Đến ngày",
    placeholder: "DD/MM/YYYY",
    rules: ([__VLS_ctx.dateRules.date]),
    dense: true,
    clearable: true,
    hideBottomSpace: true,
}));
var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.to_date),
        label: "Đến ngày",
        placeholder: "DD/MM/YYYY",
        rules: ([__VLS_ctx.dateRules.date]),
        dense: true,
        clearable: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_78), false));
var __VLS_82 = __VLS_80.slots.default;
{
    var __VLS_83 = __VLS_80.slots.append;
    var __VLS_84 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_85), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_89 = __VLS_87.slots.default;
    var __VLS_90 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_92 = __VLS_91.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_91), false));
    var __VLS_95 = __VLS_93.slots.default;
    var __VLS_96 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
        modelValue: (__VLS_ctx.filters.to_date),
    }));
    var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.filters.to_date),
        }], __VLS_functionalComponentArgsRest(__VLS_97), false));
    // @ts-ignore
    [filters, filters, utils_1.dateRules,];
    var __VLS_93;
    // @ts-ignore
    [];
    var __VLS_87;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_80;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_101;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_102 = __VLS_asFunctionalComponent1(__VLS_101, new __VLS_101({
    modelValue: (__VLS_ctx.filters.created_by),
    label: "Người tạo",
    dense: true,
    clearable: true,
    hideBottomSpace: true,
}));
var __VLS_103 = __VLS_102.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.created_by),
        label: "Người tạo",
        dense: true,
        clearable: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_102), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_106;
/** @ts-ignore @type {typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106(__assign({ 'onClick': {} }, { flat: true, color: "grey", label: "Xóa bộ lọc", icon: "filter_alt_off" })));
var __VLS_108 = __VLS_107.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, color: "grey", label: "Xóa bộ lọc", icon: "filter_alt_off" })], __VLS_functionalComponentArgsRest(__VLS_107), false));
var __VLS_111;
var __VLS_112 = ({ click: {} },
    { onClick: (__VLS_ctx.resetFilters) });
var __VLS_109;
var __VLS_110;
// @ts-ignore
[filters, resetFilters,];
var __VLS_35;
// @ts-ignore
[];
var __VLS_29;
var __VLS_113;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_114 = __VLS_asFunctionalComponent1(__VLS_113, new __VLS_113({
    flat: true,
    bordered: true,
}));
var __VLS_115 = __VLS_114.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_114), false));
var __VLS_118 = __VLS_116.slots.default;
var __VLS_119;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({
    showing: (__VLS_ctx.loading),
}));
var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.loading),
    }], __VLS_functionalComponentArgsRest(__VLS_120), false));
if (!__VLS_ctx.loading && __VLS_ctx.weekGroups.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-py-xl text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    var __VLS_124 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124({
        name: "history",
        size: "48px",
    }));
    var __VLS_126 = __VLS_125.apply(void 0, __spreadArray([{
            name: "history",
            size: "48px",
        }], __VLS_functionalComponentArgsRest(__VLS_125), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
}
else {
    var __VLS_129 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129({
        separator: true,
    }));
    var __VLS_131 = __VLS_130.apply(void 0, __spreadArray([{
            separator: true,
        }], __VLS_functionalComponentArgsRest(__VLS_130), false));
    var __VLS_134 = __VLS_132.slots.default;
    var _loop_1 = function (week) {
        var __VLS_135 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qExpansionItem | typeof __VLS_components.QExpansionItem | typeof __VLS_components.qExpansionItem | typeof __VLS_components.QExpansionItem} */
        qExpansionItem;
        // @ts-ignore
        var __VLS_136 = __VLS_asFunctionalComponent1(__VLS_135, new __VLS_135(__assign({ 'onShow': {} }, { key: (week.week_id), group: "weeks", headerClass: "text-weight-medium" })));
        var __VLS_137 = __VLS_136.apply(void 0, __spreadArray([__assign({ 'onShow': {} }, { key: (week.week_id), group: "weeks", headerClass: "text-weight-medium" })], __VLS_functionalComponentArgsRest(__VLS_136), false));
        var __VLS_140 = void 0;
        var __VLS_141 = ({ show: {} },
            { onShow: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(!__VLS_ctx.loading && __VLS_ctx.weekGroups.length === 0))
                        return;
                    __VLS_ctx.loadThreadSummary(week.week_id);
                    // @ts-ignore
                    [weekGroups, weekGroups, loading, loading, loadThreadSummary,];
                } });
        var __VLS_142 = __VLS_138.slots.default;
        {
            var __VLS_143 = __VLS_138.slots.header;
            var __VLS_144 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_145 = __VLS_asFunctionalComponent1(__VLS_144, new __VLS_144({}));
            var __VLS_146 = __VLS_145.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_145), false));
            var __VLS_149 = __VLS_147.slots.default;
            var __VLS_150 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
            qItemLabel;
            // @ts-ignore
            var __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({}));
            var __VLS_152 = __VLS_151.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_151), false));
            var __VLS_155 = __VLS_153.slots.default;
            (week.week_name);
            // @ts-ignore
            [];
            var __VLS_156 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
            qItemLabel;
            // @ts-ignore
            var __VLS_157 = __VLS_asFunctionalComponent1(__VLS_156, new __VLS_156({
                caption: true,
            }));
            var __VLS_158 = __VLS_157.apply(void 0, __spreadArray([{
                    caption: true,
                }], __VLS_functionalComponentArgsRest(__VLS_157), false));
            var __VLS_161 = __VLS_159.slots.default;
            (week.created_by || "-");
            (__VLS_ctx.formatDate(week.created_at));
            // @ts-ignore
            [formatDate,];
            // @ts-ignore
            [];
            var __VLS_162 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_163 = __VLS_asFunctionalComponent1(__VLS_162, new __VLS_162({
                side: true,
            }));
            var __VLS_164 = __VLS_163.apply(void 0, __spreadArray([{
                    side: true,
                }], __VLS_functionalComponentArgsRest(__VLS_163), false));
            var __VLS_167 = __VLS_165.slots.default;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
            var __VLS_168 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
            qChip;
            // @ts-ignore
            var __VLS_169 = __VLS_asFunctionalComponent1(__VLS_168, new __VLS_168({
                color: (__VLS_ctx.getStatusColor(week.status)),
                textColor: "white",
                dense: true,
                size: "sm",
            }));
            var __VLS_170 = __VLS_169.apply(void 0, __spreadArray([{
                    color: (__VLS_ctx.getStatusColor(week.status)),
                    textColor: "white",
                    dense: true,
                    size: "sm",
                }], __VLS_functionalComponentArgsRest(__VLS_169), false));
            var __VLS_173 = __VLS_171.slots.default;
            (__VLS_ctx.getStatusLabel(week.status));
            // @ts-ignore
            [getStatusColor, getStatusLabel,];
            var __VLS_174 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
            qChip;
            // @ts-ignore
            var __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174({
                color: "primary",
                textColor: "white",
                dense: true,
            }));
            var __VLS_176 = __VLS_175.apply(void 0, __spreadArray([{
                    color: "primary",
                    textColor: "white",
                    dense: true,
                }], __VLS_functionalComponentArgsRest(__VLS_175), false));
            var __VLS_179 = __VLS_177.slots.default;
            (week.total_quantity.toLocaleString("vi-VN"));
            // @ts-ignore
            [];
            // @ts-ignore
            [];
            // @ts-ignore
            [];
        }
        var __VLS_180 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
        qCard;
        // @ts-ignore
        var __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180({}));
        var __VLS_182 = __VLS_181.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_181), false));
        var __VLS_185 = __VLS_183.slots.default;
        for (var _f = 0, _g = __VLS_vFor((week.po_groups)); _f < _g.length; _f++) {
            var poGroup = _g[_f][0];
            var __VLS_186 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
            qCardSection;
            // @ts-ignore
            var __VLS_187 = __VLS_asFunctionalComponent1(__VLS_186, new __VLS_186(__assign({ key: ((_a = poGroup.po_id) !== null && _a !== void 0 ? _a : 'no-po') }, { class: "q-pt-sm" })));
            var __VLS_188 = __VLS_187.apply(void 0, __spreadArray([__assign({ key: ((_b = poGroup.po_id) !== null && _b !== void 0 ? _b : 'no-po') }, { class: "q-pt-sm" })], __VLS_functionalComponentArgsRest(__VLS_187), false));
            /** @type {__VLS_StyleScopedClasses['q-pt-sm']} */ ;
            var __VLS_191 = __VLS_189.slots.default;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-primary q-mb-sm" }));
            /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
            (poGroup.po_number);
            for (var _h = 0, _j = __VLS_vFor((poGroup.styles)); _h < _j.length; _h++) {
                var style = _j[_h][0];
                var __VLS_192 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
                qCard;
                // @ts-ignore
                var __VLS_193 = __VLS_asFunctionalComponent1(__VLS_192, new __VLS_192(__assign({ key: (style.style_id), flat: true, bordered: true }, { class: "q-mb-sm q-ml-md" })));
                var __VLS_194 = __VLS_193.apply(void 0, __spreadArray([__assign({ key: (style.style_id), flat: true, bordered: true }, { class: "q-mb-sm q-ml-md" })], __VLS_functionalComponentArgsRest(__VLS_193), false));
                /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['q-ml-md']} */ ;
                var __VLS_197 = __VLS_195.slots.default;
                var __VLS_198 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
                qCardSection;
                // @ts-ignore
                var __VLS_199 = __VLS_asFunctionalComponent1(__VLS_198, new __VLS_198(__assign({ class: "q-py-sm" })));
                var __VLS_200 = __VLS_199.apply(void 0, __spreadArray([__assign({ class: "q-py-sm" })], __VLS_functionalComponentArgsRest(__VLS_199), false));
                /** @type {__VLS_StyleScopedClasses['q-py-sm']} */ ;
                var __VLS_203 = __VLS_201.slots.default;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-xs" }));
                /** @type {__VLS_StyleScopedClasses['row']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
                /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
                (style.style_code);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-7 q-ml-sm" }));
                /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
                /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
                (style.style_name);
                var __VLS_204 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
                qSpace;
                // @ts-ignore
                var __VLS_205 = __VLS_asFunctionalComponent1(__VLS_204, new __VLS_204({}));
                var __VLS_206 = __VLS_205.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_205), false));
                if (style.po_quantity > 0) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption" }));
                    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
                    (style.po_quantity.toLocaleString("vi-VN"));
                }
                if (style.po_quantity > 0) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mb-sm" }));
                    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
                    var __VLS_209 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress | typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress} */
                    qLinearProgress;
                    // @ts-ignore
                    var __VLS_210 = __VLS_asFunctionalComponent1(__VLS_209, new __VLS_209(__assign({ value: (Math.min(style.progress_pct / 100, 1)), color: (__VLS_ctx.getProgressColor(style.progress_pct)), size: "20px", rounded: true }, { class: "q-mb-xs" })));
                    var __VLS_211 = __VLS_210.apply(void 0, __spreadArray([__assign({ value: (Math.min(style.progress_pct / 100, 1)), color: (__VLS_ctx.getProgressColor(style.progress_pct)), size: "20px", rounded: true }, { class: "q-mb-xs" })], __VLS_functionalComponentArgsRest(__VLS_210), false));
                    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
                    var __VLS_214 = __VLS_212.slots.default;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "absolute-full flex flex-center" }));
                    /** @type {__VLS_StyleScopedClasses['absolute-full']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                    /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-white text-weight-bold" }));
                    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
                    (style.total_ordered.toLocaleString("vi-VN"));
                    (style.po_quantity.toLocaleString("vi-VN"));
                    (style.progress_pct);
                    // @ts-ignore
                    [getProgressColor,];
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-sm q-mb-xs" }));
                /** @type {__VLS_StyleScopedClasses['row']} */ ;
                /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
                /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
                for (var _k = 0, _l = __VLS_vFor((style.colors)); _k < _l.length; _k++) {
                    var color = _l[_k][0];
                    var __VLS_215 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
                    qChip;
                    // @ts-ignore
                    var __VLS_216 = __VLS_asFunctionalComponent1(__VLS_215, new __VLS_215({
                        key: (color.color_id),
                        dense: true,
                        size: "sm",
                        outline: true,
                    }));
                    var __VLS_217 = __VLS_216.apply(void 0, __spreadArray([{
                            key: (color.color_id),
                            dense: true,
                            size: "sm",
                            outline: true,
                        }], __VLS_functionalComponentArgsRest(__VLS_216), false));
                    var __VLS_220 = __VLS_218.slots.default;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span)(__assign({ class: "q-mr-xs" }, { style: ({
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: color.hex_code || '#999',
                            border: '1px solid #ccc',
                        }) }));
                    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
                    (color.color_name);
                    (color.quantity.toLocaleString("vi-VN"));
                    // @ts-ignore
                    [];
                    // @ts-ignore
                    [];
                }
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
                /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
                (style.this_week_quantity.toLocaleString("vi-VN"));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-mx-sm" }));
                /** @type {__VLS_StyleScopedClasses['q-mx-sm']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
                ((style.total_ordered - style.this_week_quantity).toLocaleString("vi-VN"));
                if (style.po_quantity > 0) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-mx-sm" }));
                    /** @type {__VLS_StyleScopedClasses['q-mx-sm']} */ ;
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                    __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
                    (style.remaining.toLocaleString("vi-VN"));
                }
                // @ts-ignore
                [];
                // @ts-ignore
                [];
                // @ts-ignore
                [];
            }
            // @ts-ignore
            [];
            // @ts-ignore
            [];
        }
        if (__VLS_ctx.expandedWeekId === week.week_id) {
            var __VLS_221 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
            qCardSection;
            // @ts-ignore
            var __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221({}));
            var __VLS_223 = __VLS_222.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_222), false));
            var __VLS_226 = __VLS_224.slots.default;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm" }));
            /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
            var __VLS_227 = ThreadSummaryTable_vue_1.default;
            // @ts-ignore
            var __VLS_228 = __VLS_asFunctionalComponent1(__VLS_227, new __VLS_227({
                rows: (__VLS_ctx.threadSummary),
                loading: (__VLS_ctx.threadSummaryLoading),
            }));
            var __VLS_229 = __VLS_228.apply(void 0, __spreadArray([{
                    rows: (__VLS_ctx.threadSummary),
                    loading: (__VLS_ctx.threadSummaryLoading),
                }], __VLS_functionalComponentArgsRest(__VLS_228), false));
            // @ts-ignore
            [expandedWeekId, threadSummary, threadSummaryLoading,];
        }
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_153, __VLS_159, __VLS_147, __VLS_171, __VLS_177, __VLS_165, __VLS_212, __VLS_218, __VLS_201, __VLS_195, __VLS_189, __VLS_224, __VLS_183, __VLS_138, __VLS_139;
    for (var _i = 0, _e = __VLS_vFor((__VLS_ctx.weekGroups)); _i < _e.length; _i++) {
        var week = _e[_i][0];
        _loop_1(week);
    }
    // @ts-ignore
    [];
    var __VLS_132;
}
if (__VLS_ctx.totalPages > 1) {
    var __VLS_232 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_233 = __VLS_asFunctionalComponent1(__VLS_232, new __VLS_232(__assign({ class: "flex flex-center" })));
    var __VLS_234 = __VLS_233.apply(void 0, __spreadArray([__assign({ class: "flex flex-center" })], __VLS_functionalComponentArgsRest(__VLS_233), false));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
    var __VLS_237 = __VLS_235.slots.default;
    var __VLS_238 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPagination | typeof __VLS_components.QPagination} */
    qPagination;
    // @ts-ignore
    var __VLS_239 = __VLS_asFunctionalComponent1(__VLS_238, new __VLS_238(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.currentPage), max: (__VLS_ctx.totalPages), maxPages: (7), directionLinks: true, boundaryLinks: true })));
    var __VLS_240 = __VLS_239.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.currentPage), max: (__VLS_ctx.totalPages), maxPages: (7), directionLinks: true, boundaryLinks: true })], __VLS_functionalComponentArgsRest(__VLS_239), false));
    var __VLS_243 = void 0;
    var __VLS_244 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onPageChange) });
    var __VLS_241;
    var __VLS_242;
    // @ts-ignore
    [totalPages, totalPages, currentPage, onPageChange,];
    var __VLS_235;
}
// @ts-ignore
[];
var __VLS_116;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
