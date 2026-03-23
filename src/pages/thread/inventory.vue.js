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
var _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var quasar_1 = require("quasar");
var composables_1 = require("@/composables");
var useAuth_1 = require("@/composables/useAuth");
var enums_1 = require("@/types/thread/enums");
var qr_1 = require("@/components/qr");
var ConeSummaryTable_vue_1 = require("@/components/thread/ConeSummaryTable.vue");
var ConeWarehouseBreakdownDialog_vue_1 = require("@/components/thread/ConeWarehouseBreakdownDialog.vue");
var threadService_1 = require("@/services/threadService");
var stockService_1 = require("@/services/stockService");
var api_1 = require("@/services/api");
var supplierService_1 = require("@/services/supplierService");
// Composables
var $q = (0, quasar_1.useQuasar)();
var snackbar = (0, composables_1.useSnackbar)();
var hasPermission = (0, useAuth_1.useAuth)().hasPermission;
var canReceive = (0, vue_1.computed)(function () { return hasPermission('thread.batch.receive'); });
var _j = (0, composables_1.useInventory)(), inventory = _j.inventory, isLoading = _j.isLoading, fetchInventory = _j.fetchInventory, receiveStock = _j.receiveStock, enableRealtime = _j.enableRealtime, disableRealtime = _j.disableRealtime, totalCount = _j.totalCount, handleTableRequest = _j.handleTableRequest, currentPage = _j.currentPage;
var _k = (0, composables_1.useThreadTypes)(), threadTypes = _k.threadTypes, fetchThreadTypes = _k.fetchThreadTypes, threadTypesLoading = _k.loading;
var _l = (0, composables_1.useWarehouses)(), warehouseOptions = _l.warehouseOptions, storageOptions = _l.storageOptions, fetchWarehouses = _l.fetchWarehouses, warehousesLoading = _l.loading;
var _m = (0, composables_1.useSuppliers)(), suppliers = _m.suppliers, fetchSuppliers = _m.fetchSuppliers, suppliersLoading = _m.loading;
// Cone Summary Composable
var _o = (0, composables_1.useConeSummary)(), coneSummaryList = _o.summaryList, warehouseBreakdown = _o.warehouseBreakdown, supplierBreakdown = _o.supplierBreakdown, selectedConeSummary = _o.selectedThreadType, coneSummaryLoading = _o.isLoading, breakdownLoading = _o.breakdownLoading, fetchConeSummary = _o.fetchSummary, selectThreadType = _o.selectThreadType, enableSummaryRealtime = _o.enableRealtime, disableSummaryRealtime = _o.disableRealtime;
// Local State
var activeTab = (0, vue_1.ref)('summary');
var showBreakdownDialog = (0, vue_1.ref)(false);
var searchQuery = (0, vue_1.ref)('');
var filters = (0, vue_1.reactive)({
    thread_type_id: undefined,
    status: undefined,
    warehouse_id: undefined,
    supplier_id: undefined,
});
var pagination = (0, vue_1.ref)({
    page: 1,
    rowsPerPage: 25,
    sortBy: 'received_date',
    descending: true,
    rowsNumber: 0,
});
// Labels and Options
var statusLabels = (_a = {},
    _a[enums_1.ConeStatus.RECEIVED] = 'Đã nhập',
    _a[enums_1.ConeStatus.INSPECTED] = 'Đã kiểm',
    _a[enums_1.ConeStatus.AVAILABLE] = 'Khả dụng',
    _a[enums_1.ConeStatus.SOFT_ALLOCATED] = 'Đặt mềm',
    _a[enums_1.ConeStatus.HARD_ALLOCATED] = 'Đặt cứng',
    _a[enums_1.ConeStatus.IN_PRODUCTION] = 'Đang dùng',
    _a[enums_1.ConeStatus.PARTIAL_RETURN] = 'Hoàn dư',
    _a[enums_1.ConeStatus.PENDING_WEIGH] = 'Chờ cân',
    _a[enums_1.ConeStatus.CONSUMED] = 'Đã hết',
    _a[enums_1.ConeStatus.WRITTEN_OFF] = 'Loại bỏ',
    _a[enums_1.ConeStatus.QUARANTINE] = 'Cách ly',
    _a[enums_1.ConeStatus.RESERVED_FOR_ORDER] = 'Đặt trước đơn hàng',
    _a);
var getStatusColor = function (status) {
    switch (status) {
        case enums_1.ConeStatus.RECEIVED:
        case enums_1.ConeStatus.INSPECTED: return 'info';
        case enums_1.ConeStatus.AVAILABLE: return 'positive';
        case enums_1.ConeStatus.SOFT_ALLOCATED:
        case enums_1.ConeStatus.HARD_ALLOCATED: return 'warning';
        case enums_1.ConeStatus.IN_PRODUCTION: return 'accent';
        case enums_1.ConeStatus.PARTIAL_RETURN: return 'orange';
        case enums_1.ConeStatus.PENDING_WEIGH: return 'deep-orange';
        case enums_1.ConeStatus.CONSUMED: return 'grey';
        case enums_1.ConeStatus.WRITTEN_OFF:
        case enums_1.ConeStatus.QUARANTINE: return 'negative';
        default: return 'grey';
    }
};
var statusOptions = (0, vue_1.computed)(function () {
    return Object.entries(statusLabels).map(function (_a) {
        var value = _a[0], label = _a[1];
        return ({
            label: label,
            value: value,
        });
    });
});
var threadTypeOptions = (0, vue_1.computed)(function () {
    return threadTypes.value.map(function (t) { return ({
        label: "".concat(t.code, " - ").concat(t.name),
        value: t.id
    }); });
});
var supplierOptions = (0, vue_1.computed)(function () {
    return suppliers.value.filter(function (s) { return s.is_active; }).map(function (s) { return ({
        label: "".concat(s.code, " - ").concat(s.name),
        value: s.id
    }); });
});
// Warehouse options from centralized composable
// Table Configuration
var columns = [
    {
        name: 'cone_id',
        label: 'Mã Cuộn',
        field: 'cone_id',
        align: 'left',
        sortable: true,
    },
    {
        name: 'thread_type',
        label: 'Loại Chỉ',
        field: function (row) { var _a; return (_a = row.thread_type) === null || _a === void 0 ? void 0 : _a.name; },
        align: 'left',
        sortable: false,
    },
    {
        name: 'quantity_meters',
        label: 'Số Mét',
        field: 'quantity_meters',
        align: 'right',
        sortable: true,
        format: function (val) { return val.toLocaleString(); },
    },
    {
        name: 'weight_grams',
        label: 'Trọng Lượng (g)',
        field: 'weight_grams',
        align: 'right',
        sortable: true,
        format: function (val) { return val ? val.toLocaleString() : '---'; },
    },
    {
        name: 'status',
        label: 'Trạng Thái',
        field: 'status',
        align: 'center',
        sortable: true,
    },
    {
        name: 'warehouse_code',
        label: 'Kho',
        field: 'warehouse_code',
        align: 'left',
        sortable: false,
    },
    {
        name: 'lot_number',
        label: 'Số Lô',
        field: 'lot_number',
        align: 'left',
        sortable: true,
    },
    {
        name: 'is_partial',
        label: 'Còn Dư',
        field: 'is_partial',
        align: 'center',
        sortable: true,
    },
    {
        name: 'received_date',
        label: 'Ngày Nhập',
        field: 'received_date',
        align: 'left',
        sortable: true,
        format: function (val) { return formatDate(val); },
    },
    {
        name: 'actions',
        label: 'Thao Tác',
        field: 'actions',
        align: 'center',
    },
];
// Handlers
var handleFilterChange = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, vue_1.nextTick)()];
            case 1:
                _a.sent();
                pagination.value.page = 1;
                currentPage.value = 1;
                fetchInventory(__assign({ search: searchQuery.value || undefined }, filters));
                if (activeTab.value === 'summary') {
                    fetchConeSummary({
                        warehouse_id: filters.warehouse_id,
                        supplier_id: filters.supplier_id,
                    });
                }
                return [2 /*return*/];
        }
    });
}); };
var handleSupplierFilterChange = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, vue_1.nextTick)()];
            case 1:
                _a.sent();
                fetchConeSummary({
                    warehouse_id: filters.warehouse_id,
                    supplier_id: filters.supplier_id,
                });
                return [2 /*return*/];
        }
    });
}); };
var onTableRequest = function (props) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pagination.value.page = props.pagination.page;
                pagination.value.rowsPerPage = props.pagination.rowsPerPage;
                pagination.value.sortBy = props.pagination.sortBy;
                pagination.value.descending = props.pagination.descending;
                return [4 /*yield*/, handleTableRequest(props)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
// Watchers
(0, vue_1.watch)(totalCount, function (newCount) {
    pagination.value.rowsNumber = newCount;
});
(0, vue_1.watch)(searchQuery, function (newVal) {
    pagination.value.page = 1;
    currentPage.value = 1;
    fetchInventory(__assign({ search: newVal || undefined }, filters));
});
// Dialog States
var receiptDialog = (0, vue_1.reactive)({
    isOpen: false,
});
var detailDialog = (0, vue_1.reactive)({
    isOpen: false,
    cone: null,
});
// QR Scanner and Print states
var showQrScanner = (0, vue_1.ref)(false);
var showPrintDialog = (0, vue_1.ref)(false);
var printCones = (0, vue_1.ref)([]);
// Receipt Form Data
var receiptData = (0, vue_1.reactive)({
    thread_type_id: 0,
    color_id: undefined,
    warehouse_id: 1, // Default to first warehouse
    quantity_cones: 1,
    weight_per_cone_grams: undefined,
    lot_number: '',
    expiry_date: '',
    location: '',
});
var receiptColors = (0, vue_1.ref)([]);
var loadingReceiptColors = (0, vue_1.ref)(false);
var receiptColorOptions = (0, vue_1.computed)(function () {
    return receiptColors.value.map(function (c) { return ({
        label: c.name,
        value: c.id,
    }); });
});
(0, vue_1.watch)(function () { return receiptData.thread_type_id; }, function (newThreadTypeId) { return __awaiter(void 0, void 0, void 0, function () {
    var selectedType, supplierId, colors, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                receiptData.color_id = undefined;
                receiptColors.value = [];
                if (!newThreadTypeId)
                    return [2 /*return*/];
                selectedType = threadTypes.value.find(function (t) { return t.id === newThreadTypeId; });
                supplierId = selectedType === null || selectedType === void 0 ? void 0 : selectedType.supplier_id;
                if (!supplierId)
                    return [2 /*return*/];
                loadingReceiptColors.value = true;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, supplierService_1.supplierService.getColors(supplierId)];
            case 2:
                colors = _b.sent();
                receiptColors.value = colors
                    .filter(function (link) { var _a; return (_a = link.color) === null || _a === void 0 ? void 0 : _a.is_active; })
                    .map(function (link) { return link.color; });
                return [3 /*break*/, 5];
            case 3:
                _a = _b.sent();
                receiptColors.value = [];
                return [3 /*break*/, 5];
            case 4:
                loadingReceiptColors.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Methods
var openReceiptDialog = function () {
    resetReceiptData();
    receiptDialog.isOpen = true;
};
var closeReceiptDialog = function () {
    receiptDialog.isOpen = false;
};
var resetReceiptData = function () {
    var _a;
    Object.assign(receiptData, {
        thread_type_id: ((_a = threadTypes.value[0]) === null || _a === void 0 ? void 0 : _a.id) || 0,
        color_id: undefined,
        warehouse_id: 1,
        quantity_cones: 1,
        weight_per_cone_grams: undefined,
        lot_number: '',
        expiry_date: '',
        location: '',
    });
    receiptColors.value = [];
};
var handleReceiptSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var newCones;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!receiptData.thread_type_id || !receiptData.warehouse_id || receiptData.quantity_cones < 1) {
                    snackbar.warning('Vui lòng điền đầy đủ các thông tin bắt buộc');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, receiveStock(__assign({}, receiptData))];
            case 1:
                newCones = _a.sent();
                if (!(newCones && newCones.length > 0)) return [3 /*break*/, 3];
                closeReceiptDialog();
                return [4 /*yield*/, Promise.all([
                        fetchInventory(__assign({ search: searchQuery.value || undefined }, filters)),
                        fetchConeSummary({ warehouse_id: filters.warehouse_id, supplier_id: filters.supplier_id })
                    ])
                    // Offer to print labels for newly created cones
                ];
            case 2:
                _a.sent();
                // Offer to print labels for newly created cones
                $q.dialog({
                    title: 'In nhãn QR',
                    message: "\u0110\u00E3 nh\u1EADp ".concat(newCones.length, " cu\u1ED9n ch\u1EC9 th\u00E0nh c\u00F4ng. B\u1EA1n c\u00F3 mu\u1ED1n in nh\u00E3n QR kh\u00F4ng?"),
                    cancel: { label: 'Bỏ qua', flat: true },
                    ok: { label: 'In nhãn', color: 'primary' },
                    persistent: true,
                }).onOk(function () {
                    // Convert cones to label data and open print dialog
                    printCones.value = newCones.map(function (cone) {
                        var _a, _b, _c, _d;
                        return ({
                            cone_id: cone.cone_id,
                            lot_number: (_a = cone.lot_number) !== null && _a !== void 0 ? _a : undefined,
                            thread_type_code: (_b = cone.thread_type) === null || _b === void 0 ? void 0 : _b.code,
                            thread_type_name: (_c = cone.thread_type) === null || _c === void 0 ? void 0 : _c.name,
                            weight_grams: (_d = cone.weight_grams) !== null && _d !== void 0 ? _d : undefined,
                            quantity_meters: cone.quantity_meters,
                        });
                    });
                    showPrintDialog.value = true;
                });
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
var openDetailDialog = function (cone) {
    detailDialog.cone = cone;
    detailDialog.isOpen = true;
};
// QR Lookup handlers
var handleQrLookup = function (code) {
    // Find cone in current inventory
    var cone = inventory.value.find(function (c) { return c.cone_id === code; });
    if (cone) {
        // Clear filters to ensure cone is visible
        searchQuery.value = code;
        snackbar.success("\u0110\u00E3 t\u00ECm th\u1EA5y: ".concat(code));
        // Open detail dialog
        openDetailDialog(cone);
    }
    else {
        // Try fetching with search
        searchQuery.value = code;
        snackbar.info("\u0110ang t\u00ECm ki\u1EBFm: ".concat(code));
    }
    showQrScanner.value = false;
};
// Print QR handlers
var openPrintSingle = function (cone) {
    var _a, _b, _c, _d;
    printCones.value = [{
            cone_id: cone.cone_id,
            lot_number: (_a = cone.lot_number) !== null && _a !== void 0 ? _a : undefined,
            thread_type_code: (_b = cone.thread_type) === null || _b === void 0 ? void 0 : _b.code,
            thread_type_name: (_c = cone.thread_type) === null || _c === void 0 ? void 0 : _c.name,
            weight_grams: (_d = cone.weight_grams) !== null && _d !== void 0 ? _d : undefined,
            quantity_meters: cone.quantity_meters,
        }];
    showPrintDialog.value = true;
};
// ============ Manual Stock Entry ============
var showManualEntryDialog = (0, vue_1.ref)(false);
var manualEntryLoading = (0, vue_1.ref)(false);
var manualEntrySubmitting = (0, vue_1.ref)(false);
var manualEntryThreadTypes = (0, vue_1.ref)([]);
var manualSupplierColors = (0, vue_1.ref)([]);
var manualSupplierRequestId = 0;
var manualEntryForm = (0, vue_1.reactive)({
    supplier_id: null,
    tex_number: null,
    thread_type_id: null,
    color_id: null,
    warehouse_id: null,
    qty_full_cones: 0,
    qty_partial_cones: 0,
});
var resetManualEntryForm = function () {
    manualEntryForm.supplier_id = null;
    manualEntryForm.tex_number = null;
    manualEntryForm.thread_type_id = null;
    manualEntryForm.color_id = null;
    manualEntryForm.warehouse_id = null;
    manualEntryForm.qty_full_cones = 0;
    manualEntryForm.qty_partial_cones = 0;
    manualEntryThreadTypes.value = [];
    manualSupplierColors.value = [];
};
var manualSupplierOptions = (0, vue_1.computed)(function () {
    return suppliers.value.filter(function (s) { return s.is_active; }).map(function (s) { return ({
        label: "".concat(s.code, " - ").concat(s.name),
        value: s.id,
    }); });
});
var manualTexOptions = (0, vue_1.computed)(function () {
    var _a;
    var texSet = new Map();
    for (var _i = 0, _b = manualEntryThreadTypes.value; _i < _b.length; _i++) {
        var tt = _b[_i];
        if (tt.tex_number != null) {
            var texLabel = (_a = tt.tex_label) === null || _a === void 0 ? void 0 : _a.trim();
            texSet.set(tt.tex_number, texLabel ? "".concat(tt.tex_number, " - ").concat(texLabel) : "Tex ".concat(tt.tex_number));
        }
    }
    return Array.from(texSet.entries()).map(function (_a) {
        var value = _a[0], label = _a[1];
        return ({ label: label, value: value });
    });
});
var manualColorOptions = (0, vue_1.computed)(function () {
    return manualSupplierColors.value.map(function (c) { return ({
        label: c.name,
        value: c.id,
        hex: c.hex_code,
    }); });
});
var manualWarehouseOptions = (0, vue_1.computed)(function () { return storageOptions.value; });
var onManualSupplierChange = function (supplierId) { return __awaiter(void 0, void 0, void 0, function () {
    var requestId, _a, threads, colors, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                manualEntryForm.tex_number = null;
                manualEntryForm.thread_type_id = null;
                manualEntryForm.color_id = null;
                manualEntryThreadTypes.value = [];
                manualSupplierColors.value = [];
                if (!supplierId)
                    return [2 /*return*/];
                requestId = ++manualSupplierRequestId;
                manualEntryLoading.value = true;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, Promise.all([
                        threadService_1.threadService.getAll({ supplier_id: supplierId }),
                        supplierService_1.supplierService.getColors(supplierId),
                    ])];
            case 2:
                _a = _b.sent(), threads = _a[0], colors = _a[1];
                if (requestId !== manualSupplierRequestId)
                    return [2 /*return*/];
                manualEntryThreadTypes.value = threads;
                manualSupplierColors.value = colors
                    .filter(function (link) { var _a; return (_a = link.color) === null || _a === void 0 ? void 0 : _a.is_active; })
                    .map(function (link) { return link.color; });
                return [3 /*break*/, 5];
            case 3:
                err_1 = _b.sent();
                if (requestId !== manualSupplierRequestId)
                    return [2 /*return*/];
                if (err_1 instanceof api_1.ApiError && err_1.status === 403) {
                    snackbar.error('Bạn không có quyền xem loại chỉ của nhà cung cấp này');
                }
                else {
                    snackbar.error('Lỗi khi tải loại chỉ cho nhà cung cấp này');
                }
                return [3 /*break*/, 5];
            case 4:
                if (requestId === manualSupplierRequestId) {
                    manualEntryLoading.value = false;
                }
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
var onManualTexChange = function () {
    var _a;
    manualEntryForm.color_id = null;
    var match = manualEntryThreadTypes.value.find(function (tt) { return tt.tex_number === manualEntryForm.tex_number; });
    manualEntryForm.thread_type_id = (_a = match === null || match === void 0 ? void 0 : match.id) !== null && _a !== void 0 ? _a : null;
};
var handleManualEntrySubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!manualEntryForm.thread_type_id || !manualEntryForm.warehouse_id) {
                    snackbar.warning('Vui lòng chọn đầy đủ loại chỉ và kho');
                    return [2 /*return*/];
                }
                if (manualEntryForm.qty_full_cones <= 0 && manualEntryForm.qty_partial_cones <= 0) {
                    snackbar.warning('Vui lòng nhập ít nhất một số lượng > 0');
                    return [2 /*return*/];
                }
                manualEntrySubmitting.value = true;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, stockService_1.stockService.addStock({
                        thread_type_id: manualEntryForm.thread_type_id,
                        supplier_id: manualEntryForm.supplier_id || undefined,
                        color_id: manualEntryForm.color_id || undefined,
                        warehouse_id: manualEntryForm.warehouse_id,
                        qty_full_cones: manualEntryForm.qty_full_cones || 0,
                        qty_partial_cones: manualEntryForm.qty_partial_cones || 0,
                        received_date: new Date().toISOString().slice(0, 10),
                    })];
            case 2:
                _a.sent();
                snackbar.success('Đã nhập kho thành công');
                showManualEntryDialog.value = false;
                resetManualEntryForm();
                return [3 /*break*/, 5];
            case 3:
                err_2 = _a.sent();
                if (err_2 instanceof api_1.ApiError && err_2.status === 403) {
                    snackbar.error('Bạn không có quyền thực hiện thao tác này');
                }
                else {
                    snackbar.error((err_2 === null || err_2 === void 0 ? void 0 : err_2.message) || 'Lỗi khi nhập kho');
                }
                return [3 /*break*/, 5];
            case 4:
                manualEntrySubmitting.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
(0, vue_1.watch)(showManualEntryDialog, function (isOpen) {
    if (isOpen) {
        fetchSuppliers();
    }
    else {
        resetManualEntryForm();
    }
});
var formatDate = function (dateString) {
    if (!dateString)
        return '---';
    var date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
};
// Cone Summary handlers
var handleSummaryRefresh = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetchConeSummary({
                    warehouse_id: filters.warehouse_id,
                    supplier_id: filters.supplier_id,
                })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var handleShowBreakdown = function (row) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, selectThreadType(row)];
            case 1:
                _a.sent();
                showBreakdownDialog.value = true;
                return [2 /*return*/];
        }
    });
}); };
// Watch for tab changes to fetch appropriate data
// Always refresh when switching to summary tab to ensure data consistency with detail view
(0, vue_1.watch)(activeTab, function (newTab) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(newTab === 'summary')) return [3 /*break*/, 2];
                return [4 /*yield*/, fetchConeSummary({
                        warehouse_id: filters.warehouse_id,
                        supplier_id: filters.supplier_id,
                    })];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
// Watch for warehouse filter changes to update summary if in summary tab
(0, vue_1.watch)(function () { return filters.warehouse_id; }, function (newWarehouseId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(activeTab.value === 'summary')) return [3 /*break*/, 2];
                return [4 /*yield*/, fetchConeSummary({
                        warehouse_id: newWarehouseId,
                        supplier_id: filters.supplier_id,
                    })];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    fetchInventory(),
                    fetchConeSummary({
                        warehouse_id: filters.warehouse_id,
                        supplier_id: filters.supplier_id,
                    }),
                    fetchThreadTypes(),
                    fetchWarehouses(),
                    fetchSuppliers()
                ])];
            case 1:
                _a.sent();
                enableRealtime();
                enableSummaryRealtime();
                return [2 /*return*/];
        }
    });
}); });
(0, vue_1.onUnmounted)(function () {
    disableRealtime();
    disableSummaryRealtime();
});
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['inventory-table']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm justify-end" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
if (__VLS_ctx.activeTab === 'detail') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        modelValue: (__VLS_ctx.searchQuery),
        placeholder: "Tìm mã cuộn, số lô...",
        outlined: true,
        dense: true,
        clearable: true,
        debounce: "300",
    }));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.searchQuery),
            placeholder: "Tìm mã cuộn, số lô...",
            outlined: true,
            dense: true,
            clearable: true,
            debounce: "300",
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
        [activeTab, searchQuery,];
    }
    // @ts-ignore
    [];
    var __VLS_10;
}
if (__VLS_ctx.activeTab === 'detail') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_19 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.thread_type_id), options: (__VLS_ctx.threadTypeOptions), label: "Loại chỉ", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })));
    var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.thread_type_id), options: (__VLS_ctx.threadTypeOptions), label: "Loại chỉ", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })], __VLS_functionalComponentArgsRest(__VLS_20), false));
    var __VLS_24 = void 0;
    var __VLS_25 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
    var __VLS_22;
    var __VLS_23;
}
if (__VLS_ctx.activeTab === 'detail') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_26 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.status), options: (__VLS_ctx.statusOptions), label: "Trạng thái", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true })));
    var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.status), options: (__VLS_ctx.statusOptions), label: "Trạng thái", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true })], __VLS_functionalComponentArgsRest(__VLS_27), false));
    var __VLS_31 = void 0;
    var __VLS_32 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
    var __VLS_29;
    var __VLS_30;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_33;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.warehouse_id), options: (__VLS_ctx.warehouseOptions), label: "Kho", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.warehouse_id), options: (__VLS_ctx.warehouseOptions), label: "Kho", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })], __VLS_functionalComponentArgsRest(__VLS_34), false));
var __VLS_38;
var __VLS_39 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
var __VLS_36;
var __VLS_37;
if (__VLS_ctx.activeTab === 'summary') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    var __VLS_40 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.supplier_id), options: (__VLS_ctx.supplierOptions), loading: (__VLS_ctx.suppliersLoading), label: "Nhà cung cấp", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })));
    var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.supplier_id), options: (__VLS_ctx.supplierOptions), loading: (__VLS_ctx.suppliersLoading), label: "Nhà cung cấp", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })], __VLS_functionalComponentArgsRest(__VLS_41), false));
    var __VLS_45 = void 0;
    var __VLS_46 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.handleSupplierFilterChange) });
    var __VLS_43;
    var __VLS_44;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
if (__VLS_ctx.canReceive) {
    var __VLS_47 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47(__assign(__assign({ 'onClick': {} }, { color: "teal", icon: "edit_note", label: "Nhập Thủ Công", outline: true }), { class: "full-width-xs" })));
    var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "teal", icon: "edit_note", label: "Nhập Thủ Công", outline: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_48), false));
    var __VLS_52 = void 0;
    var __VLS_53 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.canReceive))
                    return;
                __VLS_ctx.showManualEntryDialog = true;
                // @ts-ignore
                [activeTab, activeTab, activeTab, filters, filters, filters, filters, threadTypeOptions, handleFilterChange, handleFilterChange, handleFilterChange, statusOptions, warehouseOptions, supplierOptions, suppliersLoading, handleSupplierFilterChange, canReceive, showManualEntryDialog,];
            } });
    /** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
    var __VLS_50;
    var __VLS_51;
}
var __VLS_54;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54(__assign(__assign({ 'onClick': {} }, { color: "secondary", icon: "qr_code_scanner", label: "Quét tra cứu", outline: true }), { class: "full-width-xs" })));
var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "secondary", icon: "qr_code_scanner", label: "Quét tra cứu", outline: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_55), false));
var __VLS_59;
var __VLS_60 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showQrScanner = true;
            // @ts-ignore
            [showQrScanner,];
        } });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_57;
var __VLS_58;
var __VLS_61;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Nhập Kho", unelevated: true }), { class: "full-width-xs" })));
var __VLS_63 = __VLS_62.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Nhập Kho", unelevated: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_62), false));
var __VLS_66;
var __VLS_67 = ({ click: {} },
    { onClick: (__VLS_ctx.openReceiptDialog) });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_64;
var __VLS_65;
var __VLS_68;
/** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
qTabs;
// @ts-ignore
var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68(__assign(__assign({ modelValue: (__VLS_ctx.activeTab) }, { class: "text-primary q-mb-md" }), { activeColor: "primary", indicatorColor: "primary", narrowIndicator: true, align: "left" })));
var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.activeTab) }, { class: "text-primary q-mb-md" }), { activeColor: "primary", indicatorColor: "primary", narrowIndicator: true, align: "left" })], __VLS_functionalComponentArgsRest(__VLS_69), false));
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_73 = __VLS_71.slots.default;
var __VLS_74;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
    name: "summary",
    label: "Tổng hợp theo cuộn",
    icon: "summarize",
}));
var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([{
        name: "summary",
        label: "Tổng hợp theo cuộn",
        icon: "summarize",
    }], __VLS_functionalComponentArgsRest(__VLS_75), false));
var __VLS_79;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
    name: "detail",
    label: "Chi tiết cuộn",
    icon: "view_list",
}));
var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([{
        name: "detail",
        label: "Chi tiết cuộn",
        icon: "view_list",
    }], __VLS_functionalComponentArgsRest(__VLS_80), false));
// @ts-ignore
[activeTab, openReceiptDialog,];
var __VLS_71;
var __VLS_84;
/** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
qTabPanels;
// @ts-ignore
var __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
    modelValue: (__VLS_ctx.activeTab),
    animated: true,
    keepAlive: true,
}));
var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.activeTab),
        animated: true,
        keepAlive: true,
    }], __VLS_functionalComponentArgsRest(__VLS_85), false));
var __VLS_89 = __VLS_87.slots.default;
var __VLS_90;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90(__assign({ name: "summary" }, { class: "q-pa-none" })));
var __VLS_92 = __VLS_91.apply(void 0, __spreadArray([__assign({ name: "summary" }, { class: "q-pa-none" })], __VLS_functionalComponentArgsRest(__VLS_91), false));
/** @type {__VLS_StyleScopedClasses['q-pa-none']} */ ;
var __VLS_95 = __VLS_93.slots.default;
var __VLS_96 = ConeSummaryTable_vue_1.default;
// @ts-ignore
var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96(__assign(__assign({ 'onRefresh': {} }, { 'onShowBreakdown': {} }), { rows: (__VLS_ctx.coneSummaryList), loading: (__VLS_ctx.coneSummaryLoading) })));
var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([__assign(__assign({ 'onRefresh': {} }, { 'onShowBreakdown': {} }), { rows: (__VLS_ctx.coneSummaryList), loading: (__VLS_ctx.coneSummaryLoading) })], __VLS_functionalComponentArgsRest(__VLS_97), false));
var __VLS_101;
var __VLS_102 = ({ refresh: {} },
    { onRefresh: (__VLS_ctx.handleSummaryRefresh) });
var __VLS_103 = ({ showBreakdown: {} },
    { onShowBreakdown: (__VLS_ctx.handleShowBreakdown) });
var __VLS_99;
var __VLS_100;
// @ts-ignore
[activeTab, coneSummaryList, coneSummaryLoading, handleSummaryRefresh, handleShowBreakdown,];
var __VLS_93;
var __VLS_104;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104(__assign({ name: "detail" }, { class: "q-pa-none" })));
var __VLS_106 = __VLS_105.apply(void 0, __spreadArray([__assign({ name: "detail" }, { class: "q-pa-none" })], __VLS_functionalComponentArgsRest(__VLS_105), false));
/** @type {__VLS_StyleScopedClasses['q-pa-none']} */ ;
var __VLS_109 = __VLS_107.slots.default;
var __VLS_110;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110(__assign(__assign({ 'onRequest': {} }, { pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.inventory), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.isLoading), rowsPerPageOptions: ([10, 25, 50, 100]), rowsNumber: (__VLS_ctx.totalCount) }), { class: "inventory-table shadow-1" })));
var __VLS_112 = __VLS_111.apply(void 0, __spreadArray([__assign(__assign({ 'onRequest': {} }, { pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.inventory), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.isLoading), rowsPerPageOptions: ([10, 25, 50, 100]), rowsNumber: (__VLS_ctx.totalCount) }), { class: "inventory-table shadow-1" })], __VLS_functionalComponentArgsRest(__VLS_111), false));
var __VLS_115;
var __VLS_116 = ({ request: {} },
    { onRequest: (__VLS_ctx.onTableRequest) });
/** @type {__VLS_StyleScopedClasses['inventory-table']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
var __VLS_117 = __VLS_113.slots.default;
{
    var __VLS_118 = __VLS_113.slots.loading;
    var __VLS_119 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
    qInnerLoading;
    // @ts-ignore
    var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({
        showing: true,
    }));
    var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([{
            showing: true,
        }], __VLS_functionalComponentArgsRest(__VLS_120), false));
    var __VLS_124 = __VLS_122.slots.default;
    var __VLS_125 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125({
        size: "50px",
        color: "primary",
    }));
    var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([{
            size: "50px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_126), false));
    // @ts-ignore
    [pagination, inventory, columns, isLoading, totalCount, onTableRequest,];
    var __VLS_122;
    // @ts-ignore
    [];
}
{
    var __VLS_130 = __VLS_113.slots["body-cell-thread_type"];
    var props = __VLS_vSlot(__VLS_130)[0];
    var __VLS_131 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131({
        props: (props),
    }));
    var __VLS_133 = __VLS_132.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_132), false));
    var __VLS_136 = __VLS_134.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-xs']} */ ;
    if ((_c = (_b = props.row.thread_type) === null || _b === void 0 ? void 0 : _b.color_data) === null || _c === void 0 ? void 0 : _c.hex_code) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-dot shadow-1" }, { style: ({ backgroundColor: props.row.thread_type.color_data.hex_code }) }));
        /** @type {__VLS_StyleScopedClasses['color-dot']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (((_d = props.row.thread_type) === null || _d === void 0 ? void 0 : _d.name) || '---');
    // @ts-ignore
    [];
    var __VLS_134;
    // @ts-ignore
    [];
}
{
    var __VLS_137 = __VLS_113.slots["body-cell-quantity_meters"];
    var props = __VLS_vSlot(__VLS_137)[0];
    var __VLS_138 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138({
        props: (props),
        align: "right",
    }));
    var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([{
            props: (props),
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_139), false));
    var __VLS_143 = __VLS_141.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "font-mono text-weight-bold" }));
    /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (props.value);
    // @ts-ignore
    [];
    var __VLS_141;
    // @ts-ignore
    [];
}
{
    var __VLS_144 = __VLS_113.slots["body-cell-weight_grams"];
    var props = __VLS_vSlot(__VLS_144)[0];
    var __VLS_145 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_146 = __VLS_asFunctionalComponent1(__VLS_145, new __VLS_145({
        props: (props),
        align: "right",
    }));
    var __VLS_147 = __VLS_146.apply(void 0, __spreadArray([{
            props: (props),
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_146), false));
    var __VLS_150 = __VLS_148.slots.default;
    if (props.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "font-mono" }));
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        (props.value);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
        /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
    }
    // @ts-ignore
    [];
    var __VLS_148;
    // @ts-ignore
    [];
}
{
    var __VLS_151 = __VLS_113.slots["body-cell-status"];
    var props = __VLS_vSlot(__VLS_151)[0];
    var __VLS_152 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_153 = __VLS_asFunctionalComponent1(__VLS_152, new __VLS_152({
        props: (props),
        align: "center",
    }));
    var __VLS_154 = __VLS_153.apply(void 0, __spreadArray([{
            props: (props),
            align: "center",
        }], __VLS_functionalComponentArgsRest(__VLS_153), false));
    var __VLS_157 = __VLS_155.slots.default;
    var __VLS_158 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158(__assign({ color: (__VLS_ctx.getStatusColor(props.row.status)) }, { class: "q-py-xs q-px-sm" })));
    var __VLS_160 = __VLS_159.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.getStatusColor(props.row.status)) }, { class: "q-py-xs q-px-sm" })], __VLS_functionalComponentArgsRest(__VLS_159), false));
    /** @type {__VLS_StyleScopedClasses['q-py-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-px-sm']} */ ;
    var __VLS_163 = __VLS_161.slots.default;
    (__VLS_ctx.statusLabels[props.row.status]);
    // @ts-ignore
    [getStatusColor, statusLabels,];
    var __VLS_161;
    // @ts-ignore
    [];
    var __VLS_155;
    // @ts-ignore
    [];
}
{
    var __VLS_164 = __VLS_113.slots["body-cell-is_partial"];
    var props = __VLS_vSlot(__VLS_164)[0];
    var __VLS_165 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165({
        props: (props),
        align: "center",
    }));
    var __VLS_167 = __VLS_166.apply(void 0, __spreadArray([{
            props: (props),
            align: "center",
        }], __VLS_functionalComponentArgsRest(__VLS_166), false));
    var __VLS_170 = __VLS_168.slots.default;
    var __VLS_171 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_172 = __VLS_asFunctionalComponent1(__VLS_171, new __VLS_171({
        color: (props.row.is_partial ? 'orange' : 'positive'),
        outline: true,
    }));
    var __VLS_173 = __VLS_172.apply(void 0, __spreadArray([{
            color: (props.row.is_partial ? 'orange' : 'positive'),
            outline: true,
        }], __VLS_functionalComponentArgsRest(__VLS_172), false));
    var __VLS_176 = __VLS_174.slots.default;
    (props.row.is_partial ? 'Cuộn dư' : 'Cuộn đầy');
    // @ts-ignore
    [];
    var __VLS_174;
    // @ts-ignore
    [];
    var __VLS_168;
    // @ts-ignore
    [];
}
{
    var __VLS_177 = __VLS_113.slots["body-cell-actions"];
    var props_1 = __VLS_vSlot(__VLS_177)[0];
    var __VLS_178 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_179 = __VLS_asFunctionalComponent1(__VLS_178, new __VLS_178({
        props: (props_1),
        align: "center",
    }));
    var __VLS_180 = __VLS_179.apply(void 0, __spreadArray([{
            props: (props_1),
            align: "center",
        }], __VLS_functionalComponentArgsRest(__VLS_179), false));
    var __VLS_183 = __VLS_181.slots.default;
    var __VLS_184 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_185 = __VLS_asFunctionalComponent1(__VLS_184, new __VLS_184(__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "visibility", size: "sm" })));
    var __VLS_186 = __VLS_185.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "visibility", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_185), false));
    var __VLS_189 = void 0;
    var __VLS_190 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openDetailDialog(props_1.row);
                // @ts-ignore
                [openDetailDialog,];
            } });
    var __VLS_191 = __VLS_187.slots.default;
    var __VLS_192 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_193 = __VLS_asFunctionalComponent1(__VLS_192, new __VLS_192({}));
    var __VLS_194 = __VLS_193.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_193), false));
    var __VLS_197 = __VLS_195.slots.default;
    // @ts-ignore
    [];
    var __VLS_195;
    // @ts-ignore
    [];
    var __VLS_187;
    var __VLS_188;
    var __VLS_198 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_199 = __VLS_asFunctionalComponent1(__VLS_198, new __VLS_198(__assign({ 'onClick': {} }, { flat: true, round: true, color: "secondary", icon: "qr_code", size: "sm" })));
    var __VLS_200 = __VLS_199.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "secondary", icon: "qr_code", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_199), false));
    var __VLS_203 = void 0;
    var __VLS_204 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.openPrintSingle(props_1.row);
                // @ts-ignore
                [openPrintSingle,];
            } });
    var __VLS_205 = __VLS_201.slots.default;
    var __VLS_206 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_207 = __VLS_asFunctionalComponent1(__VLS_206, new __VLS_206({}));
    var __VLS_208 = __VLS_207.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_207), false));
    var __VLS_211 = __VLS_209.slots.default;
    // @ts-ignore
    [];
    var __VLS_209;
    // @ts-ignore
    [];
    var __VLS_201;
    var __VLS_202;
    // @ts-ignore
    [];
    var __VLS_181;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_113;
var __VLS_114;
// @ts-ignore
[];
var __VLS_107;
// @ts-ignore
[];
var __VLS_87;
var __VLS_212;
/** @ts-ignore @type {typeof __VLS_components.FormDialog | typeof __VLS_components.FormDialog} */
FormDialog;
// @ts-ignore
var __VLS_213 = __VLS_asFunctionalComponent1(__VLS_212, new __VLS_212(__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.receiptDialog.isOpen), title: "Nhập Kho Chỉ Mới", loading: (__VLS_ctx.isLoading), maxWidth: "600px" })));
var __VLS_214 = __VLS_213.apply(void 0, __spreadArray([__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.receiptDialog.isOpen), title: "Nhập Kho Chỉ Mới", loading: (__VLS_ctx.isLoading), maxWidth: "600px" })], __VLS_functionalComponentArgsRest(__VLS_213), false));
var __VLS_217;
var __VLS_218 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleReceiptSubmit) });
var __VLS_219 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.closeReceiptDialog) });
var __VLS_220 = __VLS_215.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_221;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221({
    modelValue: (__VLS_ctx.receiptData.thread_type_id),
    label: "Loại Chỉ",
    options: (__VLS_ctx.threadTypeOptions),
    loading: (__VLS_ctx.threadTypesLoading),
    required: true,
    emitValue: true,
    mapOptions: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
}));
var __VLS_223 = __VLS_222.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.receiptData.thread_type_id),
        label: "Loại Chỉ",
        options: (__VLS_ctx.threadTypeOptions),
        loading: (__VLS_ctx.threadTypesLoading),
        required: true,
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
    }], __VLS_functionalComponentArgsRest(__VLS_222), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_226;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_227 = __VLS_asFunctionalComponent1(__VLS_226, new __VLS_226({
    modelValue: (__VLS_ctx.receiptData.color_id),
    label: "Màu",
    options: (__VLS_ctx.receiptColorOptions),
    loading: (__VLS_ctx.loadingReceiptColors),
    disable: (!__VLS_ctx.receiptData.thread_type_id || __VLS_ctx.receiptColorOptions.length === 0),
    emitValue: true,
    mapOptions: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
    clearable: true,
    hint: "Chọn màu cho cuộn chỉ",
}));
var __VLS_228 = __VLS_227.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.receiptData.color_id),
        label: "Màu",
        options: (__VLS_ctx.receiptColorOptions),
        loading: (__VLS_ctx.loadingReceiptColors),
        disable: (!__VLS_ctx.receiptData.thread_type_id || __VLS_ctx.receiptColorOptions.length === 0),
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        clearable: true,
        hint: "Chọn màu cho cuộn chỉ",
    }], __VLS_functionalComponentArgsRest(__VLS_227), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_231;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_232 = __VLS_asFunctionalComponent1(__VLS_231, new __VLS_231({
    modelValue: (__VLS_ctx.receiptData.warehouse_id),
    label: "Kho Nhập",
    options: (__VLS_ctx.warehouseOptions),
    loading: (__VLS_ctx.warehousesLoading),
    required: true,
    emitValue: true,
    mapOptions: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
}));
var __VLS_233 = __VLS_232.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.receiptData.warehouse_id),
        label: "Kho Nhập",
        options: (__VLS_ctx.warehouseOptions),
        loading: (__VLS_ctx.warehousesLoading),
        required: true,
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
    }], __VLS_functionalComponentArgsRest(__VLS_232), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_236;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_237 = __VLS_asFunctionalComponent1(__VLS_236, new __VLS_236({
    modelValue: (__VLS_ctx.receiptData.quantity_cones),
    modelModifiers: { number: true, },
    label: "Số Lượng Cuộn",
    type: "number",
    required: true,
    min: "1",
}));
var __VLS_238 = __VLS_237.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.receiptData.quantity_cones),
        modelModifiers: { number: true, },
        label: "Số Lượng Cuộn",
        type: "number",
        required: true,
        min: "1",
    }], __VLS_functionalComponentArgsRest(__VLS_237), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_241;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_242 = __VLS_asFunctionalComponent1(__VLS_241, new __VLS_241({
    modelValue: (__VLS_ctx.receiptData.weight_per_cone_grams),
    modelModifiers: { number: true, },
    label: "Trọng Lượng/Cuộn (g)",
    type: "number",
    placeholder: "Tùy chọn",
}));
var __VLS_243 = __VLS_242.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.receiptData.weight_per_cone_grams),
        modelModifiers: { number: true, },
        label: "Trọng Lượng/Cuộn (g)",
        type: "number",
        placeholder: "Tùy chọn",
    }], __VLS_functionalComponentArgsRest(__VLS_242), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_246;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_247 = __VLS_asFunctionalComponent1(__VLS_246, new __VLS_246({
    modelValue: (__VLS_ctx.receiptData.lot_number),
    label: "Số Lô (Lot Number)",
    placeholder: "Tùy chọn",
}));
var __VLS_248 = __VLS_247.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.receiptData.lot_number),
        label: "Số Lô (Lot Number)",
        placeholder: "Tùy chọn",
    }], __VLS_functionalComponentArgsRest(__VLS_247), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_251;
/** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_252 = __VLS_asFunctionalComponent1(__VLS_251, new __VLS_251({
    modelValue: (__VLS_ctx.receiptData.expiry_date),
    label: "Ngày Hết Hạn",
    placeholder: "DD/MM/YYYY",
    readonly: true,
}));
var __VLS_253 = __VLS_252.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.receiptData.expiry_date),
        label: "Ngày Hết Hạn",
        placeholder: "DD/MM/YYYY",
        readonly: true,
    }], __VLS_functionalComponentArgsRest(__VLS_252), false));
var __VLS_256 = __VLS_254.slots.default;
{
    var __VLS_257 = __VLS_254.slots.append;
    var __VLS_258 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_259 = __VLS_asFunctionalComponent1(__VLS_258, new __VLS_258(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_260 = __VLS_259.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_259), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_263 = __VLS_261.slots.default;
    var __VLS_264 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_265 = __VLS_asFunctionalComponent1(__VLS_264, new __VLS_264({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_266 = __VLS_265.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_265), false));
    var __VLS_269 = __VLS_267.slots.default;
    var __VLS_270 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.DatePicker} */
    DatePicker;
    // @ts-ignore
    var __VLS_271 = __VLS_asFunctionalComponent1(__VLS_270, new __VLS_270({
        modelValue: (__VLS_ctx.receiptData.expiry_date),
    }));
    var __VLS_272 = __VLS_271.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.receiptData.expiry_date),
        }], __VLS_functionalComponentArgsRest(__VLS_271), false));
    // @ts-ignore
    [threadTypeOptions, warehouseOptions, isLoading, receiptDialog, handleReceiptSubmit, closeReceiptDialog, receiptData, receiptData, receiptData, receiptData, receiptData, receiptData, receiptData, receiptData, receiptData, threadTypesLoading, receiptColorOptions, receiptColorOptions, loadingReceiptColors, warehousesLoading,];
    var __VLS_267;
    // @ts-ignore
    [];
    var __VLS_261;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_254;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_275;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_276 = __VLS_asFunctionalComponent1(__VLS_275, new __VLS_275({
    modelValue: (__VLS_ctx.receiptData.location),
    label: "Vị Trí Trong Kho",
    placeholder: "VD: Kệ A-1",
}));
var __VLS_277 = __VLS_276.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.receiptData.location),
        label: "Vị Trí Trong Kho",
        placeholder: "VD: Kệ A-1",
    }], __VLS_functionalComponentArgsRest(__VLS_276), false));
// @ts-ignore
[receiptData,];
var __VLS_215;
var __VLS_216;
var __VLS_280;
/** @ts-ignore @type {typeof __VLS_components.FormDialog | typeof __VLS_components.FormDialog} */
FormDialog;
// @ts-ignore
var __VLS_281 = __VLS_asFunctionalComponent1(__VLS_280, new __VLS_280(__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.showManualEntryDialog), title: "Nhập Thủ Công", submitText: "Nhập kho", loading: (__VLS_ctx.manualEntrySubmitting), maxWidth: "500px" })));
var __VLS_282 = __VLS_281.apply(void 0, __spreadArray([__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.showManualEntryDialog), title: "Nhập Thủ Công", submitText: "Nhập kho", loading: (__VLS_ctx.manualEntrySubmitting), maxWidth: "500px" })], __VLS_functionalComponentArgsRest(__VLS_281), false));
var __VLS_285;
var __VLS_286 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleManualEntrySubmit) });
var __VLS_287 = ({ cancel: {} },
    { onCancel: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showManualEntryDialog = false;
            // @ts-ignore
            [showManualEntryDialog, showManualEntryDialog, manualEntrySubmitting, handleManualEntrySubmit,];
        } });
var __VLS_288 = __VLS_283.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_289;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_290 = __VLS_asFunctionalComponent1(__VLS_289, new __VLS_289(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.manualEntryForm.supplier_id), label: "Nhà cung cấp", options: (__VLS_ctx.manualSupplierOptions), loading: (__VLS_ctx.manualEntryLoading), required: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })));
var __VLS_291 = __VLS_290.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.manualEntryForm.supplier_id), label: "Nhà cung cấp", options: (__VLS_ctx.manualSupplierOptions), loading: (__VLS_ctx.manualEntryLoading), required: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })], __VLS_functionalComponentArgsRest(__VLS_290), false));
var __VLS_294;
var __VLS_295 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onManualSupplierChange) });
var __VLS_292;
var __VLS_293;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_296;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_297 = __VLS_asFunctionalComponent1(__VLS_296, new __VLS_296(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.manualEntryForm.tex_number), label: "Tex", options: (__VLS_ctx.manualTexOptions), disable: (!__VLS_ctx.manualEntryForm.supplier_id || __VLS_ctx.manualTexOptions.length === 0), hint: (__VLS_ctx.manualEntryForm.supplier_id && __VLS_ctx.manualTexOptions.length === 0 ? 'NCC này chưa có loại chỉ nào' : undefined), required: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })));
var __VLS_298 = __VLS_297.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.manualEntryForm.tex_number), label: "Tex", options: (__VLS_ctx.manualTexOptions), disable: (!__VLS_ctx.manualEntryForm.supplier_id || __VLS_ctx.manualTexOptions.length === 0), hint: (__VLS_ctx.manualEntryForm.supplier_id && __VLS_ctx.manualTexOptions.length === 0 ? 'NCC này chưa có loại chỉ nào' : undefined), required: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })], __VLS_functionalComponentArgsRest(__VLS_297), false));
var __VLS_301;
var __VLS_302 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onManualTexChange) });
var __VLS_299;
var __VLS_300;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_303;
/** @ts-ignore @type {typeof __VLS_components.AppSelect | typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_304 = __VLS_asFunctionalComponent1(__VLS_303, new __VLS_303({
    modelValue: (__VLS_ctx.manualEntryForm.color_id),
    label: "Màu chỉ",
    options: (__VLS_ctx.manualColorOptions),
    disable: (!__VLS_ctx.manualEntryForm.supplier_id || __VLS_ctx.manualColorOptions.length === 0),
    required: true,
    emitValue: true,
    mapOptions: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
}));
var __VLS_305 = __VLS_304.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.manualEntryForm.color_id),
        label: "Màu chỉ",
        options: (__VLS_ctx.manualColorOptions),
        disable: (!__VLS_ctx.manualEntryForm.supplier_id || __VLS_ctx.manualColorOptions.length === 0),
        required: true,
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
    }], __VLS_functionalComponentArgsRest(__VLS_304), false));
var __VLS_308 = __VLS_306.slots.default;
{
    var __VLS_309 = __VLS_306.slots.option;
    var _p = __VLS_vSlot(__VLS_309)[0], opt = _p.opt, itemProps = _p.itemProps;
    var __VLS_310 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_311 = __VLS_asFunctionalComponent1(__VLS_310, new __VLS_310(__assign({}, (itemProps))));
    var __VLS_312 = __VLS_311.apply(void 0, __spreadArray([__assign({}, (itemProps))], __VLS_functionalComponentArgsRest(__VLS_311), false));
    var __VLS_315 = __VLS_313.slots.default;
    var __VLS_316 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_317 = __VLS_asFunctionalComponent1(__VLS_316, new __VLS_316({
        avatar: true,
    }));
    var __VLS_318 = __VLS_317.apply(void 0, __spreadArray([{
            avatar: true,
        }], __VLS_functionalComponentArgsRest(__VLS_317), false));
    var __VLS_321 = __VLS_319.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-dot shadow-1" }, { style: ({ backgroundColor: opt.hex || '#ccc' }) }));
    /** @type {__VLS_StyleScopedClasses['color-dot']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
    // @ts-ignore
    [manualEntryForm, manualEntryForm, manualEntryForm, manualEntryForm, manualEntryForm, manualEntryForm, manualSupplierOptions, manualEntryLoading, onManualSupplierChange, manualTexOptions, manualTexOptions, manualTexOptions, onManualTexChange, manualColorOptions, manualColorOptions,];
    var __VLS_319;
    var __VLS_322 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_323 = __VLS_asFunctionalComponent1(__VLS_322, new __VLS_322({}));
    var __VLS_324 = __VLS_323.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_323), false));
    var __VLS_327 = __VLS_325.slots.default;
    (opt.label);
    // @ts-ignore
    [];
    var __VLS_325;
    // @ts-ignore
    [];
    var __VLS_313;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_306;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_328;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_329 = __VLS_asFunctionalComponent1(__VLS_328, new __VLS_328({
    modelValue: (__VLS_ctx.manualEntryForm.warehouse_id),
    label: "Kho nhập",
    options: (__VLS_ctx.manualWarehouseOptions),
    required: true,
    emitValue: true,
    mapOptions: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
}));
var __VLS_330 = __VLS_329.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.manualEntryForm.warehouse_id),
        label: "Kho nhập",
        options: (__VLS_ctx.manualWarehouseOptions),
        required: true,
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
    }], __VLS_functionalComponentArgsRest(__VLS_329), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_333;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_334 = __VLS_asFunctionalComponent1(__VLS_333, new __VLS_333({
    modelValue: (__VLS_ctx.manualEntryForm.qty_full_cones),
    modelModifiers: { number: true, },
    label: "Cuộn nguyên",
    type: "number",
    min: "0",
    required: true,
}));
var __VLS_335 = __VLS_334.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.manualEntryForm.qty_full_cones),
        modelModifiers: { number: true, },
        label: "Cuộn nguyên",
        type: "number",
        min: "0",
        required: true,
    }], __VLS_functionalComponentArgsRest(__VLS_334), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_338;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_339 = __VLS_asFunctionalComponent1(__VLS_338, new __VLS_338({
    modelValue: (__VLS_ctx.manualEntryForm.qty_partial_cones),
    modelModifiers: { number: true, },
    label: "Cuộn lẻ",
    type: "number",
    min: "0",
}));
var __VLS_340 = __VLS_339.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.manualEntryForm.qty_partial_cones),
        modelModifiers: { number: true, },
        label: "Cuộn lẻ",
        type: "number",
        min: "0",
    }], __VLS_functionalComponentArgsRest(__VLS_339), false));
// @ts-ignore
[manualEntryForm, manualEntryForm, manualEntryForm, manualWarehouseOptions,];
var __VLS_283;
var __VLS_284;
var __VLS_343;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_344 = __VLS_asFunctionalComponent1(__VLS_343, new __VLS_343({
    modelValue: (__VLS_ctx.detailDialog.isOpen),
}));
var __VLS_345 = __VLS_344.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.detailDialog.isOpen),
    }], __VLS_functionalComponentArgsRest(__VLS_344), false));
var __VLS_348 = __VLS_346.slots.default;
if (__VLS_ctx.detailDialog.cone) {
    var __VLS_349 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_350 = __VLS_asFunctionalComponent1(__VLS_349, new __VLS_349(__assign({ style: {} })));
    var __VLS_351 = __VLS_350.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_350), false));
    var __VLS_354 = __VLS_352.slots.default;
    var __VLS_355 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_356 = __VLS_asFunctionalComponent1(__VLS_355, new __VLS_355(__assign({ class: "row items-center q-pb-none" })));
    var __VLS_357 = __VLS_356.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_356), false));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
    var __VLS_360 = __VLS_358.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    var __VLS_361 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
    qSpace;
    // @ts-ignore
    var __VLS_362 = __VLS_asFunctionalComponent1(__VLS_361, new __VLS_361({}));
    var __VLS_363 = __VLS_362.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_362), false));
    var __VLS_366 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_367 = __VLS_asFunctionalComponent1(__VLS_366, new __VLS_366({
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }));
    var __VLS_368 = __VLS_367.apply(void 0, __spreadArray([{
            icon: "close",
            flat: true,
            round: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_367), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    // @ts-ignore
    [detailDialog, detailDialog, vClosePopup,];
    var __VLS_358;
    var __VLS_371 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_372 = __VLS_asFunctionalComponent1(__VLS_371, new __VLS_371(__assign({ class: "q-pa-md" })));
    var __VLS_373 = __VLS_372.apply(void 0, __spreadArray([__assign({ class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_372), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    var __VLS_376 = __VLS_374.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey-7 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm q-pa-sm rounded-borders" }, { style: {} }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-bold text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (__VLS_ctx.detailDialog.cone.cone_id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-xs']} */ ;
    if ((_f = (_e = __VLS_ctx.detailDialog.cone.thread_type) === null || _e === void 0 ? void 0 : _e.color_data) === null || _f === void 0 ? void 0 : _f.hex_code) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-dot shadow-1" }, { style: ({ backgroundColor: __VLS_ctx.detailDialog.cone.thread_type.color_data.hex_code }) }));
        /** @type {__VLS_StyleScopedClasses['color-dot']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    ((_g = __VLS_ctx.detailDialog.cone.thread_type) === null || _g === void 0 ? void 0 : _g.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey-7 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 font-mono text-weight-bold" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (__VLS_ctx.detailDialog.cone.quantity_meters.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 font-mono" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
    (((_h = __VLS_ctx.detailDialog.cone.weight_grams) === null || _h === void 0 ? void 0 : _h.toLocaleString()) || '---');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    var __VLS_377 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_378 = __VLS_asFunctionalComponent1(__VLS_377, new __VLS_377(__assign({ color: (__VLS_ctx.getStatusColor(__VLS_ctx.detailDialog.cone.status)) }, { class: "q-py-xs q-px-sm" })));
    var __VLS_379 = __VLS_378.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.getStatusColor(__VLS_ctx.detailDialog.cone.status)) }, { class: "q-py-xs q-px-sm" })], __VLS_functionalComponentArgsRest(__VLS_378), false));
    /** @type {__VLS_StyleScopedClasses['q-py-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-px-sm']} */ ;
    var __VLS_382 = __VLS_380.slots.default;
    (__VLS_ctx.statusLabels[__VLS_ctx.detailDialog.cone.status]);
    // @ts-ignore
    [getStatusColor, statusLabels, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog,];
    var __VLS_380;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.detailDialog.cone.warehouse_code || '---');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.detailDialog.cone.location || '---');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    var __VLS_383 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_384 = __VLS_asFunctionalComponent1(__VLS_383, new __VLS_383({
        color: (__VLS_ctx.detailDialog.cone.is_partial ? 'orange' : 'positive'),
        outline: true,
    }));
    var __VLS_385 = __VLS_384.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.detailDialog.cone.is_partial ? 'orange' : 'positive'),
            outline: true,
        }], __VLS_functionalComponentArgsRest(__VLS_384), false));
    var __VLS_388 = __VLS_386.slots.default;
    (__VLS_ctx.detailDialog.cone.is_partial ? 'Cuộn dư' : 'Cuộn đầy');
    // @ts-ignore
    [detailDialog, detailDialog, detailDialog, detailDialog,];
    var __VLS_386;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    var __VLS_389 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_390 = __VLS_asFunctionalComponent1(__VLS_389, new __VLS_389({
        qMySm: true,
    }));
    var __VLS_391 = __VLS_390.apply(void 0, __spreadArray([{
            qMySm: true,
        }], __VLS_functionalComponentArgsRest(__VLS_390), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey-7 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.detailDialog.cone.lot_number || '---');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-negative" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    (__VLS_ctx.detailDialog.cone.expiry_date || '---');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.detailDialog.cone.received_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.detailDialog.cone.updated_at));
    // @ts-ignore
    [detailDialog, detailDialog, detailDialog, detailDialog, formatDate, formatDate,];
    var __VLS_374;
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
    var __VLS_401 = __VLS_asFunctionalComponent1(__VLS_400, new __VLS_400({
        unelevated: true,
        label: "Đóng",
        color: "grey",
    }));
    var __VLS_402 = __VLS_401.apply(void 0, __spreadArray([{
            unelevated: true,
            label: "Đóng",
            color: "grey",
        }], __VLS_functionalComponentArgsRest(__VLS_401), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    // @ts-ignore
    [vClosePopup,];
    var __VLS_397;
    // @ts-ignore
    [];
    var __VLS_352;
}
// @ts-ignore
[];
var __VLS_346;
var __VLS_405;
/** @ts-ignore @type {typeof __VLS_components.QrScannerDialog} */
qr_1.QrScannerDialog;
// @ts-ignore
var __VLS_406 = __VLS_asFunctionalComponent1(__VLS_405, new __VLS_405(__assign({ 'onConfirm': {} }, { modelValue: (__VLS_ctx.showQrScanner), title: "Quét mã tra cứu", formats: (['qr_code', 'code_128', 'ean_13']), hint: "Đưa mã QR hoặc barcode của cuộn chỉ vào khung", closeOnDetect: (true) })));
var __VLS_407 = __VLS_406.apply(void 0, __spreadArray([__assign({ 'onConfirm': {} }, { modelValue: (__VLS_ctx.showQrScanner), title: "Quét mã tra cứu", formats: (['qr_code', 'code_128', 'ean_13']), hint: "Đưa mã QR hoặc barcode của cuộn chỉ vào khung", closeOnDetect: (true) })], __VLS_functionalComponentArgsRest(__VLS_406), false));
var __VLS_410;
var __VLS_411 = ({ confirm: {} },
    { onConfirm: (__VLS_ctx.handleQrLookup) });
var __VLS_408;
var __VLS_409;
var __VLS_412;
/** @ts-ignore @type {typeof __VLS_components.QrPrintDialog} */
qr_1.QrPrintDialog;
// @ts-ignore
var __VLS_413 = __VLS_asFunctionalComponent1(__VLS_412, new __VLS_412({
    modelValue: (__VLS_ctx.showPrintDialog),
    cones: (__VLS_ctx.printCones),
    title: "In nhãn QR",
}));
var __VLS_414 = __VLS_413.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showPrintDialog),
        cones: (__VLS_ctx.printCones),
        title: "In nhãn QR",
    }], __VLS_functionalComponentArgsRest(__VLS_413), false));
var __VLS_417 = ConeWarehouseBreakdownDialog_vue_1.default;
// @ts-ignore
var __VLS_418 = __VLS_asFunctionalComponent1(__VLS_417, new __VLS_417({
    modelValue: (__VLS_ctx.showBreakdownDialog),
    threadType: (__VLS_ctx.selectedConeSummary),
    breakdown: (__VLS_ctx.warehouseBreakdown),
    supplierBreakdown: (__VLS_ctx.supplierBreakdown),
    loading: (__VLS_ctx.breakdownLoading),
}));
var __VLS_419 = __VLS_418.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showBreakdownDialog),
        threadType: (__VLS_ctx.selectedConeSummary),
        breakdown: (__VLS_ctx.warehouseBreakdown),
        supplierBreakdown: (__VLS_ctx.supplierBreakdown),
        loading: (__VLS_ctx.breakdownLoading),
    }], __VLS_functionalComponentArgsRest(__VLS_418), false));
// @ts-ignore
[showQrScanner, handleQrLookup, showPrintDialog, printCones, showBreakdownDialog, selectedConeSummary, warehouseBreakdown, supplierBreakdown, breakdownLoading,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
