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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var FormDialog_vue_1 = require("@/components/ui/dialogs/FormDialog.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var props = withDefaults(defineProps(), {
    recovery: null,
    loading: false
});
var emit = defineEmits();
var weight = (0, vue_1.ref)(null);
var notes = (0, vue_1.ref)('');
var rejectReason = (0, vue_1.ref)('');
var showRejectInput = (0, vue_1.ref)(false);
var threadType = (0, vue_1.computed)(function () { var _a, _b; return (_b = (_a = props.recovery) === null || _a === void 0 ? void 0 : _a.cone) === null || _b === void 0 ? void 0 : _b.thread_type; });
var density = (0, vue_1.computed)(function () { var _a; return ((_a = threadType.value) === null || _a === void 0 ? void 0 : _a.density_grams_per_meter) || 0; });
var remainingMeters = (0, vue_1.computed)(function () {
    if (!weight.value || !density.value)
        return 0;
    return Math.round(weight.value / density.value);
});
var consumedMeters = (0, vue_1.computed)(function () {
    var _a;
    var original = ((_a = props.recovery) === null || _a === void 0 ? void 0 : _a.original_meters) || 0;
    return Math.max(0, original - remainingMeters.value);
});
var isAbnormal = (0, vue_1.computed)(function () {
    var _a;
    var original = ((_a = props.recovery) === null || _a === void 0 ? void 0 : _a.original_meters) || 0;
    if (!original)
        return false;
    // Flag if consumption is > 95% or weirdly negative (handled by max(0))
    return consumedMeters.value > original * 0.95;
});
(0, vue_1.watch)(function () { return props.modelValue; }, function (val) {
    if (val) {
        weight.value = null;
        notes.value = '';
        rejectReason.value = '';
        showRejectInput.value = false;
    }
});
var onConfirm = function () {
    if (weight.value === null)
        return;
    emit('confirm', {
        weight: weight.value,
        notes: notes.value
    });
};
var onReject = function () {
    if (!showRejectInput.value) {
        showRejectInput.value = true;
        return;
    }
    if (!rejectReason.value)
        return;
    emit('reject', {
        reason: rejectReason.value
    });
};
var onCancel = function () {
    emit('update:modelValue', false);
};
var __VLS_defaults = {
    recovery: null,
    loading: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = FormDialog_vue_1.default || FormDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: "Cân và xác nhận cuộn chỉ", loading: (__VLS_ctx.loading), maxWidth: "500px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: "Cân và xác nhận cuộn chỉ", loading: (__VLS_ctx.loading), maxWidth: "500px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (function (val) { return __VLS_ctx.emit('update:modelValue', val); }) });
var __VLS_7 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.onConfirm) });
var __VLS_8 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.onCancel) });
var __VLS_9 = {};
var __VLS_10 = __VLS_3.slots.default;
if (__VLS_ctx.recovery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['column']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    var __VLS_11 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11(__assign({ flat: true, bordered: true }, { class: "bg-grey-1" })));
    var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "bg-grey-1" })], __VLS_functionalComponentArgsRest(__VLS_12), false));
    /** @type {__VLS_StyleScopedClasses['bg-grey-1']} */ ;
    var __VLS_16 = __VLS_14.slots.default;
    var __VLS_17 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17(__assign({ class: "q-py-sm" })));
    var __VLS_19 = __VLS_18.apply(void 0, __spreadArray([__assign({ class: "q-py-sm" })], __VLS_functionalComponentArgsRest(__VLS_18), false));
    /** @type {__VLS_StyleScopedClasses['q-py-sm']} */ ;
    var __VLS_22 = __VLS_20.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between items-center" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-bold" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    ((_a = __VLS_ctx.recovery.cone) === null || _a === void 0 ? void 0 : _a.cone_id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between items-center" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (((_b = __VLS_ctx.threadType) === null || _b === void 0 ? void 0 : _b.name) || 'N/A');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between items-center" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.recovery.original_meters.toLocaleString());
    // @ts-ignore
    [modelValue, loading, emit, onConfirm, onCancel, recovery, recovery, recovery, threadType,];
    var __VLS_20;
    // @ts-ignore
    [];
    var __VLS_14;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm items-start" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    var __VLS_23 = AppInput_vue_1.default;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        modelValue: (__VLS_ctx.weight),
        modelModifiers: { number: true, },
        label: "Trọng lượng thực tế (grams)",
        type: "number",
        required: true,
        autofocus: true,
        prependIcon: "scale",
        suffix: "g",
        hint: "Nhập trọng lượng sau khi trừ lõi (nếu có)",
    }));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.weight),
            modelModifiers: { number: true, },
            label: "Trọng lượng thực tế (grams)",
            type: "number",
            required: true,
            autofocus: true,
            prependIcon: "scale",
            suffix: "g",
            hint: "Nhập trọng lượng sau khi trừ lõi (nếu có)",
        }], __VLS_functionalComponentArgsRest(__VLS_24), false));
    if (__VLS_ctx.weight) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-sm rounded-borders bg-blue-1 text-blue-9" }));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-blue-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-blue-9']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-bold" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        (__VLS_ctx.remainingMeters.toLocaleString());
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-bold" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        (__VLS_ctx.consumedMeters.toLocaleString());
    }
    if (__VLS_ctx.isAbnormal) {
        var __VLS_28 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
        qBanner;
        // @ts-ignore
        var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign({ dense: true }, { class: "bg-amber-1 text-amber-9 rounded-borders" })));
        var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign({ dense: true }, { class: "bg-amber-1 text-amber-9 rounded-borders" })], __VLS_functionalComponentArgsRest(__VLS_29), false));
        /** @type {__VLS_StyleScopedClasses['bg-amber-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        var __VLS_33 = __VLS_31.slots.default;
        {
            var __VLS_34 = __VLS_31.slots.avatar;
            var __VLS_35 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
                name: "warning",
                color: "amber-9",
            }));
            var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([{
                    name: "warning",
                    color: "amber-9",
                }], __VLS_functionalComponentArgsRest(__VLS_36), false));
            // @ts-ignore
            [weight, weight, remainingMeters, consumedMeters, isAbnormal,];
        }
        // @ts-ignore
        [];
        var __VLS_31;
    }
    var __VLS_40 = AppInput_vue_1.default;
    // @ts-ignore
    var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        modelValue: (__VLS_ctx.notes),
        label: "Ghi chú",
        placeholder: "Ghi chú về tình trạng cuộn chỉ...",
    }));
    var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.notes),
            label: "Ghi chú",
            placeholder: "Ghi chú về tình trạng cuộn chỉ...",
        }], __VLS_functionalComponentArgsRest(__VLS_41), false));
    if (__VLS_ctx.showRejectInput) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm" }));
        /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
        var __VLS_45 = AppInput_vue_1.default;
        // @ts-ignore
        var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
            modelValue: (__VLS_ctx.rejectReason),
            label: "Lý do từ chối",
            required: true,
            color: "negative",
            placeholder: "Tại sao bạn từ chối cuộn chỉ này?",
        }));
        var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.rejectReason),
                label: "Lý do từ chối",
                required: true,
                color: "negative",
                placeholder: "Tại sao bạn từ chối cuộn chỉ này?",
            }], __VLS_functionalComponentArgsRest(__VLS_46), false));
    }
}
{
    var __VLS_50 = __VLS_3.slots["footer-actions"];
    if (!__VLS_ctx.showRejectInput) {
        var __VLS_51 = AppButton_vue_1.default;
        // @ts-ignore
        var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51(__assign({ 'onClick': {} }, { flat: true, label: "Từ chối", color: "negative" })));
        var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Từ chối", color: "negative" })], __VLS_functionalComponentArgsRest(__VLS_52), false));
        var __VLS_56 = void 0;
        var __VLS_57 = ({ click: {} },
            { onClick: (__VLS_ctx.onReject) });
        var __VLS_54;
        var __VLS_55;
    }
    else {
        var __VLS_58 = AppButton_vue_1.default;
        // @ts-ignore
        var __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58(__assign({ 'onClick': {} }, { label: "Xác nhận từ chối", color: "negative", disable: (!__VLS_ctx.rejectReason) })));
        var __VLS_60 = __VLS_59.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Xác nhận từ chối", color: "negative", disable: (!__VLS_ctx.rejectReason) })], __VLS_functionalComponentArgsRest(__VLS_59), false));
        var __VLS_63 = void 0;
        var __VLS_64 = ({ click: {} },
            { onClick: (__VLS_ctx.onReject) });
        var __VLS_61;
        var __VLS_62;
    }
    // @ts-ignore
    [notes, showRejectInput, showRejectInput, rejectReason, rejectReason, onReject, onReject,];
}
// @ts-ignore
[];
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
