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
var useAuth_1 = require("@/composables/useAuth");
var props = withDefaults(defineProps(), {
    modelValue: false,
    currentPassword: null,
});
var emit = defineEmits();
var changePassword = (0, useAuth_1.useAuth)().changePassword;
var formRef = (0, vue_1.ref)();
var loading = (0, vue_1.ref)(false);
var showNewPassword = (0, vue_1.ref)(false);
var showConfirmPassword = (0, vue_1.ref)(false);
var needsCurrentPasswordInput = (0, vue_1.computed)(function () { return !props.currentPassword; });
var form = (0, vue_1.reactive)({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
});
var rules = {
    required: function (val) { return !!val || 'Trường này là bắt buộc'; },
    minLength: function (val) { return !val || val.length >= 8 || 'Mật khẩu phải có ít nhất 8 ký tự'; },
    confirmMatch: function (val) { return val === form.newPassword || 'Mật khẩu xác nhận không khớp'; },
};
function resetForm() {
    var _a;
    form.currentPassword = '';
    form.newPassword = '';
    form.confirmPassword = '';
    showNewPassword.value = false;
    showConfirmPassword.value = false;
    (_a = formRef.value) === null || _a === void 0 ? void 0 : _a.resetValidation();
}
(0, vue_1.watch)(function () { return props.modelValue; }, function (val) {
    if (val)
        resetForm();
});
function onSubmit() {
    return __awaiter(this, void 0, void 0, function () {
        var currentPassword, success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    loading.value = true;
                    currentPassword = props.currentPassword || form.currentPassword;
                    return [4 /*yield*/, changePassword({
                            currentPassword: currentPassword,
                            newPassword: form.newPassword,
                            confirmPassword: form.confirmPassword,
                        })];
                case 1:
                    success = _a.sent();
                    if (success) {
                        emit('update:modelValue', false);
                        emit('changed');
                    }
                    loading.value = false;
                    return [2 /*return*/];
            }
        });
    });
}
var __VLS_defaults = {
    modelValue: false,
    currentPassword: null,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.modelValue),
    persistent: true,
    noEscDismiss: true,
    noBackdropDismiss: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.modelValue),
        persistent: true,
        noEscDismiss: true,
        noBackdropDismiss: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ style: {} })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qForm | typeof __VLS_components.QForm | typeof __VLS_components.qForm | typeof __VLS_components.QForm} */
qForm;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13(__assign({ 'onSubmit': {} }, { ref: "formRef" })));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([__assign({ 'onSubmit': {} }, { ref: "formRef" })], __VLS_functionalComponentArgsRest(__VLS_14), false));
var __VLS_18;
var __VLS_19 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.onSubmit) });
var __VLS_20 = {};
var __VLS_22 = __VLS_16.slots.default;
var __VLS_23;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23(__assign({ class: "row items-center q-pb-none" })));
var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_24), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_28 = __VLS_26.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
// @ts-ignore
[modelValue, onSubmit,];
var __VLS_26;
var __VLS_29;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29(__assign({ class: "q-pt-md q-gutter-md" })));
var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([__assign({ class: "q-pt-md q-gutter-md" })], __VLS_functionalComponentArgsRest(__VLS_30), false));
/** @type {__VLS_StyleScopedClasses['q-pt-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_34 = __VLS_32.slots.default;
var __VLS_35;
/** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
qBanner;
// @ts-ignore
var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign({ class: "bg-warning text-white" }, { rounded: true })));
var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign({ class: "bg-warning text-white" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_36), false));
/** @type {__VLS_StyleScopedClasses['bg-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
var __VLS_40 = __VLS_38.slots.default;
{
    var __VLS_41 = __VLS_38.slots.avatar;
    var __VLS_42 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
        name: "warning",
    }));
    var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{
            name: "warning",
        }], __VLS_functionalComponentArgsRest(__VLS_43), false));
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_38;
if (__VLS_ctx.needsCurrentPasswordInput) {
    var __VLS_47 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppInput} */
    AppInput;
    // @ts-ignore
    var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
        modelValue: (__VLS_ctx.form.currentPassword),
        label: "Mật khẩu hiện tại",
        type: "password",
        prependIcon: "lock",
        rules: ([__VLS_ctx.rules.required]),
        autocomplete: "current-password",
    }));
    var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.form.currentPassword),
            label: "Mật khẩu hiện tại",
            type: "password",
            prependIcon: "lock",
            rules: ([__VLS_ctx.rules.required]),
            autocomplete: "current-password",
        }], __VLS_functionalComponentArgsRest(__VLS_48), false));
}
var __VLS_52;
/** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
    modelValue: (__VLS_ctx.form.newPassword),
    label: "Mật khẩu mới",
    type: (__VLS_ctx.showNewPassword ? 'text' : 'password'),
    prependIcon: "lock_reset",
    rules: ([__VLS_ctx.rules.required, __VLS_ctx.rules.minLength]),
    autocomplete: "new-password",
}));
var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.newPassword),
        label: "Mật khẩu mới",
        type: (__VLS_ctx.showNewPassword ? 'text' : 'password'),
        prependIcon: "lock_reset",
        rules: ([__VLS_ctx.rules.required, __VLS_ctx.rules.minLength]),
        autocomplete: "new-password",
    }], __VLS_functionalComponentArgsRest(__VLS_53), false));
var __VLS_57 = __VLS_55.slots.default;
{
    var __VLS_58 = __VLS_55.slots.append;
    var __VLS_59 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59(__assign(__assign({ 'onClick': {} }, { name: (__VLS_ctx.showNewPassword ? 'visibility_off' : 'visibility') }), { class: "cursor-pointer" })));
    var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { name: (__VLS_ctx.showNewPassword ? 'visibility_off' : 'visibility') }), { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_60), false));
    var __VLS_64 = void 0;
    var __VLS_65 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.showNewPassword = !__VLS_ctx.showNewPassword;
                // @ts-ignore
                [needsCurrentPasswordInput, form, form, rules, rules, rules, showNewPassword, showNewPassword, showNewPassword, showNewPassword,];
            } });
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_62;
    var __VLS_63;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_55;
var __VLS_66;
/** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
    modelValue: (__VLS_ctx.form.confirmPassword),
    label: "Xác nhận mật khẩu mới",
    type: (__VLS_ctx.showConfirmPassword ? 'text' : 'password'),
    prependIcon: "lock_reset",
    rules: ([__VLS_ctx.rules.required, __VLS_ctx.rules.confirmMatch]),
    autocomplete: "new-password",
}));
var __VLS_68 = __VLS_67.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.confirmPassword),
        label: "Xác nhận mật khẩu mới",
        type: (__VLS_ctx.showConfirmPassword ? 'text' : 'password'),
        prependIcon: "lock_reset",
        rules: ([__VLS_ctx.rules.required, __VLS_ctx.rules.confirmMatch]),
        autocomplete: "new-password",
    }], __VLS_functionalComponentArgsRest(__VLS_67), false));
var __VLS_71 = __VLS_69.slots.default;
{
    var __VLS_72 = __VLS_69.slots.append;
    var __VLS_73 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73(__assign(__assign({ 'onClick': {} }, { name: (__VLS_ctx.showConfirmPassword ? 'visibility_off' : 'visibility') }), { class: "cursor-pointer" })));
    var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { name: (__VLS_ctx.showConfirmPassword ? 'visibility_off' : 'visibility') }), { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_74), false));
    var __VLS_78 = void 0;
    var __VLS_79 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.showConfirmPassword = !__VLS_ctx.showConfirmPassword;
                // @ts-ignore
                [form, rules, rules, showConfirmPassword, showConfirmPassword, showConfirmPassword, showConfirmPassword,];
            } });
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_76;
    var __VLS_77;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_69;
// @ts-ignore
[];
var __VLS_32;
var __VLS_80;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80(__assign({ align: "right" }, { class: "text-primary q-pa-md" })));
var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "text-primary q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_81), false));
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_85 = __VLS_83.slots.default;
var __VLS_86;
/** @ts-ignore @type {typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
    type: "submit",
    label: "Đổi mật khẩu",
    color: "primary",
    loading: (__VLS_ctx.loading),
}));
var __VLS_88 = __VLS_87.apply(void 0, __spreadArray([{
        type: "submit",
        label: "Đổi mật khẩu",
        color: "primary",
        loading: (__VLS_ctx.loading),
    }], __VLS_functionalComponentArgsRest(__VLS_87), false));
// @ts-ignore
[loading,];
var __VLS_83;
// @ts-ignore
[];
var __VLS_16;
var __VLS_17;
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_21 = __VLS_20;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
