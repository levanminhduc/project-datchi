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
var columns = [
    { name: 'thread_type_name', label: 'Loại chỉ', field: 'thread_type_name', align: 'left', sortable: true },
    { name: 'total_cones', label: 'Cần đặt', field: 'total_cones', align: 'right', format: function (v) { return v.toLocaleString('vi-VN'); } },
    { name: 'equivalent_cones', label: 'Sẵn kho', field: 'equivalent_cones', align: 'right', format: function (v) { return v.toLocaleString('vi-VN'); } },
    { name: 'pending_cones', label: 'Chờ về', field: 'pending_cones', align: 'right', format: function (v) { return v.toLocaleString('vi-VN'); } },
    { name: 'shortage', label: 'Thiếu', field: 'shortage', align: 'right', sortable: true },
];
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
if (__VLS_ctx.rows.length > 0 || __VLS_ctx.loading) {
    var __VLS_0 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        rows: (__VLS_ctx.rows),
        columns: (__VLS_ctx.columns),
        rowKey: "thread_type_id",
        dense: true,
        flat: true,
        bordered: true,
        hidePagination: true,
        rowsPerPageOptions: ([0]),
        loading: (__VLS_ctx.loading),
    }));
    var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
            rows: (__VLS_ctx.rows),
            columns: (__VLS_ctx.columns),
            rowKey: "thread_type_id",
            dense: true,
            flat: true,
            bordered: true,
            hidePagination: true,
            rowsPerPageOptions: ([0]),
            loading: (__VLS_ctx.loading),
        }], __VLS_functionalComponentArgsRest(__VLS_1), false));
    var __VLS_5 = __VLS_3.slots.default;
    {
        var __VLS_6 = __VLS_3.slots["body-cell-thread_type_name"];
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (props.row.thread_type_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        ([props.row.supplier_name, props.row.tex_number, props.row.thread_color].filter(Boolean).join(' · '));
        // @ts-ignore
        [rows, rows, loading, loading, columns,];
        var __VLS_10;
        // @ts-ignore
        [];
    }
    {
        var __VLS_13 = __VLS_3.slots["body-cell-shortage"];
        var props = __VLS_vSlot(__VLS_13)[0];
        var __VLS_14 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
            props: (props),
        }));
        var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_15), false));
        var __VLS_19 = __VLS_17.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (props.row.shortage > 0 ? 'text-negative text-weight-bold' : 'text-positive') }));
        (props.row.shortage.toLocaleString('vi-VN'));
        // @ts-ignore
        [];
        var __VLS_17;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_3;
}
else if (!__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6 q-pa-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
}
// @ts-ignore
[loading,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeProps: {},
});
exports.default = {};
