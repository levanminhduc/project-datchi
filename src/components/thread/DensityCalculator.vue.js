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
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var props = withDefaults(defineProps(), {
    modelValue: null,
    readonly: false,
});
var emit = defineEmits();
var mode = (0, vue_1.ref)('calculate');
// Calculate Logic
var sampleWeight = (0, vue_1.ref)(null);
var sampleLength = (0, vue_1.ref)(null);
var calculatedDensity = (0, vue_1.ref)(null);
var calculateDensity = function () {
    if (sampleWeight.value && sampleWeight.value > 0 && sampleLength.value && sampleLength.value > 0) {
        var density = sampleWeight.value / sampleLength.value;
        calculatedDensity.value = Math.round(density * 10000) / 10000; // 4 decimal places
    }
    else {
        calculatedDensity.value = null;
    }
};
var applyDensity = function () {
    if (calculatedDensity.value) {
        emit('update:modelValue', calculatedDensity.value);
        mode.value = 'convert';
    }
};
// Conversion Logic
var conversionWeight = (0, vue_1.ref)(null);
var conversionMeters = (0, vue_1.ref)(null);
var convertedMeters = (0, vue_1.computed)(function () {
    if (props.modelValue && conversionWeight.value && conversionWeight.value > 0) {
        return conversionWeight.value / props.modelValue;
    }
    return null;
});
var convertedWeight = (0, vue_1.computed)(function () {
    if (props.modelValue && conversionMeters.value && conversionMeters.value > 0) {
        return conversionMeters.value * props.modelValue;
    }
    return null;
});
var formatNumber = function (val) {
    return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 2,
    }).format(val);
};
var __VLS_defaults = {
    modelValue: null,
    readonly: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ flat: true, bordered: true }, { class: "density-calculator" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "density-calculator" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['density-calculator']} */ ;
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-primary q-mb-sm flex items-center" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13(__assign({ name: "calculate", size: "20px" }, { class: "q-mr-xs" })));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([__assign({ name: "calculate", size: "20px" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_14), false));
/** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
var __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
qTabs;
// @ts-ignore
var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18(__assign(__assign({ modelValue: (__VLS_ctx.mode), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "justify", narrowIndicator: true })));
var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.mode), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "justify", narrowIndicator: true })], __VLS_functionalComponentArgsRest(__VLS_19), false));
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
var __VLS_23 = __VLS_21.slots.default;
var __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    name: "calculate",
    label: "Tính từ mẫu",
}));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{
        name: "calculate",
        label: "Tính từ mẫu",
    }], __VLS_functionalComponentArgsRest(__VLS_25), false));
var __VLS_29;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
    name: "convert",
    label: "Chuyển đổi",
}));
var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{
        name: "convert",
        label: "Chuyển đổi",
    }], __VLS_functionalComponentArgsRest(__VLS_30), false));
// @ts-ignore
[mode,];
var __VLS_21;
var __VLS_34;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({}));
var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_35), false));
var __VLS_39;
/** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
qTabPanels;
// @ts-ignore
var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
    modelValue: (__VLS_ctx.mode),
    animated: true,
}));
var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.mode),
        animated: true,
    }], __VLS_functionalComponentArgsRest(__VLS_40), false));
var __VLS_44 = __VLS_42.slots.default;
var __VLS_45;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45(__assign({ name: "calculate" }, { class: "q-pa-md" })));
var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([__assign({ name: "calculate" }, { class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_46), false));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_50 = __VLS_48.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_51 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.sampleWeight), modelModifiers: { number: true, }, type: "number", label: "Trọng lượng mẫu (g)", placeholder: "Nhập trọng lượng", suffix: "g", readonly: (__VLS_ctx.readonly) })));
var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.sampleWeight), modelModifiers: { number: true, }, type: "number", label: "Trọng lượng mẫu (g)", placeholder: "Nhập trọng lượng", suffix: "g", readonly: (__VLS_ctx.readonly) })], __VLS_functionalComponentArgsRest(__VLS_52), false));
var __VLS_56;
var __VLS_57 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.calculateDensity) });
var __VLS_54;
var __VLS_55;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_58 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.sampleLength), modelModifiers: { number: true, }, type: "number", label: "Chiều dài mẫu (m)", placeholder: "Nhập chiều dài", suffix: "m", readonly: (__VLS_ctx.readonly) })));
var __VLS_60 = __VLS_59.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.sampleLength), modelModifiers: { number: true, }, type: "number", label: "Chiều dài mẫu (m)", placeholder: "Nhập chiều dài", suffix: "m", readonly: (__VLS_ctx.readonly) })], __VLS_functionalComponentArgsRest(__VLS_59), false));
var __VLS_63;
var __VLS_64 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.calculateDensity) });
var __VLS_61;
var __VLS_62;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
var __VLS_65 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65({
    modelValue: (__VLS_ctx.calculatedDensity),
    modelModifiers: { number: true, },
    type: "number",
    label: "Mật độ tính được",
    readonly: true,
    filled: true,
    hint: "Đơn vị: g/m",
}));
var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.calculatedDensity),
        modelModifiers: { number: true, },
        type: "number",
        label: "Mật độ tính được",
        readonly: true,
        filled: true,
        hint: "Đơn vị: g/m",
    }], __VLS_functionalComponentArgsRest(__VLS_66), false));
if (!__VLS_ctx.readonly) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_70 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70(__assign({ 'onClick': {} }, { label: "Áp dụng", color: "primary", icon: "check", disable: (!__VLS_ctx.calculatedDensity) })));
    var __VLS_72 = __VLS_71.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Áp dụng", color: "primary", icon: "check", disable: (!__VLS_ctx.calculatedDensity) })], __VLS_functionalComponentArgsRest(__VLS_71), false));
    var __VLS_75 = void 0;
    var __VLS_76 = ({ click: {} },
        { onClick: (__VLS_ctx.applyDensity) });
    var __VLS_73;
    var __VLS_74;
}
// @ts-ignore
[mode, sampleWeight, readonly, readonly, readonly, calculateDensity, calculateDensity, sampleLength, calculatedDensity, calculatedDensity, applyDensity,];
var __VLS_48;
var __VLS_77;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77(__assign({ name: "convert" }, { class: "q-pa-md" })));
var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([__assign({ name: "convert" }, { class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_78), false));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_82 = __VLS_80.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7 q-mb-xs" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.modelValue || 0);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_83 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
    modelValue: (__VLS_ctx.conversionWeight),
    modelModifiers: { number: true, },
    type: "number",
    label: "Nhập trọng lượng (g)",
    placeholder: "Để tính chiều dài",
    suffix: "g",
}));
var __VLS_85 = __VLS_84.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.conversionWeight),
        modelModifiers: { number: true, },
        type: "number",
        label: "Nhập trọng lượng (g)",
        placeholder: "Để tính chiều dài",
        suffix: "g",
    }], __VLS_functionalComponentArgsRest(__VLS_84), false));
if (__VLS_ctx.convertedMeters) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm text-subtitle2" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.convertedMeters));
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_88 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
    modelValue: (__VLS_ctx.conversionMeters),
    modelModifiers: { number: true, },
    type: "number",
    label: "Nhập chiều dài (m)",
    placeholder: "Để tính trọng lượng",
    suffix: "m",
}));
var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.conversionMeters),
        modelModifiers: { number: true, },
        type: "number",
        label: "Nhập chiều dài (m)",
        placeholder: "Để tính trọng lượng",
        suffix: "m",
    }], __VLS_functionalComponentArgsRest(__VLS_89), false));
if (__VLS_ctx.convertedWeight) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm text-subtitle2" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.convertedWeight));
}
if (!__VLS_ctx.modelValue) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    var __VLS_93 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93(__assign({ dense: true }, { class: "bg-orange-1 text-orange-9 rounded-borders" })));
    var __VLS_95 = __VLS_94.apply(void 0, __spreadArray([__assign({ dense: true }, { class: "bg-orange-1 text-orange-9 rounded-borders" })], __VLS_functionalComponentArgsRest(__VLS_94), false));
    /** @type {__VLS_StyleScopedClasses['bg-orange-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-orange-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    var __VLS_98 = __VLS_96.slots.default;
    {
        var __VLS_99 = __VLS_96.slots.avatar;
        var __VLS_100 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100({
            name: "warning",
        }));
        var __VLS_102 = __VLS_101.apply(void 0, __spreadArray([{
                name: "warning",
            }], __VLS_functionalComponentArgsRest(__VLS_101), false));
        // @ts-ignore
        [modelValue, modelValue, conversionWeight, convertedMeters, convertedMeters, formatNumber, formatNumber, conversionMeters, convertedWeight, convertedWeight,];
    }
    // @ts-ignore
    [];
    var __VLS_96;
}
// @ts-ignore
[];
var __VLS_80;
// @ts-ignore
[];
var __VLS_42;
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
