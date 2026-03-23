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
var _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var composables_1 = require("@/composables");
var enums_1 = require("@/types/thread/enums");
// Composables
var snackbar = (0, composables_1.useSnackbar)();
var confirm = (0, composables_1.useConfirm)().confirm;
var _k = (0, composables_1.useAllocations)(), allocations = _k.allocations, conflicts = _k.conflicts, isLoading = _k.isLoading, fetchAllocations = _k.fetchAllocations, fetchConflicts = _k.fetchConflicts, createAllocation = _k.createAllocation, executeAllocation = _k.executeAllocation, issueAllocation = _k.issueAllocation, cancelAllocation = _k.cancelAllocation, fetchAllocationById = _k.fetchAllocationById;
var _l = (0, composables_1.useThreadTypes)(), activeThreadTypes = _l.activeThreadTypes, fetchThreadTypes = _l.fetchThreadTypes;
// Local State
var searchQuery = (0, vue_1.ref)('');
var filters = (0, vue_1.reactive)({
    thread_type_id: undefined,
    status: undefined,
    priority: undefined,
});
var pagination = (0, vue_1.ref)({
    page: 1,
    rowsPerPage: 25,
    sortBy: 'due_date',
    descending: false,
});
// Labels and Colors
var statusColors = (_a = {},
    _a[enums_1.AllocationStatus.PENDING] = 'grey',
    _a[enums_1.AllocationStatus.SOFT] = 'blue',
    _a[enums_1.AllocationStatus.HARD] = 'purple',
    _a[enums_1.AllocationStatus.ISSUED] = 'positive',
    _a[enums_1.AllocationStatus.CANCELLED] = 'negative',
    _a[enums_1.AllocationStatus.WAITLISTED] = 'orange',
    // Request workflow statuses
    _a[enums_1.AllocationStatus.APPROVED] = 'teal',
    _a[enums_1.AllocationStatus.READY_FOR_PICKUP] = 'amber',
    _a[enums_1.AllocationStatus.RECEIVED] = 'green',
    _a[enums_1.AllocationStatus.REJECTED] = 'red',
    _a);
var statusLabels = (_b = {},
    _b[enums_1.AllocationStatus.PENDING] = 'Chờ xử lý',
    _b[enums_1.AllocationStatus.SOFT] = 'Đã đặt mềm',
    _b[enums_1.AllocationStatus.HARD] = 'Đã đặt cứng',
    _b[enums_1.AllocationStatus.ISSUED] = 'Đã xuất',
    _b[enums_1.AllocationStatus.CANCELLED] = 'Đã hủy',
    _b[enums_1.AllocationStatus.WAITLISTED] = 'Chờ hàng',
    // Request workflow statuses
    _b[enums_1.AllocationStatus.APPROVED] = 'Đã duyệt',
    _b[enums_1.AllocationStatus.READY_FOR_PICKUP] = 'Sẵn sàng nhận',
    _b[enums_1.AllocationStatus.RECEIVED] = 'Đã nhận',
    _b[enums_1.AllocationStatus.REJECTED] = 'Từ chối',
    _b);
var priorityColors = (_c = {},
    _c[enums_1.AllocationPriority.LOW] = 'grey-7',
    _c[enums_1.AllocationPriority.NORMAL] = 'primary',
    _c[enums_1.AllocationPriority.HIGH] = 'warning',
    _c[enums_1.AllocationPriority.URGENT] = 'negative',
    _c);
var priorityLabels = (_d = {},
    _d[enums_1.AllocationPriority.LOW] = 'Thấp',
    _d[enums_1.AllocationPriority.NORMAL] = 'Bình thường',
    _d[enums_1.AllocationPriority.HIGH] = 'Cao',
    _d[enums_1.AllocationPriority.URGENT] = 'Khẩn cấp',
    _d);
// Options
var statusOptions = (0, vue_1.computed)(function () {
    return Object.entries(statusLabels).map(function (_a) {
        var value = _a[0], label = _a[1];
        return ({
            label: label,
            value: value,
        });
    });
});
var priorityOptions = (0, vue_1.computed)(function () {
    return Object.entries(priorityLabels).map(function (_a) {
        var value = _a[0], label = _a[1];
        return ({
            label: label,
            value: value,
        });
    });
});
var threadTypeOptions = (0, vue_1.computed)(function () {
    return activeThreadTypes.value.map(function (t) { return ({
        label: "".concat(t.code, " - ").concat(t.name),
        value: t.id
    }); });
});
// Summary Stats
var summaryStats = (0, vue_1.computed)(function () { return [
    {
        label: 'Tổng yêu cầu',
        value: allocations.value.length,
        colorClass: 'text-primary'
    },
    {
        label: 'Chờ xử lý',
        value: allocations.value.filter(function (a) { return a.status === enums_1.AllocationStatus.PENDING; }).length,
        colorClass: 'text-grey-7'
    },
    {
        label: 'Đã phân bổ',
        value: allocations.value.filter(function (a) { return a.status === enums_1.AllocationStatus.SOFT; }).length,
        colorClass: 'text-blue'
    },
    {
        label: 'Đã xuất',
        value: allocations.value.filter(function (a) { return a.status === enums_1.AllocationStatus.ISSUED; }).length,
        colorClass: 'text-positive'
    },
    {
        label: 'Xung đột',
        value: conflicts.value.length,
        colorClass: 'text-negative'
    }
]; });
// Table Columns
var columns = [
    {
        name: 'order_id',
        label: 'Mã Đơn Hàng',
        field: 'order_id',
        align: 'left',
        sortable: true,
    },
    {
        name: 'thread_type',
        label: 'Loại Chỉ',
        field: function (row) { var _a; return (_a = row.thread_type) === null || _a === void 0 ? void 0 : _a.name; },
        align: 'left',
        sortable: true,
    },
    {
        name: 'requested_meters',
        label: 'Yêu Cầu (m)',
        field: 'requested_meters',
        align: 'right',
        sortable: true,
    },
    {
        name: 'allocated_meters',
        label: 'Đã Phân Bổ (m)',
        field: 'allocated_meters',
        align: 'right',
        sortable: true,
    },
    {
        name: 'status',
        label: 'Trạng Thái',
        field: 'status',
        align: 'center',
        sortable: true,
    },
    {
        name: 'priority',
        label: 'Ưu Tiên',
        field: 'priority',
        align: 'center',
        sortable: true,
    },
    {
        name: 'due_date',
        label: 'Hạn Giao',
        field: 'due_date',
        align: 'left',
        sortable: true,
    },
    {
        name: 'actions',
        label: 'Thao Tác',
        field: 'actions',
        align: 'center',
    },
];
var coneColumns = [
    {
        name: 'cone_id',
        label: 'Mã Cuộn',
        field: function (row) { var _a; return (_a = row.cone) === null || _a === void 0 ? void 0 : _a.cone_id; },
        align: 'left',
    },
    {
        name: 'lot_number',
        label: 'Số Lô',
        field: function (row) { var _a; return (_a = row.cone) === null || _a === void 0 ? void 0 : _a.lot_number; },
        align: 'left',
    },
    {
        name: 'warehouse',
        label: 'Kho',
        field: function (row) { var _a; return (_a = row.cone) === null || _a === void 0 ? void 0 : _a.warehouse_code; },
        align: 'left',
    },
    {
        name: 'allocated_meters',
        label: 'Số Mét Gán',
        field: 'allocated_meters',
        align: 'right',
    },
];
// Dialogs State
var createDialog = (0, vue_1.reactive)({
    isOpen: false,
});
var detailDialog = (0, vue_1.reactive)({
    isOpen: false,
    allocation: null,
});
// Form Data
var createData = (0, vue_1.reactive)({
    order_id: '',
    order_reference: '',
    thread_type_id: 0,
    requested_meters: 0,
    priority: enums_1.AllocationPriority.NORMAL,
    due_date: '',
    notes: '',
});
// Handlers
var handleFilterChange = function () {
    fetchAllocations(__assign({ order_id: searchQuery.value || undefined }, filters));
};
(0, vue_1.watch)(searchQuery, function (newVal) {
    pagination.value.page = 1;
    fetchAllocations(__assign({ order_id: newVal || undefined }, filters));
});
var openCreateDialog = function () {
    var _a;
    Object.assign(createData, {
        order_id: '',
        order_reference: '',
        thread_type_id: ((_a = activeThreadTypes.value[0]) === null || _a === void 0 ? void 0 : _a.id) || 0,
        requested_meters: 0,
        priority: enums_1.AllocationPriority.NORMAL,
        due_date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
        notes: '',
    });
    createDialog.isOpen = true;
};
var closeCreateDialog = function () {
    createDialog.isOpen = false;
};
var handleCreateSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!createData.order_id || !createData.thread_type_id || createData.requested_meters <= 0) {
                    snackbar.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, createAllocation(__assign({}, createData))];
            case 1:
                result = _a.sent();
                if (result) {
                    closeCreateDialog();
                }
                return [2 /*return*/];
        }
    });
}); };
var openDetailDialog = function (allocation) { return __awaiter(void 0, void 0, void 0, function () {
    var detailed;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fetchAllocationById(allocation.id)];
            case 1:
                detailed = _a.sent();
                if (detailed) {
                    detailDialog.allocation = detailed;
                    detailDialog.isOpen = true;
                }
                return [2 /*return*/];
        }
    });
}); };
var handleExecute = function (allocation) { return __awaiter(void 0, void 0, void 0, function () {
    var confirmed;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, confirm({
                    title: 'Xác nhận phân bổ',
                    message: "Th\u1EF1c hi\u1EC7n ph\u00E2n b\u1ED5 m\u1EC1m cho \u0111\u01A1n h\u00E0ng ".concat(allocation.order_id, "? H\u1EC7 th\u1ED1ng s\u1EBD t\u1EF1 \u0111\u1ED9ng g\u00E1n c\u00E1c cu\u1ED9n ch\u1EC9 kh\u1EA3 d\u1EE5ng."),
                    color: 'positive',
                    ok: 'Thực hiện',
                })];
            case 1:
                confirmed = _b.sent();
                if (!confirmed) return [3 /*break*/, 4];
                return [4 /*yield*/, executeAllocation(allocation.id)];
            case 2:
                _b.sent();
                if (!(detailDialog.isOpen && ((_a = detailDialog.allocation) === null || _a === void 0 ? void 0 : _a.id) === allocation.id)) return [3 /*break*/, 4];
                return [4 /*yield*/, openDetailDialog(allocation)];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); };
var handleIssue = function (allocation) { return __awaiter(void 0, void 0, void 0, function () {
    var confirmed;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, confirm({
                    title: 'Xác nhận xuất chỉ',
                    message: "Xu\u1EA5t ".concat(allocation.allocated_meters, "m ch\u1EC9 cho \u0111\u01A1n h\u00E0ng ").concat(allocation.order_id, "? Tr\u1EA1ng th\u00E1i c\u00E1c cu\u1ED9n ch\u1EC9 s\u1EBD chuy\u1EC3n sang \"\u0110ang s\u1EA3n xu\u1EA5t\"."),
                    color: 'accent',
                    ok: 'Xác nhận xuất',
                })];
            case 1:
                confirmed = _b.sent();
                if (!confirmed) return [3 /*break*/, 4];
                return [4 /*yield*/, issueAllocation(allocation.id)];
            case 2:
                _b.sent();
                if (!(detailDialog.isOpen && ((_a = detailDialog.allocation) === null || _a === void 0 ? void 0 : _a.id) === allocation.id)) return [3 /*break*/, 4];
                return [4 /*yield*/, openDetailDialog(allocation)];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); };
var handleCancel = function (allocation) { return __awaiter(void 0, void 0, void 0, function () {
    var confirmed;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, confirm({
                    title: 'Xác nhận hủy',
                    message: "H\u1EE7y y\u00EAu c\u1EA7u ph\u00E2n b\u1ED5 cho \u0111\u01A1n h\u00E0ng ".concat(allocation.order_id, "? C\u00E1c cu\u1ED9n ch\u1EC9 \u0111\u00E3 g\u00E1n (n\u1EBFu c\u00F3) s\u1EBD \u0111\u01B0\u1EE3c gi\u1EA3i ph\u00F3ng."),
                    color: 'negative',
                    ok: 'Hủy yêu cầu',
                })];
            case 1:
                confirmed = _b.sent();
                if (!confirmed) return [3 /*break*/, 3];
                return [4 /*yield*/, cancelAllocation(allocation.id)];
            case 2:
                _b.sent();
                if (detailDialog.isOpen && ((_a = detailDialog.allocation) === null || _a === void 0 ? void 0 : _a.id) === allocation.id) {
                    detailDialog.isOpen = false;
                }
                _b.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
// Utils
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
var isOverdue = function (dueDate) {
    if (!dueDate)
        return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
};
var getAllocationRatioClass = function (allocation) {
    var ratio = allocation.allocated_meters / (allocation.requested_meters || 1);
    if (ratio >= 1)
        return 'text-positive';
    if (ratio > 0)
        return 'text-warning';
    return 'text-grey-7';
};
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    fetchAllocations(),
                    fetchConflicts(),
                    fetchThreadTypes(),
                ])];
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
/** @type {__VLS_StyleScopedClasses['allocation-table']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    modelValue: (__VLS_ctx.searchQuery),
    placeholder: "Tìm mã đơn hàng...",
    outlined: true,
    dense: true,
    clearable: true,
    debounce: "300",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.searchQuery),
        placeholder: "Tìm mã đơn hàng...",
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
    [searchQuery,];
}
// @ts-ignore
[];
var __VLS_10;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.thread_type_id), options: (__VLS_ctx.threadTypeOptions), label: "Loại chỉ", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.thread_type_id), options: (__VLS_ctx.threadTypeOptions), label: "Loại chỉ", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true, useInput: true, fillInput: true, hideSelected: true })], __VLS_functionalComponentArgsRest(__VLS_20), false));
var __VLS_24;
var __VLS_25 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
var __VLS_22;
var __VLS_23;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_26;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.status), options: (__VLS_ctx.statusOptions), label: "Trạng thái", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true })));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.status), options: (__VLS_ctx.statusOptions), label: "Trạng thái", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true })], __VLS_functionalComponentArgsRest(__VLS_27), false));
var __VLS_31;
var __VLS_32 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
var __VLS_29;
var __VLS_30;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_33;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.priority), options: (__VLS_ctx.priorityOptions), label: "Ưu tiên", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true })));
var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.priority), options: (__VLS_ctx.priorityOptions), label: "Ưu tiên", dense: true, outlined: true, clearable: true, emitValue: true, mapOptions: true })], __VLS_functionalComponentArgsRest(__VLS_34), false));
var __VLS_38;
var __VLS_39 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
var __VLS_36;
var __VLS_37;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
var __VLS_40;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Tạo Phân Bổ", unelevated: true }), { class: "full-width-xs" })));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Tạo Phân Bổ", unelevated: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_41), false));
var __VLS_45;
var __VLS_46 = ({ click: {} },
    { onClick: (__VLS_ctx.openCreateDialog) });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_43;
var __VLS_44;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
for (var _i = 0, _m = __VLS_vFor((__VLS_ctx.summaryStats)); _i < _m.length; _i++) {
    var stat = _m[_i][0];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (stat.label) }, { class: "col-12 col-sm-4 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_47 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47(__assign({ flat: true, bordered: true }, { class: "stat-card" })));
    var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "stat-card" })], __VLS_functionalComponentArgsRest(__VLS_48), false));
    /** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
    var __VLS_52 = __VLS_50.slots.default;
    var __VLS_53 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53(__assign({ class: "q-pa-sm" })));
    var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([__assign({ class: "q-pa-sm" })], __VLS_functionalComponentArgsRest(__VLS_54), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    var __VLS_58 = __VLS_56.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    (stat.label);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 text-weight-bold" }, { class: (stat.colorClass) }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (stat.value);
    // @ts-ignore
    [filters, filters, filters, threadTypeOptions, handleFilterChange, handleFilterChange, handleFilterChange, statusOptions, priorityOptions, openCreateDialog, summaryStats,];
    var __VLS_56;
    // @ts-ignore
    [];
    var __VLS_50;
    // @ts-ignore
    [];
}
var __VLS_59;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59(__assign({ pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.allocations), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.isLoading), rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "allocation-table shadow-1" })));
var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([__assign({ pagination: (__VLS_ctx.pagination), flat: true, bordered: true, rows: (__VLS_ctx.allocations), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.isLoading), rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "allocation-table shadow-1" })], __VLS_functionalComponentArgsRest(__VLS_60), false));
/** @type {__VLS_StyleScopedClasses['allocation-table']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
var __VLS_64 = __VLS_62.slots.default;
{
    var __VLS_65 = __VLS_62.slots.loading;
    var __VLS_66 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
    qInnerLoading;
    // @ts-ignore
    var __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
        showing: true,
    }));
    var __VLS_68 = __VLS_67.apply(void 0, __spreadArray([{
            showing: true,
        }], __VLS_functionalComponentArgsRest(__VLS_67), false));
    var __VLS_71 = __VLS_69.slots.default;
    var __VLS_72 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
        size: "50px",
        color: "primary",
    }));
    var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([{
            size: "50px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_73), false));
    // @ts-ignore
    [pagination, allocations, columns, isLoading,];
    var __VLS_69;
    // @ts-ignore
    [];
}
{
    var __VLS_77 = __VLS_62.slots["body-cell-thread_type"];
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
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-xs']} */ ;
    if ((_f = (_e = props.row.thread_type) === null || _e === void 0 ? void 0 : _e.color_data) === null || _f === void 0 ? void 0 : _f.hex_code) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-dot shadow-1" }, { style: ({ backgroundColor: props.row.thread_type.color_data.hex_code }) }));
        /** @type {__VLS_StyleScopedClasses['color-dot']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (((_g = props.row.thread_type) === null || _g === void 0 ? void 0 : _g.name) || '---');
    // @ts-ignore
    [];
    var __VLS_81;
    // @ts-ignore
    [];
}
{
    var __VLS_84 = __VLS_62.slots["body-cell-requested_meters"];
    var props = __VLS_vSlot(__VLS_84)[0];
    var __VLS_85 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({
        props: (props),
        align: "right",
    }));
    var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([{
            props: (props),
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_86), false));
    var __VLS_90 = __VLS_88.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "font-mono" }));
    /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
    (props.value.toLocaleString());
    // @ts-ignore
    [];
    var __VLS_88;
    // @ts-ignore
    [];
}
{
    var __VLS_91 = __VLS_62.slots["body-cell-allocated_meters"];
    var props = __VLS_vSlot(__VLS_91)[0];
    var __VLS_92 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
        props: (props),
        align: "right",
    }));
    var __VLS_94 = __VLS_93.apply(void 0, __spreadArray([{
            props: (props),
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_93), false));
    var __VLS_97 = __VLS_95.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column items-end" }));
    /** @type {__VLS_StyleScopedClasses['column']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-bold" }, { class: (__VLS_ctx.getAllocationRatioClass(props.row)) }));
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (props.value.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    (Math.round((props.row.allocated_meters / (props.row.requested_meters || 1)) * 100));
    // @ts-ignore
    [getAllocationRatioClass,];
    var __VLS_95;
    // @ts-ignore
    [];
}
{
    var __VLS_98 = __VLS_62.slots["body-cell-status"];
    var props = __VLS_vSlot(__VLS_98)[0];
    var __VLS_99 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
        props: (props),
        align: "center",
    }));
    var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{
            props: (props),
            align: "center",
        }], __VLS_functionalComponentArgsRest(__VLS_100), false));
    var __VLS_104 = __VLS_102.slots.default;
    var __VLS_105 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ color: (__VLS_ctx.statusColors[props.row.status]) }, { class: "q-py-xs q-px-sm" })));
    var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.statusColors[props.row.status]) }, { class: "q-py-xs q-px-sm" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
    /** @type {__VLS_StyleScopedClasses['q-py-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-px-sm']} */ ;
    var __VLS_110 = __VLS_108.slots.default;
    (__VLS_ctx.statusLabels[props.row.status]);
    // @ts-ignore
    [statusColors, statusLabels,];
    var __VLS_108;
    // @ts-ignore
    [];
    var __VLS_102;
    // @ts-ignore
    [];
}
{
    var __VLS_111 = __VLS_62.slots["body-cell-priority"];
    var props = __VLS_vSlot(__VLS_111)[0];
    var __VLS_112 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
        props: (props),
        align: "center",
    }));
    var __VLS_114 = __VLS_113.apply(void 0, __spreadArray([{
            props: (props),
            align: "center",
        }], __VLS_functionalComponentArgsRest(__VLS_113), false));
    var __VLS_117 = __VLS_115.slots.default;
    var __VLS_118 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118(__assign({ color: (__VLS_ctx.priorityColors[props.row.priority]), outline: true }, { class: "q-py-xs q-px-sm" })));
    var __VLS_120 = __VLS_119.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.priorityColors[props.row.priority]), outline: true }, { class: "q-py-xs q-px-sm" })], __VLS_functionalComponentArgsRest(__VLS_119), false));
    /** @type {__VLS_StyleScopedClasses['q-py-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-px-sm']} */ ;
    var __VLS_123 = __VLS_121.slots.default;
    (__VLS_ctx.priorityLabels[props.row.priority]);
    // @ts-ignore
    [priorityColors, priorityLabels,];
    var __VLS_121;
    // @ts-ignore
    [];
    var __VLS_115;
    // @ts-ignore
    [];
}
{
    var __VLS_124 = __VLS_62.slots["body-cell-due_date"];
    var props = __VLS_vSlot(__VLS_124)[0];
    var __VLS_125 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125({
        props: (props),
    }));
    var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_126), false));
    var __VLS_130 = __VLS_128.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: ({ 'text-negative text-weight-bold': __VLS_ctx.isOverdue(props.row.due_date) }) }));
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (__VLS_ctx.formatDate(props.row.due_date));
    // @ts-ignore
    [isOverdue, formatDate,];
    var __VLS_128;
    // @ts-ignore
    [];
}
{
    var __VLS_131 = __VLS_62.slots["body-cell-actions"];
    var props_1 = __VLS_vSlot(__VLS_131)[0];
    var __VLS_132 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132(__assign({ props: (props_1), align: "center" }, { class: "q-gutter-x-xs" })));
    var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([__assign({ props: (props_1), align: "center" }, { class: "q-gutter-x-xs" })], __VLS_functionalComponentArgsRest(__VLS_133), false));
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-xs']} */ ;
    var __VLS_137 = __VLS_135.slots.default;
    var __VLS_138 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138(__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "visibility", size: "sm" })));
    var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "primary", icon: "visibility", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_139), false));
    var __VLS_143 = void 0;
    var __VLS_144 = ({ click: {} },
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
    var __VLS_145 = __VLS_141.slots.default;
    var __VLS_146 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_147 = __VLS_asFunctionalComponent1(__VLS_146, new __VLS_146({}));
    var __VLS_148 = __VLS_147.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_147), false));
    var __VLS_151 = __VLS_149.slots.default;
    // @ts-ignore
    [];
    var __VLS_149;
    // @ts-ignore
    [];
    var __VLS_141;
    var __VLS_142;
    if (props_1.row.status === __VLS_ctx.AllocationStatus.PENDING) {
        var __VLS_152 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_153 = __VLS_asFunctionalComponent1(__VLS_152, new __VLS_152(__assign({ 'onClick': {} }, { flat: true, round: true, color: "positive", icon: "play_arrow", size: "sm" })));
        var __VLS_154 = __VLS_153.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "positive", icon: "play_arrow", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_153), false));
        var __VLS_157 = void 0;
        var __VLS_158 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(props_1.row.status === __VLS_ctx.AllocationStatus.PENDING))
                        return;
                    __VLS_ctx.handleExecute(props_1.row);
                    // @ts-ignore
                    [enums_1.AllocationStatus, handleExecute,];
                } });
        var __VLS_159 = __VLS_155.slots.default;
        var __VLS_160 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_161 = __VLS_asFunctionalComponent1(__VLS_160, new __VLS_160({}));
        var __VLS_162 = __VLS_161.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_161), false));
        var __VLS_165 = __VLS_163.slots.default;
        // @ts-ignore
        [];
        var __VLS_163;
        // @ts-ignore
        [];
        var __VLS_155;
        var __VLS_156;
    }
    if (props_1.row.status === __VLS_ctx.AllocationStatus.SOFT) {
        var __VLS_166 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_167 = __VLS_asFunctionalComponent1(__VLS_166, new __VLS_166(__assign({ 'onClick': {} }, { flat: true, round: true, color: "accent", icon: "local_shipping", size: "sm" })));
        var __VLS_168 = __VLS_167.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "accent", icon: "local_shipping", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_167), false));
        var __VLS_171 = void 0;
        var __VLS_172 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(props_1.row.status === __VLS_ctx.AllocationStatus.SOFT))
                        return;
                    __VLS_ctx.handleIssue(props_1.row);
                    // @ts-ignore
                    [enums_1.AllocationStatus, handleIssue,];
                } });
        var __VLS_173 = __VLS_169.slots.default;
        var __VLS_174 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174({}));
        var __VLS_176 = __VLS_175.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_175), false));
        var __VLS_179 = __VLS_177.slots.default;
        // @ts-ignore
        [];
        var __VLS_177;
        // @ts-ignore
        [];
        var __VLS_169;
        var __VLS_170;
    }
    if ([__VLS_ctx.AllocationStatus.PENDING, __VLS_ctx.AllocationStatus.SOFT].includes(props_1.row.status)) {
        var __VLS_180 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_181 = __VLS_asFunctionalComponent1(__VLS_180, new __VLS_180(__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "cancel", size: "sm" })));
        var __VLS_182 = __VLS_181.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "cancel", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_181), false));
        var __VLS_185 = void 0;
        var __VLS_186 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!([__VLS_ctx.AllocationStatus.PENDING, __VLS_ctx.AllocationStatus.SOFT].includes(props_1.row.status)))
                        return;
                    __VLS_ctx.handleCancel(props_1.row);
                    // @ts-ignore
                    [enums_1.AllocationStatus, enums_1.AllocationStatus, handleCancel,];
                } });
        var __VLS_187 = __VLS_183.slots.default;
        var __VLS_188 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_189 = __VLS_asFunctionalComponent1(__VLS_188, new __VLS_188({}));
        var __VLS_190 = __VLS_189.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_189), false));
        var __VLS_193 = __VLS_191.slots.default;
        // @ts-ignore
        [];
        var __VLS_191;
        // @ts-ignore
        [];
        var __VLS_183;
        var __VLS_184;
    }
    // @ts-ignore
    [];
    var __VLS_135;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_62;
var __VLS_194;
/** @ts-ignore @type {typeof __VLS_components.FormDialog | typeof __VLS_components.FormDialog} */
FormDialog;
// @ts-ignore
var __VLS_195 = __VLS_asFunctionalComponent1(__VLS_194, new __VLS_194(__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.createDialog.isOpen), title: "Tạo Yêu Cầu Phân Bổ Mới", loading: (__VLS_ctx.isLoading), maxWidth: "600px" })));
var __VLS_196 = __VLS_195.apply(void 0, __spreadArray([__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.createDialog.isOpen), title: "Tạo Yêu Cầu Phân Bổ Mới", loading: (__VLS_ctx.isLoading), maxWidth: "600px" })], __VLS_functionalComponentArgsRest(__VLS_195), false));
var __VLS_199;
var __VLS_200 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleCreateSubmit) });
var __VLS_201 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.closeCreateDialog) });
var __VLS_202 = __VLS_197.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_203;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_204 = __VLS_asFunctionalComponent1(__VLS_203, new __VLS_203({
    modelValue: (__VLS_ctx.createData.order_id),
    label: "Mã Đơn Hàng",
    required: true,
    placeholder: "VD: ORD-2024-001",
}));
var __VLS_205 = __VLS_204.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createData.order_id),
        label: "Mã Đơn Hàng",
        required: true,
        placeholder: "VD: ORD-2024-001",
    }], __VLS_functionalComponentArgsRest(__VLS_204), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_208;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_209 = __VLS_asFunctionalComponent1(__VLS_208, new __VLS_208({
    modelValue: (__VLS_ctx.createData.order_reference),
    label: "Tham Chiếu",
    placeholder: "Tùy chọn",
}));
var __VLS_210 = __VLS_209.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createData.order_reference),
        label: "Tham Chiếu",
        placeholder: "Tùy chọn",
    }], __VLS_functionalComponentArgsRest(__VLS_209), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_213;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_214 = __VLS_asFunctionalComponent1(__VLS_213, new __VLS_213({
    modelValue: (__VLS_ctx.createData.thread_type_id),
    label: "Loại Chỉ",
    options: (__VLS_ctx.threadTypeOptions),
    required: true,
    emitValue: true,
    mapOptions: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
    popupContentClass: "z-max",
}));
var __VLS_215 = __VLS_214.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createData.thread_type_id),
        label: "Loại Chỉ",
        options: (__VLS_ctx.threadTypeOptions),
        required: true,
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        popupContentClass: "z-max",
    }], __VLS_functionalComponentArgsRest(__VLS_214), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_218;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_219 = __VLS_asFunctionalComponent1(__VLS_218, new __VLS_218({
    modelValue: (__VLS_ctx.createData.requested_meters),
    modelModifiers: { number: true, },
    label: "Số Mét Yêu Cầu",
    type: "number",
    required: true,
    min: "1",
}));
var __VLS_220 = __VLS_219.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createData.requested_meters),
        modelModifiers: { number: true, },
        label: "Số Mét Yêu Cầu",
        type: "number",
        required: true,
        min: "1",
    }], __VLS_functionalComponentArgsRest(__VLS_219), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_223;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_224 = __VLS_asFunctionalComponent1(__VLS_223, new __VLS_223({
    modelValue: (__VLS_ctx.createData.priority),
    label: "Mức Ưu Tiên",
    options: (__VLS_ctx.priorityOptions),
    required: true,
    emitValue: true,
    mapOptions: true,
    popupContentClass: "z-max",
}));
var __VLS_225 = __VLS_224.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createData.priority),
        label: "Mức Ưu Tiên",
        options: (__VLS_ctx.priorityOptions),
        required: true,
        emitValue: true,
        mapOptions: true,
        popupContentClass: "z-max",
    }], __VLS_functionalComponentArgsRest(__VLS_224), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_228;
/** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_229 = __VLS_asFunctionalComponent1(__VLS_228, new __VLS_228({
    modelValue: (__VLS_ctx.createData.due_date),
    label: "Hạn Giao",
    placeholder: "DD/MM/YYYY",
    readonly: true,
}));
var __VLS_230 = __VLS_229.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createData.due_date),
        label: "Hạn Giao",
        placeholder: "DD/MM/YYYY",
        readonly: true,
    }], __VLS_functionalComponentArgsRest(__VLS_229), false));
var __VLS_233 = __VLS_231.slots.default;
{
    var __VLS_234 = __VLS_231.slots.append;
    var __VLS_235 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_236 = __VLS_asFunctionalComponent1(__VLS_235, new __VLS_235(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_237 = __VLS_236.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_236), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_240 = __VLS_238.slots.default;
    var __VLS_241 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_242 = __VLS_asFunctionalComponent1(__VLS_241, new __VLS_241({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_243 = __VLS_242.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_242), false));
    var __VLS_246 = __VLS_244.slots.default;
    var __VLS_247 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.DatePicker} */
    DatePicker;
    // @ts-ignore
    var __VLS_248 = __VLS_asFunctionalComponent1(__VLS_247, new __VLS_247({
        modelValue: (__VLS_ctx.createData.due_date),
    }));
    var __VLS_249 = __VLS_248.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.createData.due_date),
        }], __VLS_functionalComponentArgsRest(__VLS_248), false));
    // @ts-ignore
    [threadTypeOptions, priorityOptions, isLoading, createDialog, handleCreateSubmit, closeCreateDialog, createData, createData, createData, createData, createData, createData, createData,];
    var __VLS_244;
    // @ts-ignore
    [];
    var __VLS_238;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_231;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_252;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_253 = __VLS_asFunctionalComponent1(__VLS_252, new __VLS_252({
    modelValue: (__VLS_ctx.createData.notes),
    label: "Ghi Chú",
    type: "textarea",
    rows: "3",
    placeholder: "Nhập ghi chú nếu có...",
}));
var __VLS_254 = __VLS_253.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createData.notes),
        label: "Ghi Chú",
        type: "textarea",
        rows: "3",
        placeholder: "Nhập ghi chú nếu có...",
    }], __VLS_functionalComponentArgsRest(__VLS_253), false));
// @ts-ignore
[createData,];
var __VLS_197;
var __VLS_198;
var __VLS_257;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_258 = __VLS_asFunctionalComponent1(__VLS_257, new __VLS_257({
    modelValue: (__VLS_ctx.detailDialog.isOpen),
}));
var __VLS_259 = __VLS_258.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.detailDialog.isOpen),
    }], __VLS_functionalComponentArgsRest(__VLS_258), false));
var __VLS_262 = __VLS_260.slots.default;
if (__VLS_ctx.detailDialog.allocation) {
    var __VLS_263 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_264 = __VLS_asFunctionalComponent1(__VLS_263, new __VLS_263(__assign({ style: {} })));
    var __VLS_265 = __VLS_264.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_264), false));
    var __VLS_268 = __VLS_266.slots.default;
    var __VLS_269 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_270 = __VLS_asFunctionalComponent1(__VLS_269, new __VLS_269(__assign({ class: "row items-center q-pb-none" })));
    var __VLS_271 = __VLS_270.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_270), false));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
    var __VLS_274 = __VLS_272.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    (__VLS_ctx.detailDialog.allocation.id);
    var __VLS_275 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
    qSpace;
    // @ts-ignore
    var __VLS_276 = __VLS_asFunctionalComponent1(__VLS_275, new __VLS_275({}));
    var __VLS_277 = __VLS_276.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_276), false));
    var __VLS_280 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_281 = __VLS_asFunctionalComponent1(__VLS_280, new __VLS_280({
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }));
    var __VLS_282 = __VLS_281.apply(void 0, __spreadArray([{
            icon: "close",
            flat: true,
            round: true,
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_281), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    // @ts-ignore
    [detailDialog, detailDialog, detailDialog, vClosePopup,];
    var __VLS_272;
    var __VLS_285 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_286 = __VLS_asFunctionalComponent1(__VLS_285, new __VLS_285(__assign({ class: "q-pa-md" })));
    var __VLS_287 = __VLS_286.apply(void 0, __spreadArray([__assign({ class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_286), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    var __VLS_290 = __VLS_288.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey-7 q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-sm rounded-borders" }, { style: {} }));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-5 text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['col-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-7 text-weight-bold" }));
    /** @type {__VLS_StyleScopedClasses['col-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (__VLS_ctx.detailDialog.allocation.order_id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-5 text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['col-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-7" }));
    /** @type {__VLS_StyleScopedClasses['col-7']} */ ;
    (__VLS_ctx.detailDialog.allocation.order_reference || '---');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-5 text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['col-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-7" }));
    /** @type {__VLS_StyleScopedClasses['col-7']} */ ;
    var __VLS_291 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_292 = __VLS_asFunctionalComponent1(__VLS_291, new __VLS_291({
        color: (__VLS_ctx.priorityColors[__VLS_ctx.detailDialog.allocation.priority]),
        outline: true,
    }));
    var __VLS_293 = __VLS_292.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.priorityColors[__VLS_ctx.detailDialog.allocation.priority]),
            outline: true,
        }], __VLS_functionalComponentArgsRest(__VLS_292), false));
    var __VLS_296 = __VLS_294.slots.default;
    (__VLS_ctx.priorityLabels[__VLS_ctx.detailDialog.allocation.priority]);
    // @ts-ignore
    [priorityColors, priorityLabels, detailDialog, detailDialog, detailDialog, detailDialog,];
    var __VLS_294;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-5 text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['col-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-7" }, { class: ({ 'text-negative text-weight-bold': __VLS_ctx.isOverdue(__VLS_ctx.detailDialog.allocation.due_date) }) }));
    /** @type {__VLS_StyleScopedClasses['col-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.detailDialog.allocation.due_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey-7 q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-sm rounded-borders" }, { style: {} }));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-5 text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['col-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-7 text-weight-medium text-primary" }));
    /** @type {__VLS_StyleScopedClasses['col-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    ((_h = __VLS_ctx.detailDialog.allocation.thread_type) === null || _h === void 0 ? void 0 : _h.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-5 text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['col-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-7 text-weight-bold" }));
    /** @type {__VLS_StyleScopedClasses['col-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (__VLS_ctx.detailDialog.allocation.requested_meters.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-5 text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['col-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-7 text-weight-bold" }, { class: (__VLS_ctx.getAllocationRatioClass(__VLS_ctx.detailDialog.allocation)) }));
    /** @type {__VLS_StyleScopedClasses['col-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    (__VLS_ctx.detailDialog.allocation.allocated_meters.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-5 text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['col-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-7" }));
    /** @type {__VLS_StyleScopedClasses['col-7']} */ ;
    var __VLS_297 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_298 = __VLS_asFunctionalComponent1(__VLS_297, new __VLS_297({
        color: (__VLS_ctx.statusColors[__VLS_ctx.detailDialog.allocation.status]),
    }));
    var __VLS_299 = __VLS_298.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.statusColors[__VLS_ctx.detailDialog.allocation.status]),
        }], __VLS_functionalComponentArgsRest(__VLS_298), false));
    var __VLS_302 = __VLS_300.slots.default;
    (__VLS_ctx.statusLabels[__VLS_ctx.detailDialog.allocation.status]);
    // @ts-ignore
    [getAllocationRatioClass, statusColors, statusLabels, isOverdue, formatDate, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog,];
    var __VLS_300;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey-7 q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    var __VLS_303 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_304 = __VLS_asFunctionalComponent1(__VLS_303, new __VLS_303(__assign(__assign({ flat: true, bordered: true, dense: true, rows: (__VLS_ctx.detailDialog.allocation.allocated_cones || []), columns: (__VLS_ctx.coneColumns), rowKey: "id" }, { class: "" }), { noDataLabel: "Chưa có cuộn chỉ nào được gán" })));
    var __VLS_305 = __VLS_304.apply(void 0, __spreadArray([__assign(__assign({ flat: true, bordered: true, dense: true, rows: (__VLS_ctx.detailDialog.allocation.allocated_cones || []), columns: (__VLS_ctx.coneColumns), rowKey: "id" }, { class: "" }), { noDataLabel: "Chưa có cuộn chỉ nào được gán" })], __VLS_functionalComponentArgsRest(__VLS_304), false));
    /** @type {__VLS_StyleScopedClasses['']} */ ;
    var __VLS_308 = __VLS_306.slots.default;
    {
        var __VLS_309 = __VLS_306.slots["body-cell-cone_id"];
        var props = __VLS_vSlot(__VLS_309)[0];
        var __VLS_310 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_311 = __VLS_asFunctionalComponent1(__VLS_310, new __VLS_310({
            props: (props),
        }));
        var __VLS_312 = __VLS_311.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_311), false));
        var __VLS_315 = __VLS_313.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium text-primary" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
        ((_j = props.row.cone) === null || _j === void 0 ? void 0 : _j.cone_id);
        // @ts-ignore
        [detailDialog, coneColumns,];
        var __VLS_313;
        // @ts-ignore
        [];
    }
    {
        var __VLS_316 = __VLS_306.slots["body-cell-allocated_meters"];
        var props = __VLS_vSlot(__VLS_316)[0];
        var __VLS_317 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_318 = __VLS_asFunctionalComponent1(__VLS_317, new __VLS_317({
            props: (props),
            align: "right",
        }));
        var __VLS_319 = __VLS_318.apply(void 0, __spreadArray([{
                props: (props),
                align: "right",
            }], __VLS_functionalComponentArgsRest(__VLS_318), false));
        var __VLS_322 = __VLS_320.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "font-mono" }));
        /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
        (props.value.toLocaleString());
        // @ts-ignore
        [];
        var __VLS_320;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_306;
    if (__VLS_ctx.detailDialog.allocation.notes) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey-7 q-mb-xs" }));
        /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-sm rounded-borders text-italic" }, { style: {} }));
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-italic']} */ ;
        (__VLS_ctx.detailDialog.allocation.notes);
    }
    // @ts-ignore
    [detailDialog, detailDialog,];
    var __VLS_288;
    var __VLS_323 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_324 = __VLS_asFunctionalComponent1(__VLS_323, new __VLS_323(__assign({ align: "right" }, { class: "q-px-md q-pb-md q-gutter-x-sm" })));
    var __VLS_325 = __VLS_324.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md q-gutter-x-sm" })], __VLS_functionalComponentArgsRest(__VLS_324), false));
    /** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-sm']} */ ;
    var __VLS_328 = __VLS_326.slots.default;
    if (__VLS_ctx.detailDialog.allocation.status === __VLS_ctx.AllocationStatus.PENDING) {
        var __VLS_329 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_330 = __VLS_asFunctionalComponent1(__VLS_329, new __VLS_329(__assign({ 'onClick': {} }, { unelevated: true, label: "Thực Hiện Phân Bổ", color: "positive" })));
        var __VLS_331 = __VLS_330.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { unelevated: true, label: "Thực Hiện Phân Bổ", color: "positive" })], __VLS_functionalComponentArgsRest(__VLS_330), false));
        var __VLS_334 = void 0;
        var __VLS_335 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.detailDialog.allocation))
                        return;
                    if (!(__VLS_ctx.detailDialog.allocation.status === __VLS_ctx.AllocationStatus.PENDING))
                        return;
                    __VLS_ctx.handleExecute(__VLS_ctx.detailDialog.allocation);
                    // @ts-ignore
                    [enums_1.AllocationStatus, handleExecute, detailDialog, detailDialog,];
                } });
        var __VLS_332;
        var __VLS_333;
    }
    if (__VLS_ctx.detailDialog.allocation.status === __VLS_ctx.AllocationStatus.SOFT) {
        var __VLS_336 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_337 = __VLS_asFunctionalComponent1(__VLS_336, new __VLS_336(__assign({ 'onClick': {} }, { unelevated: true, label: "Xuất Cho Sản Xuất", color: "accent" })));
        var __VLS_338 = __VLS_337.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { unelevated: true, label: "Xuất Cho Sản Xuất", color: "accent" })], __VLS_functionalComponentArgsRest(__VLS_337), false));
        var __VLS_341 = void 0;
        var __VLS_342 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.detailDialog.allocation))
                        return;
                    if (!(__VLS_ctx.detailDialog.allocation.status === __VLS_ctx.AllocationStatus.SOFT))
                        return;
                    __VLS_ctx.handleIssue(__VLS_ctx.detailDialog.allocation);
                    // @ts-ignore
                    [enums_1.AllocationStatus, handleIssue, detailDialog, detailDialog,];
                } });
        var __VLS_339;
        var __VLS_340;
    }
    var __VLS_343 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_344 = __VLS_asFunctionalComponent1(__VLS_343, new __VLS_343({
        flat: true,
        label: "Đóng",
        color: "grey",
    }));
    var __VLS_345 = __VLS_344.apply(void 0, __spreadArray([{
            flat: true,
            label: "Đóng",
            color: "grey",
        }], __VLS_functionalComponentArgsRest(__VLS_344), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    // @ts-ignore
    [vClosePopup,];
    var __VLS_326;
    // @ts-ignore
    [];
    var __VLS_266;
}
// @ts-ignore
[];
var __VLS_260;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
