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
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var vue_router_1 = require("vue-router");
var lotService_1 = require("@/services/lotService");
var LotStatusBadge_vue_1 = require("@/components/thread/LotStatusBadge.vue");
var route = (0, vue_router_1.useRoute)();
// State
var lot = (0, vue_1.ref)(null);
var cones = (0, vue_1.ref)([]);
var transactions = (0, vue_1.ref)([]);
var loading = (0, vue_1.ref)(false);
var loadingCones = (0, vue_1.ref)(false);
var loadingTransactions = (0, vue_1.ref)(false);
var activeTab = (0, vue_1.ref)('cones');
// Computed
var lotId = (0, vue_1.computed)(function () { return Number(route.params.id); });
var isExpired = (0, vue_1.computed)(function () {
    var _a;
    if (!((_a = lot.value) === null || _a === void 0 ? void 0 : _a.expiry_date))
        return false;
    return new Date(lot.value.expiry_date) < new Date();
});
// Table columns
var coneColumns = [
    { name: 'cone_id', label: 'Mã Cuộn', field: 'cone_id', align: 'left' },
    { name: 'status', label: 'Trạng Thái', field: 'status', align: 'center' },
    { name: 'quantity_meters', label: 'Số Mét', field: 'quantity_meters', align: 'right' },
    { name: 'weight_grams', label: 'Khối Lượng (g)', field: 'weight_grams', align: 'right' },
    { name: 'location', label: 'Vị Trí', field: 'location', align: 'left' }
];
var transactionColumns = [
    { name: 'operation_type', label: 'Loại', field: 'operation_type', align: 'center' },
    { name: 'cone_count', label: 'Số Cuộn', field: 'cone_count', align: 'center' },
    { name: 'recipient', label: 'Người Nhận', field: 'recipient', align: 'left' },
    { name: 'reference_number', label: 'Số Tham Chiếu', field: 'reference_number', align: 'left' },
    { name: 'performed_at', label: 'Thời Gian', field: 'performed_at', align: 'left' }
];
// Helpers
function formatDate(date) {
    if (!date)
        return '-';
    return new Date(date).toLocaleDateString('vi-VN');
}
function formatDateTime(date) {
    return new Date(date).toLocaleString('vi-VN');
}
function getConeStatusColor(status) {
    var colors = {
        AVAILABLE: 'positive',
        RECEIVED: 'info',
        INSPECTED: 'secondary',
        SOFT_ALLOCATED: 'warning',
        HARD_ALLOCATED: 'orange',
        IN_PRODUCTION: 'purple',
        CONSUMED: 'grey',
        QUARANTINE: 'negative'
    };
    return colors[status] || 'grey';
}
function getConeStatusLabel(status) {
    var labels = {
        AVAILABLE: 'Sẵn sàng',
        RECEIVED: 'Đã nhận',
        INSPECTED: 'Đã kiểm',
        SOFT_ALLOCATED: 'Đã phân bổ',
        HARD_ALLOCATED: 'Đã xuất',
        IN_PRODUCTION: 'Đang dùng',
        CONSUMED: 'Đã dùng hết',
        QUARANTINE: 'Cách ly'
    };
    return labels[status] || status;
}
function getOperationColor(type) {
    var colors = {
        RECEIVE: 'positive',
        TRANSFER: 'info',
        ISSUE: 'warning',
        RETURN: 'secondary'
    };
    return colors[type];
}
function getOperationLabel(type) {
    var labels = {
        RECEIVE: 'Nhập kho',
        TRANSFER: 'Chuyển kho',
        ISSUE: 'Xuất kho',
        RETURN: 'Trả lại'
    };
    return labels[type];
}
// Load data
function loadLot() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    loading.value = true;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    _a = lot;
                    return [4 /*yield*/, lotService_1.lotService.getById(lotId.value)];
                case 2:
                    _a.value = _c.sent();
                    return [3 /*break*/, 5];
                case 3:
                    _b = _c.sent();
                    lot.value = null;
                    return [3 /*break*/, 5];
                case 4:
                    loading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function loadCones() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    loadingCones.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 3, 4]);
                    _a = cones;
                    return [4 /*yield*/, lotService_1.lotService.getCones(lotId.value)];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    loadingCones.value = false;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function loadTransactions() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    loadingTransactions.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 3, 4]);
                    _a = transactions;
                    return [4 /*yield*/, lotService_1.lotService.getTransactions(lotId.value)];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    loadingTransactions.value = false;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.watch)(activeTab, function (tab) {
    if (tab === 'cones' && cones.value.length === 0) {
        loadCones();
    }
    else if (tab === 'history' && transactions.value.length === 0) {
        loadTransactions();
    }
});
(0, vue_1.onMounted)(function () {
    loadLot();
    loadCones();
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
(((_a = __VLS_ctx.lot) === null || _a === void 0 ? void 0 : _a.lot_number) || 'Chi tiết lô');
if (__VLS_ctx.lot) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    ((_b = __VLS_ctx.lot.thread_type) === null || _b === void 0 ? void 0 : _b.name);
    ((_c = __VLS_ctx.lot.warehouse) === null || _c === void 0 ? void 0 : _c.name);
}
var __VLS_14;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({}));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_15), false));
if (__VLS_ctx.lot) {
    var __VLS_19 = LotStatusBadge_vue_1.default;
    // @ts-ignore
    var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
        status: (__VLS_ctx.lot.status),
        size: "lg",
    }));
    var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([{
            status: (__VLS_ctx.lot.status),
            size: "lg",
        }], __VLS_functionalComponentArgsRest(__VLS_20), false));
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
else if (__VLS_ctx.lot) {
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
    (__VLS_ctx.lot.lot_number);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1 row items-center no-wrap q-gutter-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    if ((_e = (_d = __VLS_ctx.lot.thread_type) === null || _d === void 0 ? void 0 : _d.color_data) === null || _e === void 0 ? void 0 : _e.hex_code) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-swatch" }, { style: ({ backgroundColor: __VLS_ctx.lot.thread_type.color_data.hex_code }) }));
        /** @type {__VLS_StyleScopedClasses['color-swatch']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (((_f = __VLS_ctx.lot.thread_type) === null || _f === void 0 ? void 0 : _f.name) || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    (((_g = __VLS_ctx.lot.warehouse) === null || _g === void 0 ? void 0 : _g.name) || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    (((_h = __VLS_ctx.lot.supplier_data) === null || _h === void 0 ? void 0 : _h.name) || '-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.lot.production_date));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body1" }, { class: (__VLS_ctx.isExpired ? 'text-negative' : '') }));
    /** @type {__VLS_StyleScopedClasses['text-body1']} */ ;
    (__VLS_ctx.formatDate(__VLS_ctx.lot.expiry_date));
    // @ts-ignore
    [lot, lot, lot, lot, lot, lot, lot, lot, lot, lot, lot, lot, lot, lot, lot, loading, formatDate, formatDate, isExpired,];
    var __VLS_38;
    // @ts-ignore
    [];
    var __VLS_32;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
    var __VLS_41 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
        flat: true,
        bordered: true,
    }));
    var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_42), false));
    var __VLS_46 = __VLS_44.slots.default;
    var __VLS_47 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({}));
    var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_48), false));
    var __VLS_52 = __VLS_50.slots.default;
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
    (__VLS_ctx.lot.available_cones);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4" }));
    /** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
    (__VLS_ctx.lot.total_cones);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    var __VLS_53 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress} */
    qLinearProgress;
    // @ts-ignore
    var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53(__assign(__assign({ value: (__VLS_ctx.lot.total_cones > 0 ? __VLS_ctx.lot.available_cones / __VLS_ctx.lot.total_cones : 0), color: "primary" }, { class: "q-mt-md" }), { size: "8px", rounded: true })));
    var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([__assign(__assign({ value: (__VLS_ctx.lot.total_cones > 0 ? __VLS_ctx.lot.available_cones / __VLS_ctx.lot.total_cones : 0), color: "primary" }, { class: "q-mt-md" }), { size: "8px", rounded: true })], __VLS_functionalComponentArgsRest(__VLS_54), false));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    // @ts-ignore
    [lot, lot, lot, lot, lot,];
    var __VLS_50;
    // @ts-ignore
    [];
    var __VLS_44;
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
    /** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
    qTabs;
    // @ts-ignore
    var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64(__assign(__assign({ modelValue: (__VLS_ctx.activeTab) }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left" })));
    var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.activeTab) }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left" })], __VLS_functionalComponentArgsRest(__VLS_65), false));
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    var __VLS_69 = __VLS_67.slots.default;
    var __VLS_70 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
        name: "cones",
        label: "Danh sách cuộn",
        icon: "inventory_2",
    }));
    var __VLS_72 = __VLS_71.apply(void 0, __spreadArray([{
            name: "cones",
            label: "Danh sách cuộn",
            icon: "inventory_2",
        }], __VLS_functionalComponentArgsRest(__VLS_71), false));
    var __VLS_75 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
    qTab;
    // @ts-ignore
    var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
        name: "history",
        label: "Lịch sử thao tác",
        icon: "history",
    }));
    var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([{
            name: "history",
            label: "Lịch sử thao tác",
            icon: "history",
        }], __VLS_functionalComponentArgsRest(__VLS_76), false));
    // @ts-ignore
    [activeTab,];
    var __VLS_67;
    var __VLS_80 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({}));
    var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_81), false));
    var __VLS_85 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
    qTabPanels;
    // @ts-ignore
    var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({
        modelValue: (__VLS_ctx.activeTab),
        animated: true,
    }));
    var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.activeTab),
            animated: true,
        }], __VLS_functionalComponentArgsRest(__VLS_86), false));
    var __VLS_90 = __VLS_88.slots.default;
    var __VLS_91 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
    qTabPanel;
    // @ts-ignore
    var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91({
        name: "cones",
    }));
    var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([{
            name: "cones",
        }], __VLS_functionalComponentArgsRest(__VLS_92), false));
    var __VLS_96 = __VLS_94.slots.default;
    var __VLS_97 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97({
        flat: true,
        rows: (__VLS_ctx.cones),
        columns: (__VLS_ctx.coneColumns),
        loading: (__VLS_ctx.loadingCones),
        rowKey: "id",
        pagination: ({ rowsPerPage: 20 }),
    }));
    var __VLS_99 = __VLS_98.apply(void 0, __spreadArray([{
            flat: true,
            rows: (__VLS_ctx.cones),
            columns: (__VLS_ctx.coneColumns),
            loading: (__VLS_ctx.loadingCones),
            rowKey: "id",
            pagination: ({ rowsPerPage: 20 }),
        }], __VLS_functionalComponentArgsRest(__VLS_98), false));
    var __VLS_102 = __VLS_100.slots.default;
    {
        var __VLS_103 = __VLS_100.slots["body-cell-status"];
        var props = __VLS_vSlot(__VLS_103)[0];
        var __VLS_104 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
            props: (props),
        }));
        var __VLS_106 = __VLS_105.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_105), false));
        var __VLS_109 = __VLS_107.slots.default;
        var __VLS_110 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
            color: (__VLS_ctx.getConeStatusColor(props.row.status)),
            label: (__VLS_ctx.getConeStatusLabel(props.row.status)),
        }));
        var __VLS_112 = __VLS_111.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.getConeStatusColor(props.row.status)),
                label: (__VLS_ctx.getConeStatusLabel(props.row.status)),
            }], __VLS_functionalComponentArgsRest(__VLS_111), false));
        // @ts-ignore
        [activeTab, cones, coneColumns, loadingCones, getConeStatusColor, getConeStatusLabel,];
        var __VLS_107;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_100;
    // @ts-ignore
    [];
    var __VLS_94;
    var __VLS_115 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
    qTabPanel;
    // @ts-ignore
    var __VLS_116 = __VLS_asFunctionalComponent1(__VLS_115, new __VLS_115({
        name: "history",
    }));
    var __VLS_117 = __VLS_116.apply(void 0, __spreadArray([{
            name: "history",
        }], __VLS_functionalComponentArgsRest(__VLS_116), false));
    var __VLS_120 = __VLS_118.slots.default;
    var __VLS_121 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_122 = __VLS_asFunctionalComponent1(__VLS_121, new __VLS_121({
        flat: true,
        rows: (__VLS_ctx.transactions),
        columns: (__VLS_ctx.transactionColumns),
        loading: (__VLS_ctx.loadingTransactions),
        rowKey: "id",
        pagination: ({ rowsPerPage: 20 }),
    }));
    var __VLS_123 = __VLS_122.apply(void 0, __spreadArray([{
            flat: true,
            rows: (__VLS_ctx.transactions),
            columns: (__VLS_ctx.transactionColumns),
            loading: (__VLS_ctx.loadingTransactions),
            rowKey: "id",
            pagination: ({ rowsPerPage: 20 }),
        }], __VLS_functionalComponentArgsRest(__VLS_122), false));
    var __VLS_126 = __VLS_124.slots.default;
    {
        var __VLS_127 = __VLS_124.slots["body-cell-operation_type"];
        var props = __VLS_vSlot(__VLS_127)[0];
        var __VLS_128 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({
            props: (props),
        }));
        var __VLS_130 = __VLS_129.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_129), false));
        var __VLS_133 = __VLS_131.slots.default;
        var __VLS_134 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_135 = __VLS_asFunctionalComponent1(__VLS_134, new __VLS_134({
            color: (__VLS_ctx.getOperationColor(props.row.operation_type)),
            label: (__VLS_ctx.getOperationLabel(props.row.operation_type)),
        }));
        var __VLS_136 = __VLS_135.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.getOperationColor(props.row.operation_type)),
                label: (__VLS_ctx.getOperationLabel(props.row.operation_type)),
            }], __VLS_functionalComponentArgsRest(__VLS_135), false));
        // @ts-ignore
        [transactions, transactionColumns, loadingTransactions, getOperationColor, getOperationLabel,];
        var __VLS_131;
        // @ts-ignore
        [];
    }
    {
        var __VLS_139 = __VLS_124.slots["body-cell-performed_at"];
        var props = __VLS_vSlot(__VLS_139)[0];
        var __VLS_140 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_141 = __VLS_asFunctionalComponent1(__VLS_140, new __VLS_140({
            props: (props),
        }));
        var __VLS_142 = __VLS_141.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_141), false));
        var __VLS_145 = __VLS_143.slots.default;
        (__VLS_ctx.formatDateTime(props.row.performed_at));
        // @ts-ignore
        [formatDateTime,];
        var __VLS_143;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_124;
    // @ts-ignore
    [];
    var __VLS_118;
    // @ts-ignore
    [];
    var __VLS_88;
    // @ts-ignore
    [];
    var __VLS_61;
}
else {
    var __VLS_146 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_147 = __VLS_asFunctionalComponent1(__VLS_146, new __VLS_146(__assign({ class: "bg-negative text-white" })));
    var __VLS_148 = __VLS_147.apply(void 0, __spreadArray([__assign({ class: "bg-negative text-white" })], __VLS_functionalComponentArgsRest(__VLS_147), false));
    /** @type {__VLS_StyleScopedClasses['bg-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_151 = __VLS_149.slots.default;
    // @ts-ignore
    [];
    var __VLS_149;
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
