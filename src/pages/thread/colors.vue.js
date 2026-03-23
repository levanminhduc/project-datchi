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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var useColors_1 = require("@/composables/thread/useColors");
var useConfirm_1 = require("@/composables/useConfirm");
var useSnackbar_1 = require("@/composables/useSnackbar");
var colorService_1 = require("@/services/colorService");
var SupplierSelector_vue_1 = require("@/components/ui/inputs/SupplierSelector.vue");
// Composables
var _d = (0, useColors_1.useColors)(), colors = _d.colors, loading = _d.loading, fetchColors = _d.fetchColors, createColor = _d.createColor, updateColor = _d.updateColor, deleteColor = _d.deleteColor;
var confirm = (0, useConfirm_1.useConfirm)().confirm;
var snackbar = (0, useSnackbar_1.useSnackbar)();
// State
var searchQuery = (0, vue_1.ref)('');
var filterActive = (0, vue_1.ref)(null);
var pagination = (0, vue_1.ref)({
    page: 1,
    rowsPerPage: 25,
    sortBy: 'name',
    descending: false,
});
// Options
var activeOptions = [
    { label: 'Hoạt động', value: true },
    { label: 'Ngừng', value: false },
];
// Table columns
var columns = [
    { name: 'preview', label: 'Màu', field: 'name', align: 'left', sortable: true },
    { name: 'hex_code', label: 'Mã HEX', field: 'hex_code', align: 'left' },
    { name: 'pantone_code', label: 'Pantone', field: 'pantone_code', align: 'left', format: function (v) { return v || '-'; } },
    { name: 'ral_code', label: 'RAL', field: 'ral_code', align: 'left', format: function (v) { return v || '-'; } },
    { name: 'is_active', label: 'Trạng thái', field: 'is_active', align: 'center' },
    { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' },
];
var supplierColumns = [
    { name: 'supplier', label: 'Nhà cung cấp', field: 'supplier', align: 'left' },
    { name: 'price_per_kg', label: 'Giá/kg', field: 'price_per_kg', align: 'right' },
    { name: 'min_order_qty', label: 'MOQ', field: 'min_order_qty', align: 'right' },
    { name: 'is_active', label: 'Hoạt động', field: 'is_active', align: 'center' },
    { name: 'actions', label: '', field: 'actions', align: 'center' },
];
// Helpers
function getInitials(name) {
    if (!name)
        return '?';
    var words = name.trim().split(/\s+/);
    if (words.length >= 2 && words[0] && words[1]) {
        return ((words[0][0] || '') + (words[1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}
// Computed
var filteredColors = (0, vue_1.computed)(function () {
    var result = colors.value;
    // Filter by active status
    if (filterActive.value !== null) {
        result = result.filter(function (c) { return c.is_active === filterActive.value; });
    }
    // Filter by search
    if (searchQuery.value.trim()) {
        var query_1 = searchQuery.value.toLowerCase().trim();
        result = result.filter(function (c) {
            var _a, _b;
            return c.name.toLowerCase().includes(query_1) ||
                c.hex_code.toLowerCase().includes(query_1) ||
                ((_a = c.pantone_code) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(query_1)) ||
                ((_b = c.ral_code) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(query_1));
        });
    }
    return result;
});
var linkedSupplierIds = (0, vue_1.computed)(function () {
    return linkedSuppliers.value.map(function (link) { return link.supplier_id; });
});
// Watchers
(0, vue_1.watch)([searchQuery, filterActive], function () {
    pagination.value.page = 1;
});
// Dialog state
var formDialog = (0, vue_1.reactive)({
    isOpen: false,
    mode: 'create',
    id: null,
});
var defaultFormData = {
    name: '',
    hex_code: '#000000',
    pantone_code: '',
    ral_code: '',
};
var formData = (0, vue_1.reactive)(__assign({}, defaultFormData));
// Suppliers dialog state
var suppliersDialog = (0, vue_1.reactive)({
    isOpen: false,
    color: null,
});
var linkedSuppliers = (0, vue_1.ref)([]);
var loadingSuppliers = (0, vue_1.ref)(false);
var linkLoading = (0, vue_1.ref)(false);
var newLink = (0, vue_1.reactive)({
    supplier_id: null,
    price_per_kg: null,
    min_order_qty: null,
});
// Methods
function resetFormData() {
    Object.assign(formData, __assign({}, defaultFormData));
}
function openAddDialog() {
    formDialog.mode = 'create';
    formDialog.id = null;
    resetFormData();
    formDialog.isOpen = true;
}
function openEditDialog(color) {
    formDialog.mode = 'edit';
    formDialog.id = color.id;
    Object.assign(formData, {
        name: color.name,
        hex_code: color.hex_code,
        pantone_code: color.pantone_code || '',
        ral_code: color.ral_code || '',
    });
    formDialog.isOpen = true;
}
function handleSubmit() {
    return __awaiter(this, void 0, void 0, function () {
        var data, result;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!formData.name.trim() || !formData.hex_code) {
                        return [2 /*return*/];
                    }
                    data = {
                        name: formData.name.trim(),
                        hex_code: formData.hex_code.toUpperCase(),
                        pantone_code: ((_a = formData.pantone_code) === null || _a === void 0 ? void 0 : _a.trim()) || undefined,
                        ral_code: ((_b = formData.ral_code) === null || _b === void 0 ? void 0 : _b.trim()) || undefined,
                    };
                    result = null;
                    if (!(formDialog.mode === 'create')) return [3 /*break*/, 2];
                    return [4 /*yield*/, createColor(data)];
                case 1:
                    result = _c.sent();
                    return [3 /*break*/, 4];
                case 2:
                    if (!formDialog.id) return [3 /*break*/, 4];
                    return [4 /*yield*/, updateColor(formDialog.id, data)];
                case 3:
                    result = _c.sent();
                    _c.label = 4;
                case 4:
                    if (result) {
                        formDialog.isOpen = false;
                        resetFormData();
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function confirmDeactivate(color) {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirm({
                        title: "Ng\u1EEBng s\u1EED d\u1EE5ng m\u00E0u \"".concat(color.name, "\"?"),
                        message: 'Màu này sẽ không còn khả dụng trong các form nhập liệu.',
                        ok: 'Ngừng sử dụng',
                        type: 'warning',
                    })];
                case 1:
                    confirmed = _a.sent();
                    if (!confirmed) return [3 /*break*/, 3];
                    return [4 /*yield*/, deleteColor(color.id)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function activateColor(color) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, updateColor(color.id, { is_active: true })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Suppliers dialog methods
function openSuppliersDialog(color) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    suppliersDialog.color = color;
                    suppliersDialog.isOpen = true;
                    return [4 /*yield*/, loadLinkedSuppliers()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function loadLinkedSuppliers() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!suppliersDialog.color)
                        return [2 /*return*/];
                    loadingSuppliers.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    _a = linkedSuppliers;
                    return [4 /*yield*/, colorService_1.colorService.getSuppliers(suppliersDialog.color.id)];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _b.sent();
                    snackbar.error('Lỗi khi tải danh sách nhà cung cấp');
                    console.error(err_1);
                    return [3 /*break*/, 5];
                case 4:
                    loadingSuppliers.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function resetNewLink() {
    newLink.supplier_id = null;
    newLink.price_per_kg = null;
    newLink.min_order_qty = null;
}
function handleLinkSupplier() {
    return __awaiter(this, void 0, void 0, function () {
        var err_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!suppliersDialog.color || !newLink.supplier_id)
                        return [2 /*return*/];
                    linkLoading.value = true;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, colorService_1.colorService.linkSupplier(suppliersDialog.color.id, newLink.supplier_id, (_a = newLink.price_per_kg) !== null && _a !== void 0 ? _a : undefined, (_b = newLink.min_order_qty) !== null && _b !== void 0 ? _b : undefined)];
                case 2:
                    _c.sent();
                    snackbar.success('Đã liên kết nhà cung cấp');
                    resetNewLink();
                    return [4 /*yield*/, loadLinkedSuppliers()];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 4:
                    err_2 = _c.sent();
                    snackbar.error(err_2.message || 'Lỗi khi liên kết nhà cung cấp');
                    return [3 /*break*/, 6];
                case 5:
                    linkLoading.value = false;
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function handleUpdateLink(link) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!suppliersDialog.color)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 5]);
                    return [4 /*yield*/, colorService_1.colorService.updateLink(suppliersDialog.color.id, link.id, {
                            price_per_kg: link.price_per_kg,
                            min_order_qty: link.min_order_qty,
                        })];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    snackbar.error('Lỗi khi cập nhật thông tin');
                    return [4 /*yield*/, loadLinkedSuppliers()]; // Reload to revert
                case 4:
                    _b.sent(); // Reload to revert
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function toggleLinkActive(link, isActive) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!suppliersDialog.color)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, colorService_1.colorService.updateLink(suppliersDialog.color.id, link.id, {
                            is_active: isActive,
                        })];
                case 2:
                    _b.sent();
                    link.is_active = isActive;
                    snackbar.success(isActive ? 'Đã kích hoạt' : 'Đã ngừng kích hoạt');
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    snackbar.error('Lỗi khi cập nhật trạng thái');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function confirmUnlink(link) {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, confirm({
                        title: "G\u1EE1 li\u00EAn k\u1EBFt \"".concat((_b = link.supplier) === null || _b === void 0 ? void 0 : _b.name, "\"?"),
                        message: 'Nhà cung cấp này sẽ không còn liên kết với màu này.',
                        ok: 'Gỡ liên kết',
                        type: 'warning',
                    })];
                case 1:
                    confirmed = _c.sent();
                    if (!(confirmed && suppliersDialog.color)) return [3 /*break*/, 6];
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, colorService_1.colorService.unlinkSupplier(suppliersDialog.color.id, link.id)];
                case 3:
                    _c.sent();
                    snackbar.success('Đã gỡ liên kết nhà cung cấp');
                    return [4 /*yield*/, loadLinkedSuppliers()];
                case 4:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _a = _c.sent();
                    snackbar.error('Lỗi khi gỡ liên kết');
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetchColors()];
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h5 q-my-none text-weight-bold text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-caption text-grey-7 q-mb-none" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-8" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-8']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm justify-end items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    modelValue: (__VLS_ctx.searchQuery),
    placeholder: "Tìm tên màu, mã hex...",
    outlined: true,
    dense: true,
    clearable: true,
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.searchQuery),
        placeholder: "Tìm tên màu, mã hex...",
        outlined: true,
        dense: true,
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
{
    var __VLS_13 = __VLS_10.slots.prepend;
    var __VLS_14 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
        name: "search",
    }));
    var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([{
            name: "search",
        }], __VLS_functionalComponentArgsRest(__VLS_15), false));
    // @ts-ignore
    [searchQuery,];
}
// @ts-ignore
[];
var __VLS_10;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    modelValue: (__VLS_ctx.filterActive),
    options: (__VLS_ctx.activeOptions),
    label: "Trạng thái",
    outlined: true,
    dense: true,
    clearable: true,
    emitValue: true,
    mapOptions: true,
}));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filterActive),
        options: (__VLS_ctx.activeOptions),
        label: "Trạng thái",
        outlined: true,
        dense: true,
        clearable: true,
        emitValue: true,
        mapOptions: true,
    }], __VLS_functionalComponentArgsRest(__VLS_20), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
var __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm Màu", unelevated: true }), { class: "full-width-xs" })));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm Màu", unelevated: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_25), false));
var __VLS_29;
var __VLS_30 = ({ click: {} },
    { onClick: (__VLS_ctx.openAddDialog) });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_27;
var __VLS_28;
var __VLS_31;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31(__assign({ pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.filteredColors), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.loading), rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "colors-table shadow-1" })));
var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([__assign({ pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.filteredColors), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.loading), rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "colors-table shadow-1" })], __VLS_functionalComponentArgsRest(__VLS_32), false));
/** @type {__VLS_StyleScopedClasses['colors-table']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
var __VLS_36 = __VLS_34.slots.default;
{
    var __VLS_37 = __VLS_34.slots.loading;
    var __VLS_38 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
    qInnerLoading;
    // @ts-ignore
    var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
        showing: true,
    }));
    var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{
            showing: true,
        }], __VLS_functionalComponentArgsRest(__VLS_39), false));
    var __VLS_43 = __VLS_41.slots.default;
    var __VLS_44 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        size: "50px",
        color: "primary",
    }));
    var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([{
            size: "50px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_45), false));
    // @ts-ignore
    [filterActive, activeOptions, openAddDialog, pagination, filteredColors, columns, loading,];
    var __VLS_41;
    // @ts-ignore
    [];
}
{
    var __VLS_49 = __VLS_34.slots["body-cell-preview"];
    var props = __VLS_vSlot(__VLS_49)[0];
    var __VLS_50 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
        props: (props),
    }));
    var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_51), false));
    var __VLS_55 = __VLS_53.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-swatch shadow-1" }, { style: ({ backgroundColor: props.row.hex_code }) }));
    /** @type {__VLS_StyleScopedClasses['color-swatch']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (props.row.name);
    // @ts-ignore
    [];
    var __VLS_53;
    // @ts-ignore
    [];
}
{
    var __VLS_56 = __VLS_34.slots["body-cell-hex_code"];
    var props = __VLS_vSlot(__VLS_56)[0];
    var __VLS_57 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
        props: (props),
    }));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_58), false));
    var __VLS_62 = __VLS_60.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.code, __VLS_intrinsics.code)(__assign({ class: "bg-grey-2 q-px-sm q-py-xs rounded-borders" }));
    /** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-px-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    (props.row.hex_code);
    // @ts-ignore
    [];
    var __VLS_60;
    // @ts-ignore
    [];
}
{
    var __VLS_63 = __VLS_34.slots["body-cell-is_active"];
    var props = __VLS_vSlot(__VLS_63)[0];
    var __VLS_64 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
        props: (props),
        align: "center",
    }));
    var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([{
            props: (props),
            align: "center",
        }], __VLS_functionalComponentArgsRest(__VLS_65), false));
    var __VLS_69 = __VLS_67.slots.default;
    var __VLS_70 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
        color: (props.row.is_active ? 'positive' : 'negative'),
    }));
    var __VLS_72 = __VLS_71.apply(void 0, __spreadArray([{
            color: (props.row.is_active ? 'positive' : 'negative'),
        }], __VLS_functionalComponentArgsRest(__VLS_71), false));
    var __VLS_75 = __VLS_73.slots.default;
    (props.row.is_active ? 'Hoạt động' : 'Ngừng');
    // @ts-ignore
    [];
    var __VLS_73;
    // @ts-ignore
    [];
    var __VLS_67;
    // @ts-ignore
    [];
}
{
    var __VLS_76 = __VLS_34.slots["body-cell-actions"];
    var props_1 = __VLS_vSlot(__VLS_76)[0];
    var __VLS_77 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77(__assign({ props: (props_1) }, { class: "q-gutter-x-sm" })));
    var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([__assign({ props: (props_1) }, { class: "q-gutter-x-sm" })], __VLS_functionalComponentArgsRest(__VLS_78), false));
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-sm']} */ ;
    var __VLS_82 = __VLS_80.slots.default;
    var __VLS_83 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83(__assign({ 'onClick': {} }, { flat: true, round: true, color: "teal", icon: "local_shipping", size: "sm" })));
    var __VLS_85 = __VLS_84.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "teal", icon: "local_shipping", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_84), false));
    var __VLS_88 = void 0;
    var __VLS_89 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openSuppliersDialog(props_1.row);
                // @ts-ignore
                [openSuppliersDialog,];
            } });
    var __VLS_90 = __VLS_86.slots.default;
    var __VLS_91 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91({}));
    var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_92), false));
    var __VLS_96 = __VLS_94.slots.default;
    // @ts-ignore
    [];
    var __VLS_94;
    // @ts-ignore
    [];
    var __VLS_86;
    var __VLS_87;
    var __VLS_97 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97(__assign({ 'onClick': {} }, { flat: true, round: true, color: "blue", icon: "edit", size: "sm" })));
    var __VLS_99 = __VLS_98.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "blue", icon: "edit", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_98), false));
    var __VLS_102 = void 0;
    var __VLS_103 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openEditDialog(props_1.row);
                // @ts-ignore
                [openEditDialog,];
            } });
    var __VLS_104 = __VLS_100.slots.default;
    var __VLS_105 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105({}));
    var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_106), false));
    var __VLS_110 = __VLS_108.slots.default;
    // @ts-ignore
    [];
    var __VLS_108;
    // @ts-ignore
    [];
    var __VLS_100;
    var __VLS_101;
    if (props_1.row.is_active) {
        var __VLS_111 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111(__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "block", size: "sm" })));
        var __VLS_113 = __VLS_112.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "block", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_112), false));
        var __VLS_116 = void 0;
        var __VLS_117 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(props_1.row.is_active))
                        return;
                    __VLS_ctx.confirmDeactivate(props_1.row);
                    // @ts-ignore
                    [confirmDeactivate,];
                } });
        var __VLS_118 = __VLS_114.slots.default;
        var __VLS_119 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({}));
        var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_120), false));
        var __VLS_124 = __VLS_122.slots.default;
        // @ts-ignore
        [];
        var __VLS_122;
        // @ts-ignore
        [];
        var __VLS_114;
        var __VLS_115;
    }
    else {
        var __VLS_125 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125(__assign({ 'onClick': {} }, { flat: true, round: true, color: "positive", icon: "check_circle", size: "sm" })));
        var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "positive", icon: "check_circle", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_126), false));
        var __VLS_130 = void 0;
        var __VLS_131 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(props_1.row.is_active))
                        return;
                    __VLS_ctx.activateColor(props_1.row);
                    // @ts-ignore
                    [activateColor,];
                } });
        var __VLS_132 = __VLS_128.slots.default;
        var __VLS_133 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_134 = __VLS_asFunctionalComponent1(__VLS_133, new __VLS_133({}));
        var __VLS_135 = __VLS_134.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_134), false));
        var __VLS_138 = __VLS_136.slots.default;
        // @ts-ignore
        [];
        var __VLS_136;
        // @ts-ignore
        [];
        var __VLS_128;
        var __VLS_129;
    }
    // @ts-ignore
    [];
    var __VLS_80;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_34;
var __VLS_139;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_140 = __VLS_asFunctionalComponent1(__VLS_139, new __VLS_139({
    modelValue: (__VLS_ctx.formDialog.isOpen),
    persistent: true,
}));
var __VLS_141 = __VLS_140.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formDialog.isOpen),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_140), false));
var __VLS_144 = __VLS_142.slots.default;
var __VLS_145;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_146 = __VLS_asFunctionalComponent1(__VLS_145, new __VLS_145(__assign({ style: {} })));
var __VLS_147 = __VLS_146.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_146), false));
var __VLS_150 = __VLS_148.slots.default;
var __VLS_151;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_152 = __VLS_asFunctionalComponent1(__VLS_151, new __VLS_151(__assign({ class: "row items-center q-pb-none" })));
var __VLS_153 = __VLS_152.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_152), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_156 = __VLS_154.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
(__VLS_ctx.formDialog.mode === 'create' ? 'Thêm Màu Mới' : 'Chỉnh Sửa Màu');
var __VLS_157;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_158 = __VLS_asFunctionalComponent1(__VLS_157, new __VLS_157({}));
var __VLS_159 = __VLS_158.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_158), false));
var __VLS_162;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_163 = __VLS_asFunctionalComponent1(__VLS_162, new __VLS_162({
    icon: "close",
    flat: true,
    round: true,
    dense: true,
}));
var __VLS_164 = __VLS_163.apply(void 0, __spreadArray([{
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_163), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[formDialog, formDialog, vClosePopup,];
var __VLS_154;
var __VLS_167;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_168 = __VLS_asFunctionalComponent1(__VLS_167, new __VLS_167({}));
var __VLS_169 = __VLS_168.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_168), false));
var __VLS_172 = __VLS_170.slots.default;
var __VLS_173;
/** @ts-ignore @type {typeof __VLS_components.qForm | typeof __VLS_components.QForm | typeof __VLS_components.qForm | typeof __VLS_components.QForm} */
qForm;
// @ts-ignore
var __VLS_174 = __VLS_asFunctionalComponent1(__VLS_173, new __VLS_173(__assign({ 'onSubmit': {} }, { class: "q-gutter-md" })));
var __VLS_175 = __VLS_174.apply(void 0, __spreadArray([__assign({ 'onSubmit': {} }, { class: "q-gutter-md" })], __VLS_functionalComponentArgsRest(__VLS_174), false));
var __VLS_178;
var __VLS_179 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleSubmit) });
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_180 = __VLS_176.slots.default;
var __VLS_181;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_182 = __VLS_asFunctionalComponent1(__VLS_181, new __VLS_181({
    modelValue: (__VLS_ctx.formData.name),
    label: "Tên màu",
    outlined: true,
    rules: ([function (v) { return !!v || 'Vui lòng nhập tên màu'; }]),
}));
var __VLS_183 = __VLS_182.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.name),
        label: "Tên màu",
        outlined: true,
        rules: ([function (v) { return !!v || 'Vui lòng nhập tên màu'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_182), false));
var __VLS_186;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_187 = __VLS_asFunctionalComponent1(__VLS_186, new __VLS_186({
    modelValue: (__VLS_ctx.formData.hex_code),
    label: "Mã màu HEX",
    outlined: true,
    mask: "!#XXXXXX",
    rules: ([function (v) { return /^#[0-9A-Fa-f]{6}$/.test(v) || 'Mã màu không hợp lệ (VD: #FF0000)'; }]),
}));
var __VLS_188 = __VLS_187.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.hex_code),
        label: "Mã màu HEX",
        outlined: true,
        mask: "!#XXXXXX",
        rules: ([function (v) { return /^#[0-9A-Fa-f]{6}$/.test(v) || 'Mã màu không hợp lệ (VD: #FF0000)'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_187), false));
var __VLS_191 = __VLS_189.slots.default;
{
    var __VLS_192 = __VLS_189.slots.append;
    var __VLS_193 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_194 = __VLS_asFunctionalComponent1(__VLS_193, new __VLS_193(__assign({ name: "colorize" }, { class: "cursor-pointer" })));
    var __VLS_195 = __VLS_194.apply(void 0, __spreadArray([__assign({ name: "colorize" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_194), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_198 = __VLS_196.slots.default;
    var __VLS_199 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_200 = __VLS_asFunctionalComponent1(__VLS_199, new __VLS_199({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_201 = __VLS_200.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_200), false));
    var __VLS_204 = __VLS_202.slots.default;
    var __VLS_205 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qColor | typeof __VLS_components.QColor} */
    qColor;
    // @ts-ignore
    var __VLS_206 = __VLS_asFunctionalComponent1(__VLS_205, new __VLS_205({
        modelValue: (__VLS_ctx.formData.hex_code),
        formatModel: "hex",
    }));
    var __VLS_207 = __VLS_206.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.formData.hex_code),
            formatModel: "hex",
        }], __VLS_functionalComponentArgsRest(__VLS_206), false));
    // @ts-ignore
    [handleSubmit, formData, formData, formData,];
    var __VLS_202;
    // @ts-ignore
    [];
    var __VLS_196;
    // @ts-ignore
    [];
}
{
    var __VLS_210 = __VLS_189.slots.prepend;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-swatch-small" }, { style: ({ backgroundColor: __VLS_ctx.formData.hex_code }) }));
    /** @type {__VLS_StyleScopedClasses['color-swatch-small']} */ ;
    // @ts-ignore
    [formData,];
}
// @ts-ignore
[];
var __VLS_189;
var __VLS_211;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_212 = __VLS_asFunctionalComponent1(__VLS_211, new __VLS_211({
    modelValue: (__VLS_ctx.formData.pantone_code),
    label: "Mã Pantone (tùy chọn)",
    outlined: true,
    placeholder: "VD: 19-4052 TCX",
}));
var __VLS_213 = __VLS_212.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.pantone_code),
        label: "Mã Pantone (tùy chọn)",
        outlined: true,
        placeholder: "VD: 19-4052 TCX",
    }], __VLS_functionalComponentArgsRest(__VLS_212), false));
var __VLS_216;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_217 = __VLS_asFunctionalComponent1(__VLS_216, new __VLS_216({
    modelValue: (__VLS_ctx.formData.ral_code),
    label: "Mã RAL (tùy chọn)",
    outlined: true,
    placeholder: "VD: RAL 5002",
}));
var __VLS_218 = __VLS_217.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.ral_code),
        label: "Mã RAL (tùy chọn)",
        outlined: true,
        placeholder: "VD: RAL 5002",
    }], __VLS_functionalComponentArgsRest(__VLS_217), false));
// @ts-ignore
[formData, formData,];
var __VLS_176;
var __VLS_177;
// @ts-ignore
[];
var __VLS_170;
var __VLS_221;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221(__assign({ align: "right" }, { class: "q-px-md q-pb-md" })));
var __VLS_223 = __VLS_222.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md" })], __VLS_functionalComponentArgsRest(__VLS_222), false));
/** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
var __VLS_226 = __VLS_224.slots.default;
var __VLS_227;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_228 = __VLS_asFunctionalComponent1(__VLS_227, new __VLS_227({
    flat: true,
    label: "Hủy",
    color: "grey",
}));
var __VLS_229 = __VLS_228.apply(void 0, __spreadArray([{
        flat: true,
        label: "Hủy",
        color: "grey",
    }], __VLS_functionalComponentArgsRest(__VLS_228), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_232;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_233 = __VLS_asFunctionalComponent1(__VLS_232, new __VLS_232(__assign({ 'onClick': {} }, { unelevated: true, label: (__VLS_ctx.formDialog.mode === 'create' ? 'Tạo' : 'Lưu'), color: "primary", loading: (__VLS_ctx.loading) })));
var __VLS_234 = __VLS_233.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { unelevated: true, label: (__VLS_ctx.formDialog.mode === 'create' ? 'Tạo' : 'Lưu'), color: "primary", loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_233), false));
var __VLS_237;
var __VLS_238 = ({ click: {} },
    { onClick: (__VLS_ctx.handleSubmit) });
var __VLS_235;
var __VLS_236;
// @ts-ignore
[loading, formDialog, vClosePopup, handleSubmit,];
var __VLS_224;
// @ts-ignore
[];
var __VLS_148;
// @ts-ignore
[];
var __VLS_142;
var __VLS_239;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_240 = __VLS_asFunctionalComponent1(__VLS_239, new __VLS_239({
    modelValue: (__VLS_ctx.suppliersDialog.isOpen),
    maximized: true,
}));
var __VLS_241 = __VLS_240.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.suppliersDialog.isOpen),
        maximized: true,
    }], __VLS_functionalComponentArgsRest(__VLS_240), false));
var __VLS_244 = __VLS_242.slots.default;
if (__VLS_ctx.suppliersDialog.color) {
    var __VLS_245 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_246 = __VLS_asFunctionalComponent1(__VLS_245, new __VLS_245({}));
    var __VLS_247 = __VLS_246.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_246), false));
    var __VLS_250 = __VLS_248.slots.default;
    var __VLS_251 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_252 = __VLS_asFunctionalComponent1(__VLS_251, new __VLS_251(__assign({ class: "row items-center q-pb-none bg-primary text-white" })));
    var __VLS_253 = __VLS_252.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none bg-primary text-white" })], __VLS_functionalComponentArgsRest(__VLS_252), false));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_256 = __VLS_254.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-swatch shadow-1" }, { style: ({ backgroundColor: __VLS_ctx.suppliersDialog.color.hex_code }) }));
    /** @type {__VLS_StyleScopedClasses['color-swatch']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    (__VLS_ctx.suppliersDialog.color.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    var __VLS_257 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
    qSpace;
    // @ts-ignore
    var __VLS_258 = __VLS_asFunctionalComponent1(__VLS_257, new __VLS_257({}));
    var __VLS_259 = __VLS_258.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_258), false));
    var __VLS_262 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_263 = __VLS_asFunctionalComponent1(__VLS_262, new __VLS_262({
        icon: "close",
        flat: true,
        round: true,
        dense: true,
        color: "white",
    }));
    var __VLS_264 = __VLS_263.apply(void 0, __spreadArray([{
            icon: "close",
            flat: true,
            round: true,
            dense: true,
            color: "white",
        }], __VLS_functionalComponentArgsRest(__VLS_263), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    // @ts-ignore
    [vClosePopup, suppliersDialog, suppliersDialog, suppliersDialog, suppliersDialog,];
    var __VLS_254;
    var __VLS_267 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_268 = __VLS_asFunctionalComponent1(__VLS_267, new __VLS_267(__assign({ class: "q-pa-md" })));
    var __VLS_269 = __VLS_268.apply(void 0, __spreadArray([__assign({ class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_268), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    var __VLS_272 = __VLS_270.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-lg items-end" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    var __VLS_273 = SupplierSelector_vue_1.default;
    // @ts-ignore
    var __VLS_274 = __VLS_asFunctionalComponent1(__VLS_273, new __VLS_273({
        modelValue: (__VLS_ctx.newLink.supplier_id),
        label: "Chọn nhà cung cấp",
        excludeIds: (__VLS_ctx.linkedSupplierIds),
    }));
    var __VLS_275 = __VLS_274.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.newLink.supplier_id),
            label: "Chọn nhà cung cấp",
            excludeIds: (__VLS_ctx.linkedSupplierIds),
        }], __VLS_functionalComponentArgsRest(__VLS_274), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-sm-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-2']} */ ;
    var __VLS_278 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_279 = __VLS_asFunctionalComponent1(__VLS_278, new __VLS_278({
        modelValue: (__VLS_ctx.newLink.price_per_kg),
        modelModifiers: { number: true, },
        label: "Giá/kg (VND)",
        type: "number",
        outlined: true,
        dense: true,
        min: (0),
    }));
    var __VLS_280 = __VLS_279.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.newLink.price_per_kg),
            modelModifiers: { number: true, },
            label: "Giá/kg (VND)",
            type: "number",
            outlined: true,
            dense: true,
            min: (0),
        }], __VLS_functionalComponentArgsRest(__VLS_279), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-sm-2" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-2']} */ ;
    var __VLS_283 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_284 = __VLS_asFunctionalComponent1(__VLS_283, new __VLS_283({
        modelValue: (__VLS_ctx.newLink.min_order_qty),
        modelModifiers: { number: true, },
        label: "MOQ (kg)",
        type: "number",
        outlined: true,
        dense: true,
        min: (1),
    }));
    var __VLS_285 = __VLS_284.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.newLink.min_order_qty),
            modelModifiers: { number: true, },
            label: "MOQ (kg)",
            type: "number",
            outlined: true,
            dense: true,
            min: (1),
        }], __VLS_functionalComponentArgsRest(__VLS_284), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
    var __VLS_288 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_289 = __VLS_asFunctionalComponent1(__VLS_288, new __VLS_288(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm NCC", unelevated: true, disable: (!__VLS_ctx.newLink.supplier_id), loading: (__VLS_ctx.linkLoading) })));
    var __VLS_290 = __VLS_289.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm NCC", unelevated: true, disable: (!__VLS_ctx.newLink.supplier_id), loading: (__VLS_ctx.linkLoading) })], __VLS_functionalComponentArgsRest(__VLS_289), false));
    var __VLS_293 = void 0;
    var __VLS_294 = ({ click: {} },
        { onClick: (__VLS_ctx.handleLinkSupplier) });
    var __VLS_291;
    var __VLS_292;
    var __VLS_295 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_296 = __VLS_asFunctionalComponent1(__VLS_295, new __VLS_295(__assign({ flat: true, bordered: true, rows: (__VLS_ctx.linkedSuppliers), columns: (__VLS_ctx.supplierColumns), rowKey: "id", loading: (__VLS_ctx.loadingSuppliers), rowsPerPageOptions: ([0]), hidePagination: true }, { class: "shadow-1" })));
    var __VLS_297 = __VLS_296.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true, rows: (__VLS_ctx.linkedSuppliers), columns: (__VLS_ctx.supplierColumns), rowKey: "id", loading: (__VLS_ctx.loadingSuppliers), rowsPerPageOptions: ([0]), hidePagination: true }, { class: "shadow-1" })], __VLS_functionalComponentArgsRest(__VLS_296), false));
    /** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
    var __VLS_300 = __VLS_298.slots.default;
    {
        var __VLS_301 = __VLS_298.slots.loading;
        var __VLS_302 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
        qInnerLoading;
        // @ts-ignore
        var __VLS_303 = __VLS_asFunctionalComponent1(__VLS_302, new __VLS_302({
            showing: true,
        }));
        var __VLS_304 = __VLS_303.apply(void 0, __spreadArray([{
                showing: true,
            }], __VLS_functionalComponentArgsRest(__VLS_303), false));
        var __VLS_307 = __VLS_305.slots.default;
        var __VLS_308 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
        qSpinnerDots;
        // @ts-ignore
        var __VLS_309 = __VLS_asFunctionalComponent1(__VLS_308, new __VLS_308({
            size: "40px",
            color: "primary",
        }));
        var __VLS_310 = __VLS_309.apply(void 0, __spreadArray([{
                size: "40px",
                color: "primary",
            }], __VLS_functionalComponentArgsRest(__VLS_309), false));
        // @ts-ignore
        [newLink, newLink, newLink, newLink, linkedSupplierIds, linkLoading, handleLinkSupplier, linkedSuppliers, supplierColumns, loadingSuppliers,];
        var __VLS_305;
        // @ts-ignore
        [];
    }
    {
        var __VLS_313 = __VLS_298.slots["no-data"];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "full-width text-center q-pa-lg text-grey-6" }));
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        var __VLS_314 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_315 = __VLS_asFunctionalComponent1(__VLS_314, new __VLS_314(__assign({ name: "local_shipping", size: "48px" }, { class: "q-mb-sm" })));
        var __VLS_316 = __VLS_315.apply(void 0, __spreadArray([__assign({ name: "local_shipping", size: "48px" }, { class: "q-mb-sm" })], __VLS_functionalComponentArgsRest(__VLS_315), false));
        /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        // @ts-ignore
        [];
    }
    {
        var __VLS_319 = __VLS_298.slots["body-cell-supplier"];
        var props = __VLS_vSlot(__VLS_319)[0];
        var __VLS_320 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_321 = __VLS_asFunctionalComponent1(__VLS_320, new __VLS_320({
            props: (props),
        }));
        var __VLS_322 = __VLS_321.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_321), false));
        var __VLS_325 = __VLS_323.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
        var __VLS_326 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_327 = __VLS_asFunctionalComponent1(__VLS_326, new __VLS_326(__assign({ size: "32px", color: "teal", textColor: "white" }, { class: "q-mr-sm" })));
        var __VLS_328 = __VLS_327.apply(void 0, __spreadArray([__assign({ size: "32px", color: "teal", textColor: "white" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_327), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
        var __VLS_331 = __VLS_329.slots.default;
        (__VLS_ctx.getInitials(((_a = props.row.supplier) === null || _a === void 0 ? void 0 : _a.name) || ''));
        // @ts-ignore
        [getInitials,];
        var __VLS_329;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        ((_b = props.row.supplier) === null || _b === void 0 ? void 0 : _b.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        ((_c = props.row.supplier) === null || _c === void 0 ? void 0 : _c.code);
        // @ts-ignore
        [];
        var __VLS_323;
        // @ts-ignore
        [];
    }
    {
        var __VLS_332 = __VLS_298.slots["body-cell-price_per_kg"];
        var props_2 = __VLS_vSlot(__VLS_332)[0];
        var __VLS_333 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_334 = __VLS_asFunctionalComponent1(__VLS_333, new __VLS_333({
            props: (props_2),
        }));
        var __VLS_335 = __VLS_334.apply(void 0, __spreadArray([{
                props: (props_2),
            }], __VLS_functionalComponentArgsRest(__VLS_334), false));
        var __VLS_338 = __VLS_336.slots.default;
        var __VLS_339 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_340 = __VLS_asFunctionalComponent1(__VLS_339, new __VLS_339(__assign({ 'onBlur': {} }, { modelValue: (props_2.row.price_per_kg), modelModifiers: { number: true, }, type: "number", dense: true, borderless: true, inputClass: "text-right", min: (0), suffix: "₫" })));
        var __VLS_341 = __VLS_340.apply(void 0, __spreadArray([__assign({ 'onBlur': {} }, { modelValue: (props_2.row.price_per_kg), modelModifiers: { number: true, }, type: "number", dense: true, borderless: true, inputClass: "text-right", min: (0), suffix: "₫" })], __VLS_functionalComponentArgsRest(__VLS_340), false));
        var __VLS_344 = void 0;
        var __VLS_345 = ({ blur: {} },
            { onBlur: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.suppliersDialog.color))
                        return;
                    __VLS_ctx.handleUpdateLink(props_2.row);
                    // @ts-ignore
                    [handleUpdateLink,];
                } });
        var __VLS_342;
        var __VLS_343;
        // @ts-ignore
        [];
        var __VLS_336;
        // @ts-ignore
        [];
    }
    {
        var __VLS_346 = __VLS_298.slots["body-cell-min_order_qty"];
        var props_3 = __VLS_vSlot(__VLS_346)[0];
        var __VLS_347 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_348 = __VLS_asFunctionalComponent1(__VLS_347, new __VLS_347({
            props: (props_3),
        }));
        var __VLS_349 = __VLS_348.apply(void 0, __spreadArray([{
                props: (props_3),
            }], __VLS_functionalComponentArgsRest(__VLS_348), false));
        var __VLS_352 = __VLS_350.slots.default;
        var __VLS_353 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_354 = __VLS_asFunctionalComponent1(__VLS_353, new __VLS_353(__assign({ 'onBlur': {} }, { modelValue: (props_3.row.min_order_qty), modelModifiers: { number: true, }, type: "number", dense: true, borderless: true, inputClass: "text-right", min: (1), suffix: "kg" })));
        var __VLS_355 = __VLS_354.apply(void 0, __spreadArray([__assign({ 'onBlur': {} }, { modelValue: (props_3.row.min_order_qty), modelModifiers: { number: true, }, type: "number", dense: true, borderless: true, inputClass: "text-right", min: (1), suffix: "kg" })], __VLS_functionalComponentArgsRest(__VLS_354), false));
        var __VLS_358 = void 0;
        var __VLS_359 = ({ blur: {} },
            { onBlur: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.suppliersDialog.color))
                        return;
                    __VLS_ctx.handleUpdateLink(props_3.row);
                    // @ts-ignore
                    [handleUpdateLink,];
                } });
        var __VLS_356;
        var __VLS_357;
        // @ts-ignore
        [];
        var __VLS_350;
        // @ts-ignore
        [];
    }
    {
        var __VLS_360 = __VLS_298.slots["body-cell-is_active"];
        var props_4 = __VLS_vSlot(__VLS_360)[0];
        var __VLS_361 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_362 = __VLS_asFunctionalComponent1(__VLS_361, new __VLS_361({
            props: (props_4),
            align: "center",
        }));
        var __VLS_363 = __VLS_362.apply(void 0, __spreadArray([{
                props: (props_4),
                align: "center",
            }], __VLS_functionalComponentArgsRest(__VLS_362), false));
        var __VLS_366 = __VLS_364.slots.default;
        var __VLS_367 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qToggle | typeof __VLS_components.QToggle} */
        qToggle;
        // @ts-ignore
        var __VLS_368 = __VLS_asFunctionalComponent1(__VLS_367, new __VLS_367(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (props_4.row.is_active), color: "positive" })));
        var __VLS_369 = __VLS_368.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (props_4.row.is_active), color: "positive" })], __VLS_functionalComponentArgsRest(__VLS_368), false));
        var __VLS_372 = void 0;
        var __VLS_373 = ({ 'update:modelValue': {} },
            { 'onUpdate:modelValue': function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.suppliersDialog.color))
                        return;
                    __VLS_ctx.toggleLinkActive(props_4.row, $event);
                    // @ts-ignore
                    [toggleLinkActive,];
                } });
        var __VLS_370;
        var __VLS_371;
        // @ts-ignore
        [];
        var __VLS_364;
        // @ts-ignore
        [];
    }
    {
        var __VLS_374 = __VLS_298.slots["body-cell-actions"];
        var props_5 = __VLS_vSlot(__VLS_374)[0];
        var __VLS_375 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_376 = __VLS_asFunctionalComponent1(__VLS_375, new __VLS_375({
            props: (props_5),
            align: "center",
        }));
        var __VLS_377 = __VLS_376.apply(void 0, __spreadArray([{
                props: (props_5),
                align: "center",
            }], __VLS_functionalComponentArgsRest(__VLS_376), false));
        var __VLS_380 = __VLS_378.slots.default;
        var __VLS_381 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_382 = __VLS_asFunctionalComponent1(__VLS_381, new __VLS_381(__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "link_off", size: "sm" })));
        var __VLS_383 = __VLS_382.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "link_off", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_382), false));
        var __VLS_386 = void 0;
        var __VLS_387 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.suppliersDialog.color))
                        return;
                    __VLS_ctx.confirmUnlink(props_5.row);
                    // @ts-ignore
                    [confirmUnlink,];
                } });
        var __VLS_388 = __VLS_384.slots.default;
        var __VLS_389 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_390 = __VLS_asFunctionalComponent1(__VLS_389, new __VLS_389({}));
        var __VLS_391 = __VLS_390.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_390), false));
        var __VLS_394 = __VLS_392.slots.default;
        // @ts-ignore
        [];
        var __VLS_392;
        // @ts-ignore
        [];
        var __VLS_384;
        var __VLS_385;
        // @ts-ignore
        [];
        var __VLS_378;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_298;
    // @ts-ignore
    [];
    var __VLS_270;
    // @ts-ignore
    [];
    var __VLS_248;
}
// @ts-ignore
[];
var __VLS_242;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
