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
var vue_router_1 = require("vue-router");
var useDashboard_1 = require("@/composables/thread/useDashboard");
var router = (0, vue_router_1.useRouter)();
var props = withDefaults(defineProps(), {
    autoFetch: true,
});
var emit = defineEmits();
// Composables
var _a = (0, useDashboard_1.useDashboard)(), summary = _a.summary, isLoading = _a.isLoading, fetchSummary = _a.fetchSummary;
// Computed values
var totalMeters = (0, vue_1.computed)(function () { var _a; return ((_a = summary.value) === null || _a === void 0 ? void 0 : _a.total_meters) || 0; });
var totalCones = (0, vue_1.computed)(function () { var _a; return ((_a = summary.value) === null || _a === void 0 ? void 0 : _a.total_cones) || 0; });
var statusDistribution = (0, vue_1.computed)(function () {
    if (!summary.value) {
        return [
            { key: 'available', label: 'Có sẵn', meters: 0, percentage: 0, color: 'positive', colorClass: 'bg-positive' },
            { key: 'allocated', label: 'Đã cấp', meters: 0, percentage: 0, color: 'warning', colorClass: 'bg-warning' },
            { key: 'in_production', label: 'Đang sản xuất', meters: 0, percentage: 0, color: 'info', colorClass: 'bg-info' },
        ];
    }
    var total = summary.value.total_meters || 1;
    var available = summary.value.available_meters || 0;
    var allocated = summary.value.allocated_meters || 0;
    var inProduction = total - available - allocated;
    return [
        {
            key: 'available',
            label: 'Có sẵn',
            meters: available,
            percentage: Math.round((available / total) * 100),
            color: 'positive',
            colorClass: 'bg-positive',
        },
        {
            key: 'allocated',
            label: 'Đã cấp',
            meters: allocated,
            percentage: Math.round((allocated / total) * 100),
            color: 'warning',
            colorClass: 'bg-warning',
        },
        {
            key: 'in_production',
            label: 'Đang sản xuất',
            meters: inProduction > 0 ? inProduction : 0,
            percentage: Math.round((Math.max(0, inProduction) / total) * 100),
            color: 'info',
            colorClass: 'bg-info',
        },
    ];
});
// Methods
var formatNumber = function (num) {
    return new Intl.NumberFormat('vi-VN').format(num);
};
var refresh = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetchSummary()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var emitFilter = function (status) {
    emit('filter', status);
    router.push({ path: '/thread/inventory', query: { status: status } });
};
// Lifecycle
(0, vue_1.onMounted)(function () {
    if (props.autoFetch && !summary.value) {
        fetchSummary();
    }
});
var __VLS_defaults = {
    autoFetch: true,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['bar-segment']} */ ;
/** @type {__VLS_StyleScopedClasses['bar-segment']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "refresh", loading: (__VLS_ctx.isLoading) })));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "refresh", loading: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_14), false));
var __VLS_18;
var __VLS_19 = ({ click: {} },
    { onClick: (__VLS_ctx.refresh) });
var __VLS_20 = __VLS_16.slots.default;
var __VLS_21;
/** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
qTooltip;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({}));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_22), false));
var __VLS_26 = __VLS_24.slots.default;
// @ts-ignore
[$attrs, isLoading, refresh,];
var __VLS_24;
// @ts-ignore
[];
var __VLS_16;
var __VLS_17;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-weight-bold text-primary q-mb-sm" }));
/** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
(__VLS_ctx.formatNumber(__VLS_ctx.totalMeters));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-grey" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
(__VLS_ctx.formatNumber(__VLS_ctx.totalCones));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "distribution-bar q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['distribution-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
for (var _i = 0, _b = __VLS_vFor((__VLS_ctx.statusDistribution)); _i < _b.length; _i++) {
    var status_1 = _b[_i][0];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ key: (status_1.key) }, { class: (['bar-segment', status_1.colorClass]) }), { style: ({ width: status_1.percentage + '%' }) }));
    /** @type {__VLS_StyleScopedClasses['bar-segment']} */ ;
    var __VLS_27 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({}));
    var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_28), false));
    var __VLS_32 = __VLS_30.slots.default;
    (status_1.label);
    (status_1.percentage);
    // @ts-ignore
    [formatNumber, formatNumber, totalMeters, totalCones, statusDistribution,];
    var __VLS_30;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var _loop_1 = function (status_2) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign(__assign({ onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emitFilter(status_2.key);
            // @ts-ignore
            [statusDistribution, emitFilter,];
        } }, { key: (status_2.key) }), { class: "col-auto cursor-pointer" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap q-gutter-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    var __VLS_33 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ color: (status_2.color), rounded: true }, { class: "q-pa-xs" })));
    var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ color: (status_2.color), rounded: true }, { class: "q-pa-xs" })], __VLS_functionalComponentArgsRest(__VLS_34), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    (status_2.label);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-weight-bold" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (__VLS_ctx.formatNumber(status_2.meters));
    // @ts-ignore
    [formatNumber,];
};
for (var _c = 0, _d = __VLS_vFor((__VLS_ctx.statusDistribution)); _c < _d.length; _c++) {
    var status_2 = _d[_c][0];
    _loop_1(status_2);
}
// @ts-ignore
[];
var __VLS_10;
var __VLS_38;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({}));
var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_39), false));
var __VLS_43;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
    align: "right",
}));
var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{
        align: "right",
    }], __VLS_functionalComponentArgsRest(__VLS_44), false));
var __VLS_48 = __VLS_46.slots.default;
var __VLS_49;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Xem chi tiết", iconRight: "arrow_forward" })));
var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Xem chi tiết", iconRight: "arrow_forward" })], __VLS_functionalComponentArgsRest(__VLS_50), false));
var __VLS_54;
var __VLS_55 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$router.push('/thread/inventory');
            // @ts-ignore
            [$router,];
        } });
var __VLS_52;
var __VLS_53;
// @ts-ignore
[];
var __VLS_46;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
