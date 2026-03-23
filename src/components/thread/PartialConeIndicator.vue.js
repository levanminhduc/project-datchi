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
    showLabel: true
});
var color = (0, vue_1.computed)(function () {
    if (props.percentage > 50)
        return 'positive';
    if (props.percentage > 25)
        return 'amber';
    return 'negative';
});
var icon = (0, vue_1.computed)(function () {
    if (props.percentage > 50)
        return 'battery_full';
    if (props.percentage > 25)
        return 'battery_3_bar';
    return 'battery_alert';
});
var label = (0, vue_1.computed)(function () { return "".concat(Math.round(props.percentage), "%"); });
var __VLS_defaults = {
    showLabel: true
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
qBadge;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ color: (__VLS_ctx.color) }, { class: "partial-cone-indicator q-pa-xs" }), { outline: (__VLS_ctx.percentage < 10) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ color: (__VLS_ctx.color) }, { class: "partial-cone-indicator q-pa-xs" }), { outline: (__VLS_ctx.percentage < 10) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['partial-cone-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
var __VLS_6 = __VLS_3.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ name: (__VLS_ctx.icon), size: "14px" }, { class: "q-mr-xs" })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ name: (__VLS_ctx.icon), size: "14px" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
/** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
if (__VLS_ctx.showLabel) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-bold" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (__VLS_ctx.label);
}
var __VLS_12;
/** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
qTooltip;
// @ts-ignore
var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_13), false));
var __VLS_17 = __VLS_15.slots.default;
(__VLS_ctx.label);
// @ts-ignore
[color, percentage, icon, showLabel, label, label,];
var __VLS_15;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
