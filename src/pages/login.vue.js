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
var vue_router_1 = require("vue-router");
var useAuth_1 = require("@/composables/useAuth");
definePage({
    meta: {
        public: true, // Public route - no auth required
        title: 'Đăng nhập',
    },
});
var router = (0, vue_router_1.useRouter)();
var route = (0, vue_router_1.useRoute)();
var _a = (0, useAuth_1.useAuth)(), signIn = _a.signIn, isLoading = _a.isLoading, authError = _a.error, employee = _a.employee;
var form = (0, vue_1.reactive)({
    employeeId: '',
    password: '',
});
var showPassword = (0, vue_1.ref)(false);
var rememberMe = (0, vue_1.ref)(true);
// Validation rules
var required = function (val) { return !!val || 'Trường này là bắt buộc'; };
function handleLogin() {
    return __awaiter(this, void 0, void 0, function () {
        var success, redirect;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, signIn({
                        employeeId: form.employeeId,
                        password: form.password,
                    })];
                case 1:
                    success = _b.sent();
                    if (success) {
                        if ((_a = employee.value) === null || _a === void 0 ? void 0 : _a.mustChangePassword) {
                            return [2 /*return*/];
                        }
                        redirect = route.query.redirect;
                        router.push((redirect === null || redirect === void 0 ? void 0 : redirect.startsWith('/')) && !redirect.startsWith('//') ? redirect : '/');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPage | typeof __VLS_components.QPage | typeof __VLS_components.qPage | typeof __VLS_components.QPage} */
qPage;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ class: "flex flex-center bg-grey-2" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ class: "flex flex-center bg-grey-2" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ class: "login-card q-pa-lg" }, { style: {} })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ class: "login-card q-pa-lg" }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_8), false));
/** @type {__VLS_StyleScopedClasses['login-card']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
var __VLS_12 = __VLS_10.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-mb-lg" }));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({
    name: "inventory_2",
    size: "64px",
    color: "primary",
}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{
        name: "inventory_2",
        size: "64px",
        color: "primary",
    }], __VLS_functionalComponentArgsRest(__VLS_14), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)(__assign({ class: "text-h5 q-mt-md q-mb-none" }));
/** @type {__VLS_StyleScopedClasses['text-h5']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-none']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)(__assign({ class: "text-grey-7" }));
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
var __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.qForm | typeof __VLS_components.QForm | typeof __VLS_components.qForm | typeof __VLS_components.QForm} */
qForm;
// @ts-ignore
var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18(__assign({ 'onSubmit': {} }, { class: "q-gutter-md" })));
var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([__assign({ 'onSubmit': {} }, { class: "q-gutter-md" })], __VLS_functionalComponentArgsRest(__VLS_19), false));
var __VLS_23;
var __VLS_24 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleLogin) });
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_25 = __VLS_21.slots.default;
var __VLS_26;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
    modelValue: (__VLS_ctx.form.employeeId),
    label: "Mã Nhân Viên",
    prependIcon: "badge",
    rules: ([__VLS_ctx.required]),
    autocomplete: "username",
    hint: "Ví dụ: NV001",
}));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.employeeId),
        label: "Mã Nhân Viên",
        prependIcon: "badge",
        rules: ([__VLS_ctx.required]),
        autocomplete: "username",
        hint: "Ví dụ: NV001",
    }], __VLS_functionalComponentArgsRest(__VLS_27), false));
var __VLS_31;
/** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
    modelValue: (__VLS_ctx.form.password),
    label: "Mật khẩu",
    type: (__VLS_ctx.showPassword ? 'text' : 'password'),
    prependIcon: "lock",
    rules: ([__VLS_ctx.required]),
    autocomplete: "current-password",
}));
var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.password),
        label: "Mật khẩu",
        type: (__VLS_ctx.showPassword ? 'text' : 'password'),
        prependIcon: "lock",
        rules: ([__VLS_ctx.required]),
        autocomplete: "current-password",
    }], __VLS_functionalComponentArgsRest(__VLS_32), false));
var __VLS_36 = __VLS_34.slots.default;
{
    var __VLS_37 = __VLS_34.slots.append;
    var __VLS_38 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38(__assign(__assign({ 'onClick': {} }, { name: (__VLS_ctx.showPassword ? 'visibility_off' : 'visibility') }), { class: "cursor-pointer" })));
    var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { name: (__VLS_ctx.showPassword ? 'visibility_off' : 'visibility') }), { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_39), false));
    var __VLS_43 = void 0;
    var __VLS_44 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                __VLS_ctx.showPassword = !__VLS_ctx.showPassword;
                // @ts-ignore
                [handleLogin, form, form, required, required, showPassword, showPassword, showPassword, showPassword,];
            } });
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_41;
    var __VLS_42;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_34;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
var __VLS_45;
/** @ts-ignore @type {typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox} */
qCheckbox;
// @ts-ignore
var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
    modelValue: (__VLS_ctx.rememberMe),
    label: "Ghi nhớ đăng nhập",
    dense: true,
}));
var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.rememberMe),
        label: "Ghi nhớ đăng nhập",
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_46), false));
var __VLS_50;
/** @ts-ignore @type {typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50(__assign(__assign({ type: "submit", label: "Đăng nhập", color: "primary", loading: (__VLS_ctx.isLoading) }, { class: "full-width" }), { size: "lg" })));
var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([__assign(__assign({ type: "submit", label: "Đăng nhập", color: "primary", loading: (__VLS_ctx.isLoading) }, { class: "full-width" }), { size: "lg" })], __VLS_functionalComponentArgsRest(__VLS_51), false));
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
// @ts-ignore
[rememberMe, isLoading,];
var __VLS_21;
var __VLS_22;
if (__VLS_ctx.authError) {
    var __VLS_55 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
    qBanner;
    // @ts-ignore
    var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55(__assign({ class: "q-mt-md bg-negative text-white" }, { rounded: true })));
    var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([__assign({ class: "q-mt-md bg-negative text-white" }, { rounded: true })], __VLS_functionalComponentArgsRest(__VLS_56), false));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['bg-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
    var __VLS_60 = __VLS_58.slots.default;
    {
        var __VLS_61 = __VLS_58.slots.avatar;
        var __VLS_62 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
            name: "error",
        }));
        var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([{
                name: "error",
            }], __VLS_functionalComponentArgsRest(__VLS_63), false));
        // @ts-ignore
        [authError,];
    }
    (__VLS_ctx.authError);
    // @ts-ignore
    [authError,];
    var __VLS_58;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-mt-md text-grey-6 text-caption" }));
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
