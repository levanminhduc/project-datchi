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
    text: '',
    anchor: 'top middle',
    self: 'bottom middle',
    delay: 300,
    hideDelay: 0,
    maxWidth: '300px',
    transitionShow: 'jump-down',
    transitionHide: 'jump-up'
});
var __VLS_defaults = {
    text: '',
    anchor: 'top middle',
    self: 'bottom middle',
    delay: 300,
    hideDelay: 0,
    maxWidth: '300px',
    transitionShow: 'jump-down',
    transitionHide: 'jump-up'
};
var __VLS_ctx = __assign(__assign(__assign({}, {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
qTooltip;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ anchor: (__VLS_ctx.anchor), self: (__VLS_ctx.self), offset: (__VLS_ctx.offset), delay: (__VLS_ctx.delay), hideDelay: (__VLS_ctx.hideDelay), maxWidth: (__VLS_ctx.maxWidth), transitionShow: (__VLS_ctx.transitionShow), transitionHide: (__VLS_ctx.transitionHide) }, { class: (__VLS_ctx.contentClass) }), { style: (__VLS_ctx.contentStyle) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ anchor: (__VLS_ctx.anchor), self: (__VLS_ctx.self), offset: (__VLS_ctx.offset), delay: (__VLS_ctx.delay), hideDelay: (__VLS_ctx.hideDelay), maxWidth: (__VLS_ctx.maxWidth), transitionShow: (__VLS_ctx.transitionShow), transitionHide: (__VLS_ctx.transitionHide) }, { class: (__VLS_ctx.contentClass) }), { style: (__VLS_ctx.contentStyle) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
if (__VLS_ctx.$slots.default) {
    var __VLS_7 = {};
}
else {
    (__VLS_ctx.text);
}
// @ts-ignore
[anchor, self, offset, delay, hideDelay, maxWidth, transitionShow, transitionHide, contentClass, contentStyle, $slots, text,];
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
