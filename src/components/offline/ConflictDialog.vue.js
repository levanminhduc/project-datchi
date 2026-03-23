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
var composables_1 = require("@/composables");
var props = defineProps();
var emit = defineEmits();
var store = (0, offlineQueue_1.useOfflineQueueStore)();
var snackbar = (0, composables_1.useSnackbar)();
var conflicts = (0, pinia_1.storeToRefs)(store).conflictOperations;
var isOpen = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); },
});
var OPERATION_LABELS = {
    stock_receipt: 'Nhập kho',
    issue: 'Xuất xưởng',
    recovery: 'Hoàn trả',
    allocation: 'Phân bổ',
};
var getOperationLabel = function (type) {
    return OPERATION_LABELS[type] || type;
};
var formatDate = function (dateStr) {
    var date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
var getDisplayPayload = function (payload) {
    var displayFields = {};
    var fieldLabels = {
        thread_type_id: 'Loại chỉ',
        warehouse_id: 'Kho',
        quantity_cones: 'Số cuộn',
        cone_id: 'Mã cuộn',
        weight_grams: 'Trọng lượng',
        allocation_id: 'Mã phân bổ',
    };
    for (var _i = 0, _a = Object.entries(payload); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (fieldLabels[key] && value !== null && value !== undefined) {
            displayFields[fieldLabels[key]] = String(value);
        }
    }
    return displayFields;
};
var handleResolve = function (id, resolution) { return __awaiter(void 0, void 0, void 0, function () {
    var messages, _err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, store.resolveConflict(id, resolution)];
            case 1:
                _a.sent();
                messages = {
                    retry: 'Đã thêm vào hàng đợi đồng bộ',
                    discard: 'Đã bỏ qua thao tác',
                    manual: 'Đã đánh dấu là đã xử lý',
                };
                snackbar.success(messages[resolution]);
                if (conflicts.value.length === 0) {
                    isOpen.value = false;
                }
                return [3 /*break*/, 3];
            case 2:
                _err_1 = _a.sent();
                snackbar.error('Không thể xử lý xung đột');
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var handleResolveAll = function (resolution) { return __awaiter(void 0, void 0, void 0, function () {
    var ops, _i, ops_1, op, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ops = __spreadArray([], conflicts.value, true);
                _i = 0, ops_1 = ops;
                _a.label = 1;
            case 1:
                if (!(_i < ops_1.length)) return [3 /*break*/, 4];
                op = ops_1[_i];
                return [4 /*yield*/, store.resolveConflict(op.id, resolution)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                message = resolution === 'retry'
                    ? 'Đã thêm tất cả vào hàng đợi đồng bộ'
                    : 'Đã bỏ qua tất cả thao tác';
                snackbar.success(message);
                isOpen.value = false;
                return [2 /*return*/];
        }
    });
}); };
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.isOpen),
    persistent: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.isOpen),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ style: {} })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13(__assign({ class: "row items-center q-pb-none" })));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_14), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_18 = __VLS_16.slots.default;
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ name: "error", color: "negative", size: "24px" }, { class: "q-mr-sm" })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ name: "error", color: "negative", size: "24px" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_20), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
var __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_25), false));
var __VLS_29;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
    flat: true,
    round: true,
    dense: true,
    icon: "close",
}));
var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{
        flat: true,
        round: true,
        dense: true,
        icon: "close",
    }], __VLS_functionalComponentArgsRest(__VLS_30), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[isOpen, vClosePopup,];
var __VLS_16;
var __VLS_34;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34(__assign({ class: "text-body2 text-grey-7" })));
var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([__assign({ class: "text-body2 text-grey-7" })], __VLS_functionalComponentArgsRest(__VLS_35), false));
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
var __VLS_39 = __VLS_37.slots.default;
// @ts-ignore
[];
var __VLS_37;
var __VLS_40;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({}));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_41), false));
var __VLS_45;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45(__assign({ class: "q-pa-none" }, { style: {} })));
var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([__assign({ class: "q-pa-none" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_46), false));
/** @type {__VLS_StyleScopedClasses['q-pa-none']} */ ;
var __VLS_50 = __VLS_48.slots.default;
var __VLS_51;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
    separator: true,
}));
var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([{
        separator: true,
    }], __VLS_functionalComponentArgsRest(__VLS_52), false));
var __VLS_56 = __VLS_54.slots.default;
var _loop_1 = function (op) {
    var __VLS_57 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57(__assign({ key: (op.id) }, { class: "q-py-md" })));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([__assign({ key: (op.id) }, { class: "q-py-md" })], __VLS_functionalComponentArgsRest(__VLS_58), false));
    /** @type {__VLS_StyleScopedClasses['q-py-md']} */ ;
    var __VLS_62 = __VLS_60.slots.default;
    var __VLS_63 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({}));
    var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_64), false));
    var __VLS_68 = __VLS_66.slots.default;
    var __VLS_69 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69(__assign({ class: "text-weight-medium" })));
    var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([__assign({ class: "text-weight-medium" })], __VLS_functionalComponentArgsRest(__VLS_70), false));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    var __VLS_74 = __VLS_72.slots.default;
    (__VLS_ctx.getOperationLabel(op.type));
    // @ts-ignore
    [conflicts, getOperationLabel,];
    var __VLS_75 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
        caption: true,
    }));
    var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_76), false));
    var __VLS_80 = __VLS_78.slots.default;
    (__VLS_ctx.formatDate(op.createdAt));
    // @ts-ignore
    [formatDate,];
    var __VLS_81 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_82 = __VLS_asFunctionalComponent1(__VLS_81, new __VLS_81(__assign({ caption: true }, { class: "text-negative" })));
    var __VLS_83 = __VLS_82.apply(void 0, __spreadArray([__assign({ caption: true }, { class: "text-negative" })], __VLS_functionalComponentArgsRest(__VLS_82), false));
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    var __VLS_86 = __VLS_84.slots.default;
    (op.error);
    // @ts-ignore
    [];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    for (var _b = 0, _c = __VLS_vFor((__VLS_ctx.getDisplayPayload(op.payload))); _b < _c.length; _b++) {
        var _d = _c[_b], value = _d[0], key = _d[1];
        var __VLS_87 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
        qChip;
        // @ts-ignore
        var __VLS_88 = __VLS_asFunctionalComponent1(__VLS_87, new __VLS_87({
            key: (key),
            dense: true,
            size: "sm",
            color: "grey-3",
            textColor: "grey-8",
        }));
        var __VLS_89 = __VLS_88.apply(void 0, __spreadArray([{
                key: (key),
                dense: true,
                size: "sm",
                color: "grey-3",
                textColor: "grey-8",
            }], __VLS_functionalComponentArgsRest(__VLS_88), false));
        var __VLS_92 = __VLS_90.slots.default;
        (key);
        (value);
        // @ts-ignore
        [getDisplayPayload,];
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_93 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93({
        side: true,
    }));
    var __VLS_95 = __VLS_94.apply(void 0, __spreadArray([{
            side: true,
        }], __VLS_functionalComponentArgsRest(__VLS_94), false));
    var __VLS_98 = __VLS_96.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column q-gutter-xs" }));
    /** @type {__VLS_StyleScopedClasses['column']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    var __VLS_99 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", icon: "refresh", label: "Thử lại" })));
    var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "primary", icon: "refresh", label: "Thử lại" })], __VLS_functionalComponentArgsRest(__VLS_100), false));
    var __VLS_104 = void 0;
    var __VLS_105 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.handleResolve(op.id, 'retry');
                // @ts-ignore
                [handleResolve,];
            } });
    var __VLS_106 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "grey", icon: "check", label: "Đã xử lý" })));
    var __VLS_108 = __VLS_107.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "grey", icon: "check", label: "Đã xử lý" })], __VLS_functionalComponentArgsRest(__VLS_107), false));
    var __VLS_111 = void 0;
    var __VLS_112 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.handleResolve(op.id, 'manual');
                // @ts-ignore
                [handleResolve,];
            } });
    var __VLS_113 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_114 = __VLS_asFunctionalComponent1(__VLS_113, new __VLS_113(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "negative", icon: "delete", label: "Bỏ qua" })));
    var __VLS_115 = __VLS_114.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "negative", icon: "delete", label: "Bỏ qua" })], __VLS_functionalComponentArgsRest(__VLS_114), false));
    var __VLS_118 = void 0;
    var __VLS_119 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.handleResolve(op.id, 'discard');
                // @ts-ignore
                [handleResolve,];
            } });
    // @ts-ignore
    [];
    // @ts-ignore
    [];
    // @ts-ignore
    [];
};
var __VLS_72, __VLS_78, __VLS_84, __VLS_90, __VLS_66, __VLS_102, __VLS_103, __VLS_109, __VLS_110, __VLS_116, __VLS_117, __VLS_96, __VLS_60;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.conflicts)); _i < _a.length; _i++) {
    var op = _a[_i][0];
    _loop_1(op);
}
if (__VLS_ctx.conflicts.length === 0) {
    var __VLS_120 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_121 = __VLS_asFunctionalComponent1(__VLS_120, new __VLS_120({}));
    var __VLS_122 = __VLS_121.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_121), false));
    var __VLS_125 = __VLS_123.slots.default;
    var __VLS_126 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126(__assign({ class: "text-center text-grey-6 q-pa-lg" })));
    var __VLS_128 = __VLS_127.apply(void 0, __spreadArray([__assign({ class: "text-center text-grey-6 q-pa-lg" })], __VLS_functionalComponentArgsRest(__VLS_127), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
    var __VLS_131 = __VLS_129.slots.default;
    var __VLS_132 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132(__assign({ name: "check_circle", size: "48px", color: "positive" }, { class: "q-mb-sm" })));
    var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([__assign({ name: "check_circle", size: "48px", color: "positive" }, { class: "q-mb-sm" })], __VLS_functionalComponentArgsRest(__VLS_133), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    // @ts-ignore
    [conflicts,];
    var __VLS_129;
    // @ts-ignore
    [];
    var __VLS_123;
}
// @ts-ignore
[];
var __VLS_54;
// @ts-ignore
[];
var __VLS_48;
if (__VLS_ctx.conflicts.length > 1) {
    var __VLS_137 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137({}));
    var __VLS_139 = __VLS_138.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_138), false));
}
if (__VLS_ctx.conflicts.length > 1) {
    var __VLS_142 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_143 = __VLS_asFunctionalComponent1(__VLS_142, new __VLS_142({
        align: "right",
    }));
    var __VLS_144 = __VLS_143.apply(void 0, __spreadArray([{
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_143), false));
    var __VLS_147 = __VLS_145.slots.default;
    var __VLS_148 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_149 = __VLS_asFunctionalComponent1(__VLS_148, new __VLS_148(__assign({ 'onClick': {} }, { flat: true, color: "negative", label: "Bỏ qua tất cả", icon: "delete_sweep" })));
    var __VLS_150 = __VLS_149.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, color: "negative", label: "Bỏ qua tất cả", icon: "delete_sweep" })], __VLS_functionalComponentArgsRest(__VLS_149), false));
    var __VLS_153 = void 0;
    var __VLS_154 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.conflicts.length > 1))
                    return;
                __VLS_ctx.handleResolveAll('discard');
                // @ts-ignore
                [conflicts, conflicts, handleResolveAll,];
            } });
    var __VLS_151;
    var __VLS_152;
    var __VLS_155 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_156 = __VLS_asFunctionalComponent1(__VLS_155, new __VLS_155(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Thử lại tất cả", icon: "refresh" })));
    var __VLS_157 = __VLS_156.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Thử lại tất cả", icon: "refresh" })], __VLS_functionalComponentArgsRest(__VLS_156), false));
    var __VLS_160 = void 0;
    var __VLS_161 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.conflicts.length > 1))
                    return;
                __VLS_ctx.handleResolveAll('retry');
                // @ts-ignore
                [handleResolveAll,];
            } });
    var __VLS_158;
    var __VLS_159;
    // @ts-ignore
    [];
    var __VLS_145;
}
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
