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
    spaced: false,
    inset: false,
    vertical: false
});
var $q = (0, quasar_1.useQuasar)();
var isDark = (0, vue_1.computed)(function () { var _a; return (_a = props.dark) !== null && _a !== void 0 ? _a : $q.dark.isActive; });
var __VLS_defaults = {
    spaced: false,
    inset: false,
    vertical: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    dark: (__VLS_ctx.isDark),
    spaced: (__VLS_ctx.spaced),
    inset: (__VLS_ctx.inset),
    vertical: (__VLS_ctx.vertical),
    color: (__VLS_ctx.color),
    size: (__VLS_ctx.size),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        dark: (__VLS_ctx.isDark),
        spaced: (__VLS_ctx.spaced),
        inset: (__VLS_ctx.inset),
        vertical: (__VLS_ctx.vertical),
        color: (__VLS_ctx.color),
        size: (__VLS_ctx.size),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_3;
// @ts-ignore
[isDark, spaced, inset, vertical, color, size,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
