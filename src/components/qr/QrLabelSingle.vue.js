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
var ConeQrCode_vue_1 = require("./ConeQrCode.vue");
var __VLS_props = withDefaults(defineProps(), {
    showBorder: true,
});
var __VLS_defaults = {
    showBorder: true,
};
var __VLS_ctx = __assign(__assign(__assign({}, {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['qr-label-single']} */ ;
/** @type {__VLS_StyleScopedClasses['with-border']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-label-single" }, { class: ({ 'with-border': __VLS_ctx.showBorder }) }));
/** @type {__VLS_StyleScopedClasses['qr-label-single']} */ ;
/** @type {__VLS_StyleScopedClasses['with-border']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "label-content" }));
/** @type {__VLS_StyleScopedClasses['label-content']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-section" }));
/** @type {__VLS_StyleScopedClasses['qr-section']} */ ;
var __VLS_0 = ConeQrCode_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    coneId: (__VLS_ctx.cone.cone_id),
    size: "small",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        coneId: (__VLS_ctx.cone.cone_id),
        size: "small",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "info-section" }));
/** @type {__VLS_StyleScopedClasses['info-section']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cone-id" }));
/** @type {__VLS_StyleScopedClasses['cone-id']} */ ;
(__VLS_ctx.cone.cone_id);
if (__VLS_ctx.cone.lot_number) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "info-row" }));
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "label" }));
    /** @type {__VLS_StyleScopedClasses['label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "value" }));
    /** @type {__VLS_StyleScopedClasses['value']} */ ;
    (__VLS_ctx.cone.lot_number);
}
if (__VLS_ctx.cone.thread_type_code) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "info-row" }));
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "label" }));
    /** @type {__VLS_StyleScopedClasses['label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "value" }));
    /** @type {__VLS_StyleScopedClasses['value']} */ ;
    (__VLS_ctx.cone.thread_type_code);
}
if (__VLS_ctx.cone.weight_grams) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "info-row" }));
    /** @type {__VLS_StyleScopedClasses['info-row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "label" }));
    /** @type {__VLS_StyleScopedClasses['label']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "value" }));
    /** @type {__VLS_StyleScopedClasses['value']} */ ;
    (__VLS_ctx.cone.weight_grams);
}
// @ts-ignore
[showBorder, cone, cone, cone, cone, cone, cone, cone, cone,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
