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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
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
        permissions: ['thread.purchase-orders.import'],
    },
});
var router = (0, vue_router_1.useRouter)();
var snackbar = (0, useSnackbar_1.useSnackbar)();
var currentStep = (0, vue_1.ref)('upload');
var selectedFile = (0, vue_1.ref)(null);
var parsing = (0, vue_1.ref)(false);
var parseError = (0, vue_1.ref)('');
var importing = (0, vue_1.ref)(false);
var preview = (0, vue_1.ref)(null);
var importResult = (0, vue_1.ref)(null);
var previewTab = (0, vue_1.ref)('valid');
var mappingConfig = (0, vue_1.ref)(null);
var steps = [
    { name: 'upload', title: 'Chọn file', icon: 'upload_file' },
    { name: 'preview', title: 'Xem trước', icon: 'preview' },
    { name: 'result', title: 'Kết quả', icon: 'check_circle' }
];
var validColumns = [
    { name: 'customer_name', label: 'Khách hàng', field: 'customer_name', align: 'left' },
    { name: 'po_number', label: 'Số PO', field: 'po_number', align: 'left' },
    { name: 'style_code', label: 'Mã hàng', field: 'style_code', align: 'left' },
    { name: 'week', label: 'Week', field: 'week', align: 'left' },
    { name: 'description', label: 'Mô tả', field: 'description', align: 'left' },
    { name: 'finished_product_code', label: 'Mã TP KT', field: 'finished_product_code', align: 'left' },
    { name: 'style_name', label: 'Tên mã hàng', field: 'style_name', align: 'left' },
    { name: 'quantity', label: 'Số lượng', field: 'quantity', align: 'center' },
    { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' }
];
var errorColumns = [
    { name: 'row_number', label: 'Dòng', field: 'row_number', align: 'center' },
    { name: 'error_message', label: 'Lỗi', field: 'error_message', align: 'left' }
];
function getRowStatusColor(status) {
    var colors = {
        new: 'positive',
        update: 'info',
        skip: 'grey',
        new_style: 'warning'
    };
    return colors[status] || 'grey';
}
function getRowStatusLabel(status) {
    var labels = {
        new: 'Mới',
        update: 'Cập nhật',
        skip: 'Bỏ qua',
        new_style: 'Mã hàng mới'
    };
    return labels[status] || status;
}
function onFileSelected() {
    parseError.value = '';
    preview.value = null;
}
function downloadTemplate() {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, importService_1.importService.downloadPOTemplate()];
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
                    return [4 /*yield*/, importService_1.importService.getPOImportMapping()];
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
        var config, ExcelJS, workbook, buffer, sheet, cols, rows, rowIdx, row, customerName, poNumber, styleCode, week, description, finishedProductCode, quantityRaw, quantity, _a, err_2;
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
                        customerName = cols.customer_name ? String(row.getCell(cols.customer_name).value || '').trim() : undefined;
                        poNumber = String(row.getCell(cols.po_number || 'B').value || '').trim();
                        styleCode = String(row.getCell(cols.style_code || 'C').value || '').trim();
                        week = cols.week ? String(row.getCell(cols.week).value || '').trim() : undefined;
                        description = cols.description ? String(row.getCell(cols.description).value || '').trim() : undefined;
                        finishedProductCode = cols.finished_product_code
                            ? String(row.getCell(cols.finished_product_code).value || '').trim()
                            : undefined;
                        quantityRaw = row.getCell(cols.quantity || 'G').value;
                        if (!poNumber && !styleCode)
                            continue;
                        quantity = Number(quantityRaw) || 0;
                        rows.push({
                            row_number: rowIdx,
                            customer_name: customerName || undefined,
                            po_number: poNumber,
                            style_code: styleCode,
                            week: week || undefined,
                            description: description || undefined,
                            finished_product_code: finishedProductCode || undefined,
                            quantity: quantity,
                        });
                    }
                    if (rows.length === 0) {
                        parseError.value = 'Không tìm thấy dữ liệu trong file';
                        return [2 /*return*/];
                    }
                    _a = preview;
                    return [4 /*yield*/, importService_1.importService.parsePOItems(rows)];
                case 6:
                    _a.value = _b.sent();
                    previewTab.value = preview.value.error_rows.length > 0 ? 'errors' : 'valid';
                    currentStep.value = 'preview';
                    return [3 /*break*/, 9];
                case 7:
                    err_2 = _b.sent();
                    parseError.value = err_2.message || 'Lỗi khi đọc file Excel';
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
        var result, err_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!((_a = preview.value) === null || _a === void 0 ? void 0 : _a.valid_rows.length))
                        return [2 /*return*/];
                    importing.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, importService_1.importService.executePOImport(preview.value.valid_rows)];
                case 2:
                    result = _b.sent();
                    importResult.value = result;
                    snackbar.success("Import th\u00E0nh c\u00F4ng: ".concat(result.created_pos, " PO m\u1EDBi, ").concat(result.created_items, " m\u1EB7t h\u00E0ng m\u1EDBi, ").concat(result.updated_items, " c\u1EADp nh\u1EADt"));
                    currentStep.value = 'result';
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _b.sent();
                    snackbar.error(err_3.message || 'Lỗi khi import dữ liệu');
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
    title: "Import Đơn Hàng (PO)",
    subtitle: "Nhập khách hàng, PO, mã hàng, week, mô tả, mã TP KT và số lượng từ file Excel",
    showBack: true,
    backTo: "/thread/purchase-orders",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Import Đơn Hàng (PO)",
        subtitle: "Nhập khách hàng, PO, mã hàng, week, mô tả, mã TP KT và số lượng từ file Excel",
        showBack: true,
        backTo: "/thread/purchase-orders",
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
    (((_a = __VLS_ctx.preview) === null || _a === void 0 ? void 0 : _a.summary.valid) || 0);
    // @ts-ignore
    [preview,];
    var __VLS_52;
    if ((_b = __VLS_ctx.preview) === null || _b === void 0 ? void 0 : _b.summary.new_pos) {
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
        (__VLS_ctx.preview.summary.new_pos);
        // @ts-ignore
        [preview, preview,];
        var __VLS_58;
    }
    if ((_c = __VLS_ctx.preview) === null || _c === void 0 ? void 0 : _c.summary.update_items) {
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
        (__VLS_ctx.preview.summary.update_items);
        // @ts-ignore
        [preview, preview,];
        var __VLS_64;
    }
    if ((_d = __VLS_ctx.preview) === null || _d === void 0 ? void 0 : _d.summary.skip_items) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_67 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67(__assign({ color: "grey" }, { class: "q-pa-sm text-body2" })));
        var __VLS_69 = __VLS_68.apply(void 0, __spreadArray([__assign({ color: "grey" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_68), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_72 = __VLS_70.slots.default;
        (__VLS_ctx.preview.summary.skip_items);
        // @ts-ignore
        [preview, preview,];
        var __VLS_70;
    }
    if ((_e = __VLS_ctx.preview) === null || _e === void 0 ? void 0 : _e.summary.errors) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_73 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73(__assign({ color: "negative" }, { class: "q-pa-sm text-body2" })));
        var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([__assign({ color: "negative" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_74), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_78 = __VLS_76.slots.default;
        (__VLS_ctx.preview.summary.errors);
        // @ts-ignore
        [preview, preview,];
        var __VLS_76;
    }
    var __VLS_79 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
    qTabs;
    // @ts-ignore
    var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79(__assign(__assign({ modelValue: (__VLS_ctx.previewTab) }, { class: "text-grey q-mb-md" }), { activeColor: "primary", indicatorColor: "primary", align: "left" })));
    var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.previewTab) }, { class: "text-grey q-mb-md" }), { activeColor: "primary", indicatorColor: "primary", align: "left" })], __VLS_functionalComponentArgsRest(__VLS_80), false));
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_84 = __VLS_82.slots.default;
    var __VLS_85 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({
        name: "valid",
        label: ("H\u1EE3p l\u1EC7 (".concat(((_f = __VLS_ctx.preview) === null || _f === void 0 ? void 0 : _f.valid_rows.length) || 0, ")")),
    }));
    var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([{
            name: "valid",
            label: ("H\u1EE3p l\u1EC7 (".concat(((_g = __VLS_ctx.preview) === null || _g === void 0 ? void 0 : _g.valid_rows.length) || 0, ")")),
        }], __VLS_functionalComponentArgsRest(__VLS_86), false));
    var __VLS_90 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
        name: "errors",
        label: ("L\u1ED7i (".concat(((_h = __VLS_ctx.preview) === null || _h === void 0 ? void 0 : _h.error_rows.length) || 0, ")")),
    }));
    var __VLS_92 = __VLS_91.apply(void 0, __spreadArray([{
            name: "errors",
            label: ("L\u1ED7i (".concat(((_j = __VLS_ctx.preview) === null || _j === void 0 ? void 0 : _j.error_rows.length) || 0, ")")),
        }], __VLS_functionalComponentArgsRest(__VLS_91), false));
    // @ts-ignore
    [preview, preview, previewTab,];
    var __VLS_82;
    var __VLS_95 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
    qTabPanels;
    // @ts-ignore
    var __VLS_96 = __VLS_asFunctionalComponent1(__VLS_95, new __VLS_95({
        modelValue: (__VLS_ctx.previewTab),
        animated: true,
    }));
    var __VLS_97 = __VLS_96.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.previewTab),
            animated: true,
        }], __VLS_functionalComponentArgsRest(__VLS_96), false));
    var __VLS_100 = __VLS_98.slots.default;
    var __VLS_101 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
    qTabPanel;
    // @ts-ignore
    var __VLS_102 = __VLS_asFunctionalComponent1(__VLS_101, new __VLS_101(__assign({ name: "valid" }, { class: "q-pa-none" })));
    var __VLS_103 = __VLS_102.apply(void 0, __spreadArray([__assign({ name: "valid" }, { class: "q-pa-none" })], __VLS_functionalComponentArgsRest(__VLS_102), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-none']} */ ;
    var __VLS_106 = __VLS_104.slots.default;
    var __VLS_107 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_108 = __VLS_asFunctionalComponent1(__VLS_107, new __VLS_107({
        flat: true,
        bordered: true,
        rows: (((_k = __VLS_ctx.preview) === null || _k === void 0 ? void 0 : _k.valid_rows) || []),
        columns: (__VLS_ctx.validColumns),
        rowKey: "row_number",
        rowsPerPageOptions: ([10, 25, 50, 0]),
        pagination: ({ page: 1, rowsPerPage: 25 }),
        dense: true,
    }));
    var __VLS_109 = __VLS_108.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
            rows: (((_l = __VLS_ctx.preview) === null || _l === void 0 ? void 0 : _l.valid_rows) || []),
            columns: (__VLS_ctx.validColumns),
            rowKey: "row_number",
            rowsPerPageOptions: ([10, 25, 50, 0]),
            pagination: ({ page: 1, rowsPerPage: 25 }),
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_108), false));
    var __VLS_112 = __VLS_110.slots.default;
    {
        var __VLS_113 = __VLS_110.slots["body-cell-style_code"];
        var props = __VLS_vSlot(__VLS_113)[0];
        var __VLS_114 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({
            props: (props),
        }));
        var __VLS_116 = __VLS_115.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_115), false));
        var __VLS_119 = __VLS_117.slots.default;
        (props.value);
        if (props.row.status === 'new_style') {
            var __VLS_120 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_121 = __VLS_asFunctionalComponent1(__VLS_120, new __VLS_120(__assign({ color: "warning", label: "Mới" }, { class: "q-ml-sm" })));
            var __VLS_122 = __VLS_121.apply(void 0, __spreadArray([__assign({ color: "warning", label: "Mới" }, { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_121), false));
            /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
        }
        // @ts-ignore
        [preview, previewTab, validColumns,];
        var __VLS_117;
        // @ts-ignore
        [];
    }
    {
        var __VLS_125 = __VLS_110.slots["body-cell-status"];
        var props = __VLS_vSlot(__VLS_125)[0];
        var __VLS_126 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126({
            props: (props),
        }));
        var __VLS_128 = __VLS_127.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_127), false));
        var __VLS_131 = __VLS_129.slots.default;
        var __VLS_132 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132({
            color: (__VLS_ctx.getRowStatusColor(props.row.status)),
            label: (__VLS_ctx.getRowStatusLabel(props.row.status)),
        }));
        var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.getRowStatusColor(props.row.status)),
                label: (__VLS_ctx.getRowStatusLabel(props.row.status)),
            }], __VLS_functionalComponentArgsRest(__VLS_133), false));
        // @ts-ignore
        [getRowStatusColor, getRowStatusLabel,];
        var __VLS_129;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_110;
    // @ts-ignore
    [];
    var __VLS_104;
    var __VLS_137 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
    qTabPanel;
    // @ts-ignore
    var __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137(__assign({ name: "errors" }, { class: "q-pa-none" })));
    var __VLS_139 = __VLS_138.apply(void 0, __spreadArray([__assign({ name: "errors" }, { class: "q-pa-none" })], __VLS_functionalComponentArgsRest(__VLS_138), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-none']} */ ;
    var __VLS_142 = __VLS_140.slots.default;
    var __VLS_143 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
        flat: true,
        bordered: true,
        rows: (((_m = __VLS_ctx.preview) === null || _m === void 0 ? void 0 : _m.error_rows) || []),
        columns: (__VLS_ctx.errorColumns),
        rowKey: "row_number",
        rowsPerPageOptions: ([10, 25, 50, 0]),
        pagination: ({ page: 1, rowsPerPage: 25 }),
        dense: true,
    }));
    var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
            rows: (((_o = __VLS_ctx.preview) === null || _o === void 0 ? void 0 : _o.error_rows) || []),
            columns: (__VLS_ctx.errorColumns),
            rowKey: "row_number",
            rowsPerPageOptions: ([10, 25, 50, 0]),
            pagination: ({ page: 1, rowsPerPage: 25 }),
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_144), false));
    var __VLS_148 = __VLS_146.slots.default;
    {
        var __VLS_149 = __VLS_146.slots["body-cell-error_message"];
        var props = __VLS_vSlot(__VLS_149)[0];
        var __VLS_150 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({
            props: (props),
        }));
        var __VLS_152 = __VLS_151.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_151), false));
        var __VLS_155 = __VLS_153.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-negative" }));
        /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
        (props.row.error_message);
        // @ts-ignore
        [preview, errorColumns,];
        var __VLS_153;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_146;
    // @ts-ignore
    [];
    var __VLS_140;
    // @ts-ignore
    [];
    var __VLS_98;
    var __VLS_156 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation | typeof __VLS_components.qStepperNavigation | typeof __VLS_components.QStepperNavigation} */
    qStepperNavigation;
    // @ts-ignore
    var __VLS_157 = __VLS_asFunctionalComponent1(__VLS_156, new __VLS_156({}));
    var __VLS_158 = __VLS_157.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_157), false));
    var __VLS_161 = __VLS_159.slots.default;
    var __VLS_162 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_163 = __VLS_asFunctionalComponent1(__VLS_162, new __VLS_162(__assign(__assign({ 'onClick': {} }, { label: "Quay lại", variant: "flat", color: "grey", icon: "arrow_back" }), { class: "q-mr-sm" })));
    var __VLS_164 = __VLS_163.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { label: "Quay lại", variant: "flat", color: "grey", icon: "arrow_back" }), { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_163), false));
    var __VLS_167 = void 0;
    var __VLS_168 = ({ click: {} },
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
    var __VLS_165;
    var __VLS_166;
    var __VLS_169 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169(__assign({ 'onClick': {} }, { label: "Import", icon: "upload", disable: (!((_p = __VLS_ctx.preview) === null || _p === void 0 ? void 0 : _p.valid_rows.length)), loading: (__VLS_ctx.importing) })));
    var __VLS_171 = __VLS_170.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Import", icon: "upload", disable: (!((_q = __VLS_ctx.preview) === null || _q === void 0 ? void 0 : _q.valid_rows.length)), loading: (__VLS_ctx.importing) })], __VLS_functionalComponentArgsRest(__VLS_170), false));
    var __VLS_174 = void 0;
    var __VLS_175 = ({ click: {} },
        { onClick: (__VLS_ctx.doImport) });
    var __VLS_172;
    var __VLS_173;
    // @ts-ignore
    [preview, importing, doImport,];
    var __VLS_159;
    // @ts-ignore
    [];
}
{
    var __VLS_176 = __VLS_24.slots["step-result"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md text-center" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_177 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_178 = __VLS_asFunctionalComponent1(__VLS_177, new __VLS_177(__assign({ name: "check_circle", color: "positive", size: "64px" }, { class: "q-mb-md" })));
    var __VLS_179 = __VLS_178.apply(void 0, __spreadArray([__assign({ name: "check_circle", color: "positive", size: "64px" }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_178), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    if (__VLS_ctx.importResult) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1 q-mb-md" }));
        /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
        if (__VLS_ctx.importResult.created_pos > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.importResult.created_pos);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        (__VLS_ctx.importResult.created_items);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        (__VLS_ctx.importResult.updated_items);
        if (__VLS_ctx.importResult.skipped_items > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            (__VLS_ctx.importResult.skipped_items);
        }
        if (__VLS_ctx.importResult.failed_items > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-negative" }));
            /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
            (__VLS_ctx.importResult.failed_items);
        }
    }
    var __VLS_182 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_183 = __VLS_asFunctionalComponent1(__VLS_182, new __VLS_182(__assign({ 'onClick': {} }, { label: "Về danh sách PO", icon: "arrow_back" })));
    var __VLS_184 = __VLS_183.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Về danh sách PO", icon: "arrow_back" })], __VLS_functionalComponentArgsRest(__VLS_183), false));
    var __VLS_187 = void 0;
    var __VLS_188 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.router.push('/thread/purchase-orders');
                // @ts-ignore
                [importResult, importResult, importResult, importResult, importResult, importResult, importResult, importResult, importResult, router,];
            } });
    var __VLS_185;
    var __VLS_186;
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
