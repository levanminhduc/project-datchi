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
    title: 'Xác nhận',
    confirmText: 'Đồng ý',
    cancelText: 'Hủy',
    type: 'info',
    loading: false,
    persistent: false
});
var emit = defineEmits();
// Map type to icon
var typeIcon = (0, vue_1.computed)(function () {
    if (props.icon)
        return props.icon;
    var iconMap = {
        info: 'mdi-information',
        warning: 'mdi-alert',
        error: 'mdi-alert-circle',
        success: 'mdi-check-circle'
    };
    return iconMap[props.type];
});
// Map type to color for icon
var typeColor = (0, vue_1.computed)(function () {
    var colorMap = {
        info: 'info',
        warning: 'warning',
        error: 'negative',
        success: 'positive'
    };
    return colorMap[props.type];
});
// Confirm button color
var buttonColor = (0, vue_1.computed)(function () {
    if (props.confirmColor)
        return props.confirmColor;
    if (props.type === 'error')
        return 'negative';
    return 'primary';
});
var dialogValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); }
});
var onConfirm = function () {
    emit('confirm');
    // We don't automatically close if we want to handle loading state externally
    // But usually confirmation dialogs close after confirm unless loading is handled here
    if (!props.loading) {
        dialogValue.value = false;
    }
};
var onCancel = function () {
    emit('cancel');
    dialogValue.value = false;
};
var __VLS_defaults = {
    modelValue: false,
    title: 'Xác nhận',
    confirmText: 'Đồng ý',
    cancelText: 'Hủy',
    type: 'info',
    loading: false,
    persistent: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.dialogValue),
    persistent: (__VLS_ctx.persistent || __VLS_ctx.loading),
    transitionShow: "scale",
    transitionHide: "scale",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.dialogValue),
        persistent: (__VLS_ctx.persistent || __VLS_ctx.loading),
        transitionShow: "scale",
        transitionHide: "scale",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ style: {} })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13(__assign({ class: "row items-center q-pb-none" })));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_14), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_18 = __VLS_16.slots.default;
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ name: (__VLS_ctx.typeIcon), color: (__VLS_ctx.typeColor), size: "md" }, { class: "q-mr-sm" })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ name: (__VLS_ctx.typeIcon), color: (__VLS_ctx.typeColor), size: "md" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_20), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 text-weight-bold" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
(__VLS_ctx.title);
var __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_25), false));
if (!__VLS_ctx.persistent && !__VLS_ctx.loading) {
    var __VLS_29 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        icon: "mdi-close",
        flat: true,
        round: true,
        dense: true,
    }));
    var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{
            icon: "mdi-close",
            flat: true,
            round: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_30), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
}
// @ts-ignore
[dialogValue, persistent, persistent, loading, loading, typeIcon, typeColor, title, vClosePopup,];
var __VLS_16;
var __VLS_34;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34(__assign({ class: "q-pt-md" })));
var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([__assign({ class: "q-pt-md" })], __VLS_functionalComponentArgsRest(__VLS_35), false));
/** @type {__VLS_StyleScopedClasses['q-pt-md']} */ ;
var __VLS_39 = __VLS_37.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1 text-grey-9 preserve-whitespace" }));
/** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-9']} */ ;
/** @type {__VLS_StyleScopedClasses['preserve-whitespace']} */ ;
(__VLS_ctx.message);
// @ts-ignore
[message,];
var __VLS_37;
var __VLS_40;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40(__assign({ align: "right" }, { class: "q-pa-md q-gutter-sm" })));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-pa-md q-gutter-sm" })], __VLS_functionalComponentArgsRest(__VLS_41), false));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_45 = __VLS_43.slots.default;
var __VLS_46;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46(__assign({ 'onClick': {} }, { flat: true, label: (__VLS_ctx.cancelText), color: "grey-7", disable: (__VLS_ctx.loading) })));
var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: (__VLS_ctx.cancelText), color: "grey-7", disable: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_47), false));
var __VLS_51;
var __VLS_52 = ({ click: {} },
    { onClick: (__VLS_ctx.onCancel) });
var __VLS_49;
var __VLS_50;
var __VLS_53;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53(__assign({ 'onClick': {} }, { unelevated: true, label: (__VLS_ctx.confirmText), color: (__VLS_ctx.buttonColor), loading: (__VLS_ctx.loading) })));
var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { unelevated: true, label: (__VLS_ctx.confirmText), color: (__VLS_ctx.buttonColor), loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_54), false));
var __VLS_58;
var __VLS_59 = ({ click: {} },
    { onClick: (__VLS_ctx.onConfirm) });
var __VLS_56;
var __VLS_57;
// @ts-ignore
[loading, loading, cancelText, onCancel, confirmText, buttonColor, onConfirm,];
var __VLS_43;
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
