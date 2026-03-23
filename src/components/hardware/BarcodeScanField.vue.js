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
var useScanner_1 = require("@/composables/hardware/useScanner");
var useAudioFeedback_1 = require("@/composables/hardware/useAudioFeedback");
var props = withDefaults(defineProps(), {
    label: 'Mã vạch',
    placeholder: 'Quét hoặc nhập mã vạch...'
});
var emit = defineEmits();
var playBeep = (0, useAudioFeedback_1.useAudioFeedback)().playBeep;
var isManualMode = (0, vue_1.ref)(false);
var inputRef = (0, vue_1.ref)(null);
var handleScan = function (barcode) {
    emit('update:modelValue', barcode);
    emit('scan', barcode);
    playBeep('scan');
};
var isScanning = (0, useScanner_1.useScanner)({
    onScan: handleScan
}).isScanning;
var onInputSubmit = function () {
    if (props.modelValue) {
        emit('scan', props.modelValue);
        playBeep('success');
    }
};
var toggleManual = function () {
    isManualMode.value = !isManualMode.value;
    if (isManualMode.value) {
        setTimeout(function () {
            var _a;
            (_a = inputRef.value) === null || _a === void 0 ? void 0 : _a.focus();
        }, 100);
    }
};
var handleClear = function () {
    emit('update:modelValue', '');
};
var __VLS_defaults = {
    label: 'Mã vạch',
    placeholder: 'Quét hoặc nhập mã vạch...'
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['q-field__control']} */ ;
/** @type {__VLS_StyleScopedClasses['barcode-scan-field']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "barcode-scan-field" }));
/** @type {__VLS_StyleScopedClasses['barcode-scan-field']} */ ;
var __VLS_0 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onKeyup': {} }), { ref: "inputRef", modelValue: (__VLS_ctx.modelValue), label: (__VLS_ctx.label), placeholder: (__VLS_ctx.placeholder), outlined: (true), loading: (__VLS_ctx.isScanning), inputClass: (__VLS_ctx.isScanning ? 'scanning-glow' : '') })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onKeyup': {} }), { ref: "inputRef", modelValue: (__VLS_ctx.modelValue), label: (__VLS_ctx.label), placeholder: (__VLS_ctx.placeholder), outlined: (true), loading: (__VLS_ctx.isScanning), inputClass: (__VLS_ctx.isScanning ? 'scanning-glow' : '') })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (function (val) { return __VLS_ctx.emit('update:modelValue', val); }) });
var __VLS_7 = ({ keyup: {} },
    { onKeyup: (__VLS_ctx.onInputSubmit) });
var __VLS_8 = {};
var __VLS_10 = __VLS_3.slots.default;
{
    var __VLS_11 = __VLS_3.slots.prepend;
    var __VLS_12 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        name: (__VLS_ctx.isManualMode ? 'keyboard' : 'qr_code_scanner'),
        color: (__VLS_ctx.isScanning ? 'primary' : 'grey-7'),
    }));
    var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([{
            name: (__VLS_ctx.isManualMode ? 'keyboard' : 'qr_code_scanner'),
            color: (__VLS_ctx.isScanning ? 'primary' : 'grey-7'),
        }], __VLS_functionalComponentArgsRest(__VLS_13), false));
    // @ts-ignore
    [modelValue, label, placeholder, isScanning, isScanning, isScanning, emit, onInputSubmit, isManualMode,];
}
{
    var __VLS_17 = __VLS_3.slots.append;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    if (__VLS_ctx.modelValue) {
        var __VLS_18 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", size: "sm" })));
        var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_19), false));
        var __VLS_23 = void 0;
        var __VLS_24 = ({ click: {} },
            { onClick: (__VLS_ctx.handleClear) });
        var __VLS_21;
        var __VLS_22;
    }
    var __VLS_25 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25(__assign({ vertical: true }, { class: "q-mx-sm" })));
    var __VLS_27 = __VLS_26.apply(void 0, __spreadArray([__assign({ vertical: true }, { class: "q-mx-sm" })], __VLS_functionalComponentArgsRest(__VLS_26), false));
    /** @type {__VLS_StyleScopedClasses['q-mx-sm']} */ ;
    var __VLS_30 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: (__VLS_ctx.isManualMode ? 'sensors' : 'keyboard'), size: "sm", color: (__VLS_ctx.isManualMode ? 'primary' : 'grey-7') })));
    var __VLS_32 = __VLS_31.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: (__VLS_ctx.isManualMode ? 'sensors' : 'keyboard'), size: "sm", color: (__VLS_ctx.isManualMode ? 'primary' : 'grey-7') })], __VLS_functionalComponentArgsRest(__VLS_31), false));
    var __VLS_35 = void 0;
    var __VLS_36 = ({ click: {} },
        { onClick: (__VLS_ctx.toggleManual) });
    var __VLS_37 = __VLS_33.slots.default;
    var __VLS_38 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({}));
    var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_39), false));
    var __VLS_43 = __VLS_41.slots.default;
    (__VLS_ctx.isManualMode ? 'Chuyển sang chế độ Quét' : 'Chuyển sang chế độ Nhập tay');
    // @ts-ignore
    [modelValue, isManualMode, isManualMode, isManualMode, handleClear, toggleManual,];
    var __VLS_41;
    // @ts-ignore
    [];
    var __VLS_33;
    var __VLS_34;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
if (!__VLS_ctx.isManualMode) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6 q-mt-xs q-px-sm row items-center" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-px-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    if (__VLS_ctx.isScanning) {
        var __VLS_44 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
        qSpinnerDots;
        // @ts-ignore
        var __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44(__assign({ size: "12px" }, { class: "q-mr-xs" })));
        var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([__assign({ size: "12px" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_45), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.isScanning ? 'Đang nhận tín hiệu...' : 'Sẵn sàng quét mã');
}
// @ts-ignore
var __VLS_9 = __VLS_8;
// @ts-ignore
[isScanning, isScanning, isManualMode,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
