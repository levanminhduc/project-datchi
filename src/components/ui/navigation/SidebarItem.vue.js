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
var vue_router_1 = require("vue-router");
var props = withDefaults(defineProps(), {
    level: 0
});
var route = (0, vue_router_1.useRoute)();
var isRouteActive = function (item) {
    if (!item.to)
        return false;
    var itemPath = item.to.replace('#top', '');
    // Exact match only - handles both '/thread' and '/thread/'
    return route.path === itemPath || route.path === itemPath + '/';
};
// Local expansion state - avoids reactivity cascade from computed
var expanded = (0, vue_1.ref)(false);
// Only expand when navigating TO a child route, not on every route change
(0, vue_1.watch)(function () { return route.path; }, function (newPath) {
    if (!props.item.children)
        return;
    var hasActiveChild = props.item.children.some(function (child) {
        if (!child.to)
            return false;
        var childPath = child.to.replace('#top', '');
        return newPath === childPath || newPath === childPath + '/';
    });
    if (hasActiveChild) {
        expanded.value = true;
    }
}, { immediate: true });
var __VLS_defaults = {
    level: 0
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
if ((_a = __VLS_ctx.item.children) === null || _a === void 0 ? void 0 : _a.length) {
    var __VLS_0 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qExpansionItem | typeof __VLS_components.QExpansionItem | typeof __VLS_components.qExpansionItem | typeof __VLS_components.QExpansionItem} */
    qExpansionItem;
    // @ts-ignore
    var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        modelValue: (__VLS_ctx.expanded),
        icon: (__VLS_ctx.item.icon),
        label: (__VLS_ctx.item.label),
        defaultOpened: (false),
        headerInsetLevel: (__VLS_ctx.level),
        headerClass: (__VLS_ctx.expanded ? 'sidebar-item--active' : 'sidebar-item'),
        duration: (0),
        ripple: (false),
        expandSeparator: true,
    }));
    var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.expanded),
            icon: (__VLS_ctx.item.icon),
            label: (__VLS_ctx.item.label),
            defaultOpened: (false),
            headerInsetLevel: (__VLS_ctx.level),
            headerClass: (__VLS_ctx.expanded ? 'sidebar-item--active' : 'sidebar-item'),
            duration: (0),
            ripple: (false),
            expandSeparator: true,
        }], __VLS_functionalComponentArgsRest(__VLS_1), false));
    var __VLS_5 = {};
    var __VLS_6 = __VLS_3.slots.default;
    for (var _i = 0, _b = __VLS_vFor((__VLS_ctx.item.children)); _i < _b.length; _i++) {
        var child = _b[_i][0];
        var __VLS_7 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.SidebarItem} */
        SidebarItem;
        // @ts-ignore
        var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
            key: (child.label),
            item: (child),
            level: (__VLS_ctx.level + 0.5),
        }));
        var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
                key: (child.label),
                item: (child),
                level: (__VLS_ctx.level + 0.5),
            }], __VLS_functionalComponentArgsRest(__VLS_8), false));
        // @ts-ignore
        [item, item, item, item, expanded, expanded, level, level,];
    }
    // @ts-ignore
    [];
    var __VLS_3;
}
else {
    var __VLS_12 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12(__assign(__assign({ clickable: true, to: (__VLS_ctx.item.to), active: (__VLS_ctx.isRouteActive(__VLS_ctx.item)), activeClass: "sidebar-item--active", insetLevel: (__VLS_ctx.level) }, { class: "sidebar-item" }), { class: ({ 'sidebar-item--nested': __VLS_ctx.level > 0 }) })));
    var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([__assign(__assign({ clickable: true, to: (__VLS_ctx.item.to), active: (__VLS_ctx.isRouteActive(__VLS_ctx.item)), activeClass: "sidebar-item--active", insetLevel: (__VLS_ctx.level) }, { class: "sidebar-item" }), { class: ({ 'sidebar-item--nested': __VLS_ctx.level > 0 }) })], __VLS_functionalComponentArgsRest(__VLS_13), false));
    __VLS_asFunctionalDirective(__VLS_directives.vRipple, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    var __VLS_17 = {};
    /** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
    /** @type {__VLS_StyleScopedClasses['sidebar-item--nested']} */ ;
    var __VLS_18 = __VLS_15.slots.default;
    if (__VLS_ctx.item.icon) {
        var __VLS_19 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
            avatar: true,
        }));
        var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_20), false));
        var __VLS_24 = __VLS_22.slots.default;
        var __VLS_25 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
            name: (__VLS_ctx.item.icon),
        }));
        var __VLS_27 = __VLS_26.apply(void 0, __spreadArray([{
                name: (__VLS_ctx.item.icon),
            }], __VLS_functionalComponentArgsRest(__VLS_26), false));
        // @ts-ignore
        [item, item, item, item, level, level, isRouteActive, vRipple,];
        var __VLS_22;
    }
    var __VLS_30 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({}));
    var __VLS_32 = __VLS_31.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_31), false));
    var __VLS_35 = __VLS_33.slots.default;
    var __VLS_36 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({}));
    var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_37), false));
    var __VLS_41 = __VLS_39.slots.default;
    (__VLS_ctx.item.label);
    // @ts-ignore
    [item,];
    var __VLS_39;
    // @ts-ignore
    [];
    var __VLS_33;
    if (__VLS_ctx.item.badge) {
        var __VLS_42 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
            side: true,
        }));
        var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_43), false));
        var __VLS_47 = __VLS_45.slots.default;
        var __VLS_48 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
            color: (__VLS_ctx.item.badgeColor || 'red'),
            label: (__VLS_ctx.item.badge),
        }));
        var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.item.badgeColor || 'red'),
                label: (__VLS_ctx.item.badge),
            }], __VLS_functionalComponentArgsRest(__VLS_49), false));
        // @ts-ignore
        [item, item, item,];
        var __VLS_45;
    }
    // @ts-ignore
    [];
    var __VLS_15;
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
