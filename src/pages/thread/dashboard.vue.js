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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var composables_1 = require("@/composables");
var quasar_1 = require("quasar");
// Composables
var _o = (0, composables_1.useDashboard)(), summary = _o.summary, alerts = _o.alerts, conflicts = _o.conflicts, pending = _o.pending, activity = _o.activity, isLoading = _o.isLoading, hasCriticalAlerts = _o.hasCriticalAlerts, fetchAll = _o.fetchAll, refreshDashboard = _o.refreshDashboard;
// State
var lastUpdated = (0, vue_1.ref)(quasar_1.date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY'));
var refreshInterval = (0, vue_1.ref)(null);
// Helpers
var formatNumber = function (val) {
    if (val === undefined || val === null)
        return '0';
    return val.toLocaleString('vi-VN');
};
var formatDate = function (val) {
    return quasar_1.date.formatDate(val, 'HH:mm DD/MM/YYYY');
};
var getActivityIcon = function (type) {
    switch (type) {
        case 'RECEIVE': return 'add_shopping_cart';
        case 'ISSUE': return 'remove_shopping_cart';
        case 'RETURN': return 'assignment_return';
        case 'ALLOCATION': return 'assignment';
        case 'CONFLICT': return 'bolt';
        default: return 'history';
    }
};
var getActivityColor = function (type) {
    switch (type) {
        case 'RECEIVE': return 'positive';
        case 'ISSUE': return 'info';
        case 'RETURN': return 'orange';
        case 'ALLOCATION': return 'primary';
        case 'CONFLICT': return 'negative';
        default: return 'grey-7';
    }
};
var formatMetadata = function (item) {
    if (!item.metadata)
        return '';
    // Customize based on what metadata contains
    var meta = item.metadata;
    if (meta.code)
        return "Lo\u1EA1i ch\u1EC9: ".concat(meta.code, " - ").concat(meta.name || '');
    if (meta.order_no)
        return "\u0110\u01A1n h\u00E0ng: ".concat(meta.order_no);
    return JSON.stringify(meta);
};
// Lifecycle
(0, vue_1.onMounted)(function () {
    fetchAll().then(function () {
        lastUpdated.value = quasar_1.date.formatDate(Date.now(), 'HH:mm:ss DD/MM/YYYY');
    });
    // Refresh every 60 seconds
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
});
(0, vue_1.onUnmounted)(function () {
    if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
    }
});
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h5 text-weight-bold" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
(__VLS_ctx.lastUpdated);
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "refresh", loading: (__VLS_ctx.isLoading) })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "refresh", loading: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
var __VLS_13 = ({ click: {} },
    { onClick: (__VLS_ctx.refreshDashboard) });
var __VLS_14 = __VLS_10.slots.default;
var __VLS_15;
/** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
qTooltip;
// @ts-ignore
var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({}));
var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_16), false));
var __VLS_20 = __VLS_18.slots.default;
// @ts-ignore
[lastUpdated, isLoading, refreshDashboard,];
var __VLS_18;
// @ts-ignore
[];
var __VLS_10;
var __VLS_11;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_21;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21(__assign({ class: "stat-card border-left-primary" })));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([__assign({ class: "stat-card border-left-primary" })], __VLS_functionalComponentArgsRest(__VLS_22), false));
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['border-left-primary']} */ ;
var __VLS_26 = __VLS_24.slots.default;
var __VLS_27;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({}));
var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_28), false));
var __VLS_32 = __VLS_30.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-overline text-grey-7" }));
/** @type {__VLS_StyleScopedClasses['text-overline']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-weight-bold text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
(__VLS_ctx.formatNumber((_a = __VLS_ctx.summary) === null || _a === void 0 ? void 0 : _a.total_cones));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-8" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
(__VLS_ctx.formatNumber((_b = __VLS_ctx.summary) === null || _b === void 0 ? void 0 : _b.total_meters));
// @ts-ignore
[formatNumber, formatNumber, summary, summary,];
var __VLS_30;
var __VLS_33;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
    showing: (__VLS_ctx.isLoading && !__VLS_ctx.summary),
}));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.isLoading && !__VLS_ctx.summary),
    }], __VLS_functionalComponentArgsRest(__VLS_34), false));
var __VLS_38 = __VLS_36.slots.default;
var __VLS_39;
/** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
qSpinnerDots;
// @ts-ignore
var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
    color: "primary",
}));
var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([{
        color: "primary",
    }], __VLS_functionalComponentArgsRest(__VLS_40), false));
// @ts-ignore
[isLoading, summary,];
var __VLS_36;
// @ts-ignore
[];
var __VLS_24;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_44;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44(__assign({ class: "stat-card border-left-positive" })));
var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([__assign({ class: "stat-card border-left-positive" })], __VLS_functionalComponentArgsRest(__VLS_45), false));
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['border-left-positive']} */ ;
var __VLS_49 = __VLS_47.slots.default;
var __VLS_50;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({}));
var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_51), false));
var __VLS_55 = __VLS_53.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-overline text-grey-7" }));
/** @type {__VLS_StyleScopedClasses['text-overline']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-weight-bold text-positive" }));
/** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
(__VLS_ctx.formatNumber((_c = __VLS_ctx.summary) === null || _c === void 0 ? void 0 : _c.available_cones));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-8" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
(__VLS_ctx.formatNumber((_d = __VLS_ctx.summary) === null || _d === void 0 ? void 0 : _d.available_meters));
// @ts-ignore
[formatNumber, formatNumber, summary, summary,];
var __VLS_53;
var __VLS_56;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
    showing: (__VLS_ctx.isLoading && !__VLS_ctx.summary),
}));
var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.isLoading && !__VLS_ctx.summary),
    }], __VLS_functionalComponentArgsRest(__VLS_57), false));
var __VLS_61 = __VLS_59.slots.default;
var __VLS_62;
/** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
qSpinnerDots;
// @ts-ignore
var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
    color: "positive",
}));
var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([{
        color: "positive",
    }], __VLS_functionalComponentArgsRest(__VLS_63), false));
// @ts-ignore
[isLoading, summary,];
var __VLS_59;
// @ts-ignore
[];
var __VLS_47;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_67;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67(__assign({ class: "stat-card border-left-info" })));
var __VLS_69 = __VLS_68.apply(void 0, __spreadArray([__assign({ class: "stat-card border-left-info" })], __VLS_functionalComponentArgsRest(__VLS_68), false));
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['border-left-info']} */ ;
var __VLS_72 = __VLS_70.slots.default;
var __VLS_73;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({}));
var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_74), false));
var __VLS_78 = __VLS_76.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-overline text-grey-7" }));
/** @type {__VLS_StyleScopedClasses['text-overline']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-weight-bold text-info" }));
/** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-info']} */ ;
(__VLS_ctx.formatNumber((_e = __VLS_ctx.summary) === null || _e === void 0 ? void 0 : _e.allocated_cones));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-8" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
(__VLS_ctx.formatNumber((_f = __VLS_ctx.summary) === null || _f === void 0 ? void 0 : _f.allocated_meters));
// @ts-ignore
[formatNumber, formatNumber, summary, summary,];
var __VLS_76;
var __VLS_79;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
    showing: (__VLS_ctx.isLoading && !__VLS_ctx.summary),
}));
var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.isLoading && !__VLS_ctx.summary),
    }], __VLS_functionalComponentArgsRest(__VLS_80), false));
var __VLS_84 = __VLS_82.slots.default;
var __VLS_85;
/** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
qSpinnerDots;
// @ts-ignore
var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({
    color: "info",
}));
var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([{
        color: "info",
    }], __VLS_functionalComponentArgsRest(__VLS_86), false));
// @ts-ignore
[isLoading, summary,];
var __VLS_82;
// @ts-ignore
[];
var __VLS_70;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_90;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90(__assign({ class: "stat-card border-left-secondary" })));
var __VLS_92 = __VLS_91.apply(void 0, __spreadArray([__assign({ class: "stat-card border-left-secondary" })], __VLS_functionalComponentArgsRest(__VLS_91), false));
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['border-left-secondary']} */ ;
var __VLS_95 = __VLS_93.slots.default;
var __VLS_96;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({}));
var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_97), false));
var __VLS_101 = __VLS_99.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-overline text-grey-7" }));
/** @type {__VLS_StyleScopedClasses['text-overline']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-weight-bold text-secondary" }));
/** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
(__VLS_ctx.formatNumber((_g = __VLS_ctx.summary) === null || _g === void 0 ? void 0 : _g.in_production_cones));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-8" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
(__VLS_ctx.formatNumber((_h = __VLS_ctx.summary) === null || _h === void 0 ? void 0 : _h.partial_cones));
// @ts-ignore
[formatNumber, formatNumber, summary, summary,];
var __VLS_99;
var __VLS_102;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102({
    showing: (__VLS_ctx.isLoading && !__VLS_ctx.summary),
}));
var __VLS_104 = __VLS_103.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.isLoading && !__VLS_ctx.summary),
    }], __VLS_functionalComponentArgsRest(__VLS_103), false));
var __VLS_107 = __VLS_105.slots.default;
var __VLS_108;
/** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
qSpinnerDots;
// @ts-ignore
var __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108({
    color: "secondary",
}));
var __VLS_110 = __VLS_109.apply(void 0, __spreadArray([{
        color: "secondary",
    }], __VLS_functionalComponentArgsRest(__VLS_109), false));
// @ts-ignore
[isLoading, summary,];
var __VLS_105;
// @ts-ignore
[];
var __VLS_93;
var __VLS_113;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_114 = __VLS_asFunctionalComponent1(__VLS_113, new __VLS_113(__assign({ class: "q-mb-md shadow-2" })));
var __VLS_115 = __VLS_114.apply(void 0, __spreadArray([__assign({ class: "q-mb-md shadow-2" })], __VLS_functionalComponentArgsRest(__VLS_114), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2']} */ ;
var __VLS_118 = __VLS_116.slots.default;
var __VLS_119;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({}));
var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_120), false));
var __VLS_124 = __VLS_122.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 row items-center" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_125;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125(__assign({ name: "warning", color: (__VLS_ctx.hasCriticalAlerts ? 'negative' : 'warning') }, { class: "q-mr-sm" })));
var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([__assign({ name: "warning", color: (__VLS_ctx.hasCriticalAlerts ? 'negative' : 'warning') }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_126), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
if (__VLS_ctx.alerts.length) {
    var __VLS_130 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130(__assign({ color: (__VLS_ctx.hasCriticalAlerts ? 'negative' : 'warning') }, { class: "q-px-sm q-py-xs" })));
    var __VLS_132 = __VLS_131.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.hasCriticalAlerts ? 'negative' : 'warning') }, { class: "q-px-sm q-py-xs" })], __VLS_functionalComponentArgsRest(__VLS_131), false));
    /** @type {__VLS_StyleScopedClasses['q-px-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xs']} */ ;
    var __VLS_135 = __VLS_133.slots.default;
    (__VLS_ctx.alerts.length);
    // @ts-ignore
    [hasCriticalAlerts, hasCriticalAlerts, alerts, alerts,];
    var __VLS_133;
}
// @ts-ignore
[];
var __VLS_122;
var __VLS_136;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({}));
var __VLS_138 = __VLS_137.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_137), false));
if (__VLS_ctx.alerts.length) {
    var __VLS_141 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_142 = __VLS_asFunctionalComponent1(__VLS_141, new __VLS_141({
        separator: true,
    }));
    var __VLS_143 = __VLS_142.apply(void 0, __spreadArray([{
            separator: true,
        }], __VLS_functionalComponentArgsRest(__VLS_142), false));
    var __VLS_146 = __VLS_144.slots.default;
    for (var _i = 0, _p = __VLS_vFor((__VLS_ctx.alerts)); _i < _p.length; _i++) {
        var alert_1 = _p[_i][0];
        var __VLS_147 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({
            key: (alert_1.id),
        }));
        var __VLS_149 = __VLS_148.apply(void 0, __spreadArray([{
                key: (alert_1.id),
            }], __VLS_functionalComponentArgsRest(__VLS_148), false));
        var __VLS_152 = __VLS_150.slots.default;
        var __VLS_153 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_154 = __VLS_asFunctionalComponent1(__VLS_153, new __VLS_153({
            avatar: true,
        }));
        var __VLS_155 = __VLS_154.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_154), false));
        var __VLS_158 = __VLS_156.slots.default;
        var __VLS_159 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_160 = __VLS_asFunctionalComponent1(__VLS_159, new __VLS_159({
            name: (alert_1.severity === 'critical' ? 'error' : 'warning'),
            color: (alert_1.severity === 'critical' ? 'negative' : 'warning'),
            size: "28px",
        }));
        var __VLS_161 = __VLS_160.apply(void 0, __spreadArray([{
                name: (alert_1.severity === 'critical' ? 'error' : 'warning'),
                color: (alert_1.severity === 'critical' ? 'negative' : 'warning'),
                size: "28px",
            }], __VLS_functionalComponentArgsRest(__VLS_160), false));
        // @ts-ignore
        [alerts, alerts,];
        var __VLS_156;
        var __VLS_164 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_165 = __VLS_asFunctionalComponent1(__VLS_164, new __VLS_164({}));
        var __VLS_166 = __VLS_165.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_165), false));
        var __VLS_169 = __VLS_167.slots.default;
        var __VLS_170 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_171 = __VLS_asFunctionalComponent1(__VLS_170, new __VLS_170(__assign({ class: "text-weight-bold" })));
        var __VLS_172 = __VLS_171.apply(void 0, __spreadArray([__assign({ class: "text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_171), false));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        var __VLS_175 = __VLS_173.slots.default;
        (alert_1.thread_type_code);
        (alert_1.thread_type_name);
        // @ts-ignore
        [];
        var __VLS_173;
        var __VLS_176 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_177 = __VLS_asFunctionalComponent1(__VLS_176, new __VLS_176({
            caption: true,
        }));
        var __VLS_178 = __VLS_177.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_177), false));
        var __VLS_181 = __VLS_179.slots.default;
        (__VLS_ctx.formatNumber(alert_1.current_meters));
        (__VLS_ctx.formatNumber(alert_1.reorder_level));
        // @ts-ignore
        [formatNumber, formatNumber,];
        var __VLS_179;
        var __VLS_182 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress} */
        qLinearProgress;
        // @ts-ignore
        var __VLS_183 = __VLS_asFunctionalComponent1(__VLS_182, new __VLS_182(__assign(__assign({ value: (alert_1.percentage / 100), color: (alert_1.severity === 'critical' ? 'negative' : 'warning') }, { class: "q-mt-xs" }), { style: {} })));
        var __VLS_184 = __VLS_183.apply(void 0, __spreadArray([__assign(__assign({ value: (alert_1.percentage / 100), color: (alert_1.severity === 'critical' ? 'negative' : 'warning') }, { class: "q-mt-xs" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_183), false));
        /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
        // @ts-ignore
        [];
        var __VLS_167;
        var __VLS_187 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_188 = __VLS_asFunctionalComponent1(__VLS_187, new __VLS_187({
            side: true,
        }));
        var __VLS_189 = __VLS_188.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_188), false));
        var __VLS_192 = __VLS_190.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column items-end" }));
        /** @type {__VLS_StyleScopedClasses['column']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
        var __VLS_193 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_194 = __VLS_asFunctionalComponent1(__VLS_193, new __VLS_193({
            color: (alert_1.severity === 'critical' ? 'negative' : 'warning'),
        }));
        var __VLS_195 = __VLS_194.apply(void 0, __spreadArray([{
                color: (alert_1.severity === 'critical' ? 'negative' : 'warning'),
            }], __VLS_functionalComponentArgsRest(__VLS_194), false));
        var __VLS_198 = __VLS_196.slots.default;
        (alert_1.percentage.toFixed(0));
        // @ts-ignore
        [];
        var __VLS_196;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7 q-mt-xs" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
        (alert_1.severity === 'critical' ? 'Nguy cấp' : 'Thấp');
        // @ts-ignore
        [];
        var __VLS_190;
        // @ts-ignore
        [];
        var __VLS_150;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_144;
}
else if (!__VLS_ctx.isLoading) {
    var __VLS_199 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_200 = __VLS_asFunctionalComponent1(__VLS_199, new __VLS_199(__assign({ class: "text-center text-grey-6 q-pa-xl" })));
    var __VLS_201 = __VLS_200.apply(void 0, __spreadArray([__assign({ class: "text-center text-grey-6 q-pa-xl" })], __VLS_functionalComponentArgsRest(__VLS_200), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    var __VLS_204 = __VLS_202.slots.default;
    var __VLS_205 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_206 = __VLS_asFunctionalComponent1(__VLS_205, new __VLS_205(__assign({ name: "check_circle", size: "48px", color: "positive" }, { class: "q-mb-sm" })));
    var __VLS_207 = __VLS_206.apply(void 0, __spreadArray([__assign({ name: "check_circle", size: "48px", color: "positive" }, { class: "q-mb-sm" })], __VLS_functionalComponentArgsRest(__VLS_206), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    // @ts-ignore
    [isLoading,];
    var __VLS_202;
}
var __VLS_210;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_211 = __VLS_asFunctionalComponent1(__VLS_210, new __VLS_210({
    showing: (__VLS_ctx.isLoading && __VLS_ctx.alerts.length === 0),
}));
var __VLS_212 = __VLS_211.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.isLoading && __VLS_ctx.alerts.length === 0),
    }], __VLS_functionalComponentArgsRest(__VLS_211), false));
var __VLS_215 = __VLS_213.slots.default;
var __VLS_216;
/** @ts-ignore @type {typeof __VLS_components.qSpinnerOval | typeof __VLS_components.QSpinnerOval} */
qSpinnerOval;
// @ts-ignore
var __VLS_217 = __VLS_asFunctionalComponent1(__VLS_216, new __VLS_216({
    color: "primary",
    size: "40px",
}));
var __VLS_218 = __VLS_217.apply(void 0, __spreadArray([{
        color: "primary",
        size: "40px",
    }], __VLS_functionalComponentArgsRest(__VLS_217), false));
// @ts-ignore
[isLoading, alerts,];
var __VLS_213;
// @ts-ignore
[];
var __VLS_116;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_221;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221(__assign({ class: "full-height shadow-2" })));
var __VLS_223 = __VLS_222.apply(void 0, __spreadArray([__assign({ class: "full-height shadow-2" })], __VLS_functionalComponentArgsRest(__VLS_222), false));
/** @type {__VLS_StyleScopedClasses['full-height']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2']} */ ;
var __VLS_226 = __VLS_224.slots.default;
var __VLS_227;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_228 = __VLS_asFunctionalComponent1(__VLS_227, new __VLS_227({}));
var __VLS_229 = __VLS_228.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_228), false));
var __VLS_232 = __VLS_230.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 row items-center" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_233;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_234 = __VLS_asFunctionalComponent1(__VLS_233, new __VLS_233(__assign({ name: "pending_actions", color: "primary" }, { class: "q-mr-sm" })));
var __VLS_235 = __VLS_234.apply(void 0, __spreadArray([__assign({ name: "pending_actions", color: "primary" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_234), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
// @ts-ignore
[];
var __VLS_230;
var __VLS_238;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_239 = __VLS_asFunctionalComponent1(__VLS_238, new __VLS_238({}));
var __VLS_240 = __VLS_239.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_239), false));
var __VLS_243;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_244 = __VLS_asFunctionalComponent1(__VLS_243, new __VLS_243({
    padding: true,
}));
var __VLS_245 = __VLS_244.apply(void 0, __spreadArray([{
        padding: true,
    }], __VLS_functionalComponentArgsRest(__VLS_244), false));
var __VLS_248 = __VLS_246.slots.default;
var __VLS_249;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_250 = __VLS_asFunctionalComponent1(__VLS_249, new __VLS_249({
    clickable: true,
    to: "/thread/allocations",
}));
var __VLS_251 = __VLS_250.apply(void 0, __spreadArray([{
        clickable: true,
        to: "/thread/allocations",
    }], __VLS_functionalComponentArgsRest(__VLS_250), false));
__VLS_asFunctionalDirective(__VLS_directives.vRipple, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_254 = __VLS_252.slots.default;
var __VLS_255;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_256 = __VLS_asFunctionalComponent1(__VLS_255, new __VLS_255({
    avatar: true,
}));
var __VLS_257 = __VLS_256.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_256), false));
var __VLS_260 = __VLS_258.slots.default;
var __VLS_261;
/** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
qAvatar;
// @ts-ignore
var __VLS_262 = __VLS_asFunctionalComponent1(__VLS_261, new __VLS_261({
    color: "blue-1",
    textColor: "blue",
    icon: "assignment",
}));
var __VLS_263 = __VLS_262.apply(void 0, __spreadArray([{
        color: "blue-1",
        textColor: "blue",
        icon: "assignment",
    }], __VLS_functionalComponentArgsRest(__VLS_262), false));
// @ts-ignore
[vRipple,];
var __VLS_258;
var __VLS_266;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_267 = __VLS_asFunctionalComponent1(__VLS_266, new __VLS_266({}));
var __VLS_268 = __VLS_267.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_267), false));
var __VLS_271 = __VLS_269.slots.default;
var __VLS_272;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_273 = __VLS_asFunctionalComponent1(__VLS_272, new __VLS_272({}));
var __VLS_274 = __VLS_273.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_273), false));
var __VLS_277 = __VLS_275.slots.default;
// @ts-ignore
[];
var __VLS_275;
var __VLS_278;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_279 = __VLS_asFunctionalComponent1(__VLS_278, new __VLS_278({
    caption: true,
}));
var __VLS_280 = __VLS_279.apply(void 0, __spreadArray([{
        caption: true,
    }], __VLS_functionalComponentArgsRest(__VLS_279), false));
var __VLS_283 = __VLS_281.slots.default;
// @ts-ignore
[];
var __VLS_281;
// @ts-ignore
[];
var __VLS_269;
var __VLS_284;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_285 = __VLS_asFunctionalComponent1(__VLS_284, new __VLS_284({
    side: true,
}));
var __VLS_286 = __VLS_285.apply(void 0, __spreadArray([{
        side: true,
    }], __VLS_functionalComponentArgsRest(__VLS_285), false));
var __VLS_289 = __VLS_287.slots.default;
var __VLS_290;
/** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
qBadge;
// @ts-ignore
var __VLS_291 = __VLS_asFunctionalComponent1(__VLS_290, new __VLS_290({
    color: "primary",
    rounded: true,
}));
var __VLS_292 = __VLS_291.apply(void 0, __spreadArray([{
        color: "primary",
        rounded: true,
    }], __VLS_functionalComponentArgsRest(__VLS_291), false));
var __VLS_295 = __VLS_293.slots.default;
(((_j = __VLS_ctx.pending) === null || _j === void 0 ? void 0 : _j.pending_allocations) || 0);
// @ts-ignore
[pending,];
var __VLS_293;
// @ts-ignore
[];
var __VLS_287;
// @ts-ignore
[];
var __VLS_252;
var __VLS_296;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_297 = __VLS_asFunctionalComponent1(__VLS_296, new __VLS_296({
    clickable: true,
    to: "/thread/recovery",
}));
var __VLS_298 = __VLS_297.apply(void 0, __spreadArray([{
        clickable: true,
        to: "/thread/recovery",
    }], __VLS_functionalComponentArgsRest(__VLS_297), false));
__VLS_asFunctionalDirective(__VLS_directives.vRipple, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_301 = __VLS_299.slots.default;
var __VLS_302;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_303 = __VLS_asFunctionalComponent1(__VLS_302, new __VLS_302({
    avatar: true,
}));
var __VLS_304 = __VLS_303.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_303), false));
var __VLS_307 = __VLS_305.slots.default;
var __VLS_308;
/** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
qAvatar;
// @ts-ignore
var __VLS_309 = __VLS_asFunctionalComponent1(__VLS_308, new __VLS_308({
    color: "green-1",
    textColor: "green",
    icon: "assignment_return",
}));
var __VLS_310 = __VLS_309.apply(void 0, __spreadArray([{
        color: "green-1",
        textColor: "green",
        icon: "assignment_return",
    }], __VLS_functionalComponentArgsRest(__VLS_309), false));
// @ts-ignore
[vRipple,];
var __VLS_305;
var __VLS_313;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_314 = __VLS_asFunctionalComponent1(__VLS_313, new __VLS_313({}));
var __VLS_315 = __VLS_314.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_314), false));
var __VLS_318 = __VLS_316.slots.default;
var __VLS_319;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_320 = __VLS_asFunctionalComponent1(__VLS_319, new __VLS_319({}));
var __VLS_321 = __VLS_320.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_320), false));
var __VLS_324 = __VLS_322.slots.default;
// @ts-ignore
[];
var __VLS_322;
var __VLS_325;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_326 = __VLS_asFunctionalComponent1(__VLS_325, new __VLS_325({
    caption: true,
}));
var __VLS_327 = __VLS_326.apply(void 0, __spreadArray([{
        caption: true,
    }], __VLS_functionalComponentArgsRest(__VLS_326), false));
var __VLS_330 = __VLS_328.slots.default;
// @ts-ignore
[];
var __VLS_328;
// @ts-ignore
[];
var __VLS_316;
var __VLS_331;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_332 = __VLS_asFunctionalComponent1(__VLS_331, new __VLS_331({
    side: true,
}));
var __VLS_333 = __VLS_332.apply(void 0, __spreadArray([{
        side: true,
    }], __VLS_functionalComponentArgsRest(__VLS_332), false));
var __VLS_336 = __VLS_334.slots.default;
var __VLS_337;
/** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
qBadge;
// @ts-ignore
var __VLS_338 = __VLS_asFunctionalComponent1(__VLS_337, new __VLS_337({
    color: "positive",
    rounded: true,
}));
var __VLS_339 = __VLS_338.apply(void 0, __spreadArray([{
        color: "positive",
        rounded: true,
    }], __VLS_functionalComponentArgsRest(__VLS_338), false));
var __VLS_342 = __VLS_340.slots.default;
(((_k = __VLS_ctx.pending) === null || _k === void 0 ? void 0 : _k.pending_recovery) || 0);
// @ts-ignore
[pending,];
var __VLS_340;
// @ts-ignore
[];
var __VLS_334;
// @ts-ignore
[];
var __VLS_299;
var __VLS_343;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_344 = __VLS_asFunctionalComponent1(__VLS_343, new __VLS_343({
    clickable: true,
    to: "/thread/allocations",
}));
var __VLS_345 = __VLS_344.apply(void 0, __spreadArray([{
        clickable: true,
        to: "/thread/allocations",
    }], __VLS_functionalComponentArgsRest(__VLS_344), false));
__VLS_asFunctionalDirective(__VLS_directives.vRipple, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_348 = __VLS_346.slots.default;
var __VLS_349;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_350 = __VLS_asFunctionalComponent1(__VLS_349, new __VLS_349({
    avatar: true,
}));
var __VLS_351 = __VLS_350.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_350), false));
var __VLS_354 = __VLS_352.slots.default;
var __VLS_355;
/** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
qAvatar;
// @ts-ignore
var __VLS_356 = __VLS_asFunctionalComponent1(__VLS_355, new __VLS_355({
    color: "orange-1",
    textColor: "orange",
    icon: "hourglass_empty",
}));
var __VLS_357 = __VLS_356.apply(void 0, __spreadArray([{
        color: "orange-1",
        textColor: "orange",
        icon: "hourglass_empty",
    }], __VLS_functionalComponentArgsRest(__VLS_356), false));
// @ts-ignore
[vRipple,];
var __VLS_352;
var __VLS_360;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_361 = __VLS_asFunctionalComponent1(__VLS_360, new __VLS_360({}));
var __VLS_362 = __VLS_361.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_361), false));
var __VLS_365 = __VLS_363.slots.default;
var __VLS_366;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_367 = __VLS_asFunctionalComponent1(__VLS_366, new __VLS_366({}));
var __VLS_368 = __VLS_367.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_367), false));
var __VLS_371 = __VLS_369.slots.default;
// @ts-ignore
[];
var __VLS_369;
var __VLS_372;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_373 = __VLS_asFunctionalComponent1(__VLS_372, new __VLS_372({
    caption: true,
}));
var __VLS_374 = __VLS_373.apply(void 0, __spreadArray([{
        caption: true,
    }], __VLS_functionalComponentArgsRest(__VLS_373), false));
var __VLS_377 = __VLS_375.slots.default;
// @ts-ignore
[];
var __VLS_375;
// @ts-ignore
[];
var __VLS_363;
var __VLS_378;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_379 = __VLS_asFunctionalComponent1(__VLS_378, new __VLS_378({
    side: true,
}));
var __VLS_380 = __VLS_379.apply(void 0, __spreadArray([{
        side: true,
    }], __VLS_functionalComponentArgsRest(__VLS_379), false));
var __VLS_383 = __VLS_381.slots.default;
var __VLS_384;
/** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
qBadge;
// @ts-ignore
var __VLS_385 = __VLS_asFunctionalComponent1(__VLS_384, new __VLS_384({
    color: "warning",
    rounded: true,
}));
var __VLS_386 = __VLS_385.apply(void 0, __spreadArray([{
        color: "warning",
        rounded: true,
    }], __VLS_functionalComponentArgsRest(__VLS_385), false));
var __VLS_389 = __VLS_387.slots.default;
(((_l = __VLS_ctx.pending) === null || _l === void 0 ? void 0 : _l.waitlisted_allocations) || 0);
// @ts-ignore
[pending,];
var __VLS_387;
// @ts-ignore
[];
var __VLS_381;
// @ts-ignore
[];
var __VLS_346;
var __VLS_390;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_391 = __VLS_asFunctionalComponent1(__VLS_390, new __VLS_390({
    clickable: true,
    to: "/thread/allocations",
}));
var __VLS_392 = __VLS_391.apply(void 0, __spreadArray([{
        clickable: true,
        to: "/thread/allocations",
    }], __VLS_functionalComponentArgsRest(__VLS_391), false));
__VLS_asFunctionalDirective(__VLS_directives.vRipple, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_395 = __VLS_393.slots.default;
var __VLS_396;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_397 = __VLS_asFunctionalComponent1(__VLS_396, new __VLS_396({
    avatar: true,
}));
var __VLS_398 = __VLS_397.apply(void 0, __spreadArray([{
        avatar: true,
    }], __VLS_functionalComponentArgsRest(__VLS_397), false));
var __VLS_401 = __VLS_399.slots.default;
var __VLS_402;
/** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
qAvatar;
// @ts-ignore
var __VLS_403 = __VLS_asFunctionalComponent1(__VLS_402, new __VLS_402({
    color: "red-1",
    textColor: "red",
    icon: "event_busy",
}));
var __VLS_404 = __VLS_403.apply(void 0, __spreadArray([{
        color: "red-1",
        textColor: "red",
        icon: "event_busy",
    }], __VLS_functionalComponentArgsRest(__VLS_403), false));
// @ts-ignore
[vRipple,];
var __VLS_399;
var __VLS_407;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_408 = __VLS_asFunctionalComponent1(__VLS_407, new __VLS_407({}));
var __VLS_409 = __VLS_408.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_408), false));
var __VLS_412 = __VLS_410.slots.default;
var __VLS_413;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_414 = __VLS_asFunctionalComponent1(__VLS_413, new __VLS_413({}));
var __VLS_415 = __VLS_414.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_414), false));
var __VLS_418 = __VLS_416.slots.default;
// @ts-ignore
[];
var __VLS_416;
var __VLS_419;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_420 = __VLS_asFunctionalComponent1(__VLS_419, new __VLS_419({
    caption: true,
}));
var __VLS_421 = __VLS_420.apply(void 0, __spreadArray([{
        caption: true,
    }], __VLS_functionalComponentArgsRest(__VLS_420), false));
var __VLS_424 = __VLS_422.slots.default;
// @ts-ignore
[];
var __VLS_422;
// @ts-ignore
[];
var __VLS_410;
var __VLS_425;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_426 = __VLS_asFunctionalComponent1(__VLS_425, new __VLS_425({
    side: true,
}));
var __VLS_427 = __VLS_426.apply(void 0, __spreadArray([{
        side: true,
    }], __VLS_functionalComponentArgsRest(__VLS_426), false));
var __VLS_430 = __VLS_428.slots.default;
var __VLS_431;
/** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
qBadge;
// @ts-ignore
var __VLS_432 = __VLS_asFunctionalComponent1(__VLS_431, new __VLS_431({
    color: "negative",
    rounded: true,
}));
var __VLS_433 = __VLS_432.apply(void 0, __spreadArray([{
        color: "negative",
        rounded: true,
    }], __VLS_functionalComponentArgsRest(__VLS_432), false));
var __VLS_436 = __VLS_434.slots.default;
(((_m = __VLS_ctx.pending) === null || _m === void 0 ? void 0 : _m.overdue_allocations) || 0);
// @ts-ignore
[pending,];
var __VLS_434;
// @ts-ignore
[];
var __VLS_428;
// @ts-ignore
[];
var __VLS_393;
// @ts-ignore
[];
var __VLS_246;
var __VLS_437;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_438 = __VLS_asFunctionalComponent1(__VLS_437, new __VLS_437({
    showing: (__VLS_ctx.isLoading && !__VLS_ctx.pending),
}));
var __VLS_439 = __VLS_438.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.isLoading && !__VLS_ctx.pending),
    }], __VLS_functionalComponentArgsRest(__VLS_438), false));
var __VLS_442 = __VLS_440.slots.default;
var __VLS_443;
/** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
qSpinnerDots;
// @ts-ignore
var __VLS_444 = __VLS_asFunctionalComponent1(__VLS_443, new __VLS_443({
    color: "primary",
}));
var __VLS_445 = __VLS_444.apply(void 0, __spreadArray([{
        color: "primary",
    }], __VLS_functionalComponentArgsRest(__VLS_444), false));
// @ts-ignore
[isLoading, pending,];
var __VLS_440;
// @ts-ignore
[];
var __VLS_224;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_448;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_449 = __VLS_asFunctionalComponent1(__VLS_448, new __VLS_448(__assign({ class: "full-height shadow-2" })));
var __VLS_450 = __VLS_449.apply(void 0, __spreadArray([__assign({ class: "full-height shadow-2" })], __VLS_functionalComponentArgsRest(__VLS_449), false));
/** @type {__VLS_StyleScopedClasses['full-height']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2']} */ ;
var __VLS_453 = __VLS_451.slots.default;
var __VLS_454;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_455 = __VLS_asFunctionalComponent1(__VLS_454, new __VLS_454({}));
var __VLS_456 = __VLS_455.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_455), false));
var __VLS_459 = __VLS_457.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 row items-center" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_460;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_461 = __VLS_asFunctionalComponent1(__VLS_460, new __VLS_460(__assign({ name: "bolt", color: "negative" }, { class: "q-mr-sm" })));
var __VLS_462 = __VLS_461.apply(void 0, __spreadArray([__assign({ name: "bolt", color: "negative" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_461), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
if (__VLS_ctx.conflicts.total_conflicts) {
    var __VLS_465 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_466 = __VLS_asFunctionalComponent1(__VLS_465, new __VLS_465({
        color: "negative",
    }));
    var __VLS_467 = __VLS_466.apply(void 0, __spreadArray([{
            color: "negative",
        }], __VLS_functionalComponentArgsRest(__VLS_466), false));
    var __VLS_470 = __VLS_468.slots.default;
    (__VLS_ctx.conflicts.total_conflicts);
    // @ts-ignore
    [conflicts, conflicts,];
    var __VLS_468;
}
// @ts-ignore
[];
var __VLS_457;
var __VLS_471;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_472 = __VLS_asFunctionalComponent1(__VLS_471, new __VLS_471({}));
var __VLS_473 = __VLS_472.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_472), false));
if (__VLS_ctx.conflicts.total_conflicts > 0) {
    var __VLS_476 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_477 = __VLS_asFunctionalComponent1(__VLS_476, new __VLS_476(__assign({ class: "q-pa-none" })));
    var __VLS_478 = __VLS_477.apply(void 0, __spreadArray([__assign({ class: "q-pa-none" })], __VLS_functionalComponentArgsRest(__VLS_477), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-none']} */ ;
    var __VLS_481 = __VLS_479.slots.default;
    var __VLS_482 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_483 = __VLS_asFunctionalComponent1(__VLS_482, new __VLS_482({
        separator: true,
    }));
    var __VLS_484 = __VLS_483.apply(void 0, __spreadArray([{
            separator: true,
        }], __VLS_functionalComponentArgsRest(__VLS_483), false));
    var __VLS_487 = __VLS_485.slots.default;
    for (var _q = 0, _r = __VLS_vFor((__VLS_ctx.conflicts.conflicts.slice(0, 5))); _q < _r.length; _q++) {
        var _s = _r[_q], conflict = _s[0], index = _s[1];
        var __VLS_488 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_489 = __VLS_asFunctionalComponent1(__VLS_488, new __VLS_488({
            key: (index),
        }));
        var __VLS_490 = __VLS_489.apply(void 0, __spreadArray([{
                key: (index),
            }], __VLS_functionalComponentArgsRest(__VLS_489), false));
        var __VLS_493 = __VLS_491.slots.default;
        var __VLS_494 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_495 = __VLS_asFunctionalComponent1(__VLS_494, new __VLS_494({}));
        var __VLS_496 = __VLS_495.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_495), false));
        var __VLS_499 = __VLS_497.slots.default;
        var __VLS_500 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_501 = __VLS_asFunctionalComponent1(__VLS_500, new __VLS_500(__assign({ class: "text-weight-medium" })));
        var __VLS_502 = __VLS_501.apply(void 0, __spreadArray([__assign({ class: "text-weight-medium" })], __VLS_functionalComponentArgsRest(__VLS_501), false));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        var __VLS_505 = __VLS_503.slots.default;
        (conflict.thread_type_code);
        // @ts-ignore
        [conflicts, conflicts,];
        var __VLS_503;
        var __VLS_506 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_507 = __VLS_asFunctionalComponent1(__VLS_506, new __VLS_506({
            caption: true,
        }));
        var __VLS_508 = __VLS_507.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_507), false));
        var __VLS_511 = __VLS_509.slots.default;
        (__VLS_ctx.formatNumber(conflict.missing_meters));
        (conflict.affected_orders);
        // @ts-ignore
        [formatNumber,];
        var __VLS_509;
        // @ts-ignore
        [];
        var __VLS_497;
        var __VLS_512 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_513 = __VLS_asFunctionalComponent1(__VLS_512, new __VLS_512({
            side: true,
        }));
        var __VLS_514 = __VLS_513.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_513), false));
        var __VLS_517 = __VLS_515.slots.default;
        var __VLS_518 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_519 = __VLS_asFunctionalComponent1(__VLS_518, new __VLS_518({
            flat: true,
            round: true,
            dense: true,
            icon: "chevron_right",
            to: "/thread/allocations",
        }));
        var __VLS_520 = __VLS_519.apply(void 0, __spreadArray([{
                flat: true,
                round: true,
                dense: true,
                icon: "chevron_right",
                to: "/thread/allocations",
            }], __VLS_functionalComponentArgsRest(__VLS_519), false));
        // @ts-ignore
        [];
        var __VLS_515;
        // @ts-ignore
        [];
        var __VLS_491;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_485;
    if (__VLS_ctx.conflicts.total_conflicts > 5) {
        var __VLS_523 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
        qCardActions;
        // @ts-ignore
        var __VLS_524 = __VLS_asFunctionalComponent1(__VLS_523, new __VLS_523({
            align: "center",
        }));
        var __VLS_525 = __VLS_524.apply(void 0, __spreadArray([{
                align: "center",
            }], __VLS_functionalComponentArgsRest(__VLS_524), false));
        var __VLS_528 = __VLS_526.slots.default;
        var __VLS_529 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_530 = __VLS_asFunctionalComponent1(__VLS_529, new __VLS_529({
            flat: true,
            color: "primary",
            label: "Xem tất cả xung đột",
            to: "/thread/allocations",
        }));
        var __VLS_531 = __VLS_530.apply(void 0, __spreadArray([{
                flat: true,
                color: "primary",
                label: "Xem tất cả xung đột",
                to: "/thread/allocations",
            }], __VLS_functionalComponentArgsRest(__VLS_530), false));
        // @ts-ignore
        [conflicts,];
        var __VLS_526;
    }
    // @ts-ignore
    [];
    var __VLS_479;
}
else if (!__VLS_ctx.isLoading) {
    var __VLS_534 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_535 = __VLS_asFunctionalComponent1(__VLS_534, new __VLS_534(__assign({ class: "text-center text-grey-6 q-pa-xl" })));
    var __VLS_536 = __VLS_535.apply(void 0, __spreadArray([__assign({ class: "text-center text-grey-6 q-pa-xl" })], __VLS_functionalComponentArgsRest(__VLS_535), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    var __VLS_539 = __VLS_537.slots.default;
    var __VLS_540 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_541 = __VLS_asFunctionalComponent1(__VLS_540, new __VLS_540(__assign({ name: "verified", size: "48px", color: "info" }, { class: "q-mb-sm opacity-50" })));
    var __VLS_542 = __VLS_541.apply(void 0, __spreadArray([__assign({ name: "verified", size: "48px", color: "info" }, { class: "q-mb-sm opacity-50" })], __VLS_functionalComponentArgsRest(__VLS_541), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    // @ts-ignore
    [isLoading,];
    var __VLS_537;
}
var __VLS_545;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_546 = __VLS_asFunctionalComponent1(__VLS_545, new __VLS_545({
    showing: (__VLS_ctx.isLoading && __VLS_ctx.conflicts.total_conflicts === 0),
}));
var __VLS_547 = __VLS_546.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.isLoading && __VLS_ctx.conflicts.total_conflicts === 0),
    }], __VLS_functionalComponentArgsRest(__VLS_546), false));
var __VLS_550 = __VLS_548.slots.default;
var __VLS_551;
/** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
qSpinnerDots;
// @ts-ignore
var __VLS_552 = __VLS_asFunctionalComponent1(__VLS_551, new __VLS_551({
    color: "negative",
}));
var __VLS_553 = __VLS_552.apply(void 0, __spreadArray([{
        color: "negative",
    }], __VLS_functionalComponentArgsRest(__VLS_552), false));
// @ts-ignore
[isLoading, conflicts,];
var __VLS_548;
// @ts-ignore
[];
var __VLS_451;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-lg" }));
/** @type {__VLS_StyleScopedClasses['q-mt-lg']} */ ;
var __VLS_556;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_557 = __VLS_asFunctionalComponent1(__VLS_556, new __VLS_556(__assign({ class: "shadow-2" })));
var __VLS_558 = __VLS_557.apply(void 0, __spreadArray([__assign({ class: "shadow-2" })], __VLS_functionalComponentArgsRest(__VLS_557), false));
/** @type {__VLS_StyleScopedClasses['shadow-2']} */ ;
var __VLS_561 = __VLS_559.slots.default;
var __VLS_562;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_563 = __VLS_asFunctionalComponent1(__VLS_562, new __VLS_562({}));
var __VLS_564 = __VLS_563.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_563), false));
var __VLS_567 = __VLS_565.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 row items-center" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_568;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_569 = __VLS_asFunctionalComponent1(__VLS_568, new __VLS_568(__assign({ name: "history", color: "grey-7" }, { class: "q-mr-sm" })));
var __VLS_570 = __VLS_569.apply(void 0, __spreadArray([__assign({ name: "history", color: "grey-7" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_569), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
// @ts-ignore
[];
var __VLS_565;
var __VLS_573;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_574 = __VLS_asFunctionalComponent1(__VLS_573, new __VLS_573({}));
var __VLS_575 = __VLS_574.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_574), false));
var __VLS_578;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_579 = __VLS_asFunctionalComponent1(__VLS_578, new __VLS_578({}));
var __VLS_580 = __VLS_579.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_579), false));
var __VLS_583 = __VLS_581.slots.default;
if (__VLS_ctx.activity.length) {
    var __VLS_584 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTimeline | typeof __VLS_components.QTimeline | typeof __VLS_components.qTimeline | typeof __VLS_components.QTimeline} */
    qTimeline;
    // @ts-ignore
    var __VLS_585 = __VLS_asFunctionalComponent1(__VLS_584, new __VLS_584({
        color: "primary",
    }));
    var __VLS_586 = __VLS_585.apply(void 0, __spreadArray([{
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_585), false));
    var __VLS_589 = __VLS_587.slots.default;
    for (var _t = 0, _u = __VLS_vFor((__VLS_ctx.activity)); _t < _u.length; _t++) {
        var item = _u[_t][0];
        var __VLS_590 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTimelineEntry | typeof __VLS_components.QTimelineEntry | typeof __VLS_components.qTimelineEntry | typeof __VLS_components.QTimelineEntry} */
        qTimelineEntry;
        // @ts-ignore
        var __VLS_591 = __VLS_asFunctionalComponent1(__VLS_590, new __VLS_590({
            key: (item.id),
            title: (item.description),
            subtitle: (__VLS_ctx.formatDate(item.timestamp)),
            icon: (__VLS_ctx.getActivityIcon(item.type)),
            color: (__VLS_ctx.getActivityColor(item.type)),
        }));
        var __VLS_592 = __VLS_591.apply(void 0, __spreadArray([{
                key: (item.id),
                title: (item.description),
                subtitle: (__VLS_ctx.formatDate(item.timestamp)),
                icon: (__VLS_ctx.getActivityIcon(item.type)),
                color: (__VLS_ctx.getActivityColor(item.type)),
            }], __VLS_functionalComponentArgsRest(__VLS_591), false));
        var __VLS_595 = __VLS_593.slots.default;
        if (item.metadata) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
            (__VLS_ctx.formatMetadata(item));
        }
        // @ts-ignore
        [activity, activity, formatDate, getActivityIcon, getActivityColor, formatMetadata,];
        var __VLS_593;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_587;
}
else if (!__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey-6 q-pa-lg" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
}
// @ts-ignore
[isLoading,];
var __VLS_581;
var __VLS_596;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_597 = __VLS_asFunctionalComponent1(__VLS_596, new __VLS_596({
    showing: (__VLS_ctx.isLoading && __VLS_ctx.activity.length === 0),
}));
var __VLS_598 = __VLS_597.apply(void 0, __spreadArray([{
        showing: (__VLS_ctx.isLoading && __VLS_ctx.activity.length === 0),
    }], __VLS_functionalComponentArgsRest(__VLS_597), false));
var __VLS_601 = __VLS_599.slots.default;
var __VLS_602;
/** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
qSpinnerDots;
// @ts-ignore
var __VLS_603 = __VLS_asFunctionalComponent1(__VLS_602, new __VLS_602({
    color: "primary",
}));
var __VLS_604 = __VLS_603.apply(void 0, __spreadArray([{
        color: "primary",
    }], __VLS_functionalComponentArgsRest(__VLS_603), false));
// @ts-ignore
[isLoading, activity,];
var __VLS_599;
// @ts-ignore
[];
var __VLS_559;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
