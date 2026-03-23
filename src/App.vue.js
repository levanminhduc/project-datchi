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
var DarkModeToggle_vue_1 = require("./components/DarkModeToggle.vue");
var ChangePasswordModal_vue_1 = require("./components/auth/ChangePasswordModal.vue");
var useDarkMode_1 = require("./composables/useDarkMode");
var useSidebar_1 = require("./composables/useSidebar");
var useNotifications_1 = require("./composables/useNotifications");
var useAuth_1 = require("./composables/useAuth");
var route = (0, vue_router_1.useRoute)();
var router = (0, vue_router_1.useRouter)();
var initDarkMode = (0, useDarkMode_1.useDarkMode)().init;
var _a = (0, useSidebar_1.useSidebar)(), isOpen = _a.isOpen, navItems = _a.navItems, toggle = _a.toggle;
var _b = (0, useNotifications_1.useNotifications)(), startPolling = _b.startPolling, stopPolling = _b.stopPolling;
var _c = (0, useAuth_1.useAuth)(), employee = _c.employee, isAuthenticated = _c.isAuthenticated, tempPassword = _c.tempPassword;
var showChangePasswordModal = (0, vue_1.computed)(function () { var _a; return ((_a = employee.value) === null || _a === void 0 ? void 0 : _a.mustChangePassword) === true && isAuthenticated.value; });
function onPasswordChanged() {
    if (route.path === "/login") {
        router.push("/");
    }
}
var showSidebar = (0, vue_1.computed)(function () { return route.path !== "/login" && isAuthenticated.value; });
(0, vue_1.watch)(showSidebar, function (show) {
    if (show) {
        startPolling();
    }
    else {
        stopPolling();
    }
}, { immediate: true });
(0, vue_1.onMounted)(function () {
    initDarkMode();
});
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qLayout | typeof __VLS_components.QLayout | typeof __VLS_components.qLayout | typeof __VLS_components.QLayout} */
qLayout;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    view: "hHh Lpr fFf",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        view: "hHh Lpr fFf",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qHeader | typeof __VLS_components.QHeader | typeof __VLS_components.qHeader | typeof __VLS_components.QHeader} */
qHeader;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ elevated: true }, { class: "bg-primary text-white" })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ elevated: true }, { class: "bg-primary text-white" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
var __VLS_12 = __VLS_10.slots.default;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qToolbar | typeof __VLS_components.QToolbar | typeof __VLS_components.qToolbar | typeof __VLS_components.QToolbar} */
qToolbar;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_14), false));
var __VLS_18 = __VLS_16.slots.default;
if (__VLS_ctx.showSidebar) {
    var __VLS_19 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "menu" })));
    var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "menu" })], __VLS_functionalComponentArgsRest(__VLS_20), false));
    var __VLS_24 = void 0;
    var __VLS_25 = ({ click: {} },
        { onClick: (__VLS_ctx.toggle) });
    var __VLS_22;
    var __VLS_23;
}
var __VLS_26;
/** @ts-ignore @type {typeof __VLS_components.qToolbarTitle | typeof __VLS_components.QToolbarTitle | typeof __VLS_components.qToolbarTitle | typeof __VLS_components.QToolbarTitle} */
qToolbarTitle;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({}));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_27), false));
var __VLS_31 = __VLS_29.slots.default;
// @ts-ignore
[showSidebar, toggle,];
var __VLS_29;
if (__VLS_ctx.showSidebar) {
    var __VLS_32 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.NotificationBell} */
    NotificationBell;
    // @ts-ignore
    var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({}));
    var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_33), false));
}
var __VLS_37 = DarkModeToggle_vue_1.default;
// @ts-ignore
var __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({}));
var __VLS_39 = __VLS_38.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_38), false));
var __VLS_42;
/** @ts-ignore @type {typeof __VLS_components.UserMenu} */
UserMenu;
// @ts-ignore
var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({}));
var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_43), false));
// @ts-ignore
[showSidebar,];
var __VLS_16;
// @ts-ignore
[];
var __VLS_10;
if (__VLS_ctx.showSidebar) {
    var __VLS_47 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qDrawer | typeof __VLS_components.QDrawer | typeof __VLS_components.qDrawer | typeof __VLS_components.QDrawer} */
    qDrawer;
    // @ts-ignore
    var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47(__assign({ modelValue: (__VLS_ctx.isOpen), side: "left", bordered: true, width: (280) }, { class: "sidebar" })));
    var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.isOpen), side: "left", bordered: true, width: (280) }, { class: "sidebar" })], __VLS_functionalComponentArgsRest(__VLS_48), false));
    /** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
    var __VLS_52 = __VLS_50.slots.default;
    var __VLS_53 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qScrollArea | typeof __VLS_components.QScrollArea | typeof __VLS_components.qScrollArea | typeof __VLS_components.QScrollArea} */
    qScrollArea;
    // @ts-ignore
    var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53(__assign({ class: "fit" })));
    var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([__assign({ class: "fit" })], __VLS_functionalComponentArgsRest(__VLS_54), false));
    /** @type {__VLS_StyleScopedClasses['fit']} */ ;
    var __VLS_58 = __VLS_56.slots.default;
    var __VLS_59 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59({}));
    var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_60), false));
    var __VLS_64 = __VLS_62.slots.default;
    for (var _i = 0, _d = __VLS_vFor((__VLS_ctx.navItems)); _i < _d.length; _i++) {
        var item = _d[_i][0];
        var __VLS_65 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.SidebarItem} */
        SidebarItem;
        // @ts-ignore
        var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65({
            key: (item.label),
            item: (item),
        }));
        var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([{
                key: (item.label),
                item: (item),
            }], __VLS_functionalComponentArgsRest(__VLS_66), false));
        // @ts-ignore
        [showSidebar, isOpen, navItems,];
    }
    // @ts-ignore
    [];
    var __VLS_62;
    // @ts-ignore
    [];
    var __VLS_56;
    // @ts-ignore
    [];
    var __VLS_50;
}
var __VLS_70;
/** @ts-ignore @type {typeof __VLS_components.qPageContainer | typeof __VLS_components.QPageContainer | typeof __VLS_components.qPageContainer | typeof __VLS_components.QPageContainer} */
qPageContainer;
// @ts-ignore
var __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({}));
var __VLS_72 = __VLS_71.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_71), false));
var __VLS_75 = __VLS_73.slots.default;
var __VLS_76;
/** @ts-ignore @type {typeof __VLS_components.routerView | typeof __VLS_components.RouterView} */
routerView;
// @ts-ignore
var __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({}));
var __VLS_78 = __VLS_77.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_77), false));
// @ts-ignore
[];
var __VLS_73;
var __VLS_81 = ChangePasswordModal_vue_1.default;
// @ts-ignore
var __VLS_82 = __VLS_asFunctionalComponent1(__VLS_81, new __VLS_81(__assign({ 'onChanged': {} }, { modelValue: (__VLS_ctx.showChangePasswordModal), currentPassword: (__VLS_ctx.tempPassword) })));
var __VLS_83 = __VLS_82.apply(void 0, __spreadArray([__assign({ 'onChanged': {} }, { modelValue: (__VLS_ctx.showChangePasswordModal), currentPassword: (__VLS_ctx.tempPassword) })], __VLS_functionalComponentArgsRest(__VLS_82), false));
var __VLS_86;
var __VLS_87 = ({ changed: {} },
    { onChanged: (__VLS_ctx.onPasswordChanged) });
var __VLS_84;
var __VLS_85;
// @ts-ignore
[showChangePasswordModal, tempPassword, onPasswordChanged,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
