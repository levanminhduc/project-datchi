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
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var composables_1 = require("@/composables");
var hardware_1 = require("@/composables/hardware");
var offline_1 = require("@/components/offline");
var enums_1 = require("@/types/thread/enums");
// Composables
var _h = (0, composables_1.useAllocations)(), allocations = _h.allocations, isLoading = _h.isLoading, fetchAllocations = _h.fetchAllocations, issueAlloc = _h.issueAllocation;
var snackbar = (0, composables_1.useSnackbar)();
var playBeep = (0, hardware_1.useAudioFeedback)().playBeep;
var offline = (0, composables_1.useOfflineOperation)();
// Conflict dialog state
var showConflictDialog = (0, vue_1.ref)(false);
// Refs
var mode = (0, vue_1.ref)('list');
var allocationCode = (0, vue_1.ref)('');
var selectedAllocation = (0, vue_1.ref)(null);
var coneBarcode = (0, vue_1.ref)('');
var issuedCones = (0, vue_1.ref)([]); // Stores cone PK IDs
var isSubmitting = (0, vue_1.ref)(false);
var coneInputRef = (0, vue_1.ref)(null);
// Hardware Scanner Integration
(0, hardware_1.useScanner)({
    onScan: function (barcode) {
        if (mode.value === 'allocation' && !selectedAllocation.value) {
            allocationCode.value = barcode;
            lookupAllocation();
        }
        else if (selectedAllocation.value) {
            coneBarcode.value = barcode;
            scanCone();
        }
    }
});
// Computed
var pendingAllocations = (0, vue_1.computed)(function () {
    return allocations.value.filter(function (a) {
        return a.status === enums_1.AllocationStatus.SOFT || a.status === enums_1.AllocationStatus.PENDING;
    });
});
var scanProgress = (0, vue_1.computed)(function () {
    var _a, _b;
    if (!((_b = (_a = selectedAllocation.value) === null || _a === void 0 ? void 0 : _a.allocated_cones) === null || _b === void 0 ? void 0 : _b.length))
        return 0;
    return issuedCones.value.length / selectedAllocation.value.allocated_cones.length;
});
var canIssue = (0, vue_1.computed)(function () {
    var _a, _b;
    if (!((_b = (_a = selectedAllocation.value) === null || _a === void 0 ? void 0 : _a.allocated_cones) === null || _b === void 0 ? void 0 : _b.length))
        return false;
    return issuedCones.value.length === selectedAllocation.value.allocated_cones.length;
});
// Methods
var getStatusLabel = function (status) {
    var _a;
    var labels = (_a = {},
        _a[enums_1.AllocationStatus.PENDING] = 'Đang chờ',
        _a[enums_1.AllocationStatus.SOFT] = 'Sẵn sàng',
        _a[enums_1.AllocationStatus.HARD] = 'Đã chốt',
        _a[enums_1.AllocationStatus.ISSUED] = 'Đã xuất',
        _a[enums_1.AllocationStatus.CANCELLED] = 'Đã hủy',
        _a[enums_1.AllocationStatus.WAITLISTED] = 'Chờ hàng',
        _a);
    return labels[status] || status;
};
var getStatusColor = function (status) {
    var _a;
    var colors = (_a = {},
        _a[enums_1.AllocationStatus.PENDING] = 'orange',
        _a[enums_1.AllocationStatus.SOFT] = 'blue',
        _a[enums_1.AllocationStatus.HARD] = 'indigo',
        _a[enums_1.AllocationStatus.ISSUED] = 'positive',
        _a[enums_1.AllocationStatus.CANCELLED] = 'grey',
        _a[enums_1.AllocationStatus.WAITLISTED] = 'purple',
        _a);
    return colors[status] || 'grey';
};
var lookupAllocation = function () {
    if (!allocationCode.value)
        return;
    var found = allocations.value.find(function (a) {
        var _a;
        return a.order_id.toLowerCase() === allocationCode.value.toLowerCase() ||
            ((_a = a.order_reference) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === allocationCode.value.toLowerCase();
    });
    if (found) {
        if (found.status !== enums_1.AllocationStatus.SOFT && found.status !== enums_1.AllocationStatus.PENDING) {
            snackbar.warning("\u0110\u01A1n n\u00E0y \u0111ang \u1EDF tr\u1EA1ng th\u00E1i ".concat(getStatusLabel(found.status)));
            playBeep('error');
        }
        else {
            selectAllocation(found);
            playBeep('success');
        }
    }
    else {
        snackbar.error('Không tìm thấy đơn phân bổ');
        playBeep('error');
    }
    allocationCode.value = '';
};
var selectAllocation = function (alloc) {
    selectedAllocation.value = alloc;
    issuedCones.value = [];
    // Focus cone input on next tick
    (0, vue_1.nextTick)(function () {
        var _a;
        (_a = coneInputRef.value) === null || _a === void 0 ? void 0 : _a.focus();
    });
};
var scanCone = function () {
    var _a, _b;
    if (!((_b = (_a = selectedAllocation.value) === null || _a === void 0 ? void 0 : _a.allocated_cones) === null || _b === void 0 ? void 0 : _b.length)) {
        coneBarcode.value = '';
        return;
    }
    var barcode = coneBarcode.value.trim();
    if (!barcode)
        return;
    // Find the cone in the allocated list
    var ac = selectedAllocation.value.allocated_cones.find(function (item) { var _a; return ((_a = item.cone) === null || _a === void 0 ? void 0 : _a.cone_id.toLowerCase()) === barcode.toLowerCase(); });
    if (ac) {
        if (issuedCones.value.includes(ac.cone_id)) {
            snackbar.info('Cuộn này đã được quét');
            playBeep('scan');
        }
        else {
            issuedCones.value.push(ac.cone_id);
            playBeep('success');
        }
    }
    else {
        snackbar.warning('Cuộn này không thuộc đơn phân bổ hiện tại');
        playBeep('error');
    }
    coneBarcode.value = '';
};
var handleIssueAllocation = function () { return __awaiter(void 0, void 0, void 0, function () {
    var allocationId_1, payload, result, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!selectedAllocation.value)
                    return [2 /*return*/];
                if (!canIssue.value) {
                    snackbar.warning('Vui lòng quét đủ số lượng cuộn trước khi xuất xưởng');
                    return [2 /*return*/];
                }
                isSubmitting.value = true;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 6, 7, 8]);
                allocationId_1 = selectedAllocation.value.id;
                payload = {
                    allocation_id: allocationId_1,
                    cone_ids: issuedCones.value,
                };
                return [4 /*yield*/, offline.execute({
                        type: 'issue',
                        onlineExecutor: function () { return issueAlloc(allocationId_1); },
                        payload: payload,
                        successMessage: 'Đã xuất xưởng thành công',
                        queuedMessage: 'Đã lưu thao tác xuất xưởng, sẽ đồng bộ khi có mạng',
                    })];
            case 2:
                result = _b.sent();
                if (!(result.success || result.queued)) return [3 /*break*/, 4];
                playBeep('success');
                // Reset state after success
                selectedAllocation.value = null;
                issuedCones.value = [];
                // Refresh list
                return [4 /*yield*/, fetchAllocations({ status: enums_1.AllocationStatus.SOFT })];
            case 3:
                // Refresh list
                _b.sent();
                return [3 /*break*/, 5];
            case 4:
                playBeep('error');
                _b.label = 5;
            case 5: return [3 /*break*/, 8];
            case 6:
                _a = _b.sent();
                playBeep('error');
                return [3 /*break*/, 8];
            case 7:
                isSubmitting.value = false;
                return [7 /*endfinally*/];
            case 8: return [2 /*return*/];
        }
    });
}); };
// Initialization
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    fetchAllocations({ status: enums_1.AllocationStatus.SOFT }),
                    offline.initialize(),
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
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPage | typeof __VLS_components.QPage | typeof __VLS_components.qPage | typeof __VLS_components.QPage} */
qPage;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ padding: true }, { class: "mobile-issue-page" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ padding: true }, { class: "mobile-issue-page" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['mobile-issue-page']} */ ;
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.OfflineSyncBanner} */
offline_1.OfflineSyncBanner;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ 'onShowConflicts': {} })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ 'onShowConflicts': {} })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12;
var __VLS_13 = ({ showConflicts: {} },
    { onShowConflicts: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showConflictDialog = true;
            // @ts-ignore
            [showConflictDialog,];
        } });
var __VLS_10;
var __VLS_11;
var __VLS_14;
/** @ts-ignore @type {typeof __VLS_components.ConflictDialog} */
offline_1.ConflictDialog;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
    modelValue: (__VLS_ctx.showConflictDialog),
}));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showConflictDialog),
    }], __VLS_functionalComponentArgsRest(__VLS_15), false));
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.qBtnToggle | typeof __VLS_components.QBtnToggle} */
qBtnToggle;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign(__assign({ modelValue: (__VLS_ctx.mode), spread: true }, { class: "q-mb-md" }), { toggleColor: "primary", unelevated: true, options: ([
        { label: 'Quét Đơn', value: 'allocation' },
        { label: 'Danh Sách', value: 'list' }
    ]) })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.mode), spread: true }, { class: "q-mb-md" }), { toggleColor: "primary", unelevated: true, options: ([
            { label: 'Quét Đơn', value: 'allocation' },
            { label: 'Danh Sách', value: 'list' }
        ]) })], __VLS_functionalComponentArgsRest(__VLS_20), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
if (__VLS_ctx.mode === 'allocation') {
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24(__assign({ class: "q-mb-md shadow-2 border-radius-md" })));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([__assign({ class: "q-mb-md shadow-2 border-radius-md" })], __VLS_functionalComponentArgsRest(__VLS_25), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-radius-md']} */ ;
    var __VLS_29 = __VLS_27.slots.default;
    var __VLS_30 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({}));
    var __VLS_32 = __VLS_31.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_31), false));
    var __VLS_35 = __VLS_33.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_36 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36(__assign({ name: "assignment" }, { class: "q-mr-xs text-primary" })));
    var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([__assign({ name: "assignment" }, { class: "q-mr-xs text-primary" })], __VLS_functionalComponentArgsRest(__VLS_37), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    var __VLS_41 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41(__assign(__assign(__assign({ 'onKeyup': {} }, { modelValue: (__VLS_ctx.allocationCode), outlined: true, dense: true, placeholder: "Quét mã đơn..." }), { class: "scan-input" }), { autofocus: true })));
    var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onKeyup': {} }, { modelValue: (__VLS_ctx.allocationCode), outlined: true, dense: true, placeholder: "Quét mã đơn..." }), { class: "scan-input" }), { autofocus: true })], __VLS_functionalComponentArgsRest(__VLS_42), false));
    var __VLS_46 = void 0;
    var __VLS_47 = ({ keyup: {} },
        { onKeyup: (__VLS_ctx.lookupAllocation) });
    /** @type {__VLS_StyleScopedClasses['scan-input']} */ ;
    var __VLS_48 = __VLS_44.slots.default;
    {
        var __VLS_49 = __VLS_44.slots.append;
        var __VLS_50 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
            name: "qr_code_scanner",
        }));
        var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{
                name: "qr_code_scanner",
            }], __VLS_functionalComponentArgsRest(__VLS_51), false));
        // @ts-ignore
        [showConflictDialog, mode, mode, allocationCode, lookupAllocation,];
    }
    // @ts-ignore
    [];
    var __VLS_44;
    var __VLS_45;
    // @ts-ignore
    [];
    var __VLS_33;
    // @ts-ignore
    [];
    var __VLS_27;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm text-grey-8" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
    var __VLS_55 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55(__assign({ separator: true, bordered: true }, { class: "rounded-borders q-mb-md" })));
    var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([__assign({ separator: true, bordered: true }, { class: "rounded-borders q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_56), false));
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_60 = __VLS_58.slots.default;
    var _loop_1 = function (alloc) {
        var __VLS_61 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61(__assign(__assign({ 'onClick': {} }, { key: (alloc.id), clickable: true }), { class: ({ 'bg-blue-1': ((_a = __VLS_ctx.selectedAllocation) === null || _a === void 0 ? void 0 : _a.id) === alloc.id }) })));
        var __VLS_63 = __VLS_62.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { key: (alloc.id), clickable: true }), { class: ({ 'bg-blue-1': ((_b = __VLS_ctx.selectedAllocation) === null || _b === void 0 ? void 0 : _b.id) === alloc.id }) })], __VLS_functionalComponentArgsRest(__VLS_62), false));
        var __VLS_66 = void 0;
        var __VLS_67 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.mode === 'allocation'))
                        return;
                    __VLS_ctx.selectAllocation(alloc);
                    // @ts-ignore
                    [pendingAllocations, selectedAllocation, selectAllocation,];
                } });
        __VLS_asFunctionalDirective(__VLS_directives.vRipple, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
        /** @type {__VLS_StyleScopedClasses['bg-blue-1']} */ ;
        var __VLS_68 = __VLS_64.slots.default;
        var __VLS_69 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({}));
        var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_70), false));
        var __VLS_74 = __VLS_72.slots.default;
        var __VLS_75 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75(__assign({ class: "text-weight-bold" })));
        var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([__assign({ class: "text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_76), false));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        var __VLS_80 = __VLS_78.slots.default;
        (alloc.order_id);
        // @ts-ignore
        [vRipple,];
        var __VLS_81 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_82 = __VLS_asFunctionalComponent1(__VLS_81, new __VLS_81({
            caption: true,
        }));
        var __VLS_83 = __VLS_82.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_82), false));
        var __VLS_86 = __VLS_84.slots.default;
        ((_c = alloc.thread_type) === null || _c === void 0 ? void 0 : _c.name);
        (alloc.requested_meters);
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        var __VLS_87 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_88 = __VLS_asFunctionalComponent1(__VLS_87, new __VLS_87({
            side: true,
        }));
        var __VLS_89 = __VLS_88.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_88), false));
        var __VLS_92 = __VLS_90.slots.default;
        var __VLS_93 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_94 = __VLS_asFunctionalComponent1(__VLS_93, new __VLS_93({
            color: (__VLS_ctx.getStatusColor(alloc.status)),
        }));
        var __VLS_95 = __VLS_94.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.getStatusColor(alloc.status)),
            }], __VLS_functionalComponentArgsRest(__VLS_94), false));
        var __VLS_98 = __VLS_96.slots.default;
        (__VLS_ctx.getStatusLabel(alloc.status));
        // @ts-ignore
        [getStatusColor, getStatusLabel,];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_78, __VLS_84, __VLS_72, __VLS_96, __VLS_90, __VLS_64, __VLS_65;
    for (var _i = 0, _j = __VLS_vFor((__VLS_ctx.pendingAllocations)); _i < _j.length; _i++) {
        var alloc = _j[_i][0];
        _loop_1(alloc);
    }
    if (!__VLS_ctx.pendingAllocations.length && !__VLS_ctx.isLoading) {
        var __VLS_99 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({}));
        var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_100), false));
        var __VLS_104 = __VLS_102.slots.default;
        var __VLS_105 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ class: "text-center text-grey-6 q-pa-md" })));
        var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ class: "text-center text-grey-6 q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        var __VLS_110 = __VLS_108.slots.default;
        var __VLS_111 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111(__assign({ name: "inbox", size: "32px" }, { class: "q-mb-xs" })));
        var __VLS_113 = __VLS_112.apply(void 0, __spreadArray([__assign({ name: "inbox", size: "32px" }, { class: "q-mb-xs" })], __VLS_functionalComponentArgsRest(__VLS_112), false));
        /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        // @ts-ignore
        [pendingAllocations, isLoading,];
        var __VLS_108;
        // @ts-ignore
        [];
        var __VLS_102;
    }
    if (__VLS_ctx.isLoading) {
        var __VLS_116 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({}));
        var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_117), false));
        var __VLS_121 = __VLS_119.slots.default;
        var __VLS_122 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122(__assign({ class: "text-center text-grey-6 q-pa-md" })));
        var __VLS_124 = __VLS_123.apply(void 0, __spreadArray([__assign({ class: "text-center text-grey-6 q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_123), false));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        var __VLS_127 = __VLS_125.slots.default;
        var __VLS_128 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
        qSpinnerDots;
        // @ts-ignore
        var __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({
            color: "primary",
            size: "2em",
        }));
        var __VLS_130 = __VLS_129.apply(void 0, __spreadArray([{
                color: "primary",
                size: "2em",
            }], __VLS_functionalComponentArgsRest(__VLS_129), false));
        // @ts-ignore
        [isLoading,];
        var __VLS_125;
        // @ts-ignore
        [];
        var __VLS_119;
    }
    // @ts-ignore
    [];
    var __VLS_58;
}
var __VLS_133;
/** @ts-ignore @type {typeof __VLS_components.transition | typeof __VLS_components.Transition | typeof __VLS_components.transition | typeof __VLS_components.Transition} */
transition;
// @ts-ignore
var __VLS_134 = __VLS_asFunctionalComponent1(__VLS_133, new __VLS_133({
    appear: true,
    enterActiveClass: "animated fadeIn",
    leaveActiveClass: "animated fadeOut",
}));
var __VLS_135 = __VLS_134.apply(void 0, __spreadArray([{
        appear: true,
        enterActiveClass: "animated fadeIn",
        leaveActiveClass: "animated fadeOut",
    }], __VLS_functionalComponentArgsRest(__VLS_134), false));
var __VLS_138 = __VLS_136.slots.default;
if (__VLS_ctx.selectedAllocation) {
    var __VLS_139 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_140 = __VLS_asFunctionalComponent1(__VLS_139, new __VLS_139(__assign({ class: "q-mb-md bg-primary-1 border-primary" })));
    var __VLS_141 = __VLS_140.apply(void 0, __spreadArray([__assign({ class: "q-mb-md bg-primary-1 border-primary" })], __VLS_functionalComponentArgsRest(__VLS_140), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-primary-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-primary']} */ ;
    var __VLS_144 = __VLS_142.slots.default;
    var __VLS_145 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_146 = __VLS_asFunctionalComponent1(__VLS_145, new __VLS_145(__assign({ class: "q-pb-none" })));
    var __VLS_147 = __VLS_146.apply(void 0, __spreadArray([__assign({ class: "q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_146), false));
    /** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
    var __VLS_150 = __VLS_148.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "ellipsis" }));
    /** @type {__VLS_StyleScopedClasses['ellipsis']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (__VLS_ctx.selectedAllocation.order_id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    ((_d = __VLS_ctx.selectedAllocation.thread_type) === null || _d === void 0 ? void 0 : _d.name);
    (__VLS_ctx.selectedAllocation.requested_meters);
    var __VLS_151 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_152 = __VLS_asFunctionalComponent1(__VLS_151, new __VLS_151(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", color: "grey-7" })));
    var __VLS_153 = __VLS_152.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", color: "grey-7" })], __VLS_functionalComponentArgsRest(__VLS_152), false));
    var __VLS_156 = void 0;
    var __VLS_157 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.selectedAllocation))
                    return;
                __VLS_ctx.selectedAllocation = null;
                // @ts-ignore
                [selectedAllocation, selectedAllocation, selectedAllocation, selectedAllocation, selectedAllocation,];
            } });
    var __VLS_154;
    var __VLS_155;
    // @ts-ignore
    [];
    var __VLS_148;
    if ((_e = __VLS_ctx.selectedAllocation.allocated_cones) === null || _e === void 0 ? void 0 : _e.length) {
        var __VLS_158 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
        qCardSection;
        // @ts-ignore
        var __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158({}));
        var __VLS_160 = __VLS_159.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_159), false));
        var __VLS_163 = __VLS_161.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm row items-center" }));
        /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        var __VLS_164 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_165 = __VLS_asFunctionalComponent1(__VLS_164, new __VLS_164(__assign({ name: "list" }, { class: "q-mr-xs" })));
        var __VLS_166 = __VLS_165.apply(void 0, __spreadArray([__assign({ name: "list" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_165), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
        var __VLS_169 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
        qList;
        // @ts-ignore
        var __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169(__assign({ dense: true, separator: true }, { class: "rounded-borders" })));
        var __VLS_171 = __VLS_170.apply(void 0, __spreadArray([__assign({ dense: true, separator: true }, { class: "rounded-borders" })], __VLS_functionalComponentArgsRest(__VLS_170), false));
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        var __VLS_174 = __VLS_172.slots.default;
        for (var _k = 0, _l = __VLS_vFor((__VLS_ctx.selectedAllocation.allocated_cones)); _k < _l.length; _k++) {
            var ac = _l[_k][0];
            var __VLS_175 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
            qItem;
            // @ts-ignore
            var __VLS_176 = __VLS_asFunctionalComponent1(__VLS_175, new __VLS_175({
                key: (ac.id),
            }));
            var __VLS_177 = __VLS_176.apply(void 0, __spreadArray([{
                    key: (ac.id),
                }], __VLS_functionalComponentArgsRest(__VLS_176), false));
            var __VLS_180 = __VLS_178.slots.default;
            var __VLS_181 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_182 = __VLS_asFunctionalComponent1(__VLS_181, new __VLS_181({
                avatar: true,
            }));
            var __VLS_183 = __VLS_182.apply(void 0, __spreadArray([{
                    avatar: true,
                }], __VLS_functionalComponentArgsRest(__VLS_182), false));
            var __VLS_186 = __VLS_184.slots.default;
            var __VLS_187 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_188 = __VLS_asFunctionalComponent1(__VLS_187, new __VLS_187({
                name: "inventory_2",
                color: "primary",
            }));
            var __VLS_189 = __VLS_188.apply(void 0, __spreadArray([{
                    name: "inventory_2",
                    color: "primary",
                }], __VLS_functionalComponentArgsRest(__VLS_188), false));
            // @ts-ignore
            [selectedAllocation, selectedAllocation,];
            var __VLS_184;
            var __VLS_192 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_193 = __VLS_asFunctionalComponent1(__VLS_192, new __VLS_192({}));
            var __VLS_194 = __VLS_193.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_193), false));
            var __VLS_197 = __VLS_195.slots.default;
            var __VLS_198 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
            qItemLabel;
            // @ts-ignore
            var __VLS_199 = __VLS_asFunctionalComponent1(__VLS_198, new __VLS_198(__assign({ class: "text-weight-medium" })));
            var __VLS_200 = __VLS_199.apply(void 0, __spreadArray([__assign({ class: "text-weight-medium" })], __VLS_functionalComponentArgsRest(__VLS_199), false));
            /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
            var __VLS_203 = __VLS_201.slots.default;
            ((_f = ac.cone) === null || _f === void 0 ? void 0 : _f.cone_id);
            // @ts-ignore
            [];
            var __VLS_201;
            var __VLS_204 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
            qItemLabel;
            // @ts-ignore
            var __VLS_205 = __VLS_asFunctionalComponent1(__VLS_204, new __VLS_204({
                caption: true,
            }));
            var __VLS_206 = __VLS_205.apply(void 0, __spreadArray([{
                    caption: true,
                }], __VLS_functionalComponentArgsRest(__VLS_205), false));
            var __VLS_209 = __VLS_207.slots.default;
            (ac.allocated_meters);
            // @ts-ignore
            [];
            var __VLS_207;
            // @ts-ignore
            [];
            var __VLS_195;
            var __VLS_210 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_211 = __VLS_asFunctionalComponent1(__VLS_210, new __VLS_210({
                side: true,
            }));
            var __VLS_212 = __VLS_211.apply(void 0, __spreadArray([{
                    side: true,
                }], __VLS_functionalComponentArgsRest(__VLS_211), false));
            var __VLS_215 = __VLS_213.slots.default;
            var __VLS_216 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_217 = __VLS_asFunctionalComponent1(__VLS_216, new __VLS_216({
                name: (__VLS_ctx.issuedCones.includes(ac.cone_id) ? 'check_circle' : 'radio_button_unchecked'),
                color: (__VLS_ctx.issuedCones.includes(ac.cone_id) ? 'positive' : 'grey-4'),
                size: "24px",
            }));
            var __VLS_218 = __VLS_217.apply(void 0, __spreadArray([{
                    name: (__VLS_ctx.issuedCones.includes(ac.cone_id) ? 'check_circle' : 'radio_button_unchecked'),
                    color: (__VLS_ctx.issuedCones.includes(ac.cone_id) ? 'positive' : 'grey-4'),
                    size: "24px",
                }], __VLS_functionalComponentArgsRest(__VLS_217), false));
            // @ts-ignore
            [issuedCones, issuedCones,];
            var __VLS_213;
            // @ts-ignore
            [];
            var __VLS_178;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_172;
        // @ts-ignore
        [];
        var __VLS_161;
    }
    // @ts-ignore
    [];
    var __VLS_142;
}
// @ts-ignore
[];
var __VLS_136;
if (__VLS_ctx.selectedAllocation) {
    var __VLS_221 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221(__assign({ class: "q-mb-md shadow-2 border-radius-md" })));
    var __VLS_223 = __VLS_222.apply(void 0, __spreadArray([__assign({ class: "q-mb-md shadow-2 border-radius-md" })], __VLS_functionalComponentArgsRest(__VLS_222), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-2']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-radius-md']} */ ;
    var __VLS_226 = __VLS_224.slots.default;
    var __VLS_227 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_228 = __VLS_asFunctionalComponent1(__VLS_227, new __VLS_227({}));
    var __VLS_229 = __VLS_228.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_228), false));
    var __VLS_232 = __VLS_230.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_233 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_234 = __VLS_asFunctionalComponent1(__VLS_233, new __VLS_233(__assign({ name: "qr_code_scanner" }, { class: "q-mr-xs text-primary" })));
    var __VLS_235 = __VLS_234.apply(void 0, __spreadArray([__assign({ name: "qr_code_scanner" }, { class: "q-mr-xs text-primary" })], __VLS_functionalComponentArgsRest(__VLS_234), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    var __VLS_238 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_239 = __VLS_asFunctionalComponent1(__VLS_238, new __VLS_238(__assign(__assign({ 'onKeyup': {} }, { ref: "coneInputRef", modelValue: (__VLS_ctx.coneBarcode), outlined: true, dense: true, placeholder: "Quét mã cuộn..." }), { class: "scan-input" })));
    var __VLS_240 = __VLS_239.apply(void 0, __spreadArray([__assign(__assign({ 'onKeyup': {} }, { ref: "coneInputRef", modelValue: (__VLS_ctx.coneBarcode), outlined: true, dense: true, placeholder: "Quét mã cuộn..." }), { class: "scan-input" })], __VLS_functionalComponentArgsRest(__VLS_239), false));
    var __VLS_243 = void 0;
    var __VLS_244 = ({ keyup: {} },
        { onKeyup: (__VLS_ctx.scanCone) });
    var __VLS_245 = {};
    /** @type {__VLS_StyleScopedClasses['scan-input']} */ ;
    var __VLS_247 = __VLS_241.slots.default;
    {
        var __VLS_248 = __VLS_241.slots.append;
        var __VLS_249 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_250 = __VLS_asFunctionalComponent1(__VLS_249, new __VLS_249({
            name: "qr_code",
        }));
        var __VLS_251 = __VLS_250.apply(void 0, __spreadArray([{
                name: "qr_code",
            }], __VLS_functionalComponentArgsRest(__VLS_250), false));
        // @ts-ignore
        [selectedAllocation, coneBarcode, scanCone,];
    }
    // @ts-ignore
    [];
    var __VLS_241;
    var __VLS_242;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md flex justify-between items-center" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-bold text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (__VLS_ctx.issuedCones.length);
    (((_g = __VLS_ctx.selectedAllocation.allocated_cones) === null || _g === void 0 ? void 0 : _g.length) || 0);
    var __VLS_254 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qLinearProgress | typeof __VLS_components.QLinearProgress} */
    qLinearProgress;
    // @ts-ignore
    var __VLS_255 = __VLS_asFunctionalComponent1(__VLS_254, new __VLS_254(__assign(__assign(__assign({ value: (__VLS_ctx.scanProgress), color: "primary" }, { class: "q-mt-xs" }), { style: {} }), { rounded: true })));
    var __VLS_256 = __VLS_255.apply(void 0, __spreadArray([__assign(__assign(__assign({ value: (__VLS_ctx.scanProgress), color: "primary" }, { class: "q-mt-xs" }), { style: {} }), { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_255), false));
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    // @ts-ignore
    [selectedAllocation, issuedCones, scanProgress,];
    var __VLS_230;
    // @ts-ignore
    [];
    var __VLS_224;
}
if (__VLS_ctx.selectedAllocation) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-y-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-gutter-y-sm']} */ ;
    var __VLS_259 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_260 = __VLS_asFunctionalComponent1(__VLS_259, new __VLS_259(__assign(__assign(__assign({ 'onClick': {} }, { color: "positive", size: "lg" }), { class: "full-width confirm-btn shadow-3" }), { icon: "local_shipping", label: "Xác Nhận Xuất Xưởng", loading: (__VLS_ctx.isSubmitting), disabled: (!__VLS_ctx.canIssue), unelevated: true })));
    var __VLS_261 = __VLS_260.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { color: "positive", size: "lg" }), { class: "full-width confirm-btn shadow-3" }), { icon: "local_shipping", label: "Xác Nhận Xuất Xưởng", loading: (__VLS_ctx.isSubmitting), disabled: (!__VLS_ctx.canIssue), unelevated: true })], __VLS_functionalComponentArgsRest(__VLS_260), false));
    var __VLS_264 = void 0;
    var __VLS_265 = ({ click: {} },
        { onClick: (__VLS_ctx.handleIssueAllocation) });
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['confirm-btn']} */ ;
    /** @type {__VLS_StyleScopedClasses['shadow-3']} */ ;
    var __VLS_262;
    var __VLS_263;
    if (!__VLS_ctx.canIssue) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-negative text-center q-px-md" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
    }
}
// @ts-ignore
[selectedAllocation, isSubmitting, canIssue, canIssue, handleIssueAllocation,];
var __VLS_3;
// @ts-ignore
var __VLS_246 = __VLS_245;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
