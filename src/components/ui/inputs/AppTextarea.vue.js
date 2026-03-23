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
var AppInput_vue_1 = require("./AppInput.vue");
var __VLS_props = withDefaults(defineProps(), {
    outlined: true,
    filled: false,
    dense: false,
    disable: false,
    readonly: false,
    required: false,
    debounce: 0,
    autofocus: false,
    autogrow: true,
    counter: false,
    stackLabel: false,
    hideBottomSpace: false,
});
var emit = defineEmits();
var __VLS_defaults = {
    outlined: true,
    filled: false,
    dense: false,
    disable: false,
    readonly: false,
    required: false,
    debounce: 0,
    autofocus: false,
    autogrow: true,
    counter: false,
    stackLabel: false,
    hideBottomSpace: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), type: "textarea", label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), placeholder: (__VLS_ctx.placeholder), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), rules: (__VLS_ctx.rules), required: (__VLS_ctx.required), errorMessage: (__VLS_ctx.errorMessage), debounce: (__VLS_ctx.debounce), autofocus: (__VLS_ctx.autofocus), autogrow: (__VLS_ctx.autogrow), maxlength: (__VLS_ctx.maxlength), counter: (__VLS_ctx.counter), color: (__VLS_ctx.color), stackLabel: (__VLS_ctx.stackLabel), hideBottomSpace: (__VLS_ctx.hideBottomSpace) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), type: "textarea", label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), placeholder: (__VLS_ctx.placeholder), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), rules: (__VLS_ctx.rules), required: (__VLS_ctx.required), errorMessage: (__VLS_ctx.errorMessage), debounce: (__VLS_ctx.debounce), autofocus: (__VLS_ctx.autofocus), autogrow: (__VLS_ctx.autogrow), maxlength: (__VLS_ctx.maxlength), counter: (__VLS_ctx.counter), color: (__VLS_ctx.color), stackLabel: (__VLS_ctx.stackLabel), hideBottomSpace: (__VLS_ctx.hideBottomSpace) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
            [modelValue, label, hint, placeholder, outlined, filled, dense, disable, readonly, rules, required, errorMessage, debounce, autofocus, autogrow, maxlength, counter, color, stackLabel, hideBottomSpace, $attrs, emit,];
        } });
var __VLS_7 = {};
var __VLS_3;
var __VLS_4;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
