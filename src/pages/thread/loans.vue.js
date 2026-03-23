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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var weeklyOrderService_1 = require("@/services/weeklyOrderService");
var useSnackbar_1 = require("@/composables/useSnackbar");
var thread_format_1 = require("@/utils/thread-format");
var PageHeader_vue_1 = require("@/components/ui/layout/PageHeader.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var AppBadge_vue_1 = require("@/components/ui/cards/AppBadge.vue");
var DataTable_vue_1 = require("@/components/ui/tables/DataTable.vue");
var LoanDialog_vue_1 = require("@/components/thread/weekly-order/LoanDialog.vue");
var LoanDetailDialog_vue_1 = require("@/components/thread/weekly-order/LoanDetailDialog.vue");
var ManualReturnDialog_vue_1 = require("@/components/thread/weekly-order/ManualReturnDialog.vue");
definePage({
    meta: {
        requiresAuth: true,
        permissions: ['thread.allocations.view'],
    },
});
var snackbar = (0, useSnackbar_1.useSnackbar)();
var summary = (0, vue_1.ref)([]);
var summaryLoading = (0, vue_1.ref)(false);
var loans = (0, vue_1.ref)([]);
var loansLoading = (0, vue_1.ref)(false);
var filter = (0, vue_1.ref)('');
var statusFilter = (0, vue_1.ref)('all');
var expandedWeeks = (0, vue_1.ref)([]);
var weekDetailCache = (0, vue_1.ref)(new Map());
var weekDetailLoading = (0, vue_1.ref)(new Set());
var expandedLoans = (0, vue_1.ref)([]);
var loanLogCache = (0, vue_1.ref)(new Map());
var loanLogLoading = (0, vue_1.ref)(new Set());
var loanLogErrors = (0, vue_1.ref)(new Set());
var loanDialog = (0, vue_1.reactive)({
    open: false,
    weekId: null,
    weekName: '',
});
var detailDialog = (0, vue_1.reactive)({ open: false, loan: null });
var manualReturnDialog = (0, vue_1.reactive)({ open: false, loan: null });
var filteredLoans = (0, vue_1.computed)(function () {
    if (statusFilter.value === 'all')
        return loans.value;
    return loans.value.filter(function (l) { return l.status === statusFilter.value; });
});
var summaryColumns = [
    { name: 'week_name', label: 'Tuần', field: 'week_name', align: 'left', sortable: true },
    { name: 'total_needed', label: 'Cần (cuộn)', field: 'total_needed', align: 'right' },
    { name: 'total_reserved', label: 'Đã có', field: 'total_reserved', align: 'right' },
    { name: 'shortage', label: 'Thiếu', field: 'shortage', align: 'right', sortable: true },
    { name: 'ncc_status', label: 'NCC giao hàng', field: 'ncc_pending', align: 'left' },
    { name: 'borrowed', label: 'Đang mượn', field: 'borrowed_cones', align: 'left' },
    { name: 'borrowed_returned', label: 'Đã trả (mượn)', field: 'borrowed_returned_cones', align: 'right' },
    { name: 'lent', label: 'Đang cho mượn', field: 'lent_cones', align: 'left' },
    { name: 'lent_returned', label: 'Đã thu (cho mượn)', field: 'lent_returned_cones', align: 'right' },
    { name: 'actions', label: '', field: 'week_id', align: 'center' },
];
var loanColumns = [
    { name: 'expand', label: '', field: 'id', align: 'center', style: 'width: 32px' },
    { name: 'from_week', label: 'Tuần cho mượn', field: function (row) { var _a; return (_a = row.from_week) === null || _a === void 0 ? void 0 : _a.week_name; }, align: 'left', sortable: true },
    { name: 'to_week', label: 'Tuần mượn', field: function (row) { var _a; return (_a = row.to_week) === null || _a === void 0 ? void 0 : _a.week_name; }, align: 'left', sortable: true },
    { name: 'thread_type', label: 'Loại chỉ', field: function (row) { return formatLoanThreadType(row); }, align: 'left', sortable: true },
    { name: 'returned', label: 'Đã trả/Tổng', field: function (row) { return row.returned_cones; }, align: 'right', sortable: true },
    { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
    { name: 'reason', label: 'Lý do', field: 'reason', align: 'left' },
    { name: 'created_at', label: 'Ngày tạo', field: 'created_at', align: 'left', sortable: true, format: function (val) { return new Date(val).toLocaleDateString('vi-VN'); } },
    { name: 'actions', label: '', field: 'id', align: 'center' },
];
var detailColumns = [
    { name: 'thread_type', label: 'Loại chỉ', field: function (row) { return formatDetailThreadType(row); }, align: 'left' },
    { name: 'borrowed_cones', label: 'Mượn', field: 'borrowed_cones', align: 'right' },
    { name: 'borrowed_returned', label: 'Đã trả (mượn)', field: 'borrowed_returned_cones', align: 'right' },
    { name: 'lent_cones', label: 'Cho mượn', field: 'lent_cones', align: 'right' },
    { name: 'lent_returned', label: 'Đã thu (cho mượn)', field: 'lent_returned_cones', align: 'right' },
    { name: 'ncc_pending', label: 'Chờ NCC', field: 'ncc_pending', align: 'right' },
];
function openDetail(loan) {
    detailDialog.loan = loan;
    detailDialog.open = true;
}
function openManualReturn(loan) {
    manualReturnDialog.loan = loan;
    manualReturnDialog.open = true;
}
function openLoanDialog(weekId, weekName) {
    loanDialog.weekId = weekId;
    loanDialog.weekName = weekName;
    loanDialog.open = true;
}
function toggleLoanExpand(loanId) {
    return __awaiter(this, void 0, void 0, function () {
        var idx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    idx = expandedLoans.value.indexOf(loanId);
                    if (idx >= 0) {
                        expandedLoans.value.splice(idx, 1);
                        return [2 /*return*/];
                    }
                    expandedLoans.value.push(loanId);
                    if (loanLogCache.value.has(loanId))
                        return [2 /*return*/];
                    return [4 /*yield*/, fetchLoanLogs(loanId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function fetchLoanLogs(loanId) {
    return __awaiter(this, void 0, void 0, function () {
        var data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    loanLogLoading.value.add(loanId);
                    loanLogErrors.value.delete(loanId);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getReturnLogs(loanId)];
                case 2:
                    data = _b.sent();
                    loanLogCache.value.set(loanId, data);
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    loanLogErrors.value.add(loanId);
                    return [3 /*break*/, 5];
                case 4:
                    loanLogLoading.value.delete(loanId);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function retryLoadLogs(loanId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchLoanLogs(loanId)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function formatLogDate(isoDate) {
    var d = new Date(isoDate);
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var hh = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    return "".concat(dd, "/").concat(mm, " ").concat(hh, ":").concat(min);
}
function formatLoanThreadType(loan) {
    var _a;
    return (0, thread_format_1.formatThreadTypeDisplay)(loan.supplier_name, loan.tex_number, loan.color_name, (_a = loan.thread_type) === null || _a === void 0 ? void 0 : _a.name);
}
function formatDetailThreadType(row) {
    return (0, thread_format_1.formatThreadTypeDisplay)(row.supplier_name, row.tex_number, row.color_name, row.thread_name);
}
function loadSummary() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    summaryLoading.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    _a = summary;
                    return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getLoanSummary()];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _b.sent();
                    snackbar.error(err_1 instanceof Error ? err_1.message : 'Lỗi tải tổng quan');
                    return [3 /*break*/, 5];
                case 4:
                    summaryLoading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function toggleWeekDetail(weekId) {
    return __awaiter(this, void 0, void 0, function () {
        var idx, data, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    idx = expandedWeeks.value.indexOf(weekId);
                    if (idx >= 0) {
                        expandedWeeks.value.splice(idx, 1);
                        return [2 /*return*/];
                    }
                    expandedWeeks.value.push(weekId);
                    if (weekDetailCache.value.has(weekId))
                        return [2 /*return*/];
                    weekDetailLoading.value.add(weekId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getLoanDetailByType(weekId)];
                case 2:
                    data = _a.sent();
                    weekDetailCache.value.set(weekId, data);
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    snackbar.error(err_2 instanceof Error ? err_2.message : 'Lỗi tải chi tiết');
                    expandedWeeks.value.splice(expandedWeeks.value.indexOf(weekId), 1);
                    return [3 /*break*/, 5];
                case 4:
                    weekDetailLoading.value.delete(weekId);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function loadLoans() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, err_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    loansLoading.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    _a = loans;
                    return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getAllLoans()];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _b.sent();
                    snackbar.error(err_3 instanceof Error ? err_3.message : 'Lỗi tải dữ liệu');
                    return [3 /*break*/, 5];
                case 4:
                    loansLoading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function handleLoanChanged() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    loanDialog.open = false;
                    expandedWeeks.value = [];
                    expandedLoans.value = [];
                    weekDetailCache.value = new Map();
                    loanLogCache.value = new Map();
                    loanLogLoading.value = new Set();
                    loanLogErrors.value = new Set();
                    return [4 /*yield*/, Promise.all([loadSummary(), loadLoans()])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.onMounted)(function () {
    loadSummary();
    loadLoans();
});
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
var __VLS_7 = PageHeader_vue_1.default;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    title: "Mượn Chỉ",
    subtitle: "Tổng quan tuần hàng và quản lý mượn chỉ",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Mượn Chỉ",
        subtitle: "Tổng quan tuần hàng và quản lý mượn chỉ",
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12(__assign({ flat: true, bordered: true }, { class: "q-mb-md" })));
var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_13), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_17 = __VLS_15.slots.default;
var __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18(__assign({ class: "row items-center q-pb-none" })));
var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_19), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_23 = __VLS_21.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium col" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['col']} */ ;
var __VLS_24 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24(__assign({ 'onClick': {} }, { flat: true, icon: "refresh", label: "Tải lại", loading: (__VLS_ctx.summaryLoading) })));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, icon: "refresh", label: "Tải lại", loading: (__VLS_ctx.summaryLoading) })], __VLS_functionalComponentArgsRest(__VLS_25), false));
var __VLS_29;
var __VLS_30 = ({ click: {} },
    { onClick: (__VLS_ctx.loadSummary) });
var __VLS_27;
var __VLS_28;
// @ts-ignore
[summaryLoading, loadSummary,];
var __VLS_21;
var __VLS_31;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({}));
var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_32), false));
var __VLS_36 = __VLS_34.slots.default;
var __VLS_37;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
    rows: (__VLS_ctx.summary),
    columns: (__VLS_ctx.summaryColumns),
    rowKey: "week_id",
    flat: true,
    bordered: true,
    dense: true,
    loading: (__VLS_ctx.summaryLoading),
    pagination: ({ rowsPerPage: 0 }),
    hidePagination: true,
}));
var __VLS_39 = __VLS_38.apply(void 0, __spreadArray([{
        rows: (__VLS_ctx.summary),
        columns: (__VLS_ctx.summaryColumns),
        rowKey: "week_id",
        flat: true,
        bordered: true,
        dense: true,
        loading: (__VLS_ctx.summaryLoading),
        pagination: ({ rowsPerPage: 0 }),
        hidePagination: true,
    }], __VLS_functionalComponentArgsRest(__VLS_38), false));
var __VLS_42 = __VLS_40.slots.default;
{
    var __VLS_43 = __VLS_40.slots.body;
    var props_1 = __VLS_vSlot(__VLS_43)[0];
    var __VLS_44 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTr | typeof __VLS_components.QTr | typeof __VLS_components.qTr | typeof __VLS_components.QTr} */
    qTr;
    // @ts-ignore
    var __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        props: (props_1),
    }));
    var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([{
            props: (props_1),
        }], __VLS_functionalComponentArgsRest(__VLS_45), false));
    var __VLS_49 = __VLS_47.slots.default;
    var _loop_1 = function (col) {
        var __VLS_50 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
            key: (col.name),
            props: (props_1),
        }));
        var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{
                key: (col.name),
                props: (props_1),
            }], __VLS_functionalComponentArgsRest(__VLS_51), false));
        var __VLS_55 = __VLS_53.slots.default;
        if (col.name === 'week_name') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
            var __VLS_56 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
            qBtn;
            // @ts-ignore
            var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56(__assign({ 'onClick': {} }, { flat: true, dense: true, round: true, size: "sm", icon: (__VLS_ctx.expandedWeeks.includes(props_1.row.week_id) ? 'expand_less' : 'expand_more') })));
            var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, round: true, size: "sm", icon: (__VLS_ctx.expandedWeeks.includes(props_1.row.week_id) ? 'expand_less' : 'expand_more') })], __VLS_functionalComponentArgsRest(__VLS_57), false));
            var __VLS_61 = void 0;
            var __VLS_62 = ({ click: {} },
                { onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(col.name === 'week_name'))
                            return;
                        __VLS_ctx.toggleWeekDetail(props_1.row.week_id);
                        // @ts-ignore
                        [summaryLoading, summary, summaryColumns, expandedWeeks, toggleWeekDetail,];
                    } });
            var __VLS_63 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
            routerLink;
            // @ts-ignore
            var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63(__assign({ to: ("/thread/weekly-order/".concat(props_1.row.week_id)) }, { class: "text-primary text-weight-medium" })));
            var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([__assign({ to: ("/thread/weekly-order/".concat(props_1.row.week_id)) }, { class: "text-primary text-weight-medium" })], __VLS_functionalComponentArgsRest(__VLS_64), false));
            /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
            var __VLS_68 = __VLS_66.slots.default;
            (props_1.row.week_name);
            // @ts-ignore
            [];
        }
        else if (col.name === 'shortage') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (props_1.row.shortage > 0 ? 'text-negative text-weight-bold' : 'text-positive') }));
            (props_1.row.shortage);
        }
        else if (col.name === 'ncc_status') {
            if (props_1.row.ncc_pending > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-warning" }));
                /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
                (props_1.row.ncc_pending);
            }
            else if (props_1.row.ncc_ordered > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-positive" }));
                /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
                /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            }
        }
        else if (col.name === 'borrowed') {
            if (props_1.row.borrowed_cones > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-warning" }));
                /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
                (props_1.row.borrowed_cones);
                (props_1.row.borrowed_count);
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
                /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            }
        }
        else if (col.name === 'borrowed_returned') {
            if (props_1.row.borrowed_returned_cones > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-positive" }));
                /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
                (props_1.row.borrowed_returned_cones);
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
                /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            }
        }
        else if (col.name === 'lent') {
            if (props_1.row.lent_cones > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-info" }));
                /** @type {__VLS_StyleScopedClasses['text-info']} */ ;
                (props_1.row.lent_cones);
                (props_1.row.lent_count);
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
                /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            }
        }
        else if (col.name === 'lent_returned') {
            if (props_1.row.lent_returned_cones > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-positive" }));
                /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
                (props_1.row.lent_returned_cones);
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
                /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            }
        }
        else if (col.name === 'actions') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-center" }));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
            if (props_1.row.week_status === 'CONFIRMED') {
                var __VLS_69 = AppButton_vue_1.default;
                // @ts-ignore
                var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", icon: "swap_horiz", size: "sm", label: "Mượn chỉ" })));
                var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", icon: "swap_horiz", size: "sm", label: "Mượn chỉ" })], __VLS_functionalComponentArgsRest(__VLS_70), false));
                var __VLS_74 = void 0;
                var __VLS_75 = ({ click: {} },
                    { onClick: function () {
                            var _a = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                _a[_i] = arguments[_i];
                            }
                            var $event = _a[0];
                            if (!!(col.name === 'week_name'))
                                return;
                            if (!!(col.name === 'shortage'))
                                return;
                            if (!!(col.name === 'ncc_status'))
                                return;
                            if (!!(col.name === 'borrowed'))
                                return;
                            if (!!(col.name === 'borrowed_returned'))
                                return;
                            if (!!(col.name === 'lent'))
                                return;
                            if (!!(col.name === 'lent_returned'))
                                return;
                            if (!(col.name === 'actions'))
                                return;
                            if (!(props_1.row.week_status === 'CONFIRMED'))
                                return;
                            __VLS_ctx.openLoanDialog(props_1.row.week_id, props_1.row.week_name);
                            // @ts-ignore
                            [openLoanDialog,];
                        } });
            }
        }
        else {
            (col.value);
        }
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_59, __VLS_60, __VLS_66, __VLS_72, __VLS_73, __VLS_53;
    for (var _i = 0, _m = __VLS_vFor((props_1.cols)); _i < _m.length; _i++) {
        var col = _m[_i][0];
        _loop_1(col);
    }
    // @ts-ignore
    [];
    var __VLS_47;
    if (__VLS_ctx.expandedWeeks.includes(props_1.row.week_id)) {
        var __VLS_76 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTr | typeof __VLS_components.QTr | typeof __VLS_components.qTr | typeof __VLS_components.QTr} */
        qTr;
        // @ts-ignore
        var __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76(__assign({ class: "bg-grey-1" })));
        var __VLS_78 = __VLS_77.apply(void 0, __spreadArray([__assign({ class: "bg-grey-1" })], __VLS_functionalComponentArgsRest(__VLS_77), false));
        /** @type {__VLS_StyleScopedClasses['bg-grey-1']} */ ;
        var __VLS_81 = __VLS_79.slots.default;
        var __VLS_82 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82(__assign({ colspan: "100%" }, { class: "q-pa-sm" })));
        var __VLS_84 = __VLS_83.apply(void 0, __spreadArray([__assign({ colspan: "100%" }, { class: "q-pa-sm" })], __VLS_functionalComponentArgsRest(__VLS_83), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        var __VLS_87 = __VLS_85.slots.default;
        if (__VLS_ctx.weekDetailLoading.has(props_1.row.week_id)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-md" }));
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
            var __VLS_88 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
            qSpinner;
            // @ts-ignore
            var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
                size: "sm",
                color: "primary",
            }));
            var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([{
                    size: "sm",
                    color: "primary",
                }], __VLS_functionalComponentArgsRest(__VLS_89), false));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-ml-sm text-grey" }));
            /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        }
        else if ((_a = __VLS_ctx.weekDetailCache.get(props_1.row.week_id)) === null || _a === void 0 ? void 0 : _a.length) {
            var __VLS_93 = DataTable_vue_1.default;
            // @ts-ignore
            var __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93(__assign(__assign({ rows: ((_b = __VLS_ctx.weekDetailCache.get(props_1.row.week_id)) !== null && _b !== void 0 ? _b : []), columns: (__VLS_ctx.detailColumns), rowKey: "thread_type_id", dense: true, hidePagination: (true) }, { class: "q-ml-lg" }), { style: {} })));
            var __VLS_95 = __VLS_94.apply(void 0, __spreadArray([__assign(__assign({ rows: ((_c = __VLS_ctx.weekDetailCache.get(props_1.row.week_id)) !== null && _c !== void 0 ? _c : []), columns: (__VLS_ctx.detailColumns), rowKey: "thread_type_id", dense: true, hidePagination: (true) }, { class: "q-ml-lg" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_94), false));
            /** @type {__VLS_StyleScopedClasses['q-ml-lg']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey q-pa-sm" }));
            /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        }
        // @ts-ignore
        [expandedWeeks, weekDetailLoading, weekDetailCache, weekDetailCache, detailColumns,];
        var __VLS_85;
        // @ts-ignore
        [];
        var __VLS_79;
    }
    // @ts-ignore
    [];
}
{
    var __VLS_98 = __VLS_40.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey q-pa-md" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_40;
// @ts-ignore
[];
var __VLS_34;
// @ts-ignore
[];
var __VLS_15;
var __VLS_99;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
    flat: true,
    bordered: true,
}));
var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_100), false));
var __VLS_104 = __VLS_102.slots.default;
var __VLS_105;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ class: "row items-center q-pb-none" })));
var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_110 = __VLS_108.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium col" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_111;
/** @ts-ignore @type {typeof __VLS_components.qBtnToggle | typeof __VLS_components.QBtnToggle} */
qBtnToggle;
// @ts-ignore
var __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111({
    modelValue: (__VLS_ctx.statusFilter),
    dense: true,
    flat: true,
    noCaps: true,
    toggleColor: "primary",
    options: ([
        { label: 'Tất cả', value: 'all' },
        { label: 'Đang mượn', value: 'ACTIVE' },
        { label: 'Đã trả', value: 'SETTLED' },
    ]),
}));
var __VLS_113 = __VLS_112.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.statusFilter),
        dense: true,
        flat: true,
        noCaps: true,
        toggleColor: "primary",
        options: ([
            { label: 'Tất cả', value: 'all' },
            { label: 'Đang mượn', value: 'ACTIVE' },
            { label: 'Đã trả', value: 'SETTLED' },
        ]),
    }], __VLS_functionalComponentArgsRest(__VLS_112), false));
var __VLS_116 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116(__assign({ 'onClick': {} }, { flat: true, icon: "refresh", loading: (__VLS_ctx.loansLoading) })));
var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, icon: "refresh", loading: (__VLS_ctx.loansLoading) })], __VLS_functionalComponentArgsRest(__VLS_117), false));
var __VLS_121;
var __VLS_122 = ({ click: {} },
    { onClick: (__VLS_ctx.loadLoans) });
var __VLS_119;
var __VLS_120;
// @ts-ignore
[statusFilter, loansLoading, loadLoans,];
var __VLS_108;
var __VLS_123;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123({}));
var __VLS_125 = __VLS_124.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_124), false));
var __VLS_128 = __VLS_126.slots.default;
var __VLS_129 = DataTable_vue_1.default || DataTable_vue_1.default;
// @ts-ignore
var __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129({
    rows: (__VLS_ctx.filteredLoans),
    columns: (__VLS_ctx.loanColumns),
    rowKey: "id",
    flat: true,
    bordered: true,
    dense: true,
    loading: (__VLS_ctx.loansLoading),
    rowsPerPageOptions: ([20, 50, 100]),
    filter: (__VLS_ctx.filter),
}));
var __VLS_131 = __VLS_130.apply(void 0, __spreadArray([{
        rows: (__VLS_ctx.filteredLoans),
        columns: (__VLS_ctx.loanColumns),
        rowKey: "id",
        flat: true,
        bordered: true,
        dense: true,
        loading: (__VLS_ctx.loansLoading),
        rowsPerPageOptions: ([20, 50, 100]),
        filter: (__VLS_ctx.filter),
    }], __VLS_functionalComponentArgsRest(__VLS_130), false));
var __VLS_134 = __VLS_132.slots.default;
{
    var __VLS_135 = __VLS_132.slots["top-right"];
    var __VLS_136 = AppInput_vue_1.default || AppInput_vue_1.default;
    // @ts-ignore
    var __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({
        modelValue: (__VLS_ctx.filter),
        dense: true,
        outlined: true,
        placeholder: "Tìm kiếm...",
    }));
    var __VLS_138 = __VLS_137.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.filter),
            dense: true,
            outlined: true,
            placeholder: "Tìm kiếm...",
        }], __VLS_functionalComponentArgsRest(__VLS_137), false));
    var __VLS_141 = __VLS_139.slots.default;
    {
        var __VLS_142 = __VLS_139.slots.append;
        var __VLS_143 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
            name: "search",
        }));
        var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([{
                name: "search",
            }], __VLS_functionalComponentArgsRest(__VLS_144), false));
        // @ts-ignore
        [loansLoading, filteredLoans, loanColumns, filter, filter,];
    }
    // @ts-ignore
    [];
    var __VLS_139;
    // @ts-ignore
    [];
}
{
    var __VLS_148 = __VLS_132.slots.body;
    var props_2 = __VLS_vSlot(__VLS_148)[0];
    var __VLS_149 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTr | typeof __VLS_components.QTr | typeof __VLS_components.qTr | typeof __VLS_components.QTr} */
    qTr;
    // @ts-ignore
    var __VLS_150 = __VLS_asFunctionalComponent1(__VLS_149, new __VLS_149(__assign(__assign({ 'onClick': {} }, { props: (props_2) }), { class: "cursor-pointer" })));
    var __VLS_151 = __VLS_150.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { props: (props_2) }), { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_150), false));
    var __VLS_154 = void 0;
    var __VLS_155 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openDetail(props_2.row);
                // @ts-ignore
                [openDetail,];
            } });
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_156 = __VLS_152.slots.default;
    var _loop_2 = function (col) {
        var __VLS_157 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_158 = __VLS_asFunctionalComponent1(__VLS_157, new __VLS_157(__assign({ 'onClick': {} }, { key: (col.name), props: (props_2) })));
        var __VLS_159 = __VLS_158.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { key: (col.name), props: (props_2) })], __VLS_functionalComponentArgsRest(__VLS_158), false));
        var __VLS_162 = void 0;
        var __VLS_163 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    col.name === 'actions' || col.name === 'expand' ? undefined : __VLS_ctx.openDetail(props_2.row);
                    // @ts-ignore
                    [openDetail,];
                } });
        var __VLS_164 = __VLS_160.slots.default;
        if (col.name === 'expand') {
            var __VLS_165 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
            qBtn;
            // @ts-ignore
            var __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165(__assign({ 'onClick': {} }, { flat: true, dense: true, round: true, size: "xs", icon: (__VLS_ctx.expandedLoans.includes(props_2.row.id) ? 'expand_less' : 'expand_more') })));
            var __VLS_167 = __VLS_166.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, round: true, size: "xs", icon: (__VLS_ctx.expandedLoans.includes(props_2.row.id) ? 'expand_less' : 'expand_more') })], __VLS_functionalComponentArgsRest(__VLS_166), false));
            var __VLS_170 = void 0;
            var __VLS_171 = ({ click: {} },
                { onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(col.name === 'expand'))
                            return;
                        __VLS_ctx.toggleLoanExpand(props_2.row.id);
                        // @ts-ignore
                        [expandedLoans, toggleLoanExpand,];
                    } });
        }
        else if (col.name === 'from_week') {
            if (props_2.row.from_week) {
                var __VLS_172 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
                routerLink;
                // @ts-ignore
                var __VLS_173 = __VLS_asFunctionalComponent1(__VLS_172, new __VLS_172(__assign(__assign({ 'onClick': {} }, { to: ("/thread/weekly-order/".concat(props_2.row.from_week.id)) }), { class: "text-primary" })));
                var __VLS_174 = __VLS_173.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { to: ("/thread/weekly-order/".concat(props_2.row.from_week.id)) }), { class: "text-primary" })], __VLS_functionalComponentArgsRest(__VLS_173), false));
                var __VLS_177 = void 0;
                var __VLS_178 = ({ click: {} },
                    { onClick: function () { } });
                /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
                var __VLS_179 = __VLS_175.slots.default;
                (props_2.row.from_week.week_name);
                // @ts-ignore
                [];
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
                /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            }
        }
        else if (col.name === 'to_week') {
            var __VLS_180 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
            routerLink;
            // @ts-ignore
            var __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180(__assign(__assign({ 'onClick': {} }, { to: ("/thread/weekly-order/".concat((_d = props_2.row.to_week) === null || _d === void 0 ? void 0 : _d.id)) }), { class: "text-primary" })));
            var __VLS_182 = __VLS_181.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { to: ("/thread/weekly-order/".concat((_e = props_2.row.to_week) === null || _e === void 0 ? void 0 : _e.id)) }), { class: "text-primary" })], __VLS_functionalComponentArgsRest(__VLS_181), false));
            var __VLS_185 = void 0;
            var __VLS_186 = ({ click: {} },
                { onClick: function () { } });
            /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
            var __VLS_187 = __VLS_183.slots.default;
            (((_f = props_2.row.to_week) === null || _f === void 0 ? void 0 : _f.week_name) || '-');
            // @ts-ignore
            [];
        }
        else if (col.name === 'thread_type') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
            /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
            (__VLS_ctx.formatLoanThreadType(props_2.row));
        }
        else if (col.name === 'returned') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (props_2.row.status === 'SETTLED' ? 'text-positive text-weight-medium' : 'text-body2') }));
            (props_2.row.returned_cones);
            (props_2.row.quantity_cones);
        }
        else if (col.name === 'status') {
            var __VLS_188 = AppBadge_vue_1.default;
            // @ts-ignore
            var __VLS_189 = __VLS_asFunctionalComponent1(__VLS_188, new __VLS_188({
                label: (props_2.row.status === 'SETTLED' ? 'Đã trả' : 'Đang mượn'),
                color: (props_2.row.status === 'SETTLED' ? 'positive' : 'warning'),
            }));
            var __VLS_190 = __VLS_189.apply(void 0, __spreadArray([{
                    label: (props_2.row.status === 'SETTLED' ? 'Đã trả' : 'Đang mượn'),
                    color: (props_2.row.status === 'SETTLED' ? 'positive' : 'warning'),
                }], __VLS_functionalComponentArgsRest(__VLS_189), false));
        }
        else if (col.name === 'actions') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ onClick: function () { } }));
            if (props_2.row.status === 'ACTIVE') {
                var __VLS_193 = AppButton_vue_1.default;
                // @ts-ignore
                var __VLS_194 = __VLS_asFunctionalComponent1(__VLS_193, new __VLS_193(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", icon: "undo", size: "sm", label: "Trả" })));
                var __VLS_195 = __VLS_194.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", icon: "undo", size: "sm", label: "Trả" })], __VLS_functionalComponentArgsRest(__VLS_194), false));
                var __VLS_198 = void 0;
                var __VLS_199 = ({ click: {} },
                    { onClick: function () {
                            var _a = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                _a[_i] = arguments[_i];
                            }
                            var $event = _a[0];
                            if (!!(col.name === 'expand'))
                                return;
                            if (!!(col.name === 'from_week'))
                                return;
                            if (!!(col.name === 'to_week'))
                                return;
                            if (!!(col.name === 'thread_type'))
                                return;
                            if (!!(col.name === 'returned'))
                                return;
                            if (!!(col.name === 'status'))
                                return;
                            if (!(col.name === 'actions'))
                                return;
                            if (!(props_2.row.status === 'ACTIVE'))
                                return;
                            __VLS_ctx.openManualReturn(props_2.row);
                            // @ts-ignore
                            [formatLoanThreadType, openManualReturn,];
                        } });
            }
        }
        else {
            (col.value);
        }
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_168, __VLS_169, __VLS_175, __VLS_176, __VLS_183, __VLS_184, __VLS_196, __VLS_197, __VLS_160, __VLS_161;
    for (var _o = 0, _p = __VLS_vFor((props_2.cols)); _o < _p.length; _o++) {
        var col = _p[_o][0];
        _loop_2(col);
    }
    // @ts-ignore
    [];
    var __VLS_152;
    var __VLS_153;
    if (__VLS_ctx.expandedLoans.includes(props_2.row.id)) {
        var __VLS_200 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTr | typeof __VLS_components.QTr | typeof __VLS_components.qTr | typeof __VLS_components.QTr} */
        qTr;
        // @ts-ignore
        var __VLS_201 = __VLS_asFunctionalComponent1(__VLS_200, new __VLS_200(__assign({ class: "bg-grey-1" })));
        var __VLS_202 = __VLS_201.apply(void 0, __spreadArray([__assign({ class: "bg-grey-1" })], __VLS_functionalComponentArgsRest(__VLS_201), false));
        /** @type {__VLS_StyleScopedClasses['bg-grey-1']} */ ;
        var __VLS_205 = __VLS_203.slots.default;
        var __VLS_206 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_207 = __VLS_asFunctionalComponent1(__VLS_206, new __VLS_206({
            colspan: "100%",
        }));
        var __VLS_208 = __VLS_207.apply(void 0, __spreadArray([{
                colspan: "100%",
            }], __VLS_functionalComponentArgsRest(__VLS_207), false));
        var __VLS_211 = __VLS_209.slots.default;
        if (__VLS_ctx.loanLogLoading.has(props_2.row.id)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-pa-sm q-gutter-xs text-grey" }));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            var __VLS_212 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
            qSpinner;
            // @ts-ignore
            var __VLS_213 = __VLS_asFunctionalComponent1(__VLS_212, new __VLS_212({
                size: "xs",
                color: "primary",
            }));
            var __VLS_214 = __VLS_213.apply(void 0, __spreadArray([{
                    size: "xs",
                    color: "primary",
                }], __VLS_functionalComponentArgsRest(__VLS_213), false));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        }
        else if (__VLS_ctx.loanLogErrors.has(props_2.row.id)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-pa-sm q-gutter-xs text-negative text-caption" }));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            var __VLS_217 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_218 = __VLS_asFunctionalComponent1(__VLS_217, new __VLS_217({
                name: "error_outline",
                size: "xs",
            }));
            var __VLS_219 = __VLS_218.apply(void 0, __spreadArray([{
                    name: "error_outline",
                    size: "xs",
                }], __VLS_functionalComponentArgsRest(__VLS_218), false));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            var __VLS_222 = AppButton_vue_1.default;
            // @ts-ignore
            var __VLS_223 = __VLS_asFunctionalComponent1(__VLS_222, new __VLS_222(__assign({ 'onClick': {} }, { flat: true, dense: true, size: "xs", label: "Thử lại" })));
            var __VLS_224 = __VLS_223.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, size: "xs", label: "Thử lại" })], __VLS_functionalComponentArgsRest(__VLS_223), false));
            var __VLS_227 = void 0;
            var __VLS_228 = ({ click: {} },
                { onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(__VLS_ctx.expandedLoans.includes(props_2.row.id)))
                            return;
                        if (!!(__VLS_ctx.loanLogLoading.has(props_2.row.id)))
                            return;
                        if (!(__VLS_ctx.loanLogErrors.has(props_2.row.id)))
                            return;
                        __VLS_ctx.retryLoadLogs(props_2.row.id);
                        // @ts-ignore
                        [expandedLoans, loanLogLoading, loanLogErrors, retryLoadLogs,];
                    } });
            var __VLS_225;
            var __VLS_226;
        }
        else if (!__VLS_ctx.loanLogCache.has(props_2.row.id) || ((_g = __VLS_ctx.loanLogCache.get(props_2.row.id)) === null || _g === void 0 ? void 0 : _g.length) === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey text-caption q-pa-sm" }));
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-sm" }));
            /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
            for (var _q = 0, _r = __VLS_vFor((__VLS_ctx.loanLogCache.get(props_2.row.id).slice(0, 3))); _q < _r.length; _q++) {
                var log = _r[_q][0];
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (log.id) }, { class: "row items-center q-gutter-xs q-mb-xs text-caption" }));
                /** @type {__VLS_StyleScopedClasses['row']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
                var __VLS_229 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
                qIcon;
                // @ts-ignore
                var __VLS_230 = __VLS_asFunctionalComponent1(__VLS_229, new __VLS_229({
                    name: (log.return_type === 'AUTO' ? 'smart_toy' : 'build'),
                    size: "xs",
                    color: (log.return_type === 'AUTO' ? 'grey-6' : 'primary'),
                }));
                var __VLS_231 = __VLS_230.apply(void 0, __spreadArray([{
                        name: (log.return_type === 'AUTO' ? 'smart_toy' : 'build'),
                        size: "xs",
                        color: (log.return_type === 'AUTO' ? 'grey-6' : 'primary'),
                    }], __VLS_functionalComponentArgsRest(__VLS_230), false));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-7" }));
                /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
                (__VLS_ctx.formatLogDate(log.created_at));
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
                /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
                (log.cones_returned);
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-6" }));
                /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
                (log.returned_by);
                if (log.notes) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-6" }));
                    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
                    (log.notes);
                }
                // @ts-ignore
                [loanLogCache, loanLogCache, loanLogCache, formatLogDate,];
            }
            if (((_j = (_h = __VLS_ctx.loanLogCache.get(props_2.row.id)) === null || _h === void 0 ? void 0 : _h.length) !== null && _j !== void 0 ? _j : 0) > 3) {
                var __VLS_234 = AppButton_vue_1.default;
                // @ts-ignore
                var __VLS_235 = __VLS_asFunctionalComponent1(__VLS_234, new __VLS_234(__assign({ 'onClick': {} }, { flat: true, dense: true, size: "xs", color: "primary", label: ("Xem \u0111\u1EA7y \u0111\u1EE7 (".concat((_k = __VLS_ctx.loanLogCache.get(props_2.row.id)) === null || _k === void 0 ? void 0 : _k.length, ")")) })));
                var __VLS_236 = __VLS_235.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, size: "xs", color: "primary", label: ("Xem \u0111\u1EA7y \u0111\u1EE7 (".concat((_l = __VLS_ctx.loanLogCache.get(props_2.row.id)) === null || _l === void 0 ? void 0 : _l.length, ")")) })], __VLS_functionalComponentArgsRest(__VLS_235), false));
                var __VLS_239 = void 0;
                var __VLS_240 = ({ click: {} },
                    { onClick: function () {
                            var _a, _b, _c;
                            var _d = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                _d[_i] = arguments[_i];
                            }
                            var $event = _d[0];
                            if (!(__VLS_ctx.expandedLoans.includes(props_2.row.id)))
                                return;
                            if (!!(__VLS_ctx.loanLogLoading.has(props_2.row.id)))
                                return;
                            if (!!(__VLS_ctx.loanLogErrors.has(props_2.row.id)))
                                return;
                            if (!!(!__VLS_ctx.loanLogCache.has(props_2.row.id) || ((_a = __VLS_ctx.loanLogCache.get(props_2.row.id)) === null || _a === void 0 ? void 0 : _a.length) === 0))
                                return;
                            if (!(((_c = (_b = __VLS_ctx.loanLogCache.get(props_2.row.id)) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) > 3))
                                return;
                            __VLS_ctx.openDetail(props_2.row);
                            // @ts-ignore
                            [openDetail, loanLogCache, loanLogCache,];
                        } });
                var __VLS_237;
                var __VLS_238;
            }
        }
        // @ts-ignore
        [];
        var __VLS_209;
        // @ts-ignore
        [];
        var __VLS_203;
    }
    // @ts-ignore
    [];
}
{
    var __VLS_241 = __VLS_132.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey q-pa-xl" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    var __VLS_242 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_243 = __VLS_asFunctionalComponent1(__VLS_242, new __VLS_242({
        name: "swap_horiz",
        size: "48px",
        color: "grey-5",
    }));
    var __VLS_244 = __VLS_243.apply(void 0, __spreadArray([{
            name: "swap_horiz",
            size: "48px",
            color: "grey-5",
        }], __VLS_functionalComponentArgsRest(__VLS_243), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_132;
// @ts-ignore
[];
var __VLS_126;
// @ts-ignore
[];
var __VLS_102;
if (__VLS_ctx.loanDialog.weekId !== null) {
    var __VLS_247 = LoanDialog_vue_1.default;
    // @ts-ignore
    var __VLS_248 = __VLS_asFunctionalComponent1(__VLS_247, new __VLS_247(__assign({ 'onCreated': {} }, { modelValue: (__VLS_ctx.loanDialog.open), toWeekId: (__VLS_ctx.loanDialog.weekId), toWeekName: (__VLS_ctx.loanDialog.weekName) })));
    var __VLS_249 = __VLS_248.apply(void 0, __spreadArray([__assign({ 'onCreated': {} }, { modelValue: (__VLS_ctx.loanDialog.open), toWeekId: (__VLS_ctx.loanDialog.weekId), toWeekName: (__VLS_ctx.loanDialog.weekName) })], __VLS_functionalComponentArgsRest(__VLS_248), false));
    var __VLS_252 = void 0;
    var __VLS_253 = ({ created: {} },
        { onCreated: (__VLS_ctx.handleLoanChanged) });
    var __VLS_250;
    var __VLS_251;
}
if (__VLS_ctx.detailDialog.loan) {
    var __VLS_254 = LoanDetailDialog_vue_1.default;
    // @ts-ignore
    var __VLS_255 = __VLS_asFunctionalComponent1(__VLS_254, new __VLS_254(__assign({ 'onReturned': {} }, { modelValue: (__VLS_ctx.detailDialog.open), loanId: (__VLS_ctx.detailDialog.loan.id), initialLoan: (__VLS_ctx.detailDialog.loan) })));
    var __VLS_256 = __VLS_255.apply(void 0, __spreadArray([__assign({ 'onReturned': {} }, { modelValue: (__VLS_ctx.detailDialog.open), loanId: (__VLS_ctx.detailDialog.loan.id), initialLoan: (__VLS_ctx.detailDialog.loan) })], __VLS_functionalComponentArgsRest(__VLS_255), false));
    var __VLS_259 = void 0;
    var __VLS_260 = ({ returned: {} },
        { onReturned: (__VLS_ctx.handleLoanChanged) });
    var __VLS_257;
    var __VLS_258;
}
if (__VLS_ctx.manualReturnDialog.loan) {
    var __VLS_261 = ManualReturnDialog_vue_1.default;
    // @ts-ignore
    var __VLS_262 = __VLS_asFunctionalComponent1(__VLS_261, new __VLS_261(__assign({ 'onReturned': {} }, { modelValue: (__VLS_ctx.manualReturnDialog.open), loan: (__VLS_ctx.manualReturnDialog.loan), weekId: (__VLS_ctx.manualReturnDialog.loan.to_week_id) })));
    var __VLS_263 = __VLS_262.apply(void 0, __spreadArray([__assign({ 'onReturned': {} }, { modelValue: (__VLS_ctx.manualReturnDialog.open), loan: (__VLS_ctx.manualReturnDialog.loan), weekId: (__VLS_ctx.manualReturnDialog.loan.to_week_id) })], __VLS_functionalComponentArgsRest(__VLS_262), false));
    var __VLS_266 = void 0;
    var __VLS_267 = ({ returned: {} },
        { onReturned: (__VLS_ctx.handleLoanChanged) });
    var __VLS_264;
    var __VLS_265;
}
// @ts-ignore
[loanDialog, loanDialog, loanDialog, loanDialog, handleLoanChanged, handleLoanChanged, handleLoanChanged, detailDialog, detailDialog, detailDialog, detailDialog, manualReturnDialog, manualReturnDialog, manualReturnDialog, manualReturnDialog,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
