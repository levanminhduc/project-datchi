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
var quasar_1 = require("quasar");
var useBatchOperations_1 = require("@/composables/useBatchOperations");
var composables_1 = require("@/composables");
var AppWarehouseSelect_vue_1 = require("@/components/ui/inputs/AppWarehouseSelect.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var utils_1 = require("@/utils");
var $q = (0, quasar_1.useQuasar)();
var _m = (0, useBatchOperations_1.useBatchOperations)(), transactions = _m.transactions, loading = _m.loading, fetchTransactions = _m.fetchTransactions;
var fetchWarehouses = (0, composables_1.useWarehouses)().fetchWarehouses;
// State
var showDetailDialog = (0, vue_1.ref)(false);
var selectedTransaction = (0, vue_1.ref)(null);
var filters = (0, vue_1.ref)({
    operation_type: undefined,
    warehouse_id: undefined,
    from_date: undefined,
    to_date: undefined
});
var pagination = (0, vue_1.ref)({
    page: 1,
    rowsPerPage: 25,
    sortBy: 'performed_at',
    descending: true
});
// Options
var operationTypeOptions = [
    { label: 'Nhập kho', value: 'RECEIVE' },
    { label: 'Chuyển kho', value: 'TRANSFER' },
    { label: 'Xuất kho', value: 'ISSUE' },
    { label: 'Trả lại', value: 'RETURN' }
];
// Table columns
var columns = [
    { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
    { name: 'operation_type', label: 'Loại', field: 'operation_type', align: 'left', sortable: true },
    { name: 'cone_count', label: 'Số cuộn', field: 'cone_count', align: 'left', sortable: true },
    { name: 'warehouses', label: 'Kho', field: 'warehouses', align: 'left' },
    { name: 'recipient', label: 'Người nhận', field: 'recipient', align: 'left' },
    { name: 'performed_at', label: 'Thời gian', field: 'performed_at', align: 'left', sortable: true },
    { name: 'actions', label: '', field: 'actions', align: 'right' }
];
// Helpers
function getOperationColor(type) {
    switch (type) {
        case 'RECEIVE': return 'positive';
        case 'TRANSFER': return 'info';
        case 'ISSUE': return 'warning';
        case 'RETURN': return 'secondary';
        default: return 'grey';
    }
}
function getOperationIcon(type) {
    switch (type) {
        case 'RECEIVE': return 'input';
        case 'TRANSFER': return 'swap_horiz';
        case 'ISSUE': return 'output';
        case 'RETURN': return 'undo';
        default: return 'help';
    }
}
function getOperationLabel(type) {
    switch (type) {
        case 'RECEIVE': return 'Nhập';
        case 'TRANSFER': return 'Chuyển';
        case 'ISSUE': return 'Xuất';
        case 'RETURN': return 'Trả';
        default: return type;
    }
}
function formatDate(dateStr) {
    if (!dateStr)
        return '-';
    var date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
}
function formatDateTime(dateStr) {
    if (!dateStr)
        return '-';
    var date = new Date(dateStr);
    return date.toLocaleString('vi-VN');
}
// Actions
function applyFilters() {
    return __awaiter(this, void 0, void 0, function () {
        var activeFilters;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    activeFilters = {};
                    if (filters.value.operation_type) {
                        activeFilters.operation_type = filters.value.operation_type;
                    }
                    if (filters.value.warehouse_id) {
                        activeFilters.warehouse_id = filters.value.warehouse_id;
                    }
                    if (filters.value.from_date) {
                        activeFilters.from_date = filters.value.from_date;
                    }
                    if (filters.value.to_date) {
                        activeFilters.to_date = filters.value.to_date;
                    }
                    return [4 /*yield*/, fetchTransactions(Object.keys(activeFilters).length > 0 ? activeFilters : undefined)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function resetFilters() {
    filters.value = {
        operation_type: undefined,
        warehouse_id: undefined,
        from_date: undefined,
        to_date: undefined
    };
    applyFilters();
}
function viewTransaction(transaction) {
    selectedTransaction.value = transaction;
    showDetailDialog.value = true;
}
function handleExportXlsx() {
    return __awaiter(this, void 0, void 0, function () {
        var ExcelJS, workbook, worksheet_1, buffer, blob, link, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (transactions.value.length === 0)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('exceljs'); })];
                case 2:
                    ExcelJS = _a.sent();
                    workbook = new ExcelJS.Workbook();
                    worksheet_1 = workbook.addWorksheet('Lịch Sử Thao Tác');
                    worksheet_1.columns = [
                        { header: 'ID', key: 'id', width: 10 },
                        { header: 'Loại thao tác', key: 'operation_type', width: 18 },
                        { header: 'Số cuộn', key: 'cone_count', width: 10 },
                        { header: 'Kho xuất', key: 'from_warehouse', width: 18 },
                        { header: 'Kho nhận', key: 'to_warehouse', width: 18 },
                        { header: 'Người nhận', key: 'recipient', width: 18 },
                        { header: 'Số tham chiếu', key: 'reference_number', width: 18 },
                        { header: 'Ghi chú', key: 'notes', width: 25 },
                        { header: 'Thực hiện bởi', key: 'performed_by', width: 18 },
                        { header: 'Thời gian', key: 'performed_at', width: 20 },
                    ];
                    // Style header row
                    worksheet_1.getRow(1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF1976D2' },
                    };
                    worksheet_1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    transactions.value.forEach(function (t) {
                        var _a, _b;
                        worksheet_1.addRow({
                            id: t.id,
                            operation_type: getOperationLabel(t.operation_type),
                            cone_count: t.cone_count,
                            from_warehouse: ((_a = t.from_warehouse) === null || _a === void 0 ? void 0 : _a.name) || '',
                            to_warehouse: ((_b = t.to_warehouse) === null || _b === void 0 ? void 0 : _b.name) || '',
                            recipient: t.recipient || '',
                            reference_number: t.reference_number || '',
                            notes: t.notes || '',
                            performed_by: t.performed_by || '',
                            performed_at: formatDateTime(t.performed_at),
                        });
                    });
                    return [4 /*yield*/, workbook.xlsx.writeBuffer()];
                case 3:
                    buffer = _a.sent();
                    blob = new Blob([buffer], {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    });
                    link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = "lich-su-thao-tac-".concat(new Date().toISOString().slice(0, 10), ".xlsx");
                    link.click();
                    URL.revokeObjectURL(link.href);
                    return [3 /*break*/, 5];
                case 4:
                    err_1 = _a.sent();
                    console.error('[batch-history] export error:', err_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    fetchWarehouses(),
                    fetchTransactions()
                ])];
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
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
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
            __VLS_ctx.$router.push('/kho');
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
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ 'onClick': {} }, { color: "primary", label: "Xuất Excel", icon: "download", disable: (__VLS_ctx.transactions.length === 0) })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Xuất Excel", icon: "download", disable: (__VLS_ctx.transactions.length === 0) })], __VLS_functionalComponentArgsRest(__VLS_20), false));
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_38 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
    modelValue: (__VLS_ctx.filters.operation_type),
    options: (__VLS_ctx.operationTypeOptions),
    label: "Loại thao tác",
    clearable: true,
    dense: true,
    hideBottomSpace: true,
}));
var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.operation_type),
        options: (__VLS_ctx.operationTypeOptions),
        label: "Loại thao tác",
        clearable: true,
        dense: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_39), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_43 = AppWarehouseSelect_vue_1.default;
// @ts-ignore
var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
    modelValue: (__VLS_ctx.filters.warehouse_id),
    label: "Kho",
    clearable: true,
    dense: true,
    hideBottomSpace: true,
}));
var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.warehouse_id),
        label: "Kho",
        clearable: true,
        dense: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_44), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_48 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
    modelValue: (__VLS_ctx.filters.from_date),
    label: "Từ ngày",
    placeholder: "DD/MM/YYYY",
    rules: ([__VLS_ctx.dateRules.date]),
    dense: true,
    clearable: true,
    hideBottomSpace: true,
}));
var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.from_date),
        label: "Từ ngày",
        placeholder: "DD/MM/YYYY",
        rules: ([__VLS_ctx.dateRules.date]),
        dense: true,
        clearable: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_49), false));
var __VLS_53 = __VLS_51.slots.default;
{
    var __VLS_54 = __VLS_51.slots.append;
    var __VLS_55 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_56), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_60 = __VLS_58.slots.default;
    var __VLS_61 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_63 = __VLS_62.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_62), false));
    var __VLS_66 = __VLS_64.slots.default;
    var __VLS_67 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({
        modelValue: (__VLS_ctx.filters.from_date),
    }));
    var __VLS_69 = __VLS_68.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.filters.from_date),
        }], __VLS_functionalComponentArgsRest(__VLS_68), false));
    // @ts-ignore
    [transactions, handleExportXlsx, $q, filters, filters, filters, filters, operationTypeOptions, utils_1.dateRules,];
    var __VLS_64;
    // @ts-ignore
    [];
    var __VLS_58;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_51;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_72 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
    modelValue: (__VLS_ctx.filters.to_date),
    label: "Đến ngày",
    placeholder: "DD/MM/YYYY",
    rules: ([__VLS_ctx.dateRules.date]),
    dense: true,
    clearable: true,
    hideBottomSpace: true,
}));
var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.to_date),
        label: "Đến ngày",
        placeholder: "DD/MM/YYYY",
        rules: ([__VLS_ctx.dateRules.date]),
        dense: true,
        clearable: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_73), false));
var __VLS_77 = __VLS_75.slots.default;
{
    var __VLS_78 = __VLS_75.slots.append;
    var __VLS_79 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_80), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_84 = __VLS_82.slots.default;
    var __VLS_85 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_86), false));
    var __VLS_90 = __VLS_88.slots.default;
    var __VLS_91 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91({
        modelValue: (__VLS_ctx.filters.to_date),
    }));
    var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.filters.to_date),
        }], __VLS_functionalComponentArgsRest(__VLS_92), false));
    // @ts-ignore
    [filters, filters, utils_1.dateRules,];
    var __VLS_88;
    // @ts-ignore
    [];
    var __VLS_82;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_75;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_96;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96(__assign(__assign(__assign({ 'onClick': {} }, { color: "primary", label: "Tìm", icon: "search" }), { class: "full-width-xs" }), { loading: (__VLS_ctx.loading) })));
var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { color: "primary", label: "Tìm", icon: "search" }), { class: "full-width-xs" }), { loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_97), false));
var __VLS_101;
var __VLS_102 = ({ click: {} },
    { onClick: (__VLS_ctx.applyFilters) });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_99;
var __VLS_100;
var __VLS_103;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_104 = __VLS_asFunctionalComponent1(__VLS_103, new __VLS_103(__assign(__assign({ 'onClick': {} }, { flat: true, color: "grey", label: "Xóa" }), { class: "full-width-xs" })));
var __VLS_105 = __VLS_104.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { flat: true, color: "grey", label: "Xóa" }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_104), false));
var __VLS_108;
var __VLS_109 = ({ click: {} },
    { onClick: (__VLS_ctx.resetFilters) });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_106;
var __VLS_107;
// @ts-ignore
[loading, applyFilters, resetFilters,];
var __VLS_35;
// @ts-ignore
[];
var __VLS_29;
var __VLS_110;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
    flat: true,
    bordered: true,
}));
var __VLS_112 = __VLS_111.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_111), false));
var __VLS_115 = __VLS_113.slots.default;
var __VLS_116;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116(__assign(__assign({ 'onUpdate:pagination': {} }, { rows: (__VLS_ctx.transactions), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.loading), pagination: (__VLS_ctx.pagination), rowsPerPageOptions: ([10, 25, 50, 100]) }), { class: "history-table" })));
var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:pagination': {} }, { rows: (__VLS_ctx.transactions), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.loading), pagination: (__VLS_ctx.pagination), rowsPerPageOptions: ([10, 25, 50, 100]) }), { class: "history-table" })], __VLS_functionalComponentArgsRest(__VLS_117), false));
var __VLS_121;
var __VLS_122 = ({ 'update:pagination': {} },
    { 'onUpdate:pagination': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.pagination = $event;
            // @ts-ignore
            [transactions, loading, columns, pagination, pagination,];
        } });
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
var __VLS_123 = __VLS_119.slots.default;
{
    var __VLS_124 = __VLS_119.slots["body-cell-operation_type"];
    var props = __VLS_vSlot(__VLS_124)[0];
    var __VLS_125 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125({
        props: (props),
    }));
    var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_126), false));
    var __VLS_130 = __VLS_128.slots.default;
    var __VLS_131 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131({
        color: (__VLS_ctx.getOperationColor(props.row.operation_type)),
        textColor: "white",
        dense: true,
        size: "sm",
    }));
    var __VLS_133 = __VLS_132.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getOperationColor(props.row.operation_type)),
            textColor: "white",
            dense: true,
            size: "sm",
        }], __VLS_functionalComponentArgsRest(__VLS_132), false));
    var __VLS_136 = __VLS_134.slots.default;
    var __VLS_137 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137(__assign({ name: (__VLS_ctx.getOperationIcon(props.row.operation_type)), size: "xs" }, { class: "q-mr-xs" })));
    var __VLS_139 = __VLS_138.apply(void 0, __spreadArray([__assign({ name: (__VLS_ctx.getOperationIcon(props.row.operation_type)), size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_138), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    (__VLS_ctx.getOperationLabel(props.row.operation_type));
    // @ts-ignore
    [getOperationColor, getOperationIcon, getOperationLabel,];
    var __VLS_134;
    // @ts-ignore
    [];
    var __VLS_128;
    // @ts-ignore
    [];
}
{
    var __VLS_142 = __VLS_119.slots["body-cell-cone_count"];
    var props = __VLS_vSlot(__VLS_142)[0];
    var __VLS_143 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
        props: (props),
    }));
    var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_144), false));
    var __VLS_148 = __VLS_146.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-bold" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (props.row.cone_count);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-6 q-ml-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
    // @ts-ignore
    [];
    var __VLS_146;
    // @ts-ignore
    [];
}
{
    var __VLS_149 = __VLS_119.slots["body-cell-warehouses"];
    var props = __VLS_vSlot(__VLS_149)[0];
    var __VLS_150 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({
        props: (props),
    }));
    var __VLS_152 = __VLS_151.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_151), false));
    var __VLS_155 = __VLS_153.slots.default;
    if (props.row.operation_type === 'TRANSFER') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (((_a = props.row.from_warehouse) === null || _a === void 0 ? void 0 : _a.name) || '-');
        var __VLS_156 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_157 = __VLS_asFunctionalComponent1(__VLS_156, new __VLS_156(__assign({ name: "arrow_forward", size: "xs" }, { class: "q-mx-xs text-grey" })));
        var __VLS_158 = __VLS_157.apply(void 0, __spreadArray([__assign({ name: "arrow_forward", size: "xs" }, { class: "q-mx-xs text-grey" })], __VLS_functionalComponentArgsRest(__VLS_157), false));
        /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (((_b = props.row.to_warehouse) === null || _b === void 0 ? void 0 : _b.name) || '-');
    }
    else if (props.row.operation_type === 'RECEIVE') {
        (((_c = props.row.to_warehouse) === null || _c === void 0 ? void 0 : _c.name) || '-');
    }
    else {
        (((_d = props.row.from_warehouse) === null || _d === void 0 ? void 0 : _d.name) || '-');
    }
    // @ts-ignore
    [];
    var __VLS_153;
    // @ts-ignore
    [];
}
{
    var __VLS_161 = __VLS_119.slots["body-cell-recipient"];
    var props = __VLS_vSlot(__VLS_161)[0];
    var __VLS_162 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_163 = __VLS_asFunctionalComponent1(__VLS_162, new __VLS_162({
        props: (props),
    }));
    var __VLS_164 = __VLS_163.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_163), false));
    var __VLS_167 = __VLS_165.slots.default;
    (props.row.recipient || '-');
    // @ts-ignore
    [];
    var __VLS_165;
    // @ts-ignore
    [];
}
{
    var __VLS_168 = __VLS_119.slots["body-cell-performed_at"];
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
    (__VLS_ctx.formatDate(props.row.performed_at));
    // @ts-ignore
    [formatDate,];
    var __VLS_172;
    // @ts-ignore
    [];
}
{
    var __VLS_175 = __VLS_119.slots["body-cell-actions"];
    var props_1 = __VLS_vSlot(__VLS_175)[0];
    var __VLS_176 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_177 = __VLS_asFunctionalComponent1(__VLS_176, new __VLS_176({
        props: (props_1),
    }));
    var __VLS_178 = __VLS_177.apply(void 0, __spreadArray([{
            props: (props_1),
        }], __VLS_functionalComponentArgsRest(__VLS_177), false));
    var __VLS_181 = __VLS_179.slots.default;
    var __VLS_182 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_183 = __VLS_asFunctionalComponent1(__VLS_182, new __VLS_182(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "visibility", color: "primary" })));
    var __VLS_184 = __VLS_183.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "visibility", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_183), false));
    var __VLS_187 = void 0;
    var __VLS_188 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.viewTransaction(props_1.row);
                // @ts-ignore
                [viewTransaction,];
            } });
    var __VLS_189 = __VLS_185.slots.default;
    var __VLS_190 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_191 = __VLS_asFunctionalComponent1(__VLS_190, new __VLS_190({}));
    var __VLS_192 = __VLS_191.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_191), false));
    var __VLS_195 = __VLS_193.slots.default;
    // @ts-ignore
    [];
    var __VLS_193;
    // @ts-ignore
    [];
    var __VLS_185;
    var __VLS_186;
    // @ts-ignore
    [];
    var __VLS_179;
    // @ts-ignore
    [];
}
{
    var __VLS_196 = __VLS_119.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-py-xl text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    var __VLS_197 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_198 = __VLS_asFunctionalComponent1(__VLS_197, new __VLS_197({
        name: "history",
        size: "48px",
    }));
    var __VLS_199 = __VLS_198.apply(void 0, __spreadArray([{
            name: "history",
            size: "48px",
        }], __VLS_functionalComponentArgsRest(__VLS_198), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_119;
var __VLS_120;
// @ts-ignore
[];
var __VLS_113;
var __VLS_202;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_203 = __VLS_asFunctionalComponent1(__VLS_202, new __VLS_202({
    modelValue: (__VLS_ctx.showDetailDialog),
}));
var __VLS_204 = __VLS_203.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showDetailDialog),
    }], __VLS_functionalComponentArgsRest(__VLS_203), false));
var __VLS_207 = __VLS_205.slots.default;
var __VLS_208;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_209 = __VLS_asFunctionalComponent1(__VLS_208, new __VLS_208(__assign({ style: {} })));
var __VLS_210 = __VLS_209.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_209), false));
var __VLS_213 = __VLS_211.slots.default;
var __VLS_214;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_215 = __VLS_asFunctionalComponent1(__VLS_214, new __VLS_214(__assign({ class: "row items-center q-pb-none" })));
var __VLS_216 = __VLS_215.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_215), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_219 = __VLS_217.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
((_e = __VLS_ctx.selectedTransaction) === null || _e === void 0 ? void 0 : _e.id);
var __VLS_220;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_221 = __VLS_asFunctionalComponent1(__VLS_220, new __VLS_220({}));
var __VLS_222 = __VLS_221.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_221), false));
var __VLS_225;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_226 = __VLS_asFunctionalComponent1(__VLS_225, new __VLS_225(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close" })));
var __VLS_227 = __VLS_226.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close" })], __VLS_functionalComponentArgsRest(__VLS_226), false));
var __VLS_230;
var __VLS_231 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showDetailDialog = false;
            // @ts-ignore
            [showDetailDialog, showDetailDialog, selectedTransaction,];
        } });
var __VLS_228;
var __VLS_229;
// @ts-ignore
[];
var __VLS_217;
if (__VLS_ctx.selectedTransaction) {
    var __VLS_232 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_233 = __VLS_asFunctionalComponent1(__VLS_232, new __VLS_232({}));
    var __VLS_234 = __VLS_233.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_233), false));
    var __VLS_237 = __VLS_235.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_238 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_239 = __VLS_asFunctionalComponent1(__VLS_238, new __VLS_238({
        color: (__VLS_ctx.getOperationColor(__VLS_ctx.selectedTransaction.operation_type)),
        textColor: "white",
        size: "md",
    }));
    var __VLS_240 = __VLS_239.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getOperationColor(__VLS_ctx.selectedTransaction.operation_type)),
            textColor: "white",
            size: "md",
        }], __VLS_functionalComponentArgsRest(__VLS_239), false));
    var __VLS_243 = __VLS_241.slots.default;
    var __VLS_244 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_245 = __VLS_asFunctionalComponent1(__VLS_244, new __VLS_244(__assign({ name: (__VLS_ctx.getOperationIcon(__VLS_ctx.selectedTransaction.operation_type)), size: "sm" }, { class: "q-mr-xs" })));
    var __VLS_246 = __VLS_245.apply(void 0, __spreadArray([__assign({ name: (__VLS_ctx.getOperationIcon(__VLS_ctx.selectedTransaction.operation_type)), size: "sm" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_245), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    (__VLS_ctx.getOperationLabel(__VLS_ctx.selectedTransaction.operation_type));
    // @ts-ignore
    [getOperationColor, getOperationIcon, getOperationLabel, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction,];
    var __VLS_241;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-ml-md text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['q-ml-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    (__VLS_ctx.formatDateTime(__VLS_ctx.selectedTransaction.performed_at));
    var __VLS_249 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_250 = __VLS_asFunctionalComponent1(__VLS_249, new __VLS_249(__assign({ class: "q-my-md" })));
    var __VLS_251 = __VLS_250.apply(void 0, __spreadArray([__assign({ class: "q-my-md" })], __VLS_functionalComponentArgsRest(__VLS_250), false));
    /** @type {__VLS_StyleScopedClasses['q-my-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1 text-weight-bold" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (__VLS_ctx.selectedTransaction.cone_count);
    if (__VLS_ctx.selectedTransaction.lot) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
        /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
        /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
        (__VLS_ctx.selectedTransaction.lot.lot_number);
    }
    if (__VLS_ctx.selectedTransaction.operation_type === 'TRANSFER') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
        /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
        /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
        (((_f = __VLS_ctx.selectedTransaction.from_warehouse) === null || _f === void 0 ? void 0 : _f.name) || '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
        /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
        /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
        (((_g = __VLS_ctx.selectedTransaction.to_warehouse) === null || _g === void 0 ? void 0 : _g.name) || '-');
    }
    else if (__VLS_ctx.selectedTransaction.operation_type === 'RECEIVE') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
        /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
        /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
        (((_h = __VLS_ctx.selectedTransaction.to_warehouse) === null || _h === void 0 ? void 0 : _h.name) || '-');
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
        /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
        /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
        (((_j = __VLS_ctx.selectedTransaction.from_warehouse) === null || _j === void 0 ? void 0 : _j.name) || '-');
    }
    if (__VLS_ctx.selectedTransaction.recipient) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
        /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
        /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
        (__VLS_ctx.selectedTransaction.recipient);
    }
    if (__VLS_ctx.selectedTransaction.reference_number) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
        /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
        /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
        (__VLS_ctx.selectedTransaction.reference_number);
    }
    if (__VLS_ctx.selectedTransaction.performed_by) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
        /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
        /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
        (__VLS_ctx.selectedTransaction.performed_by);
    }
    if (__VLS_ctx.selectedTransaction.notes) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
        /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
        (__VLS_ctx.selectedTransaction.notes);
    }
    var __VLS_254 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_255 = __VLS_asFunctionalComponent1(__VLS_254, new __VLS_254(__assign({ class: "q-my-md" })));
    var __VLS_256 = __VLS_255.apply(void 0, __spreadArray([__assign({ class: "q-my-md" })], __VLS_functionalComponentArgsRest(__VLS_255), false));
    /** @type {__VLS_StyleScopedClasses['q-my-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    (((_k = __VLS_ctx.selectedTransaction.cone_ids) === null || _k === void 0 ? void 0 : _k.length) || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cone-id-grid" }));
    /** @type {__VLS_StyleScopedClasses['cone-id-grid']} */ ;
    for (var _i = 0, _o = __VLS_vFor(((__VLS_ctx.selectedTransaction.cone_ids || []).slice(0, 50))); _i < _o.length; _i++) {
        var coneId = _o[_i][0];
        var __VLS_259 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
        qChip;
        // @ts-ignore
        var __VLS_260 = __VLS_asFunctionalComponent1(__VLS_259, new __VLS_259({
            key: (coneId),
            dense: true,
            size: "sm",
            color: "grey-3",
        }));
        var __VLS_261 = __VLS_260.apply(void 0, __spreadArray([{
                key: (coneId),
                dense: true,
                size: "sm",
                color: "grey-3",
            }], __VLS_functionalComponentArgsRest(__VLS_260), false));
        var __VLS_264 = __VLS_262.slots.default;
        (coneId);
        // @ts-ignore
        [selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, selectedTransaction, formatDateTime,];
        var __VLS_262;
        // @ts-ignore
        [];
    }
    if ((((_l = __VLS_ctx.selectedTransaction.cone_ids) === null || _l === void 0 ? void 0 : _l.length) || 0) > 50) {
        var __VLS_265 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
        qChip;
        // @ts-ignore
        var __VLS_266 = __VLS_asFunctionalComponent1(__VLS_265, new __VLS_265({
            dense: true,
            size: "sm",
            color: "primary",
            textColor: "white",
        }));
        var __VLS_267 = __VLS_266.apply(void 0, __spreadArray([{
                dense: true,
                size: "sm",
                color: "primary",
                textColor: "white",
            }], __VLS_functionalComponentArgsRest(__VLS_266), false));
        var __VLS_270 = __VLS_268.slots.default;
        (__VLS_ctx.selectedTransaction.cone_ids.length - 50);
        // @ts-ignore
        [selectedTransaction, selectedTransaction,];
        var __VLS_268;
    }
    // @ts-ignore
    [];
    var __VLS_235;
}
var __VLS_271;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_272 = __VLS_asFunctionalComponent1(__VLS_271, new __VLS_271({
    align: "right",
}));
var __VLS_273 = __VLS_272.apply(void 0, __spreadArray([{
        align: "right",
    }], __VLS_functionalComponentArgsRest(__VLS_272), false));
var __VLS_276 = __VLS_274.slots.default;
var __VLS_277;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_278 = __VLS_asFunctionalComponent1(__VLS_277, new __VLS_277(__assign({ 'onClick': {} }, { flat: true, label: "Đóng", color: "primary" })));
var __VLS_279 = __VLS_278.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Đóng", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_278), false));
var __VLS_282;
var __VLS_283 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showDetailDialog = false;
            // @ts-ignore
            [showDetailDialog,];
        } });
var __VLS_280;
var __VLS_281;
// @ts-ignore
[];
var __VLS_274;
// @ts-ignore
[];
var __VLS_211;
// @ts-ignore
[];
var __VLS_205;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
