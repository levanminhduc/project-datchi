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
var __VLS_props = withDefaults(defineProps(), {
    alt: '',
    fit: 'cover',
    position: 'center',
    loading: 'lazy',
    noDefaultSpinner: false,
    noSpinner: false,
    noNativeMenu: false,
    noTransition: false,
    spinnerColor: 'primary',
    errorIcon: 'mdi-image-broken-variant',
    draggable: true
});
var emit = defineEmits();
var __VLS_defaults = {
    alt: '',
    fit: 'cover',
    position: 'center',
    loading: 'lazy',
    noDefaultSpinner: false,
    noSpinner: false,
    noNativeMenu: false,
    noTransition: false,
    spinnerColor: 'primary',
    errorIcon: 'mdi-image-broken-variant',
    draggable: true
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qImg | typeof __VLS_components.QImg | typeof __VLS_components.qImg | typeof __VLS_components.QImg} */
qImg;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onLoad': {} }, { 'onError': {} }), { src: (__VLS_ctx.src), alt: (__VLS_ctx.alt), srcset: (__VLS_ctx.srcset), sizes: (__VLS_ctx.sizes), ratio: (__VLS_ctx.ratio), width: (__VLS_ctx.width), height: (__VLS_ctx.height), fit: (__VLS_ctx.fit), position: (__VLS_ctx.position), loading: (__VLS_ctx.loading), noDefaultSpinner: (__VLS_ctx.noDefaultSpinner), noSpinner: (__VLS_ctx.noSpinner), noNativeMenu: (__VLS_ctx.noNativeMenu), noTransition: (__VLS_ctx.noTransition), spinnerColor: (__VLS_ctx.spinnerColor), spinnerSize: (__VLS_ctx.spinnerSize), placeholderSrc: (__VLS_ctx.placeholder), draggable: (__VLS_ctx.draggable), imgClass: (__VLS_ctx.imgClass), imgStyle: (__VLS_ctx.imgStyle) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onLoad': {} }, { 'onError': {} }), { src: (__VLS_ctx.src), alt: (__VLS_ctx.alt), srcset: (__VLS_ctx.srcset), sizes: (__VLS_ctx.sizes), ratio: (__VLS_ctx.ratio), width: (__VLS_ctx.width), height: (__VLS_ctx.height), fit: (__VLS_ctx.fit), position: (__VLS_ctx.position), loading: (__VLS_ctx.loading), noDefaultSpinner: (__VLS_ctx.noDefaultSpinner), noSpinner: (__VLS_ctx.noSpinner), noNativeMenu: (__VLS_ctx.noNativeMenu), noTransition: (__VLS_ctx.noTransition), spinnerColor: (__VLS_ctx.spinnerColor), spinnerSize: (__VLS_ctx.spinnerSize), placeholderSrc: (__VLS_ctx.placeholder), draggable: (__VLS_ctx.draggable), imgClass: (__VLS_ctx.imgClass), imgStyle: (__VLS_ctx.imgStyle) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ load: {} },
    { onLoad: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('load', __VLS_ctx.src);
            // @ts-ignore
            [src, src, alt, srcset, sizes, ratio, width, height, fit, position, loading, noDefaultSpinner, noSpinner, noNativeMenu, noTransition, spinnerColor, spinnerSize, placeholder, draggable, imgClass, imgStyle, emit,];
        } });
var __VLS_7 = ({ error: {} },
    { onError: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('error', __VLS_ctx.src);
            // @ts-ignore
            [src, emit,];
        } });
var __VLS_8 = {};
var __VLS_9 = __VLS_3.slots.default;
{
    var __VLS_10 = __VLS_3.slots.error;
    var __VLS_11 = {};
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "absolute-full flex flex-center bg-grey-3" }));
    /** @type {__VLS_StyleScopedClasses['absolute-full']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-grey-3']} */ ;
    var __VLS_13 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
        name: (__VLS_ctx.errorIcon),
        size: "40px",
        color: "grey-6",
    }));
    var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{
            name: (__VLS_ctx.errorIcon),
            size: "40px",
            color: "grey-6",
        }], __VLS_functionalComponentArgsRest(__VLS_14), false));
    // @ts-ignore
    [errorIcon,];
}
var __VLS_18 = {};
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_12 = __VLS_11, __VLS_19 = __VLS_18;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
