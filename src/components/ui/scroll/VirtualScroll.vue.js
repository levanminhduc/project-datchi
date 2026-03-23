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
    items: function () { return []; },
    virtualScrollSliceSize: 30,
    virtualScrollSliceRatioBefore: 1,
    virtualScrollSliceRatioAfter: 1,
    virtualScrollItemSize: 24
});
var virtualScrollRef = (0, vue_1.ref)(null);
var __VLS_exposed = {
    scrollTo: function (index, edge) { var _a, _b; return (_b = (_a = virtualScrollRef.value) === null || _a === void 0 ? void 0 : _a.scrollTo) === null || _b === void 0 ? void 0 : _b.call(_a, index, edge); },
    reset: function () { var _a, _b; return (_b = (_a = virtualScrollRef.value) === null || _a === void 0 ? void 0 : _a.reset) === null || _b === void 0 ? void 0 : _b.call(_a); },
    refresh: function (index) { var _a, _b; return (_b = (_a = virtualScrollRef.value) === null || _a === void 0 ? void 0 : _a.refresh) === null || _b === void 0 ? void 0 : _b.call(_a, index); }
};
defineExpose(__VLS_exposed);
var __VLS_defaults = {
    items: function () { return []; },
    virtualScrollSliceSize: 30,
    virtualScrollSliceRatioBefore: 1,
    virtualScrollSliceRatioAfter: 1,
    virtualScrollItemSize: 24
};
var __VLS_ctx = __assign(__assign(__assign({}, {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qVirtualScroll | typeof __VLS_components.QVirtualScroll | typeof __VLS_components.qVirtualScroll | typeof __VLS_components.QVirtualScroll} */
qVirtualScroll;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ref: "virtualScrollRef",
    items: (__VLS_ctx.items),
    itemsFn: (__VLS_ctx.itemsFn),
    itemsSize: (__VLS_ctx.itemsSize),
    virtualScrollSliceSize: (__VLS_ctx.virtualScrollSliceSize),
    virtualScrollSliceRatioBefore: (__VLS_ctx.virtualScrollSliceRatioBefore),
    virtualScrollSliceRatioAfter: (__VLS_ctx.virtualScrollSliceRatioAfter),
    virtualScrollItemSize: (__VLS_ctx.virtualScrollItemSize),
    virtualScrollStickySizeStart: (__VLS_ctx.virtualScrollStickySizeStart),
    virtualScrollStickySizeEnd: (__VLS_ctx.virtualScrollStickySizeEnd),
    scrollTarget: (__VLS_ctx.scrollTarget),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        ref: "virtualScrollRef",
        items: (__VLS_ctx.items),
        itemsFn: (__VLS_ctx.itemsFn),
        itemsSize: (__VLS_ctx.itemsSize),
        virtualScrollSliceSize: (__VLS_ctx.virtualScrollSliceSize),
        virtualScrollSliceRatioBefore: (__VLS_ctx.virtualScrollSliceRatioBefore),
        virtualScrollSliceRatioAfter: (__VLS_ctx.virtualScrollSliceRatioAfter),
        virtualScrollItemSize: (__VLS_ctx.virtualScrollItemSize),
        virtualScrollStickySizeStart: (__VLS_ctx.virtualScrollStickySizeStart),
        virtualScrollStickySizeEnd: (__VLS_ctx.virtualScrollStickySizeEnd),
        scrollTarget: (__VLS_ctx.scrollTarget),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
{
    var __VLS_7 = __VLS_3.slots.default;
    var _a = __VLS_vSlot(__VLS_7)[0], item = _a.item, index = _a.index;
    var __VLS_8 = {
        item: (item),
        index: (index),
    };
    // @ts-ignore
    [items, itemsFn, itemsSize, virtualScrollSliceSize, virtualScrollSliceRatioBefore, virtualScrollSliceRatioAfter, virtualScrollItemSize, virtualScrollStickySizeStart, virtualScrollStickySizeEnd, scrollTarget,];
    __VLS_3.slots['' /* empty slot name completion */];
}
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
