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
var styleColorService_1 = require("@/services/styleColorService");
var supplierService_1 = require("@/services/supplierService");
var subArtService_1 = require("@/services/subArtService");
var inputs_1 = require("@/components/ui/inputs");
var props = defineProps();
var emit = defineEmits();
var confirm = (0, composables_1.useConfirm)();
var snackbar = (0, composables_1.useSnackbar)();
var _b = (0, composables_1.useStyleThreadSpecs)(), colorSpecs = _b.colorSpecs, fetchAllColorSpecsByStyle = _b.fetchAllColorSpecsByStyle, addColorSpec = _b.addColorSpec, updateColorSpec = _b.updateColorSpec, deleteColorSpec = _b.deleteColorSpec;
// Local state
var colorSpecsLoading = (0, vue_1.ref)(false);
var inlineEditLoading = (0, vue_1.ref)({});
var showCreateColorDialog = (0, vue_1.ref)(false);
var newColorName = (0, vue_1.ref)('');
var newColorHex = (0, vue_1.ref)('#cccccc');
var creatingColor = (0, vue_1.ref)(false);
var subArts = (0, vue_1.ref)([]);
var selectedSubArt = (0, vue_1.ref)(null);
var hasSubArts = (0, vue_1.computed)(function () { return subArts.value.length > 0; });
var supplierColorsCache = (0, vue_1.ref)({});
var fetchSupplierColors = function (supplierId) { return __awaiter(void 0, void 0, void 0, function () {
    var data, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (supplierColorsCache.value[supplierId])
                    return [2 /*return*/];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, supplierService_1.supplierService.getColors(supplierId)];
            case 2:
                data = _b.sent();
                supplierColorsCache.value[supplierId] = data
                    .filter(function (link) { var _a; return (_a = link.color) === null || _a === void 0 ? void 0 : _a.is_active; })
                    .map(function (link) { return link.color; });
                return [3 /*break*/, 4];
            case 3:
                _a = _b.sent();
                supplierColorsCache.value[supplierId] = [];
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
// Helpers
var getColorCellKey = function (specId, colorId) {
    return "".concat(specId, "-").concat(colorId);
};
var getColorDisplayName = function (row) {
    if (!row.threadColor)
        return '-';
    return row.threadColor.name;
};
var parseColorName = function (colorName) {
    if (!hasSubArts.value)
        return { subArt: null, color: colorName };
    var idx = colorName.indexOf(' - ');
    if (idx === -1)
        return { subArt: null, color: colorName };
    return { subArt: colorName.substring(0, idx), color: colorName.substring(idx + 3) };
};
var getColorOptionsForSpec = function (spec) {
    if (!spec.supplier_id)
        return [];
    var colors = supplierColorsCache.value[spec.supplier_id] || [];
    return colors.map(function (c) { return ({
        label: c.name,
        value: c.id,
    }); });
};
var filteredColorOptionsMap = (0, vue_1.ref)({});
var getFilteredColorOptions = function (spec) {
    var _a;
    if (!spec.supplier_id)
        return [];
    return (_a = filteredColorOptionsMap.value[spec.supplier_id]) !== null && _a !== void 0 ? _a : getColorOptionsForSpec(spec);
};
var filterColorOptions = function (val, update, spec) {
    update(function () {
        var allOptions = getColorOptionsForSpec(spec);
        if (!val) {
            filteredColorOptionsMap.value[spec.supplier_id] = allOptions;
            return;
        }
        var needle = val.toLowerCase();
        filteredColorOptionsMap.value[spec.supplier_id] = allOptions.filter(function (o) { return o.label.toLowerCase().includes(needle); });
    });
};
var colorGroups = (0, vue_1.computed)(function () {
    if (props.specs.length === 0)
        return [];
    var activeColors = props.styleColors.filter(function (c) { return c.is_active; });
    return activeColors.map(function (colorData) {
        var rows = props.specs.map(function (spec) {
            var _a, _b;
            var match = colorSpecs.value.find(function (cs) { return cs.style_thread_spec_id === spec.id && cs.style_color_id === colorData.id; });
            return {
                specId: spec.id,
                spec: spec,
                colorSpecId: (_a = match === null || match === void 0 ? void 0 : match.id) !== null && _a !== void 0 ? _a : null,
                threadColorId: (_b = match === null || match === void 0 ? void 0 : match.thread_color_id) !== null && _b !== void 0 ? _b : null,
                threadColor: (match === null || match === void 0 ? void 0 : match.thread_color) ? {
                    id: match.thread_color.id,
                    name: match.thread_color.name,
                    hex_code: match.thread_color.hex_code,
                } : null,
            };
        });
        return {
            color: {
                id: colorData.id,
                color_name: colorData.color_name,
                hex_code: colorData.hex_code,
            },
            rows: rows,
        };
    }).sort(function (a, b) { return a.color.color_name.localeCompare(b.color.color_name); });
});
// Table columns
var colorTableColumns = [
    {
        name: 'process_name',
        label: 'Công đoạn',
        field: function (row) { return row.spec.process_name; },
        align: 'left',
    },
    {
        name: 'supplier',
        label: 'NCC',
        field: function (row) { var _a; return ((_a = row.spec.suppliers) === null || _a === void 0 ? void 0 : _a.name) || '-'; },
        align: 'left',
    },
    {
        name: 'tex',
        label: 'Tex',
        field: function (row) { var _a, _b; return ((_a = row.spec.thread_types) === null || _a === void 0 ? void 0 : _a.tex_label) || ((_b = row.spec.thread_types) === null || _b === void 0 ? void 0 : _b.tex_number) || '-'; },
        align: 'left',
    },
    {
        name: 'meters_per_unit',
        label: 'Định mức (Mét/SP)',
        field: function (row) { var _a; return ((_a = row.spec.meters_per_unit) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || '-'; },
        align: 'right',
    },
    {
        name: 'meters_per_cone',
        label: 'Chiều dài cuộn (Mét)',
        field: function (row) { var _a, _b; return (_b = (_a = row.spec.thread_types) === null || _a === void 0 ? void 0 : _a.meters_per_cone) !== null && _b !== void 0 ? _b : null; },
        align: 'right',
    },
    {
        name: 'thread_color',
        label: 'Màu chỉ',
        field: 'thread_color',
        align: 'left',
    },
];
// Load data
var loadColorSpecs = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                colorSpecsLoading.value = true;
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 3, 4]);
                return [4 /*yield*/, fetchAllColorSpecsByStyle(props.styleId)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                colorSpecsLoading.value = false;
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); };
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    var supplierIds;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, loadColorSpecs()];
            case 1:
                _a.sent();
                supplierIds = __spreadArray([], new Set(props.specs.map(function (s) { return s.supplier_id; }).filter(Boolean)), true);
                return [4 /*yield*/, Promise.all(__spreadArray(__spreadArray([], supplierIds.map(function (id) { return fetchSupplierColors(id); }), true), [
                        subArtService_1.subArtService.getByStyleId(props.styleId).then(function (data) { subArts.value = data; }).catch(function () { subArts.value = []; }),
                    ], false))];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, vue_1.watch)(function () { return props.styleId; }, loadColorSpecs);
(0, vue_1.watch)(showCreateColorDialog, function (val) {
    if (!val) {
        selectedSubArt.value = null;
        newColorName.value = '';
        newColorHex.value = '#cccccc';
    }
});
// Handlers
var handleCreateColor = function () { return __awaiter(void 0, void 0, void 0, function () {
    var colorPart, finalColorName, newColor, err_1, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                colorPart = newColorName.value.trim();
                if (!colorPart || !newColorHex.value)
                    return [2 /*return*/];
                if (hasSubArts.value && !selectedSubArt.value)
                    return [2 /*return*/];
                finalColorName = hasSubArts.value && selectedSubArt.value
                    ? "".concat(selectedSubArt.value, " - ").concat(colorPart)
                    : colorPart;
                creatingColor.value = true;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, styleColorService_1.styleColorService.create(props.styleId, {
                        color_name: finalColorName,
                        hex_code: newColorHex.value,
                    })];
            case 2:
                newColor = _a.sent();
                if (newColor) {
                    showCreateColorDialog.value = false;
                    newColorName.value = '';
                    newColorHex.value = '#cccccc';
                    selectedSubArt.value = null;
                    emit('color-created');
                    snackbar.success('Tạo màu mới thành công');
                }
                return [3 /*break*/, 5];
            case 3:
                err_1 = _a.sent();
                message = err_1 instanceof Error ? err_1.message : 'Không thể tạo màu mới';
                snackbar.error(message);
                return [3 /*break*/, 5];
            case 4:
                creatingColor.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
var handleDeleteColorGroup = function (color) { return __awaiter(void 0, void 0, void 0, function () {
    var confirmed, toDelete, _i, toDelete_1, cs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, confirm.confirmDelete({
                    itemName: "t\u1EA5t c\u1EA3 \u0111\u1ECBnh m\u1EE9c m\u00E0u cho \"".concat(color.color_name, "\""),
                })];
            case 1:
                confirmed = _a.sent();
                if (!confirmed)
                    return [2 /*return*/];
                toDelete = colorSpecs.value.filter(function (cs) { return cs.style_color_id === color.id; });
                _i = 0, toDelete_1 = toDelete;
                _a.label = 2;
            case 2:
                if (!(_i < toDelete_1.length)) return [3 /*break*/, 5];
                cs = toDelete_1[_i];
                return [4 /*yield*/, deleteColorSpec(cs.id)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: 
            // Re-fetch to sync
            return [4 /*yield*/, loadColorSpecs()];
            case 6:
                // Re-fetch to sync
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
/**
 * Handle inline edit of "Màu chỉ" column.
 * - New mapping (colorSpecId is null, new value selected) → CREATE with thread_type_id
 * - Existing mapping updated → UPDATE with thread_type_id
 * - Existing mapping cleared → UPDATE with thread_color_id: null, keep thread_type_id
 */
var handleColorSpecEdit = function (row, color, newValue, originalValue) { return __awaiter(void 0, void 0, void 0, function () {
    var cellKey, threadTypeId, _a;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (newValue === originalValue)
                    return [2 /*return*/];
                cellKey = getColorCellKey(row.specId, color.id);
                inlineEditLoading.value[cellKey] = true;
                threadTypeId = (_b = row.spec.thread_type_id) !== null && _b !== void 0 ? _b : undefined;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 9, 10, 11]);
                if (!(row.colorSpecId === null && newValue !== null)) return [3 /*break*/, 3];
                return [4 /*yield*/, addColorSpec(row.specId, {
                        style_thread_spec_id: row.specId,
                        style_color_id: color.id,
                        thread_color_id: newValue,
                        thread_type_id: threadTypeId,
                    })];
            case 2:
                _c.sent();
                return [3 /*break*/, 7];
            case 3:
                if (!(row.colorSpecId !== null && newValue !== null)) return [3 /*break*/, 5];
                return [4 /*yield*/, updateColorSpec(row.colorSpecId, {
                        thread_color_id: newValue,
                        thread_type_id: threadTypeId,
                    })];
            case 4:
                _c.sent();
                return [3 /*break*/, 7];
            case 5:
                if (!(row.colorSpecId !== null && newValue === null)) return [3 /*break*/, 7];
                return [4 /*yield*/, updateColorSpec(row.colorSpecId, {
                        thread_color_id: null,
                        thread_type_id: threadTypeId,
                    })];
            case 6:
                _c.sent();
                _c.label = 7;
            case 7: 
            // Re-fetch to get updated joined data
            return [4 /*yield*/, fetchAllColorSpecsByStyle(props.styleId)];
            case 8:
                // Re-fetch to get updated joined data
                _c.sent();
                return [3 /*break*/, 11];
            case 9:
                _a = _c.sent();
                // Error notification handled by composable
                // Revert the optimistic v-model update
                row.threadColorId = originalValue;
                return [3 /*break*/, 11];
            case 10:
                inlineEditLoading.value[cellKey] = false;
                return [7 /*endfinally*/];
            case 11: return [2 /*return*/];
        }
    });
}); };
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['edit-hint']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mb-md items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
if (__VLS_ctx.specs.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_0 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Tạo màu hàng mới", unelevated: true, dense: true })));
    var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Tạo màu hàng mới", unelevated: true, dense: true })], __VLS_functionalComponentArgsRest(__VLS_1), false));
    var __VLS_5 = void 0;
    var __VLS_6 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.specs.length > 0))
                    return;
                __VLS_ctx.showCreateColorDialog = true;
                // @ts-ignore
                [specs, showCreateColorDialog,];
            } });
    var __VLS_3;
    var __VLS_4;
}
if (__VLS_ctx.specs.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        name: "palette",
        size: "xl",
        color: "grey-5",
    }));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
            name: "palette",
            size: "xl",
            color: "grey-5",
        }], __VLS_functionalComponentArgsRest(__VLS_8), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-grey-6 q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    var __VLS_12 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12(__assign({ 'onClick': {} }, { outline: true, color: "primary", label: "Đi đến Định mức chỉ" })));
    var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { outline: true, color: "primary", label: "Đi đến Định mức chỉ" })], __VLS_functionalComponentArgsRest(__VLS_13), false));
    var __VLS_17 = void 0;
    var __VLS_18 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.specs.length === 0))
                    return;
                __VLS_ctx.emit('go-to-specs');
                // @ts-ignore
                [specs, emit,];
            } });
    var __VLS_15;
    var __VLS_16;
}
if (__VLS_ctx.specs.length > 0 && __VLS_ctx.colorGroups.length === 0 && !__VLS_ctx.colorSpecsLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_19 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
        name: "palette",
        size: "xl",
        color: "grey-5",
    }));
    var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([{
            name: "palette",
            size: "xl",
            color: "grey-5",
        }], __VLS_functionalComponentArgsRest(__VLS_20), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-grey-6 q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
}
else if (__VLS_ctx.colorSpecsLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-center q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
    qSpinner;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        size: "lg",
        color: "primary",
    }));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{
            size: "lg",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_25), false));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
    var _loop_1 = function (group) {
        var __VLS_29 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
        qCard;
        // @ts-ignore
        var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
            key: (group.color.id),
            flat: true,
            bordered: true,
        }));
        var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{
                key: (group.color.id),
                flat: true,
                bordered: true,
            }], __VLS_functionalComponentArgsRest(__VLS_30), false));
        var __VLS_34 = __VLS_32.slots.default;
        var __VLS_35 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
        qCardSection;
        // @ts-ignore
        var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign({ class: "q-pb-none" })));
        var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign({ class: "q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_36), false));
        /** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
        var __VLS_40 = __VLS_38.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-swatch-lg" }, { style: ({ backgroundColor: group.color.hex_code || '#ccc' }) }));
        /** @type {__VLS_StyleScopedClasses['color-swatch-lg']} */ ;
        if (__VLS_ctx.hasSubArts && __VLS_ctx.parseColorName(group.color.color_name).subArt) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
            (__VLS_ctx.parseColorName(group.color.color_name).subArt);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (__VLS_ctx.parseColorName(group.color.color_name).color);
        var __VLS_41 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
        qSpace;
        // @ts-ignore
        var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({}));
        var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_42), false));
        var __VLS_46 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "delete", color: "negative", size: "sm" })));
        var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "delete", color: "negative", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_47), false));
        var __VLS_51 = void 0;
        var __VLS_52 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.specs.length > 0 && __VLS_ctx.colorGroups.length === 0 && !__VLS_ctx.colorSpecsLoading))
                        return;
                    if (!!(__VLS_ctx.colorSpecsLoading))
                        return;
                    __VLS_ctx.handleDeleteColorGroup(group.color);
                    // @ts-ignore
                    [specs, colorGroups, colorGroups, colorSpecsLoading, colorSpecsLoading, hasSubArts, parseColorName, parseColorName, parseColorName, handleDeleteColorGroup,];
                } });
        var __VLS_53 = __VLS_49.slots.default;
        var __VLS_54 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({}));
        var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_55), false));
        var __VLS_59 = __VLS_57.slots.default;
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        var __VLS_60 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
        qCardSection;
        // @ts-ignore
        var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({}));
        var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_61), false));
        var __VLS_65 = __VLS_63.slots.default;
        var __VLS_66 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
        qTable;
        // @ts-ignore
        var __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
            rows: (group.rows),
            columns: (__VLS_ctx.colorTableColumns),
            rowKey: "specId",
            flat: true,
            bordered: true,
            dense: true,
            pagination: ({ rowsPerPage: 0 }),
            hidePagination: true,
        }));
        var __VLS_68 = __VLS_67.apply(void 0, __spreadArray([{
                rows: (group.rows),
                columns: (__VLS_ctx.colorTableColumns),
                rowKey: "specId",
                flat: true,
                bordered: true,
                dense: true,
                pagination: ({ rowsPerPage: 0 }),
                hidePagination: true,
            }], __VLS_functionalComponentArgsRest(__VLS_67), false));
        var __VLS_71 = __VLS_69.slots.default;
        {
            var __VLS_72 = __VLS_69.slots["body-cell-thread_color"];
            var props_1 = __VLS_vSlot(__VLS_72)[0];
            var __VLS_73 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73(__assign({ props: (props_1) }, { class: "cursor-pointer editable-cell" })));
            var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([__assign({ props: (props_1) }, { class: "cursor-pointer editable-cell" })], __VLS_functionalComponentArgsRest(__VLS_74), false));
            /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
            /** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
            var __VLS_78 = __VLS_76.slots.default;
            if (__VLS_ctx.inlineEditLoading[__VLS_ctx.getColorCellKey(props_1.row.specId, group.color.id)]) {
                var __VLS_79 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
                qSpinnerDots;
                // @ts-ignore
                var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
                    size: "sm",
                    color: "primary",
                }));
                var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([{
                        size: "sm",
                        color: "primary",
                    }], __VLS_functionalComponentArgsRest(__VLS_80), false));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cell-value" }));
                /** @type {__VLS_StyleScopedClasses['cell-value']} */ ;
                (__VLS_ctx.getColorDisplayName(props_1.row));
                var __VLS_84 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
                qIcon;
                // @ts-ignore
                var __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84(__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })));
                var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })], __VLS_functionalComponentArgsRest(__VLS_85), false));
                /** @type {__VLS_StyleScopedClasses['edit-hint']} */ ;
                /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
                var __VLS_89 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
                qPopupEdit;
                // @ts-ignore
                var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89(__assign({ 'onSave': {} }, { modelValue: (props_1.row.threadColorId), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
                var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_1.row.threadColorId), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_90), false));
                var __VLS_94 = void 0;
                var __VLS_95 = ({ save: {} },
                    { onSave: (function (val, initialVal) { return __VLS_ctx.handleColorSpecEdit(props_1.row, group.color, val, initialVal); }) });
                {
                    var __VLS_96 = __VLS_92.slots.default;
                    var scope = __VLS_vSlot(__VLS_96)[0];
                    var __VLS_97 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
                    qSelect;
                    // @ts-ignore
                    var __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97(__assign(__assign({ 'onFilter': {} }, { modelValue: (scope.value), options: (__VLS_ctx.getFilteredColorOptions(props_1.row.spec)), optionValue: "value", optionLabel: "label", emitValue: true, mapOptions: true, dense: true, autofocus: true, clearable: true, useInput: true, fillInput: true, hideSelected: true, label: "Chọn màu chỉ" }), { style: {} })));
                    var __VLS_99 = __VLS_98.apply(void 0, __spreadArray([__assign(__assign({ 'onFilter': {} }, { modelValue: (scope.value), options: (__VLS_ctx.getFilteredColorOptions(props_1.row.spec)), optionValue: "value", optionLabel: "label", emitValue: true, mapOptions: true, dense: true, autofocus: true, clearable: true, useInput: true, fillInput: true, hideSelected: true, label: "Chọn màu chỉ" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_98), false));
                    var __VLS_102 = void 0;
                    var __VLS_103 = ({ filter: {} },
                        { onFilter: (function (val, update) { return __VLS_ctx.filterColorOptions(val, update, props_1.row.spec); }) });
                    // @ts-ignore
                    [colorTableColumns, inlineEditLoading, getColorCellKey, getColorDisplayName, handleColorSpecEdit, getFilteredColorOptions, filterColorOptions,];
                    __VLS_92.slots['' /* empty slot name completion */];
                }
            }
            // @ts-ignore
            [];
            // @ts-ignore
            [];
        }
        {
            var __VLS_104 = __VLS_69.slots["body-cell-meters_per_cone"];
            var props_2 = __VLS_vSlot(__VLS_104)[0];
            var __VLS_105 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ props: (props_2) }, { class: "text-right" })));
            var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ props: (props_2) }, { class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
            /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
            var __VLS_110 = __VLS_108.slots.default;
            (((_a = props_2.row.spec.thread_types) === null || _a === void 0 ? void 0 : _a.meters_per_cone)
                ? new Intl.NumberFormat('vi-VN').format(props_2.row.spec.thread_types.meters_per_cone)
                : '-');
            // @ts-ignore
            [];
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_57, __VLS_49, __VLS_50, __VLS_38, __VLS_100, __VLS_101, __VLS_92, __VLS_93, __VLS_76, __VLS_108, __VLS_69, __VLS_63, __VLS_32;
    for (var _i = 0, _c = __VLS_vFor((__VLS_ctx.colorGroups)); _i < _c.length; _i++) {
        var group = _c[_i][0];
        _loop_1(group);
    }
}
var __VLS_111;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111({
    modelValue: (__VLS_ctx.showCreateColorDialog),
}));
var __VLS_113 = __VLS_112.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showCreateColorDialog),
    }], __VLS_functionalComponentArgsRest(__VLS_112), false));
var __VLS_116 = __VLS_114.slots.default;
var __VLS_117;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117(__assign({ style: {} })));
var __VLS_119 = __VLS_118.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_118), false));
var __VLS_122 = __VLS_120.slots.default;
var __VLS_123;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123(__assign({ class: "row items-center" })));
var __VLS_125 = __VLS_124.apply(void 0, __spreadArray([__assign({ class: "row items-center" })], __VLS_functionalComponentArgsRest(__VLS_124), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_128 = __VLS_126.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
var __VLS_129;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_130 = __VLS_asFunctionalComponent1(__VLS_129, new __VLS_129({}));
var __VLS_131 = __VLS_130.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_130), false));
var __VLS_134;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({
    icon: "close",
    flat: true,
    round: true,
    dense: true,
}));
var __VLS_136 = __VLS_135.apply(void 0, __spreadArray([{
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_135), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[showCreateColorDialog, vClosePopup,];
var __VLS_126;
var __VLS_139;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_140 = __VLS_asFunctionalComponent1(__VLS_139, new __VLS_139({}));
var __VLS_141 = __VLS_140.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_140), false));
var __VLS_144;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_145 = __VLS_asFunctionalComponent1(__VLS_144, new __VLS_144(__assign({ class: "q-gutter-sm" })));
var __VLS_146 = __VLS_145.apply(void 0, __spreadArray([__assign({ class: "q-gutter-sm" })], __VLS_functionalComponentArgsRest(__VLS_145), false));
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
var __VLS_149 = __VLS_147.slots.default;
if (__VLS_ctx.hasSubArts) {
    var __VLS_150 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    inputs_1.AppSelect;
    // @ts-ignore
    var __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({
        modelValue: (__VLS_ctx.selectedSubArt),
        options: (__VLS_ctx.subArts.map(function (s) { return ({ label: s.sub_art_code, value: s.sub_art_code }); })),
        label: "Chọn Sub-Art *",
        dense: true,
        required: true,
    }));
    var __VLS_152 = __VLS_151.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.selectedSubArt),
            options: (__VLS_ctx.subArts.map(function (s) { return ({ label: s.sub_art_code, value: s.sub_art_code }); })),
            label: "Chọn Sub-Art *",
            dense: true,
            required: true,
        }], __VLS_functionalComponentArgsRest(__VLS_151), false));
}
var __VLS_155;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_156 = __VLS_asFunctionalComponent1(__VLS_155, new __VLS_155({
    modelValue: (__VLS_ctx.newColorName),
    label: "Tên màu *",
    outlined: true,
    dense: true,
    placeholder: "VD: Đỏ đậm, Xanh navy...",
}));
var __VLS_157 = __VLS_156.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.newColorName),
        label: "Tên màu *",
        outlined: true,
        dense: true,
        placeholder: "VD: Đỏ đậm, Xanh navy...",
    }], __VLS_functionalComponentArgsRest(__VLS_156), false));
if (__VLS_ctx.hasSubArts && __VLS_ctx.selectedSubArt && __VLS_ctx.newColorName.trim()) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7 q-mt-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedSubArt);
    (__VLS_ctx.newColorName.trim());
}
var __VLS_160;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160({
    modelValue: (__VLS_ctx.newColorHex),
    label: "Mã màu (HEX)",
    outlined: true,
    dense: true,
    placeholder: "#FFFFFF",
}));
var __VLS_162 = __VLS_161.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.newColorHex),
        label: "Mã màu (HEX)",
        outlined: true,
        dense: true,
        placeholder: "#FFFFFF",
    }], __VLS_functionalComponentArgsRest(__VLS_161), false));
var __VLS_165 = __VLS_163.slots.default;
{
    var __VLS_166 = __VLS_163.slots.prepend;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-swatch" }, { style: ({ backgroundColor: __VLS_ctx.newColorHex || '#ccc' }) }));
    /** @type {__VLS_StyleScopedClasses['color-swatch']} */ ;
    // @ts-ignore
    [hasSubArts, hasSubArts, selectedSubArt, selectedSubArt, selectedSubArt, subArts, newColorName, newColorName, newColorName, newColorHex, newColorHex,];
}
{
    var __VLS_167 = __VLS_163.slots.append;
    var __VLS_168 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_169 = __VLS_asFunctionalComponent1(__VLS_168, new __VLS_168(__assign({ name: "colorize" }, { class: "cursor-pointer" })));
    var __VLS_170 = __VLS_169.apply(void 0, __spreadArray([__assign({ name: "colorize" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_169), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_173 = __VLS_171.slots.default;
    var __VLS_174 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_176 = __VLS_175.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_175), false));
    var __VLS_179 = __VLS_177.slots.default;
    var __VLS_180 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qColor | typeof __VLS_components.QColor} */
    qColor;
    // @ts-ignore
    var __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180({
        modelValue: (__VLS_ctx.newColorHex),
    }));
    var __VLS_182 = __VLS_181.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.newColorHex),
        }], __VLS_functionalComponentArgsRest(__VLS_181), false));
    // @ts-ignore
    [newColorHex,];
    var __VLS_177;
    // @ts-ignore
    [];
    var __VLS_171;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_163;
// @ts-ignore
[];
var __VLS_147;
var __VLS_185;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_186 = __VLS_asFunctionalComponent1(__VLS_185, new __VLS_185({}));
var __VLS_187 = __VLS_186.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_186), false));
var __VLS_190;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_191 = __VLS_asFunctionalComponent1(__VLS_190, new __VLS_190(__assign({ align: "right" }, { class: "q-pa-md" })));
var __VLS_192 = __VLS_191.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_191), false));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_195 = __VLS_193.slots.default;
var __VLS_196;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_197 = __VLS_asFunctionalComponent1(__VLS_196, new __VLS_196({
    flat: true,
    label: "Hủy",
    color: "grey",
}));
var __VLS_198 = __VLS_197.apply(void 0, __spreadArray([{
        flat: true,
        label: "Hủy",
        color: "grey",
    }], __VLS_functionalComponentArgsRest(__VLS_197), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_201;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_202 = __VLS_asFunctionalComponent1(__VLS_201, new __VLS_201(__assign({ 'onClick': {} }, { unelevated: true, label: "Tạo", color: "primary", disable: (!__VLS_ctx.newColorName.trim() || !__VLS_ctx.newColorHex || (__VLS_ctx.hasSubArts && !__VLS_ctx.selectedSubArt)), loading: (__VLS_ctx.creatingColor) })));
var __VLS_203 = __VLS_202.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { unelevated: true, label: "Tạo", color: "primary", disable: (!__VLS_ctx.newColorName.trim() || !__VLS_ctx.newColorHex || (__VLS_ctx.hasSubArts && !__VLS_ctx.selectedSubArt)), loading: (__VLS_ctx.creatingColor) })], __VLS_functionalComponentArgsRest(__VLS_202), false));
var __VLS_206;
var __VLS_207 = ({ click: {} },
    { onClick: (__VLS_ctx.handleCreateColor) });
var __VLS_204;
var __VLS_205;
// @ts-ignore
[hasSubArts, vClosePopup, selectedSubArt, newColorName, newColorHex, creatingColor, handleCreateColor,];
var __VLS_193;
// @ts-ignore
[];
var __VLS_120;
// @ts-ignore
[];
var __VLS_114;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
