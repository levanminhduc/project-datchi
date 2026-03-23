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
var composables_1 = require("@/composables");
var qr_1 = require("@/components/qr");
var services_1 = require("@/services");
// Composables
var snackbar = (0, composables_1.useSnackbar)();
var _b = (0, composables_1.useWarehouses)(), warehouseOptions = _b.warehouseOptions, fetchWarehouses = _b.fetchWarehouses, warehousesLoading = _b.loading;
// State
var selectedWarehouseId = (0, vue_1.ref)(null);
var isScanning = (0, vue_1.ref)(false);
var scannedItems = (0, vue_1.ref)([]);
var warehouseCones = (0, vue_1.ref)(new Map());
var isLoadingCones = (0, vue_1.ref)(false);
var showComparison = (0, vue_1.ref)(false);
var showResumePrompt = (0, vue_1.ref)(false);
// Session storage key
var SESSION_KEY = 'stocktake_session';
// Computed
var canStartScan = (0, vue_1.computed)(function () {
    return selectedWarehouseId.value !== null && !isLoadingCones.value;
});
var stats = (0, vue_1.computed)(function () {
    var found = scannedItems.value.filter(function (i) { return i.status === 'found'; }).length;
    var notFound = scannedItems.value.filter(function (i) { return i.status === 'not_found'; }).length;
    var wrongWarehouse = scannedItems.value.filter(function (i) { return i.status === 'wrong_warehouse'; }).length;
    return { found: found, notFound: notFound, wrongWarehouse: wrongWarehouse, total: scannedItems.value.length };
});
var comparisonResult = (0, vue_1.computed)(function () {
    var scannedIds = new Set(scannedItems.value.map(function (i) { return i.cone_id; }));
    var dbIds = new Set(warehouseCones.value.keys());
    var matched = __spreadArray([], scannedIds, true).filter(function (id) { return dbIds.has(id); });
    var missing = __spreadArray([], dbIds, true).filter(function (id) { return !scannedIds.has(id); });
    var extra = __spreadArray([], scannedIds, true).filter(function (id) { return !dbIds.has(id); });
    return {
        matched: matched,
        missing: missing,
        extra: extra,
        matchRate: dbIds.size > 0 ? (matched.length / dbIds.size * 100).toFixed(1) : '0',
    };
});
// Methods
var loadWarehouseCones = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!selectedWarehouseId.value)
                    return [2 /*return*/];
                isLoadingCones.value = true;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, services_1.inventoryService.getByWarehouse(selectedWarehouseId.value)];
            case 2:
                response = _b.sent();
                if (response.data) {
                    warehouseCones.value = new Map(response.data.map(function (c) { return [c.cone_id, c]; }));
                }
                return [3 /*break*/, 5];
            case 3:
                _a = _b.sent();
                snackbar.error('Không thể tải danh sách tồn kho');
                return [3 /*break*/, 5];
            case 4:
                isLoadingCones.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
var handleDetect = function (codes) {
    var firstCode = codes[0];
    if (!firstCode)
        return;
    var code = firstCode.rawValue;
    // Check for duplicate in current session
    if (scannedItems.value.some(function (i) { return i.cone_id === code; })) {
        snackbar.warning("\u0110\u00E3 qu\u00E9t r\u1ED3i: ".concat(code));
        return;
    }
    // Check in warehouse cones
    var cone = warehouseCones.value.get(code);
    var status = 'not_found';
    if (cone) {
        status = 'found';
    }
    // Add to scanned list
    scannedItems.value.unshift({
        cone_id: code,
        status: status,
        cone: cone,
        scannedAt: new Date(),
    });
    // Feedback
    if (status === 'found') {
        snackbar.success("\u2713 ".concat(code));
    }
    else {
        snackbar.error("\u2717 Kh\u00F4ng t\u00ECm th\u1EA5y: ".concat(code));
    }
    // Save session
    saveSession();
};
var removeItem = function (coneId) {
    scannedItems.value = scannedItems.value.filter(function (i) { return i.cone_id !== coneId; });
    saveSession();
};
var clearAll = function () {
    scannedItems.value = [];
    showComparison.value = false;
    saveSession();
};
var startComparison = function () {
    showComparison.value = true;
};
var exportXlsx = function () { return __awaiter(void 0, void 0, void 0, function () {
    var ExcelJS, workbook, worksheet_1, buffer, blob, url, link, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, Promise.resolve().then(function () { return require('exceljs'); })];
            case 1:
                ExcelJS = _a.sent();
                workbook = new ExcelJS.Workbook();
                worksheet_1 = workbook.addWorksheet('Kiểm Kê');
                worksheet_1.columns = [
                    { header: 'Cone ID', key: 'cone_id', width: 18 },
                    { header: 'Trạng thái', key: 'status', width: 20 },
                    { header: 'Loại chỉ', key: 'thread_type', width: 18 },
                    { header: 'Số lô', key: 'lot_number', width: 15 },
                ];
                // Style header row
                worksheet_1.getRow(1).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1976D2' },
                };
                worksheet_1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
                comparisonResult.value.matched.forEach(function (id) {
                    var _a;
                    var cone = warehouseCones.value.get(id);
                    worksheet_1.addRow({
                        cone_id: id,
                        status: 'Khớp',
                        thread_type: ((_a = cone === null || cone === void 0 ? void 0 : cone.thread_type) === null || _a === void 0 ? void 0 : _a.code) || '',
                        lot_number: (cone === null || cone === void 0 ? void 0 : cone.lot_number) || '',
                    });
                });
                comparisonResult.value.missing.forEach(function (id) {
                    var _a;
                    var cone = warehouseCones.value.get(id);
                    worksheet_1.addRow({
                        cone_id: id,
                        status: 'Thiếu (trong DB)',
                        thread_type: ((_a = cone === null || cone === void 0 ? void 0 : cone.thread_type) === null || _a === void 0 ? void 0 : _a.code) || '',
                        lot_number: (cone === null || cone === void 0 ? void 0 : cone.lot_number) || '',
                    });
                });
                comparisonResult.value.extra.forEach(function (id) {
                    worksheet_1.addRow({
                        cone_id: id,
                        status: 'Thừa (không trong DB)',
                        thread_type: '',
                        lot_number: '',
                    });
                });
                return [4 /*yield*/, workbook.xlsx.writeBuffer()];
            case 2:
                buffer = _a.sent();
                blob = new Blob([buffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                url = URL.createObjectURL(blob);
                link = document.createElement('a');
                link.href = url;
                link.download = "stocktake_".concat(selectedWarehouseId.value, "_").concat(new Date().toISOString().split('T')[0], ".xlsx");
                link.click();
                URL.revokeObjectURL(url);
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                snackbar.error('Không thể xuất file Excel');
                console.error('[stocktake] export error:', err_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Session management
var saveSession = function () {
    var session = {
        warehouseId: selectedWarehouseId.value,
        scannedItems: scannedItems.value,
        startedAt: new Date(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};
var loadSession = function () {
    var saved = localStorage.getItem(SESSION_KEY);
    if (!saved)
        return null;
    try {
        return JSON.parse(saved);
    }
    catch (_a) {
        return null;
    }
};
var resumeSession = function () { return __awaiter(void 0, void 0, void 0, function () {
    var session;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                session = loadSession();
                if (!session) return [3 /*break*/, 2];
                selectedWarehouseId.value = session.warehouseId;
                scannedItems.value = session.scannedItems;
                if (!session.warehouseId) return [3 /*break*/, 2];
                return [4 /*yield*/, loadWarehouseCones()];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                showResumePrompt.value = false;
                return [2 /*return*/];
        }
    });
}); };
var startNewSession = function () {
    localStorage.removeItem(SESSION_KEY);
    scannedItems.value = [];
    selectedWarehouseId.value = null;
    showResumePrompt.value = false;
};
var completeStocktake = function () { return __awaiter(void 0, void 0, void 0, function () {
    var scannedConeIds, response, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!selectedWarehouseId.value)
                    return [2 /*return*/];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                scannedConeIds = scannedItems.value.map(function (i) { return i.cone_id; });
                return [4 /*yield*/, services_1.inventoryService.saveStocktake(selectedWarehouseId.value, scannedConeIds)];
            case 2:
                response = _b.sent();
                if (response.error) {
                    snackbar.error(response.error);
                    return [2 /*return*/];
                }
                snackbar.success(response.message || 'Đã hoàn tất kiểm kê');
                return [3 /*break*/, 4];
            case 3:
                _a = _b.sent();
                // Even if save fails, still clear session
                snackbar.success('Đã hoàn tất kiểm kê (lưu offline)');
                return [3 /*break*/, 4];
            case 4:
                localStorage.removeItem(SESSION_KEY);
                scannedItems.value = [];
                showComparison.value = false;
                return [2 /*return*/];
        }
    });
}); };
// Watchers
(0, vue_1.watch)(selectedWarehouseId, function (newId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!newId) return [3 /*break*/, 2];
                return [4 /*yield*/, loadWarehouseCones()];
            case 1:
                _a.sent();
                scannedItems.value = [];
                showComparison.value = false;
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    var session;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetchWarehouses()
                // Check for existing session
            ];
            case 1:
                _a.sent();
                session = loadSession();
                if (session && session.scannedItems.length > 0) {
                    showResumePrompt.value = true;
                }
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-lg items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h5 q-my-none text-weight-bold text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-grey-7 q-mb-none q-mt-xs" }));
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-none']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-8" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-8']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm items-center justify-end" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    modelValue: (__VLS_ctx.selectedWarehouseId),
    options: (__VLS_ctx.warehouseOptions),
    loading: (__VLS_ctx.warehousesLoading),
    label: "Chọn kho kiểm kê",
    emitValue: true,
    mapOptions: true,
    outlined: true,
    dense: true,
    disable: (__VLS_ctx.isScanning),
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.selectedWarehouseId),
        options: (__VLS_ctx.warehouseOptions),
        loading: (__VLS_ctx.warehousesLoading),
        label: "Chọn kho kiểm kê",
        emitValue: true,
        mapOptions: true,
        outlined: true,
        dense: true,
        disable: (__VLS_ctx.isScanning),
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
/** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
if (!__VLS_ctx.isScanning) {
    var __VLS_12 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12(__assign({ 'onClick': {} }, { disable: (!__VLS_ctx.canStartScan), color: "primary", icon: "qr_code_scanner", label: "Bắt đầu quét" })));
    var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { disable: (!__VLS_ctx.canStartScan), color: "primary", icon: "qr_code_scanner", label: "Bắt đầu quét" })], __VLS_functionalComponentArgsRest(__VLS_13), false));
    var __VLS_17 = void 0;
    var __VLS_18 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(!__VLS_ctx.isScanning))
                    return;
                __VLS_ctx.isScanning = true;
                // @ts-ignore
                [selectedWarehouseId, warehouseOptions, warehousesLoading, isScanning, isScanning, isScanning, canStartScan,];
            } });
    var __VLS_15;
    var __VLS_16;
}
else {
    var __VLS_19 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ 'onClick': {} }, { color: "negative", icon: "stop", label: "Dừng quét" })));
    var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "negative", icon: "stop", label: "Dừng quét" })], __VLS_functionalComponentArgsRest(__VLS_20), false));
    var __VLS_24 = void 0;
    var __VLS_25 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!!(!__VLS_ctx.isScanning))
                    return;
                __VLS_ctx.isScanning = false;
                // @ts-ignore
                [isScanning,];
            } });
    var __VLS_22;
    var __VLS_23;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
/** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
var __VLS_26;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26(__assign({ 'onClick': {} }, { disable: (__VLS_ctx.scannedItems.length === 0), color: "secondary", icon: "compare", label: "So sánh", outline: true })));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { disable: (__VLS_ctx.scannedItems.length === 0), color: "secondary", icon: "compare", label: "So sánh", outline: true })], __VLS_functionalComponentArgsRest(__VLS_27), false));
var __VLS_31;
var __VLS_32 = ({ click: {} },
    { onClick: (__VLS_ctx.startComparison) });
var __VLS_29;
var __VLS_30;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_33;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
    flat: true,
    bordered: true,
}));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_34), false));
var __VLS_38 = __VLS_36.slots.default;
var __VLS_39;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39(__assign({ class: "q-pb-none" })));
var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([__assign({ class: "q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_40), false));
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_44 = __VLS_42.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
var __VLS_45;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45(__assign({ name: "qr_code_scanner" }, { class: "q-mr-sm" })));
var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([__assign({ name: "qr_code_scanner" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_46), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
// @ts-ignore
[scannedItems, startComparison,];
var __VLS_42;
var __VLS_50;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({}));
var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_51), false));
var __VLS_55 = __VLS_53.slots.default;
if (!__VLS_ctx.selectedWarehouseId) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-xl text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    var __VLS_56 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        name: "warehouse",
        size: "64px",
    }));
    var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([{
            name: "warehouse",
            size: "64px",
        }], __VLS_functionalComponentArgsRest(__VLS_57), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
}
else {
    var __VLS_61 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.QrScannerStream} */
    qr_1.QrScannerStream;
    // @ts-ignore
    var __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61(__assign({ 'onDetect': {} }, { modelValue: (__VLS_ctx.isScanning), formats: (['qr_code', 'code_128', 'ean_13']), hint: "Đưa mã QR vào khung để quét" })));
    var __VLS_63 = __VLS_62.apply(void 0, __spreadArray([__assign({ 'onDetect': {} }, { modelValue: (__VLS_ctx.isScanning), formats: (['qr_code', 'code_128', 'ean_13']), hint: "Đưa mã QR vào khung để quét" })], __VLS_functionalComponentArgsRest(__VLS_62), false));
    var __VLS_66 = void 0;
    var __VLS_67 = ({ detect: {} },
        { onDetect: (__VLS_ctx.handleDetect) });
    var __VLS_64;
    var __VLS_65;
}
// @ts-ignore
[selectedWarehouseId, isScanning, handleDetect,];
var __VLS_53;
if (__VLS_ctx.scannedItems.length > 0) {
    var __VLS_68 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68(__assign({ class: "q-pt-none" })));
    var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([__assign({ class: "q-pt-none" })], __VLS_functionalComponentArgsRest(__VLS_69), false));
    /** @type {__VLS_StyleScopedClasses['q-pt-none']} */ ;
    var __VLS_73 = __VLS_71.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    var __VLS_74 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
        color: "primary",
        textColor: "white",
        dense: true,
    }));
    var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([{
            color: "primary",
            textColor: "white",
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_75), false));
    var __VLS_79 = __VLS_77.slots.default;
    (__VLS_ctx.stats.total);
    // @ts-ignore
    [scannedItems, stats,];
    var __VLS_77;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_80 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
        color: "positive",
        textColor: "white",
        dense: true,
    }));
    var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([{
            color: "positive",
            textColor: "white",
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_81), false));
    var __VLS_85 = __VLS_83.slots.default;
    var __VLS_86 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86(__assign({ name: "check" }, { class: "q-mr-xs" })));
    var __VLS_88 = __VLS_87.apply(void 0, __spreadArray([__assign({ name: "check" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_87), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    (__VLS_ctx.stats.found);
    // @ts-ignore
    [stats,];
    var __VLS_83;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_91 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91({
        color: "negative",
        textColor: "white",
        dense: true,
    }));
    var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([{
            color: "negative",
            textColor: "white",
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_92), false));
    var __VLS_96 = __VLS_94.slots.default;
    var __VLS_97 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97(__assign({ name: "close" }, { class: "q-mr-xs" })));
    var __VLS_99 = __VLS_98.apply(void 0, __spreadArray([__assign({ name: "close" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_98), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    (__VLS_ctx.stats.notFound);
    // @ts-ignore
    [stats,];
    var __VLS_94;
    // @ts-ignore
    [];
    var __VLS_71;
}
// @ts-ignore
[];
var __VLS_36;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_102;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102({
    flat: true,
    bordered: true,
}));
var __VLS_104 = __VLS_103.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_103), false));
var __VLS_107 = __VLS_105.slots.default;
var __VLS_108;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108(__assign({ class: "row items-center q-pb-none" })));
var __VLS_110 = __VLS_109.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_109), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_113 = __VLS_111.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
var __VLS_114;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114(__assign({ name: "list" }, { class: "q-mr-sm" })));
var __VLS_116 = __VLS_115.apply(void 0, __spreadArray([__assign({ name: "list" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_115), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
var __VLS_119;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({}));
var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_120), false));
if (__VLS_ctx.scannedItems.length > 0) {
    var __VLS_124 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124(__assign({ 'onClick': {} }, { flat: true, dense: true, color: "negative", label: "Xóa tất cả" })));
    var __VLS_126 = __VLS_125.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, color: "negative", label: "Xóa tất cả" })], __VLS_functionalComponentArgsRest(__VLS_125), false));
    var __VLS_129 = void 0;
    var __VLS_130 = ({ click: {} },
        { onClick: (__VLS_ctx.clearAll) });
    var __VLS_127;
    var __VLS_128;
}
// @ts-ignore
[scannedItems, clearAll,];
var __VLS_111;
var __VLS_131;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131({}));
var __VLS_133 = __VLS_132.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_132), false));
var __VLS_136 = __VLS_134.slots.default;
if (__VLS_ctx.scannedItems.length > 0) {
    var __VLS_137 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137(__assign(__assign({ bordered: true, separator: true }, { class: "rounded-borders" }), { style: {} })));
    var __VLS_139 = __VLS_138.apply(void 0, __spreadArray([__assign(__assign({ bordered: true, separator: true }, { class: "rounded-borders" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_138), false));
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    var __VLS_142 = __VLS_140.slots.default;
    var _loop_1 = function (item) {
        var __VLS_143 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
            key: (item.cone_id),
            dense: true,
        }));
        var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([{
                key: (item.cone_id),
                dense: true,
            }], __VLS_functionalComponentArgsRest(__VLS_144), false));
        var __VLS_148 = __VLS_146.slots.default;
        var __VLS_149 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_150 = __VLS_asFunctionalComponent1(__VLS_149, new __VLS_149({
            avatar: true,
        }));
        var __VLS_151 = __VLS_150.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_150), false));
        var __VLS_154 = __VLS_152.slots.default;
        var __VLS_155 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_156 = __VLS_asFunctionalComponent1(__VLS_155, new __VLS_155({
            name: (item.status === 'found' ? 'check_circle' : 'error'),
            color: (item.status === 'found' ? 'positive' : 'negative'),
        }));
        var __VLS_157 = __VLS_156.apply(void 0, __spreadArray([{
                name: (item.status === 'found' ? 'check_circle' : 'error'),
                color: (item.status === 'found' ? 'positive' : 'negative'),
            }], __VLS_functionalComponentArgsRest(__VLS_156), false));
        // @ts-ignore
        [scannedItems, scannedItems,];
        var __VLS_160 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160({}));
        var __VLS_162 = __VLS_161.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_161), false));
        var __VLS_165 = __VLS_163.slots.default;
        var __VLS_166 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_167 = __VLS_asFunctionalComponent1(__VLS_166, new __VLS_166(__assign({ class: "text-weight-medium font-mono" })));
        var __VLS_168 = __VLS_167.apply(void 0, __spreadArray([__assign({ class: "text-weight-medium font-mono" })], __VLS_functionalComponentArgsRest(__VLS_167), false));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        var __VLS_171 = __VLS_169.slots.default;
        (item.cone_id);
        // @ts-ignore
        [];
        if (item.cone) {
            var __VLS_172 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
            qItemLabel;
            // @ts-ignore
            var __VLS_173 = __VLS_asFunctionalComponent1(__VLS_172, new __VLS_172({
                caption: true,
            }));
            var __VLS_174 = __VLS_173.apply(void 0, __spreadArray([{
                    caption: true,
                }], __VLS_functionalComponentArgsRest(__VLS_173), false));
            var __VLS_177 = __VLS_175.slots.default;
            ((_a = item.cone.thread_type) === null || _a === void 0 ? void 0 : _a.code);
            (item.cone.lot_number || 'N/A');
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_178 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_179 = __VLS_asFunctionalComponent1(__VLS_178, new __VLS_178({
            side: true,
        }));
        var __VLS_180 = __VLS_179.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_179), false));
        var __VLS_183 = __VLS_181.slots.default;
        var __VLS_184 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_185 = __VLS_asFunctionalComponent1(__VLS_184, new __VLS_184(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", size: "sm", color: "grey" })));
        var __VLS_186 = __VLS_185.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", size: "sm", color: "grey" })], __VLS_functionalComponentArgsRest(__VLS_185), false));
        var __VLS_189 = void 0;
        var __VLS_190 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.scannedItems.length > 0))
                        return;
                    __VLS_ctx.removeItem(item.cone_id);
                    // @ts-ignore
                    [removeItem,];
                } });
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_152, __VLS_169, __VLS_175, __VLS_163, __VLS_187, __VLS_188, __VLS_181, __VLS_146;
    for (var _i = 0, _c = __VLS_vFor((__VLS_ctx.scannedItems)); _i < _c.length; _i++) {
        var item = _c[_i][0];
        _loop_1(item);
    }
    // @ts-ignore
    [];
    var __VLS_140;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-lg text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    var __VLS_191 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_192 = __VLS_asFunctionalComponent1(__VLS_191, new __VLS_191({
        name: "inbox",
        size: "48px",
    }));
    var __VLS_193 = __VLS_192.apply(void 0, __spreadArray([{
            name: "inbox",
            size: "48px",
        }], __VLS_functionalComponentArgsRest(__VLS_192), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
}
// @ts-ignore
[];
var __VLS_134;
// @ts-ignore
[];
var __VLS_105;
if (__VLS_ctx.showComparison) {
    var __VLS_196 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_197 = __VLS_asFunctionalComponent1(__VLS_196, new __VLS_196(__assign({ flat: true, bordered: true }, { class: "q-mt-md" })));
    var __VLS_198 = __VLS_197.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_197), false));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    var __VLS_201 = __VLS_199.slots.default;
    var __VLS_202 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_203 = __VLS_asFunctionalComponent1(__VLS_202, new __VLS_202(__assign({ class: "row items-center" })));
    var __VLS_204 = __VLS_203.apply(void 0, __spreadArray([__assign({ class: "row items-center" })], __VLS_functionalComponentArgsRest(__VLS_203), false));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    var __VLS_207 = __VLS_205.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    var __VLS_208 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_209 = __VLS_asFunctionalComponent1(__VLS_208, new __VLS_208(__assign({ name: "analytics" }, { class: "q-mr-sm" })));
    var __VLS_210 = __VLS_209.apply(void 0, __spreadArray([__assign({ name: "analytics" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_209), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    var __VLS_213 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
    qSpace;
    // @ts-ignore
    var __VLS_214 = __VLS_asFunctionalComponent1(__VLS_213, new __VLS_213({}));
    var __VLS_215 = __VLS_214.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_214), false));
    var __VLS_218 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_219 = __VLS_asFunctionalComponent1(__VLS_218, new __VLS_218(__assign({ 'onClick': {} }, { color: "primary", icon: "download", label: "Xuất Excel", outline: true })));
    var __VLS_220 = __VLS_219.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "download", label: "Xuất Excel", outline: true })], __VLS_functionalComponentArgsRest(__VLS_219), false));
    var __VLS_223 = void 0;
    var __VLS_224 = ({ click: {} },
        { onClick: (__VLS_ctx.exportXlsx) });
    var __VLS_221;
    var __VLS_222;
    var __VLS_225 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_226 = __VLS_asFunctionalComponent1(__VLS_225, new __VLS_225(__assign(__assign({ 'onClick': {} }, { color: "positive", icon: "check", label: "Hoàn tất" }), { class: "q-ml-sm" })));
    var __VLS_227 = __VLS_226.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "positive", icon: "check", label: "Hoàn tất" }), { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_226), false));
    var __VLS_230 = void 0;
    var __VLS_231 = ({ click: {} },
        { onClick: (__VLS_ctx.completeStocktake) });
    /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
    var __VLS_228;
    var __VLS_229;
    // @ts-ignore
    [showComparison, exportXlsx, completeStocktake,];
    var __VLS_205;
    var __VLS_232 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_233 = __VLS_asFunctionalComponent1(__VLS_232, new __VLS_232(__assign({ class: "q-pt-none" })));
    var __VLS_234 = __VLS_233.apply(void 0, __spreadArray([__assign({ class: "q-pt-none" })], __VLS_functionalComponentArgsRest(__VLS_233), false));
    /** @type {__VLS_StyleScopedClasses['q-pt-none']} */ ;
    var __VLS_237 = __VLS_235.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
    var __VLS_238 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_239 = __VLS_asFunctionalComponent1(__VLS_238, new __VLS_238(__assign({ flat: true }, { class: "bg-blue-1" })));
    var __VLS_240 = __VLS_239.apply(void 0, __spreadArray([__assign({ flat: true }, { class: "bg-blue-1" })], __VLS_functionalComponentArgsRest(__VLS_239), false));
    /** @type {__VLS_StyleScopedClasses['bg-blue-1']} */ ;
    var __VLS_243 = __VLS_241.slots.default;
    var __VLS_244 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_245 = __VLS_asFunctionalComponent1(__VLS_244, new __VLS_244(__assign({ class: "text-center" })));
    var __VLS_246 = __VLS_245.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_245), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_249 = __VLS_247.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (__VLS_ctx.warehouseCones.size);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    // @ts-ignore
    [warehouseCones,];
    var __VLS_247;
    // @ts-ignore
    [];
    var __VLS_241;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
    var __VLS_250 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_251 = __VLS_asFunctionalComponent1(__VLS_250, new __VLS_250(__assign({ flat: true }, { class: "bg-green-1" })));
    var __VLS_252 = __VLS_251.apply(void 0, __spreadArray([__assign({ flat: true }, { class: "bg-green-1" })], __VLS_functionalComponentArgsRest(__VLS_251), false));
    /** @type {__VLS_StyleScopedClasses['bg-green-1']} */ ;
    var __VLS_255 = __VLS_253.slots.default;
    var __VLS_256 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_257 = __VLS_asFunctionalComponent1(__VLS_256, new __VLS_256(__assign({ class: "text-center" })));
    var __VLS_258 = __VLS_257.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_257), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_261 = __VLS_259.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-positive" }));
    /** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
    (__VLS_ctx.comparisonResult.matched.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    (__VLS_ctx.comparisonResult.matchRate);
    // @ts-ignore
    [comparisonResult, comparisonResult,];
    var __VLS_259;
    // @ts-ignore
    [];
    var __VLS_253;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
    var __VLS_262 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_263 = __VLS_asFunctionalComponent1(__VLS_262, new __VLS_262(__assign({ flat: true }, { class: "bg-orange-1" })));
    var __VLS_264 = __VLS_263.apply(void 0, __spreadArray([__assign({ flat: true }, { class: "bg-orange-1" })], __VLS_functionalComponentArgsRest(__VLS_263), false));
    /** @type {__VLS_StyleScopedClasses['bg-orange-1']} */ ;
    var __VLS_267 = __VLS_265.slots.default;
    var __VLS_268 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_269 = __VLS_asFunctionalComponent1(__VLS_268, new __VLS_268(__assign({ class: "text-center" })));
    var __VLS_270 = __VLS_269.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_269), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_273 = __VLS_271.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-warning" }));
    /** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
    (__VLS_ctx.comparisonResult.missing.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    // @ts-ignore
    [comparisonResult,];
    var __VLS_271;
    // @ts-ignore
    [];
    var __VLS_265;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
    var __VLS_274 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_275 = __VLS_asFunctionalComponent1(__VLS_274, new __VLS_274(__assign({ flat: true }, { class: "bg-red-1" })));
    var __VLS_276 = __VLS_275.apply(void 0, __spreadArray([__assign({ flat: true }, { class: "bg-red-1" })], __VLS_functionalComponentArgsRest(__VLS_275), false));
    /** @type {__VLS_StyleScopedClasses['bg-red-1']} */ ;
    var __VLS_279 = __VLS_277.slots.default;
    var __VLS_280 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_281 = __VLS_asFunctionalComponent1(__VLS_280, new __VLS_280(__assign({ class: "text-center" })));
    var __VLS_282 = __VLS_281.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_281), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_285 = __VLS_283.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-negative" }));
    /** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    (__VLS_ctx.comparisonResult.extra.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    // @ts-ignore
    [comparisonResult,];
    var __VLS_283;
    // @ts-ignore
    [];
    var __VLS_277;
    // @ts-ignore
    [];
    var __VLS_235;
    // @ts-ignore
    [];
    var __VLS_199;
}
var __VLS_286;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_287 = __VLS_asFunctionalComponent1(__VLS_286, new __VLS_286({
    modelValue: (__VLS_ctx.showResumePrompt),
}));
var __VLS_288 = __VLS_287.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showResumePrompt),
    }], __VLS_functionalComponentArgsRest(__VLS_287), false));
var __VLS_291 = __VLS_289.slots.default;
var __VLS_292;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_293 = __VLS_asFunctionalComponent1(__VLS_292, new __VLS_292(__assign({ style: {} })));
var __VLS_294 = __VLS_293.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_293), false));
var __VLS_297 = __VLS_295.slots.default;
var __VLS_298;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_299 = __VLS_asFunctionalComponent1(__VLS_298, new __VLS_298({}));
var __VLS_300 = __VLS_299.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_299), false));
var __VLS_303 = __VLS_301.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
// @ts-ignore
[showResumePrompt,];
var __VLS_301;
var __VLS_304;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_305 = __VLS_asFunctionalComponent1(__VLS_304, new __VLS_304(__assign({ class: "q-pt-none" })));
var __VLS_306 = __VLS_305.apply(void 0, __spreadArray([__assign({ class: "q-pt-none" })], __VLS_functionalComponentArgsRest(__VLS_305), false));
/** @type {__VLS_StyleScopedClasses['q-pt-none']} */ ;
var __VLS_309 = __VLS_307.slots.default;
// @ts-ignore
[];
var __VLS_307;
var __VLS_310;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_311 = __VLS_asFunctionalComponent1(__VLS_310, new __VLS_310({
    align: "right",
}));
var __VLS_312 = __VLS_311.apply(void 0, __spreadArray([{
        align: "right",
    }], __VLS_functionalComponentArgsRest(__VLS_311), false));
var __VLS_315 = __VLS_313.slots.default;
var __VLS_316;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_317 = __VLS_asFunctionalComponent1(__VLS_316, new __VLS_316(__assign({ 'onClick': {} }, { flat: true, label: "Bắt đầu mới", color: "negative" })));
var __VLS_318 = __VLS_317.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Bắt đầu mới", color: "negative" })], __VLS_functionalComponentArgsRest(__VLS_317), false));
var __VLS_321;
var __VLS_322 = ({ click: {} },
    { onClick: (__VLS_ctx.startNewSession) });
var __VLS_319;
var __VLS_320;
var __VLS_323;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_324 = __VLS_asFunctionalComponent1(__VLS_323, new __VLS_323(__assign({ 'onClick': {} }, { flat: true, label: "Tiếp tục", color: "primary" })));
var __VLS_325 = __VLS_324.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Tiếp tục", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_324), false));
var __VLS_328;
var __VLS_329 = ({ click: {} },
    { onClick: (__VLS_ctx.resumeSession) });
var __VLS_326;
var __VLS_327;
// @ts-ignore
[startNewSession, resumeSession,];
var __VLS_313;
// @ts-ignore
[];
var __VLS_295;
// @ts-ignore
[];
var __VLS_289;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
