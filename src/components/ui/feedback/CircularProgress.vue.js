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
    value: 0,
    indeterminate: false,
    color: 'primary',
    trackColor: 'grey-3',
    size: '100px',
    thickness: 0.2,
    min: 0,
    max: 1,
    reverse: false,
    instantFeedback: false,
    showValue: false,
    angle: 0,
    rounded: false,
});
var __VLS_defaults = {
    value: 0,
    indeterminate: false,
    color: 'primary',
    trackColor: 'grey-3',
    size: '100px',
    thickness: 0.2,
    min: 0,
    max: 1,
    reverse: false,
    instantFeedback: false,
    showValue: false,
    angle: 0,
    rounded: false,
};
var __VLS_ctx = __assign(__assign(__assign({}, {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qCircularProgress | typeof __VLS_components.QCircularProgress | typeof __VLS_components.qCircularProgress | typeof __VLS_components.QCircularProgress} */
qCircularProgress;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    value: (__VLS_ctx.value),
    indeterminate: (__VLS_ctx.indeterminate),
    color: (__VLS_ctx.color),
    trackColor: (__VLS_ctx.trackColor),
    centerColor: (__VLS_ctx.centerColor),
    size: (__VLS_ctx.size),
    fontSize: (__VLS_ctx.fontSize),
    thickness: (__VLS_ctx.thickness),
    min: (__VLS_ctx.min),
    max: (__VLS_ctx.max),
    reverse: (__VLS_ctx.reverse),
    instantFeedback: (__VLS_ctx.instantFeedback),
    showValue: (__VLS_ctx.showValue),
    angle: (__VLS_ctx.angle),
    animationSpeed: (__VLS_ctx.animationSpeed),
    rounded: (__VLS_ctx.rounded),
    dark: (__VLS_ctx.dark),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        value: (__VLS_ctx.value),
        indeterminate: (__VLS_ctx.indeterminate),
        color: (__VLS_ctx.color),
        trackColor: (__VLS_ctx.trackColor),
        centerColor: (__VLS_ctx.centerColor),
        size: (__VLS_ctx.size),
        fontSize: (__VLS_ctx.fontSize),
        thickness: (__VLS_ctx.thickness),
        min: (__VLS_ctx.min),
        max: (__VLS_ctx.max),
        reverse: (__VLS_ctx.reverse),
        instantFeedback: (__VLS_ctx.instantFeedback),
        showValue: (__VLS_ctx.showValue),
        angle: (__VLS_ctx.angle),
        animationSpeed: (__VLS_ctx.animationSpeed),
        rounded: (__VLS_ctx.rounded),
        dark: (__VLS_ctx.dark),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7 = {};
// @ts-ignore
[value, indeterminate, color, trackColor, centerColor, size, fontSize, thickness, min, max, reverse, instantFeedback, showValue, angle, animationSpeed, rounded, dark, $attrs,];
var __VLS_3;
// @ts-ignore
var __VLS_8 = __VLS_7;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
