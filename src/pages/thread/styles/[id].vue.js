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
var composables_1 = require("@/composables");
var StyleColorSpecsTab_vue_1 = require("@/components/thread/StyleColorSpecsTab.vue");
var api_1 = require("@/services/api");
definePage({
    meta: { requiresAuth: true }
});
var route = (0, vue_router_1.useRoute)('/thread/styles/[id]');
var router = (0, vue_router_1.useRouter)();
var confirm = (0, composables_1.useConfirm)();
var snackbar = (0, composables_1.useSnackbar)();
var id = (0, vue_1.computed)(function () { return Number(route.params.id); });
var activeTab = (0, vue_1.ref)('info');
// Inline edit state
var inlineEditLoading = (0, vue_1.ref)({});
var isAddingRow = (0, vue_1.ref)(false);
// Add row position preference (localStorage)
var STORAGE_KEY = 'datchi_addRowPosition';
var addToTop = (0, vue_1.ref)(false);
var getCellKey = function (id, field) { return "".concat(id, "-").concat(field); };
/**
 * Handle inline field edits via q-popup-edit
 * @param specId - Spec ID
 * @param field - Field name being edited
 * @param newValue - New value from popup edit
 * @param originalValue - Original value for rollback on error
 */
var handleInlineEdit = function (specId, field, newValue, originalValue) { return __awaiter(void 0, void 0, void 0, function () {
    var cellKey, result, spec, _a, spec;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                // Skip if no change
                if (newValue === originalValue)
                    return [2 /*return*/];
                cellKey = getCellKey(specId, field);
                inlineEditLoading.value[cellKey] = true;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 7, 8, 9]);
                return [4 /*yield*/, updateSpec(specId, (_b = {}, _b[field] = newValue, _b))];
            case 2:
                result = _c.sent();
                if (!result) return [3 /*break*/, 5];
                if (!(field === 'supplier_id' && typeof newValue === 'number')) return [3 /*break*/, 4];
                return [4 /*yield*/, fetchTexOptions(newValue)];
            case 3:
                _c.sent();
                _c.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                spec = styleThreadSpecs.value.find(function (s) { return s.id === specId; });
                if (spec) {
                    ;
                    spec[field] = originalValue;
                }
                _c.label = 6;
            case 6: return [3 /*break*/, 9];
            case 7:
                _a = _c.sent();
                spec = styleThreadSpecs.value.find(function (s) { return s.id === specId; });
                if (spec) {
                    ;
                    spec[field] = originalValue;
                }
                return [3 /*break*/, 9];
            case 8:
                inlineEditLoading.value[cellKey] = false;
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}); };
/**
 * Add empty row to table via API
 * Creates a new spec with default values, user edits inline
 * Position (top/bottom) is controlled by addToTop preference
 */
var addEmptyRow = function () { return __awaiter(void 0, void 0, void 0, function () {
    var defaultSupplier, result, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!suppliers.value.length) {
                    snackbar.warning('Chưa có nhà cung cấp. Vui lòng thêm NCC trước.');
                    return [2 /*return*/];
                }
                isAddingRow.value = true;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, 4, 5]);
                defaultSupplier = suppliers.value[0];
                return [4 /*yield*/, createSpec({
                        style_id: id.value,
                        process_name: '',
                        supplier_id: defaultSupplier.id,
                        meters_per_unit: 0,
                        add_to_top: addToTop.value,
                    })];
            case 2:
                result = _b.sent();
                if (result) {
                    snackbar.info('Đã thêm dòng mới. Click vào ô để nhập dữ liệu.');
                }
                return [3 /*break*/, 5];
            case 3:
                _a = _b.sent();
                return [3 /*break*/, 5];
            case 4:
                isAddingRow.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
var supplierOptions = (0, vue_1.computed)(function () {
    return suppliers.value.map(function (s) { return ({ label: s.name, value: s.id }); });
});
var texOptionsCache = (0, vue_1.ref)({});
var texOptionsLoading = (0, vue_1.ref)({});
var fetchTexOptions = function (supplierId) { return __awaiter(void 0, void 0, void 0, function () {
    var response, items, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (texOptionsCache.value[supplierId] || texOptionsLoading.value[supplierId])
                    return [2 /*return*/];
                texOptionsLoading.value[supplierId] = true;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, (0, api_1.fetchApi)("/api/threads/tex-options?supplier_id=".concat(supplierId))];
            case 2:
                response = _b.sent();
                items = response.data || [];
                texOptionsCache.value[supplierId] = items.map(function (t) { return ({
                    label: t.tex_label || String(t.tex_number),
                    value: t.id,
                }); });
                return [3 /*break*/, 5];
            case 3:
                _a = _b.sent();
                texOptionsCache.value[supplierId] = [];
                return [3 /*break*/, 5];
            case 4:
                texOptionsLoading.value[supplierId] = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
var getTexOptionsForRow = function (row) {
    var _a;
    if (!row.supplier_id)
        return [];
    if (!texOptionsCache.value[row.supplier_id]) {
        fetchTexOptions(row.supplier_id);
        return [];
    }
    return (_a = texOptionsCache.value[row.supplier_id]) !== null && _a !== void 0 ? _a : [];
};
var processNameOptions = (0, vue_1.ref)([]);
var fetchProcessNames = function () { return __awaiter(void 0, void 0, void 0, function () {
    var res, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, api_1.fetchApi)('/api/style-thread-specs/process-names')];
            case 1:
                res = _b.sent();
                processNameOptions.value = res.data || [];
                return [3 /*break*/, 3];
            case 2:
                _a = _b.sent();
                processNameOptions.value = [];
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var filteredProcessOptions = (0, vue_1.ref)([]);
var filterProcessOptions = function (val, update) {
    update(function () {
        if (!val) {
            filteredProcessOptions.value = processNameOptions.value;
            return;
        }
        var needle = val.toLowerCase();
        filteredProcessOptions.value = processNameOptions.value.filter(function (n) { return n.toLowerCase().includes(needle); });
    });
};
var filteredTexOptionsMap = (0, vue_1.ref)({});
var getFilteredTexOptions = function (row) {
    var _a;
    if (!row.supplier_id)
        return [];
    return (_a = filteredTexOptionsMap.value[row.supplier_id]) !== null && _a !== void 0 ? _a : getTexOptionsForRow(row);
};
var filterTexOptions = function (val, update, row) {
    update(function () {
        var allOptions = getTexOptionsForRow(row);
        if (!val) {
            filteredTexOptionsMap.value[row.supplier_id] = allOptions;
            return;
        }
        var needle = val.toLowerCase();
        filteredTexOptionsMap.value[row.supplier_id] = allOptions.filter(function (o) { return o.label.toLowerCase().includes(needle); });
    });
};
var isSaving = (0, vue_1.ref)(false);
// Composables
var _e = (0, composables_1.useStyles)(), selectedStyle = _e.selectedStyle, isLoading = _e.isLoading, fetchStyleById = _e.fetchStyleById, updateStyle = _e.updateStyle;
var _f = (0, composables_1.useStyleThreadSpecs)(), styleThreadSpecs = _f.styleThreadSpecs, specsLoading = _f.isLoading, fetchStyleThreadSpecs = _f.fetchStyleThreadSpecs, deleteSpec = _f.deleteSpec, createSpec = _f.createSpec, updateSpec = _f.updateSpec;
var _g = (0, composables_1.useStyleColors)(), styleColors = _g.styleColors, fetchStyleColors = _g.fetchStyleColors;
var _h = (0, composables_1.useSuppliers)(), suppliers = _h.suppliers, fetchSuppliers = _h.fetchSuppliers;
// Form state
var form = (0, vue_1.ref)({
    style_code: '',
    style_name: '',
    fabric_type: null,
    description: '',
});
// Fabric type options
var fabricTypeOptions = [
    { label: 'Cotton', value: 'Cotton' },
    { label: 'Polyester', value: 'Polyester' },
    { label: 'Blend', value: 'Blend' },
    { label: 'Khác', value: 'Other' },
];
// Table columns for specs
var specColumns = [
    {
        name: 'process_name',
        label: 'Công đoạn',
        field: 'process_name',
        align: 'left',
        sortable: true,
    },
    {
        name: 'supplier',
        label: 'NCC',
        field: function (row) { var _a; return (_a = row.suppliers) === null || _a === void 0 ? void 0 : _a.name; },
        align: 'left',
        sortable: true,
    },
    {
        name: 'tex',
        label: 'Tex',
        field: function (row) { var _a; return (_a = row.thread_types) === null || _a === void 0 ? void 0 : _a.tex_number; },
        align: 'left',
        sortable: true,
    },
    {
        name: 'meters',
        label: 'Mét/SP',
        field: 'meters_per_unit',
        align: 'right',
        sortable: true,
    },
    // Notes column hidden - not in Excel spec from user
    {
        name: 'actions',
        label: 'Thao tác',
        field: 'actions',
        align: 'center',
    },
];
// Initialize form when style is loaded
(0, vue_1.watch)(selectedStyle, function (style) {
    if (style) {
        form.value = {
            style_code: style.style_code,
            style_name: style.style_name,
            fabric_type: style.fabric_type,
            description: style.description || '',
        };
    }
}, { immediate: true });
// Load data on mount
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    var savedPosition, supplierIds;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                savedPosition = localStorage.getItem(STORAGE_KEY);
                addToTop.value = savedPosition === 'top';
                if (isNaN(id.value)) {
                    router.push('/thread/styles');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, Promise.all([
                        fetchStyleById(id.value),
                        fetchStyleThreadSpecs({ style_id: id.value }),
                        fetchSuppliers(),
                        fetchStyleColors(id.value),
                        fetchProcessNames(),
                    ])];
            case 1:
                _a.sent();
                supplierIds = __spreadArray([], new Set(styleThreadSpecs.value.map(function (s) { return s.supplier_id; }).filter(Boolean)), true);
                return [4 /*yield*/, Promise.all(supplierIds.map(function (sid) { return fetchTexOptions(sid); }))];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Watch addToTop and persist to localStorage
(0, vue_1.watch)(addToTop, function (value) {
    localStorage.setItem(STORAGE_KEY, value ? 'top' : 'bottom');
});
// Save style info
var handleSave = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!form.value.style_name) {
                    return [2 /*return*/];
                }
                isSaving.value = true;
                return [4 /*yield*/, updateStyle(id.value, {
                        style_name: form.value.style_name,
                        fabric_type: form.value.fabric_type || undefined,
                        description: form.value.description || undefined,
                    })];
            case 1:
                _a.sent();
                isSaving.value = false;
                return [2 /*return*/];
        }
    });
}); };
// Delete spec
var handleDeleteSpec = function (spec) { return __awaiter(void 0, void 0, void 0, function () {
    var confirmed;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, confirm.confirmDelete({
                    itemName: spec.process_name,
                })];
            case 1:
                confirmed = _a.sent();
                if (!confirmed) return [3 /*break*/, 4];
                return [4 /*yield*/, deleteSpec(spec.id)];
            case 2:
                _a.sent();
                return [4 /*yield*/, fetchStyleThreadSpecs({ style_id: id.value })];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); };
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['edit-hint']} */ ;
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
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$router.push('/thread/styles');
            // @ts-ignore
            [$router,];
        } });
var __VLS_10;
var __VLS_11;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-ml-md" }));
/** @type {__VLS_StyleScopedClasses['q-ml-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h5 q-my-none text-weight-bold text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
if (__VLS_ctx.selectedStyle) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    (__VLS_ctx.selectedStyle.style_code);
    (__VLS_ctx.selectedStyle.style_name);
}
var __VLS_14;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_15), false));
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-center q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_19 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
    qSpinner;
    // @ts-ignore
    var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
        size: "lg",
        color: "primary",
    }));
    var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([{
            size: "lg",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_20), false));
}
else if (__VLS_ctx.selectedStyle) {
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        flat: true,
        bordered: true,
    }));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_25), false));
    var __VLS_29 = __VLS_27.slots.default;
    var __VLS_30 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
    qTabs;
    // @ts-ignore
    var __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30(__assign(__assign({ modelValue: (__VLS_ctx.activeTab) }, { class: "text-primary" }), { align: "left", activeColor: "primary", indicatorColor: "primary" })));
    var __VLS_32 = __VLS_31.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.activeTab) }, { class: "text-primary" }), { align: "left", activeColor: "primary", indicatorColor: "primary" })], __VLS_functionalComponentArgsRest(__VLS_31), false));
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    var __VLS_35 = __VLS_33.slots.default;
    var __VLS_36 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        name: "info",
        label: "Thông tin chung",
    }));
    var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([{
            name: "info",
            label: "Thông tin chung",
        }], __VLS_functionalComponentArgsRest(__VLS_37), false));
    var __VLS_41 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
        name: "specs",
        label: "Định mức chỉ",
    }));
    var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([{
            name: "specs",
            label: "Định mức chỉ",
        }], __VLS_functionalComponentArgsRest(__VLS_42), false));
    var __VLS_46 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
        name: "colors",
        label: "Định mức màu",
    }));
    var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([{
            name: "colors",
            label: "Định mức màu",
        }], __VLS_functionalComponentArgsRest(__VLS_47), false));
    // @ts-ignore
    [selectedStyle, selectedStyle, selectedStyle, selectedStyle, isLoading, activeTab,];
    var __VLS_33;
    var __VLS_51 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({}));
    var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_52), false));
    var __VLS_56 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
    qTabPanels;
    // @ts-ignore
    var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        modelValue: (__VLS_ctx.activeTab),
        animated: true,
    }));
    var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.activeTab),
            animated: true,
        }], __VLS_functionalComponentArgsRest(__VLS_57), false));
    var __VLS_61 = __VLS_59.slots.default;
    var __VLS_62 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
    qTabPanel;
    // @ts-ignore
    var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
        name: "info",
    }));
    var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([{
            name: "info",
        }], __VLS_functionalComponentArgsRest(__VLS_63), false));
    var __VLS_67 = __VLS_65.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    var __VLS_68 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
        modelValue: (__VLS_ctx.form.style_code),
        label: "Mã hàng",
        outlined: true,
        dense: true,
        readonly: true,
        disable: true,
        hint: "Mã hàng không thể thay đổi",
    }));
    var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.form.style_code),
            label: "Mã hàng",
            outlined: true,
            dense: true,
            readonly: true,
            disable: true,
            hint: "Mã hàng không thể thay đổi",
        }], __VLS_functionalComponentArgsRest(__VLS_69), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    var __VLS_73 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({
        modelValue: (__VLS_ctx.form.style_name),
        label: "Tên mã hàng",
        outlined: true,
        dense: true,
        rules: ([function (val) { return !!val || 'Vui lòng nhập tên mã hàng'; }]),
    }));
    var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.form.style_name),
            label: "Tên mã hàng",
            outlined: true,
            dense: true,
            rules: ([function (val) { return !!val || 'Vui lòng nhập tên mã hàng'; }]),
        }], __VLS_functionalComponentArgsRest(__VLS_74), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    var __VLS_78 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
    qSelect;
    // @ts-ignore
    var __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
        modelValue: (__VLS_ctx.form.fabric_type),
        options: (__VLS_ctx.fabricTypeOptions),
        label: "Loại vải",
        outlined: true,
        dense: true,
        emitValue: true,
        mapOptions: true,
        clearable: true,
    }));
    var __VLS_80 = __VLS_79.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.form.fabric_type),
            options: (__VLS_ctx.fabricTypeOptions),
            label: "Loại vải",
            outlined: true,
            dense: true,
            emitValue: true,
            mapOptions: true,
            clearable: true,
        }], __VLS_functionalComponentArgsRest(__VLS_79), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    var __VLS_83 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
        modelValue: (__VLS_ctx.form.description),
        label: "Mô tả",
        type: "textarea",
        outlined: true,
        dense: true,
        rows: "3",
    }));
    var __VLS_85 = __VLS_84.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.form.description),
            label: "Mô tả",
            type: "textarea",
            outlined: true,
            dense: true,
            rows: "3",
        }], __VLS_functionalComponentArgsRest(__VLS_84), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    var __VLS_88 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88(__assign({ 'onClick': {} }, { color: "primary", icon: "save", label: "Lưu thay đổi", unelevated: true, loading: (__VLS_ctx.isSaving) })));
    var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "save", label: "Lưu thay đổi", unelevated: true, loading: (__VLS_ctx.isSaving) })], __VLS_functionalComponentArgsRest(__VLS_89), false));
    var __VLS_93 = void 0;
    var __VLS_94 = ({ click: {} },
        { onClick: (__VLS_ctx.handleSave) });
    var __VLS_91;
    var __VLS_92;
    // @ts-ignore
    [activeTab, form, form, form, form, fabricTypeOptions, isSaving, handleSave,];
    var __VLS_65;
    var __VLS_95 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
    qTabPanel;
    // @ts-ignore
    var __VLS_96 = __VLS_asFunctionalComponent1(__VLS_95, new __VLS_95({
        name: "specs",
    }));
    var __VLS_97 = __VLS_96.apply(void 0, __spreadArray([{
            name: "specs",
        }], __VLS_functionalComponentArgsRest(__VLS_96), false));
    var __VLS_100 = __VLS_98.slots.default;
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto row items-center q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    var __VLS_101 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qToggle | typeof __VLS_components.QToggle} */
    qToggle;
    // @ts-ignore
    var __VLS_102 = __VLS_asFunctionalComponent1(__VLS_101, new __VLS_101(__assign({ modelValue: (__VLS_ctx.addToTop), label: "Thêm đầu bảng", dense: true, size: "sm" }, { class: "text-caption" })));
    var __VLS_103 = __VLS_102.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.addToTop), label: "Thêm đầu bảng", dense: true, size: "sm" }, { class: "text-caption" })], __VLS_functionalComponentArgsRest(__VLS_102), false));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    var __VLS_106 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106(__assign({ 'onClick': {} }, { dataTestid: "spec-add-btn", color: "primary", icon: "add", label: "Thêm định mức", unelevated: true, dense: true, loading: (__VLS_ctx.isAddingRow) })));
    var __VLS_108 = __VLS_107.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { dataTestid: "spec-add-btn", color: "primary", icon: "add", label: "Thêm định mức", unelevated: true, dense: true, loading: (__VLS_ctx.isAddingRow) })], __VLS_functionalComponentArgsRest(__VLS_107), false));
    var __VLS_111 = void 0;
    var __VLS_112 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!(__VLS_ctx.selectedStyle))
                    return;
                __VLS_ctx.addEmptyRow();
                // @ts-ignore
                [addToTop, isAddingRow, addEmptyRow,];
            } });
    var __VLS_109;
    var __VLS_110;
    var __VLS_113 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_114 = __VLS_asFunctionalComponent1(__VLS_113, new __VLS_113({
        rows: (__VLS_ctx.styleThreadSpecs),
        columns: (__VLS_ctx.specColumns),
        rowKey: "id",
        flat: true,
        bordered: true,
        loading: (__VLS_ctx.specsLoading),
        pagination: ({ rowsPerPage: 10 }),
    }));
    var __VLS_115 = __VLS_114.apply(void 0, __spreadArray([{
            rows: (__VLS_ctx.styleThreadSpecs),
            columns: (__VLS_ctx.specColumns),
            rowKey: "id",
            flat: true,
            bordered: true,
            loading: (__VLS_ctx.specsLoading),
            pagination: ({ rowsPerPage: 10 }),
        }], __VLS_functionalComponentArgsRest(__VLS_114), false));
    var __VLS_118 = __VLS_116.slots.default;
    {
        var __VLS_119 = __VLS_116.slots["body-cell-process_name"];
        var props_1 = __VLS_vSlot(__VLS_119)[0];
        var __VLS_120 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_121 = __VLS_asFunctionalComponent1(__VLS_120, new __VLS_120(__assign({ props: (props_1), dataTestid: "spec-cell-process" }, { class: "cursor-pointer editable-cell" })));
        var __VLS_122 = __VLS_121.apply(void 0, __spreadArray([__assign({ props: (props_1), dataTestid: "spec-cell-process" }, { class: "cursor-pointer editable-cell" })], __VLS_functionalComponentArgsRest(__VLS_121), false));
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
        var __VLS_125 = __VLS_123.slots.default;
        if (__VLS_ctx.inlineEditLoading[__VLS_ctx.getCellKey(props_1.row.id, 'process_name')]) {
            var __VLS_126 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
            qSpinnerDots;
            // @ts-ignore
            var __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126({
                size: "sm",
                color: "primary",
            }));
            var __VLS_128 = __VLS_127.apply(void 0, __spreadArray([{
                    size: "sm",
                    color: "primary",
                }], __VLS_functionalComponentArgsRest(__VLS_127), false));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cell-value" }));
            /** @type {__VLS_StyleScopedClasses['cell-value']} */ ;
            (props_1.row.process_name || '-');
            var __VLS_131 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131(__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })));
            var __VLS_133 = __VLS_132.apply(void 0, __spreadArray([__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })], __VLS_functionalComponentArgsRest(__VLS_132), false));
            /** @type {__VLS_StyleScopedClasses['edit-hint']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
            var __VLS_136 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
            qPopupEdit;
            // @ts-ignore
            var __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136(__assign({ 'onSave': {} }, { modelValue: (props_1.row.process_name), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
            var __VLS_138 = __VLS_137.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_1.row.process_name), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_137), false));
            var __VLS_141 = void 0;
            var __VLS_142 = ({ save: {} },
                { onSave: (function (val, initialVal) { return __VLS_ctx.handleInlineEdit(props_1.row.id, 'process_name', val, initialVal); }) });
            {
                var __VLS_143 = __VLS_139.slots.default;
                var scope_1 = __VLS_vSlot(__VLS_143)[0];
                var __VLS_144 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
                qSelect;
                // @ts-ignore
                var __VLS_145 = __VLS_asFunctionalComponent1(__VLS_144, new __VLS_144(__assign(__assign(__assign(__assign({ 'onFilter': {} }, { 'onInputValue': {} }), { 'onKeydown': {} }), { modelValue: (scope_1.value), options: (__VLS_ctx.filteredProcessOptions), dense: true, autofocus: true, useInput: true, inputDebounce: "0", fillInput: true, hideSelected: true, newValueMode: "add-unique", label: "Tên công đoạn" }), { style: {} })));
                var __VLS_146 = __VLS_145.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign({ 'onFilter': {} }, { 'onInputValue': {} }), { 'onKeydown': {} }), { modelValue: (scope_1.value), options: (__VLS_ctx.filteredProcessOptions), dense: true, autofocus: true, useInput: true, inputDebounce: "0", fillInput: true, hideSelected: true, newValueMode: "add-unique", label: "Tên công đoạn" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_145), false));
                var __VLS_149 = void 0;
                var __VLS_150 = ({ filter: {} },
                    { onFilter: (__VLS_ctx.filterProcessOptions) });
                var __VLS_151 = ({ inputValue: {} },
                    { onInputValue: (function (val) { scope_1.value = val; }) });
                var __VLS_152 = ({ keydown: {} },
                    { onKeydown: function () { } });
                var __VLS_147;
                var __VLS_148;
                // @ts-ignore
                [styleThreadSpecs, specColumns, specsLoading, inlineEditLoading, getCellKey, handleInlineEdit, filteredProcessOptions, filterProcessOptions,];
                __VLS_139.slots['' /* empty slot name completion */];
            }
            var __VLS_139;
            var __VLS_140;
        }
        // @ts-ignore
        [];
        var __VLS_123;
        // @ts-ignore
        [];
    }
    {
        var __VLS_153 = __VLS_116.slots["body-cell-supplier"];
        var props_2 = __VLS_vSlot(__VLS_153)[0];
        var __VLS_154 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_155 = __VLS_asFunctionalComponent1(__VLS_154, new __VLS_154(__assign({ props: (props_2), dataTestid: "spec-cell-supplier" }, { class: "cursor-pointer editable-cell" })));
        var __VLS_156 = __VLS_155.apply(void 0, __spreadArray([__assign({ props: (props_2), dataTestid: "spec-cell-supplier" }, { class: "cursor-pointer editable-cell" })], __VLS_functionalComponentArgsRest(__VLS_155), false));
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
        var __VLS_159 = __VLS_157.slots.default;
        if (__VLS_ctx.inlineEditLoading[__VLS_ctx.getCellKey(props_2.row.id, 'supplier_id')]) {
            var __VLS_160 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
            qSpinnerDots;
            // @ts-ignore
            var __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160({
                size: "sm",
                color: "primary",
            }));
            var __VLS_162 = __VLS_161.apply(void 0, __spreadArray([{
                    size: "sm",
                    color: "primary",
                }], __VLS_functionalComponentArgsRest(__VLS_161), false));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cell-value" }));
            /** @type {__VLS_StyleScopedClasses['cell-value']} */ ;
            (((_a = props_2.row.suppliers) === null || _a === void 0 ? void 0 : _a.name) || '-');
            var __VLS_165 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165(__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })));
            var __VLS_167 = __VLS_166.apply(void 0, __spreadArray([__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })], __VLS_functionalComponentArgsRest(__VLS_166), false));
            /** @type {__VLS_StyleScopedClasses['edit-hint']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
            var __VLS_170 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
            qPopupEdit;
            // @ts-ignore
            var __VLS_171 = __VLS_asFunctionalComponent1(__VLS_170, new __VLS_170(__assign({ 'onSave': {} }, { modelValue: (props_2.row.supplier_id), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
            var __VLS_172 = __VLS_171.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_2.row.supplier_id), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_171), false));
            var __VLS_175 = void 0;
            var __VLS_176 = ({ save: {} },
                { onSave: (function (val, initialVal) { return __VLS_ctx.handleInlineEdit(props_2.row.id, 'supplier_id', val, initialVal); }) });
            {
                var __VLS_177 = __VLS_173.slots.default;
                var scope = __VLS_vSlot(__VLS_177)[0];
                var __VLS_178 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
                qSelect;
                // @ts-ignore
                var __VLS_179 = __VLS_asFunctionalComponent1(__VLS_178, new __VLS_178(__assign({ modelValue: (scope.value), options: (__VLS_ctx.supplierOptions), optionValue: "value", optionLabel: "label", emitValue: true, mapOptions: true, dense: true, autofocus: true, label: "Nhà cung cấp" }, { style: {} })));
                var __VLS_180 = __VLS_179.apply(void 0, __spreadArray([__assign({ modelValue: (scope.value), options: (__VLS_ctx.supplierOptions), optionValue: "value", optionLabel: "label", emitValue: true, mapOptions: true, dense: true, autofocus: true, label: "Nhà cung cấp" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_179), false));
                // @ts-ignore
                [inlineEditLoading, getCellKey, handleInlineEdit, supplierOptions,];
                __VLS_173.slots['' /* empty slot name completion */];
            }
            var __VLS_173;
            var __VLS_174;
        }
        // @ts-ignore
        [];
        var __VLS_157;
        // @ts-ignore
        [];
    }
    {
        var __VLS_183 = __VLS_116.slots["body-cell-tex"];
        var props_3 = __VLS_vSlot(__VLS_183)[0];
        var __VLS_184 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_185 = __VLS_asFunctionalComponent1(__VLS_184, new __VLS_184(__assign({ props: (props_3), dataTestid: "spec-cell-tex" }, { class: "cursor-pointer editable-cell" })));
        var __VLS_186 = __VLS_185.apply(void 0, __spreadArray([__assign({ props: (props_3), dataTestid: "spec-cell-tex" }, { class: "cursor-pointer editable-cell" })], __VLS_functionalComponentArgsRest(__VLS_185), false));
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
        var __VLS_189 = __VLS_187.slots.default;
        if (__VLS_ctx.inlineEditLoading[__VLS_ctx.getCellKey(props_3.row.id, 'thread_type_id')]) {
            var __VLS_190 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
            qSpinnerDots;
            // @ts-ignore
            var __VLS_191 = __VLS_asFunctionalComponent1(__VLS_190, new __VLS_190({
                size: "sm",
                color: "primary",
            }));
            var __VLS_192 = __VLS_191.apply(void 0, __spreadArray([{
                    size: "sm",
                    color: "primary",
                }], __VLS_functionalComponentArgsRest(__VLS_191), false));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cell-value" }));
            /** @type {__VLS_StyleScopedClasses['cell-value']} */ ;
            (((_b = props_3.row.thread_types) === null || _b === void 0 ? void 0 : _b.tex_label) || ((_c = props_3.row.thread_types) === null || _c === void 0 ? void 0 : _c.tex_number) || '-');
            var __VLS_195 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_196 = __VLS_asFunctionalComponent1(__VLS_195, new __VLS_195(__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })));
            var __VLS_197 = __VLS_196.apply(void 0, __spreadArray([__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })], __VLS_functionalComponentArgsRest(__VLS_196), false));
            /** @type {__VLS_StyleScopedClasses['edit-hint']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
            var __VLS_200 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
            qPopupEdit;
            // @ts-ignore
            var __VLS_201 = __VLS_asFunctionalComponent1(__VLS_200, new __VLS_200(__assign({ 'onSave': {} }, { modelValue: (props_3.row.thread_type_id), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
            var __VLS_202 = __VLS_201.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_3.row.thread_type_id), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_201), false));
            var __VLS_205 = void 0;
            var __VLS_206 = ({ save: {} },
                { onSave: (function (val, initialVal) { return __VLS_ctx.handleInlineEdit(props_3.row.id, 'thread_type_id', val, initialVal); }) });
            {
                var __VLS_207 = __VLS_203.slots.default;
                var scope = __VLS_vSlot(__VLS_207)[0];
                var __VLS_208 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
                qSelect;
                // @ts-ignore
                var __VLS_209 = __VLS_asFunctionalComponent1(__VLS_208, new __VLS_208(__assign(__assign(__assign({ 'onFilter': {} }, { modelValue: (scope.value), options: (__VLS_ctx.getFilteredTexOptions(props_3.row)), optionValue: "value", optionLabel: "label", emitValue: true, mapOptions: true, dense: true, autofocus: true, useInput: true, fillInput: true, hideSelected: true, label: "Tex" }), { style: {} }), { disable: (!props_3.row.supplier_id), hint: (!props_3.row.supplier_id ? 'Chọn NCC trước' : '') })));
                var __VLS_210 = __VLS_209.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onFilter': {} }, { modelValue: (scope.value), options: (__VLS_ctx.getFilteredTexOptions(props_3.row)), optionValue: "value", optionLabel: "label", emitValue: true, mapOptions: true, dense: true, autofocus: true, useInput: true, fillInput: true, hideSelected: true, label: "Tex" }), { style: {} }), { disable: (!props_3.row.supplier_id), hint: (!props_3.row.supplier_id ? 'Chọn NCC trước' : '') })], __VLS_functionalComponentArgsRest(__VLS_209), false));
                var __VLS_213 = void 0;
                var __VLS_214 = ({ filter: {} },
                    { onFilter: (function (val, update) { return __VLS_ctx.filterTexOptions(val, update, props_3.row); }) });
                var __VLS_211;
                var __VLS_212;
                // @ts-ignore
                [inlineEditLoading, getCellKey, handleInlineEdit, getFilteredTexOptions, filterTexOptions,];
                __VLS_203.slots['' /* empty slot name completion */];
            }
            var __VLS_203;
            var __VLS_204;
        }
        // @ts-ignore
        [];
        var __VLS_187;
        // @ts-ignore
        [];
    }
    {
        var __VLS_215 = __VLS_116.slots["body-cell-meters"];
        var props_4 = __VLS_vSlot(__VLS_215)[0];
        var __VLS_216 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_217 = __VLS_asFunctionalComponent1(__VLS_216, new __VLS_216(__assign({ props: (props_4), dataTestid: "spec-cell-meters" }, { class: "cursor-pointer editable-cell text-right" })));
        var __VLS_218 = __VLS_217.apply(void 0, __spreadArray([__assign({ props: (props_4), dataTestid: "spec-cell-meters" }, { class: "cursor-pointer editable-cell text-right" })], __VLS_functionalComponentArgsRest(__VLS_217), false));
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        /** @type {__VLS_StyleScopedClasses['editable-cell']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        var __VLS_221 = __VLS_219.slots.default;
        if (__VLS_ctx.inlineEditLoading[__VLS_ctx.getCellKey(props_4.row.id, 'meters_per_unit')]) {
            var __VLS_222 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
            qSpinnerDots;
            // @ts-ignore
            var __VLS_223 = __VLS_asFunctionalComponent1(__VLS_222, new __VLS_222({
                size: "sm",
                color: "primary",
            }));
            var __VLS_224 = __VLS_223.apply(void 0, __spreadArray([{
                    size: "sm",
                    color: "primary",
                }], __VLS_functionalComponentArgsRest(__VLS_223), false));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cell-value" }));
            /** @type {__VLS_StyleScopedClasses['cell-value']} */ ;
            (((_d = props_4.row.meters_per_unit) === null || _d === void 0 ? void 0 : _d.toFixed(2)) || '-');
            var __VLS_227 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_228 = __VLS_asFunctionalComponent1(__VLS_227, new __VLS_227(__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })));
            var __VLS_229 = __VLS_228.apply(void 0, __spreadArray([__assign({ name: "edit", size: "xs" }, { class: "edit-hint q-ml-xs text-grey-5" })], __VLS_functionalComponentArgsRest(__VLS_228), false));
            /** @type {__VLS_StyleScopedClasses['edit-hint']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
            var __VLS_232 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
            qPopupEdit;
            // @ts-ignore
            var __VLS_233 = __VLS_asFunctionalComponent1(__VLS_232, new __VLS_232(__assign({ 'onSave': {} }, { modelValue: (props_4.row.meters_per_unit), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
            var __VLS_234 = __VLS_233.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_4.row.meters_per_unit), buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_233), false));
            var __VLS_237 = void 0;
            var __VLS_238 = ({ save: {} },
                { onSave: (function (val, initialVal) { return __VLS_ctx.handleInlineEdit(props_4.row.id, 'meters_per_unit', val, initialVal); }) });
            {
                var __VLS_239 = __VLS_235.slots.default;
                var scope = __VLS_vSlot(__VLS_239)[0];
                var __VLS_240 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
                qInput;
                // @ts-ignore
                var __VLS_241 = __VLS_asFunctionalComponent1(__VLS_240, new __VLS_240(__assign({ 'onKeyup': {} }, { modelValue: (scope.value), modelModifiers: { number: true, }, type: "number", dense: true, autofocus: true, label: "Mét/SP", step: "0.01" })));
                var __VLS_242 = __VLS_241.apply(void 0, __spreadArray([__assign({ 'onKeyup': {} }, { modelValue: (scope.value), modelModifiers: { number: true, }, type: "number", dense: true, autofocus: true, label: "Mét/SP", step: "0.01" })], __VLS_functionalComponentArgsRest(__VLS_241), false));
                var __VLS_245 = void 0;
                var __VLS_246 = ({ keyup: {} },
                    { onKeyup: (scope.set) });
                var __VLS_243;
                var __VLS_244;
                // @ts-ignore
                [inlineEditLoading, getCellKey, handleInlineEdit,];
                __VLS_235.slots['' /* empty slot name completion */];
            }
            var __VLS_235;
            var __VLS_236;
        }
        // @ts-ignore
        [];
        var __VLS_219;
        // @ts-ignore
        [];
    }
    {
        var __VLS_247 = __VLS_116.slots["body-cell-actions"];
        var props_5 = __VLS_vSlot(__VLS_247)[0];
        var __VLS_248 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_249 = __VLS_asFunctionalComponent1(__VLS_248, new __VLS_248(__assign({ props: (props_5) }, { class: "q-gutter-xs" })));
        var __VLS_250 = __VLS_249.apply(void 0, __spreadArray([__assign({ props: (props_5) }, { class: "q-gutter-xs" })], __VLS_functionalComponentArgsRest(__VLS_249), false));
        /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
        var __VLS_253 = __VLS_251.slots.default;
        var __VLS_254 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_255 = __VLS_asFunctionalComponent1(__VLS_254, new __VLS_254(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "delete", color: "negative", size: "sm" })));
        var __VLS_256 = __VLS_255.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "delete", color: "negative", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_255), false));
        var __VLS_259 = void 0;
        var __VLS_260 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!(__VLS_ctx.selectedStyle))
                        return;
                    __VLS_ctx.handleDeleteSpec(props_5.row);
                    // @ts-ignore
                    [handleDeleteSpec,];
                } });
        var __VLS_261 = __VLS_257.slots.default;
        var __VLS_262 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_263 = __VLS_asFunctionalComponent1(__VLS_262, new __VLS_262({}));
        var __VLS_264 = __VLS_263.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_263), false));
        var __VLS_267 = __VLS_265.slots.default;
        // @ts-ignore
        [];
        var __VLS_265;
        // @ts-ignore
        [];
        var __VLS_257;
        var __VLS_258;
        // @ts-ignore
        [];
        var __VLS_251;
        // @ts-ignore
        [];
    }
    {
        var __VLS_268 = __VLS_116.slots["no-data"];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "full-width row flex-center text-grey-6 q-py-lg" }));
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-py-lg']} */ ;
        var __VLS_269 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_270 = __VLS_asFunctionalComponent1(__VLS_269, new __VLS_269(__assign({ name: "info", size: "sm" }, { class: "q-mr-sm" })));
        var __VLS_271 = __VLS_270.apply(void 0, __spreadArray([__assign({ name: "info", size: "sm" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_270), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_116;
    // @ts-ignore
    [];
    var __VLS_98;
    var __VLS_274 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
    qTabPanel;
    // @ts-ignore
    var __VLS_275 = __VLS_asFunctionalComponent1(__VLS_274, new __VLS_274({
        name: "colors",
    }));
    var __VLS_276 = __VLS_275.apply(void 0, __spreadArray([{
            name: "colors",
        }], __VLS_functionalComponentArgsRest(__VLS_275), false));
    var __VLS_279 = __VLS_277.slots.default;
    var __VLS_280 = StyleColorSpecsTab_vue_1.default;
    // @ts-ignore
    var __VLS_281 = __VLS_asFunctionalComponent1(__VLS_280, new __VLS_280(__assign(__assign({ 'onGoToSpecs': {} }, { 'onColorCreated': {} }), { styleId: (__VLS_ctx.id), specs: (__VLS_ctx.styleThreadSpecs), styleColors: (__VLS_ctx.styleColors) })));
    var __VLS_282 = __VLS_281.apply(void 0, __spreadArray([__assign(__assign({ 'onGoToSpecs': {} }, { 'onColorCreated': {} }), { styleId: (__VLS_ctx.id), specs: (__VLS_ctx.styleThreadSpecs), styleColors: (__VLS_ctx.styleColors) })], __VLS_functionalComponentArgsRest(__VLS_281), false));
    var __VLS_285 = void 0;
    var __VLS_286 = ({ goToSpecs: {} },
        { onGoToSpecs: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!(__VLS_ctx.selectedStyle))
                    return;
                __VLS_ctx.activeTab = 'specs';
                // @ts-ignore
                [activeTab, styleThreadSpecs, id, styleColors,];
            } });
    var __VLS_287 = ({ colorCreated: {} },
        { onColorCreated: (function () { return __VLS_ctx.fetchStyleColors(__VLS_ctx.id); }) });
    var __VLS_283;
    var __VLS_284;
    // @ts-ignore
    [id, fetchStyleColors,];
    var __VLS_277;
    // @ts-ignore
    [];
    var __VLS_59;
    // @ts-ignore
    [];
    var __VLS_27;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_288 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_289 = __VLS_asFunctionalComponent1(__VLS_288, new __VLS_288({
        name: "error",
        size: "xl",
        color: "negative",
    }));
    var __VLS_290 = __VLS_289.apply(void 0, __spreadArray([{
            name: "error",
            size: "xl",
            color: "negative",
        }], __VLS_functionalComponentArgsRest(__VLS_289), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-h6 text-grey-7 q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    var __VLS_293 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_294 = __VLS_asFunctionalComponent1(__VLS_293, new __VLS_293(__assign({ 'onClick': {} }, { color: "primary", label: "Quay lại danh sách", unelevated: true })));
    var __VLS_295 = __VLS_294.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Quay lại danh sách", unelevated: true })], __VLS_functionalComponentArgsRest(__VLS_294), false));
    var __VLS_298 = void 0;
    var __VLS_299 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!!(__VLS_ctx.selectedStyle))
                    return;
                __VLS_ctx.$router.push('/thread/styles');
                // @ts-ignore
                [$router,];
            } });
    var __VLS_296;
    var __VLS_297;
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
