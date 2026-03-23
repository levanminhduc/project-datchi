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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var weeklyOrderService_1 = require("@/services/weeklyOrderService");
var thread_format_1 = require("@/utils/thread-format");
var AppDialog_vue_1 = require("@/components/ui/dialogs/AppDialog.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var AppBadge_vue_1 = require("@/components/ui/cards/AppBadge.vue");
var ManualReturnDialog_vue_1 = require("./ManualReturnDialog.vue");
var props = defineProps();
var emit = defineEmits();
var loan = (0, vue_1.ref)((_a = props.initialLoan) !== null && _a !== void 0 ? _a : null);
var logs = (0, vue_1.ref)([]);
var loadingLoan = (0, vue_1.ref)(false);
var loadingLogs = (0, vue_1.ref)(false);
var loadError = (0, vue_1.ref)(false);
var logError = (0, vue_1.ref)(false);
var showManualReturn = (0, vue_1.ref)(false);
(0, vue_1.watch)(function () { return props.modelValue; }, function (open) {
    if (open)
        loadData();
}, { immediate: true });
function loadData() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    loadError.value = false;
                    logError.value = false;
                    return [4 /*yield*/, Promise.all([loadLoan(), loadLogs()])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function loadLoan() {
    return __awaiter(this, void 0, void 0, function () {
        var all, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (props.initialLoan) {
                        loan.value = props.initialLoan;
                        return [2 /*return*/];
                    }
                    loadingLoan.value = true;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getAllLoans()];
                case 2:
                    all = _c.sent();
                    loan.value = (_b = all.find(function (l) { return l.id === props.loanId; })) !== null && _b !== void 0 ? _b : null;
                    if (!loan.value)
                        loadError.value = true;
                    return [3 /*break*/, 5];
                case 3:
                    _a = _c.sent();
                    loadError.value = true;
                    return [3 /*break*/, 5];
                case 4:
                    loadingLoan.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function loadLogs() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    loadingLogs.value = true;
                    logError.value = false;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    _a = logs;
                    return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getReturnLogs(props.loanId)];
                case 2:
                    _a.value = _c.sent();
                    return [3 /*break*/, 5];
                case 3:
                    _b = _c.sent();
                    logError.value = true;
                    return [3 /*break*/, 5];
                case 4:
                    loadingLogs.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function onManualReturned() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    showManualReturn.value = false;
                    return [4 /*yield*/, loadData()];
                case 1:
                    _a.sent();
                    emit('returned');
                    return [2 /*return*/];
            }
        });
    });
}
function formatDateTime(iso) {
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = AppDialog_vue_1.default || AppDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), width: "600px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), width: "600px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$emit('update:modelValue', $event);
            // @ts-ignore
            [modelValue, $emit,];
        } });
var __VLS_7 = {};
var __VLS_8 = __VLS_3.slots.default;
{
    var __VLS_9 = __VLS_3.slots.header;
    // @ts-ignore
    [];
}
if (__VLS_ctx.loadingLoan) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-xl" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    var __VLS_10 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
    qSpinner;
    // @ts-ignore
    var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        size: "md",
        color: "primary",
    }));
    var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([{
            size: "md",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_11), false));
}
else if (__VLS_ctx.loadError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-xl" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    var __VLS_15 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        name: "error_outline",
        size: "48px",
        color: "negative",
    }));
    var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([{
            name: "error_outline",
            size: "48px",
            color: "negative",
        }], __VLS_functionalComponentArgsRest(__VLS_16), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-grey-7 q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    var __VLS_20 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20(__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Thử lại", icon: "refresh" }), { class: "q-mt-sm" })));
    var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Thử lại", icon: "refresh" }), { class: "q-mt-sm" })], __VLS_functionalComponentArgsRest(__VLS_21), false));
    var __VLS_25 = void 0;
    var __VLS_26 = ({ click: {} },
        { onClick: (__VLS_ctx.loadData) });
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    var __VLS_23;
    var __VLS_24;
}
else if (__VLS_ctx.loan) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bg-grey-1 rounded-borders q-pa-sm q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['bg-grey-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    ((_c = (_b = __VLS_ctx.loan.from_week) === null || _b === void 0 ? void 0 : _b.week_name) !== null && _c !== void 0 ? _c : 'Tồn kho');
    var __VLS_27 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27(__assign({ name: "arrow_forward", size: "xs" }, { class: "q-mx-xs text-grey-6" })));
    var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([__assign({ name: "arrow_forward", size: "xs" }, { class: "q-mx-xs text-grey-6" })], __VLS_functionalComponentArgsRest(__VLS_28), false));
    /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    ((_e = (_d = __VLS_ctx.loan.to_week) === null || _d === void 0 ? void 0 : _d.week_name) !== null && _e !== void 0 ? _e : '—');
    var __VLS_32 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
    qSpace;
    // @ts-ignore
    var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({}));
    var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_33), false));
    var __VLS_37 = AppBadge_vue_1.default;
    // @ts-ignore
    var __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
        label: (__VLS_ctx.loan.status === 'SETTLED' ? 'Đã hoàn tất' : 'Đang mượn'),
        color: (__VLS_ctx.loan.status === 'SETTLED' ? 'positive' : 'warning'),
    }));
    var __VLS_39 = __VLS_38.apply(void 0, __spreadArray([{
            label: (__VLS_ctx.loan.status === 'SETTLED' ? 'Đã hoàn tất' : 'Đang mượn'),
            color: (__VLS_ctx.loan.status === 'SETTLED' ? 'positive' : 'warning'),
        }], __VLS_functionalComponentArgsRest(__VLS_38), false));
    if (__VLS_ctx.loan.thread_type) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 q-mb-xs" }));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (__VLS_ctx.formatThreadTypeDisplay((_g = (_f = __VLS_ctx.loan.thread_type) === null || _f === void 0 ? void 0 : _f.supplier) === null || _g === void 0 ? void 0 : _g.name, (_h = __VLS_ctx.loan.thread_type) === null || _h === void 0 ? void 0 : _h.tex_number, (_k = (_j = __VLS_ctx.loan.thread_type) === null || _j === void 0 ? void 0 : _j.color) === null || _k === void 0 ? void 0 : _k.name, (_l = __VLS_ctx.loan.thread_type) === null || _l === void 0 ? void 0 : _l.name));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 row q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.loan.quantity_cones);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)(__assign({ class: "text-positive" }));
    /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
    (__VLS_ctx.loan.returned_cones);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)(__assign({ class: (__VLS_ctx.loan.status === 'SETTLED' ? 'text-grey' : 'text-warning') }));
    (__VLS_ctx.loan.quantity_cones - __VLS_ctx.loan.returned_cones);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-weight-medium q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    if (__VLS_ctx.loadingLogs) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-md" }));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        var __VLS_42 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
        qSpinner;
        // @ts-ignore
        var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
            size: "sm",
            color: "primary",
        }));
        var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{
                size: "sm",
                color: "primary",
            }], __VLS_functionalComponentArgsRest(__VLS_43), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-ml-sm text-grey text-body2" }));
        /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    }
    else if (__VLS_ctx.logError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-md" }));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        var __VLS_47 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
            name: "error_outline",
            size: "24px",
            color: "negative",
        }));
        var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([{
                name: "error_outline",
                size: "24px",
                color: "negative",
            }], __VLS_functionalComponentArgsRest(__VLS_48), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-grey-7 q-mt-xs" }));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
        var __VLS_52 = AppButton_vue_1.default;
        // @ts-ignore
        var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52(__assign(__assign({ 'onClick': {} }, { flat: true, size: "sm", color: "primary", label: "Thử lại", icon: "refresh" }), { class: "q-mt-xs" })));
        var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { flat: true, size: "sm", color: "primary", label: "Thử lại", icon: "refresh" }), { class: "q-mt-xs" })], __VLS_functionalComponentArgsRest(__VLS_53), false));
        var __VLS_57 = void 0;
        var __VLS_58 = ({ click: {} },
            { onClick: (__VLS_ctx.loadLogs) });
        /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
        var __VLS_55;
        var __VLS_56;
    }
    else if (__VLS_ctx.logs.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey q-pa-md text-body2" }));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    }
    else {
        var __VLS_59 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
        qList;
        // @ts-ignore
        var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59({
            dense: true,
            separator: true,
        }));
        var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([{
                dense: true,
                separator: true,
            }], __VLS_functionalComponentArgsRest(__VLS_60), false));
        var __VLS_64 = __VLS_62.slots.default;
        for (var _i = 0, _m = __VLS_vFor((__VLS_ctx.logs)); _i < _m.length; _i++) {
            var log = _m[_i][0];
            var __VLS_65 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
            qItem;
            // @ts-ignore
            var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65(__assign({ key: (log.id) }, { class: "q-px-xs" })));
            var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([__assign({ key: (log.id) }, { class: "q-px-xs" })], __VLS_functionalComponentArgsRest(__VLS_66), false));
            /** @type {__VLS_StyleScopedClasses['q-px-xs']} */ ;
            var __VLS_70 = __VLS_68.slots.default;
            var __VLS_71 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71({
                avatar: true,
            }));
            var __VLS_73 = __VLS_72.apply(void 0, __spreadArray([{
                    avatar: true,
                }], __VLS_functionalComponentArgsRest(__VLS_72), false));
            var __VLS_76 = __VLS_74.slots.default;
            var __VLS_77 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({
                name: (log.return_type === 'AUTO' ? 'smart_toy' : 'build'),
                color: (log.return_type === 'AUTO' ? 'info' : 'primary'),
                size: "xs",
            }));
            var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([{
                    name: (log.return_type === 'AUTO' ? 'smart_toy' : 'build'),
                    color: (log.return_type === 'AUTO' ? 'info' : 'primary'),
                    size: "xs",
                }], __VLS_functionalComponentArgsRest(__VLS_78), false));
            // @ts-ignore
            [loadingLoan, loadError, loadData, loan, loan, loan, loan, loan, loan, loan, loan, loan, loan, loan, loan, loan, loan, loan, thread_format_1.formatThreadTypeDisplay, loadingLogs, logError, loadLogs, logs, logs,];
            var __VLS_74;
            var __VLS_82 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({}));
            var __VLS_84 = __VLS_83.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_83), false));
            var __VLS_87 = __VLS_85.slots.default;
            var __VLS_88 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
            qItemLabel;
            // @ts-ignore
            var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88(__assign({ class: "text-body2" })));
            var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([__assign({ class: "text-body2" })], __VLS_functionalComponentArgsRest(__VLS_89), false));
            /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
            var __VLS_93 = __VLS_91.slots.default;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            (log.cones_returned);
            var __VLS_94 = AppBadge_vue_1.default;
            // @ts-ignore
            var __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94(__assign({ label: (log.return_type === 'AUTO' ? 'Tự động' : 'Thủ công'), color: (log.return_type === 'AUTO' ? 'info' : 'primary') }, { class: "q-ml-xs" })));
            var __VLS_96 = __VLS_95.apply(void 0, __spreadArray([__assign({ label: (log.return_type === 'AUTO' ? 'Tự động' : 'Thủ công'), color: (log.return_type === 'AUTO' ? 'info' : 'primary') }, { class: "q-ml-xs" })], __VLS_functionalComponentArgsRest(__VLS_95), false));
            /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
            // @ts-ignore
            [];
            var __VLS_91;
            var __VLS_99 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
            qItemLabel;
            // @ts-ignore
            var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99(__assign({ caption: true }, { class: "text-grey-7" })));
            var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([__assign({ caption: true }, { class: "text-grey-7" })], __VLS_functionalComponentArgsRest(__VLS_100), false));
            /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
            var __VLS_104 = __VLS_102.slots.default;
            (log.returned_by);
            (__VLS_ctx.formatDateTime(log.created_at));
            if (log.notes) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-ml-xs" }));
                /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
                (log.notes);
            }
            // @ts-ignore
            [formatDateTime,];
            var __VLS_102;
            // @ts-ignore
            [];
            var __VLS_85;
            // @ts-ignore
            [];
            var __VLS_68;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_62;
    }
    if (__VLS_ctx.loan.status === 'ACTIVE') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md text-right" }));
        /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        var __VLS_105 = AppButton_vue_1.default;
        // @ts-ignore
        var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ 'onClick': {} }, { color: "primary", icon: "undo", label: "Trả thủ công", size: "sm" })));
        var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "undo", label: "Trả thủ công", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
        var __VLS_110 = void 0;
        var __VLS_111 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.loadingLoan))
                        return;
                    if (!!(__VLS_ctx.loadError))
                        return;
                    if (!(__VLS_ctx.loan))
                        return;
                    if (!(__VLS_ctx.loan.status === 'ACTIVE'))
                        return;
                    __VLS_ctx.showManualReturn = true;
                    // @ts-ignore
                    [loan, showManualReturn,];
                } });
        var __VLS_108;
        var __VLS_109;
    }
}
if (__VLS_ctx.loan && __VLS_ctx.loan.status === 'ACTIVE') {
    var __VLS_112 = ManualReturnDialog_vue_1.default;
    // @ts-ignore
    var __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112(__assign({ 'onReturned': {} }, { modelValue: (__VLS_ctx.showManualReturn), loan: (__VLS_ctx.loan), weekId: (__VLS_ctx.loan.to_week_id) })));
    var __VLS_114 = __VLS_113.apply(void 0, __spreadArray([__assign({ 'onReturned': {} }, { modelValue: (__VLS_ctx.showManualReturn), loan: (__VLS_ctx.loan), weekId: (__VLS_ctx.loan.to_week_id) })], __VLS_functionalComponentArgsRest(__VLS_113), false));
    var __VLS_117 = void 0;
    var __VLS_118 = ({ returned: {} },
        { onReturned: (__VLS_ctx.onManualReturned) });
    var __VLS_115;
    var __VLS_116;
}
// @ts-ignore
[loan, loan, loan, loan, showManualReturn, onManualReturned,];
var __VLS_3;
var __VLS_4;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
