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
var __VLS_props = defineProps();
var emit = defineEmits();
var columns = [
    { name: 'thread_type_name', label: 'Loại chỉ', field: 'thread_type_name', align: 'left', sortable: true },
    { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
    { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'left' },
    { name: 'thread_color', label: 'Màu chỉ', field: 'thread_color', align: 'left' },
    {
        name: 'total_meters',
        label: 'Tổng mét',
        field: 'total_meters',
        align: 'right',
        sortable: true,
        format: function (val) { return val.toLocaleString('vi-VN', { maximumFractionDigits: 2 }); },
    },
    {
        name: 'meters_per_cone',
        label: 'Mét/cuộn',
        field: 'meters_per_cone',
        align: 'right',
        format: function (val) { return val ? val.toLocaleString('vi-VN') : '—'; },
    },
    {
        name: 'total_cones',
        label: 'Nhu Cầu',
        field: 'total_cones',
        align: 'right',
        sortable: true,
        format: function (val) { return val > 0 ? val.toLocaleString('vi-VN') : '—'; },
    },
    {
        name: 'inventory_cones',
        label: 'Tồn kho KD',
        field: 'inventory_cones',
        align: 'right',
        sortable: true,
        format: function (val) { return (val && val > 0) ? val.toLocaleString('vi-VN') : '—'; },
    },
    {
        name: 'full_cones',
        label: 'Cuộn nguyên',
        field: 'full_cones',
        align: 'right',
        format: function (val) { return (val != null && val > 0) ? val.toLocaleString('vi-VN') : '—'; },
    },
    {
        name: 'partial_cones',
        label: 'Cuộn lẻ',
        field: 'partial_cones',
        align: 'right',
        format: function (val) { return (val != null && val > 0) ? val.toLocaleString('vi-VN') : '—'; },
    },
    {
        name: 'equivalent_cones',
        label: 'Tồn kho QĐ',
        field: 'equivalent_cones',
        align: 'right',
        sortable: true,
        format: function (val) { return (val != null && val > 0) ? val.toLocaleString('vi-VN') : '—'; },
    },
    {
        name: 'sl_can_dat',
        label: 'SL cần đặt',
        field: 'sl_can_dat',
        align: 'right',
        sortable: true,
        format: function (val) { return (val && val > 0) ? val.toLocaleString('vi-VN') : '—'; },
    },
    {
        name: 'additional_order',
        label: 'Đặt thêm',
        field: 'additional_order',
        align: 'right',
        format: function (val) { return (val && val > 0) ? val.toLocaleString('vi-VN') : '—'; },
    },
    {
        name: 'total_final',
        label: 'Tổng chốt',
        field: 'total_final',
        align: 'right',
        sortable: true,
        format: function (val) { return (val && val > 0) ? val.toLocaleString('vi-VN') : '—'; },
    },
];
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
AppCard;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    flat: true,
    bordered: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-sm" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    rows: (__VLS_ctx.rows),
    columns: (__VLS_ctx.columns),
    rowKey: "thread_type_id",
    flat: true,
    bordered: true,
    dense: true,
    hideBottom: true,
    rowsPerPageOptions: ([0]),
}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{
        rows: (__VLS_ctx.rows),
        columns: (__VLS_ctx.columns),
        rowKey: "thread_type_id",
        flat: true,
        bordered: true,
        dense: true,
        hideBottom: true,
        rowsPerPageOptions: ([0]),
    }], __VLS_functionalComponentArgsRest(__VLS_14), false));
var __VLS_18 = __VLS_16.slots.default;
{
    var __VLS_19 = __VLS_16.slots["body-cell-thread_type_name"];
    var props = __VLS_vSlot(__VLS_19)[0];
    var __VLS_20 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20(__assign({ props: (props) }, { class: (props.row.is_fallback_type ? 'bg-amber-1' : '') })));
    var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([__assign({ props: (props) }, { class: (props.row.is_fallback_type ? 'bg-amber-1' : '') })], __VLS_functionalComponentArgsRest(__VLS_21), false));
    var __VLS_25 = __VLS_23.slots.default;
    (props.row.thread_type_name);
    if (props.row.is_fallback_type) {
        var __VLS_26 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({}));
        var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_27), false));
        var __VLS_31 = __VLS_29.slots.default;
        // @ts-ignore
        [rows, columns,];
        var __VLS_29;
    }
    // @ts-ignore
    [];
    var __VLS_23;
    // @ts-ignore
    [];
}
{
    var __VLS_32 = __VLS_16.slots["body-cell-thread_color"];
    var props = __VLS_vSlot(__VLS_32)[0];
    var __VLS_33 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ props: (props) }, { class: (props.row.is_fallback_type ? 'bg-amber-1' : '') })));
    var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ props: (props) }, { class: (props.row.is_fallback_type ? 'bg-amber-1' : '') })], __VLS_functionalComponentArgsRest(__VLS_34), false));
    var __VLS_38 = __VLS_36.slots.default;
    if (props.row.thread_color_code) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)(__assign({ class: "q-mr-xs" }, { style: ({
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: props.row.thread_color_code,
                border: '1px solid #ccc'
            }) }));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    }
    if (props.row.thread_color) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (props.row.thread_color);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
        /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
    }
    // @ts-ignore
    [];
    var __VLS_36;
    // @ts-ignore
    [];
}
{
    var __VLS_39 = __VLS_16.slots["body-cell-additional_order"];
    var props_1 = __VLS_vSlot(__VLS_39)[0];
    var __VLS_40 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        props: (props_1),
    }));
    var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([{
            props: (props_1),
        }], __VLS_functionalComponentArgsRest(__VLS_41), false));
    var __VLS_45 = __VLS_43.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cursor-pointer text-primary" }));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    ((props_1.row.additional_order && props_1.row.additional_order > 0) ? props_1.row.additional_order.toLocaleString('vi-VN') : '—');
    var __VLS_46 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46(__assign({ name: "edit", size: "xs" }, { class: "q-ml-xs" })));
    var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([__assign({ name: "edit", size: "xs" }, { class: "q-ml-xs" })], __VLS_functionalComponentArgsRest(__VLS_47), false));
    /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
    var __VLS_51 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
    qPopupEdit;
    // @ts-ignore
    var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51(__assign({ 'onSave': {} }, { modelValue: (props_1.row.additional_order || 0), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
    var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_1.row.additional_order || 0), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_52), false));
    var __VLS_56 = void 0;
    var __VLS_57 = ({ save: {} },
        { onSave: (function (val) { return __VLS_ctx.emit('update:additional-order', props_1.row.thread_type_id, val); }) });
    {
        var __VLS_58 = __VLS_54.slots.default;
        var scope = __VLS_vSlot(__VLS_58)[0];
        var __VLS_59 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59({
            modelValue: (scope.value),
            modelModifiers: { number: true, },
            type: "number",
            min: (0),
            dense: true,
            autofocus: true,
            label: "Số lượng đặt thêm",
        }));
        var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([{
                modelValue: (scope.value),
                modelModifiers: { number: true, },
                type: "number",
                min: (0),
                dense: true,
                autofocus: true,
                label: "Số lượng đặt thêm",
            }], __VLS_functionalComponentArgsRest(__VLS_60), false));
        // @ts-ignore
        [emit,];
        __VLS_54.slots['' /* empty slot name completion */];
    }
    var __VLS_54;
    var __VLS_55;
    // @ts-ignore
    [];
    var __VLS_43;
    // @ts-ignore
    [];
}
{
    var __VLS_64 = __VLS_16.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey q-pa-md" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_16;
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
