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
var useLots_1 = require("@/composables/useLots");
var useConfirm_1 = require("@/composables/useConfirm");
var warehouseService_1 = require("@/services/warehouseService");
var LotStatusBadge_vue_1 = require("@/components/thread/LotStatusBadge.vue");
var LotFormDialog_vue_1 = require("@/components/thread/LotFormDialog.vue");
var SearchInput_vue_1 = require("@/components/ui/inputs/SearchInput.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var SupplierSelector_vue_1 = require("@/components/ui/inputs/SupplierSelector.vue");
var router = (0, vue_router_1.useRouter)();
var _e = (0, useLots_1.useLots)(), lots = _e.lots, loading = _e.loading, fetchLots = _e.fetchLots, doQuarantine = _e.quarantineLot, doRelease = _e.releaseLot;
var confirm = (0, useConfirm_1.useConfirm)().confirm;
// State
var searchQuery = (0, vue_1.ref)('');
var showCreateDialog = (0, vue_1.ref)(false);
var selectedLot = (0, vue_1.ref)(null);
var warehouseOptions = (0, vue_1.ref)([]);
var filters = (0, vue_1.ref)({
    status: undefined,
    warehouse_id: undefined,
    supplier_id: undefined
});
var pagination = (0, vue_1.ref)({
    page: 1,
    rowsPerPage: 25,
    rowsNumber: 0
});
// Status options
var statusOptions = [
    { label: 'Đang hoạt động', value: 'ACTIVE' },
    { label: 'Đã hết', value: 'DEPLETED' },
    { label: 'Hết hạn', value: 'EXPIRED' },
    { label: 'Cách ly', value: 'QUARANTINE' }
];
// Table columns
var columns = [
    { name: 'lot_number', label: 'Mã Lô', field: 'lot_number', align: 'left', sortable: true },
    { name: 'thread_type', label: 'Loại Chỉ', field: 'thread_type', align: 'left' },
    { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' },
    { name: 'cones', label: 'Cuộn (Còn/Tổng)', field: 'available_cones', align: 'center' },
    { name: 'warehouse', label: 'Kho', field: 'warehouse', align: 'left' },
    { name: 'supplier', label: 'Nhà Cung Cấp', field: function (row) { var _a; return ((_a = row.supplier_data) === null || _a === void 0 ? void 0 : _a.name) || '-'; }, align: 'left' },
    { name: 'expiry_date', label: 'Hết Hạn', field: 'expiry_date', align: 'center' },
    { name: 'actions', label: 'Thao Tác', field: 'actions', align: 'center' }
];
// Helpers
/**
 * Get initials from supplier name for avatar display
 */
function getSupplierInitials(name) {
    if (!name)
        return '?';
    var words = name.trim().split(/\s+/);
    if (words.length >= 2 && words[0] && words[1]) {
        return ((words[0][0] || '') + (words[1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}
function formatDate(date) {
    if (!date)
        return '-';
    return new Date(date).toLocaleDateString('vi-VN');
}
function isExpiringSoon(date) {
    if (!date)
        return false;
    var expiry = new Date(date);
    var now = new Date();
    var diff = expiry.getTime() - now.getTime();
    var days = diff / (1000 * 60 * 60 * 24);
    return days <= 30 && days > 0;
}
// Actions
function loadData() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchLots(__assign(__assign({}, filters.value), { search: searchQuery.value || undefined }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleSearch() {
    pagination.value.page = 1;
    loadData();
}
function handleFilterChange() {
    pagination.value.page = 1;
    loadData();
}
function onRequest() {
    loadData();
}
function viewLot(lot) {
    router.push("/thread/lots/".concat(lot.id));
}
function editLot(lot) {
    selectedLot.value = lot;
    showCreateDialog.value = true;
}
function quarantineLot(lot) {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirm({
                        title: "C\u00E1ch ly l\u00F4 ".concat(lot.lot_number, "?"),
                        message: 'Tất cả cuộn trong lô sẽ không khả dụng cho đến khi giải phóng.',
                        ok: 'Cách ly',
                        type: 'warning'
                    })];
                case 1:
                    confirmed = _a.sent();
                    if (!confirmed) return [3 /*break*/, 3];
                    return [4 /*yield*/, doQuarantine(lot.id)];
                case 2:
                    _a.sent();
                    loadData();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function releaseLot(lot) {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirm({
                        title: "Gi\u1EA3i ph\u00F3ng l\u00F4 ".concat(lot.lot_number, "?"),
                        message: 'Các cuộn trong lô sẽ khả dụng trở lại.',
                        ok: 'Giải phóng',
                        type: 'success'
                    })];
                case 1:
                    confirmed = _a.sent();
                    if (!confirmed) return [3 /*break*/, 3];
                    return [4 /*yield*/, doRelease(lot.id)];
                case 2:
                    _a.sent();
                    loadData();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function onLotSaved() {
    showCreateDialog.value = false;
    selectedLot.value = null;
    loadData();
}
// Load warehouses
function loadWarehouses() {
    return __awaiter(this, void 0, void 0, function () {
        var warehouses;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, warehouseService_1.warehouseService.getStorageOnly()];
                case 1:
                    warehouses = _a.sent();
                    warehouseOptions.value = warehouses.map(function (w) { return ({
                        label: w.name,
                        value: w.id
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.onMounted)(function () {
    loadData();
    loadWarehouses();
});
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['lots-table']} */ ;
/** @type {__VLS_StyleScopedClasses['lots-table']} */ ;
/** @type {__VLS_StyleScopedClasses['lots-table']} */ ;
/** @type {__VLS_StyleScopedClasses['lots-table']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h5 q-my-none text-weight-bold text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-10" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-10']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm justify-end" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_7 = SearchInput_vue_1.default;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.searchQuery), placeholder: "Tìm mã lô..." })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.searchQuery), placeholder: "Tìm mã lô..." })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
var __VLS_13 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleSearch) });
var __VLS_10;
var __VLS_11;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_14 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.status), options: (__VLS_ctx.statusOptions), label: "Trạng thái", dense: true, clearable: true })));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.status), options: (__VLS_ctx.statusOptions), label: "Trạng thái", dense: true, clearable: true })], __VLS_functionalComponentArgsRest(__VLS_15), false));
var __VLS_19;
var __VLS_20 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
var __VLS_17;
var __VLS_18;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_21 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.warehouse_id), options: (__VLS_ctx.warehouseOptions), label: "Kho", dense: true, clearable: true, useInput: true, fillInput: true, hideSelected: true })));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.warehouse_id), options: (__VLS_ctx.warehouseOptions), label: "Kho", dense: true, clearable: true, useInput: true, fillInput: true, hideSelected: true })], __VLS_functionalComponentArgsRest(__VLS_22), false));
var __VLS_26;
var __VLS_27 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
var __VLS_24;
var __VLS_25;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_28 = SupplierSelector_vue_1.default;
// @ts-ignore
var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.supplier_id), label: "Nhà cung cấp", dense: true, clearable: true, activeOnly: (true) })));
var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.supplier_id), label: "Nhà cung cấp", dense: true, clearable: true, activeOnly: (true) })], __VLS_functionalComponentArgsRest(__VLS_29), false));
var __VLS_33;
var __VLS_34 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
var __VLS_31;
var __VLS_32;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
var __VLS_35;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Tạo Lô", unelevated: true }), { class: "full-width-xs" })));
var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Tạo Lô", unelevated: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_36), false));
var __VLS_40;
var __VLS_41 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showCreateDialog = true;
            // @ts-ignore
            [searchQuery, handleSearch, filters, filters, filters, statusOptions, handleFilterChange, handleFilterChange, handleFilterChange, warehouseOptions, showCreateDialog,];
        } });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_38;
var __VLS_39;
var __VLS_42;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42(__assign(__assign({ 'onRequest': {} }, { pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.lots), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.loading), rowKey: "id", rowsPerPageOptions: ([10, 25, 50]) }), { class: "lots-table" })));
var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([__assign(__assign({ 'onRequest': {} }, { pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.lots), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.loading), rowKey: "id", rowsPerPageOptions: ([10, 25, 50]) }), { class: "lots-table" })], __VLS_functionalComponentArgsRest(__VLS_43), false));
var __VLS_47;
var __VLS_48 = ({ request: {} },
    { onRequest: (__VLS_ctx.onRequest) });
/** @type {__VLS_StyleScopedClasses['lots-table']} */ ;
var __VLS_49 = __VLS_45.slots.default;
{
    var __VLS_50 = __VLS_45.slots["body-cell-lot_number"];
    var props = __VLS_vSlot(__VLS_50)[0];
    var __VLS_51 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
        props: (props),
    }));
    var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_52), false));
    var __VLS_56 = __VLS_54.slots.default;
    var __VLS_57 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57(__assign({ to: ("/thread/lots/".concat(props.row.id)) }, { class: "text-primary text-weight-medium" })));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([__assign({ to: ("/thread/lots/".concat(props.row.id)) }, { class: "text-primary text-weight-medium" })], __VLS_functionalComponentArgsRest(__VLS_58), false));
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    var __VLS_62 = __VLS_60.slots.default;
    (props.row.lot_number);
    // @ts-ignore
    [pagination, lots, columns, loading, onRequest,];
    var __VLS_60;
    // @ts-ignore
    [];
    var __VLS_54;
    // @ts-ignore
    [];
}
{
    var __VLS_63 = __VLS_45.slots["body-cell-thread_type"];
    var props = __VLS_vSlot(__VLS_63)[0];
    var __VLS_64 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
        props: (props),
    }));
    var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_65), false));
    var __VLS_69 = __VLS_67.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap q-gutter-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    if ((_b = (_a = props.row.thread_type) === null || _a === void 0 ? void 0 : _a.color_data) === null || _b === void 0 ? void 0 : _b.hex_code) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-swatch" }, { style: ({ backgroundColor: props.row.thread_type.color_data.hex_code }) }));
        /** @type {__VLS_StyleScopedClasses['color-swatch']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (((_c = props.row.thread_type) === null || _c === void 0 ? void 0 : _c.name) || '-');
    // @ts-ignore
    [];
    var __VLS_67;
    // @ts-ignore
    [];
}
{
    var __VLS_70 = __VLS_45.slots["body-cell-status"];
    var props = __VLS_vSlot(__VLS_70)[0];
    var __VLS_71 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71({
        props: (props),
    }));
    var __VLS_73 = __VLS_72.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_72), false));
    var __VLS_76 = __VLS_74.slots.default;
    var __VLS_77 = LotStatusBadge_vue_1.default;
    // @ts-ignore
    var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({
        status: (props.row.status),
    }));
    var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([{
            status: (props.row.status),
        }], __VLS_functionalComponentArgsRest(__VLS_78), false));
    // @ts-ignore
    [];
    var __VLS_74;
    // @ts-ignore
    [];
}
{
    var __VLS_82 = __VLS_45.slots["body-cell-cones"];
    var props = __VLS_vSlot(__VLS_82)[0];
    var __VLS_83 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
        props: (props),
    }));
    var __VLS_85 = __VLS_84.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_84), false));
    var __VLS_88 = __VLS_86.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (props.row.available_cones);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    (props.row.total_cones);
    // @ts-ignore
    [];
    var __VLS_86;
    // @ts-ignore
    [];
}
{
    var __VLS_89 = __VLS_45.slots["body-cell-warehouse"];
    var props = __VLS_vSlot(__VLS_89)[0];
    var __VLS_90 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
        props: (props),
    }));
    var __VLS_92 = __VLS_91.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_91), false));
    var __VLS_95 = __VLS_93.slots.default;
    (((_d = props.row.warehouse) === null || _d === void 0 ? void 0 : _d.name) || '-');
    // @ts-ignore
    [];
    var __VLS_93;
    // @ts-ignore
    [];
}
{
    var __VLS_96 = __VLS_45.slots["body-cell-supplier"];
    var props = __VLS_vSlot(__VLS_96)[0];
    var __VLS_97 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97({
        props: (props),
    }));
    var __VLS_99 = __VLS_98.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_98), false));
    var __VLS_102 = __VLS_100.slots.default;
    if (props.row.supplier_data) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
        var __VLS_103 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_104 = __VLS_asFunctionalComponent1(__VLS_103, new __VLS_103(__assign({ size: "20px", color: "primary", textColor: "white" }, { class: "q-mr-xs text-caption text-weight-bold" })));
        var __VLS_105 = __VLS_104.apply(void 0, __spreadArray([__assign({ size: "20px", color: "primary", textColor: "white" }, { class: "q-mr-xs text-caption text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_104), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        var __VLS_108 = __VLS_106.slots.default;
        (__VLS_ctx.getSupplierInitials(props.row.supplier_data.name));
        // @ts-ignore
        [getSupplierInitials,];
        var __VLS_106;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (props.row.supplier_data.name);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        ('-');
    }
    // @ts-ignore
    [];
    var __VLS_100;
    // @ts-ignore
    [];
}
{
    var __VLS_109 = __VLS_45.slots["body-cell-expiry_date"];
    var props = __VLS_vSlot(__VLS_109)[0];
    var __VLS_110 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
        props: (props),
    }));
    var __VLS_112 = __VLS_111.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_111), false));
    var __VLS_115 = __VLS_113.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (__VLS_ctx.isExpiringSoon(props.row.expiry_date) ? 'text-warning' : '') }));
    (__VLS_ctx.formatDate(props.row.expiry_date));
    // @ts-ignore
    [isExpiringSoon, formatDate,];
    var __VLS_113;
    // @ts-ignore
    [];
}
{
    var __VLS_116 = __VLS_45.slots["body-cell-actions"];
    var props_1 = __VLS_vSlot(__VLS_116)[0];
    var __VLS_117 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117(__assign({ props: (props_1) }, { class: "q-gutter-xs" })));
    var __VLS_119 = __VLS_118.apply(void 0, __spreadArray([__assign({ props: (props_1) }, { class: "q-gutter-xs" })], __VLS_functionalComponentArgsRest(__VLS_118), false));
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    var __VLS_122 = __VLS_120.slots.default;
    var __VLS_123 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "visibility", color: "primary" })));
    var __VLS_125 = __VLS_124.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "visibility", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_124), false));
    var __VLS_128 = void 0;
    var __VLS_129 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.viewLot(props_1.row);
                // @ts-ignore
                [viewLot,];
            } });
    var __VLS_130 = __VLS_126.slots.default;
    var __VLS_131 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131({}));
    var __VLS_133 = __VLS_132.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_132), false));
    var __VLS_136 = __VLS_134.slots.default;
    // @ts-ignore
    [];
    var __VLS_134;
    // @ts-ignore
    [];
    var __VLS_126;
    var __VLS_127;
    var __VLS_137 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "edit", color: "secondary" })));
    var __VLS_139 = __VLS_138.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "edit", color: "secondary" })], __VLS_functionalComponentArgsRest(__VLS_138), false));
    var __VLS_142 = void 0;
    var __VLS_143 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.editLot(props_1.row);
                // @ts-ignore
                [editLot,];
            } });
    var __VLS_144 = __VLS_140.slots.default;
    var __VLS_145 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_146 = __VLS_asFunctionalComponent1(__VLS_145, new __VLS_145({}));
    var __VLS_147 = __VLS_146.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_146), false));
    var __VLS_150 = __VLS_148.slots.default;
    // @ts-ignore
    [];
    var __VLS_148;
    // @ts-ignore
    [];
    var __VLS_140;
    var __VLS_141;
    if (props_1.row.status === 'ACTIVE') {
        var __VLS_151 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_152 = __VLS_asFunctionalComponent1(__VLS_151, new __VLS_151(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "block", color: "negative" })));
        var __VLS_153 = __VLS_152.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "block", color: "negative" })], __VLS_functionalComponentArgsRest(__VLS_152), false));
        var __VLS_156 = void 0;
        var __VLS_157 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(props_1.row.status === 'ACTIVE'))
                        return;
                    __VLS_ctx.quarantineLot(props_1.row);
                    // @ts-ignore
                    [quarantineLot,];
                } });
        var __VLS_158 = __VLS_154.slots.default;
        var __VLS_159 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_160 = __VLS_asFunctionalComponent1(__VLS_159, new __VLS_159({}));
        var __VLS_161 = __VLS_160.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_160), false));
        var __VLS_164 = __VLS_162.slots.default;
        // @ts-ignore
        [];
        var __VLS_162;
        // @ts-ignore
        [];
        var __VLS_154;
        var __VLS_155;
    }
    if (props_1.row.status === 'QUARANTINE') {
        var __VLS_165 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "check_circle", color: "positive" })));
        var __VLS_167 = __VLS_166.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "check_circle", color: "positive" })], __VLS_functionalComponentArgsRest(__VLS_166), false));
        var __VLS_170 = void 0;
        var __VLS_171 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(props_1.row.status === 'QUARANTINE'))
                        return;
                    __VLS_ctx.releaseLot(props_1.row);
                    // @ts-ignore
                    [releaseLot,];
                } });
        var __VLS_172 = __VLS_168.slots.default;
        var __VLS_173 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_174 = __VLS_asFunctionalComponent1(__VLS_173, new __VLS_173({}));
        var __VLS_175 = __VLS_174.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_174), false));
        var __VLS_178 = __VLS_176.slots.default;
        // @ts-ignore
        [];
        var __VLS_176;
        // @ts-ignore
        [];
        var __VLS_168;
        var __VLS_169;
    }
    // @ts-ignore
    [];
    var __VLS_120;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_45;
var __VLS_46;
var __VLS_179 = LotFormDialog_vue_1.default;
// @ts-ignore
var __VLS_180 = __VLS_asFunctionalComponent1(__VLS_179, new __VLS_179(__assign({ 'onSaved': {} }, { modelValue: (__VLS_ctx.showCreateDialog), lot: (__VLS_ctx.selectedLot) })));
var __VLS_181 = __VLS_180.apply(void 0, __spreadArray([__assign({ 'onSaved': {} }, { modelValue: (__VLS_ctx.showCreateDialog), lot: (__VLS_ctx.selectedLot) })], __VLS_functionalComponentArgsRest(__VLS_180), false));
var __VLS_184;
var __VLS_185 = ({ saved: {} },
    { onSaved: (__VLS_ctx.onLotSaved) });
var __VLS_182;
var __VLS_183;
// @ts-ignore
[showCreateDialog, selectedLot, onLotSaved,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
