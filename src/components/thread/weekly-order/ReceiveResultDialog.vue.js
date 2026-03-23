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
var AppDialog_vue_1 = require("@/components/ui/dialogs/AppDialog.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var props = defineProps();
var __VLS_emit = defineEmits();
var hasAutoReturn = (0, vue_1.computed)(function () {
    return props.result.auto_return.returned_cones > 0;
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
var __VLS_10;
/** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
qBanner;
// @ts-ignore
var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10(__assign({ class: "bg-positive text-white rounded-borders" }, { dense: true })));
var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([__assign({ class: "bg-positive text-white rounded-borders" }, { dense: true })], __VLS_functionalComponentArgsRest(__VLS_11), false));
/** @type {__VLS_StyleScopedClasses['bg-positive']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
var __VLS_15 = __VLS_13.slots.default;
{
    var __VLS_16 = __VLS_13.slots.avatar;
    var __VLS_17 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        name: "check_circle",
        size: "sm",
    }));
    var __VLS_19 = __VLS_18.apply(void 0, __spreadArray([{
            name: "check_circle",
            size: "sm",
        }], __VLS_functionalComponentArgsRest(__VLS_18), false));
    // @ts-ignore
    [];
}
(__VLS_ctx.result.cones_created);
// @ts-ignore
[result,];
var __VLS_13;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
/** @type {__VLS_StyleScopedClasses['col-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
(__VLS_ctx.result.cones_created);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
/** @type {__VLS_StyleScopedClasses['col-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
(__VLS_ctx.result.lot_number || '-');
if (__VLS_ctx.result.cones_reserved > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-positive text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.result.cones_reserved);
}
if (__VLS_ctx.result.remaining_shortage > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-negative text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.result.remaining_shortage);
}
if (__VLS_ctx.hasAutoReturn) {
    var __VLS_22 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
    qSeparator;
    // @ts-ignore
    var __VLS_23 = __VLS_asFunctionalComponent1(__VLS_22, new __VLS_22({}));
    var __VLS_24 = __VLS_23.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_23), false));
}
if (__VLS_ctx.hasAutoReturn) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-weight-medium q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_27 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27(__assign({ name: "swap_horiz", color: "info" }, { class: "q-mr-xs" })));
    var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([__assign({ name: "swap_horiz", color: "info" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_28), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-grey-7 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    (__VLS_ctx.result.auto_return.returned_cones);
    if (__VLS_ctx.result.auto_return.settled > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (__VLS_ctx.result.auto_return.settled);
    }
    var __VLS_32 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32(__assign({ dense: true, separator: true, bordered: true }, { class: "rounded-borders" })));
    var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([__assign({ dense: true, separator: true, bordered: true }, { class: "rounded-borders" })], __VLS_functionalComponentArgsRest(__VLS_33), false));
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    var __VLS_37 = __VLS_35.slots.default;
    for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.result.auto_return.details)); _i < _a.length; _i++) {
        var detail = _a[_i][0];
        var __VLS_38 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
            key: (detail.loan_id),
        }));
        var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{
                key: (detail.loan_id),
            }], __VLS_functionalComponentArgsRest(__VLS_39), false));
        var __VLS_43 = __VLS_41.slots.default;
        var __VLS_44 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({}));
        var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_45), false));
        var __VLS_49 = __VLS_47.slots.default;
        var __VLS_50 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({}));
        var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_51), false));
        var __VLS_55 = __VLS_53.slots.default;
        (detail.from_week_name);
        // @ts-ignore
        [result, result, result, result, result, result, result, result, result, result, hasAutoReturn, hasAutoReturn,];
        var __VLS_53;
        var __VLS_56 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
            caption: true,
        }));
        var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([{
                caption: true,
            }], __VLS_functionalComponentArgsRest(__VLS_57), false));
        var __VLS_61 = __VLS_59.slots.default;
        (detail.cones_returned);
        if (detail.fully_settled) {
            var __VLS_62 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62(__assign({ color: "positive", label: "Đã thanh toán" }, { class: "q-ml-sm" })));
            var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([__assign({ color: "positive", label: "Đã thanh toán" }, { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_63), false));
            /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
        }
        else {
            var __VLS_67 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67(__assign({ color: "warning", label: "Trả một phần" }, { class: "q-ml-sm" })));
            var __VLS_69 = __VLS_68.apply(void 0, __spreadArray([__assign({ color: "warning", label: "Trả một phần" }, { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_68), false));
            /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
        }
        // @ts-ignore
        [];
        var __VLS_59;
        // @ts-ignore
        [];
        var __VLS_47;
        // @ts-ignore
        [];
        var __VLS_41;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_35;
}
{
    var __VLS_72 = __VLS_3.slots.actions;
    var __VLS_73 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({
        variant: "flat",
        label: "Đóng",
        color: "primary",
    }));
    var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([{
            variant: "flat",
            label: "Đóng",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_74), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    // @ts-ignore
    [vClosePopup,];
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
