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
var AppDialog_vue_1 = require("@/components/ui/dialogs/AppDialog.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var useScale_1 = require("@/composables/hardware/useScale");
var __VLS_props = defineProps();
var emit = defineEmits();
var scale = (0, useScale_1.useScale)();
var handleConnect = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, scale.connect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var handleDisconnect = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, scale.disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var handleUseManual = function () {
    emit('use-manual');
    emit('update:modelValue', false);
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = AppDialog_vue_1.default || AppDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), title: "Kết nối cân điện tử", maxWidth: "400px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), title: "Kết nối cân điện tử", maxWidth: "400px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (function (val) { return __VLS_ctx.emit('update:modelValue', val); }) });
var __VLS_7 = {};
var __VLS_8 = __VLS_3.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column items-center q-gutter-md q-pa-md" }));
/** @type {__VLS_StyleScopedClasses['column']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "status-indicator" }));
/** @type {__VLS_StyleScopedClasses['status-indicator']} */ ;
var __VLS_9;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
    name: (__VLS_ctx.scale.isConnected.value ? 'sensors' : 'sensors_off'),
    color: (__VLS_ctx.scale.isConnected.value ? 'positive' : 'grey-5'),
    size: "64px",
}));
var __VLS_11 = __VLS_10.apply(void 0, __spreadArray([{
        name: (__VLS_ctx.scale.isConnected.value ? 'sensors' : 'sensors_off'),
        color: (__VLS_ctx.scale.isConnected.value ? 'positive' : 'grey-5'),
        size: "64px",
    }], __VLS_functionalComponentArgsRest(__VLS_10), false));
var __VLS_14;
/** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
qBadge;
// @ts-ignore
var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14({
    floating: true,
    color: (__VLS_ctx.scale.isConnected.value ? 'positive' : 'negative'),
    rounded: true,
}));
var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([{
        floating: true,
        color: (__VLS_ctx.scale.isConnected.value ? 'positive' : 'negative'),
        rounded: true,
    }], __VLS_functionalComponentArgsRest(__VLS_15), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center" }));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
(__VLS_ctx.scale.isConnected.value ? 'Đã kết nối' : 'Chưa kết nối');
if (__VLS_ctx.scale.error.value) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-negative q-mt-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    (__VLS_ctx.scale.error.value);
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    (__VLS_ctx.scale.isConnected.value ? 'Đang nhận dữ liệu từ cân qua cổng Serial' : 'Vui lòng chọn cổng để kết nối với cân USB');
}
if (__VLS_ctx.scale.isConnected.value) {
    var __VLS_19 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ flat: true, bordered: true }, { class: "full-width bg-grey-2" })));
    var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "full-width bg-grey-2" })], __VLS_functionalComponentArgsRest(__VLS_20), false));
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
    var __VLS_24 = __VLS_22.slots.default;
    var __VLS_25 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25(__assign({ class: "text-center" })));
    var __VLS_27 = __VLS_26.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_26), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_30 = __VLS_28.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-center items-end q-gutter-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-h3 text-mono" }));
    /** @type {__VLS_StyleScopedClasses['text-h3']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-mono']} */ ;
    (__VLS_ctx.scale.currentWeight.value !== null ? __VLS_ctx.scale.currentWeight.value.toFixed(1) : '---.-');
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-h6 text-grey-7 q-mb-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    if (__VLS_ctx.scale.isStable.value) {
        var __VLS_31 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
        qChip;
        // @ts-ignore
        var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
            dense: true,
            color: "positive",
            textColor: "white",
            icon: "check",
            label: "Ổn định",
        }));
        var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([{
                dense: true,
                color: "positive",
                textColor: "white",
                icon: "check",
                label: "Ổn định",
            }], __VLS_functionalComponentArgsRest(__VLS_32), false));
    }
    else {
        var __VLS_36 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
        qChip;
        // @ts-ignore
        var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
            dense: true,
            color: "amber",
            textColor: "black",
            icon: "sync",
            label: "Đang cân...",
        }));
        var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([{
                dense: true,
                color: "amber",
                textColor: "black",
                icon: "sync",
                label: "Đang cân...",
            }], __VLS_functionalComponentArgsRest(__VLS_37), false));
    }
    // @ts-ignore
    [modelValue, emit, scale, scale, scale, scale, scale, scale, scale, scale, scale, scale, scale,];
    var __VLS_28;
    // @ts-ignore
    [];
    var __VLS_22;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column full-width q-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['column']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
if (!__VLS_ctx.scale.isConnected.value) {
    var __VLS_41 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41(__assign({ 'onClick': {} }, { label: "Chọn cổng & Kết nối", color: "primary", icon: "usb", loading: (__VLS_ctx.scale.isConnecting.value) })));
    var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Chọn cổng & Kết nối", color: "primary", icon: "usb", loading: (__VLS_ctx.scale.isConnecting.value) })], __VLS_functionalComponentArgsRest(__VLS_42), false));
    var __VLS_46 = void 0;
    var __VLS_47 = ({ click: {} },
        { onClick: (__VLS_ctx.handleConnect) });
    var __VLS_44;
    var __VLS_45;
}
else {
    var __VLS_48 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48(__assign({ 'onClick': {} }, { label: "Ngắt kết nối", color: "negative", variant: "outlined" })));
    var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Ngắt kết nối", color: "negative", variant: "outlined" })], __VLS_functionalComponentArgsRest(__VLS_49), false));
    var __VLS_53 = void 0;
    var __VLS_54 = ({ click: {} },
        { onClick: (__VLS_ctx.handleDisconnect) });
    var __VLS_51;
    var __VLS_52;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
var __VLS_55;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55(__assign({ 'onClick': {} }, { flat: true, noCaps: true, color: "primary", label: "Sử dụng nhập tay (Fallback)" })));
var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, noCaps: true, color: "primary", label: "Sử dụng nhập tay (Fallback)" })], __VLS_functionalComponentArgsRest(__VLS_56), false));
var __VLS_60;
var __VLS_61 = ({ click: {} },
    { onClick: (__VLS_ctx.handleUseManual) });
var __VLS_58;
var __VLS_59;
{
    var __VLS_62 = __VLS_3.slots["footer-actions"];
    var __VLS_63 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63(__assign({ 'onClick': {} }, { flat: true, label: "Đóng" })));
    var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Đóng" })], __VLS_functionalComponentArgsRest(__VLS_64), false));
    var __VLS_68 = void 0;
    var __VLS_69 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.emit('update:modelValue', false);
                // @ts-ignore
                [emit, scale, scale, handleConnect, handleDisconnect, handleUseManual,];
            } });
    var __VLS_66;
    var __VLS_67;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
