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
// Composables
var _a = (0, useDashboard_1.useDashboard)(), pending = _a.pending, fetchPending = _a.fetchPending;
// Local state
var waitlistItems = (0, vue_1.ref)([]);
// Computed
var waitlistCount = (0, vue_1.computed)(function () { var _a; return ((_a = pending.value) === null || _a === void 0 ? void 0 : _a.waitlisted_allocations) || 0; });
// Methods
var getWaitTimeColor = function (days) {
    if (days >= 7)
        return 'negative';
    if (days >= 3)
        return 'warning';
    return 'info';
};
var formatWaitingTime = function (dateStr) {
    var date = new Date(dateStr);
    var now = new Date();
    var diffMs = now.getTime() - date.getTime();
    var diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    var diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1)
        return 'Vừa thêm';
    if (diffHours < 24)
        return "".concat(diffHours, " gi\u1EDD");
    if (diffDays === 1)
        return '1 ngày';
    return "".concat(diffDays, " ng\u00E0y");
};
var viewWaitlistItem = function (item) {
    router.push({
        path: '/thread/allocations',
        query: { waitlist_id: item.id.toString() },
    });
};
var generateMockWaitlist = function () {
    var count = waitlistCount.value;
    if (count === 0) {
        waitlistItems.value = [];
        return;
    }
    // Generate mock data (in real app, would come from API)
    var mockThreadTypes = ['Chỉ cotton đỏ', 'Chỉ polyester xanh', 'Chỉ nylon trắng', 'Chỉ lụa vàng', 'Chỉ len nâu'];
    waitlistItems.value = Array.from({ length: Math.min(count, 5) }, function (_, i) {
        var daysAgo = Math.floor(Math.random() * 10) + 1;
        var createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        return {
            id: i + 1,
            threadType: mockThreadTypes[i % mockThreadTypes.length],
            threadTypeId: i + 1,
            requestedQuantity: Math.floor(Math.random() * 500) + 100,
            createdAt: createdAt.toISOString(),
            waitingDays: daysAgo,
        };
    }).sort(function (a, b) { return b.waitingDays - a.waitingDays; });
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
                generateMockWaitlist();
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
    name: "hourglass_empty",
    color: "orange",
    size: "24px",
}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{
        name: "hourglass_empty",
        color: "orange",
        size: "24px",
    }], __VLS_functionalComponentArgsRest(__VLS_14), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
if (__VLS_ctx.waitlistCount > 0) {
    var __VLS_18 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        color: "orange",
        label: (__VLS_ctx.waitlistCount),
        rounded: true,
    }));
    var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{
            color: "orange",
            label: (__VLS_ctx.waitlistCount),
            rounded: true,
        }], __VLS_functionalComponentArgsRest(__VLS_19), false));
}
if (__VLS_ctx.waitlistCount === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-py-md" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-md']} */ ;
    var __VLS_23 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        name: "playlist_add_check",
        color: "positive",
        size: "48px",
    }));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
            name: "playlist_add_check",
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
    var _loop_1 = function (item) {
        var __VLS_34 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34(__assign({ 'onClick': {} }, { key: (item.id), clickable: true })));
        var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { key: (item.id), clickable: true })], __VLS_functionalComponentArgsRest(__VLS_35), false));
        var __VLS_39 = void 0;
        var __VLS_40 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.waitlistCount === 0))
                        return;
                    __VLS_ctx.viewWaitlistItem(item);
                    // @ts-ignore
                    [$attrs, waitlistCount, waitlistCount, waitlistCount, waitlistItems, viewWaitlistItem,];
                } });
        var __VLS_41 = __VLS_37.slots.default;
        var __VLS_42 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
            avatar: true,
        }));
        var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_43), false));
        var __VLS_47 = __VLS_45.slots.default;
        var __VLS_48 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
            color: (__VLS_ctx.getWaitTimeColor(item.waitingDays)),
            textColor: "white",
            size: "32px",
        }));
        var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.getWaitTimeColor(item.waitingDays)),
                textColor: "white",
                size: "32px",
            }], __VLS_functionalComponentArgsRest(__VLS_49), false));
        var __VLS_53 = __VLS_51.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-weight-bold" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        (item.waitingDays);
        // @ts-ignore
        [getWaitTimeColor,];
        // @ts-ignore
        [];
        var __VLS_54 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({}));
        var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_55), false));
        var __VLS_59 = __VLS_57.slots.default;
        var __VLS_60 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({}));
        var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_61), false));
        var __VLS_65 = __VLS_63.slots.default;
        (item.threadType);
        // @ts-ignore
        [];
        var __VLS_66 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
            caption: true,
        }));
        var __VLS_68 = __VLS_67.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_67), false));
        var __VLS_71 = __VLS_69.slots.default;
        (item.requestedQuantity);
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        var __VLS_72 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
            side: true,
        }));
        var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_73), false));
        var __VLS_77 = __VLS_75.slots.default;
        var __VLS_78 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78(__assign({ caption: true }, { class: "text-grey" })));
        var __VLS_80 = __VLS_79.apply(void 0, __spreadArray([__assign({ caption: true }, { class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_79), false));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        var __VLS_83 = __VLS_81.slots.default;
        (__VLS_ctx.formatWaitingTime(item.createdAt));
        // @ts-ignore
        [formatWaitingTime,];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_51, __VLS_45, __VLS_63, __VLS_69, __VLS_57, __VLS_81, __VLS_75, __VLS_37, __VLS_38;
    for (var _i = 0, _b = __VLS_vFor((__VLS_ctx.waitlistItems)); _i < _b.length; _i++) {
        var item = _b[_i][0];
        _loop_1(item);
    }
    // @ts-ignore
    [];
    var __VLS_31;
}
// @ts-ignore
[];
var __VLS_10;
if (__VLS_ctx.waitlistCount > 5) {
    var __VLS_84 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({}));
    var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_85), false));
    var __VLS_89 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
        align: "right",
    }));
    var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([{
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_90), false));
    var __VLS_94 = __VLS_92.slots.default;
    var __VLS_95 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_96 = __VLS_asFunctionalComponent1(__VLS_95, new __VLS_95(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Xem tất cả", iconRight: "arrow_forward" })));
    var __VLS_97 = __VLS_96.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", label: "Xem tất cả", iconRight: "arrow_forward" })], __VLS_functionalComponentArgsRest(__VLS_96), false));
    var __VLS_100 = void 0;
    var __VLS_101 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.waitlistCount > 5))
                    return;
                __VLS_ctx.$router.push('/thread/allocations?tab=waitlist');
                // @ts-ignore
                [waitlistCount, $router,];
            } });
    var __VLS_98;
    var __VLS_99;
    // @ts-ignore
    [];
    var __VLS_92;
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
