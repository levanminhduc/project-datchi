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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var vue_router_1 = require("vue-router");
var quasar_1 = require("quasar");
var useBatchOperations_1 = require("@/composables/useBatchOperations");
var composables_1 = require("@/composables");
var useLots_1 = require("@/composables/useLots");
var qr_1 = require("@/components/qr");
var AppWarehouseSelect_vue_1 = require("@/components/ui/inputs/AppWarehouseSelect.vue");
var AppTextarea_vue_1 = require("@/components/ui/inputs/AppTextarea.vue");
var inventoryService_1 = require("@/services/inventoryService");
var LotSelector_vue_1 = require("@/components/thread/LotSelector.vue");
var router = (0, vue_router_1.useRouter)();
var $q = (0, quasar_1.useQuasar)();
var confirm = (0, composables_1.useConfirm)().confirm;
var snackbar = (0, composables_1.useSnackbar)();
var _b = (0, composables_1.useWarehouses)(), warehouses = _b.warehouses, fetchWarehouses = _b.fetchWarehouses;
var _c = (0, useLots_1.useLots)(), fetchLotCones = _c.fetchLotCones, currentCones = _c.currentCones;
var _d = (0, useBatchOperations_1.useBatchOperations)(), loading = _d.loading, lastResult = _d.lastResult, batchTransfer = _d.batchTransfer;
var coneBuffer = (0, vue_1.ref)([]);
// Status constants and labels
var TRANSFERABLE_STATUSES = ['AVAILABLE', 'RECEIVED', 'INSPECTED'];
var statusLabels = {
    'AVAILABLE': 'Sẵn sàng',
    'RECEIVED': 'Đã nhận',
    'INSPECTED': 'Đã kiểm tra',
    'SOFT_ALLOCATED': 'Đã đặt trước',
    'HARD_ALLOCATED': 'Đã cấp phát',
    'IN_PRODUCTION': 'Đang sản xuất',
    'PARTIAL_RETURN': 'Hoàn trả một phần',
    'PENDING_WEIGH': 'Chờ cân',
    'CONSUMED': 'Đã tiêu thụ',
    'WRITTEN_OFF': 'Đã thanh lý',
    'QUARANTINE': 'Cách ly'
};
var isTransferable = function (status) { return TRANSFERABLE_STATUSES.includes(status); };
var validCones = (0, vue_1.computed)(function () { return coneBuffer.value.filter(function (c) { return isTransferable(c.status); }); });
var invalidCones = (0, vue_1.computed)(function () { return coneBuffer.value.filter(function (c) { return !isTransferable(c.status); }); });
// State
var currentStep = (0, vue_1.ref)(1);
var selectionMode = (0, vue_1.ref)('lot');
var isScanning = (0, vue_1.ref)(false);
var manualInput = (0, vue_1.ref)('');
var showSuccessDialog = (0, vue_1.ref)(false);
var selectedLot = (0, vue_1.ref)(null);
var selectedUnassigned = (0, vue_1.ref)(null);
var lotSelectorRef = (0, vue_1.ref)(null);
var formData = (0, vue_1.ref)({
    from_warehouse_id: null,
    to_warehouse_id: null,
    lot_id: null
});
// Options
var selectionModeOptions = [
    { label: 'Theo lô/loại chỉ', value: 'lot' },
    { label: 'Quét/nhập', value: 'scan' }
];
// Computed
var isDestinationValid = (0, vue_1.computed)(function () {
    return formData.value.to_warehouse_id !== null &&
        formData.value.to_warehouse_id !== formData.value.from_warehouse_id;
});
var sourceWarehouseName = (0, vue_1.computed)(function () {
    var w = warehouses.value.find(function (w) { return w.id === formData.value.from_warehouse_id; });
    return (w === null || w === void 0 ? void 0 : w.name) || '-';
});
var destWarehouseName = (0, vue_1.computed)(function () {
    var w = warehouses.value.find(function (w) { return w.id === formData.value.to_warehouse_id; });
    return (w === null || w === void 0 ? void 0 : w.name) || '-';
});
// Methods
function goToStep(step) {
    currentStep.value = step;
}
function onSourceWarehouseChange() {
    formData.value.lot_id = null;
    selectedLot.value = null;
    selectedUnassigned.value = null;
    coneBuffer.value = [];
}
function onLotSelected(lot) {
    selectedLot.value = lot;
    selectedUnassigned.value = null;
}
function onUnassignedSelected(group) {
    selectedUnassigned.value = group;
    selectedLot.value = null;
}
var hasSelection = (0, vue_1.computed)(function () {
    return selectedLot.value !== null || selectedUnassigned.value !== null;
});
function addLotCones() {
    return __awaiter(this, void 0, void 0, function () {
        var coneIds, fetchPromises, cones, added_1, _i, cones_1, cone, added, skipped, _loop_2, _a, _b, cone;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!formData.value.lot_id)
                        return [2 /*return*/];
                    if (!selectedUnassigned.value) return [3 /*break*/, 2];
                    coneIds = selectedUnassigned.value.cone_ids;
                    fetchPromises = coneIds
                        .filter(function (id) { return !coneBuffer.value.some(function (item) { return item.id === id; }); })
                        .map(function (id) { return inventoryService_1.inventoryService.getById(id).catch(function () { return null; }); });
                    return [4 /*yield*/, Promise.all(fetchPromises)];
                case 1:
                    cones = _c.sent();
                    added_1 = 0;
                    for (_i = 0, cones_1 = cones; _i < cones_1.length; _i++) {
                        cone = cones_1[_i];
                        if (cone && isTransferable(cone.status)) {
                            coneBuffer.value.push({ id: cone.id, cone_id: cone.cone_id, status: cone.status });
                            added_1++;
                        }
                    }
                    if (added_1 > 0) {
                        snackbar.success("\u0110\u00E3 th\u00EAm ".concat(added_1, " cu\u1ED9n ch\u01B0a ph\u00E2n l\u00F4"));
                    }
                    else {
                        snackbar.info('Không có cuộn nào để thêm');
                    }
                    return [2 /*return*/];
                case 2:
                    if (typeof formData.value.lot_id !== 'number')
                        return [2 /*return*/];
                    return [4 /*yield*/, fetchLotCones(formData.value.lot_id)];
                case 3:
                    _c.sent();
                    added = 0;
                    skipped = 0;
                    _loop_2 = function (cone) {
                        // Check if cone is already in buffer by database id
                        if (!coneBuffer.value.some(function (item) { return item.id === cone.id; })) {
                            if (isTransferable(cone.status)) {
                                coneBuffer.value.push({ id: cone.id, cone_id: cone.cone_id, status: cone.status });
                                added++;
                            }
                            else {
                                skipped++;
                            }
                        }
                    };
                    for (_a = 0, _b = currentCones.value; _a < _b.length; _a++) {
                        cone = _b[_a];
                        _loop_2(cone);
                    }
                    if (added > 0) {
                        snackbar.success("\u0110\u00E3 th\u00EAm ".concat(added, " cu\u1ED9n h\u1EE3p l\u1EC7 t\u1EEB l\u00F4"));
                        if (skipped > 0) {
                            snackbar.warning("B\u1ECF qua ".concat(skipped, " cu\u1ED9n kh\u00F4ng th\u1EC3 chuy\u1EC3n (\u0111ang s\u1EA3n xu\u1EA5t, \u0111\u00E3 c\u1EA5p ph\u00E1t, v.v.)"));
                        }
                    }
                    else if (skipped > 0) {
                        snackbar.warning("Kh\u00F4ng c\u00F3 cu\u1ED9n n\u00E0o h\u1EE3p l\u1EC7 \u0111\u1EC3 chuy\u1EC3n trong l\u00F4 n\u00E0y");
                    }
                    else {
                        snackbar.info('Không có cuộn nào trong lô');
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
    return __awaiter(this, void 0, void 0, function () {
        var firstCode, scannedConeId, cone, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    firstCode = codes[0];
                    if (!firstCode)
                        return [2 /*return*/];
                    scannedConeId = firstCode.rawValue.trim();
                    // Check if already in buffer by cone_id
                    if (coneBuffer.value.some(function (item) { return item.cone_id === scannedConeId; })) {
                        snackbar.warning('Đã quét rồi');
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, inventoryService_1.inventoryService.getByBarcode(scannedConeId)
                        // Verify cone is in the selected source warehouse
                    ];
                case 2:
                    cone = _b.sent();
                    // Verify cone is in the selected source warehouse
                    if (cone.warehouse_id !== formData.value.from_warehouse_id) {
                        snackbar.error("Cu\u1ED9n ".concat(scannedConeId, " kh\u00F4ng thu\u1ED9c kho ngu\u1ED3n \u0111\u00E3 ch\u1ECDn"));
                        return [2 /*return*/];
                    }
                    coneBuffer.value.push({ id: cone.id, cone_id: cone.cone_id, status: cone.status });
                    snackbar.success("\u2713 ".concat(scannedConeId));
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    snackbar.error("Kh\u00F4ng t\u00ECm th\u1EA5y cu\u1ED9n: ".concat(scannedConeId));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function handleManualAdd() {
    return __awaiter(this, void 0, void 0, function () {
        var ids, added, errors, _loop_3, _i, ids_1, scannedConeId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ids = manualInput.value
                        .split(/[,\n\r]+/)
                        .map(function (s) { return s.trim(); })
                        .filter(function (s) { return s.length > 0; });
                    added = 0;
                    errors = [];
                    _loop_3 = function (scannedConeId) {
                        var cone, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    // Skip if already in buffer
                                    if (coneBuffer.value.some(function (item) { return item.cone_id === scannedConeId; })) {
                                        return [2 /*return*/, "continue"];
                                    }
                                    _c.label = 1;
                                case 1:
                                    _c.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, inventoryService_1.inventoryService.getByBarcode(scannedConeId)
                                        // Verify cone is in the selected source warehouse
                                    ];
                                case 2:
                                    cone = _c.sent();
                                    // Verify cone is in the selected source warehouse
                                    if (cone.warehouse_id !== formData.value.from_warehouse_id) {
                                        errors.push("".concat(scannedConeId, " kh\u00F4ng thu\u1ED9c kho ngu\u1ED3n"));
                                        return [2 /*return*/, "continue"];
                                    }
                                    coneBuffer.value.push({ id: cone.id, cone_id: cone.cone_id, status: cone.status });
                                    added++;
                                    return [3 /*break*/, 4];
                                case 3:
                                    _b = _c.sent();
                                    errors.push(scannedConeId);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, ids_1 = ids;
                    _a.label = 1;
                case 1:
                    if (!(_i < ids_1.length)) return [3 /*break*/, 4];
                    scannedConeId = ids_1[_i];
                    return [5 /*yield**/, _loop_3(scannedConeId)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    if (added > 0) {
                        manualInput.value = '';
                        snackbar.success("\u0110\u00E3 th\u00EAm ".concat(added, " cu\u1ED9n"));
                    }
                    if (errors.length > 0) {
                        snackbar.error("Kh\u00F4ng t\u00ECm th\u1EA5y: ".concat(errors.join(', ')));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function removeFromBuffer(item) {
    var index = coneBuffer.value.findIndex(function (i) { return i.id === item.id; });
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
        var coneIds, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    coneIds = validCones.value.map(function (item) { return item.id; });
                    if (coneIds.length === 0) {
                        snackbar.error('Không có cuộn hợp lệ để chuyển');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, batchTransfer({
                            cone_ids: coneIds,
                            from_warehouse_id: formData.value.from_warehouse_id,
                            to_warehouse_id: formData.value.to_warehouse_id
                        })];
                case 1:
                    result = _a.sent();
                    if (result) {
                        showSuccessDialog.value = true;
                        coneBuffer.value = [];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function handleNewBatch() {
    showSuccessDialog.value = false;
    currentStep.value = 1;
    formData.value.lot_id = null;
    selectedLot.value = null;
    selectedUnassigned.value = null;
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
    title: "Chọn Nguồn",
    icon: "output",
    done: (__VLS_ctx.currentStep > 1),
}));
var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([{
        name: (1),
        title: "Chọn Nguồn",
        icon: "output",
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
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26(__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.formData.from_warehouse_id), label: "Chọn kho chuyển đi", required: true }), { class: "q-mb-lg" })));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.formData.from_warehouse_id), label: "Chọn kho chuyển đi", required: true }), { class: "q-mb-lg" })], __VLS_functionalComponentArgsRest(__VLS_27), false));
var __VLS_31;
var __VLS_32 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onSourceWarehouseChange) });
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
var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38(__assign(__assign({ modelValue: (__VLS_ctx.selectionMode), options: (__VLS_ctx.selectionModeOptions), color: "primary", inline: true }, { class: "q-mb-md" }), { disable: (!__VLS_ctx.formData.from_warehouse_id) })));
var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.selectionMode), options: (__VLS_ctx.selectionModeOptions), color: "primary", inline: true }, { class: "q-mb-md" }), { disable: (!__VLS_ctx.formData.from_warehouse_id) })], __VLS_functionalComponentArgsRest(__VLS_39), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
if (__VLS_ctx.selectionMode === 'lot' && __VLS_ctx.formData.from_warehouse_id) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    var __VLS_43 = LotSelector_vue_1.default;
    // @ts-ignore
    var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43(__assign(__assign({ 'onLotSelected': {} }, { 'onUnassignedSelected': {} }), { ref: "lotSelectorRef", modelValue: (__VLS_ctx.formData.lot_id), warehouseId: (__VLS_ctx.formData.from_warehouse_id), label: "Chọn lô hoặc loại chỉ", includeUnassigned: (true) })));
    var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([__assign(__assign({ 'onLotSelected': {} }, { 'onUnassignedSelected': {} }), { ref: "lotSelectorRef", modelValue: (__VLS_ctx.formData.lot_id), warehouseId: (__VLS_ctx.formData.from_warehouse_id), label: "Chọn lô hoặc loại chỉ", includeUnassigned: (true) })], __VLS_functionalComponentArgsRest(__VLS_44), false));
    var __VLS_48 = void 0;
    var __VLS_49 = ({ lotSelected: {} },
        { onLotSelected: (__VLS_ctx.onLotSelected) });
    var __VLS_50 = ({ unassignedSelected: {} },
        { onUnassignedSelected: (__VLS_ctx.onUnassignedSelected) });
    var __VLS_51 = {};
    var __VLS_46;
    var __VLS_47;
    if (__VLS_ctx.hasSelection) {
        var __VLS_53 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53(__assign(__assign({ 'onClick': {} }, { color: "secondary", label: (__VLS_ctx.selectedUnassigned ? 'Thêm tất cả cuộn chưa phân lô' : 'Thêm tất cả cuộn trong lô'), icon: "add" }), { class: "q-mt-md" })));
        var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "secondary", label: (__VLS_ctx.selectedUnassigned ? 'Thêm tất cả cuộn chưa phân lô' : 'Thêm tất cả cuộn trong lô'), icon: "add" }), { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_54), false));
        var __VLS_58 = void 0;
        var __VLS_59 = ({ click: {} },
            { onClick: (__VLS_ctx.addLotCones) });
        /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
        var __VLS_56;
        var __VLS_57;
    }
}
if (__VLS_ctx.selectionMode === 'scan' && __VLS_ctx.formData.from_warehouse_id) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    var __VLS_60 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60(__assign({ flat: true, bordered: true }, { class: "q-mb-md" })));
    var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_61), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_65 = __VLS_63.slots.default;
    var __VLS_66 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({}));
    var __VLS_68 = __VLS_67.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_67), false));
    var __VLS_71 = __VLS_69.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_72 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72(__assign({ name: "qr_code_scanner", size: "sm" }, { class: "q-mr-sm" })));
    var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([__assign({ name: "qr_code_scanner", size: "sm" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_73), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-subtitle2" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    var __VLS_77 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
    qSpace;
    // @ts-ignore
    var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({}));
    var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_78), false));
    var __VLS_82 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82(__assign({ 'onClick': {} }, { color: (__VLS_ctx.isScanning ? 'negative' : 'primary'), label: (__VLS_ctx.isScanning ? 'Dừng' : 'Quét'), icon: (__VLS_ctx.isScanning ? 'stop' : 'play_arrow'), dense: true })));
    var __VLS_84 = __VLS_83.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: (__VLS_ctx.isScanning ? 'negative' : 'primary'), label: (__VLS_ctx.isScanning ? 'Dừng' : 'Quét'), icon: (__VLS_ctx.isScanning ? 'stop' : 'play_arrow'), dense: true })], __VLS_functionalComponentArgsRest(__VLS_83), false));
    var __VLS_87 = void 0;
    var __VLS_88 = ({ click: {} },
        { onClick: (__VLS_ctx.toggleScanner) });
    var __VLS_85;
    var __VLS_86;
    if (__VLS_ctx.isScanning) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "scanner-container" }));
        /** @type {__VLS_StyleScopedClasses['scanner-container']} */ ;
        var __VLS_89 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.QrScannerStream} */
        qr_1.QrScannerStream;
        // @ts-ignore
        var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89(__assign({ 'onDetect': {} }, { active: (__VLS_ctx.isScanning) })));
        var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([__assign({ 'onDetect': {} }, { active: (__VLS_ctx.isScanning) })], __VLS_functionalComponentArgsRest(__VLS_90), false));
        var __VLS_94 = void 0;
        var __VLS_95 = ({ detect: {} },
            { onDetect: (__VLS_ctx.handleScan) });
        var __VLS_92;
        var __VLS_93;
    }
    // @ts-ignore
    [handleBack, currentStep, currentStep, $q, formData, formData, formData, formData, formData, formData, onSourceWarehouseChange, selectionMode, selectionMode, selectionMode, selectionModeOptions, onLotSelected, onUnassignedSelected, hasSelection, selectedUnassigned, addLotCones, isScanning, isScanning, isScanning, isScanning, isScanning, toggleScanner, handleScan,];
    var __VLS_69;
    // @ts-ignore
    [];
    var __VLS_63;
    var __VLS_96 = AppTextarea_vue_1.default;
    // @ts-ignore
    var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
        modelValue: (__VLS_ctx.manualInput),
        label: "Hoặc nhập thủ công",
        hint: "Mỗi mã trên một dòng",
        rows: "2",
    }));
    var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.manualInput),
            label: "Hoặc nhập thủ công",
            hint: "Mỗi mã trên một dòng",
            rows: "2",
        }], __VLS_functionalComponentArgsRest(__VLS_97), false));
    var __VLS_101 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_102 = __VLS_asFunctionalComponent1(__VLS_101, new __VLS_101(__assign(__assign(__assign({ 'onClick': {} }, { color: "secondary", label: "Thêm", icon: "add" }), { class: "q-mt-sm" }), { disable: (!__VLS_ctx.manualInput.trim()) })));
    var __VLS_103 = __VLS_102.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { color: "secondary", label: "Thêm", icon: "add" }), { class: "q-mt-sm" }), { disable: (!__VLS_ctx.manualInput.trim()) })], __VLS_functionalComponentArgsRest(__VLS_102), false));
    var __VLS_106 = void 0;
    var __VLS_107 = ({ click: {} },
        { onClick: (__VLS_ctx.handleManualAdd) });
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    var __VLS_104;
    var __VLS_105;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_108;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108(__assign({ flat: true, bordered: true }, { class: "selected-list-card" })));
var __VLS_110 = __VLS_109.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "selected-list-card" })], __VLS_functionalComponentArgsRest(__VLS_109), false));
/** @type {__VLS_StyleScopedClasses['selected-list-card']} */ ;
var __VLS_113 = __VLS_111.slots.default;
var __VLS_114;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114(__assign({ class: "q-pb-none" })));
var __VLS_116 = __VLS_115.apply(void 0, __spreadArray([__assign({ class: "q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_115), false));
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_119 = __VLS_117.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
(__VLS_ctx.coneBuffer.length);
var __VLS_120;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_121 = __VLS_asFunctionalComponent1(__VLS_120, new __VLS_120({}));
var __VLS_122 = __VLS_121.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_121), false));
if (__VLS_ctx.coneBuffer.length > 0) {
    var __VLS_125 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "negative", label: "Xóa tất cả", icon: "delete_sweep" })));
    var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "negative", label: "Xóa tất cả", icon: "delete_sweep" })], __VLS_functionalComponentArgsRest(__VLS_126), false));
    var __VLS_130 = void 0;
    var __VLS_131 = ({ click: {} },
        { onClick: (__VLS_ctx.handleClearBuffer) });
    var __VLS_128;
    var __VLS_129;
}
if (__VLS_ctx.invalidCones.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-warning q-mt-sm text-body2" }));
    /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    var __VLS_132 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132(__assign({ name: "warning", size: "xs" }, { class: "q-mr-xs" })));
    var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([__assign({ name: "warning", size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_133), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    (__VLS_ctx.validCones.length);
    (__VLS_ctx.coneBuffer.length);
}
// @ts-ignore
[manualInput, manualInput, handleManualAdd, coneBuffer, coneBuffer, coneBuffer, handleClearBuffer, invalidCones, validCones,];
var __VLS_117;
var __VLS_137;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137(__assign({ class: "selected-list-container" })));
var __VLS_139 = __VLS_138.apply(void 0, __spreadArray([__assign({ class: "selected-list-container" })], __VLS_functionalComponentArgsRest(__VLS_138), false));
/** @type {__VLS_StyleScopedClasses['selected-list-container']} */ ;
var __VLS_142 = __VLS_140.slots.default;
if (__VLS_ctx.coneBuffer.length > 0) {
    var __VLS_143 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
        separator: true,
        dense: true,
    }));
    var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([{
            separator: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_144), false));
    var __VLS_148 = __VLS_146.slots.default;
    var _loop_1 = function (item, index) {
        var __VLS_149 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_150 = __VLS_asFunctionalComponent1(__VLS_149, new __VLS_149(__assign({ key: (item.id), dense: true }, { class: ({ 'bg-red-1': !__VLS_ctx.isTransferable(item.status) }) })));
        var __VLS_151 = __VLS_150.apply(void 0, __spreadArray([__assign({ key: (item.id), dense: true }, { class: ({ 'bg-red-1': !__VLS_ctx.isTransferable(item.status) }) })], __VLS_functionalComponentArgsRest(__VLS_150), false));
        /** @type {__VLS_StyleScopedClasses['bg-red-1']} */ ;
        var __VLS_154 = __VLS_152.slots.default;
        var __VLS_155 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_156 = __VLS_asFunctionalComponent1(__VLS_155, new __VLS_155({
            avatar: true,
        }));
        var __VLS_157 = __VLS_156.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_156), false));
        var __VLS_160 = __VLS_158.slots.default;
        var __VLS_161 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_162 = __VLS_asFunctionalComponent1(__VLS_161, new __VLS_161({
            size: "24px",
            color: (__VLS_ctx.isTransferable(item.status) ? 'info' : 'negative'),
            textColor: "white",
        }));
        var __VLS_163 = __VLS_162.apply(void 0, __spreadArray([{
                size: "24px",
                color: (__VLS_ctx.isTransferable(item.status) ? 'info' : 'negative'),
                textColor: "white",
            }], __VLS_functionalComponentArgsRest(__VLS_162), false));
        var __VLS_166 = __VLS_164.slots.default;
        if (__VLS_ctx.isTransferable(item.status)) {
            (index + 1);
        }
        else {
            var __VLS_167 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_168 = __VLS_asFunctionalComponent1(__VLS_167, new __VLS_167({
                name: "warning",
                size: "14px",
            }));
            var __VLS_169 = __VLS_168.apply(void 0, __spreadArray([{
                    name: "warning",
                    size: "14px",
                }], __VLS_functionalComponentArgsRest(__VLS_168), false));
        }
        // @ts-ignore
        [coneBuffer, coneBuffer, isTransferable, isTransferable, isTransferable,];
        // @ts-ignore
        [];
        var __VLS_172 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_173 = __VLS_asFunctionalComponent1(__VLS_172, new __VLS_172({}));
        var __VLS_174 = __VLS_173.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_173), false));
        var __VLS_177 = __VLS_175.slots.default;
        var __VLS_178 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_179 = __VLS_asFunctionalComponent1(__VLS_178, new __VLS_178(__assign({ class: "text-body2" })));
        var __VLS_180 = __VLS_179.apply(void 0, __spreadArray([__assign({ class: "text-body2" })], __VLS_functionalComponentArgsRest(__VLS_179), false));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_183 = __VLS_181.slots.default;
        (item.cone_id);
        // @ts-ignore
        [];
        var __VLS_184 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_185 = __VLS_asFunctionalComponent1(__VLS_184, new __VLS_184(__assign({ caption: true }, { class: (__VLS_ctx.isTransferable(item.status) ? 'text-positive' : 'text-negative') })));
        var __VLS_186 = __VLS_185.apply(void 0, __spreadArray([__assign({ caption: true }, { class: (__VLS_ctx.isTransferable(item.status) ? 'text-positive' : 'text-negative') })], __VLS_functionalComponentArgsRest(__VLS_185), false));
        var __VLS_189 = __VLS_187.slots.default;
        (__VLS_ctx.statusLabels[item.status] || item.status);
        // @ts-ignore
        [isTransferable, statusLabels,];
        // @ts-ignore
        [];
        var __VLS_190 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_191 = __VLS_asFunctionalComponent1(__VLS_190, new __VLS_190({
            side: true,
        }));
        var __VLS_192 = __VLS_191.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_191), false));
        var __VLS_195 = __VLS_193.slots.default;
        var __VLS_196 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_197 = __VLS_asFunctionalComponent1(__VLS_196, new __VLS_196(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", color: "negative", size: "sm" })));
        var __VLS_198 = __VLS_197.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", color: "negative", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_197), false));
        var __VLS_201 = void 0;
        var __VLS_202 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.coneBuffer.length > 0))
                        return;
                    __VLS_ctx.removeFromBuffer(item);
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
    var __VLS_164, __VLS_158, __VLS_181, __VLS_187, __VLS_175, __VLS_199, __VLS_200, __VLS_193, __VLS_152;
    for (var _i = 0, _e = __VLS_vFor((__VLS_ctx.coneBuffer)); _i < _e.length; _i++) {
        var _f = _e[_i], item = _f[0], index = _f[1];
        _loop_1(item, index);
    }
    // @ts-ignore
    [];
    var __VLS_146;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey-5 q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_203 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_204 = __VLS_asFunctionalComponent1(__VLS_203, new __VLS_203({
        name: "inbox",
        size: "48px",
    }));
    var __VLS_205 = __VLS_204.apply(void 0, __spreadArray([{
            name: "inbox",
            size: "48px",
        }], __VLS_functionalComponentArgsRest(__VLS_204), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
}
// @ts-ignore
[];
var __VLS_140;
// @ts-ignore
[];
var __VLS_111;
var __VLS_208;
/** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
qStepperNavigation;
// @ts-ignore
var __VLS_209 = __VLS_asFunctionalComponent1(__VLS_208, new __VLS_208({}));
var __VLS_210 = __VLS_209.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_209), false));
var __VLS_213 = __VLS_211.slots.default;
var __VLS_214;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_215 = __VLS_asFunctionalComponent1(__VLS_214, new __VLS_214(__assign({ 'onClick': {} }, { color: "primary", label: "Tiếp theo", disable: (__VLS_ctx.validCones.length === 0) })));
var __VLS_216 = __VLS_215.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Tiếp theo", disable: (__VLS_ctx.validCones.length === 0) })], __VLS_functionalComponentArgsRest(__VLS_215), false));
var __VLS_219;
var __VLS_220 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.goToStep(2);
            // @ts-ignore
            [validCones, goToStep,];
        } });
var __VLS_217;
var __VLS_218;
if (__VLS_ctx.coneBuffer.length > 0 && __VLS_ctx.validCones.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-negative text-body2 q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
}
// @ts-ignore
[coneBuffer, validCones,];
var __VLS_211;
// @ts-ignore
[];
var __VLS_23;
var __VLS_221;
/** @ts-ignore @type {typeof __VLS_components.qStep | typeof __VLS_components.QStep | typeof __VLS_components.qStep | typeof __VLS_components.QStep} */
qStep;
// @ts-ignore
var __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221({
    name: (2),
    title: "Chọn Đích",
    icon: "input",
    done: (__VLS_ctx.currentStep > 2),
}));
var __VLS_223 = __VLS_222.apply(void 0, __spreadArray([{
        name: (2),
        title: "Chọn Đích",
        icon: "input",
        done: (__VLS_ctx.currentStep > 2),
    }], __VLS_functionalComponentArgsRest(__VLS_222), false));
var __VLS_226 = __VLS_224.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-body1 q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_227 = AppWarehouseSelect_vue_1.default;
// @ts-ignore
var __VLS_228 = __VLS_asFunctionalComponent1(__VLS_227, new __VLS_227(__assign(__assign({ modelValue: (__VLS_ctx.formData.to_warehouse_id), label: "Kho đích", required: true }, { class: "q-mb-md" }), { style: {} })));
var __VLS_229 = __VLS_228.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.formData.to_warehouse_id), label: "Kho đích", required: true }, { class: "q-mb-md" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_228), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
if (__VLS_ctx.formData.to_warehouse_id === __VLS_ctx.formData.from_warehouse_id) {
    var __VLS_232 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_233 = __VLS_asFunctionalComponent1(__VLS_232, new __VLS_232(__assign({ class: "bg-warning text-white q-mt-md" }, { rounded: true })));
    var __VLS_234 = __VLS_233.apply(void 0, __spreadArray([__assign({ class: "bg-warning text-white q-mt-md" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_233), false));
    /** @type {__VLS_StyleScopedClasses['bg-warning']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    var __VLS_237 = __VLS_235.slots.default;
    {
        var __VLS_238 = __VLS_235.slots.avatar;
        var __VLS_239 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_240 = __VLS_asFunctionalComponent1(__VLS_239, new __VLS_239({
            name: "warning",
        }));
        var __VLS_241 = __VLS_240.apply(void 0, __spreadArray([{
                name: "warning",
            }], __VLS_functionalComponentArgsRest(__VLS_240), false));
        // @ts-ignore
        [currentStep, formData, formData, formData,];
    }
    // @ts-ignore
    [];
    var __VLS_235;
}
var __VLS_244;
/** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
qStepperNavigation;
// @ts-ignore
var __VLS_245 = __VLS_asFunctionalComponent1(__VLS_244, new __VLS_244({}));
var __VLS_246 = __VLS_245.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_245), false));
var __VLS_249 = __VLS_247.slots.default;
var __VLS_250;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_251 = __VLS_asFunctionalComponent1(__VLS_250, new __VLS_250(__assign({ 'onClick': {} }, { color: "primary", label: "Xem lại", disable: (!__VLS_ctx.isDestinationValid) })));
var __VLS_252 = __VLS_251.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Xem lại", disable: (!__VLS_ctx.isDestinationValid) })], __VLS_functionalComponentArgsRest(__VLS_251), false));
var __VLS_255;
var __VLS_256 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.goToStep(3);
            // @ts-ignore
            [goToStep, isDestinationValid,];
        } });
var __VLS_253;
var __VLS_254;
var __VLS_257;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_258 = __VLS_asFunctionalComponent1(__VLS_257, new __VLS_257(__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" })));
var __VLS_259 = __VLS_258.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_258), false));
var __VLS_262;
var __VLS_263 = ({ click: {} },
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
var __VLS_260;
var __VLS_261;
// @ts-ignore
[];
var __VLS_247;
// @ts-ignore
[];
var __VLS_224;
var __VLS_264;
/** @ts-ignore @type {typeof __VLS_components.qStep | typeof __VLS_components.QStep | typeof __VLS_components.qStep | typeof __VLS_components.QStep} */
qStep;
// @ts-ignore
var __VLS_265 = __VLS_asFunctionalComponent1(__VLS_264, new __VLS_264({
    name: (3),
    title: "Xác Nhận",
    icon: "check_circle",
}));
var __VLS_266 = __VLS_265.apply(void 0, __spreadArray([{
        name: (3),
        title: "Xác Nhận",
        icon: "check_circle",
    }], __VLS_functionalComponentArgsRest(__VLS_265), false));
var __VLS_269 = __VLS_267.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_270;
/** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
qBanner;
// @ts-ignore
var __VLS_271 = __VLS_asFunctionalComponent1(__VLS_270, new __VLS_270(__assign({ class: "bg-info text-white q-mb-lg" }, { rounded: true })));
var __VLS_272 = __VLS_271.apply(void 0, __spreadArray([__assign({ class: "bg-info text-white q-mb-lg" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_271), false));
/** @type {__VLS_StyleScopedClasses['bg-info']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_275 = __VLS_273.slots.default;
{
    var __VLS_276 = __VLS_273.slots.avatar;
    var __VLS_277 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_278 = __VLS_asFunctionalComponent1(__VLS_277, new __VLS_277({
        name: "swap_horiz",
    }));
    var __VLS_279 = __VLS_278.apply(void 0, __spreadArray([{
            name: "swap_horiz",
        }], __VLS_functionalComponentArgsRest(__VLS_278), false));
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_273;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_282;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_283 = __VLS_asFunctionalComponent1(__VLS_282, new __VLS_282(__assign({ flat: true, bordered: true }, { class: "text-center q-pa-md" })));
var __VLS_284 = __VLS_283.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "text-center q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_283), false));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_287 = __VLS_285.slots.default;
var __VLS_288;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_289 = __VLS_asFunctionalComponent1(__VLS_288, new __VLS_288({
    name: "output",
    size: "32px",
    color: "negative",
}));
var __VLS_290 = __VLS_289.apply(void 0, __spreadArray([{
        name: "output",
        size: "32px",
        color: "negative",
    }], __VLS_functionalComponentArgsRest(__VLS_289), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 text-weight-bold" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
(__VLS_ctx.sourceWarehouseName);
// @ts-ignore
[sourceWarehouseName,];
var __VLS_285;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_293;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_294 = __VLS_asFunctionalComponent1(__VLS_293, new __VLS_293(__assign({ flat: true, bordered: true }, { class: "text-center q-pa-md" })));
var __VLS_295 = __VLS_294.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "text-center q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_294), false));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_298 = __VLS_296.slots.default;
var __VLS_299;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_300 = __VLS_asFunctionalComponent1(__VLS_299, new __VLS_299({
    name: "inventory_2",
    size: "32px",
    color: "primary",
}));
var __VLS_301 = __VLS_300.apply(void 0, __spreadArray([{
        name: "inventory_2",
        size: "32px",
        color: "primary",
    }], __VLS_functionalComponentArgsRest(__VLS_300), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 text-weight-bold" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
(__VLS_ctx.validCones.length);
if (__VLS_ctx.invalidCones.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-body2 text-negative" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    (__VLS_ctx.invalidCones.length);
}
// @ts-ignore
[invalidCones, invalidCones, validCones,];
var __VLS_296;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_304;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_305 = __VLS_asFunctionalComponent1(__VLS_304, new __VLS_304(__assign({ flat: true, bordered: true }, { class: "text-center q-pa-md" })));
var __VLS_306 = __VLS_305.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "text-center q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_305), false));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_309 = __VLS_307.slots.default;
var __VLS_310;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_311 = __VLS_asFunctionalComponent1(__VLS_310, new __VLS_310({
    name: "input",
    size: "32px",
    color: "positive",
}));
var __VLS_312 = __VLS_311.apply(void 0, __spreadArray([{
        name: "input",
        size: "32px",
        color: "positive",
    }], __VLS_functionalComponentArgsRest(__VLS_311), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 text-weight-bold" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
(__VLS_ctx.destWarehouseName);
// @ts-ignore
[destWarehouseName,];
var __VLS_307;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_315;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_316 = __VLS_asFunctionalComponent1(__VLS_315, new __VLS_315({
    flat: true,
    bordered: true,
}));
var __VLS_317 = __VLS_316.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_316), false));
var __VLS_320 = __VLS_318.slots.default;
var __VLS_321;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_322 = __VLS_asFunctionalComponent1(__VLS_321, new __VLS_321(__assign({ class: "q-pb-none" })));
var __VLS_323 = __VLS_322.apply(void 0, __spreadArray([__assign({ class: "q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_322), false));
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_326 = __VLS_324.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
if (__VLS_ctx.invalidCones.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-warning text-body2 q-mt-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    var __VLS_327 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_328 = __VLS_asFunctionalComponent1(__VLS_327, new __VLS_327(__assign({ name: "warning", size: "xs" }, { class: "q-mr-xs" })));
    var __VLS_329 = __VLS_328.apply(void 0, __spreadArray([__assign({ name: "warning", size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_328), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
}
// @ts-ignore
[invalidCones,];
var __VLS_324;
var __VLS_332;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_333 = __VLS_asFunctionalComponent1(__VLS_332, new __VLS_332({}));
var __VLS_334 = __VLS_333.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_333), false));
var __VLS_337 = __VLS_335.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cone-preview-grid" }));
/** @type {__VLS_StyleScopedClasses['cone-preview-grid']} */ ;
for (var _g = 0, _h = __VLS_vFor((__VLS_ctx.coneBuffer.slice(0, 20))); _g < _h.length; _g++) {
    var item = _h[_g][0];
    var __VLS_338 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_339 = __VLS_asFunctionalComponent1(__VLS_338, new __VLS_338({
        key: (item.id),
        dense: true,
        color: (__VLS_ctx.isTransferable(item.status) ? 'grey-3' : 'red-2'),
        textColor: (__VLS_ctx.isTransferable(item.status) ? 'dark' : 'negative'),
    }));
    var __VLS_340 = __VLS_339.apply(void 0, __spreadArray([{
            key: (item.id),
            dense: true,
            color: (__VLS_ctx.isTransferable(item.status) ? 'grey-3' : 'red-2'),
            textColor: (__VLS_ctx.isTransferable(item.status) ? 'dark' : 'negative'),
        }], __VLS_functionalComponentArgsRest(__VLS_339), false));
    var __VLS_343 = __VLS_341.slots.default;
    if (!__VLS_ctx.isTransferable(item.status)) {
        var __VLS_344 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_345 = __VLS_asFunctionalComponent1(__VLS_344, new __VLS_344(__assign({ name: "warning", size: "12px" }, { class: "q-mr-xs" })));
        var __VLS_346 = __VLS_345.apply(void 0, __spreadArray([__assign({ name: "warning", size: "12px" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_345), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    }
    (item.cone_id);
    var __VLS_349 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_350 = __VLS_asFunctionalComponent1(__VLS_349, new __VLS_349({}));
    var __VLS_351 = __VLS_350.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_350), false));
    var __VLS_354 = __VLS_352.slots.default;
    (__VLS_ctx.statusLabels[item.status] || item.status);
    // @ts-ignore
    [coneBuffer, isTransferable, isTransferable, isTransferable, statusLabels,];
    var __VLS_352;
    // @ts-ignore
    [];
    var __VLS_341;
    // @ts-ignore
    [];
}
if (__VLS_ctx.coneBuffer.length > 20) {
    var __VLS_355 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_356 = __VLS_asFunctionalComponent1(__VLS_355, new __VLS_355({
        dense: true,
        color: "info",
        textColor: "white",
    }));
    var __VLS_357 = __VLS_356.apply(void 0, __spreadArray([{
            dense: true,
            color: "info",
            textColor: "white",
        }], __VLS_functionalComponentArgsRest(__VLS_356), false));
    var __VLS_360 = __VLS_358.slots.default;
    (__VLS_ctx.coneBuffer.length - 20);
    // @ts-ignore
    [coneBuffer, coneBuffer,];
    var __VLS_358;
}
// @ts-ignore
[];
var __VLS_335;
// @ts-ignore
[];
var __VLS_318;
var __VLS_361;
/** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
qStepperNavigation;
// @ts-ignore
var __VLS_362 = __VLS_asFunctionalComponent1(__VLS_361, new __VLS_361({}));
var __VLS_363 = __VLS_362.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_362), false));
var __VLS_366 = __VLS_364.slots.default;
var __VLS_367;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_368 = __VLS_asFunctionalComponent1(__VLS_367, new __VLS_367(__assign({ 'onClick': {} }, { color: "primary", label: "Xác nhận chuyển kho", icon: "swap_horiz", loading: (__VLS_ctx.loading) })));
var __VLS_369 = __VLS_368.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Xác nhận chuyển kho", icon: "swap_horiz", loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_368), false));
var __VLS_372;
var __VLS_373 = ({ click: {} },
    { onClick: (__VLS_ctx.handleConfirm) });
var __VLS_370;
var __VLS_371;
var __VLS_374;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_375 = __VLS_asFunctionalComponent1(__VLS_374, new __VLS_374(__assign(__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" }), { disable: (__VLS_ctx.loading) })));
var __VLS_376 = __VLS_375.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Quay lại" }), { class: "q-ml-sm" }), { disable: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_375), false));
var __VLS_379;
var __VLS_380 = ({ click: {} },
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
var __VLS_377;
var __VLS_378;
// @ts-ignore
[];
var __VLS_364;
// @ts-ignore
[];
var __VLS_267;
// @ts-ignore
[];
var __VLS_17;
var __VLS_381;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_382 = __VLS_asFunctionalComponent1(__VLS_381, new __VLS_381({
    modelValue: (__VLS_ctx.showSuccessDialog),
    persistent: true,
}));
var __VLS_383 = __VLS_382.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showSuccessDialog),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_382), false));
var __VLS_386 = __VLS_384.slots.default;
var __VLS_387;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_388 = __VLS_asFunctionalComponent1(__VLS_387, new __VLS_387(__assign({ style: {} })));
var __VLS_389 = __VLS_388.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_388), false));
var __VLS_392 = __VLS_390.slots.default;
var __VLS_393;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_394 = __VLS_asFunctionalComponent1(__VLS_393, new __VLS_393(__assign({ class: "text-center q-pt-lg" })));
var __VLS_395 = __VLS_394.apply(void 0, __spreadArray([__assign({ class: "text-center q-pt-lg" })], __VLS_functionalComponentArgsRest(__VLS_394), false));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pt-lg']} */ ;
var __VLS_398 = __VLS_396.slots.default;
var __VLS_399;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_400 = __VLS_asFunctionalComponent1(__VLS_399, new __VLS_399({
    name: "check_circle",
    color: "positive",
    size: "64px",
}));
var __VLS_401 = __VLS_400.apply(void 0, __spreadArray([{
        name: "check_circle",
        color: "positive",
        size: "64px",
    }], __VLS_functionalComponentArgsRest(__VLS_400), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 q-mt-md" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6 q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
((_a = __VLS_ctx.lastResult) === null || _a === void 0 ? void 0 : _a.cone_count);
// @ts-ignore
[showSuccessDialog, lastResult,];
var __VLS_396;
var __VLS_404;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_405 = __VLS_asFunctionalComponent1(__VLS_404, new __VLS_404(__assign({ align: "center" }, { class: "q-pb-lg" })));
var __VLS_406 = __VLS_405.apply(void 0, __spreadArray([__assign({ align: "center" }, { class: "q-pb-lg" })], __VLS_functionalComponentArgsRest(__VLS_405), false));
/** @type {__VLS_StyleScopedClasses['q-pb-lg']} */ ;
var __VLS_409 = __VLS_407.slots.default;
var __VLS_410;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_411 = __VLS_asFunctionalComponent1(__VLS_410, new __VLS_410(__assign({ 'onClick': {} }, { color: "primary", label: "Chuyển tiếp" })));
var __VLS_412 = __VLS_411.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Chuyển tiếp" })], __VLS_functionalComponentArgsRest(__VLS_411), false));
var __VLS_415;
var __VLS_416 = ({ click: {} },
    { onClick: (__VLS_ctx.handleNewBatch) });
var __VLS_413;
var __VLS_414;
var __VLS_417;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_418 = __VLS_asFunctionalComponent1(__VLS_417, new __VLS_417(__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Về trang chủ" })));
var __VLS_419 = __VLS_418.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, color: "primary", label: "Về trang chủ" })], __VLS_functionalComponentArgsRest(__VLS_418), false));
var __VLS_422;
var __VLS_423 = ({ click: {} },
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
var __VLS_420;
var __VLS_421;
// @ts-ignore
[];
var __VLS_407;
// @ts-ignore
[];
var __VLS_390;
// @ts-ignore
[];
var __VLS_384;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_52 = __VLS_51;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
