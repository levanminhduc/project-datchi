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
    color: 'primary',
    spread: false,
    outline: false,
    flat: false,
    unelevated: true,
    square: false,
    rounded: false,
    push: false,
    dense: false,
    readonly: false,
    disable: false,
    stack: false,
    stretch: false,
    noCaps: true,
    ripple: true,
    size: 'md',
    clearable: false,
});
var emit = defineEmits();
var __VLS_defaults = {
    color: 'primary',
    spread: false,
    outline: false,
    flat: false,
    unelevated: true,
    square: false,
    rounded: false,
    push: false,
    dense: false,
    readonly: false,
    disable: false,
    stack: false,
    stretch: false,
    noCaps: true,
    ripple: true,
    size: 'md',
    clearable: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qBtnToggle | typeof __VLS_components.QBtnToggle | typeof __VLS_components.qBtnToggle | typeof __VLS_components.QBtnToggle} */
qBtnToggle;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), options: (__VLS_ctx.options), color: (__VLS_ctx.color), textColor: (__VLS_ctx.textColor), toggleColor: (__VLS_ctx.toggleColor), toggleTextColor: (__VLS_ctx.toggleTextColor), spread: (__VLS_ctx.spread), outline: (__VLS_ctx.outline), flat: (__VLS_ctx.flat), unelevated: (__VLS_ctx.unelevated), square: (__VLS_ctx.square), rounded: (__VLS_ctx.rounded), push: (__VLS_ctx.push), dense: (__VLS_ctx.dense), readonly: (__VLS_ctx.readonly), disable: (__VLS_ctx.disable), stack: (__VLS_ctx.stack), stretch: (__VLS_ctx.stretch), noCaps: (__VLS_ctx.noCaps), ripple: (__VLS_ctx.ripple), size: (__VLS_ctx.size), clearable: (__VLS_ctx.clearable) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), options: (__VLS_ctx.options), color: (__VLS_ctx.color), textColor: (__VLS_ctx.textColor), toggleColor: (__VLS_ctx.toggleColor), toggleTextColor: (__VLS_ctx.toggleTextColor), spread: (__VLS_ctx.spread), outline: (__VLS_ctx.outline), flat: (__VLS_ctx.flat), unelevated: (__VLS_ctx.unelevated), square: (__VLS_ctx.square), rounded: (__VLS_ctx.rounded), push: (__VLS_ctx.push), dense: (__VLS_ctx.dense), readonly: (__VLS_ctx.readonly), disable: (__VLS_ctx.disable), stack: (__VLS_ctx.stack), stretch: (__VLS_ctx.stretch), noCaps: (__VLS_ctx.noCaps), ripple: (__VLS_ctx.ripple), size: (__VLS_ctx.size), clearable: (__VLS_ctx.clearable) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('update:modelValue', $event);
            // @ts-ignore
            [modelValue, options, color, textColor, toggleColor, toggleTextColor, spread, outline, flat, unelevated, square, rounded, push, dense, readonly, disable, stack, stretch, noCaps, ripple, size, clearable, $attrs, emit,];
        } });
var __VLS_7 = {};
var __VLS_8 = __VLS_3.slots.default;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.$slots)); _i < _a.length; _i++) {
    var _b = _a[_i], _ = _b[0], name_1 = _b[1];
    {
        var _c = __VLS_3.slots, _d = __VLS_tryAsConstant(name_1), __VLS_9 = _c[_d];
        var __VLS_10 = {};
        var __VLS_11 = __VLS_tryAsConstant(name_1);
        // @ts-ignore
        [$slots,];
    }
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_12 = __VLS_11, __VLS_13 = __VLS_10;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
