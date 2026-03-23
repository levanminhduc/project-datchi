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
var date_fns_1 = require("date-fns");
var locale_1 = require("date-fns/locale");
var FormDialog_vue_1 = require("@/components/ui/dialogs/FormDialog.vue");
var offlineQueue_1 = require("@/stores/thread/offlineQueue");
var composables_1 = require("@/composables");
var visible = defineModel({ default: false });
var store = (0, offlineQueue_1.useOfflineQueueStore)();
var snackbar = (0, composables_1.useSnackbar)();
var _a = (0, composables_1.useLoading)(), isLoading = _a.isLoading, withLoading = _a.withLoading;
var conflicts = (0, vue_1.computed)(function () { return store.getConflicts(); });
function getOperationIcon(type) {
    var icons = {
        stock_receipt: 'inventory_2',
        issue: 'send',
        recovery: 'recycling',
        allocation: 'assignment'
    };
    return icons[type] || 'sync';
}
function getOperationColor(type) {
    var colors = {
        stock_receipt: 'primary',
        issue: 'secondary',
        recovery: 'accent',
        allocation: 'info'
    };
    return colors[type] || 'grey';
}
function getOperationLabel(type) {
    var labels = {
        stock_receipt: 'Nhập kho',
        issue: 'Xuất kho',
        recovery: 'Thu hồi',
        allocation: 'Phân bổ'
    };
    return labels[type] || type;
}
function formatDate(dateString) {
    return (0, date_fns_1.format)(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: locale_1.vi });
}
function handleRetry(id) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, store.resolveConflict(id, 'retry')];
                                case 1:
                                    _a.sent();
                                    snackbar.success('Đã thử lại thao tác');
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleDiscard(id) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, store.resolveConflict(id, 'discard')];
                                case 1:
                                    _a.sent();
                                    snackbar.info('Đã bỏ qua thao tác');
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleResolve() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Resolve all by retrying
                return [4 /*yield*/, withLoading(function () { return __awaiter(_this, void 0, void 0, function () {
                        var _i, _a, conflict;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _i = 0, _a = conflicts.value;
                                    _b.label = 1;
                                case 1:
                                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                                    conflict = _a[_i];
                                    return [4 /*yield*/, store.resolveConflict(conflict.id, 'retry')];
                                case 2:
                                    _b.sent();
                                    _b.label = 3;
                                case 3:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 4:
                                    snackbar.success('Đã giải quyết tất cả xung đột');
                                    visible.value = false;
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    // Resolve all by retrying
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var __VLS_defaultModels = {
    'modelValue': false,
};
var __VLS_modelEmit;
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = FormDialog_vue_1.default || FormDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.visible), title: "Xung đột đồng bộ", loading: (__VLS_ctx.isLoading), submitText: "Giải quyết" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.visible), title: "Xung đột đồng bộ", loading: (__VLS_ctx.isLoading), submitText: "Giải quyết" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleResolve) });
var __VLS_7 = ({ cancel: {} },
    { onCancel: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.visible = false;
            // @ts-ignore
            [visible, visible, isLoading, handleResolve,];
        } });
var __VLS_8 = {};
var __VLS_9 = __VLS_3.slots.default;
var __VLS_10;
/** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
qBanner;
// @ts-ignore
var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10(__assign({ class: "bg-warning text-white q-mb-md" }, { rounded: true })));
var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([__assign({ class: "bg-warning text-white q-mb-md" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_11), false));
/** @type {__VLS_StyleScopedClasses['bg-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_15 = __VLS_13.slots.default;
{
    var __VLS_16 = __VLS_13.slots.avatar;
    var __VLS_17 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        name: "warning",
    }));
    var __VLS_19 = __VLS_18.apply(void 0, __spreadArray([{
            name: "warning",
        }], __VLS_functionalComponentArgsRest(__VLS_18), false));
    // @ts-ignore
    [];
}
(__VLS_ctx.conflicts.length);
// @ts-ignore
[conflicts,];
var __VLS_13;
var __VLS_22;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
    separator: true,
}));
var __VLS_24 = __VLS_23.apply(void 0, __spreadArray([{
        separator: true,
    }], __VLS_functionalComponentArgsRest(__VLS_23), false));
var __VLS_27 = __VLS_25.slots.default;
var _loop_1 = function (conflict) {
    var __VLS_28 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign({ key: (conflict.id) }, { class: "q-pa-md" })));
    var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign({ key: (conflict.id) }, { class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_29), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    var __VLS_33 = __VLS_31.slots.default;
    var __VLS_34 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
        avatar: true,
    }));
    var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([{
            avatar: true,
        }], __VLS_functionalComponentArgsRest(__VLS_35), false));
    var __VLS_39 = __VLS_37.slots.default;
    var __VLS_40 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
        name: (__VLS_ctx.getOperationIcon(conflict.type)),
        color: (__VLS_ctx.getOperationColor(conflict.type)),
    }));
    var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([{
            name: (__VLS_ctx.getOperationIcon(conflict.type)),
            color: (__VLS_ctx.getOperationColor(conflict.type)),
        }], __VLS_functionalComponentArgsRest(__VLS_41), false));
    // @ts-ignore
    [conflicts, getOperationIcon, getOperationColor,];
    var __VLS_45 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({}));
    var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_46), false));
    var __VLS_50 = __VLS_48.slots.default;
    var __VLS_51 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({}));
    var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_52), false));
    var __VLS_56 = __VLS_54.slots.default;
    (__VLS_ctx.getOperationLabel(conflict.type));
    // @ts-ignore
    [getOperationLabel,];
    var __VLS_57 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
        caption: true,
    }));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_58), false));
    var __VLS_62 = __VLS_60.slots.default;
    (__VLS_ctx.formatDate(conflict.createdAt));
    // @ts-ignore
    [formatDate,];
    if (conflict.error) {
        var __VLS_63 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63(__assign({ caption: true }, { class: "text-negative" })));
        var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([__assign({ caption: true }, { class: "text-negative" })], __VLS_functionalComponentArgsRest(__VLS_64), false));
        /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
        var __VLS_68 = __VLS_66.slots.default;
        (conflict.error);
        // @ts-ignore
        [];
    }
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    var __VLS_75 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75(__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "refresh", color: "primary" })));
    var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "refresh", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_76), false));
    var __VLS_80 = void 0;
    var __VLS_81 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.handleRetry(conflict.id);
                // @ts-ignore
                [handleRetry,];
            } });
    var __VLS_82 = __VLS_78.slots.default;
    var __VLS_83 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({}));
    var __VLS_85 = __VLS_84.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_84), false));
    var __VLS_88 = __VLS_86.slots.default;
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    var __VLS_89 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89(__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "delete", color: "negative" })));
    var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "delete", color: "negative" })], __VLS_functionalComponentArgsRest(__VLS_90), false));
    var __VLS_94 = void 0;
    var __VLS_95 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.handleDiscard(conflict.id);
                // @ts-ignore
                [handleDiscard,];
            } });
    var __VLS_96 = __VLS_92.slots.default;
    var __VLS_97 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97({}));
    var __VLS_99 = __VLS_98.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_98), false));
    var __VLS_102 = __VLS_100.slots.default;
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
var __VLS_37, __VLS_54, __VLS_60, __VLS_66, __VLS_48, __VLS_86, __VLS_78, __VLS_79, __VLS_100, __VLS_92, __VLS_93, __VLS_72, __VLS_31;
for (var _i = 0, _b = __VLS_vFor((__VLS_ctx.conflicts)); _i < _b.length; _i++) {
    var conflict = _b[_i][0];
    _loop_1(conflict);
}
// @ts-ignore
[];
var __VLS_25;
if (__VLS_ctx.conflicts.length === 0) {
    var __VLS_103 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_104 = __VLS_asFunctionalComponent1(__VLS_103, new __VLS_103(__assign({ class: "bg-positive text-white" }, { rounded: true })));
    var __VLS_105 = __VLS_104.apply(void 0, __spreadArray([__assign({ class: "bg-positive text-white" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_104), false));
    /** @type {__VLS_StyleScopedClasses['bg-positive']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_108 = __VLS_106.slots.default;
    {
        var __VLS_109 = __VLS_106.slots.avatar;
        var __VLS_110 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
            name: "check_circle",
        }));
        var __VLS_112 = __VLS_111.apply(void 0, __spreadArray([{
                name: "check_circle",
            }], __VLS_functionalComponentArgsRest(__VLS_111), false));
        // @ts-ignore
        [conflicts,];
    }
    // @ts-ignore
    [];
    var __VLS_106;
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
