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
var __VLS_props = withDefaults(defineProps(), {
    offset: 500,
    debounce: 100,
    disable: false,
    reverse: false
});
var emit = defineEmits();
var infiniteScrollRef = (0, vue_1.ref)(null);
var onLoad = function (index, done) {
    emit('load', index, done);
};
var __VLS_exposed = {
    poll: function () { var _a, _b; return (_b = (_a = infiniteScrollRef.value) === null || _a === void 0 ? void 0 : _a.poll) === null || _b === void 0 ? void 0 : _b.call(_a); },
    trigger: function () { var _a, _b; return (_b = (_a = infiniteScrollRef.value) === null || _a === void 0 ? void 0 : _a.trigger) === null || _b === void 0 ? void 0 : _b.call(_a); },
    stop: function () { var _a, _b; return (_b = (_a = infiniteScrollRef.value) === null || _a === void 0 ? void 0 : _a.stop) === null || _b === void 0 ? void 0 : _b.call(_a); },
    reset: function () { var _a, _b; return (_b = (_a = infiniteScrollRef.value) === null || _a === void 0 ? void 0 : _a.reset) === null || _b === void 0 ? void 0 : _b.call(_a); },
    resume: function () { var _a, _b; return (_b = (_a = infiniteScrollRef.value) === null || _a === void 0 ? void 0 : _a.resume) === null || _b === void 0 ? void 0 : _b.call(_a); }
};
defineExpose(__VLS_exposed);
var __VLS_defaults = {
    offset: 500,
    debounce: 100,
    disable: false,
    reverse: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qInfiniteScroll | typeof __VLS_components.QInfiniteScroll | typeof __VLS_components.qInfiniteScroll | typeof __VLS_components.QInfiniteScroll} */
qInfiniteScroll;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onLoad': {} }, { ref: "infiniteScrollRef", offset: (__VLS_ctx.offset), debounce: (__VLS_ctx.debounce), scrollTarget: (__VLS_ctx.scrollTarget), disable: (__VLS_ctx.disable), reverse: (__VLS_ctx.reverse) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onLoad': {} }, { ref: "infiniteScrollRef", offset: (__VLS_ctx.offset), debounce: (__VLS_ctx.debounce), scrollTarget: (__VLS_ctx.scrollTarget), disable: (__VLS_ctx.disable), reverse: (__VLS_ctx.reverse) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ load: {} },
    { onLoad: (__VLS_ctx.onLoad) });
var __VLS_7 = {};
var __VLS_9 = __VLS_3.slots.default;
var __VLS_10 = {};
{
    var __VLS_12 = __VLS_3.slots.loading;
    var __VLS_13 = {};
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-center q-my-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-my-md']} */ ;
    var __VLS_15 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
    qSpinner;
    // @ts-ignore
    var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        color: "primary",
        size: "40px",
    }));
    var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([{
            color: "primary",
            size: "40px",
        }], __VLS_functionalComponentArgsRest(__VLS_16), false));
    // @ts-ignore
    [offset, debounce, scrollTarget, disable, reverse, onLoad,];
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_8 = __VLS_7, __VLS_11 = __VLS_10, __VLS_14 = __VLS_13;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () { return (__VLS_exposed); },
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
