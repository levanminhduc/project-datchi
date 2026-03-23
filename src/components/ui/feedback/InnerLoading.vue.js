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
var AppSpinner_vue_1 = require("./AppSpinner.vue");
var __VLS_props = withDefaults(defineProps(), {
    showing: false,
    transitionShow: 'fade',
    transitionHide: 'fade',
    transitionDuration: 300,
    size: '50px',
    color: 'primary',
});
var __VLS_defaults = {
    showing: false,
    transitionShow: 'fade',
    transitionHide: 'fade',
    transitionDuration: 300,
    size: '50px',
    color: 'primary',
};
var __VLS_ctx = __assign(__assign(__assign({}, {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    showing: (__VLS_ctx.showing),
    dark: (__VLS_ctx.dark),
    transitionShow: (__VLS_ctx.transitionShow),
    transitionHide: (__VLS_ctx.transitionHide),
    transitionDuration: (__VLS_ctx.transitionDuration),
    label: (__VLS_ctx.label),
    labelClass: (__VLS_ctx.labelClass),
    labelStyle: (__VLS_ctx.labelStyle),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.showing),
        dark: (__VLS_ctx.dark),
        transitionShow: (__VLS_ctx.transitionShow),
        transitionHide: (__VLS_ctx.transitionHide),
        transitionDuration: (__VLS_ctx.transitionDuration),
        label: (__VLS_ctx.label),
        labelClass: (__VLS_ctx.labelClass),
        labelStyle: (__VLS_ctx.labelStyle),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7 = {};
var __VLS_9 = AppSpinner_vue_1.default;
// @ts-ignore
var __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
    size: (__VLS_ctx.size),
    color: (__VLS_ctx.color),
}));
var __VLS_11 = __VLS_10.apply(void 0, __spreadArray([{
        size: (__VLS_ctx.size),
        color: (__VLS_ctx.color),
    }], __VLS_functionalComponentArgsRest(__VLS_10), false));
// @ts-ignore
[showing, dark, transitionShow, transitionHide, transitionDuration, label, labelClass, labelStyle, $attrs, size, color,];
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
