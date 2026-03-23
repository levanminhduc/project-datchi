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
var props = withDefaults(defineProps(), {
    value: 0,
    indeterminate: false,
    query: false,
    stripe: false,
    color: 'primary',
    instantFeedback: false,
    rounded: false,
    size: '4px',
    showValue: false,
});
var progressLabel = (0, vue_1.computed)(function () { return "".concat(Math.round((props.value || 0) * 100), "%"); });
var __VLS_defaults = {
    value: 0,
    indeterminate: false,
    query: false,
    stripe: false,
    color: 'primary',
    instantFeedback: false,
    rounded: false,
    size: '4px',
    showValue: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress | typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress} */
qLinearProgress;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    value: (__VLS_ctx.value),
    buffer: (__VLS_ctx.buffer),
    indeterminate: (__VLS_ctx.indeterminate),
    query: (__VLS_ctx.query),
    stripe: (__VLS_ctx.stripe),
    animationSpeed: (__VLS_ctx.animationSpeed),
    color: (__VLS_ctx.color),
    trackColor: (__VLS_ctx.trackColor),
    instantFeedback: (__VLS_ctx.instantFeedback),
    rounded: (__VLS_ctx.rounded),
    size: (__VLS_ctx.size),
    dark: (__VLS_ctx.dark),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        value: (__VLS_ctx.value),
        buffer: (__VLS_ctx.buffer),
        indeterminate: (__VLS_ctx.indeterminate),
        query: (__VLS_ctx.query),
        stripe: (__VLS_ctx.stripe),
        animationSpeed: (__VLS_ctx.animationSpeed),
        color: (__VLS_ctx.color),
        trackColor: (__VLS_ctx.trackColor),
        instantFeedback: (__VLS_ctx.instantFeedback),
        rounded: (__VLS_ctx.rounded),
        size: (__VLS_ctx.size),
        dark: (__VLS_ctx.dark),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
if (__VLS_ctx.showValue && !__VLS_ctx.indeterminate) {
    {
        var __VLS_7 = __VLS_3.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "absolute-full flex flex-center" }));
        /** @type {__VLS_StyleScopedClasses['absolute-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
        var __VLS_8 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
            color: "white",
            textColor: "primary",
            label: (__VLS_ctx.progressLabel),
        }));
        var __VLS_10 = __VLS_9.apply(void 0, __spreadArray([{
                color: "white",
                textColor: "primary",
                label: (__VLS_ctx.progressLabel),
            }], __VLS_functionalComponentArgsRest(__VLS_9), false));
        // @ts-ignore
        [value, buffer, indeterminate, indeterminate, query, stripe, animationSpeed, color, trackColor, instantFeedback, rounded, size, dark, $attrs, showValue, progressLabel,];
    }
}
var __VLS_13 = {};
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_14 = __VLS_13;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
