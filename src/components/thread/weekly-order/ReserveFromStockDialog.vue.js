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
var weeklyOrderService_1 = require("@/services/weeklyOrderService");
var useSnackbar_1 = require("@/composables/useSnackbar");
var AppDialog_vue_1 = require("@/components/ui/dialogs/AppDialog.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var props = defineProps();
var emit = defineEmits();
var snackbar = (0, useSnackbar_1.useSnackbar)();
var loading = (0, vue_1.ref)(false);
var form = (0, vue_1.ref)({
    quantity: 0,
    reason: '',
});
var maxQuantity = (0, vue_1.computed)(function () {
    if (!props.summaryItem)
        return 0;
    return Math.min(props.summaryItem.shortage, props.summaryItem.available_stock);
});
var isValid = (0, vue_1.computed)(function () {
    return form.value.quantity > 0 && form.value.quantity <= maxQuantity.value;
});
var resetForm = function () {
    form.value = {
        quantity: maxQuantity.value,
        reason: '',
    };
};
var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isValid.value || !props.summaryItem)
                    return [2 /*return*/];
                loading.value = true;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.reserveFromStock(props.weekId, {
                        thread_type_id: props.summaryItem.thread_type_id,
                        quantity: form.value.quantity,
                        reason: form.value.reason || undefined,
                    })];
            case 2:
                result = _a.sent();
                snackbar.success("\u0110\u00E3 l\u1EA5y ".concat(result.reserved, " cu\u1ED9n t\u1EEB t\u1ED3n kho"));
                emit('reserved', result.reserved);
                resetForm();
                return [3 /*break*/, 5];
            case 3:
                err_1 = _a.sent();
                snackbar.error((err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || 'Không thể lấy từ tồn kho');
                return [3 /*break*/, 5];
            case 4:
                loading.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
(0, vue_1.watch)(function () { return props.modelValue; }, function (val) {
    if (val) {
        resetForm();
    }
});
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = AppDialog_vue_1.default || AppDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$emit('update:modelValue', $event);
            // @ts-ignore
            [modelValue, $emit,];
        } });
var __VLS_7 = {};
var __VLS_8 = __VLS_3.slots.default;
{
    var __VLS_9 = __VLS_3.slots.header;
    // @ts-ignore
    [];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
if (__VLS_ctx.summaryItem) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-grey-7 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    (__VLS_ctx.threadTypeName);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-negative text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.summaryItem.shortage);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-positive text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.summaryItem.available_stock);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.maxQuantity);
}
var __VLS_10;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({}));
var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_11), false));
var __VLS_15 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    modelValue: (__VLS_ctx.form.quantity),
    modelModifiers: { number: true, },
    label: "Số lượng lấy *",
    type: "number",
    min: (1),
    max: (__VLS_ctx.maxQuantity),
    rules: ([
        function (val) { return val > 0 || 'Số lượng phải lớn hơn 0'; },
        function (val) { return val <= __VLS_ctx.maxQuantity || "T\u1ED1i \u0111a ".concat(__VLS_ctx.maxQuantity, " cu\u1ED9n"); }
    ]),
}));
var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.quantity),
        modelModifiers: { number: true, },
        label: "Số lượng lấy *",
        type: "number",
        min: (1),
        max: (__VLS_ctx.maxQuantity),
        rules: ([
            function (val) { return val > 0 || 'Số lượng phải lớn hơn 0'; },
            function (val) { return val <= __VLS_ctx.maxQuantity || "T\u1ED1i \u0111a ".concat(__VLS_ctx.maxQuantity, " cu\u1ED9n"); }
        ]),
    }], __VLS_functionalComponentArgsRest(__VLS_16), false));
var __VLS_20 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    modelValue: (__VLS_ctx.form.reason),
    label: "Lý do (tùy chọn)",
    type: "textarea",
    autogrow: true,
}));
var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.reason),
        label: "Lý do (tùy chọn)",
        type: "textarea",
        autogrow: true,
    }], __VLS_functionalComponentArgsRest(__VLS_21), false));
{
    var __VLS_25 = __VLS_3.slots.actions;
    var __VLS_26 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
        flat: true,
        label: "Hủy",
        disable: (__VLS_ctx.loading),
    }));
    var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{
            flat: true,
            label: "Hủy",
            disable: (__VLS_ctx.loading),
        }], __VLS_functionalComponentArgsRest(__VLS_27), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    var __VLS_31 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31(__assign({ 'onClick': {} }, { color: "primary", label: "Xác nhận", loading: (__VLS_ctx.loading), disable: (!__VLS_ctx.isValid) })));
    var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Xác nhận", loading: (__VLS_ctx.loading), disable: (!__VLS_ctx.isValid) })], __VLS_functionalComponentArgsRest(__VLS_32), false));
    var __VLS_36 = void 0;
    var __VLS_37 = ({ click: {} },
        { onClick: (__VLS_ctx.handleSubmit) });
    var __VLS_34;
    var __VLS_35;
    // @ts-ignore
    [summaryItem, summaryItem, summaryItem, threadTypeName, maxQuantity, maxQuantity, maxQuantity, maxQuantity, form, form, loading, loading, vClosePopup, isValid, handleSubmit,];
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
