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
var vue_router_1 = require("vue-router");
var useSnackbar_1 = require("@/composables/useSnackbar");
var colorService_1 = require("@/services/colorService");
var importService_1 = require("@/services/importService");
var supplierService_1 = require("@/services/supplierService");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var PageHeader_vue_1 = require("@/components/ui/layout/PageHeader.vue");
var AppStepper_vue_1 = require("@/components/ui/navigation/AppStepper.vue");
var FilePicker_vue_1 = require("@/components/ui/pickers/FilePicker.vue");
definePage({
    meta: {
        requiresAuth: true,
        permissions: ['thread.suppliers.manage'],
    },
});
var route = (0, vue_router_1.useRoute)();
var router = (0, vue_router_1.useRouter)();
var snackbar = (0, useSnackbar_1.useSnackbar)();
var steps = [
    { name: 'upload', title: 'Chọn file', icon: 'upload_file' },
    { name: 'preview', title: 'Xem trước', icon: 'preview' },
    { name: 'result', title: 'Kết quả', icon: 'check_circle' },
];
var currentStep = (0, vue_1.ref)('upload');
var selectedSupplierId = (0, vue_1.ref)(null);
var selectedFile = (0, vue_1.ref)(null);
var parsing = (0, vue_1.ref)(false);
var parseError = (0, vue_1.ref)('');
var importing = (0, vue_1.ref)(false);
var importProgress = (0, vue_1.ref)(0);
var importPhase = (0, vue_1.ref)('');
var importPhaseMessage = (0, vue_1.ref)('');
var parsedRows = (0, vue_1.ref)([]);
var importResult = (0, vue_1.ref)(null);
var loadingSuppliers = (0, vue_1.ref)(false);
var suppliers = (0, vue_1.ref)([]);
var existingColors = (0, vue_1.ref)([]);
var mappingConfig = (0, vue_1.ref)(null);
var supplierOptions = (0, vue_1.computed)(function () {
    return suppliers.value.map(function (supplier) { return ({
        label: "".concat(supplier.code, " - ").concat(supplier.name),
        value: supplier.id,
    }); });
});
var summary = (0, vue_1.computed)(function () {
    var rows = parsedRows.value;
    return {
        valid: rows.filter(function (row) { return row.status !== 'error'; }).length,
        newCount: rows.filter(function (row) { return row.status === 'new_color'; }).length,
        existsCount: rows.filter(function (row) { return row.status === 'exists'; }).length,
        errorCount: rows.filter(function (row) { return row.status === 'error'; }).length,
    };
});
var previewColumns = [
    { name: 'row_number', label: '#', field: 'row_number', align: 'center', sortable: true },
    { name: 'color_name', label: 'Tên màu', field: 'color_name', align: 'left', sortable: true },
    {
        name: 'supplier_color_code',
        label: 'Mã màu NCC',
        field: 'supplier_color_code',
        align: 'left',
        format: function (value) { return value || '-'; },
    },
    { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
];
function getStatusColor(status) {
    switch (status) {
        case 'new_color':
            return 'info';
        case 'exists':
            return 'blue-grey';
        case 'error':
            return 'negative';
        default:
            return 'grey';
    }
}
function getStatusLabel(status) {
    switch (status) {
        case 'new_color':
            return 'Màu mới';
        case 'exists':
            return 'Đã có';
        case 'error':
            return 'Lỗi';
        default:
            return status;
    }
}
function resetPreviewState() {
    parseError.value = '';
    parsedRows.value = [];
    importResult.value = null;
    if (currentStep.value !== 'upload') {
        currentStep.value = 'upload';
    }
}
function onSupplierSelected() {
    resetPreviewState();
}
function onFileSelected(file) {
    var _a;
    if (Array.isArray(file)) {
        selectedFile.value = (_a = file[0]) !== null && _a !== void 0 ? _a : null;
    }
    resetPreviewState();
}
function resetFlow() {
    selectedFile.value = null;
    resetPreviewState();
}
function loadMappingConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var config;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (mappingConfig.value)
                        return [2 /*return*/, mappingConfig.value];
                    return [4 /*yield*/, importService_1.importService.getSupplierColorMapping()];
                case 1:
                    config = _a.sent();
                    mappingConfig.value = config;
                    return [2 /*return*/, config];
            }
        });
    });
}
function loadInitialData() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, supplierData, colorData, preSelectedId_1, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    loadingSuppliers.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all([
                            supplierService_1.supplierService.getAll({ is_active: true }),
                            colorService_1.colorService.getAll(),
                        ])];
                case 2:
                    _a = _b.sent(), supplierData = _a[0], colorData = _a[1];
                    suppliers.value = supplierData;
                    existingColors.value = colorData;
                    preSelectedId_1 = Number(route.query.supplier_id);
                    if (!Number.isNaN(preSelectedId_1) && suppliers.value.some(function (supplier) { return supplier.id === preSelectedId_1; })) {
                        selectedSupplierId.value = preSelectedId_1;
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _b.sent();
                    snackbar.error('Lỗi khi tải dữ liệu');
                    console.error(error_1);
                    return [3 /*break*/, 5];
                case 4:
                    loadingSuppliers.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function parseFile() {
    return __awaiter(this, void 0, void 0, function () {
        var config, ExcelJS, workbook, buffer, sheet, columns, rows, existingColorNames, fileColorNames, rowIdx, row, colorName, supplierColorCode, normalizedColor, errors, status_1, error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!selectedSupplierId.value) {
                        parseError.value = 'Vui lòng chọn nhà cung cấp';
                        return [2 /*return*/];
                    }
                    if (!selectedFile.value) {
                        parseError.value = 'Vui lòng chọn file Excel';
                        return [2 /*return*/];
                    }
                    parsing.value = true;
                    parseError.value = '';
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, loadMappingConfig()];
                case 2:
                    config = _c.sent();
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('exceljs'); })];
                case 3:
                    ExcelJS = _c.sent();
                    workbook = new ExcelJS.Workbook();
                    return [4 /*yield*/, selectedFile.value.arrayBuffer()];
                case 4:
                    buffer = _c.sent();
                    return [4 /*yield*/, workbook.xlsx.load(buffer)];
                case 5:
                    _c.sent();
                    sheet = workbook.worksheets[config.sheet_index];
                    if (!sheet) {
                        parseError.value = "Kh\u00F4ng t\u00ECm th\u1EA5y sheet t\u1EA1i v\u1ECB tr\u00ED ".concat(config.sheet_index);
                        return [2 /*return*/];
                    }
                    columns = config.columns;
                    rows = [];
                    existingColorNames = new Set(existingColors.value.map(function (color) { return color.name.toLowerCase().trim(); }));
                    fileColorNames = new Set();
                    for (rowIdx = config.data_start_row; rowIdx <= sheet.rowCount; rowIdx++) {
                        row = sheet.getRow(rowIdx);
                        colorName = String((_a = row.getCell(columns.color_name || 'A').value) !== null && _a !== void 0 ? _a : '').trim();
                        supplierColorCode = String((_b = row.getCell(columns.supplier_color_code || 'B').value) !== null && _b !== void 0 ? _b : '').trim();
                        if (!colorName)
                            continue;
                        normalizedColor = colorName.toLowerCase();
                        errors = [];
                        status_1 = existingColorNames.has(normalizedColor) ? 'exists' : 'new_color';
                        if (fileColorNames.has(normalizedColor)) {
                            status_1 = 'error';
                            errors.push('Tên màu bị trùng trong file');
                        }
                        else {
                            fileColorNames.add(normalizedColor);
                        }
                        rows.push({
                            row_number: rowIdx,
                            color_name: colorName,
                            supplier_color_code: supplierColorCode || undefined,
                            status: status_1,
                            errors: errors,
                        });
                    }
                    if (rows.length === 0) {
                        parseError.value = 'Không tìm thấy dữ liệu trong file. Kiểm tra lại cấu hình sheet và dòng bắt đầu.';
                        return [2 /*return*/];
                    }
                    parsedRows.value = rows;
                    snackbar.success("\u0110\u00E3 \u0111\u1ECDc ".concat(rows.length, " d\u00F2ng t\u1EEB file Excel"));
                    currentStep.value = 'preview';
                    return [3 /*break*/, 8];
                case 6:
                    error_2 = _c.sent();
                    parseError.value = error_2 instanceof Error ? error_2.message : 'Lỗi khi đọc file Excel';
                    return [3 /*break*/, 8];
                case 7:
                    parsing.value = false;
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function doImport() {
    return __awaiter(this, void 0, void 0, function () {
        var validRows, result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedSupplierId.value)
                        return [2 /*return*/];
                    validRows = parsedRows.value.filter(function (row) { return row.status !== 'error'; });
                    if (validRows.length === 0) {
                        snackbar.error('Không có dòng hợp lệ để import');
                        return [2 /*return*/];
                    }
                    importing.value = true;
                    importProgress.value = 0;
                    importPhase.value = '';
                    importPhaseMessage.value = '';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, importService_1.importService.importSupplierColorsStream(selectedSupplierId.value, validRows, function (event) {
                            if (event.type === 'progress') {
                                var _a = event.data, phase = _a.phase, processed = _a.processed, total = _a.total, message = _a.message;
                                importProgress.value = total > 0 ? Math.round((processed / total) * 100) / 100 : 0;
                                if (phase === 'prepare') {
                                    importPhase.value = 'Chuẩn bị';
                                    importPhaseMessage.value = message || 'Đang chuẩn bị dữ liệu...';
                                }
                                else if (phase === 'colors') {
                                    importPhase.value = 'Tạo màu';
                                    importPhaseMessage.value = "\u0110ang t\u1EA1o m\u00E0u m\u1EDBi: ".concat(processed, "/").concat(total);
                                }
                                else if (phase === 'links') {
                                    importPhase.value = 'Liên kết';
                                    importPhaseMessage.value = "\u0110ang li\u00EAn k\u1EBFt NCC: ".concat(processed, "/").concat(total);
                                }
                            }
                        })];
                case 2:
                    result = _a.sent();
                    importResult.value = result;
                    snackbar.success("Import th\u00E0nh c\u00F4ng ".concat(result.imported, " li\u00EAn k\u1EBFt"));
                    currentStep.value = 'result';
                    return [3 /*break*/, 5];
                case 3:
                    error_3 = _a.sent();
                    snackbar.error(error_3 instanceof Error ? error_3.message : 'Lỗi khi import dữ liệu');
                    return [3 /*break*/, 5];
                case 4:
                    importing.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function downloadTemplate() {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, importService_1.importService.downloadColorTemplate()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    snackbar.error(error_4 instanceof Error ? error_4.message : 'Không thể tải file mẫu');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.onMounted)(function () {
    loadInitialData();
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
var __VLS_7 = PageHeader_vue_1.default || PageHeader_vue_1.default;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    title: "Import Màu cho NCC",
    subtitle: "Nhập danh sách màu từ file Excel và liên kết với nhà cung cấp",
    showBack: true,
    backTo: "/thread/suppliers",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Import Màu cho NCC",
        subtitle: "Nhập danh sách màu từ file Excel và liên kết với nhà cung cấp",
        showBack: true,
        backTo: "/thread/suppliers",
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
{
    var __VLS_13 = __VLS_10.slots.actions;
    var __VLS_14 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign({ 'onClick': {} }, { label: "Tải mẫu Excel", icon: "download", variant: "outlined", color: "primary" })));
    var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Tải mẫu Excel", icon: "download", variant: "outlined", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_15), false));
    var __VLS_19 = void 0;
    var __VLS_20 = ({ click: {} },
        { onClick: (__VLS_ctx.downloadTemplate) });
    var __VLS_17;
    var __VLS_18;
    // @ts-ignore
    [downloadTemplate,];
}
// @ts-ignore
[];
var __VLS_10;
var __VLS_21 = AppStepper_vue_1.default || AppStepper_vue_1.default;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21(__assign({ modelValue: (__VLS_ctx.currentStep), steps: (__VLS_ctx.steps), flat: true, bordered: true, headerNav: (false) }, { class: "q-mt-md" })));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.currentStep), steps: (__VLS_ctx.steps), flat: true, bordered: true, headerNav: (false) }, { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_22), false));
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
var __VLS_26 = __VLS_24.slots.default;
{
    var __VLS_27 = __VLS_24.slots["step-upload"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md items-start" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
    var __VLS_28 = AppSelect_vue_1.default;
    // @ts-ignore
    var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.selectedSupplierId), options: (__VLS_ctx.supplierOptions), label: "Nhà cung cấp", optionValue: "value", optionLabel: "label", useInput: true, clearable: true, dense: true, hideBottomSpace: true, loading: (__VLS_ctx.loadingSuppliers), disable: (__VLS_ctx.parsing || __VLS_ctx.importing), required: true })));
    var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.selectedSupplierId), options: (__VLS_ctx.supplierOptions), label: "Nhà cung cấp", optionValue: "value", optionLabel: "label", useInput: true, clearable: true, dense: true, hideBottomSpace: true, loading: (__VLS_ctx.loadingSuppliers), disable: (__VLS_ctx.parsing || __VLS_ctx.importing), required: true })], __VLS_functionalComponentArgsRest(__VLS_29), false));
    var __VLS_33 = void 0;
    var __VLS_34 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onSupplierSelected) });
    var __VLS_31;
    var __VLS_32;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
    var __VLS_35 = FilePicker_vue_1.default;
    // @ts-ignore
    var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.selectedFile), accept: ".xlsx,.xls", label: "Chọn file Excel", hint: "Định dạng: .xlsx hoặc .xls", dense: true, hideBottomSpace: true, disable: (!__VLS_ctx.selectedSupplierId || __VLS_ctx.parsing || __VLS_ctx.importing) })));
    var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.selectedFile), accept: ".xlsx,.xls", label: "Chọn file Excel", hint: "Định dạng: .xlsx hoặc .xls", dense: true, hideBottomSpace: true, disable: (!__VLS_ctx.selectedSupplierId || __VLS_ctx.parsing || __VLS_ctx.importing) })], __VLS_functionalComponentArgsRest(__VLS_36), false));
    var __VLS_40 = void 0;
    var __VLS_41 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onFileSelected) });
    var __VLS_38;
    var __VLS_39;
    if (__VLS_ctx.parseError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-negative q-mt-sm" }));
        /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
        (__VLS_ctx.parseError);
    }
    var __VLS_42 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
    qStepperNavigation;
    // @ts-ignore
    var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({}));
    var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_43), false));
    var __VLS_47 = __VLS_45.slots.default;
    var __VLS_48 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48(__assign({ 'onClick': {} }, { label: "Tiếp tục", iconRight: "arrow_forward", disable: (!__VLS_ctx.selectedSupplierId || !__VLS_ctx.selectedFile || __VLS_ctx.parsing), loading: (__VLS_ctx.parsing) })));
    var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Tiếp tục", iconRight: "arrow_forward", disable: (!__VLS_ctx.selectedSupplierId || !__VLS_ctx.selectedFile || __VLS_ctx.parsing), loading: (__VLS_ctx.parsing) })], __VLS_functionalComponentArgsRest(__VLS_49), false));
    var __VLS_53 = void 0;
    var __VLS_54 = ({ click: {} },
        { onClick: (__VLS_ctx.parseFile) });
    var __VLS_51;
    var __VLS_52;
    // @ts-ignore
    [currentStep, steps, selectedSupplierId, selectedSupplierId, selectedSupplierId, supplierOptions, loadingSuppliers, parsing, parsing, parsing, parsing, importing, importing, onSupplierSelected, selectedFile, selectedFile, onFileSelected, parseError, parseError, parseFile,];
    var __VLS_45;
    // @ts-ignore
    [];
}
{
    var __VLS_55 = __VLS_24.slots["step-preview"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_56 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56(__assign({ color: "positive" }, { class: "q-pa-sm text-body2" })));
    var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([__assign({ color: "positive" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_57), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    var __VLS_61 = __VLS_59.slots.default;
    (__VLS_ctx.summary.valid);
    // @ts-ignore
    [summary,];
    var __VLS_59;
    if (__VLS_ctx.summary.newCount > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_62 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62(__assign({ color: "info" }, { class: "q-pa-sm text-body2" })));
        var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([__assign({ color: "info" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_63), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_67 = __VLS_65.slots.default;
        (__VLS_ctx.summary.newCount);
        // @ts-ignore
        [summary, summary,];
        var __VLS_65;
    }
    if (__VLS_ctx.summary.existsCount > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_68 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68(__assign({ color: "blue-grey" }, { class: "q-pa-sm text-body2" })));
        var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([__assign({ color: "blue-grey" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_69), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_73 = __VLS_71.slots.default;
        (__VLS_ctx.summary.existsCount);
        // @ts-ignore
        [summary, summary,];
        var __VLS_71;
    }
    if (__VLS_ctx.summary.errorCount > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_74 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74(__assign({ color: "negative" }, { class: "q-pa-sm text-body2" })));
        var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([__assign({ color: "negative" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_75), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_79 = __VLS_77.slots.default;
        (__VLS_ctx.summary.errorCount);
        // @ts-ignore
        [summary, summary,];
        var __VLS_77;
    }
    var __VLS_80 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
        flat: true,
        bordered: true,
        dense: true,
        rows: (__VLS_ctx.parsedRows),
        columns: (__VLS_ctx.previewColumns),
        rowKey: "row_number",
        rowsPerPageOptions: ([10, 25, 50, 0]),
        pagination: ({ page: 1, rowsPerPage: 25 }),
    }));
    var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
            dense: true,
            rows: (__VLS_ctx.parsedRows),
            columns: (__VLS_ctx.previewColumns),
            rowKey: "row_number",
            rowsPerPageOptions: ([10, 25, 50, 0]),
            pagination: ({ page: 1, rowsPerPage: 25 }),
        }], __VLS_functionalComponentArgsRest(__VLS_81), false));
    var __VLS_85 = __VLS_83.slots.default;
    {
        var __VLS_86 = __VLS_83.slots["body-cell-status"];
        var props = __VLS_vSlot(__VLS_86)[0];
        var __VLS_87 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_88 = __VLS_asFunctionalComponent1(__VLS_87, new __VLS_87({
            props: (props),
        }));
        var __VLS_89 = __VLS_88.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_88), false));
        var __VLS_92 = __VLS_90.slots.default;
        var __VLS_93 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93({
            color: (__VLS_ctx.getStatusColor(props.row.status)),
        }));
        var __VLS_95 = __VLS_94.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.getStatusColor(props.row.status)),
            }], __VLS_functionalComponentArgsRest(__VLS_94), false));
        var __VLS_98 = __VLS_96.slots.default;
        (__VLS_ctx.getStatusLabel(props.row.status));
        // @ts-ignore
        [parsedRows, previewColumns, getStatusColor, getStatusLabel,];
        var __VLS_96;
        if (props.row.errors.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-negative q-mt-xs" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
            (props.row.errors.join(', '));
        }
        // @ts-ignore
        [];
        var __VLS_90;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_83;
    if (__VLS_ctx.importing) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md q-mt-md" }));
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-xs" }));
        /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
        (__VLS_ctx.importPhase);
        (__VLS_ctx.importPhaseMessage);
        var __VLS_99 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress | typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress} */
        qLinearProgress;
        // @ts-ignore
        var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99(__assign({ value: (__VLS_ctx.importProgress), color: "primary", trackColor: "grey-3", rounded: true, size: "24px" }, { class: "q-mb-xs" })));
        var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([__assign({ value: (__VLS_ctx.importProgress), color: "primary", trackColor: "grey-3", rounded: true, size: "24px" }, { class: "q-mb-xs" })], __VLS_functionalComponentArgsRest(__VLS_100), false));
        /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
        var __VLS_104 = __VLS_102.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "absolute-full flex flex-center" }));
        /** @type {__VLS_StyleScopedClasses['absolute-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
        var __VLS_105 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105({
            color: "white",
            textColor: "primary",
            label: ("".concat(Math.round(__VLS_ctx.importProgress * 100), "%")),
        }));
        var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([{
                color: "white",
                textColor: "primary",
                label: ("".concat(Math.round(__VLS_ctx.importProgress * 100), "%")),
            }], __VLS_functionalComponentArgsRest(__VLS_106), false));
        // @ts-ignore
        [importing, importPhase, importPhaseMessage, importProgress, importProgress,];
        var __VLS_102;
    }
    var __VLS_110 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
    qStepperNavigation;
    // @ts-ignore
    var __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({}));
    var __VLS_112 = __VLS_111.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_111), false));
    var __VLS_115 = __VLS_113.slots.default;
    var __VLS_116 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116(__assign(__assign(__assign({ 'onClick': {} }, { label: "Quay lại", variant: "flat", color: "grey", icon: "arrow_back" }), { class: "q-mr-sm" }), { disable: (__VLS_ctx.importing) })));
    var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { label: "Quay lại", variant: "flat", color: "grey", icon: "arrow_back" }), { class: "q-mr-sm" }), { disable: (__VLS_ctx.importing) })], __VLS_functionalComponentArgsRest(__VLS_117), false));
    var __VLS_121 = void 0;
    var __VLS_122 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.currentStep = 'upload';
                // @ts-ignore
                [currentStep, importing,];
            } });
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    var __VLS_119;
    var __VLS_120;
    var __VLS_123 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123(__assign({ 'onClick': {} }, { label: "Import", icon: "upload", disable: (__VLS_ctx.summary.valid === 0 || !__VLS_ctx.selectedSupplierId), loading: (__VLS_ctx.importing) })));
    var __VLS_125 = __VLS_124.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Import", icon: "upload", disable: (__VLS_ctx.summary.valid === 0 || !__VLS_ctx.selectedSupplierId), loading: (__VLS_ctx.importing) })], __VLS_functionalComponentArgsRest(__VLS_124), false));
    var __VLS_128 = void 0;
    var __VLS_129 = ({ click: {} },
        { onClick: (__VLS_ctx.doImport) });
    var __VLS_126;
    var __VLS_127;
    // @ts-ignore
    [selectedSupplierId, importing, summary, doImport,];
    var __VLS_113;
    // @ts-ignore
    [];
}
{
    var __VLS_130 = __VLS_24.slots["step-result"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md text-center" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_131 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131(__assign({ name: "check_circle", color: "positive", size: "64px" }, { class: "q-mb-md" })));
    var __VLS_133 = __VLS_132.apply(void 0, __spreadArray([__assign({ name: "check_circle", color: "positive", size: "64px" }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_132), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    if (__VLS_ctx.importResult) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1 q-mb-md" }));
        /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        (__VLS_ctx.importResult.imported);
        if (__VLS_ctx.importResult.skipped > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.importResult.skipped);
        }
        if (__VLS_ctx.importResult.colors_created > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.importResult.colors_created);
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-center q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    var __VLS_136 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136(__assign({ 'onClick': {} }, { label: "Import file khác", icon: "replay", variant: "outlined" })));
    var __VLS_138 = __VLS_137.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Import file khác", icon: "replay", variant: "outlined" })], __VLS_functionalComponentArgsRest(__VLS_137), false));
    var __VLS_141 = void 0;
    var __VLS_142 = ({ click: {} },
        { onClick: (__VLS_ctx.resetFlow) });
    var __VLS_139;
    var __VLS_140;
    var __VLS_143 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143(__assign({ 'onClick': {} }, { label: "Về trang NCC", icon: "arrow_back" })));
    var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Về trang NCC", icon: "arrow_back" })], __VLS_functionalComponentArgsRest(__VLS_144), false));
    var __VLS_148 = void 0;
    var __VLS_149 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.router.push('/thread/suppliers');
                // @ts-ignore
                [importResult, importResult, importResult, importResult, importResult, importResult, resetFlow, router,];
            } });
    var __VLS_146;
    var __VLS_147;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_24;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
