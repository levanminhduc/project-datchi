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
    defaultView: 'spectrum',
    formatModel: 'hex',
    noHeader: false,
    noHeaderTabs: false,
    noFooter: false,
    square: false,
    flat: false,
    bordered: true,
    disable: false,
    readonly: false
});
var emit = defineEmits();
var $q = (0, quasar_1.useQuasar)();
var isDark = (0, vue_1.computed)(function () { var _a; return (_a = props.dark) !== null && _a !== void 0 ? _a : $q.dark.isActive; });
var colorValue = (0, vue_1.computed)({
    get: function () { var _a; return (_a = props.modelValue) !== null && _a !== void 0 ? _a : null; },
    set: function (val) { return emit('update:modelValue', val !== null && val !== void 0 ? val : null); }
});
var __VLS_defaults = {
    defaultView: 'spectrum',
    formatModel: 'hex',
    noHeader: false,
    noHeaderTabs: false,
    noFooter: false,
    square: false,
    flat: false,
    bordered: true,
    disable: false,
    readonly: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qColor | typeof __VLS_components.QColor} */
qColor;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ modelValue: (__VLS_ctx.colorValue), defaultValue: (__VLS_ctx.defaultValue), defaultView: (__VLS_ctx.defaultView), formatModel: (__VLS_ctx.formatModel), palette: (__VLS_ctx.palette), noHeader: (__VLS_ctx.noHeader), noHeaderTabs: (__VLS_ctx.noHeaderTabs), noFooter: (__VLS_ctx.noFooter), square: (__VLS_ctx.square), flat: (__VLS_ctx.flat), bordered: (__VLS_ctx.bordered), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), dark: (__VLS_ctx.isDark) }, { class: "bg-surface" }), { class: ({ 'dark': __VLS_ctx.isDark }) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.colorValue), defaultValue: (__VLS_ctx.defaultValue), defaultView: (__VLS_ctx.defaultView), formatModel: (__VLS_ctx.formatModel), palette: (__VLS_ctx.palette), noHeader: (__VLS_ctx.noHeader), noHeaderTabs: (__VLS_ctx.noHeaderTabs), noFooter: (__VLS_ctx.noFooter), square: (__VLS_ctx.square), flat: (__VLS_ctx.flat), bordered: (__VLS_ctx.bordered), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), dark: (__VLS_ctx.isDark) }, { class: "bg-surface" }), { class: ({ 'dark': __VLS_ctx.isDark }) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['dark']} */ ;
var __VLS_3;
// @ts-ignore
[colorValue, defaultValue, defaultView, formatModel, palette, noHeader, noHeaderTabs, noFooter, square, flat, bordered, disable, readonly, isDark, isDark,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
