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
var vue_router_1 = require("vue-router");
var __VLS_props = defineProps();
var __VLS_emit = defineEmits();
var router = (0, vue_router_1.useRouter)();
function statusLabel(status) {
    var map = {
        draft: 'Nháp',
        confirmed: 'Đã xác nhận',
        cancelled: 'Đã hủy',
    };
    return map[status] || status;
}
function statusColor(status) {
    var map = {
        draft: 'grey',
        confirmed: 'positive',
        cancelled: 'negative',
    };
    return map[status] || 'grey';
}
function formatDate(val) {
    if (!val)
        return '—';
    var _a = val.split('-'), y = _a[0], m = _a[1], d = _a[2];
    return "".concat(d, "/").concat(m, "/").concat(y);
}
var columns = [
    { name: 'week_name', label: 'Tên tuần', field: 'week_name', align: 'left', sortable: true },
    {
        name: 'start_date',
        label: 'Từ ngày',
        field: 'start_date',
        align: 'left',
        format: function (val) { return formatDate(val); },
    },
    {
        name: 'end_date',
        label: 'Đến ngày',
        field: 'end_date',
        align: 'left',
        format: function (val) { return formatDate(val); },
    },
    {
        name: 'created_by',
        label: 'Người tạo',
        field: 'created_by',
        align: 'left',
        format: function (val) { return val || '—'; },
    },
    { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
    {
        name: 'item_count',
        label: 'Số items',
        field: 'item_count',
        align: 'right',
        format: function (val) { return (val === null || val === void 0 ? void 0 : val.toString()) || '0'; },
    },
    { name: 'actions', label: '', field: 'id', align: 'center' },
];
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.AppDialog | typeof __VLS_components.AppDialog} */
AppDialog;
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
var __VLS_10;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
    rows: (__VLS_ctx.weeks),
    columns: (__VLS_ctx.columns),
    rowKey: "id",
    flat: true,
    bordered: true,
    dense: true,
    loading: (__VLS_ctx.loading),
    rowsPerPageOptions: ([10, 20]),
}));
var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([{
        rows: (__VLS_ctx.weeks),
        columns: (__VLS_ctx.columns),
        rowKey: "id",
        flat: true,
        bordered: true,
        dense: true,
        loading: (__VLS_ctx.loading),
        rowsPerPageOptions: ([10, 20]),
    }], __VLS_functionalComponentArgsRest(__VLS_11), false));
var __VLS_15 = __VLS_13.slots.default;
{
    var __VLS_16 = __VLS_13.slots["body-cell-status"];
    var props = __VLS_vSlot(__VLS_16)[0];
    var __VLS_17 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        props: (props),
    }));
    var __VLS_19 = __VLS_18.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_18), false));
    var __VLS_22 = __VLS_20.slots.default;
    var __VLS_23 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppBadge} */
    AppBadge;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        label: (__VLS_ctx.statusLabel(props.value)),
        color: (__VLS_ctx.statusColor(props.value)),
    }));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
            label: (__VLS_ctx.statusLabel(props.value)),
            color: (__VLS_ctx.statusColor(props.value)),
        }], __VLS_functionalComponentArgsRest(__VLS_24), false));
    // @ts-ignore
    [weeks, columns, loading, statusLabel, statusColor,];
    var __VLS_20;
    // @ts-ignore
    [];
}
{
    var __VLS_28 = __VLS_13.slots["body-cell-actions"];
    var props_1 = __VLS_vSlot(__VLS_28)[0];
    var __VLS_29 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        props: (props_1),
    }));
    var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{
            props: (props_1),
        }], __VLS_functionalComponentArgsRest(__VLS_30), false));
    var __VLS_34 = __VLS_32.slots.default;
    var __VLS_35 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton | typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "file_open", color: "primary", size: "sm" })));
    var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "file_open", color: "primary", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_36), false));
    var __VLS_40 = void 0;
    var __VLS_41 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.$emit('load', props_1.row.id);
                // @ts-ignore
                [$emit,];
            } });
    var __VLS_42 = __VLS_38.slots.default;
    var __VLS_43 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppTooltip | typeof __VLS_components.AppTooltip} */
    AppTooltip;
    // @ts-ignore
    var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({}));
    var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_44), false));
    var __VLS_48 = __VLS_46.slots.default;
    // @ts-ignore
    [];
    var __VLS_46;
    // @ts-ignore
    [];
    var __VLS_38;
    var __VLS_39;
    var __VLS_49 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton | typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49(__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "open_in_new", color: "grey", size: "sm" })));
    var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "open_in_new", color: "grey", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_50), false));
    var __VLS_54 = void 0;
    var __VLS_55 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.router.push("/thread/weekly-order/".concat(props_1.row.id));
                // @ts-ignore
                [router,];
            } });
    var __VLS_56 = __VLS_52.slots.default;
    var __VLS_57 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppTooltip | typeof __VLS_components.AppTooltip} */
    AppTooltip;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({}));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_58), false));
    var __VLS_62 = __VLS_60.slots.default;
    // @ts-ignore
    [];
    var __VLS_60;
    // @ts-ignore
    [];
    var __VLS_52;
    var __VLS_53;
    // @ts-ignore
    [];
    var __VLS_32;
    // @ts-ignore
    [];
}
{
    var __VLS_63 = __VLS_13.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey q-pa-md" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_13;
{
    var __VLS_64 = __VLS_3.slots.actions;
    var __VLS_65 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65({
        flat: true,
        label: "Đóng",
    }));
    var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([{
            flat: true,
            label: "Đóng",
        }], __VLS_functionalComponentArgsRest(__VLS_66), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    // @ts-ignore
    [vClosePopup,];
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
