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
var vue_1 = require("vue");
var enums_1 = require("@/types/thread/enums");
var AllocationStatusBadge_vue_1 = require("./AllocationStatusBadge.vue");
var props = defineProps();
var emit = defineEmits();
/**
 * Sort allocations by priority score (descending) then by created date
 */
var sortedAllocations = (0, vue_1.computed)(function () {
    return __spreadArray([], props.conflict.competing_allocations, true).sort(function (a, b) {
        if (b.priority_score !== a.priority_score) {
            return b.priority_score - a.priority_score;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
});
/**
 * Map allocation status to timeline item color
 */
var getStatusColor = function (status) {
    switch (status) {
        case enums_1.AllocationStatus.PENDING:
            return 'blue';
        case enums_1.AllocationStatus.WAITLISTED:
            return 'orange';
        case enums_1.AllocationStatus.SOFT:
            return 'cyan';
        case enums_1.AllocationStatus.HARD:
            return 'purple';
        case enums_1.AllocationStatus.ISSUED:
            return 'positive';
        case enums_1.AllocationStatus.CANCELLED:
            return 'negative';
        default:
            return 'grey';
    }
};
/**
 * Formatter for quantity with unit
 */
var formatQty = function (qty) {
    return "".concat(qty.toLocaleString(), " m");
};
/**
 * Calculate shortage for a specific allocation based on its position in the queue
 */
var getAllocationMetrics = function (index) {
    var cumulativeDemand = 0;
    for (var i = 0; i <= index; i++) {
        var alloc = sortedAllocations.value[i];
        if (alloc) {
            cumulativeDemand += alloc.requested_meters;
        }
    }
    var available = props.conflict.total_available;
    var isShortage = cumulativeDemand > available;
    var currentAlloc = sortedAllocations.value[index];
    var shortageAmount = isShortage && currentAlloc ? Math.min(currentAlloc.requested_meters, cumulativeDemand - available) : 0;
    return {
        isShortage: isShortage,
        shortageAmount: shortageAmount
    };
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['allocation-item']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "conflict-timeline q-pa-md" }));
/** @type {__VLS_StyleScopedClasses['conflict-timeline']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-md flex items-center" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ name: "history", color: "primary", size: "sm" }, { class: "q-mr-sm" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ name: "history", color: "primary", size: "sm" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
var __VLS_5;
/** @ts-ignore @type {typeof __VLS_components.qTimeline | typeof __VLS_components.QTimeline | typeof __VLS_components.qTimeline | typeof __VLS_components.QTimeline} */
qTimeline;
// @ts-ignore
var __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
    color: "secondary",
}));
var __VLS_7 = __VLS_6.apply(void 0, __spreadArray([{
        color: "secondary",
    }], __VLS_functionalComponentArgsRest(__VLS_6), false));
var __VLS_10 = __VLS_8.slots.default;
var _loop_1 = function (alloc, index) {
    var __VLS_11 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTimelineEntry | typeof __VLS_components.QTimelineEntry | typeof __VLS_components.qTimelineEntry | typeof __VLS_components.QTimelineEntry} */
    qTimelineEntry;
    // @ts-ignore
    var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11(__assign(__assign(__assign({ 'onClick': {} }, { key: (alloc.id), color: (__VLS_ctx.getStatusColor(alloc.status)), icon: (alloc.id.toString() === __VLS_ctx.selectedAllocationId ? 'check_circle' : undefined), side: (index % 2 === 0 ? 'left' : 'right') }), { class: "allocation-item" }), { class: ({ 'selected-allocation': alloc.id.toString() === __VLS_ctx.selectedAllocationId }) })));
    var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { key: (alloc.id), color: (__VLS_ctx.getStatusColor(alloc.status)), icon: (alloc.id.toString() === __VLS_ctx.selectedAllocationId ? 'check_circle' : undefined), side: (index % 2 === 0 ? 'left' : 'right') }), { class: "allocation-item" }), { class: ({ 'selected-allocation': alloc.id.toString() === __VLS_ctx.selectedAllocationId }) })], __VLS_functionalComponentArgsRest(__VLS_12), false));
    var __VLS_16 = void 0;
    var __VLS_17 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.emit('select', alloc.id.toString());
                // @ts-ignore
                [sortedAllocations, getStatusColor, selectedAllocationId, selectedAllocationId, emit,];
            } });
    /** @type {__VLS_StyleScopedClasses['allocation-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['selected-allocation']} */ ;
    var __VLS_18 = __VLS_14.slots.default;
    {
        var __VLS_19 = __VLS_14.slots.title;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between no-wrap" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-bold text-primary" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
        (alloc.order_id);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-xs" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-gutter-x-xs']} */ ;
        var __VLS_20 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
        qChip;
        // @ts-ignore
        var __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
            size: "sm",
            color: "blue-1",
            textColor: "blue-9",
            dense: true,
        }));
        var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([{
                size: "sm",
                color: "blue-1",
                textColor: "blue-9",
                dense: true,
            }], __VLS_functionalComponentArgsRest(__VLS_21), false));
        var __VLS_25 = __VLS_23.slots.default;
        (alloc.priority_score);
        // @ts-ignore
        [];
        var __VLS_26 = AllocationStatusBadge_vue_1.default;
        // @ts-ignore
        var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
            status: (alloc.status),
            size: "sm",
        }));
        var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{
                status: (alloc.status),
                size: "sm",
            }], __VLS_functionalComponentArgsRest(__VLS_27), false));
        // @ts-ignore
        [];
    }
    {
        var __VLS_31 = __VLS_14.slots.subtitle;
        (new Date(alloc.created_at).toLocaleDateString('vi-VN'));
        // @ts-ignore
        [];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm text-caption" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.formatQty(alloc.requested_meters));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.formatQty(alloc.allocated_meters));
    if (__VLS_ctx.getAllocationMetrics(index).isShortage) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "shortage-warning q-mt-sm q-pa-xs bg-red-1 border-red rounded-borders" }));
        /** @type {__VLS_StyleScopedClasses['shortage-warning']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['border-red']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center text-red-9" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-red-9']} */ ;
        var __VLS_32 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32(__assign({ name: "warning", size: "xs" }, { class: "q-mr-xs" })));
        var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([__assign({ name: "warning", size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_33), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-bold" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        (__VLS_ctx.formatQty(__VLS_ctx.getAllocationMetrics(index).shortageAmount));
    }
    if (alloc.notes) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-italic text-grey-8 q-mt-xs ellipsis-2-lines text-caption" }));
        /** @type {__VLS_StyleScopedClasses['text-italic']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['ellipsis-2-lines']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        (alloc.notes);
    }
    // @ts-ignore
    [formatQty, formatQty, formatQty, getAllocationMetrics, getAllocationMetrics,];
    // @ts-ignore
    [];
};
var __VLS_23, __VLS_14, __VLS_15;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.sortedAllocations)); _i < _a.length; _i++) {
    var _b = _a[_i], alloc = _b[0], index = _b[1];
    _loop_1(alloc, index);
}
// @ts-ignore
[];
var __VLS_8;
if (__VLS_ctx.sortedAllocations.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex flex-center q-pa-xl text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    var __VLS_37 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37(__assign({ name: "event_busy", size: "lg" }, { class: "q-mb-sm" })));
    var __VLS_39 = __VLS_38.apply(void 0, __spreadArray([__assign({ name: "event_busy", size: "lg" }, { class: "q-mb-sm" })], __VLS_functionalComponentArgsRest(__VLS_38), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
}
// @ts-ignore
[sortedAllocations,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
