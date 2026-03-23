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
    modelValue: false,
    title: '',
    submitText: 'Lưu',
    cancelText: 'Hủy',
    loading: false,
    persistent: true,
    resetOnClose: true,
    maxWidth: '500px'
});
var emit = defineEmits();
var dialogValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); }
});
var onSubmit = function () {
    emit('submit');
};
var onCancel = function () {
    emit('cancel');
    dialogValue.value = false;
};
var onHide = function () {
    emit('hide');
};
var __VLS_defaults = {
    modelValue: false,
    title: '',
    submitText: 'Lưu',
    cancelText: 'Hủy',
    loading: false,
    persistent: true,
    resetOnClose: true,
    maxWidth: '500px'
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onHide': {} }, { modelValue: (__VLS_ctx.dialogValue), persistent: (__VLS_ctx.persistent) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onHide': {} }, { modelValue: (__VLS_ctx.dialogValue), persistent: (__VLS_ctx.persistent) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ hide: {} },
    { onHide: (__VLS_ctx.onHide) });
var __VLS_7 = {};
var __VLS_8 = __VLS_3.slots.default;
var __VLS_9;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9(__assign({ style: ({ maxWidth: __VLS_ctx.maxWidth, width: '100%' }) })));
var __VLS_11 = __VLS_10.apply(void 0, __spreadArray([__assign({ style: ({ maxWidth: __VLS_ctx.maxWidth, width: '100%' }) })], __VLS_functionalComponentArgsRest(__VLS_10), false));
var __VLS_14 = __VLS_12.slots.default;
var __VLS_15;
/** @ts-ignore @type {typeof __VLS_components.qForm | typeof __VLS_components.QForm | typeof __VLS_components.qForm | typeof __VLS_components.QForm} */
qForm;
// @ts-ignore
var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15(__assign({ 'onSubmit': {} })));
var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([__assign({ 'onSubmit': {} })], __VLS_functionalComponentArgsRest(__VLS_16), false));
var __VLS_20;
var __VLS_21 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.onSubmit) });
var __VLS_22 = __VLS_18.slots.default;
var __VLS_23;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23(__assign({ class: "row items-center q-pb-none" })));
var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_24), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_28 = __VLS_26.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
(__VLS_ctx.title);
var __VLS_29;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({}));
var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_30), false));
if (!__VLS_ctx.loading) {
    var __VLS_34 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }));
    var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([{
            icon: "close",
            flat: true,
            round: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_35), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
}
// @ts-ignore
[dialogValue, persistent, onHide, maxWidth, onSubmit, title, loading, vClosePopup,];
var __VLS_26;
var __VLS_39;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39(__assign({ class: "q-pt-md" })));
var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([__assign({ class: "q-pt-md" })], __VLS_functionalComponentArgsRest(__VLS_40), false));
/** @type {__VLS_StyleScopedClasses['q-pt-md']} */ ;
var __VLS_44 = __VLS_42.slots.default;
var __VLS_45 = {};
// @ts-ignore
[];
var __VLS_42;
var __VLS_47;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47(__assign({ align: "right" }, { class: "text-primary q-pa-md" })));
var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "text-primary q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_48), false));
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_52 = __VLS_50.slots.default;
var __VLS_53;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53(__assign({ 'onClick': {} }, { flat: true, label: (__VLS_ctx.cancelText), color: "grey", disable: (__VLS_ctx.loading) })));
var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: (__VLS_ctx.cancelText), color: "grey", disable: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_54), false));
var __VLS_58;
var __VLS_59 = ({ click: {} },
    { onClick: (__VLS_ctx.onCancel) });
var __VLS_56;
var __VLS_57;
var __VLS_60;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
    unelevated: true,
    type: "submit",
    label: (__VLS_ctx.submitText),
    color: "primary",
    loading: (__VLS_ctx.loading),
}));
var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([{
        unelevated: true,
        type: "submit",
        label: (__VLS_ctx.submitText),
        color: "primary",
        loading: (__VLS_ctx.loading),
    }], __VLS_functionalComponentArgsRest(__VLS_61), false));
// @ts-ignore
[loading, loading, cancelText, onCancel, submitText,];
var __VLS_50;
// @ts-ignore
[];
var __VLS_18;
var __VLS_19;
// @ts-ignore
[];
var __VLS_12;
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_46 = __VLS_45;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
