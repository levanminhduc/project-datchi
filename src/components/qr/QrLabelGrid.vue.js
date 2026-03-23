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
var QrLabelSingle_vue_1 = require("./QrLabelSingle.vue");
var qr_label_1 = require("@/types/qr-label");
var props = withDefaults(defineProps(), {
    config: function () { return qr_label_1.DEFAULT_GRID_CONFIG; },
});
// Calculate pages needed
var labelsPerPage = (0, vue_1.computed)(function () { return props.config.columns * props.config.rows; });
var pages = (0, vue_1.computed)(function () {
    var result = [];
    for (var i = 0; i < props.cones.length; i += labelsPerPage.value) {
        result.push(props.cones.slice(i, i + labelsPerPage.value));
    }
    return result.length > 0 ? result : [[]];
});
var __VLS_defaults = {
    config: function () { return qr_label_1.DEFAULT_GRID_CONFIG; },
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['qr-label-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['print-page']} */ ;
/** @type {__VLS_StyleScopedClasses['print-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-number']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-label-grid" }));
/** @type {__VLS_StyleScopedClasses['qr-label-grid']} */ ;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.pages)); _i < _a.length; _i++) {
    var _b = _a[_i], page = _b[0], pageIndex = _b[1];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ key: (pageIndex) }, { class: "print-page" }), { style: ({
            paddingTop: "".concat(__VLS_ctx.config.marginTop, "mm"),
            paddingLeft: "".concat(__VLS_ctx.config.marginLeft, "mm"),
        }) }));
    /** @type {__VLS_StyleScopedClasses['print-page']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "labels-grid" }, { style: ({
            gridTemplateColumns: "repeat(".concat(__VLS_ctx.config.columns, ", 50mm)"),
            gap: "".concat(__VLS_ctx.config.gapY, "mm ").concat(__VLS_ctx.config.gapX, "mm"),
        }) }));
    /** @type {__VLS_StyleScopedClasses['labels-grid']} */ ;
    for (var _c = 0, _d = __VLS_vFor((page)); _c < _d.length; _c++) {
        var _e = _d[_c], cone = _e[0], index = _e[1];
        var __VLS_0 = QrLabelSingle_vue_1.default;
        // @ts-ignore
        var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            key: (cone.cone_id || index),
            cone: (cone),
            showBorder: (true),
        }));
        var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
                key: (cone.cone_id || index),
                cone: (cone),
                showBorder: (true),
            }], __VLS_functionalComponentArgsRest(__VLS_1), false));
        // @ts-ignore
        [pages, config, config, config, config, config,];
    }
    if (__VLS_ctx.pages.length > 1) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "page-number" }));
        /** @type {__VLS_StyleScopedClasses['page-number']} */ ;
        (pageIndex + 1);
        (__VLS_ctx.pages.length);
    }
    // @ts-ignore
    [pages, pages,];
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
