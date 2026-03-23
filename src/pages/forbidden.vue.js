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
var vue_router_1 = require("vue-router");
var useAuth_1 = require("@/composables/useAuth");
definePage({
    meta: {
        // This page requires auth to show who is logged in
        // But accessible to all authenticated users
        title: 'Truy Cập Bị Từ Chối',
    },
});
var router = (0, vue_router_1.useRouter)();
var employee = (0, useAuth_1.useAuth)().employee;
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPage | typeof __VLS_components.QPage | typeof __VLS_components.qPage | typeof __VLS_components.QPage} */
qPage;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ class: "flex flex-center bg-grey-2" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ class: "flex flex-center bg-grey-2" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ class: "text-center q-pa-xl" }, { style: {} })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ class: "text-center q-pa-xl" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_8), false));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
var __VLS_12 = __VLS_10.slots.default;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    name: "lock",
    size: "80px",
    color: "negative",
}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{
        name: "lock",
        size: "80px",
        color: "negative",
    }], __VLS_functionalComponentArgsRest(__VLS_14), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h4 q-mt-lg q-mb-sm" }));
/** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-grey-7 q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18(__assign({ 'onClick': {} }, { color: "primary", icon: "home", label: "Về Trang Chủ" })));
var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "home", label: "Về Trang Chủ" })], __VLS_functionalComponentArgsRest(__VLS_19), false));
var __VLS_23;
var __VLS_24 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.router.push('/');
            // @ts-ignore
            [router,];
        } });
var __VLS_21;
var __VLS_22;
var __VLS_25;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25(__assign({ 'onClick': {} }, { flat: true, color: "grey-7", icon: "arrow_back", label: "Quay Lại" })));
var __VLS_27 = __VLS_26.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, color: "grey-7", icon: "arrow_back", label: "Quay Lại" })], __VLS_functionalComponentArgsRest(__VLS_26), false));
var __VLS_30;
var __VLS_31 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.router.back();
            // @ts-ignore
            [router,];
        } });
var __VLS_28;
var __VLS_29;
if (__VLS_ctx.employee) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-xl text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    var __VLS_32 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32(__assign({ name: "person", size: "xs" }, { class: "q-mr-xs" })));
    var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([__assign({ name: "person", size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_33), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    (__VLS_ctx.employee.fullName);
    (__VLS_ctx.employee.employeeId);
}
// @ts-ignore
[employee, employee, employee,];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
