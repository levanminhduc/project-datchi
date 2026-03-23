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
var layout_1 = require("@/components/ui/layout");
var cards_1 = require("@/components/ui/cards");
var feedback_1 = require("@/components/ui/feedback");
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPage | typeof __VLS_components.QPage | typeof __VLS_components.qPage | typeof __VLS_components.QPage} */
qPage;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    padding: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        padding: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.PageHeader} */
layout_1.PageHeader;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    title: "Quản lý Kỹ Thuật",
    subtitle: "Quản lý thông số kỹ thuật và bảo trì",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Quản lý Kỹ Thuật",
        subtitle: "Quản lý thông số kỹ thuật và bảo trì",
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
/** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
cards_1.AppCard;
// @ts-ignore
var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12(__assign({ class: "q-mt-md" })));
var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([__assign({ class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_13), false));
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
var __VLS_17 = __VLS_15.slots.default;
var __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.EmptyState} */
feedback_1.EmptyState;
// @ts-ignore
var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    icon: "engineering",
    title: "Chưa có dữ liệu",
    description: "Chức năng quản lý kỹ thuật đang được phát triển",
}));
var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{
        icon: "engineering",
        title: "Chưa có dữ liệu",
        description: "Chức năng quản lý kỹ thuật đang được phát triển",
    }], __VLS_functionalComponentArgsRest(__VLS_19), false));
var __VLS_15;
var __VLS_3;
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
