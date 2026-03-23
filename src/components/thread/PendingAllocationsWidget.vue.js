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
var useDashboard_1 = require("@/composables/thread/useDashboard");
var props = withDefaults(defineProps(), {
    autoFetch: true,
});
// Composables
var _a = (0, useDashboard_1.useDashboard)(), pending = _a.pending, fetchPending = _a.fetchPending;
// Local state for priority groups (simulated - would come from API)
var priorityGroups = (0, vue_1.ref)({
    high: 0,
    medium: 0,
    low: 0,
});
var oldestPendingDate = (0, vue_1.ref)(null);
// Computed
var totalPending = (0, vue_1.computed)(function () { var _a; return ((_a = pending.value) === null || _a === void 0 ? void 0 : _a.pending_allocations) || 0; });
// Methods
var formatDate = function (dateStr) {
    var date = new Date(dateStr);
    var now = new Date();
    var diffMs = now.getTime() - date.getTime();
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0)
        return 'Hôm nay';
    if (diffDays === 1)
        return 'Hôm qua';
    if (diffDays < 7)
        return "".concat(diffDays, " ng\u00E0y tr\u01B0\u1EDBc");
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
};
var simulatePriorityData = function () {
    var total = totalPending.value;
    if (total === 0) {
        priorityGroups.value = { high: 0, medium: 0, low: 0 };
        oldestPendingDate.value = null;
        return;
    }
    // Simulate distribution (in real app, this would come from API)
    priorityGroups.value = {
        high: Math.floor(total * 0.2),
        medium: Math.floor(total * 0.5),
        low: total - Math.floor(total * 0.2) - Math.floor(total * 0.5),
    };
    // Simulate oldest date (3 days ago)
    var oldestDate = new Date();
    oldestDate.setDate(oldestDate.getDate() - 3);
    oldestPendingDate.value = oldestDate.toISOString();
};
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!props.autoFetch) return [3 /*break*/, 2];
                return [4 /*yield*/, fetchPending()];
            case 1:
                _a.sent();
                simulatePriorityData();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
var __VLS_defaults = {
    autoFetch: true,
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['priority-row']} */ ;
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
    name: "pending_actions",
    color: "primary",
    size: "24px",
}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{
        name: "pending_actions",
        color: "primary",
        size: "24px",
    }], __VLS_functionalComponentArgsRest(__VLS_14), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
if (__VLS_ctx.totalPending > 0) {
    var __VLS_18 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        color: "primary",
        label: (__VLS_ctx.totalPending),
        rounded: true,
    }));
    var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{
            color: "primary",
            label: (__VLS_ctx.totalPending),
            rounded: true,
        }], __VLS_functionalComponentArgsRest(__VLS_19), false));
}
if (__VLS_ctx.totalPending === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-py-md" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-md']} */ ;
    var __VLS_23 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        name: "done_all",
        color: "positive",
        size: "48px",
    }));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
            name: "done_all",
            color: "positive",
            size: "48px",
        }], __VLS_functionalComponentArgsRest(__VLS_24), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['column']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    if (__VLS_ctx.priorityGroups.high > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "priority-row row items-center justify-between q-pa-sm rounded-borders bg-red-1" }));
        /** @type {__VLS_StyleScopedClasses['priority-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-red-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
        var __VLS_28 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
            name: "keyboard_double_arrow_up",
            color: "negative",
        }));
        var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([{
                name: "keyboard_double_arrow_up",
                color: "negative",
            }], __VLS_functionalComponentArgsRest(__VLS_29), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-body2" }));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_33 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
            color: "negative",
            label: (__VLS_ctx.priorityGroups.high),
        }));
        var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([{
                color: "negative",
                label: (__VLS_ctx.priorityGroups.high),
            }], __VLS_functionalComponentArgsRest(__VLS_34), false));
    }
    if (__VLS_ctx.priorityGroups.medium > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "priority-row row items-center justify-between q-pa-sm rounded-borders bg-orange-1" }));
        /** @type {__VLS_StyleScopedClasses['priority-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-orange-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
        var __VLS_38 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
            name: "remove",
            color: "warning",
        }));
        var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{
                name: "remove",
                color: "warning",
            }], __VLS_functionalComponentArgsRest(__VLS_39), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-body2" }));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_43 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
            color: "warning",
            label: (__VLS_ctx.priorityGroups.medium),
        }));
        var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{
                color: "warning",
                label: (__VLS_ctx.priorityGroups.medium),
            }], __VLS_functionalComponentArgsRest(__VLS_44), false));
    }
    if (__VLS_ctx.priorityGroups.low > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "priority-row row items-center justify-between q-pa-sm rounded-borders bg-blue-1" }));
        /** @type {__VLS_StyleScopedClasses['priority-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-blue-1']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
        var __VLS_48 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
            name: "keyboard_double_arrow_down",
            color: "info",
        }));
        var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([{
                name: "keyboard_double_arrow_down",
                color: "info",
            }], __VLS_functionalComponentArgsRest(__VLS_49), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-body2" }));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_53 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
            color: "info",
            label: (__VLS_ctx.priorityGroups.low),
        }));
        var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([{
                color: "info",
                label: (__VLS_ctx.priorityGroups.low),
            }], __VLS_functionalComponentArgsRest(__VLS_54), false));
    }
    if (__VLS_ctx.oldestPendingDate) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm" }));
        /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
        var __VLS_58 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
        qSeparator;
        // @ts-ignore
        var __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58(__assign({ class: "q-mb-sm" })));
        var __VLS_60 = __VLS_59.apply(void 0, __spreadArray([__assign({ class: "q-mb-sm" })], __VLS_functionalComponentArgsRest(__VLS_59), false));
        /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-xs text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        var __VLS_63 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
            name: "schedule",
            size: "16px",
        }));
        var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([{
                name: "schedule",
                size: "16px",
            }], __VLS_functionalComponentArgsRest(__VLS_64), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatDate(__VLS_ctx.oldestPendingDate));
    }
}
// @ts-ignore
[$attrs, totalPending, totalPending, totalPending, priorityGroups, priorityGroups, priorityGroups, priorityGroups, priorityGroups, priorityGroups, oldestPendingDate, oldestPendingDate, formatDate,];
var __VLS_10;
if (__VLS_ctx.totalPending > 0) {
    var __VLS_68 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({}));
    var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_69), false));
    var __VLS_73 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({
        align: "right",
    }));
    var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([{
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_74), false));
    var __VLS_78 = __VLS_76.slots.default;
    var __VLS_79 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Xử lý cấp phát", iconRight: "arrow_forward" })));
    var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Xử lý cấp phát", iconRight: "arrow_forward" })], __VLS_functionalComponentArgsRest(__VLS_80), false));
    var __VLS_84 = void 0;
    var __VLS_85 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.totalPending > 0))
                    return;
                __VLS_ctx.$router.push('/thread/allocations');
                // @ts-ignore
                [totalPending, $router,];
            } });
    var __VLS_82;
    var __VLS_83;
    // @ts-ignore
    [];
    var __VLS_76;
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
