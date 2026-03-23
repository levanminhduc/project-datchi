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
    steps: function () { return []; },
    vertical: false,
    headerNav: true,
    flat: false,
    bordered: false,
    alternativeLabels: false,
    doneColor: 'positive',
    activeColor: 'primary',
    errorColor: 'negative',
    animated: true,
    keepAlive: true
});
var emit = defineEmits();
var stepValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); }
});
var __VLS_defaults = {
    steps: function () { return []; },
    vertical: false,
    headerNav: true,
    flat: false,
    bordered: false,
    alternativeLabels: false,
    doneColor: 'positive',
    activeColor: 'primary',
    errorColor: 'negative',
    animated: true,
    keepAlive: true
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qStepper | typeof __VLS_components.QStepper | typeof __VLS_components.qStepper | typeof __VLS_components.QStepper} */
qStepper;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.stepValue),
    vertical: (__VLS_ctx.vertical),
    headerNav: (__VLS_ctx.headerNav),
    flat: (__VLS_ctx.flat),
    bordered: (__VLS_ctx.bordered),
    alternativeLabels: (__VLS_ctx.alternativeLabels),
    contracted: (!!__VLS_ctx.contractedLabelBreakpoint),
    inactiveColor: (__VLS_ctx.inactiveColor),
    inactiveIcon: (__VLS_ctx.inactiveIcon),
    doneIcon: (__VLS_ctx.doneIcon),
    doneColor: (__VLS_ctx.doneColor),
    activeIcon: (__VLS_ctx.activeIcon),
    activeColor: (__VLS_ctx.activeColor),
    errorIcon: (__VLS_ctx.errorIcon),
    errorColor: (__VLS_ctx.errorColor),
    animated: (__VLS_ctx.animated),
    keepAlive: (__VLS_ctx.keepAlive),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.stepValue),
        vertical: (__VLS_ctx.vertical),
        headerNav: (__VLS_ctx.headerNav),
        flat: (__VLS_ctx.flat),
        bordered: (__VLS_ctx.bordered),
        alternativeLabels: (__VLS_ctx.alternativeLabels),
        contracted: (!!__VLS_ctx.contractedLabelBreakpoint),
        inactiveColor: (__VLS_ctx.inactiveColor),
        inactiveIcon: (__VLS_ctx.inactiveIcon),
        doneIcon: (__VLS_ctx.doneIcon),
        doneColor: (__VLS_ctx.doneColor),
        activeIcon: (__VLS_ctx.activeIcon),
        activeColor: (__VLS_ctx.activeColor),
        errorIcon: (__VLS_ctx.errorIcon),
        errorColor: (__VLS_ctx.errorColor),
        animated: (__VLS_ctx.animated),
        keepAlive: (__VLS_ctx.keepAlive),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.steps)); _i < _a.length; _i++) {
    var step = _a[_i][0];
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qStep | typeof __VLS_components.QStep | typeof __VLS_components.qStep | typeof __VLS_components.QStep} */
    qStep;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        key: (step.name),
        name: (step.name),
        title: (step.title),
        caption: (step.caption),
        icon: (step.icon),
        activeIcon: (step.activeIcon),
        doneIcon: (step.doneIcon),
        errorIcon: (step.errorIcon),
        color: (step.color),
        done: (step.done),
        error: (step.error),
        disable: (step.disable),
        headerNav: (__VLS_ctx.headerNav),
    }));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
            key: (step.name),
            name: (step.name),
            title: (step.title),
            caption: (step.caption),
            icon: (step.icon),
            activeIcon: (step.activeIcon),
            doneIcon: (step.doneIcon),
            errorIcon: (step.errorIcon),
            color: (step.color),
            done: (step.done),
            error: (step.error),
            disable: (step.disable),
            headerNav: (__VLS_ctx.headerNav),
        }], __VLS_functionalComponentArgsRest(__VLS_8), false));
    var __VLS_12 = __VLS_10.slots.default;
    var __VLS_13 = {
        step: (step),
    };
    var __VLS_14 = __VLS_tryAsConstant("step-".concat(step.name));
    // @ts-ignore
    [stepValue, vertical, headerNav, headerNav, flat, bordered, alternativeLabels, contractedLabelBreakpoint, inactiveColor, inactiveIcon, doneIcon, doneColor, activeIcon, activeColor, errorIcon, errorColor, animated, keepAlive, steps,];
    var __VLS_10;
    // @ts-ignore
    [];
}
var __VLS_17 = {};
{
    var __VLS_19 = __VLS_3.slots.navigation;
    var __VLS_20 = {};
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_15 = __VLS_14, __VLS_16 = __VLS_13, __VLS_18 = __VLS_17, __VLS_21 = __VLS_20;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
