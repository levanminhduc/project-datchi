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
    color: 'primary',
    size: 'md',
    variant: 'filled',
    loading: false,
    disable: false,
    round: false,
    dense: false,
    block: false,
    noCaps: true,
    type: 'button',
});
var emit = defineEmits();
var computedColor = (0, vue_1.computed)(function () {
    if (props.variant === 'text') {
        return undefined;
    }
    return props.color;
});
var handleClick = function (event) {
    if (!props.disable && !props.loading) {
        emit('click', event);
    }
};
var __VLS_defaults = {
    color: 'primary',
    size: 'md',
    variant: 'filled',
    loading: false,
    disable: false,
    round: false,
    dense: false,
    block: false,
    noCaps: true,
    type: 'button',
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onClick': {} }, { color: (__VLS_ctx.computedColor), size: (__VLS_ctx.size), loading: (__VLS_ctx.loading), disable: (__VLS_ctx.disable || __VLS_ctx.loading), icon: (__VLS_ctx.icon), iconRight: (__VLS_ctx.iconRight), label: (__VLS_ctx.label), type: (__VLS_ctx.type), unelevated: (__VLS_ctx.variant === 'filled'), flat: (__VLS_ctx.variant === 'flat' || __VLS_ctx.variant === 'text'), outline: (__VLS_ctx.variant === 'outlined'), round: (__VLS_ctx.round), dense: (__VLS_ctx.dense), noCaps: (__VLS_ctx.noCaps) }), { class: ({ 'full-width': __VLS_ctx.block }) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: (__VLS_ctx.computedColor), size: (__VLS_ctx.size), loading: (__VLS_ctx.loading), disable: (__VLS_ctx.disable || __VLS_ctx.loading), icon: (__VLS_ctx.icon), iconRight: (__VLS_ctx.iconRight), label: (__VLS_ctx.label), type: (__VLS_ctx.type), unelevated: (__VLS_ctx.variant === 'filled'), flat: (__VLS_ctx.variant === 'flat' || __VLS_ctx.variant === 'text'), outline: (__VLS_ctx.variant === 'outlined'), round: (__VLS_ctx.round), dense: (__VLS_ctx.dense), noCaps: (__VLS_ctx.noCaps) }), { class: ({ 'full-width': __VLS_ctx.block }) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5;
var __VLS_6 = ({ click: {} },
    { onClick: (__VLS_ctx.handleClick) });
var __VLS_7 = {};
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
var __VLS_8 = __VLS_3.slots.default;
var __VLS_9 = {};
if (__VLS_ctx.$slots.loading) {
    {
        var __VLS_11 = __VLS_3.slots.loading;
        var __VLS_12 = {};
        // @ts-ignore
        [computedColor, size, loading, loading, disable, icon, iconRight, label, type, variant, variant, variant, variant, round, dense, noCaps, block, $attrs, handleClick, $slots,];
    }
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_10 = __VLS_9, __VLS_13 = __VLS_12;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
