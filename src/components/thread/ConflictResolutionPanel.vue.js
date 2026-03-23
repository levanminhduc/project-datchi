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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var enums_1 = require("@/types/thread/enums");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var AppTextarea_vue_1 = require("@/components/ui/inputs/AppTextarea.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var props = defineProps();
var emit = defineEmits();
var priorityOptions = [
    { label: 'Thấp', value: enums_1.AllocationPriority.LOW },
    { label: 'Bình thường', value: enums_1.AllocationPriority.NORMAL },
    { label: 'Cao', value: enums_1.AllocationPriority.HIGH },
    { label: 'Khẩn cấp', value: enums_1.AllocationPriority.URGENT },
];
// Form state
var resolutionAction = (0, vue_1.ref)('ADJUST_PRIORITY');
var newPriority = (0, vue_1.ref)(((_a = props.selectedAllocation) === null || _a === void 0 ? void 0 : _a.priority) || enums_1.AllocationPriority.NORMAL);
var splitMeters = (0, vue_1.ref)(0);
var notes = (0, vue_1.ref)('');
var isAllocationSelected = (0, vue_1.computed)(function () { return !!props.selectedAllocation; });
var shortagePercent = (0, vue_1.computed)(function () {
    if (props.conflict.total_requested === 0)
        return 0;
    return Math.round((props.conflict.shortage / props.conflict.total_requested) * 100);
});
var formatMeters = function (m) { return "".concat(m.toLocaleString(), " m"); };
var handleResolve = function () {
    var _a;
    var resolution = __assign(__assign({ action: resolutionAction.value, allocation_id: (_a = props.selectedAllocation) === null || _a === void 0 ? void 0 : _a.id, notes: notes.value }, (resolutionAction.value === 'ADJUST_PRIORITY' && { new_priority: newPriority.value })), (resolutionAction.value === 'SPLIT' && { split_meters: splitMeters.value }));
    emit('resolve', resolution);
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "conflict-resolution-panel rounded-borders shadow-1 overflow-hidden" }));
/** @type {__VLS_StyleScopedClasses['conflict-resolution-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bg-primary text-white q-pa-md" }));
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
qChip;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ color: "white", textColor: "primary", dense: true }, { class: "text-weight-bold" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ color: "white", textColor: "primary", dense: true }, { class: "text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
var __VLS_5 = __VLS_3.slots.default;
(((_b = __VLS_ctx.conflict.thread_type) === null || _b === void 0 ? void 0 : _b.code) || 'Chỉ');
// @ts-ignore
[conflict,];
var __VLS_3;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mt-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-4 text-center" }));
/** @type {__VLS_StyleScopedClasses['col-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption opacity-80" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-80']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-bold" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
(__VLS_ctx.formatMeters(__VLS_ctx.conflict.total_requested));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-4 text-center border-left-white" }));
/** @type {__VLS_StyleScopedClasses['col-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['border-left-white']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption opacity-80" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-80']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-bold text-light-green-11" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-light-green-11']} */ ;
(__VLS_ctx.formatMeters(__VLS_ctx.conflict.total_available));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-4 text-center border-left-white" }));
/** @type {__VLS_StyleScopedClasses['col-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['border-left-white']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption opacity-80" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-80']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-bold text-orange-11" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-orange-11']} */ ;
(__VLS_ctx.formatMeters(__VLS_ctx.conflict.shortage));
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
(__VLS_ctx.shortagePercent);
if (!__VLS_ctx.isAllocationSelected) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-xl flex flex-center text-grey-7 text-center" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    var __VLS_6 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6(__assign({ name: "touch_app", size: "3rem", color: "grey-4" }, { class: "q-mb-md" })));
    var __VLS_8 = __VLS_7.apply(void 0, __spreadArray([__assign({ name: "touch_app", size: "3rem", color: "grey-4" }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_7), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-pa-md" }));
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-md flex items-center" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    var __VLS_11 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11(__assign(__assign({ name: "settings" }, { class: "q-mr-xs" }), { color: "primary" })));
    var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([__assign(__assign({ name: "settings" }, { class: "q-mr-xs" }), { color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_12), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-primary q-ml-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
    ((_c = __VLS_ctx.selectedAllocation) === null || _c === void 0 ? void 0 : _c.order_id);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-y-md" }));
    /** @type {__VLS_StyleScopedClasses['q-gutter-y-md']} */ ;
    var __VLS_16 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtnToggle | typeof __VLS_components.QBtnToggle} */
    qBtnToggle;
    // @ts-ignore
    var __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
        modelValue: (__VLS_ctx.resolutionAction),
        spread: true,
        noCaps: true,
        rounded: true,
        unelevated: true,
        toggleColor: "primary",
        color: "grey-2",
        textColor: "grey-8",
        options: ([
            { label: 'Ưu tiên', value: 'ADJUST_PRIORITY', icon: 'trending_up' },
            { label: 'Chia nhỏ', value: 'SPLIT', icon: 'call_split' },
            { label: 'Hủy', value: 'CANCEL', icon: 'block' },
            { label: 'Báo cáo', value: 'ESCALATE', icon: 'report_problem' }
        ]),
    }));
    var __VLS_18 = __VLS_17.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.resolutionAction),
            spread: true,
            noCaps: true,
            rounded: true,
            unelevated: true,
            toggleColor: "primary",
            color: "grey-2",
            textColor: "grey-8",
            options: ([
                { label: 'Ưu tiên', value: 'ADJUST_PRIORITY', icon: 'trending_up' },
                { label: 'Chia nhỏ', value: 'SPLIT', icon: 'call_split' },
                { label: 'Hủy', value: 'CANCEL', icon: 'block' },
                { label: 'Báo cáo', value: 'ESCALATE', icon: 'report_problem' }
            ]),
        }], __VLS_functionalComponentArgsRest(__VLS_17), false));
    var __VLS_21 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21(__assign({ flat: true, bordered: true }, { class: "bg-grey-1" })));
    var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "bg-grey-1" })], __VLS_functionalComponentArgsRest(__VLS_22), false));
    /** @type {__VLS_StyleScopedClasses['bg-grey-1']} */ ;
    var __VLS_26 = __VLS_24.slots.default;
    var __VLS_27 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({}));
    var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_28), false));
    var __VLS_32 = __VLS_30.slots.default;
    if (__VLS_ctx.resolutionAction === 'ADJUST_PRIORITY') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-y-sm" }));
        /** @type {__VLS_StyleScopedClasses['q-gutter-y-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        var __VLS_33 = AppSelect_vue_1.default;
        // @ts-ignore
        var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({
            modelValue: (__VLS_ctx.newPriority),
            options: (__VLS_ctx.priorityOptions),
            label: "Mức ưu tiên mới",
            emitValue: true,
            mapOptions: true,
            dense: true,
            outlined: true,
        }));
        var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.newPriority),
                options: (__VLS_ctx.priorityOptions),
                label: "Mức ưu tiên mới",
                emitValue: true,
                mapOptions: true,
                dense: true,
                outlined: true,
            }], __VLS_functionalComponentArgsRest(__VLS_34), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-blue-9 bg-blue-1 q-pa-sm rounded-borders" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-blue-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-blue-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        var __VLS_38 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38(__assign({ name: "info" }, { class: "q-mr-xs" })));
        var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([__assign({ name: "info" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_39), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    }
    if (__VLS_ctx.resolutionAction === 'SPLIT') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-y-sm" }));
        /** @type {__VLS_StyleScopedClasses['q-gutter-y-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        var __VLS_43 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
            modelValue: (__VLS_ctx.splitMeters),
            modelModifiers: { number: true, },
            type: "number",
            label: "Số lượng cấp",
            suffix: "m",
            dense: true,
            outlined: true,
            rules: ([function (val) { var _a; return val > 0 && val < (((_a = __VLS_ctx.selectedAllocation) === null || _a === void 0 ? void 0 : _a.requested_meters) || 0) || 'Số lượng phải lớn hơn 0 và nhỏ hơn yêu cầu ban đầu'; }]),
        }));
        var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{
                modelValue: (__VLS_ctx.splitMeters),
                modelModifiers: { number: true, },
                type: "number",
                label: "Số lượng cấp",
                suffix: "m",
                dense: true,
                outlined: true,
                rules: ([function (val) { var _a; return val > 0 && val < (((_a = __VLS_ctx.selectedAllocation) === null || _a === void 0 ? void 0 : _a.requested_meters) || 0) || 'Số lượng phải lớn hơn 0 và nhỏ hơn yêu cầu ban đầu'; }]),
            }], __VLS_functionalComponentArgsRest(__VLS_44), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-amber-9 bg-amber-1 q-pa-sm rounded-borders" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-amber-9']} */ ;
        /** @type {__VLS_StyleScopedClasses['bg-amber-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
        var __VLS_48 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48(__assign({ name: "info" }, { class: "q-mr-xs" })));
        var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([__assign({ name: "info" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_49), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    }
    if (__VLS_ctx.resolutionAction === 'CANCEL') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex flex-center q-pa-sm" }));
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center" }));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        var __VLS_53 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
            name: "warning",
            color: "negative",
            size: "md",
        }));
        var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([{
                name: "warning",
                color: "negative",
                size: "md",
            }], __VLS_functionalComponentArgsRest(__VLS_54), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-negative" }));
        /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-negative']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    }
    if (__VLS_ctx.resolutionAction === 'ESCALATE') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "flex flex-center q-pa-sm" }));
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center" }));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        var __VLS_58 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
            name: "assignment_late",
            color: "orange",
            size: "md",
        }));
        var __VLS_60 = __VLS_59.apply(void 0, __spreadArray([{
                name: "assignment_late",
                color: "orange",
                size: "md",
            }], __VLS_functionalComponentArgsRest(__VLS_59), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-orange-9" }));
        /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-orange-9']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    }
    // @ts-ignore
    [conflict, conflict, conflict, formatMeters, formatMeters, formatMeters, shortagePercent, isAllocationSelected, selectedAllocation, selectedAllocation, resolutionAction, resolutionAction, resolutionAction, resolutionAction, resolutionAction, newPriority, priorityOptions, splitMeters,];
    var __VLS_30;
    // @ts-ignore
    [];
    var __VLS_24;
    var __VLS_63 = AppTextarea_vue_1.default;
    // @ts-ignore
    var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
        modelValue: (__VLS_ctx.notes),
        label: "Ghi chú giải quyết",
        placeholder: "Lý do điều chỉnh hoặc hướng dẫn thêm...",
        rows: "3",
    }));
    var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.notes),
            label: "Ghi chú giải quyết",
            placeholder: "Lý do điều chỉnh hoặc hướng dẫn thêm...",
            rows: "3",
        }], __VLS_functionalComponentArgsRest(__VLS_64), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    var __VLS_68 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68(__assign(__assign({ 'onClick': {} }, { label: "Hủy bỏ", color: "grey", flat: true }), { class: "full-width" })));
    var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { label: "Hủy bỏ", color: "grey", flat: true }), { class: "full-width" })], __VLS_functionalComponentArgsRest(__VLS_69), false));
    var __VLS_73 = void 0;
    var __VLS_74 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!!(!__VLS_ctx.isAllocationSelected))
                    return;
                __VLS_ctx.emit('cancel');
                // @ts-ignore
                [notes, emit,];
            } });
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    var __VLS_71;
    var __VLS_72;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    var __VLS_75 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75(__assign(__assign({ 'onClick': {} }, { label: "Xác nhận", color: "primary" }), { class: "full-width" })));
    var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { label: "Xác nhận", color: "primary" }), { class: "full-width" })], __VLS_functionalComponentArgsRest(__VLS_76), false));
    var __VLS_80 = void 0;
    var __VLS_81 = ({ click: {} },
        { onClick: (__VLS_ctx.handleResolve) });
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    var __VLS_78;
    var __VLS_79;
}
// @ts-ignore
[handleResolve,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
