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
var vue_router_1 = require("vue-router");
var weeklyOrderService_1 = require("@/services/weeklyOrderService");
var useWeeklyOrderReservations_1 = require("@/composables/thread/useWeeklyOrderReservations");
var thread_format_1 = require("@/utils/thread-format");
var PageHeader_vue_1 = require("@/components/ui/layout/PageHeader.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var AppBadge_vue_1 = require("@/components/ui/cards/AppBadge.vue");
var DataTable_vue_1 = require("@/components/ui/tables/DataTable.vue");
var LoanDialog_vue_1 = require("@/components/thread/weekly-order/LoanDialog.vue");
var ReserveFromStockDialog_vue_1 = require("@/components/thread/weekly-order/ReserveFromStockDialog.vue");
var LoanDetailDialog_vue_1 = require("@/components/thread/weekly-order/LoanDetailDialog.vue");
var ManualReturnDialog_vue_1 = require("@/components/thread/weekly-order/ManualReturnDialog.vue");
definePage({
    meta: {
        requiresAuth: true,
        permissions: ['thread.view'],
    },
});
var route = (0, vue_router_1.useRoute)();
var router = (0, vue_router_1.useRouter)();
var weekId = (0, vue_1.computed)(function () { return Number(route.params.id || '0'); });
var hasHistory = Boolean((_a = window.history.state) === null || _a === void 0 ? void 0 : _a.back);
var goBack = function () {
    if (hasHistory) {
        router.back();
    }
    else {
        router.push('/thread/loans');
    }
};
var week = (0, vue_1.ref)(null);
var notFound = (0, vue_1.ref)(false);
var isLoading = (0, vue_1.ref)(false);
var activeTab = (0, vue_1.ref)('overview');
var showLoanDialog = (0, vue_1.ref)(false);
var showReserveFromStockDialog = (0, vue_1.ref)(false);
var selectedReservationSummary = (0, vue_1.ref)(null);
var selectedThreadTypeName = (0, vue_1.ref)('');
var loans = (0, vue_1.ref)([]);
var loansLoading = (0, vue_1.ref)(false);
var loanDetailDialog = (0, vue_1.reactive)({ open: false, loan: null });
var loanManualReturnDialog = (0, vue_1.reactive)({ open: false, loan: null });
function openLoanDetail(loan) {
    loanDetailDialog.loan = loan;
    loanDetailDialog.open = true;
}
function openLoanManualReturn(loan) {
    loanManualReturnDialog.loan = loan;
    loanManualReturnDialog.open = true;
}
var _c = (0, useWeeklyOrderReservations_1.useWeeklyOrderReservations)(), reservationSummary = _c.reservationSummary, reservedCones = _c.reservedCones, reservationLoading = _c.isLoading, fetchReservations = _c.fetchReservations;
var loadWeek = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!weekId.value || isNaN(weekId.value)) {
                    notFound.value = true;
                    return [2 /*return*/];
                }
                isLoading.value = true;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, 4, 5]);
                _a = week;
                return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getById(weekId.value)];
            case 2:
                _a.value = _c.sent();
                return [3 /*break*/, 5];
            case 3:
                _b = _c.sent();
                notFound.value = true;
                return [3 /*break*/, 5];
            case 4:
                isLoading.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
var loadReservations = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!weekId.value)
                    return [2 /*return*/];
                return [4 /*yield*/, fetchReservations(weekId.value)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var loadLoans = function () { return __awaiter(void 0, void 0, void 0, function () {
    var data, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!weekId.value)
                    return [2 /*return*/];
                loansLoading.value = true;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getLoans(weekId.value)];
            case 2:
                data = _b.sent();
                loans.value = data.all;
                return [3 /*break*/, 5];
            case 3:
                _a = _b.sent();
                loans.value = [];
                return [3 /*break*/, 5];
            case 4:
                loansLoading.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
var onLoanCreated = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                showLoanDialog.value = false;
                return [4 /*yield*/, loadLoans()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var openReserveFromStockDialog = function (summary, threadTypeName) {
    selectedReservationSummary.value = summary;
    selectedThreadTypeName.value = threadTypeName;
    showReserveFromStockDialog.value = true;
};
var onReserveFromStockComplete = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                showReserveFromStockDialog.value = false;
                return [4 /*yield*/, loadReservations()];
            case 1:
                _a.sent();
                return [4 /*yield*/, loadLoans()];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
(0, vue_1.watch)(activeTab, function (tab) {
    if (tab === 'reservations' && reservedCones.value.length === 0) {
        loadReservations();
    }
    if (tab === 'loans' && loans.value.length === 0) {
        loadLoans();
    }
});
(0, vue_1.onMounted)(function () {
    loadWeek();
});
function formatDateRange(start, end) {
    if (!start && !end)
        return '-';
    var fmt = function (d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '?'; };
    return "".concat(fmt(start), " - ").concat(fmt(end));
}
function formatDateTime(dt) {
    if (!dt)
        return '-';
    return new Date(dt).toLocaleString('vi-VN');
}
function statusLabel(status) {
    var map = {
        DRAFT: 'Nháp',
        CONFIRMED: 'Đã xác nhận',
        CANCELLED: 'Đã hủy',
    };
    return map[status] || status;
}
function statusColor(status) {
    var map = {
        DRAFT: 'grey',
        CONFIRMED: 'positive',
        CANCELLED: 'negative',
    };
    return map[status] || 'grey';
}
var reservationSummaryColumns = [
    { name: 'thread_type_id', label: 'Loại chỉ', field: 'thread_type_id', align: 'left' },
    { name: 'needed', label: 'Cần (cuộn)', field: 'needed', align: 'right' },
    { name: 'reserved', label: 'Đã đặt trước (cuộn)', field: 'reserved', align: 'right' },
    { name: 'shortage', label: 'Thiếu (cuộn)', field: 'shortage', align: 'right' },
    { name: 'available_stock', label: 'Tồn kho', field: 'available_stock', align: 'right' },
    { name: 'status', label: 'Trạng thái', field: 'shortage', align: 'center' },
    { name: 'actions', label: '', field: 'actions', align: 'center' },
];
var reservedConesColumns = [
    { name: 'cone_id', label: 'Mã cuộn', field: 'cone_id', align: 'left' },
    { name: 'thread_type', label: 'Loại chỉ', field: function (row) { var _a, _b, _c, _d, _e, _f; return (0, thread_format_1.formatThreadTypeDisplay)((_b = (_a = row.thread_type) === null || _a === void 0 ? void 0 : _a.supplier) === null || _b === void 0 ? void 0 : _b.name, (_c = row.thread_type) === null || _c === void 0 ? void 0 : _c.tex_number, (_e = (_d = row.thread_type) === null || _d === void 0 ? void 0 : _d.color) === null || _e === void 0 ? void 0 : _e.name, (_f = row.thread_type) === null || _f === void 0 ? void 0 : _f.name); }, align: 'left' },
    { name: 'warehouse', label: 'Kho', field: function (row) { var _a; return ((_a = row.warehouse) === null || _a === void 0 ? void 0 : _a.name) || '-'; }, align: 'left' },
    { name: 'quantity_meters', label: 'Mét', field: 'quantity_meters', align: 'right' },
    { name: 'lot_number', label: 'Lô', field: 'lot_number', align: 'left' },
    { name: 'expiry_date', label: 'HSD', field: function (row) { return row.expiry_date ? new Date(row.expiry_date).toLocaleDateString('vi-VN') : '-'; }, align: 'left' },
];
var loanColumns = [
    { name: 'direction', label: 'Chiều', field: 'to_week_id', align: 'center' },
    { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
    { name: 'from_week', label: 'Nguồn', field: function (row) { var _a; return row.from_week_id === null ? 'Tồn kho' : (((_a = row.from_week) === null || _a === void 0 ? void 0 : _a.week_name) || '-'); }, align: 'left' },
    { name: 'to_week', label: 'Tuần nhận', field: function (row) { var _a; return ((_a = row.to_week) === null || _a === void 0 ? void 0 : _a.week_name) || '-'; }, align: 'left' },
    { name: 'thread_type', label: 'Loại chỉ', field: function (row) { var _a, _b, _c, _d, _e, _f; return (0, thread_format_1.formatThreadTypeDisplay)((_b = (_a = row.thread_type) === null || _a === void 0 ? void 0 : _a.supplier) === null || _b === void 0 ? void 0 : _b.name, (_c = row.thread_type) === null || _c === void 0 ? void 0 : _c.tex_number, (_e = (_d = row.thread_type) === null || _d === void 0 ? void 0 : _d.color) === null || _e === void 0 ? void 0 : _e.name, (_f = row.thread_type) === null || _f === void 0 ? void 0 : _f.name); }, align: 'left' },
    { name: 'returned', label: 'Đã trả/Tổng', field: function (row) { return row.returned_cones; }, align: 'right' },
    { name: 'reason', label: 'Lý do', field: 'reason', align: 'left' },
    { name: 'created_at', label: 'Thời gian', field: function (row) { return formatDateTime(row.created_at); }, align: 'left' },
    { name: 'actions', label: '', field: 'id', align: 'center' },
];
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
    title: "Chi Tiết Tuần Đặt Hàng",
    subtitle: (__VLS_ctx.week ? __VLS_ctx.week.week_name : ''),
    showBack: true,
    backTo: (__VLS_ctx.hasHistory ? undefined : '/thread/loans'),
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Chi Tiết Tuần Đặt Hàng",
        subtitle: (__VLS_ctx.week ? __VLS_ctx.week.week_name : ''),
        showBack: true,
        backTo: (__VLS_ctx.hasHistory ? undefined : '/thread/loans'),
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-center q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_12 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        size: "50px",
        color: "primary",
    }));
    var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([{
            size: "50px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_13), false));
}
else if (__VLS_ctx.notFound) {
    var __VLS_17 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17(__assign({ flat: true, bordered: true }, { class: "text-center q-pa-xl" })));
    var __VLS_19 = __VLS_18.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "text-center q-pa-xl" })], __VLS_functionalComponentArgsRest(__VLS_18), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    var __VLS_22 = __VLS_20.slots.default;
    var __VLS_23 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        name: "search_off",
        size: "64px",
        color: "grey-5",
    }));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
            name: "search_off",
            size: "64px",
            color: "grey-5",
        }], __VLS_functionalComponentArgsRest(__VLS_24), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 q-mt-md text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    var __VLS_28 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign(__assign({ 'onClick': {} }, { color: "primary", label: "Quay lại danh sách", icon: "arrow_back" }), { class: "q-mt-md" })));
    var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", label: "Quay lại danh sách", icon: "arrow_back" }), { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_29), false));
    var __VLS_33 = void 0;
    var __VLS_34 = ({ click: {} },
        { onClick: (__VLS_ctx.goBack) });
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    var __VLS_31;
    var __VLS_32;
    // @ts-ignore
    [week, week, hasHistory, isLoading, notFound, goBack,];
    var __VLS_20;
}
else if (__VLS_ctx.week) {
    var __VLS_35 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign({ flat: true, bordered: true }, { class: "q-mb-md" })));
    var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_36), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_40 = __VLS_38.slots.default;
    var __VLS_41 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({}));
    var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_42), false));
    var __VLS_46 = __VLS_44.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.week.week_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    (__VLS_ctx.formatDateRange(__VLS_ctx.week.start_date, __VLS_ctx.week.end_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-xs" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    var __VLS_47 = AppBadge_vue_1.default;
    // @ts-ignore
    var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
        label: (__VLS_ctx.statusLabel(__VLS_ctx.week.status)),
        color: (__VLS_ctx.statusColor(__VLS_ctx.week.status)),
    }));
    var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([{
            label: (__VLS_ctx.statusLabel(__VLS_ctx.week.status)),
            color: (__VLS_ctx.statusColor(__VLS_ctx.week.status)),
        }], __VLS_functionalComponentArgsRest(__VLS_48), false));
    // @ts-ignore
    [week, week, week, week, week, week, formatDateRange, statusLabel, statusColor,];
    var __VLS_44;
    // @ts-ignore
    [];
    var __VLS_38;
    var __VLS_52 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
    qTabs;
    // @ts-ignore
    var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52(__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left", narrowIndicator: true })));
    var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left", narrowIndicator: true })], __VLS_functionalComponentArgsRest(__VLS_53), false));
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    var __VLS_57 = __VLS_55.slots.default;
    var __VLS_58 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
        name: "overview",
        label: "Tổng quan",
        icon: "info",
    }));
    var __VLS_60 = __VLS_59.apply(void 0, __spreadArray([{
            name: "overview",
            label: "Tổng quan",
            icon: "info",
        }], __VLS_functionalComponentArgsRest(__VLS_59), false));
    var __VLS_63 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
        name: "reservations",
        label: "Đặt trước",
        icon: "bookmark",
    }));
    var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([{
            name: "reservations",
            label: "Đặt trước",
            icon: "bookmark",
        }], __VLS_functionalComponentArgsRest(__VLS_64), false));
    var __VLS_68 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
        name: "loans",
        label: "Mượn chỉ",
        icon: "swap_horiz",
    }));
    var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([{
            name: "loans",
            label: "Mượn chỉ",
            icon: "swap_horiz",
        }], __VLS_functionalComponentArgsRest(__VLS_69), false));
    var __VLS_73 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({
        name: "deliveries",
        label: "Giao hàng",
        icon: "local_shipping",
    }));
    var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([{
            name: "deliveries",
            label: "Giao hàng",
            icon: "local_shipping",
        }], __VLS_functionalComponentArgsRest(__VLS_74), false));
    // @ts-ignore
    [activeTab,];
    var __VLS_55;
    var __VLS_78 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({}));
    var __VLS_80 = __VLS_79.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_79), false));
    var __VLS_83 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
    qTabPanels;
    // @ts-ignore
    var __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
        modelValue: (__VLS_ctx.activeTab),
        animated: true,
        keepAlive: true,
    }));
    var __VLS_85 = __VLS_84.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.activeTab),
            animated: true,
            keepAlive: true,
        }], __VLS_functionalComponentArgsRest(__VLS_84), false));
    var __VLS_88 = __VLS_86.slots.default;
    var __VLS_89 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
    qTabPanel;
    // @ts-ignore
    var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
        name: "overview",
    }));
    var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([{
            name: "overview",
        }], __VLS_functionalComponentArgsRest(__VLS_90), false));
    var __VLS_94 = __VLS_92.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    if (__VLS_ctx.week.notes) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-grey-7 q-mb-md" }));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
        (__VLS_ctx.week.notes);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    (__VLS_ctx.formatDateTime(__VLS_ctx.week.created_at));
    // @ts-ignore
    [week, week, week, activeTab, formatDateTime,];
    var __VLS_92;
    var __VLS_95 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
    qTabPanel;
    // @ts-ignore
    var __VLS_96 = __VLS_asFunctionalComponent1(__VLS_95, new __VLS_95({
        name: "reservations",
    }));
    var __VLS_97 = __VLS_96.apply(void 0, __spreadArray([{
            name: "reservations",
        }], __VLS_functionalComponentArgsRest(__VLS_96), false));
    var __VLS_100 = __VLS_98.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-weight-medium col" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    var __VLS_101 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_102 = __VLS_asFunctionalComponent1(__VLS_101, new __VLS_101(__assign({ 'onClick': {} }, { flat: true, icon: "refresh", label: "Tải lại", size: "sm", loading: (__VLS_ctx.reservationLoading) })));
    var __VLS_103 = __VLS_102.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, icon: "refresh", label: "Tải lại", size: "sm", loading: (__VLS_ctx.reservationLoading) })], __VLS_functionalComponentArgsRest(__VLS_102), false));
    var __VLS_106 = void 0;
    var __VLS_107 = ({ click: {} },
        { onClick: (__VLS_ctx.loadReservations) });
    var __VLS_104;
    var __VLS_105;
    if (__VLS_ctx.reservationSummary.length > 0) {
        var __VLS_108 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
        qTable;
        // @ts-ignore
        var __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108(__assign(__assign({ rows: (__VLS_ctx.reservationSummary), columns: (__VLS_ctx.reservationSummaryColumns), rowKey: "thread_type_id", flat: true, bordered: true, dense: true }, { class: "q-mb-md" }), { rowsPerPageOptions: ([0]), hidePagination: true })));
        var __VLS_110 = __VLS_109.apply(void 0, __spreadArray([__assign(__assign({ rows: (__VLS_ctx.reservationSummary), columns: (__VLS_ctx.reservationSummaryColumns), rowKey: "thread_type_id", flat: true, bordered: true, dense: true }, { class: "q-mb-md" }), { rowsPerPageOptions: ([0]), hidePagination: true })], __VLS_functionalComponentArgsRest(__VLS_109), false));
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
        var __VLS_113 = __VLS_111.slots.default;
        {
            var __VLS_114 = __VLS_111.slots["body-cell-status"];
            var props = __VLS_vSlot(__VLS_114)[0];
            var __VLS_115 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_116 = __VLS_asFunctionalComponent1(__VLS_115, new __VLS_115({
                props: (props),
            }));
            var __VLS_117 = __VLS_116.apply(void 0, __spreadArray([{
                    props: (props),
                }], __VLS_functionalComponentArgsRest(__VLS_116), false));
            var __VLS_120 = __VLS_118.slots.default;
            var __VLS_121 = AppBadge_vue_1.default;
            // @ts-ignore
            var __VLS_122 = __VLS_asFunctionalComponent1(__VLS_121, new __VLS_121({
                label: (props.row.shortage > 0 ? 'Thiếu' : 'Đủ'),
                color: (props.row.shortage > 0 ? 'negative' : 'positive'),
            }));
            var __VLS_123 = __VLS_122.apply(void 0, __spreadArray([{
                    label: (props.row.shortage > 0 ? 'Thiếu' : 'Đủ'),
                    color: (props.row.shortage > 0 ? 'negative' : 'positive'),
                }], __VLS_functionalComponentArgsRest(__VLS_122), false));
            // @ts-ignore
            [reservationLoading, loadReservations, reservationSummary, reservationSummary, reservationSummaryColumns,];
            var __VLS_118;
            // @ts-ignore
            [];
        }
        {
            var __VLS_126 = __VLS_111.slots["body-cell-actions"];
            var props_1 = __VLS_vSlot(__VLS_126)[0];
            var __VLS_127 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_128 = __VLS_asFunctionalComponent1(__VLS_127, new __VLS_127({
                props: (props_1),
            }));
            var __VLS_129 = __VLS_128.apply(void 0, __spreadArray([{
                    props: (props_1),
                }], __VLS_functionalComponentArgsRest(__VLS_128), false));
            var __VLS_132 = __VLS_130.slots.default;
            if (((_b = __VLS_ctx.week) === null || _b === void 0 ? void 0 : _b.status) === 'CONFIRMED' && props_1.row.shortage > 0 && props_1.row.available_stock > 0 && props_1.row.can_reserve) {
                var __VLS_133 = AppButton_vue_1.default;
                // @ts-ignore
                var __VLS_134 = __VLS_asFunctionalComponent1(__VLS_133, new __VLS_133(__assign({ 'onClick': {} }, { size: "sm", color: "primary", label: "Lấy từ tồn kho", flat: true, dense: true })));
                var __VLS_135 = __VLS_134.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { size: "sm", color: "primary", label: "Lấy từ tồn kho", flat: true, dense: true })], __VLS_functionalComponentArgsRest(__VLS_134), false));
                var __VLS_138 = void 0;
                var __VLS_139 = ({ click: {} },
                    { onClick: function () {
                            var _a;
                            var _b = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                _b[_i] = arguments[_i];
                            }
                            var $event = _b[0];
                            if (!!(__VLS_ctx.isLoading))
                                return;
                            if (!!(__VLS_ctx.notFound))
                                return;
                            if (!(__VLS_ctx.week))
                                return;
                            if (!(__VLS_ctx.reservationSummary.length > 0))
                                return;
                            if (!(((_a = __VLS_ctx.week) === null || _a === void 0 ? void 0 : _a.status) === 'CONFIRMED' && props_1.row.shortage > 0 && props_1.row.available_stock > 0 && props_1.row.can_reserve))
                                return;
                            __VLS_ctx.openReserveFromStockDialog(props_1.row, props_1.row.thread_type_name || String(props_1.row.thread_type_id));
                            // @ts-ignore
                            [week, openReserveFromStockDialog,];
                        } });
                var __VLS_136;
                var __VLS_137;
            }
            // @ts-ignore
            [];
            var __VLS_130;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_111;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-weight-medium q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_140 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_141 = __VLS_asFunctionalComponent1(__VLS_140, new __VLS_140({
        rows: (__VLS_ctx.reservedCones),
        columns: (__VLS_ctx.reservedConesColumns),
        rowKey: "id",
        flat: true,
        bordered: true,
        dense: true,
        loading: (__VLS_ctx.reservationLoading),
        rowsPerPageOptions: ([20, 50, 0]),
    }));
    var __VLS_142 = __VLS_141.apply(void 0, __spreadArray([{
            rows: (__VLS_ctx.reservedCones),
            columns: (__VLS_ctx.reservedConesColumns),
            rowKey: "id",
            flat: true,
            bordered: true,
            dense: true,
            loading: (__VLS_ctx.reservationLoading),
            rowsPerPageOptions: ([20, 50, 0]),
        }], __VLS_functionalComponentArgsRest(__VLS_141), false));
    var __VLS_145 = __VLS_143.slots.default;
    {
        var __VLS_146 = __VLS_143.slots["no-data"];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey q-pa-md" }));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        // @ts-ignore
        [reservationLoading, reservedCones, reservedConesColumns,];
    }
    // @ts-ignore
    [];
    var __VLS_143;
    // @ts-ignore
    [];
    var __VLS_98;
    var __VLS_147 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
    qTabPanel;
    // @ts-ignore
    var __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({
        name: "loans",
    }));
    var __VLS_149 = __VLS_148.apply(void 0, __spreadArray([{
            name: "loans",
        }], __VLS_functionalComponentArgsRest(__VLS_148), false));
    var __VLS_152 = __VLS_150.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-weight-medium col" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    if (__VLS_ctx.week.status === 'CONFIRMED') {
        var __VLS_153 = AppButton_vue_1.default;
        // @ts-ignore
        var __VLS_154 = __VLS_asFunctionalComponent1(__VLS_153, new __VLS_153(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Mượn chỉ", size: "sm" })));
        var __VLS_155 = __VLS_154.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Mượn chỉ", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_154), false));
        var __VLS_158 = void 0;
        var __VLS_159 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(__VLS_ctx.notFound))
                        return;
                    if (!(__VLS_ctx.week))
                        return;
                    if (!(__VLS_ctx.week.status === 'CONFIRMED'))
                        return;
                    __VLS_ctx.showLoanDialog = true;
                    // @ts-ignore
                    [week, showLoanDialog,];
                } });
        var __VLS_156;
        var __VLS_157;
    }
    var __VLS_160 = DataTable_vue_1.default || DataTable_vue_1.default;
    // @ts-ignore
    var __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160(__assign(__assign({ 'onRowClick': {} }, { rows: (__VLS_ctx.loans), columns: (__VLS_ctx.loanColumns), rowKey: "id", flat: true, bordered: true, dense: true, loading: (__VLS_ctx.loansLoading), rowsPerPageOptions: ([20, 50, 0]) }), { style: {} })));
    var __VLS_162 = __VLS_161.apply(void 0, __spreadArray([__assign(__assign({ 'onRowClick': {} }, { rows: (__VLS_ctx.loans), columns: (__VLS_ctx.loanColumns), rowKey: "id", flat: true, bordered: true, dense: true, loading: (__VLS_ctx.loansLoading), rowsPerPageOptions: ([20, 50, 0]) }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_161), false));
    var __VLS_165 = void 0;
    var __VLS_166 = ({ rowClick: {} },
        { onRowClick: (function (_evt, row) { return __VLS_ctx.openLoanDetail(row); }) });
    var __VLS_167 = __VLS_163.slots.default;
    {
        var __VLS_168 = __VLS_163.slots["body-cell-direction"];
        var props = __VLS_vSlot(__VLS_168)[0];
        var __VLS_169 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169({
            props: (props),
        }));
        var __VLS_171 = __VLS_170.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_170), false));
        var __VLS_174 = __VLS_172.slots.default;
        if (props.row.from_week_id === null) {
            var __VLS_175 = AppBadge_vue_1.default;
            // @ts-ignore
            var __VLS_176 = __VLS_asFunctionalComponent1(__VLS_175, new __VLS_175({
                label: "Tồn kho",
                color: "info",
            }));
            var __VLS_177 = __VLS_176.apply(void 0, __spreadArray([{
                    label: "Tồn kho",
                    color: "info",
                }], __VLS_functionalComponentArgsRest(__VLS_176), false));
        }
        else {
            var __VLS_180 = AppBadge_vue_1.default;
            // @ts-ignore
            var __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180({
                label: (props.row.to_week_id === __VLS_ctx.weekId ? 'Nhận' : 'Cho'),
                color: (props.row.to_week_id === __VLS_ctx.weekId ? 'positive' : 'warning'),
            }));
            var __VLS_182 = __VLS_181.apply(void 0, __spreadArray([{
                    label: (props.row.to_week_id === __VLS_ctx.weekId ? 'Nhận' : 'Cho'),
                    color: (props.row.to_week_id === __VLS_ctx.weekId ? 'positive' : 'warning'),
                }], __VLS_functionalComponentArgsRest(__VLS_181), false));
        }
        // @ts-ignore
        [loans, loanColumns, loansLoading, openLoanDetail, weekId, weekId,];
        var __VLS_172;
        // @ts-ignore
        [];
    }
    {
        var __VLS_185 = __VLS_163.slots["body-cell-status"];
        var props = __VLS_vSlot(__VLS_185)[0];
        var __VLS_186 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_187 = __VLS_asFunctionalComponent1(__VLS_186, new __VLS_186({
            props: (props),
        }));
        var __VLS_188 = __VLS_187.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_187), false));
        var __VLS_191 = __VLS_189.slots.default;
        var __VLS_192 = AppBadge_vue_1.default;
        // @ts-ignore
        var __VLS_193 = __VLS_asFunctionalComponent1(__VLS_192, new __VLS_192({
            label: (props.row.status === 'SETTLED' ? 'Đã trả' : 'Đang mượn'),
            color: (props.row.status === 'SETTLED' ? 'positive' : 'warning'),
        }));
        var __VLS_194 = __VLS_193.apply(void 0, __spreadArray([{
                label: (props.row.status === 'SETTLED' ? 'Đã trả' : 'Đang mượn'),
                color: (props.row.status === 'SETTLED' ? 'positive' : 'warning'),
            }], __VLS_functionalComponentArgsRest(__VLS_193), false));
        // @ts-ignore
        [];
        var __VLS_189;
        // @ts-ignore
        [];
    }
    {
        var __VLS_197 = __VLS_163.slots["body-cell-returned"];
        var props = __VLS_vSlot(__VLS_197)[0];
        var __VLS_198 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_199 = __VLS_asFunctionalComponent1(__VLS_198, new __VLS_198({
            props: (props),
        }));
        var __VLS_200 = __VLS_199.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_199), false));
        var __VLS_203 = __VLS_201.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (props.row.status === 'SETTLED' ? 'text-positive text-weight-medium' : 'text-body2') }));
        (props.row.returned_cones);
        (props.row.quantity_cones);
        // @ts-ignore
        [];
        var __VLS_201;
        // @ts-ignore
        [];
    }
    {
        var __VLS_204 = __VLS_163.slots["body-cell-actions"];
        var props_2 = __VLS_vSlot(__VLS_204)[0];
        var __VLS_205 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_206 = __VLS_asFunctionalComponent1(__VLS_205, new __VLS_205(__assign({ 'onClick': {} }, { props: (props_2) })));
        var __VLS_207 = __VLS_206.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { props: (props_2) })], __VLS_functionalComponentArgsRest(__VLS_206), false));
        var __VLS_210 = void 0;
        var __VLS_211 = ({ click: {} },
            { onClick: function () { } });
        var __VLS_212 = __VLS_208.slots.default;
        if (props_2.row.status === 'ACTIVE' && props_2.row.to_week_id === __VLS_ctx.weekId) {
            var __VLS_213 = AppButton_vue_1.default;
            // @ts-ignore
            var __VLS_214 = __VLS_asFunctionalComponent1(__VLS_213, new __VLS_213(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", icon: "undo", size: "sm", label: "Trả" })));
            var __VLS_215 = __VLS_214.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", icon: "undo", size: "sm", label: "Trả" })], __VLS_functionalComponentArgsRest(__VLS_214), false));
            var __VLS_218 = void 0;
            var __VLS_219 = ({ click: {} },
                { onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!!(__VLS_ctx.isLoading))
                            return;
                        if (!!(__VLS_ctx.notFound))
                            return;
                        if (!(__VLS_ctx.week))
                            return;
                        if (!(props_2.row.status === 'ACTIVE' && props_2.row.to_week_id === __VLS_ctx.weekId))
                            return;
                        __VLS_ctx.openLoanManualReturn(props_2.row);
                        // @ts-ignore
                        [weekId, openLoanManualReturn,];
                    } });
            var __VLS_216;
            var __VLS_217;
        }
        // @ts-ignore
        [];
        var __VLS_208;
        var __VLS_209;
        // @ts-ignore
        [];
    }
    {
        var __VLS_220 = __VLS_163.slots["no-data"];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey q-pa-md" }));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_163;
    var __VLS_164;
    // @ts-ignore
    [];
    var __VLS_150;
    var __VLS_221 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
    qTabPanel;
    // @ts-ignore
    var __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221({
        name: "deliveries",
    }));
    var __VLS_223 = __VLS_222.apply(void 0, __spreadArray([{
            name: "deliveries",
        }], __VLS_functionalComponentArgsRest(__VLS_222), false));
    var __VLS_226 = __VLS_224.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    var __VLS_227 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_228 = __VLS_asFunctionalComponent1(__VLS_227, new __VLS_227(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Quản lý giao hàng" })));
    var __VLS_229 = __VLS_228.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Quản lý giao hàng" })], __VLS_functionalComponentArgsRest(__VLS_228), false));
    var __VLS_232 = void 0;
    var __VLS_233 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!!(__VLS_ctx.notFound))
                    return;
                if (!(__VLS_ctx.week))
                    return;
                __VLS_ctx.router.push('/thread/weekly-order/deliveries');
                // @ts-ignore
                [router,];
            } });
    var __VLS_230;
    var __VLS_231;
    // @ts-ignore
    [];
    var __VLS_224;
    // @ts-ignore
    [];
    var __VLS_86;
}
if (__VLS_ctx.week) {
    var __VLS_234 = LoanDialog_vue_1.default;
    // @ts-ignore
    var __VLS_235 = __VLS_asFunctionalComponent1(__VLS_234, new __VLS_234(__assign({ 'onCreated': {} }, { modelValue: (__VLS_ctx.showLoanDialog), toWeekId: (__VLS_ctx.weekId), toWeekName: (__VLS_ctx.week.week_name) })));
    var __VLS_236 = __VLS_235.apply(void 0, __spreadArray([__assign({ 'onCreated': {} }, { modelValue: (__VLS_ctx.showLoanDialog), toWeekId: (__VLS_ctx.weekId), toWeekName: (__VLS_ctx.week.week_name) })], __VLS_functionalComponentArgsRest(__VLS_235), false));
    var __VLS_239 = void 0;
    var __VLS_240 = ({ created: {} },
        { onCreated: (__VLS_ctx.onLoanCreated) });
    var __VLS_237;
    var __VLS_238;
}
if (__VLS_ctx.week) {
    var __VLS_241 = ReserveFromStockDialog_vue_1.default;
    // @ts-ignore
    var __VLS_242 = __VLS_asFunctionalComponent1(__VLS_241, new __VLS_241(__assign({ 'onReserved': {} }, { modelValue: (__VLS_ctx.showReserveFromStockDialog), weekId: (__VLS_ctx.weekId), summaryItem: (__VLS_ctx.selectedReservationSummary), threadTypeName: (__VLS_ctx.selectedThreadTypeName) })));
    var __VLS_243 = __VLS_242.apply(void 0, __spreadArray([__assign({ 'onReserved': {} }, { modelValue: (__VLS_ctx.showReserveFromStockDialog), weekId: (__VLS_ctx.weekId), summaryItem: (__VLS_ctx.selectedReservationSummary), threadTypeName: (__VLS_ctx.selectedThreadTypeName) })], __VLS_functionalComponentArgsRest(__VLS_242), false));
    var __VLS_246 = void 0;
    var __VLS_247 = ({ reserved: {} },
        { onReserved: (__VLS_ctx.onReserveFromStockComplete) });
    var __VLS_244;
    var __VLS_245;
}
if (__VLS_ctx.loanDetailDialog.loan) {
    var __VLS_248 = LoanDetailDialog_vue_1.default;
    // @ts-ignore
    var __VLS_249 = __VLS_asFunctionalComponent1(__VLS_248, new __VLS_248(__assign({ 'onReturned': {} }, { modelValue: (__VLS_ctx.loanDetailDialog.open), loanId: (__VLS_ctx.loanDetailDialog.loan.id), initialLoan: (__VLS_ctx.loanDetailDialog.loan) })));
    var __VLS_250 = __VLS_249.apply(void 0, __spreadArray([__assign({ 'onReturned': {} }, { modelValue: (__VLS_ctx.loanDetailDialog.open), loanId: (__VLS_ctx.loanDetailDialog.loan.id), initialLoan: (__VLS_ctx.loanDetailDialog.loan) })], __VLS_functionalComponentArgsRest(__VLS_249), false));
    var __VLS_253 = void 0;
    var __VLS_254 = ({ returned: {} },
        { onReturned: (__VLS_ctx.loadLoans) });
    var __VLS_251;
    var __VLS_252;
}
if (__VLS_ctx.loanManualReturnDialog.loan) {
    var __VLS_255 = ManualReturnDialog_vue_1.default;
    // @ts-ignore
    var __VLS_256 = __VLS_asFunctionalComponent1(__VLS_255, new __VLS_255(__assign({ 'onReturned': {} }, { modelValue: (__VLS_ctx.loanManualReturnDialog.open), loan: (__VLS_ctx.loanManualReturnDialog.loan), weekId: (__VLS_ctx.weekId) })));
    var __VLS_257 = __VLS_256.apply(void 0, __spreadArray([__assign({ 'onReturned': {} }, { modelValue: (__VLS_ctx.loanManualReturnDialog.open), loan: (__VLS_ctx.loanManualReturnDialog.loan), weekId: (__VLS_ctx.weekId) })], __VLS_functionalComponentArgsRest(__VLS_256), false));
    var __VLS_260 = void 0;
    var __VLS_261 = ({ returned: {} },
        { onReturned: (__VLS_ctx.loadLoans) });
    var __VLS_258;
    var __VLS_259;
}
// @ts-ignore
[week, week, week, showLoanDialog, weekId, weekId, weekId, onLoanCreated, showReserveFromStockDialog, selectedReservationSummary, selectedThreadTypeName, onReserveFromStockComplete, loanDetailDialog, loanDetailDialog, loanDetailDialog, loanDetailDialog, loadLoans, loadLoans, loanManualReturnDialog, loanManualReturnDialog, loanManualReturnDialog,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
