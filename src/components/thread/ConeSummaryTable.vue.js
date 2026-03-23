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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var props = withDefaults(defineProps(), {
    loading: false,
});
var emit = defineEmits();
// Local state
var filter = (0, vue_1.ref)('');
var getTexDisplay = function (row) { return row.tex_label || row.tex_number || '-'; };
var getDisplayName = function (row) {
    var _a;
    var parts = [
        row.supplier_name || null,
        getTexDisplay(row) !== '-' ? "TEX ".concat(getTexDisplay(row)) : null,
        ((_a = row.color_data) === null || _a === void 0 ? void 0 : _a.name) || null,
    ].filter(Boolean);
    return parts.join(' - ');
};
// Columns definition
var columns = [
    {
        name: 'thread_name',
        label: 'Tên chỉ',
        field: function (row) { return getDisplayName(row); },
        align: 'left',
        sortable: true,
    },
    {
        name: 'tex_number',
        label: 'Tex',
        field: function (row) { return getTexDisplay(row); },
        align: 'center',
        sortable: true,
    },
    {
        name: 'color',
        label: 'Màu',
        field: function (row) { var _a; return ((_a = row.color_data) === null || _a === void 0 ? void 0 : _a.name) || '-'; },
        align: 'left',
        sortable: true,
    },
    { name: 'full_cones', label: 'Cuộn Nguyên KD', field: 'full_cones', align: 'center', sortable: true },
    { name: 'partial_cones', label: 'Cuộn Lẻ KD', field: 'partial_cones', align: 'center', sortable: true },
    {
        name: 'total_full_cones',
        label: 'Cuộn nguyên TT',
        field: 'total_full_cones',
        align: 'center',
        sortable: true,
    },
    {
        name: 'total_partial_cones',
        label: 'Cuộn lẻ TT',
        field: 'total_partial_cones',
        align: 'center',
        sortable: true,
    },
    {
        name: 'partial_meters',
        label: 'Mét lẻ',
        field: 'partial_meters',
        align: 'right',
        sortable: true,
    },
    {
        name: 'partial_weight_grams',
        label: 'KL lẻ (g)',
        field: 'partial_weight_grams',
        align: 'right',
        sortable: true,
    },
    {
        name: 'actions',
        label: '',
        field: 'actions',
        align: 'center',
    },
];
// Computed totals
var totalFullCones = (0, vue_1.computed)(function () {
    return props.rows.reduce(function (sum, row) { return sum + row.full_cones; }, 0);
});
var totalPartialCones = (0, vue_1.computed)(function () {
    return props.rows.reduce(function (sum, row) { return sum + row.partial_cones; }, 0);
});
var totalPartialMeters = (0, vue_1.computed)(function () {
    return props.rows.reduce(function (sum, row) { return sum + row.partial_meters; }, 0);
});
var totalPartialWeight = (0, vue_1.computed)(function () {
    return props.rows.reduce(function (sum, row) { return sum + row.partial_weight_grams; }, 0);
});
var grandTotalFullCones = (0, vue_1.computed)(function () {
    return props.rows.reduce(function (sum, row) { var _a; return sum + ((_a = row.total_full_cones) !== null && _a !== void 0 ? _a : row.full_cones); }, 0);
});
var grandTotalPartialCones = (0, vue_1.computed)(function () {
    return props.rows.reduce(function (sum, row) { var _a; return sum + ((_a = row.total_partial_cones) !== null && _a !== void 0 ? _a : row.partial_cones); }, 0);
});
var totalInventoryValue = (0, vue_1.computed)(function () {
    return props.rows.reduce(function (sum, row) {
        var _a;
        var cones = (_a = row.total_full_cones) !== null && _a !== void 0 ? _a : row.full_cones;
        if (row.unit_price && cones > 0) {
            return sum + cones * row.unit_price;
        }
        return sum;
    }, 0);
});
// Methods
var formatNumber = function (num) {
    return new Intl.NumberFormat('vi-VN').format(num);
};
var formatCurrency = function (num) {
    return new Intl.NumberFormat('vi-VN').format(Math.round(num));
};
var handleRowClick = function (_evt, row) {
    emit('row-click', row);
    emit('show-breakdown', row);
};
var __VLS_defaults = {
    loading: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['cone-summary-table']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onRowClick': {} }, { rows: (__VLS_ctx.rows), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.loading), filter: (__VLS_ctx.filter), rowKey: (function (row) { var _a; return "".concat(row.thread_type_id, "-").concat((_a = row.color_id) !== null && _a !== void 0 ? _a : 'no-color'); }), rowsPerPageOptions: ([10, 25, 50, 0]), pagination: ({ rowsPerPage: 25 }), bordered: true, flat: true, dense: true }), { class: "cone-summary-table" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onRowClick': {} }, { rows: (__VLS_ctx.rows), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.loading), filter: (__VLS_ctx.filter), rowKey: (function (row) { var _a; return "".concat(row.thread_type_id, "-").concat((_a = row.color_id) !== null && _a !== void 0 ? _a : 'no-color'); }), rowsPerPageOptions: ([10, 25, 50, 0]), pagination: ({ rowsPerPage: 25 }), bordered: true, flat: true, dense: true }), { class: "cone-summary-table" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5;
var __VLS_6 = ({ rowClick: {} },
    { onRowClick: (__VLS_ctx.handleRowClick) });
var __VLS_7 = {};
/** @type {__VLS_StyleScopedClasses['cone-summary-table']} */ ;
var __VLS_8 = __VLS_3.slots.default;
{
    var __VLS_9 = __VLS_3.slots.top;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row full-width items-center q-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    var __VLS_10 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
    qSpace;
    // @ts-ignore
    var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({}));
    var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_11), false));
    var __VLS_15 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15(__assign(__assign({ modelValue: (__VLS_ctx.filter), dense: true, outlined: true, debounce: "300", placeholder: "Tìm kiếm..." }, { class: "col-auto" }), { style: {} })));
    var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.filter), dense: true, outlined: true, debounce: "300", placeholder: "Tìm kiếm..." }, { class: "col-auto" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_16), false));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_20 = __VLS_18.slots.default;
    {
        var __VLS_21 = __VLS_18.slots.prepend;
        var __VLS_22 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
            name: "search",
        }));
        var __VLS_24 = __VLS_23.apply(void 0, __spreadArray([{
                name: "search",
            }], __VLS_functionalComponentArgsRest(__VLS_23), false));
        // @ts-ignore
        [rows, columns, loading, filter, filter, $attrs, handleRowClick,];
    }
    if (__VLS_ctx.filter) {
        {
            var __VLS_27 = __VLS_18.slots.append;
            var __VLS_28 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign(__assign({ 'onClick': {} }, { name: "close" }), { class: "cursor-pointer" })));
            var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { name: "close" }), { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_29), false));
            var __VLS_33 = void 0;
            var __VLS_34 = ({ click: {} },
                { onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(__VLS_ctx.filter))
                            return;
                        __VLS_ctx.filter = '';
                        // @ts-ignore
                        [filter, filter,];
                    } });
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            var __VLS_31;
            var __VLS_32;
            // @ts-ignore
            [];
        }
    }
    // @ts-ignore
    [];
    var __VLS_18;
    var __VLS_35 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "refresh", loading: (__VLS_ctx.loading) })));
    var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "refresh", loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_36), false));
    var __VLS_40 = void 0;
    var __VLS_41 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.$emit('refresh');
                // @ts-ignore
                [loading, $emit,];
            } });
    var __VLS_42 = __VLS_38.slots.default;
    var __VLS_43 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
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
    // @ts-ignore
    [];
}
{
    var __VLS_49 = __VLS_3.slots["body-cell-color"];
    var props_1 = __VLS_vSlot(__VLS_49)[0];
    var __VLS_50 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
        props: (props_1),
    }));
    var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{
            props: (props_1),
        }], __VLS_functionalComponentArgsRest(__VLS_51), false));
    var __VLS_55 = __VLS_53.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    if ((_a = props_1.row.color_data) === null || _a === void 0 ? void 0 : _a.hex_code) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-swatch" }, { style: ({ backgroundColor: props_1.row.color_data.hex_code }) }));
        /** @type {__VLS_StyleScopedClasses['color-swatch']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (((_b = props_1.row.color_data) === null || _b === void 0 ? void 0 : _b.name) || '-');
    // @ts-ignore
    [];
    var __VLS_53;
    // @ts-ignore
    [];
}
{
    var __VLS_56 = __VLS_3.slots["body-cell-full_cones"];
    var props_2 = __VLS_vSlot(__VLS_56)[0];
    var __VLS_57 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57(__assign({ props: (props_2) }, { class: "text-center" })));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([__assign({ props: (props_2) }, { class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_58), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_62 = __VLS_60.slots.default;
    var __VLS_63 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63(__assign({ color: "positive", label: (__VLS_ctx.formatNumber(props_2.value)) }, { class: "q-pa-xs" })));
    var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([__assign({ color: "positive", label: (__VLS_ctx.formatNumber(props_2.value)) }, { class: "q-pa-xs" })], __VLS_functionalComponentArgsRest(__VLS_64), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
    // @ts-ignore
    [formatNumber,];
    var __VLS_60;
    // @ts-ignore
    [];
}
{
    var __VLS_68 = __VLS_3.slots["body-cell-partial_cones"];
    var props_3 = __VLS_vSlot(__VLS_68)[0];
    var __VLS_69 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69(__assign({ props: (props_3) }, { class: "text-center" })));
    var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([__assign({ props: (props_3) }, { class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_70), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_74 = __VLS_72.slots.default;
    if (props_3.value > 0) {
        var __VLS_75 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75(__assign({ color: "warning", label: (__VLS_ctx.formatNumber(props_3.value)) }, { class: "q-pa-xs" })));
        var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([__assign({ color: "warning", label: (__VLS_ctx.formatNumber(props_3.value)) }, { class: "q-pa-xs" })], __VLS_functionalComponentArgsRest(__VLS_76), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
    // @ts-ignore
    [formatNumber,];
    var __VLS_72;
    // @ts-ignore
    [];
}
{
    var __VLS_80 = __VLS_3.slots["body-cell-total_full_cones"];
    var props_4 = __VLS_vSlot(__VLS_80)[0];
    var __VLS_81 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_82 = __VLS_asFunctionalComponent1(__VLS_81, new __VLS_81(__assign({ props: (props_4) }, { class: "text-center" })));
    var __VLS_83 = __VLS_82.apply(void 0, __spreadArray([__assign({ props: (props_4) }, { class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_82), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_86 = __VLS_84.slots.default;
    var __VLS_87 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_88 = __VLS_asFunctionalComponent1(__VLS_87, new __VLS_87(__assign({ color: "positive", label: (__VLS_ctx.formatNumber(props_4.value)) }, { class: "q-pa-xs" })));
    var __VLS_89 = __VLS_88.apply(void 0, __spreadArray([__assign({ color: "positive", label: (__VLS_ctx.formatNumber(props_4.value)) }, { class: "q-pa-xs" })], __VLS_functionalComponentArgsRest(__VLS_88), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
    // @ts-ignore
    [formatNumber,];
    var __VLS_84;
    // @ts-ignore
    [];
}
{
    var __VLS_92 = __VLS_3.slots["body-cell-total_partial_cones"];
    var props_5 = __VLS_vSlot(__VLS_92)[0];
    var __VLS_93 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93(__assign({ props: (props_5) }, { class: "text-center" })));
    var __VLS_95 = __VLS_94.apply(void 0, __spreadArray([__assign({ props: (props_5) }, { class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_94), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_98 = __VLS_96.slots.default;
    if (props_5.value > 0) {
        var __VLS_99 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99(__assign({ color: "warning", label: (__VLS_ctx.formatNumber(props_5.value)) }, { class: "q-pa-xs" })));
        var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([__assign({ color: "warning", label: (__VLS_ctx.formatNumber(props_5.value)) }, { class: "q-pa-xs" })], __VLS_functionalComponentArgsRest(__VLS_100), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
    // @ts-ignore
    [formatNumber,];
    var __VLS_96;
    // @ts-ignore
    [];
}
{
    var __VLS_104 = __VLS_3.slots["body-cell-partial_meters"];
    var props_6 = __VLS_vSlot(__VLS_104)[0];
    var __VLS_105 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ props: (props_6) }, { class: "text-right" })));
    var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ props: (props_6) }, { class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    var __VLS_110 = __VLS_108.slots.default;
    if (props_6.value > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatNumber(Math.round(props_6.value)));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
    // @ts-ignore
    [formatNumber,];
    var __VLS_108;
    // @ts-ignore
    [];
}
{
    var __VLS_111 = __VLS_3.slots["body-cell-partial_weight_grams"];
    var props_7 = __VLS_vSlot(__VLS_111)[0];
    var __VLS_112 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112(__assign({ props: (props_7) }, { class: "text-right" })));
    var __VLS_114 = __VLS_113.apply(void 0, __spreadArray([__assign({ props: (props_7) }, { class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_113), false));
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    var __VLS_117 = __VLS_115.slots.default;
    if (props_7.value > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatNumber(Math.round(props_7.value)));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
    // @ts-ignore
    [formatNumber,];
    var __VLS_115;
    // @ts-ignore
    [];
}
{
    var __VLS_118 = __VLS_3.slots["body-cell-actions"];
    var props_8 = __VLS_vSlot(__VLS_118)[0];
    var __VLS_119 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({
        props: (props_8),
        autoWidth: true,
    }));
    var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([{
            props: (props_8),
            autoWidth: true,
        }], __VLS_functionalComponentArgsRest(__VLS_120), false));
    var __VLS_124 = __VLS_122.slots.default;
    var __VLS_125 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "visibility", color: "primary", size: "sm" })));
    var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "visibility", color: "primary", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_126), false));
    var __VLS_130 = void 0;
    var __VLS_131 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.$emit('show-breakdown', props_8.row);
                // @ts-ignore
                [$emit,];
            } });
    var __VLS_132 = __VLS_128.slots.default;
    var __VLS_133 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_134 = __VLS_asFunctionalComponent1(__VLS_133, new __VLS_133({}));
    var __VLS_135 = __VLS_134.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_134), false));
    var __VLS_138 = __VLS_136.slots.default;
    // @ts-ignore
    [];
    var __VLS_136;
    // @ts-ignore
    [];
    var __VLS_128;
    var __VLS_129;
    // @ts-ignore
    [];
    var __VLS_122;
    // @ts-ignore
    [];
}
{
    var __VLS_139 = __VLS_3.slots["bottom-row"];
    var __VLS_140 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTr | typeof __VLS_components.QTr | typeof __VLS_components.qTr | typeof __VLS_components.QTr} */
    qTr;
    // @ts-ignore
    var __VLS_141 = __VLS_asFunctionalComponent1(__VLS_140, new __VLS_140(__assign({ class: "bg-grey-2 text-weight-bold" })));
    var __VLS_142 = __VLS_141.apply(void 0, __spreadArray([__assign({ class: "bg-grey-2 text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_141), false));
    /** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    var __VLS_145 = __VLS_143.slots.default;
    var __VLS_146 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_147 = __VLS_asFunctionalComponent1(__VLS_146, new __VLS_146(__assign({ colspan: "3" }, { class: "text-right" })));
    var __VLS_148 = __VLS_147.apply(void 0, __spreadArray([__assign({ colspan: "3" }, { class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_147), false));
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    var __VLS_151 = __VLS_149.slots.default;
    // @ts-ignore
    [];
    var __VLS_149;
    var __VLS_152 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_153 = __VLS_asFunctionalComponent1(__VLS_152, new __VLS_152(__assign({ class: "text-center" })));
    var __VLS_154 = __VLS_153.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_153), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_157 = __VLS_155.slots.default;
    var __VLS_158 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158(__assign({ color: "positive", label: (__VLS_ctx.formatNumber(__VLS_ctx.totalFullCones)) }, { class: "q-pa-xs" })));
    var __VLS_160 = __VLS_159.apply(void 0, __spreadArray([__assign({ color: "positive", label: (__VLS_ctx.formatNumber(__VLS_ctx.totalFullCones)) }, { class: "q-pa-xs" })], __VLS_functionalComponentArgsRest(__VLS_159), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
    // @ts-ignore
    [formatNumber, totalFullCones,];
    var __VLS_155;
    var __VLS_163 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_164 = __VLS_asFunctionalComponent1(__VLS_163, new __VLS_163(__assign({ class: "text-center" })));
    var __VLS_165 = __VLS_164.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_164), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_168 = __VLS_166.slots.default;
    if (__VLS_ctx.totalPartialCones > 0) {
        var __VLS_169 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169(__assign({ color: "warning", label: (__VLS_ctx.formatNumber(__VLS_ctx.totalPartialCones)) }, { class: "q-pa-xs" })));
        var __VLS_171 = __VLS_170.apply(void 0, __spreadArray([__assign({ color: "warning", label: (__VLS_ctx.formatNumber(__VLS_ctx.totalPartialCones)) }, { class: "q-pa-xs" })], __VLS_functionalComponentArgsRest(__VLS_170), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
    // @ts-ignore
    [formatNumber, totalPartialCones, totalPartialCones,];
    var __VLS_166;
    var __VLS_174 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174(__assign({ class: "text-center" })));
    var __VLS_176 = __VLS_175.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_175), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_179 = __VLS_177.slots.default;
    var __VLS_180 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180(__assign({ color: "positive", label: (__VLS_ctx.formatNumber(__VLS_ctx.grandTotalFullCones)) }, { class: "q-pa-xs" })));
    var __VLS_182 = __VLS_181.apply(void 0, __spreadArray([__assign({ color: "positive", label: (__VLS_ctx.formatNumber(__VLS_ctx.grandTotalFullCones)) }, { class: "q-pa-xs" })], __VLS_functionalComponentArgsRest(__VLS_181), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
    // @ts-ignore
    [formatNumber, grandTotalFullCones,];
    var __VLS_177;
    var __VLS_185 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_186 = __VLS_asFunctionalComponent1(__VLS_185, new __VLS_185(__assign({ class: "text-center" })));
    var __VLS_187 = __VLS_186.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_186), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_190 = __VLS_188.slots.default;
    if (__VLS_ctx.grandTotalPartialCones > 0) {
        var __VLS_191 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_192 = __VLS_asFunctionalComponent1(__VLS_191, new __VLS_191(__assign({ color: "warning", label: (__VLS_ctx.formatNumber(__VLS_ctx.grandTotalPartialCones)) }, { class: "q-pa-xs" })));
        var __VLS_193 = __VLS_192.apply(void 0, __spreadArray([__assign({ color: "warning", label: (__VLS_ctx.formatNumber(__VLS_ctx.grandTotalPartialCones)) }, { class: "q-pa-xs" })], __VLS_functionalComponentArgsRest(__VLS_192), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
    // @ts-ignore
    [formatNumber, grandTotalPartialCones, grandTotalPartialCones,];
    var __VLS_188;
    var __VLS_196 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_197 = __VLS_asFunctionalComponent1(__VLS_196, new __VLS_196(__assign({ class: "text-right" })));
    var __VLS_198 = __VLS_197.apply(void 0, __spreadArray([__assign({ class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_197), false));
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    var __VLS_201 = __VLS_199.slots.default;
    if (__VLS_ctx.totalPartialMeters > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatNumber(Math.round(__VLS_ctx.totalPartialMeters)));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
    // @ts-ignore
    [formatNumber, totalPartialMeters, totalPartialMeters,];
    var __VLS_199;
    var __VLS_202 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_203 = __VLS_asFunctionalComponent1(__VLS_202, new __VLS_202(__assign({ class: "text-right" })));
    var __VLS_204 = __VLS_203.apply(void 0, __spreadArray([__assign({ class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_203), false));
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    var __VLS_207 = __VLS_205.slots.default;
    if (__VLS_ctx.totalPartialWeight > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatNumber(Math.round(__VLS_ctx.totalPartialWeight)));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
    // @ts-ignore
    [formatNumber, totalPartialWeight, totalPartialWeight,];
    var __VLS_205;
    var __VLS_208 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_209 = __VLS_asFunctionalComponent1(__VLS_208, new __VLS_208({}));
    var __VLS_210 = __VLS_209.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_209), false));
    // @ts-ignore
    [];
    var __VLS_143;
    if (__VLS_ctx.totalInventoryValue > 0) {
        var __VLS_213 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTr | typeof __VLS_components.QTr | typeof __VLS_components.qTr | typeof __VLS_components.QTr} */
        qTr;
        // @ts-ignore
        var __VLS_214 = __VLS_asFunctionalComponent1(__VLS_213, new __VLS_213(__assign({ class: "bg-blue-1 text-weight-bold" })));
        var __VLS_215 = __VLS_214.apply(void 0, __spreadArray([__assign({ class: "bg-blue-1 text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_214), false));
        /** @type {__VLS_StyleScopedClasses['bg-blue-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        var __VLS_218 = __VLS_216.slots.default;
        var __VLS_219 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_220 = __VLS_asFunctionalComponent1(__VLS_219, new __VLS_219(__assign({ colspan: "10" }, { class: "text-right text-subtitle2" })));
        var __VLS_221 = __VLS_220.apply(void 0, __spreadArray([__assign({ colspan: "10" }, { class: "text-right text-subtitle2" })], __VLS_functionalComponentArgsRest(__VLS_220), false));
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
        var __VLS_224 = __VLS_222.slots.default;
        var __VLS_225 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_226 = __VLS_asFunctionalComponent1(__VLS_225, new __VLS_225(__assign({ name: "payments", size: "xs" }, { class: "q-mr-xs" })));
        var __VLS_227 = __VLS_226.apply(void 0, __spreadArray([__assign({ name: "payments", size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_226), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-primary q-ml-sm" }));
        /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
        (__VLS_ctx.formatCurrency(__VLS_ctx.totalInventoryValue));
        // @ts-ignore
        [totalInventoryValue, totalInventoryValue, formatCurrency,];
        var __VLS_222;
        // @ts-ignore
        [];
        var __VLS_216;
    }
    // @ts-ignore
    [];
}
{
    var __VLS_230 = __VLS_3.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "full-width column items-center q-pa-lg text-grey" }));
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['column']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    var __VLS_231 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_232 = __VLS_asFunctionalComponent1(__VLS_231, new __VLS_231(__assign({ name: "inventory_2", size: "48px" }, { class: "q-mb-md" })));
    var __VLS_233 = __VLS_232.apply(void 0, __spreadArray([__assign({ name: "inventory_2", size: "48px" }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_232), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    // @ts-ignore
    [];
}
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
