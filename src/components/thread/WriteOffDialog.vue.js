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
var AppCheckbox_vue_1 = require("@/components/ui/inputs/AppCheckbox.vue");
var props = withDefaults(defineProps(), {
    recovery: null,
    loading: false
});
var emit = defineEmits();
var supervisorNotes = (0, vue_1.ref)('');
var isApproved = (0, vue_1.ref)(false);
var threadType = (0, vue_1.computed)(function () { var _a, _b; return (_b = (_a = props.recovery) === null || _a === void 0 ? void 0 : _a.cone) === null || _b === void 0 ? void 0 : _b.thread_type; });
var remainingWeight = (0, vue_1.computed)(function () { var _a; return ((_a = props.recovery) === null || _a === void 0 ? void 0 : _a.returned_weight_grams) || 0; });
var remainingMeters = (0, vue_1.computed)(function () { var _a; return ((_a = props.recovery) === null || _a === void 0 ? void 0 : _a.remaining_meters) || 0; });
var isTooHeavy = (0, vue_1.computed)(function () { return remainingWeight.value > 50; });
(0, vue_1.watch)(function () { return props.modelValue; }, function (val) {
    if (val) {
        supervisorNotes.value = '';
        isApproved.value = false;
    }
});
var onSubmit = function () {
    if (!isApproved.value)
        return;
    emit('confirm', {
        supervisorNotes: supervisorNotes.value
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
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: "Phê duyệt hủy cuộn chỉ (Write-off)", loading: (__VLS_ctx.loading), maxWidth: "500px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: "Phê duyệt hủy cuộn chỉ (Write-off)", loading: (__VLS_ctx.loading), maxWidth: "500px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (function (val) { return __VLS_ctx.emit('update:modelValue', val); }) });
var __VLS_7 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.onSubmit) });
var __VLS_8 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.onCancel) });
var __VLS_9 = {};
var __VLS_10 = __VLS_3.slots.default;
if (__VLS_ctx.recovery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column q-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['column']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
    var __VLS_11 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11(__assign({ dense: true }, { class: "bg-red-1 text-red-9 rounded-borders" })));
    var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([__assign({ dense: true }, { class: "bg-red-1 text-red-9 rounded-borders" })], __VLS_functionalComponentArgsRest(__VLS_12), false));
    /** @type {__VLS_StyleScopedClasses['bg-red-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    var __VLS_16 = __VLS_14.slots.default;
    {
        var __VLS_17 = __VLS_14.slots.avatar;
        var __VLS_18 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
            name: "delete_forever",
            color: "red-9",
        }));
        var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{
                name: "delete_forever",
                color: "red-9",
            }], __VLS_functionalComponentArgsRest(__VLS_19), false));
        // @ts-ignore
        [modelValue, loading, emit, onSubmit, onCancel, recovery,];
    }
    // @ts-ignore
    [];
    var __VLS_14;
    var __VLS_23 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        flat: true,
        bordered: true,
    }));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_24), false));
    var __VLS_28 = __VLS_26.slots.default;
    var __VLS_29 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29(__assign({ class: "q-py-sm" })));
    var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([__assign({ class: "q-py-sm" })], __VLS_functionalComponentArgsRest(__VLS_30), false));
    /** @type {__VLS_StyleScopedClasses['q-py-sm']} */ ;
    var __VLS_34 = __VLS_32.slots.default;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-bold text-negative" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    (__VLS_ctx.remainingWeight);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between items-center" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.remainingMeters.toLocaleString());
    // @ts-ignore
    [recovery, threadType, remainingWeight, remainingMeters,];
    var __VLS_32;
    // @ts-ignore
    [];
    var __VLS_26;
    if (__VLS_ctx.isTooHeavy) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-sm rounded-borders bg-amber-1 text-amber-9 text-caption" }));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-amber-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        var __VLS_35 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign({ name: "warning" }, { class: "q-mr-xs" })));
        var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign({ name: "warning" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_36), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    }
    var __VLS_40 = AppInput_vue_1.default;
    // @ts-ignore
    var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        modelValue: (__VLS_ctx.supervisorNotes),
        label: "Lý do hủy & Ghi chú phê duyệt",
        required: true,
        autogrow: true,
        placeholder: "Nhập lý do tại sao cuộn chỉ này bị hủy...",
    }));
    var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.supervisorNotes),
            label: "Lý do hủy & Ghi chú phê duyệt",
            required: true,
            autogrow: true,
            placeholder: "Nhập lý do tại sao cuộn chỉ này bị hủy...",
        }], __VLS_functionalComponentArgsRest(__VLS_41), false));
    var __VLS_45 = AppCheckbox_vue_1.default;
    // @ts-ignore
    var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
        modelValue: (__VLS_ctx.isApproved),
        label: "Tôi xác nhận phê duyệt hủy cuộn chỉ này",
        color: "negative",
        required: true,
    }));
    var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.isApproved),
            label: "Tôi xác nhận phê duyệt hủy cuộn chỉ này",
            color: "negative",
            required: true,
        }], __VLS_functionalComponentArgsRest(__VLS_46), false));
}
// @ts-ignore
[isTooHeavy, supervisorNotes, isApproved,];
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
