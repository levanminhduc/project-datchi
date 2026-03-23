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
var composables_1 = require("@/composables");
var hardware_1 = require("@/composables/hardware");
var offline_1 = require("@/components/offline");
var _b = (0, composables_1.useThreadTypes)(), threadTypes = _b.threadTypes, fetchThreadTypes = _b.fetchThreadTypes;
var receiveStock = (0, composables_1.useInventory)().receiveStock;
var snackbar = (0, composables_1.useSnackbar)();
var _c = (0, composables_1.useWarehouses)(), warehouseOptions = _c.warehouseOptions, fetchWarehouses = _c.fetchWarehouses;
var scale = (0, hardware_1.useScale)();
var playBeep = (0, hardware_1.useAudioFeedback)().playBeep;
var offline = (0, composables_1.useOfflineOperation)();
// Conflict dialog state
var showConflictDialog = (0, vue_1.ref)(false);
(0, hardware_1.useScanner)({
    onScan: function (barcode) {
        threadTypeCode.value = barcode;
        lookupThreadType();
        playBeep('scan');
    }
});
// Form state
var threadTypeCode = (0, vue_1.ref)('');
var selectedThreadType = (0, vue_1.ref)(null);
var quantity = (0, vue_1.ref)(1);
var warehouseId = (0, vue_1.ref)(1);
var location = (0, vue_1.ref)('');
var isSubmitting = (0, vue_1.ref)(false);
var showManualWeight = (0, vue_1.ref)(false);
var manualWeight = (0, vue_1.ref)(null);
var lookupThreadType = function () {
    if (!threadTypeCode.value)
        return;
    var found = threadTypes.value.find(function (t) { return t.code === threadTypeCode.value; });
    if (found) {
        selectedThreadType.value = found;
        playBeep('success');
    }
    else {
        snackbar.error('Không tìm thấy loại chỉ');
        playBeep('error');
        selectedThreadType.value = null;
    }
};
var confirmReceive = function () { return __awaiter(void 0, void 0, void 0, function () {
    var weight, payload_1, result, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!selectedThreadType.value)
                    return [2 /*return*/];
                isSubmitting.value = true;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, 4, 5]);
                weight = scale.isConnected.value
                    ? scale.currentWeight.value
                    : (showManualWeight.value ? manualWeight.value : null);
                payload_1 = {
                    thread_type_id: selectedThreadType.value.id,
                    warehouse_id: warehouseId.value,
                    quantity_cones: quantity.value,
                    weight_per_cone_grams: weight || undefined,
                    location: location.value || undefined,
                };
                return [4 /*yield*/, offline.execute({
                        type: 'stock_receipt',
                        onlineExecutor: function () { return receiveStock(__assign({}, payload_1)); },
                        payload: payload_1,
                        successMessage: "\u0110\u00E3 nh\u1EADp ".concat(quantity.value, " cu\u1ED9n th\u00E0nh c\u00F4ng"),
                        queuedMessage: 'Đã lưu thao tác nhập kho, sẽ đồng bộ khi có mạng',
                    })];
            case 2:
                result = _b.sent();
                if (result.success || result.queued) {
                    playBeep('success');
                    // Reset form
                    threadTypeCode.value = '';
                    selectedThreadType.value = null;
                    quantity.value = 1;
                    location.value = '';
                    manualWeight.value = null;
                    showManualWeight.value = false;
                }
                else {
                    playBeep('error');
                }
                return [3 /*break*/, 5];
            case 3:
                _a = _b.sent();
                playBeep('error');
                return [3 /*break*/, 5];
            case 4:
                isSubmitting.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    fetchThreadTypes(),
                    fetchWarehouses(),
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
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ padding: true }, { class: "mobile-receive-page" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ padding: true }, { class: "mobile-receive-page" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['mobile-receive-page']} */ ;
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
var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36(__assign(__assign({ 'onKeyup': {} }, { modelValue: (__VLS_ctx.threadTypeCode), outlined: true, dense: true, placeholder: "Quét hoặc nhập mã..." }), { class: "scan-input" })));
var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([__assign(__assign({ 'onKeyup': {} }, { modelValue: (__VLS_ctx.threadTypeCode), outlined: true, dense: true, placeholder: "Quét hoặc nhập mã..." }), { class: "scan-input" })], __VLS_functionalComponentArgsRest(__VLS_37), false));
var __VLS_41;
var __VLS_42 = ({ keyup: {} },
    { onKeyup: (__VLS_ctx.lookupThreadType) });
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
        { onClick: (__VLS_ctx.lookupThreadType) });
    var __VLS_48;
    var __VLS_49;
    // @ts-ignore
    [showConflictDialog, threadTypeCode, lookupThreadType, lookupThreadType,];
}
// @ts-ignore
[];
var __VLS_39;
var __VLS_40;
// @ts-ignore
[];
var __VLS_28;
if (__VLS_ctx.selectedThreadType) {
    var __VLS_52 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({}));
    var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_53), false));
    var __VLS_57 = __VLS_55.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-dot" }, { style: ({ backgroundColor: ((_a = __VLS_ctx.selectedThreadType.color_data) === null || _a === void 0 ? void 0 : _a.hex_code) || '#ccc' }) }));
    /** @type {__VLS_StyleScopedClasses['color-dot']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.selectedThreadType.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    (__VLS_ctx.selectedThreadType.code);
    // @ts-ignore
    [selectedThreadType, selectedThreadType, selectedThreadType, selectedThreadType,];
    var __VLS_55;
}
// @ts-ignore
[];
var __VLS_22;
if (__VLS_ctx.selectedThreadType) {
    var __VLS_58 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58(__assign({ class: "q-mb-md" })));
    var __VLS_60 = __VLS_59.apply(void 0, __spreadArray([__assign({ class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_59), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_63 = __VLS_61.slots.default;
    var __VLS_64 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({}));
    var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_65), false));
    var __VLS_69 = __VLS_67.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-center q-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
    var __VLS_70 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70(__assign({ 'onClick': {} }, { round: true, color: "negative", icon: "remove", size: "lg", disable: (__VLS_ctx.quantity <= 1) })));
    var __VLS_72 = __VLS_71.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { round: true, color: "negative", icon: "remove", size: "lg", disable: (__VLS_ctx.quantity <= 1) })], __VLS_functionalComponentArgsRest(__VLS_71), false));
    var __VLS_75 = void 0;
    var __VLS_76 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.selectedThreadType))
                    return;
                __VLS_ctx.quantity--;
                // @ts-ignore
                [selectedThreadType, quantity, quantity,];
            } });
    var __VLS_73;
    var __VLS_74;
    var __VLS_77 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77(__assign(__assign({ modelValue: (__VLS_ctx.quantity), modelModifiers: { number: true, }, type: "number", outlined: true }, { class: "quantity-input text-center" }), { inputClass: "text-h4 text-center" })));
    var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.quantity), modelModifiers: { number: true, }, type: "number", outlined: true }, { class: "quantity-input text-center" }), { inputClass: "text-h4 text-center" })], __VLS_functionalComponentArgsRest(__VLS_78), false));
    /** @type {__VLS_StyleScopedClasses['quantity-input']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_82 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82(__assign({ 'onClick': {} }, { round: true, color: "positive", icon: "add", size: "lg" })));
    var __VLS_84 = __VLS_83.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { round: true, color: "positive", icon: "add", size: "lg" })], __VLS_functionalComponentArgsRest(__VLS_83), false));
    var __VLS_87 = void 0;
    var __VLS_88 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.selectedThreadType))
                    return;
                __VLS_ctx.quantity++;
                // @ts-ignore
                [quantity, quantity,];
            } });
    var __VLS_85;
    var __VLS_86;
    // @ts-ignore
    [];
    var __VLS_67;
    // @ts-ignore
    [];
    var __VLS_61;
}
if (__VLS_ctx.selectedThreadType) {
    var __VLS_89 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89(__assign({ class: "q-mb-md" })));
    var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([__assign({ class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_90), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_94 = __VLS_92.slots.default;
    var __VLS_95 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_96 = __VLS_asFunctionalComponent1(__VLS_95, new __VLS_95({}));
    var __VLS_97 = __VLS_96.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_96), false));
    var __VLS_100 = __VLS_98.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    if (!__VLS_ctx.scale.isConnected.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
        /** @type {__VLS_StyleScopedClasses['col']} */ ;
        var __VLS_101 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_102 = __VLS_asFunctionalComponent1(__VLS_101, new __VLS_101(__assign(__assign({ 'onClick': {} }, { outline: true, color: "primary", icon: "usb", label: "Kết Nối Cân" }), { class: "full-width" })));
        var __VLS_103 = __VLS_102.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { outline: true, color: "primary", icon: "usb", label: "Kết Nối Cân" }), { class: "full-width" })], __VLS_functionalComponentArgsRest(__VLS_102), false));
        var __VLS_106 = void 0;
        var __VLS_107 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.selectedThreadType))
                        return;
                    if (!(!__VLS_ctx.scale.isConnected.value))
                        return;
                    __VLS_ctx.scale.connect();
                    // @ts-ignore
                    [selectedThreadType, scale, scale,];
                } });
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        var __VLS_104;
        var __VLS_105;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
        /** @type {__VLS_StyleScopedClasses['col']} */ ;
        var __VLS_108 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_109 = __VLS_asFunctionalComponent1(__VLS_108, new __VLS_108(__assign(__assign({ 'onClick': {} }, { outline: true, color: "grey", icon: "edit", label: "Nhập Tay" }), { class: "full-width" })));
        var __VLS_110 = __VLS_109.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { outline: true, color: "grey", icon: "edit", label: "Nhập Tay" }), { class: "full-width" })], __VLS_functionalComponentArgsRest(__VLS_109), false));
        var __VLS_113 = void 0;
        var __VLS_114 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.selectedThreadType))
                        return;
                    if (!(!__VLS_ctx.scale.isConnected.value))
                        return;
                    __VLS_ctx.showManualWeight = true;
                    // @ts-ignore
                    [showManualWeight,];
                } });
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        var __VLS_111;
        var __VLS_112;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "scale-display text-center q-pa-md bg-grey-2 rounded-borders" }));
        /** @type {__VLS_StyleScopedClasses['scale-display']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h3" }));
        /** @type {__VLS_StyleScopedClasses['text-h3']} */ ;
        (__VLS_ctx.scale.currentWeight.value || 0);
        var __VLS_115 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_116 = __VLS_asFunctionalComponent1(__VLS_115, new __VLS_115({
            color: (__VLS_ctx.scale.isStable.value ? 'positive' : 'warning'),
        }));
        var __VLS_117 = __VLS_116.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.scale.isStable.value ? 'positive' : 'warning'),
            }], __VLS_functionalComponentArgsRest(__VLS_116), false));
        var __VLS_120 = __VLS_118.slots.default;
        (__VLS_ctx.scale.isStable.value ? 'Ổn định' : 'Đang cân...');
        // @ts-ignore
        [scale, scale, scale,];
        var __VLS_118;
    }
    if (__VLS_ctx.showManualWeight && !__VLS_ctx.scale.isConnected.value) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-sm" }));
        /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
        var __VLS_121 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_122 = __VLS_asFunctionalComponent1(__VLS_121, new __VLS_121({
            modelValue: (__VLS_ctx.manualWeight),
            modelModifiers: { number: true, },
            type: "number",
            label: "Trọng lượng (grams)",
            outlined: true,
            dense: true,
            suffix: "g",
        }));
        var __VLS_123 = __VLS_122.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.manualWeight),
                modelModifiers: { number: true, },
                type: "number",
                label: "Trọng lượng (grams)",
                outlined: true,
                dense: true,
                suffix: "g",
            }], __VLS_functionalComponentArgsRest(__VLS_122), false));
    }
    // @ts-ignore
    [scale, showManualWeight, manualWeight,];
    var __VLS_98;
    // @ts-ignore
    [];
    var __VLS_92;
}
if (__VLS_ctx.selectedThreadType) {
    var __VLS_126 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126(__assign({ class: "q-mb-md" })));
    var __VLS_128 = __VLS_127.apply(void 0, __spreadArray([__assign({ class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_127), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_131 = __VLS_129.slots.default;
    var __VLS_132 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132({}));
    var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_133), false));
    var __VLS_137 = __VLS_135.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    var __VLS_138 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138({
        modelValue: (__VLS_ctx.warehouseId),
        options: (__VLS_ctx.warehouseOptions),
        label: "Kho",
        dense: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
    }));
    var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.warehouseId),
            options: (__VLS_ctx.warehouseOptions),
            label: "Kho",
            dense: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
        }], __VLS_functionalComponentArgsRest(__VLS_139), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    var __VLS_143 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
        modelValue: (__VLS_ctx.location),
        label: "Vị trí",
        outlined: true,
        dense: true,
        placeholder: "A1-01",
    }));
    var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.location),
            label: "Vị trí",
            outlined: true,
            dense: true,
            placeholder: "A1-01",
        }], __VLS_functionalComponentArgsRest(__VLS_144), false));
    // @ts-ignore
    [selectedThreadType, warehouseId, warehouseOptions, location,];
    var __VLS_135;
    // @ts-ignore
    [];
    var __VLS_129;
}
if (__VLS_ctx.selectedThreadType) {
    var __VLS_148 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_149 = __VLS_asFunctionalComponent1(__VLS_148, new __VLS_148(__assign(__assign(__assign({ 'onClick': {} }, { color: "primary", size: "lg" }), { class: "full-width confirm-btn" }), { icon: "check", label: ("Nh\u1EADp ".concat(__VLS_ctx.quantity, " Cu\u1ED9n")), loading: (__VLS_ctx.isSubmitting) })));
    var __VLS_150 = __VLS_149.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { color: "primary", size: "lg" }), { class: "full-width confirm-btn" }), { icon: "check", label: ("Nh\u1EADp ".concat(__VLS_ctx.quantity, " Cu\u1ED9n")), loading: (__VLS_ctx.isSubmitting) })], __VLS_functionalComponentArgsRest(__VLS_149), false));
    var __VLS_153 = void 0;
    var __VLS_154 = ({ click: {} },
        { onClick: (__VLS_ctx.confirmReceive) });
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['confirm-btn']} */ ;
    var __VLS_151;
    var __VLS_152;
}
// @ts-ignore
[selectedThreadType, quantity, isSubmitting, confirmReceive,];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
