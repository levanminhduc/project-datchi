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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var PageHeader_vue_1 = require("@/components/ui/layout/PageHeader.vue");
var StatCard_vue_1 = require("@/components/ui/cards/StatCard.vue");
var employeeService_1 = require("@/services/employeeService");
var composables_1 = require("@/composables");
var quasar_1 = require("quasar");
var activeEmployeeCount = (0, vue_1.ref)(0);
var isLoadingEmployeeCount = (0, vue_1.ref)(true);
var _a = (0, composables_1.useDashboard)(), summary = _a.summary, alerts = _a.alerts, isLoading = _a.isLoading, hasCriticalAlerts = _a.hasCriticalAlerts, fetchAll = _a.fetchAll, refreshDashboard = _a.refreshDashboard;
var lastUpdated = (0, vue_1.ref)(quasar_1.date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY'));
var refreshInterval = (0, vue_1.ref)(null);
var formatNumber = function (val) {
    if (val === undefined || val === null)
        return '0';
    return val.toLocaleString('vi-VN');
};
var totalInventoryLabel = (0, vue_1.computed)(function () {
    var _a, _b;
    if (isLoading.value && !summary.value)
        return '...';
    var total = ((_a = summary.value) === null || _a === void 0 ? void 0 : _a.total_cones) || 0;
    var partial = ((_b = summary.value) === null || _b === void 0 ? void 0 : _b.partial_cones) || 0;
    var full = total - partial;
    return "".concat(formatNumber(full), " nguy\u00EAn, ").concat(formatNumber(partial), " l\u1EBB");
});
var alertCount = (0, vue_1.computed)(function () { return alerts.value.length; });
var stats = (0, vue_1.computed)(function () {
    var _a;
    return [
        {
            label: 'Tổng tồn kho',
            value: isLoading.value && !summary.value ? '...' : formatNumber((_a = summary.value) === null || _a === void 0 ? void 0 : _a.total_cones),
            icon: 'inventory_2',
            color: 'primary',
            trend: totalInventoryLabel.value,
            trendPositive: true,
        },
        {
            label: 'Cảnh báo tồn kho',
            value: isLoading.value && alerts.value.length === 0 ? '...' : alertCount.value,
            icon: 'warning',
            color: hasCriticalAlerts.value ? 'negative' : alertCount.value > 0 ? 'warning' : 'positive',
            trend: alertCount.value === 0 ? 'Ổn định' : "".concat(alerts.value.filter(function (a) { return a.severity === 'critical'; }).length, " nguy c\u1EA5p"),
            trendPositive: alertCount.value === 0,
        },
        {
            label: 'Nhân viên hoạt động',
            value: isLoadingEmployeeCount.value ? '...' : activeEmployeeCount.value,
            icon: 'people',
            color: 'info',
            trendPositive: true,
        },
    ];
});
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, 3, 4]);
                _a = activeEmployeeCount;
                return [4 /*yield*/, employeeService_1.employeeService.getActiveCount()];
            case 1:
                _a.value = _c.sent();
                return [3 /*break*/, 4];
            case 2:
                _b = _c.sent();
                activeEmployeeCount.value = 0;
                return [3 /*break*/, 4];
            case 3:
                isLoadingEmployeeCount.value = false;
                return [7 /*endfinally*/];
            case 4: return [4 /*yield*/, fetchAll()];
            case 5:
                _c.sent();
                lastUpdated.value = quasar_1.date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY');
                refreshInterval.value = window.setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, fetchAll()];
                            case 1:
                                _a.sent();
                                lastUpdated.value = quasar_1.date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY');
                                return [2 /*return*/];
                        }
                    });
                }); }, 60000);
                return [2 /*return*/];
        }
    });
}); });
(0, vue_1.onUnmounted)(function () {
    if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
    }
});
var handleRefresh = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, refreshDashboard()];
            case 1:
                _a.sent();
                lastUpdated.value = quasar_1.date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY');
                return [2 /*return*/];
        }
    });
}); };
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
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
var __VLS_7 = PageHeader_vue_1.default || PageHeader_vue_1.default;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    title: "Tổng Quan",
    subtitle: "Bảng điều khiển hệ thống",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Tổng Quan",
        subtitle: "Bảng điều khiển hệ thống",
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
{
    var __VLS_13 = __VLS_10.slots.actions;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    (__VLS_ctx.lastUpdated);
    var __VLS_14 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, color: "primary", icon: "refresh", loading: (__VLS_ctx.isLoading) })));
    var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, color: "primary", icon: "refresh", loading: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_15), false));
    var __VLS_19 = void 0;
    var __VLS_20 = ({ click: {} },
        { onClick: (__VLS_ctx.handleRefresh) });
    var __VLS_21 = __VLS_17.slots.default;
    var __VLS_22 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({}));
    var __VLS_24 = __VLS_23.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_23), false));
    var __VLS_27 = __VLS_25.slots.default;
    // @ts-ignore
    [lastUpdated, isLoading, handleRefresh,];
    var __VLS_25;
    // @ts-ignore
    [];
    var __VLS_17;
    var __VLS_18;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_10;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mt-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
for (var _i = 0, _b = __VLS_vFor((__VLS_ctx.stats)); _i < _b.length; _i++) {
    var _c = _b[_i], stat = _c[0], index = _c[1];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (index) }, { class: "col-12 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_28 = StatCard_vue_1.default;
    // @ts-ignore
    var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
        label: (stat.label),
        value: (stat.value),
        icon: (stat.icon),
        trend: (stat.trend),
        iconBgColor: (stat.color),
        trendPositive: (stat.trendPositive),
    }));
    var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([{
            label: (stat.label),
            value: (stat.value),
            icon: (stat.icon),
            trend: (stat.trend),
            iconBgColor: (stat.color),
            trendPositive: (stat.trendPositive),
        }], __VLS_functionalComponentArgsRest(__VLS_29), false));
    // @ts-ignore
    [stats,];
}
var __VLS_33;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ class: "q-mt-lg shadow-2" })));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ class: "q-mt-lg shadow-2" })], __VLS_functionalComponentArgsRest(__VLS_34), false));
/** @type {__VLS_StyleScopedClasses['q-mt-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2']} */ ;
var __VLS_38 = __VLS_36.slots.default;
var __VLS_39;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({}));
var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_40), false));
var __VLS_44 = __VLS_42.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 row items-center" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_45;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45(__assign({ name: "warning", color: (__VLS_ctx.hasCriticalAlerts ? 'negative' : 'warning') }, { class: "q-mr-sm" })));
var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([__assign({ name: "warning", color: (__VLS_ctx.hasCriticalAlerts ? 'negative' : 'warning') }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_46), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
if (__VLS_ctx.alerts.length) {
    var __VLS_50 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50(__assign({ color: (__VLS_ctx.hasCriticalAlerts ? 'negative' : 'warning') }, { class: "q-px-sm q-py-xs" })));
    var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.hasCriticalAlerts ? 'negative' : 'warning') }, { class: "q-px-sm q-py-xs" })], __VLS_functionalComponentArgsRest(__VLS_51), false));
    /** @type {__VLS_StyleScopedClasses['q-px-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xs']} */ ;
    var __VLS_55 = __VLS_53.slots.default;
    (__VLS_ctx.alerts.length);
    // @ts-ignore
    [hasCriticalAlerts, hasCriticalAlerts, alerts, alerts,];
    var __VLS_53;
}
// @ts-ignore
[];
var __VLS_42;
var __VLS_56;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({}));
var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_57), false));
if (__VLS_ctx.alerts.length) {
    var __VLS_61 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
        separator: true,
    }));
    var __VLS_63 = __VLS_62.apply(void 0, __spreadArray([{
            separator: true,
        }], __VLS_functionalComponentArgsRest(__VLS_62), false));
    var __VLS_66 = __VLS_64.slots.default;
    for (var _d = 0, _e = __VLS_vFor((__VLS_ctx.alerts)); _d < _e.length; _d++) {
        var alert_1 = _e[_d][0];
        var __VLS_67 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({
            key: (alert_1.id),
        }));
        var __VLS_69 = __VLS_68.apply(void 0, __spreadArray([{
                key: (alert_1.id),
            }], __VLS_functionalComponentArgsRest(__VLS_68), false));
        var __VLS_72 = __VLS_70.slots.default;
        var __VLS_73 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({
            avatar: true,
        }));
        var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_74), false));
        var __VLS_78 = __VLS_76.slots.default;
        var __VLS_79 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
            name: (alert_1.severity === 'critical' ? 'error' : 'warning'),
            color: (alert_1.severity === 'critical' ? 'negative' : 'warning'),
            size: "28px",
        }));
        var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([{
                name: (alert_1.severity === 'critical' ? 'error' : 'warning'),
                color: (alert_1.severity === 'critical' ? 'negative' : 'warning'),
                size: "28px",
            }], __VLS_functionalComponentArgsRest(__VLS_80), false));
        // @ts-ignore
        [alerts, alerts,];
        var __VLS_76;
        var __VLS_84 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({}));
        var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_85), false));
        var __VLS_89 = __VLS_87.slots.default;
        var __VLS_90 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90(__assign({ class: "text-weight-bold" })));
        var __VLS_92 = __VLS_91.apply(void 0, __spreadArray([__assign({ class: "text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_91), false));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        var __VLS_95 = __VLS_93.slots.default;
        (alert_1.thread_type_code);
        (alert_1.thread_type_name);
        // @ts-ignore
        [];
        var __VLS_93;
        var __VLS_96 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
            caption: true,
        }));
        var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_97), false));
        var __VLS_101 = __VLS_99.slots.default;
        (__VLS_ctx.formatNumber(alert_1.current_meters));
        (__VLS_ctx.formatNumber(alert_1.reorder_level));
        // @ts-ignore
        [formatNumber, formatNumber,];
        var __VLS_99;
        var __VLS_102 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress} */
        qLinearProgress;
        // @ts-ignore
        var __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102(__assign(__assign({ value: (alert_1.percentage / 100), color: (alert_1.severity === 'critical' ? 'negative' : 'warning') }, { class: "q-mt-xs" }), { style: {} })));
        var __VLS_104 = __VLS_103.apply(void 0, __spreadArray([__assign(__assign({ value: (alert_1.percentage / 100), color: (alert_1.severity === 'critical' ? 'negative' : 'warning') }, { class: "q-mt-xs" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_103), false));
        /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
        // @ts-ignore
        [];
        var __VLS_87;
        var __VLS_107 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_108 = __VLS_asFunctionalComponent1(__VLS_107, new __VLS_107({
            side: true,
        }));
        var __VLS_109 = __VLS_108.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_108), false));
        var __VLS_112 = __VLS_110.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column items-end" }));
        /** @type {__VLS_StyleScopedClasses['column']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
        var __VLS_113 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_114 = __VLS_asFunctionalComponent1(__VLS_113, new __VLS_113({
            color: (alert_1.severity === 'critical' ? 'negative' : 'warning'),
        }));
        var __VLS_115 = __VLS_114.apply(void 0, __spreadArray([{
                color: (alert_1.severity === 'critical' ? 'negative' : 'warning'),
            }], __VLS_functionalComponentArgsRest(__VLS_114), false));
        var __VLS_118 = __VLS_116.slots.default;
        (alert_1.percentage.toFixed(0));
        // @ts-ignore
        [];
        var __VLS_116;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7 q-mt-xs" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
        (alert_1.severity === 'critical' ? 'Nguy cấp' : 'Thấp');
        // @ts-ignore
        [];
        var __VLS_110;
        // @ts-ignore
        [];
        var __VLS_70;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_64;
}
else if (!__VLS_ctx.isLoading) {
    var __VLS_119 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119(__assign({ class: "text-center text-grey-6 q-pa-xl" })));
    var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([__assign({ class: "text-center text-grey-6 q-pa-xl" })], __VLS_functionalComponentArgsRest(__VLS_120), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    var __VLS_124 = __VLS_122.slots.default;
    var __VLS_125 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125(__assign({ name: "check_circle", size: "48px", color: "positive" }, { class: "q-mb-sm" })));
    var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([__assign({ name: "check_circle", size: "48px", color: "positive" }, { class: "q-mb-sm" })], __VLS_functionalComponentArgsRest(__VLS_126), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    // @ts-ignore
    [isLoading,];
    var __VLS_122;
}
var __VLS_130;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130({
    showing: (__VLS_ctx.isLoading && __VLS_ctx.alerts.length === 0),
}));
var __VLS_132 = __VLS_131.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.isLoading && __VLS_ctx.alerts.length === 0),
    }], __VLS_functionalComponentArgsRest(__VLS_131), false));
var __VLS_135 = __VLS_133.slots.default;
var __VLS_136;
/** @ts-ignore @type {typeof __VLS_components.qSpinnerOval | typeof __VLS_components.QSpinnerOval} */
qSpinnerOval;
// @ts-ignore
var __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({
    color: "primary",
    size: "40px",
}));
var __VLS_138 = __VLS_137.apply(void 0, __spreadArray([{
        color: "primary",
        size: "40px",
    }], __VLS_functionalComponentArgsRest(__VLS_137), false));
// @ts-ignore
[isLoading, alerts,];
var __VLS_133;
// @ts-ignore
[];
var __VLS_36;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
