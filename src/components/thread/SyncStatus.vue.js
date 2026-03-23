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
var isOnline = (0, vue_1.ref)(navigator.onLine);
var pendingCount = (0, vue_1.ref)(0);
var updateOnlineStatus = function () {
    isOnline.value = navigator.onLine;
};
(0, vue_1.onMounted)(function () {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
});
(0, vue_1.onUnmounted)(function () {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
});
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "sync-status row items-center" }));
/** @type {__VLS_StyleScopedClasses['sync-status']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    name: (__VLS_ctx.isOnline ? 'cloud_done' : 'cloud_off'),
    color: (__VLS_ctx.isOnline ? 'white' : 'warning'),
    size: "20px",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        name: (__VLS_ctx.isOnline ? 'cloud_done' : 'cloud_off'),
        color: (__VLS_ctx.isOnline ? 'white' : 'warning'),
        size: "20px",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
if (__VLS_ctx.pendingCount > 0) {
    var __VLS_5 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        color: "warning",
        floating: true,
        rounded: true,
    }));
    var __VLS_7 = __VLS_6.apply(void 0, __spreadArray([{
            color: "warning",
            floating: true,
            rounded: true,
        }], __VLS_functionalComponentArgsRest(__VLS_6), false));
    var __VLS_10 = __VLS_8.slots.default;
    (__VLS_ctx.pendingCount);
    // @ts-ignore
    [isOnline, isOnline, pendingCount, pendingCount,];
    var __VLS_8;
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
