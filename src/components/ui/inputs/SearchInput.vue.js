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
    modelValue: '',
    placeholder: 'Tìm kiếm...',
    debounce: 300,
    dense: true,
    outlined: true,
    loading: false,
    clearable: true,
    autofocus: false,
});
var emit = defineEmits();
var __VLS_defaults = {
    modelValue: '',
    placeholder: 'Tìm kiếm...',
    debounce: 300,
    dense: true,
    outlined: true,
    loading: false,
    clearable: true,
    autofocus: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onClear': {} }), { modelValue: (__VLS_ctx.modelValue), type: "search", placeholder: (__VLS_ctx.placeholder), debounce: (__VLS_ctx.debounce), dense: (__VLS_ctx.dense), outlined: (__VLS_ctx.outlined), loading: (__VLS_ctx.loading), clearable: (__VLS_ctx.clearable), autofocus: (__VLS_ctx.autofocus), prependIcon: "search" }), { class: (__VLS_ctx.inputClass) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onClear': {} }), { modelValue: (__VLS_ctx.modelValue), type: "search", placeholder: (__VLS_ctx.placeholder), debounce: (__VLS_ctx.debounce), dense: (__VLS_ctx.dense), outlined: (__VLS_ctx.outlined), loading: (__VLS_ctx.loading), clearable: (__VLS_ctx.clearable), autofocus: (__VLS_ctx.autofocus), prependIcon: "search" }), { class: (__VLS_ctx.inputClass) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
            [modelValue, placeholder, debounce, dense, outlined, loading, clearable, autofocus, inputClass, emit,];
        } });
var __VLS_7 = ({ clear: {} },
    { onClear: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('clear');
            // @ts-ignore
            [emit,];
        } });
var __VLS_8 = {};
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
