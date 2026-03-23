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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var useAuth_1 = require("@/composables/useAuth");
var _e = (0, useAuth_1.useAuth)(), employee = _e.employee, isAuthenticated = _e.isAuthenticated, signOut = _e.signOut;
var avatarInitials = (0, vue_1.computed)(function () {
    var _a, _b, _c;
    var name = ((_a = employee.value) === null || _a === void 0 ? void 0 : _a.fullName) || '';
    if (!name)
        return '?';
    var parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
        // Vietnamese: last word is first name, first word is family name
        var firstChar = ((_b = parts[0]) === null || _b === void 0 ? void 0 : _b[0]) || '';
        var lastChar = ((_c = parts[parts.length - 1]) === null || _c === void 0 ? void 0 : _c[0]) || '';
        return (firstChar + lastChar).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
});
function handleLogout() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, signOut()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
if (__VLS_ctx.isAuthenticated) {
    var __VLS_0 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ flat: true, dense: true, noCaps: true }, { class: "user-menu-btn" })));
    var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ flat: true, dense: true, noCaps: true }, { class: "user-menu-btn" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
    var __VLS_5 = {};
    /** @type {__VLS_StyleScopedClasses['user-menu-btn']} */ ;
    var __VLS_6 = __VLS_3.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap q-gutter-x-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-xs']} */ ;
    var __VLS_7 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        name: "account_circle",
        size: "28px",
    }));
    var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
            name: "account_circle",
            size: "28px",
        }], __VLS_functionalComponentArgsRest(__VLS_8), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "greeting-text gt-xs" }));
    /** @type {__VLS_StyleScopedClasses['greeting-text']} */ ;
    /** @type {__VLS_StyleScopedClasses['gt-xs']} */ ;
    (((_a = __VLS_ctx.employee) === null || _a === void 0 ? void 0 : _a.fullName) || 'Tài khoản');
    var __VLS_12 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({}));
    var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_13), false));
    var __VLS_17 = __VLS_15.slots.default;
    (((_b = __VLS_ctx.employee) === null || _b === void 0 ? void 0 : _b.fullName) || 'Tài khoản');
    // @ts-ignore
    [isAuthenticated, employee, employee,];
    var __VLS_15;
    var __VLS_18 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qMenu | typeof __VLS_components.QMenu | typeof __VLS_components.qMenu | typeof __VLS_components.QMenu} */
    qMenu;
    // @ts-ignore
    var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({}));
    var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_19), false));
    var __VLS_23 = __VLS_21.slots.default;
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24(__assign({ style: {} })));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_25), false));
    var __VLS_29 = __VLS_27.slots.default;
    var __VLS_30 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30(__assign({ header: true }, { class: "text-weight-bold" })));
    var __VLS_32 = __VLS_31.apply(void 0, __spreadArray([__assign({ header: true }, { class: "text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_31), false));
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    var __VLS_35 = __VLS_33.slots.default;
    // @ts-ignore
    [];
    var __VLS_33;
    var __VLS_36 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({}));
    var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_37), false));
    var __VLS_41 = __VLS_39.slots.default;
    var __VLS_42 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
        avatar: true,
    }));
    var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{
            avatar: true,
        }], __VLS_functionalComponentArgsRest(__VLS_43), false));
    var __VLS_47 = __VLS_45.slots.default;
    var __VLS_48 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
    qAvatar;
    // @ts-ignore
    var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
        color: "primary",
        textColor: "white",
        size: "40px",
    }));
    var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([{
            color: "primary",
            textColor: "white",
            size: "40px",
        }], __VLS_functionalComponentArgsRest(__VLS_49), false));
    var __VLS_53 = __VLS_51.slots.default;
    (__VLS_ctx.avatarInitials);
    // @ts-ignore
    [avatarInitials,];
    var __VLS_51;
    // @ts-ignore
    [];
    var __VLS_45;
    var __VLS_54 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({}));
    var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_55), false));
    var __VLS_59 = __VLS_57.slots.default;
    var __VLS_60 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({}));
    var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_61), false));
    var __VLS_65 = __VLS_63.slots.default;
    (((_c = __VLS_ctx.employee) === null || _c === void 0 ? void 0 : _c.fullName) || 'N/A');
    // @ts-ignore
    [employee,];
    var __VLS_63;
    var __VLS_66 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
        caption: true,
    }));
    var __VLS_68 = __VLS_67.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_67), false));
    var __VLS_71 = __VLS_69.slots.default;
    (((_d = __VLS_ctx.employee) === null || _d === void 0 ? void 0 : _d.employeeId) || '');
    // @ts-ignore
    [employee,];
    var __VLS_69;
    // @ts-ignore
    [];
    var __VLS_57;
    // @ts-ignore
    [];
    var __VLS_39;
    var __VLS_72 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({}));
    var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_73), false));
    var __VLS_77 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77(__assign({ 'onClick': {} }, { clickable: true })));
    var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { clickable: true })], __VLS_functionalComponentArgsRest(__VLS_78), false));
    var __VLS_82 = void 0;
    var __VLS_83 = ({ click: {} },
        { onClick: (__VLS_ctx.handleLogout) });
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    var __VLS_84 = __VLS_80.slots.default;
    var __VLS_85 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({
        avatar: true,
    }));
    var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([{
            avatar: true,
        }], __VLS_functionalComponentArgsRest(__VLS_86), false));
    var __VLS_90 = __VLS_88.slots.default;
    var __VLS_91 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91({
        name: "logout",
        color: "negative",
    }));
    var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([{
            name: "logout",
            color: "negative",
        }], __VLS_functionalComponentArgsRest(__VLS_92), false));
    // @ts-ignore
    [handleLogout, vClosePopup,];
    var __VLS_88;
    var __VLS_96 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({}));
    var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_97), false));
    var __VLS_101 = __VLS_99.slots.default;
    var __VLS_102 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102(__assign({ class: "text-negative" })));
    var __VLS_104 = __VLS_103.apply(void 0, __spreadArray([__assign({ class: "text-negative" })], __VLS_functionalComponentArgsRest(__VLS_103), false));
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    var __VLS_107 = __VLS_105.slots.default;
    // @ts-ignore
    [];
    var __VLS_105;
    // @ts-ignore
    [];
    var __VLS_99;
    // @ts-ignore
    [];
    var __VLS_80;
    var __VLS_81;
    // @ts-ignore
    [];
    var __VLS_27;
    // @ts-ignore
    [];
    var __VLS_21;
    // @ts-ignore
    [];
    var __VLS_3;
}
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
