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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var props = withDefaults(defineProps(), {
    expected: undefined
});
var consumed = (0, vue_1.computed)(function () { return ({
    weight: Math.max(0, props.original.weight - props.returned.weight),
    meters: Math.max(0, props.original.meters - props.returned.meters)
}); });
var percentageConsumed = (0, vue_1.computed)(function () {
    if (!props.original.meters)
        return 0;
    return (consumed.value.meters / props.original.meters) * 100;
});
var percentageReturned = (0, vue_1.computed)(function () { return 100 - percentageConsumed.value; });
var isAbnormal = (0, vue_1.computed)(function () {
    if (props.expected === undefined)
        return false;
    // Flag if consumption is 20% more than expected
    return consumed.value.meters > props.expected * 1.2;
});
var __VLS_defaults = {
    expected: undefined
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "consumption-summary" }));
/** @type {__VLS_StyleScopedClasses['consumption-summary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
/** @type {__VLS_StyleScopedClasses['col-6']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ flat: true, bordered: true }, { class: "text-center q-pa-sm bg-grey-1" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "text-center q-pa-sm bg-grey-1" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-grey-1']} */ ;
var __VLS_5 = __VLS_3.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
(__VLS_ctx.original.meters.toLocaleString());
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
(__VLS_ctx.original.weight);
// @ts-ignore
[original, original,];
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
/** @type {__VLS_StyleScopedClasses['col-6']} */ ;
var __VLS_6;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6(__assign({ flat: true, bordered: true }, { class: "text-center q-pa-sm bg-grey-1" })));
var __VLS_8 = __VLS_7.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "text-center q-pa-sm bg-grey-1" })], __VLS_functionalComponentArgsRest(__VLS_7), false));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-grey-1']} */ ;
var __VLS_11 = __VLS_9.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
(__VLS_ctx.returned.meters.toLocaleString());
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
(__VLS_ctx.returned.weight);
// @ts-ignore
[returned, returned,];
var __VLS_9;
var __VLS_12;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12(__assign({ flat: true, bordered: true }, { class: "q-mt-sm" })));
var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mt-sm" })], __VLS_functionalComponentArgsRest(__VLS_13), false));
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
var __VLS_17 = __VLS_15.slots.default;
var __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18(__assign({ class: "q-py-sm" })));
var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([__assign({ class: "q-py-sm" })], __VLS_functionalComponentArgsRest(__VLS_19), false));
/** @type {__VLS_StyleScopedClasses['q-py-sm']} */ ;
var __VLS_23 = __VLS_21.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between items-center q-mb-xs" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 text-orange-9" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange-9']} */ ;
(__VLS_ctx.consumed.meters.toLocaleString());
var __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress} */
qLinearProgress;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24(__assign({ value: (__VLS_ctx.percentageConsumed / 100), color: "orange-9", trackColor: "green-2", size: "12px", rounded: true }, { class: "q-mb-xs" })));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([__assign({ value: (__VLS_ctx.percentageConsumed / 100), color: "orange-9", trackColor: "green-2", size: "12px", rounded: true }, { class: "q-mb-xs" })], __VLS_functionalComponentArgsRest(__VLS_25), false));
/** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between text-caption text-grey-7" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.percentageConsumed.toFixed(1));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
(__VLS_ctx.percentageReturned.toFixed(1));
// @ts-ignore
[consumed, percentageConsumed, percentageConsumed, percentageReturned,];
var __VLS_21;
// @ts-ignore
[];
var __VLS_15;
if (__VLS_ctx.isAbnormal) {
    var __VLS_29 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29(__assign({ dense: true }, { class: "bg-red-1 text-red-9 rounded-borders q-mt-sm" })));
    var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([__assign({ dense: true }, { class: "bg-red-1 text-red-9 rounded-borders q-mt-sm" })], __VLS_functionalComponentArgsRest(__VLS_30), false));
    /** @type {__VLS_StyleScopedClasses['bg-red-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    var __VLS_34 = __VLS_32.slots.default;
    {
        var __VLS_35 = __VLS_32.slots.avatar;
        var __VLS_36 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
            name: "warning",
            color: "red-9",
        }));
        var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([{
                name: "warning",
                color: "red-9",
            }], __VLS_functionalComponentArgsRest(__VLS_37), false));
        // @ts-ignore
        [isAbnormal,];
    }
    ((_a = __VLS_ctx.expected) === null || _a === void 0 ? void 0 : _a.toLocaleString());
    ((__VLS_ctx.consumed.meters - (__VLS_ctx.expected || 0)).toLocaleString());
    // @ts-ignore
    [consumed, expected, expected,];
    var __VLS_32;
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
