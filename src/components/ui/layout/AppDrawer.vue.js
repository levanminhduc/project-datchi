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
    modelValue: false,
    side: 'left',
    width: 300,
    mini: false,
    miniWidth: 57,
    miniToOverlay: false,
    breakpoint: 1023,
    behavior: 'default',
    bordered: false,
    elevated: false,
    overlay: false,
    persistent: false,
    noSwipeOpen: false,
    noSwipeClose: false,
    noSwipeBackdrop: false
});
var emit = defineEmits();
var drawerValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); }
});
var __VLS_defaults = {
    modelValue: false,
    side: 'left',
    width: 300,
    mini: false,
    miniWidth: 57,
    miniToOverlay: false,
    breakpoint: 1023,
    behavior: 'default',
    bordered: false,
    elevated: false,
    overlay: false,
    persistent: false,
    noSwipeOpen: false,
    noSwipeClose: false,
    noSwipeBackdrop: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDrawer | typeof __VLS_components.QDrawer | typeof __VLS_components.qDrawer | typeof __VLS_components.QDrawer} */
qDrawer;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.drawerValue),
    side: (__VLS_ctx.side),
    width: (__VLS_ctx.width),
    mini: (__VLS_ctx.mini),
    miniWidth: (__VLS_ctx.miniWidth),
    miniToOverlay: (__VLS_ctx.miniToOverlay),
    breakpoint: (__VLS_ctx.breakpoint),
    behavior: (__VLS_ctx.behavior),
    bordered: (__VLS_ctx.bordered),
    elevated: (__VLS_ctx.elevated),
    overlay: (__VLS_ctx.overlay),
    persistent: (__VLS_ctx.persistent),
    noSwipeOpen: (__VLS_ctx.noSwipeOpen),
    noSwipeClose: (__VLS_ctx.noSwipeClose),
    noSwipeBackdrop: (__VLS_ctx.noSwipeBackdrop),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.drawerValue),
        side: (__VLS_ctx.side),
        width: (__VLS_ctx.width),
        mini: (__VLS_ctx.mini),
        miniWidth: (__VLS_ctx.miniWidth),
        miniToOverlay: (__VLS_ctx.miniToOverlay),
        breakpoint: (__VLS_ctx.breakpoint),
        behavior: (__VLS_ctx.behavior),
        bordered: (__VLS_ctx.bordered),
        elevated: (__VLS_ctx.elevated),
        overlay: (__VLS_ctx.overlay),
        persistent: (__VLS_ctx.persistent),
        noSwipeOpen: (__VLS_ctx.noSwipeOpen),
        noSwipeClose: (__VLS_ctx.noSwipeClose),
        noSwipeBackdrop: (__VLS_ctx.noSwipeBackdrop),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7 = {};
// @ts-ignore
[drawerValue, side, width, mini, miniWidth, miniToOverlay, breakpoint, behavior, bordered, elevated, overlay, persistent, noSwipeOpen, noSwipeClose, noSwipeBackdrop,];
var __VLS_3;
// @ts-ignore
var __VLS_8 = __VLS_7;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
