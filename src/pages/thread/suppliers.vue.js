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
var useSuppliers_1 = require("@/composables/thread/useSuppliers");
var useConfirm_1 = require("@/composables/useConfirm");
var supplierService_1 = require("@/services/supplierService");
// Composables
var router = (0, vue_router_1.useRouter)();
var _a = (0, useSuppliers_1.useSuppliers)(), suppliers = _a.suppliers, loading = _a.loading, fetchSuppliers = _a.fetchSuppliers, createSupplier = _a.createSupplier, updateSupplier = _a.updateSupplier, deleteSupplier = _a.deleteSupplier;
var confirm = (0, useConfirm_1.useConfirm)().confirm;
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
    { name: 'name', label: 'Nhà cung cấp', field: 'name', align: 'left', sortable: true },
    { name: 'contact', label: 'Liên hệ', field: 'contact_name', align: 'left' },
    { name: 'email', label: 'Email', field: 'email', align: 'left', format: function (v) { return v || '-'; } },
    { name: 'lead_time_days', label: 'Giao hàng', field: 'lead_time_days', align: 'center', sortable: true },
    { name: 'is_active', label: 'Trạng thái', field: 'is_active', align: 'center' },
    { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' },
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
var filteredSuppliers = (0, vue_1.computed)(function () {
    var result = suppliers.value;
    // Filter by active status
    if (filterActive.value !== null) {
        result = result.filter(function (s) { return s.is_active === filterActive.value; });
    }
    // Filter by search
    if (searchQuery.value.trim()) {
        var query_1 = searchQuery.value.toLowerCase().trim();
        result = result.filter(function (s) {
            var _a, _b, _c;
            return s.name.toLowerCase().includes(query_1) ||
                s.code.toLowerCase().includes(query_1) ||
                ((_a = s.contact_name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(query_1)) ||
                ((_b = s.phone) === null || _b === void 0 ? void 0 : _b.includes(query_1)) ||
                ((_c = s.email) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(query_1));
        });
    }
    return result;
});
// Watchers
(0, vue_1.watch)([searchQuery, filterActive], function () {
    pagination.value.page = 1;
});
// Dialog states
var formDialog = (0, vue_1.reactive)({
    isOpen: false,
    mode: 'create',
    id: null,
});
var detailDialog = (0, vue_1.reactive)({
    isOpen: false,
    supplier: null,
});
var supplierThreadTypes = (0, vue_1.ref)([]);
var loadingThreadTypes = (0, vue_1.ref)(false);
var defaultFormData = {
    code: '',
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    lead_time_days: 7,
};
var formData = (0, vue_1.reactive)(__assign({}, defaultFormData));
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
function openEditDialog(supplier) {
    var _a;
    if (!supplier) {
        console.error('[suppliers] openEditDialog: supplier is null or undefined');
        return;
    }
    formDialog.mode = 'edit';
    formDialog.id = supplier.id;
    Object.assign(formData, {
        code: supplier.code || '',
        name: supplier.name || '',
        contact_name: supplier.contact_name || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        lead_time_days: (_a = supplier.lead_time_days) !== null && _a !== void 0 ? _a : 7,
    });
    formDialog.isOpen = true;
}
function openDetailDialog(supplier) {
    return __awaiter(this, void 0, void 0, function () {
        var detail, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    detailDialog.supplier = supplier;
                    detailDialog.isOpen = true;
                    supplierThreadTypes.value = [];
                    loadingThreadTypes.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, supplierService_1.supplierService.getById(supplier.id)];
                case 2:
                    detail = _b.sent();
                    supplierThreadTypes.value = detail.thread_types || [];
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    supplierThreadTypes.value = [];
                    return [3 /*break*/, 5];
                case 4:
                    loadingThreadTypes.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function editFromDetail() {
    if (detailDialog.supplier) {
        var supplier = __assign({}, detailDialog.supplier);
        detailDialog.isOpen = false;
        openEditDialog(supplier);
    }
}
function handleSubmit() {
    return __awaiter(this, void 0, void 0, function () {
        var data, result;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (!formData.code.trim() || !formData.name.trim()) {
                        return [2 /*return*/];
                    }
                    data = {
                        code: formData.code.trim().toUpperCase(),
                        name: formData.name.trim(),
                        contact_name: ((_a = formData.contact_name) === null || _a === void 0 ? void 0 : _a.trim()) || undefined,
                        phone: ((_b = formData.phone) === null || _b === void 0 ? void 0 : _b.trim()) || undefined,
                        email: ((_c = formData.email) === null || _c === void 0 ? void 0 : _c.trim()) || undefined,
                        address: ((_d = formData.address) === null || _d === void 0 ? void 0 : _d.trim()) || undefined,
                        lead_time_days: formData.lead_time_days || 7,
                    };
                    result = null;
                    if (!(formDialog.mode === 'create')) return [3 /*break*/, 2];
                    return [4 /*yield*/, createSupplier(data)];
                case 1:
                    result = _e.sent();
                    return [3 /*break*/, 4];
                case 2:
                    if (!formDialog.id) return [3 /*break*/, 4];
                    return [4 /*yield*/, updateSupplier(formDialog.id, data)];
                case 3:
                    result = _e.sent();
                    _e.label = 4;
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
function confirmDeactivate(supplier) {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirm({
                        title: "Ng\u1EEBng h\u1EE3p t\u00E1c v\u1EDBi \"".concat(supplier.name, "\"?"),
                        message: 'Nhà cung cấp này sẽ không còn khả dụng trong các form nhập liệu.',
                        ok: 'Ngừng hợp tác',
                        type: 'warning',
                    })];
                case 1:
                    confirmed = _a.sent();
                    if (!confirmed) return [3 /*break*/, 3];
                    return [4 /*yield*/, deleteSupplier(supplier.id)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function activateSupplier(supplier) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, updateSupplier(supplier.id, { is_active: true })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetchSuppliers()];
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
/** @ts-ignore @type {typeof __VLS_components.routerView | typeof __VLS_components.RouterView | typeof __VLS_components.routerView | typeof __VLS_components.RouterView} */
routerView;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
{
    var __VLS_6 = __VLS_3.slots.default;
    var Component_1 = __VLS_vSlot(__VLS_6)[0].Component;
    if (Component_1) {
        var __VLS_7 = (Component_1);
        // @ts-ignore
        var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
        var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_8), false));
    }
    else {
        var __VLS_12 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qPage | typeof __VLS_components.QPage | typeof __VLS_components.qPage | typeof __VLS_components.QPage} */
        qPage;
        // @ts-ignore
        var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
            padding: true,
        }));
        var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([{
                padding: true,
            }], __VLS_functionalComponentArgsRest(__VLS_13), false));
        var __VLS_17 = __VLS_15.slots.default;
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
        var __VLS_18 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
            modelValue: (__VLS_ctx.searchQuery),
            placeholder: "Tìm tên, mã, liên hệ...",
            outlined: true,
            dense: true,
            clearable: true,
        }));
        var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.searchQuery),
                placeholder: "Tìm tên, mã, liên hệ...",
                outlined: true,
                dense: true,
                clearable: true,
            }], __VLS_functionalComponentArgsRest(__VLS_19), false));
        var __VLS_23 = __VLS_21.slots.default;
        {
            var __VLS_24 = __VLS_21.slots.prepend;
            var __VLS_25 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
                name: "search",
            }));
            var __VLS_27 = __VLS_26.apply(void 0, __spreadArray([{
                    name: "search",
                }], __VLS_functionalComponentArgsRest(__VLS_26), false));
            // @ts-ignore
            [searchQuery,];
        }
        // @ts-ignore
        [];
        var __VLS_21;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3 col-md-2" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
        var __VLS_30 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
        qSelect;
        // @ts-ignore
        var __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({
            modelValue: (__VLS_ctx.filterActive),
            options: (__VLS_ctx.activeOptions),
            label: "Trạng thái",
            outlined: true,
            dense: true,
            clearable: true,
            emitValue: true,
            mapOptions: true,
        }));
        var __VLS_32 = __VLS_31.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.filterActive),
                options: (__VLS_ctx.activeOptions),
                label: "Trạng thái",
                outlined: true,
                dense: true,
                clearable: true,
                emitValue: true,
                mapOptions: true,
            }], __VLS_functionalComponentArgsRest(__VLS_31), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
        var __VLS_35 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign(__assign({ 'onClick': {} }, { color: "secondary", icon: "upload", label: "Import NCC-Tex", outline: true }), { class: "full-width-xs" })));
        var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "secondary", icon: "upload", label: "Import NCC-Tex", outline: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_36), false));
        var __VLS_40 = void 0;
        var __VLS_41 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(Component_1))
                        return;
                    __VLS_ctx.router.push('/thread/suppliers/import-tex');
                    // @ts-ignore
                    [filterActive, activeOptions, router,];
                } });
        /** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
        var __VLS_38;
        var __VLS_39;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
        var __VLS_42 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42(__assign(__assign({ 'onClick': {} }, { color: "secondary", icon: "palette", label: "Import Màu NCC", outline: true }), { class: "full-width-xs" })));
        var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "secondary", icon: "palette", label: "Import Màu NCC", outline: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_43), false));
        var __VLS_47 = void 0;
        var __VLS_48 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(Component_1))
                        return;
                    __VLS_ctx.router.push('/thread/suppliers/import-colors');
                    // @ts-ignore
                    [router,];
                } });
        /** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
        var __VLS_45;
        var __VLS_46;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
        var __VLS_49 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm NCC", unelevated: true }), { class: "full-width-xs" })));
        var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm NCC", unelevated: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_50), false));
        var __VLS_54 = void 0;
        var __VLS_55 = ({ click: {} },
            { onClick: (__VLS_ctx.openAddDialog) });
        /** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
        var __VLS_52;
        var __VLS_53;
        var __VLS_56 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
        qTable;
        // @ts-ignore
        var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56(__assign({ pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.filteredSuppliers), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.loading), rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "suppliers-table shadow-1" })));
        var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([__assign({ pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.filteredSuppliers), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.loading), rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "suppliers-table shadow-1" })], __VLS_functionalComponentArgsRest(__VLS_57), false));
        /** @type {__VLS_StyleScopedClasses['suppliers-table']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
        var __VLS_61 = __VLS_59.slots.default;
        {
            var __VLS_62 = __VLS_59.slots.loading;
            var __VLS_63 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
            qInnerLoading;
            // @ts-ignore
            var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
                showing: true,
            }));
            var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([{
                    showing: true,
                }], __VLS_functionalComponentArgsRest(__VLS_64), false));
            var __VLS_68 = __VLS_66.slots.default;
            var __VLS_69 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
            qSpinnerDots;
            // @ts-ignore
            var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
                size: "50px",
                color: "primary",
            }));
            var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([{
                    size: "50px",
                    color: "primary",
                }], __VLS_functionalComponentArgsRest(__VLS_70), false));
            // @ts-ignore
            [openAddDialog, pagination, filteredSuppliers, columns, loading,];
            var __VLS_66;
            // @ts-ignore
            [];
        }
        {
            var __VLS_74 = __VLS_59.slots["body-cell-name"];
            var props = __VLS_vSlot(__VLS_74)[0];
            var __VLS_75 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
                props: (props),
            }));
            var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([{
                    props: (props),
                }], __VLS_functionalComponentArgsRest(__VLS_76), false));
            var __VLS_80 = __VLS_78.slots.default;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
            var __VLS_81 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
            qAvatar;
            // @ts-ignore
            var __VLS_82 = __VLS_asFunctionalComponent1(__VLS_81, new __VLS_81(__assign({ size: "32px", color: "primary", textColor: "white" }, { class: "q-mr-sm text-weight-bold" })));
            var __VLS_83 = __VLS_82.apply(void 0, __spreadArray([__assign({ size: "32px", color: "primary", textColor: "white" }, { class: "q-mr-sm text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_82), false));
            /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
            var __VLS_86 = __VLS_84.slots.default;
            (__VLS_ctx.getInitials(props.row.name));
            // @ts-ignore
            [getInitials,];
            var __VLS_84;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
            /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
            (props.row.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
            (props.row.code);
            // @ts-ignore
            [];
            var __VLS_78;
            // @ts-ignore
            [];
        }
        {
            var __VLS_87 = __VLS_59.slots["body-cell-contact"];
            var props = __VLS_vSlot(__VLS_87)[0];
            var __VLS_88 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
                props: (props),
            }));
            var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([{
                    props: (props),
                }], __VLS_functionalComponentArgsRest(__VLS_89), false));
            var __VLS_93 = __VLS_91.slots.default;
            if (props.row.contact_name || props.row.phone) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                if (props.row.contact_name) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
                    (props.row.contact_name);
                }
                if (props.row.phone) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
                    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
                    var __VLS_94 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
                    qIcon;
                    // @ts-ignore
                    var __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94(__assign({ name: "phone", size: "xs" }, { class: "q-mr-xs" })));
                    var __VLS_96 = __VLS_95.apply(void 0, __spreadArray([__assign({ name: "phone", size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_95), false));
                    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
                    (props.row.phone);
                }
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
                /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
            }
            // @ts-ignore
            [];
            var __VLS_91;
            // @ts-ignore
            [];
        }
        {
            var __VLS_99 = __VLS_59.slots["body-cell-lead_time_days"];
            var props = __VLS_vSlot(__VLS_99)[0];
            var __VLS_100 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100({
                props: (props),
                align: "center",
            }));
            var __VLS_102 = __VLS_101.apply(void 0, __spreadArray([{
                    props: (props),
                    align: "center",
                }], __VLS_functionalComponentArgsRest(__VLS_101), false));
            var __VLS_105 = __VLS_103.slots.default;
            var __VLS_106 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
                color: "blue-grey",
                outline: true,
            }));
            var __VLS_108 = __VLS_107.apply(void 0, __spreadArray([{
                    color: "blue-grey",
                    outline: true,
                }], __VLS_functionalComponentArgsRest(__VLS_107), false));
            var __VLS_111 = __VLS_109.slots.default;
            (props.row.lead_time_days);
            // @ts-ignore
            [];
            var __VLS_109;
            // @ts-ignore
            [];
            var __VLS_103;
            // @ts-ignore
            [];
        }
        {
            var __VLS_112 = __VLS_59.slots["body-cell-is_active"];
            var props = __VLS_vSlot(__VLS_112)[0];
            var __VLS_113 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_114 = __VLS_asFunctionalComponent1(__VLS_113, new __VLS_113({
                props: (props),
                align: "center",
            }));
            var __VLS_115 = __VLS_114.apply(void 0, __spreadArray([{
                    props: (props),
                    align: "center",
                }], __VLS_functionalComponentArgsRest(__VLS_114), false));
            var __VLS_118 = __VLS_116.slots.default;
            var __VLS_119 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({
                color: (props.row.is_active ? 'positive' : 'negative'),
            }));
            var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([{
                    color: (props.row.is_active ? 'positive' : 'negative'),
                }], __VLS_functionalComponentArgsRest(__VLS_120), false));
            var __VLS_124 = __VLS_122.slots.default;
            (props.row.is_active ? 'Hoạt động' : 'Ngừng');
            // @ts-ignore
            [];
            var __VLS_122;
            // @ts-ignore
            [];
            var __VLS_116;
            // @ts-ignore
            [];
        }
        {
            var __VLS_125 = __VLS_59.slots["body-cell-actions"];
            var props_1 = __VLS_vSlot(__VLS_125)[0];
            var __VLS_126 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126(__assign({ props: (props_1) }, { class: "q-gutter-x-sm" })));
            var __VLS_128 = __VLS_127.apply(void 0, __spreadArray([__assign({ props: (props_1) }, { class: "q-gutter-x-sm" })], __VLS_functionalComponentArgsRest(__VLS_127), false));
            /** @type {__VLS_StyleScopedClasses['q-gutter-x-sm']} */ ;
            var __VLS_131 = __VLS_129.slots.default;
            var __VLS_132 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
            qBtn;
            // @ts-ignore
            var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132(__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "visibility", size: "sm" })));
            var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "visibility", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_133), false));
            var __VLS_137 = void 0;
            var __VLS_138 = ({ click: {} },
                { onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!!(Component_1))
                            return;
                        __VLS_ctx.openDetailDialog(props_1.row);
                        // @ts-ignore
                        [openDetailDialog,];
                    } });
            var __VLS_139 = __VLS_135.slots.default;
            var __VLS_140 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
            qTooltip;
            // @ts-ignore
            var __VLS_141 = __VLS_asFunctionalComponent1(__VLS_140, new __VLS_140({}));
            var __VLS_142 = __VLS_141.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_141), false));
            var __VLS_145 = __VLS_143.slots.default;
            // @ts-ignore
            [];
            var __VLS_143;
            // @ts-ignore
            [];
            var __VLS_135;
            var __VLS_136;
            var __VLS_146 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
            qBtn;
            // @ts-ignore
            var __VLS_147 = __VLS_asFunctionalComponent1(__VLS_146, new __VLS_146(__assign({ 'onClick': {} }, { flat: true, round: true, color: "blue", icon: "edit", size: "sm" })));
            var __VLS_148 = __VLS_147.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "blue", icon: "edit", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_147), false));
            var __VLS_151 = void 0;
            var __VLS_152 = ({ click: {} },
                { onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!!(Component_1))
                            return;
                        __VLS_ctx.openEditDialog(props_1.row);
                        // @ts-ignore
                        [openEditDialog,];
                    } });
            var __VLS_153 = __VLS_149.slots.default;
            var __VLS_154 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
            qTooltip;
            // @ts-ignore
            var __VLS_155 = __VLS_asFunctionalComponent1(__VLS_154, new __VLS_154({}));
            var __VLS_156 = __VLS_155.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_155), false));
            var __VLS_159 = __VLS_157.slots.default;
            // @ts-ignore
            [];
            var __VLS_157;
            // @ts-ignore
            [];
            var __VLS_149;
            var __VLS_150;
            var __VLS_160 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
            qBtn;
            // @ts-ignore
            var __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160(__assign({ 'onClick': {} }, { flat: true, round: true, color: "purple", icon: "palette", size: "sm" })));
            var __VLS_162 = __VLS_161.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "purple", icon: "palette", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_161), false));
            var __VLS_165 = void 0;
            var __VLS_166 = ({ click: {} },
                { onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!!(Component_1))
                            return;
                        __VLS_ctx.router.push("/thread/suppliers/import-colors?supplier_id=".concat(props_1.row.id));
                        // @ts-ignore
                        [router,];
                    } });
            var __VLS_167 = __VLS_163.slots.default;
            var __VLS_168 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
            qTooltip;
            // @ts-ignore
            var __VLS_169 = __VLS_asFunctionalComponent1(__VLS_168, new __VLS_168({}));
            var __VLS_170 = __VLS_169.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_169), false));
            var __VLS_173 = __VLS_171.slots.default;
            // @ts-ignore
            [];
            var __VLS_171;
            // @ts-ignore
            [];
            var __VLS_163;
            var __VLS_164;
            if (props_1.row.is_active) {
                var __VLS_174 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
                qBtn;
                // @ts-ignore
                var __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174(__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "block", size: "sm" })));
                var __VLS_176 = __VLS_175.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "block", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_175), false));
                var __VLS_179 = void 0;
                var __VLS_180 = ({ click: {} },
                    { onClick: function () {
                            var _a = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                _a[_i] = arguments[_i];
                            }
                            var $event = _a[0];
                            if (!!(Component_1))
                                return;
                            if (!(props_1.row.is_active))
                                return;
                            __VLS_ctx.confirmDeactivate(props_1.row);
                            // @ts-ignore
                            [confirmDeactivate,];
                        } });
                var __VLS_181 = __VLS_177.slots.default;
                var __VLS_182 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
                qTooltip;
                // @ts-ignore
                var __VLS_183 = __VLS_asFunctionalComponent1(__VLS_182, new __VLS_182({}));
                var __VLS_184 = __VLS_183.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_183), false));
                var __VLS_187 = __VLS_185.slots.default;
                // @ts-ignore
                [];
                var __VLS_185;
                // @ts-ignore
                [];
                var __VLS_177;
                var __VLS_178;
            }
            else {
                var __VLS_188 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
                qBtn;
                // @ts-ignore
                var __VLS_189 = __VLS_asFunctionalComponent1(__VLS_188, new __VLS_188(__assign({ 'onClick': {} }, { flat: true, round: true, color: "positive", icon: "check_circle", size: "sm" })));
                var __VLS_190 = __VLS_189.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "positive", icon: "check_circle", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_189), false));
                var __VLS_193 = void 0;
                var __VLS_194 = ({ click: {} },
                    { onClick: function () {
                            var _a = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                _a[_i] = arguments[_i];
                            }
                            var $event = _a[0];
                            if (!!(Component_1))
                                return;
                            if (!!(props_1.row.is_active))
                                return;
                            __VLS_ctx.activateSupplier(props_1.row);
                            // @ts-ignore
                            [activateSupplier,];
                        } });
                var __VLS_195 = __VLS_191.slots.default;
                var __VLS_196 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
                qTooltip;
                // @ts-ignore
                var __VLS_197 = __VLS_asFunctionalComponent1(__VLS_196, new __VLS_196({}));
                var __VLS_198 = __VLS_197.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_197), false));
                var __VLS_201 = __VLS_199.slots.default;
                // @ts-ignore
                [];
                var __VLS_199;
                // @ts-ignore
                [];
                var __VLS_191;
                var __VLS_192;
            }
            // @ts-ignore
            [];
            var __VLS_129;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_59;
        var __VLS_202 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
        qDialog;
        // @ts-ignore
        var __VLS_203 = __VLS_asFunctionalComponent1(__VLS_202, new __VLS_202({
            modelValue: (__VLS_ctx.formDialog.isOpen),
            persistent: true,
        }));
        var __VLS_204 = __VLS_203.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.formDialog.isOpen),
                persistent: true,
            }], __VLS_functionalComponentArgsRest(__VLS_203), false));
        var __VLS_207 = __VLS_205.slots.default;
        var __VLS_208 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
        qCard;
        // @ts-ignore
        var __VLS_209 = __VLS_asFunctionalComponent1(__VLS_208, new __VLS_208(__assign({ style: {} })));
        var __VLS_210 = __VLS_209.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_209), false));
        var __VLS_213 = __VLS_211.slots.default;
        var __VLS_214 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
        qCardSection;
        // @ts-ignore
        var __VLS_215 = __VLS_asFunctionalComponent1(__VLS_214, new __VLS_214(__assign({ class: "row items-center q-pb-none" })));
        var __VLS_216 = __VLS_215.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_215), false));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
        var __VLS_219 = __VLS_217.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
        /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
        (__VLS_ctx.formDialog.mode === 'create' ? 'Thêm Nhà Cung Cấp' : 'Chỉnh Sửa Nhà Cung Cấp');
        var __VLS_220 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
        qSpace;
        // @ts-ignore
        var __VLS_221 = __VLS_asFunctionalComponent1(__VLS_220, new __VLS_220({}));
        var __VLS_222 = __VLS_221.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_221), false));
        var __VLS_225 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_226 = __VLS_asFunctionalComponent1(__VLS_225, new __VLS_225({
            icon: "close",
            flat: true,
            round: true,
            dense: true,
        }));
        var __VLS_227 = __VLS_226.apply(void 0, __spreadArray([{
                icon: "close",
                flat: true,
                round: true,
                dense: true,
            }], __VLS_functionalComponentArgsRest(__VLS_226), false));
        __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
        // @ts-ignore
        [formDialog, formDialog, vClosePopup,];
        var __VLS_217;
        var __VLS_230 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
        qCardSection;
        // @ts-ignore
        var __VLS_231 = __VLS_asFunctionalComponent1(__VLS_230, new __VLS_230({}));
        var __VLS_232 = __VLS_231.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_231), false));
        var __VLS_235 = __VLS_233.slots.default;
        var __VLS_236 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qForm | typeof __VLS_components.QForm | typeof __VLS_components.qForm | typeof __VLS_components.QForm} */
        qForm;
        // @ts-ignore
        var __VLS_237 = __VLS_asFunctionalComponent1(__VLS_236, new __VLS_236(__assign({ 'onSubmit': {} }, { class: "row q-col-gutter-md" })));
        var __VLS_238 = __VLS_237.apply(void 0, __spreadArray([__assign({ 'onSubmit': {} }, { class: "row q-col-gutter-md" })], __VLS_functionalComponentArgsRest(__VLS_237), false));
        var __VLS_241 = void 0;
        var __VLS_242 = ({ submit: {} },
            { onSubmit: (__VLS_ctx.handleSubmit) });
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
        var __VLS_243 = __VLS_239.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
        var __VLS_244 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_245 = __VLS_asFunctionalComponent1(__VLS_244, new __VLS_244({
            modelValue: (__VLS_ctx.formData.code),
            label: "Mã nhà cung cấp",
            outlined: true,
            disable: (__VLS_ctx.formDialog.mode === 'edit'),
            rules: ([function (v) { return !!v || 'Vui lòng nhập mã'; }]),
            hint: "Mã định danh duy nhất",
        }));
        var __VLS_246 = __VLS_245.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.formData.code),
                label: "Mã nhà cung cấp",
                outlined: true,
                disable: (__VLS_ctx.formDialog.mode === 'edit'),
                rules: ([function (v) { return !!v || 'Vui lòng nhập mã'; }]),
                hint: "Mã định danh duy nhất",
            }], __VLS_functionalComponentArgsRest(__VLS_245), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
        var __VLS_249 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_250 = __VLS_asFunctionalComponent1(__VLS_249, new __VLS_249({
            modelValue: (__VLS_ctx.formData.name),
            label: "Tên nhà cung cấp",
            outlined: true,
            rules: ([function (v) { return !!v || 'Vui lòng nhập tên'; }]),
        }));
        var __VLS_251 = __VLS_250.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.formData.name),
                label: "Tên nhà cung cấp",
                outlined: true,
                rules: ([function (v) { return !!v || 'Vui lòng nhập tên'; }]),
            }], __VLS_functionalComponentArgsRest(__VLS_250), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
        var __VLS_254 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_255 = __VLS_asFunctionalComponent1(__VLS_254, new __VLS_254({
            modelValue: (__VLS_ctx.formData.contact_name),
            label: "Người liên hệ",
            outlined: true,
        }));
        var __VLS_256 = __VLS_255.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.formData.contact_name),
                label: "Người liên hệ",
                outlined: true,
            }], __VLS_functionalComponentArgsRest(__VLS_255), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
        var __VLS_259 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_260 = __VLS_asFunctionalComponent1(__VLS_259, new __VLS_259({
            modelValue: (__VLS_ctx.formData.phone),
            label: "Số điện thoại",
            outlined: true,
            mask: "#### ### ###",
        }));
        var __VLS_261 = __VLS_260.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.formData.phone),
                label: "Số điện thoại",
                outlined: true,
                mask: "#### ### ###",
            }], __VLS_functionalComponentArgsRest(__VLS_260), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
        var __VLS_264 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_265 = __VLS_asFunctionalComponent1(__VLS_264, new __VLS_264({
            modelValue: (__VLS_ctx.formData.email),
            label: "Email",
            outlined: true,
            type: "email",
        }));
        var __VLS_266 = __VLS_265.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.formData.email),
                label: "Email",
                outlined: true,
                type: "email",
            }], __VLS_functionalComponentArgsRest(__VLS_265), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
        var __VLS_269 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_270 = __VLS_asFunctionalComponent1(__VLS_269, new __VLS_269({
            modelValue: (__VLS_ctx.formData.lead_time_days),
            modelModifiers: { number: true, },
            label: "Thời gian giao hàng (ngày)",
            outlined: true,
            type: "number",
            min: (1),
        }));
        var __VLS_271 = __VLS_270.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.formData.lead_time_days),
                modelModifiers: { number: true, },
                label: "Thời gian giao hàng (ngày)",
                outlined: true,
                type: "number",
                min: (1),
            }], __VLS_functionalComponentArgsRest(__VLS_270), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        var __VLS_274 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_275 = __VLS_asFunctionalComponent1(__VLS_274, new __VLS_274({
            modelValue: (__VLS_ctx.formData.address),
            label: "Địa chỉ",
            outlined: true,
            type: "textarea",
            rows: "2",
        }));
        var __VLS_276 = __VLS_275.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.formData.address),
                label: "Địa chỉ",
                outlined: true,
                type: "textarea",
                rows: "2",
            }], __VLS_functionalComponentArgsRest(__VLS_275), false));
        // @ts-ignore
        [formDialog, handleSubmit, formData, formData, formData, formData, formData, formData, formData,];
        var __VLS_239;
        var __VLS_240;
        // @ts-ignore
        [];
        var __VLS_233;
        var __VLS_279 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
        qCardActions;
        // @ts-ignore
        var __VLS_280 = __VLS_asFunctionalComponent1(__VLS_279, new __VLS_279(__assign({ align: "right" }, { class: "q-px-md q-pb-md" })));
        var __VLS_281 = __VLS_280.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md" })], __VLS_functionalComponentArgsRest(__VLS_280), false));
        /** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
        var __VLS_284 = __VLS_282.slots.default;
        var __VLS_285 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_286 = __VLS_asFunctionalComponent1(__VLS_285, new __VLS_285({
            flat: true,
            label: "Hủy",
            color: "grey",
        }));
        var __VLS_287 = __VLS_286.apply(void 0, __spreadArray([{
                flat: true,
                label: "Hủy",
                color: "grey",
            }], __VLS_functionalComponentArgsRest(__VLS_286), false));
        __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
        var __VLS_290 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_291 = __VLS_asFunctionalComponent1(__VLS_290, new __VLS_290(__assign({ 'onClick': {} }, { unelevated: true, label: (__VLS_ctx.formDialog.mode === 'create' ? 'Tạo' : 'Lưu'), color: "primary", loading: (__VLS_ctx.loading) })));
        var __VLS_292 = __VLS_291.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { unelevated: true, label: (__VLS_ctx.formDialog.mode === 'create' ? 'Tạo' : 'Lưu'), color: "primary", loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_291), false));
        var __VLS_295 = void 0;
        var __VLS_296 = ({ click: {} },
            { onClick: (__VLS_ctx.handleSubmit) });
        var __VLS_293;
        var __VLS_294;
        // @ts-ignore
        [loading, formDialog, vClosePopup, handleSubmit,];
        var __VLS_282;
        // @ts-ignore
        [];
        var __VLS_211;
        // @ts-ignore
        [];
        var __VLS_205;
        var __VLS_297 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
        qDialog;
        // @ts-ignore
        var __VLS_298 = __VLS_asFunctionalComponent1(__VLS_297, new __VLS_297({
            modelValue: (__VLS_ctx.detailDialog.isOpen),
        }));
        var __VLS_299 = __VLS_298.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.detailDialog.isOpen),
            }], __VLS_functionalComponentArgsRest(__VLS_298), false));
        var __VLS_302 = __VLS_300.slots.default;
        if (__VLS_ctx.detailDialog.supplier) {
            var __VLS_303 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
            qCard;
            // @ts-ignore
            var __VLS_304 = __VLS_asFunctionalComponent1(__VLS_303, new __VLS_303(__assign({ style: {} })));
            var __VLS_305 = __VLS_304.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_304), false));
            var __VLS_308 = __VLS_306.slots.default;
            var __VLS_309 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
            qCardSection;
            // @ts-ignore
            var __VLS_310 = __VLS_asFunctionalComponent1(__VLS_309, new __VLS_309(__assign({ class: "row items-center q-pb-none" })));
            var __VLS_311 = __VLS_310.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_310), false));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
            var __VLS_314 = __VLS_312.slots.default;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
            /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
            var __VLS_315 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
            qSpace;
            // @ts-ignore
            var __VLS_316 = __VLS_asFunctionalComponent1(__VLS_315, new __VLS_315({}));
            var __VLS_317 = __VLS_316.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_316), false));
            var __VLS_320 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
            qBtn;
            // @ts-ignore
            var __VLS_321 = __VLS_asFunctionalComponent1(__VLS_320, new __VLS_320({
                icon: "close",
                flat: true,
                round: true,
                dense: true,
            }));
            var __VLS_322 = __VLS_321.apply(void 0, __spreadArray([{
                    icon: "close",
                    flat: true,
                    round: true,
                    dense: true,
                }], __VLS_functionalComponentArgsRest(__VLS_321), false));
            __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
            // @ts-ignore
            [vClosePopup, detailDialog, detailDialog,];
            var __VLS_312;
            var __VLS_325 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
            qCardSection;
            // @ts-ignore
            var __VLS_326 = __VLS_asFunctionalComponent1(__VLS_325, new __VLS_325(__assign({ class: "q-pa-md" })));
            var __VLS_327 = __VLS_326.apply(void 0, __spreadArray([__assign({ class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_326), false));
            /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
            var __VLS_330 = __VLS_328.slots.default;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
            /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
            var __VLS_331 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
            qAvatar;
            // @ts-ignore
            var __VLS_332 = __VLS_asFunctionalComponent1(__VLS_331, new __VLS_331(__assign({ size: "48px", color: "primary", textColor: "white" }, { class: "q-mr-md text-h6 text-weight-bold" })));
            var __VLS_333 = __VLS_332.apply(void 0, __spreadArray([__assign({ size: "48px", color: "primary", textColor: "white" }, { class: "q-mr-md text-h6 text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_332), false));
            /** @type {__VLS_StyleScopedClasses['q-mr-md']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
            var __VLS_336 = __VLS_334.slots.default;
            (__VLS_ctx.getInitials(__VLS_ctx.detailDialog.supplier.name));
            // @ts-ignore
            [getInitials, detailDialog,];
            var __VLS_334;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
            /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
            (__VLS_ctx.detailDialog.supplier.name);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
            (__VLS_ctx.detailDialog.supplier.code);
            var __VLS_337 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
            qSpace;
            // @ts-ignore
            var __VLS_338 = __VLS_asFunctionalComponent1(__VLS_337, new __VLS_337({}));
            var __VLS_339 = __VLS_338.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_338), false));
            var __VLS_342 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_343 = __VLS_asFunctionalComponent1(__VLS_342, new __VLS_342(__assign({ color: (__VLS_ctx.detailDialog.supplier.is_active ? 'positive' : 'negative') }, { class: "q-ml-sm" })));
            var __VLS_344 = __VLS_343.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.detailDialog.supplier.is_active ? 'positive' : 'negative') }, { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_343), false));
            /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
            var __VLS_347 = __VLS_345.slots.default;
            (__VLS_ctx.detailDialog.supplier.is_active ? 'Hoạt động' : 'Ngừng');
            // @ts-ignore
            [detailDialog, detailDialog, detailDialog, detailDialog,];
            var __VLS_345;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
            /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
            /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
            (__VLS_ctx.detailDialog.supplier.contact_name || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
            /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
            /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
            (__VLS_ctx.detailDialog.supplier.phone || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
            /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
            /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
            (__VLS_ctx.detailDialog.supplier.email || '-');
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
            /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
            /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
            (__VLS_ctx.detailDialog.supplier.lead_time_days);
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
            /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
            /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
            (__VLS_ctx.detailDialog.supplier.address || '-');
            // @ts-ignore
            [detailDialog, detailDialog, detailDialog, detailDialog, detailDialog,];
            var __VLS_328;
            var __VLS_348 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
            qSeparator;
            // @ts-ignore
            var __VLS_349 = __VLS_asFunctionalComponent1(__VLS_348, new __VLS_348({}));
            var __VLS_350 = __VLS_349.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_349), false));
            var __VLS_353 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
            qCardSection;
            // @ts-ignore
            var __VLS_354 = __VLS_asFunctionalComponent1(__VLS_353, new __VLS_353(__assign({ class: "q-pa-md" })));
            var __VLS_355 = __VLS_354.apply(void 0, __spreadArray([__assign({ class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_354), false));
            /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
            var __VLS_358 = __VLS_356.slots.default;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-weight-bold q-mb-sm" }));
            /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
            if (!__VLS_ctx.loadingThreadTypes) {
                var __VLS_359 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
                qBadge;
                // @ts-ignore
                var __VLS_360 = __VLS_asFunctionalComponent1(__VLS_359, new __VLS_359(__assign({ color: "primary" }, { class: "q-ml-sm" })));
                var __VLS_361 = __VLS_360.apply(void 0, __spreadArray([__assign({ color: "primary" }, { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_360), false));
                /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
                var __VLS_364 = __VLS_362.slots.default;
                (__VLS_ctx.supplierThreadTypes.length);
                // @ts-ignore
                [loadingThreadTypes, supplierThreadTypes,];
                var __VLS_362;
            }
            if (__VLS_ctx.loadingThreadTypes) {
                var __VLS_365 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress} */
                qLinearProgress;
                // @ts-ignore
                var __VLS_366 = __VLS_asFunctionalComponent1(__VLS_365, new __VLS_365(__assign({ indeterminate: true, color: "primary" }, { class: "q-mb-sm" })));
                var __VLS_367 = __VLS_366.apply(void 0, __spreadArray([__assign({ indeterminate: true, color: "primary" }, { class: "q-mb-sm" })], __VLS_functionalComponentArgsRest(__VLS_366), false));
                /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
            }
            else if (__VLS_ctx.supplierThreadTypes.length === 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6 text-center q-py-sm" }));
                /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['q-py-sm']} */ ;
            }
            else {
                var __VLS_370 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
                qList;
                // @ts-ignore
                var __VLS_371 = __VLS_asFunctionalComponent1(__VLS_370, new __VLS_370(__assign(__assign({ dense: true, separator: true }, { class: "rounded-borders" }), { style: {} })));
                var __VLS_372 = __VLS_371.apply(void 0, __spreadArray([__assign(__assign({ dense: true, separator: true }, { class: "rounded-borders" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_371), false));
                /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
                var __VLS_375 = __VLS_373.slots.default;
                for (var _i = 0, _b = __VLS_vFor((__VLS_ctx.supplierThreadTypes)); _i < _b.length; _i++) {
                    var tex = _b[_i][0];
                    var __VLS_376 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
                    qItem;
                    // @ts-ignore
                    var __VLS_377 = __VLS_asFunctionalComponent1(__VLS_376, new __VLS_376({
                        key: (tex.id),
                    }));
                    var __VLS_378 = __VLS_377.apply(void 0, __spreadArray([{
                            key: (tex.id),
                        }], __VLS_functionalComponentArgsRest(__VLS_377), false));
                    var __VLS_381 = __VLS_379.slots.default;
                    var __VLS_382 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
                    qItemSection;
                    // @ts-ignore
                    var __VLS_383 = __VLS_asFunctionalComponent1(__VLS_382, new __VLS_382({}));
                    var __VLS_384 = __VLS_383.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_383), false));
                    var __VLS_387 = __VLS_385.slots.default;
                    var __VLS_388 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
                    qItemLabel;
                    // @ts-ignore
                    var __VLS_389 = __VLS_asFunctionalComponent1(__VLS_388, new __VLS_388({}));
                    var __VLS_390 = __VLS_389.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_389), false));
                    var __VLS_393 = __VLS_391.slots.default;
                    (tex.tex_label || tex.name || '-');
                    // @ts-ignore
                    [loadingThreadTypes, supplierThreadTypes, supplierThreadTypes,];
                    var __VLS_391;
                    var __VLS_394 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
                    qItemLabel;
                    // @ts-ignore
                    var __VLS_395 = __VLS_asFunctionalComponent1(__VLS_394, new __VLS_394({
                        caption: true,
                    }));
                    var __VLS_396 = __VLS_395.apply(void 0, __spreadArray([{
                            caption: true,
                        }], __VLS_functionalComponentArgsRest(__VLS_395), false));
                    var __VLS_399 = __VLS_397.slots.default;
                    (tex.code);
                    if (tex.supplier_item_code) {
                        (tex.supplier_item_code);
                    }
                    // @ts-ignore
                    [];
                    var __VLS_397;
                    // @ts-ignore
                    [];
                    var __VLS_385;
                    if (tex.unit_price) {
                        var __VLS_400 = void 0;
                        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
                        qItemSection;
                        // @ts-ignore
                        var __VLS_401 = __VLS_asFunctionalComponent1(__VLS_400, new __VLS_400({
                            side: true,
                        }));
                        var __VLS_402 = __VLS_401.apply(void 0, __spreadArray([{
                                side: true,
                            }], __VLS_functionalComponentArgsRest(__VLS_401), false));
                        var __VLS_405 = __VLS_403.slots.default;
                        var __VLS_406 = void 0;
                        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
                        qItemLabel;
                        // @ts-ignore
                        var __VLS_407 = __VLS_asFunctionalComponent1(__VLS_406, new __VLS_406({
                            caption: true,
                        }));
                        var __VLS_408 = __VLS_407.apply(void 0, __spreadArray([{
                                caption: true,
                            }], __VLS_functionalComponentArgsRest(__VLS_407), false));
                        var __VLS_411 = __VLS_409.slots.default;
                        (new Intl.NumberFormat('vi-VN').format(tex.unit_price));
                        // @ts-ignore
                        [];
                        var __VLS_409;
                        // @ts-ignore
                        [];
                        var __VLS_403;
                    }
                    // @ts-ignore
                    [];
                    var __VLS_379;
                    // @ts-ignore
                    [];
                }
                // @ts-ignore
                [];
                var __VLS_373;
            }
            // @ts-ignore
            [];
            var __VLS_356;
            var __VLS_412 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
            qCardActions;
            // @ts-ignore
            var __VLS_413 = __VLS_asFunctionalComponent1(__VLS_412, new __VLS_412(__assign({ align: "right" }, { class: "q-px-md q-pb-md" })));
            var __VLS_414 = __VLS_413.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md" })], __VLS_functionalComponentArgsRest(__VLS_413), false));
            /** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
            var __VLS_417 = __VLS_415.slots.default;
            var __VLS_418 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
            qBtn;
            // @ts-ignore
            var __VLS_419 = __VLS_asFunctionalComponent1(__VLS_418, new __VLS_418(__assign({ 'onClick': {} }, { flat: true, label: "Chỉnh sửa", color: "primary", icon: "edit" })));
            var __VLS_420 = __VLS_419.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Chỉnh sửa", color: "primary", icon: "edit" })], __VLS_functionalComponentArgsRest(__VLS_419), false));
            var __VLS_423 = void 0;
            var __VLS_424 = ({ click: {} },
                { onClick: (__VLS_ctx.editFromDetail) });
            var __VLS_421;
            var __VLS_422;
            var __VLS_425 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
            qBtn;
            // @ts-ignore
            var __VLS_426 = __VLS_asFunctionalComponent1(__VLS_425, new __VLS_425({
                unelevated: true,
                label: "Đóng",
                color: "grey",
            }));
            var __VLS_427 = __VLS_426.apply(void 0, __spreadArray([{
                    unelevated: true,
                    label: "Đóng",
                    color: "grey",
                }], __VLS_functionalComponentArgsRest(__VLS_426), false));
            __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
            // @ts-ignore
            [vClosePopup, editFromDetail,];
            var __VLS_415;
            // @ts-ignore
            [];
            var __VLS_306;
        }
        // @ts-ignore
        [];
        var __VLS_300;
        // @ts-ignore
        [];
        var __VLS_15;
    }
    // @ts-ignore
    [];
    __VLS_3.slots['' /* empty slot name completion */];
}
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
