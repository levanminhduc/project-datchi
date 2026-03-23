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
var quasar_1 = require("quasar");
var props = withDefaults(defineProps(), {
    visible: false,
    delay: 1000
});
var $q = (0, quasar_1.useQuasar)();
var isDark = (0, vue_1.computed)(function () { var _a; return (_a = props.dark) !== null && _a !== void 0 ? _a : $q.dark.isActive; });
var scrollAreaRef = (0, vue_1.ref)(null);
// Expose scroll methods
var __VLS_exposed = {
    getScrollTarget: function () { var _a, _b; return (_b = (_a = scrollAreaRef.value) === null || _a === void 0 ? void 0 : _a.getScrollTarget) === null || _b === void 0 ? void 0 : _b.call(_a); },
    getScrollPosition: function () { var _a, _b; return (_b = (_a = scrollAreaRef.value) === null || _a === void 0 ? void 0 : _a.getScrollPosition) === null || _b === void 0 ? void 0 : _b.call(_a); },
    setScrollPosition: function (axis, offset, duration) { var _a, _b; return (_b = (_a = scrollAreaRef.value) === null || _a === void 0 ? void 0 : _a.setScrollPosition) === null || _b === void 0 ? void 0 : _b.call(_a, axis, offset, duration); },
    setScrollPercentage: function (axis, offset, duration) { var _a, _b; return (_b = (_a = scrollAreaRef.value) === null || _a === void 0 ? void 0 : _a.setScrollPercentage) === null || _b === void 0 ? void 0 : _b.call(_a, axis, offset, duration); }
};
defineExpose(__VLS_exposed);
var __VLS_defaults = {
    visible: false,
    delay: 1000
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qScrollArea | typeof __VLS_components.QScrollArea | typeof __VLS_components.qScrollArea | typeof __VLS_components.QScrollArea} */
qScrollArea;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ref: "scrollAreaRef",
    dark: (__VLS_ctx.isDark),
    thumbStyle: (__VLS_ctx.thumbStyle),
    barStyle: (__VLS_ctx.barStyle),
    contentStyle: (__VLS_ctx.contentStyle),
    contentActiveStyle: (__VLS_ctx.contentActiveStyle),
    visible: (__VLS_ctx.visible),
    delay: (__VLS_ctx.delay),
    tabindex: (__VLS_ctx.tabindex),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        ref: "scrollAreaRef",
        dark: (__VLS_ctx.isDark),
        thumbStyle: (__VLS_ctx.thumbStyle),
        barStyle: (__VLS_ctx.barStyle),
        contentStyle: (__VLS_ctx.contentStyle),
        contentActiveStyle: (__VLS_ctx.contentActiveStyle),
        visible: (__VLS_ctx.visible),
        delay: (__VLS_ctx.delay),
        tabindex: (__VLS_ctx.tabindex),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_7 = __VLS_3.slots.default;
var __VLS_8 = {};
// @ts-ignore
[isDark, thumbStyle, barStyle, contentStyle, contentActiveStyle, visible, delay, tabindex,];
var __VLS_3;
// @ts-ignore
var __VLS_6 = __VLS_5, __VLS_9 = __VLS_8;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () { return (__VLS_exposed); },
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
