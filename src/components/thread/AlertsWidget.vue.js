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
var useDashboard_1 = require("@/composables/thread/useDashboard");
var useSnackbar_1 = require("@/composables/useSnackbar");
var props = withDefaults(defineProps(), {
    autoFetch: true,
    maxDisplay: 5,
});
// Composables
var _a = (0, useDashboard_1.useDashboard)(), alerts = _a.alerts, fetchAlerts = _a.fetchAlerts, hasCriticalAlerts = _a.hasCriticalAlerts;
var snackbar = (0, useSnackbar_1.useSnackbar)();
// Local state
var dismissedAlerts = (0, vue_1.ref)(new Set());
// Computed
var filteredAlerts = (0, vue_1.computed)(function () {
    return alerts.value.filter(function (alert) { return !dismissedAlerts.value.has(alert.id); });
});
var displayAlerts = (0, vue_1.computed)(function () {
    return filteredAlerts.value.slice(0, props.maxDisplay);
});
var alertCount = (0, vue_1.computed)(function () { return filteredAlerts.value.length; });
var hasCritical = (0, vue_1.computed)(function () { return hasCriticalAlerts.value; });
// Methods
var getAlertColor = function (severity) {
    switch (severity) {
        case 'critical':
            return 'negative';
        case 'warning':
            return 'warning';
        default:
            return 'info';
    }
};
var getAlertIcon = function (severity) {
    switch (severity) {
        case 'critical':
            return 'error_outline';
        case 'warning':
            return 'inventory_2';
        default:
            return 'notifications';
    }
};
var getAlertClass = function (severity) {
    if (severity === 'critical') {
        return 'bg-red-1';
    }
    return '';
};
var getAlertTitle = function (alert) {
    var percentage = Math.round(alert.percentage);
    if (alert.severity === 'critical') {
        return "S\u1EAFp h\u1EBFt h\u00E0ng (".concat(percentage, "%)");
    }
    return "T\u1ED3n kho th\u1EA5p (".concat(percentage, "%)");
};
var getSeverityLabel = function (severity) {
    switch (severity) {
        case 'critical':
            return 'Nghiêm trọng';
        case 'warning':
            return 'Cảnh báo';
        default:
            return 'Thông tin';
    }
};
var dismissAlert = function (alertId) {
    dismissedAlerts.value.add(alertId);
    snackbar.info('Đã bỏ qua cảnh báo');
};
// Lifecycle
(0, vue_1.onMounted)(function () {
    if (props.autoFetch) {
        fetchAlerts();
    }
});
var __VLS_defaults = {
    autoFetch: true,
    maxDisplay: 5,
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    bordered: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    name: "notifications_active",
    color: "warning",
    size: "24px",
}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{
        name: "notifications_active",
        color: "warning",
        size: "24px",
    }], __VLS_functionalComponentArgsRest(__VLS_14), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
if (__VLS_ctx.alertCount > 0) {
    var __VLS_18 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        color: (__VLS_ctx.hasCritical ? 'negative' : 'warning'),
        label: (__VLS_ctx.alertCount),
        rounded: true,
    }));
    var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.hasCritical ? 'negative' : 'warning'),
            label: (__VLS_ctx.alertCount),
            rounded: true,
        }], __VLS_functionalComponentArgsRest(__VLS_19), false));
}
if (__VLS_ctx.alertCount === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-py-md" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-md']} */ ;
    var __VLS_23 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        name: "notifications_off",
        color: "positive",
        size: "48px",
    }));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
            name: "notifications_off",
            color: "positive",
            size: "48px",
        }], __VLS_functionalComponentArgsRest(__VLS_24), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
}
else {
    var __VLS_28 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
        separator: true,
        dense: true,
    }));
    var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([{
            separator: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_29), false));
    var __VLS_33 = __VLS_31.slots.default;
    var _loop_1 = function (alert_1) {
        var __VLS_34 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34(__assign({ key: (alert_1.id) }, { class: (__VLS_ctx.getAlertClass(alert_1.severity)) })));
        var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([__assign({ key: (alert_1.id) }, { class: (__VLS_ctx.getAlertClass(alert_1.severity)) })], __VLS_functionalComponentArgsRest(__VLS_35), false));
        var __VLS_39 = __VLS_37.slots.default;
        var __VLS_40 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
            avatar: true,
        }));
        var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_41), false));
        var __VLS_45 = __VLS_43.slots.default;
        var __VLS_46 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
            name: (__VLS_ctx.getAlertIcon(alert_1.severity)),
            color: (__VLS_ctx.getAlertColor(alert_1.severity)),
            size: "24px",
        }));
        var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([{
                name: (__VLS_ctx.getAlertIcon(alert_1.severity)),
                color: (__VLS_ctx.getAlertColor(alert_1.severity)),
                size: "24px",
            }], __VLS_functionalComponentArgsRest(__VLS_47), false));
        // @ts-ignore
        [$attrs, alertCount, alertCount, alertCount, hasCritical, displayAlerts, getAlertClass, getAlertIcon, getAlertColor,];
        var __VLS_51 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({}));
        var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_52), false));
        var __VLS_56 = __VLS_54.slots.default;
        var __VLS_57 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57(__assign({ class: ({ 'text-weight-bold': alert_1.severity === 'critical' }) })));
        var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([__assign({ class: ({ 'text-weight-bold': alert_1.severity === 'critical' }) })], __VLS_functionalComponentArgsRest(__VLS_58), false));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        var __VLS_62 = __VLS_60.slots.default;
        (__VLS_ctx.getAlertTitle(alert_1));
        // @ts-ignore
        [getAlertTitle,];
        var __VLS_63 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
            caption: true,
        }));
        var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_64), false));
        var __VLS_68 = __VLS_66.slots.default;
        (alert_1.thread_type_name || alert_1.thread_type_code);
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        var __VLS_69 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
            side: true,
        }));
        var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_70), false));
        var __VLS_74 = __VLS_72.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-xs" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
        var __VLS_75 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
            color: (__VLS_ctx.getAlertColor(alert_1.severity)),
            label: (__VLS_ctx.getSeverityLabel(alert_1.severity)),
            outline: true,
        }));
        var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.getAlertColor(alert_1.severity)),
                label: (__VLS_ctx.getSeverityLabel(alert_1.severity)),
                outline: true,
            }], __VLS_functionalComponentArgsRest(__VLS_76), false));
        var __VLS_80 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, size: "sm", icon: "close", color: "grey" })));
        var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, size: "sm", icon: "close", color: "grey" })], __VLS_functionalComponentArgsRest(__VLS_81), false));
        var __VLS_85 = void 0;
        var __VLS_86 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.alertCount === 0))
                        return;
                    __VLS_ctx.dismissAlert(alert_1.id);
                    // @ts-ignore
                    [getAlertColor, getSeverityLabel, dismissAlert,];
                } });
        var __VLS_87 = __VLS_83.slots.default;
        var __VLS_88 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({}));
        var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_89), false));
        var __VLS_93 = __VLS_91.slots.default;
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_43, __VLS_60, __VLS_66, __VLS_54, __VLS_91, __VLS_83, __VLS_84, __VLS_72, __VLS_37;
    for (var _i = 0, _b = __VLS_vFor((__VLS_ctx.displayAlerts)); _i < _b.length; _i++) {
        var alert_1 = _b[_i][0];
        _loop_1(alert_1);
    }
    // @ts-ignore
    [];
    var __VLS_31;
}
// @ts-ignore
[];
var __VLS_10;
if (__VLS_ctx.alertCount > 5) {
    var __VLS_94 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({}));
    var __VLS_96 = __VLS_95.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_95), false));
    var __VLS_99 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
        align: "right",
    }));
    var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_100), false));
    var __VLS_104 = __VLS_102.slots.default;
    var __VLS_105 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Xem tất cả", iconRight: "arrow_forward" })));
    var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Xem tất cả", iconRight: "arrow_forward" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
    var __VLS_110 = void 0;
    var __VLS_111 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.alertCount > 5))
                    return;
                __VLS_ctx.$router.push('/thread/inventory?tab=alerts');
                // @ts-ignore
                [alertCount, $router,];
            } });
    var __VLS_108;
    var __VLS_109;
    // @ts-ignore
    [];
    var __VLS_102;
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
