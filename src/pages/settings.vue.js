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
var useSettings_1 = require("@/composables/useSettings");
var usePermission_1 = require("@/composables/usePermission");
var useSnackbar_1 = require("@/composables/useSnackbar");
var importService_1 = require("@/services/importService");
var settingsService_1 = require("@/services/settingsService");
var PARTIAL_CONE_RATIO_KEY = 'partial_cone_ratio';
var RESERVE_PRIORITY_KEY = 'reserve_priority';
var TEX_MAPPING_KEY = 'import_supplier_tex_mapping';
var COLOR_MAPPING_KEY = 'import_supplier_color_mapping';
var PO_MAPPING_KEY = 'import_po_items_mapping';
var _a = (0, useSettings_1.useSettings)(), isLoading = _a.isLoading, getSetting = _a.getSetting, updateSetting = _a.updateSetting;
var isRoot = (0, usePermission_1.usePermission)().isRoot;
var snackbar = (0, useSnackbar_1.useSnackbar)();
var partialConeRatio = (0, vue_1.ref)(0.5);
var originalValue = (0, vue_1.ref)(0.5);
var hasLoaded = (0, vue_1.ref)(false);
var isSavingTexMapping = (0, vue_1.ref)(false);
var isSavingColorMapping = (0, vue_1.ref)(false);
var isSavingPOMapping = (0, vue_1.ref)(false);
var isSavingReservePriority = (0, vue_1.ref)(false);
var reservePriority = (0, vue_1.ref)('partial_first');
var originalReservePriority = (0, vue_1.ref)('partial_first');
var reservePriorityOptions = [
    { label: 'Ưu tiên cuộn lẻ', value: 'partial_first' },
    { label: 'Ưu tiên cuộn nguyên', value: 'full_first' },
];
var hasReservePriorityChanges = (0, vue_1.computed)(function () {
    return reservePriority.value !== originalReservePriority.value;
});
var columnOptions = Array.from({ length: 26 }, function (_, i) { return ({
    label: String.fromCharCode(65 + i),
    value: String.fromCharCode(65 + i),
}); });
var texMapping = (0, vue_1.reactive)({
    sheet_index: 0,
    header_row: 1,
    data_start_row: 2,
    columns: {
        supplier_name: 'A',
        tex_number: 'B',
        meters_per_cone: 'C',
        unit_price: 'D',
        supplier_item_code: 'E',
    },
});
var colorMapping = (0, vue_1.reactive)({
    sheet_index: 0,
    header_row: 1,
    data_start_row: 2,
    columns: {
        color_name: 'A',
        supplier_color_code: 'B',
    },
});
var poMapping = (0, vue_1.reactive)({
    sheet_index: 0,
    header_row: 1,
    data_start_row: 2,
    columns: {
        customer_name: 'A',
        po_number: 'B',
        style_code: 'C',
        week: 'D',
        description: 'E',
        finished_product_code: 'F',
        quantity: 'G',
    },
});
function normalizePOMappingSettingValue(setting) {
    if (!(setting === null || setting === void 0 ? void 0 : setting.value) || typeof setting.value !== 'object')
        return null;
    var val = setting.value;
    var columns = val.columns && typeof val.columns === 'object'
        ? val.columns
        : {};
    var hasLegacyShape = 'order_date' in columns || 'notes' in columns;
    if (hasLegacyShape) {
        return null;
    }
    return {
        sheet_index: typeof val.sheet_index === 'number' ? val.sheet_index : poMapping.sheet_index,
        header_row: typeof val.header_row === 'number' ? val.header_row : poMapping.header_row,
        data_start_row: typeof val.data_start_row === 'number' ? val.data_start_row : poMapping.data_start_row,
        columns: {
            customer_name: typeof columns.customer_name === 'string' ? columns.customer_name : poMapping.columns.customer_name,
            po_number: typeof columns.po_number === 'string' ? columns.po_number : poMapping.columns.po_number,
            style_code: typeof columns.style_code === 'string' ? columns.style_code : poMapping.columns.style_code,
            week: typeof columns.week === 'string' ? columns.week : poMapping.columns.week,
            description: typeof columns.description === 'string' ? columns.description : poMapping.columns.description,
            finished_product_code: typeof columns.finished_product_code === 'string'
                ? columns.finished_product_code
                : poMapping.columns.finished_product_code,
            quantity: typeof columns.quantity === 'string' ? columns.quantity : poMapping.columns.quantity,
        }
    };
}
var hasChanges = (0, vue_1.computed)(function () {
    return partialConeRatio.value !== originalValue.value;
});
function loadSettings() {
    return __awaiter(this, void 0, void 0, function () {
        var setting, value, prioritySetting, val;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSetting(PARTIAL_CONE_RATIO_KEY)];
                case 1:
                    setting = _a.sent();
                    if (setting) {
                        value = typeof setting.value === 'number' ? setting.value : parseFloat(String(setting.value));
                        partialConeRatio.value = isNaN(value) ? 0.5 : value;
                        originalValue.value = partialConeRatio.value;
                    }
                    return [4 /*yield*/, getSettingSilent(RESERVE_PRIORITY_KEY)];
                case 2:
                    prioritySetting = _a.sent();
                    if (prioritySetting === null || prioritySetting === void 0 ? void 0 : prioritySetting.value) {
                        val = typeof prioritySetting.value === 'string' ? prioritySetting.value : String(prioritySetting.value);
                        reservePriority.value = val === 'full_first' ? 'full_first' : 'partial_first';
                        originalReservePriority.value = reservePriority.value;
                    }
                    if (!isRoot.value) return [3 /*break*/, 4];
                    return [4 /*yield*/, loadImportMappings()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    hasLoaded.value = true;
                    return [2 /*return*/];
            }
        });
    });
}
function getSettingSilent(key) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, settingsService_1.settingsService.get(key)];
                case 1: return [2 /*return*/, _b.sent()];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function applyMappingValues(target, setting) {
    if (!(setting === null || setting === void 0 ? void 0 : setting.value) || typeof setting.value !== 'object')
        return;
    var val = setting.value;
    if (typeof val.sheet_index === 'number')
        target.sheet_index = val.sheet_index;
    if (typeof val.header_row === 'number')
        target.header_row = val.header_row;
    if (typeof val.data_start_row === 'number')
        target.data_start_row = val.data_start_row;
    if (val.columns && typeof val.columns === 'object') {
        Object.assign(target.columns, val.columns);
    }
}
function loadImportMappings() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, texSetting, colorSetting, poSetting, normalizedPOMapping;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        getSettingSilent(TEX_MAPPING_KEY),
                        getSettingSilent(COLOR_MAPPING_KEY),
                        getSettingSilent(PO_MAPPING_KEY),
                    ])];
                case 1:
                    _a = _b.sent(), texSetting = _a[0], colorSetting = _a[1], poSetting = _a[2];
                    applyMappingValues(texMapping, texSetting);
                    applyMappingValues(colorMapping, colorSetting);
                    normalizedPOMapping = normalizePOMappingSettingValue(poSetting);
                    if (normalizedPOMapping) {
                        applyMappingValues(poMapping, { value: normalizedPOMapping });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function handleSave() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, updateSetting(PARTIAL_CONE_RATIO_KEY, partialConeRatio.value)];
                case 1:
                    result = _a.sent();
                    if (result) {
                        originalValue.value = partialConeRatio.value;
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function handleSaveReservePriority() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isSavingReservePriority.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, updateSetting(RESERVE_PRIORITY_KEY, reservePriority.value)];
                case 2:
                    result = _a.sent();
                    if (result) {
                        originalReservePriority.value = reservePriority.value;
                    }
                    return [3 /*break*/, 4];
                case 3:
                    isSavingReservePriority.value = false;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function handleSaveTexMapping() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isSavingTexMapping.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, updateSetting(TEX_MAPPING_KEY, {
                            sheet_index: texMapping.sheet_index,
                            header_row: texMapping.header_row,
                            data_start_row: texMapping.data_start_row,
                            columns: __assign({}, texMapping.columns),
                        })];
                case 2:
                    result = _a.sent();
                    if (result) {
                        snackbar.success('Đã lưu cấu hình Import NCC-Tex');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    isSavingTexMapping.value = false;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function handleSaveColorMapping() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isSavingColorMapping.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, updateSetting(COLOR_MAPPING_KEY, {
                            sheet_index: colorMapping.sheet_index,
                            header_row: colorMapping.header_row,
                            data_start_row: colorMapping.data_start_row,
                            columns: __assign({}, colorMapping.columns),
                        })];
                case 2:
                    result = _a.sent();
                    if (result) {
                        snackbar.success('Đã lưu cấu hình Import Màu NCC');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    isSavingColorMapping.value = false;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function handleDownloadTexTemplate() {
    return __awaiter(this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, importService_1.importService.downloadTexTemplate()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    snackbar.error('Không thể tải file mẫu NCC-Tex');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function handleDownloadColorTemplate() {
    return __awaiter(this, void 0, void 0, function () {
        var e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, importService_1.importService.downloadColorTemplate()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_2 = _a.sent();
                    snackbar.error('Không thể tải file mẫu Màu NCC');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function handleSavePOMapping() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isSavingPOMapping.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, updateSetting(PO_MAPPING_KEY, {
                            sheet_index: poMapping.sheet_index,
                            header_row: poMapping.header_row,
                            data_start_row: poMapping.data_start_row,
                            columns: __assign({}, poMapping.columns),
                        })];
                case 2:
                    result = _a.sent();
                    if (result) {
                        snackbar.success('Đã lưu cấu hình Import PO');
                    }
                    return [3 /*break*/, 4];
                case 3:
                    isSavingPOMapping.value = false;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function handleDownloadPOTemplate() {
    return __awaiter(this, void 0, void 0, function () {
        var e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, importService_1.importService.downloadPOTemplate()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_3 = _a.sent();
                    snackbar.error('Không thể tải file mẫu PO');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, loadSettings()];
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-lg items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h5 q-my-none text-weight-bold text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-caption text-grey-7 q-mb-none" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-none']} */ ;
if (__VLS_ctx.isLoading && !__VLS_ctx.hasLoaded) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-center q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        size: "50px",
        color: "primary",
    }));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
            size: "50px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_8), false));
}
else {
    var __VLS_12 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12(__assign({ flat: true, bordered: true }, { class: "settings-card" })));
    var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "settings-card" })], __VLS_functionalComponentArgsRest(__VLS_13), false));
    /** @type {__VLS_StyleScopedClasses['settings-card']} */ ;
    var __VLS_17 = __VLS_15.slots.default;
    var __VLS_18 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({}));
    var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_19), false));
    var __VLS_23 = __VLS_21.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md items-end" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6 col-lg-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-lg-4']} */ ;
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        modelValue: (__VLS_ctx.partialConeRatio),
        modelModifiers: { number: true, },
        label: "Tỷ lệ quy đổi cuộn lẻ",
        type: "number",
        step: "0.1",
        min: "0",
        max: "1",
        hint: "Giá trị từ 0 đến 1 (ví dụ: 0.3 = 30%)",
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.partialConeRatio),
            modelModifiers: { number: true, },
            label: "Tỷ lệ quy đổi cuộn lẻ",
            type: "number",
            step: "0.1",
            min: "0",
            max: "1",
            hint: "Giá trị từ 0 đến 1 (ví dụ: 0.3 = 30%)",
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_25), false));
    var __VLS_29 = __VLS_27.slots.default;
    {
        var __VLS_30 = __VLS_27.slots.prepend;
        var __VLS_31 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
            name: "percent",
        }));
        var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([{
                name: "percent",
            }], __VLS_functionalComponentArgsRest(__VLS_32), false));
        // @ts-ignore
        [isLoading, isLoading, hasLoaded, partialConeRatio,];
    }
    // @ts-ignore
    [];
    var __VLS_27;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-auto']} */ ;
    var __VLS_36 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36(__assign({ 'onClick': {} }, { label: "Lưu thay đổi", color: "primary", icon: "save", loading: (__VLS_ctx.isLoading), disable: (!__VLS_ctx.hasChanges) })));
    var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Lưu thay đổi", color: "primary", icon: "save", loading: (__VLS_ctx.isLoading), disable: (!__VLS_ctx.hasChanges) })], __VLS_functionalComponentArgsRest(__VLS_37), false));
    var __VLS_41 = void 0;
    var __VLS_42 = ({ click: {} },
        { onClick: (__VLS_ctx.handleSave) });
    var __VLS_39;
    var __VLS_40;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    var __VLS_43 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43(__assign({ name: "info", size: "xs" }, { class: "q-mr-xs" })));
    var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([__assign({ name: "info", size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_44), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    var __VLS_48 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48(__assign({ class: "q-my-lg" })));
    var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([__assign({ class: "q-my-lg" })], __VLS_functionalComponentArgsRest(__VLS_49), false));
    /** @type {__VLS_StyleScopedClasses['q-my-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md items-end" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6 col-lg-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-lg-4']} */ ;
    var __VLS_53 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect | typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
        modelValue: (__VLS_ctx.reservePriority),
        label: "Ưu tiên khi reserve cuộn cho tuần",
        options: (__VLS_ctx.reservePriorityOptions),
        emitValue: true,
        mapOptions: true,
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.reservePriority),
            label: "Ưu tiên khi reserve cuộn cho tuần",
            options: (__VLS_ctx.reservePriorityOptions),
            emitValue: true,
            mapOptions: true,
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_54), false));
    var __VLS_58 = __VLS_56.slots.default;
    {
        var __VLS_59 = __VLS_56.slots.prepend;
        var __VLS_60 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
            name: "sort",
        }));
        var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([{
                name: "sort",
            }], __VLS_functionalComponentArgsRest(__VLS_61), false));
        // @ts-ignore
        [isLoading, isLoading, hasChanges, handleSave, reservePriority, reservePriorityOptions,];
    }
    // @ts-ignore
    [];
    var __VLS_56;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-auto']} */ ;
    var __VLS_65 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65(__assign({ 'onClick': {} }, { label: "Lưu ưu tiên", color: "primary", icon: "save", loading: (__VLS_ctx.isSavingReservePriority), disable: (!__VLS_ctx.hasReservePriorityChanges) })));
    var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Lưu ưu tiên", color: "primary", icon: "save", loading: (__VLS_ctx.isSavingReservePriority), disable: (!__VLS_ctx.hasReservePriorityChanges) })], __VLS_functionalComponentArgsRest(__VLS_66), false));
    var __VLS_70 = void 0;
    var __VLS_71 = ({ click: {} },
        { onClick: (__VLS_ctx.handleSaveReservePriority) });
    var __VLS_68;
    var __VLS_69;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    var __VLS_72 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72(__assign({ name: "info", size: "xs" }, { class: "q-mr-xs" })));
    var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([__assign({ name: "info", size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_73), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    // @ts-ignore
    [isSavingReservePriority, hasReservePriorityChanges, handleSaveReservePriority,];
    var __VLS_21;
    // @ts-ignore
    [];
    var __VLS_15;
}
if (__VLS_ctx.isRoot && __VLS_ctx.hasLoaded) {
    var __VLS_77 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77(__assign({ flat: true, bordered: true }, { class: "settings-card q-mt-lg" })));
    var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "settings-card q-mt-lg" })], __VLS_functionalComponentArgsRest(__VLS_78), false));
    /** @type {__VLS_StyleScopedClasses['settings-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-lg']} */ ;
    var __VLS_82 = __VLS_80.slots.default;
    var __VLS_83 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({}));
    var __VLS_85 = __VLS_84.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_84), false));
    var __VLS_88 = __VLS_86.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_89 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
        modelValue: (__VLS_ctx.texMapping.sheet_index),
        modelModifiers: { number: true, },
        label: "Sheet",
        type: "number",
        min: "0",
        hint: "Vị trí sheet (bắt đầu từ 0)",
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.texMapping.sheet_index),
            modelModifiers: { number: true, },
            label: "Sheet",
            type: "number",
            min: "0",
            hint: "Vị trí sheet (bắt đầu từ 0)",
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_90), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_94 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
        modelValue: (__VLS_ctx.texMapping.header_row),
        modelModifiers: { number: true, },
        label: "Dòng header",
        type: "number",
        min: "1",
        hint: "Dòng chứa tiêu đề cột",
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_96 = __VLS_95.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.texMapping.header_row),
            modelModifiers: { number: true, },
            label: "Dòng header",
            type: "number",
            min: "1",
            hint: "Dòng chứa tiêu đề cột",
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_95), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_99 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
        modelValue: (__VLS_ctx.texMapping.data_start_row),
        modelModifiers: { number: true, },
        label: "Dòng data bắt đầu",
        type: "number",
        min: "1",
        hint: "Dòng bắt đầu dữ liệu",
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.texMapping.data_start_row),
            modelModifiers: { number: true, },
            label: "Dòng data bắt đầu",
            type: "number",
            min: "1",
            hint: "Dòng bắt đầu dữ liệu",
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_100), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_104 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
        modelValue: (__VLS_ctx.texMapping.columns.supplier_name),
        label: "Cột Nhà cung cấp",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_106 = __VLS_105.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.texMapping.columns.supplier_name),
            label: "Cột Nhà cung cấp",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_105), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_109 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109({
        modelValue: (__VLS_ctx.texMapping.columns.tex_number),
        label: "Cột Tex",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_111 = __VLS_110.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.texMapping.columns.tex_number),
            label: "Cột Tex",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_110), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_114 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({
        modelValue: (__VLS_ctx.texMapping.columns.meters_per_cone),
        label: "Cột Mét/Cuộn",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_116 = __VLS_115.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.texMapping.columns.meters_per_cone),
            label: "Cột Mét/Cuộn",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_115), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_119 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({
        modelValue: (__VLS_ctx.texMapping.columns.unit_price),
        label: "Cột Giá/Cuộn VND",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.texMapping.columns.unit_price),
            label: "Cột Giá/Cuộn VND",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_120), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_124 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124({
        modelValue: (__VLS_ctx.texMapping.columns.supplier_item_code),
        label: "Cột Mã hàng NCC (tuỳ chọn)",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        clearable: true,
        outlined: true,
        dense: true,
    }));
    var __VLS_126 = __VLS_125.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.texMapping.columns.supplier_item_code),
            label: "Cột Mã hàng NCC (tuỳ chọn)",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            clearable: true,
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_125), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mt-md items-center" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_129 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129(__assign({ 'onClick': {} }, { label: "Lưu", color: "primary", icon: "save", loading: (__VLS_ctx.isSavingTexMapping), disable: (__VLS_ctx.isLoading) })));
    var __VLS_131 = __VLS_130.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Lưu", color: "primary", icon: "save", loading: (__VLS_ctx.isSavingTexMapping), disable: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_130), false));
    var __VLS_134 = void 0;
    var __VLS_135 = ({ click: {} },
        { onClick: (__VLS_ctx.handleSaveTexMapping) });
    var __VLS_132;
    var __VLS_133;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_136 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136(__assign({ 'onClick': {} }, { label: "Tải file mẫu", color: "secondary", icon: "download", variant: "outlined", disable: (__VLS_ctx.isLoading) })));
    var __VLS_138 = __VLS_137.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Tải file mẫu", color: "secondary", icon: "download", variant: "outlined", disable: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_137), false));
    var __VLS_141 = void 0;
    var __VLS_142 = ({ click: {} },
        { onClick: (__VLS_ctx.handleDownloadTexTemplate) });
    var __VLS_139;
    var __VLS_140;
    // @ts-ignore
    [isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, hasLoaded, isRoot, texMapping, texMapping, texMapping, texMapping, texMapping, texMapping, texMapping, texMapping, columnOptions, columnOptions, columnOptions, columnOptions, columnOptions, isSavingTexMapping, handleSaveTexMapping, handleDownloadTexTemplate,];
    var __VLS_86;
    // @ts-ignore
    [];
    var __VLS_80;
}
if (__VLS_ctx.isRoot && __VLS_ctx.hasLoaded) {
    var __VLS_143 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143(__assign({ flat: true, bordered: true }, { class: "settings-card q-mt-lg" })));
    var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "settings-card q-mt-lg" })], __VLS_functionalComponentArgsRest(__VLS_144), false));
    /** @type {__VLS_StyleScopedClasses['settings-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-lg']} */ ;
    var __VLS_148 = __VLS_146.slots.default;
    var __VLS_149 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_150 = __VLS_asFunctionalComponent1(__VLS_149, new __VLS_149({}));
    var __VLS_151 = __VLS_150.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_150), false));
    var __VLS_154 = __VLS_152.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_155 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_156 = __VLS_asFunctionalComponent1(__VLS_155, new __VLS_155({
        modelValue: (__VLS_ctx.colorMapping.sheet_index),
        modelModifiers: { number: true, },
        label: "Sheet",
        type: "number",
        min: "0",
        hint: "Vị trí sheet (bắt đầu từ 0)",
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_157 = __VLS_156.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.colorMapping.sheet_index),
            modelModifiers: { number: true, },
            label: "Sheet",
            type: "number",
            min: "0",
            hint: "Vị trí sheet (bắt đầu từ 0)",
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_156), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_160 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160({
        modelValue: (__VLS_ctx.colorMapping.header_row),
        modelModifiers: { number: true, },
        label: "Dòng header",
        type: "number",
        min: "1",
        hint: "Dòng chứa tiêu đề cột",
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_162 = __VLS_161.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.colorMapping.header_row),
            modelModifiers: { number: true, },
            label: "Dòng header",
            type: "number",
            min: "1",
            hint: "Dòng chứa tiêu đề cột",
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_161), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_165 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165({
        modelValue: (__VLS_ctx.colorMapping.data_start_row),
        modelModifiers: { number: true, },
        label: "Dòng data bắt đầu",
        type: "number",
        min: "1",
        hint: "Dòng bắt đầu dữ liệu",
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_167 = __VLS_166.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.colorMapping.data_start_row),
            modelModifiers: { number: true, },
            label: "Dòng data bắt đầu",
            type: "number",
            min: "1",
            hint: "Dòng bắt đầu dữ liệu",
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_166), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_170 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_171 = __VLS_asFunctionalComponent1(__VLS_170, new __VLS_170({
        modelValue: (__VLS_ctx.colorMapping.columns.color_name),
        label: "Cột Tên Màu",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_172 = __VLS_171.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.colorMapping.columns.color_name),
            label: "Cột Tên Màu",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_171), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_175 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_176 = __VLS_asFunctionalComponent1(__VLS_175, new __VLS_175({
        modelValue: (__VLS_ctx.colorMapping.columns.supplier_color_code),
        label: "Cột Mã màu NCC (tuỳ chọn)",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        clearable: true,
        outlined: true,
        dense: true,
    }));
    var __VLS_177 = __VLS_176.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.colorMapping.columns.supplier_color_code),
            label: "Cột Mã màu NCC (tuỳ chọn)",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            clearable: true,
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_176), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mt-md items-center" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_180 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180(__assign({ 'onClick': {} }, { label: "Lưu", color: "primary", icon: "save", loading: (__VLS_ctx.isSavingColorMapping), disable: (__VLS_ctx.isLoading) })));
    var __VLS_182 = __VLS_181.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Lưu", color: "primary", icon: "save", loading: (__VLS_ctx.isSavingColorMapping), disable: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_181), false));
    var __VLS_185 = void 0;
    var __VLS_186 = ({ click: {} },
        { onClick: (__VLS_ctx.handleSaveColorMapping) });
    var __VLS_183;
    var __VLS_184;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_187 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_188 = __VLS_asFunctionalComponent1(__VLS_187, new __VLS_187(__assign({ 'onClick': {} }, { label: "Tải file mẫu", color: "secondary", icon: "download", variant: "outlined", disable: (__VLS_ctx.isLoading) })));
    var __VLS_189 = __VLS_188.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Tải file mẫu", color: "secondary", icon: "download", variant: "outlined", disable: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_188), false));
    var __VLS_192 = void 0;
    var __VLS_193 = ({ click: {} },
        { onClick: (__VLS_ctx.handleDownloadColorTemplate) });
    var __VLS_190;
    var __VLS_191;
    // @ts-ignore
    [isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, hasLoaded, isRoot, columnOptions, columnOptions, colorMapping, colorMapping, colorMapping, colorMapping, colorMapping, isSavingColorMapping, handleSaveColorMapping, handleDownloadColorTemplate,];
    var __VLS_152;
    // @ts-ignore
    [];
    var __VLS_146;
}
if (__VLS_ctx.isRoot && __VLS_ctx.hasLoaded) {
    var __VLS_194 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_195 = __VLS_asFunctionalComponent1(__VLS_194, new __VLS_194(__assign({ flat: true, bordered: true }, { class: "settings-card q-mt-lg" })));
    var __VLS_196 = __VLS_195.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "settings-card q-mt-lg" })], __VLS_functionalComponentArgsRest(__VLS_195), false));
    /** @type {__VLS_StyleScopedClasses['settings-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-lg']} */ ;
    var __VLS_199 = __VLS_197.slots.default;
    var __VLS_200 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_201 = __VLS_asFunctionalComponent1(__VLS_200, new __VLS_200({}));
    var __VLS_202 = __VLS_201.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_201), false));
    var __VLS_205 = __VLS_203.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_206 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_207 = __VLS_asFunctionalComponent1(__VLS_206, new __VLS_206({
        modelValue: (__VLS_ctx.poMapping.sheet_index),
        modelModifiers: { number: true, },
        label: "Sheet",
        type: "number",
        min: "0",
        hint: "Vị trí sheet (bắt đầu từ 0)",
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_208 = __VLS_207.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.poMapping.sheet_index),
            modelModifiers: { number: true, },
            label: "Sheet",
            type: "number",
            min: "0",
            hint: "Vị trí sheet (bắt đầu từ 0)",
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_207), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_211 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_212 = __VLS_asFunctionalComponent1(__VLS_211, new __VLS_211({
        modelValue: (__VLS_ctx.poMapping.header_row),
        modelModifiers: { number: true, },
        label: "Dòng header",
        type: "number",
        min: "1",
        hint: "Dòng chứa tiêu đề cột",
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_213 = __VLS_212.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.poMapping.header_row),
            modelModifiers: { number: true, },
            label: "Dòng header",
            type: "number",
            min: "1",
            hint: "Dòng chứa tiêu đề cột",
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_212), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_216 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_217 = __VLS_asFunctionalComponent1(__VLS_216, new __VLS_216({
        modelValue: (__VLS_ctx.poMapping.data_start_row),
        modelModifiers: { number: true, },
        label: "Dòng data bắt đầu",
        type: "number",
        min: "1",
        hint: "Dòng bắt đầu dữ liệu",
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_218 = __VLS_217.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.poMapping.data_start_row),
            modelModifiers: { number: true, },
            label: "Dòng data bắt đầu",
            type: "number",
            min: "1",
            hint: "Dòng bắt đầu dữ liệu",
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_217), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_221 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221({
        modelValue: (__VLS_ctx.poMapping.columns.customer_name),
        label: "Cột Khách hàng",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_223 = __VLS_222.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.poMapping.columns.customer_name),
            label: "Cột Khách hàng",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_222), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_226 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_227 = __VLS_asFunctionalComponent1(__VLS_226, new __VLS_226({
        modelValue: (__VLS_ctx.poMapping.columns.po_number),
        label: "Cột Số PO",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_228 = __VLS_227.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.poMapping.columns.po_number),
            label: "Cột Số PO",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_227), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_231 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_232 = __VLS_asFunctionalComponent1(__VLS_231, new __VLS_231({
        modelValue: (__VLS_ctx.poMapping.columns.style_code),
        label: "Cột Mã hàng",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_233 = __VLS_232.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.poMapping.columns.style_code),
            label: "Cột Mã hàng",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_232), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_236 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_237 = __VLS_asFunctionalComponent1(__VLS_236, new __VLS_236({
        modelValue: (__VLS_ctx.poMapping.columns.week),
        label: "Cột Week",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        clearable: true,
        outlined: true,
        dense: true,
    }));
    var __VLS_238 = __VLS_237.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.poMapping.columns.week),
            label: "Cột Week",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            clearable: true,
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_237), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_241 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_242 = __VLS_asFunctionalComponent1(__VLS_241, new __VLS_241({
        modelValue: (__VLS_ctx.poMapping.columns.description),
        label: "Cột Mô tả",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        clearable: true,
        outlined: true,
        dense: true,
    }));
    var __VLS_243 = __VLS_242.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.poMapping.columns.description),
            label: "Cột Mô tả",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            clearable: true,
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_242), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_246 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_247 = __VLS_asFunctionalComponent1(__VLS_246, new __VLS_246({
        modelValue: (__VLS_ctx.poMapping.columns.finished_product_code),
        label: "Cột Mã TP KT",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        clearable: true,
        outlined: true,
        dense: true,
    }));
    var __VLS_248 = __VLS_247.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.poMapping.columns.finished_product_code),
            label: "Cột Mã TP KT",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            clearable: true,
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_247), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_251 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_252 = __VLS_asFunctionalComponent1(__VLS_251, new __VLS_251({
        modelValue: (__VLS_ctx.poMapping.columns.quantity),
        label: "Cột SL SP",
        options: (__VLS_ctx.columnOptions),
        disable: (__VLS_ctx.isLoading),
        outlined: true,
        dense: true,
    }));
    var __VLS_253 = __VLS_252.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.poMapping.columns.quantity),
            label: "Cột SL SP",
            options: (__VLS_ctx.columnOptions),
            disable: (__VLS_ctx.isLoading),
            outlined: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_252), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mt-md items-center" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_256 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_257 = __VLS_asFunctionalComponent1(__VLS_256, new __VLS_256(__assign({ 'onClick': {} }, { label: "Lưu", color: "primary", icon: "save", loading: (__VLS_ctx.isSavingPOMapping), disable: (__VLS_ctx.isLoading) })));
    var __VLS_258 = __VLS_257.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Lưu", color: "primary", icon: "save", loading: (__VLS_ctx.isSavingPOMapping), disable: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_257), false));
    var __VLS_261 = void 0;
    var __VLS_262 = ({ click: {} },
        { onClick: (__VLS_ctx.handleSavePOMapping) });
    var __VLS_259;
    var __VLS_260;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_263 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_264 = __VLS_asFunctionalComponent1(__VLS_263, new __VLS_263(__assign({ 'onClick': {} }, { label: "Tải file mẫu", color: "secondary", icon: "download", variant: "outlined", disable: (__VLS_ctx.isLoading) })));
    var __VLS_265 = __VLS_264.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Tải file mẫu", color: "secondary", icon: "download", variant: "outlined", disable: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_264), false));
    var __VLS_268 = void 0;
    var __VLS_269 = ({ click: {} },
        { onClick: (__VLS_ctx.handleDownloadPOTemplate) });
    var __VLS_266;
    var __VLS_267;
    // @ts-ignore
    [isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, isLoading, hasLoaded, isRoot, columnOptions, columnOptions, columnOptions, columnOptions, columnOptions, columnOptions, columnOptions, poMapping, poMapping, poMapping, poMapping, poMapping, poMapping, poMapping, poMapping, poMapping, poMapping, isSavingPOMapping, handleSavePOMapping, handleDownloadPOTemplate,];
    var __VLS_203;
    // @ts-ignore
    [];
    var __VLS_197;
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
