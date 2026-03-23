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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var useReconciliation_1 = require("@/composables/thread/useReconciliation");
var purchaseOrderService_1 = require("@/services/purchaseOrderService");
var styleService_1 = require("@/services/styleService");
var ReconciliationTable_vue_1 = require("@/components/thread/ReconciliationTable.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var _f = (0, useReconciliation_1.useReconciliation)(), rows = _f.rows, summary = _f.summary, isLoading = _f.isLoading, filters = _f.filters, hasData = _f.hasData, fetchReport = _f.fetchReport, exportExcel = _f.exportExcel, updateFilters = _f.updateFilters, clearFilters = _f.clearFilters;
// Filter options
var poOptions = (0, vue_1.ref)([{ value: '', label: 'Tất cả' }]);
var styleOptions = (0, vue_1.ref)([{ value: '', label: 'Tất cả' }]);
// Load filter options
function loadFilterOptions() {
    return __awaiter(this, void 0, void 0, function () {
        var pos, styles, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, purchaseOrderService_1.purchaseOrderService.getAll()];
                case 1:
                    pos = _a.sent();
                    poOptions.value = __spreadArray([
                        { value: '', label: 'Tất cả' }
                    ], pos.map(function (po) { return ({
                        value: po.id,
                        label: po.po_number,
                    }); }), true);
                    return [4 /*yield*/, styleService_1.styleService.getAll()];
                case 2:
                    styles = _a.sent();
                    styleOptions.value = __spreadArray([
                        { value: '', label: 'Tất cả' }
                    ], styles.map(function (s) { return ({
                        value: s.id,
                        label: s.style_code,
                    }); }), true);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error('Failed to load filter options:', err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Handle filter changes
function handlePoChange(value) {
    updateFilters({ po_id: value || undefined });
}
function handleStyleChange(value) {
    updateFilters({ style_id: value || undefined });
}
function handleDateFromChange(value) {
    updateFilters({ date_from: value || undefined });
}
function handleDateToChange(value) {
    updateFilters({ date_to: value || undefined });
}
function handleClearFilters() {
    clearFilters();
}
(0, vue_1.onMounted)(function () {
    loadFilterOptions();
    fetchReport();
});
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h5, __VLS_intrinsics.h5)(__assign({ class: "q-ma-none" }));
/** @type {__VLS_StyleScopedClasses['q-ma-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_7 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ 'onClick': {} }, { label: "Làm mới", icon: "refresh", color: "primary", outline: true, loading: (__VLS_ctx.isLoading) })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Làm mới", icon: "refresh", color: "primary", outline: true, loading: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
var __VLS_13 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.fetchReport();
            // @ts-ignore
            [isLoading, fetchReport,];
        } });
var __VLS_10;
var __VLS_11;
var __VLS_14 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign({ 'onClick': {} }, { label: "Xuất Excel", icon: "download", color: "primary", disable: (!__VLS_ctx.hasData), loading: (__VLS_ctx.isLoading) })));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Xuất Excel", icon: "download", color: "primary", disable: (!__VLS_ctx.hasData), loading: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_15), false));
var __VLS_19;
var __VLS_20 = ({ click: {} },
    { onClick: (__VLS_ctx.exportExcel) });
var __VLS_17;
var __VLS_18;
var __VLS_21;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21(__assign({ flat: true, bordered: true }, { class: "q-mb-md" })));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_22), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_26 = __VLS_24.slots.default;
var __VLS_27;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({}));
var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_28), false));
var __VLS_32 = __VLS_30.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md items-end" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_33 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.po_id || ''), options: (__VLS_ctx.poOptions), label: "PO", emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.po_id || ''), options: (__VLS_ctx.poOptions), label: "PO", emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })], __VLS_functionalComponentArgsRest(__VLS_34), false));
var __VLS_38;
var __VLS_39 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handlePoChange) });
var __VLS_36;
var __VLS_37;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_40 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.style_id || ''), options: (__VLS_ctx.styleOptions), label: "Mã hàng", emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.style_id || ''), options: (__VLS_ctx.styleOptions), label: "Mã hàng", emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })], __VLS_functionalComponentArgsRest(__VLS_41), false));
var __VLS_45;
var __VLS_46 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleStyleChange) });
var __VLS_43;
var __VLS_44;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_47 = DatePicker_vue_1.default;
// @ts-ignore
var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.date_from || null), label: "Từ ngày", clearable: true })));
var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.date_from || null), label: "Từ ngày", clearable: true })], __VLS_functionalComponentArgsRest(__VLS_48), false));
var __VLS_52;
var __VLS_53 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleDateFromChange) });
var __VLS_50;
var __VLS_51;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_54 = DatePicker_vue_1.default;
// @ts-ignore
var __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.date_to || null), label: "Đến ngày", clearable: true })));
var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.date_to || null), label: "Đến ngày", clearable: true })], __VLS_functionalComponentArgsRest(__VLS_55), false));
var __VLS_59;
var __VLS_60 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleDateToChange) });
var __VLS_57;
var __VLS_58;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_61 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61(__assign(__assign({ 'onClick': {} }, { label: "Xóa bộ lọc", icon: "clear", color: "grey", outline: true }), { class: "full-width" })));
var __VLS_63 = __VLS_62.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { label: "Xóa bộ lọc", icon: "clear", color: "grey", outline: true }), { class: "full-width" })], __VLS_functionalComponentArgsRest(__VLS_62), false));
var __VLS_66;
var __VLS_67 = ({ click: {} },
    { onClick: (__VLS_ctx.handleClearFilters) });
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
var __VLS_64;
var __VLS_65;
// @ts-ignore
[isLoading, hasData, exportExcel, filters, filters, filters, filters, poOptions, handlePoChange, styleOptions, handleStyleChange, handleDateFromChange, handleDateToChange, handleClearFilters,];
var __VLS_30;
// @ts-ignore
[];
var __VLS_24;
if (__VLS_ctx.summary) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-sm-4 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_68 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
        flat: true,
        bordered: true,
    }));
    var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_69), false));
    var __VLS_73 = __VLS_71.slots.default;
    var __VLS_74 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74(__assign({ class: "text-center" })));
    var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_75), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_79 = __VLS_77.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    ((_a = __VLS_ctx.summary.total_quota) === null || _a === void 0 ? void 0 : _a.toLocaleString());
    // @ts-ignore
    [summary, summary,];
    var __VLS_77;
    // @ts-ignore
    [];
    var __VLS_71;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-sm-4 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_80 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
        flat: true,
        bordered: true,
    }));
    var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_81), false));
    var __VLS_85 = __VLS_83.slots.default;
    var __VLS_86 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86(__assign({ class: "text-center" })));
    var __VLS_88 = __VLS_87.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_87), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_91 = __VLS_89.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    ((_b = __VLS_ctx.summary.total_issued) === null || _b === void 0 ? void 0 : _b.toLocaleString());
    // @ts-ignore
    [summary,];
    var __VLS_89;
    // @ts-ignore
    [];
    var __VLS_83;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-sm-4 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_92 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
        flat: true,
        bordered: true,
    }));
    var __VLS_94 = __VLS_93.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_93), false));
    var __VLS_97 = __VLS_95.slots.default;
    var __VLS_98 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98(__assign({ class: "text-center" })));
    var __VLS_100 = __VLS_99.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_99), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_103 = __VLS_101.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    ((_c = __VLS_ctx.summary.total_returned) === null || _c === void 0 ? void 0 : _c.toLocaleString());
    // @ts-ignore
    [summary,];
    var __VLS_101;
    // @ts-ignore
    [];
    var __VLS_95;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-sm-4 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_104 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
        flat: true,
        bordered: true,
    }));
    var __VLS_106 = __VLS_105.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_105), false));
    var __VLS_109 = __VLS_107.slots.default;
    var __VLS_110 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110(__assign({ class: "text-center" })));
    var __VLS_112 = __VLS_111.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_111), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_115 = __VLS_113.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 text-negative" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    ((_d = __VLS_ctx.summary.total_consumed) === null || _d === void 0 ? void 0 : _d.toLocaleString());
    // @ts-ignore
    [summary,];
    var __VLS_113;
    // @ts-ignore
    [];
    var __VLS_107;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-sm-4 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_116 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({
        flat: true,
        bordered: true,
    }));
    var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_117), false));
    var __VLS_121 = __VLS_119.slots.default;
    var __VLS_122 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122(__assign({ class: "text-center" })));
    var __VLS_124 = __VLS_123.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_123), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_127 = __VLS_125.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }, { class: (__VLS_ctx.summary.overall_consumption_percentage > 100 ? 'text-negative' : 'text-positive') }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    ((_e = __VLS_ctx.summary.overall_consumption_percentage) === null || _e === void 0 ? void 0 : _e.toFixed(1));
    // @ts-ignore
    [summary, summary,];
    var __VLS_125;
    // @ts-ignore
    [];
    var __VLS_119;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-sm-4 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_128 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({
        flat: true,
        bordered: true,
    }));
    var __VLS_130 = __VLS_129.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_129), false));
    var __VLS_133 = __VLS_131.slots.default;
    var __VLS_134 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134(__assign({ class: "text-center" })));
    var __VLS_136 = __VLS_135.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_135), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_139 = __VLS_137.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }, { class: (__VLS_ctx.summary.total_over_limit_count > 0 ? 'text-warning' : 'text-positive') }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    (__VLS_ctx.summary.total_over_limit_count);
    // @ts-ignore
    [summary, summary,];
    var __VLS_137;
    // @ts-ignore
    [];
    var __VLS_131;
}
var __VLS_140 = ReconciliationTable_vue_1.default;
// @ts-ignore
var __VLS_141 = __VLS_asFunctionalComponent1(__VLS_140, new __VLS_140({
    rows: (__VLS_ctx.rows),
    summary: (__VLS_ctx.summary),
    loading: (__VLS_ctx.isLoading),
}));
var __VLS_142 = __VLS_141.apply(void 0, __spreadArray([{
        rows: (__VLS_ctx.rows),
        summary: (__VLS_ctx.summary),
        loading: (__VLS_ctx.isLoading),
    }], __VLS_functionalComponentArgsRest(__VLS_141), false));
// @ts-ignore
[isLoading, summary, rows,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
