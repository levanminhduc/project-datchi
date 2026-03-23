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
var composables_1 = require("@/composables");
var vue_router_1 = require("vue-router");
var composables_2 = require("@/composables");
var allocationService_1 = require("@/services/allocationService");
var enums_1 = require("@/types/thread/enums");
definePage({
    meta: {
        requiresAuth: true,
    }
});
// Composables
var _a = (0, composables_1.useStyles)(), styles = _a.styles, stylesLoading = _a.isLoading, fetchStyles = _a.fetchStyles;
var _b = (0, composables_1.usePurchaseOrders)(), purchaseOrders = _b.purchaseOrders, poLoading = _b.isLoading, fetchAllPurchaseOrders = _b.fetchAllPurchaseOrders;
var _c = (0, composables_1.useThreadCalculation)(), calculationResult = _c.calculationResult, poCalculationResults = _c.poCalculationResults, isLoading = _c.isLoading, hasResults = _c.hasResults, calculate = _c.calculate, calculateByPO = _c.calculateByPO, clearResults = _c.clearResults;
// State
var calculationMode = (0, vue_1.ref)('style');
var selectedStyleId = (0, vue_1.ref)(null);
var quantity = (0, vue_1.ref)(100);
var selectedPOId = (0, vue_1.ref)(null);
var router = (0, vue_router_1.useRouter)();
var snackbar = (0, composables_2.useSnackbar)();
var showAllocationSummary = (0, vue_1.ref)(false);
var creatingAllocations = (0, vue_1.ref)(false);
var allocationCandidates = (0, vue_1.ref)([]);
// Helper: determine if a hex color is light (for text contrast)
function isLightColor(hex) {
    var color = hex.replace('#', '');
    var r = parseInt(color.substring(0, 2), 16);
    var g = parseInt(color.substring(2, 4), 16);
    var b = parseInt(color.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}
// Computed options
var styleOptions = (0, vue_1.computed)(function () {
    return styles.value.map(function (s) { return ({ label: "".concat(s.style_code, " - ").concat(s.style_name), value: s.id }); });
});
var poOptions = (0, vue_1.computed)(function () {
    return purchaseOrders.value.map(function (po) { return ({ label: po.po_number, value: po.id }); });
});
// Validation
var canCalculate = (0, vue_1.computed)(function () {
    if (calculationMode.value === 'style') {
        return selectedStyleId.value !== null && quantity.value > 0;
    }
    return selectedPOId.value !== null;
});
var hasColorBreakdown = (0, vue_1.computed)(function () {
    if (calculationMode.value === 'style' && calculationResult.value) {
        return calculationResult.value.calculations.some(function (c) { return c.color_breakdown && c.color_breakdown.length > 0; });
    }
    if (calculationMode.value === 'po') {
        return poCalculationResults.value.some(function (r) { return r.calculations.some(function (c) { return c.color_breakdown && c.color_breakdown.length > 0; }); });
    }
    return false;
});
// Table columns
var resultColumns = [
    { name: 'process_name', label: 'Công đoạn', field: 'process_name', align: 'left' },
    { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
    { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'left' },
    { name: 'meters_per_unit', label: 'Mét/SP', field: 'meters_per_unit', align: 'right', format: function (val) { return val.toFixed(2); } },
    {
        name: 'total_cones',
        label: 'Tổng cuộn',
        field: function (row) {
            var r = row;
            if (!r.meters_per_cone || r.meters_per_cone <= 0)
                return null;
            return Math.ceil(r.total_meters / r.meters_per_cone);
        },
        align: 'right',
        format: function (val) { return (val !== null && val !== undefined) ? Number(val).toLocaleString('vi-VN') : '—'; },
    },
    { name: 'thread_color', label: 'Màu chỉ', field: 'thread_color', align: 'center' },
];
var summaryColumns = [
    { name: 'order_id', label: 'Mã đơn', field: 'order_id', align: 'left' },
    { name: 'process_name', label: 'Công đoạn', field: 'process_name', align: 'left' },
    { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left' },
    { name: 'thread_type_name', label: 'Loại chỉ', field: 'thread_type_name', align: 'left' },
    { name: 'requested_meters', label: 'Số mét', field: 'requested_meters', align: 'right', format: function (val) { return val.toFixed(2); } },
];
// Handlers
var handleCalculate = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                clearResults();
                if (!(calculationMode.value === 'style')) return [3 /*break*/, 2];
                if (!selectedStyleId.value || quantity.value <= 0)
                    return [2 /*return*/];
                return [4 /*yield*/, calculate({ style_id: selectedStyleId.value, quantity: quantity.value })];
            case 1:
                _a.sent();
                return [3 /*break*/, 4];
            case 2:
                if (!selectedPOId.value)
                    return [2 /*return*/];
                return [4 /*yield*/, calculateByPO({ po_id: selectedPOId.value })];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); };
var handleCreateAllocations = function () {
    var candidates = [];
    if (calculationMode.value === 'style' && calculationResult.value) {
        var result = calculationResult.value;
        for (var _i = 0, _a = result.calculations; _i < _a.length; _i++) {
            var calc = _a[_i];
            if (calc.color_breakdown) {
                for (var _b = 0, _c = calc.color_breakdown; _b < _c.length; _b++) {
                    var cb = _c[_b];
                    candidates.push({
                        order_id: result.style_code,
                        order_reference: result.style_name,
                        thread_type_id: cb.thread_type_id,
                        thread_type_name: cb.thread_type_name,
                        requested_meters: cb.total_meters,
                        process_name: calc.process_name,
                        color_name: cb.color_name,
                    });
                }
            }
        }
    }
    else if (calculationMode.value === 'po') {
        var selectedPO = purchaseOrders.value.find(function (po) { return po.id === selectedPOId.value; });
        for (var _d = 0, _e = poCalculationResults.value; _d < _e.length; _d++) {
            var poResult = _e[_d];
            for (var _f = 0, _g = poResult.calculations; _f < _g.length; _f++) {
                var calc = _g[_f];
                if (calc.color_breakdown) {
                    for (var _h = 0, _j = calc.color_breakdown; _h < _j.length; _h++) {
                        var cb = _j[_h];
                        candidates.push({
                            order_id: poResult.style_code,
                            order_reference: "".concat((selectedPO === null || selectedPO === void 0 ? void 0 : selectedPO.po_number) || '', " - ").concat(poResult.style_name),
                            thread_type_id: cb.thread_type_id,
                            thread_type_name: cb.thread_type_name,
                            requested_meters: cb.total_meters,
                            process_name: calc.process_name,
                            color_name: cb.color_name,
                        });
                    }
                }
            }
        }
    }
    if (candidates.length === 0) {
        snackbar.warning('Không có dữ liệu màu chỉ để tạo phiếu phân bổ');
        return;
    }
    allocationCandidates.value = candidates;
    showAllocationSummary.value = true;
};
var confirmCreateAllocations = function () { return __awaiter(void 0, void 0, void 0, function () {
    var successCount, errorCount, _i, _a, candidate, dto, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                creatingAllocations.value = true;
                successCount = 0;
                errorCount = 0;
                _c.label = 1;
            case 1:
                _c.trys.push([1, , 8, 9]);
                _i = 0, _a = allocationCandidates.value;
                _c.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 7];
                candidate = _a[_i];
                _c.label = 3;
            case 3:
                _c.trys.push([3, 5, , 6]);
                dto = {
                    order_id: candidate.order_id,
                    order_reference: candidate.order_reference,
                    thread_type_id: candidate.thread_type_id,
                    requested_meters: candidate.requested_meters,
                    priority: enums_1.AllocationPriority.NORMAL,
                    notes: "T\u1EA1o t\u1EEB t\u00EDnh to\u00E1n \u0111\u1ECBnh m\u1EE9c - ".concat(candidate.process_name, " - ").concat(candidate.color_name),
                };
                return [4 /*yield*/, allocationService_1.allocationService.create(dto)];
            case 4:
                _c.sent();
                successCount++;
                return [3 /*break*/, 6];
            case 5:
                _b = _c.sent();
                errorCount++;
                return [3 /*break*/, 6];
            case 6:
                _i++;
                return [3 /*break*/, 2];
            case 7:
                if (successCount > 0) {
                    snackbar.success("\u0110\u00E3 t\u1EA1o ".concat(successCount, " phi\u1EBFu ph\u00E2n b\u1ED5 th\u00E0nh c\u00F4ng").concat(errorCount > 0 ? ", ".concat(errorCount, " l\u1ED7i") : ''));
                    showAllocationSummary.value = false;
                    router.push('/thread/allocations');
                }
                else {
                    snackbar.error('Không thể tạo phiếu phân bổ. Vui lòng thử lại.');
                }
                return [3 /*break*/, 9];
            case 8:
                creatingAllocations.value = false;
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}); };
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([fetchStyles(), fetchAllPurchaseOrders()])];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
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
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.PageHeader} */
PageHeader;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    title: "Tính Toán Định Mức Chỉ",
    subtitle: "Tính toán nhu cầu chỉ theo mã hàng hoặc đơn hàng",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Tính Toán Định Mức Chỉ",
        subtitle: "Tính toán nhu cầu chỉ theo mã hàng hoặc đơn hàng",
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
/** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
AppCard;
// @ts-ignore
var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12(__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })));
var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })], __VLS_functionalComponentArgsRest(__VLS_13), false));
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_17 = __VLS_15.slots.default;
var __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({}));
var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_19), false));
var __VLS_23 = __VLS_21.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md items-end" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7 q-mb-xs" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
var __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.ButtonToggle} */
ButtonToggle;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.calculationMode), spread: true, color: "grey-4", toggleColor: "primary", options: ([
        { label: 'Theo mã hàng', value: 'style' },
        { label: 'Theo đơn hàng', value: 'po' }
    ]) })));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.calculationMode), spread: true, color: "grey-4", toggleColor: "primary", options: ([
            { label: 'Theo mã hàng', value: 'style' },
            { label: 'Theo đơn hàng', value: 'po' }
        ]) })], __VLS_functionalComponentArgsRest(__VLS_25), false));
var __VLS_29;
var __VLS_30 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.clearResults) });
var __VLS_27;
var __VLS_28;
if (__VLS_ctx.calculationMode === 'style') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_31 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect | typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
        modelValue: (__VLS_ctx.selectedStyleId),
        options: (__VLS_ctx.styleOptions),
        label: "Mã hàng",
        dense: true,
        hideBottomSpace: true,
        loading: (__VLS_ctx.stylesLoading),
        clearable: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
    }));
    var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.selectedStyleId),
            options: (__VLS_ctx.styleOptions),
            label: "Mã hàng",
            dense: true,
            hideBottomSpace: true,
            loading: (__VLS_ctx.stylesLoading),
            clearable: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
        }], __VLS_functionalComponentArgsRest(__VLS_32), false));
    var __VLS_36 = __VLS_34.slots.default;
    {
        var __VLS_37 = __VLS_34.slots["no-option"];
        var __VLS_38 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({}));
        var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_39), false));
        var __VLS_43 = __VLS_41.slots.default;
        var __VLS_44 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44(__assign({ class: "text-grey" })));
        var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_45), false));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        var __VLS_49 = __VLS_47.slots.default;
        // @ts-ignore
        [calculationMode, calculationMode, clearResults, selectedStyleId, styleOptions, stylesLoading,];
        var __VLS_47;
        // @ts-ignore
        [];
        var __VLS_41;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_34;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_50 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
        modelValue: (__VLS_ctx.quantity),
        modelModifiers: { number: true, },
        type: "number",
        label: "Số lượng",
        dense: true,
        hideBottomSpace: true,
        min: (1),
    }));
    var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.quantity),
            modelModifiers: { number: true, },
            type: "number",
            label: "Số lượng",
            dense: true,
            hideBottomSpace: true,
            min: (1),
        }], __VLS_functionalComponentArgsRest(__VLS_51), false));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_55 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect | typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
        modelValue: (__VLS_ctx.selectedPOId),
        options: (__VLS_ctx.poOptions),
        label: "Đơn hàng (PO)",
        dense: true,
        hideBottomSpace: true,
        loading: (__VLS_ctx.poLoading),
        clearable: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
    }));
    var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.selectedPOId),
            options: (__VLS_ctx.poOptions),
            label: "Đơn hàng (PO)",
            dense: true,
            hideBottomSpace: true,
            loading: (__VLS_ctx.poLoading),
            clearable: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
        }], __VLS_functionalComponentArgsRest(__VLS_56), false));
    var __VLS_60 = __VLS_58.slots.default;
    {
        var __VLS_61 = __VLS_58.slots["no-option"];
        var __VLS_62 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({}));
        var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_63), false));
        var __VLS_67 = __VLS_65.slots.default;
        var __VLS_68 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68(__assign({ class: "text-grey" })));
        var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_69), false));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        var __VLS_73 = __VLS_71.slots.default;
        // @ts-ignore
        [quantity, selectedPOId, poOptions, poLoading,];
        var __VLS_71;
        // @ts-ignore
        [];
        var __VLS_65;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_58;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
var __VLS_74;
/** @ts-ignore @type {typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74(__assign({ 'onClick': {} }, { color: "primary", icon: "calculate", label: "Tính toán", loading: (__VLS_ctx.isLoading), disable: (!__VLS_ctx.canCalculate) })));
var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "calculate", label: "Tính toán", loading: (__VLS_ctx.isLoading), disable: (!__VLS_ctx.canCalculate) })], __VLS_functionalComponentArgsRest(__VLS_75), false));
var __VLS_79;
var __VLS_80 = ({ click: {} },
    { onClick: (__VLS_ctx.handleCalculate) });
var __VLS_77;
var __VLS_78;
// @ts-ignore
[isLoading, canCalculate, handleCalculate,];
var __VLS_21;
// @ts-ignore
[];
var __VLS_15;
if (__VLS_ctx.calculationMode === 'style' && __VLS_ctx.calculationResult) {
    var __VLS_81 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
    AppCard;
    // @ts-ignore
    var __VLS_82 = __VLS_asFunctionalComponent1(__VLS_81, new __VLS_81(__assign({ flat: true, bordered: true }, { class: "q-mb-md" })));
    var __VLS_83 = __VLS_82.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_82), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_86 = __VLS_84.slots.default;
    var __VLS_87 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_88 = __VLS_asFunctionalComponent1(__VLS_87, new __VLS_87({}));
    var __VLS_89 = __VLS_88.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_88), false));
    var __VLS_92 = __VLS_90.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    (__VLS_ctx.calculationResult.style_code);
    (__VLS_ctx.calculationResult.style_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    (__VLS_ctx.calculationResult.total_quantity);
    var __VLS_93 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.DataTable | typeof __VLS_components.DataTable} */
    DataTable;
    // @ts-ignore
    var __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93({
        rows: (__VLS_ctx.calculationResult.calculations),
        columns: (__VLS_ctx.resultColumns),
        rowKey: "spec_id",
        hideBottom: true,
        rowsPerPageOptions: ([0]),
    }));
    var __VLS_95 = __VLS_94.apply(void 0, __spreadArray([{
            rows: (__VLS_ctx.calculationResult.calculations),
            columns: (__VLS_ctx.resultColumns),
            rowKey: "spec_id",
            hideBottom: true,
            rowsPerPageOptions: ([0]),
        }], __VLS_functionalComponentArgsRest(__VLS_94), false));
    var __VLS_98 = __VLS_96.slots.default;
    {
        var __VLS_99 = __VLS_96.slots["body-cell-total_cones"];
        var props = __VLS_vSlot(__VLS_99)[0];
        var __VLS_100 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100({
            props: (props),
        }));
        var __VLS_102 = __VLS_101.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_101), false));
        var __VLS_105 = __VLS_103.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (props.value);
        if (props.row.meters_per_cone) {
            var __VLS_106 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.AppTooltip | typeof __VLS_components.AppTooltip} */
            AppTooltip;
            // @ts-ignore
            var __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({}));
            var __VLS_108 = __VLS_107.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_107), false));
            var __VLS_111 = __VLS_109.slots.default;
            (props.row.total_meters.toFixed(2));
            (props.row.meters_per_cone);
            // @ts-ignore
            [calculationMode, calculationResult, calculationResult, calculationResult, calculationResult, calculationResult, resultColumns,];
            var __VLS_109;
        }
        // @ts-ignore
        [];
        var __VLS_103;
        // @ts-ignore
        [];
    }
    {
        var __VLS_112 = __VLS_96.slots["body-cell-thread_color"];
        var props = __VLS_vSlot(__VLS_112)[0];
        var __VLS_113 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_114 = __VLS_asFunctionalComponent1(__VLS_113, new __VLS_113({
            props: (props),
        }));
        var __VLS_115 = __VLS_114.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_114), false));
        var __VLS_118 = __VLS_116.slots.default;
        if (props.row.thread_color) {
            var __VLS_119 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.AppBadge} */
            AppBadge;
            // @ts-ignore
            var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119(__assign(__assign({ style: ({ backgroundColor: props.row.thread_color_code || '#999' }) }, { class: (props.row.thread_color_code && __VLS_ctx.isLightColor(props.row.thread_color_code) ? 'text-dark' : 'text-white') }), { label: (props.row.thread_color) })));
            var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([__assign(__assign({ style: ({ backgroundColor: props.row.thread_color_code || '#999' }) }, { class: (props.row.thread_color_code && __VLS_ctx.isLightColor(props.row.thread_color_code) ? 'text-dark' : 'text-white') }), { label: (props.row.thread_color) })], __VLS_functionalComponentArgsRest(__VLS_120), false));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
            /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
        }
        // @ts-ignore
        [isLightColor,];
        var __VLS_116;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_96;
    // @ts-ignore
    [];
    var __VLS_90;
    var __VLS_124 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124(__assign({ align: "right" }, { class: "q-px-md q-pb-md" })));
    var __VLS_126 = __VLS_125.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md" })], __VLS_functionalComponentArgsRest(__VLS_125), false));
    /** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
    var __VLS_129 = __VLS_127.slots.default;
    var __VLS_130 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton | typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130(__assign({ 'onClick': {} }, { color: "primary", icon: "add_circle", label: "Tạo phiếu phân bổ", disable: (!__VLS_ctx.hasColorBreakdown) })));
    var __VLS_132 = __VLS_131.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "add_circle", label: "Tạo phiếu phân bổ", disable: (!__VLS_ctx.hasColorBreakdown) })], __VLS_functionalComponentArgsRest(__VLS_131), false));
    var __VLS_135 = void 0;
    var __VLS_136 = ({ click: {} },
        { onClick: (__VLS_ctx.handleCreateAllocations) });
    var __VLS_137 = __VLS_133.slots.default;
    if (!__VLS_ctx.hasColorBreakdown) {
        var __VLS_138 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.AppTooltip | typeof __VLS_components.AppTooltip} */
        AppTooltip;
        // @ts-ignore
        var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138({}));
        var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_139), false));
        var __VLS_143 = __VLS_141.slots.default;
        // @ts-ignore
        [hasColorBreakdown, hasColorBreakdown, handleCreateAllocations,];
        var __VLS_141;
    }
    // @ts-ignore
    [];
    var __VLS_133;
    var __VLS_134;
    // @ts-ignore
    [];
    var __VLS_127;
    // @ts-ignore
    [];
    var __VLS_84;
}
if (__VLS_ctx.calculationMode === 'po' && __VLS_ctx.poCalculationResults.length > 0) {
    for (var _i = 0, _d = __VLS_vFor((__VLS_ctx.poCalculationResults)); _i < _d.length; _i++) {
        var poResult = _d[_i][0];
        var __VLS_144 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
        AppCard;
        // @ts-ignore
        var __VLS_145 = __VLS_asFunctionalComponent1(__VLS_144, new __VLS_144(__assign({ key: (poResult.po_item_id), flat: true, bordered: true }, { class: "q-mb-md" })));
        var __VLS_146 = __VLS_145.apply(void 0, __spreadArray([__assign({ key: (poResult.po_item_id), flat: true, bordered: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_145), false));
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
        var __VLS_149 = __VLS_147.slots.default;
        var __VLS_150 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
        qCardSection;
        // @ts-ignore
        var __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({}));
        var __VLS_152 = __VLS_151.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_151), false));
        var __VLS_155 = __VLS_153.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
        /** @type {__VLS_StyleScopedClasses['col']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
        /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
        (poResult.style_code);
        (poResult.style_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        (poResult.quantity);
        var __VLS_156 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.DataTable | typeof __VLS_components.DataTable} */
        DataTable;
        // @ts-ignore
        var __VLS_157 = __VLS_asFunctionalComponent1(__VLS_156, new __VLS_156({
            rows: (poResult.calculations),
            columns: (__VLS_ctx.resultColumns),
            rowKey: "spec_id",
            hideBottom: true,
            rowsPerPageOptions: ([0]),
        }));
        var __VLS_158 = __VLS_157.apply(void 0, __spreadArray([{
                rows: (poResult.calculations),
                columns: (__VLS_ctx.resultColumns),
                rowKey: "spec_id",
                hideBottom: true,
                rowsPerPageOptions: ([0]),
            }], __VLS_functionalComponentArgsRest(__VLS_157), false));
        var __VLS_161 = __VLS_159.slots.default;
        {
            var __VLS_162 = __VLS_159.slots["body-cell-total_cones"];
            var props = __VLS_vSlot(__VLS_162)[0];
            var __VLS_163 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_164 = __VLS_asFunctionalComponent1(__VLS_163, new __VLS_163({
                props: (props),
            }));
            var __VLS_165 = __VLS_164.apply(void 0, __spreadArray([{
                    props: (props),
                }], __VLS_functionalComponentArgsRest(__VLS_164), false));
            var __VLS_168 = __VLS_166.slots.default;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (props.value);
            if (props.row.meters_per_cone) {
                var __VLS_169 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.AppTooltip | typeof __VLS_components.AppTooltip} */
                AppTooltip;
                // @ts-ignore
                var __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169({}));
                var __VLS_171 = __VLS_170.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_170), false));
                var __VLS_174 = __VLS_172.slots.default;
                (props.row.total_meters.toFixed(2));
                (props.row.meters_per_cone);
                // @ts-ignore
                [calculationMode, resultColumns, poCalculationResults, poCalculationResults,];
                var __VLS_172;
            }
            // @ts-ignore
            [];
            var __VLS_166;
            // @ts-ignore
            [];
        }
        {
            var __VLS_175 = __VLS_159.slots["body-cell-thread_color"];
            var props = __VLS_vSlot(__VLS_175)[0];
            var __VLS_176 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_177 = __VLS_asFunctionalComponent1(__VLS_176, new __VLS_176({
                props: (props),
            }));
            var __VLS_178 = __VLS_177.apply(void 0, __spreadArray([{
                    props: (props),
                }], __VLS_functionalComponentArgsRest(__VLS_177), false));
            var __VLS_181 = __VLS_179.slots.default;
            if (props.row.thread_color) {
                var __VLS_182 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.AppBadge} */
                AppBadge;
                // @ts-ignore
                var __VLS_183 = __VLS_asFunctionalComponent1(__VLS_182, new __VLS_182(__assign(__assign({ style: ({ backgroundColor: props.row.thread_color_code || '#999' }) }, { class: (props.row.thread_color_code && __VLS_ctx.isLightColor(props.row.thread_color_code) ? 'text-dark' : 'text-white') }), { label: (props.row.thread_color) })));
                var __VLS_184 = __VLS_183.apply(void 0, __spreadArray([__assign(__assign({ style: ({ backgroundColor: props.row.thread_color_code || '#999' }) }, { class: (props.row.thread_color_code && __VLS_ctx.isLightColor(props.row.thread_color_code) ? 'text-dark' : 'text-white') }), { label: (props.row.thread_color) })], __VLS_functionalComponentArgsRest(__VLS_183), false));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
                /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
            }
            // @ts-ignore
            [isLightColor,];
            var __VLS_179;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_159;
        // @ts-ignore
        [];
        var __VLS_153;
        // @ts-ignore
        [];
        var __VLS_147;
        // @ts-ignore
        [];
    }
    var __VLS_187 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
    AppCard;
    // @ts-ignore
    var __VLS_188 = __VLS_asFunctionalComponent1(__VLS_187, new __VLS_187({
        flat: true,
        bordered: true,
    }));
    var __VLS_189 = __VLS_188.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_188), false));
    var __VLS_192 = __VLS_190.slots.default;
    var __VLS_193 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_194 = __VLS_asFunctionalComponent1(__VLS_193, new __VLS_193(__assign({ align: "right" }, { class: "q-px-md q-py-md" })));
    var __VLS_195 = __VLS_194.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-py-md" })], __VLS_functionalComponentArgsRest(__VLS_194), false));
    /** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-md']} */ ;
    var __VLS_198 = __VLS_196.slots.default;
    var __VLS_199 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton | typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_200 = __VLS_asFunctionalComponent1(__VLS_199, new __VLS_199(__assign({ 'onClick': {} }, { color: "primary", icon: "add_circle", label: "Tạo phiếu phân bổ", disable: (!__VLS_ctx.hasColorBreakdown) })));
    var __VLS_201 = __VLS_200.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "add_circle", label: "Tạo phiếu phân bổ", disable: (!__VLS_ctx.hasColorBreakdown) })], __VLS_functionalComponentArgsRest(__VLS_200), false));
    var __VLS_204 = void 0;
    var __VLS_205 = ({ click: {} },
        { onClick: (__VLS_ctx.handleCreateAllocations) });
    var __VLS_206 = __VLS_202.slots.default;
    if (!__VLS_ctx.hasColorBreakdown) {
        var __VLS_207 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.AppTooltip | typeof __VLS_components.AppTooltip} */
        AppTooltip;
        // @ts-ignore
        var __VLS_208 = __VLS_asFunctionalComponent1(__VLS_207, new __VLS_207({}));
        var __VLS_209 = __VLS_208.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_208), false));
        var __VLS_212 = __VLS_210.slots.default;
        // @ts-ignore
        [hasColorBreakdown, hasColorBreakdown, handleCreateAllocations,];
        var __VLS_210;
    }
    // @ts-ignore
    [];
    var __VLS_202;
    var __VLS_203;
    // @ts-ignore
    [];
    var __VLS_196;
    // @ts-ignore
    [];
    var __VLS_190;
}
if (!__VLS_ctx.hasResults && !__VLS_ctx.isLoading) {
    var __VLS_213 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
    AppCard;
    // @ts-ignore
    var __VLS_214 = __VLS_asFunctionalComponent1(__VLS_213, new __VLS_213({
        flat: true,
        bordered: true,
    }));
    var __VLS_215 = __VLS_214.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_214), false));
    var __VLS_218 = __VLS_216.slots.default;
    var __VLS_219 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.EmptyState} */
    EmptyState;
    // @ts-ignore
    var __VLS_220 = __VLS_asFunctionalComponent1(__VLS_219, new __VLS_219({
        icon: "calculate",
        title: "Chưa có kết quả",
        subtitle: "Chọn mã hàng hoặc đơn hàng và nhấn &quot;Tính toán&quot;",
        iconColor: "grey-4",
    }));
    var __VLS_221 = __VLS_220.apply(void 0, __spreadArray([{
            icon: "calculate",
            title: "Chưa có kết quả",
            subtitle: "Chọn mã hàng hoặc đơn hàng và nhấn &quot;Tính toán&quot;",
            iconColor: "grey-4",
        }], __VLS_functionalComponentArgsRest(__VLS_220), false));
    // @ts-ignore
    [isLoading, hasResults,];
    var __VLS_216;
}
var __VLS_224;
/** @ts-ignore @type {typeof __VLS_components.AppDialog | typeof __VLS_components.AppDialog} */
AppDialog;
// @ts-ignore
var __VLS_225 = __VLS_asFunctionalComponent1(__VLS_224, new __VLS_224({
    modelValue: (__VLS_ctx.showAllocationSummary),
    persistent: true,
    maximized: true,
}));
var __VLS_226 = __VLS_225.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showAllocationSummary),
        persistent: true,
        maximized: true,
    }], __VLS_functionalComponentArgsRest(__VLS_225), false));
var __VLS_229 = __VLS_227.slots.default;
{
    var __VLS_230 = __VLS_227.slots.header;
    // @ts-ignore
    [showAllocationSummary,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-grey-7 q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
(__VLS_ctx.allocationCandidates.length);
var __VLS_231;
/** @ts-ignore @type {typeof __VLS_components.DataTable} */
DataTable;
// @ts-ignore
var __VLS_232 = __VLS_asFunctionalComponent1(__VLS_231, new __VLS_231({
    rows: (__VLS_ctx.allocationCandidates),
    columns: (__VLS_ctx.summaryColumns),
    rowKey: "thread_type_id",
    hideBottom: true,
    rowsPerPageOptions: ([0]),
}));
var __VLS_233 = __VLS_232.apply(void 0, __spreadArray([{
        rows: (__VLS_ctx.allocationCandidates),
        columns: (__VLS_ctx.summaryColumns),
        rowKey: "thread_type_id",
        hideBottom: true,
        rowsPerPageOptions: ([0]),
    }], __VLS_functionalComponentArgsRest(__VLS_232), false));
{
    var __VLS_236 = __VLS_227.slots.actions;
    var __VLS_237 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_238 = __VLS_asFunctionalComponent1(__VLS_237, new __VLS_237({
        variant: "flat",
        label: "Hủy",
        disable: (__VLS_ctx.creatingAllocations),
    }));
    var __VLS_239 = __VLS_238.apply(void 0, __spreadArray([{
            variant: "flat",
            label: "Hủy",
            disable: (__VLS_ctx.creatingAllocations),
        }], __VLS_functionalComponentArgsRest(__VLS_238), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    var __VLS_242 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_243 = __VLS_asFunctionalComponent1(__VLS_242, new __VLS_242(__assign({ 'onClick': {} }, { color: "primary", icon: "check", label: "Xác nhận tạo", loading: (__VLS_ctx.creatingAllocations) })));
    var __VLS_244 = __VLS_243.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "check", label: "Xác nhận tạo", loading: (__VLS_ctx.creatingAllocations) })], __VLS_functionalComponentArgsRest(__VLS_243), false));
    var __VLS_247 = void 0;
    var __VLS_248 = ({ click: {} },
        { onClick: (__VLS_ctx.confirmCreateAllocations) });
    var __VLS_245;
    var __VLS_246;
    // @ts-ignore
    [allocationCandidates, allocationCandidates, summaryColumns, creatingAllocations, creatingAllocations, vClosePopup, confirmCreateAllocations,];
}
// @ts-ignore
[];
var __VLS_227;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
