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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var enums_1 = require("@/types/thread/enums");
var props = withDefaults(defineProps(), {
    size: 'md',
    outline: false,
    showIcon: true
});
var statusConfig = (_a = {},
    _a[enums_1.AllocationStatus.PENDING] = { color: 'grey', label: 'Chờ xử lý', icon: 'schedule' },
    _a[enums_1.AllocationStatus.SOFT] = { color: 'blue', label: 'Đã đặt mềm', icon: 'bookmark_border' },
    _a[enums_1.AllocationStatus.HARD] = { color: 'purple', label: 'Đã đặt cứng', icon: 'bookmark' },
    _a[enums_1.AllocationStatus.ISSUED] = { color: 'positive', label: 'Đã xuất', icon: 'check_circle' },
    _a[enums_1.AllocationStatus.CANCELLED] = { color: 'negative', label: 'Đã hủy', icon: 'cancel' },
    _a[enums_1.AllocationStatus.WAITLISTED] = { color: 'orange', label: 'Chờ hàng', icon: 'hourglass_empty' },
    // Request workflow statuses
    _a[enums_1.AllocationStatus.APPROVED] = { color: 'teal', label: 'Đã duyệt', icon: 'thumb_up' },
    _a[enums_1.AllocationStatus.READY_FOR_PICKUP] = { color: 'amber', label: 'Sẵn sàng nhận', icon: 'inventory' },
    _a[enums_1.AllocationStatus.RECEIVED] = { color: 'green', label: 'Đã nhận', icon: 'done_all' },
    _a[enums_1.AllocationStatus.REJECTED] = { color: 'red', label: 'Từ chối', icon: 'block' },
    _a);
var config = (0, vue_1.computed)(function () { return statusConfig[props.status] || { color: 'grey', label: props.status, icon: 'help' }; });
var sizeClass = (0, vue_1.computed)(function () {
    switch (props.size) {
        case 'sm':
            return 'text-caption q-px-xs q-py-none';
        case 'lg':
            return 'text-body2 q-px-md q-py-xs';
        default:
            return 'q-px-sm q-py-none';
    }
});
var __VLS_defaults = {
    size: 'md',
    outline: false,
    showIcon: true
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
qBadge;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ color: (__VLS_ctx.config.color), outline: (__VLS_ctx.outline) }, { class: (__VLS_ctx.sizeClass) }), { class: "allocation-status-badge" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ color: (__VLS_ctx.config.color), outline: (__VLS_ctx.outline) }, { class: (__VLS_ctx.sizeClass) }), { class: "allocation-status-badge" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['allocation-status-badge']} */ ;
var __VLS_6 = __VLS_3.slots.default;
if (__VLS_ctx.showIcon) {
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ name: (__VLS_ctx.config.icon), size: "xs" }, { class: "q-mr-xs" })));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ name: (__VLS_ctx.config.icon), size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
}
(__VLS_ctx.config.label);
// @ts-ignore
[config, config, config, outline, sizeClass, showIcon,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
