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
    showDetails: true,
    size: '40px',
    clickable: false,
});
var emit = defineEmits();
// Computed
var indicatorColor = (0, vue_1.computed)(function () {
    switch (props.level) {
        case 'ok':
            return 'positive';
        case 'low':
            return 'warning';
        case 'critical':
            return 'negative';
        default:
            return 'grey';
    }
});
var indicatorIcon = (0, vue_1.computed)(function () {
    switch (props.level) {
        case 'ok':
            return 'check_circle';
        case 'low':
            return 'warning';
        case 'critical':
            return 'error';
        default:
            return 'help';
    }
});
var statusLabel = (0, vue_1.computed)(function () {
    switch (props.level) {
        case 'ok':
            return 'Đủ hàng';
        case 'low':
            return 'Tồn thấp';
        case 'critical':
            return 'Sắp hết';
        default:
            return 'Không xác định';
    }
});
var iconSize = (0, vue_1.computed)(function () {
    var sizeNum = parseInt(props.size);
    return "".concat(Math.round(sizeNum * 0.5), "px");
});
// Methods
var formatNumber = function (num) {
    return new Intl.NumberFormat('vi-VN').format(num);
};
var handleClick = function () {
    if (props.clickable) {
        emit('click');
    }
};
var __VLS_defaults = {
    showDetails: true,
    size: '40px',
    clickable: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['stock-level-indicator']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onClick: (__VLS_ctx.handleClick) }, { class: "stock-level-indicator row items-center no-wrap q-gutter-sm" }), { class: ({ 'cursor-pointer': __VLS_ctx.clickable }) }));
/** @type {__VLS_StyleScopedClasses['stock-level-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
qAvatar;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    size: (__VLS_ctx.size),
    color: (__VLS_ctx.indicatorColor),
    textColor: "white",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        size: (__VLS_ctx.size),
        color: (__VLS_ctx.indicatorColor),
        textColor: "white",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = __VLS_3.slots.default;
var __VLS_6;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
    name: (__VLS_ctx.indicatorIcon),
    size: (__VLS_ctx.iconSize),
}));
var __VLS_8 = __VLS_7.apply(void 0, __spreadArray([{
        name: (__VLS_ctx.indicatorIcon),
        size: (__VLS_ctx.iconSize),
    }], __VLS_functionalComponentArgsRest(__VLS_7), false));
// @ts-ignore
[handleClick, clickable, size, indicatorColor, indicatorIcon, iconSize,];
var __VLS_3;
if (__VLS_ctx.showDetails) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column" }));
    /** @type {__VLS_StyleScopedClasses['column']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-subtitle2 text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.threadType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (['text-caption', "text-".concat(__VLS_ctx.indicatorColor)]) }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    (__VLS_ctx.statusLabel);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-grey" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.quantity));
    (__VLS_ctx.formatNumber(__VLS_ctx.reorderLevel));
}
if (!__VLS_ctx.showDetails) {
    var __VLS_11 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({}));
    var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_12), false));
    var __VLS_16 = __VLS_14.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    (__VLS_ctx.threadType);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    (__VLS_ctx.statusLabel);
    (__VLS_ctx.formatNumber(__VLS_ctx.quantity));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    (__VLS_ctx.formatNumber(__VLS_ctx.reorderLevel));
    // @ts-ignore
    [indicatorColor, showDetails, showDetails, threadType, threadType, statusLabel, statusLabel, formatNumber, formatNumber, formatNumber, formatNumber, quantity, quantity, reorderLevel, reorderLevel,];
    var __VLS_14;
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
