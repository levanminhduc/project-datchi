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
    trueValue: true,
    falseValue: false,
    toggleIndeterminate: false,
    toggleOrder: 'tf',
    keepColor: false,
    color: 'primary',
    disable: false,
    dense: false,
    leftLabel: false,
});
var emit = defineEmits();
var __VLS_defaults = {
    trueValue: true,
    falseValue: false,
    toggleIndeterminate: false,
    toggleOrder: 'tf',
    keepColor: false,
    color: 'primary',
    disable: false,
    dense: false,
    leftLabel: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qToggle | typeof __VLS_components.QToggle | typeof __VLS_components.qToggle | typeof __VLS_components.QToggle} */
qToggle;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), label: (__VLS_ctx.label), trueValue: (__VLS_ctx.trueValue), falseValue: (__VLS_ctx.falseValue), toggleIndeterminate: (__VLS_ctx.toggleIndeterminate), toggleOrder: (__VLS_ctx.toggleOrder), keepColor: (__VLS_ctx.keepColor), color: (__VLS_ctx.color), disable: (__VLS_ctx.disable), dense: (__VLS_ctx.dense), size: (__VLS_ctx.size), leftLabel: (__VLS_ctx.leftLabel), icon: (__VLS_ctx.icon), checkedIcon: (__VLS_ctx.checkedIcon), uncheckedIcon: (__VLS_ctx.uncheckedIcon), iconColor: (__VLS_ctx.iconColor), dark: (__VLS_ctx.dark) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), label: (__VLS_ctx.label), trueValue: (__VLS_ctx.trueValue), falseValue: (__VLS_ctx.falseValue), toggleIndeterminate: (__VLS_ctx.toggleIndeterminate), toggleOrder: (__VLS_ctx.toggleOrder), keepColor: (__VLS_ctx.keepColor), color: (__VLS_ctx.color), disable: (__VLS_ctx.disable), dense: (__VLS_ctx.dense), size: (__VLS_ctx.size), leftLabel: (__VLS_ctx.leftLabel), icon: (__VLS_ctx.icon), checkedIcon: (__VLS_ctx.checkedIcon), uncheckedIcon: (__VLS_ctx.uncheckedIcon), iconColor: (__VLS_ctx.iconColor), dark: (__VLS_ctx.dark) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
            [modelValue, label, trueValue, falseValue, toggleIndeterminate, toggleOrder, keepColor, color, disable, dense, size, leftLabel, icon, checkedIcon, uncheckedIcon, iconColor, dark, $attrs, emit,];
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
