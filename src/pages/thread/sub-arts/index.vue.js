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
var subArtService_1 = require("@/services/subArtService");
var useSnackbar_1 = require("@/composables/useSnackbar");
var PageHeader_vue_1 = require("@/components/ui/layout/PageHeader.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var FilePicker_vue_1 = require("@/components/ui/pickers/FilePicker.vue");
definePage({
    meta: {
        requiresAuth: true,
    },
});
var snackbar = (0, useSnackbar_1.useSnackbar)();
var selectedFile = (0, vue_1.ref)(null);
var importing = (0, vue_1.ref)(false);
var importError = (0, vue_1.ref)('');
var importResult = (0, vue_1.ref)(null);
var warningColumns = [
    { name: 'row', label: 'Dòng', field: 'row', align: 'center' },
    { name: 'style_code', label: 'Mã Hàng', field: 'style_code', align: 'left' },
    { name: 'sub_art_code', label: 'Sub-Art', field: 'sub_art_code', align: 'left' },
    { name: 'reason', label: 'Lý do', field: 'reason', align: 'left' },
];
function onFileSelected(file) {
    var _a;
    if (Array.isArray(file)) {
        selectedFile.value = (_a = file[0]) !== null && _a !== void 0 ? _a : null;
    }
    importError.value = '';
    importResult.value = null;
}
function downloadTemplate() {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, subArtService_1.subArtService.downloadTemplate()];
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
function doImport() {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedFile.value)
                        return [2 /*return*/];
                    importing.value = true;
                    importError.value = '';
                    importResult.value = null;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, subArtService_1.subArtService.importExcel(selectedFile.value)];
                case 2:
                    result = _a.sent();
                    importResult.value = result;
                    if (result.imported > 0) {
                        snackbar.success("Import th\u00E0nh c\u00F4ng ".concat(result.imported, " Sub-Art"));
                    }
                    else {
                        snackbar.warning('Không có Sub-Art nào được import');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    importError.value = error_1 instanceof Error ? error_1.message : 'Lỗi khi import dữ liệu';
                    snackbar.error(importError.value);
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
    title: "Import Sub-Art",
    subtitle: "Nhập danh sách Sub-Art từ file Excel và liên kết với mã hàng",
    showBack: true,
    backTo: "/thread/styles",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Import Sub-Art",
        subtitle: "Nhập danh sách Sub-Art từ file Excel và liên kết với mã hàng",
        showBack: true,
        backTo: "/thread/styles",
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
var __VLS_21;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21(__assign({ flat: true, bordered: true }, { class: "q-mt-md" })));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_22), false));
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
var __VLS_26 = __VLS_24.slots.default;
var __VLS_27;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({}));
var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_28), false));
var __VLS_32 = __VLS_30.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md items-end" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_33 = FilePicker_vue_1.default;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.selectedFile), accept: ".xlsx", label: "Chọn file Excel", hint: (undefined), dense: true, hideBottomSpace: true, disable: (__VLS_ctx.importing) })));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.selectedFile), accept: ".xlsx", label: "Chọn file Excel", hint: (undefined), dense: true, hideBottomSpace: true, disable: (__VLS_ctx.importing) })], __VLS_functionalComponentArgsRest(__VLS_34), false));
var __VLS_38;
var __VLS_39 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onFileSelected) });
var __VLS_36;
var __VLS_37;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
/** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
var __VLS_40 = AppButton_vue_1.default;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40(__assign({ 'onClick': {} }, { label: "Import", icon: "upload", disable: (!__VLS_ctx.selectedFile || __VLS_ctx.importing), loading: (__VLS_ctx.importing) })));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Import", icon: "upload", disable: (!__VLS_ctx.selectedFile || __VLS_ctx.importing), loading: (__VLS_ctx.importing) })], __VLS_functionalComponentArgsRest(__VLS_41), false));
var __VLS_45;
var __VLS_46 = ({ click: {} },
    { onClick: (__VLS_ctx.doImport) });
var __VLS_43;
var __VLS_44;
if (__VLS_ctx.importError) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-negative q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    (__VLS_ctx.importError);
}
// @ts-ignore
[selectedFile, selectedFile, importing, importing, importing, onFileSelected, doImport, importError, importError,];
var __VLS_30;
// @ts-ignore
[];
var __VLS_24;
if (__VLS_ctx.importResult) {
    var __VLS_47 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47(__assign({ flat: true, bordered: true }, { class: "q-mt-md" })));
    var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_48), false));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    var __VLS_52 = __VLS_50.slots.default;
    var __VLS_53 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({}));
    var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_54), false));
    var __VLS_58 = __VLS_56.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_59 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59(__assign({ color: "positive" }, { class: "q-pa-sm text-body2" })));
    var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([__assign({ color: "positive" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_60), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    var __VLS_64 = __VLS_62.slots.default;
    (__VLS_ctx.importResult.imported);
    // @ts-ignore
    [importResult, importResult,];
    var __VLS_62;
    if (__VLS_ctx.importResult.skipped > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_65 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65(__assign({ color: "blue-grey" }, { class: "q-pa-sm text-body2" })));
        var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([__assign({ color: "blue-grey" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_66), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_70 = __VLS_68.slots.default;
        (__VLS_ctx.importResult.skipped);
        // @ts-ignore
        [importResult, importResult,];
        var __VLS_68;
    }
    if (__VLS_ctx.importResult.warnings.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_71 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71(__assign({ color: "warning" }, { class: "q-pa-sm text-body2" })));
        var __VLS_73 = __VLS_72.apply(void 0, __spreadArray([__assign({ color: "warning" }, { class: "q-pa-sm text-body2" })], __VLS_functionalComponentArgsRest(__VLS_72), false));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_76 = __VLS_74.slots.default;
        (__VLS_ctx.importResult.warnings.length);
        // @ts-ignore
        [importResult, importResult,];
        var __VLS_74;
    }
    if (__VLS_ctx.importResult.warnings.length > 0) {
        var __VLS_77 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
        qTable;
        // @ts-ignore
        var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({
            flat: true,
            bordered: true,
            dense: true,
            title: "Cảnh báo",
            rows: (__VLS_ctx.importResult.warnings),
            columns: (__VLS_ctx.warningColumns),
            rowKey: "row",
            rowsPerPageOptions: ([10, 25, 50]),
            pagination: ({ page: 1, rowsPerPage: 25 }),
        }));
        var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([{
                flat: true,
                bordered: true,
                dense: true,
                title: "Cảnh báo",
                rows: (__VLS_ctx.importResult.warnings),
                columns: (__VLS_ctx.warningColumns),
                rowKey: "row",
                rowsPerPageOptions: ([10, 25, 50]),
                pagination: ({ page: 1, rowsPerPage: 25 }),
            }], __VLS_functionalComponentArgsRest(__VLS_78), false));
    }
    // @ts-ignore
    [importResult, importResult, warningColumns,];
    var __VLS_56;
    // @ts-ignore
    [];
    var __VLS_50;
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
