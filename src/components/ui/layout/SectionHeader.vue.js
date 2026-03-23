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
    dense: false,
    bordered: false
});
var headerClass = (0, vue_1.computed)(function () { return ({
    'q-py-xs': props.dense,
    'q-py-sm': !props.dense,
    'q-pb-sm q-mb-sm': props.bordered
}); });
var headerStyle = (0, vue_1.computed)(function () {
    return props.bordered ? { borderBottom: '1px solid rgba(0,0,0,0.12)' } : {};
});
var __VLS_defaults = {
    dense: false,
    bordered: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ class: "section-header row items-center" }, { class: (__VLS_ctx.headerClass) }), { style: (__VLS_ctx.headerStyle) }));
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
if (__VLS_ctx.icon) {
    var __VLS_0 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ name: (__VLS_ctx.icon), size: "20px" }, { class: "q-mr-sm text-grey-7" })));
    var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ name: (__VLS_ctx.icon), size: "20px" }, { class: "q-mr-sm text-grey-7" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
(__VLS_ctx.title);
if (__VLS_ctx.subtitle) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    (__VLS_ctx.subtitle);
}
var __VLS_5 = {};
// @ts-ignore
var __VLS_6 = __VLS_5;
// @ts-ignore
[headerClass, headerStyle, icon, icon, title, subtitle, subtitle,];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
