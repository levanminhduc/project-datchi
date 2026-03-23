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
defineOptions({
    inheritAttrs: false,
});
var __VLS_props = withDefaults(defineProps(), {
    icon: 'inbox',
    iconSize: '64px',
    iconColor: 'grey-5',
    title: 'Không có dữ liệu',
});
var __VLS_defaults = {
    icon: 'inbox',
    iconSize: '64px',
    iconColor: 'grey-5',
    title: 'Không có dữ liệu',
};
var __VLS_ctx = __assign(__assign(__assign({}, {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "empty-state column items-center q-py-xl" }));
(__VLS_ctx.$attrs);
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['column']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ name: (__VLS_ctx.icon), size: (__VLS_ctx.iconSize), color: (__VLS_ctx.iconColor) }, { class: "q-mb-md" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ name: (__VLS_ctx.icon), size: (__VLS_ctx.iconSize), color: (__VLS_ctx.iconColor) }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
if (__VLS_ctx.title) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 text-grey-6 q-mb-sm text-center" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (__VLS_ctx.title);
}
if (__VLS_ctx.subtitle) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-grey-5 text-center q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    (__VLS_ctx.subtitle);
}
var __VLS_5 = {};
// @ts-ignore
var __VLS_6 = __VLS_5;
// @ts-ignore
[$attrs, icon, iconSize, iconColor, title, title, subtitle, subtitle,];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
