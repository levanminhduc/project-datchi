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
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var props = withDefaults(defineProps(), {
    weightGrams: null,
    quantityMeters: null,
    densityGramsPerMeter: null,
    showConversion: false,
    size: 'md',
    inline: false
});
var hasWeight = (0, vue_1.computed)(function () { return props.weightGrams !== null && props.weightGrams !== undefined; });
var hasMeters = (0, vue_1.computed)(function () { return props.quantityMeters !== null && props.quantityMeters !== undefined; });
var formatNumber = function (val, decimals) {
    if (decimals === void 0) { decimals = 0; }
    return val.toLocaleString('vi-VN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};
var calculatedWeight = (0, vue_1.computed)(function () {
    // If weight is already provided, we don't calculate it
    if (hasWeight.value)
        return null;
    if (!props.showConversion || props.quantityMeters === null || props.quantityMeters === undefined || !props.densityGramsPerMeter)
        return null;
    return props.quantityMeters * props.densityGramsPerMeter;
});
var calculatedMeters = (0, vue_1.computed)(function () {
    // If meters is already provided, we don't calculate it
    if (hasMeters.value)
        return null;
    if (!props.showConversion || props.weightGrams === null || props.weightGrams === undefined || !props.densityGramsPerMeter || props.densityGramsPerMeter === 0)
        return null;
    return props.weightGrams / props.densityGramsPerMeter;
});
var sizeClass = (0, vue_1.computed)(function () {
    switch (props.size) {
        case 'sm': return 'text-caption';
        case 'lg': return 'text-body1 text-weight-medium';
        default: return 'text-body2';
    }
});
var __VLS_defaults = {
    weightGrams: null,
    quantityMeters: null,
    densityGramsPerMeter: null,
    showConversion: false,
    size: 'md',
    inline: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: ([__VLS_ctx.inline ? 'row items-center no-wrap' : 'column']) }));
if (__VLS_ctx.hasWeight) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (__VLS_ctx.sizeClass) }));
    (__VLS_ctx.formatNumber(props.weightGrams, 1));
}
if (__VLS_ctx.inline && __VLS_ctx.hasWeight && __VLS_ctx.hasMeters) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-6 q-mx-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
}
if (__VLS_ctx.hasMeters) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (__VLS_ctx.sizeClass) }));
    (__VLS_ctx.formatNumber(props.quantityMeters, 0));
}
if (__VLS_ctx.calculatedWeight !== null) {
    if (__VLS_ctx.inline) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-6 q-mx-xs" }));
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (['text-grey-6', !__VLS_ctx.inline ? 'text-caption' : (__VLS_ctx.size === 'sm' ? 'text-caption' : 'text-caption')]) }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    if (!__VLS_ctx.inline) {
    }
    (__VLS_ctx.formatNumber(__VLS_ctx.calculatedWeight, 1));
    if (!__VLS_ctx.inline) {
    }
}
if (__VLS_ctx.calculatedMeters !== null) {
    if (__VLS_ctx.inline) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-6 q-mx-xs" }));
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (['text-grey-6', !__VLS_ctx.inline ? 'text-caption' : (__VLS_ctx.size === 'sm' ? 'text-caption' : 'text-caption')]) }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    if (!__VLS_ctx.inline) {
    }
    (__VLS_ctx.formatNumber(__VLS_ctx.calculatedMeters, 0));
    if (!__VLS_ctx.inline) {
    }
}
// @ts-ignore
[inline, inline, inline, inline, inline, inline, inline, inline, inline, inline, hasWeight, hasWeight, sizeClass, sizeClass, formatNumber, formatNumber, formatNumber, formatNumber, hasMeters, hasMeters, calculatedWeight, calculatedWeight, size, size, calculatedMeters, calculatedMeters,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
