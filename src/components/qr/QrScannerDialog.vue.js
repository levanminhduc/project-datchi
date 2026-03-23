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
var QrScannerStream_vue_1 = require("./QrScannerStream.vue");
var props = withDefaults(defineProps(), {
    modelValue: false,
    title: 'Quét mã QR',
    persistent: false,
    closeOnDetect: false,
    formats: function () { return ['qr_code']; },
    hint: 'Đặt mã QR vào khung để quét',
    track: true,
    trackColor: '#22c55e',
    showResult: true,
    showActions: true,
});
var emit = defineEmits();
// State
var isScanning = (0, vue_1.ref)(true);
var lastCode = (0, vue_1.ref)(null);
// Computed
var dialogValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); },
});
// Event handlers
var onDetect = function (codes) {
    if (codes.length > 0 && codes[0]) {
        lastCode.value = codes[0].rawValue;
        emit('detect', codes);
        if (props.closeOnDetect) {
            emit('confirm', codes[0].rawValue);
            close();
        }
    }
};
var onError = function (error) {
    emit('error', error);
};
var onReady = function () {
    emit('ready');
};
var close = function () {
    dialogValue.value = false;
};
var confirm = function () {
    if (lastCode.value) {
        emit('confirm', lastCode.value);
        close();
    }
};
// Reset state when dialog opens
(0, vue_1.watch)(dialogValue, function (val) {
    if (val) {
        lastCode.value = null;
        isScanning.value = true;
    }
});
var __VLS_defaults = {
    modelValue: false,
    title: 'Quét mã QR',
    persistent: false,
    closeOnDetect: false,
    formats: function () { return ['qr_code']; },
    hint: 'Đặt mã QR vào khung để quét',
    track: true,
    trackColor: '#22c55e',
    showResult: true,
    showActions: true,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['qr-scanner-dialog']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.dialogValue),
    persistent: (__VLS_ctx.persistent),
    transitionShow: "slide-up",
    transitionHide: "slide-down",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.dialogValue),
        persistent: (__VLS_ctx.persistent),
        transitionShow: "slide-up",
        transitionHide: "slide-down",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ class: "qr-scanner-dialog" })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ class: "qr-scanner-dialog" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
/** @type {__VLS_StyleScopedClasses['qr-scanner-dialog']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ name: "qr_code_scanner" }, { class: "q-mr-sm" })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ name: "qr_code_scanner" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_20), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
(__VLS_ctx.title);
var __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_25), false));
if (!__VLS_ctx.persistent) {
    var __VLS_29 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }));
    var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{
            icon: "close",
            flat: true,
            round: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_30), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
}
// @ts-ignore
[dialogValue, persistent, persistent, title, vClosePopup,];
var __VLS_16;
var __VLS_34;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34(__assign({ class: "q-pt-md" })));
var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([__assign({ class: "q-pt-md" })], __VLS_functionalComponentArgsRest(__VLS_35), false));
/** @type {__VLS_StyleScopedClasses['q-pt-md']} */ ;
var __VLS_39 = __VLS_37.slots.default;
var __VLS_40 = QrScannerStream_vue_1.default || QrScannerStream_vue_1.default;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40(__assign(__assign(__assign({ 'onDetect': {} }, { 'onError': {} }), { 'onReady': {} }), { modelValue: (__VLS_ctx.isScanning), formats: (__VLS_ctx.formats), hint: (__VLS_ctx.hint), track: (__VLS_ctx.track), trackColor: (__VLS_ctx.trackColor) })));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onDetect': {} }, { 'onError': {} }), { 'onReady': {} }), { modelValue: (__VLS_ctx.isScanning), formats: (__VLS_ctx.formats), hint: (__VLS_ctx.hint), track: (__VLS_ctx.track), trackColor: (__VLS_ctx.trackColor) })], __VLS_functionalComponentArgsRest(__VLS_41), false));
var __VLS_45;
var __VLS_46 = ({ detect: {} },
    { onDetect: (__VLS_ctx.onDetect) });
var __VLS_47 = ({ error: {} },
    { onError: (__VLS_ctx.onError) });
var __VLS_48 = ({ ready: {} },
    { onReady: (__VLS_ctx.onReady) });
var __VLS_49 = __VLS_43.slots.default;
{
    var __VLS_50 = __VLS_43.slots.overlay;
    var __VLS_51 = {};
    // @ts-ignore
    [isScanning, formats, hint, track, trackColor, onDetect, onError, onReady,];
}
// @ts-ignore
[];
var __VLS_43;
var __VLS_44;
if (__VLS_ctx.showResult && __VLS_ctx.lastCode) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    var __VLS_53 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53(__assign({ class: "bg-positive text-white" }, { rounded: true })));
    var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([__assign({ class: "bg-positive text-white" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_54), false));
    /** @type {__VLS_StyleScopedClasses['bg-positive']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_58 = __VLS_56.slots.default;
    {
        var __VLS_59 = __VLS_56.slots.avatar;
        var __VLS_60 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
            name: "check_circle",
        }));
        var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([{
                name: "check_circle",
            }], __VLS_functionalComponentArgsRest(__VLS_61), false));
        // @ts-ignore
        [showResult, lastCode,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mt-xs text-white-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white-7']} */ ;
    (__VLS_ctx.lastCode);
    // @ts-ignore
    [lastCode,];
    var __VLS_56;
}
// @ts-ignore
[];
var __VLS_37;
if (__VLS_ctx.$slots.actions || __VLS_ctx.showActions) {
    var __VLS_65 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65(__assign({ align: "right" }, { class: "q-px-md q-pb-md" })));
    var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md" })], __VLS_functionalComponentArgsRest(__VLS_66), false));
    /** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
    var __VLS_70 = __VLS_68.slots.default;
    var __VLS_71 = {};
    var __VLS_73 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73(__assign({ 'onClick': {} }, { flat: true, label: "Đóng", color: "grey-7" })));
    var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Đóng", color: "grey-7" })], __VLS_functionalComponentArgsRest(__VLS_74), false));
    var __VLS_78 = void 0;
    var __VLS_79 = ({ click: {} },
        { onClick: (__VLS_ctx.close) });
    var __VLS_76;
    var __VLS_77;
    if (__VLS_ctx.lastCode) {
        var __VLS_80 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80(__assign({ 'onClick': {} }, { color: "primary", label: "Sử dụng mã này", icon: "check" })));
        var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Sử dụng mã này", icon: "check" })], __VLS_functionalComponentArgsRest(__VLS_81), false));
        var __VLS_85 = void 0;
        var __VLS_86 = ({ click: {} },
            { onClick: (__VLS_ctx.confirm) });
        var __VLS_83;
        var __VLS_84;
    }
    // @ts-ignore
    [lastCode, $slots, showActions, close, confirm,];
    var __VLS_68;
}
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_52 = __VLS_51, __VLS_72 = __VLS_71;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
