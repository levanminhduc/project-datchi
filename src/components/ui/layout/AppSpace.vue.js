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
    size: 'md',
    horizontal: false
});
var sizeMap = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
};
var spaceStyle = (0, vue_1.computed)(function () {
    var dimension = sizeMap[props.size] || props.size;
    return props.horizontal
        ? { width: dimension, display: 'inline-block' }
        : { height: dimension };
});
var __VLS_defaults = {
    size: 'md',
    horizontal: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ style: (__VLS_ctx.spaceStyle) }, { 'aria-hidden': "true" }));
// @ts-ignore
[spaceStyle,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
