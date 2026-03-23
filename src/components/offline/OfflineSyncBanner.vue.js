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
var offlineQueue_1 = require("@/stores/thread/offlineQueue");
var pinia_1 = require("pinia");
var __VLS_emit = defineEmits();
var store = (0, offlineQueue_1.useOfflineQueueStore)();
var _a = (0, pinia_1.storeToRefs)(store), isOnline = _a.isOnline, isSyncing = _a.isSyncing, pendingCount = _a.pendingCount, failedCount = _a.failedCount, conflictCount = _a.conflictCount;
var handleSync = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, store.sync()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var handleRetryAll = function () { return __awaiter(void 0, void 0, void 0, function () {
    var failed, _i, failed_1, op;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                failed = store.failedOperations;
                _i = 0, failed_1 = failed;
                _a.label = 1;
            case 1:
                if (!(_i < failed_1.length)) return [3 /*break*/, 4];
                op = failed_1[_i];
                return [4 /*yield*/, store.retryFailed(op.id)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); };
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, store.initialize()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, vue_1.onUnmounted)(function () {
    store.cleanup();
});
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "offline-sync-banner" }));
/** @type {__VLS_StyleScopedClasses['offline-sync-banner']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
transition;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    name: "slide-down",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        name: "slide-down",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = __VLS_3.slots.default;
if (!__VLS_ctx.isOnline) {
    var __VLS_6 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6(__assign({ class: "offline-banner bg-warning text-dark" }, { dense: true, rounded: true })));
    var __VLS_8 = __VLS_7.apply(void 0, __spreadArray([__assign({ class: "offline-banner bg-warning text-dark" }, { dense: true, rounded: true })], __VLS_functionalComponentArgsRest(__VLS_7), false));
    /** @type {__VLS_StyleScopedClasses['offline-banner']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-warning']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-dark']} */ ;
    var __VLS_11 = __VLS_9.slots.default;
    {
        var __VLS_12 = __VLS_9.slots.avatar;
        var __VLS_13 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
            name: "wifi_off",
            color: "dark",
        }));
        var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{
                name: "wifi_off",
                color: "dark",
            }], __VLS_functionalComponentArgsRest(__VLS_14), false));
        // @ts-ignore
        [isOnline,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    if (__VLS_ctx.pendingCount > 0) {
        var __VLS_18 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18(__assign({ color: "dark" }, { class: "q-ml-sm" })));
        var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([__assign({ color: "dark" }, { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_19), false));
        /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
        var __VLS_23 = __VLS_21.slots.default;
        (__VLS_ctx.pendingCount);
        // @ts-ignore
        [pendingCount, pendingCount,];
        var __VLS_21;
    }
    // @ts-ignore
    [];
    var __VLS_9;
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
transition;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    name: "slide-down",
}));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{
        name: "slide-down",
    }], __VLS_functionalComponentArgsRest(__VLS_25), false));
var __VLS_29 = __VLS_27.slots.default;
if (__VLS_ctx.isOnline && __VLS_ctx.isSyncing) {
    var __VLS_30 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30(__assign({ class: "syncing-banner bg-info text-white" }, { dense: true, rounded: true })));
    var __VLS_32 = __VLS_31.apply(void 0, __spreadArray([__assign({ class: "syncing-banner bg-info text-white" }, { dense: true, rounded: true })], __VLS_functionalComponentArgsRest(__VLS_31), false));
    /** @type {__VLS_StyleScopedClasses['syncing-banner']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-info']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_35 = __VLS_33.slots.default;
    {
        var __VLS_36 = __VLS_33.slots.avatar;
        var __VLS_37 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
        qSpinnerDots;
        // @ts-ignore
        var __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
            color: "white",
            size: "24px",
        }));
        var __VLS_39 = __VLS_38.apply(void 0, __spreadArray([{
                color: "white",
                size: "24px",
            }], __VLS_functionalComponentArgsRest(__VLS_38), false));
        // @ts-ignore
        [isOnline, isSyncing,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    // @ts-ignore
    [];
    var __VLS_33;
}
// @ts-ignore
[];
var __VLS_27;
var __VLS_42;
/** @ts-ignore @type {typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
transition;
// @ts-ignore
var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
    name: "slide-down",
}));
var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{
        name: "slide-down",
    }], __VLS_functionalComponentArgsRest(__VLS_43), false));
var __VLS_47 = __VLS_45.slots.default;
if (__VLS_ctx.isOnline && !__VLS_ctx.isSyncing && __VLS_ctx.pendingCount > 0) {
    var __VLS_48 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48(__assign({ class: "pending-banner bg-blue-1 text-primary" }, { dense: true, rounded: true })));
    var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([__assign({ class: "pending-banner bg-blue-1 text-primary" }, { dense: true, rounded: true })], __VLS_functionalComponentArgsRest(__VLS_49), false));
    /** @type {__VLS_StyleScopedClasses['pending-banner']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-blue-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    var __VLS_53 = __VLS_51.slots.default;
    {
        var __VLS_54 = __VLS_51.slots.avatar;
        var __VLS_55 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
            name: "cloud_upload",
            color: "primary",
        }));
        var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([{
                name: "cloud_upload",
                color: "primary",
            }], __VLS_functionalComponentArgsRest(__VLS_56), false));
        // @ts-ignore
        [isOnline, pendingCount, isSyncing,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.pendingCount);
    var __VLS_60 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Đồng bộ", icon: "sync", loading: (__VLS_ctx.isSyncing) })));
    var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Đồng bộ", icon: "sync", loading: (__VLS_ctx.isSyncing) })], __VLS_functionalComponentArgsRest(__VLS_61), false));
    var __VLS_65 = void 0;
    var __VLS_66 = ({ click: {} },
        { onClick: (__VLS_ctx.handleSync) });
    var __VLS_63;
    var __VLS_64;
    // @ts-ignore
    [pendingCount, isSyncing, handleSync,];
    var __VLS_51;
}
// @ts-ignore
[];
var __VLS_45;
var __VLS_67;
/** @ts-ignore @type {typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
transition;
// @ts-ignore
var __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({
    name: "slide-down",
}));
var __VLS_69 = __VLS_68.apply(void 0, __spreadArray([{
        name: "slide-down",
    }], __VLS_functionalComponentArgsRest(__VLS_68), false));
var __VLS_72 = __VLS_70.slots.default;
if (__VLS_ctx.conflictCount > 0) {
    var __VLS_73 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73(__assign({ class: "conflict-banner bg-negative text-white q-mt-xs" }, { dense: true, rounded: true })));
    var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([__assign({ class: "conflict-banner bg-negative text-white q-mt-xs" }, { dense: true, rounded: true })], __VLS_functionalComponentArgsRest(__VLS_74), false));
    /** @type {__VLS_StyleScopedClasses['conflict-banner']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    var __VLS_78 = __VLS_76.slots.default;
    {
        var __VLS_79 = __VLS_76.slots.avatar;
        var __VLS_80 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
            name: "error",
            color: "white",
        }));
        var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([{
                name: "error",
                color: "white",
            }], __VLS_functionalComponentArgsRest(__VLS_81), false));
        // @ts-ignore
        [conflictCount,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.conflictCount);
    var __VLS_85 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "white", label: "Xem", icon: "visibility" })));
    var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "white", label: "Xem", icon: "visibility" })], __VLS_functionalComponentArgsRest(__VLS_86), false));
    var __VLS_90 = void 0;
    var __VLS_91 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.conflictCount > 0))
                    return;
                __VLS_ctx.$emit('show-conflicts');
                // @ts-ignore
                [conflictCount, $emit,];
            } });
    var __VLS_88;
    var __VLS_89;
    // @ts-ignore
    [];
    var __VLS_76;
}
// @ts-ignore
[];
var __VLS_70;
var __VLS_92;
/** @ts-ignore @type {typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
transition;
// @ts-ignore
var __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
    name: "slide-down",
}));
var __VLS_94 = __VLS_93.apply(void 0, __spreadArray([{
        name: "slide-down",
    }], __VLS_functionalComponentArgsRest(__VLS_93), false));
var __VLS_97 = __VLS_95.slots.default;
if (__VLS_ctx.failedCount > 0 && __VLS_ctx.conflictCount === 0) {
    var __VLS_98 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98(__assign({ class: "failed-banner bg-orange text-white q-mt-xs" }, { dense: true, rounded: true })));
    var __VLS_100 = __VLS_99.apply(void 0, __spreadArray([__assign({ class: "failed-banner bg-orange text-white q-mt-xs" }, { dense: true, rounded: true })], __VLS_functionalComponentArgsRest(__VLS_99), false));
    /** @type {__VLS_StyleScopedClasses['failed-banner']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-orange']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    var __VLS_103 = __VLS_101.slots.default;
    {
        var __VLS_104 = __VLS_101.slots.avatar;
        var __VLS_105 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105({
            name: "warning",
            color: "white",
        }));
        var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([{
                name: "warning",
                color: "white",
            }], __VLS_functionalComponentArgsRest(__VLS_106), false));
        // @ts-ignore
        [conflictCount, failedCount,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.failedCount);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    var __VLS_110 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "white", label: "Thử lại", icon: "refresh" })));
    var __VLS_112 = __VLS_111.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "white", label: "Thử lại", icon: "refresh" })], __VLS_functionalComponentArgsRest(__VLS_111), false));
    var __VLS_115 = void 0;
    var __VLS_116 = ({ click: {} },
        { onClick: (__VLS_ctx.handleRetryAll) });
    var __VLS_113;
    var __VLS_114;
    // @ts-ignore
    [failedCount, handleRetryAll,];
    var __VLS_101;
}
// @ts-ignore
[];
var __VLS_95;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
});
exports.default = {};
