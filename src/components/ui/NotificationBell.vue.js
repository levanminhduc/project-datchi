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
var vue_router_1 = require("vue-router");
var useNotifications_1 = require("@/composables/useNotifications");
var router = (0, vue_router_1.useRouter)();
var _a = (0, useNotifications_1.useNotifications)(), notifications = _a.notifications, unreadCount = _a.unreadCount, isLoading = _a.isLoading, fetchNotifications = _a.fetchNotifications, markAsRead = _a.markAsRead, markAllAsRead = _a.markAllAsRead, deleteNotification = _a.deleteNotification;
var typeConfig = {
    STOCK_ALERT: { icon: 'warning', color: 'amber' },
    BATCH_RECEIVE: { icon: 'move_to_inbox', color: 'green' },
    BATCH_ISSUE: { icon: 'outbox', color: 'blue' },
    ALLOCATION: { icon: 'assignment', color: 'purple' },
    CONFLICT: { icon: 'error', color: 'red' },
    RECOVERY: { icon: 'restore', color: 'teal' },
    WEEKLY_ORDER: { icon: 'calendar_today', color: 'indigo' },
};
function getTypeIcon(type) {
    var _a, _b;
    return (_b = (_a = typeConfig[type]) === null || _a === void 0 ? void 0 : _a.icon) !== null && _b !== void 0 ? _b : 'notifications';
}
function getTypeColor(type) {
    var _a, _b;
    return (_b = (_a = typeConfig[type]) === null || _a === void 0 ? void 0 : _a.color) !== null && _b !== void 0 ? _b : 'grey';
}
function timeAgo(dateStr) {
    var seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60)
        return 'Vừa xong';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return "".concat(minutes, " ph\u00FAt tr\u01B0\u1EDBc");
    var hours = Math.floor(minutes / 60);
    if (hours < 24)
        return "".concat(hours, " gi\u1EDD tr\u01B0\u1EDBc");
    var days = Math.floor(hours / 24);
    if (days === 1)
        return 'Hôm qua';
    if (days < 30)
        return "".concat(days, " ng\u00E0y tr\u01B0\u1EDBc");
    return "".concat(Math.floor(days / 30), " th\u00E1ng tr\u01B0\u1EDBc");
}
function onMenuOpen() {
    fetchNotifications({ limit: 20 });
}
function handleClick(notification) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!notification.is_read) return [3 /*break*/, 2];
                    return [4 /*yield*/, markAsRead(notification.id)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (notification.action_url) {
                        router.push(notification.action_url);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function handleMarkAllAsRead() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, markAllAsRead()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleDelete(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, deleteNotification(id)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    flat: true,
    round: true,
    dense: true,
    icon: "notifications",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        flat: true,
        round: true,
        dense: true,
        icon: "notifications",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
if (__VLS_ctx.unreadCount > 0) {
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        color: "red",
        floating: true,
        rounded: true,
    }));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
            color: "red",
            floating: true,
            rounded: true,
        }], __VLS_functionalComponentArgsRest(__VLS_8), false));
    var __VLS_12 = __VLS_10.slots.default;
    (__VLS_ctx.unreadCount > 99 ? '99+' : __VLS_ctx.unreadCount);
    // @ts-ignore
    [unreadCount, unreadCount, unreadCount,];
    var __VLS_10;
}
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
qTooltip;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_14), false));
var __VLS_18 = __VLS_16.slots.default;
// @ts-ignore
[];
var __VLS_16;
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.qMenu | typeof __VLS_components.QMenu | typeof __VLS_components.qMenu | typeof __VLS_components.QMenu} */
qMenu;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign(__assign({ 'onBeforeShow': {} }, { anchor: "bottom right", self: "top right", offset: ([0, 8]) }), { style: {} })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign(__assign({ 'onBeforeShow': {} }, { anchor: "bottom right", self: "top right", offset: ([0, 8]) }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_20), false));
var __VLS_24;
var __VLS_25 = ({ beforeShow: {} },
    { onBeforeShow: (__VLS_ctx.onMenuOpen) });
var __VLS_26 = __VLS_22.slots.default;
var __VLS_27;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({}));
var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_28), false));
var __VLS_32 = __VLS_30.slots.default;
var __VLS_33;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({}));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_34), false));
var __VLS_38 = __VLS_36.slots.default;
var __VLS_39;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({}));
var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_40), false));
var __VLS_44 = __VLS_42.slots.default;
var __VLS_45;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45(__assign({ class: "text-weight-bold text-subtitle1" })));
var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([__assign({ class: "text-weight-bold text-subtitle1" })], __VLS_functionalComponentArgsRest(__VLS_46), false));
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
var __VLS_50 = __VLS_48.slots.default;
// @ts-ignore
[onMenuOpen,];
var __VLS_48;
// @ts-ignore
[];
var __VLS_42;
var __VLS_51;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
    side: true,
}));
var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([{
        side: true,
    }], __VLS_functionalComponentArgsRest(__VLS_52), false));
var __VLS_56 = __VLS_54.slots.default;
if (__VLS_ctx.unreadCount > 0) {
    var __VLS_57 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57(__assign({ 'onClick': {} }, { flat: true, dense: true, noCaps: true, color: "primary", label: "Đánh dấu tất cả đã đọc", size: "sm" })));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, noCaps: true, color: "primary", label: "Đánh dấu tất cả đã đọc", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_58), false));
    var __VLS_62 = void 0;
    var __VLS_63 = ({ click: {} },
        { onClick: (__VLS_ctx.handleMarkAllAsRead) });
    var __VLS_60;
    var __VLS_61;
}
// @ts-ignore
[unreadCount, handleMarkAllAsRead,];
var __VLS_54;
// @ts-ignore
[];
var __VLS_36;
var __VLS_64;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({}));
var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_65), false));
if (__VLS_ctx.isLoading && __VLS_ctx.notifications.length === 0) {
    var __VLS_69 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69(__assign({ class: "justify-center" })));
    var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([__assign({ class: "justify-center" })], __VLS_functionalComponentArgsRest(__VLS_70), false));
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    var __VLS_74 = __VLS_72.slots.default;
    var __VLS_75 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
    qSpinner;
    // @ts-ignore
    var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
        color: "primary",
        size: "2em",
    }));
    var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([{
            color: "primary",
            size: "2em",
        }], __VLS_functionalComponentArgsRest(__VLS_76), false));
    // @ts-ignore
    [isLoading, notifications,];
    var __VLS_72;
}
else if (__VLS_ctx.notifications.length > 0) {
    var _loop_1 = function (notification) {
        var __VLS_80 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80(__assign(__assign({ 'onClick': {} }, { key: (notification.id), clickable: true }), { class: ({ 'bg-blue-1': !notification.is_read }) })));
        var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { key: (notification.id), clickable: true }), { class: ({ 'bg-blue-1': !notification.is_read }) })], __VLS_functionalComponentArgsRest(__VLS_81), false));
        var __VLS_85 = void 0;
        var __VLS_86 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.isLoading && __VLS_ctx.notifications.length === 0))
                        return;
                    if (!(__VLS_ctx.notifications.length > 0))
                        return;
                    __VLS_ctx.handleClick(notification);
                    // @ts-ignore
                    [notifications, notifications, handleClick,];
                } });
        __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
        /** @type {__VLS_StyleScopedClasses['bg-blue-1']} */ ;
        var __VLS_87 = __VLS_83.slots.default;
        var __VLS_88 = void 0;
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
        var __VLS_94 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
            name: (__VLS_ctx.getTypeIcon(notification.type)),
            color: (__VLS_ctx.getTypeColor(notification.type)),
            size: "sm",
        }));
        var __VLS_96 = __VLS_95.apply(void 0, __spreadArray([{
                name: (__VLS_ctx.getTypeIcon(notification.type)),
                color: (__VLS_ctx.getTypeColor(notification.type)),
                size: "sm",
            }], __VLS_functionalComponentArgsRest(__VLS_95), false));
        // @ts-ignore
        [vClosePopup, getTypeIcon, getTypeColor,];
        var __VLS_99 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({}));
        var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_100), false));
        var __VLS_104 = __VLS_102.slots.default;
        var __VLS_105 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ class: ({ 'text-weight-bold': !notification.is_read }) })));
        var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ class: ({ 'text-weight-bold': !notification.is_read }) })], __VLS_functionalComponentArgsRest(__VLS_106), false));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        var __VLS_110 = __VLS_108.slots.default;
        (notification.title);
        // @ts-ignore
        [];
        if (notification.body) {
            var __VLS_111 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
            qItemLabel;
            // @ts-ignore
            var __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111({
                caption: true,
                lines: "2",
            }));
            var __VLS_113 = __VLS_112.apply(void 0, __spreadArray([{
                    caption: true,
                    lines: "2",
                }], __VLS_functionalComponentArgsRest(__VLS_112), false));
            var __VLS_116 = __VLS_114.slots.default;
            (notification.body);
            // @ts-ignore
            [];
        }
        var __VLS_117 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117(__assign({ caption: true }, { class: "text-grey-6" })));
        var __VLS_119 = __VLS_118.apply(void 0, __spreadArray([__assign({ caption: true }, { class: "text-grey-6" })], __VLS_functionalComponentArgsRest(__VLS_118), false));
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        var __VLS_122 = __VLS_120.slots.default;
        (__VLS_ctx.timeAgo(notification.created_at));
        // @ts-ignore
        [timeAgo,];
        // @ts-ignore
        [];
        var __VLS_123 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123({
            side: true,
        }));
        var __VLS_125 = __VLS_124.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_124), false));
        var __VLS_128 = __VLS_126.slots.default;
        var __VLS_129 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", size: "xs", color: "grey" })));
        var __VLS_131 = __VLS_130.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", size: "xs", color: "grey" })], __VLS_functionalComponentArgsRest(__VLS_130), false));
        var __VLS_134 = void 0;
        var __VLS_135 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.isLoading && __VLS_ctx.notifications.length === 0))
                        return;
                    if (!(__VLS_ctx.notifications.length > 0))
                        return;
                    __VLS_ctx.handleDelete(notification.id);
                    // @ts-ignore
                    [handleDelete,];
                } });
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_91, __VLS_108, __VLS_114, __VLS_120, __VLS_102, __VLS_132, __VLS_133, __VLS_126, __VLS_83, __VLS_84;
    for (var _i = 0, _b = __VLS_vFor((__VLS_ctx.notifications)); _i < _b.length; _i++) {
        var notification = _b[_i][0];
        _loop_1(notification);
    }
}
else {
    var __VLS_136 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136({}));
    var __VLS_138 = __VLS_137.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_137), false));
    var __VLS_141 = __VLS_139.slots.default;
    var __VLS_142 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_143 = __VLS_asFunctionalComponent1(__VLS_142, new __VLS_142(__assign({ class: "text-center text-grey-6 q-py-lg" })));
    var __VLS_144 = __VLS_143.apply(void 0, __spreadArray([__assign({ class: "text-center text-grey-6 q-py-lg" })], __VLS_functionalComponentArgsRest(__VLS_143), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-lg']} */ ;
    var __VLS_147 = __VLS_145.slots.default;
    // @ts-ignore
    [];
    var __VLS_145;
    // @ts-ignore
    [];
    var __VLS_139;
}
// @ts-ignore
[];
var __VLS_30;
// @ts-ignore
[];
var __VLS_22;
var __VLS_23;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
