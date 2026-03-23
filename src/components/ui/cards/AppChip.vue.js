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
    modelValue: true,
    color: 'primary',
    square: false,
    outline: false,
    clickable: false,
    removable: false,
    ripple: true,
    disable: false,
    dense: false,
});
var emit = defineEmits();
var __VLS_defaults = {
    modelValue: true,
    color: 'primary',
    square: false,
    outline: false,
    clickable: false,
    removable: false,
    ripple: true,
    disable: false,
    dense: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
qChip;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onClick': {} }), { 'onRemove': {} }), { modelValue: (__VLS_ctx.modelValue), label: (__VLS_ctx.label), icon: (__VLS_ctx.icon), iconRight: (__VLS_ctx.iconRight), iconRemove: (__VLS_ctx.iconRemove), iconSelected: (__VLS_ctx.iconSelected), color: (__VLS_ctx.color), textColor: (__VLS_ctx.textColor), selected: (__VLS_ctx.selected), square: (__VLS_ctx.square), outline: (__VLS_ctx.outline), clickable: (__VLS_ctx.clickable), removable: (__VLS_ctx.removable), ripple: (__VLS_ctx.ripple), disable: (__VLS_ctx.disable), dense: (__VLS_ctx.dense), size: (__VLS_ctx.size), dark: (__VLS_ctx.dark) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onClick': {} }), { 'onRemove': {} }), { modelValue: (__VLS_ctx.modelValue), label: (__VLS_ctx.label), icon: (__VLS_ctx.icon), iconRight: (__VLS_ctx.iconRight), iconRemove: (__VLS_ctx.iconRemove), iconSelected: (__VLS_ctx.iconSelected), color: (__VLS_ctx.color), textColor: (__VLS_ctx.textColor), selected: (__VLS_ctx.selected), square: (__VLS_ctx.square), outline: (__VLS_ctx.outline), clickable: (__VLS_ctx.clickable), removable: (__VLS_ctx.removable), ripple: (__VLS_ctx.ripple), disable: (__VLS_ctx.disable), dense: (__VLS_ctx.dense), size: (__VLS_ctx.size), dark: (__VLS_ctx.dark) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
            [modelValue, label, icon, iconRight, iconRemove, iconSelected, color, textColor, selected, square, outline, clickable, removable, ripple, disable, dense, size, dark, $attrs, emit,];
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
var __VLS_8 = ({ remove: {} },
    { onRemove: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('remove', $event);
            // @ts-ignore
            [emit,];
        } });
var __VLS_9 = {};
var __VLS_10 = __VLS_3.slots.default;
var __VLS_11 = {};
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_12 = __VLS_11;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
