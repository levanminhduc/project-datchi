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
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var weeklyOrderService_1 = require("@/services/weeklyOrderService");
var useSnackbar_1 = require("@/composables/useSnackbar");
var AppDialog_vue_1 = require("@/components/ui/dialogs/AppDialog.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var props = defineProps();
var __VLS_emit = defineEmits();
var snackbar = (0, useSnackbar_1.useSnackbar)();
var loading = (0, vue_1.ref)(false);
var rows = (0, vue_1.ref)([]);
var selectedStatus = (0, vue_1.ref)('CONFIRMED');
var selectedWeekId = (0, vue_1.ref)(null);
var statusOptions = [
    { label: 'Nháp', value: 'DRAFT' },
    { label: 'Đã xác nhận', value: 'CONFIRMED' },
    { label: 'Hoàn thành', value: 'COMPLETED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
];
var statusLabelMap = {
    DRAFT: 'nháp',
    CONFIRMED: 'đã xác nhận',
    COMPLETED: 'hoàn thành',
    CANCELLED: 'đã hủy',
};
var weekOptions = (0, vue_1.computed)(function () {
    var seen = new Map();
    for (var _i = 0, _a = rows.value; _i < _a.length; _i++) {
        var r = _a[_i];
        if (!seen.has(r.week_id))
            seen.set(r.week_id, r.week_name);
    }
    return Array.from(seen, function (_a) {
        var value = _a[0], label = _a[1];
        return ({ label: label, value: value });
    });
});
var filteredRows = (0, vue_1.computed)(function () {
    if (!selectedWeekId.value)
        return rows.value;
    return rows.value.filter(function (r) { return r.week_id === selectedWeekId.value; });
});
var emptyMessage = (0, vue_1.computed)(function () {
    var _a, _b;
    if (selectedWeekId.value) {
        var weekName = (_a = weekOptions.value.find(function (o) { return o.value === selectedWeekId.value; })) === null || _a === void 0 ? void 0 : _a.label;
        return "Tu\u1EA7n \"".concat(weekName, "\" ch\u01B0a c\u00F3 lo\u1EA1i ch\u1EC9 n\u00E0o \u0111\u01B0\u1EE3c g\u00E1n");
    }
    if (selectedStatus.value) {
        return "Ch\u01B0a c\u00F3 tu\u1EA7n \u0111\u1EB7t h\u00E0ng n\u00E0o \u1EDF tr\u1EA1ng th\u00E1i ".concat((_b = statusLabelMap[selectedStatus.value]) !== null && _b !== void 0 ? _b : selectedStatus.value);
    }
    return 'Chưa có tuần đặt hàng nào được xác nhận';
});
var columns = (0, vue_1.computed)(function () {
    var cols = [];
    if (!selectedWeekId.value) {
        cols.push({ name: 'week_name', label: 'Tuần', field: 'week_name', align: 'left', sortable: true });
    }
    cols.push({ name: 'thread_type_code', label: 'Loại chỉ', field: function (row) { return row.thread_type_name || row.thread_type_code; }, align: 'left', sortable: true }, { name: 'planned_cones', label: 'Kế hoạch', field: 'planned_cones', align: 'right', sortable: true }, { name: 'reserved_cones', label: 'Đã giữ', field: 'reserved_cones', align: 'right', sortable: true }, { name: 'allocated_cones', label: 'Đã cấp', field: 'allocated_cones', align: 'right', sortable: true }, { name: 'gap', label: 'Chênh lệch', field: 'gap', align: 'right', sortable: true });
    return cols;
});
var rowsWithKey = (0, vue_1.computed)(function () {
    return filteredRows.value.map(function (r) { return (__assign(__assign({}, r), { row_key: "".concat(r.week_id, "_").concat(r.thread_type_id) })); });
});
function handleStatusChange() {
    selectedWeekId.value = null;
    fetchData();
}
function fetchData() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, err_1;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    loading.value = true;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    _a = rows;
                    return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getAssignmentSummary((_b = selectedStatus.value) !== null && _b !== void 0 ? _b : undefined)];
                case 2:
                    _a.value = _c.sent();
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _c.sent();
                    snackbar.error((err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || 'Không thể tải dữ liệu kiểm soát chỉ');
                    return [3 /*break*/, 5];
                case 4:
                    loading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.watch)(function () { return props.modelValue; }, function (val) {
    if (val)
        fetchData();
});
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = AppDialog_vue_1.default || AppDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$emit('update:modelValue', $event);
            // @ts-ignore
            [modelValue, $emit,];
        } });
var __VLS_7 = {};
var __VLS_8 = __VLS_3.slots.default;
{
    var __VLS_9 = __VLS_3.slots.header;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ style: {} }));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
var __VLS_10 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.selectedStatus), options: (__VLS_ctx.statusOptions), label: "Lọc theo trạng thái tuần", emitValue: true, mapOptions: true, clearable: true, dense: true, hideBottomSpace: true })));
var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.selectedStatus), options: (__VLS_ctx.statusOptions), label: "Lọc theo trạng thái tuần", emitValue: true, mapOptions: true, clearable: true, dense: true, hideBottomSpace: true })], __VLS_functionalComponentArgsRest(__VLS_11), false));
var __VLS_15;
var __VLS_16 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleStatusChange) });
var __VLS_13;
var __VLS_14;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
var __VLS_17 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
    modelValue: (__VLS_ctx.selectedWeekId),
    options: (__VLS_ctx.weekOptions),
    label: "Chọn tuần",
    emitValue: true,
    mapOptions: true,
    clearable: true,
    dense: true,
    hideBottomSpace: true,
}));
var __VLS_19 = __VLS_18.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.selectedWeekId),
        options: (__VLS_ctx.weekOptions),
        label: "Chọn tuần",
        emitValue: true,
        mapOptions: true,
        clearable: true,
        dense: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_18), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
/** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
var __VLS_22 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22(__assign({ 'onClick': {} }, { flat: true, icon: "refresh", label: "Làm mới", loading: (__VLS_ctx.loading) })));
var __VLS_24 = __VLS_23.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, icon: "refresh", label: "Làm mới", loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_23), false));
var __VLS_27;
var __VLS_28 = ({ click: {} },
    { onClick: (__VLS_ctx.fetchData) });
var __VLS_25;
var __VLS_26;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    'aria-busy': (__VLS_ctx.loading),
    'aria-live': "polite",
});
var __VLS_29;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
    rows: (__VLS_ctx.rowsWithKey),
    columns: (__VLS_ctx.columns),
    rowKey: "row_key",
    flat: true,
    bordered: true,
    dense: true,
    loading: (__VLS_ctx.loading),
    rowsPerPageOptions: ([0]),
    hidePagination: true,
    title: "Thống kê chỉ đã gán",
}));
var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{
        rows: (__VLS_ctx.rowsWithKey),
        columns: (__VLS_ctx.columns),
        rowKey: "row_key",
        flat: true,
        bordered: true,
        dense: true,
        loading: (__VLS_ctx.loading),
        rowsPerPageOptions: ([0]),
        hidePagination: true,
        title: "Thống kê chỉ đã gán",
    }], __VLS_functionalComponentArgsRest(__VLS_30), false));
var __VLS_34 = __VLS_32.slots.default;
{
    var __VLS_35 = __VLS_32.slots.loading;
    var __VLS_36 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
    qInnerLoading;
    // @ts-ignore
    var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        showing: true,
    }));
    var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([{
            showing: true,
        }], __VLS_functionalComponentArgsRest(__VLS_37), false));
    var __VLS_41 = __VLS_39.slots.default;
    var __VLS_42 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
        size: "40px",
        color: "primary",
    }));
    var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{
            size: "40px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_43), false));
    // @ts-ignore
    [selectedStatus, statusOptions, handleStatusChange, selectedWeekId, weekOptions, loading, loading, loading, fetchData, rowsWithKey, columns,];
    var __VLS_39;
    // @ts-ignore
    [];
}
{
    var __VLS_47 = __VLS_32.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "full-width text-center text-grey q-pa-md" }));
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    (__VLS_ctx.emptyMessage);
    // @ts-ignore
    [emptyMessage,];
}
{
    var __VLS_48 = __VLS_32.slots["body-cell-gap"];
    var cellProps = __VLS_vSlot(__VLS_48)[0];
    var __VLS_49 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49(__assign({ props: (cellProps) }, { class: (cellProps.row.gap < 0 ? 'text-negative' : '') })));
    var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([__assign({ props: (cellProps) }, { class: (cellProps.row.gap < 0 ? 'text-negative' : '') })], __VLS_functionalComponentArgsRest(__VLS_50), false));
    var __VLS_54 = __VLS_52.slots.default;
    (cellProps.row.gap);
    // @ts-ignore
    [];
    var __VLS_52;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_32;
if (__VLS_ctx.filteredRows.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    (__VLS_ctx.filteredRows.length);
}
{
    var __VLS_55 = __VLS_3.slots.actions;
    var __VLS_56 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        flat: true,
        label: "Đóng",
    }));
    var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([{
            flat: true,
            label: "Đóng",
        }], __VLS_functionalComponentArgsRest(__VLS_57), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    // @ts-ignore
    [filteredRows, filteredRows, vClosePopup,];
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
