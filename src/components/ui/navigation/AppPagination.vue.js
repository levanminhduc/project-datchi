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
    modelValue: 1,
    min: 1,
    max: 1,
    maxPages: 7,
    boundaryLinks: true,
    boundaryNumbers: false,
    directionLinks: true,
    ellipses: true,
    color: 'primary',
    activeColor: 'primary',
    round: false,
    rounded: false,
    flat: false,
    outline: false,
    unelevated: false,
    dense: false,
    ripple: true
});
var emit = defineEmits();
var pageValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); }
});
var __VLS_defaults = {
    modelValue: 1,
    min: 1,
    max: 1,
    maxPages: 7,
    boundaryLinks: true,
    boundaryNumbers: false,
    directionLinks: true,
    ellipses: true,
    color: 'primary',
    activeColor: 'primary',
    round: false,
    rounded: false,
    flat: false,
    outline: false,
    unelevated: false,
    dense: false,
    ripple: true
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPagination | typeof __VLS_components.QPagination} */
qPagination;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.pageValue),
    min: (__VLS_ctx.min),
    max: (__VLS_ctx.max),
    maxPages: (__VLS_ctx.maxPages),
    boundaryLinks: (__VLS_ctx.boundaryLinks),
    boundaryNumbers: (__VLS_ctx.boundaryNumbers),
    directionLinks: (__VLS_ctx.directionLinks),
    ellipses: (__VLS_ctx.ellipses),
    color: (__VLS_ctx.color),
    textColor: (__VLS_ctx.textColor),
    activeColor: (__VLS_ctx.activeColor),
    activeTextColor: (__VLS_ctx.activeTextColor),
    round: (__VLS_ctx.round),
    rounded: (__VLS_ctx.rounded),
    flat: (__VLS_ctx.flat),
    outline: (__VLS_ctx.outline),
    unelevated: (__VLS_ctx.unelevated),
    dense: (__VLS_ctx.dense),
    size: (__VLS_ctx.size),
    ripple: (__VLS_ctx.ripple),
    inputStyle: (__VLS_ctx.inputStyle),
    inputClass: (__VLS_ctx.inputClass),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.pageValue),
        min: (__VLS_ctx.min),
        max: (__VLS_ctx.max),
        maxPages: (__VLS_ctx.maxPages),
        boundaryLinks: (__VLS_ctx.boundaryLinks),
        boundaryNumbers: (__VLS_ctx.boundaryNumbers),
        directionLinks: (__VLS_ctx.directionLinks),
        ellipses: (__VLS_ctx.ellipses),
        color: (__VLS_ctx.color),
        textColor: (__VLS_ctx.textColor),
        activeColor: (__VLS_ctx.activeColor),
        activeTextColor: (__VLS_ctx.activeTextColor),
        round: (__VLS_ctx.round),
        rounded: (__VLS_ctx.rounded),
        flat: (__VLS_ctx.flat),
        outline: (__VLS_ctx.outline),
        unelevated: (__VLS_ctx.unelevated),
        dense: (__VLS_ctx.dense),
        size: (__VLS_ctx.size),
        ripple: (__VLS_ctx.ripple),
        inputStyle: (__VLS_ctx.inputStyle),
        inputClass: (__VLS_ctx.inputClass),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_3;
// @ts-ignore
[pageValue, min, max, maxPages, boundaryLinks, boundaryNumbers, directionLinks, ellipses, color, textColor, activeColor, activeTextColor, round, rounded, flat, outline, unelevated, dense, size, ripple, inputStyle, inputClass,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
