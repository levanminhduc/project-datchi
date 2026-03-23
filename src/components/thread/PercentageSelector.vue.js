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
    originalMeters: 0
});
var emit = defineEmits();
var percentages = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
var calculatedMeters = (0, vue_1.computed)(function () {
    return (props.originalMeters * props.modelValue) / 100;
});
function select(percentage) {
    emit('update:modelValue', percentage);
}
var __VLS_defaults = {
    originalMeters: 0
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "percentage-selector" }));
/** @type {__VLS_StyleScopedClasses['percentage-selector']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var _loop_1 = function (p) {
    var __VLS_0 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onClick': {} }, { key: (p), label: ("".concat(p, "%")), color: (__VLS_ctx.modelValue === p ? 'primary' : 'grey-4'), textColor: (__VLS_ctx.modelValue === p ? 'white' : 'dark'), unelevated: true })));
    var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { key: (p), label: ("".concat(p, "%")), color: (__VLS_ctx.modelValue === p ? 'primary' : 'grey-4'), textColor: (__VLS_ctx.modelValue === p ? 'white' : 'dark'), unelevated: true })], __VLS_functionalComponentArgsRest(__VLS_1), false));
    var __VLS_5 = void 0;
    var __VLS_6 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.select(p);
                // @ts-ignore
                [percentages, modelValue, modelValue, select,];
            } });
    // @ts-ignore
    [];
};
var __VLS_3, __VLS_4;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.percentages)); _i < _a.length; _i++) {
    var p = _a[_i][0];
    _loop_1(p);
}
if (__VLS_ctx.originalMeters > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md text-body1" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.calculatedMeters.toLocaleString());
    (__VLS_ctx.modelValue);
}
// @ts-ignore
[modelValue, originalMeters, calculatedMeters,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
