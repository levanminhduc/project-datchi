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
    tabs: function () { return []; },
    vertical: false,
    outsideArrows: false,
    mobileArrows: false,
    align: 'left',
    dense: false,
    noCaps: true,
    inlineLabel: false,
    switchIndicator: false,
    activeColor: 'primary',
    indicatorColor: 'primary'
});
var emit = defineEmits();
var tabValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); }
});
var __VLS_defaults = {
    tabs: function () { return []; },
    vertical: false,
    outsideArrows: false,
    mobileArrows: false,
    align: 'left',
    dense: false,
    noCaps: true,
    inlineLabel: false,
    switchIndicator: false,
    activeColor: 'primary',
    indicatorColor: 'primary'
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
qTabs;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.tabValue),
    vertical: (__VLS_ctx.vertical),
    outsideArrows: (__VLS_ctx.outsideArrows),
    mobileArrows: (__VLS_ctx.mobileArrows),
    align: (__VLS_ctx.align),
    breakpoint: (__VLS_ctx.breakpoint),
    activeColor: (__VLS_ctx.activeColor),
    indicatorColor: (__VLS_ctx.indicatorColor),
    dense: (__VLS_ctx.dense),
    noCaps: (__VLS_ctx.noCaps),
    inlineLabel: (__VLS_ctx.inlineLabel),
    switchIndicator: (__VLS_ctx.switchIndicator),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.tabValue),
        vertical: (__VLS_ctx.vertical),
        outsideArrows: (__VLS_ctx.outsideArrows),
        mobileArrows: (__VLS_ctx.mobileArrows),
        align: (__VLS_ctx.align),
        breakpoint: (__VLS_ctx.breakpoint),
        activeColor: (__VLS_ctx.activeColor),
        indicatorColor: (__VLS_ctx.indicatorColor),
        dense: (__VLS_ctx.dense),
        noCaps: (__VLS_ctx.noCaps),
        inlineLabel: (__VLS_ctx.inlineLabel),
        switchIndicator: (__VLS_ctx.switchIndicator),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.tabs)); _i < _a.length; _i++) {
    var tab = _a[_i][0];
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        key: (tab.name),
        name: (tab.name),
        label: (tab.label),
        icon: (tab.icon),
        disable: (tab.disable),
        alert: (tab.alert),
        alertIcon: (tab.alertIcon),
    }));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
            key: (tab.name),
            name: (tab.name),
            label: (tab.label),
            icon: (tab.icon),
            disable: (tab.disable),
            alert: (tab.alert),
            alertIcon: (tab.alertIcon),
        }], __VLS_functionalComponentArgsRest(__VLS_8), false));
    // @ts-ignore
    [tabValue, vertical, outsideArrows, mobileArrows, align, breakpoint, activeColor, indicatorColor, dense, noCaps, inlineLabel, switchIndicator, tabs,];
}
var __VLS_12 = {};
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_13 = __VLS_12;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
