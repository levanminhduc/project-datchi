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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var props = withDefaults(defineProps(), {
    loading: false,
    supplierBreakdown: function () { return []; },
});
var __VLS_emit = defineEmits();
// Columns
var columns = [
    {
        name: 'warehouse_code',
        label: 'Mã kho',
        field: 'warehouse_code',
        align: 'left',
        sortable: true,
        style: 'width: 100px',
    },
    {
        name: 'warehouse_name',
        label: 'Tên kho',
        field: 'warehouse_name',
        align: 'left',
        sortable: true,
    },
    {
        name: 'full_cones',
        label: 'Cuộn nguyên',
        field: 'full_cones',
        align: 'center',
        sortable: true,
        style: 'width: 120px',
    },
    {
        name: 'partial_cones',
        label: 'Cuộn lẻ',
        field: 'partial_cones',
        align: 'center',
        sortable: true,
        style: 'width: 100px',
    },
    {
        name: 'partial_meters',
        label: 'Mét lẻ',
        field: 'partial_meters',
        align: 'right',
        sortable: true,
        style: 'width: 120px',
    },
];
var supplierColumns = [
    {
        name: 'supplier_name',
        label: 'Nhà cung cấp',
        field: 'supplier_name',
        align: 'left',
        sortable: true,
    },
    {
        name: 'full_cones',
        label: 'Cuộn nguyên',
        field: 'full_cones',
        align: 'center',
        sortable: true,
        style: 'width: 120px',
    },
    {
        name: 'partial_cones',
        label: 'Cuộn lẻ',
        field: 'partial_cones',
        align: 'center',
        sortable: true,
        style: 'width: 100px',
    },
];
var warehouseCount = (0, vue_1.computed)(function () { return props.breakdown.length; });
var hasSupplierData = (0, vue_1.computed)(function () { var _a; return (((_a = props.supplierBreakdown) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0; });
var totalPartialMeters = (0, vue_1.computed)(function () {
    return props.breakdown.reduce(function (sum, row) { return sum + (row.partial_meters || 0); }, 0);
});
var formatNumber = function (num) {
    return new Intl.NumberFormat('vi-VN').format(num);
};
var __VLS_defaults = {
    loading: false,
    supplierBreakdown: function () { return []; },
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
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
var __VLS_9;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9(__assign({ class: "breakdown-dialog-card column" })));
var __VLS_11 = __VLS_10.apply(void 0, __spreadArray([__assign({ class: "breakdown-dialog-card column" })], __VLS_functionalComponentArgsRest(__VLS_10), false));
/** @type {__VLS_StyleScopedClasses['breakdown-dialog-card']} */ ;
/** @type {__VLS_StyleScopedClasses['column']} */ ;
var __VLS_14 = __VLS_12.slots.default;
var __VLS_15;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15(__assign({ class: "row items-center q-pb-none" })));
var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_16), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_20 = __VLS_18.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column" }));
/** @type {__VLS_StyleScopedClasses['column']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
((_a = __VLS_ctx.threadType) === null || _a === void 0 ? void 0 : _a.thread_name);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
((_b = __VLS_ctx.threadType) === null || _b === void 0 ? void 0 : _b.thread_code);
if ((_d = (_c = __VLS_ctx.threadType) === null || _c === void 0 ? void 0 : _c.color_data) === null || _d === void 0 ? void 0 : _d.name) {
    (__VLS_ctx.threadType.color_data.name);
}
if (((_e = __VLS_ctx.threadType) === null || _e === void 0 ? void 0 : _e.tex_label) || ((_f = __VLS_ctx.threadType) === null || _f === void 0 ? void 0 : _f.tex_number)) {
    (((_g = __VLS_ctx.threadType) === null || _g === void 0 ? void 0 : _g.tex_label) || ((_h = __VLS_ctx.threadType) === null || _h === void 0 ? void 0 : _h.tex_number));
}
var __VLS_21;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({}));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_22), false));
var __VLS_26;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
    flat: true,
    round: true,
    dense: true,
    icon: "close",
}));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{
        flat: true,
        round: true,
        dense: true,
        icon: "close",
    }], __VLS_functionalComponentArgsRest(__VLS_27), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[threadType, threadType, threadType, threadType, threadType, threadType, threadType, threadType, vClosePopup,];
var __VLS_18;
var __VLS_31;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31(__assign({ class: "row q-gutter-md q-py-sm" })));
var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([__assign({ class: "row q-gutter-md q-py-sm" })], __VLS_functionalComponentArgsRest(__VLS_32), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-py-sm']} */ ;
var __VLS_36 = __VLS_34.slots.default;
var __VLS_37;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37(__assign({ flat: true, bordered: true }, { class: "col" })));
var __VLS_39 = __VLS_38.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "col" })], __VLS_functionalComponentArgsRest(__VLS_38), false));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
var __VLS_42 = __VLS_40.slots.default;
var __VLS_43;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43(__assign({ class: "q-pa-sm text-center" })));
var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([__assign({ class: "q-pa-sm text-center" })], __VLS_functionalComponentArgsRest(__VLS_44), false));
/** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
var __VLS_48 = __VLS_46.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h5 text-positive" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
(__VLS_ctx.formatNumber(((_j = __VLS_ctx.threadType) === null || _j === void 0 ? void 0 : _j.total_full_cones) || 0));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
// @ts-ignore
[threadType, formatNumber,];
var __VLS_46;
// @ts-ignore
[];
var __VLS_40;
var __VLS_49;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49(__assign({ flat: true, bordered: true }, { class: "col" })));
var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "col" })], __VLS_functionalComponentArgsRest(__VLS_50), false));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
var __VLS_54 = __VLS_52.slots.default;
var __VLS_55;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55(__assign({ class: "q-pa-sm text-center" })));
var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([__assign({ class: "q-pa-sm text-center" })], __VLS_functionalComponentArgsRest(__VLS_56), false));
/** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
var __VLS_60 = __VLS_58.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h5 text-warning" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
(__VLS_ctx.formatNumber(((_k = __VLS_ctx.threadType) === null || _k === void 0 ? void 0 : _k.total_partial_cones) || 0));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
// @ts-ignore
[threadType, formatNumber,];
var __VLS_58;
// @ts-ignore
[];
var __VLS_52;
var __VLS_61;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61(__assign({ flat: true, bordered: true }, { class: "col" })));
var __VLS_63 = __VLS_62.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "col" })], __VLS_functionalComponentArgsRest(__VLS_62), false));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
var __VLS_66 = __VLS_64.slots.default;
var __VLS_67;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67(__assign({ class: "q-pa-sm text-center" })));
var __VLS_69 = __VLS_68.apply(void 0, __spreadArray([__assign({ class: "q-pa-sm text-center" })], __VLS_functionalComponentArgsRest(__VLS_68), false));
/** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
var __VLS_72 = __VLS_70.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h5 text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
(__VLS_ctx.formatNumber(Math.round(__VLS_ctx.totalPartialMeters)));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
// @ts-ignore
[formatNumber, totalPartialMeters,];
var __VLS_70;
// @ts-ignore
[];
var __VLS_64;
var __VLS_73;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73(__assign({ flat: true, bordered: true }, { class: "col" })));
var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "col" })], __VLS_functionalComponentArgsRest(__VLS_74), false));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
var __VLS_78 = __VLS_76.slots.default;
var __VLS_79;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79(__assign({ class: "q-pa-sm text-center" })));
var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([__assign({ class: "q-pa-sm text-center" })], __VLS_functionalComponentArgsRest(__VLS_80), false));
/** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
var __VLS_84 = __VLS_82.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h5 text-secondary" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
(__VLS_ctx.formatNumber(__VLS_ctx.warehouseCount));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
// @ts-ignore
[formatNumber, warehouseCount,];
var __VLS_82;
// @ts-ignore
[];
var __VLS_76;
// @ts-ignore
[];
var __VLS_34;
var __VLS_85;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85(__assign({ class: "col q-pt-none" })));
var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([__assign({ class: "col q-pt-none" })], __VLS_functionalComponentArgsRest(__VLS_86), false));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pt-none']} */ ;
var __VLS_90 = __VLS_88.slots.default;
var __VLS_91;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91(__assign({ rows: (__VLS_ctx.breakdown), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.loading), rowKey: "warehouse_id", flat: true, bordered: true, dense: true, pagination: ({ rowsPerPage: 0 }), hidePagination: true }, { class: "full-height" })));
var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([__assign({ rows: (__VLS_ctx.breakdown), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.loading), rowKey: "warehouse_id", flat: true, bordered: true, dense: true, pagination: ({ rowsPerPage: 0 }), hidePagination: true }, { class: "full-height" })], __VLS_functionalComponentArgsRest(__VLS_92), false));
/** @type {__VLS_StyleScopedClasses['full-height']} */ ;
var __VLS_96 = __VLS_94.slots.default;
{
    var __VLS_97 = __VLS_94.slots["body-cell-warehouse_name"];
    var props_1 = __VLS_vSlot(__VLS_97)[0];
    var __VLS_98 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98({
        props: (props_1),
    }));
    var __VLS_100 = __VLS_99.apply(void 0, __spreadArray([{
            props: (props_1),
        }], __VLS_functionalComponentArgsRest(__VLS_99), false));
    var __VLS_103 = __VLS_101.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    var __VLS_104 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
        name: "warehouse",
        size: "sm",
        color: "grey",
    }));
    var __VLS_106 = __VLS_105.apply(void 0, __spreadArray([{
            name: "warehouse",
            size: "sm",
            color: "grey",
        }], __VLS_functionalComponentArgsRest(__VLS_105), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column" }));
    /** @type {__VLS_StyleScopedClasses['column']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (props_1.row.warehouse_name);
    if (props_1.row.location) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        (props_1.row.location);
    }
    // @ts-ignore
    [breakdown, columns, loading,];
    var __VLS_101;
    // @ts-ignore
    [];
}
{
    var __VLS_109 = __VLS_94.slots["body-cell-full_cones"];
    var props_2 = __VLS_vSlot(__VLS_109)[0];
    var __VLS_110 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110(__assign({ props: (props_2) }, { class: "text-center" })));
    var __VLS_112 = __VLS_111.apply(void 0, __spreadArray([__assign({ props: (props_2) }, { class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_111), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_115 = __VLS_113.slots.default;
    var __VLS_116 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({
        color: (props_2.value > 0 ? 'positive' : 'grey'),
        label: (__VLS_ctx.formatNumber(props_2.value)),
    }));
    var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([{
            color: (props_2.value > 0 ? 'positive' : 'grey'),
            label: (__VLS_ctx.formatNumber(props_2.value)),
        }], __VLS_functionalComponentArgsRest(__VLS_117), false));
    // @ts-ignore
    [formatNumber,];
    var __VLS_113;
    // @ts-ignore
    [];
}
{
    var __VLS_121 = __VLS_94.slots["body-cell-partial_cones"];
    var props_3 = __VLS_vSlot(__VLS_121)[0];
    var __VLS_122 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122(__assign({ props: (props_3) }, { class: "text-center" })));
    var __VLS_124 = __VLS_123.apply(void 0, __spreadArray([__assign({ props: (props_3) }, { class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_123), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_127 = __VLS_125.slots.default;
    if (props_3.value > 0) {
        var __VLS_128 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({
            color: "warning",
            label: (__VLS_ctx.formatNumber(props_3.value)),
        }));
        var __VLS_130 = __VLS_129.apply(void 0, __spreadArray([{
                color: "warning",
                label: (__VLS_ctx.formatNumber(props_3.value)),
            }], __VLS_functionalComponentArgsRest(__VLS_129), false));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
    // @ts-ignore
    [formatNumber,];
    var __VLS_125;
    // @ts-ignore
    [];
}
{
    var __VLS_133 = __VLS_94.slots["body-cell-partial_meters"];
    var props_4 = __VLS_vSlot(__VLS_133)[0];
    var __VLS_134 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134(__assign({ props: (props_4) }, { class: "text-right" })));
    var __VLS_136 = __VLS_135.apply(void 0, __spreadArray([__assign({ props: (props_4) }, { class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_135), false));
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    var __VLS_139 = __VLS_137.slots.default;
    if (props_4.value > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatNumber(Math.round(props_4.value)));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
    // @ts-ignore
    [formatNumber,];
    var __VLS_137;
    // @ts-ignore
    [];
}
{
    var __VLS_140 = __VLS_94.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "full-width column items-center q-pa-lg text-grey" }));
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['column']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    var __VLS_141 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_142 = __VLS_asFunctionalComponent1(__VLS_141, new __VLS_141(__assign({ name: "inventory_2", size: "48px" }, { class: "q-mb-md" })));
    var __VLS_143 = __VLS_142.apply(void 0, __spreadArray([__assign({ name: "inventory_2", size: "48px" }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_142), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    // @ts-ignore
    [];
}
{
    var __VLS_146 = __VLS_94.slots.loading;
    var __VLS_147 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
    qInnerLoading;
    // @ts-ignore
    var __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({
        showing: true,
        color: "primary",
    }));
    var __VLS_149 = __VLS_148.apply(void 0, __spreadArray([{
            showing: true,
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_148), false));
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_94;
// @ts-ignore
[];
var __VLS_88;
if (__VLS_ctx.hasSupplierData) {
    var __VLS_152 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_153 = __VLS_asFunctionalComponent1(__VLS_152, new __VLS_152(__assign({ class: "q-pt-none" })));
    var __VLS_154 = __VLS_153.apply(void 0, __spreadArray([__assign({ class: "q-pt-none" })], __VLS_functionalComponentArgsRest(__VLS_153), false));
    /** @type {__VLS_StyleScopedClasses['q-pt-none']} */ ;
    var __VLS_157 = __VLS_155.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_158 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158(__assign({ name: "local_shipping" }, { class: "q-mr-xs" })));
    var __VLS_160 = __VLS_159.apply(void 0, __spreadArray([__assign({ name: "local_shipping" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_159), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    var __VLS_163 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_164 = __VLS_asFunctionalComponent1(__VLS_163, new __VLS_163({
        rows: (__VLS_ctx.supplierBreakdown),
        columns: (__VLS_ctx.supplierColumns),
        loading: (__VLS_ctx.loading),
        rowKey: "supplier_id",
        flat: true,
        bordered: true,
        dense: true,
        pagination: ({ rowsPerPage: 0 }),
        hidePagination: true,
    }));
    var __VLS_165 = __VLS_164.apply(void 0, __spreadArray([{
            rows: (__VLS_ctx.supplierBreakdown),
            columns: (__VLS_ctx.supplierColumns),
            loading: (__VLS_ctx.loading),
            rowKey: "supplier_id",
            flat: true,
            bordered: true,
            dense: true,
            pagination: ({ rowsPerPage: 0 }),
            hidePagination: true,
        }], __VLS_functionalComponentArgsRest(__VLS_164), false));
    var __VLS_168 = __VLS_166.slots.default;
    {
        var __VLS_169 = __VLS_166.slots["body-cell-supplier_name"];
        var props_5 = __VLS_vSlot(__VLS_169)[0];
        var __VLS_170 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_171 = __VLS_asFunctionalComponent1(__VLS_170, new __VLS_170({
            props: (props_5),
        }));
        var __VLS_172 = __VLS_171.apply(void 0, __spreadArray([{
                props: (props_5),
            }], __VLS_functionalComponentArgsRest(__VLS_171), false));
        var __VLS_175 = __VLS_173.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap q-gutter-sm" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
        var __VLS_176 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_177 = __VLS_asFunctionalComponent1(__VLS_176, new __VLS_176({
            name: "business",
            size: "sm",
            color: "grey",
        }));
        var __VLS_178 = __VLS_177.apply(void 0, __spreadArray([{
                name: "business",
                size: "sm",
                color: "grey",
            }], __VLS_functionalComponentArgsRest(__VLS_177), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column" }));
        /** @type {__VLS_StyleScopedClasses['column']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }, { class: ({ 'text-grey-6 text-italic': !props_5.row.supplier_id }) }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-italic']} */ ;
        (props_5.row.supplier_name);
        if (props_5.row.supplier_code) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-grey" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            (props_5.row.supplier_code);
        }
        // @ts-ignore
        [loading, hasSupplierData, supplierBreakdown, supplierColumns,];
        var __VLS_173;
        // @ts-ignore
        [];
    }
    {
        var __VLS_181 = __VLS_166.slots["body-cell-full_cones"];
        var props_6 = __VLS_vSlot(__VLS_181)[0];
        var __VLS_182 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_183 = __VLS_asFunctionalComponent1(__VLS_182, new __VLS_182(__assign({ props: (props_6) }, { class: "text-center" })));
        var __VLS_184 = __VLS_183.apply(void 0, __spreadArray([__assign({ props: (props_6) }, { class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_183), false));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        var __VLS_187 = __VLS_185.slots.default;
        var __VLS_188 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_189 = __VLS_asFunctionalComponent1(__VLS_188, new __VLS_188({
            color: (props_6.value > 0 ? 'positive' : 'grey'),
            label: (__VLS_ctx.formatNumber(props_6.value)),
        }));
        var __VLS_190 = __VLS_189.apply(void 0, __spreadArray([{
                color: (props_6.value > 0 ? 'positive' : 'grey'),
                label: (__VLS_ctx.formatNumber(props_6.value)),
            }], __VLS_functionalComponentArgsRest(__VLS_189), false));
        // @ts-ignore
        [formatNumber,];
        var __VLS_185;
        // @ts-ignore
        [];
    }
    {
        var __VLS_193 = __VLS_166.slots["body-cell-partial_cones"];
        var props_7 = __VLS_vSlot(__VLS_193)[0];
        var __VLS_194 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_195 = __VLS_asFunctionalComponent1(__VLS_194, new __VLS_194(__assign({ props: (props_7) }, { class: "text-center" })));
        var __VLS_196 = __VLS_195.apply(void 0, __spreadArray([__assign({ props: (props_7) }, { class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_195), false));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        var __VLS_199 = __VLS_197.slots.default;
        if (props_7.value > 0) {
            var __VLS_200 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_201 = __VLS_asFunctionalComponent1(__VLS_200, new __VLS_200({
                color: "warning",
                label: (__VLS_ctx.formatNumber(props_7.value)),
            }));
            var __VLS_202 = __VLS_201.apply(void 0, __spreadArray([{
                    color: "warning",
                    label: (__VLS_ctx.formatNumber(props_7.value)),
                }], __VLS_functionalComponentArgsRest(__VLS_201), false));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        }
        // @ts-ignore
        [formatNumber,];
        var __VLS_197;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_166;
    // @ts-ignore
    [];
    var __VLS_155;
}
var __VLS_205;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_206 = __VLS_asFunctionalComponent1(__VLS_205, new __VLS_205(__assign({ align: "right" }, { class: "q-pt-none" })));
var __VLS_207 = __VLS_206.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-pt-none" })], __VLS_functionalComponentArgsRest(__VLS_206), false));
/** @type {__VLS_StyleScopedClasses['q-pt-none']} */ ;
var __VLS_210 = __VLS_208.slots.default;
var __VLS_211;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_212 = __VLS_asFunctionalComponent1(__VLS_211, new __VLS_211({
    flat: true,
    label: "Đóng",
    color: "primary",
}));
var __VLS_213 = __VLS_212.apply(void 0, __spreadArray([{
        flat: true,
        label: "Đóng",
        color: "primary",
    }], __VLS_functionalComponentArgsRest(__VLS_212), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[vClosePopup,];
var __VLS_208;
// @ts-ignore
[];
var __VLS_12;
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
