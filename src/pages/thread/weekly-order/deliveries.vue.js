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
var deliveryService_1 = require("@/services/deliveryService");
var warehouseService_1 = require("@/services/warehouseService");
var useSnackbar_1 = require("@/composables/useSnackbar");
var useAuth_1 = require("@/composables/useAuth");
var enums_1 = require("@/types/thread/enums");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var ReceiveResultDialog_vue_1 = require("@/components/thread/weekly-order/ReceiveResultDialog.vue");
var snackbar = (0, useSnackbar_1.useSnackbar)();
var employee = (0, useAuth_1.useAuth)().employee;
// Tab state
var activeTab = (0, vue_1.ref)('tracking');
// Tracking tab state
var loading = (0, vue_1.ref)(false);
var deliveries = (0, vue_1.ref)([]);
var statusFilter = (0, vue_1.ref)(null);
var hideFullyReceived = (0, vue_1.ref)(true);
var statusOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Chờ giao', value: enums_1.DeliveryStatus.PENDING },
    { label: 'Đã giao', value: enums_1.DeliveryStatus.DELIVERED },
];
// Delivered dialog state
var showDeliveredDialog = (0, vue_1.ref)(false);
var selectedDelivery = (0, vue_1.ref)(null);
var actualDeliveryDate = (0, vue_1.ref)('');
var updating = (0, vue_1.ref)(false);
// Receive tab state
var loadingReceive = (0, vue_1.ref)(false);
var pendingReceiveItems = (0, vue_1.ref)([]);
// Receive dialog state
var showReceiveDialog = (0, vue_1.ref)(false);
var selectedReceiveDelivery = (0, vue_1.ref)(null);
var receiving = (0, vue_1.ref)(false);
var warehouses = (0, vue_1.ref)([]);
var receiveForm = (0, vue_1.ref)({
    warehouse_id: null,
    quantity: 0,
    expiry_date: '',
});
var showResultDialog = (0, vue_1.ref)(false);
var receiveResult = (0, vue_1.ref)(null);
var currentUser = (0, vue_1.computed)(function () {
    var _a;
    return ((_a = employee.value) === null || _a === void 0 ? void 0 : _a.fullName) || 'Chưa đăng nhập';
});
var warehouseOptions = (0, vue_1.computed)(function () {
    return warehouses.value.map(function (w) { return ({ id: w.id, name: "".concat(w.name, " (").concat(w.code, ")") }); });
});
var filteredDeliveries = (0, vue_1.computed)(function () {
    if (!hideFullyReceived.value)
        return deliveries.value;
    return deliveries.value.filter(function (d) { return d.inventory_status !== enums_1.InventoryReceiptStatus.RECEIVED; });
});
var hasAnyLoans = (0, vue_1.computed)(function () {
    return filteredDeliveries.value.some(function (d) { return (d.borrowed_in || 0) > 0 || (d.lent_out || 0) > 0; });
});
var groupedRows = (0, vue_1.computed)(function () {
    var sorted = __spreadArray([], filteredDeliveries.value, true).sort(function (a, b) {
        var weekCmp = (a.week_name || '').localeCompare(b.week_name || '');
        if (weekCmp !== 0)
            return weekCmp;
        return String(a.delivery_date).localeCompare(String(b.delivery_date));
    });
    var groups = new Map();
    for (var _i = 0, sorted_1 = sorted; _i < sorted_1.length; _i++) {
        var row = sorted_1[_i];
        var key = row.week_name || "__".concat(row.week_id);
        if (!groups.has(key))
            groups.set(key, []);
        groups.get(key).push(row);
    }
    var result = [];
    var _loop_1 = function (rows) {
        rows.forEach(function (row, idx) {
            result.push({ row: row, isFirstInGroup: idx === 0, groupSize: rows.length });
        });
    };
    for (var _a = 0, _b = groups.values(); _a < _b.length; _a++) {
        var rows = _b[_a];
        _loop_1(rows);
    }
    return result;
});
var trackingColumns = (0, vue_1.computed)(function () {
    var cols = [
        { name: 'week_name', label: 'Đơn Hàng', field: 'week_name', align: 'left', sortable: true },
        { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
        { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'center' },
        { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left', sortable: true },
        { name: 'quantity_cones', label: 'Đặt NCC', field: 'quantity_cones', align: 'center' },
        { name: 'received_quantity', label: 'Đã nhận', field: 'received_quantity', align: 'center' },
        { name: 'pending_cones', label: 'Chờ nhận', field: function (row) { return (row.quantity_cones || 0) - (row.received_quantity || 0); }, align: 'center' },
    ];
    if (hasAnyLoans.value) {
        cols.push({ name: 'borrowed_in', label: 'Đã mượn', field: 'borrowed_in', align: 'center' }, { name: 'lent_out', label: 'Cho mượn', field: 'lent_out', align: 'center' });
    }
    cols.push({ name: 'delivery_date', label: 'Ngày giao', field: 'delivery_date', align: 'center', sortable: true }, { name: 'days_remaining', label: 'Còn lại', field: 'days_remaining', align: 'center', sortable: true }, { name: 'status', label: 'Giao hàng', field: 'status', align: 'center' }, { name: 'inventory_status', label: 'Nhập kho', field: 'inventory_status', align: 'center' }, { name: 'actions', label: '', field: 'actions', align: 'center' });
    return cols;
});
var receiveColumns = [
    { name: 'week_name', label: 'Đơn Hàng', field: 'week_name', align: 'left', sortable: true },
    { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
    { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'center' },
    { name: 'color_name', label: 'Màu', field: 'color_name', align: 'left', sortable: true },
    { name: 'quantity_cones', label: 'Số đặt', field: 'quantity_cones', align: 'center' },
    { name: 'received_quantity', label: 'Đã nhập', field: 'received_quantity', align: 'center' },
    { name: 'pending_quantity', label: 'Còn thiếu', field: 'pending_quantity', align: 'center' },
    { name: 'inventory_status', label: 'Trạng thái', field: 'inventory_status', align: 'center' },
    { name: 'actions', label: '', field: 'actions', align: 'center' },
];
function formatDate(dateStr) {
    if (!dateStr)
        return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function getDaysColor(days, status) {
    if (status === enums_1.DeliveryStatus.DELIVERED)
        return 'green';
    if (days === undefined)
        return 'grey';
    if (days <= 0)
        return 'red';
    if (days <= 3)
        return 'orange';
    return 'green';
}
function toDatePickerFormat(dateStr) {
    if (!dateStr)
        return '';
    var _a = dateStr.split('-'), year = _a[0], month = _a[1], day = _a[2];
    return "".concat(day, "/").concat(month, "/").concat(year);
}
function fromDatePickerFormat(dateStr) {
    if (!dateStr)
        return '';
    var _a = dateStr.split('/'), day = _a[0], month = _a[1], year = _a[2];
    return "".concat(year, "-").concat(month, "-").concat(day);
}
// Task 7.2: Use quantity_cones for pending calculation
// ISSUE-8: Allow negative values to indicate over-receipt per spec
function getPendingQuantity(delivery) {
    var total = delivery.quantity_cones || 0;
    var received = delivery.received_quantity || 0;
    return total - received;
}
function getInventoryStatusColor(status) {
    switch (status) {
        case enums_1.InventoryReceiptStatus.RECEIVED: return 'green';
        case enums_1.InventoryReceiptStatus.PARTIAL: return 'orange';
        default: return 'grey';
    }
}
function getInventoryStatusLabel(status) {
    switch (status) {
        case enums_1.InventoryReceiptStatus.RECEIVED: return 'Đã nhập đủ';
        case enums_1.InventoryReceiptStatus.PARTIAL: return 'Nhập một phần';
        default: return 'Chưa nhập';
    }
}
function handleDeliveryDateChange(deliveryId, val) {
    return __awaiter(this, void 0, void 0, function () {
        var isoDate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!val)
                        return [2 /*return*/];
                    isoDate = fromDatePickerFormat(val);
                    return [4 /*yield*/, updateDeliveryDate(deliveryId, isoDate)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function loadTrackingData() {
    return __awaiter(this, void 0, void 0, function () {
        var filters, _a, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    loading.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    filters = {};
                    if (statusFilter.value)
                        filters.status = statusFilter.value;
                    _a = deliveries;
                    return [4 /*yield*/, deliveryService_1.deliveryService.getOverview(filters)];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _b.sent();
                    snackbar.error('Lỗi tải dữ liệu: ' + (err_1 instanceof Error ? err_1.message : 'Không xác định'));
                    return [3 /*break*/, 5];
                case 4:
                    loading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function loadReceiveData() {
    return __awaiter(this, void 0, void 0, function () {
        var allDeliveries, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    loadingReceive.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, deliveryService_1.deliveryService.getOverview({ status: enums_1.DeliveryStatus.DELIVERED })];
                case 2:
                    allDeliveries = _a.sent();
                    pendingReceiveItems.value = allDeliveries.filter(function (d) { return d.inventory_status !== enums_1.InventoryReceiptStatus.RECEIVED; });
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    snackbar.error('Lỗi tải dữ liệu: ' + (err_2 instanceof Error ? err_2.message : 'Không xác định'));
                    return [3 /*break*/, 5];
                case 4:
                    loadingReceive.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function loadWarehouses() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, err_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    _a = warehouses;
                    return [4 /*yield*/, warehouseService_1.warehouseService.getStorageOnly()];
                case 1:
                    _a.value = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _b.sent();
                    console.error('Error loading warehouses:', err_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateDeliveryDate(deliveryId, newDate) {
    return __awaiter(this, void 0, void 0, function () {
        var err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, deliveryService_1.deliveryService.update(deliveryId, { delivery_date: newDate })];
                case 1:
                    _a.sent();
                    snackbar.success('Đã cập nhật ngày giao');
                    return [4 /*yield*/, loadTrackingData()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _a.sent();
                    snackbar.error('Lỗi: ' + (err_4 instanceof Error ? err_4.message : 'Không xác định'));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function openDeliveredDialog(delivery) {
    selectedDelivery.value = delivery;
    var today = new Date();
    var day = String(today.getDate()).padStart(2, '0');
    var month = String(today.getMonth() + 1).padStart(2, '0');
    var year = today.getFullYear();
    actualDeliveryDate.value = "".concat(day, "/").concat(month, "/").concat(year);
    showDeliveredDialog.value = true;
}
function confirmDelivered() {
    return __awaiter(this, void 0, void 0, function () {
        var isoDate, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedDelivery.value)
                        return [2 /*return*/];
                    updating.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    isoDate = fromDatePickerFormat(actualDeliveryDate.value);
                    return [4 /*yield*/, deliveryService_1.deliveryService.update(selectedDelivery.value.id, {
                            status: enums_1.DeliveryStatus.DELIVERED,
                            actual_delivery_date: isoDate,
                        })];
                case 2:
                    _a.sent();
                    snackbar.success('Đã xác nhận giao hàng');
                    showDeliveredDialog.value = false;
                    return [4 /*yield*/, loadTrackingData()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    err_5 = _a.sent();
                    snackbar.error('Lỗi: ' + (err_5 instanceof Error ? err_5.message : 'Không xác định'));
                    return [3 /*break*/, 6];
                case 5:
                    updating.value = false;
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function openReceiveDialog(delivery) {
    selectedReceiveDelivery.value = delivery;
    receiveForm.value = {
        warehouse_id: null,
        quantity: getPendingQuantity(delivery),
        expiry_date: '',
    };
    showReceiveDialog.value = true;
}
function confirmReceive() {
    return __awaiter(this, void 0, void 0, function () {
        var dto, result, err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedReceiveDelivery.value || !receiveForm.value.warehouse_id)
                        return [2 /*return*/];
                    receiving.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    dto = {
                        warehouse_id: receiveForm.value.warehouse_id,
                        quantity: receiveForm.value.quantity,
                        received_by: currentUser.value,
                    };
                    if (receiveForm.value.expiry_date) {
                        dto.expiry_date = fromDatePickerFormat(receiveForm.value.expiry_date);
                    }
                    return [4 /*yield*/, deliveryService_1.deliveryService.receiveDelivery(selectedReceiveDelivery.value.id, dto)];
                case 2:
                    result = _a.sent();
                    showReceiveDialog.value = false;
                    receiveResult.value = result;
                    showResultDialog.value = true;
                    return [3 /*break*/, 5];
                case 3:
                    err_6 = _a.sent();
                    snackbar.error('Lỗi: ' + (err_6 instanceof Error ? err_6.message : 'Không xác định'));
                    return [3 /*break*/, 5];
                case 4:
                    receiving.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function onResultDialogClose(val) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!val) return [3 /*break*/, 2];
                    showResultDialog.value = false;
                    receiveResult.value = null;
                    return [4 /*yield*/, loadReceiveData()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
// Load data when switching tabs
(0, vue_1.watch)(activeTab, function (newTab) {
    if (newTab === 'tracking') {
        loadTrackingData();
    }
    else if (newTab === 'receive') {
        loadReceiveData();
    }
});
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, loadWarehouses()];
            case 1:
                _a.sent();
                return [4 /*yield*/, loadTrackingData()];
            case 2:
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h5, __VLS_intrinsics.h5)(__assign({ class: "q-ma-none" }));
/** @type {__VLS_StyleScopedClasses['q-ma-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-grey-7 q-mb-none" }));
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-none']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
qTabs;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left", narrowIndicator: true })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left", narrowIndicator: true })], __VLS_functionalComponentArgsRest(__VLS_8), false));
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
var __VLS_12 = __VLS_10.slots.default;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    name: "tracking",
    label: "Theo dõi giao hàng",
}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{
        name: "tracking",
        label: "Theo dõi giao hàng",
    }], __VLS_functionalComponentArgsRest(__VLS_14), false));
var __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    name: "receive",
    label: "Nhập kho",
}));
var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{
        name: "receive",
        label: "Nhập kho",
    }], __VLS_functionalComponentArgsRest(__VLS_19), false));
// @ts-ignore
[activeTab,];
var __VLS_10;
var __VLS_23;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({}));
var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_24), false));
var __VLS_28;
/** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
qTabPanels;
// @ts-ignore
var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
    modelValue: (__VLS_ctx.activeTab),
    animated: true,
}));
var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.activeTab),
        animated: true,
    }], __VLS_functionalComponentArgsRest(__VLS_29), false));
var __VLS_33 = __VLS_31.slots.default;
var __VLS_34;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
    name: "tracking",
}));
var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([{
        name: "tracking",
    }], __VLS_functionalComponentArgsRest(__VLS_35), false));
var __VLS_39 = __VLS_37.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mb-md q-gutter-sm items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_40 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40(__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.statusFilter), options: (__VLS_ctx.statusOptions), label: "Trạng thái", dense: true }), { style: {} })));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.statusFilter), options: (__VLS_ctx.statusOptions), label: "Trạng thái", dense: true }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_41), false));
var __VLS_45;
var __VLS_46 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.loadTrackingData) });
var __VLS_43;
var __VLS_44;
var __VLS_47;
/** @ts-ignore @type {typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox} */
qCheckbox;
// @ts-ignore
var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
    modelValue: (__VLS_ctx.hideFullyReceived),
    label: "Ẩn đã nhập đủ",
    dense: true,
}));
var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.hideFullyReceived),
        label: "Ẩn đã nhập đủ",
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_48), false));
var __VLS_52;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({}));
var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_53), false));
var __VLS_57;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57(__assign({ 'onClick': {} }, { color: "primary", icon: "refresh", label: "Tải lại", loading: (__VLS_ctx.loading) })));
var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "refresh", label: "Tải lại", loading: (__VLS_ctx.loading) })], __VLS_functionalComponentArgsRest(__VLS_58), false));
var __VLS_62;
var __VLS_63 = ({ click: {} },
    { onClick: (__VLS_ctx.loadTrackingData) });
var __VLS_60;
var __VLS_61;
var __VLS_64;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64(__assign(__assign({ rows: (__VLS_ctx.groupedRows), columns: (__VLS_ctx.trackingColumns), rowKey: "row.id", loading: (__VLS_ctx.loading), flat: true, bordered: true, dense: true }, { class: "delivery-tracking-table" }), { rowsPerPageOptions: ([20, 50, 0]), pagination: ({ rowsPerPage: 50 }) })));
var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([__assign(__assign({ rows: (__VLS_ctx.groupedRows), columns: (__VLS_ctx.trackingColumns), rowKey: "row.id", loading: (__VLS_ctx.loading), flat: true, bordered: true, dense: true }, { class: "delivery-tracking-table" }), { rowsPerPageOptions: ([20, 50, 0]), pagination: ({ rowsPerPage: 50 }) })], __VLS_functionalComponentArgsRest(__VLS_65), false));
/** @type {__VLS_StyleScopedClasses['delivery-tracking-table']} */ ;
var __VLS_69 = __VLS_67.slots.default;
{
    var __VLS_70 = __VLS_67.slots.body;
    var props_1 = __VLS_vSlot(__VLS_70)[0];
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)(__assign({ class: ([props_1.row.row.is_overdue ? 'bg-red-1' : '', props_1.row.isFirstInGroup ? 'group-first-row' : '']) }));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-left text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (props_1.row.isFirstInGroup ? (props_1.row.row.week_name || '—') : '');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-left" }));
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    (props_1.row.row.supplier_name || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-center" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (props_1.row.row.tex_number || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-left" }));
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-xs no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    if (props_1.row.row.color_hex) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ style: {} }, { style: ({ backgroundColor: props_1.row.row.color_hex }) }));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props_1.row.row.color_name || '—');
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-center" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (props_1.row.row.quantity_cones);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-center" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    (props_1.row.row.received_quantity);
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-center" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    ((props_1.row.row.quantity_cones || 0) - (props_1.row.row.received_quantity || 0));
    if (__VLS_ctx.hasAnyLoans) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-center" }));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        if (props_1.row.row.borrowed_in > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-info text-weight-medium" }));
            /** @type {__VLS_StyleScopedClasses['text-info']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
            (props_1.row.row.borrowed_in);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
            /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-center" }));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        if (props_1.row.row.lent_out > 0) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-warning text-weight-medium" }));
            /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
            (props_1.row.row.lent_out);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
            /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
        }
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-center" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cursor-pointer text-primary" }));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (__VLS_ctx.formatDate(props_1.row.row.delivery_date));
    var __VLS_71 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71({}));
    var __VLS_73 = __VLS_72.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_72), false));
    var __VLS_76 = __VLS_74.slots.default;
    var __VLS_77 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.toDatePickerFormat(props_1.row.row.delivery_date)) })));
    var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.toDatePickerFormat(props_1.row.row.delivery_date)) })], __VLS_functionalComponentArgsRest(__VLS_78), false));
    var __VLS_82 = void 0;
    var __VLS_83 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (function (val) { return __VLS_ctx.handleDeliveryDateChange(props_1.row.row.id, val); }) });
    var __VLS_80;
    var __VLS_81;
    // @ts-ignore
    [activeTab, statusFilter, statusOptions, loadTrackingData, loadTrackingData, hideFullyReceived, loading, loading, groupedRows, trackingColumns, hasAnyLoans, formatDate, toDatePickerFormat, handleDeliveryDateChange,];
    var __VLS_74;
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-center" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_84 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
        color: (__VLS_ctx.getDaysColor(props_1.row.row.days_remaining, props_1.row.row.status)),
        label: (props_1.row.row.status === __VLS_ctx.DeliveryStatus.DELIVERED ? '✓' : "".concat(props_1.row.row.days_remaining, " ng\u00E0y")),
    }));
    var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getDaysColor(props_1.row.row.days_remaining, props_1.row.row.status)),
            label: (props_1.row.row.status === __VLS_ctx.DeliveryStatus.DELIVERED ? '✓' : "".concat(props_1.row.row.days_remaining, " ng\u00E0y")),
        }], __VLS_functionalComponentArgsRest(__VLS_85), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-center" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_89 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
        color: (props_1.row.row.status === __VLS_ctx.DeliveryStatus.DELIVERED ? 'green' : 'orange'),
        label: (props_1.row.row.status === __VLS_ctx.DeliveryStatus.DELIVERED ? 'Đã giao' : 'Chờ giao'),
    }));
    var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([{
            color: (props_1.row.row.status === __VLS_ctx.DeliveryStatus.DELIVERED ? 'green' : 'orange'),
            label: (props_1.row.row.status === __VLS_ctx.DeliveryStatus.DELIVERED ? 'Đã giao' : 'Chờ giao'),
        }], __VLS_functionalComponentArgsRest(__VLS_90), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-center" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    if (props_1.row.row.status === __VLS_ctx.DeliveryStatus.DELIVERED) {
        if (props_1.row.row.inventory_status === __VLS_ctx.InventoryReceiptStatus.RECEIVED) {
            var __VLS_94 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
                color: "green",
                label: "Đã nhập đủ",
            }));
            var __VLS_96 = __VLS_95.apply(void 0, __spreadArray([{
                    color: "green",
                    label: "Đã nhập đủ",
                }], __VLS_functionalComponentArgsRest(__VLS_95), false));
        }
        else if (props_1.row.row.inventory_status === __VLS_ctx.InventoryReceiptStatus.PARTIAL) {
            var __VLS_99 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
                color: "orange",
                label: ("Ch\u1EDD nh\u1EADp (".concat(__VLS_ctx.getPendingQuantity(props_1.row.row), "/").concat(props_1.row.row.quantity_cones || 0, ")")),
            }));
            var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{
                    color: "orange",
                    label: ("Ch\u1EDD nh\u1EADp (".concat(__VLS_ctx.getPendingQuantity(props_1.row.row), "/").concat(props_1.row.row.quantity_cones || 0, ")")),
                }], __VLS_functionalComponentArgsRest(__VLS_100), false));
        }
        else {
            var __VLS_104 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
                color: "grey",
                label: ("Ch\u1EDD nh\u1EADp (".concat(props_1.row.row.quantity_cones || 0, ")")),
            }));
            var __VLS_106 = __VLS_105.apply(void 0, __spreadArray([{
                    color: "grey",
                    label: ("Ch\u1EDD nh\u1EADp (".concat(props_1.row.row.quantity_cones || 0, ")")),
                }], __VLS_functionalComponentArgsRest(__VLS_105), false));
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
        /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-center" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    if (props_1.row.row.status === __VLS_ctx.DeliveryStatus.PENDING) {
        var __VLS_109 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109(__assign({ 'onClick': {} }, { size: "sm", color: "green", label: "Đã giao", dense: true, flat: true })));
        var __VLS_111 = __VLS_110.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { size: "sm", color: "green", label: "Đã giao", dense: true, flat: true })], __VLS_functionalComponentArgsRest(__VLS_110), false));
        var __VLS_114 = void 0;
        var __VLS_115 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(props_1.row.row.status === __VLS_ctx.DeliveryStatus.PENDING))
                        return;
                    __VLS_ctx.openDeliveredDialog(props_1.row.row);
                    // @ts-ignore
                    [getDaysColor, enums_1.DeliveryStatus, enums_1.DeliveryStatus, enums_1.DeliveryStatus, enums_1.DeliveryStatus, enums_1.DeliveryStatus, enums_1.InventoryReceiptStatus, enums_1.InventoryReceiptStatus, getPendingQuantity, openDeliveredDialog,];
                } });
        var __VLS_112;
        var __VLS_113;
    }
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_67;
// @ts-ignore
[];
var __VLS_37;
var __VLS_116;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({
    name: "receive",
}));
var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([{
        name: "receive",
    }], __VLS_functionalComponentArgsRest(__VLS_117), false));
var __VLS_121 = __VLS_119.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mb-md q-gutter-sm items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_122;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122({}));
var __VLS_124 = __VLS_123.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_123), false));
var __VLS_127;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_128 = __VLS_asFunctionalComponent1(__VLS_127, new __VLS_127(__assign({ 'onClick': {} }, { color: "primary", icon: "refresh", label: "Tải lại", loading: (__VLS_ctx.loadingReceive) })));
var __VLS_129 = __VLS_128.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "refresh", label: "Tải lại", loading: (__VLS_ctx.loadingReceive) })], __VLS_functionalComponentArgsRest(__VLS_128), false));
var __VLS_132;
var __VLS_133 = ({ click: {} },
    { onClick: (__VLS_ctx.loadReceiveData) });
var __VLS_130;
var __VLS_131;
var __VLS_134;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({
    rows: (__VLS_ctx.pendingReceiveItems),
    columns: (__VLS_ctx.receiveColumns),
    rowKey: "id",
    loading: (__VLS_ctx.loadingReceive),
    flat: true,
    bordered: true,
    dense: true,
    rowsPerPageOptions: ([20, 50, 0]),
    pagination: ({ rowsPerPage: 20 }),
}));
var __VLS_136 = __VLS_135.apply(void 0, __spreadArray([{
        rows: (__VLS_ctx.pendingReceiveItems),
        columns: (__VLS_ctx.receiveColumns),
        rowKey: "id",
        loading: (__VLS_ctx.loadingReceive),
        flat: true,
        bordered: true,
        dense: true,
        rowsPerPageOptions: ([20, 50, 0]),
        pagination: ({ rowsPerPage: 20 }),
    }], __VLS_functionalComponentArgsRest(__VLS_135), false));
var __VLS_139 = __VLS_137.slots.default;
{
    var __VLS_140 = __VLS_137.slots["body-cell-color_name"];
    var props = __VLS_vSlot(__VLS_140)[0];
    var __VLS_141 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_142 = __VLS_asFunctionalComponent1(__VLS_141, new __VLS_141({
        props: (props),
    }));
    var __VLS_143 = __VLS_142.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_142), false));
    var __VLS_146 = __VLS_144.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-xs no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    if (props.row.color_hex) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ style: {} }, { style: ({ backgroundColor: props.row.color_hex }) }));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props.row.color_name || '—');
    // @ts-ignore
    [loadingReceive, loadingReceive, loadReceiveData, pendingReceiveItems, receiveColumns,];
    var __VLS_144;
    // @ts-ignore
    [];
}
{
    var __VLS_147 = __VLS_137.slots["body-cell-inventory_status"];
    var props = __VLS_vSlot(__VLS_147)[0];
    var __VLS_148 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_149 = __VLS_asFunctionalComponent1(__VLS_148, new __VLS_148({
        props: (props),
    }));
    var __VLS_150 = __VLS_149.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_149), false));
    var __VLS_153 = __VLS_151.slots.default;
    var __VLS_154 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_155 = __VLS_asFunctionalComponent1(__VLS_154, new __VLS_154({
        color: (__VLS_ctx.getInventoryStatusColor(props.row.inventory_status)),
        label: (__VLS_ctx.getInventoryStatusLabel(props.row.inventory_status)),
    }));
    var __VLS_156 = __VLS_155.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getInventoryStatusColor(props.row.inventory_status)),
            label: (__VLS_ctx.getInventoryStatusLabel(props.row.inventory_status)),
        }], __VLS_functionalComponentArgsRest(__VLS_155), false));
    // @ts-ignore
    [getInventoryStatusColor, getInventoryStatusLabel,];
    var __VLS_151;
    // @ts-ignore
    [];
}
{
    var __VLS_159 = __VLS_137.slots["body-cell-pending_quantity"];
    var props = __VLS_vSlot(__VLS_159)[0];
    var __VLS_160 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160({
        props: (props),
    }));
    var __VLS_162 = __VLS_161.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_161), false));
    var __VLS_165 = __VLS_163.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: ({ 'text-negative text-weight-bold': __VLS_ctx.getPendingQuantity(props.row) > 0 }) }));
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (__VLS_ctx.getPendingQuantity(props.row));
    // @ts-ignore
    [getPendingQuantity, getPendingQuantity,];
    var __VLS_163;
    // @ts-ignore
    [];
}
{
    var __VLS_166 = __VLS_137.slots["body-cell-actions"];
    var props_2 = __VLS_vSlot(__VLS_166)[0];
    var __VLS_167 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_168 = __VLS_asFunctionalComponent1(__VLS_167, new __VLS_167({
        props: (props_2),
    }));
    var __VLS_169 = __VLS_168.apply(void 0, __spreadArray([{
            props: (props_2),
        }], __VLS_functionalComponentArgsRest(__VLS_168), false));
    var __VLS_172 = __VLS_170.slots.default;
    if (__VLS_ctx.getPendingQuantity(props_2.row) > 0) {
        var __VLS_173 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_174 = __VLS_asFunctionalComponent1(__VLS_173, new __VLS_173(__assign({ 'onClick': {} }, { size: "sm", color: "primary", label: "Nhập kho", dense: true })));
        var __VLS_175 = __VLS_174.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { size: "sm", color: "primary", label: "Nhập kho", dense: true })], __VLS_functionalComponentArgsRest(__VLS_174), false));
        var __VLS_178 = void 0;
        var __VLS_179 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.getPendingQuantity(props_2.row) > 0))
                        return;
                    __VLS_ctx.openReceiveDialog(props_2.row);
                    // @ts-ignore
                    [getPendingQuantity, openReceiveDialog,];
                } });
        var __VLS_176;
        var __VLS_177;
    }
    // @ts-ignore
    [];
    var __VLS_170;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_137;
// @ts-ignore
[];
var __VLS_119;
// @ts-ignore
[];
var __VLS_31;
var __VLS_180;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180({
    modelValue: (__VLS_ctx.showDeliveredDialog),
}));
var __VLS_182 = __VLS_181.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showDeliveredDialog),
    }], __VLS_functionalComponentArgsRest(__VLS_181), false));
var __VLS_185 = __VLS_183.slots.default;
var __VLS_186;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_187 = __VLS_asFunctionalComponent1(__VLS_186, new __VLS_186(__assign({ style: {} })));
var __VLS_188 = __VLS_187.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_187), false));
var __VLS_191 = __VLS_189.slots.default;
var __VLS_192;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_193 = __VLS_asFunctionalComponent1(__VLS_192, new __VLS_192({}));
var __VLS_194 = __VLS_193.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_193), false));
var __VLS_197 = __VLS_195.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
// @ts-ignore
[showDeliveredDialog,];
var __VLS_195;
var __VLS_198;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_199 = __VLS_asFunctionalComponent1(__VLS_198, new __VLS_198({}));
var __VLS_200 = __VLS_199.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_199), false));
var __VLS_203 = __VLS_201.slots.default;
if (__VLS_ctx.selectedDelivery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedDelivery.thread_type_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.br)({});
    (__VLS_ctx.selectedDelivery.supplier_name);
}
var __VLS_204 = DatePicker_vue_1.default;
// @ts-ignore
var __VLS_205 = __VLS_asFunctionalComponent1(__VLS_204, new __VLS_204({
    modelValue: (__VLS_ctx.actualDeliveryDate),
    label: "Ngày giao thực tế",
}));
var __VLS_206 = __VLS_205.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.actualDeliveryDate),
        label: "Ngày giao thực tế",
    }], __VLS_functionalComponentArgsRest(__VLS_205), false));
// @ts-ignore
[selectedDelivery, selectedDelivery, selectedDelivery, actualDeliveryDate,];
var __VLS_201;
var __VLS_209;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_210 = __VLS_asFunctionalComponent1(__VLS_209, new __VLS_209({
    align: "right",
}));
var __VLS_211 = __VLS_210.apply(void 0, __spreadArray([{
        align: "right",
    }], __VLS_functionalComponentArgsRest(__VLS_210), false));
var __VLS_214 = __VLS_212.slots.default;
var __VLS_215;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_216 = __VLS_asFunctionalComponent1(__VLS_215, new __VLS_215({
    flat: true,
    label: "Hủy",
}));
var __VLS_217 = __VLS_216.apply(void 0, __spreadArray([{
        flat: true,
        label: "Hủy",
    }], __VLS_functionalComponentArgsRest(__VLS_216), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_220;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_221 = __VLS_asFunctionalComponent1(__VLS_220, new __VLS_220(__assign({ 'onClick': {} }, { color: "primary", label: "Xác nhận", loading: (__VLS_ctx.updating) })));
var __VLS_222 = __VLS_221.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Xác nhận", loading: (__VLS_ctx.updating) })], __VLS_functionalComponentArgsRest(__VLS_221), false));
var __VLS_225;
var __VLS_226 = ({ click: {} },
    { onClick: (__VLS_ctx.confirmDelivered) });
var __VLS_223;
var __VLS_224;
// @ts-ignore
[vClosePopup, updating, confirmDelivered,];
var __VLS_212;
// @ts-ignore
[];
var __VLS_189;
// @ts-ignore
[];
var __VLS_183;
var __VLS_227;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_228 = __VLS_asFunctionalComponent1(__VLS_227, new __VLS_227({
    modelValue: (__VLS_ctx.showReceiveDialog),
}));
var __VLS_229 = __VLS_228.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showReceiveDialog),
    }], __VLS_functionalComponentArgsRest(__VLS_228), false));
var __VLS_232 = __VLS_230.slots.default;
var __VLS_233;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_234 = __VLS_asFunctionalComponent1(__VLS_233, new __VLS_233(__assign({ style: {} })));
var __VLS_235 = __VLS_234.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_234), false));
var __VLS_238 = __VLS_236.slots.default;
var __VLS_239;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_240 = __VLS_asFunctionalComponent1(__VLS_239, new __VLS_239({}));
var __VLS_241 = __VLS_240.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_240), false));
var __VLS_244 = __VLS_242.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
// @ts-ignore
[showReceiveDialog,];
var __VLS_242;
var __VLS_245;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_246 = __VLS_asFunctionalComponent1(__VLS_245, new __VLS_245({}));
var __VLS_247 = __VLS_246.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_246), false));
var __VLS_250 = __VLS_248.slots.default;
if (__VLS_ctx.selectedReceiveDelivery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedReceiveDelivery.thread_type_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    (__VLS_ctx.selectedReceiveDelivery.supplier_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    (__VLS_ctx.selectedReceiveDelivery.week_name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "q-mb-none" }));
    /** @type {__VLS_StyleScopedClasses['q-mb-none']} */ ;
    (__VLS_ctx.selectedReceiveDelivery.quantity_cones || 0);
    (__VLS_ctx.selectedReceiveDelivery.received_quantity || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)(__assign({ class: "text-negative" }));
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    (__VLS_ctx.getPendingQuantity(__VLS_ctx.selectedReceiveDelivery));
}
var __VLS_251;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_252 = __VLS_asFunctionalComponent1(__VLS_251, new __VLS_251(__assign({ class: "q-mb-md" })));
var __VLS_253 = __VLS_252.apply(void 0, __spreadArray([__assign({ class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_252), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_256 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_257 = __VLS_asFunctionalComponent1(__VLS_256, new __VLS_256({
    modelValue: (__VLS_ctx.receiveForm.warehouse_id),
    options: (__VLS_ctx.warehouseOptions),
    label: "Kho nhập *",
    optionValue: "id",
    optionLabel: "name",
    useInput: true,
    fillInput: true,
    hideSelected: true,
    emitValue: true,
    mapOptions: true,
    rules: ([function (v) { return !!v || 'Vui lòng chọn kho nhập'; }]),
}));
var __VLS_258 = __VLS_257.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.receiveForm.warehouse_id),
        options: (__VLS_ctx.warehouseOptions),
        label: "Kho nhập *",
        optionValue: "id",
        optionLabel: "name",
        useInput: true,
        fillInput: true,
        hideSelected: true,
        emitValue: true,
        mapOptions: true,
        rules: ([function (v) { return !!v || 'Vui lòng chọn kho nhập'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_257), false));
var __VLS_261 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_262 = __VLS_asFunctionalComponent1(__VLS_261, new __VLS_261(__assign({ modelValue: (__VLS_ctx.receiveForm.quantity), modelModifiers: { number: true, }, type: "number", label: "Số lượng nhập *", min: (1), max: (__VLS_ctx.selectedReceiveDelivery ? __VLS_ctx.getPendingQuantity(__VLS_ctx.selectedReceiveDelivery) : 9999), rules: ([function (v) { return v > 0 || 'Số lượng phải lớn hơn 0'; }]) }, { class: "q-mt-md" })));
var __VLS_263 = __VLS_262.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.receiveForm.quantity), modelModifiers: { number: true, }, type: "number", label: "Số lượng nhập *", min: (1), max: (__VLS_ctx.selectedReceiveDelivery ? __VLS_ctx.getPendingQuantity(__VLS_ctx.selectedReceiveDelivery) : 9999), rules: ([function (v) { return v > 0 || 'Số lượng phải lớn hơn 0'; }]) }, { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_262), false));
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
var __VLS_266 = DatePicker_vue_1.default;
// @ts-ignore
var __VLS_267 = __VLS_asFunctionalComponent1(__VLS_266, new __VLS_266(__assign({ modelValue: (__VLS_ctx.receiveForm.expiry_date), label: "Ngày hết hạn (tùy chọn)" }, { class: "q-mt-md" })));
var __VLS_268 = __VLS_267.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.receiveForm.expiry_date), label: "Ngày hết hạn (tùy chọn)" }, { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_267), false));
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md text-grey-7" }));
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
var __VLS_271;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_272 = __VLS_asFunctionalComponent1(__VLS_271, new __VLS_271(__assign({ name: "person", size: "sm" }, { class: "q-mr-xs" })));
var __VLS_273 = __VLS_272.apply(void 0, __spreadArray([__assign({ name: "person", size: "sm" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_272), false));
/** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
(__VLS_ctx.currentUser);
// @ts-ignore
[getPendingQuantity, getPendingQuantity, selectedReceiveDelivery, selectedReceiveDelivery, selectedReceiveDelivery, selectedReceiveDelivery, selectedReceiveDelivery, selectedReceiveDelivery, selectedReceiveDelivery, selectedReceiveDelivery, selectedReceiveDelivery, receiveForm, receiveForm, receiveForm, warehouseOptions, currentUser,];
var __VLS_248;
var __VLS_276;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_277 = __VLS_asFunctionalComponent1(__VLS_276, new __VLS_276({
    align: "right",
}));
var __VLS_278 = __VLS_277.apply(void 0, __spreadArray([{
        align: "right",
    }], __VLS_functionalComponentArgsRest(__VLS_277), false));
var __VLS_281 = __VLS_279.slots.default;
var __VLS_282;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_283 = __VLS_asFunctionalComponent1(__VLS_282, new __VLS_282({
    flat: true,
    label: "Hủy",
}));
var __VLS_284 = __VLS_283.apply(void 0, __spreadArray([{
        flat: true,
        label: "Hủy",
    }], __VLS_functionalComponentArgsRest(__VLS_283), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_287;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_288 = __VLS_asFunctionalComponent1(__VLS_287, new __VLS_287(__assign({ 'onClick': {} }, { color: "primary", label: "Nhập kho", loading: (__VLS_ctx.receiving), disable: (!__VLS_ctx.receiveForm.warehouse_id || __VLS_ctx.receiveForm.quantity < 1) })));
var __VLS_289 = __VLS_288.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Nhập kho", loading: (__VLS_ctx.receiving), disable: (!__VLS_ctx.receiveForm.warehouse_id || __VLS_ctx.receiveForm.quantity < 1) })], __VLS_functionalComponentArgsRest(__VLS_288), false));
var __VLS_292;
var __VLS_293 = ({ click: {} },
    { onClick: (__VLS_ctx.confirmReceive) });
var __VLS_290;
var __VLS_291;
// @ts-ignore
[vClosePopup, receiveForm, receiveForm, receiving, confirmReceive,];
var __VLS_279;
// @ts-ignore
[];
var __VLS_236;
// @ts-ignore
[];
var __VLS_230;
if (__VLS_ctx.receiveResult) {
    var __VLS_294 = ReceiveResultDialog_vue_1.default;
    // @ts-ignore
    var __VLS_295 = __VLS_asFunctionalComponent1(__VLS_294, new __VLS_294(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.showResultDialog), result: (__VLS_ctx.receiveResult) })));
    var __VLS_296 = __VLS_295.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.showResultDialog), result: (__VLS_ctx.receiveResult) })], __VLS_functionalComponentArgsRest(__VLS_295), false));
    var __VLS_299 = void 0;
    var __VLS_300 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onResultDialogClose) });
    var __VLS_297;
    var __VLS_298;
}
// @ts-ignore
[receiveResult, receiveResult, showResultDialog, onResultDialogClose,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
