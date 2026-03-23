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
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var quasar_1 = require("quasar");
var composables_1 = require("@/composables");
var AllocationStatusBadge_vue_1 = require("@/components/thread/AllocationStatusBadge.vue");
var enums_1 = require("@/types/thread/enums");
var $q = (0, quasar_1.useQuasar)();
var confirmDialog = (0, composables_1.useConfirm)().confirm;
// Composables
var _b = (0, composables_1.useThreadRequests)(), requests = _b.requests, isLoading = _b.isLoading, pendingCount = _b.pendingCount, readyForPickupCount = _b.readyForPickupCount, fetchRequests = _b.fetchRequests, createRequest = _b.createRequest, approve = _b.approve, reject = _b.reject, markReady = _b.markReady, confirmReceived = _b.confirmReceived, cancelRequest = _b.cancelRequest;
var _c = (0, composables_1.useWarehouses)(), storageWarehouses = _c.storageWarehouses, fetchWarehouses = _c.fetchWarehouses;
var _d = (0, composables_1.useThreadTypes)(), threadTypes = _d.threadTypes, fetchThreadTypes = _d.fetchThreadTypes;
// State
var activeTab = (0, vue_1.ref)('all');
var search = (0, vue_1.ref)('');
var showCreateDialog = (0, vue_1.ref)(false);
var showRejectDialog = (0, vue_1.ref)(false);
var selectedRequest = (0, vue_1.ref)(null);
var rejectReason = (0, vue_1.ref)('');
// Create form
var createForm = (0, vue_1.ref)({
    order_id: '',
    thread_type_id: 0,
    requested_meters: 0,
    priority: enums_1.AllocationPriority.NORMAL,
    requesting_warehouse_id: undefined,
    source_warehouse_id: undefined,
    requested_by: '',
});
// Pagination
var pagination = (0, vue_1.ref)({
    page: 1,
    rowsPerPage: 15,
    sortBy: 'created_at',
    descending: true,
});
// Table columns
var columns = [
    { name: 'id', label: 'Mã', field: 'id', sortable: true, align: 'left' },
    { name: 'order_id', label: 'Mã đơn hàng', field: 'order_id', sortable: true, align: 'left' },
    {
        name: 'thread_type',
        label: 'Loại chỉ',
        field: function (row) { var _a; return ((_a = row.thread_type) === null || _a === void 0 ? void 0 : _a.name) || '-'; },
        sortable: true,
        align: 'left',
    },
    {
        name: 'requested_meters',
        label: 'Số mét',
        field: 'requested_meters',
        sortable: true,
        align: 'right',
        format: function (val) { return val.toLocaleString('vi-VN'); },
    },
    {
        name: 'requesting_warehouse',
        label: 'Xưởng yêu cầu',
        field: function (row) { var _a; return ((_a = row.requesting_warehouse) === null || _a === void 0 ? void 0 : _a.name) || '-'; },
        sortable: false,
        align: 'left',
    },
    {
        name: 'status',
        label: 'Trạng thái',
        field: 'status',
        sortable: true,
        align: 'center',
    },
    {
        name: 'created_at',
        label: 'Ngày tạo',
        field: 'created_at',
        sortable: true,
        align: 'left',
        format: function (val) { return quasar_1.date.formatDate(val, 'DD/MM/YYYY HH:mm'); },
    },
    { name: 'actions', label: 'Thao tác', field: 'actions', align: 'center' },
];
// Computed
var filteredRequests = (0, vue_1.computed)(function () {
    var result = __spreadArray([], requests.value, true);
    // Filter by tab
    if (activeTab.value === 'pending') {
        result = result.filter(function (r) { return r.status === enums_1.AllocationStatus.PENDING; });
    }
    else if (activeTab.value === 'approved') {
        result = result.filter(function (r) { return r.status === enums_1.AllocationStatus.APPROVED; });
    }
    else if (activeTab.value === 'ready') {
        result = result.filter(function (r) { return r.status === enums_1.AllocationStatus.READY_FOR_PICKUP; });
    }
    else if (activeTab.value === 'completed') {
        result = result.filter(function (r) {
            return r.status === enums_1.AllocationStatus.RECEIVED ||
                r.status === enums_1.AllocationStatus.REJECTED ||
                r.status === enums_1.AllocationStatus.CANCELLED;
        });
    }
    // Filter by search
    if (search.value) {
        var s_1 = search.value.toLowerCase();
        result = result.filter(function (r) {
            var _a, _b, _c, _d;
            return r.order_id.toLowerCase().includes(s_1) ||
                ((_b = (_a = r.thread_type) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(s_1)) ||
                ((_d = (_c = r.requesting_warehouse) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(s_1));
        });
    }
    return result;
});
var priorityOptions = [
    { label: 'Thấp', value: enums_1.AllocationPriority.LOW },
    { label: 'Bình thường', value: enums_1.AllocationPriority.NORMAL },
    { label: 'Cao', value: enums_1.AllocationPriority.HIGH },
    { label: 'Khẩn cấp', value: enums_1.AllocationPriority.URGENT },
];
// Actions
function handleApprove(row) {
    return __awaiter(this, void 0, void 0, function () {
        var ok;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirmDialog('Xác nhận duyệt yêu cầu này?')];
                case 1:
                    ok = _a.sent();
                    if (!ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, approve(row.id, 'Admin')]; // TODO: Get current user
                case 2:
                    _a.sent(); // TODO: Get current user
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function openRejectDialog(row) {
    selectedRequest.value = row;
    rejectReason.value = '';
    showRejectDialog.value = true;
}
function handleReject() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedRequest.value || !rejectReason.value.trim()) {
                        $q.notify({ type: 'warning', message: 'Vui lòng nhập lý do từ chối' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, reject(selectedRequest.value.id, 'Admin', rejectReason.value)];
                case 1:
                    _a.sent();
                    showRejectDialog.value = false;
                    selectedRequest.value = null;
                    return [2 /*return*/];
            }
        });
    });
}
function handleMarkReady(row) {
    return __awaiter(this, void 0, void 0, function () {
        var ok;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirmDialog('Xác nhận đã chuẩn bị xong chỉ cho yêu cầu này?')];
                case 1:
                    ok = _a.sent();
                    if (!ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, markReady(row.id)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function handleReceive(row) {
    return __awaiter(this, void 0, void 0, function () {
        var ok;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirmDialog('Xác nhận đã nhận chỉ?')];
                case 1:
                    ok = _a.sent();
                    if (!ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, confirmReceived(row.id, 'Admin')]; // TODO: Get current user
                case 2:
                    _a.sent(); // TODO: Get current user
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function handleCancel(row) {
    return __awaiter(this, void 0, void 0, function () {
        var ok;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirmDialog('Xác nhận hủy yêu cầu này?')];
                case 1:
                    ok = _a.sent();
                    if (!ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, cancelRequest(row.id)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function openCreateDialog() {
    createForm.value = {
        order_id: '',
        thread_type_id: 0,
        requested_meters: 0,
        priority: enums_1.AllocationPriority.NORMAL,
        requesting_warehouse_id: undefined,
        source_warehouse_id: undefined,
        requested_by: '',
    };
    showCreateDialog.value = true;
}
function handleCreate() {
    return __awaiter(this, void 0, void 0, function () {
        var created;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!createForm.value.order_id || !createForm.value.thread_type_id || !createForm.value.requested_meters) {
                        $q.notify({ type: 'warning', message: 'Vui lòng điền đầy đủ thông tin' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, createRequest(createForm.value)];
                case 1:
                    created = _a.sent();
                    if (created) {
                        showCreateDialog.value = false;
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Determine which actions are available
function canApprove(row) {
    return row.status === enums_1.AllocationStatus.PENDING;
}
function canReject(row) {
    return row.status === enums_1.AllocationStatus.PENDING;
}
function canMarkReady(row) {
    return row.status === enums_1.AllocationStatus.APPROVED;
}
function canReceive(row) {
    return row.status === enums_1.AllocationStatus.READY_FOR_PICKUP;
}
function canCancel(row) {
    return row.status === enums_1.AllocationStatus.PENDING || row.status === enums_1.AllocationStatus.APPROVED;
}
// Watch tab change
(0, vue_1.watch)(activeTab, function () {
    pagination.value.page = 1;
});
// Lifecycle
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([fetchRequests(), fetchWarehouses(), fetchThreadTypes()])];
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
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ class: "q-pa-md" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_6 = __VLS_3.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h5, __VLS_intrinsics.h5)(__assign({ class: "q-my-none" }));
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-grey-7 q-mb-none" }));
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
/** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Tạo yêu cầu" })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Tạo yêu cầu" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
var __VLS_13 = ({ click: {} },
    { onClick: (__VLS_ctx.openCreateDialog) });
var __VLS_10;
var __VLS_11;
var __VLS_14;
/** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
qTabs;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left" })));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left" })], __VLS_functionalComponentArgsRest(__VLS_15), false));
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
var __VLS_19 = __VLS_17.slots.default;
var __VLS_20;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    name: "all",
    label: "Tất cả",
}));
var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([{
        name: "all",
        label: "Tất cả",
    }], __VLS_functionalComponentArgsRest(__VLS_21), false));
var __VLS_25;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab | typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
    name: "pending",
}));
var __VLS_27 = __VLS_26.apply(void 0, __spreadArray([{
        name: "pending",
    }], __VLS_functionalComponentArgsRest(__VLS_26), false));
var __VLS_30 = __VLS_28.slots.default;
{
    var __VLS_31 = __VLS_28.slots.default;
    if (__VLS_ctx.pendingCount > 0) {
        var __VLS_32 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
            color: "orange",
            floating: true,
        }));
        var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([{
                color: "orange",
                floating: true,
            }], __VLS_functionalComponentArgsRest(__VLS_33), false));
        var __VLS_37 = __VLS_35.slots.default;
        (__VLS_ctx.pendingCount);
        // @ts-ignore
        [openCreateDialog, activeTab, pendingCount, pendingCount,];
        var __VLS_35;
    }
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_28;
var __VLS_38;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
    name: "approved",
    label: "Đã duyệt",
}));
var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{
        name: "approved",
        label: "Đã duyệt",
    }], __VLS_functionalComponentArgsRest(__VLS_39), false));
var __VLS_43;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab | typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
    name: "ready",
}));
var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{
        name: "ready",
    }], __VLS_functionalComponentArgsRest(__VLS_44), false));
var __VLS_48 = __VLS_46.slots.default;
{
    var __VLS_49 = __VLS_46.slots.default;
    if (__VLS_ctx.readyForPickupCount > 0) {
        var __VLS_50 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
            color: "green",
            floating: true,
        }));
        var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{
                color: "green",
                floating: true,
            }], __VLS_functionalComponentArgsRest(__VLS_51), false));
        var __VLS_55 = __VLS_53.slots.default;
        (__VLS_ctx.readyForPickupCount);
        // @ts-ignore
        [readyForPickupCount, readyForPickupCount,];
        var __VLS_53;
    }
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_46;
var __VLS_56;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
    name: "completed",
    label: "Hoàn thành",
}));
var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([{
        name: "completed",
        label: "Hoàn thành",
    }], __VLS_functionalComponentArgsRest(__VLS_57), false));
// @ts-ignore
[];
var __VLS_17;
var __VLS_61;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61(__assign({ class: "q-mb-md" })));
var __VLS_63 = __VLS_62.apply(void 0, __spreadArray([__assign({ class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_62), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_66;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
    modelValue: (__VLS_ctx.search),
    dense: true,
    outlined: true,
    clearable: true,
    placeholder: "Tìm kiếm...",
}));
var __VLS_68 = __VLS_67.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.search),
        dense: true,
        outlined: true,
        clearable: true,
        placeholder: "Tìm kiếm...",
    }], __VLS_functionalComponentArgsRest(__VLS_67), false));
var __VLS_71 = __VLS_69.slots.default;
{
    var __VLS_72 = __VLS_69.slots.prepend;
    var __VLS_73 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({
        name: "search",
    }));
    var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([{
            name: "search",
        }], __VLS_functionalComponentArgsRest(__VLS_74), false));
    // @ts-ignore
    [search,];
}
// @ts-ignore
[];
var __VLS_69;
var __VLS_78;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
    pagination: (__VLS_ctx.pagination),
    rows: (__VLS_ctx.filteredRequests),
    columns: (__VLS_ctx.columns),
    loading: (__VLS_ctx.isLoading),
    rowKey: "id",
    flat: true,
    bordered: true,
}));
var __VLS_80 = __VLS_79.apply(void 0, __spreadArray([{
        pagination: (__VLS_ctx.pagination),
        rows: (__VLS_ctx.filteredRequests),
        columns: (__VLS_ctx.columns),
        loading: (__VLS_ctx.isLoading),
        rowKey: "id",
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_79), false));
var __VLS_83 = __VLS_81.slots.default;
{
    var __VLS_84 = __VLS_81.slots["body-cell-status"];
    var props = __VLS_vSlot(__VLS_84)[0];
    var __VLS_85 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({
        props: (props),
    }));
    var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_86), false));
    var __VLS_90 = __VLS_88.slots.default;
    var __VLS_91 = AllocationStatusBadge_vue_1.default;
    // @ts-ignore
    var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91({
        status: (props.row.status),
    }));
    var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([{
            status: (props.row.status),
        }], __VLS_functionalComponentArgsRest(__VLS_92), false));
    // @ts-ignore
    [pagination, filteredRequests, columns, isLoading,];
    var __VLS_88;
    // @ts-ignore
    [];
}
{
    var __VLS_96 = __VLS_81.slots["body-cell-actions"];
    var props_1 = __VLS_vSlot(__VLS_96)[0];
    var __VLS_97 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97(__assign({ props: (props_1) }, { class: "q-gutter-xs" })));
    var __VLS_99 = __VLS_98.apply(void 0, __spreadArray([__assign({ props: (props_1) }, { class: "q-gutter-xs" })], __VLS_functionalComponentArgsRest(__VLS_98), false));
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    var __VLS_102 = __VLS_100.slots.default;
    if (__VLS_ctx.canApprove(props_1.row)) {
        var __VLS_103 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_104 = __VLS_asFunctionalComponent1(__VLS_103, new __VLS_103(__assign({ 'onClick': {} }, { size: "sm", color: "positive", icon: "check", dense: true, round: true })));
        var __VLS_105 = __VLS_104.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { size: "sm", color: "positive", icon: "check", dense: true, round: true })], __VLS_functionalComponentArgsRest(__VLS_104), false));
        var __VLS_108 = void 0;
        var __VLS_109 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.canApprove(props_1.row)))
                        return;
                    __VLS_ctx.handleApprove(props_1.row);
                    // @ts-ignore
                    [canApprove, handleApprove,];
                } });
        var __VLS_110 = __VLS_106.slots.default;
        var __VLS_111 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111({}));
        var __VLS_113 = __VLS_112.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_112), false));
        var __VLS_116 = __VLS_114.slots.default;
        // @ts-ignore
        [];
        var __VLS_114;
        // @ts-ignore
        [];
        var __VLS_106;
        var __VLS_107;
    }
    if (__VLS_ctx.canReject(props_1.row)) {
        var __VLS_117 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117(__assign({ 'onClick': {} }, { size: "sm", color: "negative", icon: "close", dense: true, round: true })));
        var __VLS_119 = __VLS_118.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { size: "sm", color: "negative", icon: "close", dense: true, round: true })], __VLS_functionalComponentArgsRest(__VLS_118), false));
        var __VLS_122 = void 0;
        var __VLS_123 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.canReject(props_1.row)))
                        return;
                    __VLS_ctx.openRejectDialog(props_1.row);
                    // @ts-ignore
                    [canReject, openRejectDialog,];
                } });
        var __VLS_124 = __VLS_120.slots.default;
        var __VLS_125 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125({}));
        var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_126), false));
        var __VLS_130 = __VLS_128.slots.default;
        // @ts-ignore
        [];
        var __VLS_128;
        // @ts-ignore
        [];
        var __VLS_120;
        var __VLS_121;
    }
    if (__VLS_ctx.canMarkReady(props_1.row)) {
        var __VLS_131 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131(__assign({ 'onClick': {} }, { size: "sm", color: "amber", icon: "inventory", dense: true, round: true })));
        var __VLS_133 = __VLS_132.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { size: "sm", color: "amber", icon: "inventory", dense: true, round: true })], __VLS_functionalComponentArgsRest(__VLS_132), false));
        var __VLS_136 = void 0;
        var __VLS_137 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.canMarkReady(props_1.row)))
                        return;
                    __VLS_ctx.handleMarkReady(props_1.row);
                    // @ts-ignore
                    [canMarkReady, handleMarkReady,];
                } });
        var __VLS_138 = __VLS_134.slots.default;
        var __VLS_139 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_140 = __VLS_asFunctionalComponent1(__VLS_139, new __VLS_139({}));
        var __VLS_141 = __VLS_140.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_140), false));
        var __VLS_144 = __VLS_142.slots.default;
        // @ts-ignore
        [];
        var __VLS_142;
        // @ts-ignore
        [];
        var __VLS_134;
        var __VLS_135;
    }
    if (__VLS_ctx.canReceive(props_1.row)) {
        var __VLS_145 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_146 = __VLS_asFunctionalComponent1(__VLS_145, new __VLS_145(__assign({ 'onClick': {} }, { size: "sm", color: "green", icon: "done_all", dense: true, round: true })));
        var __VLS_147 = __VLS_146.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { size: "sm", color: "green", icon: "done_all", dense: true, round: true })], __VLS_functionalComponentArgsRest(__VLS_146), false));
        var __VLS_150 = void 0;
        var __VLS_151 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.canReceive(props_1.row)))
                        return;
                    __VLS_ctx.handleReceive(props_1.row);
                    // @ts-ignore
                    [canReceive, handleReceive,];
                } });
        var __VLS_152 = __VLS_148.slots.default;
        var __VLS_153 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_154 = __VLS_asFunctionalComponent1(__VLS_153, new __VLS_153({}));
        var __VLS_155 = __VLS_154.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_154), false));
        var __VLS_158 = __VLS_156.slots.default;
        // @ts-ignore
        [];
        var __VLS_156;
        // @ts-ignore
        [];
        var __VLS_148;
        var __VLS_149;
    }
    if (__VLS_ctx.canCancel(props_1.row)) {
        var __VLS_159 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_160 = __VLS_asFunctionalComponent1(__VLS_159, new __VLS_159(__assign({ 'onClick': {} }, { size: "sm", color: "grey", icon: "cancel", dense: true, round: true, flat: true })));
        var __VLS_161 = __VLS_160.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { size: "sm", color: "grey", icon: "cancel", dense: true, round: true, flat: true })], __VLS_functionalComponentArgsRest(__VLS_160), false));
        var __VLS_164 = void 0;
        var __VLS_165 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.canCancel(props_1.row)))
                        return;
                    __VLS_ctx.handleCancel(props_1.row);
                    // @ts-ignore
                    [canCancel, handleCancel,];
                } });
        var __VLS_166 = __VLS_162.slots.default;
        var __VLS_167 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_168 = __VLS_asFunctionalComponent1(__VLS_167, new __VLS_167({}));
        var __VLS_169 = __VLS_168.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_168), false));
        var __VLS_172 = __VLS_170.slots.default;
        // @ts-ignore
        [];
        var __VLS_170;
        // @ts-ignore
        [];
        var __VLS_162;
        var __VLS_163;
    }
    // @ts-ignore
    [];
    var __VLS_100;
    // @ts-ignore
    [];
}
{
    var __VLS_173 = __VLS_81.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "full-width row flex-center text-grey q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_174 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174(__assign({ name: "inbox", size: "3em" }, { class: "q-mr-sm" })));
    var __VLS_176 = __VLS_175.apply(void 0, __spreadArray([__assign({ name: "inbox", size: "3em" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_175), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_81;
var __VLS_179;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_180 = __VLS_asFunctionalComponent1(__VLS_179, new __VLS_179({
    modelValue: (__VLS_ctx.showCreateDialog),
    persistent: true,
}));
var __VLS_181 = __VLS_180.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showCreateDialog),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_180), false));
var __VLS_184 = __VLS_182.slots.default;
var __VLS_185;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_186 = __VLS_asFunctionalComponent1(__VLS_185, new __VLS_185(__assign({ style: {} })));
var __VLS_187 = __VLS_186.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_186), false));
var __VLS_190 = __VLS_188.slots.default;
var __VLS_191;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_192 = __VLS_asFunctionalComponent1(__VLS_191, new __VLS_191(__assign({ class: "row items-center" })));
var __VLS_193 = __VLS_192.apply(void 0, __spreadArray([__assign({ class: "row items-center" })], __VLS_functionalComponentArgsRest(__VLS_192), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_196 = __VLS_194.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
var __VLS_197;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_198 = __VLS_asFunctionalComponent1(__VLS_197, new __VLS_197({}));
var __VLS_199 = __VLS_198.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_198), false));
var __VLS_202;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_203 = __VLS_asFunctionalComponent1(__VLS_202, new __VLS_202({
    icon: "close",
    flat: true,
    round: true,
    dense: true,
}));
var __VLS_204 = __VLS_203.apply(void 0, __spreadArray([{
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_203), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[showCreateDialog, vClosePopup,];
var __VLS_194;
var __VLS_207;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_208 = __VLS_asFunctionalComponent1(__VLS_207, new __VLS_207({}));
var __VLS_209 = __VLS_208.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_208), false));
var __VLS_212;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_213 = __VLS_asFunctionalComponent1(__VLS_212, new __VLS_212(__assign({ class: "q-gutter-md" })));
var __VLS_214 = __VLS_213.apply(void 0, __spreadArray([__assign({ class: "q-gutter-md" })], __VLS_functionalComponentArgsRest(__VLS_213), false));
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_217 = __VLS_215.slots.default;
var __VLS_218;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_219 = __VLS_asFunctionalComponent1(__VLS_218, new __VLS_218({
    modelValue: (__VLS_ctx.createForm.order_id),
    label: "Mã đơn hàng *",
    outlined: true,
    dense: true,
}));
var __VLS_220 = __VLS_219.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createForm.order_id),
        label: "Mã đơn hàng *",
        outlined: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_219), false));
var __VLS_223;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect | typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_224 = __VLS_asFunctionalComponent1(__VLS_223, new __VLS_223({
    modelValue: (__VLS_ctx.createForm.thread_type_id),
    options: (__VLS_ctx.threadTypes),
    optionValue: "id",
    optionLabel: (function (item) { return "".concat(item.code, " - ").concat(item.name); }),
    label: "Loại chỉ *",
    outlined: true,
    dense: true,
    emitValue: true,
    mapOptions: true,
    rules: ([function (v) { return !!v || 'Vui lòng chọn loại chỉ'; }]),
}));
var __VLS_225 = __VLS_224.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createForm.thread_type_id),
        options: (__VLS_ctx.threadTypes),
        optionValue: "id",
        optionLabel: (function (item) { return "".concat(item.code, " - ").concat(item.name); }),
        label: "Loại chỉ *",
        outlined: true,
        dense: true,
        emitValue: true,
        mapOptions: true,
        rules: ([function (v) { return !!v || 'Vui lòng chọn loại chỉ'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_224), false));
var __VLS_228 = __VLS_226.slots.default;
{
    var __VLS_229 = __VLS_226.slots.option;
    var _e = __VLS_vSlot(__VLS_229)[0], itemProps = _e.itemProps, opt = _e.opt;
    var __VLS_230 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_231 = __VLS_asFunctionalComponent1(__VLS_230, new __VLS_230(__assign({}, (itemProps))));
    var __VLS_232 = __VLS_231.apply(void 0, __spreadArray([__assign({}, (itemProps))], __VLS_functionalComponentArgsRest(__VLS_231), false));
    var __VLS_235 = __VLS_233.slots.default;
    var __VLS_236 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_237 = __VLS_asFunctionalComponent1(__VLS_236, new __VLS_236({
        avatar: true,
    }));
    var __VLS_238 = __VLS_237.apply(void 0, __spreadArray([{
            avatar: true,
        }], __VLS_functionalComponentArgsRest(__VLS_237), false));
    var __VLS_241 = __VLS_239.slots.default;
    if ((_a = opt.color_data) === null || _a === void 0 ? void 0 : _a.hex_code) {
        var __VLS_242 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_243 = __VLS_asFunctionalComponent1(__VLS_242, new __VLS_242(__assign({ size: "24px" }, { style: ({ backgroundColor: opt.color_data.hex_code }) })));
        var __VLS_244 = __VLS_243.apply(void 0, __spreadArray([__assign({ size: "24px" }, { style: ({ backgroundColor: opt.color_data.hex_code }) })], __VLS_functionalComponentArgsRest(__VLS_243), false));
    }
    else {
        var __VLS_247 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_248 = __VLS_asFunctionalComponent1(__VLS_247, new __VLS_247({
            name: "circle",
            size: "24px",
        }));
        var __VLS_249 = __VLS_248.apply(void 0, __spreadArray([{
                name: "circle",
                size: "24px",
            }], __VLS_functionalComponentArgsRest(__VLS_248), false));
    }
    // @ts-ignore
    [createForm, createForm, threadTypes,];
    var __VLS_239;
    var __VLS_252 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_253 = __VLS_asFunctionalComponent1(__VLS_252, new __VLS_252({}));
    var __VLS_254 = __VLS_253.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_253), false));
    var __VLS_257 = __VLS_255.slots.default;
    var __VLS_258 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_259 = __VLS_asFunctionalComponent1(__VLS_258, new __VLS_258({}));
    var __VLS_260 = __VLS_259.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_259), false));
    var __VLS_263 = __VLS_261.slots.default;
    (opt.code);
    (opt.name);
    // @ts-ignore
    [];
    var __VLS_261;
    var __VLS_264 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_265 = __VLS_asFunctionalComponent1(__VLS_264, new __VLS_264({
        caption: true,
    }));
    var __VLS_266 = __VLS_265.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_265), false));
    var __VLS_269 = __VLS_267.slots.default;
    (opt.material);
    // @ts-ignore
    [];
    var __VLS_267;
    // @ts-ignore
    [];
    var __VLS_255;
    // @ts-ignore
    [];
    var __VLS_233;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_226;
var __VLS_270;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_271 = __VLS_asFunctionalComponent1(__VLS_270, new __VLS_270({
    modelValue: (__VLS_ctx.createForm.requested_meters),
    modelModifiers: { number: true, },
    label: "Số mét yêu cầu *",
    type: "number",
    outlined: true,
    dense: true,
    suffix: "m",
}));
var __VLS_272 = __VLS_271.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createForm.requested_meters),
        modelModifiers: { number: true, },
        label: "Số mét yêu cầu *",
        type: "number",
        outlined: true,
        dense: true,
        suffix: "m",
    }], __VLS_functionalComponentArgsRest(__VLS_271), false));
var __VLS_275;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_276 = __VLS_asFunctionalComponent1(__VLS_275, new __VLS_275({
    modelValue: (__VLS_ctx.createForm.priority),
    options: (__VLS_ctx.priorityOptions),
    label: "Mức ưu tiên",
    outlined: true,
    dense: true,
    emitValue: true,
    mapOptions: true,
}));
var __VLS_277 = __VLS_276.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createForm.priority),
        options: (__VLS_ctx.priorityOptions),
        label: "Mức ưu tiên",
        outlined: true,
        dense: true,
        emitValue: true,
        mapOptions: true,
    }], __VLS_functionalComponentArgsRest(__VLS_276), false));
var __VLS_280;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_281 = __VLS_asFunctionalComponent1(__VLS_280, new __VLS_280({
    modelValue: (__VLS_ctx.createForm.requesting_warehouse_id),
    options: (__VLS_ctx.storageWarehouses),
    optionValue: "id",
    optionLabel: "name",
    label: "Xưởng yêu cầu",
    outlined: true,
    dense: true,
    emitValue: true,
    mapOptions: true,
    clearable: true,
}));
var __VLS_282 = __VLS_281.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createForm.requesting_warehouse_id),
        options: (__VLS_ctx.storageWarehouses),
        optionValue: "id",
        optionLabel: "name",
        label: "Xưởng yêu cầu",
        outlined: true,
        dense: true,
        emitValue: true,
        mapOptions: true,
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_281), false));
var __VLS_285;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_286 = __VLS_asFunctionalComponent1(__VLS_285, new __VLS_285({
    modelValue: (__VLS_ctx.createForm.source_warehouse_id),
    options: (__VLS_ctx.storageWarehouses),
    optionValue: "id",
    optionLabel: "name",
    label: "Kho nguồn (tùy chọn)",
    outlined: true,
    dense: true,
    emitValue: true,
    mapOptions: true,
    clearable: true,
}));
var __VLS_287 = __VLS_286.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createForm.source_warehouse_id),
        options: (__VLS_ctx.storageWarehouses),
        optionValue: "id",
        optionLabel: "name",
        label: "Kho nguồn (tùy chọn)",
        outlined: true,
        dense: true,
        emitValue: true,
        mapOptions: true,
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_286), false));
var __VLS_290;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_291 = __VLS_asFunctionalComponent1(__VLS_290, new __VLS_290({
    modelValue: (__VLS_ctx.createForm.requested_by),
    label: "Người yêu cầu",
    outlined: true,
    dense: true,
}));
var __VLS_292 = __VLS_291.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.createForm.requested_by),
        label: "Người yêu cầu",
        outlined: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_291), false));
// @ts-ignore
[createForm, createForm, createForm, createForm, createForm, priorityOptions, storageWarehouses, storageWarehouses,];
var __VLS_215;
var __VLS_295;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_296 = __VLS_asFunctionalComponent1(__VLS_295, new __VLS_295({}));
var __VLS_297 = __VLS_296.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_296), false));
var __VLS_300;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_301 = __VLS_asFunctionalComponent1(__VLS_300, new __VLS_300({
    align: "right",
}));
var __VLS_302 = __VLS_301.apply(void 0, __spreadArray([{
        align: "right",
    }], __VLS_functionalComponentArgsRest(__VLS_301), false));
var __VLS_305 = __VLS_303.slots.default;
var __VLS_306;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_307 = __VLS_asFunctionalComponent1(__VLS_306, new __VLS_306({
    label: "Hủy",
    flat: true,
}));
var __VLS_308 = __VLS_307.apply(void 0, __spreadArray([{
        label: "Hủy",
        flat: true,
    }], __VLS_functionalComponentArgsRest(__VLS_307), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_311;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_312 = __VLS_asFunctionalComponent1(__VLS_311, new __VLS_311(__assign({ 'onClick': {} }, { label: "Tạo yêu cầu", color: "primary", loading: (__VLS_ctx.isLoading) })));
var __VLS_313 = __VLS_312.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Tạo yêu cầu", color: "primary", loading: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_312), false));
var __VLS_316;
var __VLS_317 = ({ click: {} },
    { onClick: (__VLS_ctx.handleCreate) });
var __VLS_314;
var __VLS_315;
// @ts-ignore
[isLoading, vClosePopup, handleCreate,];
var __VLS_303;
// @ts-ignore
[];
var __VLS_188;
// @ts-ignore
[];
var __VLS_182;
var __VLS_318;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_319 = __VLS_asFunctionalComponent1(__VLS_318, new __VLS_318({
    modelValue: (__VLS_ctx.showRejectDialog),
    persistent: true,
}));
var __VLS_320 = __VLS_319.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showRejectDialog),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_319), false));
var __VLS_323 = __VLS_321.slots.default;
var __VLS_324;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_325 = __VLS_asFunctionalComponent1(__VLS_324, new __VLS_324(__assign({ style: {} })));
var __VLS_326 = __VLS_325.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_325), false));
var __VLS_329 = __VLS_327.slots.default;
var __VLS_330;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_331 = __VLS_asFunctionalComponent1(__VLS_330, new __VLS_330({}));
var __VLS_332 = __VLS_331.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_331), false));
var __VLS_335 = __VLS_333.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
// @ts-ignore
[showRejectDialog,];
var __VLS_333;
var __VLS_336;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_337 = __VLS_asFunctionalComponent1(__VLS_336, new __VLS_336({}));
var __VLS_338 = __VLS_337.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_337), false));
var __VLS_341 = __VLS_339.slots.default;
var __VLS_342;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_343 = __VLS_asFunctionalComponent1(__VLS_342, new __VLS_342({
    modelValue: (__VLS_ctx.rejectReason),
    label: "Lý do từ chối *",
    type: "textarea",
    outlined: true,
    autogrow: true,
    rules: ([function (v) { return !!v || 'Vui lòng nhập lý do'; }]),
}));
var __VLS_344 = __VLS_343.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.rejectReason),
        label: "Lý do từ chối *",
        type: "textarea",
        outlined: true,
        autogrow: true,
        rules: ([function (v) { return !!v || 'Vui lòng nhập lý do'; }]),
    }], __VLS_functionalComponentArgsRest(__VLS_343), false));
// @ts-ignore
[rejectReason,];
var __VLS_339;
var __VLS_347;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_348 = __VLS_asFunctionalComponent1(__VLS_347, new __VLS_347({
    align: "right",
}));
var __VLS_349 = __VLS_348.apply(void 0, __spreadArray([{
        align: "right",
    }], __VLS_functionalComponentArgsRest(__VLS_348), false));
var __VLS_352 = __VLS_350.slots.default;
var __VLS_353;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_354 = __VLS_asFunctionalComponent1(__VLS_353, new __VLS_353({
    label: "Hủy",
    flat: true,
}));
var __VLS_355 = __VLS_354.apply(void 0, __spreadArray([{
        label: "Hủy",
        flat: true,
    }], __VLS_functionalComponentArgsRest(__VLS_354), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_358;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_359 = __VLS_asFunctionalComponent1(__VLS_358, new __VLS_358(__assign({ 'onClick': {} }, { label: "Từ chối", color: "negative", loading: (__VLS_ctx.isLoading) })));
var __VLS_360 = __VLS_359.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Từ chối", color: "negative", loading: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_359), false));
var __VLS_363;
var __VLS_364 = ({ click: {} },
    { onClick: (__VLS_ctx.handleReject) });
var __VLS_361;
var __VLS_362;
// @ts-ignore
[isLoading, vClosePopup, handleReject,];
var __VLS_350;
// @ts-ignore
[];
var __VLS_327;
// @ts-ignore
[];
var __VLS_321;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
