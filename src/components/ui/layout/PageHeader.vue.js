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
var vue_router_1 = require("vue-router");
var props = withDefaults(defineProps(), {
    showBack: false,
    dense: false
});
var router = (0, vue_router_1.useRouter)();
var goBack = function () {
    if (props.backTo) {
        router.push(props.backTo);
    }
    else {
        router.back();
    }
};
var headerClass = (0, vue_1.computed)(function () { return ({
    'q-py-sm': props.dense,
    'q-py-md': !props.dense
}); });
var __VLS_defaults = {
    showBack: false,
    dense: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "page-header row items-center q-mb-md" }, { class: (__VLS_ctx.headerClass) }));
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
if (__VLS_ctx.showBack) {
    var __VLS_0 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onClick': {} }, { flat: true, round: true, icon: "arrow_back", color: "primary" }), { class: "q-mr-sm" })));
    var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { flat: true, round: true, icon: "arrow_back", color: "primary" }), { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
    var __VLS_5 = void 0;
    var __VLS_6 = ({ click: {} },
        { onClick: (__VLS_ctx.goBack) });
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    var __VLS_3;
    var __VLS_4;
}
if (__VLS_ctx.icon) {
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ name: (__VLS_ctx.icon), size: "28px" }, { class: "q-mr-sm" })));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ name: (__VLS_ctx.icon), size: "28px" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h5 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
(__VLS_ctx.title);
if (__VLS_ctx.subtitle) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    (__VLS_ctx.subtitle);
}
var __VLS_12 = {};
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_14 = {};
// @ts-ignore
var __VLS_13 = __VLS_12, __VLS_15 = __VLS_14;
// @ts-ignore
[headerClass, showBack, goBack, icon, icon, title, subtitle, subtitle,];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
