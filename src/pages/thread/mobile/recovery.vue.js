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
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var composables_1 = require("@/composables");
var hardware_1 = require("@/composables/hardware");
var offline_1 = require("@/components/offline");
var enums_1 = require("@/types/thread/enums");
var _k = (0, composables_1.useRecovery)(), recoveries = _k.recoveries, fetchRecoveries = _k.fetchRecoveries, initiateReturn = _k.initiateReturn, weighCone = _k.weighCone, confirmRecovery = _k.confirmRecovery, writeOffCone = _k.writeOffCone;
var snackbar = (0, composables_1.useSnackbar)();
var scale = (0, hardware_1.useScale)();
var playBeep = (0, hardware_1.useAudioFeedback)().playBeep;
var offline = (0, composables_1.useOfflineOperation)();
// Conflict dialog state
var showConflictDialog = (0, vue_1.ref)(false);
(0, hardware_1.useScanner)({
    onScan: function (barcode) {
        coneBarcode.value = barcode;
        handleInitiateReturn();
        playBeep('scan');
    }
});
var coneBarcode = (0, vue_1.ref)('');
var activeRecovery = (0, vue_1.ref)(null);
var showManualWeight = (0, vue_1.ref)(false);
var manualWeight = (0, vue_1.ref)(null);
var isWeighing = (0, vue_1.ref)(false);
var isConfirming = (0, vue_1.ref)(false);
var showWriteOffDialog = (0, vue_1.ref)(false);
var writeOffReason = (0, vue_1.ref)('');
var approvedBy = (0, vue_1.ref)('');
var pendingRecoveries = (0, vue_1.computed)(function () {
    return recoveries.value.filter(function (r) {
        return r.status === enums_1.RecoveryStatus.INITIATED ||
            r.status === enums_1.RecoveryStatus.PENDING_WEIGH ||
            r.status === enums_1.RecoveryStatus.WEIGHED;
    });
});
var needsWeighing = (0, vue_1.computed)(function () {
    var _a, _b;
    return ((_a = activeRecovery.value) === null || _a === void 0 ? void 0 : _a.status) === enums_1.RecoveryStatus.INITIATED ||
        ((_b = activeRecovery.value) === null || _b === void 0 ? void 0 : _b.status) === enums_1.RecoveryStatus.PENDING_WEIGH;
});
var currentWeight = (0, vue_1.computed)(function () {
    return scale.isConnected.value ? scale.currentWeight.value : manualWeight.value;
});
var calculatedMeters = (0, vue_1.computed)(function () {
    var _a, _b, _c;
    if (!currentWeight.value || !((_c = (_b = (_a = activeRecovery.value) === null || _a === void 0 ? void 0 : _a.cone) === null || _b === void 0 ? void 0 : _b.thread_type) === null || _c === void 0 ? void 0 : _c.density_grams_per_meter)) {
        return 0;
    }
    return (currentWeight.value - (activeRecovery.value.tare_weight_grams || 0)) / activeRecovery.value.cone.thread_type.density_grams_per_meter;
});
var calculatedConsumption = (0, vue_1.computed)(function () {
    var _a;
    if (!((_a = activeRecovery.value) === null || _a === void 0 ? void 0 : _a.original_meters))
        return 0;
    return activeRecovery.value.original_meters - calculatedMeters.value;
});
var formatNumber = function (val) {
    if (val === null || val === undefined)
        return '0';
    return val.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
};
var getStatusColor = function (status) {
    var _a;
    var colors = (_a = {},
        _a[enums_1.RecoveryStatus.INITIATED] = 'info',
        _a[enums_1.RecoveryStatus.PENDING_WEIGH] = 'warning',
        _a[enums_1.RecoveryStatus.WEIGHED] = 'blue',
        _a[enums_1.RecoveryStatus.CONFIRMED] = 'positive',
        _a[enums_1.RecoveryStatus.WRITTEN_OFF] = 'negative',
        _a[enums_1.RecoveryStatus.REJECTED] = 'grey',
        _a);
    return colors[status] || 'grey';
};
var getStatusLabel = function (status) {
    var _a;
    var labels = (_a = {},
        _a[enums_1.RecoveryStatus.INITIATED] = 'Đã khởi tạo',
        _a[enums_1.RecoveryStatus.PENDING_WEIGH] = 'Chờ cân',
        _a[enums_1.RecoveryStatus.WEIGHED] = 'Đã cân',
        _a[enums_1.RecoveryStatus.CONFIRMED] = 'Đã xác nhận',
        _a[enums_1.RecoveryStatus.WRITTEN_OFF] = 'Đã loại bỏ',
        _a[enums_1.RecoveryStatus.REJECTED] = 'Từ chối',
        _a);
    return labels[status] || status;
};
var handleInitiateReturn = function () { return __awaiter(void 0, void 0, void 0, function () {
    var payload, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!coneBarcode.value)
                    return [2 /*return*/];
                payload = { cone_id: coneBarcode.value };
                return [4 /*yield*/, offline.execute({
                        type: 'recovery',
                        onlineExecutor: function () { return initiateReturn(payload); },
                        payload: payload,
                        successMessage: 'Đã tạo yêu cầu hoàn trả',
                        queuedMessage: 'Đã lưu yêu cầu hoàn trả, sẽ đồng bộ khi có mạng',
                    })];
            case 1:
                result = _a.sent();
                if (result.success && result.data) {
                    activeRecovery.value = result.data;
                    playBeep('success');
                }
                else if (result.queued) {
                    playBeep('success');
                    snackbar.info('Yêu cầu hoàn trả đã được lưu offline');
                }
                else {
                    playBeep('error');
                }
                coneBarcode.value = '';
                return [2 /*return*/];
        }
    });
}); };
var selectRecovery = function (recovery) {
    activeRecovery.value = recovery;
};
var handleWeightSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var payload, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!activeRecovery.value || !currentWeight.value)
                    return [2 /*return*/];
                isWeighing.value = true;
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 3, 4]);
                payload = {
                    recovery_id: activeRecovery.value.id,
                    weight_grams: currentWeight.value,
                };
                return [4 /*yield*/, offline.execute({
                        type: 'recovery',
                        onlineExecutor: function () { return weighCone(activeRecovery.value.id, { weight_grams: currentWeight.value }); },
                        payload: payload,
                        successMessage: 'Đã lưu trọng lượng',
                        queuedMessage: 'Đã lưu trọng lượng, sẽ đồng bộ khi có mạng',
                    })];
            case 2:
                result = _a.sent();
                if (result.success && result.data) {
                    activeRecovery.value = result.data;
                    playBeep('success');
                }
                else if (result.queued) {
                    playBeep('success');
                }
                return [3 /*break*/, 4];
            case 3:
                isWeighing.value = false;
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); };
var handleConfirmRecovery = function () { return __awaiter(void 0, void 0, void 0, function () {
    var payload, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!activeRecovery.value)
                    return [2 /*return*/];
                isConfirming.value = true;
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 5, 6]);
                payload = {
                    recovery_id: activeRecovery.value.id,
                    action: 'confirm',
                };
                return [4 /*yield*/, offline.execute({
                        type: 'recovery',
                        onlineExecutor: function () { return confirmRecovery(activeRecovery.value.id); },
                        payload: payload,
                        successMessage: 'Đã xác nhận nhập kho thành công',
                        queuedMessage: 'Đã lưu xác nhận, sẽ đồng bộ khi có mạng',
                    })];
            case 2:
                result = _a.sent();
                if (!(result.success || result.queued)) return [3 /*break*/, 4];
                playBeep('success');
                activeRecovery.value = null;
                return [4 /*yield*/, fetchRecoveries()];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                isConfirming.value = false;
                return [7 /*endfinally*/];
            case 6: return [2 /*return*/];
        }
    });
}); };
var handleWriteOffSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var payload, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!activeRecovery.value)
                    return [2 /*return*/];
                payload = {
                    recovery_id: activeRecovery.value.id,
                    action: 'write_off',
                    reason: writeOffReason.value,
                    approved_by: approvedBy.value,
                };
                return [4 /*yield*/, offline.execute({
                        type: 'recovery',
                        onlineExecutor: function () { return writeOffCone(activeRecovery.value.id, {
                            reason: writeOffReason.value,
                            approved_by: approvedBy.value,
                        }); },
                        payload: payload,
                        successMessage: 'Đã loại bỏ cuộn chỉ thành công',
                        queuedMessage: 'Đã lưu yêu cầu loại bỏ, sẽ đồng bộ khi có mạng',
                    })];
            case 1:
                result = _a.sent();
                if (!(result.success || result.queued)) return [3 /*break*/, 3];
                playBeep('success');
                showWriteOffDialog.value = false;
                activeRecovery.value = null;
                return [4 /*yield*/, fetchRecoveries()];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    fetchRecoveries(),
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
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ padding: true }, { class: "mobile-recovery-page" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ padding: true }, { class: "mobile-recovery-page" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['mobile-recovery-page']} */ ;
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
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ class: "q-mb-md" })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_20), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_24 = __VLS_22.slots.default;
var __VLS_25;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({}));
var __VLS_27 = __VLS_26.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_26), false));
var __VLS_30 = __VLS_28.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-sm" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
var __VLS_31;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31(__assign({ name: "qr_code_scanner" }, { class: "q-mr-xs" })));
var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([__assign({ name: "qr_code_scanner" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_32), false));
/** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
var __VLS_36;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36(__assign(__assign({ 'onKeyup': {} }, { modelValue: (__VLS_ctx.coneBarcode), outlined: true, dense: true, placeholder: "Quét mã cuộn..." }), { class: "scan-input" })));
var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([__assign(__assign({ 'onKeyup': {} }, { modelValue: (__VLS_ctx.coneBarcode), outlined: true, dense: true, placeholder: "Quét mã cuộn..." }), { class: "scan-input" })], __VLS_functionalComponentArgsRest(__VLS_37), false));
var __VLS_41;
var __VLS_42 = ({ keyup: {} },
    { onKeyup: (__VLS_ctx.handleInitiateReturn) });
/** @type {__VLS_StyleScopedClasses['scan-input']} */ ;
var __VLS_43 = __VLS_39.slots.default;
{
    var __VLS_44 = __VLS_39.slots.append;
    var __VLS_45 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45(__assign({ 'onClick': {} }, { flat: true, round: true, icon: "search" })));
    var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, icon: "search" })], __VLS_functionalComponentArgsRest(__VLS_46), false));
    var __VLS_50 = void 0;
    var __VLS_51 = ({ click: {} },
        { onClick: (__VLS_ctx.handleInitiateReturn) });
    var __VLS_48;
    var __VLS_49;
    // @ts-ignore
    [showConflictDialog, coneBarcode, handleInitiateReturn, handleInitiateReturn,];
}
// @ts-ignore
[];
var __VLS_39;
var __VLS_40;
// @ts-ignore
[];
var __VLS_28;
// @ts-ignore
[];
var __VLS_22;
if (__VLS_ctx.activeRecovery) {
    var __VLS_52 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52(__assign({ class: "q-mb-md" })));
    var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([__assign({ class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_53), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_57 = __VLS_55.slots.default;
    var __VLS_58 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({}));
    var __VLS_60 = __VLS_59.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_59), false));
    var __VLS_63 = __VLS_61.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-dot" }, { style: ({ backgroundColor: ((_c = (_b = (_a = __VLS_ctx.activeRecovery.cone) === null || _a === void 0 ? void 0 : _a.thread_type) === null || _b === void 0 ? void 0 : _b.color_data) === null || _c === void 0 ? void 0 : _c.hex_code) || '#ccc' }) }));
    /** @type {__VLS_StyleScopedClasses['color-dot']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    ((_d = __VLS_ctx.activeRecovery.cone) === null || _d === void 0 ? void 0 : _d.cone_id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    ((_f = (_e = __VLS_ctx.activeRecovery.cone) === null || _e === void 0 ? void 0 : _e.thread_type) === null || _f === void 0 ? void 0 : _f.name);
    (__VLS_ctx.formatNumber(__VLS_ctx.activeRecovery.original_meters));
    var __VLS_64 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
        color: (__VLS_ctx.getStatusColor(__VLS_ctx.activeRecovery.status)),
    }));
    var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getStatusColor(__VLS_ctx.activeRecovery.status)),
        }], __VLS_functionalComponentArgsRest(__VLS_65), false));
    var __VLS_69 = __VLS_67.slots.default;
    (__VLS_ctx.getStatusLabel(__VLS_ctx.activeRecovery.status));
    // @ts-ignore
    [activeRecovery, activeRecovery, activeRecovery, activeRecovery, activeRecovery, activeRecovery, activeRecovery, formatNumber, getStatusColor, getStatusLabel,];
    var __VLS_67;
    // @ts-ignore
    [];
    var __VLS_61;
    // @ts-ignore
    [];
    var __VLS_55;
}
if (__VLS_ctx.activeRecovery && __VLS_ctx.needsWeighing) {
    var __VLS_70 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70(__assign({ class: "q-mb-md" })));
    var __VLS_72 = __VLS_71.apply(void 0, __spreadArray([__assign({ class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_71), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_75 = __VLS_73.slots.default;
    var __VLS_76 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_77 = __VLS_asFunctionalComponent1(__VLS_76, new __VLS_76({}));
    var __VLS_78 = __VLS_77.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_77), false));
    var __VLS_81 = __VLS_79.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_82 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82(__assign({ name: "scale" }, { class: "q-mr-xs" })));
    var __VLS_84 = __VLS_83.apply(void 0, __spreadArray([__assign({ name: "scale" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_83), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    if (!__VLS_ctx.scale.isConnected.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm q-mb-md" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
        /** @type {__VLS_StyleScopedClasses['col']} */ ;
        var __VLS_87 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_88 = __VLS_asFunctionalComponent1(__VLS_87, new __VLS_87(__assign(__assign(__assign({ 'onClick': {} }, { outline: true, color: "primary", icon: "usb", label: "Kết Nối Cân" }), { class: "full-width" }), { loading: (__VLS_ctx.scale.isConnecting.value) })));
        var __VLS_89 = __VLS_88.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { outline: true, color: "primary", icon: "usb", label: "Kết Nối Cân" }), { class: "full-width" }), { loading: (__VLS_ctx.scale.isConnecting.value) })], __VLS_functionalComponentArgsRest(__VLS_88), false));
        var __VLS_92 = void 0;
        var __VLS_93 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.activeRecovery && __VLS_ctx.needsWeighing))
                        return;
                    if (!(!__VLS_ctx.scale.isConnected.value))
                        return;
                    __VLS_ctx.scale.connect();
                    // @ts-ignore
                    [activeRecovery, needsWeighing, scale, scale, scale,];
                } });
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        var __VLS_90;
        var __VLS_91;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
        /** @type {__VLS_StyleScopedClasses['col']} */ ;
        var __VLS_94 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94(__assign(__assign({ 'onClick': {} }, { outline: true, color: "grey", icon: "edit", label: "Nhập Tay" }), { class: "full-width" })));
        var __VLS_96 = __VLS_95.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { outline: true, color: "grey", icon: "edit", label: "Nhập Tay" }), { class: "full-width" })], __VLS_functionalComponentArgsRest(__VLS_95), false));
        var __VLS_99 = void 0;
        var __VLS_100 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.activeRecovery && __VLS_ctx.needsWeighing))
                        return;
                    if (!(!__VLS_ctx.scale.isConnected.value))
                        return;
                    __VLS_ctx.showManualWeight = true;
                    // @ts-ignore
                    [showManualWeight,];
                } });
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        var __VLS_97;
        var __VLS_98;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "scale-display text-center q-pa-lg rounded-borders q-mb-md" }, { style: {} }));
        /** @type {__VLS_StyleScopedClasses['scale-display']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h2 text-weight-bold" }));
        /** @type {__VLS_StyleScopedClasses['text-h2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        (__VLS_ctx.scale.currentWeight.value || 0);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
        /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
        var __VLS_101 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_102 = __VLS_asFunctionalComponent1(__VLS_101, new __VLS_101(__assign({ color: (__VLS_ctx.scale.isStable.value ? 'positive' : 'warning') }, { class: "q-mt-sm" })));
        var __VLS_103 = __VLS_102.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.scale.isStable.value ? 'positive' : 'warning') }, { class: "q-mt-sm" })], __VLS_functionalComponentArgsRest(__VLS_102), false));
        /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
        var __VLS_106 = __VLS_104.slots.default;
        (__VLS_ctx.scale.isStable.value ? 'Ổn định' : 'Đang cân...');
        // @ts-ignore
        [scale, scale, scale,];
        var __VLS_104;
    }
    if (__VLS_ctx.showManualWeight && !__VLS_ctx.scale.isConnected.value) {
        var __VLS_107 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_108 = __VLS_asFunctionalComponent1(__VLS_107, new __VLS_107(__assign(__assign({ modelValue: (__VLS_ctx.manualWeight), modelModifiers: { number: true, }, type: "number", label: "Nhập trọng lượng (grams)", outlined: true }, { class: "q-mb-md" }), { suffix: "g" })));
        var __VLS_109 = __VLS_108.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.manualWeight), modelModifiers: { number: true, }, type: "number", label: "Nhập trọng lượng (grams)", outlined: true }, { class: "q-mb-md" }), { suffix: "g" })], __VLS_functionalComponentArgsRest(__VLS_108), false));
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    }
    if (__VLS_ctx.currentWeight) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md rounded-borders" }, { style: {} }));
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 text-center" }));
        /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h5 text-positive" }));
        /** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
        (__VLS_ctx.formatNumber(__VLS_ctx.calculatedMeters));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 text-center" }));
        /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h5 text-negative" }));
        /** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
        (__VLS_ctx.formatNumber(__VLS_ctx.calculatedConsumption));
    }
    var __VLS_112 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112(__assign(__assign(__assign({ 'onClick': {} }, { color: "primary", size: "lg" }), { class: "full-width q-mt-md" }), { icon: "scale", label: "Xác Nhận Trọng Lượng", disable: (!__VLS_ctx.currentWeight || (__VLS_ctx.scale.isConnected.value && !__VLS_ctx.scale.isStable.value)), loading: (__VLS_ctx.isWeighing) })));
    var __VLS_114 = __VLS_113.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { color: "primary", size: "lg" }), { class: "full-width q-mt-md" }), { icon: "scale", label: "Xác Nhận Trọng Lượng", disable: (!__VLS_ctx.currentWeight || (__VLS_ctx.scale.isConnected.value && !__VLS_ctx.scale.isStable.value)), loading: (__VLS_ctx.isWeighing) })], __VLS_functionalComponentArgsRest(__VLS_113), false));
    var __VLS_117 = void 0;
    var __VLS_118 = ({ click: {} },
        { onClick: (__VLS_ctx.handleWeightSubmit) });
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    var __VLS_115;
    var __VLS_116;
    // @ts-ignore
    [formatNumber, formatNumber, scale, scale, scale, showManualWeight, manualWeight, currentWeight, currentWeight, calculatedMeters, calculatedConsumption, isWeighing, handleWeightSubmit,];
    var __VLS_79;
    // @ts-ignore
    [];
    var __VLS_73;
}
if (__VLS_ctx.activeRecovery && __VLS_ctx.activeRecovery.status === __VLS_ctx.RecoveryStatus.WEIGHED) {
    var __VLS_119 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119(__assign({ class: "q-mb-md" })));
    var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([__assign({ class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_120), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_124 = __VLS_122.slots.default;
    var __VLS_125 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125({}));
    var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_126), false));
    var __VLS_130 = __VLS_128.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_131 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_132 = __VLS_asFunctionalComponent1(__VLS_131, new __VLS_131({}));
    var __VLS_133 = __VLS_132.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_132), false));
    var __VLS_136 = __VLS_134.slots.default;
    var __VLS_137 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137({}));
    var __VLS_139 = __VLS_138.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_138), false));
    var __VLS_142 = __VLS_140.slots.default;
    var __VLS_143 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({}));
    var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_144), false));
    var __VLS_148 = __VLS_146.slots.default;
    var __VLS_149 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_150 = __VLS_asFunctionalComponent1(__VLS_149, new __VLS_149({
        caption: true,
    }));
    var __VLS_151 = __VLS_150.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_150), false));
    var __VLS_154 = __VLS_152.slots.default;
    // @ts-ignore
    [activeRecovery, activeRecovery, enums_1.RecoveryStatus,];
    var __VLS_152;
    var __VLS_155 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_156 = __VLS_asFunctionalComponent1(__VLS_155, new __VLS_155({}));
    var __VLS_157 = __VLS_156.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_156), false));
    var __VLS_160 = __VLS_158.slots.default;
    (__VLS_ctx.activeRecovery.returned_weight_grams);
    // @ts-ignore
    [activeRecovery,];
    var __VLS_158;
    // @ts-ignore
    [];
    var __VLS_146;
    // @ts-ignore
    [];
    var __VLS_140;
    var __VLS_161 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_162 = __VLS_asFunctionalComponent1(__VLS_161, new __VLS_161({}));
    var __VLS_163 = __VLS_162.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_162), false));
    var __VLS_166 = __VLS_164.slots.default;
    var __VLS_167 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_168 = __VLS_asFunctionalComponent1(__VLS_167, new __VLS_167({}));
    var __VLS_169 = __VLS_168.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_168), false));
    var __VLS_172 = __VLS_170.slots.default;
    var __VLS_173 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_174 = __VLS_asFunctionalComponent1(__VLS_173, new __VLS_173({
        caption: true,
    }));
    var __VLS_175 = __VLS_174.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_174), false));
    var __VLS_178 = __VLS_176.slots.default;
    // @ts-ignore
    [];
    var __VLS_176;
    var __VLS_179 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_180 = __VLS_asFunctionalComponent1(__VLS_179, new __VLS_179(__assign({ class: "text-positive" })));
    var __VLS_181 = __VLS_180.apply(void 0, __spreadArray([__assign({ class: "text-positive" })], __VLS_functionalComponentArgsRest(__VLS_180), false));
    /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
    var __VLS_184 = __VLS_182.slots.default;
    (__VLS_ctx.formatNumber(__VLS_ctx.activeRecovery.remaining_meters));
    // @ts-ignore
    [activeRecovery, formatNumber,];
    var __VLS_182;
    // @ts-ignore
    [];
    var __VLS_170;
    // @ts-ignore
    [];
    var __VLS_164;
    var __VLS_185 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_186 = __VLS_asFunctionalComponent1(__VLS_185, new __VLS_185({}));
    var __VLS_187 = __VLS_186.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_186), false));
    var __VLS_190 = __VLS_188.slots.default;
    var __VLS_191 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_192 = __VLS_asFunctionalComponent1(__VLS_191, new __VLS_191({}));
    var __VLS_193 = __VLS_192.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_192), false));
    var __VLS_196 = __VLS_194.slots.default;
    var __VLS_197 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_198 = __VLS_asFunctionalComponent1(__VLS_197, new __VLS_197({
        caption: true,
    }));
    var __VLS_199 = __VLS_198.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_198), false));
    var __VLS_202 = __VLS_200.slots.default;
    // @ts-ignore
    [];
    var __VLS_200;
    var __VLS_203 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_204 = __VLS_asFunctionalComponent1(__VLS_203, new __VLS_203(__assign({ class: "text-negative" })));
    var __VLS_205 = __VLS_204.apply(void 0, __spreadArray([__assign({ class: "text-negative" })], __VLS_functionalComponentArgsRest(__VLS_204), false));
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    var __VLS_208 = __VLS_206.slots.default;
    (__VLS_ctx.formatNumber(__VLS_ctx.activeRecovery.consumed_meters));
    // @ts-ignore
    [activeRecovery, formatNumber,];
    var __VLS_206;
    // @ts-ignore
    [];
    var __VLS_194;
    // @ts-ignore
    [];
    var __VLS_188;
    // @ts-ignore
    [];
    var __VLS_134;
    // @ts-ignore
    [];
    var __VLS_128;
    var __VLS_209 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_210 = __VLS_asFunctionalComponent1(__VLS_209, new __VLS_209(__assign({ class: "row q-col-gutter-sm" })));
    var __VLS_211 = __VLS_210.apply(void 0, __spreadArray([__assign({ class: "row q-col-gutter-sm" })], __VLS_functionalComponentArgsRest(__VLS_210), false));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    var __VLS_214 = __VLS_212.slots.default;
    if ((__VLS_ctx.activeRecovery.returned_weight_grams || 0) < 50) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        var __VLS_215 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
        qBanner;
        // @ts-ignore
        var __VLS_216 = __VLS_asFunctionalComponent1(__VLS_215, new __VLS_215(__assign({ class: "bg-orange-1 text-orange-9 q-mb-sm" })));
        var __VLS_217 = __VLS_216.apply(void 0, __spreadArray([__assign({ class: "bg-orange-1 text-orange-9 q-mb-sm" })], __VLS_functionalComponentArgsRest(__VLS_216), false));
        /** @type {__VLS_StyleScopedClasses['bg-orange-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-orange-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
        var __VLS_220 = __VLS_218.slots.default;
        {
            var __VLS_221 = __VLS_218.slots.avatar;
            var __VLS_222 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_223 = __VLS_asFunctionalComponent1(__VLS_222, new __VLS_222({
                name: "warning",
            }));
            var __VLS_224 = __VLS_223.apply(void 0, __spreadArray([{
                    name: "warning",
                }], __VLS_functionalComponentArgsRest(__VLS_223), false));
            // @ts-ignore
            [activeRecovery,];
        }
        // @ts-ignore
        [];
        var __VLS_218;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    if ((__VLS_ctx.activeRecovery.returned_weight_grams || 0) >= 50) {
        var __VLS_227 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_228 = __VLS_asFunctionalComponent1(__VLS_227, new __VLS_227(__assign(__assign(__assign({ 'onClick': {} }, { color: "positive", size: "lg" }), { class: "full-width" }), { icon: "check_circle", label: "Xác Nhận Nhập Kho", loading: (__VLS_ctx.isConfirming) })));
        var __VLS_229 = __VLS_228.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { color: "positive", size: "lg" }), { class: "full-width" }), { icon: "check_circle", label: "Xác Nhận Nhập Kho", loading: (__VLS_ctx.isConfirming) })], __VLS_functionalComponentArgsRest(__VLS_228), false));
        var __VLS_232 = void 0;
        var __VLS_233 = ({ click: {} },
            { onClick: (__VLS_ctx.handleConfirmRecovery) });
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        var __VLS_230;
        var __VLS_231;
    }
    if ((__VLS_ctx.activeRecovery.returned_weight_grams || 0) < 50) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
        /** @type {__VLS_StyleScopedClasses['col']} */ ;
        var __VLS_234 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_235 = __VLS_asFunctionalComponent1(__VLS_234, new __VLS_234(__assign(__assign(__assign({ 'onClick': {} }, { color: "negative", size: "lg" }), { class: "full-width" }), { icon: "delete", label: "Loại Bỏ" })));
        var __VLS_236 = __VLS_235.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { color: "negative", size: "lg" }), { class: "full-width" }), { icon: "delete", label: "Loại Bỏ" })], __VLS_functionalComponentArgsRest(__VLS_235), false));
        var __VLS_239 = void 0;
        var __VLS_240 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.activeRecovery && __VLS_ctx.activeRecovery.status === __VLS_ctx.RecoveryStatus.WEIGHED))
                        return;
                    if (!((__VLS_ctx.activeRecovery.returned_weight_grams || 0) < 50))
                        return;
                    __VLS_ctx.showWriteOffDialog = true;
                    // @ts-ignore
                    [activeRecovery, activeRecovery, isConfirming, handleConfirmRecovery, showWriteOffDialog,];
                } });
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        var __VLS_237;
        var __VLS_238;
    }
    // @ts-ignore
    [];
    var __VLS_212;
    // @ts-ignore
    [];
    var __VLS_122;
}
if (!__VLS_ctx.activeRecovery && __VLS_ctx.pendingRecoveries.length) {
    var __VLS_241 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_242 = __VLS_asFunctionalComponent1(__VLS_241, new __VLS_241({}));
    var __VLS_243 = __VLS_242.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_242), false));
    var __VLS_246 = __VLS_244.slots.default;
    var __VLS_247 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_248 = __VLS_asFunctionalComponent1(__VLS_247, new __VLS_247({}));
    var __VLS_249 = __VLS_248.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_248), false));
    var __VLS_252 = __VLS_250.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    // @ts-ignore
    [activeRecovery, pendingRecoveries,];
    var __VLS_250;
    var __VLS_253 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_254 = __VLS_asFunctionalComponent1(__VLS_253, new __VLS_253({
        separator: true,
    }));
    var __VLS_255 = __VLS_254.apply(void 0, __spreadArray([{
            separator: true,
        }], __VLS_functionalComponentArgsRest(__VLS_254), false));
    var __VLS_258 = __VLS_256.slots.default;
    var _loop_1 = function (recovery) {
        var __VLS_259 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_260 = __VLS_asFunctionalComponent1(__VLS_259, new __VLS_259(__assign({ 'onClick': {} }, { key: (recovery.id), clickable: true })));
        var __VLS_261 = __VLS_260.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { key: (recovery.id), clickable: true })], __VLS_functionalComponentArgsRest(__VLS_260), false));
        var __VLS_264 = void 0;
        var __VLS_265 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(!__VLS_ctx.activeRecovery && __VLS_ctx.pendingRecoveries.length))
                        return;
                    __VLS_ctx.selectRecovery(recovery);
                    // @ts-ignore
                    [pendingRecoveries, selectRecovery,];
                } });
        var __VLS_266 = __VLS_262.slots.default;
        var __VLS_267 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_268 = __VLS_asFunctionalComponent1(__VLS_267, new __VLS_267({}));
        var __VLS_269 = __VLS_268.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_268), false));
        var __VLS_272 = __VLS_270.slots.default;
        var __VLS_273 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_274 = __VLS_asFunctionalComponent1(__VLS_273, new __VLS_273({}));
        var __VLS_275 = __VLS_274.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_274), false));
        var __VLS_278 = __VLS_276.slots.default;
        ((_g = recovery.cone) === null || _g === void 0 ? void 0 : _g.cone_id);
        // @ts-ignore
        [];
        var __VLS_279 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_280 = __VLS_asFunctionalComponent1(__VLS_279, new __VLS_279({
            caption: true,
        }));
        var __VLS_281 = __VLS_280.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_280), false));
        var __VLS_284 = __VLS_282.slots.default;
        ((_j = (_h = recovery.cone) === null || _h === void 0 ? void 0 : _h.thread_type) === null || _j === void 0 ? void 0 : _j.name);
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        var __VLS_285 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_286 = __VLS_asFunctionalComponent1(__VLS_285, new __VLS_285({
            side: true,
        }));
        var __VLS_287 = __VLS_286.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_286), false));
        var __VLS_290 = __VLS_288.slots.default;
        var __VLS_291 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_292 = __VLS_asFunctionalComponent1(__VLS_291, new __VLS_291({
            color: (__VLS_ctx.getStatusColor(recovery.status)),
        }));
        var __VLS_293 = __VLS_292.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.getStatusColor(recovery.status)),
            }], __VLS_functionalComponentArgsRest(__VLS_292), false));
        var __VLS_296 = __VLS_294.slots.default;
        (__VLS_ctx.getStatusLabel(recovery.status));
        // @ts-ignore
        [getStatusColor, getStatusLabel,];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_276, __VLS_282, __VLS_270, __VLS_294, __VLS_288, __VLS_262, __VLS_263;
    for (var _i = 0, _l = __VLS_vFor((__VLS_ctx.pendingRecoveries)); _i < _l.length; _i++) {
        var recovery = _l[_i][0];
        _loop_1(recovery);
    }
    // @ts-ignore
    [];
    var __VLS_256;
    // @ts-ignore
    [];
    var __VLS_244;
}
var __VLS_297;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_298 = __VLS_asFunctionalComponent1(__VLS_297, new __VLS_297({
    modelValue: (__VLS_ctx.showWriteOffDialog),
    persistent: true,
}));
var __VLS_299 = __VLS_298.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.showWriteOffDialog),
        persistent: true,
    }], __VLS_functionalComponentArgsRest(__VLS_298), false));
var __VLS_302 = __VLS_300.slots.default;
var __VLS_303;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_304 = __VLS_asFunctionalComponent1(__VLS_303, new __VLS_303(__assign({ style: {} })));
var __VLS_305 = __VLS_304.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_304), false));
var __VLS_308 = __VLS_306.slots.default;
var __VLS_309;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_310 = __VLS_asFunctionalComponent1(__VLS_309, new __VLS_309(__assign({ class: "row items-center" })));
var __VLS_311 = __VLS_310.apply(void 0, __spreadArray([__assign({ class: "row items-center" })], __VLS_functionalComponentArgsRest(__VLS_310), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
var __VLS_314 = __VLS_312.slots.default;
var __VLS_315;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_316 = __VLS_asFunctionalComponent1(__VLS_315, new __VLS_315(__assign({ name: "warning", color: "negative", size: "24px" }, { class: "q-mr-sm" })));
var __VLS_317 = __VLS_316.apply(void 0, __spreadArray([__assign({ name: "warning", color: "negative", size: "24px" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_316), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
// @ts-ignore
[showWriteOffDialog,];
var __VLS_312;
var __VLS_320;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_321 = __VLS_asFunctionalComponent1(__VLS_320, new __VLS_320({}));
var __VLS_322 = __VLS_321.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_321), false));
var __VLS_325 = __VLS_323.slots.default;
var __VLS_326;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_327 = __VLS_asFunctionalComponent1(__VLS_326, new __VLS_326({
    modelValue: (__VLS_ctx.writeOffReason),
    label: "Lý do",
    outlined: true,
    autofocus: true,
}));
var __VLS_328 = __VLS_327.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.writeOffReason),
        label: "Lý do",
        outlined: true,
        autofocus: true,
    }], __VLS_functionalComponentArgsRest(__VLS_327), false));
var __VLS_331;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_332 = __VLS_asFunctionalComponent1(__VLS_331, new __VLS_331(__assign({ modelValue: (__VLS_ctx.approvedBy), label: "Người phê duyệt (Quản lý)", outlined: true }, { class: "q-mt-sm" })));
var __VLS_333 = __VLS_332.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.approvedBy), label: "Người phê duyệt (Quản lý)", outlined: true }, { class: "q-mt-sm" })], __VLS_functionalComponentArgsRest(__VLS_332), false));
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
// @ts-ignore
[writeOffReason, approvedBy,];
var __VLS_323;
var __VLS_336;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_337 = __VLS_asFunctionalComponent1(__VLS_336, new __VLS_336({
    align: "right",
}));
var __VLS_338 = __VLS_337.apply(void 0, __spreadArray([{
        align: "right",
    }], __VLS_functionalComponentArgsRest(__VLS_337), false));
var __VLS_341 = __VLS_339.slots.default;
var __VLS_342;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_343 = __VLS_asFunctionalComponent1(__VLS_342, new __VLS_342({
    flat: true,
    label: "Hủy",
}));
var __VLS_344 = __VLS_343.apply(void 0, __spreadArray([{
        flat: true,
        label: "Hủy",
    }], __VLS_functionalComponentArgsRest(__VLS_343), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
var __VLS_347;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_348 = __VLS_asFunctionalComponent1(__VLS_347, new __VLS_347(__assign({ 'onClick': {} }, { flat: true, label: "Xác Nhận Loại Bỏ", color: "negative", disable: (!__VLS_ctx.writeOffReason || !__VLS_ctx.approvedBy) })));
var __VLS_349 = __VLS_348.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Xác Nhận Loại Bỏ", color: "negative", disable: (!__VLS_ctx.writeOffReason || !__VLS_ctx.approvedBy) })], __VLS_functionalComponentArgsRest(__VLS_348), false));
var __VLS_352;
var __VLS_353 = ({ click: {} },
    { onClick: (__VLS_ctx.handleWriteOffSubmit) });
var __VLS_350;
var __VLS_351;
// @ts-ignore
[writeOffReason, approvedBy, vClosePopup, handleWriteOffSubmit,];
var __VLS_339;
// @ts-ignore
[];
var __VLS_306;
// @ts-ignore
[];
var __VLS_300;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
