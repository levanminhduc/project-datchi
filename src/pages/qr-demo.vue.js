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
var composables_1 = require("@/composables");
var qr_1 = require("@/components/qr");
// State
var activeTab = (0, vue_1.ref)('dialog');
var showScannerDialog = (0, vue_1.ref)(false);
var isInlineScanning = (0, vue_1.ref)(false);
var dialogResult = (0, vue_1.ref)(null);
var inlineResult = (0, vue_1.ref)(null);
var snackbar = (0, composables_1.useSnackbar)();
// Dialog options
var dialogOptions = (0, vue_1.reactive)({
    closeOnDetect: true,
    persistent: false,
    showResult: true,
    track: true,
});
var scanHistory = (0, vue_1.ref)([]);
// Helpers
var isUrl = function (text) {
    try {
        new URL(text);
        return true;
    }
    catch (_a) {
        return false;
    }
};
var isEmail = function (text) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
};
var isPhone = function (text) {
    return /^[\d\s+()-]{8,}$/.test(text);
};
var detectType = function (value) {
    if (isUrl(value))
        return 'URL';
    if (isEmail(value))
        return 'Email';
    if (isPhone(value))
        return 'Phone';
    return 'Text';
};
var getTypeIcon = function (type) {
    var icons = {
        URL: 'link',
        Email: 'email',
        Phone: 'phone',
        Text: 'text_fields',
    };
    return icons[type];
};
var getTypeColor = function (type) {
    var colors = {
        URL: 'blue',
        Email: 'purple',
        Phone: 'green',
        Text: 'grey',
    };
    return colors[type];
};
var formatTime = function (date) {
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};
// Event handlers
var addToHistory = function (value) {
    var type = detectType(value);
    scanHistory.value.unshift({
        value: value,
        type: type,
        timestamp: new Date(),
    });
    // Keep only last 100 entries
    if (scanHistory.value.length > 100) {
        scanHistory.value = scanHistory.value.slice(0, 100);
    }
};
var onDialogConfirm = function (code) {
    dialogResult.value = code;
    addToHistory(code);
    snackbar.success("\u0110\u00E3 qu\u00E9t: ".concat(code.substring(0, 50)).concat(code.length > 50 ? '...' : ''));
};
var onDetect = function (codes) {
    console.log('Detected codes:', codes);
};
var onInlineDetect = function (codes) {
    if (codes.length > 0 && codes[0]) {
        var value = codes[0].rawValue;
        // Avoid duplicate rapid scans
        if (value !== inlineResult.value) {
            inlineResult.value = value;
            addToHistory(value);
            // Vibrate feedback on mobile
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
            snackbar.success('Đã quét thành công!');
        }
    }
};
var clearHistory = function () {
    scanHistory.value = [];
    dialogResult.value = null;
    inlineResult.value = null;
    snackbar.info('Đã xóa lịch sử');
};
var removeFromHistory = function (index) {
    scanHistory.value.splice(index, 1);
};
var copyToClipboard = function (text) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, navigator.clipboard.writeText(text)];
            case 1:
                _b.sent();
                snackbar.success('Đã sao chép vào clipboard');
                return [3 /*break*/, 3];
            case 2:
                _a = _b.sent();
                snackbar.error('Không thể sao chép');
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var openUrl = function (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
};
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-lg" }));
/** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex items-center q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ name: "qr_code_scanner", size: "32px", color: "primary" }, { class: "q-mr-sm" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ name: "qr_code_scanner", size: "32px", color: "primary" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h4 text-weight-bold q-my-none" }));
/** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['q-my-none']} */ ;
var __VLS_5;
/** @ts-ignore @type {typeof __VLS_components.qTabs | typeof __VLS_components.QTabs | typeof __VLS_components.qTabs | typeof __VLS_components.QTabs} */
qTabs;
// @ts-ignore
var __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5(__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left", narrowIndicator: true, noCaps: true })));
var __VLS_7 = __VLS_6.apply(void 0, __spreadArray([__assign(__assign({ modelValue: (__VLS_ctx.activeTab), dense: true }, { class: "text-grey" }), { activeColor: "primary", indicatorColor: "primary", align: "left", narrowIndicator: true, noCaps: true })], __VLS_functionalComponentArgsRest(__VLS_6), false));
/** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
var __VLS_10 = __VLS_8.slots.default;
var __VLS_11;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
    name: "dialog",
    icon: "crop_free",
    label: "Scanner Dialog",
}));
var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([{
        name: "dialog",
        icon: "crop_free",
        label: "Scanner Dialog",
    }], __VLS_functionalComponentArgsRest(__VLS_12), false));
var __VLS_16;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
    name: "inline",
    icon: "videocam",
    label: "Inline Scanner",
}));
var __VLS_18 = __VLS_17.apply(void 0, __spreadArray([{
        name: "inline",
        icon: "videocam",
        label: "Inline Scanner",
    }], __VLS_functionalComponentArgsRest(__VLS_17), false));
var __VLS_21;
/** @ts-ignore @type {typeof __VLS_components.qTab | typeof __VLS_components.QTab} */
qTab;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
    name: "history",
    icon: "history",
    label: "Lịch sử quét",
}));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([{
        name: "history",
        icon: "history",
        label: "Lịch sử quét",
    }], __VLS_functionalComponentArgsRest(__VLS_22), false));
// @ts-ignore
[activeTab,];
var __VLS_8;
var __VLS_26;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({}));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_27), false));
var __VLS_31;
/** @ts-ignore @type {typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels | typeof __VLS_components.qTabPanels | typeof __VLS_components.QTabPanels} */
qTabPanels;
// @ts-ignore
var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31(__assign({ modelValue: (__VLS_ctx.activeTab), animated: true }, { class: "q-mt-md" })));
var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.activeTab), animated: true }, { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_32), false));
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
var __VLS_36 = __VLS_34.slots.default;
var __VLS_37;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
    name: "dialog",
}));
var __VLS_39 = __VLS_38.apply(void 0, __spreadArray([{
        name: "dialog",
    }], __VLS_functionalComponentArgsRest(__VLS_38), false));
var __VLS_42 = __VLS_40.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_43;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
    bordered: true,
}));
var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_44), false));
var __VLS_48 = __VLS_46.slots.default;
var __VLS_49;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({}));
var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_50), false));
var __VLS_54 = __VLS_52.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-grey-7 q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
// @ts-ignore
[activeTab,];
var __VLS_52;
var __VLS_55;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({}));
var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_56), false));
var __VLS_60 = __VLS_58.slots.default;
var __VLS_61;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61(__assign({ 'onClick': {} }, { color: "primary", icon: "qr_code_scanner", label: "Mở Scanner", size: "lg" })));
var __VLS_63 = __VLS_62.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "qr_code_scanner", label: "Mở Scanner", size: "lg" })], __VLS_functionalComponentArgsRest(__VLS_62), false));
var __VLS_66;
var __VLS_67 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.showScannerDialog = true;
            // @ts-ignore
            [showScannerDialog,];
        } });
var __VLS_64;
var __VLS_65;
// @ts-ignore
[];
var __VLS_58;
if (__VLS_ctx.dialogResult) {
    var __VLS_68 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({}));
    var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_69), false));
    var __VLS_73 = __VLS_71.slots.default;
    var __VLS_74 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74(__assign({ class: "bg-positive text-white" }, { rounded: true })));
    var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([__assign({ class: "bg-positive text-white" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_75), false));
    /** @type {__VLS_StyleScopedClasses['bg-positive']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_79 = __VLS_77.slots.default;
    {
        var __VLS_80 = __VLS_77.slots.avatar;
        var __VLS_81 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_82 = __VLS_asFunctionalComponent1(__VLS_81, new __VLS_81({
            name: "check_circle",
        }));
        var __VLS_83 = __VLS_82.apply(void 0, __spreadArray([{
                name: "check_circle",
            }], __VLS_functionalComponentArgsRest(__VLS_82), false));
        // @ts-ignore
        [dialogResult,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mt-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    (__VLS_ctx.dialogResult);
    // @ts-ignore
    [dialogResult,];
    var __VLS_77;
    // @ts-ignore
    [];
    var __VLS_71;
}
// @ts-ignore
[];
var __VLS_46;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-6']} */ ;
var __VLS_86;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
    bordered: true,
}));
var __VLS_88 = __VLS_87.apply(void 0, __spreadArray([{
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_87), false));
var __VLS_91 = __VLS_89.slots.default;
var __VLS_92;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({}));
var __VLS_94 = __VLS_93.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_93), false));
var __VLS_97 = __VLS_95.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
// @ts-ignore
[];
var __VLS_95;
var __VLS_98;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98({}));
var __VLS_100 = __VLS_99.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_99), false));
var __VLS_103 = __VLS_101.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_104;
/** @ts-ignore @type {typeof __VLS_components.qToggle | typeof __VLS_components.QToggle} */
qToggle;
// @ts-ignore
var __VLS_105 = __VLS_asFunctionalComponent1(__VLS_104, new __VLS_104({
    modelValue: (__VLS_ctx.dialogOptions.closeOnDetect),
    label: "Tự động đóng khi quét thành công",
}));
var __VLS_106 = __VLS_105.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.dialogOptions.closeOnDetect),
        label: "Tự động đóng khi quét thành công",
    }], __VLS_functionalComponentArgsRest(__VLS_105), false));
var __VLS_109;
/** @ts-ignore @type {typeof __VLS_components.qToggle | typeof __VLS_components.QToggle} */
qToggle;
// @ts-ignore
var __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109({
    modelValue: (__VLS_ctx.dialogOptions.persistent),
    label: "Persistent (không đóng khi click ngoài)",
}));
var __VLS_111 = __VLS_110.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.dialogOptions.persistent),
        label: "Persistent (không đóng khi click ngoài)",
    }], __VLS_functionalComponentArgsRest(__VLS_110), false));
var __VLS_114;
/** @ts-ignore @type {typeof __VLS_components.qToggle | typeof __VLS_components.QToggle} */
qToggle;
// @ts-ignore
var __VLS_115 = __VLS_asFunctionalComponent1(__VLS_114, new __VLS_114({
    modelValue: (__VLS_ctx.dialogOptions.showResult),
    label: "Hiển thị kết quả trong dialog",
}));
var __VLS_116 = __VLS_115.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.dialogOptions.showResult),
        label: "Hiển thị kết quả trong dialog",
    }], __VLS_functionalComponentArgsRest(__VLS_115), false));
var __VLS_119;
/** @ts-ignore @type {typeof __VLS_components.qToggle | typeof __VLS_components.QToggle} */
qToggle;
// @ts-ignore
var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({
    modelValue: (__VLS_ctx.dialogOptions.track),
    label: "Vẽ khung quanh mã QR",
}));
var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.dialogOptions.track),
        label: "Vẽ khung quanh mã QR",
    }], __VLS_functionalComponentArgsRest(__VLS_120), false));
// @ts-ignore
[dialogOptions, dialogOptions, dialogOptions, dialogOptions,];
var __VLS_101;
// @ts-ignore
[];
var __VLS_89;
var __VLS_124;
/** @ts-ignore @type {typeof __VLS_components.QrScannerDialog} */
qr_1.QrScannerDialog;
// @ts-ignore
var __VLS_125 = __VLS_asFunctionalComponent1(__VLS_124, new __VLS_124(__assign(__assign({ 'onConfirm': {} }, { 'onDetect': {} }), { modelValue: (__VLS_ctx.showScannerDialog), closeOnDetect: (__VLS_ctx.dialogOptions.closeOnDetect), persistent: (__VLS_ctx.dialogOptions.persistent), showResult: (__VLS_ctx.dialogOptions.showResult), track: (__VLS_ctx.dialogOptions.track) })));
var __VLS_126 = __VLS_125.apply(void 0, __spreadArray([__assign(__assign({ 'onConfirm': {} }, { 'onDetect': {} }), { modelValue: (__VLS_ctx.showScannerDialog), closeOnDetect: (__VLS_ctx.dialogOptions.closeOnDetect), persistent: (__VLS_ctx.dialogOptions.persistent), showResult: (__VLS_ctx.dialogOptions.showResult), track: (__VLS_ctx.dialogOptions.track) })], __VLS_functionalComponentArgsRest(__VLS_125), false));
var __VLS_129;
var __VLS_130 = ({ confirm: {} },
    { onConfirm: (__VLS_ctx.onDialogConfirm) });
var __VLS_131 = ({ detect: {} },
    { onDetect: (__VLS_ctx.onDetect) });
var __VLS_127;
var __VLS_128;
// @ts-ignore
[showScannerDialog, dialogOptions, dialogOptions, dialogOptions, dialogOptions, onDialogConfirm, onDetect,];
var __VLS_40;
var __VLS_132;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132({
    name: "inline",
}));
var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([{
        name: "inline",
    }], __VLS_functionalComponentArgsRest(__VLS_133), false));
var __VLS_137 = __VLS_135.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-lg" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-lg']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-8" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-8']} */ ;
var __VLS_138;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138({
    bordered: true,
}));
var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([{
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_139), false));
var __VLS_143 = __VLS_141.slots.default;
var __VLS_144;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_145 = __VLS_asFunctionalComponent1(__VLS_144, new __VLS_144({}));
var __VLS_146 = __VLS_145.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_145), false));
var __VLS_149 = __VLS_147.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-grey-7 q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
// @ts-ignore
[];
var __VLS_147;
var __VLS_150;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_151 = __VLS_asFunctionalComponent1(__VLS_150, new __VLS_150({}));
var __VLS_152 = __VLS_151.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_151), false));
var __VLS_155 = __VLS_153.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-sm q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_156;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_157 = __VLS_asFunctionalComponent1(__VLS_156, new __VLS_156(__assign({ 'onClick': {} }, { color: (__VLS_ctx.isInlineScanning ? 'negative' : 'positive'), icon: (__VLS_ctx.isInlineScanning ? 'stop' : 'play_arrow'), label: (__VLS_ctx.isInlineScanning ? 'Dừng' : 'Bắt đầu') })));
var __VLS_158 = __VLS_157.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: (__VLS_ctx.isInlineScanning ? 'negative' : 'positive'), icon: (__VLS_ctx.isInlineScanning ? 'stop' : 'play_arrow'), label: (__VLS_ctx.isInlineScanning ? 'Dừng' : 'Bắt đầu') })], __VLS_functionalComponentArgsRest(__VLS_157), false));
var __VLS_161;
var __VLS_162 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.isInlineScanning = !__VLS_ctx.isInlineScanning;
            // @ts-ignore
            [isInlineScanning, isInlineScanning, isInlineScanning, isInlineScanning, isInlineScanning,];
        } });
var __VLS_159;
var __VLS_160;
var __VLS_163;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_164 = __VLS_asFunctionalComponent1(__VLS_163, new __VLS_163(__assign({ 'onClick': {} }, { outline: true, color: "grey-7", icon: "delete", label: "Xóa lịch sử" })));
var __VLS_165 = __VLS_164.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { outline: true, color: "grey-7", icon: "delete", label: "Xóa lịch sử" })], __VLS_functionalComponentArgsRest(__VLS_164), false));
var __VLS_168;
var __VLS_169 = ({ click: {} },
    { onClick: (__VLS_ctx.clearHistory) });
var __VLS_166;
var __VLS_167;
var __VLS_170;
/** @ts-ignore @type {typeof __VLS_components.QrScannerStream} */
qr_1.QrScannerStream;
// @ts-ignore
var __VLS_171 = __VLS_asFunctionalComponent1(__VLS_170, new __VLS_170(__assign({ 'onDetect': {} }, { modelValue: (__VLS_ctx.isInlineScanning), track: (true), hint: "Đưa mã QR vào khung hình" })));
var __VLS_172 = __VLS_171.apply(void 0, __spreadArray([__assign({ 'onDetect': {} }, { modelValue: (__VLS_ctx.isInlineScanning), track: (true), hint: "Đưa mã QR vào khung hình" })], __VLS_functionalComponentArgsRest(__VLS_171), false));
var __VLS_175;
var __VLS_176 = ({ detect: {} },
    { onDetect: (__VLS_ctx.onInlineDetect) });
var __VLS_173;
var __VLS_174;
// @ts-ignore
[isInlineScanning, clearHistory, onInlineDetect,];
var __VLS_153;
// @ts-ignore
[];
var __VLS_141;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_177;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_178 = __VLS_asFunctionalComponent1(__VLS_177, new __VLS_177({
    bordered: true,
}));
var __VLS_179 = __VLS_178.apply(void 0, __spreadArray([{
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_178), false));
var __VLS_182 = __VLS_180.slots.default;
var __VLS_183;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_184 = __VLS_asFunctionalComponent1(__VLS_183, new __VLS_183({}));
var __VLS_185 = __VLS_184.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_184), false));
var __VLS_188 = __VLS_186.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
// @ts-ignore
[];
var __VLS_186;
if (__VLS_ctx.inlineResult) {
    var __VLS_189 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_190 = __VLS_asFunctionalComponent1(__VLS_189, new __VLS_189({}));
    var __VLS_191 = __VLS_190.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_190), false));
    var __VLS_194 = __VLS_192.slots.default;
    var __VLS_195 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_196 = __VLS_asFunctionalComponent1(__VLS_195, new __VLS_195(__assign({ class: "bg-info text-white" }, { rounded: true })));
    var __VLS_197 = __VLS_196.apply(void 0, __spreadArray([__assign({ class: "bg-info text-white" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_196), false));
    /** @type {__VLS_StyleScopedClasses['bg-info']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_200 = __VLS_198.slots.default;
    {
        var __VLS_201 = __VLS_198.slots.avatar;
        var __VLS_202 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_203 = __VLS_asFunctionalComponent1(__VLS_202, new __VLS_202({
            name: "qr_code",
        }));
        var __VLS_204 = __VLS_203.apply(void 0, __spreadArray([{
                name: "qr_code",
            }], __VLS_functionalComponentArgsRest(__VLS_203), false));
        // @ts-ignore
        [inlineResult,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption q-mt-xs" }, { style: {} }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    (__VLS_ctx.inlineResult);
    // @ts-ignore
    [inlineResult,];
    var __VLS_198;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    if (__VLS_ctx.isUrl(__VLS_ctx.inlineResult)) {
        var __VLS_207 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_208 = __VLS_asFunctionalComponent1(__VLS_207, new __VLS_207(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "open_in_new", label: "Mở link" }), { class: "full-width" })));
        var __VLS_209 = __VLS_208.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "open_in_new", label: "Mở link" }), { class: "full-width" })], __VLS_functionalComponentArgsRest(__VLS_208), false));
        var __VLS_212 = void 0;
        var __VLS_213 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.inlineResult))
                        return;
                    if (!(__VLS_ctx.isUrl(__VLS_ctx.inlineResult)))
                        return;
                    __VLS_ctx.openUrl(__VLS_ctx.inlineResult);
                    // @ts-ignore
                    [inlineResult, inlineResult, isUrl, openUrl,];
                } });
        /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
        var __VLS_210;
        var __VLS_211;
    }
    var __VLS_214 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_215 = __VLS_asFunctionalComponent1(__VLS_214, new __VLS_214(__assign(__assign({ 'onClick': {} }, { outline: true, color: "grey-7", icon: "content_copy", label: "Sao chép" }), { class: "full-width q-mt-sm" })));
    var __VLS_216 = __VLS_215.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { outline: true, color: "grey-7", icon: "content_copy", label: "Sao chép" }), { class: "full-width q-mt-sm" })], __VLS_functionalComponentArgsRest(__VLS_215), false));
    var __VLS_219 = void 0;
    var __VLS_220 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.inlineResult))
                    return;
                __VLS_ctx.copyToClipboard(__VLS_ctx.inlineResult);
                // @ts-ignore
                [inlineResult, copyToClipboard,];
            } });
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    var __VLS_217;
    var __VLS_218;
    // @ts-ignore
    [];
    var __VLS_192;
}
else {
    var __VLS_221 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_222 = __VLS_asFunctionalComponent1(__VLS_221, new __VLS_221({}));
    var __VLS_223 = __VLS_222.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_222), false));
    var __VLS_226 = __VLS_224.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey-6 q-py-lg" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-lg']} */ ;
    var __VLS_227 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_228 = __VLS_asFunctionalComponent1(__VLS_227, new __VLS_227({
        name: "qr_code_scanner",
        size: "48px",
    }));
    var __VLS_229 = __VLS_228.apply(void 0, __spreadArray([{
            name: "qr_code_scanner",
            size: "48px",
        }], __VLS_functionalComponentArgsRest(__VLS_228), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    // @ts-ignore
    [];
    var __VLS_224;
}
// @ts-ignore
[];
var __VLS_180;
// @ts-ignore
[];
var __VLS_135;
var __VLS_232;
/** @ts-ignore @type {typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel | typeof __VLS_components.qTabPanel | typeof __VLS_components.QTabPanel} */
qTabPanel;
// @ts-ignore
var __VLS_233 = __VLS_asFunctionalComponent1(__VLS_232, new __VLS_232({
    name: "history",
}));
var __VLS_234 = __VLS_233.apply(void 0, __spreadArray([{
        name: "history",
    }], __VLS_functionalComponentArgsRest(__VLS_233), false));
var __VLS_237 = __VLS_235.slots.default;
var __VLS_238;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_239 = __VLS_asFunctionalComponent1(__VLS_238, new __VLS_238({
    bordered: true,
}));
var __VLS_240 = __VLS_239.apply(void 0, __spreadArray([{
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_239), false));
var __VLS_243 = __VLS_241.slots.default;
var __VLS_244;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_245 = __VLS_asFunctionalComponent1(__VLS_244, new __VLS_244({}));
var __VLS_246 = __VLS_245.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_245), false));
var __VLS_249 = __VLS_247.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
var __VLS_250;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_251 = __VLS_asFunctionalComponent1(__VLS_250, new __VLS_250({}));
var __VLS_252 = __VLS_251.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_251), false));
if (__VLS_ctx.scanHistory.length > 0) {
    var __VLS_255 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_256 = __VLS_asFunctionalComponent1(__VLS_255, new __VLS_255(__assign({ 'onClick': {} }, { flat: true, color: "negative", icon: "delete_sweep", label: "Xóa tất cả" })));
    var __VLS_257 = __VLS_256.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, color: "negative", icon: "delete_sweep", label: "Xóa tất cả" })], __VLS_functionalComponentArgsRest(__VLS_256), false));
    var __VLS_260 = void 0;
    var __VLS_261 = ({ click: {} },
        { onClick: (__VLS_ctx.clearHistory) });
    var __VLS_258;
    var __VLS_259;
}
// @ts-ignore
[clearHistory, scanHistory,];
var __VLS_247;
if (__VLS_ctx.scanHistory.length === 0) {
    var __VLS_262 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_263 = __VLS_asFunctionalComponent1(__VLS_262, new __VLS_262({}));
    var __VLS_264 = __VLS_263.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_263), false));
    var __VLS_267 = __VLS_265.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey-6 q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_268 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_269 = __VLS_asFunctionalComponent1(__VLS_268, new __VLS_268({
        name: "history",
        size: "64px",
    }));
    var __VLS_270 = __VLS_269.apply(void 0, __spreadArray([{
            name: "history",
            size: "64px",
        }], __VLS_functionalComponentArgsRest(__VLS_269), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    // @ts-ignore
    [scanHistory,];
    var __VLS_265;
}
else {
    var __VLS_273 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_274 = __VLS_asFunctionalComponent1(__VLS_273, new __VLS_273({
        separator: true,
    }));
    var __VLS_275 = __VLS_274.apply(void 0, __spreadArray([{
            separator: true,
        }], __VLS_functionalComponentArgsRest(__VLS_274), false));
    var __VLS_278 = __VLS_276.slots.default;
    var _loop_1 = function (item, index) {
        var __VLS_279 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_280 = __VLS_asFunctionalComponent1(__VLS_279, new __VLS_279(__assign({ 'onClick': {} }, { key: (index), clickable: true })));
        var __VLS_281 = __VLS_280.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { key: (index), clickable: true })], __VLS_functionalComponentArgsRest(__VLS_280), false));
        var __VLS_284 = void 0;
        var __VLS_285 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.scanHistory.length === 0))
                        return;
                    __VLS_ctx.copyToClipboard(item.value);
                    // @ts-ignore
                    [copyToClipboard, scanHistory,];
                } });
        var __VLS_286 = __VLS_282.slots.default;
        var __VLS_287 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_288 = __VLS_asFunctionalComponent1(__VLS_287, new __VLS_287({
            avatar: true,
        }));
        var __VLS_289 = __VLS_288.apply(void 0, __spreadArray([{
                avatar: true,
            }], __VLS_functionalComponentArgsRest(__VLS_288), false));
        var __VLS_292 = __VLS_290.slots.default;
        var __VLS_293 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_294 = __VLS_asFunctionalComponent1(__VLS_293, new __VLS_293({
            color: (__VLS_ctx.getTypeColor(item.type)),
            textColor: "white",
            size: "40px",
        }));
        var __VLS_295 = __VLS_294.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.getTypeColor(item.type)),
                textColor: "white",
                size: "40px",
            }], __VLS_functionalComponentArgsRest(__VLS_294), false));
        var __VLS_298 = __VLS_296.slots.default;
        var __VLS_299 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_300 = __VLS_asFunctionalComponent1(__VLS_299, new __VLS_299({
            name: (__VLS_ctx.getTypeIcon(item.type)),
        }));
        var __VLS_301 = __VLS_300.apply(void 0, __spreadArray([{
                name: (__VLS_ctx.getTypeIcon(item.type)),
            }], __VLS_functionalComponentArgsRest(__VLS_300), false));
        // @ts-ignore
        [getTypeColor, getTypeIcon,];
        // @ts-ignore
        [];
        var __VLS_304 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_305 = __VLS_asFunctionalComponent1(__VLS_304, new __VLS_304({}));
        var __VLS_306 = __VLS_305.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_305), false));
        var __VLS_309 = __VLS_307.slots.default;
        var __VLS_310 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_311 = __VLS_asFunctionalComponent1(__VLS_310, new __VLS_310(__assign({ lines: "1" }, { style: {} })));
        var __VLS_312 = __VLS_311.apply(void 0, __spreadArray([__assign({ lines: "1" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_311), false));
        var __VLS_315 = __VLS_313.slots.default;
        (item.value);
        // @ts-ignore
        [];
        var __VLS_316 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_317 = __VLS_asFunctionalComponent1(__VLS_316, new __VLS_316({
            caption: true,
        }));
        var __VLS_318 = __VLS_317.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_317), false));
        var __VLS_321 = __VLS_319.slots.default;
        (item.type);
        (__VLS_ctx.formatTime(item.timestamp));
        // @ts-ignore
        [formatTime,];
        // @ts-ignore
        [];
        var __VLS_322 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_323 = __VLS_asFunctionalComponent1(__VLS_322, new __VLS_322({
            side: true,
        }));
        var __VLS_324 = __VLS_323.apply(void 0, __spreadArray([{
                side: true,
            }], __VLS_functionalComponentArgsRest(__VLS_323), false));
        var __VLS_327 = __VLS_325.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-gutter-xs" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
        if (item.type === 'URL') {
            var __VLS_328 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
            qBtn;
            // @ts-ignore
            var __VLS_329 = __VLS_asFunctionalComponent1(__VLS_328, new __VLS_328(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "open_in_new" })));
            var __VLS_330 = __VLS_329.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "open_in_new" })], __VLS_functionalComponentArgsRest(__VLS_329), false));
            var __VLS_333 = void 0;
            var __VLS_334 = ({ click: {} },
                { onClick: function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!!(__VLS_ctx.scanHistory.length === 0))
                            return;
                        if (!(item.type === 'URL'))
                            return;
                        __VLS_ctx.openUrl(item.value);
                        // @ts-ignore
                        [openUrl,];
                    } });
        }
        var __VLS_335 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_336 = __VLS_asFunctionalComponent1(__VLS_335, new __VLS_335(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "content_copy" })));
        var __VLS_337 = __VLS_336.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "content_copy" })], __VLS_functionalComponentArgsRest(__VLS_336), false));
        var __VLS_340 = void 0;
        var __VLS_341 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.scanHistory.length === 0))
                        return;
                    __VLS_ctx.copyToClipboard(item.value);
                    // @ts-ignore
                    [copyToClipboard,];
                } });
        var __VLS_342 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_343 = __VLS_asFunctionalComponent1(__VLS_342, new __VLS_342(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "delete", color: "negative" })));
        var __VLS_344 = __VLS_343.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "delete", color: "negative" })], __VLS_functionalComponentArgsRest(__VLS_343), false));
        var __VLS_347 = void 0;
        var __VLS_348 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!!(__VLS_ctx.scanHistory.length === 0))
                        return;
                    __VLS_ctx.removeFromHistory(index);
                    // @ts-ignore
                    [removeFromHistory,];
                } });
        // @ts-ignore
        [];
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_296, __VLS_290, __VLS_313, __VLS_319, __VLS_307, __VLS_331, __VLS_332, __VLS_338, __VLS_339, __VLS_345, __VLS_346, __VLS_325, __VLS_282, __VLS_283;
    for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.scanHistory)); _i < _a.length; _i++) {
        var _b = _a[_i], item = _b[0], index = _b[1];
        _loop_1(item, index);
    }
    // @ts-ignore
    [];
    var __VLS_276;
}
// @ts-ignore
[];
var __VLS_241;
// @ts-ignore
[];
var __VLS_235;
// @ts-ignore
[];
var __VLS_34;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
