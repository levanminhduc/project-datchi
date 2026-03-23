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
var usePurchaseOrders_1 = require("@/composables/thread/usePurchaseOrders");
var POFormDialog_vue_1 = require("@/components/thread/POFormDialog.vue");
var SearchInput_vue_1 = require("@/components/ui/inputs/SearchInput.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var purchaseOrderService_1 = require("@/services/purchaseOrderService");
var enums_1 = require("@/types/thread/enums");
definePage({
    meta: {
        requiresAuth: true,
        permissions: ['thread.purchase-orders.view'],
    },
});
var router = (0, vue_router_1.useRouter)();
var _a = (0, usePurchaseOrders_1.usePurchaseOrders)(), purchaseOrders = _a.purchaseOrders, isLoading = _a.isLoading, filters = _a.filters, totalCount = _a.totalCount, currentPage = _a.currentPage, fetchPurchaseOrders = _a.fetchPurchaseOrders, handleTableRequest = _a.handleTableRequest;
var searchQuery = (0, vue_1.ref)('');
var showCreateDialog = (0, vue_1.ref)(false);
var selectedPO = (0, vue_1.ref)(null);
var allCustomerOptions = (0, vue_1.ref)([]);
var customerOptions = (0, vue_1.ref)([]);
function loadCustomers() {
    return __awaiter(this, void 0, void 0, function () {
        var names, opts, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, purchaseOrderService_1.purchaseOrderService.getCustomers()];
                case 1:
                    names = _b.sent();
                    opts = names.map(function (name) { return ({ label: name, value: name }); });
                    allCustomerOptions.value = opts;
                    customerOptions.value = opts;
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    allCustomerOptions.value = [];
                    customerOptions.value = [];
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function filterCustomerOptions(val, update) {
    update(function () {
        var needle = val.toLowerCase();
        customerOptions.value = allCustomerOptions.value.filter(function (opt) { return opt.label.toLowerCase().includes(needle); });
    });
}
var pagination = (0, vue_1.ref)({
    page: 1,
    rowsPerPage: 25,
    sortBy: 'created_at',
    descending: true,
    rowsNumber: 0,
});
var statusOptions = [
    { label: 'Chờ xử lý', value: enums_1.POStatus.PENDING },
    { label: 'Đã xác nhận', value: enums_1.POStatus.CONFIRMED },
    { label: 'Đang sản xuất', value: enums_1.POStatus.IN_PRODUCTION },
    { label: 'Hoàn thành', value: enums_1.POStatus.COMPLETED },
    { label: 'Đã hủy', value: enums_1.POStatus.CANCELLED }
];
var columns = [
    { name: 'po_number', label: 'Số PO', field: 'po_number', align: 'left', sortable: true },
    { name: 'customer_name', label: 'Khách hàng', field: 'customer_name', align: 'left' },
    { name: 'order_date', label: 'Ngày đặt', field: 'order_date', align: 'center' },
    { name: 'delivery_date', label: 'Ngày giao', field: 'delivery_date', align: 'center' },
    { name: 'status', label: 'Trạng thái', field: 'status', align: 'center' },
    { name: 'priority', label: 'Ưu tiên', field: 'priority', align: 'center' },
    { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' }
];
function getStatusColor(status) {
    var _a;
    var colors = (_a = {},
        _a[enums_1.POStatus.PENDING] = 'grey',
        _a[enums_1.POStatus.CONFIRMED] = 'info',
        _a[enums_1.POStatus.IN_PRODUCTION] = 'warning',
        _a[enums_1.POStatus.COMPLETED] = 'positive',
        _a[enums_1.POStatus.CANCELLED] = 'negative',
        _a);
    return colors[status] || 'grey';
}
function getStatusLabel(status) {
    var _a;
    var labels = (_a = {},
        _a[enums_1.POStatus.PENDING] = 'Chờ xử lý',
        _a[enums_1.POStatus.CONFIRMED] = 'Đã xác nhận',
        _a[enums_1.POStatus.IN_PRODUCTION] = 'Đang SX',
        _a[enums_1.POStatus.COMPLETED] = 'Hoàn thành',
        _a[enums_1.POStatus.CANCELLED] = 'Đã hủy',
        _a);
    return labels[status] || status;
}
function getPriorityColor(priority) {
    var colors = {
        LOW: 'grey',
        NORMAL: 'primary',
        HIGH: 'warning',
        URGENT: 'negative'
    };
    return colors[priority] || 'grey';
}
function getPriorityLabel(priority) {
    var labels = {
        LOW: 'Thấp',
        NORMAL: 'BT',
        HIGH: 'Cao',
        URGENT: 'Khẩn'
    };
    return labels[priority] || priority;
}
function formatDate(date) {
    if (!date)
        return '-';
    return new Date(date).toLocaleDateString('vi-VN');
}
function loadData() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchPurchaseOrders({
                        po_number: searchQuery.value || undefined
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleSearch() {
    pagination.value.page = 1;
    currentPage.value = 1;
    loadData();
}
function handleFilterChange() {
    pagination.value.page = 1;
    currentPage.value = 1;
    loadData();
}
function onRequest(props) {
    pagination.value.page = props.pagination.page;
    pagination.value.rowsPerPage = props.pagination.rowsPerPage;
    pagination.value.sortBy = props.pagination.sortBy;
    pagination.value.descending = props.pagination.descending;
    handleTableRequest(props);
}
(0, vue_1.watch)(totalCount, function (newCount) {
    pagination.value.rowsNumber = newCount;
});
function onRowClick(_evt, row) {
    router.push("/thread/purchase-orders/".concat(row.id));
}
function viewPO(po) {
    router.push("/thread/purchase-orders/".concat(po.id));
}
function editPO(po) {
    selectedPO.value = po;
    showCreateDialog.value = true;
}
function onPOSaved() {
    showCreateDialog.value = false;
    selectedPO.value = null;
    loadData();
}
(0, vue_1.onMounted)(function () {
    loadCustomers();
    loadData();
});
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['po-table']} */ ;
/** @type {__VLS_StyleScopedClasses['po-table']} */ ;
/** @type {__VLS_StyleScopedClasses['po-table']} */ ;
/** @type {__VLS_StyleScopedClasses['po-table']} */ ;
/** @type {__VLS_StyleScopedClasses['po-table']} */ ;
/** @type {__VLS_StyleScopedClasses['po-table']} */ ;
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
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.searchQuery), placeholder: "Tìm PO..." })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.searchQuery), placeholder: "Tìm PO..." })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
var __VLS_13 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleSearch) });
var __VLS_10;
var __VLS_11;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_14 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign(__assign({ 'onFilter': {} }, { 'onUpdate:modelValue': {} }), { modelValue: (__VLS_ctx.filters.customer_name), options: (__VLS_ctx.customerOptions), label: "Khách hàng", dense: true, clearable: true, emitValue: true, mapOptions: true, useInput: true, inputDebounce: (300) })));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign(__assign({ 'onFilter': {} }, { 'onUpdate:modelValue': {} }), { modelValue: (__VLS_ctx.filters.customer_name), options: (__VLS_ctx.customerOptions), label: "Khách hàng", dense: true, clearable: true, emitValue: true, mapOptions: true, useInput: true, inputDebounce: (300) })], __VLS_functionalComponentArgsRest(__VLS_15), false));
var __VLS_19;
var __VLS_20 = ({ filter: {} },
    { onFilter: (__VLS_ctx.filterCustomerOptions) });
var __VLS_21 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
var __VLS_17;
var __VLS_18;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_22 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.status), options: (__VLS_ctx.statusOptions), label: "Trạng thái", dense: true, clearable: true, emitValue: true, mapOptions: true })));
var __VLS_24 = __VLS_23.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.status), options: (__VLS_ctx.statusOptions), label: "Trạng thái", dense: true, clearable: true, emitValue: true, mapOptions: true })], __VLS_functionalComponentArgsRest(__VLS_23), false));
var __VLS_27;
var __VLS_28 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
var __VLS_25;
var __VLS_26;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
var __VLS_29;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29(__assign(__assign({ 'onClick': {} }, { color: "secondary", icon: "upload", label: "Import", unelevated: true }), { class: "full-width-xs q-mr-sm" })));
var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "secondary", icon: "upload", label: "Import", unelevated: true }), { class: "full-width-xs q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_30), false));
var __VLS_34;
var __VLS_35 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.router.push('/thread/purchase-orders/import');
            // @ts-ignore
            [searchQuery, handleSearch, filters, filters, customerOptions, filterCustomerOptions, handleFilterChange, handleFilterChange, statusOptions, router,];
        } });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
var __VLS_32;
var __VLS_33;
var __VLS_36;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Tạo PO", unelevated: true }), { class: "full-width-xs" })));
var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Tạo PO", unelevated: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_37), false));
var __VLS_41;
var __VLS_42 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showCreateDialog = true;
            // @ts-ignore
            [showCreateDialog,];
        } });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_39;
var __VLS_40;
var __VLS_43;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43(__assign(__assign(__assign({ 'onRequest': {} }, { 'onRowClick': {} }), { pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.purchaseOrders), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.isLoading), rowKey: "id", rowsPerPageOptions: ([10, 25, 50, 100]) }), { class: "po-table" })));
var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onRequest': {} }, { 'onRowClick': {} }), { pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.purchaseOrders), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.isLoading), rowKey: "id", rowsPerPageOptions: ([10, 25, 50, 100]) }), { class: "po-table" })], __VLS_functionalComponentArgsRest(__VLS_44), false));
var __VLS_48;
var __VLS_49 = ({ request: {} },
    { onRequest: (__VLS_ctx.onRequest) });
var __VLS_50 = ({ rowClick: {} },
    { onRowClick: (__VLS_ctx.onRowClick) });
/** @type {__VLS_StyleScopedClasses['po-table']} */ ;
var __VLS_51 = __VLS_46.slots.default;
{
    var __VLS_52 = __VLS_46.slots["body-cell-po_number"];
    var props = __VLS_vSlot(__VLS_52)[0];
    var __VLS_53 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
        props: (props),
    }));
    var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_54), false));
    var __VLS_58 = __VLS_56.slots.default;
    var __VLS_59 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59(__assign({ to: ("/thread/purchase-orders/".concat(props.row.id)) }, { class: "text-primary text-weight-medium" })));
    var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([__assign({ to: ("/thread/purchase-orders/".concat(props.row.id)) }, { class: "text-primary text-weight-medium" })], __VLS_functionalComponentArgsRest(__VLS_60), false));
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    var __VLS_64 = __VLS_62.slots.default;
    (props.row.po_number);
    // @ts-ignore
    [pagination, purchaseOrders, columns, isLoading, onRequest, onRowClick,];
    var __VLS_62;
    // @ts-ignore
    [];
    var __VLS_56;
    // @ts-ignore
    [];
}
{
    var __VLS_65 = __VLS_46.slots["body-cell-status"];
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
    var __VLS_72 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
        color: (__VLS_ctx.getStatusColor(props.row.status)),
        label: (__VLS_ctx.getStatusLabel(props.row.status)),
    }));
    var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getStatusColor(props.row.status)),
            label: (__VLS_ctx.getStatusLabel(props.row.status)),
        }], __VLS_functionalComponentArgsRest(__VLS_73), false));
    // @ts-ignore
    [getStatusColor, getStatusLabel,];
    var __VLS_69;
    // @ts-ignore
    [];
}
{
    var __VLS_77 = __VLS_46.slots["body-cell-priority"];
    var props = __VLS_vSlot(__VLS_77)[0];
    var __VLS_78 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
        props: (props),
    }));
    var __VLS_80 = __VLS_79.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_79), false));
    var __VLS_83 = __VLS_81.slots.default;
    var __VLS_84 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
        color: (__VLS_ctx.getPriorityColor(props.row.priority)),
        label: (__VLS_ctx.getPriorityLabel(props.row.priority)),
        outline: true,
    }));
    var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getPriorityColor(props.row.priority)),
            label: (__VLS_ctx.getPriorityLabel(props.row.priority)),
            outline: true,
        }], __VLS_functionalComponentArgsRest(__VLS_85), false));
    // @ts-ignore
    [getPriorityColor, getPriorityLabel,];
    var __VLS_81;
    // @ts-ignore
    [];
}
{
    var __VLS_89 = __VLS_46.slots["body-cell-order_date"];
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
    (__VLS_ctx.formatDate(props.row.order_date));
    // @ts-ignore
    [formatDate,];
    var __VLS_93;
    // @ts-ignore
    [];
}
{
    var __VLS_96 = __VLS_46.slots["body-cell-delivery_date"];
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
    (__VLS_ctx.formatDate(props.row.delivery_date));
    // @ts-ignore
    [formatDate,];
    var __VLS_100;
    // @ts-ignore
    [];
}
{
    var __VLS_103 = __VLS_46.slots["body-cell-actions"];
    var props_1 = __VLS_vSlot(__VLS_103)[0];
    var __VLS_104 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104(__assign({ props: (props_1) }, { class: "q-gutter-xs" })));
    var __VLS_106 = __VLS_105.apply(void 0, __spreadArray([__assign({ props: (props_1) }, { class: "q-gutter-xs" })], __VLS_functionalComponentArgsRest(__VLS_105), false));
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    var __VLS_109 = __VLS_107.slots.default;
    var __VLS_110 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "visibility", color: "primary" })));
    var __VLS_112 = __VLS_111.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "visibility", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_111), false));
    var __VLS_115 = void 0;
    var __VLS_116 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.viewPO(props_1.row);
                // @ts-ignore
                [viewPO,];
            } });
    var __VLS_117 = __VLS_113.slots.default;
    var __VLS_118 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118({}));
    var __VLS_120 = __VLS_119.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_119), false));
    var __VLS_123 = __VLS_121.slots.default;
    // @ts-ignore
    [];
    var __VLS_121;
    // @ts-ignore
    [];
    var __VLS_113;
    var __VLS_114;
    var __VLS_124 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "edit", color: "secondary" })));
    var __VLS_126 = __VLS_125.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "edit", color: "secondary" })], __VLS_functionalComponentArgsRest(__VLS_125), false));
    var __VLS_129 = void 0;
    var __VLS_130 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.editPO(props_1.row);
                // @ts-ignore
                [editPO,];
            } });
    var __VLS_131 = __VLS_127.slots.default;
    var __VLS_132 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132({}));
    var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_133), false));
    var __VLS_137 = __VLS_135.slots.default;
    // @ts-ignore
    [];
    var __VLS_135;
    // @ts-ignore
    [];
    var __VLS_127;
    var __VLS_128;
    // @ts-ignore
    [];
    var __VLS_107;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_46;
var __VLS_47;
var __VLS_138 = POFormDialog_vue_1.default;
// @ts-ignore
var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138(__assign({ 'onSaved': {} }, { modelValue: (__VLS_ctx.showCreateDialog), purchaseOrder: (__VLS_ctx.selectedPO) })));
var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([__assign({ 'onSaved': {} }, { modelValue: (__VLS_ctx.showCreateDialog), purchaseOrder: (__VLS_ctx.selectedPO) })], __VLS_functionalComponentArgsRest(__VLS_139), false));
var __VLS_143;
var __VLS_144 = ({ saved: {} },
    { onSaved: (__VLS_ctx.onPOSaved) });
var __VLS_141;
var __VLS_142;
// @ts-ignore
[showCreateDialog, selectedPO, onPOSaved,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
