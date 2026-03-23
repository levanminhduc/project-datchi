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
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var composables_1 = require("@/composables");
var enums_1 = require("@/types/thread/enums");
var ColorSelector_vue_1 = require("@/components/ui/inputs/ColorSelector.vue");
var SupplierSelector_vue_1 = require("@/components/ui/inputs/SupplierSelector.vue");
var ThreadTypeSuppliersDialog_vue_1 = require("@/components/thread/ThreadTypeSuppliersDialog.vue");
// Composables
var snackbar = (0, composables_1.useSnackbar)();
var _j = (0, composables_1.useThreadTypes)(), threadTypes = _j.threadTypes, loading = _j.loading, fetchThreadTypes = _j.fetchThreadTypes, createThreadType = _j.createThreadType, updateThreadType = _j.updateThreadType, deleteThreadType = _j.deleteThreadType;
// Local State
var searchQuery = (0, vue_1.ref)('');
var filterColorId = (0, vue_1.ref)(null);
var filterSupplierId = (0, vue_1.ref)(null);
var pagination = (0, vue_1.ref)({
    page: 1,
    rowsPerPage: 25,
    sortBy: 'code',
    descending: false,
});
// Options
var materialOptions = [
    { label: 'Polyester', value: enums_1.ThreadMaterial.POLYESTER },
    { label: 'Cotton', value: enums_1.ThreadMaterial.COTTON },
    { label: 'Nylon', value: enums_1.ThreadMaterial.NYLON },
    { label: 'Silk/Lụa', value: enums_1.ThreadMaterial.SILK },
    { label: 'Rayon', value: enums_1.ThreadMaterial.RAYON },
    { label: 'Hỗn hợp', value: enums_1.ThreadMaterial.MIXED },
];
var getMaterialLabel = function (value) {
    var _a;
    return ((_a = materialOptions.find(function (opt) { return opt.value === value; })) === null || _a === void 0 ? void 0 : _a.label) || value;
};
/**
 * Get initials from supplier name for avatar display
 */
var getSupplierInitials = function (name) {
    if (!name)
        return '?';
    var words = name.trim().split(/\s+/);
    if (words.length >= 2 && words[0] && words[1]) {
        return ((words[0][0] || '') + (words[1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};
// Table Configuration
var columns = [
    {
        name: 'code',
        label: 'Mã Loại',
        field: 'code',
        align: 'left',
        sortable: true,
        required: true,
    },
    {
        name: 'name',
        label: 'Tên Loại Chỉ',
        field: 'name',
        align: 'left',
        sortable: true,
        required: true,
    },
    {
        name: 'color',
        label: 'Màu Sắc',
        field: function (row) { var _a; return (_a = row.color_data) === null || _a === void 0 ? void 0 : _a.name; },
        align: 'left',
        sortable: true,
    },
    {
        name: 'supplier',
        label: 'Nhà Cung Cấp',
        field: function (row) { var _a; return (_a = row.supplier_data) === null || _a === void 0 ? void 0 : _a.name; },
        align: 'left',
        sortable: true,
    },
    {
        name: 'reorder_level',
        label: 'Mức tái đặt',
        field: function (row) {
            if (!row.meters_per_cone || row.meters_per_cone === 0)
                return null;
            return Math.ceil(row.reorder_level_meters / row.meters_per_cone);
        },
        align: 'right',
        sortable: true,
        format: function (val) { return val !== null ? "".concat(val, " cu\u1ED9n") : '-'; },
    },
    {
        name: 'is_active',
        label: 'Trạng Thái',
        field: 'is_active',
        align: 'center',
        sortable: true,
    },
    {
        name: 'actions',
        label: 'Thao Tác',
        field: 'actions',
        align: 'center',
    },
];
// Computed Data
var filteredThreadTypes = (0, vue_1.computed)(function () {
    var result = threadTypes.value;
    // Apply color_id filter
    if (filterColorId.value !== null) {
        result = result.filter(function (type) { return type.color_id === filterColorId.value; });
    }
    // Apply supplier_id filter
    if (filterSupplierId.value !== null) {
        result = result.filter(function (type) { return type.supplier_id === filterSupplierId.value; });
    }
    // Apply text search filter
    if (searchQuery.value.trim()) {
        var query_1 = searchQuery.value.toLowerCase().trim();
        result = result.filter(function (type) {
            var _a, _b;
            return type.code.toLowerCase().includes(query_1) ||
                type.name.toLowerCase().includes(query_1) ||
                ((_a = type.color_data) === null || _a === void 0 ? void 0 : _a.name.toLowerCase().includes(query_1)) ||
                ((_b = type.supplier_data) === null || _b === void 0 ? void 0 : _b.name.toLowerCase().includes(query_1));
        });
    }
    return result;
});
// Watchers - reset pagination when filters change
(0, vue_1.watch)([searchQuery, filterColorId, filterSupplierId], function () {
    pagination.value.page = 1;
});
// Dialog States
var formDialog = (0, vue_1.reactive)({
    isOpen: false,
    mode: 'create',
    id: null,
});
var deleteDialog = (0, vue_1.reactive)({
    isOpen: false,
    threadType: null,
});
var detailDialog = (0, vue_1.reactive)({
    isOpen: false,
    threadType: null,
});
// Suppliers Dialog State
var suppliersDialog = (0, vue_1.reactive)({
    isOpen: false,
    threadType: null,
});
// Form Data
var formData = (0, vue_1.reactive)({
    code: '',
    name: '',
    color_id: null,
    supplier_id: null,
    material: enums_1.ThreadMaterial.POLYESTER,
    tex_number: undefined,
    density_grams_per_meter: 0,
    meters_per_cone: undefined,
    reorder_level_meters: 1000,
    lead_time_days: 7,
    is_active: true,
});
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetchThreadTypes()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// Methods
var openAddDialog = function () {
    formDialog.mode = 'create';
    formDialog.id = null;
    resetFormData();
    formDialog.isOpen = true;
};
var openEditDialog = function (type) {
    formDialog.mode = 'edit';
    formDialog.id = type.id;
    Object.assign(formData, {
        code: type.code,
        name: type.name,
        color_id: type.color_id,
        supplier_id: type.supplier_id,
        material: type.material,
        tex_number: type.tex_number,
        density_grams_per_meter: type.density_grams_per_meter,
        meters_per_cone: type.meters_per_cone,
        reorder_level_meters: type.reorder_level_meters,
        lead_time_days: type.lead_time_days,
        is_active: type.is_active,
    });
    formDialog.isOpen = true;
};
var resetFormData = function () {
    Object.assign(formData, {
        code: '',
        name: '',
        color_id: null,
        supplier_id: null,
        material: enums_1.ThreadMaterial.POLYESTER,
        tex_number: undefined,
        density_grams_per_meter: 0,
        meters_per_cone: undefined,
        reorder_level_meters: 1000,
        lead_time_days: 7,
        is_active: true,
    });
};
var closeFormDialog = function () {
    formDialog.isOpen = false;
    resetFormData();
};
var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!formData.code.trim() || !formData.name.trim() || formData.density_grams_per_meter <= 0) {
                    snackbar.warning('Vui lòng điền đầy đủ thông tin bắt buộc và mật độ hợp lệ');
                    return [2 /*return*/];
                }
                result = null;
                if (!(formDialog.mode === 'create')) return [3 /*break*/, 2];
                return [4 /*yield*/, createThreadType(__assign({}, formData))];
            case 1:
                result = _a.sent();
                return [3 /*break*/, 4];
            case 2:
                if (!formDialog.id) return [3 /*break*/, 4];
                return [4 /*yield*/, updateThreadType(formDialog.id, __assign({}, formData))];
            case 3:
                result = _a.sent();
                _a.label = 4;
            case 4:
                if (result) {
                    closeFormDialog();
                }
                return [2 /*return*/];
        }
    });
}); };
var handleInlineUpdate = function (row, field, val, initialVal) { return __awaiter(void 0, void 0, void 0, function () {
    var updatedData, payload, success;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (val === initialVal)
                    return [2 /*return*/];
                updatedData = __assign(__assign({}, row), (_a = {}, _a[field] = val, _a));
                payload = {
                    code: updatedData.code,
                    name: updatedData.name,
                    color_id: updatedData.color_id,
                    supplier_id: updatedData.supplier_id,
                    material: updatedData.material,
                    tex_number: updatedData.tex_number || undefined,
                    density_grams_per_meter: updatedData.density_grams_per_meter,
                    meters_per_cone: updatedData.meters_per_cone || undefined,
                    reorder_level_meters: updatedData.reorder_level_meters,
                    lead_time_days: updatedData.lead_time_days,
                    is_active: updatedData.is_active,
                };
                return [4 /*yield*/, updateThreadType(row.id, payload)];
            case 1:
                success = _b.sent();
                if (!success) {
                    // Revert value on failure
                    row[field] = initialVal;
                }
                return [2 /*return*/];
        }
    });
}); };
var confirmDelete = function (type) {
    deleteDialog.threadType = type;
    deleteDialog.isOpen = true;
};
var handleDelete = function () { return __awaiter(void 0, void 0, void 0, function () {
    var success;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!deleteDialog.threadType) return [3 /*break*/, 2];
                return [4 /*yield*/, deleteThreadType(deleteDialog.threadType.id)];
            case 1:
                success = _a.sent();
                if (success) {
                    deleteDialog.isOpen = false;
                    deleteDialog.threadType = null;
                }
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
var openDetailDialog = function (type) {
    detailDialog.threadType = type;
    detailDialog.isOpen = true;
};
var editFromDetail = function () {
    if (detailDialog.threadType) {
        var type = __assign({}, detailDialog.threadType);
        detailDialog.isOpen = false;
        openEditDialog(type);
    }
};
// Suppliers Dialog Methods
var openSuppliersDialog = function (type) {
    suppliersDialog.threadType = type;
    suppliersDialog.isOpen = true;
};
var handleSuppliersUpdated = function () {
    // Refresh thread types to get updated supplier data
    fetchThreadTypes();
};
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h5 q-my-none text-weight-bold text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-9" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-9']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm justify-end items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_7 = ColorSelector_vue_1.default;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    modelValue: (__VLS_ctx.filterColorId),
    label: "Lọc theo màu",
    dense: true,
    clearable: true,
    hideBottomSpace: true,
    activeOnly: (true),
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filterColorId),
        label: "Lọc theo màu",
        dense: true,
        clearable: true,
        hideBottomSpace: true,
        activeOnly: (true),
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_12 = SupplierSelector_vue_1.default;
// @ts-ignore
var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
    modelValue: (__VLS_ctx.filterSupplierId),
    label: "Lọc theo NCC",
    dense: true,
    clearable: true,
    hideBottomSpace: true,
    activeOnly: (true),
}));
var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filterSupplierId),
        label: "Lọc theo NCC",
        dense: true,
        clearable: true,
        hideBottomSpace: true,
        activeOnly: (true),
    }], __VLS_functionalComponentArgsRest(__VLS_13), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_17;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
    modelValue: (__VLS_ctx.searchQuery),
    placeholder: "Tìm kiếm...",
    outlined: true,
    dense: true,
    clearable: true,
    hideBottomSpace: true,
}));
var __VLS_19 = __VLS_18.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.searchQuery),
        placeholder: "Tìm kiếm...",
        outlined: true,
        dense: true,
        clearable: true,
        hideBottomSpace: true,
    }], __VLS_functionalComponentArgsRest(__VLS_18), false));
var __VLS_22 = __VLS_20.slots.default;
{
    var __VLS_23 = __VLS_20.slots.prepend;
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        name: "search",
    }));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{
            name: "search",
        }], __VLS_functionalComponentArgsRest(__VLS_25), false));
    // @ts-ignore
    [filterColorId, filterSupplierId, searchQuery,];
}
// @ts-ignore
[];
var __VLS_20;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
var __VLS_29;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm Loại Chỉ", unelevated: true }), { class: "full-width-xs" })));
var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm Loại Chỉ", unelevated: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_30), false));
var __VLS_34;
var __VLS_35 = ({ click: {} },
    { onClick: (__VLS_ctx.openAddDialog) });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_32;
var __VLS_33;
var __VLS_36;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36(__assign({ pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.filteredThreadTypes), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.loading), rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "thread-type-table shadow-1" })));
var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([__assign({ pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.filteredThreadTypes), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.loading), rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "thread-type-table shadow-1" })], __VLS_functionalComponentArgsRest(__VLS_37), false));
/** @type {__VLS_StyleScopedClasses['thread-type-table']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
var __VLS_41 = __VLS_39.slots.default;
{
    var __VLS_42 = __VLS_39.slots.loading;
    var __VLS_43 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
    qInnerLoading;
    // @ts-ignore
    var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
        showing: true,
    }));
    var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{
            showing: true,
        }], __VLS_functionalComponentArgsRest(__VLS_44), false));
    var __VLS_48 = __VLS_46.slots.default;
    var __VLS_49 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
        size: "50px",
        color: "primary",
    }));
    var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([{
            size: "50px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_50), false));
    // @ts-ignore
    [openAddDialog, pagination, filteredThreadTypes, columns, loading,];
    var __VLS_46;
    // @ts-ignore
    [];
}
{
    var __VLS_54 = __VLS_39.slots["body-cell-color"];
    var props = __VLS_vSlot(__VLS_54)[0];
    var __VLS_55 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
        props: (props),
    }));
    var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_56), false));
    var __VLS_60 = __VLS_58.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-sm']} */ ;
    if ((_a = props.row.color_data) === null || _a === void 0 ? void 0 : _a.hex_code) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-indicator shadow-1" }, { style: ({ backgroundColor: props.row.color_data.hex_code }) }));
        /** @type {__VLS_StyleScopedClasses['color-indicator']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (((_b = props.row.color_data) === null || _b === void 0 ? void 0 : _b.name) || '---');
    // @ts-ignore
    [];
    var __VLS_58;
    // @ts-ignore
    [];
}
{
    var __VLS_61 = __VLS_39.slots["body-cell-supplier"];
    var props = __VLS_vSlot(__VLS_61)[0];
    var __VLS_62 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
        props: (props),
    }));
    var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_63), false));
    var __VLS_67 = __VLS_65.slots.default;
    if (props.row.suppliers && props.row.suppliers.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
        var __VLS_68 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68(__assign({ color: "teal", outline: true }, { class: "cursor-pointer" })));
        var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([__assign({ color: "teal", outline: true }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_69), false));
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        var __VLS_73 = __VLS_71.slots.default;
        (props.row.suppliers.length);
        var __VLS_74 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74(__assign({ class: "text-body2" })));
        var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([__assign({ class: "text-body2" })], __VLS_functionalComponentArgsRest(__VLS_75), false));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        var __VLS_79 = __VLS_77.slots.default;
        for (var _i = 0, _k = __VLS_vFor((props.row.suppliers)); _i < _k.length; _i++) {
            var link = _k[_i][0];
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (link.id) }, { class: "q-py-xs" }));
            /** @type {__VLS_StyleScopedClasses['q-py-xs']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
            ((_c = link.supplier) === null || _c === void 0 ? void 0 : _c.name);
            if (link.supplier_item_code) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-4" }));
                /** @type {__VLS_StyleScopedClasses['text-grey-4']} */ ;
                (link.supplier_item_code);
            }
            if (link.unit_price) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-4" }));
                /** @type {__VLS_StyleScopedClasses['text-grey-4']} */ ;
                (link.unit_price.toLocaleString());
            }
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_77;
        // @ts-ignore
        [];
        var __VLS_71;
    }
    else if (props.row.supplier_data) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
        var __VLS_80 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80(__assign({ size: "20px", color: "primary", textColor: "white" }, { class: "q-mr-xs text-caption text-weight-bold" })));
        var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([__assign({ size: "20px", color: "primary", textColor: "white" }, { class: "q-mr-xs text-caption text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_81), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        var __VLS_85 = __VLS_83.slots.default;
        (__VLS_ctx.getSupplierInitials(props.row.supplier_data.name));
        // @ts-ignore
        [getSupplierInitials,];
        var __VLS_83;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (props.row.supplier_data.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-6 q-ml-xs" }));
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
        (props.row.supplier_data.code);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
        /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
    }
    // @ts-ignore
    [];
    var __VLS_65;
    // @ts-ignore
    [];
}
{
    var __VLS_86 = __VLS_39.slots["body-cell-name"];
    var props_1 = __VLS_vSlot(__VLS_86)[0];
    var __VLS_87 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_88 = __VLS_asFunctionalComponent1(__VLS_87, new __VLS_87({
        props: (props_1),
    }));
    var __VLS_89 = __VLS_88.apply(void 0, __spreadArray([{
            props: (props_1),
        }], __VLS_functionalComponentArgsRest(__VLS_88), false));
    var __VLS_92 = __VLS_90.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-mr-xs" }));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    (props_1.row.name);
    var __VLS_93 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93(__assign({ flat: true, round: true, dense: true, color: "grey-6", icon: "edit", size: "xs" }, { class: "opacity-50" })));
    var __VLS_95 = __VLS_94.apply(void 0, __spreadArray([__assign({ flat: true, round: true, dense: true, color: "grey-6", icon: "edit", size: "xs" }, { class: "opacity-50" })], __VLS_functionalComponentArgsRest(__VLS_94), false));
    /** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
    var __VLS_98 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
    qPopupEdit;
    // @ts-ignore
    var __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98(__assign({ 'onSave': {} }, { modelValue: (props_1.row.name), autoSave: true, buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
    var __VLS_100 = __VLS_99.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_1.row.name), autoSave: true, buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_99), false));
    var __VLS_103 = void 0;
    var __VLS_104 = ({ save: {} },
        { onSave: (function (val, initialVal) { return __VLS_ctx.handleInlineUpdate(props_1.row, 'name', val, initialVal); }) });
    var __VLS_105 = __VLS_101.slots.default;
    var __VLS_106 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
        modelValue: (props_1.row.name),
        dense: true,
        autofocus: true,
        counter: true,
        label: "Tên loại chỉ",
    }));
    var __VLS_108 = __VLS_107.apply(void 0, __spreadArray([{
            modelValue: (props_1.row.name),
            dense: true,
            autofocus: true,
            counter: true,
            label: "Tên loại chỉ",
        }], __VLS_functionalComponentArgsRest(__VLS_107), false));
    // @ts-ignore
    [handleInlineUpdate,];
    var __VLS_101;
    var __VLS_102;
    // @ts-ignore
    [];
    var __VLS_90;
    // @ts-ignore
    [];
}
{
    var __VLS_111 = __VLS_39.slots["body-cell-material"];
    var props_2 = __VLS_vSlot(__VLS_111)[0];
    var __VLS_112 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
        props: (props_2),
    }));
    var __VLS_114 = __VLS_113.apply(void 0, __spreadArray([{
            props: (props_2),
        }], __VLS_functionalComponentArgsRest(__VLS_113), false));
    var __VLS_117 = __VLS_115.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap cursor-pointer" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_118 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118(__assign({ outline: true, color: "secondary" }, { class: "text-capitalize" })));
    var __VLS_120 = __VLS_119.apply(void 0, __spreadArray([__assign({ outline: true, color: "secondary" }, { class: "text-capitalize" })], __VLS_functionalComponentArgsRest(__VLS_119), false));
    /** @type {__VLS_StyleScopedClasses['text-capitalize']} */ ;
    var __VLS_123 = __VLS_121.slots.default;
    (__VLS_ctx.getMaterialLabel(props_2.row.material));
    // @ts-ignore
    [getMaterialLabel,];
    var __VLS_121;
    var __VLS_124 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
    qPopupEdit;
    // @ts-ignore
    var __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124(__assign({ 'onSave': {} }, { modelValue: (props_2.row.material), autoSave: true, buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
    var __VLS_126 = __VLS_125.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_2.row.material), autoSave: true, buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_125), false));
    var __VLS_129 = void 0;
    var __VLS_130 = ({ save: {} },
        { onSave: (function (val, initialVal) { return __VLS_ctx.handleInlineUpdate(props_2.row, 'material', val, initialVal); }) });
    var __VLS_131 = __VLS_127.slots.default;
    var __VLS_132 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
    qSelect;
    // @ts-ignore
    var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132({
        modelValue: (props_2.row.material),
        options: (__VLS_ctx.materialOptions),
        optionValue: "value",
        optionLabel: "label",
        emitValue: true,
        mapOptions: true,
        dense: true,
        autofocus: true,
        label: "Chất liệu",
        popupContentClass: "z-max",
    }));
    var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([{
            modelValue: (props_2.row.material),
            options: (__VLS_ctx.materialOptions),
            optionValue: "value",
            optionLabel: "label",
            emitValue: true,
            mapOptions: true,
            dense: true,
            autofocus: true,
            label: "Chất liệu",
            popupContentClass: "z-max",
        }], __VLS_functionalComponentArgsRest(__VLS_133), false));
    // @ts-ignore
    [handleInlineUpdate, materialOptions,];
    var __VLS_127;
    var __VLS_128;
    // @ts-ignore
    [];
    var __VLS_115;
    // @ts-ignore
    [];
}
{
    var __VLS_137 = __VLS_39.slots["body-cell-density_grams_per_meter"];
    var props_3 = __VLS_vSlot(__VLS_137)[0];
    var __VLS_138 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138({
        props: (props_3),
    }));
    var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([{
            props: (props_3),
        }], __VLS_functionalComponentArgsRest(__VLS_139), false));
    var __VLS_143 = __VLS_141.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-end no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "font-mono" }));
    /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
    (props_3.value);
    var __VLS_144 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_145 = __VLS_asFunctionalComponent1(__VLS_144, new __VLS_144(__assign({ flat: true, round: true, dense: true, color: "grey-6", icon: "edit", size: "xs" }, { class: "q-ml-xs opacity-50" })));
    var __VLS_146 = __VLS_145.apply(void 0, __spreadArray([__assign({ flat: true, round: true, dense: true, color: "grey-6", icon: "edit", size: "xs" }, { class: "q-ml-xs opacity-50" })], __VLS_functionalComponentArgsRest(__VLS_145), false));
    /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
    var __VLS_149 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
    qPopupEdit;
    // @ts-ignore
    var __VLS_150 = __VLS_asFunctionalComponent1(__VLS_149, new __VLS_149(__assign({ 'onSave': {} }, { modelValue: (props_3.row.density_grams_per_meter), modelModifiers: { number: true, }, autoSave: true, buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
    var __VLS_151 = __VLS_150.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_3.row.density_grams_per_meter), modelModifiers: { number: true, }, autoSave: true, buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_150), false));
    var __VLS_154 = void 0;
    var __VLS_155 = ({ save: {} },
        { onSave: (function (val, initialVal) { return __VLS_ctx.handleInlineUpdate(props_3.row, 'density_grams_per_meter', val, initialVal); }) });
    var __VLS_156 = __VLS_152.slots.default;
    var __VLS_157 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_158 = __VLS_asFunctionalComponent1(__VLS_157, new __VLS_157({
        modelValue: (props_3.row.density_grams_per_meter),
        modelModifiers: { number: true, },
        type: "number",
        step: "0.0001",
        dense: true,
        autofocus: true,
        label: "Mật độ (g/m)",
    }));
    var __VLS_159 = __VLS_158.apply(void 0, __spreadArray([{
            modelValue: (props_3.row.density_grams_per_meter),
            modelModifiers: { number: true, },
            type: "number",
            step: "0.0001",
            dense: true,
            autofocus: true,
            label: "Mật độ (g/m)",
        }], __VLS_functionalComponentArgsRest(__VLS_158), false));
    // @ts-ignore
    [handleInlineUpdate,];
    var __VLS_152;
    var __VLS_153;
    // @ts-ignore
    [];
    var __VLS_141;
    // @ts-ignore
    [];
}
{
    var __VLS_162 = __VLS_39.slots["body-cell-is_active"];
    var props = __VLS_vSlot(__VLS_162)[0];
    var __VLS_163 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_164 = __VLS_asFunctionalComponent1(__VLS_163, new __VLS_163({
        props: (props),
        align: "center",
    }));
    var __VLS_165 = __VLS_164.apply(void 0, __spreadArray([{
            props: (props),
            align: "center",
        }], __VLS_functionalComponentArgsRest(__VLS_164), false));
    var __VLS_168 = __VLS_166.slots.default;
    var __VLS_169 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169({
        color: (props.row.is_active ? 'positive' : 'negative'),
    }));
    var __VLS_171 = __VLS_170.apply(void 0, __spreadArray([{
            color: (props.row.is_active ? 'positive' : 'negative'),
        }], __VLS_functionalComponentArgsRest(__VLS_170), false));
    var __VLS_174 = __VLS_172.slots.default;
    (props.row.is_active ? 'Hoạt động' : 'Ngừng');
    // @ts-ignore
    [];
    var __VLS_172;
    // @ts-ignore
    [];
    var __VLS_166;
    // @ts-ignore
    [];
}
{
    var __VLS_175 = __VLS_39.slots["body-cell-actions"];
    var props_4 = __VLS_vSlot(__VLS_175)[0];
    var __VLS_176 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_177 = __VLS_asFunctionalComponent1(__VLS_176, new __VLS_176(__assign({ props: (props_4) }, { class: "q-gutter-x-sm" })));
    var __VLS_178 = __VLS_177.apply(void 0, __spreadArray([__assign({ props: (props_4) }, { class: "q-gutter-x-sm" })], __VLS_functionalComponentArgsRest(__VLS_177), false));
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-sm']} */ ;
    var __VLS_181 = __VLS_179.slots.default;
    var __VLS_182 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_183 = __VLS_asFunctionalComponent1(__VLS_182, new __VLS_182(__assign({ 'onClick': {} }, { flat: true, round: true, color: "teal", icon: "business", size: "sm" })));
    var __VLS_184 = __VLS_183.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "teal", icon: "business", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_183), false));
    var __VLS_187 = void 0;
    var __VLS_188 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openSuppliersDialog(props_4.row);
                // @ts-ignore
                [openSuppliersDialog,];
            } });
    var __VLS_189 = __VLS_185.slots.default;
    var __VLS_190 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_191 = __VLS_asFunctionalComponent1(__VLS_190, new __VLS_190({}));
    var __VLS_192 = __VLS_191.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_191), false));
    var __VLS_195 = __VLS_193.slots.default;
    // @ts-ignore
    [];
    var __VLS_193;
    // @ts-ignore
    [];
    var __VLS_185;
    var __VLS_186;
    var __VLS_196 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_197 = __VLS_asFunctionalComponent1(__VLS_196, new __VLS_196(__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "visibility", size: "sm" })));
    var __VLS_198 = __VLS_197.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "visibility", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_197), false));
    var __VLS_201 = void 0;
    var __VLS_202 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openDetailDialog(props_4.row);
                // @ts-ignore
                [openDetailDialog,];
            } });
    var __VLS_203 = __VLS_199.slots.default;
    var __VLS_204 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_205 = __VLS_asFunctionalComponent1(__VLS_204, new __VLS_204({}));
    var __VLS_206 = __VLS_205.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_205), false));
    var __VLS_209 = __VLS_207.slots.default;
    // @ts-ignore
    [];
    var __VLS_207;
    // @ts-ignore
    [];
    var __VLS_199;
    var __VLS_200;
    var __VLS_210 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_211 = __VLS_asFunctionalComponent1(__VLS_210, new __VLS_210(__assign({ 'onClick': {} }, { flat: true, round: true, color: "blue", icon: "edit", size: "sm" })));
    var __VLS_212 = __VLS_211.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "blue", icon: "edit", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_211), false));
    var __VLS_215 = void 0;
    var __VLS_216 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openEditDialog(props_4.row);
                // @ts-ignore
                [openEditDialog,];
            } });
    var __VLS_217 = __VLS_213.slots.default;
    var __VLS_218 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_219 = __VLS_asFunctionalComponent1(__VLS_218, new __VLS_218({}));
    var __VLS_220 = __VLS_219.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_219), false));
    var __VLS_223 = __VLS_221.slots.default;
    // @ts-ignore
    [];
    var __VLS_221;
    // @ts-ignore
    [];
    var __VLS_213;
    var __VLS_214;
    var __VLS_224 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_225 = __VLS_asFunctionalComponent1(__VLS_224, new __VLS_224(__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "delete", size: "sm" })));
    var __VLS_226 = __VLS_225.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "delete", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_225), false));
    var __VLS_229 = void 0;
    var __VLS_230 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.confirmDelete(props_4.row);
                // @ts-ignore
                [confirmDelete,];
            } });
    var __VLS_231 = __VLS_227.slots.default;
    var __VLS_232 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_233 = __VLS_asFunctionalComponent1(__VLS_232, new __VLS_232({}));
    var __VLS_234 = __VLS_233.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_233), false));
    var __VLS_237 = __VLS_235.slots.default;
    // @ts-ignore
    [];
    var __VLS_235;
    // @ts-ignore
    [];
    var __VLS_227;
    var __VLS_228;
    // @ts-ignore
    [];
    var __VLS_179;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_39;
var __VLS_238;
/** @ts-ignore @type {typeof __VLS_components.FormDialog | typeof __VLS_components.FormDialog} */
FormDialog;
// @ts-ignore
var __VLS_239 = __VLS_asFunctionalComponent1(__VLS_238, new __VLS_238(__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.formDialog.isOpen), title: (__VLS_ctx.formDialog.mode === 'create' ? 'Thêm Loại Chỉ Mới' : 'Chỉnh Sửa Loại Chỉ'), loading: (__VLS_ctx.loading), maxWidth: "600px" })));
var __VLS_240 = __VLS_239.apply(void 0, __spreadArray([__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.formDialog.isOpen), title: (__VLS_ctx.formDialog.mode === 'create' ? 'Thêm Loại Chỉ Mới' : 'Chỉnh Sửa Loại Chỉ'), loading: (__VLS_ctx.loading), maxWidth: "600px" })], __VLS_functionalComponentArgsRest(__VLS_239), false));
var __VLS_243;
var __VLS_244 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleSubmit) });
var __VLS_245 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.closeFormDialog) });
var __VLS_246 = __VLS_241.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_247;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_248 = __VLS_asFunctionalComponent1(__VLS_247, new __VLS_247({
    modelValue: (__VLS_ctx.formData.code),
    label: "Mã Loại Chỉ",
    required: true,
    disable: (__VLS_ctx.formDialog.mode === 'edit'),
    placeholder: "VD: P123",
}));
var __VLS_249 = __VLS_248.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.code),
        label: "Mã Loại Chỉ",
        required: true,
        disable: (__VLS_ctx.formDialog.mode === 'edit'),
        placeholder: "VD: P123",
    }], __VLS_functionalComponentArgsRest(__VLS_248), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_252;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_253 = __VLS_asFunctionalComponent1(__VLS_252, new __VLS_252({
    modelValue: (__VLS_ctx.formData.name),
    label: "Tên Loại Chỉ",
    required: true,
    placeholder: "VD: Polyester 40/2",
}));
var __VLS_254 = __VLS_253.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.name),
        label: "Tên Loại Chỉ",
        required: true,
        placeholder: "VD: Polyester 40/2",
    }], __VLS_functionalComponentArgsRest(__VLS_253), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_257 = ColorSelector_vue_1.default;
// @ts-ignore
var __VLS_258 = __VLS_asFunctionalComponent1(__VLS_257, new __VLS_257({
    modelValue: (__VLS_ctx.formData.color_id),
    label: "Màu Chỉ",
    clearable: true,
}));
var __VLS_259 = __VLS_258.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.color_id),
        label: "Màu Chỉ",
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_258), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_262;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_263 = __VLS_asFunctionalComponent1(__VLS_262, new __VLS_262({
    modelValue: (__VLS_ctx.formData.material),
    label: "Chất Liệu",
    options: (__VLS_ctx.materialOptions),
    required: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
    popupContentClass: "z-max",
}));
var __VLS_264 = __VLS_263.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.material),
        label: "Chất Liệu",
        options: (__VLS_ctx.materialOptions),
        required: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        popupContentClass: "z-max",
    }], __VLS_functionalComponentArgsRest(__VLS_263), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_267;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_268 = __VLS_asFunctionalComponent1(__VLS_267, new __VLS_267({
    modelValue: (__VLS_ctx.formData.tex_number),
    label: "Tex",
    placeholder: "VD: 20/9, 40/3",
}));
var __VLS_269 = __VLS_268.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.tex_number),
        label: "Tex",
        placeholder: "VD: 20/9, 40/3",
    }], __VLS_functionalComponentArgsRest(__VLS_268), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_272;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_273 = __VLS_asFunctionalComponent1(__VLS_272, new __VLS_272({
    modelValue: (__VLS_ctx.formData.density_grams_per_meter),
    modelModifiers: { number: true, },
    label: "Mật độ (g/m)",
    type: "number",
    required: true,
    step: "0.0001",
}));
var __VLS_274 = __VLS_273.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.density_grams_per_meter),
        modelModifiers: { number: true, },
        label: "Mật độ (g/m)",
        type: "number",
        required: true,
        step: "0.0001",
    }], __VLS_functionalComponentArgsRest(__VLS_273), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_277;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_278 = __VLS_asFunctionalComponent1(__VLS_277, new __VLS_277({
    modelValue: (__VLS_ctx.formData.meters_per_cone),
    modelModifiers: { number: true, },
    label: "Mét mỗi ống (m/cone)",
    type: "number",
}));
var __VLS_279 = __VLS_278.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.meters_per_cone),
        modelModifiers: { number: true, },
        label: "Mét mỗi ống (m/cone)",
        type: "number",
    }], __VLS_functionalComponentArgsRest(__VLS_278), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_282 = SupplierSelector_vue_1.default;
// @ts-ignore
var __VLS_283 = __VLS_asFunctionalComponent1(__VLS_282, new __VLS_282({
    modelValue: (__VLS_ctx.formData.supplier_id),
    label: "Nhà Cung Cấp",
    clearable: true,
}));
var __VLS_284 = __VLS_283.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.supplier_id),
        label: "Nhà Cung Cấp",
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_283), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_287;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_288 = __VLS_asFunctionalComponent1(__VLS_287, new __VLS_287({
    modelValue: (__VLS_ctx.formData.reorder_level_meters),
    modelModifiers: { number: true, },
    label: "Mức tái đặt (m)",
    type: "number",
}));
var __VLS_289 = __VLS_288.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.reorder_level_meters),
        modelModifiers: { number: true, },
        label: "Mức tái đặt (m)",
        type: "number",
    }], __VLS_functionalComponentArgsRest(__VLS_288), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_292;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_293 = __VLS_asFunctionalComponent1(__VLS_292, new __VLS_292({
    modelValue: (__VLS_ctx.formData.lead_time_days),
    modelModifiers: { number: true, },
    label: "Thời gian giao hàng (ngày)",
    type: "number",
}));
var __VLS_294 = __VLS_293.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.lead_time_days),
        modelModifiers: { number: true, },
        label: "Thời gian giao hàng (ngày)",
        type: "number",
    }], __VLS_functionalComponentArgsRest(__VLS_293), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 flex items-center" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_297;
/** @ts-ignore @type {typeof __VLS_components.AppToggle} */
AppToggle;
// @ts-ignore
var __VLS_298 = __VLS_asFunctionalComponent1(__VLS_297, new __VLS_297({
    modelValue: (__VLS_ctx.formData.is_active),
    label: "Đang hoạt động",
}));
var __VLS_299 = __VLS_298.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.is_active),
        label: "Đang hoạt động",
    }], __VLS_functionalComponentArgsRest(__VLS_298), false));
// @ts-ignore
[loading, materialOptions, formDialog, formDialog, formDialog, handleSubmit, closeFormDialog, formData, formData, formData, formData, formData, formData, formData, formData, formData, formData, formData,];
var __VLS_241;
var __VLS_242;
var __VLS_302;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_303 = __VLS_asFunctionalComponent1(__VLS_302, new __VLS_302({
    modelValue: (__VLS_ctx.deleteDialog.isOpen),
    persistent: true,
}));
var __VLS_304 = __VLS_303.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.deleteDialog.isOpen),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_303), false));
var __VLS_307 = __VLS_305.slots.default;
var __VLS_308;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_309 = __VLS_asFunctionalComponent1(__VLS_308, new __VLS_308(__assign({ style: {} })));
var __VLS_310 = __VLS_309.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_309), false));
var __VLS_313 = __VLS_311.slots.default;
var __VLS_314;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_315 = __VLS_asFunctionalComponent1(__VLS_314, new __VLS_314(__assign({ class: "row items-center" })));
var __VLS_316 = __VLS_315.apply(void 0, __spreadArray([__assign({ class: "row items-center" })], __VLS_functionalComponentArgsRest(__VLS_315), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_319 = __VLS_317.slots.default;
var __VLS_320;
/** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
qAvatar;
// @ts-ignore
var __VLS_321 = __VLS_asFunctionalComponent1(__VLS_320, new __VLS_320({
    icon: "warning",
    color: "warning",
    textColor: "white",
}));
var __VLS_322 = __VLS_321.apply(void 0, __spreadArray([{
        icon: "warning",
        color: "warning",
        textColor: "white",
    }], __VLS_functionalComponentArgsRest(__VLS_321), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-ml-sm text-h6" }));
/** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
// @ts-ignore
[deleteDialog,];
var __VLS_317;
var __VLS_325;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_326 = __VLS_asFunctionalComponent1(__VLS_325, new __VLS_325(__assign({ class: "q-pt-none" })));
var __VLS_327 = __VLS_326.apply(void 0, __spreadArray([__assign({ class: "q-pt-none" })], __VLS_functionalComponentArgsRest(__VLS_326), false));
/** @type {__VLS_StyleScopedClasses['q-pt-none']} */ ;
var __VLS_330 = __VLS_328.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
((_d = __VLS_ctx.deleteDialog.threadType) === null || _d === void 0 ? void 0 : _d.code);
((_e = __VLS_ctx.deleteDialog.threadType) === null || _e === void 0 ? void 0 : _e.name);
// @ts-ignore
[deleteDialog, deleteDialog,];
var __VLS_328;
var __VLS_331;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_332 = __VLS_asFunctionalComponent1(__VLS_331, new __VLS_331(__assign({ align: "right" }, { class: "text-primary" })));
var __VLS_333 = __VLS_332.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "text-primary" })], __VLS_functionalComponentArgsRest(__VLS_332), false));
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
var __VLS_336 = __VLS_334.slots.default;
var __VLS_337;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_338 = __VLS_asFunctionalComponent1(__VLS_337, new __VLS_337({
    flat: true,
    label: "Hủy",
    color: "grey",
}));
var __VLS_339 = __VLS_338.apply(void 0, __spreadArray([{
        flat: true,
        label: "Hủy",
        color: "grey",
    }], __VLS_functionalComponentArgsRest(__VLS_338), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_342;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_343 = __VLS_asFunctionalComponent1(__VLS_342, new __VLS_342(__assign({ 'onClick': {} }, { unelevated: true, label: "Xóa", color: "negative", loading: (__VLS_ctx.loading) })));
var __VLS_344 = __VLS_343.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { unelevated: true, label: "Xóa", color: "negative", loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_343), false));
var __VLS_347;
var __VLS_348 = ({ click: {} },
    { onClick: (__VLS_ctx.handleDelete) });
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_345;
var __VLS_346;
// @ts-ignore
[loading, vClosePopup, vClosePopup, handleDelete,];
var __VLS_334;
// @ts-ignore
[];
var __VLS_311;
// @ts-ignore
[];
var __VLS_305;
var __VLS_349;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_350 = __VLS_asFunctionalComponent1(__VLS_349, new __VLS_349({
    modelValue: (__VLS_ctx.detailDialog.isOpen),
}));
var __VLS_351 = __VLS_350.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.detailDialog.isOpen),
    }], __VLS_functionalComponentArgsRest(__VLS_350), false));
var __VLS_354 = __VLS_352.slots.default;
if (__VLS_ctx.detailDialog.threadType) {
    var __VLS_355 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_356 = __VLS_asFunctionalComponent1(__VLS_355, new __VLS_355(__assign({ style: {} })));
    var __VLS_357 = __VLS_356.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_356), false));
    var __VLS_360 = __VLS_358.slots.default;
    var __VLS_361 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_362 = __VLS_asFunctionalComponent1(__VLS_361, new __VLS_361(__assign({ class: "row items-center q-pb-none" })));
    var __VLS_363 = __VLS_362.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_362), false));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
    var __VLS_366 = __VLS_364.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    var __VLS_367 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
    qSpace;
    // @ts-ignore
    var __VLS_368 = __VLS_asFunctionalComponent1(__VLS_367, new __VLS_367({}));
    var __VLS_369 = __VLS_368.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_368), false));
    var __VLS_372 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_373 = __VLS_asFunctionalComponent1(__VLS_372, new __VLS_372({
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }));
    var __VLS_374 = __VLS_373.apply(void 0, __spreadArray([{
            icon: "close",
            flat: true,
            round: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_373), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    // @ts-ignore
    [vClosePopup, detailDialog, detailDialog,];
    var __VLS_364;
    var __VLS_377 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_378 = __VLS_asFunctionalComponent1(__VLS_377, new __VLS_377(__assign({ class: "q-pa-md" })));
    var __VLS_379 = __VLS_378.apply(void 0, __spreadArray([__assign({ class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_378), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    var __VLS_382 = __VLS_380.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.detailDialog.threadType.code);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.detailDialog.threadType.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-sm']} */ ;
    if ((_f = __VLS_ctx.detailDialog.threadType.color_data) === null || _f === void 0 ? void 0 : _f.hex_code) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-indicator shadow-1" }, { style: ({ backgroundColor: __VLS_ctx.detailDialog.threadType.color_data.hex_code }) }));
        /** @type {__VLS_StyleScopedClasses['color-indicator']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (((_g = __VLS_ctx.detailDialog.threadType.color_data) === null || _g === void 0 ? void 0 : _g.name) || '---');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.getMaterialLabel(__VLS_ctx.detailDialog.threadType.material));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 font-mono" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
    (__VLS_ctx.detailDialog.threadType.density_grams_per_meter);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.detailDialog.threadType.tex_number || '---');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.detailDialog.threadType.meters_per_cone ? __VLS_ctx.detailDialog.threadType.meters_per_cone.toLocaleString() + ' m' : '---');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (((_h = __VLS_ctx.detailDialog.threadType.supplier_data) === null || _h === void 0 ? void 0 : _h.name) || '---');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.detailDialog.threadType.reorder_level_meters.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.detailDialog.threadType.lead_time_days);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    var __VLS_383 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_384 = __VLS_asFunctionalComponent1(__VLS_383, new __VLS_383({
        qMySm: true,
    }));
    var __VLS_385 = __VLS_384.apply(void 0, __spreadArray([{
            qMySm: true,
        }], __VLS_functionalComponentArgsRest(__VLS_384), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between items-center" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    var __VLS_388 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_389 = __VLS_asFunctionalComponent1(__VLS_388, new __VLS_388({
        color: (__VLS_ctx.detailDialog.threadType.is_active ? 'positive' : 'negative'),
    }));
    var __VLS_390 = __VLS_389.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.detailDialog.threadType.is_active ? 'positive' : 'negative'),
        }], __VLS_functionalComponentArgsRest(__VLS_389), false));
    var __VLS_393 = __VLS_391.slots.default;
    (__VLS_ctx.detailDialog.threadType.is_active ? 'Hoạt động' : 'Ngừng');
    // @ts-ignore
    [getMaterialLabel, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog,];
    var __VLS_391;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-right" }));
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7 italic" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['italic']} */ ;
    (new Date(__VLS_ctx.detailDialog.threadType.created_at).toLocaleDateString('vi-VN'));
    // @ts-ignore
    [detailDialog,];
    var __VLS_380;
    var __VLS_394 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_395 = __VLS_asFunctionalComponent1(__VLS_394, new __VLS_394(__assign({ align: "right" }, { class: "q-px-md q-pb-md" })));
    var __VLS_396 = __VLS_395.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md" })], __VLS_functionalComponentArgsRest(__VLS_395), false));
    /** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
    var __VLS_399 = __VLS_397.slots.default;
    var __VLS_400 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_401 = __VLS_asFunctionalComponent1(__VLS_400, new __VLS_400(__assign({ 'onClick': {} }, { flat: true, label: "Chỉnh sửa", color: "primary", icon: "edit" })));
    var __VLS_402 = __VLS_401.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Chỉnh sửa", color: "primary", icon: "edit" })], __VLS_functionalComponentArgsRest(__VLS_401), false));
    var __VLS_405 = void 0;
    var __VLS_406 = ({ click: {} },
        { onClick: (__VLS_ctx.editFromDetail) });
    var __VLS_403;
    var __VLS_404;
    var __VLS_407 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_408 = __VLS_asFunctionalComponent1(__VLS_407, new __VLS_407({
        unelevated: true,
        label: "Đóng",
        color: "grey",
    }));
    var __VLS_409 = __VLS_408.apply(void 0, __spreadArray([{
            unelevated: true,
            label: "Đóng",
            color: "grey",
        }], __VLS_functionalComponentArgsRest(__VLS_408), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    // @ts-ignore
    [vClosePopup, editFromDetail,];
    var __VLS_397;
    // @ts-ignore
    [];
    var __VLS_358;
}
// @ts-ignore
[];
var __VLS_352;
var __VLS_412 = ThreadTypeSuppliersDialog_vue_1.default;
// @ts-ignore
var __VLS_413 = __VLS_asFunctionalComponent1(__VLS_412, new __VLS_412(__assign({ 'onUpdated': {} }, { modelValue: (__VLS_ctx.suppliersDialog.isOpen), threadType: (__VLS_ctx.suppliersDialog.threadType) })));
var __VLS_414 = __VLS_413.apply(void 0, __spreadArray([__assign({ 'onUpdated': {} }, { modelValue: (__VLS_ctx.suppliersDialog.isOpen), threadType: (__VLS_ctx.suppliersDialog.threadType) })], __VLS_functionalComponentArgsRest(__VLS_413), false));
var __VLS_417;
var __VLS_418 = ({ updated: {} },
    { onUpdated: (__VLS_ctx.handleSuppliersUpdated) });
var __VLS_415;
var __VLS_416;
// @ts-ignore
[suppliersDialog, suppliersDialog, handleSuppliersUpdated,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
