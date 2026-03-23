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
var FormDialog_vue_1 = require("@/components/ui/dialogs/FormDialog.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppTextarea_vue_1 = require("@/components/ui/inputs/AppTextarea.vue");
var __VLS_props = withDefaults(defineProps(), {
    productionOrderId: '',
    loading: false
});
var emit = defineEmits();
var coneId = (0, vue_1.ref)('');
var reason = (0, vue_1.ref)('job_complete');
var notes = (0, vue_1.ref)('');
var reasonOptions = [
    { label: 'Hoàn thành lệnh sản xuất', value: 'job_complete' },
    { label: 'Hủy lệnh sản xuất', value: 'job_cancelled' },
    { label: 'Sản phẩm lỗi/hỏng', value: 'defective' },
    { label: 'Lý do khác', value: 'other' }
];
var resetForm = function () {
    coneId.value = '';
    reason.value = 'job_complete';
    notes.value = '';
};
var onSubmit = function () {
    emit('submit', {
        coneId: coneId.value,
        reason: reason.value,
        notes: notes.value
    });
};
var onCancel = function () {
    emit('update:modelValue', false);
    resetForm();
};
var __VLS_defaults = {
    productionOrderId: '',
    loading: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = FormDialog_vue_1.default || FormDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: "Yêu cầu hoàn trả cuộn chỉ", loading: (__VLS_ctx.loading), maxWidth: "500px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: "Yêu cầu hoàn trả cuộn chỉ", loading: (__VLS_ctx.loading), maxWidth: "500px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (function (val) { return __VLS_ctx.emit('update:modelValue', val); }) });
var __VLS_7 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.onSubmit) });
var __VLS_8 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.onCancel) });
var __VLS_9 = {};
var __VLS_10 = __VLS_3.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['column']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_11 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
    modelValue: (__VLS_ctx.coneId),
    label: "Mã vạch cuộn chỉ",
    required: true,
    autofocus: true,
    prependIcon: "qr_code_scanner",
    placeholder: "Quét hoặc nhập mã cuộn chỉ...",
}));
var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.coneId),
        label: "Mã vạch cuộn chỉ",
        required: true,
        autofocus: true,
        prependIcon: "qr_code_scanner",
        placeholder: "Quét hoặc nhập mã cuộn chỉ...",
    }], __VLS_functionalComponentArgsRest(__VLS_12), false));
if (__VLS_ctx.productionOrderId) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-px-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-px-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    (__VLS_ctx.productionOrderId);
}
var __VLS_16 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.reason),
    label: "Lý do hoàn trả",
    options: (__VLS_ctx.reasonOptions),
    required: true,
    emitValue: true,
    mapOptions: true,
}));
var __VLS_18 = __VLS_17.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.reason),
        label: "Lý do hoàn trả",
        options: (__VLS_ctx.reasonOptions),
        required: true,
        emitValue: true,
        mapOptions: true,
    }], __VLS_functionalComponentArgsRest(__VLS_17), false));
var __VLS_21 = AppTextarea_vue_1.default;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
    modelValue: (__VLS_ctx.notes),
    label: "Ghi chú",
    placeholder: "Nhập thêm thông tin nếu cần...",
    rows: "3",
}));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.notes),
        label: "Ghi chú",
        placeholder: "Nhập thêm thông tin nếu cần...",
        rows: "3",
    }], __VLS_functionalComponentArgsRest(__VLS_22), false));
// @ts-ignore
[modelValue, loading, emit, onSubmit, onCancel, coneId, productionOrderId, productionOrderId, reason, reasonOptions, notes,];
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
