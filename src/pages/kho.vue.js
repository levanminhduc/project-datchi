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
var layout_1 = require("@/components/ui/layout");
var cards_1 = require("@/components/ui/cards");
var threadModules = [
    {
        title: 'Dashboard',
        description: 'Tổng quan tình trạng kho chỉ',
        icon: 'dashboard',
        to: '/thread/dashboard',
        color: 'primary'
    },
    {
        title: 'Loại Chỉ',
        description: 'Quản lý danh mục loại chỉ',
        icon: 'category',
        to: '/thread',
        color: 'secondary'
    },
    {
        title: 'Tồn Kho Chỉ',
        description: 'Theo dõi tồn kho theo cuộn',
        icon: 'inventory',
        to: '/thread/inventory',
        color: 'positive'
    },
    {
        title: 'Lô Hàng',
        description: 'Quản lý lô nhập kho',
        icon: 'inventory_2',
        to: '/thread/lots',
        color: 'teal'
    },
    {
        title: 'Nhập Kho',
        description: 'Nhập kho hàng loạt',
        icon: 'move_to_inbox',
        to: '/thread/batch/receive',
        color: 'indigo'
    },
    {
        title: 'Chuyển Kho',
        description: 'Chuyển kho hàng loạt',
        icon: 'swap_horiz',
        to: '/thread/batch/transfer',
        color: 'purple'
    },
    {
        title: 'Xuất Kho',
        description: 'Xuất kho hàng loạt',
        icon: 'output',
        to: '/thread/batch/issue',
        color: 'orange'
    },
    {
        title: 'Lịch Sử Thao Tác',
        description: 'Xem lịch sử nhập xuất kho',
        icon: 'history',
        to: '/thread/batch/history',
        color: 'blue-grey'
    },
    {
        title: 'Phân Bổ',
        description: 'Phân bổ chỉ cho đơn hàng',
        icon: 'assignment',
        to: '/thread/allocations',
        color: 'info'
    },
    {
        title: 'Xuất Kho SX',
        description: 'Quản lý phiếu xuất kho sản xuất',
        icon: 'output',
        to: '/thread/issues',
        color: 'deep-orange'
    },
    {
        title: 'Đối Chiếu',
        description: 'Đối chiếu tiêu hao chỉ',
        icon: 'fact_check',
        to: '/thread/issues/reconciliation',
        color: 'cyan'
    },
    {
        title: 'Thu Hồi',
        description: 'Thu hồi chỉ dư từ sản xuất',
        icon: 'assignment_return',
        to: '/thread/recovery',
        color: 'warning'
    }
];
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['module-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['module-arrow']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPage | typeof __VLS_components.QPage | typeof __VLS_components.qPage | typeof __VLS_components.QPage} */
qPage;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    padding: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        padding: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.PageHeader} */
layout_1.PageHeader;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    title: "Quản lý Kho",
    subtitle: "Quản lý nhập xuất và tồn kho",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Quản lý Kho",
        subtitle: "Quản lý nhập xuất và tồn kho",
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mt-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.threadModules)); _i < _a.length; _i++) {
    var module_1 = _a[_i][0];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (module_1.to) }, { class: "col-12 col-sm-6 col-md-4 col-lg-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-lg-3']} */ ;
    var __VLS_12 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12(__assign({ to: (module_1.to) }, { class: "text-decoration-none" })));
    var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([__assign({ to: (module_1.to) }, { class: "text-decoration-none" })], __VLS_functionalComponentArgsRest(__VLS_13), false));
    /** @type {__VLS_StyleScopedClasses['text-decoration-none']} */ ;
    var __VLS_17 = __VLS_15.slots.default;
    var __VLS_18 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
    cards_1.AppCard;
    // @ts-ignore
    var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18(__assign({ class: "module-card full-height" }, { bordered: true })));
    var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([__assign({ class: "module-card full-height" }, { bordered: true })], __VLS_functionalComponentArgsRest(__VLS_19), false));
    /** @type {__VLS_StyleScopedClasses['module-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-height']} */ ;
    var __VLS_23 = __VLS_21.slots.default;
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24(__assign({ class: "row items-center no-wrap q-pa-md" })));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([__assign({ class: "row items-center no-wrap q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_25), false));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    var __VLS_29 = __VLS_27.slots.default;
    var __VLS_30 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
    qAvatar;
    // @ts-ignore
    var __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30(__assign({ color: (module_1.color), textColor: "white", size: "52px", icon: (module_1.icon) }, { class: "module-avatar" })));
    var __VLS_32 = __VLS_31.apply(void 0, __spreadArray([__assign({ color: (module_1.color), textColor: "white", size: "52px", icon: (module_1.icon) }, { class: "module-avatar" })], __VLS_functionalComponentArgsRest(__VLS_31), false));
    /** @type {__VLS_StyleScopedClasses['module-avatar']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-ml-md col" }));
    /** @type {__VLS_StyleScopedClasses['q-ml-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium module-title" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['module-title']} */ ;
    (module_1.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption module-description" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['module-description']} */ ;
    (module_1.description);
    var __VLS_35 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign({ name: "chevron_right", size: "20px" }, { class: "module-arrow" })));
    var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign({ name: "chevron_right", size: "20px" }, { class: "module-arrow" })], __VLS_functionalComponentArgsRest(__VLS_36), false));
    /** @type {__VLS_StyleScopedClasses['module-arrow']} */ ;
    // @ts-ignore
    [threadModules,];
    var __VLS_27;
    // @ts-ignore
    [];
    var __VLS_21;
    // @ts-ignore
    [];
    var __VLS_15;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
