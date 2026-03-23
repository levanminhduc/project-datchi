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
defineOptions({
    name: 'AppSelect',
    inheritAttrs: false
});
var attrs = (0, vue_1.useAttrs)();
var props = withDefaults(defineProps(), {
    optionValue: 'value',
    optionLabel: 'label',
    multiple: false,
    outlined: true,
    filled: false,
    dense: false,
    disable: false,
    readonly: false,
    clearable: false,
    useInput: false,
    useChips: false,
    emitValue: true,
    mapOptions: true,
    loading: false,
    hideDropdownIcon: false,
    behavior: 'menu',
    optionsDense: false,
    inputDebounce: 0,
    hideSelected: false,
    fillInput: false,
    stackLabel: false,
    hideBottomSpace: false,
    required: false,
});
var emit = defineEmits();
// Explicit v-model handler - key fix for wrapper component
var handleUpdateModelValue = function (val) {
    emit('update:modelValue', val);
};
var filteredOptions = (0, vue_1.ref)([]);
var isFiltering = (0, vue_1.ref)(false);
var computedOptions = (0, vue_1.computed)(function () {
    var _a;
    if (props.useInput && isFiltering.value) {
        return filteredOptions.value;
    }
    return (_a = props.options) !== null && _a !== void 0 ? _a : [];
});
var computedRules = (0, vue_1.computed)(function () {
    var rules = __spreadArray([], (props.rules || []), true);
    if (props.required) {
        rules.unshift(function (val) {
            if (props.multiple) {
                return (val && val.length > 0) || 'Vui lòng chọn ít nhất một mục';
            }
            return val !== null && val !== undefined && val !== '' || 'Vui lòng chọn một mục';
        });
    }
    return rules;
});
// Handle @filter event - auto-calls update() if no parent handler exists
// This prevents infinite loading when QSelect waits for update() to be called
var handleFilter = function (val, update, abort) {
    if (attrs.onFilter) {
        emit('filter', val, update, abort);
    }
    else {
        update(function () {
            var _a, _b;
            if (!val) {
                isFiltering.value = false;
                filteredOptions.value = (_a = props.options) !== null && _a !== void 0 ? _a : [];
                return;
            }
            isFiltering.value = true;
            var needle = val.toLowerCase();
            var labelFn = typeof props.optionLabel === 'function'
                ? props.optionLabel
                : function (opt) {
                    var _a;
                    if (typeof opt === 'string')
                        return opt;
                    return (_a = opt === null || opt === void 0 ? void 0 : opt[props.optionLabel]) !== null && _a !== void 0 ? _a : '';
                };
            filteredOptions.value = ((_b = props.options) !== null && _b !== void 0 ? _b : []).filter(function (opt) {
                return String(labelFn(opt)).toLowerCase().includes(needle);
            });
        });
    }
};
var __VLS_defaults = {
    optionValue: 'value',
    optionLabel: 'label',
    multiple: false,
    outlined: true,
    filled: false,
    dense: false,
    disable: false,
    readonly: false,
    clearable: false,
    useInput: false,
    useChips: false,
    emitValue: true,
    mapOptions: true,
    loading: false,
    hideDropdownIcon: false,
    behavior: 'menu',
    optionsDense: false,
    inputDebounce: 0,
    hideSelected: false,
    fillInput: false,
    stackLabel: false,
    hideBottomSpace: false,
    required: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect | typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onFilter': {} }), { 'onInputValue': {} }), { 'onPopupShow': {} }), { 'onPopupHide': {} }), { modelValue: (__VLS_ctx.modelValue), options: (__VLS_ctx.computedOptions), optionValue: (__VLS_ctx.optionValue), optionLabel: (__VLS_ctx.optionLabel), optionDisable: (__VLS_ctx.optionDisable), multiple: (__VLS_ctx.multiple), label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), clearable: (__VLS_ctx.clearable), useInput: (__VLS_ctx.useInput), useChips: (__VLS_ctx.useChips), emitValue: (__VLS_ctx.emitValue), mapOptions: (__VLS_ctx.mapOptions), color: (__VLS_ctx.color), loading: (__VLS_ctx.loading), popupContentClass: (__VLS_ctx.popupContentClass), popupContentStyle: (__VLS_ctx.popupContentStyle), hideDropdownIcon: (__VLS_ctx.hideDropdownIcon), behavior: (__VLS_ctx.behavior), dropdownIcon: (__VLS_ctx.dropdownIcon), newValueMode: (__VLS_ctx.newValueMode), maxValues: (__VLS_ctx.maxValues), optionsDense: (__VLS_ctx.optionsDense), virtualScrollSliceSize: (__VLS_ctx.virtualScrollSliceSize), inputDebounce: (__VLS_ctx.inputDebounce), hideSelected: (__VLS_ctx.hideSelected), fillInput: (__VLS_ctx.fillInput), stackLabel: (__VLS_ctx.stackLabel), hideBottomSpace: (__VLS_ctx.hideBottomSpace), rules: (__VLS_ctx.computedRules), error: (!!__VLS_ctx.errorMessage), errorMessage: (__VLS_ctx.errorMessage), lazyRules: true })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onFilter': {} }), { 'onInputValue': {} }), { 'onPopupShow': {} }), { 'onPopupHide': {} }), { modelValue: (__VLS_ctx.modelValue), options: (__VLS_ctx.computedOptions), optionValue: (__VLS_ctx.optionValue), optionLabel: (__VLS_ctx.optionLabel), optionDisable: (__VLS_ctx.optionDisable), multiple: (__VLS_ctx.multiple), label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), clearable: (__VLS_ctx.clearable), useInput: (__VLS_ctx.useInput), useChips: (__VLS_ctx.useChips), emitValue: (__VLS_ctx.emitValue), mapOptions: (__VLS_ctx.mapOptions), color: (__VLS_ctx.color), loading: (__VLS_ctx.loading), popupContentClass: (__VLS_ctx.popupContentClass), popupContentStyle: (__VLS_ctx.popupContentStyle), hideDropdownIcon: (__VLS_ctx.hideDropdownIcon), behavior: (__VLS_ctx.behavior), dropdownIcon: (__VLS_ctx.dropdownIcon), newValueMode: (__VLS_ctx.newValueMode), maxValues: (__VLS_ctx.maxValues), optionsDense: (__VLS_ctx.optionsDense), virtualScrollSliceSize: (__VLS_ctx.virtualScrollSliceSize), inputDebounce: (__VLS_ctx.inputDebounce), hideSelected: (__VLS_ctx.hideSelected), fillInput: (__VLS_ctx.fillInput), stackLabel: (__VLS_ctx.stackLabel), hideBottomSpace: (__VLS_ctx.hideBottomSpace), rules: (__VLS_ctx.computedRules), error: (!!__VLS_ctx.errorMessage), errorMessage: (__VLS_ctx.errorMessage), lazyRules: true })], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleUpdateModelValue) });
var __VLS_7 = ({ filter: {} },
    { onFilter: (__VLS_ctx.handleFilter) });
var __VLS_8 = ({ inputValue: {} },
    { onInputValue: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('inputValue', $event);
            // @ts-ignore
            [modelValue, computedOptions, optionValue, optionLabel, optionDisable, multiple, label, hint, outlined, filled, dense, disable, readonly, clearable, useInput, useChips, emitValue, mapOptions, color, loading, popupContentClass, popupContentStyle, hideDropdownIcon, behavior, dropdownIcon, newValueMode, maxValues, optionsDense, virtualScrollSliceSize, inputDebounce, hideSelected, fillInput, stackLabel, hideBottomSpace, computedRules, errorMessage, errorMessage, $attrs, handleUpdateModelValue, handleFilter, emit,];
        } });
var __VLS_9 = ({ popupShow: {} },
    { onPopupShow: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('popup-show');
            // @ts-ignore
            [emit,];
        } });
var __VLS_10 = ({ popupHide: {} },
    { onPopupHide: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('popup-hide');
            // @ts-ignore
            [emit,];
        } });
var __VLS_11 = {};
var __VLS_12 = __VLS_3.slots.default;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.$slots)); _i < _a.length; _i++) {
    var _b = _a[_i], _ = _b[0], slotName = _b[1];
    {
        var _c = __VLS_3.slots, _d = __VLS_tryAsConstant(slotName), __VLS_13 = _c[_d];
        var slotProps = __VLS_vSlot(__VLS_13)[0];
        var __VLS_14 = __assign({}, (slotProps || {}));
        var __VLS_15 = __VLS_tryAsConstant(slotName);
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
var __VLS_16 = __VLS_15, __VLS_17 = __VLS_14;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
