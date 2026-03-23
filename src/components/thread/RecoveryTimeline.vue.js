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
var quasar_1 = require("quasar");
var enums_1 = require("@/types/thread/enums");
var props = defineProps();
var formatDate = function (dateStr) {
    if (!dateStr)
        return '';
    return quasar_1.date.formatDate(dateStr, 'HH:mm DD/MM/YYYY');
};
var steps = [
    {
        status: enums_1.RecoveryStatus.INITIATED,
        title: 'Khởi tạo',
        icon: 'input',
        userField: 'returned_by'
    },
    {
        status: enums_1.RecoveryStatus.PENDING_WEIGH,
        title: 'Chờ cân',
        icon: 'hourglass_empty',
        userField: null
    },
    {
        status: enums_1.RecoveryStatus.WEIGHED,
        title: 'Đã cân',
        icon: 'scale',
        userField: 'weighed_by'
    },
    {
        status: enums_1.RecoveryStatus.CONFIRMED,
        title: 'Hoàn tất',
        icon: 'check_circle',
        userField: 'confirmed_by'
    }
];
var currentStepIndex = (0, vue_1.computed)(function () {
    if (props.recovery.status === enums_1.RecoveryStatus.WRITTEN_OFF)
        return 3;
    if (props.recovery.status === enums_1.RecoveryStatus.REJECTED)
        return 3;
    var statusIndex = steps.findIndex(function (s) { return s.status === props.recovery.status; });
    return statusIndex === -1 ? 0 : statusIndex;
});
var getStepColor = function (index) {
    if (props.recovery.status === enums_1.RecoveryStatus.REJECTED && index === currentStepIndex.value) {
        return 'negative';
    }
    if (props.recovery.status === enums_1.RecoveryStatus.WRITTEN_OFF && index === currentStepIndex.value) {
        return 'amber-9';
    }
    if (index < currentStepIndex.value)
        return 'positive';
    if (index === currentStepIndex.value)
        return 'primary';
    return 'grey-5';
};
var getStepLabel = function (step, index) {
    if (index === 3) {
        if (props.recovery.status === enums_1.RecoveryStatus.WRITTEN_OFF)
            return 'Đã hủy (Write-off)';
        if (props.recovery.status === enums_1.RecoveryStatus.REJECTED)
            return 'Đã từ chối';
    }
    return step.title;
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "recovery-timeline q-pa-sm" }));
/** @type {__VLS_StyleScopedClasses['recovery-timeline']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qTimeline | typeof __VLS_components.QTimeline | typeof __VLS_components.qTimeline | typeof __VLS_components.QTimeline} */
qTimeline;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    color: "primary",
    layout: "dense",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        color: "primary",
        layout: "dense",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = __VLS_3.slots.default;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.steps)); _i < _a.length; _i++) {
    var _b = _a[_i], step = _b[0], index = _b[1];
    var __VLS_6 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTimelineEntry | typeof __VLS_components.QTimelineEntry | typeof __VLS_components.qTimelineEntry | typeof __VLS_components.QTimelineEntry} */
    qTimelineEntry;
    // @ts-ignore
    var __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        key: (step.status),
        title: (__VLS_ctx.getStepLabel(step, index)),
        icon: (step.icon),
        color: (__VLS_ctx.getStepColor(index)),
    }));
    var __VLS_8 = __VLS_7.apply(void 0, __spreadArray([{
            key: (step.status),
            title: (__VLS_ctx.getStepLabel(step, index)),
            icon: (step.icon),
            color: (__VLS_ctx.getStepColor(index)),
        }], __VLS_functionalComponentArgsRest(__VLS_7), false));
    var __VLS_11 = __VLS_9.slots.default;
    {
        var __VLS_12 = __VLS_9.slots.default;
        if (index === 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            (__VLS_ctx.recovery.returned_by || 'N/A');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6" }));
            /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
            (__VLS_ctx.formatDate(__VLS_ctx.recovery.created_at));
        }
        else if (index === 2 && __VLS_ctx.recovery.weighed_by) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            (__VLS_ctx.recovery.weighed_by);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6" }));
            /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
            (__VLS_ctx.formatDate(__VLS_ctx.recovery.updated_at));
        }
        else if (index === 3 && __VLS_ctx.recovery.confirmed_by) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            (__VLS_ctx.recovery.confirmed_by);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6" }));
            /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
            (__VLS_ctx.formatDate(__VLS_ctx.recovery.updated_at));
        }
        if (index === __VLS_ctx.currentStepIndex && __VLS_ctx.recovery.notes) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption italic q-mt-xs" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['italic']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
            (__VLS_ctx.recovery.notes);
        }
        // @ts-ignore
        [steps, getStepLabel, getStepColor, recovery, recovery, recovery, recovery, recovery, recovery, recovery, recovery, recovery, recovery, formatDate, formatDate, formatDate, currentStepIndex,];
    }
    // @ts-ignore
    [];
    var __VLS_9;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeProps: {},
});
exports.default = {};
