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
    type: 'text',
    outlined: true,
    filled: false,
    borderless: false,
    dense: false,
    disable: false,
    readonly: false,
    required: false,
    clearable: false,
    debounce: 0,
    autofocus: false,
    autogrow: false,
    counter: false,
    loading: false,
    stackLabel: false,
    hideBottomSpace: false,
});
var emit = defineEmits();
var computedRules = (0, vue_1.computed)(function () {
    var rules = __spreadArray([], (props.rules || []), true);
    if (props.required) {
        rules.unshift(function (val) { return !!(val === null || val === void 0 ? void 0 : val.toString().trim()) || 'Trường này là bắt buộc'; });
    }
    return rules;
});
var handleClear = function () {
    emit('update:modelValue', '');
    emit('clear');
};
var __VLS_defaults = {
    type: 'text',
    outlined: true,
    filled: false,
    borderless: false,
    dense: false,
    disable: false,
    readonly: false,
    required: false,
    clearable: false,
    debounce: 0,
    autofocus: false,
    autogrow: false,
    counter: false,
    loading: false,
    stackLabel: false,
    hideBottomSpace: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onFocus': {} }), { 'onBlur': {} }), { modelValue: (__VLS_ctx.modelValue), type: (__VLS_ctx.type), label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), placeholder: (__VLS_ctx.placeholder), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), standout: (__VLS_ctx.standout), borderless: (__VLS_ctx.borderless), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), rules: (__VLS_ctx.computedRules), error: (!!__VLS_ctx.errorMessage), errorMessage: (__VLS_ctx.errorMessage), debounce: (__VLS_ctx.debounce), autofocus: (__VLS_ctx.autofocus), autogrow: (__VLS_ctx.autogrow), maxlength: (__VLS_ctx.maxlength), counter: (__VLS_ctx.counter), mask: (__VLS_ctx.mask), loading: (__VLS_ctx.loading), color: (__VLS_ctx.color), labelColor: (__VLS_ctx.labelColor), bgColor: (__VLS_ctx.bgColor), stackLabel: (__VLS_ctx.stackLabel), hideBottomSpace: (__VLS_ctx.hideBottomSpace), lazyRules: true })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onFocus': {} }), { 'onBlur': {} }), { modelValue: (__VLS_ctx.modelValue), type: (__VLS_ctx.type), label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), placeholder: (__VLS_ctx.placeholder), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), standout: (__VLS_ctx.standout), borderless: (__VLS_ctx.borderless), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), rules: (__VLS_ctx.computedRules), error: (!!__VLS_ctx.errorMessage), errorMessage: (__VLS_ctx.errorMessage), debounce: (__VLS_ctx.debounce), autofocus: (__VLS_ctx.autofocus), autogrow: (__VLS_ctx.autogrow), maxlength: (__VLS_ctx.maxlength), counter: (__VLS_ctx.counter), mask: (__VLS_ctx.mask), loading: (__VLS_ctx.loading), color: (__VLS_ctx.color), labelColor: (__VLS_ctx.labelColor), bgColor: (__VLS_ctx.bgColor), stackLabel: (__VLS_ctx.stackLabel), hideBottomSpace: (__VLS_ctx.hideBottomSpace), lazyRules: true })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
            [modelValue, type, label, hint, placeholder, outlined, filled, standout, borderless, dense, disable, readonly, computedRules, errorMessage, errorMessage, debounce, autofocus, autogrow, maxlength, counter, mask, loading, color, labelColor, bgColor, stackLabel, hideBottomSpace, $attrs, emit,];
        } });
var __VLS_7 = ({ focus: {} },
    { onFocus: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('focus', $event);
            // @ts-ignore
            [emit,];
        } });
var __VLS_8 = ({ blur: {} },
    { onBlur: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('blur', $event);
            // @ts-ignore
            [emit,];
        } });
var __VLS_9 = {};
var __VLS_10 = __VLS_3.slots.default;
if (__VLS_ctx.prependIcon || __VLS_ctx.$slots.prepend) {
    {
        var __VLS_11 = __VLS_3.slots.prepend;
        var __VLS_12 = {};
        var __VLS_14 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
            name: (__VLS_ctx.prependIcon),
        }));
        var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([{
                name: (__VLS_ctx.prependIcon),
            }], __VLS_functionalComponentArgsRest(__VLS_15), false));
        // @ts-ignore
        [prependIcon, prependIcon, $slots,];
    }
}
if (__VLS_ctx.appendIcon || __VLS_ctx.clearable || __VLS_ctx.$slots.append) {
    {
        var __VLS_19 = __VLS_3.slots.append;
        var __VLS_20 = {};
        if (__VLS_ctx.clearable && __VLS_ctx.modelValue) {
            var __VLS_22 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22(__assign(__assign({ 'onClick': {} }, { name: "close" }), { class: "cursor-pointer" })));
            var __VLS_24 = __VLS_23.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { name: "close" }), { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_23), false));
            var __VLS_27 = void 0;
            var __VLS_28 = ({ click: {} },
                { onClick: (__VLS_ctx.handleClear) });
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            var __VLS_25;
            var __VLS_26;
        }
        else if (__VLS_ctx.appendIcon) {
            var __VLS_29 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
                name: (__VLS_ctx.appendIcon),
            }));
            var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{
                    name: (__VLS_ctx.appendIcon),
                }], __VLS_functionalComponentArgsRest(__VLS_30), false));
        }
        // @ts-ignore
        [modelValue, $slots, appendIcon, appendIcon, appendIcon, clearable, clearable, handleClear,];
    }
}
if (__VLS_ctx.$slots.before) {
    {
        var __VLS_34 = __VLS_3.slots.before;
        var __VLS_35 = {};
        // @ts-ignore
        [$slots,];
    }
}
if (__VLS_ctx.$slots.after) {
    {
        var __VLS_37 = __VLS_3.slots.after;
        var __VLS_38 = {};
        // @ts-ignore
        [$slots,];
    }
}
var __VLS_40 = {};
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_13 = __VLS_12, __VLS_21 = __VLS_20, __VLS_36 = __VLS_35, __VLS_39 = __VLS_38, __VLS_41 = __VLS_40;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
