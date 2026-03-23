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
var enums_1 = require("@/types/thread/enums");
var useThreadTypes_1 = require("@/composables/thread/useThreadTypes");
var FormDialog_vue_1 = require("@/components/ui/dialogs/FormDialog.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppTextarea_vue_1 = require("@/components/ui/inputs/AppTextarea.vue");
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var utils_1 = require("@/utils");
var props = withDefaults(defineProps(), {
    allocation: null,
    loading: false
});
var isOpen = defineModel({ default: false });
var emit = defineEmits();
// Composables
var _a = (0, useThreadTypes_1.useThreadTypes)(), activeThreadTypes = _a.activeThreadTypes, fetchThreadTypes = _a.fetchThreadTypes;
// Form State
var defaultForm = {
    order_id: '',
    order_reference: '',
    thread_type_id: 0,
    requested_meters: 0,
    priority: enums_1.AllocationPriority.NORMAL,
    due_date: '',
    notes: ''
};
var form = (0, vue_1.ref)(__assign({}, defaultForm));
var qtyMode = (0, vue_1.ref)('meters');
var weightInput = (0, vue_1.ref)(0);
// Priority options
var priorityOptions = [
    { label: 'Thấp', value: enums_1.AllocationPriority.LOW },
    { label: 'Bình thường', value: enums_1.AllocationPriority.NORMAL },
    { label: 'Cao', value: enums_1.AllocationPriority.HIGH },
    { label: 'Khẩn cấp', value: enums_1.AllocationPriority.URGENT }
];
var isEditMode = (0, vue_1.computed)(function () { return !!props.allocation; });
var title = (0, vue_1.computed)(function () { return isEditMode.value ? 'Chỉnh sửa yêu cầu phân bổ' : 'Tạo yêu cầu phân bổ mới'; });
var selectedThreadType = (0, vue_1.computed)(function () {
    return activeThreadTypes.value.find(function (t) { return t.id === form.value.thread_type_id; });
});
var availableStock = (0, vue_1.computed)(function () {
    // In a real scenario, this would come from an API call or a store
    // For now, we use a placeholder or assume it's part of the thread type object if extended
    return 5000; // Placeholder: 5000m
});
// Conversion logic
(0, vue_1.watch)(weightInput, function (newWeight) {
    if (qtyMode.value === 'weight' && selectedThreadType.value) {
        var density = selectedThreadType.value.density_grams_per_meter || 0.1;
        form.value.requested_meters = Math.round(newWeight / density);
    }
});
(0, vue_1.watch)(function () { return form.value.requested_meters; }, function (newMeters) {
    if (qtyMode.value === 'meters' && selectedThreadType.value) {
        var density = selectedThreadType.value.density_grams_per_meter || 0.1;
        weightInput.value = Math.round(newMeters * density);
    }
});
// Initialize form
var initForm = function () {
    var _a;
    if (props.allocation) {
        form.value = {
            order_id: props.allocation.order_id,
            order_reference: props.allocation.order_reference || '',
            thread_type_id: props.allocation.thread_type_id,
            requested_meters: props.allocation.requested_meters,
            priority: props.allocation.priority,
            due_date: ((_a = props.allocation.due_date) === null || _a === void 0 ? void 0 : _a.split('T')[0]) || '',
            notes: props.allocation.notes || ''
        };
        // Set weight based on meters
        if (selectedThreadType.value) {
            weightInput.value = Math.round(form.value.requested_meters * (selectedThreadType.value.density_grams_per_meter || 0.1));
        }
    }
    else {
        form.value = __assign({}, defaultForm);
        weightInput.value = 0;
    }
};
(0, vue_1.watch)(isOpen, function (val) {
    if (val) {
        fetchThreadTypes();
        initForm();
    }
});
var handleSubmit = function () {
    if (isEditMode.value && props.allocation) {
        emit('update', props.allocation.id, __assign({}, form.value));
    }
    else {
        emit('submit', __assign({}, form.value));
    }
    isOpen.value = false;
};
var onCancel = function () {
    isOpen.value = false;
    emit('cancel');
};
var __VLS_defaultModels = {
    'modelValue': false,
};
var __VLS_modelEmit;
var __VLS_defaults = {
    allocation: null,
    loading: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = FormDialog_vue_1.default || FormDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.isOpen), title: (__VLS_ctx.title), loading: (__VLS_ctx.loading), maxWidth: "700px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.isOpen), title: (__VLS_ctx.title), loading: (__VLS_ctx.loading), maxWidth: "700px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleSubmit) });
var __VLS_7 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.onCancel) });
var __VLS_8 = {};
var __VLS_9 = __VLS_3.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_10 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
    modelValue: (__VLS_ctx.form.order_id),
    label: "Mã lệnh sản xuất (LSX)",
    required: true,
    placeholder: "Ví dụ: LSX-2024-001",
    disable: (__VLS_ctx.isEditMode),
}));
var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.order_id),
        label: "Mã lệnh sản xuất (LSX)",
        required: true,
        placeholder: "Ví dụ: LSX-2024-001",
        disable: (__VLS_ctx.isEditMode),
    }], __VLS_functionalComponentArgsRest(__VLS_11), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_15 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
    modelValue: (__VLS_ctx.form.order_reference),
    label: "Tham chiếu đơn hàng",
    placeholder: "Mã PO hoặc khách hàng...",
}));
var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.order_reference),
        label: "Tham chiếu đơn hàng",
        placeholder: "Mã PO hoặc khách hàng...",
    }], __VLS_functionalComponentArgsRest(__VLS_16), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_20 = AppSelect_vue_1.default || AppSelect_vue_1.default;
// @ts-ignore
var __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({
    modelValue: (__VLS_ctx.form.thread_type_id),
    options: (__VLS_ctx.activeThreadTypes),
    optionLabel: "name",
    optionValue: "id",
    label: "Loại chỉ",
    required: true,
    searchable: true,
    emitValue: true,
    mapOptions: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
    disable: (__VLS_ctx.isEditMode),
}));
var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.thread_type_id),
        options: (__VLS_ctx.activeThreadTypes),
        optionLabel: "name",
        optionValue: "id",
        label: "Loại chỉ",
        required: true,
        searchable: true,
        emitValue: true,
        mapOptions: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        disable: (__VLS_ctx.isEditMode),
    }], __VLS_functionalComponentArgsRest(__VLS_21), false));
var __VLS_25 = __VLS_23.slots.default;
{
    var __VLS_26 = __VLS_23.slots.option;
    var scope = __VLS_vSlot(__VLS_26)[0];
    var __VLS_27 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27(__assign({}, (scope.itemProps))));
    var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([__assign({}, (scope.itemProps))], __VLS_functionalComponentArgsRest(__VLS_28), false));
    var __VLS_32 = __VLS_30.slots.default;
    var __VLS_33 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33({}));
    var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_34), false));
    var __VLS_38 = __VLS_36.slots.default;
    var __VLS_39 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({}));
    var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_40), false));
    var __VLS_44 = __VLS_42.slots.default;
    (scope.opt.name);
    // @ts-ignore
    [isOpen, title, loading, handleSubmit, onCancel, form, form, form, isEditMode, isEditMode, activeThreadTypes,];
    var __VLS_42;
    var __VLS_45 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
        caption: true,
    }));
    var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_46), false));
    var __VLS_50 = __VLS_48.slots.default;
    (scope.opt.code);
    (scope.opt.color);
    // @ts-ignore
    [];
    var __VLS_48;
    // @ts-ignore
    [];
    var __VLS_36;
    var __VLS_51 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
        side: true,
    }));
    var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([{
            side: true,
        }], __VLS_functionalComponentArgsRest(__VLS_52), false));
    var __VLS_56 = __VLS_54.slots.default;
    var __VLS_57 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
        size: "xs",
        color: "grey-2",
        dense: true,
    }));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([{
            size: "xs",
            color: "grey-2",
            dense: true,
        }], __VLS_functionalComponentArgsRest(__VLS_58), false));
    var __VLS_62 = __VLS_60.slots.default;
    (scope.opt.material);
    // @ts-ignore
    [];
    var __VLS_60;
    // @ts-ignore
    [];
    var __VLS_54;
    // @ts-ignore
    [];
    var __VLS_30;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_23;
if (__VLS_ctx.selectedThreadType) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bg-blue-1 q-pa-sm rounded-borders flex items-center justify-between border-blue" }));
    /** @type {__VLS_StyleScopedClasses['bg-blue-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    var __VLS_63 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63(__assign({ name: "inventory_2", color: "blue-9" }, { class: "q-mr-sm" })));
    var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([__assign({ name: "inventory_2", color: "blue-9" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_64), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-blue-9" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-9']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-subtitle2 text-blue-9 q-ml-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-9']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
    (__VLS_ctx.availableStock.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-blue-8" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-8']} */ ;
    (__VLS_ctx.selectedThreadType.density_grams_per_meter);
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between q-mb-xs" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
var __VLS_68;
/** @ts-ignore @type {typeof __VLS_components.qBtnToggle | typeof __VLS_components.QBtnToggle} */
qBtnToggle;
// @ts-ignore
var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
    modelValue: (__VLS_ctx.qtyMode),
    toggleColor: "primary",
    flat: true,
    dense: true,
    size: "sm",
    noCaps: true,
    options: ([
        { label: 'Theo Mét', value: 'meters' },
        { label: 'Theo Cân nặng', value: 'weight' }
    ]),
}));
var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.qtyMode),
        toggleColor: "primary",
        flat: true,
        dense: true,
        size: "sm",
        noCaps: true,
        options: ([
            { label: 'Theo Mét', value: 'meters' },
            { label: 'Theo Cân nặng', value: 'weight' }
        ]),
    }], __VLS_functionalComponentArgsRest(__VLS_69), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
/** @type {__VLS_StyleScopedClasses['col-6']} */ ;
var __VLS_73 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({
    modelValue: (__VLS_ctx.form.requested_meters),
    modelModifiers: { number: true, },
    type: "number",
    label: "Số mét (m)",
    required: true,
    disable: (__VLS_ctx.qtyMode === 'weight'),
    min: (1),
}));
var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.requested_meters),
        modelModifiers: { number: true, },
        type: "number",
        label: "Số mét (m)",
        required: true,
        disable: (__VLS_ctx.qtyMode === 'weight'),
        min: (1),
    }], __VLS_functionalComponentArgsRest(__VLS_74), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
/** @type {__VLS_StyleScopedClasses['col-6']} */ ;
var __VLS_78 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
    modelValue: (__VLS_ctx.weightInput),
    modelModifiers: { number: true, },
    type: "number",
    label: "Cân nặng (g)",
    required: true,
    disable: (__VLS_ctx.qtyMode === 'meters'),
    min: (1),
}));
var __VLS_80 = __VLS_79.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.weightInput),
        modelModifiers: { number: true, },
        type: "number",
        label: "Cân nặng (g)",
        required: true,
        disable: (__VLS_ctx.qtyMode === 'meters'),
        min: (1),
    }], __VLS_functionalComponentArgsRest(__VLS_79), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_83 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_84 = __VLS_asFunctionalComponent1(__VLS_83, new __VLS_83({
    modelValue: (__VLS_ctx.form.priority),
    options: (__VLS_ctx.priorityOptions),
    label: "Mức độ ưu tiên",
    required: true,
    emitValue: true,
    mapOptions: true,
}));
var __VLS_85 = __VLS_84.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.priority),
        options: (__VLS_ctx.priorityOptions),
        label: "Mức độ ưu tiên",
        required: true,
        emitValue: true,
        mapOptions: true,
    }], __VLS_functionalComponentArgsRest(__VLS_84), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_88 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
    modelValue: (__VLS_ctx.form.due_date),
    label: "Ngày cần hàng",
    placeholder: "DD/MM/YYYY",
    rules: ([__VLS_ctx.dateRules.date]),
    hint: "Thời hạn sản xuất cần chỉ",
}));
var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.due_date),
        label: "Ngày cần hàng",
        placeholder: "DD/MM/YYYY",
        rules: ([__VLS_ctx.dateRules.date]),
        hint: "Thời hạn sản xuất cần chỉ",
    }], __VLS_functionalComponentArgsRest(__VLS_89), false));
var __VLS_93 = __VLS_91.slots.default;
{
    var __VLS_94 = __VLS_91.slots.append;
    var __VLS_95 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_96 = __VLS_asFunctionalComponent1(__VLS_95, new __VLS_95(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_97 = __VLS_96.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_96), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_100 = __VLS_98.slots.default;
    var __VLS_101 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_102 = __VLS_asFunctionalComponent1(__VLS_101, new __VLS_101({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_103 = __VLS_102.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_102), false));
    var __VLS_106 = __VLS_104.slots.default;
    var __VLS_107 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_108 = __VLS_asFunctionalComponent1(__VLS_107, new __VLS_107({
        modelValue: (__VLS_ctx.form.due_date),
    }));
    var __VLS_109 = __VLS_108.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.form.due_date),
        }], __VLS_functionalComponentArgsRest(__VLS_108), false));
    // @ts-ignore
    [form, form, form, form, selectedThreadType, selectedThreadType, availableStock, qtyMode, qtyMode, qtyMode, weightInput, priorityOptions, utils_1.dateRules,];
    var __VLS_104;
    // @ts-ignore
    [];
    var __VLS_98;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_91;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_112 = AppTextarea_vue_1.default;
// @ts-ignore
var __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
    modelValue: (__VLS_ctx.form.notes),
    label: "Ghi chú sản xuất",
    placeholder: "Yêu cầu đặc biệt về lô hàng, đóng gói...",
    rows: "3",
}));
var __VLS_114 = __VLS_113.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.notes),
        label: "Ghi chú sản xuất",
        placeholder: "Yêu cầu đặc biệt về lô hàng, đóng gói...",
        rows: "3",
    }], __VLS_functionalComponentArgsRest(__VLS_113), false));
// @ts-ignore
[form,];
var __VLS_3;
var __VLS_4;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
