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
    formats: function () { return ['qr_code']; },
    modelValue: true,
    hint: 'Đặt mã QR vào khung để quét',
    track: true,
    trackColor: '#22c55e',
});
var emit = defineEmits();
// State
var isLoading = (0, vue_1.ref)(true);
var error = (0, vue_1.ref)(null);
// Computed
var isActive = (0, vue_1.computed)(function () { return props.modelValue && !error.value; });
var cameraConstraints = (0, vue_1.computed)(function () { return (__assign({ facingMode: 'environment' }, props.constraints)); });
var errorMessage = (0, vue_1.computed)(function () {
    if (!error.value)
        return '';
    var messages = {
        NotAllowedError: 'Bạn cần cấp quyền truy cập camera để quét mã QR',
        NotFoundError: 'Không tìm thấy camera trên thiết bị này',
        NotSupportedError: 'Trình duyệt không hỗ trợ quét mã QR',
        NotReadableError: 'Camera đang được sử dụng bởi ứng dụng khác',
        OverconstrainedError: 'Camera không đáp ứng yêu cầu cấu hình',
        SecurityError: 'Cần kết nối HTTPS để sử dụng camera',
        StreamApiNotSupportedError: 'Trình duyệt không hỗ trợ API camera',
    };
    return messages[error.value.name] || error.value.message || 'Đã xảy ra lỗi không xác định';
});
/**
 * Track function to draw outline around detected codes
 */
var trackFunction = (0, vue_1.computed)(function () {
    if (!props.track)
        return undefined;
    return function (detectedCodes, ctx) {
        for (var _i = 0, detectedCodes_1 = detectedCodes; _i < detectedCodes_1.length; _i++) {
            var code = detectedCodes_1[_i];
            if (code.cornerPoints && code.cornerPoints.length >= 4) {
                var first = code.cornerPoints[0];
                var rest = code.cornerPoints.slice(1);
                if (!first)
                    continue;
                ctx.strokeStyle = props.trackColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(first.x, first.y);
                for (var _a = 0, rest_1 = rest; _a < rest_1.length; _a++) {
                    var point = rest_1[_a];
                    ctx.lineTo(point.x, point.y);
                }
                ctx.lineTo(first.x, first.y);
                ctx.stroke();
            }
        }
    };
});
// Event handlers
var onDetect = function (codes) {
    emit('detect', codes);
};
var onError = function (err) {
    error.value = err;
    isLoading.value = false;
    emit('error', err);
};
var onCameraOn = function () {
    isLoading.value = false;
    error.value = null;
    emit('ready');
};
var onCameraOff = function () {
    isLoading.value = true;
};
var retry = function () {
    error.value = null;
    isLoading.value = true;
    emit('update:modelValue', true);
};
// Reset error when modelValue changes to true
(0, vue_1.watch)(function () { return props.modelValue; }, function (newVal) {
    if (newVal) {
        error.value = null;
    }
});
var __VLS_defaults = {
    formats: function () { return ['qr_code']; },
    modelValue: true,
    hint: 'Đặt mã QR vào khung để quét',
    track: true,
    trackColor: '#22c55e',
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-scanner-stream" }));
/** @type {__VLS_StyleScopedClasses['qr-scanner-stream']} */ ;
if (!__VLS_ctx.error) {
    var __VLS_0 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qrcodeStream | typeof __VLS_components.QrcodeStream | typeof __VLS_components.qrcodeStream | typeof __VLS_components.QrcodeStream} */
    qrcodeStream;
    // @ts-ignore
    var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign(__assign({ 'onDetect': {} }, { 'onError': {} }), { 'onCameraOn': {} }), { 'onCameraOff': {} }), { formats: (__VLS_ctx.formats), paused: (!__VLS_ctx.isActive), constraints: (__VLS_ctx.cameraConstraints), track: (__VLS_ctx.trackFunction) })));
    var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign({ 'onDetect': {} }, { 'onError': {} }), { 'onCameraOn': {} }), { 'onCameraOff': {} }), { formats: (__VLS_ctx.formats), paused: (!__VLS_ctx.isActive), constraints: (__VLS_ctx.cameraConstraints), track: (__VLS_ctx.trackFunction) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
    var __VLS_5 = void 0;
    var __VLS_6 = ({ detect: {} },
        { onDetect: (__VLS_ctx.onDetect) });
    var __VLS_7 = ({ error: {} },
        { onError: (__VLS_ctx.onError) });
    var __VLS_8 = ({ cameraOn: {} },
        { onCameraOn: (__VLS_ctx.onCameraOn) });
    var __VLS_9 = ({ cameraOff: {} },
        { onCameraOff: (__VLS_ctx.onCameraOff) });
    var __VLS_10 = __VLS_3.slots.default;
    if (__VLS_ctx.isLoading) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-scanner-loading" }));
        /** @type {__VLS_StyleScopedClasses['qr-scanner-loading']} */ ;
        var __VLS_11 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
        qSpinner;
        // @ts-ignore
        var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
            color: "white",
            size: "48px",
        }));
        var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([{
                color: "white",
                size: "48px",
            }], __VLS_functionalComponentArgsRest(__VLS_12), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-white q-mt-md" }));
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-scanner-overlay" }));
        /** @type {__VLS_StyleScopedClasses['qr-scanner-overlay']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-scanner-frame" }));
        /** @type {__VLS_StyleScopedClasses['qr-scanner-frame']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "corner corner-tl" }));
        /** @type {__VLS_StyleScopedClasses['corner']} */ ;
        /** @type {__VLS_StyleScopedClasses['corner-tl']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "corner corner-tr" }));
        /** @type {__VLS_StyleScopedClasses['corner']} */ ;
        /** @type {__VLS_StyleScopedClasses['corner-tr']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "corner corner-bl" }));
        /** @type {__VLS_StyleScopedClasses['corner']} */ ;
        /** @type {__VLS_StyleScopedClasses['corner-bl']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "corner corner-br" }));
        /** @type {__VLS_StyleScopedClasses['corner']} */ ;
        /** @type {__VLS_StyleScopedClasses['corner-br']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-scanner-hint" }));
        /** @type {__VLS_StyleScopedClasses['qr-scanner-hint']} */ ;
        (__VLS_ctx.hint);
    }
    var __VLS_16 = {};
    // @ts-ignore
    [error, formats, isActive, cameraConstraints, trackFunction, onDetect, onError, onCameraOn, onCameraOff, isLoading, hint,];
    var __VLS_3;
    var __VLS_4;
}
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-scanner-error" }));
    /** @type {__VLS_StyleScopedClasses['qr-scanner-error']} */ ;
    var __VLS_18 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        name: "error_outline",
        size: "48px",
        color: "negative",
    }));
    var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{
            name: "error_outline",
            size: "48px",
            color: "negative",
        }], __VLS_functionalComponentArgsRest(__VLS_19), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 q-mt-md text-negative" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 q-mt-sm text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    (__VLS_ctx.errorMessage);
    var __VLS_23 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23(__assign(__assign({ 'onClick': {} }, { class: "q-mt-lg" }), { color: "primary", label: "Thử lại", icon: "refresh" })));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { class: "q-mt-lg" }), { color: "primary", label: "Thử lại", icon: "refresh" })], __VLS_functionalComponentArgsRest(__VLS_24), false));
    var __VLS_28 = void 0;
    var __VLS_29 = ({ click: {} },
        { onClick: (__VLS_ctx.retry) });
    /** @type {__VLS_StyleScopedClasses['q-mt-lg']} */ ;
    var __VLS_26;
    var __VLS_27;
}
// @ts-ignore
var __VLS_17 = __VLS_16;
// @ts-ignore
[error, errorMessage, retry,];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
