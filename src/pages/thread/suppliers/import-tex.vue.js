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
var useSnackbar_1 = require("@/composables/useSnackbar");
var importService_1 = require("@/services/importService");
var PageHeader_vue_1 = require("@/components/ui/layout/PageHeader.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var AppStepper_vue_1 = require("@/components/ui/navigation/AppStepper.vue");
var FilePicker_vue_1 = require("@/components/ui/pickers/FilePicker.vue");
definePage({
    meta: {
        requiresAuth: true,
        permissions: ['thread.suppliers.manage'],
    },
});
var router = (0, vue_router_1.useRouter)();
var snackbar = (0, useSnackbar_1.useSnackbar)();
var currentStep = (0, vue_1.ref)('upload');
var selectedFile = (0, vue_1.ref)(null);
var parsing = (0, vue_1.ref)(false);
var parseError = (0, vue_1.ref)('');
var importing = (0, vue_1.ref)(false);
var parsedRows = (0, vue_1.ref)([]);
var importResult = (0, vue_1.ref)(null);
var mappingConfig = (0, vue_1.ref)(null);
var steps = [
    { name: 'upload', title: 'Chọn file', icon: 'upload_file' },
    { name: 'preview', title: 'Xem trước', icon: 'preview' },
    { name: 'result', title: 'Kết quả', icon: 'check_circle' },
];
var previewColumns = [
    { name: 'row_number', label: '#', field: 'row_number', align: 'center', sortable: true },
    { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left', sortable: true },
    { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'center', sortable: true },
    { name: 'meters_per_cone', label: 'Mét/Cuộn', field: 'meters_per_cone', align: 'center', sortable: true },
    { name: 'unit_price', label: 'Giá (VND)', field: 'unit_price', align: 'right', sortable: true },
    { name: 'supplier_item_code', label: 'Mã hàng NCC', field: 'supplier_item_code', align: 'left' },
    { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
];
var skipDetailColumns = [
    { name: 'row_number', label: 'Dòng', field: 'row_number', align: 'center' },
    { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
    { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'center' },
    { name: 'reason', label: 'Lý do', field: 'reason', align: 'left' },
];
var summary = (0, vue_1.computed)(function () {
    var rows = parsedRows.value;
    return {
        valid: rows.filter(function (r) { return r.status !== 'error'; }).length,
        errors: rows.filter(function (r) { return r.status === 'error'; }).length,
        newSuppliers: rows.filter(function (r) { return r.status === 'new_supplier'; }).length,
        newTex: rows.filter(function (r) { return r.status === 'new_tex'; }).length,
    };
});
function formatCurrency(value) {
    if (!value && value !== 0)
        return '-';
    return new Intl.NumberFormat('vi-VN').format(value);
}
function onFileSelected() {
    parseError.value = '';
    parsedRows.value = [];
}
function downloadTemplate() {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, importService_1.importService.downloadTexTemplate()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    snackbar.error(err_1.message || 'Không thể tải file mẫu');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function loadMappingConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var config;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (mappingConfig.value)
                        return [2 /*return*/, mappingConfig.value];
                    return [4 /*yield*/, importService_1.importService.getSupplierTexMapping()];
                case 1:
                    config = _a.sent();
                    mappingConfig.value = config;
                    return [2 /*return*/, config];
            }
        });
    });
}
function parseFile() {
    return __awaiter(this, void 0, void 0, function () {
        var config, ExcelJS, workbook, buffer, sheet, cols, rows, rowIdx, row, supplierName, texRaw, metersRaw, priceRaw, itemCode, texNumber, metersPerCone, unitPrice, _a, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!selectedFile.value)
                        return [2 /*return*/];
                    parsing.value = true;
                    parseError.value = '';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, 8, 9]);
                    return [4 /*yield*/, loadMappingConfig()];
                case 2:
                    config = _b.sent();
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('exceljs'); })];
                case 3:
                    ExcelJS = _b.sent();
                    workbook = new ExcelJS.Workbook();
                    return [4 /*yield*/, selectedFile.value.arrayBuffer()];
                case 4:
                    buffer = _b.sent();
                    return [4 /*yield*/, workbook.xlsx.load(buffer)];
                case 5:
                    _b.sent();
                    sheet = workbook.worksheets[config.sheet_index];
                    if (!sheet) {
                        parseError.value = "Kh\u00F4ng t\u00ECm th\u1EA5y sheet t\u1EA1i v\u1ECB tr\u00ED ".concat(config.sheet_index);
                        return [2 /*return*/];
                    }
                    cols = config.columns;
                    rows = [];
                    for (rowIdx = config.data_start_row; rowIdx <= sheet.rowCount; rowIdx++) {
                        row = sheet.getRow(rowIdx);
                        supplierName = String(row.getCell(cols.supplier_name || 'A').value || '').trim();
                        texRaw = row.getCell(cols.tex_number || 'B').value;
                        metersRaw = row.getCell(cols.meters_per_cone || 'C').value;
                        priceRaw = row.getCell(cols.unit_price || 'D').value;
                        itemCode = String(row.getCell(cols.supplier_item_code || 'E').value || '').trim();
                        if (!supplierName && !texRaw)
                            continue;
                        texNumber = String(texRaw || '').trim();
                        metersPerCone = Number(metersRaw) || 0;
                        unitPrice = Number(priceRaw) || 0;
                        rows.push({
                            row_number: rowIdx,
                            supplier_name: supplierName,
                            tex_number: texNumber,
                            meters_per_cone: metersPerCone,
                            unit_price: unitPrice,
                            supplier_item_code: itemCode || undefined,
                            status: 'valid',
                            errors: [],
                        });
                    }
                    if (rows.length === 0) {
                        parseError.value = 'Không tìm thấy dữ liệu trong file. Kiểm tra lại cấu hình sheet và dòng bắt đầu.';
                        return [2 /*return*/];
                    }
                    _a = parsedRows;
                    return [4 /*yield*/, importService_1.importService.previewSupplierTex(rows)];
                case 6:
                    _a.value = _b.sent();
                    currentStep.value = 'preview';
                    return [3 /*break*/, 9];
                case 7:
                    err_2 = _b.sent();
                    parseError.value = err_2 instanceof Error ? err_2.message : 'Lỗi khi đọc file Excel';
                    return [3 /*break*/, 9];
                case 8:
                    parsing.value = false;
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function doImport() {
    return __awaiter(this, void 0, void 0, function () {
        var validRows, result, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    validRows = parsedRows.value.filter(function (r) { return r.status !== 'error'; });
                    if (validRows.length === 0)
                        return [2 /*return*/];
                    importing.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, importService_1.importService.importSupplierTex(validRows)];
                case 2:
                    result = _a.sent();
                    importResult.value = result;
                    snackbar.success("Import th\u00E0nh c\u00F4ng ".concat(result.imported, " d\u00F2ng"));
                    currentStep.value = 'result';
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _a.sent();
                    snackbar.error(err_3 instanceof Error ? err_3.message : 'Lỗi khi import dữ liệu');
                    return [3 /*break*/, 5];
                case 4:
                    importing.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
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
    title: "Import NCC-Tex",
    subtitle: "Nhập danh sách nhà cung cấp và thông tin Tex từ file Excel",
    showBack: true,
    backTo: "/thread/suppliers",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Import NCC-Tex",
        subtitle: "Nhập danh sách nhà cung cấp và thông tin Tex từ file Excel",
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
    var __VLS_28 = FilePicker_vue_1.default;
    // @ts-ignore
    var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.selectedFile), accept: ".xlsx,.xls", label: "Chọn file Excel", hint: "Định dạng: .xlsx hoặc .xls", outlined: true })));
    var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.selectedFile), accept: ".xlsx,.xls", label: "Chọn file Excel", hint: "Định dạng: .xlsx hoặc .xls", outlined: true })], __VLS_functionalComponentArgsRest(__VLS_29), false));
    var __VLS_33 = void 0;
    var __VLS_34 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onFileSelected) });
    var __VLS_31;
    var __VLS_32;
    if (__VLS_ctx.parseError) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-negative q-mt-sm" }));
        /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
        (__VLS_ctx.parseError);
    }
    var __VLS_35 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
    qStepperNavigation;
    // @ts-ignore
    var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({}));
    var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_36), false));
    var __VLS_40 = __VLS_38.slots.default;
    var __VLS_41 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41(__assign({ 'onClick': {} }, { label: "Tiếp tục", iconRight: "arrow_forward", disable: (!__VLS_ctx.selectedFile || __VLS_ctx.parsing), loading: (__VLS_ctx.parsing) })));
    var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Tiếp tục", iconRight: "arrow_forward", disable: (!__VLS_ctx.selectedFile || __VLS_ctx.parsing), loading: (__VLS_ctx.parsing) })], __VLS_functionalComponentArgsRest(__VLS_42), false));
    var __VLS_46 = void 0;
    var __VLS_47 = ({ click: {} },
        { onClick: (__VLS_ctx.parseFile) });
    var __VLS_44;
    var __VLS_45;
    // @ts-ignore
    [currentStep, steps, selectedFile, selectedFile, onFileSelected, parseError, parseError, parsing, parsing, parseFile,];
    var __VLS_38;
    // @ts-ignore
    [];
}
{
    var __VLS_48 = __VLS_24.slots["step-preview"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_49 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49(__assign({ color: "positive" }, { class: "q-pa-sm text-body2" })));
    var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([__assign({ color: "positive" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_50), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    var __VLS_54 = __VLS_52.slots.default;
    (__VLS_ctx.summary.valid);
    // @ts-ignore
    [summary,];
    var __VLS_52;
    if (__VLS_ctx.summary.newSuppliers > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_55 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55(__assign({ color: "info" }, { class: "q-pa-sm text-body2" })));
        var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([__assign({ color: "info" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_56), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_60 = __VLS_58.slots.default;
        (__VLS_ctx.summary.newSuppliers);
        // @ts-ignore
        [summary, summary,];
        var __VLS_58;
    }
    if (__VLS_ctx.summary.newTex > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_61 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61(__assign({ color: "accent" }, { class: "q-pa-sm text-body2" })));
        var __VLS_63 = __VLS_62.apply(void 0, __spreadArray([__assign({ color: "accent" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_62), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_66 = __VLS_64.slots.default;
        (__VLS_ctx.summary.newTex);
        // @ts-ignore
        [summary, summary,];
        var __VLS_64;
    }
    if (__VLS_ctx.summary.errors > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_67 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67(__assign({ color: "negative" }, { class: "q-pa-sm text-body2" })));
        var __VLS_69 = __VLS_68.apply(void 0, __spreadArray([__assign({ color: "negative" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_68), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_72 = __VLS_70.slots.default;
        (__VLS_ctx.summary.errors);
        // @ts-ignore
        [summary, summary,];
        var __VLS_70;
    }
    var __VLS_73 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({
        flat: true,
        bordered: true,
        rows: (__VLS_ctx.parsedRows),
        columns: (__VLS_ctx.previewColumns),
        rowKey: "row_number",
        rowsPerPageOptions: ([10, 25, 50, 0]),
        pagination: ({ page: 1, rowsPerPage: 25 }),
        dense: true,
    }));
    var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
            rows: (__VLS_ctx.parsedRows),
            columns: (__VLS_ctx.previewColumns),
            rowKey: "row_number",
            rowsPerPageOptions: ([10, 25, 50, 0]),
            pagination: ({ page: 1, rowsPerPage: 25 }),
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_74), false));
    var __VLS_78 = __VLS_76.slots.default;
    {
        var __VLS_79 = __VLS_76.slots["body-cell-status"];
        var props = __VLS_vSlot(__VLS_79)[0];
        var __VLS_80 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
            props: (props),
        }));
        var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_81), false));
        var __VLS_85 = __VLS_83.slots.default;
        if (props.row.status === 'valid' || props.row.status === 'exists') {
            var __VLS_86 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
                color: "positive",
            }));
            var __VLS_88 = __VLS_87.apply(void 0, __spreadArray([{
                    color: "positive",
                }], __VLS_functionalComponentArgsRest(__VLS_87), false));
            var __VLS_91 = __VLS_89.slots.default;
            // @ts-ignore
            [parsedRows, previewColumns,];
            var __VLS_89;
        }
        else if (props.row.status === 'new_supplier') {
            var __VLS_92 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
                color: "info",
            }));
            var __VLS_94 = __VLS_93.apply(void 0, __spreadArray([{
                    color: "info",
                }], __VLS_functionalComponentArgsRest(__VLS_93), false));
            var __VLS_97 = __VLS_95.slots.default;
            // @ts-ignore
            [];
            var __VLS_95;
        }
        else if (props.row.status === 'new_tex') {
            var __VLS_98 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98({
                color: "accent",
            }));
            var __VLS_100 = __VLS_99.apply(void 0, __spreadArray([{
                    color: "accent",
                }], __VLS_functionalComponentArgsRest(__VLS_99), false));
            var __VLS_103 = __VLS_101.slots.default;
            // @ts-ignore
            [];
            var __VLS_101;
        }
        else if (props.row.status === 'error') {
            var __VLS_104 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
                color: "negative",
            }));
            var __VLS_106 = __VLS_105.apply(void 0, __spreadArray([{
                    color: "negative",
                }], __VLS_functionalComponentArgsRest(__VLS_105), false));
            var __VLS_109 = __VLS_107.slots.default;
            // @ts-ignore
            [];
            var __VLS_107;
        }
        if (props.row.errors.length > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-negative q-mt-xs" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
            (props.row.errors.join(', '));
        }
        // @ts-ignore
        [];
        var __VLS_83;
        // @ts-ignore
        [];
    }
    {
        var __VLS_110 = __VLS_76.slots["body-cell-unit_price"];
        var props = __VLS_vSlot(__VLS_110)[0];
        var __VLS_111 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111({
            props: (props),
        }));
        var __VLS_113 = __VLS_112.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_112), false));
        var __VLS_116 = __VLS_114.slots.default;
        (__VLS_ctx.formatCurrency(props.row.unit_price));
        // @ts-ignore
        [formatCurrency,];
        var __VLS_114;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_76;
    var __VLS_117 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
    qStepperNavigation;
    // @ts-ignore
    var __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117({}));
    var __VLS_119 = __VLS_118.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_118), false));
    var __VLS_122 = __VLS_120.slots.default;
    var __VLS_123 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123(__assign(__assign({ 'onClick': {} }, { label: "Quay lại", variant: "flat", color: "grey", icon: "arrow_back" }), { class: "q-mr-sm" })));
    var __VLS_125 = __VLS_124.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { label: "Quay lại", variant: "flat", color: "grey", icon: "arrow_back" }), { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_124), false));
    var __VLS_128 = void 0;
    var __VLS_129 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.currentStep = 'upload';
                // @ts-ignore
                [currentStep,];
            } });
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    var __VLS_126;
    var __VLS_127;
    var __VLS_130 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130(__assign({ 'onClick': {} }, { label: "Import", icon: "upload", disable: (__VLS_ctx.summary.valid === 0), loading: (__VLS_ctx.importing) })));
    var __VLS_132 = __VLS_131.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Import", icon: "upload", disable: (__VLS_ctx.summary.valid === 0), loading: (__VLS_ctx.importing) })], __VLS_functionalComponentArgsRest(__VLS_131), false));
    var __VLS_135 = void 0;
    var __VLS_136 = ({ click: {} },
        { onClick: (__VLS_ctx.doImport) });
    var __VLS_133;
    var __VLS_134;
    // @ts-ignore
    [summary, importing, doImport,];
    var __VLS_120;
    // @ts-ignore
    [];
}
{
    var __VLS_137 = __VLS_24.slots["step-result"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md text-center" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_138 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138(__assign({ name: "check_circle", color: "positive", size: "64px" }, { class: "q-mb-md" })));
    var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([__assign({ name: "check_circle", color: "positive", size: "64px" }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_139), false));
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
        if (__VLS_ctx.importResult.suppliers_created > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.importResult.suppliers_created);
        }
        if (__VLS_ctx.importResult.thread_types_created > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.importResult.thread_types_created);
        }
    }
    if ((_b = (_a = __VLS_ctx.importResult) === null || _a === void 0 ? void 0 : _a.skipped_details) === null || _b === void 0 ? void 0 : _b.length) {
        var __VLS_143 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
        qTable;
        // @ts-ignore
        var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143(__assign(__assign({ flat: true, bordered: true, dense: true, rows: (__VLS_ctx.importResult.skipped_details), columns: (__VLS_ctx.skipDetailColumns), rowKey: "row_number", rowsPerPageOptions: ([0]), hidePagination: true }, { class: "q-mb-md text-left" }), { title: "Chi tiết dòng bị bỏ qua" })));
        var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([__assign(__assign({ flat: true, bordered: true, dense: true, rows: (__VLS_ctx.importResult.skipped_details), columns: (__VLS_ctx.skipDetailColumns), rowKey: "row_number", rowsPerPageOptions: ([0]), hidePagination: true }, { class: "q-mb-md text-left" }), { title: "Chi tiết dòng bị bỏ qua" })], __VLS_functionalComponentArgsRest(__VLS_144), false));
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    }
    var __VLS_148 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_149 = __VLS_asFunctionalComponent1(__VLS_148, new __VLS_148(__assign({ 'onClick': {} }, { label: "Về trang NCC", icon: "arrow_back" })));
    var __VLS_150 = __VLS_149.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Về trang NCC", icon: "arrow_back" })], __VLS_functionalComponentArgsRest(__VLS_149), false));
    var __VLS_153 = void 0;
    var __VLS_154 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.router.push('/thread/suppliers');
                // @ts-ignore
                [importResult, importResult, importResult, importResult, importResult, importResult, importResult, importResult, importResult, importResult, skipDetailColumns, router,];
            } });
    var __VLS_151;
    var __VLS_152;
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
