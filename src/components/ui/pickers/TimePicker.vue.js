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
var props = withDefaults(defineProps(), {
    mask: 'HH:mm',
    landscape: false,
    color: 'primary',
    square: false,
    flat: false,
    bordered: true,
    readonly: false,
    disable: false,
    format24h: true,
    withSeconds: false,
    nowBtn: true
});
var emit = defineEmits();
var $q = (0, quasar_1.useQuasar)();
var isDark = (0, vue_1.computed)(function () { var _a; return (_a = props.dark) !== null && _a !== void 0 ? _a : $q.dark.isActive; });
var timeValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val !== null && val !== void 0 ? val : null); }
});
var __VLS_defaults = {
    mask: 'HH:mm',
    landscape: false,
    color: 'primary',
    square: false,
    flat: false,
    bordered: true,
    readonly: false,
    disable: false,
    format24h: true,
    withSeconds: false,
    nowBtn: true
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qTime | typeof __VLS_components.QTime} */
qTime;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ modelValue: (__VLS_ctx.timeValue), mask: (__VLS_ctx.mask), landscape: (__VLS_ctx.landscape), color: (__VLS_ctx.color), textColor: (__VLS_ctx.textColor), dark: (__VLS_ctx.isDark), square: (__VLS_ctx.square), flat: (__VLS_ctx.flat), bordered: (__VLS_ctx.bordered), readonly: (__VLS_ctx.readonly), disable: (__VLS_ctx.disable), format24h: (__VLS_ctx.format24h), withSeconds: (__VLS_ctx.withSeconds), nowBtn: (__VLS_ctx.nowBtn) }, { class: "bg-surface" }), { class: ({ 'dark': __VLS_ctx.isDark }) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.timeValue), mask: (__VLS_ctx.mask), landscape: (__VLS_ctx.landscape), color: (__VLS_ctx.color), textColor: (__VLS_ctx.textColor), dark: (__VLS_ctx.isDark), square: (__VLS_ctx.square), flat: (__VLS_ctx.flat), bordered: (__VLS_ctx.bordered), readonly: (__VLS_ctx.readonly), disable: (__VLS_ctx.disable), format24h: (__VLS_ctx.format24h), withSeconds: (__VLS_ctx.withSeconds), nowBtn: (__VLS_ctx.nowBtn) }, { class: "bg-surface" }), { class: ({ 'dark': __VLS_ctx.isDark }) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['dark']} */ ;
var __VLS_3;
// @ts-ignore
[timeValue, mask, landscape, color, textColor, isDark, isDark, square, flat, bordered, readonly, disable, format24h, withSeconds, nowBtn,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
