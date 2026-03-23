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
    color: 'primary',
    icon: 'mdi-refresh',
    noMouse: false,
    disable: false
});
var emit = defineEmits();
var onRefresh = function (done) {
    emit('refresh', done);
};
var __VLS_defaults = {
    color: 'primary',
    icon: 'mdi-refresh',
    noMouse: false,
    disable: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPullToRefresh | typeof __VLS_components.QPullToRefresh | typeof __VLS_components.qPullToRefresh | typeof __VLS_components.QPullToRefresh} */
qPullToRefresh;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onRefresh': {} }, { color: (__VLS_ctx.color), bgColor: (__VLS_ctx.bgColor), icon: (__VLS_ctx.icon), noMouse: (__VLS_ctx.noMouse), disable: (__VLS_ctx.disable), scrollTarget: (__VLS_ctx.scrollTarget) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onRefresh': {} }, { color: (__VLS_ctx.color), bgColor: (__VLS_ctx.bgColor), icon: (__VLS_ctx.icon), noMouse: (__VLS_ctx.noMouse), disable: (__VLS_ctx.disable), scrollTarget: (__VLS_ctx.scrollTarget) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ refresh: {} },
    { onRefresh: (__VLS_ctx.onRefresh) });
var __VLS_7 = {};
var __VLS_8 = __VLS_3.slots.default;
var __VLS_9 = {};
// @ts-ignore
[color, bgColor, icon, noMouse, disable, scrollTarget, onRefresh,];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_10 = __VLS_9;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
