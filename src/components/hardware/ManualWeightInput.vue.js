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
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var props = withDefaults(defineProps(), {
    unit: 'g'
});
var emit = defineEmits();
var localUnit = (0, vue_1.ref)(props.unit);
var inputValue = (0, vue_1.ref)(props.modelValue);
// Convert to grams for storage
var weightInGrams = (0, vue_1.computed)(function () {
    if (inputValue.value === null)
        return null;
    return localUnit.value === 'kg' ? inputValue.value * 1000 : inputValue.value;
});
(0, vue_1.watch)(weightInGrams, function (val) {
    emit('update:modelValue', val);
});
(0, vue_1.watch)(function () { return props.modelValue; }, function (val) {
    if (val === null) {
        inputValue.value = null;
    }
    else {
        // Sync back but respect current local unit
        inputValue.value = localUnit.value === 'kg' ? val / 1000 : val;
    }
}, { immediate: true });
var meters = (0, vue_1.computed)(function () {
    var _a;
    if (!weightInGrams.value || !((_a = props.threadType) === null || _a === void 0 ? void 0 : _a.density_grams_per_meter))
        return 0;
    return Math.round(weightInGrams.value / props.threadType.density_grams_per_meter);
});
var adjust = function (amount) {
    var current = inputValue.value || 0;
    inputValue.value = Math.max(0, current + amount);
};
var clear = function () {
    inputValue.value = null;
};
var __VLS_defaults = {
    unit: 'g'
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "manual-weight-input" }));
/** @type {__VLS_StyleScopedClasses['manual-weight-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm items-start" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-8" }));
/** @type {__VLS_StyleScopedClasses['col-8']} */ ;
var __VLS_0 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.inputValue),
    modelModifiers: { number: true, },
    type: "number",
    label: "Trọng lượng",
    outlined: true,
    dense: true,
    step: (__VLS_ctx.localUnit === 'kg' ? 0.01 : 1),
    min: (0),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.inputValue),
        modelModifiers: { number: true, },
        type: "number",
        label: "Trọng lượng",
        outlined: true,
        dense: true,
        step: (__VLS_ctx.localUnit === 'kg' ? 0.01 : 1),
        min: (0),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = __VLS_3.slots.default;
{
    var __VLS_6 = __VLS_3.slots.append;
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "backspace", size: "sm" })));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "backspace", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
    var __VLS_12 = void 0;
    var __VLS_13 = ({ click: {} },
        { onClick: (__VLS_ctx.clear) });
    var __VLS_10;
    var __VLS_11;
    // @ts-ignore
    [inputValue, localUnit, clear,];
}
{
    var __VLS_14 = __VLS_3.slots.after;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column q-gutter-xs" }));
    /** @type {__VLS_StyleScopedClasses['column']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    var __VLS_15 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15(__assign(__assign({ 'onClick': {} }, { dense: true, flat: true, icon: "add", size: "sm" }), { class: "bg-grey-2" })));
    var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { dense: true, flat: true, icon: "add", size: "sm" }), { class: "bg-grey-2" })], __VLS_functionalComponentArgsRest(__VLS_16), false));
    var __VLS_20 = void 0;
    var __VLS_21 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.adjust(__VLS_ctx.localUnit === 'kg' ? 0.1 : 10);
                // @ts-ignore
                [localUnit, adjust,];
            } });
    /** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
    var __VLS_18;
    var __VLS_19;
    var __VLS_22 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22(__assign(__assign({ 'onClick': {} }, { dense: true, flat: true, icon: "remove", size: "sm" }), { class: "bg-grey-2" })));
    var __VLS_24 = __VLS_23.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { dense: true, flat: true, icon: "remove", size: "sm" }), { class: "bg-grey-2" })], __VLS_functionalComponentArgsRest(__VLS_23), false));
    var __VLS_27 = void 0;
    var __VLS_28 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.adjust(__VLS_ctx.localUnit === 'kg' ? -0.1 : -10);
                // @ts-ignore
                [localUnit, adjust,];
            } });
    /** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
    var __VLS_25;
    var __VLS_26;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-4" }));
/** @type {__VLS_StyleScopedClasses['col-4']} */ ;
var __VLS_29 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
    modelValue: (__VLS_ctx.localUnit),
    options: (['g', 'kg']),
    dense: true,
    outlined: true,
    hideBottomSpace: true,
}));
var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.localUnit),
        options: (['g', 'kg']),
        dense: true,
        outlined: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_30), false));
if (__VLS_ctx.threadType && __VLS_ctx.weightInGrams) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-xs q-px-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-px-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between items-center text-caption text-grey-8" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-bold text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (__VLS_ctx.meters.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6 text-italic" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-italic']} */ ;
    (__VLS_ctx.threadType.density_grams_per_meter);
}
// @ts-ignore
[localUnit, threadType, threadType, weightInGrams, meters,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
