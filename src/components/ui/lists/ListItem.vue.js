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
    clickable: false,
    active: false,
    focused: false,
    manualFocus: false,
    dense: false,
    disable: false,
    ripple: true,
});
var emit = defineEmits();
var __VLS_defaults = {
    clickable: false,
    active: false,
    focused: false,
    manualFocus: false,
    dense: false,
    disable: false,
    ripple: true,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onClick': {} }, { clickable: (__VLS_ctx.clickable), active: (__VLS_ctx.active), activeClass: (__VLS_ctx.activeClass), focused: (__VLS_ctx.focused), manualFocus: (__VLS_ctx.manualFocus), dense: (__VLS_ctx.dense), insetLevel: (__VLS_ctx.insetLevel), to: (__VLS_ctx.to), href: (__VLS_ctx.href), target: (__VLS_ctx.target), disable: (__VLS_ctx.disable), dark: (__VLS_ctx.dark), ripple: (__VLS_ctx.ripple) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { clickable: (__VLS_ctx.clickable), active: (__VLS_ctx.active), activeClass: (__VLS_ctx.activeClass), focused: (__VLS_ctx.focused), manualFocus: (__VLS_ctx.manualFocus), dense: (__VLS_ctx.dense), insetLevel: (__VLS_ctx.insetLevel), to: (__VLS_ctx.to), href: (__VLS_ctx.href), target: (__VLS_ctx.target), disable: (__VLS_ctx.disable), dark: (__VLS_ctx.dark), ripple: (__VLS_ctx.ripple) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5;
var __VLS_6 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('click', $event);
            // @ts-ignore
            [clickable, active, activeClass, focused, manualFocus, dense, insetLevel, to, href, target, disable, dark, ripple, $attrs, emit,];
        } });
var __VLS_7 = {};
var __VLS_8 = __VLS_3.slots.default;
var __VLS_9 = {};
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_10 = __VLS_9;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
