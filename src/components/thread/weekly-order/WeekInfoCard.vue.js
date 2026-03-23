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
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var props = defineProps();
var emit = defineEmits();
var weekNameInputRef = (0, vue_1.ref)(null);
function focusWeekName() {
    var _a;
    (_a = weekNameInputRef.value) === null || _a === void 0 ? void 0 : _a.focus();
}
var __VLS_exposed = { focusWeekName: focusWeekName };
defineExpose(__VLS_exposed);
// Convert YYYY-MM-DD (DB) ↔ DD/MM/YYYY (DatePicker)
function toDisplay(isoDate) {
    if (!isoDate)
        return "";
    var _a = isoDate.split("-"), y = _a[0], m = _a[1], d = _a[2];
    return "".concat(d, "/").concat(m, "/").concat(y);
}
function toIso(displayDate) {
    if (!displayDate)
        return "";
    var _a = displayDate.split("/"), d = _a[0], m = _a[1], y = _a[2];
    return "".concat(y, "-").concat(m, "-").concat(d);
}
var displayStartDate = (0, vue_1.computed)(function () { return toDisplay(props.startDate); });
var displayEndDate = (0, vue_1.computed)(function () { return toDisplay(props.endDate); });
function onStartDateChange(val) {
    emit("update:startDate", val ? toIso(val) : "");
}
function onEndDateChange(val) {
    emit("update:endDate", val ? toIso(val) : "");
}
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
AppCard;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    flat: true,
    bordered: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onBlur': {} }), { ref: "weekNameInputRef", modelValue: (__VLS_ctx.modelValue), label: "Thông tin đơn hàng*", dense: true, hideBottomSpace: true, placeholder: "Nhập thông tin đơn hàng" })));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onBlur': {} }), { ref: "weekNameInputRef", modelValue: (__VLS_ctx.modelValue), label: "Thông tin đơn hàng*", dense: true, hideBottomSpace: true, placeholder: "Nhập thông tin đơn hàng" })], __VLS_functionalComponentArgsRest(__VLS_14), false));
var __VLS_18;
var __VLS_19 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$emit('update:modelValue', String($event !== null && $event !== void 0 ? $event : ''));
            // @ts-ignore
            [modelValue, $emit,];
        } });
var __VLS_20 = ({ blur: {} },
    { onBlur: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$emit('blur:weekName');
            // @ts-ignore
            [$emit,];
        } });
var __VLS_21 = {};
var __VLS_16;
var __VLS_17;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
var __VLS_23;
/** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23(__assign({ 'onClear': {} }, { modelValue: (__VLS_ctx.displayStartDate), label: "Từ ngày", placeholder: "DD/MM/YYYY", dense: true, hideBottomSpace: true, clearable: true })));
var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([__assign({ 'onClear': {} }, { modelValue: (__VLS_ctx.displayStartDate), label: "Từ ngày", placeholder: "DD/MM/YYYY", dense: true, hideBottomSpace: true, clearable: true })], __VLS_functionalComponentArgsRest(__VLS_24), false));
var __VLS_28;
var __VLS_29 = ({ clear: {} },
    { onClear: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$emit('update:startDate', '');
            // @ts-ignore
            [$emit, displayStartDate,];
        } });
var __VLS_30 = __VLS_26.slots.default;
{
    var __VLS_31 = __VLS_26.slots.append;
    var __VLS_32 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_33), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_37 = __VLS_35.slots.default;
    var __VLS_38 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_39), false));
    var __VLS_43 = __VLS_41.slots.default;
    var __VLS_44 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.displayStartDate) })));
    var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.displayStartDate) })], __VLS_functionalComponentArgsRest(__VLS_45), false));
    var __VLS_49 = void 0;
    var __VLS_50 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onStartDateChange) });
    var __VLS_47;
    var __VLS_48;
    // @ts-ignore
    [displayStartDate, onStartDateChange,];
    var __VLS_41;
    // @ts-ignore
    [];
    var __VLS_35;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_26;
var __VLS_27;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
var __VLS_51;
/** @ts-ignore @type {typeof __VLS_components.AppInput | typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51(__assign({ 'onClear': {} }, { modelValue: (__VLS_ctx.displayEndDate), label: "Đến ngày", placeholder: "DD/MM/YYYY", dense: true, hideBottomSpace: true, clearable: true })));
var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([__assign({ 'onClear': {} }, { modelValue: (__VLS_ctx.displayEndDate), label: "Đến ngày", placeholder: "DD/MM/YYYY", dense: true, hideBottomSpace: true, clearable: true })], __VLS_functionalComponentArgsRest(__VLS_52), false));
var __VLS_56;
var __VLS_57 = ({ clear: {} },
    { onClear: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$emit('update:endDate', '');
            // @ts-ignore
            [$emit, displayEndDate,];
        } });
var __VLS_58 = __VLS_54.slots.default;
{
    var __VLS_59 = __VLS_54.slots.append;
    var __VLS_60 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_61), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_65 = __VLS_63.slots.default;
    var __VLS_66 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_68 = __VLS_67.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_67), false));
    var __VLS_71 = __VLS_69.slots.default;
    var __VLS_72 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.displayEndDate) })));
    var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.displayEndDate) })], __VLS_functionalComponentArgsRest(__VLS_73), false));
    var __VLS_77 = void 0;
    var __VLS_78 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onEndDateChange) });
    var __VLS_75;
    var __VLS_76;
    // @ts-ignore
    [displayEndDate, onEndDateChange,];
    var __VLS_69;
    // @ts-ignore
    [];
    var __VLS_63;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_54;
var __VLS_55;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-2']} */ ;
var __VLS_79 = {};
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_81;
/** @ts-ignore @type {typeof __VLS_components.AppInput} */
AppInput;
// @ts-ignore
var __VLS_82 = __VLS_asFunctionalComponent1(__VLS_81, new __VLS_81(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.notes), label: "Ghi chú", dense: true, hideBottomSpace: true })));
var __VLS_83 = __VLS_82.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.notes), label: "Ghi chú", dense: true, hideBottomSpace: true })], __VLS_functionalComponentArgsRest(__VLS_82), false));
var __VLS_86;
var __VLS_87 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$emit('update:notes', String($event !== null && $event !== void 0 ? $event : ''));
            // @ts-ignore
            [$emit, notes,];
        } });
var __VLS_84;
var __VLS_85;
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
var __VLS_22 = __VLS_21, __VLS_80 = __VLS_79;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () { return (__VLS_exposed); },
    __typeEmits: {},
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
