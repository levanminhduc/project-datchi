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
var useStyles_1 = require("@/composables/thread/useStyles");
var useConfirm_1 = require("@/composables/useConfirm");
var subArtService_1 = require("@/services/subArtService");
definePage({
    meta: {
        requiresAuth: true,
    }
});
// Router
var router = (0, vue_router_1.useRouter)();
// Composables
var _a = (0, useStyles_1.useStyles)(), styles = _a.styles, isLoading = _a.isLoading, fetchStyles = _a.fetchStyles, createStyle = _a.createStyle, updateStyle = _a.updateStyle, deleteStyle = _a.deleteStyle;
var confirm = (0, useConfirm_1.useConfirm)().confirm;
// State
var searchQuery = (0, vue_1.ref)('');
var filterSubArtCode = (0, vue_1.ref)(null);
var subArtCodeOptions = (0, vue_1.ref)([]);
var filteredSubArtOptions = (0, vue_1.ref)([]);
var loadingSubArtCodes = (0, vue_1.ref)(false);
var pagination = (0, vue_1.ref)({
    page: 1,
    rowsPerPage: 25,
    sortBy: 'style_code',
    descending: false,
});
// Table columns
var columns = [
    { name: 'style_code', label: 'Mã hàng', field: 'style_code', align: 'left', sortable: true },
    { name: 'style_name', label: 'Tên mã hàng', field: 'style_name', align: 'left', sortable: true },
    { name: 'description', label: 'Mô tả', field: 'description', align: 'left' },
    { name: 'created_at', label: 'Ngày tạo', field: 'created_at', align: 'left', sortable: true },
    { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' },
];
// Helpers
function getInitials(code) {
    if (!code)
        return '?';
    return code.substring(0, 2).toUpperCase();
}
function formatDate(dateStr) {
    if (!dateStr)
        return '-';
    var date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}
// Computed
var filteredStyles = (0, vue_1.computed)(function () {
    if (!searchQuery.value.trim())
        return styles.value;
    var query = searchQuery.value.toLowerCase().trim();
    return styles.value.filter(function (s) {
        var _a;
        return s.style_code.toLowerCase().includes(query) ||
            s.style_name.toLowerCase().includes(query) ||
            ((_a = s.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(query));
    });
});
// Watchers
(0, vue_1.watch)(searchQuery, function () {
    pagination.value.page = 1;
});
(0, vue_1.watch)(filterSubArtCode, function (code) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pagination.value.page = 1;
                if (!code) return [3 /*break*/, 2];
                return [4 /*yield*/, fetchStyles({ sub_art_code: code })];
            case 1:
                _a.sent();
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, fetchStyles()];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
function handleSubArtFilter(val, update) {
    update(function () {
        if (!val) {
            filteredSubArtOptions.value = subArtCodeOptions.value;
            return;
        }
        var needle = val.toLowerCase();
        filteredSubArtOptions.value = subArtCodeOptions.value.filter(function (c) { return c.toLowerCase().includes(needle); });
    });
}
function loadSubArtCodes() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    loadingSubArtCodes.value = true;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    _a = subArtCodeOptions;
                    return [4 /*yield*/, subArtService_1.subArtService.getAllCodes()];
                case 2:
                    _a.value = _c.sent();
                    filteredSubArtOptions.value = subArtCodeOptions.value;
                    return [3 /*break*/, 5];
                case 3:
                    _b = _c.sent();
                    subArtCodeOptions.value = [];
                    return [3 /*break*/, 5];
                case 4:
                    loadingSubArtCodes.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Dialog states
var formDialog = (0, vue_1.reactive)({
    isOpen: false,
    mode: 'create',
    id: null,
});
var defaultFormData = {
    style_code: '',
    style_name: '',
    fabric_type: '',
    description: '',
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
function openEditDialog(style) {
    if (!style) {
        console.error('[styles] openEditDialog: style is null or undefined');
        return;
    }
    formDialog.mode = 'edit';
    formDialog.id = style.id;
    Object.assign(formData, {
        style_code: style.style_code || '',
        style_name: style.style_name || '',
        fabric_type: style.fabric_type || '',
        description: style.description || '',
    });
    formDialog.isOpen = true;
}
function viewStyle(id) {
    router.push("/thread/styles/".concat(id));
}
function handleSubmit() {
    return __awaiter(this, void 0, void 0, function () {
        var data, result;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!formData.style_code.trim() || !formData.style_name.trim()) {
                        return [2 /*return*/];
                    }
                    data = {
                        style_code: formData.style_code.trim().toUpperCase(),
                        style_name: formData.style_name.trim(),
                        fabric_type: ((_a = formData.fabric_type) === null || _a === void 0 ? void 0 : _a.trim()) || undefined,
                        description: ((_b = formData.description) === null || _b === void 0 ? void 0 : _b.trim()) || undefined,
                    };
                    result = null;
                    if (!(formDialog.mode === 'create')) return [3 /*break*/, 2];
                    return [4 /*yield*/, createStyle(data)];
                case 1:
                    result = _c.sent();
                    return [3 /*break*/, 4];
                case 2:
                    if (!formDialog.id) return [3 /*break*/, 4];
                    return [4 /*yield*/, updateStyle(formDialog.id, data)];
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
function confirmDelete(style) {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirm({
                        title: "X\u00F3a m\u00E3 h\u00E0ng \"".concat(style.style_code, "\"?"),
                        message: 'Mã hàng và tất cả định mức chỉ liên quan sẽ bị xóa. Thao tác này không thể hoàn tác.',
                        ok: 'Xóa',
                        type: 'warning',
                    })];
                case 1:
                    confirmed = _a.sent();
                    if (!confirmed) return [3 /*break*/, 3];
                    return [4 /*yield*/, deleteStyle(style.id)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([fetchStyles(), loadSubArtCodes()])];
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
    placeholder: "Tìm mã hàng, tên...",
    outlined: true,
    dense: true,
    clearable: true,
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.searchQuery),
        placeholder: "Tìm mã hàng, tên...",
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
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect | typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ 'onFilter': {} }, { modelValue: (__VLS_ctx.filterSubArtCode), options: (__VLS_ctx.filteredSubArtOptions), label: "Sub-Art", outlined: true, dense: true, clearable: true, useInput: true, inputDebounce: "200", loading: (__VLS_ctx.loadingSubArtCodes) })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ 'onFilter': {} }, { modelValue: (__VLS_ctx.filterSubArtCode), options: (__VLS_ctx.filteredSubArtOptions), label: "Sub-Art", outlined: true, dense: true, clearable: true, useInput: true, inputDebounce: "200", loading: (__VLS_ctx.loadingSubArtCodes) })], __VLS_functionalComponentArgsRest(__VLS_20), false));
var __VLS_24;
var __VLS_25 = ({ filter: {} },
    { onFilter: (__VLS_ctx.handleSubArtFilter) });
var __VLS_26 = __VLS_22.slots.default;
{
    var __VLS_27 = __VLS_22.slots["no-option"];
    var __VLS_28 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({}));
    var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_29), false));
    var __VLS_33 = __VLS_31.slots.default;
    var __VLS_34 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34(__assign({ class: "text-grey" })));
    var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_35), false));
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    var __VLS_39 = __VLS_37.slots.default;
    // @ts-ignore
    [filterSubArtCode, filteredSubArtOptions, loadingSubArtCodes, handleSubArtFilter,];
    var __VLS_37;
    // @ts-ignore
    [];
    var __VLS_31;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_22;
var __VLS_23;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
var __VLS_40;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm mã hàng", unelevated: true }), { class: "full-width-xs" })));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm mã hàng", unelevated: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_41), false));
var __VLS_45;
var __VLS_46 = ({ click: {} },
    { onClick: (__VLS_ctx.openAddDialog) });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_43;
var __VLS_44;
var __VLS_47;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47(__assign({ pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.filteredStyles), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.isLoading), rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "styles-table shadow-1" })));
var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([__assign({ pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.filteredStyles), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.isLoading), rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "styles-table shadow-1" })], __VLS_functionalComponentArgsRest(__VLS_48), false));
/** @type {__VLS_StyleScopedClasses['styles-table']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
var __VLS_52 = __VLS_50.slots.default;
{
    var __VLS_53 = __VLS_50.slots.loading;
    var __VLS_54 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
    qInnerLoading;
    // @ts-ignore
    var __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
        showing: true,
    }));
    var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([{
            showing: true,
        }], __VLS_functionalComponentArgsRest(__VLS_55), false));
    var __VLS_59 = __VLS_57.slots.default;
    var __VLS_60 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
        size: "50px",
        color: "primary",
    }));
    var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([{
            size: "50px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_61), false));
    // @ts-ignore
    [openAddDialog, pagination, filteredStyles, columns, isLoading,];
    var __VLS_57;
    // @ts-ignore
    [];
}
{
    var __VLS_65 = __VLS_50.slots["body-cell-style_code"];
    var props = __VLS_vSlot(__VLS_65)[0];
    var __VLS_66 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
        props: (props),
    }));
    var __VLS_68 = __VLS_67.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_67), false));
    var __VLS_71 = __VLS_69.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    var __VLS_72 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
    qAvatar;
    // @ts-ignore
    var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72(__assign({ size: "32px", color: "primary", textColor: "white" }, { class: "q-mr-sm text-weight-bold" })));
    var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([__assign({ size: "32px", color: "primary", textColor: "white" }, { class: "q-mr-sm text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_73), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    var __VLS_77 = __VLS_75.slots.default;
    (__VLS_ctx.getInitials(props.row.style_code));
    // @ts-ignore
    [getInitials,];
    var __VLS_75;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (props.row.style_code);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    (props.row.style_name);
    // @ts-ignore
    [];
    var __VLS_69;
    // @ts-ignore
    [];
}
{
    var __VLS_78 = __VLS_50.slots["body-cell-description"];
    var props = __VLS_vSlot(__VLS_78)[0];
    var __VLS_79 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
        props: (props),
    }));
    var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_80), false));
    var __VLS_84 = __VLS_82.slots.default;
    if (props.row.description) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "ellipsis" }, { style: {} }));
        /** @type {__VLS_StyleScopedClasses['ellipsis']} */ ;
        (props.row.description);
        if (props.row.description.length > 30) {
            var __VLS_85 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
            qTooltip;
            // @ts-ignore
            var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({}));
            var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_86), false));
            var __VLS_90 = __VLS_88.slots.default;
            (props.row.description);
            // @ts-ignore
            [];
            var __VLS_88;
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
        /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
    }
    // @ts-ignore
    [];
    var __VLS_82;
    // @ts-ignore
    [];
}
{
    var __VLS_91 = __VLS_50.slots["body-cell-created_at"];
    var props = __VLS_vSlot(__VLS_91)[0];
    var __VLS_92 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
        props: (props),
    }));
    var __VLS_94 = __VLS_93.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_93), false));
    var __VLS_97 = __VLS_95.slots.default;
    (__VLS_ctx.formatDate(props.row.created_at));
    // @ts-ignore
    [formatDate,];
    var __VLS_95;
    // @ts-ignore
    [];
}
{
    var __VLS_98 = __VLS_50.slots["body-cell-actions"];
    var props_1 = __VLS_vSlot(__VLS_98)[0];
    var __VLS_99 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99(__assign({ props: (props_1) }, { class: "q-gutter-x-sm" })));
    var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([__assign({ props: (props_1) }, { class: "q-gutter-x-sm" })], __VLS_functionalComponentArgsRest(__VLS_100), false));
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-sm']} */ ;
    var __VLS_104 = __VLS_102.slots.default;
    var __VLS_105 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "visibility", size: "sm" })));
    var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "visibility", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
    var __VLS_110 = void 0;
    var __VLS_111 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.viewStyle(props_1.row.id);
                // @ts-ignore
                [viewStyle,];
            } });
    var __VLS_112 = __VLS_108.slots.default;
    var __VLS_113 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_114 = __VLS_asFunctionalComponent1(__VLS_113, new __VLS_113({}));
    var __VLS_115 = __VLS_114.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_114), false));
    var __VLS_118 = __VLS_116.slots.default;
    // @ts-ignore
    [];
    var __VLS_116;
    // @ts-ignore
    [];
    var __VLS_108;
    var __VLS_109;
    var __VLS_119 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119(__assign({ 'onClick': {} }, { flat: true, round: true, color: "blue", icon: "edit", size: "sm" })));
    var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "blue", icon: "edit", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_120), false));
    var __VLS_124 = void 0;
    var __VLS_125 = ({ click: {} },
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
    var __VLS_126 = __VLS_122.slots.default;
    var __VLS_127 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_128 = __VLS_asFunctionalComponent1(__VLS_127, new __VLS_127({}));
    var __VLS_129 = __VLS_128.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_128), false));
    var __VLS_132 = __VLS_130.slots.default;
    // @ts-ignore
    [];
    var __VLS_130;
    // @ts-ignore
    [];
    var __VLS_122;
    var __VLS_123;
    var __VLS_133 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_134 = __VLS_asFunctionalComponent1(__VLS_133, new __VLS_133(__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "delete", size: "sm" })));
    var __VLS_135 = __VLS_134.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "delete", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_134), false));
    var __VLS_138 = void 0;
    var __VLS_139 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.confirmDelete(props_1.row);
                // @ts-ignore
                [confirmDelete,];
            } });
    var __VLS_140 = __VLS_136.slots.default;
    var __VLS_141 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_142 = __VLS_asFunctionalComponent1(__VLS_141, new __VLS_141({}));
    var __VLS_143 = __VLS_142.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_142), false));
    var __VLS_146 = __VLS_144.slots.default;
    // @ts-ignore
    [];
    var __VLS_144;
    // @ts-ignore
    [];
    var __VLS_136;
    var __VLS_137;
    // @ts-ignore
    [];
    var __VLS_102;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_50;
var __VLS_147;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({
    modelValue: (__VLS_ctx.formDialog.isOpen),
    persistent: true,
}));
var __VLS_149 = __VLS_148.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formDialog.isOpen),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_148), false));
var __VLS_152 = __VLS_150.slots.default;
var __VLS_153;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_154 = __VLS_asFunctionalComponent1(__VLS_153, new __VLS_153(__assign({ style: {} })));
var __VLS_155 = __VLS_154.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_154), false));
var __VLS_158 = __VLS_156.slots.default;
var __VLS_159;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_160 = __VLS_asFunctionalComponent1(__VLS_159, new __VLS_159(__assign({ class: "row items-center q-pb-none" })));
var __VLS_161 = __VLS_160.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_160), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_164 = __VLS_162.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
(__VLS_ctx.formDialog.mode === 'create' ? 'Thêm Mã Hàng' : 'Chỉnh Sửa Mã Hàng');
var __VLS_165;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165({}));
var __VLS_167 = __VLS_166.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_166), false));
var __VLS_170;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_171 = __VLS_asFunctionalComponent1(__VLS_170, new __VLS_170({
    icon: "close",
    flat: true,
    round: true,
    dense: true,
}));
var __VLS_172 = __VLS_171.apply(void 0, __spreadArray([{
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_171), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[formDialog, formDialog, vClosePopup,];
var __VLS_162;
var __VLS_175;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_176 = __VLS_asFunctionalComponent1(__VLS_175, new __VLS_175({}));
var __VLS_177 = __VLS_176.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_176), false));
var __VLS_180 = __VLS_178.slots.default;
var __VLS_181;
/** @ts-ignore @type {typeof __VLS_components.qForm | typeof __VLS_components.QForm | typeof __VLS_components.qForm | typeof __VLS_components.QForm} */
qForm;
// @ts-ignore
var __VLS_182 = __VLS_asFunctionalComponent1(__VLS_181, new __VLS_181(__assign({ 'onSubmit': {} }, { class: "row q-col-gutter-md" })));
var __VLS_183 = __VLS_182.apply(void 0, __spreadArray([__assign({ 'onSubmit': {} }, { class: "row q-col-gutter-md" })], __VLS_functionalComponentArgsRest(__VLS_182), false));
var __VLS_186;
var __VLS_187 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleSubmit) });
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
var __VLS_188 = __VLS_184.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_189;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_190 = __VLS_asFunctionalComponent1(__VLS_189, new __VLS_189({
    modelValue: (__VLS_ctx.formData.style_code),
    label: "Mã hàng",
    outlined: true,
    disable: (__VLS_ctx.formDialog.mode === 'edit'),
    rules: ([function (v) { return !!v || 'Vui lòng nhập mã hàng'; }]),
    hint: "Mã định danh duy nhất",
}));
var __VLS_191 = __VLS_190.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.style_code),
        label: "Mã hàng",
        outlined: true,
        disable: (__VLS_ctx.formDialog.mode === 'edit'),
        rules: ([function (v) { return !!v || 'Vui lòng nhập mã hàng'; }]),
        hint: "Mã định danh duy nhất",
    }], __VLS_functionalComponentArgsRest(__VLS_190), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_194;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_195 = __VLS_asFunctionalComponent1(__VLS_194, new __VLS_194({
    modelValue: (__VLS_ctx.formData.style_name),
    label: "Tên mã hàng",
    outlined: true,
    rules: ([function (v) { return !!v || 'Vui lòng nhập tên'; }]),
}));
var __VLS_196 = __VLS_195.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.style_name),
        label: "Tên mã hàng",
        outlined: true,
        rules: ([function (v) { return !!v || 'Vui lòng nhập tên'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_195), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_199;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_200 = __VLS_asFunctionalComponent1(__VLS_199, new __VLS_199({
    modelValue: (__VLS_ctx.formData.fabric_type),
    label: "Loại vải",
    outlined: true,
}));
var __VLS_201 = __VLS_200.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.fabric_type),
        label: "Loại vải",
        outlined: true,
    }], __VLS_functionalComponentArgsRest(__VLS_200), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_204;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_205 = __VLS_asFunctionalComponent1(__VLS_204, new __VLS_204({
    modelValue: (__VLS_ctx.formData.description),
    label: "Mô tả",
    outlined: true,
    type: "textarea",
    rows: "2",
}));
var __VLS_206 = __VLS_205.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.formData.description),
        label: "Mô tả",
        outlined: true,
        type: "textarea",
        rows: "2",
    }], __VLS_functionalComponentArgsRest(__VLS_205), false));
// @ts-ignore
[formDialog, handleSubmit, formData, formData, formData, formData,];
var __VLS_184;
var __VLS_185;
// @ts-ignore
[];
var __VLS_178;
var __VLS_209;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_210 = __VLS_asFunctionalComponent1(__VLS_209, new __VLS_209(__assign({ align: "right" }, { class: "q-px-md q-pb-md" })));
var __VLS_211 = __VLS_210.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md" })], __VLS_functionalComponentArgsRest(__VLS_210), false));
/** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
var __VLS_214 = __VLS_212.slots.default;
var __VLS_215;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_216 = __VLS_asFunctionalComponent1(__VLS_215, new __VLS_215({
    flat: true,
    label: "Hủy",
    color: "grey",
}));
var __VLS_217 = __VLS_216.apply(void 0, __spreadArray([{
        flat: true,
        label: "Hủy",
        color: "grey",
    }], __VLS_functionalComponentArgsRest(__VLS_216), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_220;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_221 = __VLS_asFunctionalComponent1(__VLS_220, new __VLS_220(__assign({ 'onClick': {} }, { unelevated: true, label: (__VLS_ctx.formDialog.mode === 'create' ? 'Tạo' : 'Lưu'), color: "primary", loading: (__VLS_ctx.isLoading) })));
var __VLS_222 = __VLS_221.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { unelevated: true, label: (__VLS_ctx.formDialog.mode === 'create' ? 'Tạo' : 'Lưu'), color: "primary", loading: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_221), false));
var __VLS_225;
var __VLS_226 = ({ click: {} },
    { onClick: (__VLS_ctx.handleSubmit) });
var __VLS_223;
var __VLS_224;
// @ts-ignore
[isLoading, formDialog, vClosePopup, handleSubmit,];
var __VLS_212;
// @ts-ignore
[];
var __VLS_156;
// @ts-ignore
[];
var __VLS_150;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
