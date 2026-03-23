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
var __VLS_props = withDefaults(defineProps(), {
    loading: false
});
var formatNumber = function (value) {
    var numberValue = Number(value !== null && value !== void 0 ? value : 0);
    if (!Number.isFinite(numberValue))
        return '0';
    return numberValue.toLocaleString();
};
var formatPercent = function (value) {
    var numberValue = Number(value !== null && value !== void 0 ? value : 0);
    if (!Number.isFinite(numberValue))
        return '0.0%';
    return "".concat(numberValue.toFixed(1), "%");
};
var columns = [
    { name: 'po_number', label: 'PO', field: 'po_number', align: 'left', sortable: true },
    { name: 'style_code', label: 'Mã Hàng', field: 'style_code', align: 'left', sortable: true },
    { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left', sortable: true },
    { name: 'thread_name', label: 'Loại Chỉ', field: 'thread_name', align: 'left', sortable: true },
    { name: 'quota_meters', label: 'Định Mức', field: 'quota_meters', align: 'right', sortable: true, format: formatNumber },
    { name: 'total_issued_meters', label: 'Đã Xuất', field: 'total_issued_meters', align: 'right', sortable: true, format: formatNumber },
    { name: 'total_returned_meters', label: 'Đã Nhập', field: 'total_returned_meters', align: 'right', sortable: true, format: formatNumber },
    { name: 'consumed_meters', label: 'Tiêu Thụ', field: 'consumed_meters', align: 'right', sortable: true, format: formatNumber },
    { name: 'consumption_percentage', label: '%', field: 'consumption_percentage', align: 'right', sortable: true, format: formatPercent },
    { name: 'over_limit_count', label: 'Vượt ĐM', field: 'over_limit_count', align: 'center', sortable: true },
];
var varianceColor = function (row) {
    var variance = row.quota_meters - row.consumed_meters;
    if (variance >= 0)
        return 'positive';
    return 'negative';
};
var __VLS_defaults = {
    loading: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "reconciliation-table" }));
/** @type {__VLS_StyleScopedClasses['reconciliation-table']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    rows: (__VLS_ctx.rows),
    columns: (__VLS_ctx.columns),
    rowKey: "po_id",
    loading: (__VLS_ctx.loading),
    flat: true,
    bordered: true,
    pagination: ({ rowsPerPage: 20 }),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        rows: (__VLS_ctx.rows),
        columns: (__VLS_ctx.columns),
        rowKey: "po_id",
        loading: (__VLS_ctx.loading),
        flat: true,
        bordered: true,
        pagination: ({ rowsPerPage: 20 }),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = __VLS_3.slots.default;
{
    var __VLS_6 = __VLS_3.slots["body-cell-consumption_percentage"];
    var props = __VLS_vSlot(__VLS_6)[0];
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        props: (props),
    }));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_8), false));
    var __VLS_12 = __VLS_10.slots.default;
    var __VLS_13 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        color: (__VLS_ctx.varianceColor(props.row)),
    }));
    var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.varianceColor(props.row)),
        }], __VLS_functionalComponentArgsRest(__VLS_14), false));
    var __VLS_18 = __VLS_16.slots.default;
    (props.value);
    // @ts-ignore
    [rows, columns, loading, varianceColor,];
    var __VLS_16;
    // @ts-ignore
    [];
    var __VLS_10;
    // @ts-ignore
    [];
}
{
    var __VLS_19 = __VLS_3.slots["body-cell-over_limit_count"];
    var props = __VLS_vSlot(__VLS_19)[0];
    var __VLS_20 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
        props: (props),
    }));
    var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_21), false));
    var __VLS_25 = __VLS_23.slots.default;
    if (props.value > 0) {
        var __VLS_26 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
            color: "warning",
            textColor: "dark",
        }));
        var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{
                color: "warning",
                textColor: "dark",
            }], __VLS_functionalComponentArgsRest(__VLS_27), false));
        var __VLS_31 = __VLS_29.slots.default;
        (props.value);
        // @ts-ignore
        [];
        var __VLS_29;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    }
    // @ts-ignore
    [];
    var __VLS_23;
    // @ts-ignore
    [];
}
if (__VLS_ctx.summary) {
    {
        var __VLS_32 = __VLS_3.slots["bottom-row"];
        var __VLS_33 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTr | typeof __VLS_components.QTr | typeof __VLS_components.qTr | typeof __VLS_components.QTr} */
        qTr;
        // @ts-ignore
        var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ class: "bg-grey-2 text-weight-bold" })));
        var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ class: "bg-grey-2 text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_34), false));
        /** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        var __VLS_38 = __VLS_36.slots.default;
        var __VLS_39 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
            colspan: "4",
        }));
        var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([{
                colspan: "4",
            }], __VLS_functionalComponentArgsRest(__VLS_40), false));
        var __VLS_44 = __VLS_42.slots.default;
        // @ts-ignore
        [summary,];
        var __VLS_42;
        var __VLS_45 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45(__assign({ class: "text-right" })));
        var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([__assign({ class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_46), false));
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        var __VLS_50 = __VLS_48.slots.default;
        (__VLS_ctx.formatNumber(__VLS_ctx.summary.total_quota));
        // @ts-ignore
        [summary, formatNumber,];
        var __VLS_48;
        var __VLS_51 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51(__assign({ class: "text-right" })));
        var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([__assign({ class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_52), false));
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        var __VLS_56 = __VLS_54.slots.default;
        (__VLS_ctx.formatNumber(__VLS_ctx.summary.total_issued));
        // @ts-ignore
        [summary, formatNumber,];
        var __VLS_54;
        var __VLS_57 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57(__assign({ class: "text-right" })));
        var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([__assign({ class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_58), false));
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        var __VLS_62 = __VLS_60.slots.default;
        (__VLS_ctx.formatNumber(__VLS_ctx.summary.total_returned));
        // @ts-ignore
        [summary, formatNumber,];
        var __VLS_60;
        var __VLS_63 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63(__assign({ class: "text-right" })));
        var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([__assign({ class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_64), false));
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        var __VLS_68 = __VLS_66.slots.default;
        (__VLS_ctx.formatNumber(__VLS_ctx.summary.total_consumed));
        // @ts-ignore
        [summary, formatNumber,];
        var __VLS_66;
        var __VLS_69 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69(__assign({ class: "text-right" })));
        var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([__assign({ class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_70), false));
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        var __VLS_74 = __VLS_72.slots.default;
        (__VLS_ctx.formatPercent(__VLS_ctx.summary.overall_consumption_percentage));
        // @ts-ignore
        [summary, formatPercent,];
        var __VLS_72;
        var __VLS_75 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75(__assign({ class: "text-center" })));
        var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_76), false));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        var __VLS_80 = __VLS_78.slots.default;
        (__VLS_ctx.summary.total_over_limit_count);
        // @ts-ignore
        [summary,];
        var __VLS_78;
        // @ts-ignore
        [];
        var __VLS_36;
        // @ts-ignore
        [];
    }
}
{
    var __VLS_81 = __VLS_3.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-lg text-grey" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
