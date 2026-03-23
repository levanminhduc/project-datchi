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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var vue_router_1 = require("vue-router");
var quasar_1 = require("quasar");
var useBatchOperations_1 = require("@/composables/useBatchOperations");
var composables_1 = require("@/composables");
var useLots_1 = require("@/composables/useLots");
var qr_1 = require("@/components/qr");
var AppWarehouseSelect_vue_1 = require("@/components/ui/inputs/AppWarehouseSelect.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var AppTextarea_vue_1 = require("@/components/ui/inputs/AppTextarea.vue");
var LotSelector_vue_1 = require("@/components/thread/LotSelector.vue");
var router = (0, vue_router_1.useRouter)();
var $q = (0, quasar_1.useQuasar)();
var confirm = (0, composables_1.useConfirm)().confirm;
var snackbar = (0, composables_1.useSnackbar)();
var _e = (0, composables_1.useWarehouses)(), warehouses = _e.warehouses, fetchWarehouses = _e.fetchWarehouses;
var _f = (0, useLots_1.useLots)(), fetchLotCones = _f.fetchLotCones, currentCones = _f.currentCones;
var _g = (0, useBatchOperations_1.useBatchOperations)(), loading = _g.loading, lastResult = _g.lastResult, batchIssue = _g.batchIssue;
// Local buffer
var coneBuffer = (0, vue_1.ref)([]);
// State
var currentStep = (0, vue_1.ref)(1);
var selectionMode = (0, vue_1.ref)('lot');
var isScanning = (0, vue_1.ref)(false);
var manualInput = (0, vue_1.ref)('');
var showSuccessDialog = (0, vue_1.ref)(false);
var selectedLotId = (0, vue_1.ref)(null);
var selectedLot = (0, vue_1.ref)(null);
var formData = (0, vue_1.ref)({
    warehouse_id: null,
    recipient: '',
    reference_number: '',
    notes: ''
});
// Options
var selectionModeOptions = [
    { label: 'Theo lô', value: 'lot' },
    { label: 'Quét/nhập', value: 'scan' }
];
// Computed
var warehouseName = (0, vue_1.computed)(function () {
    var w = warehouses.value.find(function (w) { return w.id === formData.value.warehouse_id; });
    return (w === null || w === void 0 ? void 0 : w.name) || '-';
});
// Methods
function goToStep(step) {
    currentStep.value = step;
}
function onWarehouseChange() {
    selectedLotId.value = null;
    selectedLot.value = null;
    coneBuffer.value = [];
}
function onLotSelected(lot) {
    selectedLot.value = lot;
}
function addLotCones() {
    return __awaiter(this, void 0, void 0, function () {
        var coneIds, added, _i, coneIds_1, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedLotId.value)
                        return [2 /*return*/];
                    return [4 /*yield*/, fetchLotCones(selectedLotId.value)];
                case 1:
                    _a.sent();
                    coneIds = currentCones.value
                        .filter(function (c) { return c.status === 'AVAILABLE'; })
                        .map(function (c) { return c.cone_id; });
                    added = 0;
                    for (_i = 0, coneIds_1 = coneIds; _i < coneIds_1.length; _i++) {
                        id = coneIds_1[_i];
                        if (!coneBuffer.value.includes(id)) {
                            coneBuffer.value.push(id);
                            added++;
                        }
                    }
                    if (added > 0) {
                        snackbar.success("\u0110\u00E3 th\u00EAm ".concat(added, " cu\u1ED9n kh\u1EA3 d\u1EE5ng"));
                    }
                    else {
                        snackbar.warning('Không có cuộn khả dụng trong lô');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function toggleScanner() {
    isScanning.value = !isScanning.value;
}
function handleScan(codes) {
    var firstCode = codes[0];
    if (!firstCode)
        return;
    var coneId = firstCode.rawValue.trim();
    if (coneBuffer.value.includes(coneId)) {
        snackbar.warning('Đã quét rồi');
        return;
    }
    coneBuffer.value.push(coneId);
    snackbar.success("\u2713 ".concat(coneId));
}
function handleManualAdd() {
    var ids = manualInput.value
        .split(/[,\n\r]+/)
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
    var added = 0;
    for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
        var id = ids_1[_i];
        if (!coneBuffer.value.includes(id)) {
            coneBuffer.value.push(id);
            added++;
        }
    }
    if (added > 0) {
        manualInput.value = '';
        snackbar.success("\u0110\u00E3 th\u00EAm ".concat(added, " cu\u1ED9n"));
    }
}
function removeFromBuffer(coneId) {
    var index = coneBuffer.value.indexOf(coneId);
    if (index !== -1) {
        coneBuffer.value.splice(index, 1);
    }
}
function handleClearBuffer() {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirm({
                        title: 'Xóa tất cả?',
                        message: 'Bạn có chắc muốn xóa tất cả cuộn đã chọn?',
                        type: 'warning'
                    })];
                case 1:
                    confirmed = _a.sent();
                    if (confirmed) {
                        coneBuffer.value = [];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function handleConfirm() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, batchIssue({
                        cone_ids: coneBuffer.value.map(function (id) { return parseInt(id, 10) || 0; }),
                        warehouse_id: formData.value.warehouse_id,
                        recipient: formData.value.recipient,
                        reference_number: formData.value.reference_number || undefined,
                        notes: formData.value.notes || undefined
                    })];
                case 1:
                    result = _a.sent();
                    if (result) {
                        showSuccessDialog.value = true;
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function handlePrint() {
    // Open print dialog with issue slip
    // For now, just print the page
    window.print();
}
function handleNewBatch() {
    showSuccessDialog.value = false;
    currentStep.value = 1;
    coneBuffer.value = [];
    selectedLotId.value = null;
    selectedLot.value = null;
    formData.value.recipient = '';
    formData.value.reference_number = '';
    formData.value.notes = '';
}
function handleBack() {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(coneBuffer.value.length > 0)) return [3 /*break*/, 2];
                    return [4 /*yield*/, confirm({
                            title: 'Rời trang?',
                            message: 'Danh sách cuộn đã chọn sẽ bị mất. Bạn có chắc?',
                            type: 'warning'
                        })];
                case 1:
                    confirmed = _a.sent();
                    if (!confirmed)
                        return [2 /*return*/];
                    _a.label = 2;
                case 2:
                    router.back();
                    return [2 /*return*/];
            }
        });
    });
}
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetchWarehouses()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, vue_1.onBeforeUnmount)(function () {
    isScanning.value = false;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ 'onClick': {} }, { flat: true, round: true, icon: "arrow_back", color: "primary" })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, icon: "arrow_back", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
var __VLS_13 = ({ click: {} },
    { onClick: (__VLS_ctx.handleBack) });
var __VLS_10;
var __VLS_11;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-ml-md" }));
/** @type {__VLS_StyleScopedClasses['q-ml-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h5 q-my-none text-weight-bold" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6" }));
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
var __VLS_14;
/** @ts-ignore @type {typeof __VLS_components.qStepper | typeof __VLS_components.QStepper | typeof __VLS_components.qStepper | typeof __VLS_components.QStepper} */
qStepper;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign(__assign({ modelValue: (__VLS_ctx.currentStep), color: "primary", animated: true, flat: true, bordered: true }, { class: "batch-stepper" }), { vertical: (__VLS_ctx.$q.screen.lt.sm) })));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.currentStep), color: "primary", animated: true, flat: true, bordered: true }, { class: "batch-stepper" }), { vertical: (__VLS_ctx.$q.screen.lt.sm) })], __VLS_functionalComponentArgsRest(__VLS_15), false));
/** @type {__VLS_StyleScopedClasses['batch-stepper']} */ ;
var __VLS_19 = __VLS_17.slots.default;
var __VLS_20;
/** @ts-ignore @type {typeof __VLS_components.qStep | typeof __VLS_components.QStep | typeof __VLS_components.qStep | typeof __VLS_components.QStep} */
qStep;
// @ts-ignore
var __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    name: (1),
    title: "Chọn Cuộn",
    icon: "inventory_2",
    done: (__VLS_ctx.currentStep > 1),
}));
var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([{
        name: (1),
        title: "Chọn Cuộn",
        icon: "inventory_2",
        done: (__VLS_ctx.currentStep > 1),
    }], __VLS_functionalComponentArgsRest(__VLS_21), false));
var __VLS_25 = __VLS_23.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-body1 q-mb-md text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
var __VLS_26 = AppWarehouseSelect_vue_1.default;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26(__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.formData.warehouse_id), label: "Chọn kho", required: true }), { class: "q-mb-lg" })));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.formData.warehouse_id), label: "Chọn kho", required: true }), { class: "q-mb-lg" })], __VLS_functionalComponentArgsRest(__VLS_27), false));
var __VLS_31;
var __VLS_32 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onWarehouseChange) });
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_29;
var __VLS_30;
var __VLS_33;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ class: "q-my-md" })));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ class: "q-my-md" })], __VLS_functionalComponentArgsRest(__VLS_34), false));
/** @type {__VLS_StyleScopedClasses['q-my-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-body1 q-mb-md text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
var __VLS_38;
/** @ts-ignore @type {typeof __VLS_components.qOptionGroup | typeof __VLS_components.QOptionGroup} */
qOptionGroup;
// @ts-ignore
var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38(__assign(__assign({ modelValue: (__VLS_ctx.selectionMode), options: (__VLS_ctx.selectionModeOptions), color: "primary", inline: true }, { class: "q-mb-md" }), { disable: (!__VLS_ctx.formData.warehouse_id) })));
var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.selectionMode), options: (__VLS_ctx.selectionModeOptions), color: "primary", inline: true }, { class: "q-mb-md" }), { disable: (!__VLS_ctx.formData.warehouse_id) })], __VLS_functionalComponentArgsRest(__VLS_39), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
if (__VLS_ctx.selectionMode === 'lot' && __VLS_ctx.formData.warehouse_id) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    var __VLS_43 = LotSelector_vue_1.default;
    // @ts-ignore
    var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43(__assign({ 'onLotSelected': {} }, { modelValue: (__VLS_ctx.selectedLotId), warehouseId: (__VLS_ctx.formData.warehouse_id), label: "Chọn lô hàng" })));
    var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([__assign({ 'onLotSelected': {} }, { modelValue: (__VLS_ctx.selectedLotId), warehouseId: (__VLS_ctx.formData.warehouse_id), label: "Chọn lô hàng" })], __VLS_functionalComponentArgsRest(__VLS_44), false));
    var __VLS_48 = void 0;
    var __VLS_49 = ({ lotSelected: {} },
        { onLotSelected: (__VLS_ctx.onLotSelected) });
    var __VLS_46;
    var __VLS_47;
    if (__VLS_ctx.selectedLotId && __VLS_ctx.selectedLot) {
        var __VLS_50 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50(__assign(__assign({ 'onClick': {} }, { color: "secondary", label: "Thêm tất cả cuộn khả dụng", icon: "add" }), { class: "q-mt-md" })));
        var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "secondary", label: "Thêm tất cả cuộn khả dụng", icon: "add" }), { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_51), false));
        var __VLS_55 = void 0;
        var __VLS_56 = ({ click: {} },
            { onClick: (__VLS_ctx.addLotCones) });
        /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
        var __VLS_53;
        var __VLS_54;
    }
}
if (__VLS_ctx.selectionMode === 'scan' && __VLS_ctx.formData.warehouse_id) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    var __VLS_57 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57(__assign({ flat: true, bordered: true }, { class: "q-mb-md" })));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_58), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_62 = __VLS_60.slots.default;
    var __VLS_63 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({}));
    var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_64), false));
    var __VLS_68 = __VLS_66.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_69 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69(__assign({ name: "qr_code_scanner", size: "sm" }, { class: "q-mr-sm" })));
    var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([__assign({ name: "qr_code_scanner", size: "sm" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_70), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-subtitle2" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    var __VLS_74 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
    qSpace;
    // @ts-ignore
    var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({}));
    var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_75), false));
    var __VLS_79 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79(__assign({ 'onClick': {} }, { color: (__VLS_ctx.isScanning ? 'negative' : 'primary'), label: (__VLS_ctx.isScanning ? 'Dừng' : 'Quét'), icon: (__VLS_ctx.isScanning ? 'stop' : 'play_arrow'), dense: true })));
    var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: (__VLS_ctx.isScanning ? 'negative' : 'primary'), label: (__VLS_ctx.isScanning ? 'Dừng' : 'Quét'), icon: (__VLS_ctx.isScanning ? 'stop' : 'play_arrow'), dense: true })], __VLS_functionalComponentArgsRest(__VLS_80), false));
    var __VLS_84 = void 0;
    var __VLS_85 = ({ click: {} },
        { onClick: (__VLS_ctx.toggleScanner) });
    var __VLS_82;
    var __VLS_83;
    if (__VLS_ctx.isScanning) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "scanner-container" }));
        /** @type {__VLS_StyleScopedClasses['scanner-container']} */ ;
        var __VLS_86 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.QrScannerStream} */
        qr_1.QrScannerStream;
        // @ts-ignore
        var __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86(__assign({ 'onDetect': {} }, { active: (__VLS_ctx.isScanning) })));
        var __VLS_88 = __VLS_87.apply(void 0, __spreadArray([__assign({ 'onDetect': {} }, { active: (__VLS_ctx.isScanning) })], __VLS_functionalComponentArgsRest(__VLS_87), false));
        var __VLS_91 = void 0;
        var __VLS_92 = ({ detect: {} },
            { onDetect: (__VLS_ctx.handleScan) });
        var __VLS_89;
        var __VLS_90;
    }
    // @ts-ignore
    [handleBack, currentStep, currentStep, $q, formData, formData, formData, formData, formData, onWarehouseChange, selectionMode, selectionMode, selectionMode, selectionModeOptions, selectedLotId, selectedLotId, onLotSelected, selectedLot, addLotCones, isScanning, isScanning, isScanning, isScanning, isScanning, toggleScanner, handleScan,];
    var __VLS_66;
    // @ts-ignore
    [];
    var __VLS_60;
    var __VLS_93 = AppTextarea_vue_1.default;
    // @ts-ignore
    var __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93({
        modelValue: (__VLS_ctx.manualInput),
        label: "Hoặc nhập thủ công",
        hint: "Mỗi mã trên một dòng",
        rows: "2",
    }));
    var __VLS_95 = __VLS_94.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.manualInput),
            label: "Hoặc nhập thủ công",
            hint: "Mỗi mã trên một dòng",
            rows: "2",
        }], __VLS_functionalComponentArgsRest(__VLS_94), false));
    var __VLS_98 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98(__assign(__assign(__assign({ 'onClick': {} }, { color: "secondary", label: "Thêm", icon: "add" }), { class: "q-mt-sm" }), { disable: (!__VLS_ctx.manualInput.trim()) })));
    var __VLS_100 = __VLS_99.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { color: "secondary", label: "Thêm", icon: "add" }), { class: "q-mt-sm" }), { disable: (!__VLS_ctx.manualInput.trim()) })], __VLS_functionalComponentArgsRest(__VLS_99), false));
    var __VLS_103 = void 0;
    var __VLS_104 = ({ click: {} },
        { onClick: (__VLS_ctx.handleManualAdd) });
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    var __VLS_101;
    var __VLS_102;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_105;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ flat: true, bordered: true }, { class: "selected-list-card" })));
var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "selected-list-card" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
/** @type {__VLS_StyleScopedClasses['selected-list-card']} */ ;
var __VLS_110 = __VLS_108.slots.default;
var __VLS_111;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111(__assign({ class: "q-pb-none" })));
var __VLS_113 = __VLS_112.apply(void 0, __spreadArray([__assign({ class: "q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_112), false));
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_116 = __VLS_114.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
(__VLS_ctx.coneBuffer.length);
var __VLS_117;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117({}));
var __VLS_119 = __VLS_118.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_118), false));
if (__VLS_ctx.coneBuffer.length > 0) {
    var __VLS_122 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "negative", label: "Xóa tất cả", icon: "delete_sweep" })));
    var __VLS_124 = __VLS_123.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "negative", label: "Xóa tất cả", icon: "delete_sweep" })], __VLS_functionalComponentArgsRest(__VLS_123), false));
    var __VLS_127 = void 0;
    var __VLS_128 = ({ click: {} },
        { onClick: (__VLS_ctx.handleClearBuffer) });
    var __VLS_125;
    var __VLS_126;
}
// @ts-ignore
[manualInput, manualInput, handleManualAdd, coneBuffer, coneBuffer, handleClearBuffer,];
var __VLS_114;
var __VLS_129;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129(__assign({ class: "selected-list-container" })));
var __VLS_131 = __VLS_130.apply(void 0, __spreadArray([__assign({ class: "selected-list-container" })], __VLS_functionalComponentArgsRest(__VLS_130), false));
/** @type {__VLS_StyleScopedClasses['selected-list-container']} */ ;
var __VLS_134 = __VLS_132.slots.default;
if (__VLS_ctx.coneBuffer.length > 0) {
    var __VLS_135 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_136 = __VLS_asFunctionalComponent1(__VLS_135, new __VLS_135({
        separator: true,
        dense: true,
    }));
    var __VLS_137 = __VLS_136.apply(void 0, __spreadArray([{
            separator: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_136), false));
    var __VLS_140 = __VLS_138.slots.default;
    var _loop_1 = function (coneId, index) {
        var __VLS_141 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_142 = __VLS_asFunctionalComponent1(__VLS_141, new __VLS_141({
            key: (coneId),
            dense: true,
        }));
        var __VLS_143 = __VLS_142.apply(void 0, __spreadArray([{
                key: (coneId),
                dense: true,
            }], __VLS_functionalComponentArgsRest(__VLS_142), false));
        var __VLS_146 = __VLS_144.slots.default;
        var __VLS_147 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({
            avatar: true,
        }));
        var __VLS_149 = __VLS_148.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_148), false));
        var __VLS_152 = __VLS_150.slots.default;
        var __VLS_153 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_154 = __VLS_asFunctionalComponent1(__VLS_153, new __VLS_153({
            size: "24px",
            color: "warning",
            textColor: "white",
        }));
        var __VLS_155 = __VLS_154.apply(void 0, __spreadArray([{
                size: "24px",
                color: "warning",
                textColor: "white",
            }], __VLS_functionalComponentArgsRest(__VLS_154), false));
        var __VLS_158 = __VLS_156.slots.default;
        (index + 1);
        // @ts-ignore
        [coneBuffer, coneBuffer,];
        // @ts-ignore
        [];
        var __VLS_159 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_160 = __VLS_asFunctionalComponent1(__VLS_159, new __VLS_159({}));
        var __VLS_161 = __VLS_160.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_160), false));
        var __VLS_164 = __VLS_162.slots.default;
        var __VLS_165 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165(__assign({ class: "text-body2" })));
        var __VLS_167 = __VLS_166.apply(void 0, __spreadArray([__assign({ class: "text-body2" })], __VLS_functionalComponentArgsRest(__VLS_166), false));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_170 = __VLS_168.slots.default;
        (coneId);
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        var __VLS_171 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_172 = __VLS_asFunctionalComponent1(__VLS_171, new __VLS_171({
            side: true,
        }));
        var __VLS_173 = __VLS_172.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_172), false));
        var __VLS_176 = __VLS_174.slots.default;
        var __VLS_177 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_178 = __VLS_asFunctionalComponent1(__VLS_177, new __VLS_177(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", color: "negative", size: "sm" })));
        var __VLS_179 = __VLS_178.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", color: "negative", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_178), false));
        var __VLS_182 = void 0;
        var __VLS_183 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.coneBuffer.length > 0))
                        return;
                    __VLS_ctx.removeFromBuffer(coneId);
                    // @ts-ignore
                    [removeFromBuffer,];
                } });
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_156, __VLS_150, __VLS_168, __VLS_162, __VLS_180, __VLS_181, __VLS_174, __VLS_144;
    for (var _i = 0, _h = __VLS_vFor((__VLS_ctx.coneBuffer)); _i < _h.length; _i++) {
        var _j = _h[_i], coneId = _j[0], index = _j[1];
        _loop_1(coneId, index);
    }
    // @ts-ignore
    [];
    var __VLS_138;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey-5 q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_184 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_185 = __VLS_asFunctionalComponent1(__VLS_184, new __VLS_184({
        name: "inbox",
        size: "48px",
    }));
    var __VLS_186 = __VLS_185.apply(void 0, __spreadArray([{
            name: "inbox",
            size: "48px",
        }], __VLS_functionalComponentArgsRest(__VLS_185), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
}
// @ts-ignore
[];
var __VLS_132;
// @ts-ignore
[];
var __VLS_108;
var __VLS_189;
/** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
qStepperNavigation;
// @ts-ignore
var __VLS_190 = __VLS_asFunctionalComponent1(__VLS_189, new __VLS_189({}));
var __VLS_191 = __VLS_190.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_190), false));
var __VLS_194 = __VLS_192.slots.default;
var __VLS_195;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_196 = __VLS_asFunctionalComponent1(__VLS_195, new __VLS_195(__assign({ 'onClick': {} }, { color: "primary", label: "Tiếp theo", disable: (__VLS_ctx.coneBuffer.length === 0) })));
var __VLS_197 = __VLS_196.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Tiếp theo", disable: (__VLS_ctx.coneBuffer.length === 0) })], __VLS_functionalComponentArgsRest(__VLS_196), false));
var __VLS_200;
var __VLS_201 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.goToStep(2);
            // @ts-ignore
            [coneBuffer, goToStep,];
        } });
var __VLS_198;
var __VLS_199;
// @ts-ignore
[];
var __VLS_192;
// @ts-ignore
[];
var __VLS_23;
var __VLS_202;
/** @ts-ignore @type {typeof __VLS_components.qStep | typeof __VLS_components.QStep | typeof __VLS_components.qStep | typeof __VLS_components.QStep} */
qStep;
// @ts-ignore
var __VLS_203 = __VLS_asFunctionalComponent1(__VLS_202, new __VLS_202({
    name: (2),
    title: "Người Nhận",
    icon: "person",
    done: (__VLS_ctx.currentStep > 2),
}));
var __VLS_204 = __VLS_203.apply(void 0, __spreadArray([{
        name: (2),
        title: "Người Nhận",
        icon: "person",
        done: (__VLS_ctx.currentStep > 2),
    }], __VLS_functionalComponentArgsRest(__VLS_203), false));
var __VLS_207 = __VLS_205.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }, { style: {} }));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-body1 q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_208 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_209 = __VLS_asFunctionalComponent1(__VLS_208, new __VLS_208(__assign({ modelValue: (__VLS_ctx.formData.recipient), label: "Tên người nhận / Đơn vị", required: true }, { class: "q-mb-md" })));
var __VLS_210 = __VLS_209.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.formData.recipient), label: "Tên người nhận / Đơn vị", required: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_209), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_213 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_214 = __VLS_asFunctionalComponent1(__VLS_213, new __VLS_213(__assign({ modelValue: (__VLS_ctx.formData.reference_number), label: "Số phiếu xuất / Mã đơn hàng", hint: "Để trống nếu không có" }, { class: "q-mb-md" })));
var __VLS_215 = __VLS_214.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.formData.reference_number), label: "Số phiếu xuất / Mã đơn hàng", hint: "Để trống nếu không có" }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_214), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_218 = AppTextarea_vue_1.default;
// @ts-ignore
var __VLS_219 = __VLS_asFunctionalComponent1(__VLS_218, new __VLS_218({
    modelValue: (__VLS_ctx.formData.notes),
    label: "Ghi chú",
    rows: "2",
}));
var __VLS_220 = __VLS_219.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.notes),
        label: "Ghi chú",
        rows: "2",
    }], __VLS_functionalComponentArgsRest(__VLS_219), false));
var __VLS_223;
/** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
qStepperNavigation;
// @ts-ignore
var __VLS_224 = __VLS_asFunctionalComponent1(__VLS_223, new __VLS_223({}));
var __VLS_225 = __VLS_224.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_224), false));
var __VLS_228 = __VLS_226.slots.default;
var __VLS_229;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_230 = __VLS_asFunctionalComponent1(__VLS_229, new __VLS_229(__assign({ 'onClick': {} }, { color: "primary", label: "Xem lại", disable: (!((_a = __VLS_ctx.formData.recipient) === null || _a === void 0 ? void 0 : _a.trim())) })));
var __VLS_231 = __VLS_230.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Xem lại", disable: (!((_b = __VLS_ctx.formData.recipient) === null || _b === void 0 ? void 0 : _b.trim())) })], __VLS_functionalComponentArgsRest(__VLS_230), false));
var __VLS_234;
var __VLS_235 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.goToStep(3);
            // @ts-ignore
            [currentStep, formData, formData, formData, formData, goToStep,];
        } });
var __VLS_232;
var __VLS_233;
var __VLS_236;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_237 = __VLS_asFunctionalComponent1(__VLS_236, new __VLS_236(__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" })));
var __VLS_238 = __VLS_237.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_237), false));
var __VLS_241;
var __VLS_242 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.goToStep(1);
            // @ts-ignore
            [goToStep,];
        } });
/** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
var __VLS_239;
var __VLS_240;
// @ts-ignore
[];
var __VLS_226;
// @ts-ignore
[];
var __VLS_205;
var __VLS_243;
/** @ts-ignore @type {typeof __VLS_components.qStep | typeof __VLS_components.QStep | typeof __VLS_components.qStep | typeof __VLS_components.QStep} */
qStep;
// @ts-ignore
var __VLS_244 = __VLS_asFunctionalComponent1(__VLS_243, new __VLS_243({
    name: (3),
    title: "Xác Nhận",
    icon: "check_circle",
}));
var __VLS_245 = __VLS_244.apply(void 0, __spreadArray([{
        name: (3),
        title: "Xác Nhận",
        icon: "check_circle",
    }], __VLS_functionalComponentArgsRest(__VLS_244), false));
var __VLS_248 = __VLS_246.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_249;
/** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
qBanner;
// @ts-ignore
var __VLS_250 = __VLS_asFunctionalComponent1(__VLS_249, new __VLS_249(__assign({ class: "bg-warning text-white q-mb-lg" }, { rounded: true })));
var __VLS_251 = __VLS_250.apply(void 0, __spreadArray([__assign({ class: "bg-warning text-white q-mb-lg" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_250), false));
/** @type {__VLS_StyleScopedClasses['bg-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_254 = __VLS_252.slots.default;
{
    var __VLS_255 = __VLS_252.slots.avatar;
    var __VLS_256 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_257 = __VLS_asFunctionalComponent1(__VLS_256, new __VLS_256({
        name: "output",
    }));
    var __VLS_258 = __VLS_257.apply(void 0, __spreadArray([{
            name: "output",
        }], __VLS_functionalComponentArgsRest(__VLS_257), false));
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_252;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_261;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_262 = __VLS_asFunctionalComponent1(__VLS_261, new __VLS_261({
    flat: true,
    bordered: true,
}));
var __VLS_263 = __VLS_262.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_262), false));
var __VLS_266 = __VLS_264.slots.default;
var __VLS_267;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_268 = __VLS_asFunctionalComponent1(__VLS_267, new __VLS_267({}));
var __VLS_269 = __VLS_268.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_268), false));
var __VLS_272 = __VLS_270.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_273;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_274 = __VLS_asFunctionalComponent1(__VLS_273, new __VLS_273({
    dense: true,
}));
var __VLS_275 = __VLS_274.apply(void 0, __spreadArray([{
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_274), false));
var __VLS_278 = __VLS_276.slots.default;
var __VLS_279;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_280 = __VLS_asFunctionalComponent1(__VLS_279, new __VLS_279({}));
var __VLS_281 = __VLS_280.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_280), false));
var __VLS_284 = __VLS_282.slots.default;
var __VLS_285;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_286 = __VLS_asFunctionalComponent1(__VLS_285, new __VLS_285({}));
var __VLS_287 = __VLS_286.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_286), false));
var __VLS_290 = __VLS_288.slots.default;
var __VLS_291;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_292 = __VLS_asFunctionalComponent1(__VLS_291, new __VLS_291({
    caption: true,
}));
var __VLS_293 = __VLS_292.apply(void 0, __spreadArray([{
        caption: true,
    }], __VLS_functionalComponentArgsRest(__VLS_292), false));
var __VLS_296 = __VLS_294.slots.default;
// @ts-ignore
[];
var __VLS_294;
var __VLS_297;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_298 = __VLS_asFunctionalComponent1(__VLS_297, new __VLS_297({}));
var __VLS_299 = __VLS_298.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_298), false));
var __VLS_302 = __VLS_300.slots.default;
(__VLS_ctx.warehouseName);
// @ts-ignore
[warehouseName,];
var __VLS_300;
// @ts-ignore
[];
var __VLS_288;
// @ts-ignore
[];
var __VLS_282;
var __VLS_303;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_304 = __VLS_asFunctionalComponent1(__VLS_303, new __VLS_303({}));
var __VLS_305 = __VLS_304.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_304), false));
var __VLS_308 = __VLS_306.slots.default;
var __VLS_309;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_310 = __VLS_asFunctionalComponent1(__VLS_309, new __VLS_309({}));
var __VLS_311 = __VLS_310.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_310), false));
var __VLS_314 = __VLS_312.slots.default;
var __VLS_315;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_316 = __VLS_asFunctionalComponent1(__VLS_315, new __VLS_315({
    caption: true,
}));
var __VLS_317 = __VLS_316.apply(void 0, __spreadArray([{
        caption: true,
    }], __VLS_functionalComponentArgsRest(__VLS_316), false));
var __VLS_320 = __VLS_318.slots.default;
// @ts-ignore
[];
var __VLS_318;
var __VLS_321;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_322 = __VLS_asFunctionalComponent1(__VLS_321, new __VLS_321(__assign({ class: "text-weight-bold" })));
var __VLS_323 = __VLS_322.apply(void 0, __spreadArray([__assign({ class: "text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_322), false));
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
var __VLS_326 = __VLS_324.slots.default;
(__VLS_ctx.formData.recipient);
// @ts-ignore
[formData,];
var __VLS_324;
// @ts-ignore
[];
var __VLS_312;
// @ts-ignore
[];
var __VLS_306;
if (__VLS_ctx.formData.reference_number) {
    var __VLS_327 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_328 = __VLS_asFunctionalComponent1(__VLS_327, new __VLS_327({}));
    var __VLS_329 = __VLS_328.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_328), false));
    var __VLS_332 = __VLS_330.slots.default;
    var __VLS_333 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_334 = __VLS_asFunctionalComponent1(__VLS_333, new __VLS_333({}));
    var __VLS_335 = __VLS_334.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_334), false));
    var __VLS_338 = __VLS_336.slots.default;
    var __VLS_339 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_340 = __VLS_asFunctionalComponent1(__VLS_339, new __VLS_339({
        caption: true,
    }));
    var __VLS_341 = __VLS_340.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_340), false));
    var __VLS_344 = __VLS_342.slots.default;
    // @ts-ignore
    [formData,];
    var __VLS_342;
    var __VLS_345 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_346 = __VLS_asFunctionalComponent1(__VLS_345, new __VLS_345({}));
    var __VLS_347 = __VLS_346.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_346), false));
    var __VLS_350 = __VLS_348.slots.default;
    (__VLS_ctx.formData.reference_number);
    // @ts-ignore
    [formData,];
    var __VLS_348;
    // @ts-ignore
    [];
    var __VLS_336;
    // @ts-ignore
    [];
    var __VLS_330;
}
if (__VLS_ctx.formData.notes) {
    var __VLS_351 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_352 = __VLS_asFunctionalComponent1(__VLS_351, new __VLS_351({}));
    var __VLS_353 = __VLS_352.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_352), false));
    var __VLS_356 = __VLS_354.slots.default;
    var __VLS_357 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_358 = __VLS_asFunctionalComponent1(__VLS_357, new __VLS_357({}));
    var __VLS_359 = __VLS_358.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_358), false));
    var __VLS_362 = __VLS_360.slots.default;
    var __VLS_363 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_364 = __VLS_asFunctionalComponent1(__VLS_363, new __VLS_363({
        caption: true,
    }));
    var __VLS_365 = __VLS_364.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_364), false));
    var __VLS_368 = __VLS_366.slots.default;
    // @ts-ignore
    [formData,];
    var __VLS_366;
    var __VLS_369 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_370 = __VLS_asFunctionalComponent1(__VLS_369, new __VLS_369({}));
    var __VLS_371 = __VLS_370.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_370), false));
    var __VLS_374 = __VLS_372.slots.default;
    (__VLS_ctx.formData.notes);
    // @ts-ignore
    [formData,];
    var __VLS_372;
    // @ts-ignore
    [];
    var __VLS_360;
    // @ts-ignore
    [];
    var __VLS_354;
}
// @ts-ignore
[];
var __VLS_276;
// @ts-ignore
[];
var __VLS_270;
// @ts-ignore
[];
var __VLS_264;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_375;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_376 = __VLS_asFunctionalComponent1(__VLS_375, new __VLS_375({
    flat: true,
    bordered: true,
}));
var __VLS_377 = __VLS_376.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_376), false));
var __VLS_380 = __VLS_378.slots.default;
var __VLS_381;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_382 = __VLS_asFunctionalComponent1(__VLS_381, new __VLS_381(__assign({ class: "text-center" })));
var __VLS_383 = __VLS_382.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_382), false));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
var __VLS_386 = __VLS_384.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h2 text-warning" }));
/** @type {__VLS_StyleScopedClasses['text-h2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
(__VLS_ctx.coneBuffer.length);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6" }));
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
// @ts-ignore
[coneBuffer,];
var __VLS_384;
// @ts-ignore
[];
var __VLS_378;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_387;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_388 = __VLS_asFunctionalComponent1(__VLS_387, new __VLS_387({
    flat: true,
    bordered: true,
}));
var __VLS_389 = __VLS_388.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_388), false));
var __VLS_392 = __VLS_390.slots.default;
var __VLS_393;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_394 = __VLS_asFunctionalComponent1(__VLS_393, new __VLS_393(__assign({ class: "q-pb-none" })));
var __VLS_395 = __VLS_394.apply(void 0, __spreadArray([__assign({ class: "q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_394), false));
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_398 = __VLS_396.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
// @ts-ignore
[];
var __VLS_396;
var __VLS_399;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_400 = __VLS_asFunctionalComponent1(__VLS_399, new __VLS_399({}));
var __VLS_401 = __VLS_400.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_400), false));
var __VLS_404 = __VLS_402.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cone-preview-grid" }));
/** @type {__VLS_StyleScopedClasses['cone-preview-grid']} */ ;
for (var _k = 0, _l = __VLS_vFor((__VLS_ctx.coneBuffer.slice(0, 20))); _k < _l.length; _k++) {
    var coneId = _l[_k][0];
    var __VLS_405 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_406 = __VLS_asFunctionalComponent1(__VLS_405, new __VLS_405({
        key: (coneId),
        dense: true,
        color: "grey-3",
    }));
    var __VLS_407 = __VLS_406.apply(void 0, __spreadArray([{
            key: (coneId),
            dense: true,
            color: "grey-3",
        }], __VLS_functionalComponentArgsRest(__VLS_406), false));
    var __VLS_410 = __VLS_408.slots.default;
    (coneId);
    // @ts-ignore
    [coneBuffer,];
    var __VLS_408;
    // @ts-ignore
    [];
}
if (__VLS_ctx.coneBuffer.length > 20) {
    var __VLS_411 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_412 = __VLS_asFunctionalComponent1(__VLS_411, new __VLS_411({
        dense: true,
        color: "warning",
        textColor: "white",
    }));
    var __VLS_413 = __VLS_412.apply(void 0, __spreadArray([{
            dense: true,
            color: "warning",
            textColor: "white",
        }], __VLS_functionalComponentArgsRest(__VLS_412), false));
    var __VLS_416 = __VLS_414.slots.default;
    (__VLS_ctx.coneBuffer.length - 20);
    // @ts-ignore
    [coneBuffer, coneBuffer,];
    var __VLS_414;
}
// @ts-ignore
[];
var __VLS_402;
// @ts-ignore
[];
var __VLS_390;
var __VLS_417;
/** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
qStepperNavigation;
// @ts-ignore
var __VLS_418 = __VLS_asFunctionalComponent1(__VLS_417, new __VLS_417({}));
var __VLS_419 = __VLS_418.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_418), false));
var __VLS_422 = __VLS_420.slots.default;
var __VLS_423;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_424 = __VLS_asFunctionalComponent1(__VLS_423, new __VLS_423(__assign({ 'onClick': {} }, { color: "warning", textColor: "white", label: "Xác nhận xuất kho", icon: "output", loading: (__VLS_ctx.loading) })));
var __VLS_425 = __VLS_424.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "warning", textColor: "white", label: "Xác nhận xuất kho", icon: "output", loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_424), false));
var __VLS_428;
var __VLS_429 = ({ click: {} },
    { onClick: (__VLS_ctx.handleConfirm) });
var __VLS_426;
var __VLS_427;
var __VLS_430;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_431 = __VLS_asFunctionalComponent1(__VLS_430, new __VLS_430(__assign(__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" }), { disable: (__VLS_ctx.loading) })));
var __VLS_432 = __VLS_431.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" }), { disable: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_431), false));
var __VLS_435;
var __VLS_436 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.goToStep(2);
            // @ts-ignore
            [goToStep, loading, loading, handleConfirm,];
        } });
/** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
var __VLS_433;
var __VLS_434;
// @ts-ignore
[];
var __VLS_420;
// @ts-ignore
[];
var __VLS_246;
// @ts-ignore
[];
var __VLS_17;
var __VLS_437;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_438 = __VLS_asFunctionalComponent1(__VLS_437, new __VLS_437({
    modelValue: (__VLS_ctx.showSuccessDialog),
    persistent: true,
}));
var __VLS_439 = __VLS_438.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showSuccessDialog),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_438), false));
var __VLS_442 = __VLS_440.slots.default;
var __VLS_443;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_444 = __VLS_asFunctionalComponent1(__VLS_443, new __VLS_443(__assign({ style: {} })));
var __VLS_445 = __VLS_444.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_444), false));
var __VLS_448 = __VLS_446.slots.default;
var __VLS_449;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_450 = __VLS_asFunctionalComponent1(__VLS_449, new __VLS_449(__assign({ class: "text-center q-pt-lg" })));
var __VLS_451 = __VLS_450.apply(void 0, __spreadArray([__assign({ class: "text-center q-pt-lg" })], __VLS_functionalComponentArgsRest(__VLS_450), false));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pt-lg']} */ ;
var __VLS_454 = __VLS_452.slots.default;
var __VLS_455;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_456 = __VLS_asFunctionalComponent1(__VLS_455, new __VLS_455({
    name: "check_circle",
    color: "positive",
    size: "64px",
}));
var __VLS_457 = __VLS_456.apply(void 0, __spreadArray([{
        name: "check_circle",
        color: "positive",
        size: "64px",
    }], __VLS_functionalComponentArgsRest(__VLS_456), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 q-mt-md" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6 q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
((_c = __VLS_ctx.lastResult) === null || _c === void 0 ? void 0 : _c.cone_count);
(__VLS_ctx.formData.recipient);
if ((_d = __VLS_ctx.lastResult) === null || _d === void 0 ? void 0 : _d.transaction_id) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mt-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    (__VLS_ctx.lastResult.transaction_id);
}
// @ts-ignore
[formData, showSuccessDialog, lastResult, lastResult, lastResult,];
var __VLS_452;
var __VLS_460;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_461 = __VLS_asFunctionalComponent1(__VLS_460, new __VLS_460(__assign({ align: "center" }, { class: "q-pb-lg" })));
var __VLS_462 = __VLS_461.apply(void 0, __spreadArray([__assign({ align: "center" }, { class: "q-pb-lg" })], __VLS_functionalComponentArgsRest(__VLS_461), false));
/** @type {__VLS_StyleScopedClasses['q-pb-lg']} */ ;
var __VLS_465 = __VLS_463.slots.default;
var __VLS_466;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_467 = __VLS_asFunctionalComponent1(__VLS_466, new __VLS_466(__assign({ 'onClick': {} }, { color: "primary", label: "In phiếu xuất", icon: "print" })));
var __VLS_468 = __VLS_467.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "In phiếu xuất", icon: "print" })], __VLS_functionalComponentArgsRest(__VLS_467), false));
var __VLS_471;
var __VLS_472 = ({ click: {} },
    { onClick: (__VLS_ctx.handlePrint) });
var __VLS_469;
var __VLS_470;
var __VLS_473;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_474 = __VLS_asFunctionalComponent1(__VLS_473, new __VLS_473(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Xuất tiếp" })));
var __VLS_475 = __VLS_474.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Xuất tiếp" })], __VLS_functionalComponentArgsRest(__VLS_474), false));
var __VLS_478;
var __VLS_479 = ({ click: {} },
    { onClick: (__VLS_ctx.handleNewBatch) });
var __VLS_476;
var __VLS_477;
var __VLS_480;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_481 = __VLS_asFunctionalComponent1(__VLS_480, new __VLS_480(__assign({ 'onClick': {} }, { flat: true, color: "grey", label: "Về trang chủ" })));
var __VLS_482 = __VLS_481.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, color: "grey", label: "Về trang chủ" })], __VLS_functionalComponentArgsRest(__VLS_481), false));
var __VLS_485;
var __VLS_486 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$router.push('/thread/lots');
            // @ts-ignore
            [handlePrint, handleNewBatch, $router,];
        } });
var __VLS_483;
var __VLS_484;
// @ts-ignore
[];
var __VLS_463;
// @ts-ignore
[];
var __VLS_446;
// @ts-ignore
[];
var __VLS_440;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
