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
var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var composables_1 = require("@/composables");
var enums_1 = require("@/types/thread/enums");
// Composables
var snackbar = (0, composables_1.useSnackbar)();
var confirm = (0, composables_1.useConfirm)().confirm;
var _2 = (0, composables_1.useRecovery)(), recoveries = _2.recoveries, isLoading = _2.isLoading, fetchRecoveries = _2.fetchRecoveries, initiateReturn = _2.initiateReturn, weighCone = _2.weighCone, confirmRecovery = _2.confirmRecovery, writeOffCone = _2.writeOffCone;
// State
var filters = (0, vue_1.reactive)({
    status: undefined,
    cone_id: '',
});
var scanDialog = (0, vue_1.reactive)({
    isOpen: false,
    barcode: '',
    notes: '',
});
var weighDialog = (0, vue_1.reactive)({
    isOpen: false,
    recovery: null,
    weight: null,
    weighed_by: '',
});
var writeOffDialog = (0, vue_1.reactive)({
    isOpen: false,
    recovery: null,
    reason: '',
    approved_by: '',
});
var detailDialog = (0, vue_1.reactive)({
    isOpen: false,
    recovery: null,
});
// Options & Config
var statusOptions = [
    { label: 'Đã khởi tạo', value: enums_1.RecoveryStatus.INITIATED },
    { label: 'Chờ cân', value: enums_1.RecoveryStatus.PENDING_WEIGH },
    { label: 'Đã cân', value: enums_1.RecoveryStatus.WEIGHED },
    { label: 'Đã xác nhận', value: enums_1.RecoveryStatus.CONFIRMED },
    { label: 'Đã loại bỏ', value: enums_1.RecoveryStatus.WRITTEN_OFF },
    { label: 'Từ chối', value: enums_1.RecoveryStatus.REJECTED },
];
var statusConfig = (_a = {},
    _a[enums_1.RecoveryStatus.INITIATED] = { color: 'info', label: 'Đã khởi tạo', icon: 'qr_code_scanner' },
    _a[enums_1.RecoveryStatus.PENDING_WEIGH] = { color: 'warning', label: 'Chờ cân', icon: 'scale' },
    _a[enums_1.RecoveryStatus.WEIGHED] = { color: 'blue', label: 'Đã cân', icon: 'check' },
    _a[enums_1.RecoveryStatus.CONFIRMED] = { color: 'positive', label: 'Đã xác nhận', icon: 'check_circle' },
    _a[enums_1.RecoveryStatus.WRITTEN_OFF] = { color: 'negative', label: 'Đã loại bỏ', icon: 'delete' },
    _a[enums_1.RecoveryStatus.REJECTED] = { color: 'grey-7', label: 'Từ chối', icon: 'block' },
    _a);
var workflowSteps = [
    {
        overline: 'Bước 1',
        title: 'Quét Mã',
        description: 'Công nhân quét mã cuộn chỉ dư',
        icon: 'qr_code_scanner',
        color: 'info'
    },
    {
        overline: 'Bước 2',
        title: 'Cân Trọng Lượng',
        description: 'Kho cân và tính toán số mét còn',
        icon: 'scale',
        color: 'warning'
    },
    {
        overline: 'Bước 3',
        title: 'Xác Nhận Nhập',
        description: 'Xác nhận đưa về kho khả dụng',
        icon: 'check_circle',
        color: 'positive'
    },
];
// Table Columns
var columns = [
    { name: 'cone_id', label: 'Mã cuộn', field: function (row) { var _a; return ((_a = row.cone) === null || _a === void 0 ? void 0 : _a.cone_id) || 'N/A'; }, align: 'left', sortable: true },
    { name: 'thread_type', label: 'Loại chỉ', field: 'thread_type', align: 'left', sortable: true },
    { name: 'original_meters', label: 'Mét gốc', field: 'original_meters', align: 'right', sortable: true },
    { name: 'returned_weight', label: 'TL hoàn (g)', field: 'returned_weight_grams', align: 'right', sortable: true },
    { name: 'remaining_meters', label: 'Mét còn', field: 'calculated_meters', align: 'right', sortable: true },
    { name: 'consumed_meters', label: 'Đã dùng', field: 'consumption_meters', align: 'right', sortable: true },
    { name: 'status', label: 'Trạng thái', field: 'status', align: 'center', sortable: true },
    { name: 'actions', label: 'Thao Tác', field: 'actions', align: 'right' },
];
// Computed Calculations
var calculatedMeters = (0, vue_1.computed)(function () {
    var _a, _b, _c;
    if (weighDialog.weight && ((_c = (_b = (_a = weighDialog.recovery) === null || _a === void 0 ? void 0 : _a.cone) === null || _b === void 0 ? void 0 : _b.thread_type) === null || _c === void 0 ? void 0 : _c.density_grams_per_meter)) {
        var density = weighDialog.recovery.cone.thread_type.density_grams_per_meter;
        var tare = weighDialog.recovery.tare_weight_grams || 10; // default tare
        var netWeight = Math.max(0, weighDialog.weight - tare);
        return Math.round(netWeight / density);
    }
    return 0;
});
var calculatedConsumption = (0, vue_1.computed)(function () {
    var _a;
    if (calculatedMeters.value && ((_a = weighDialog.recovery) === null || _a === void 0 ? void 0 : _a.original_meters)) {
        return Math.max(0, weighDialog.recovery.original_meters - calculatedMeters.value);
    }
    return 0;
});
// Methods
var getStatusConfig = function (status) {
    return statusConfig[status] || { color: 'grey', label: status, icon: 'help' };
};
var formatNumber = function (val) {
    if (val === null || val === undefined)
        return '0';
    return new Intl.NumberFormat('vi-VN').format(val);
};
var formatDate = function (dateStr) {
    if (!dateStr)
        return '';
    return new Date(dateStr).toLocaleString('vi-VN');
};
var handleFilterChange = function () {
    fetchRecoveries(__assign({}, filters));
};
var openScanDialog = function () {
    scanDialog.barcode = '';
    scanDialog.notes = '';
    scanDialog.isOpen = true;
};
var handleScanSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!scanDialog.barcode) {
                    snackbar.warning('Vui lòng nhập hoặc quét mã barcode');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, initiateReturn({
                        cone_id: scanDialog.barcode,
                        notes: scanDialog.notes || undefined
                    })];
            case 1:
                result = _a.sent();
                if (result) {
                    scanDialog.isOpen = false;
                }
                return [2 /*return*/];
        }
    });
}); };
var openWeighDialog = function (recovery) {
    weighDialog.recovery = recovery;
    weighDialog.weight = recovery.returned_weight_grams || null;
    weighDialog.weighed_by = recovery.weighed_by || '';
    weighDialog.isOpen = true;
};
var handleWeighSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!weighDialog.recovery || !weighDialog.weight)
                    return [2 /*return*/];
                return [4 /*yield*/, weighCone(weighDialog.recovery.id, {
                        weight_grams: weighDialog.weight
                    })];
            case 1:
                result = _a.sent();
                if (result) {
                    weighDialog.isOpen = false;
                    // If weight is very low, maybe suggest write off?
                }
                return [2 /*return*/];
        }
    });
}); };
var handleConfirm = function (recovery) { return __awaiter(void 0, void 0, void 0, function () {
    var confirmed;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, confirm({
                    title: 'Xác nhận nhập kho',
                    message: "B\u1EA1n c\u00F3 ch\u1EAFc ch\u1EAFn mu\u1ED1n x\u00E1c nh\u1EADn ho\u00E0n tr\u1EA3 cu\u1ED9n ch\u1EC9 ".concat((_a = recovery.cone) === null || _a === void 0 ? void 0 : _a.cone_id, " v\u1EDBi ").concat(formatNumber(recovery.remaining_meters), "m v\u1EC1 kho?"),
                    color: 'positive',
                    ok: 'Xác nhận'
                })];
            case 1:
                confirmed = _b.sent();
                if (!confirmed) return [3 /*break*/, 3];
                return [4 /*yield*/, confirmRecovery(recovery.id)];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
var openWriteOffDialog = function (recovery) {
    writeOffDialog.recovery = recovery;
    writeOffDialog.reason = '';
    writeOffDialog.approved_by = '';
    writeOffDialog.isOpen = true;
};
var handleWriteOffSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!writeOffDialog.recovery || !writeOffDialog.reason || !writeOffDialog.approved_by) {
                    snackbar.warning('Vui lòng điền đầy đủ thông tin phê duyệt');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, writeOffCone(writeOffDialog.recovery.id, {
                        reason: writeOffDialog.reason,
                        approved_by: writeOffDialog.approved_by
                    })];
            case 1:
                result = _a.sent();
                if (result) {
                    writeOffDialog.isOpen = false;
                }
                return [2 /*return*/];
        }
    });
}); };
var openDetailDialog = function (recovery) {
    detailDialog.recovery = recovery;
    detailDialog.isOpen = true;
};
// Permissions/Visibility helpers
var canWeigh = function (status) {
    return status === enums_1.RecoveryStatus.INITIATED || status === enums_1.RecoveryStatus.PENDING_WEIGH;
};
var canConfirm = function (status) {
    return status === enums_1.RecoveryStatus.WEIGHED;
};
var canWriteOff = function (recovery) {
    return recovery.status === enums_1.RecoveryStatus.WEIGHED;
};
// Lifecycle
(0, vue_1.onMounted)(function () {
    fetchRecoveries();
});
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['workflow-card']} */ ;
/** @type {__VLS_StyleScopedClasses['text-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPage | typeof __VLS_components.QPage | typeof __VLS_components.qPage | typeof __VLS_components.QPage} */
qPage;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ padding: true }, { class: "recovery-page" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ padding: true }, { class: "recovery-page" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['recovery-page']} */ ;
var __VLS_6 = __VLS_3.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h4 q-my-none" }));
/** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
/** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ 'onClick': {} }, { label: "Quét Mã", icon: "qr_code_scanner", color: "primary" })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Quét Mã", icon: "qr_code_scanner", color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
var __VLS_13 = ({ click: {} },
    { onClick: (__VLS_ctx.openScanDialog) });
var __VLS_10;
var __VLS_11;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
var __VLS_14;
/** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.cone_id), label: "Tìm theo mã cuộn", placeholder: "Nhập hoặc quét mã...", clearable: true, dense: true })));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.cone_id), label: "Tìm theo mã cuộn", placeholder: "Nhập hoặc quét mã...", clearable: true, dense: true })], __VLS_functionalComponentArgsRest(__VLS_15), false));
var __VLS_19;
var __VLS_20 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
var __VLS_21 = __VLS_17.slots.default;
{
    var __VLS_22 = __VLS_17.slots.append;
    var __VLS_23 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        name: "search",
    }));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
            name: "search",
        }], __VLS_functionalComponentArgsRest(__VLS_24), false));
    // @ts-ignore
    [openScanDialog, filters, handleFilterChange,];
}
// @ts-ignore
[];
var __VLS_17;
var __VLS_18;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
var __VLS_28;
/** @ts-ignore @type {typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.status), label: "Trạng thái", options: (__VLS_ctx.statusOptions), clearable: true, dense: true, emitValue: true, mapOptions: true })));
var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.filters.status), label: "Trạng thái", options: (__VLS_ctx.statusOptions), clearable: true, dense: true, emitValue: true, mapOptions: true })], __VLS_functionalComponentArgsRest(__VLS_29), false));
var __VLS_33;
var __VLS_34 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleFilterChange) });
var __VLS_31;
var __VLS_32;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
for (var _i = 0, _3 = __VLS_vFor((__VLS_ctx.workflowSteps)); _i < _3.length; _i++) {
    var _4 = _3[_i], step = _4[0], index = _4[1];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (index) }, { class: "col-12 col-sm-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    var __VLS_35 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign({ flat: true, bordered: true }, { class: "workflow-card" })));
    var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "workflow-card" })], __VLS_functionalComponentArgsRest(__VLS_36), false));
    /** @type {__VLS_StyleScopedClasses['workflow-card']} */ ;
    var __VLS_40 = __VLS_38.slots.default;
    var __VLS_41 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41(__assign({ class: "row items-center no-wrap" })));
    var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([__assign({ class: "row items-center no-wrap" })], __VLS_functionalComponentArgsRest(__VLS_42), false));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    var __VLS_46 = __VLS_44.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-overline text-secondary" }));
    /** @type {__VLS_StyleScopedClasses['text-overline']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
    (step.overline);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    (step.title);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-secondary" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
    (step.description);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_47 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
    qAvatar;
    // @ts-ignore
    var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
        color: (step.color),
        textColor: "white",
        icon: (step.icon),
    }));
    var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([{
            color: (step.color),
            textColor: "white",
            icon: (step.icon),
        }], __VLS_functionalComponentArgsRest(__VLS_48), false));
    // @ts-ignore
    [filters, handleFilterChange, statusOptions, workflowSteps,];
    var __VLS_44;
    // @ts-ignore
    [];
    var __VLS_38;
    // @ts-ignore
    [];
}
var __VLS_52;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52(__assign({ flat: true, bordered: true, rows: (__VLS_ctx.recoveries), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.isLoading), rowKey: "id", rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "recovery-table shadow-1" })));
var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true, rows: (__VLS_ctx.recoveries), columns: (__VLS_ctx.columns), loading: (__VLS_ctx.isLoading), rowKey: "id", rowsPerPageOptions: ([10, 25, 50, 100]) }, { class: "recovery-table shadow-1" })], __VLS_functionalComponentArgsRest(__VLS_53), false));
/** @type {__VLS_StyleScopedClasses['recovery-table']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
var __VLS_57 = __VLS_55.slots.default;
{
    var __VLS_58 = __VLS_55.slots["body-cell-thread_type"];
    var props = __VLS_vSlot(__VLS_58)[0];
    var __VLS_59 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59({
        props: (props),
    }));
    var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_60), false));
    var __VLS_64 = __VLS_62.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    var __VLS_65 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65(__assign(__assign(__assign({ rounded: true }, { style: ({ backgroundColor: ((_d = (_c = (_b = props.row.cone) === null || _b === void 0 ? void 0 : _b.thread_type) === null || _c === void 0 ? void 0 : _c.color_data) === null || _d === void 0 ? void 0 : _d.hex_code) || '#ccc' }) }), { class: "q-mr-xs" }), { style: {} })));
    var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([__assign(__assign(__assign({ rounded: true }, { style: ({ backgroundColor: ((_g = (_f = (_e = props.row.cone) === null || _e === void 0 ? void 0 : _e.thread_type) === null || _f === void 0 ? void 0 : _f.color_data) === null || _g === void 0 ? void 0 : _g.hex_code) || '#ccc' }) }), { class: "q-mr-xs" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_66), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (((_j = (_h = props.row.cone) === null || _h === void 0 ? void 0 : _h.thread_type) === null || _j === void 0 ? void 0 : _j.name) || 'N/A');
    // @ts-ignore
    [recoveries, columns, isLoading,];
    var __VLS_62;
    // @ts-ignore
    [];
}
{
    var __VLS_70 = __VLS_55.slots["body-cell-original_meters"];
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
    (__VLS_ctx.formatNumber(props.row.original_meters));
    // @ts-ignore
    [formatNumber,];
    var __VLS_74;
    // @ts-ignore
    [];
}
{
    var __VLS_77 = __VLS_55.slots["body-cell-returned_weight"];
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
    if (props.row.returned_weight_grams) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.formatNumber(props.row.returned_weight_grams));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-hint" }));
        /** @type {__VLS_StyleScopedClasses['text-hint']} */ ;
    }
    // @ts-ignore
    [formatNumber,];
    var __VLS_81;
    // @ts-ignore
    [];
}
{
    var __VLS_84 = __VLS_55.slots["body-cell-remaining_meters"];
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
    if (props.row.calculated_meters) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-bold" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        (__VLS_ctx.formatNumber(props.row.calculated_meters));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-hint" }));
        /** @type {__VLS_StyleScopedClasses['text-hint']} */ ;
    }
    // @ts-ignore
    [formatNumber,];
    var __VLS_88;
    // @ts-ignore
    [];
}
{
    var __VLS_91 = __VLS_55.slots["body-cell-consumed_meters"];
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
    if (props.row.consumption_meters) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-negative" }));
        /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
        (__VLS_ctx.formatNumber(props.row.consumption_meters));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-hint" }));
        /** @type {__VLS_StyleScopedClasses['text-hint']} */ ;
    }
    // @ts-ignore
    [formatNumber,];
    var __VLS_95;
    // @ts-ignore
    [];
}
{
    var __VLS_98 = __VLS_55.slots["body-cell-status"];
    var props = __VLS_vSlot(__VLS_98)[0];
    var __VLS_99 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
        props: (props),
    }));
    var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_100), false));
    var __VLS_104 = __VLS_102.slots.default;
    var __VLS_105 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ color: (__VLS_ctx.getStatusConfig(props.row.status).color) }, { class: "q-pa-xs" })));
    var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.getStatusConfig(props.row.status).color) }, { class: "q-pa-xs" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-xs']} */ ;
    var __VLS_110 = __VLS_108.slots.default;
    var __VLS_111 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111(__assign({ name: (__VLS_ctx.getStatusConfig(props.row.status).icon), size: "14px" }, { class: "q-mr-xs" })));
    var __VLS_113 = __VLS_112.apply(void 0, __spreadArray([__assign({ name: (__VLS_ctx.getStatusConfig(props.row.status).icon), size: "14px" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_112), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    (__VLS_ctx.getStatusConfig(props.row.status).label);
    // @ts-ignore
    [getStatusConfig, getStatusConfig, getStatusConfig,];
    var __VLS_108;
    // @ts-ignore
    [];
    var __VLS_102;
    // @ts-ignore
    [];
}
{
    var __VLS_116 = __VLS_55.slots["body-cell-actions"];
    var props_1 = __VLS_vSlot(__VLS_116)[0];
    var __VLS_117 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117(__assign({ props: (props_1) }, { class: "text-right" })));
    var __VLS_119 = __VLS_118.apply(void 0, __spreadArray([__assign({ props: (props_1) }, { class: "text-right" })], __VLS_functionalComponentArgsRest(__VLS_118), false));
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    var __VLS_122 = __VLS_120.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-end q-gutter-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    var __VLS_123 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.IconButton} */
    IconButton;
    // @ts-ignore
    var __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123(__assign({ 'onClick': {} }, { icon: "visibility", color: "grey-7", tooltip: "Chi tiết" })));
    var __VLS_125 = __VLS_124.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "visibility", color: "grey-7", tooltip: "Chi tiết" })], __VLS_functionalComponentArgsRest(__VLS_124), false));
    var __VLS_128 = void 0;
    var __VLS_129 = ({ click: {} },
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
    var __VLS_126;
    var __VLS_127;
    if (__VLS_ctx.canWeigh(props_1.row.status)) {
        var __VLS_130 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.IconButton} */
        IconButton;
        // @ts-ignore
        var __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130(__assign({ 'onClick': {} }, { icon: "scale", color: "warning", tooltip: "Cân cuộn chỉ" })));
        var __VLS_132 = __VLS_131.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "scale", color: "warning", tooltip: "Cân cuộn chỉ" })], __VLS_functionalComponentArgsRest(__VLS_131), false));
        var __VLS_135 = void 0;
        var __VLS_136 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.canWeigh(props_1.row.status)))
                        return;
                    __VLS_ctx.openWeighDialog(props_1.row);
                    // @ts-ignore
                    [canWeigh, openWeighDialog,];
                } });
        var __VLS_133;
        var __VLS_134;
    }
    if (__VLS_ctx.canConfirm(props_1.row.status)) {
        var __VLS_137 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.IconButton} */
        IconButton;
        // @ts-ignore
        var __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137(__assign({ 'onClick': {} }, { icon: "check_circle", color: "positive", tooltip: "Xác nhận nhập kho" })));
        var __VLS_139 = __VLS_138.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "check_circle", color: "positive", tooltip: "Xác nhận nhập kho" })], __VLS_functionalComponentArgsRest(__VLS_138), false));
        var __VLS_142 = void 0;
        var __VLS_143 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.canConfirm(props_1.row.status)))
                        return;
                    __VLS_ctx.handleConfirm(props_1.row);
                    // @ts-ignore
                    [canConfirm, handleConfirm,];
                } });
        var __VLS_140;
        var __VLS_141;
    }
    if (__VLS_ctx.canWriteOff(props_1.row)) {
        var __VLS_144 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.IconButton} */
        IconButton;
        // @ts-ignore
        var __VLS_145 = __VLS_asFunctionalComponent1(__VLS_144, new __VLS_144(__assign({ 'onClick': {} }, { icon: "delete_outline", color: "negative", tooltip: "Loại bỏ" })));
        var __VLS_146 = __VLS_145.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "delete_outline", color: "negative", tooltip: "Loại bỏ" })], __VLS_functionalComponentArgsRest(__VLS_145), false));
        var __VLS_149 = void 0;
        var __VLS_150 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.canWriteOff(props_1.row)))
                        return;
                    __VLS_ctx.openWriteOffDialog(props_1.row);
                    // @ts-ignore
                    [canWriteOff, openWriteOffDialog,];
                } });
        var __VLS_147;
        var __VLS_148;
    }
    // @ts-ignore
    [];
    var __VLS_120;
    // @ts-ignore
    [];
}
{
    var __VLS_151 = __VLS_55.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "full-width q-pa-xl text-center text-secondary" }));
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
    var __VLS_152 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_153 = __VLS_asFunctionalComponent1(__VLS_152, new __VLS_152(__assign({ name: "inventory_2", size: "64px" }, { class: "q-mb-md" })));
    var __VLS_154 = __VLS_153.apply(void 0, __spreadArray([__assign({ name: "inventory_2", size: "64px" }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_153), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_55;
var __VLS_157;
/** @ts-ignore @type {typeof __VLS_components.FormDialog | typeof __VLS_components.FormDialog} */
FormDialog;
// @ts-ignore
var __VLS_158 = __VLS_asFunctionalComponent1(__VLS_157, new __VLS_157(__assign({ 'onSubmit': {} }, { modelValue: (__VLS_ctx.scanDialog.isOpen), title: "Khởi Tạo Hoàn Trả", loading: (__VLS_ctx.isLoading) })));
var __VLS_159 = __VLS_158.apply(void 0, __spreadArray([__assign({ 'onSubmit': {} }, { modelValue: (__VLS_ctx.scanDialog.isOpen), title: "Khởi Tạo Hoàn Trả", loading: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_158), false));
var __VLS_162;
var __VLS_163 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleScanSubmit) });
var __VLS_164 = __VLS_160.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-y-md" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-y-md']} */ ;
var __VLS_165;
/** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165(__assign({ 'onKeyup': {} }, { modelValue: (__VLS_ctx.scanDialog.barcode), label: "Mã Barcode Cuộn Chỉ", placeholder: "Quét hoặc nhập mã cuộn...", required: true, autofocus: true })));
var __VLS_167 = __VLS_166.apply(void 0, __spreadArray([__assign({ 'onKeyup': {} }, { modelValue: (__VLS_ctx.scanDialog.barcode), label: "Mã Barcode Cuộn Chỉ", placeholder: "Quét hoặc nhập mã cuộn...", required: true, autofocus: true })], __VLS_functionalComponentArgsRest(__VLS_166), false));
var __VLS_170;
var __VLS_171 = ({ keyup: {} },
    { onKeyup: (__VLS_ctx.handleScanSubmit) });
var __VLS_172 = __VLS_168.slots.default;
{
    var __VLS_173 = __VLS_168.slots.prepend;
    var __VLS_174 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174({
        name: "qr_code_scanner",
    }));
    var __VLS_176 = __VLS_175.apply(void 0, __spreadArray([{
            name: "qr_code_scanner",
        }], __VLS_functionalComponentArgsRest(__VLS_175), false));
    // @ts-ignore
    [isLoading, scanDialog, scanDialog, handleScanSubmit, handleScanSubmit,];
}
// @ts-ignore
[];
var __VLS_168;
var __VLS_169;
var __VLS_179;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_180 = __VLS_asFunctionalComponent1(__VLS_179, new __VLS_179({
    modelValue: (__VLS_ctx.scanDialog.notes),
    label: "Ghi chú (Tùy chọn)",
    type: "textarea",
    rows: "2",
}));
var __VLS_181 = __VLS_180.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.scanDialog.notes),
        label: "Ghi chú (Tùy chọn)",
        type: "textarea",
        rows: "2",
    }], __VLS_functionalComponentArgsRest(__VLS_180), false));
// @ts-ignore
[scanDialog,];
var __VLS_160;
var __VLS_161;
var __VLS_184;
/** @ts-ignore @type {typeof __VLS_components.FormDialog | typeof __VLS_components.FormDialog} */
FormDialog;
// @ts-ignore
var __VLS_185 = __VLS_asFunctionalComponent1(__VLS_184, new __VLS_184(__assign({ 'onSubmit': {} }, { modelValue: (__VLS_ctx.weighDialog.isOpen), title: "Cân Cuộn Chỉ", loading: (__VLS_ctx.isLoading) })));
var __VLS_186 = __VLS_185.apply(void 0, __spreadArray([__assign({ 'onSubmit': {} }, { modelValue: (__VLS_ctx.weighDialog.isOpen), title: "Cân Cuộn Chỉ", loading: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_185), false));
var __VLS_189;
var __VLS_190 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleWeighSubmit) });
var __VLS_191 = __VLS_187.slots.default;
if (__VLS_ctx.weighDialog.recovery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-y-md" }));
    /** @type {__VLS_StyleScopedClasses['q-gutter-y-md']} */ ;
    var __VLS_192 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_193 = __VLS_asFunctionalComponent1(__VLS_192, new __VLS_192(__assign({ dense: true }, { class: "bg-blue-1 text-blue-9 rounded-borders" })));
    var __VLS_194 = __VLS_193.apply(void 0, __spreadArray([__assign({ dense: true }, { class: "bg-blue-1 text-blue-9 rounded-borders" })], __VLS_functionalComponentArgsRest(__VLS_193), false));
    /** @type {__VLS_StyleScopedClasses['bg-blue-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    var __VLS_197 = __VLS_195.slots.default;
    {
        var __VLS_198 = __VLS_195.slots.avatar;
        var __VLS_199 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_200 = __VLS_asFunctionalComponent1(__VLS_199, new __VLS_199({
            name: "info",
            color: "blue",
        }));
        var __VLS_201 = __VLS_200.apply(void 0, __spreadArray([{
                name: "info",
                color: "blue",
            }], __VLS_functionalComponentArgsRest(__VLS_200), false));
        // @ts-ignore
        [isLoading, weighDialog, weighDialog, handleWeighSubmit,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-bold" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    ((_l = (_k = __VLS_ctx.weighDialog.recovery.cone) === null || _k === void 0 ? void 0 : _k.thread_type) === null || _l === void 0 ? void 0 : _l.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    ((_m = __VLS_ctx.weighDialog.recovery.cone) === null || _m === void 0 ? void 0 : _m.cone_id);
    (__VLS_ctx.formatNumber(__VLS_ctx.weighDialog.recovery.original_meters));
    // @ts-ignore
    [formatNumber, weighDialog, weighDialog, weighDialog,];
    var __VLS_195;
    var __VLS_204 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_205 = __VLS_asFunctionalComponent1(__VLS_204, new __VLS_204({
        modelValue: (__VLS_ctx.weighDialog.weight),
        modelModifiers: { number: true, },
        label: "Trọng lượng thực tế (grams)",
        type: "number",
        placeholder: "Nhập cân nặng...",
        required: true,
        suffix: "g",
        rules: ([function (val) { return val > 0 || 'Vui lòng nhập trọng lượng hợp lệ'; }]),
    }));
    var __VLS_206 = __VLS_205.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.weighDialog.weight),
            modelModifiers: { number: true, },
            label: "Trọng lượng thực tế (grams)",
            type: "number",
            placeholder: "Nhập cân nặng...",
            required: true,
            suffix: "g",
            rules: ([function (val) { return val > 0 || 'Vui lòng nhập trọng lượng hợp lệ'; }]),
        }], __VLS_functionalComponentArgsRest(__VLS_205), false));
    var __VLS_209 = __VLS_207.slots.default;
    {
        var __VLS_210 = __VLS_207.slots.prepend;
        var __VLS_211 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_212 = __VLS_asFunctionalComponent1(__VLS_211, new __VLS_211({
            name: "scale",
        }));
        var __VLS_213 = __VLS_212.apply(void 0, __spreadArray([{
                name: "scale",
            }], __VLS_functionalComponentArgsRest(__VLS_212), false));
        // @ts-ignore
        [weighDialog,];
    }
    // @ts-ignore
    [];
    var __VLS_207;
    if (__VLS_ctx.weighDialog.weight) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bg-surface q-pa-md rounded-borders" }));
        /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between q-mb-xs" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-bold text-primary" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
        (__VLS_ctx.formatNumber(__VLS_ctx.calculatedMeters));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-between" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-bold text-negative" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
        (__VLS_ctx.formatNumber(__VLS_ctx.calculatedConsumption));
        if (__VLS_ctx.weighDialog.weight < 50) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-negative q-mt-sm" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
            var __VLS_216 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_217 = __VLS_asFunctionalComponent1(__VLS_216, new __VLS_216({
                name: "warning",
                size: "14px",
            }));
            var __VLS_218 = __VLS_217.apply(void 0, __spreadArray([{
                    name: "warning",
                    size: "14px",
                }], __VLS_functionalComponentArgsRest(__VLS_217), false));
        }
    }
    var __VLS_221 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221({
        modelValue: (__VLS_ctx.weighDialog.weighed_by),
        label: "Người thực hiện",
        placeholder: "Nhập tên người cân...",
    }));
    var __VLS_223 = __VLS_222.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.weighDialog.weighed_by),
            label: "Người thực hiện",
            placeholder: "Nhập tên người cân...",
        }], __VLS_functionalComponentArgsRest(__VLS_222), false));
}
// @ts-ignore
[formatNumber, formatNumber, weighDialog, weighDialog, weighDialog, calculatedMeters, calculatedConsumption,];
var __VLS_187;
var __VLS_188;
var __VLS_226;
/** @ts-ignore @type {typeof __VLS_components.FormDialog | typeof __VLS_components.FormDialog} */
FormDialog;
// @ts-ignore
var __VLS_227 = __VLS_asFunctionalComponent1(__VLS_226, new __VLS_226(__assign({ 'onSubmit': {} }, { modelValue: (__VLS_ctx.writeOffDialog.isOpen), title: "Loại Bỏ Cuộn Chỉ", color: "negative", loading: (__VLS_ctx.isLoading) })));
var __VLS_228 = __VLS_227.apply(void 0, __spreadArray([__assign({ 'onSubmit': {} }, { modelValue: (__VLS_ctx.writeOffDialog.isOpen), title: "Loại Bỏ Cuộn Chỉ", color: "negative", loading: (__VLS_ctx.isLoading) })], __VLS_functionalComponentArgsRest(__VLS_227), false));
var __VLS_231;
var __VLS_232 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleWriteOffSubmit) });
var __VLS_233 = __VLS_229.slots.default;
if (__VLS_ctx.writeOffDialog.recovery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-y-md" }));
    /** @type {__VLS_StyleScopedClasses['q-gutter-y-md']} */ ;
    var __VLS_234 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_235 = __VLS_asFunctionalComponent1(__VLS_234, new __VLS_234(__assign({ dense: true }, { class: "bg-red-1 text-red-9 rounded-borders" })));
    var __VLS_236 = __VLS_235.apply(void 0, __spreadArray([__assign({ dense: true }, { class: "bg-red-1 text-red-9 rounded-borders" })], __VLS_functionalComponentArgsRest(__VLS_235), false));
    /** @type {__VLS_StyleScopedClasses['bg-red-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    var __VLS_239 = __VLS_237.slots.default;
    {
        var __VLS_240 = __VLS_237.slots.avatar;
        var __VLS_241 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_242 = __VLS_asFunctionalComponent1(__VLS_241, new __VLS_241({
            name: "warning",
            color: "negative",
        }));
        var __VLS_243 = __VLS_242.apply(void 0, __spreadArray([{
                name: "warning",
                color: "negative",
            }], __VLS_functionalComponentArgsRest(__VLS_242), false));
        // @ts-ignore
        [isLoading, writeOffDialog, writeOffDialog, handleWriteOffSubmit,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.b, __VLS_intrinsics.b)({});
    // @ts-ignore
    [];
    var __VLS_237;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bg-surface q-pa-sm rounded-borders" }));
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    ((_p = (_o = __VLS_ctx.writeOffDialog.recovery.cone) === null || _o === void 0 ? void 0 : _o.thread_type) === null || _p === void 0 ? void 0 : _p.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    ((_q = __VLS_ctx.writeOffDialog.recovery.cone) === null || _q === void 0 ? void 0 : _q.cone_id);
    if (__VLS_ctx.writeOffDialog.recovery.returned_weight_grams) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        (__VLS_ctx.formatNumber(__VLS_ctx.writeOffDialog.recovery.returned_weight_grams));
        (__VLS_ctx.formatNumber(__VLS_ctx.writeOffDialog.recovery.remaining_meters));
    }
    var __VLS_246 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_247 = __VLS_asFunctionalComponent1(__VLS_246, new __VLS_246({
        modelValue: (__VLS_ctx.writeOffDialog.reason),
        label: "Lý do loại bỏ",
        required: true,
        rules: ([function (val) { return !!val || 'Vui lòng nhập lý do'; }]),
    }));
    var __VLS_248 = __VLS_247.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.writeOffDialog.reason),
            label: "Lý do loại bỏ",
            required: true,
            rules: ([function (val) { return !!val || 'Vui lòng nhập lý do'; }]),
        }], __VLS_functionalComponentArgsRest(__VLS_247), false));
    var __VLS_251 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_252 = __VLS_asFunctionalComponent1(__VLS_251, new __VLS_251({
        modelValue: (__VLS_ctx.writeOffDialog.approved_by),
        label: "Người phê duyệt (Giám sát)",
        placeholder: "Nhập tên người duyệt...",
        required: true,
        rules: ([function (val) { return !!val || 'Vui lòng nhập tên người duyệt'; }]),
    }));
    var __VLS_253 = __VLS_252.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.writeOffDialog.approved_by),
            label: "Người phê duyệt (Giám sát)",
            placeholder: "Nhập tên người duyệt...",
            required: true,
            rules: ([function (val) { return !!val || 'Vui lòng nhập tên người duyệt'; }]),
        }], __VLS_functionalComponentArgsRest(__VLS_252), false));
}
// @ts-ignore
[formatNumber, formatNumber, writeOffDialog, writeOffDialog, writeOffDialog, writeOffDialog, writeOffDialog, writeOffDialog, writeOffDialog,];
var __VLS_229;
var __VLS_230;
var __VLS_256;
/** @ts-ignore @type {typeof __VLS_components.AppDialog | typeof __VLS_components.AppDialog} */
AppDialog;
// @ts-ignore
var __VLS_257 = __VLS_asFunctionalComponent1(__VLS_256, new __VLS_256({
    modelValue: (__VLS_ctx.detailDialog.isOpen),
    title: "Chi Tiết Hoàn Trả",
    width: "600px",
}));
var __VLS_258 = __VLS_257.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.detailDialog.isOpen),
        title: "Chi Tiết Hoàn Trả",
        width: "600px",
    }], __VLS_functionalComponentArgsRest(__VLS_257), false));
var __VLS_261 = __VLS_259.slots.default;
if (__VLS_ctx.detailDialog.recovery) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-bold q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_262 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_263 = __VLS_asFunctionalComponent1(__VLS_262, new __VLS_262(__assign({ bordered: true, separator: true, padding: true }, { class: "rounded-borders" })));
    var __VLS_264 = __VLS_263.apply(void 0, __spreadArray([__assign({ bordered: true, separator: true, padding: true }, { class: "rounded-borders" })], __VLS_functionalComponentArgsRest(__VLS_263), false));
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    var __VLS_267 = __VLS_265.slots.default;
    var __VLS_268 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_269 = __VLS_asFunctionalComponent1(__VLS_268, new __VLS_268({}));
    var __VLS_270 = __VLS_269.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_269), false));
    var __VLS_273 = __VLS_271.slots.default;
    var __VLS_274 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_275 = __VLS_asFunctionalComponent1(__VLS_274, new __VLS_274({}));
    var __VLS_276 = __VLS_275.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_275), false));
    var __VLS_279 = __VLS_277.slots.default;
    var __VLS_280 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_281 = __VLS_asFunctionalComponent1(__VLS_280, new __VLS_280({
        caption: true,
    }));
    var __VLS_282 = __VLS_281.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_281), false));
    var __VLS_285 = __VLS_283.slots.default;
    // @ts-ignore
    [detailDialog, detailDialog,];
    var __VLS_283;
    var __VLS_286 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_287 = __VLS_asFunctionalComponent1(__VLS_286, new __VLS_286(__assign({ class: "text-weight-medium" })));
    var __VLS_288 = __VLS_287.apply(void 0, __spreadArray([__assign({ class: "text-weight-medium" })], __VLS_functionalComponentArgsRest(__VLS_287), false));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    var __VLS_291 = __VLS_289.slots.default;
    ((_r = __VLS_ctx.detailDialog.recovery.cone) === null || _r === void 0 ? void 0 : _r.cone_id);
    // @ts-ignore
    [detailDialog,];
    var __VLS_289;
    // @ts-ignore
    [];
    var __VLS_277;
    // @ts-ignore
    [];
    var __VLS_271;
    var __VLS_292 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_293 = __VLS_asFunctionalComponent1(__VLS_292, new __VLS_292({}));
    var __VLS_294 = __VLS_293.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_293), false));
    var __VLS_297 = __VLS_295.slots.default;
    var __VLS_298 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_299 = __VLS_asFunctionalComponent1(__VLS_298, new __VLS_298({}));
    var __VLS_300 = __VLS_299.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_299), false));
    var __VLS_303 = __VLS_301.slots.default;
    var __VLS_304 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_305 = __VLS_asFunctionalComponent1(__VLS_304, new __VLS_304({
        caption: true,
    }));
    var __VLS_306 = __VLS_305.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_305), false));
    var __VLS_309 = __VLS_307.slots.default;
    // @ts-ignore
    [];
    var __VLS_307;
    var __VLS_310 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_311 = __VLS_asFunctionalComponent1(__VLS_310, new __VLS_310(__assign({ class: "row items-center" })));
    var __VLS_312 = __VLS_311.apply(void 0, __spreadArray([__assign({ class: "row items-center" })], __VLS_functionalComponentArgsRest(__VLS_311), false));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    var __VLS_315 = __VLS_313.slots.default;
    var __VLS_316 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_317 = __VLS_asFunctionalComponent1(__VLS_316, new __VLS_316(__assign(__assign(__assign({ rounded: true }, { style: ({ backgroundColor: ((_u = (_t = (_s = __VLS_ctx.detailDialog.recovery.cone) === null || _s === void 0 ? void 0 : _s.thread_type) === null || _t === void 0 ? void 0 : _t.color_data) === null || _u === void 0 ? void 0 : _u.hex_code) || '#ccc' }) }), { class: "q-mr-xs" }), { style: {} })));
    var __VLS_318 = __VLS_317.apply(void 0, __spreadArray([__assign(__assign(__assign({ rounded: true }, { style: ({ backgroundColor: ((_x = (_w = (_v = __VLS_ctx.detailDialog.recovery.cone) === null || _v === void 0 ? void 0 : _v.thread_type) === null || _w === void 0 ? void 0 : _w.color_data) === null || _x === void 0 ? void 0 : _x.hex_code) || '#ccc' }) }), { class: "q-mr-xs" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_317), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    ((_z = (_y = __VLS_ctx.detailDialog.recovery.cone) === null || _y === void 0 ? void 0 : _y.thread_type) === null || _z === void 0 ? void 0 : _z.name);
    // @ts-ignore
    [detailDialog, detailDialog,];
    var __VLS_313;
    // @ts-ignore
    [];
    var __VLS_301;
    // @ts-ignore
    [];
    var __VLS_295;
    // @ts-ignore
    [];
    var __VLS_265;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-bold q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    var __VLS_321 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_322 = __VLS_asFunctionalComponent1(__VLS_321, new __VLS_321(__assign({ flat: true, bordered: true }, { class: "bg-surface" })));
    var __VLS_323 = __VLS_322.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "bg-surface" })], __VLS_functionalComponentArgsRest(__VLS_322), false));
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    var __VLS_326 = __VLS_324.slots.default;
    var __VLS_327 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_328 = __VLS_asFunctionalComponent1(__VLS_327, new __VLS_327(__assign({ class: "q-pa-sm" })));
    var __VLS_329 = __VLS_328.apply(void 0, __spreadArray([__assign({ class: "q-pa-sm" })], __VLS_functionalComponentArgsRest(__VLS_328), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    var __VLS_332 = __VLS_330.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-secondary" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    (__VLS_ctx.formatNumber(__VLS_ctx.detailDialog.recovery.original_meters));
    // @ts-ignore
    [formatNumber, detailDialog,];
    var __VLS_330;
    // @ts-ignore
    [];
    var __VLS_324;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    var __VLS_333 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_334 = __VLS_asFunctionalComponent1(__VLS_333, new __VLS_333(__assign({ flat: true, bordered: true }, { class: "bg-surface" })));
    var __VLS_335 = __VLS_334.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "bg-surface" })], __VLS_functionalComponentArgsRest(__VLS_334), false));
    /** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
    var __VLS_338 = __VLS_336.slots.default;
    var __VLS_339 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_340 = __VLS_asFunctionalComponent1(__VLS_339, new __VLS_339(__assign({ class: "q-pa-sm" })));
    var __VLS_341 = __VLS_340.apply(void 0, __spreadArray([__assign({ class: "q-pa-sm" })], __VLS_functionalComponentArgsRest(__VLS_340), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    var __VLS_344 = __VLS_342.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-secondary" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-secondary']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    (__VLS_ctx.detailDialog.recovery.returned_weight_grams ? __VLS_ctx.formatNumber(__VLS_ctx.detailDialog.recovery.returned_weight_grams) + 'g' : '—');
    // @ts-ignore
    [formatNumber, detailDialog, detailDialog,];
    var __VLS_342;
    // @ts-ignore
    [];
    var __VLS_336;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    var __VLS_345 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_346 = __VLS_asFunctionalComponent1(__VLS_345, new __VLS_345(__assign({ flat: true, bordered: true }, { class: "bg-primary text-white" })));
    var __VLS_347 = __VLS_346.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "bg-primary text-white" })], __VLS_functionalComponentArgsRest(__VLS_346), false));
    /** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_350 = __VLS_348.slots.default;
    var __VLS_351 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_352 = __VLS_asFunctionalComponent1(__VLS_351, new __VLS_351(__assign({ class: "q-pa-sm" })));
    var __VLS_353 = __VLS_352.apply(void 0, __spreadArray([__assign({ class: "q-pa-sm" })], __VLS_functionalComponentArgsRest(__VLS_352), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    var __VLS_356 = __VLS_354.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-blue-1" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    (__VLS_ctx.detailDialog.recovery.remaining_meters ? __VLS_ctx.formatNumber(__VLS_ctx.detailDialog.recovery.remaining_meters) + 'm' : '—');
    // @ts-ignore
    [formatNumber, detailDialog, detailDialog,];
    var __VLS_354;
    // @ts-ignore
    [];
    var __VLS_348;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    var __VLS_357 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_358 = __VLS_asFunctionalComponent1(__VLS_357, new __VLS_357(__assign({ flat: true, bordered: true }, { class: "bg-negative text-white" })));
    var __VLS_359 = __VLS_358.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "bg-negative text-white" })], __VLS_functionalComponentArgsRest(__VLS_358), false));
    /** @type {__VLS_StyleScopedClasses['bg-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_362 = __VLS_360.slots.default;
    var __VLS_363 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_364 = __VLS_asFunctionalComponent1(__VLS_363, new __VLS_363(__assign({ class: "q-pa-sm" })));
    var __VLS_365 = __VLS_364.apply(void 0, __spreadArray([__assign({ class: "q-pa-sm" })], __VLS_functionalComponentArgsRest(__VLS_364), false));
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    var __VLS_368 = __VLS_366.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-red-1" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-red-1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    (__VLS_ctx.detailDialog.recovery.consumed_meters ? __VLS_ctx.formatNumber(__VLS_ctx.detailDialog.recovery.consumed_meters) + 'm' : '—');
    // @ts-ignore
    [formatNumber, detailDialog, detailDialog,];
    var __VLS_366;
    // @ts-ignore
    [];
    var __VLS_360;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-bold q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_369 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_370 = __VLS_asFunctionalComponent1(__VLS_369, new __VLS_369(__assign({ bordered: true, separator: true, padding: true }, { class: "rounded-borders" })));
    var __VLS_371 = __VLS_370.apply(void 0, __spreadArray([__assign({ bordered: true, separator: true, padding: true }, { class: "rounded-borders" })], __VLS_functionalComponentArgsRest(__VLS_370), false));
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    var __VLS_374 = __VLS_372.slots.default;
    var __VLS_375 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_376 = __VLS_asFunctionalComponent1(__VLS_375, new __VLS_375({}));
    var __VLS_377 = __VLS_376.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_376), false));
    var __VLS_380 = __VLS_378.slots.default;
    var __VLS_381 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_382 = __VLS_asFunctionalComponent1(__VLS_381, new __VLS_381({}));
    var __VLS_383 = __VLS_382.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_382), false));
    var __VLS_386 = __VLS_384.slots.default;
    var __VLS_387 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_388 = __VLS_asFunctionalComponent1(__VLS_387, new __VLS_387({
        caption: true,
    }));
    var __VLS_389 = __VLS_388.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_388), false));
    var __VLS_392 = __VLS_390.slots.default;
    // @ts-ignore
    [];
    var __VLS_390;
    var __VLS_393 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_394 = __VLS_asFunctionalComponent1(__VLS_393, new __VLS_393({}));
    var __VLS_395 = __VLS_394.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_394), false));
    var __VLS_398 = __VLS_396.slots.default;
    var __VLS_399 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_400 = __VLS_asFunctionalComponent1(__VLS_399, new __VLS_399({
        color: (__VLS_ctx.getStatusConfig(__VLS_ctx.detailDialog.recovery.status).color),
    }));
    var __VLS_401 = __VLS_400.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getStatusConfig(__VLS_ctx.detailDialog.recovery.status).color),
        }], __VLS_functionalComponentArgsRest(__VLS_400), false));
    var __VLS_404 = __VLS_402.slots.default;
    (__VLS_ctx.getStatusConfig(__VLS_ctx.detailDialog.recovery.status).label);
    // @ts-ignore
    [getStatusConfig, getStatusConfig, detailDialog, detailDialog,];
    var __VLS_402;
    // @ts-ignore
    [];
    var __VLS_396;
    // @ts-ignore
    [];
    var __VLS_384;
    // @ts-ignore
    [];
    var __VLS_378;
    if (__VLS_ctx.detailDialog.recovery.returned_by) {
        var __VLS_405 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_406 = __VLS_asFunctionalComponent1(__VLS_405, new __VLS_405({}));
        var __VLS_407 = __VLS_406.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_406), false));
        var __VLS_410 = __VLS_408.slots.default;
        var __VLS_411 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_412 = __VLS_asFunctionalComponent1(__VLS_411, new __VLS_411({}));
        var __VLS_413 = __VLS_412.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_412), false));
        var __VLS_416 = __VLS_414.slots.default;
        var __VLS_417 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_418 = __VLS_asFunctionalComponent1(__VLS_417, new __VLS_417({
            caption: true,
        }));
        var __VLS_419 = __VLS_418.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_418), false));
        var __VLS_422 = __VLS_420.slots.default;
        // @ts-ignore
        [detailDialog,];
        var __VLS_420;
        var __VLS_423 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_424 = __VLS_asFunctionalComponent1(__VLS_423, new __VLS_423({}));
        var __VLS_425 = __VLS_424.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_424), false));
        var __VLS_428 = __VLS_426.slots.default;
        (__VLS_ctx.detailDialog.recovery.returned_by);
        // @ts-ignore
        [detailDialog,];
        var __VLS_426;
        // @ts-ignore
        [];
        var __VLS_414;
        var __VLS_429 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_430 = __VLS_asFunctionalComponent1(__VLS_429, new __VLS_429({
            side: true,
        }));
        var __VLS_431 = __VLS_430.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_430), false));
        var __VLS_434 = __VLS_432.slots.default;
        var __VLS_435 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_436 = __VLS_asFunctionalComponent1(__VLS_435, new __VLS_435({
            caption: true,
        }));
        var __VLS_437 = __VLS_436.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_436), false));
        var __VLS_440 = __VLS_438.slots.default;
        (__VLS_ctx.formatDate(__VLS_ctx.detailDialog.recovery.created_at));
        // @ts-ignore
        [detailDialog, formatDate,];
        var __VLS_438;
        // @ts-ignore
        [];
        var __VLS_432;
        // @ts-ignore
        [];
        var __VLS_408;
    }
    if (__VLS_ctx.detailDialog.recovery.weighed_by) {
        var __VLS_441 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_442 = __VLS_asFunctionalComponent1(__VLS_441, new __VLS_441({}));
        var __VLS_443 = __VLS_442.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_442), false));
        var __VLS_446 = __VLS_444.slots.default;
        var __VLS_447 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_448 = __VLS_asFunctionalComponent1(__VLS_447, new __VLS_447({}));
        var __VLS_449 = __VLS_448.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_448), false));
        var __VLS_452 = __VLS_450.slots.default;
        var __VLS_453 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_454 = __VLS_asFunctionalComponent1(__VLS_453, new __VLS_453({
            caption: true,
        }));
        var __VLS_455 = __VLS_454.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_454), false));
        var __VLS_458 = __VLS_456.slots.default;
        // @ts-ignore
        [detailDialog,];
        var __VLS_456;
        var __VLS_459 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_460 = __VLS_asFunctionalComponent1(__VLS_459, new __VLS_459({}));
        var __VLS_461 = __VLS_460.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_460), false));
        var __VLS_464 = __VLS_462.slots.default;
        (__VLS_ctx.detailDialog.recovery.weighed_by);
        // @ts-ignore
        [detailDialog,];
        var __VLS_462;
        // @ts-ignore
        [];
        var __VLS_450;
        // @ts-ignore
        [];
        var __VLS_444;
    }
    if (__VLS_ctx.detailDialog.recovery.notes) {
        var __VLS_465 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_466 = __VLS_asFunctionalComponent1(__VLS_465, new __VLS_465({}));
        var __VLS_467 = __VLS_466.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_466), false));
        var __VLS_470 = __VLS_468.slots.default;
        var __VLS_471 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_472 = __VLS_asFunctionalComponent1(__VLS_471, new __VLS_471({}));
        var __VLS_473 = __VLS_472.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_472), false));
        var __VLS_476 = __VLS_474.slots.default;
        var __VLS_477 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_478 = __VLS_asFunctionalComponent1(__VLS_477, new __VLS_477({
            caption: true,
        }));
        var __VLS_479 = __VLS_478.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_478), false));
        var __VLS_482 = __VLS_480.slots.default;
        // @ts-ignore
        [detailDialog,];
        var __VLS_480;
        var __VLS_483 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_484 = __VLS_asFunctionalComponent1(__VLS_483, new __VLS_483({}));
        var __VLS_485 = __VLS_484.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_484), false));
        var __VLS_488 = __VLS_486.slots.default;
        (__VLS_ctx.detailDialog.recovery.notes);
        // @ts-ignore
        [detailDialog,];
        var __VLS_486;
        // @ts-ignore
        [];
        var __VLS_474;
        // @ts-ignore
        [];
        var __VLS_468;
    }
    // @ts-ignore
    [];
    var __VLS_372;
}
{
    var __VLS_489 = __VLS_259.slots.actions;
    var __VLS_490 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_491 = __VLS_asFunctionalComponent1(__VLS_490, new __VLS_490({
        label: "Đóng",
        flat: true,
        color: "grey-7",
    }));
    var __VLS_492 = __VLS_491.apply(void 0, __spreadArray([{
            label: "Đóng",
            flat: true,
            color: "grey-7",
        }], __VLS_functionalComponentArgsRest(__VLS_491), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    if (__VLS_ctx.canWeigh((_0 = __VLS_ctx.detailDialog.recovery) === null || _0 === void 0 ? void 0 : _0.status)) {
        var __VLS_495 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.AppButton} */
        AppButton;
        // @ts-ignore
        var __VLS_496 = __VLS_asFunctionalComponent1(__VLS_495, new __VLS_495(__assign({ 'onClick': {} }, { label: "Cân Ngay", color: "warning", icon: "scale" })));
        var __VLS_497 = __VLS_496.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Cân Ngay", color: "warning", icon: "scale" })], __VLS_functionalComponentArgsRest(__VLS_496), false));
        var __VLS_500 = void 0;
        var __VLS_501 = ({ click: {} },
            { onClick: (function () { __VLS_ctx.detailDialog.isOpen = false; __VLS_ctx.openWeighDialog(__VLS_ctx.detailDialog.recovery); }) });
        var __VLS_498;
        var __VLS_499;
    }
    if (__VLS_ctx.canConfirm((_1 = __VLS_ctx.detailDialog.recovery) === null || _1 === void 0 ? void 0 : _1.status)) {
        var __VLS_502 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.AppButton} */
        AppButton;
        // @ts-ignore
        var __VLS_503 = __VLS_asFunctionalComponent1(__VLS_502, new __VLS_502(__assign({ 'onClick': {} }, { label: "Xác Nhận", color: "positive", icon: "check_circle" })));
        var __VLS_504 = __VLS_503.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Xác Nhận", color: "positive", icon: "check_circle" })], __VLS_functionalComponentArgsRest(__VLS_503), false));
        var __VLS_507 = void 0;
        var __VLS_508 = ({ click: {} },
            { onClick: (function () { __VLS_ctx.detailDialog.isOpen = false; __VLS_ctx.handleConfirm(__VLS_ctx.detailDialog.recovery); }) });
        var __VLS_505;
        var __VLS_506;
    }
    // @ts-ignore
    [canWeigh, openWeighDialog, canConfirm, handleConfirm, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, detailDialog, vClosePopup,];
}
// @ts-ignore
[];
var __VLS_259;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
