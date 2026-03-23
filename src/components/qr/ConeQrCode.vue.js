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
var qrcode_1 = require("qrcode");
var qr_label_1 = require("@/types/qr-label");
var props = withDefaults(defineProps(), {
    size: 'medium',
    showText: false,
    width: undefined,
});
var qrDataUrl = (0, vue_1.ref)('');
var error = (0, vue_1.ref)(null);
var loading = (0, vue_1.ref)(false);
var computedSize = function () {
    if (props.width)
        return props.width;
    return qr_label_1.QR_SIZE_MAP[props.size];
};
var generateQR = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!props.coneId) {
                    qrDataUrl.value = '';
                    return [2 /*return*/];
                }
                loading.value = true;
                error.value = null;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, 4, 5]);
                _a = qrDataUrl;
                return [4 /*yield*/, qrcode_1.default.toDataURL(props.coneId, {
                        width: computedSize(),
                        margin: 1,
                        errorCorrectionLevel: 'M',
                        color: {
                            dark: '#000000',
                            light: '#ffffff',
                        },
                    })];
            case 2:
                _a.value = _b.sent();
                return [3 /*break*/, 5];
            case 3:
                err_1 = _b.sent();
                error.value = 'Không thể tạo mã QR';
                console.error('QR generation error:', err_1);
                return [3 /*break*/, 5];
            case 4:
                loading.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
(0, vue_1.onMounted)(generateQR);
(0, vue_1.watch)(function () { return props.coneId; }, generateQR);
(0, vue_1.watch)(function () { return props.size; }, generateQR);
(0, vue_1.watch)(function () { return props.width; }, generateQR);
var __VLS_defaults = {
    size: 'medium',
    showText: false,
    width: undefined,
};
var __VLS_ctx = __assign(__assign(__assign(__assign({}, {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cone-qr-code" }));
/** @type {__VLS_StyleScopedClasses['cone-qr-code']} */ ;
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-placeholder" }, { style: ({ width: "".concat(__VLS_ctx.computedSize(), "px"), height: "".concat(__VLS_ctx.computedSize(), "px") }) }));
    /** @type {__VLS_StyleScopedClasses['qr-placeholder']} */ ;
    var __VLS_0 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
    qSpinner;
    // @ts-ignore
    var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        color: "primary",
        size: "24px",
    }));
    var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
            color: "primary",
            size: "24px",
        }], __VLS_functionalComponentArgsRest(__VLS_1), false));
}
else if (__VLS_ctx.error || !__VLS_ctx.coneId) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-placeholder qr-error" }, { style: ({ width: "".concat(__VLS_ctx.computedSize(), "px"), height: "".concat(__VLS_ctx.computedSize(), "px") }) }));
    /** @type {__VLS_StyleScopedClasses['qr-placeholder']} */ ;
    /** @type {__VLS_StyleScopedClasses['qr-error']} */ ;
    var __VLS_5 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
        name: "qr_code_2",
        size: "32px",
        color: "grey-5",
    }));
    var __VLS_7 = __VLS_6.apply(void 0, __spreadArray([{
            name: "qr_code_2",
            size: "32px",
            color: "grey-5",
        }], __VLS_functionalComponentArgsRest(__VLS_6), false));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.img)(__assign(__assign({ src: (__VLS_ctx.qrDataUrl), alt: ("QR: ".concat(__VLS_ctx.coneId)) }, { class: "qr-image" }), { width: (__VLS_ctx.computedSize()), height: (__VLS_ctx.computedSize()) }));
    /** @type {__VLS_StyleScopedClasses['qr-image']} */ ;
    if (__VLS_ctx.showText) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "qr-text text-caption text-center" }));
        /** @type {__VLS_StyleScopedClasses['qr-text']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        (__VLS_ctx.coneId);
    }
}
// @ts-ignore
[loading, computedSize, computedSize, computedSize, computedSize, computedSize, computedSize, error, coneId, coneId, coneId, qrDataUrl, showText,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
