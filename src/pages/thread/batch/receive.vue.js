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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var vue_router_1 = require("vue-router");
var quasar_1 = require("quasar");
var useBatchOperations_1 = require("@/composables/useBatchOperations");
var composables_1 = require("@/composables");
var qr_1 = require("@/components/qr");
var AppWarehouseSelect_vue_1 = require("@/components/ui/inputs/AppWarehouseSelect.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppTextarea_vue_1 = require("@/components/ui/inputs/AppTextarea.vue");
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var LotSelector_vue_1 = require("@/components/thread/LotSelector.vue");
var SupplierSelector_vue_1 = require("@/components/ui/inputs/SupplierSelector.vue");
var router = (0, vue_router_1.useRouter)();
var $q = (0, quasar_1.useQuasar)();
var confirm = (0, composables_1.useConfirm)().confirm;
var _c = (0, composables_1.useThreadTypes)(), threadTypes = _c.threadTypes, fetchThreadTypes = _c.fetchThreadTypes;
var _d = (0, composables_1.useWarehouses)(), warehouses = _d.warehouses, fetchWarehouses = _d.fetchWarehouses;
var _e = (0, useBatchOperations_1.useBatchOperations)(), coneBuffer = _e.coneBuffer, bufferCount = _e.bufferCount, hasBuffer = _e.hasBuffer, loading = _e.loading, lastResult = _e.lastResult, addToBuffer = _e.addToBuffer, addMultipleToBuffer = _e.addMultipleToBuffer, parseInput = _e.parseInput, removeFromBuffer = _e.removeFromBuffer, clearBuffer = _e.clearBuffer, batchReceive = _e.batchReceive;
// State
var stepperRef = (0, vue_1.ref)();
var currentStep = (0, vue_1.ref)(1);
var lotMode = (0, vue_1.ref)('new');
var isScanning = (0, vue_1.ref)(false);
var manualInput = (0, vue_1.ref)('');
var showSuccessDialog = (0, vue_1.ref)(false);
var selectedLot = (0, vue_1.ref)(null);
var selectedSupplier = (0, vue_1.ref)(null);
var selectedSupplierName = (0, vue_1.computed)(function () { var _a; return ((_a = selectedSupplier.value) === null || _a === void 0 ? void 0 : _a.name) || '-'; });
var formData = (0, vue_1.ref)({
    warehouse_id: null,
    lot_id: null,
    lot_number: '',
    thread_type_id: null,
    supplier_id: null,
    production_date: null,
    expiry_date: null,
    notes: ''
});
// Options
var lotModeOptions = [
    { label: 'Tạo lô mới', value: 'new' },
    { label: 'Chọn lô có sẵn', value: 'existing' }
];
var threadTypeOptions = (0, vue_1.computed)(function () {
    return threadTypes.value.map(function (t) { return ({
        label: "".concat(t.name, " (").concat(t.code, ")"),
        value: t.id
    }); });
});
// Computed
var isLotStepValid = (0, vue_1.computed)(function () {
    if (lotMode.value === 'existing') {
        return !!formData.value.lot_id;
    }
    return !!formData.value.lot_number && !!formData.value.thread_type_id;
});
var selectedWarehouseName = (0, vue_1.computed)(function () {
    var w = warehouses.value.find(function (w) { return w.id === formData.value.warehouse_id; });
    return (w === null || w === void 0 ? void 0 : w.name) || '-';
});
var selectedThreadTypeName = (0, vue_1.computed)(function () {
    var t = threadTypes.value.find(function (t) { return t.id === formData.value.thread_type_id; });
    return (t === null || t === void 0 ? void 0 : t.name) || '-';
});
var lotDisplayName = (0, vue_1.computed)(function () {
    if (lotMode.value === 'existing' && selectedLot.value) {
        return selectedLot.value.lot_number;
    }
    return formData.value.lot_number || '-';
});
// Methods
function goToStep(step) {
    currentStep.value = step;
}
function onLotSelected(lot) {
    selectedLot.value = lot;
}
function toggleScanner() {
    isScanning.value = !isScanning.value;
}
function handleScan(codes) {
    var firstCode = codes[0];
    if (!firstCode)
        return;
    addToBuffer(firstCode.rawValue);
}
function handleManualAdd() {
    var ids = parseInput(manualInput.value);
    var added = addMultipleToBuffer(ids);
    if (added > 0) {
        manualInput.value = '';
    }
}
function handleClearBuffer() {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirm({
                        title: 'Xóa tất cả?',
                        message: 'Bạn có chắc muốn xóa tất cả cuộn đã quét?',
                        type: 'warning'
                    })];
                case 1:
                    confirmed = _a.sent();
                    if (confirmed) {
                        clearBuffer();
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function handleConfirm() {
    return __awaiter(this, void 0, void 0, function () {
        var request, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    request = {
                        warehouse_id: formData.value.warehouse_id,
                        thread_type_id: formData.value.thread_type_id
                    };
                    if (lotMode.value === 'existing') {
                        request.lot_id = formData.value.lot_id;
                        // Get thread_type_id from selected lot
                        if (selectedLot.value) {
                            request.thread_type_id = selectedLot.value.thread_type_id;
                        }
                    }
                    else {
                        request.lot_number = formData.value.lot_number;
                        if (formData.value.production_date)
                            request.production_date = formData.value.production_date;
                        if (formData.value.expiry_date)
                            request.expiry_date = formData.value.expiry_date;
                        if (formData.value.supplier_id)
                            request.supplier_id = formData.value.supplier_id;
                        if (formData.value.notes)
                            request.notes = formData.value.notes;
                    }
                    return [4 /*yield*/, batchReceive(request)];
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
function handleNewBatch() {
    showSuccessDialog.value = false;
    currentStep.value = 3;
    // Keep warehouse and lot selection
}
function handleBack() {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!hasBuffer.value) return [3 /*break*/, 2];
                    return [4 /*yield*/, confirm({
                            title: 'Rời trang?',
                            message: 'Danh sách cuộn đã quét sẽ bị mất. Bạn có chắc?',
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
            case 0: return [4 /*yield*/, Promise.all([fetchThreadTypes(), fetchWarehouses()])];
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
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign(__assign({ ref: "stepperRef", modelValue: (__VLS_ctx.currentStep), color: "primary", animated: true, flat: true, bordered: true }, { class: "batch-stepper" }), { vertical: (__VLS_ctx.$q.screen.lt.sm) })));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign(__assign({ ref: "stepperRef", modelValue: (__VLS_ctx.currentStep), color: "primary", animated: true, flat: true, bordered: true }, { class: "batch-stepper" }), { vertical: (__VLS_ctx.$q.screen.lt.sm) })], __VLS_functionalComponentArgsRest(__VLS_15), false));
var __VLS_19 = {};
/** @type {__VLS_StyleScopedClasses['batch-stepper']} */ ;
var __VLS_21 = __VLS_17.slots.default;
var __VLS_22;
/** @ts-ignore @type {typeof __VLS_components.qStep | typeof __VLS_components.QStep | typeof __VLS_components.qStep | typeof __VLS_components.QStep} */
qStep;
// @ts-ignore
var __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({
    name: (1),
    title: "Chọn Kho",
    icon: "warehouse",
    done: (__VLS_ctx.currentStep > 1),
}));
var __VLS_24 = __VLS_23.apply(void 0, __spreadArray([{
        name: (1),
        title: "Chọn Kho",
        icon: "warehouse",
        done: (__VLS_ctx.currentStep > 1),
    }], __VLS_functionalComponentArgsRest(__VLS_23), false));
var __VLS_27 = __VLS_25.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-body1 q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_28 = AppWarehouseSelect_vue_1.default;
// @ts-ignore
var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign(__assign({ modelValue: (__VLS_ctx.formData.warehouse_id), label: "Kho nhập hàng", required: true }, { class: "q-mb-md" }), { style: {} })));
var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.formData.warehouse_id), label: "Kho nhập hàng", required: true }, { class: "q-mb-md" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_29), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_33;
/** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
qStepperNavigation;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({}));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_34), false));
var __VLS_38 = __VLS_36.slots.default;
var __VLS_39;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39(__assign({ 'onClick': {} }, { color: "primary", label: "Tiếp theo", disable: (!__VLS_ctx.formData.warehouse_id) })));
var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Tiếp theo", disable: (!__VLS_ctx.formData.warehouse_id) })], __VLS_functionalComponentArgsRest(__VLS_40), false));
var __VLS_44;
var __VLS_45 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.goToStep(2);
            // @ts-ignore
            [handleBack, currentStep, currentStep, $q, formData, formData, goToStep,];
        } });
var __VLS_42;
var __VLS_43;
// @ts-ignore
[];
var __VLS_36;
// @ts-ignore
[];
var __VLS_25;
var __VLS_46;
/** @ts-ignore @type {typeof __VLS_components.qStep | typeof __VLS_components.QStep | typeof __VLS_components.qStep | typeof __VLS_components.QStep} */
qStep;
// @ts-ignore
var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
    name: (2),
    title: "Lô Hàng",
    icon: "inventory_2",
    done: (__VLS_ctx.currentStep > 2),
}));
var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([{
        name: (2),
        title: "Lô Hàng",
        icon: "inventory_2",
        done: (__VLS_ctx.currentStep > 2),
    }], __VLS_functionalComponentArgsRest(__VLS_47), false));
var __VLS_51 = __VLS_49.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_52;
/** @ts-ignore @type {typeof __VLS_components.qOptionGroup | typeof __VLS_components.QOptionGroup} */
qOptionGroup;
// @ts-ignore
var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52(__assign({ modelValue: (__VLS_ctx.lotMode), options: (__VLS_ctx.lotModeOptions), color: "primary", inline: true }, { class: "q-mb-lg" })));
var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.lotMode), options: (__VLS_ctx.lotModeOptions), color: "primary", inline: true }, { class: "q-mb-lg" })], __VLS_functionalComponentArgsRest(__VLS_53), false));
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
if (__VLS_ctx.lotMode === 'existing') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mb-md" }, { style: {} }));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_57 = LotSelector_vue_1.default;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57(__assign({ 'onLotSelected': {} }, { modelValue: (__VLS_ctx.formData.lot_id), warehouseId: (__VLS_ctx.formData.warehouse_id), label: "Chọn lô có sẵn", required: true })));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([__assign({ 'onLotSelected': {} }, { modelValue: (__VLS_ctx.formData.lot_id), warehouseId: (__VLS_ctx.formData.warehouse_id), label: "Chọn lô có sẵn", required: true })], __VLS_functionalComponentArgsRest(__VLS_58), false));
    var __VLS_62 = void 0;
    var __VLS_63 = ({ lotSelected: {} },
        { onLotSelected: (__VLS_ctx.onLotSelected) });
    var __VLS_60;
    var __VLS_61;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }, { style: {} }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    var __VLS_64 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
        modelValue: (__VLS_ctx.formData.lot_number),
        label: "Mã lô mới",
        required: true,
        hint: "Mã định danh duy nhất",
    }));
    var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.formData.lot_number),
            label: "Mã lô mới",
            required: true,
            hint: "Mã định danh duy nhất",
        }], __VLS_functionalComponentArgsRest(__VLS_65), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    var __VLS_69 = AppSelect_vue_1.default;
    // @ts-ignore
    var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
        modelValue: (__VLS_ctx.formData.thread_type_id),
        options: (__VLS_ctx.threadTypeOptions),
        label: "Loại chỉ",
        required: true,
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
    }));
    var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.formData.thread_type_id),
            options: (__VLS_ctx.threadTypeOptions),
            label: "Loại chỉ",
            required: true,
            emitValue: true,
            mapOptions: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
        }], __VLS_functionalComponentArgsRest(__VLS_70), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    var __VLS_74 = SupplierSelector_vue_1.default;
    // @ts-ignore
    var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74(__assign({ 'onUpdate:supplierData': {} }, { modelValue: (__VLS_ctx.formData.supplier_id), label: "Nhà cung cấp", clearable: true })));
    var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([__assign({ 'onUpdate:supplierData': {} }, { modelValue: (__VLS_ctx.formData.supplier_id), label: "Nhà cung cấp", clearable: true })], __VLS_functionalComponentArgsRest(__VLS_75), false));
    var __VLS_79 = void 0;
    var __VLS_80 = ({ 'update:supplierData': {} },
        { 'onUpdate:supplierData': (function (s) { return __VLS_ctx.selectedSupplier = s; }) });
    var __VLS_77;
    var __VLS_78;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    var __VLS_81 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_82 = __VLS_asFunctionalComponent1(__VLS_81, new __VLS_81({
        modelValue: (__VLS_ctx.formData.production_date),
        label: "Ngày sản xuất",
    }));
    var __VLS_83 = __VLS_82.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.formData.production_date),
            label: "Ngày sản xuất",
        }], __VLS_functionalComponentArgsRest(__VLS_82), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    var __VLS_86 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
        modelValue: (__VLS_ctx.formData.expiry_date),
        label: "Ngày hết hạn",
    }));
    var __VLS_88 = __VLS_87.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.formData.expiry_date),
            label: "Ngày hết hạn",
        }], __VLS_functionalComponentArgsRest(__VLS_87), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    var __VLS_91 = AppTextarea_vue_1.default;
    // @ts-ignore
    var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91({
        modelValue: (__VLS_ctx.formData.notes),
        label: "Ghi chú",
        rows: "2",
    }));
    var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.formData.notes),
            label: "Ghi chú",
            rows: "2",
        }], __VLS_functionalComponentArgsRest(__VLS_92), false));
}
var __VLS_96;
/** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
qStepperNavigation;
// @ts-ignore
var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({}));
var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_97), false));
var __VLS_101 = __VLS_99.slots.default;
var __VLS_102;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102(__assign({ 'onClick': {} }, { color: "primary", label: "Tiếp theo", disable: (!__VLS_ctx.isLotStepValid) })));
var __VLS_104 = __VLS_103.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Tiếp theo", disable: (!__VLS_ctx.isLotStepValid) })], __VLS_functionalComponentArgsRest(__VLS_103), false));
var __VLS_107;
var __VLS_108 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.goToStep(3);
            // @ts-ignore
            [currentStep, formData, formData, formData, formData, formData, formData, formData, formData, goToStep, lotMode, lotMode, lotModeOptions, onLotSelected, threadTypeOptions, selectedSupplier, isLotStepValid,];
        } });
var __VLS_105;
var __VLS_106;
var __VLS_109;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109(__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" })));
var __VLS_111 = __VLS_110.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_110), false));
var __VLS_114;
var __VLS_115 = ({ click: {} },
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
var __VLS_112;
var __VLS_113;
// @ts-ignore
[];
var __VLS_99;
// @ts-ignore
[];
var __VLS_49;
var __VLS_116;
/** @ts-ignore @type {typeof __VLS_components.qStep | typeof __VLS_components.QStep | typeof __VLS_components.qStep | typeof __VLS_components.QStep} */
qStep;
// @ts-ignore
var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({
    name: (3),
    title: "Quét Cuộn",
    icon: "qr_code_scanner",
    done: (__VLS_ctx.currentStep > 3),
}));
var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([{
        name: (3),
        title: "Quét Cuộn",
        icon: "qr_code_scanner",
        done: (__VLS_ctx.currentStep > 3),
    }], __VLS_functionalComponentArgsRest(__VLS_117), false));
var __VLS_121 = __VLS_119.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_122;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122(__assign({ flat: true, bordered: true }, { class: "q-mb-md" })));
var __VLS_124 = __VLS_123.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_123), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_127 = __VLS_125.slots.default;
var __VLS_128;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({}));
var __VLS_130 = __VLS_129.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_129), false));
var __VLS_133 = __VLS_131.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_134;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134(__assign({ name: "qr_code_scanner", size: "sm" }, { class: "q-mr-sm" })));
var __VLS_136 = __VLS_135.apply(void 0, __spreadArray([__assign({ name: "qr_code_scanner", size: "sm" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_135), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
var __VLS_139;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_140 = __VLS_asFunctionalComponent1(__VLS_139, new __VLS_139({}));
var __VLS_141 = __VLS_140.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_140), false));
var __VLS_144;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_145 = __VLS_asFunctionalComponent1(__VLS_144, new __VLS_144(__assign({ 'onClick': {} }, { color: (__VLS_ctx.isScanning ? 'negative' : 'primary'), label: (__VLS_ctx.isScanning ? 'Dừng' : 'Bắt đầu'), icon: (__VLS_ctx.isScanning ? 'stop' : 'play_arrow'), dense: true })));
var __VLS_146 = __VLS_145.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: (__VLS_ctx.isScanning ? 'negative' : 'primary'), label: (__VLS_ctx.isScanning ? 'Dừng' : 'Bắt đầu'), icon: (__VLS_ctx.isScanning ? 'stop' : 'play_arrow'), dense: true })], __VLS_functionalComponentArgsRest(__VLS_145), false));
var __VLS_149;
var __VLS_150 = ({ click: {} },
    { onClick: (__VLS_ctx.toggleScanner) });
var __VLS_147;
var __VLS_148;
if (__VLS_ctx.isScanning) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "scanner-container" }));
    /** @type {__VLS_StyleScopedClasses['scanner-container']} */ ;
    var __VLS_151 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.QrScannerStream} */
    qr_1.QrScannerStream;
    // @ts-ignore
    var __VLS_152 = __VLS_asFunctionalComponent1(__VLS_151, new __VLS_151(__assign({ 'onDetect': {} }, { active: (__VLS_ctx.isScanning) })));
    var __VLS_153 = __VLS_152.apply(void 0, __spreadArray([__assign({ 'onDetect': {} }, { active: (__VLS_ctx.isScanning) })], __VLS_functionalComponentArgsRest(__VLS_152), false));
    var __VLS_156 = void 0;
    var __VLS_157 = ({ detect: {} },
        { onDetect: (__VLS_ctx.handleScan) });
    var __VLS_154;
    var __VLS_155;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "scanner-placeholder bg-grey-2 rounded-borders" }));
    /** @type {__VLS_StyleScopedClasses['scanner-placeholder']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    var __VLS_158 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158({
        name: "qr_code_2",
        size: "64px",
        color: "grey-5",
    }));
    var __VLS_160 = __VLS_159.apply(void 0, __spreadArray([{
            name: "qr_code_2",
            size: "64px",
            color: "grey-5",
        }], __VLS_functionalComponentArgsRest(__VLS_159), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6 q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
}
// @ts-ignore
[currentStep, isScanning, isScanning, isScanning, isScanning, isScanning, toggleScanner, handleScan,];
var __VLS_131;
// @ts-ignore
[];
var __VLS_125;
var __VLS_163;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_164 = __VLS_asFunctionalComponent1(__VLS_163, new __VLS_163({
    flat: true,
    bordered: true,
}));
var __VLS_165 = __VLS_164.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_164), false));
var __VLS_168 = __VLS_166.slots.default;
var __VLS_169;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169({}));
var __VLS_171 = __VLS_170.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_170), false));
var __VLS_174 = __VLS_172.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_175;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_176 = __VLS_asFunctionalComponent1(__VLS_175, new __VLS_175(__assign({ name: "keyboard", size: "sm" }, { class: "q-mr-sm" })));
var __VLS_177 = __VLS_176.apply(void 0, __spreadArray([__assign({ name: "keyboard", size: "sm" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_176), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
var __VLS_180 = AppTextarea_vue_1.default;
// @ts-ignore
var __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180({
    modelValue: (__VLS_ctx.manualInput),
    label: "Nhập mã cuộn",
    hint: "Mỗi mã trên một dòng hoặc ngăn cách bằng dấu phẩy",
    rows: "3",
}));
var __VLS_182 = __VLS_181.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.manualInput),
        label: "Nhập mã cuộn",
        hint: "Mỗi mã trên một dòng hoặc ngăn cách bằng dấu phẩy",
        rows: "3",
    }], __VLS_functionalComponentArgsRest(__VLS_181), false));
var __VLS_185;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_186 = __VLS_asFunctionalComponent1(__VLS_185, new __VLS_185(__assign(__assign(__assign({ 'onClick': {} }, { color: "secondary", label: "Thêm vào danh sách", icon: "add" }), { class: "q-mt-sm" }), { disable: (!__VLS_ctx.manualInput.trim()) })));
var __VLS_187 = __VLS_186.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { color: "secondary", label: "Thêm vào danh sách", icon: "add" }), { class: "q-mt-sm" }), { disable: (!__VLS_ctx.manualInput.trim()) })], __VLS_functionalComponentArgsRest(__VLS_186), false));
var __VLS_190;
var __VLS_191 = ({ click: {} },
    { onClick: (__VLS_ctx.handleManualAdd) });
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
var __VLS_188;
var __VLS_189;
// @ts-ignore
[manualInput, manualInput, handleManualAdd,];
var __VLS_172;
// @ts-ignore
[];
var __VLS_166;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_192;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_193 = __VLS_asFunctionalComponent1(__VLS_192, new __VLS_192(__assign({ flat: true, bordered: true }, { class: "scanned-list-card" })));
var __VLS_194 = __VLS_193.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "scanned-list-card" })], __VLS_functionalComponentArgsRest(__VLS_193), false));
/** @type {__VLS_StyleScopedClasses['scanned-list-card']} */ ;
var __VLS_197 = __VLS_195.slots.default;
var __VLS_198;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_199 = __VLS_asFunctionalComponent1(__VLS_198, new __VLS_198(__assign({ class: "q-pb-none" })));
var __VLS_200 = __VLS_199.apply(void 0, __spreadArray([__assign({ class: "q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_199), false));
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_203 = __VLS_201.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
(__VLS_ctx.bufferCount);
var __VLS_204;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_205 = __VLS_asFunctionalComponent1(__VLS_204, new __VLS_204({}));
var __VLS_206 = __VLS_205.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_205), false));
if (__VLS_ctx.hasBuffer) {
    var __VLS_209 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_210 = __VLS_asFunctionalComponent1(__VLS_209, new __VLS_209(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "negative", label: "Xóa tất cả", icon: "delete_sweep" })));
    var __VLS_211 = __VLS_210.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "negative", label: "Xóa tất cả", icon: "delete_sweep" })], __VLS_functionalComponentArgsRest(__VLS_210), false));
    var __VLS_214 = void 0;
    var __VLS_215 = ({ click: {} },
        { onClick: (__VLS_ctx.handleClearBuffer) });
    var __VLS_212;
    var __VLS_213;
}
// @ts-ignore
[bufferCount, hasBuffer, handleClearBuffer,];
var __VLS_201;
var __VLS_216;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_217 = __VLS_asFunctionalComponent1(__VLS_216, new __VLS_216(__assign({ class: "scanned-list-container" })));
var __VLS_218 = __VLS_217.apply(void 0, __spreadArray([__assign({ class: "scanned-list-container" })], __VLS_functionalComponentArgsRest(__VLS_217), false));
/** @type {__VLS_StyleScopedClasses['scanned-list-container']} */ ;
var __VLS_221 = __VLS_219.slots.default;
if (__VLS_ctx.hasBuffer) {
    var __VLS_222 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_223 = __VLS_asFunctionalComponent1(__VLS_222, new __VLS_222({
        separator: true,
        dense: true,
    }));
    var __VLS_224 = __VLS_223.apply(void 0, __spreadArray([{
            separator: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_223), false));
    var __VLS_227 = __VLS_225.slots.default;
    var _loop_1 = function (coneId, index) {
        var __VLS_228 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_229 = __VLS_asFunctionalComponent1(__VLS_228, new __VLS_228({
            key: (coneId),
            dense: true,
        }));
        var __VLS_230 = __VLS_229.apply(void 0, __spreadArray([{
                key: (coneId),
                dense: true,
            }], __VLS_functionalComponentArgsRest(__VLS_229), false));
        var __VLS_233 = __VLS_231.slots.default;
        var __VLS_234 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_235 = __VLS_asFunctionalComponent1(__VLS_234, new __VLS_234({
            avatar: true,
        }));
        var __VLS_236 = __VLS_235.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_235), false));
        var __VLS_239 = __VLS_237.slots.default;
        var __VLS_240 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_241 = __VLS_asFunctionalComponent1(__VLS_240, new __VLS_240({
            size: "24px",
            color: "primary",
            textColor: "white",
        }));
        var __VLS_242 = __VLS_241.apply(void 0, __spreadArray([{
                size: "24px",
                color: "primary",
                textColor: "white",
            }], __VLS_functionalComponentArgsRest(__VLS_241), false));
        var __VLS_245 = __VLS_243.slots.default;
        (index + 1);
        // @ts-ignore
        [hasBuffer, coneBuffer,];
        // @ts-ignore
        [];
        var __VLS_246 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_247 = __VLS_asFunctionalComponent1(__VLS_246, new __VLS_246({}));
        var __VLS_248 = __VLS_247.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_247), false));
        var __VLS_251 = __VLS_249.slots.default;
        var __VLS_252 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_253 = __VLS_asFunctionalComponent1(__VLS_252, new __VLS_252(__assign({ class: "text-body2 text-weight-medium" })));
        var __VLS_254 = __VLS_253.apply(void 0, __spreadArray([__assign({ class: "text-body2 text-weight-medium" })], __VLS_functionalComponentArgsRest(__VLS_253), false));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        var __VLS_257 = __VLS_255.slots.default;
        (coneId);
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        var __VLS_258 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_259 = __VLS_asFunctionalComponent1(__VLS_258, new __VLS_258({
            side: true,
        }));
        var __VLS_260 = __VLS_259.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_259), false));
        var __VLS_263 = __VLS_261.slots.default;
        var __VLS_264 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_265 = __VLS_asFunctionalComponent1(__VLS_264, new __VLS_264(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", color: "negative", size: "sm" })));
        var __VLS_266 = __VLS_265.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", color: "negative", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_265), false));
        var __VLS_269 = void 0;
        var __VLS_270 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.hasBuffer))
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
    var __VLS_243, __VLS_237, __VLS_255, __VLS_249, __VLS_267, __VLS_268, __VLS_261, __VLS_231;
    for (var _i = 0, _f = __VLS_vFor((__VLS_ctx.coneBuffer)); _i < _f.length; _i++) {
        var _g = _f[_i], coneId = _g[0], index = _g[1];
        _loop_1(coneId, index);
    }
    // @ts-ignore
    [];
    var __VLS_225;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey-5 q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_271 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_272 = __VLS_asFunctionalComponent1(__VLS_271, new __VLS_271({
        name: "inbox",
        size: "48px",
    }));
    var __VLS_273 = __VLS_272.apply(void 0, __spreadArray([{
            name: "inbox",
            size: "48px",
        }], __VLS_functionalComponentArgsRest(__VLS_272), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
}
// @ts-ignore
[];
var __VLS_219;
// @ts-ignore
[];
var __VLS_195;
var __VLS_276;
/** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
qStepperNavigation;
// @ts-ignore
var __VLS_277 = __VLS_asFunctionalComponent1(__VLS_276, new __VLS_276({}));
var __VLS_278 = __VLS_277.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_277), false));
var __VLS_281 = __VLS_279.slots.default;
var __VLS_282;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_283 = __VLS_asFunctionalComponent1(__VLS_282, new __VLS_282(__assign({ 'onClick': {} }, { color: "primary", label: "Xem lại", disable: (!__VLS_ctx.hasBuffer) })));
var __VLS_284 = __VLS_283.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Xem lại", disable: (!__VLS_ctx.hasBuffer) })], __VLS_functionalComponentArgsRest(__VLS_283), false));
var __VLS_287;
var __VLS_288 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.goToStep(4);
            // @ts-ignore
            [goToStep, hasBuffer,];
        } });
var __VLS_285;
var __VLS_286;
var __VLS_289;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_290 = __VLS_asFunctionalComponent1(__VLS_289, new __VLS_289(__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" })));
var __VLS_291 = __VLS_290.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_290), false));
var __VLS_294;
var __VLS_295 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.goToStep(2);
            // @ts-ignore
            [goToStep,];
        } });
/** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
var __VLS_292;
var __VLS_293;
// @ts-ignore
[];
var __VLS_279;
// @ts-ignore
[];
var __VLS_119;
var __VLS_296;
/** @ts-ignore @type {typeof __VLS_components.qStep | typeof __VLS_components.QStep | typeof __VLS_components.qStep | typeof __VLS_components.QStep} */
qStep;
// @ts-ignore
var __VLS_297 = __VLS_asFunctionalComponent1(__VLS_296, new __VLS_296({
    name: (4),
    title: "Xác Nhận",
    icon: "check_circle",
}));
var __VLS_298 = __VLS_297.apply(void 0, __spreadArray([{
        name: (4),
        title: "Xác Nhận",
        icon: "check_circle",
    }], __VLS_functionalComponentArgsRest(__VLS_297), false));
var __VLS_301 = __VLS_299.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_302;
/** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
qBanner;
// @ts-ignore
var __VLS_303 = __VLS_asFunctionalComponent1(__VLS_302, new __VLS_302(__assign({ class: "bg-positive text-white q-mb-lg" }, { rounded: true })));
var __VLS_304 = __VLS_303.apply(void 0, __spreadArray([__assign({ class: "bg-positive text-white q-mb-lg" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_303), false));
/** @type {__VLS_StyleScopedClasses['bg-positive']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_307 = __VLS_305.slots.default;
{
    var __VLS_308 = __VLS_305.slots.avatar;
    var __VLS_309 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_310 = __VLS_asFunctionalComponent1(__VLS_309, new __VLS_309({
        name: "info",
    }));
    var __VLS_311 = __VLS_310.apply(void 0, __spreadArray([{
            name: "info",
        }], __VLS_functionalComponentArgsRest(__VLS_310), false));
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_305;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_314;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_315 = __VLS_asFunctionalComponent1(__VLS_314, new __VLS_314({
    flat: true,
    bordered: true,
}));
var __VLS_316 = __VLS_315.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_315), false));
var __VLS_319 = __VLS_317.slots.default;
var __VLS_320;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_321 = __VLS_asFunctionalComponent1(__VLS_320, new __VLS_320({}));
var __VLS_322 = __VLS_321.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_321), false));
var __VLS_325 = __VLS_323.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_326;
/** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
qList;
// @ts-ignore
var __VLS_327 = __VLS_asFunctionalComponent1(__VLS_326, new __VLS_326({
    dense: true,
}));
var __VLS_328 = __VLS_327.apply(void 0, __spreadArray([{
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_327), false));
var __VLS_331 = __VLS_329.slots.default;
var __VLS_332;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_333 = __VLS_asFunctionalComponent1(__VLS_332, new __VLS_332({}));
var __VLS_334 = __VLS_333.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_333), false));
var __VLS_337 = __VLS_335.slots.default;
var __VLS_338;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_339 = __VLS_asFunctionalComponent1(__VLS_338, new __VLS_338({}));
var __VLS_340 = __VLS_339.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_339), false));
var __VLS_343 = __VLS_341.slots.default;
var __VLS_344;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_345 = __VLS_asFunctionalComponent1(__VLS_344, new __VLS_344({
    caption: true,
}));
var __VLS_346 = __VLS_345.apply(void 0, __spreadArray([{
        caption: true,
    }], __VLS_functionalComponentArgsRest(__VLS_345), false));
var __VLS_349 = __VLS_347.slots.default;
// @ts-ignore
[];
var __VLS_347;
var __VLS_350;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_351 = __VLS_asFunctionalComponent1(__VLS_350, new __VLS_350({}));
var __VLS_352 = __VLS_351.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_351), false));
var __VLS_355 = __VLS_353.slots.default;
(__VLS_ctx.selectedWarehouseName);
// @ts-ignore
[selectedWarehouseName,];
var __VLS_353;
// @ts-ignore
[];
var __VLS_341;
// @ts-ignore
[];
var __VLS_335;
var __VLS_356;
/** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
qItem;
// @ts-ignore
var __VLS_357 = __VLS_asFunctionalComponent1(__VLS_356, new __VLS_356({}));
var __VLS_358 = __VLS_357.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_357), false));
var __VLS_361 = __VLS_359.slots.default;
var __VLS_362;
/** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
qItemSection;
// @ts-ignore
var __VLS_363 = __VLS_asFunctionalComponent1(__VLS_362, new __VLS_362({}));
var __VLS_364 = __VLS_363.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_363), false));
var __VLS_367 = __VLS_365.slots.default;
var __VLS_368;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_369 = __VLS_asFunctionalComponent1(__VLS_368, new __VLS_368({
    caption: true,
}));
var __VLS_370 = __VLS_369.apply(void 0, __spreadArray([{
        caption: true,
    }], __VLS_functionalComponentArgsRest(__VLS_369), false));
var __VLS_373 = __VLS_371.slots.default;
// @ts-ignore
[];
var __VLS_371;
var __VLS_374;
/** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
qItemLabel;
// @ts-ignore
var __VLS_375 = __VLS_asFunctionalComponent1(__VLS_374, new __VLS_374({}));
var __VLS_376 = __VLS_375.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_375), false));
var __VLS_379 = __VLS_377.slots.default;
(__VLS_ctx.lotDisplayName);
// @ts-ignore
[lotDisplayName,];
var __VLS_377;
// @ts-ignore
[];
var __VLS_365;
// @ts-ignore
[];
var __VLS_359;
if (__VLS_ctx.lotMode === 'new') {
    var __VLS_380 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_381 = __VLS_asFunctionalComponent1(__VLS_380, new __VLS_380({}));
    var __VLS_382 = __VLS_381.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_381), false));
    var __VLS_385 = __VLS_383.slots.default;
    var __VLS_386 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_387 = __VLS_asFunctionalComponent1(__VLS_386, new __VLS_386({}));
    var __VLS_388 = __VLS_387.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_387), false));
    var __VLS_391 = __VLS_389.slots.default;
    var __VLS_392 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_393 = __VLS_asFunctionalComponent1(__VLS_392, new __VLS_392({
        caption: true,
    }));
    var __VLS_394 = __VLS_393.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_393), false));
    var __VLS_397 = __VLS_395.slots.default;
    // @ts-ignore
    [lotMode,];
    var __VLS_395;
    var __VLS_398 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_399 = __VLS_asFunctionalComponent1(__VLS_398, new __VLS_398({}));
    var __VLS_400 = __VLS_399.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_399), false));
    var __VLS_403 = __VLS_401.slots.default;
    (__VLS_ctx.selectedThreadTypeName);
    // @ts-ignore
    [selectedThreadTypeName,];
    var __VLS_401;
    // @ts-ignore
    [];
    var __VLS_389;
    // @ts-ignore
    [];
    var __VLS_383;
}
if (__VLS_ctx.formData.supplier_id) {
    var __VLS_404 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_405 = __VLS_asFunctionalComponent1(__VLS_404, new __VLS_404({}));
    var __VLS_406 = __VLS_405.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_405), false));
    var __VLS_409 = __VLS_407.slots.default;
    var __VLS_410 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_411 = __VLS_asFunctionalComponent1(__VLS_410, new __VLS_410({}));
    var __VLS_412 = __VLS_411.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_411), false));
    var __VLS_415 = __VLS_413.slots.default;
    var __VLS_416 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_417 = __VLS_asFunctionalComponent1(__VLS_416, new __VLS_416({
        caption: true,
    }));
    var __VLS_418 = __VLS_417.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_417), false));
    var __VLS_421 = __VLS_419.slots.default;
    // @ts-ignore
    [formData,];
    var __VLS_419;
    var __VLS_422 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_423 = __VLS_asFunctionalComponent1(__VLS_422, new __VLS_422({}));
    var __VLS_424 = __VLS_423.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_423), false));
    var __VLS_427 = __VLS_425.slots.default;
    (__VLS_ctx.selectedSupplierName);
    // @ts-ignore
    [selectedSupplierName,];
    var __VLS_425;
    // @ts-ignore
    [];
    var __VLS_413;
    // @ts-ignore
    [];
    var __VLS_407;
}
// @ts-ignore
[];
var __VLS_329;
// @ts-ignore
[];
var __VLS_323;
// @ts-ignore
[];
var __VLS_317;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_428;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_429 = __VLS_asFunctionalComponent1(__VLS_428, new __VLS_428({
    flat: true,
    bordered: true,
}));
var __VLS_430 = __VLS_429.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_429), false));
var __VLS_433 = __VLS_431.slots.default;
var __VLS_434;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_435 = __VLS_asFunctionalComponent1(__VLS_434, new __VLS_434({}));
var __VLS_436 = __VLS_435.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_435), false));
var __VLS_439 = __VLS_437.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center" }));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h2 text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-h2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
(__VLS_ctx.bufferCount);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6" }));
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
// @ts-ignore
[bufferCount,];
var __VLS_437;
// @ts-ignore
[];
var __VLS_431;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_440;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_441 = __VLS_asFunctionalComponent1(__VLS_440, new __VLS_440({
    flat: true,
    bordered: true,
}));
var __VLS_442 = __VLS_441.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_441), false));
var __VLS_445 = __VLS_443.slots.default;
var __VLS_446;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_447 = __VLS_asFunctionalComponent1(__VLS_446, new __VLS_446(__assign({ class: "q-pb-none" })));
var __VLS_448 = __VLS_447.apply(void 0, __spreadArray([__assign({ class: "q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_447), false));
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_451 = __VLS_449.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
// @ts-ignore
[];
var __VLS_449;
var __VLS_452;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_453 = __VLS_asFunctionalComponent1(__VLS_452, new __VLS_452({}));
var __VLS_454 = __VLS_453.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_453), false));
var __VLS_457 = __VLS_455.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cone-preview-grid" }));
/** @type {__VLS_StyleScopedClasses['cone-preview-grid']} */ ;
for (var _h = 0, _j = __VLS_vFor((__VLS_ctx.coneBuffer.slice(0, 20))); _h < _j.length; _h++) {
    var coneId = _j[_h][0];
    var __VLS_458 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_459 = __VLS_asFunctionalComponent1(__VLS_458, new __VLS_458({
        key: (coneId),
        dense: true,
        color: "grey-3",
    }));
    var __VLS_460 = __VLS_459.apply(void 0, __spreadArray([{
            key: (coneId),
            dense: true,
            color: "grey-3",
        }], __VLS_functionalComponentArgsRest(__VLS_459), false));
    var __VLS_463 = __VLS_461.slots.default;
    (coneId);
    // @ts-ignore
    [coneBuffer,];
    var __VLS_461;
    // @ts-ignore
    [];
}
if (__VLS_ctx.bufferCount > 20) {
    var __VLS_464 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_465 = __VLS_asFunctionalComponent1(__VLS_464, new __VLS_464({
        dense: true,
        color: "primary",
        textColor: "white",
    }));
    var __VLS_466 = __VLS_465.apply(void 0, __spreadArray([{
            dense: true,
            color: "primary",
            textColor: "white",
        }], __VLS_functionalComponentArgsRest(__VLS_465), false));
    var __VLS_469 = __VLS_467.slots.default;
    (__VLS_ctx.bufferCount - 20);
    // @ts-ignore
    [bufferCount, bufferCount,];
    var __VLS_467;
}
// @ts-ignore
[];
var __VLS_455;
// @ts-ignore
[];
var __VLS_443;
var __VLS_470;
/** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
qStepperNavigation;
// @ts-ignore
var __VLS_471 = __VLS_asFunctionalComponent1(__VLS_470, new __VLS_470({}));
var __VLS_472 = __VLS_471.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_471), false));
var __VLS_475 = __VLS_473.slots.default;
var __VLS_476;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_477 = __VLS_asFunctionalComponent1(__VLS_476, new __VLS_476(__assign({ 'onClick': {} }, { color: "primary", label: "Xác nhận nhập kho", icon: "check", loading: (__VLS_ctx.loading) })));
var __VLS_478 = __VLS_477.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Xác nhận nhập kho", icon: "check", loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_477), false));
var __VLS_481;
var __VLS_482 = ({ click: {} },
    { onClick: (__VLS_ctx.handleConfirm) });
var __VLS_479;
var __VLS_480;
var __VLS_483;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_484 = __VLS_asFunctionalComponent1(__VLS_483, new __VLS_483(__assign(__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" }), { disable: (__VLS_ctx.loading) })));
var __VLS_485 = __VLS_484.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" }), { disable: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_484), false));
var __VLS_488;
var __VLS_489 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.goToStep(3);
            // @ts-ignore
            [goToStep, loading, loading, handleConfirm,];
        } });
/** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
var __VLS_486;
var __VLS_487;
// @ts-ignore
[];
var __VLS_473;
// @ts-ignore
[];
var __VLS_299;
// @ts-ignore
[];
var __VLS_17;
var __VLS_490;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_491 = __VLS_asFunctionalComponent1(__VLS_490, new __VLS_490({
    modelValue: (__VLS_ctx.showSuccessDialog),
    persistent: true,
}));
var __VLS_492 = __VLS_491.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showSuccessDialog),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_491), false));
var __VLS_495 = __VLS_493.slots.default;
var __VLS_496;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_497 = __VLS_asFunctionalComponent1(__VLS_496, new __VLS_496(__assign({ style: {} })));
var __VLS_498 = __VLS_497.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_497), false));
var __VLS_501 = __VLS_499.slots.default;
var __VLS_502;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_503 = __VLS_asFunctionalComponent1(__VLS_502, new __VLS_502(__assign({ class: "text-center q-pt-lg" })));
var __VLS_504 = __VLS_503.apply(void 0, __spreadArray([__assign({ class: "text-center q-pt-lg" })], __VLS_functionalComponentArgsRest(__VLS_503), false));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pt-lg']} */ ;
var __VLS_507 = __VLS_505.slots.default;
var __VLS_508;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_509 = __VLS_asFunctionalComponent1(__VLS_508, new __VLS_508({
    name: "check_circle",
    color: "positive",
    size: "64px",
}));
var __VLS_510 = __VLS_509.apply(void 0, __spreadArray([{
        name: "check_circle",
        color: "positive",
        size: "64px",
    }], __VLS_functionalComponentArgsRest(__VLS_509), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 q-mt-md" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6 q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
((_a = __VLS_ctx.lastResult) === null || _a === void 0 ? void 0 : _a.cone_count);
if ((_b = __VLS_ctx.lastResult) === null || _b === void 0 ? void 0 : _b.transaction_id) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mt-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    (__VLS_ctx.lastResult.transaction_id);
}
// @ts-ignore
[showSuccessDialog, lastResult, lastResult, lastResult,];
var __VLS_505;
var __VLS_513;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_514 = __VLS_asFunctionalComponent1(__VLS_513, new __VLS_513(__assign({ align: "center" }, { class: "q-pb-lg" })));
var __VLS_515 = __VLS_514.apply(void 0, __spreadArray([__assign({ align: "center" }, { class: "q-pb-lg" })], __VLS_functionalComponentArgsRest(__VLS_514), false));
/** @type {__VLS_StyleScopedClasses['q-pb-lg']} */ ;
var __VLS_518 = __VLS_516.slots.default;
var __VLS_519;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_520 = __VLS_asFunctionalComponent1(__VLS_519, new __VLS_519(__assign({ 'onClick': {} }, { color: "primary", label: "Nhập tiếp" })));
var __VLS_521 = __VLS_520.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Nhập tiếp" })], __VLS_functionalComponentArgsRest(__VLS_520), false));
var __VLS_524;
var __VLS_525 = ({ click: {} },
    { onClick: (__VLS_ctx.handleNewBatch) });
var __VLS_522;
var __VLS_523;
var __VLS_526;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_527 = __VLS_asFunctionalComponent1(__VLS_526, new __VLS_526(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Về trang chủ" })));
var __VLS_528 = __VLS_527.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Về trang chủ" })], __VLS_functionalComponentArgsRest(__VLS_527), false));
var __VLS_531;
var __VLS_532 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$router.push('/thread/lots');
            // @ts-ignore
            [handleNewBatch, $router,];
        } });
var __VLS_529;
var __VLS_530;
// @ts-ignore
[];
var __VLS_516;
// @ts-ignore
[];
var __VLS_499;
// @ts-ignore
[];
var __VLS_493;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_20 = __VLS_19;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
