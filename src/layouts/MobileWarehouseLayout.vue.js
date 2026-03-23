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
var vue_router_1 = require("vue-router");
var quasar_1 = require("quasar");
var SyncStatus_vue_1 = require("@/components/thread/SyncStatus.vue");
var $q = (0, quasar_1.useQuasar)();
var router = (0, vue_router_1.useRouter)();
var route = (0, vue_router_1.useRoute)();
var showSyncStatus = (0, vue_1.ref)(true);
var activeTab = (0, vue_1.computed)(function () {
    if (route.path.includes('receive'))
        return 'receive';
    if (route.path.includes('return'))
        return 'return';
    if (route.path.includes('issue'))
        return 'issue';
    if (route.path.includes('recovery'))
        return 'recovery';
    return 'receive';
});
var title = (0, vue_1.computed)(function () {
    var titles = {
        receive: 'Nhập Kho',
        issue: 'Xuất Kho',
        return: 'Nhập Lại',
        recovery: 'Hoàn Trả',
    };
    return titles[activeTab.value] || 'Kho Chỉ';
});
var goBack = function () {
    if (window.history.length > 1) {
        router.back();
    }
    else {
        router.push('/thread/dashboard');
    }
};
var toggleDarkMode = function () {
    $q.dark.toggle();
};
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['mobile-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qLayout | typeof __VLS_components.QLayout | typeof __VLS_components.qLayout | typeof __VLS_components.QLayout} */
qLayout;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    view: "hHh lpR fFf",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        view: "hHh lpR fFf",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qHeader | typeof __VLS_components.QHeader | typeof __VLS_components.qHeader | typeof __VLS_components.QHeader} */
qHeader;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ elevated: true }, { class: "bg-primary" })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ elevated: true }, { class: "bg-primary" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
var __VLS_12 = __VLS_10.slots.default;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qToolbar | typeof __VLS_components.QToolbar | typeof __VLS_components.qToolbar | typeof __VLS_components.QToolbar} */
qToolbar;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_14), false));
var __VLS_18 = __VLS_16.slots.default;
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ 'onClick': {} }, { flat: true, dense: true, round: true, icon: "arrow_back" })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, round: true, icon: "arrow_back" })], __VLS_functionalComponentArgsRest(__VLS_20), false));
var __VLS_24;
var __VLS_25 = ({ click: {} },
    { onClick: (__VLS_ctx.goBack) });
var __VLS_22;
var __VLS_23;
var __VLS_26;
/** @ts-ignore @type {typeof __VLS_components.qToolbarTitle | typeof __VLS_components.QToolbarTitle | typeof __VLS_components.qToolbarTitle | typeof __VLS_components.QToolbarTitle} */
qToolbarTitle;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({}));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_27), false));
var __VLS_31 = __VLS_29.slots.default;
(__VLS_ctx.title);
// @ts-ignore
[goBack, title,];
var __VLS_29;
if (__VLS_ctx.showSyncStatus) {
    var __VLS_32 = SyncStatus_vue_1.default;
    // @ts-ignore
    var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({}));
    var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_33), false));
}
var __VLS_37;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
    flat: true,
    dense: true,
    round: true,
    icon: "more_vert",
}));
var __VLS_39 = __VLS_38.apply(void 0, __spreadArray([{
        flat: true,
        dense: true,
        round: true,
        icon: "more_vert",
    }], __VLS_functionalComponentArgsRest(__VLS_38), false));
var __VLS_42 = __VLS_40.slots.default;
var __VLS_43;
/** @ts-ignore @type {typeof __VLS_components.qMenu | typeof __VLS_components.QMenu | typeof __VLS_components.qMenu | typeof __VLS_components.QMenu} */
qMenu;
// @ts-ignore
var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({}));
var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_44), false));
var __VLS_48 = __VLS_46.slots.default;
var __VLS_49;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({}));
var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_50), false));
var __VLS_54 = __VLS_52.slots.default;
var __VLS_55;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55(__assign({ 'onClick': {} }, { clickable: true })));
var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { clickable: true })], __VLS_functionalComponentArgsRest(__VLS_56), false));
var __VLS_60;
var __VLS_61 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$router.push('/thread/dashboard');
            // @ts-ignore
            [showSyncStatus, $router,];
        } });
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_62 = __VLS_58.slots.default;
var __VLS_63;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
    avatar: true,
}));
var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_64), false));
var __VLS_68 = __VLS_66.slots.default;
var __VLS_69;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
    name: "dashboard",
}));
var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([{
        name: "dashboard",
    }], __VLS_functionalComponentArgsRest(__VLS_70), false));
// @ts-ignore
[vClosePopup,];
var __VLS_66;
var __VLS_74;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({}));
var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_75), false));
var __VLS_79 = __VLS_77.slots.default;
// @ts-ignore
[];
var __VLS_77;
// @ts-ignore
[];
var __VLS_58;
var __VLS_59;
var __VLS_80;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80(__assign({ 'onClick': {} }, { clickable: true })));
var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { clickable: true })], __VLS_functionalComponentArgsRest(__VLS_81), false));
var __VLS_85;
var __VLS_86 = ({ click: {} },
    { onClick: (__VLS_ctx.toggleDarkMode) });
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_87 = __VLS_83.slots.default;
var __VLS_88;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
    avatar: true,
}));
var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_89), false));
var __VLS_93 = __VLS_91.slots.default;
var __VLS_94;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
    name: "dark_mode",
}));
var __VLS_96 = __VLS_95.apply(void 0, __spreadArray([{
        name: "dark_mode",
    }], __VLS_functionalComponentArgsRest(__VLS_95), false));
// @ts-ignore
[vClosePopup, toggleDarkMode,];
var __VLS_91;
var __VLS_99;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({}));
var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_100), false));
var __VLS_104 = __VLS_102.slots.default;
// @ts-ignore
[];
var __VLS_102;
// @ts-ignore
[];
var __VLS_83;
var __VLS_84;
// @ts-ignore
[];
var __VLS_52;
// @ts-ignore
[];
var __VLS_46;
// @ts-ignore
[];
var __VLS_40;
// @ts-ignore
[];
var __VLS_16;
// @ts-ignore
[];
var __VLS_10;
var __VLS_105;
/** @ts-ignore @type {typeof __VLS_components.qPageContainer | typeof __VLS_components.QPageContainer | typeof __VLS_components.qPageContainer | typeof __VLS_components.QPageContainer} */
qPageContainer;
// @ts-ignore
var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105({}));
var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_106), false));
var __VLS_110 = __VLS_108.slots.default;
var __VLS_111;
/** @ts-ignore @type {typeof __VLS_components.routerView | typeof __VLS_components.RouterView} */
routerView;
// @ts-ignore
var __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111({}));
var __VLS_113 = __VLS_112.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_112), false));
// @ts-ignore
[];
var __VLS_108;
var __VLS_116;
/** @ts-ignore @type {typeof __VLS_components.qFooter | typeof __VLS_components.QFooter | typeof __VLS_components.qFooter | typeof __VLS_components.QFooter} */
qFooter;
// @ts-ignore
var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116(__assign({ elevated: true }, { class: "text-grey-8" })));
var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([__assign({ elevated: true }, { class: "text-grey-8" })], __VLS_functionalComponentArgsRest(__VLS_117), false));
/** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
var __VLS_121 = __VLS_119.slots.default;
var __VLS_122;
/** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
qTabs;
// @ts-ignore
var __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122(__assign(__assign({ modelValue: (__VLS_ctx.activeTab) }, { class: "mobile-nav" }), { activeColor: "primary", indicatorColor: "primary", switchIndicator: true })));
var __VLS_124 = __VLS_123.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.activeTab) }, { class: "mobile-nav" }), { activeColor: "primary", indicatorColor: "primary", switchIndicator: true })], __VLS_functionalComponentArgsRest(__VLS_123), false));
/** @type {__VLS_StyleScopedClasses['mobile-nav']} */ ;
var __VLS_127 = __VLS_125.slots.default;
var __VLS_128;
/** @ts-ignore @type {typeof __VLS_components.qRouteTab | typeof __VLS_components.QRouteTab} */
qRouteTab;
// @ts-ignore
var __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({
    name: "receive",
    icon: "inventory_2",
    label: "Nhập Kho",
    to: ({ name: 'thread-mobile-receive' }),
}));
var __VLS_130 = __VLS_129.apply(void 0, __spreadArray([{
        name: "receive",
        icon: "inventory_2",
        label: "Nhập Kho",
        to: ({ name: 'thread-mobile-receive' }),
    }], __VLS_functionalComponentArgsRest(__VLS_129), false));
var __VLS_133;
/** @ts-ignore @type {typeof __VLS_components.qRouteTab | typeof __VLS_components.QRouteTab} */
qRouteTab;
// @ts-ignore
var __VLS_134 = __VLS_asFunctionalComponent1(__VLS_133, new __VLS_133({
    name: "issue",
    icon: "local_shipping",
    label: "Xuất Kho",
    to: ({ name: 'thread-mobile-issue' }),
}));
var __VLS_135 = __VLS_134.apply(void 0, __spreadArray([{
        name: "issue",
        icon: "local_shipping",
        label: "Xuất Kho",
        to: ({ name: 'thread-mobile-issue' }),
    }], __VLS_functionalComponentArgsRest(__VLS_134), false));
var __VLS_138;
/** @ts-ignore @type {typeof __VLS_components.qRouteTab | typeof __VLS_components.QRouteTab} */
qRouteTab;
// @ts-ignore
var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138({
    name: "return",
    icon: "assignment_returned",
    label: "Nhập Lại",
    to: ({ name: 'thread-mobile-return' }),
}));
var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([{
        name: "return",
        icon: "assignment_returned",
        label: "Nhập Lại",
        to: ({ name: 'thread-mobile-return' }),
    }], __VLS_functionalComponentArgsRest(__VLS_139), false));
var __VLS_143;
/** @ts-ignore @type {typeof __VLS_components.qRouteTab | typeof __VLS_components.QRouteTab} */
qRouteTab;
// @ts-ignore
var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
    name: "recovery",
    icon: "assignment_return",
    label: "Hoàn Trả",
    to: ({ name: 'thread-mobile-recovery' }),
}));
var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([{
        name: "recovery",
        icon: "assignment_return",
        label: "Hoàn Trả",
        to: ({ name: 'thread-mobile-recovery' }),
    }], __VLS_functionalComponentArgsRest(__VLS_144), false));
// @ts-ignore
[activeTab,];
var __VLS_125;
// @ts-ignore
[];
var __VLS_119;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
