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
var vue_router_1 = require("vue-router");
var useSnackbar_1 = require("@/composables/useSnackbar");
var useConfirm_1 = require("@/composables/useConfirm");
var purchaseOrderService_1 = require("@/services/purchaseOrderService");
var AddPOItemDialog_vue_1 = require("@/components/thread/AddPOItemDialog.vue");
var POItemHistoryDialog_vue_1 = require("@/components/thread/POItemHistoryDialog.vue");
var enums_1 = require("@/types/thread/enums");
definePage({
    meta: {
        requiresAuth: true,
        permissions: ['thread.purchase-orders.view'],
    },
});
var route = (0, vue_router_1.useRoute)('/thread/purchase-orders/[id]');
var snackbar = (0, useSnackbar_1.useSnackbar)();
var confirm = (0, useConfirm_1.useConfirm)().confirm;
var poId = (0, vue_1.computed)(function () { return Number(route.params.id); });
var purchaseOrder = (0, vue_1.ref)(null);
var items = (0, vue_1.ref)([]);
var loading = (0, vue_1.ref)(false);
var loadingItems = (0, vue_1.ref)(false);
var showAddItemDialog = (0, vue_1.ref)(false);
var showHistoryDialog = (0, vue_1.ref)(false);
var selectedItem = (0, vue_1.ref)(null);
var editingQuantity = (0, vue_1.ref)(0);
var totalQuantity = (0, vue_1.computed)(function () { return items.value.reduce(function (sum, item) { return sum + item.quantity; }, 0); });
var existingStyleIds = (0, vue_1.computed)(function () { return items.value.map(function (item) { return item.style_id; }); });
var itemColumns = [
    { name: 'style_code', label: 'Mã hàng', field: 'style_code', align: 'left' },
    { name: 'style_name', label: 'Tên mã hàng', field: 'style_name', align: 'left' },
    { name: 'finished_product_code', label: 'Mã TP KT', field: 'finished_product_code', align: 'left' },
    { name: 'quantity', label: 'SL SP', field: 'quantity', align: 'center' },
    { name: 'ordered_quantity', label: 'Đã đặt', field: 'ordered_quantity', align: 'center' },
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
        NORMAL: 'Bình thường',
        HIGH: 'Cao',
        URGENT: 'Khẩn cấp'
    };
    return labels[priority] || priority;
}
function formatDate(date) {
    if (!date)
        return '-';
    return new Date(date).toLocaleDateString('vi-VN');
}
function loadPO() {
    return __awaiter(this, void 0, void 0, function () {
        var data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    loading.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, purchaseOrderService_1.purchaseOrderService.getWithItems(poId.value)];
                case 2:
                    data = _b.sent();
                    purchaseOrder.value = data;
                    items.value = data.items || [];
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    purchaseOrder.value = null;
                    return [3 /*break*/, 5];
                case 4:
                    loading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function updateItemQuantity(itemId, newQuantity) {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!newQuantity || newQuantity <= 0) {
                        snackbar.error('Số lượng phải lớn hơn 0');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, purchaseOrderService_1.purchaseOrderService.updateItem(poId.value, itemId, { quantity: newQuantity })];
                case 2:
                    _a.sent();
                    snackbar.success('Cập nhật số lượng thành công');
                    loadPO();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    snackbar.error(err_1.message || 'Không thể cập nhật số lượng');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function confirmDeleteItem(item) {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed, err_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, confirm({
                        title: "X\u00F3a m\u00E3 h\u00E0ng ".concat((_a = item.style) === null || _a === void 0 ? void 0 : _a.style_code, "?"),
                        message: 'Mã hàng sẽ bị xóa khỏi đơn hàng này.',
                        ok: 'Xóa',
                        type: 'warning'
                    })];
                case 1:
                    confirmed = _b.sent();
                    if (!confirmed) return [3 /*break*/, 5];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, purchaseOrderService_1.purchaseOrderService.deleteItem(poId.value, item.id)];
                case 3:
                    _b.sent();
                    snackbar.success('Xóa mã hàng thành công');
                    loadPO();
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _b.sent();
                    snackbar.error(err_2.message || 'Không thể xóa mã hàng');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function showHistory(item) {
    selectedItem.value = item;
    showHistoryDialog.value = true;
}
function onItemAdded() {
    showAddItemDialog.value = false;
    loadPO();
}
(0, vue_1.onMounted)(function () {
    loadPO();
});
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ 'onClick': {} }, { flat: true, round: true, icon: "arrow_back", color: "primary" })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, icon: "arrow_back", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
var __VLS_13 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$router.back();
            // @ts-ignore
            [$router,];
        } });
var __VLS_10;
var __VLS_11;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-ml-md" }));
/** @type {__VLS_StyleScopedClasses['q-ml-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h5 q-my-none text-weight-bold" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
(((_a = __VLS_ctx.purchaseOrder) === null || _a === void 0 ? void 0 : _a.po_number) || 'Chi tiết PO');
if (__VLS_ctx.purchaseOrder) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    (__VLS_ctx.purchaseOrder.customer_name || 'Chưa có khách hàng');
}
var __VLS_14;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_15), false));
if (__VLS_ctx.purchaseOrder) {
    var __VLS_19 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ color: (__VLS_ctx.getStatusColor(__VLS_ctx.purchaseOrder.status)), label: (__VLS_ctx.getStatusLabel(__VLS_ctx.purchaseOrder.status)) }, { class: "text-body2 q-pa-sm" })));
    var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.getStatusColor(__VLS_ctx.purchaseOrder.status)), label: (__VLS_ctx.getStatusLabel(__VLS_ctx.purchaseOrder.status)) }, { class: "text-body2 q-pa-sm" })], __VLS_functionalComponentArgsRest(__VLS_20), false));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-center q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
    qSpinner;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        size: "lg",
        color: "primary",
    }));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{
            size: "lg",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_25), false));
}
else if (__VLS_ctx.purchaseOrder) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-lg" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
    var __VLS_29 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
        flat: true,
        bordered: true,
    }));
    var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_30), false));
    var __VLS_34 = __VLS_32.slots.default;
    var __VLS_35 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({}));
    var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_36), false));
    var __VLS_40 = __VLS_38.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    (__VLS_ctx.purchaseOrder.po_number);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    (__VLS_ctx.purchaseOrder.customer_name || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    (__VLS_ctx.purchaseOrder.week || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.purchaseOrder.order_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.purchaseOrder.delivery_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    var __VLS_41 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
        color: (__VLS_ctx.getPriorityColor(__VLS_ctx.purchaseOrder.priority)),
        label: (__VLS_ctx.getPriorityLabel(__VLS_ctx.purchaseOrder.priority)),
        outline: true,
    }));
    var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getPriorityColor(__VLS_ctx.purchaseOrder.priority)),
            label: (__VLS_ctx.getPriorityLabel(__VLS_ctx.purchaseOrder.priority)),
            outline: true,
        }], __VLS_functionalComponentArgsRest(__VLS_42), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    (__VLS_ctx.purchaseOrder.notes || '-');
    // @ts-ignore
    [purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, purchaseOrder, getStatusColor, getStatusLabel, loading, formatDate, formatDate, getPriorityColor, getPriorityLabel,];
    var __VLS_38;
    // @ts-ignore
    [];
    var __VLS_32;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
    var __VLS_46 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
        flat: true,
        bordered: true,
    }));
    var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_47), false));
    var __VLS_51 = __VLS_49.slots.default;
    var __VLS_52 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({}));
    var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_53), false));
    var __VLS_57 = __VLS_55.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (__VLS_ctx.items.length);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4" }));
    /** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
    (__VLS_ctx.totalQuantity);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    // @ts-ignore
    [items, totalQuantity,];
    var __VLS_55;
    // @ts-ignore
    [];
    var __VLS_49;
    var __VLS_58 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
        flat: true,
        bordered: true,
    }));
    var __VLS_60 = __VLS_59.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_59), false));
    var __VLS_63 = __VLS_61.slots.default;
    var __VLS_64 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64(__assign({ class: "row items-center" })));
    var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([__assign({ class: "row items-center" })], __VLS_functionalComponentArgsRest(__VLS_65), false));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    var __VLS_69 = __VLS_67.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    var __VLS_70 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
    qSpace;
    // @ts-ignore
    var __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({}));
    var __VLS_72 = __VLS_71.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_71), false));
    var __VLS_75 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm", unelevated: true })));
    var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm", unelevated: true })], __VLS_functionalComponentArgsRest(__VLS_76), false));
    var __VLS_80 = void 0;
    var __VLS_81 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!!(__VLS_ctx.loading))
                    return;
                if (!(__VLS_ctx.purchaseOrder))
                    return;
                __VLS_ctx.showAddItemDialog = true;
                // @ts-ignore
                [showAddItemDialog,];
            } });
    var __VLS_78;
    var __VLS_79;
    // @ts-ignore
    [];
    var __VLS_67;
    var __VLS_82 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({
        flat: true,
        rows: (__VLS_ctx.items),
        columns: (__VLS_ctx.itemColumns),
        loading: (__VLS_ctx.loadingItems),
        rowKey: "id",
        pagination: ({ rowsPerPage: 0 }),
        hidePagination: true,
    }));
    var __VLS_84 = __VLS_83.apply(void 0, __spreadArray([{
            flat: true,
            rows: (__VLS_ctx.items),
            columns: (__VLS_ctx.itemColumns),
            loading: (__VLS_ctx.loadingItems),
            rowKey: "id",
            pagination: ({ rowsPerPage: 0 }),
            hidePagination: true,
        }], __VLS_functionalComponentArgsRest(__VLS_83), false));
    var __VLS_87 = __VLS_85.slots.default;
    {
        var __VLS_88 = __VLS_85.slots["body-cell-style_code"];
        var props = __VLS_vSlot(__VLS_88)[0];
        var __VLS_89 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
            props: (props),
        }));
        var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_90), false));
        var __VLS_94 = __VLS_92.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        ((_b = props.row.style) === null || _b === void 0 ? void 0 : _b.style_code);
        // @ts-ignore
        [items, itemColumns, loadingItems,];
        var __VLS_92;
        // @ts-ignore
        [];
    }
    {
        var __VLS_95 = __VLS_85.slots["body-cell-style_name"];
        var props = __VLS_vSlot(__VLS_95)[0];
        var __VLS_96 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
            props: (props),
        }));
        var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_97), false));
        var __VLS_101 = __VLS_99.slots.default;
        (((_c = props.row.style) === null || _c === void 0 ? void 0 : _c.style_name) || '-');
        // @ts-ignore
        [];
        var __VLS_99;
        // @ts-ignore
        [];
    }
    {
        var __VLS_102 = __VLS_85.slots["body-cell-finished_product_code"];
        var props = __VLS_vSlot(__VLS_102)[0];
        var __VLS_103 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_104 = __VLS_asFunctionalComponent1(__VLS_103, new __VLS_103({
            props: (props),
        }));
        var __VLS_105 = __VLS_104.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_104), false));
        var __VLS_108 = __VLS_106.slots.default;
        (props.row.finished_product_code || '-');
        // @ts-ignore
        [];
        var __VLS_106;
        // @ts-ignore
        [];
    }
    {
        var __VLS_109 = __VLS_85.slots["body-cell-quantity"];
        var props_1 = __VLS_vSlot(__VLS_109)[0];
        var __VLS_110 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
            props: (props_1),
        }));
        var __VLS_112 = __VLS_111.apply(void 0, __spreadArray([{
                props: (props_1),
            }], __VLS_functionalComponentArgsRest(__VLS_111), false));
        var __VLS_115 = __VLS_113.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (props_1.row.quantity);
        var __VLS_116 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
        qPopupEdit;
        // @ts-ignore
        var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116(__assign(__assign({ 'onBeforeShow': {} }, { 'onSave': {} }), { modelValue: (__VLS_ctx.editingQuantity), autoSave: true })));
        var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([__assign(__assign({ 'onBeforeShow': {} }, { 'onSave': {} }), { modelValue: (__VLS_ctx.editingQuantity), autoSave: true })], __VLS_functionalComponentArgsRest(__VLS_117), false));
        var __VLS_121 = void 0;
        var __VLS_122 = ({ beforeShow: {} },
            { onBeforeShow: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.purchaseOrder))
                        return;
                    __VLS_ctx.editingQuantity = props_1.row.quantity;
                    // @ts-ignore
                    [editingQuantity, editingQuantity,];
                } });
        var __VLS_123 = ({ save: {} },
            { onSave: (function (val) { return __VLS_ctx.updateItemQuantity(props_1.row.id, val); }) });
        {
            var __VLS_124 = __VLS_119.slots.default;
            var scope = __VLS_vSlot(__VLS_124)[0];
            var __VLS_125 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
            qInput;
            // @ts-ignore
            var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125(__assign({ 'onKeyup': {} }, { modelValue: (scope.value), modelModifiers: { number: true, }, type: "number", dense: true, autofocus: true })));
            var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([__assign({ 'onKeyup': {} }, { modelValue: (scope.value), modelModifiers: { number: true, }, type: "number", dense: true, autofocus: true })], __VLS_functionalComponentArgsRest(__VLS_126), false));
            var __VLS_130 = void 0;
            var __VLS_131 = ({ keyup: {} },
                { onKeyup: (scope.set) });
            var __VLS_128;
            var __VLS_129;
            // @ts-ignore
            [updateItemQuantity,];
            __VLS_119.slots['' /* empty slot name completion */];
        }
        var __VLS_119;
        var __VLS_120;
        var __VLS_132 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132(__assign({ name: "edit", size: "xs" }, { class: "q-ml-xs text-grey-5 cursor-pointer" })));
        var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([__assign({ name: "edit", size: "xs" }, { class: "q-ml-xs text-grey-5 cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_133), false));
        /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
        // @ts-ignore
        [];
        var __VLS_113;
        // @ts-ignore
        [];
    }
    {
        var __VLS_137 = __VLS_85.slots["body-cell-ordered_quantity"];
        var props = __VLS_vSlot(__VLS_137)[0];
        var __VLS_138 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138({
            props: (props),
        }));
        var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_139), false));
        var __VLS_143 = __VLS_141.slots.default;
        (props.row.ordered_quantity || 0);
        // @ts-ignore
        [];
        var __VLS_141;
        // @ts-ignore
        [];
    }
    {
        var __VLS_144 = __VLS_85.slots["body-cell-actions"];
        var props_2 = __VLS_vSlot(__VLS_144)[0];
        var __VLS_145 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_146 = __VLS_asFunctionalComponent1(__VLS_145, new __VLS_145(__assign({ props: (props_2) }, { class: "q-gutter-xs" })));
        var __VLS_147 = __VLS_146.apply(void 0, __spreadArray([__assign({ props: (props_2) }, { class: "q-gutter-xs" })], __VLS_functionalComponentArgsRest(__VLS_146), false));
        /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
        var __VLS_150 = __VLS_148.slots.default;
        var __VLS_151 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_152 = __VLS_asFunctionalComponent1(__VLS_151, new __VLS_151(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "history", color: "info" })));
        var __VLS_153 = __VLS_152.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "history", color: "info" })], __VLS_functionalComponentArgsRest(__VLS_152), false));
        var __VLS_156 = void 0;
        var __VLS_157 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.purchaseOrder))
                        return;
                    __VLS_ctx.showHistory(props_2.row);
                    // @ts-ignore
                    [showHistory,];
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
        var __VLS_165 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "delete", color: "negative" })));
        var __VLS_167 = __VLS_166.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "delete", color: "negative" })], __VLS_functionalComponentArgsRest(__VLS_166), false));
        var __VLS_170 = void 0;
        var __VLS_171 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.purchaseOrder))
                        return;
                    __VLS_ctx.confirmDeleteItem(props_2.row);
                    // @ts-ignore
                    [confirmDeleteItem,];
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
        // @ts-ignore
        [];
        var __VLS_148;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_85;
    // @ts-ignore
    [];
    var __VLS_61;
}
else {
    var __VLS_179 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_180 = __VLS_asFunctionalComponent1(__VLS_179, new __VLS_179(__assign({ class: "bg-negative text-white" })));
    var __VLS_181 = __VLS_180.apply(void 0, __spreadArray([__assign({ class: "bg-negative text-white" })], __VLS_functionalComponentArgsRest(__VLS_180), false));
    /** @type {__VLS_StyleScopedClasses['bg-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_184 = __VLS_182.slots.default;
    // @ts-ignore
    [];
    var __VLS_182;
}
var __VLS_185 = AddPOItemDialog_vue_1.default;
// @ts-ignore
var __VLS_186 = __VLS_asFunctionalComponent1(__VLS_185, new __VLS_185(__assign({ 'onSaved': {} }, { modelValue: (__VLS_ctx.showAddItemDialog), poId: (__VLS_ctx.poId), existingStyleIds: (__VLS_ctx.existingStyleIds) })));
var __VLS_187 = __VLS_186.apply(void 0, __spreadArray([__assign({ 'onSaved': {} }, { modelValue: (__VLS_ctx.showAddItemDialog), poId: (__VLS_ctx.poId), existingStyleIds: (__VLS_ctx.existingStyleIds) })], __VLS_functionalComponentArgsRest(__VLS_186), false));
var __VLS_190;
var __VLS_191 = ({ saved: {} },
    { onSaved: (__VLS_ctx.onItemAdded) });
var __VLS_188;
var __VLS_189;
var __VLS_192 = POItemHistoryDialog_vue_1.default;
// @ts-ignore
var __VLS_193 = __VLS_asFunctionalComponent1(__VLS_192, new __VLS_192({
    modelValue: (__VLS_ctx.showHistoryDialog),
    poId: (__VLS_ctx.poId),
    item: (__VLS_ctx.selectedItem),
}));
var __VLS_194 = __VLS_193.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showHistoryDialog),
        poId: (__VLS_ctx.poId),
        item: (__VLS_ctx.selectedItem),
    }], __VLS_functionalComponentArgsRest(__VLS_193), false));
// @ts-ignore
[showAddItemDialog, poId, poId, existingStyleIds, onItemAdded, showHistoryDialog, selectedItem,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
