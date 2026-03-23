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
    split: false,
    disable: false,
    noIconAnimation: false,
    size: 'md',
    dense: false,
    flat: false,
    unelevated: true,
    outline: false,
    push: false,
    noCaps: true,
    round: false,
    rounded: false,
    square: false,
    ripple: true,
    autoClose: true,
});
var emit = defineEmits();
var __VLS_defaults = {
    color: 'primary',
    split: false,
    disable: false,
    noIconAnimation: false,
    size: 'md',
    dense: false,
    flat: false,
    unelevated: true,
    outline: false,
    push: false,
    noCaps: true,
    round: false,
    rounded: false,
    square: false,
    ripple: true,
    autoClose: true,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qBtnDropdown | typeof __VLS_components.QBtnDropdown | typeof __VLS_components.qBtnDropdown | typeof __VLS_components.QBtnDropdown} */
qBtnDropdown;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onClick': {} }), { modelValue: (__VLS_ctx.modelValue), color: (__VLS_ctx.color), textColor: (__VLS_ctx.textColor), label: (__VLS_ctx.label), icon: (__VLS_ctx.icon), iconRight: (__VLS_ctx.iconRight), split: (__VLS_ctx.split), disable: (__VLS_ctx.disable), noIconAnimation: (__VLS_ctx.noIconAnimation), size: (__VLS_ctx.size), dense: (__VLS_ctx.dense), flat: (__VLS_ctx.flat), unelevated: (__VLS_ctx.unelevated), outline: (__VLS_ctx.outline), push: (__VLS_ctx.push), noCaps: (__VLS_ctx.noCaps), round: (__VLS_ctx.round), rounded: (__VLS_ctx.rounded), square: (__VLS_ctx.square), ripple: (__VLS_ctx.ripple), menuOffset: (__VLS_ctx.menuOffset), autoClose: (__VLS_ctx.autoClose) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onClick': {} }), { modelValue: (__VLS_ctx.modelValue), color: (__VLS_ctx.color), textColor: (__VLS_ctx.textColor), label: (__VLS_ctx.label), icon: (__VLS_ctx.icon), iconRight: (__VLS_ctx.iconRight), split: (__VLS_ctx.split), disable: (__VLS_ctx.disable), noIconAnimation: (__VLS_ctx.noIconAnimation), size: (__VLS_ctx.size), dense: (__VLS_ctx.dense), flat: (__VLS_ctx.flat), unelevated: (__VLS_ctx.unelevated), outline: (__VLS_ctx.outline), push: (__VLS_ctx.push), noCaps: (__VLS_ctx.noCaps), round: (__VLS_ctx.round), rounded: (__VLS_ctx.rounded), square: (__VLS_ctx.square), ripple: (__VLS_ctx.ripple), menuOffset: (__VLS_ctx.menuOffset), autoClose: (__VLS_ctx.autoClose) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
            [modelValue, color, textColor, label, icon, iconRight, split, disable, noIconAnimation, size, dense, flat, unelevated, outline, push, noCaps, round, rounded, square, ripple, menuOffset, autoClose, $attrs, emit,];
        } });
var __VLS_7 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('click', $event);
            // @ts-ignore
            [emit,];
        } });
var __VLS_8 = {};
var __VLS_9 = __VLS_3.slots.default;
var __VLS_10 = {};
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_11 = __VLS_10;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
