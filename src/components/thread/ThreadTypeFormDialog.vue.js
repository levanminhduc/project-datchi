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
var FormDialog_vue_1 = require("@/components/ui/dialogs/FormDialog.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppToggle_vue_1 = require("@/components/ui/inputs/AppToggle.vue");
var ColorSelector_vue_1 = require("@/components/ui/inputs/ColorSelector.vue");
var SupplierSelector_vue_1 = require("@/components/ui/inputs/SupplierSelector.vue");
var props = withDefaults(defineProps(), {
    threadType: null,
    loading: false
});
var emit = defineEmits();
var materialOptions = [
    { label: 'Polyester', value: enums_1.ThreadMaterial.POLYESTER },
    { label: 'Cotton', value: enums_1.ThreadMaterial.COTTON },
    { label: 'Nylon', value: enums_1.ThreadMaterial.NYLON },
    { label: 'Lụa', value: enums_1.ThreadMaterial.SILK },
    { label: 'Rayon', value: enums_1.ThreadMaterial.RAYON },
    { label: 'Hỗn hợp', value: enums_1.ThreadMaterial.MIXED },
];
var defaultForm = {
    code: '',
    name: '',
    color_id: null,
    supplier_id: null,
    material: enums_1.ThreadMaterial.POLYESTER,
    tex_number: undefined,
    density_grams_per_meter: 0.1,
    meters_per_cone: undefined,
    reorder_level_meters: 1000,
    lead_time_days: 7,
    is_active: true
};
var form = (0, vue_1.ref)(__assign({}, defaultForm));
var selectedColorData = (0, vue_1.ref)(null);
var selectedSupplierData = (0, vue_1.ref)(null);
var title = (0, vue_1.computed)(function () { return props.mode === 'create' ? 'Thêm loại chỉ mới' : 'Chỉnh sửa loại chỉ'; });
var resetForm = function () {
    var _a, _b;
    if (props.mode === 'edit' && props.threadType) {
        form.value = {
            code: props.threadType.code,
            name: props.threadType.name,
            color_id: props.threadType.color_id,
            supplier_id: props.threadType.supplier_id,
            material: props.threadType.material,
            tex_number: (_a = props.threadType.tex_number) !== null && _a !== void 0 ? _a : undefined,
            density_grams_per_meter: props.threadType.density_grams_per_meter,
            meters_per_cone: (_b = props.threadType.meters_per_cone) !== null && _b !== void 0 ? _b : undefined,
            reorder_level_meters: props.threadType.reorder_level_meters,
            lead_time_days: props.threadType.lead_time_days,
            is_active: props.threadType.is_active
        };
        // Reset color/supplier data from joined data
        selectedColorData.value = props.threadType.color_data ? {
            id: props.threadType.color_data.id,
            name: props.threadType.color_data.name,
            hex_code: props.threadType.color_data.hex_code,
            pantone_code: props.threadType.color_data.pantone_code,
            ral_code: null,
            is_active: true,
            created_at: '',
            updated_at: ''
        } : null;
        selectedSupplierData.value = props.threadType.supplier_data ? {
            id: props.threadType.supplier_data.id,
            code: props.threadType.supplier_data.code,
            name: props.threadType.supplier_data.name,
            contact_name: null,
            phone: null,
            email: null,
            address: null,
            lead_time_days: 0,
            is_active: true,
            created_at: '',
            updated_at: ''
        } : null;
    }
    else {
        form.value = __assign({}, defaultForm);
        selectedColorData.value = null;
        selectedSupplierData.value = null;
    }
};
// Watchers
(0, vue_1.watch)(function () { return props.modelValue; }, function (newVal) {
    if (newVal) {
        resetForm();
    }
});
(0, vue_1.watch)(function () { return props.mode; }, function () {
    resetForm();
});
(0, vue_1.watch)(function () { return props.threadType; }, function () {
    if (props.mode === 'edit') {
        resetForm();
    }
}, { deep: true });
var handleColorChange = function (colorData) {
    selectedColorData.value = colorData;
};
var handleSupplierChange = function (supplierData) {
    selectedSupplierData.value = supplierData;
    if (supplierData === null || supplierData === void 0 ? void 0 : supplierData.lead_time_days) {
        form.value.lead_time_days = supplierData.lead_time_days;
    }
};
var onSubmit = function () {
    var submitData = __assign({}, form.value);
    if (submitData.tex_number === undefined)
        delete submitData.tex_number;
    if (submitData.meters_per_cone === undefined)
        delete submitData.meters_per_cone;
    emit('submit', submitData);
};
var onCancel = function () {
    emit('cancel');
};
var __VLS_defaults = {
    threadType: null,
    loading: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = FormDialog_vue_1.default || FormDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: (__VLS_ctx.title), loading: (__VLS_ctx.loading), maxWidth: "700px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: (__VLS_ctx.title), loading: (__VLS_ctx.loading), maxWidth: "700px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (function (val) { return __VLS_ctx.emit('update:modelValue', val); }) });
var __VLS_7 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.onSubmit) });
var __VLS_8 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.onCancel) });
var __VLS_9 = {};
var __VLS_10 = __VLS_3.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_11 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
    modelValue: (__VLS_ctx.form.code),
    label: "Mã loại chỉ",
    required: true,
    disable: (__VLS_ctx.mode === 'edit'),
    hint: "Dùng để định danh duy nhất (không thể sửa sau khi tạo)",
}));
var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.code),
        label: "Mã loại chỉ",
        required: true,
        disable: (__VLS_ctx.mode === 'edit'),
        hint: "Dùng để định danh duy nhất (không thể sửa sau khi tạo)",
    }], __VLS_functionalComponentArgsRest(__VLS_12), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_16 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.form.name),
    label: "Tên loại chỉ",
    required: true,
}));
var __VLS_18 = __VLS_17.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.name),
        label: "Tên loại chỉ",
        required: true,
    }], __VLS_functionalComponentArgsRest(__VLS_17), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_21 = ColorSelector_vue_1.default;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21(__assign({ 'onUpdate:colorData': {} }, { modelValue: (__VLS_ctx.form.color_id), label: "Màu chỉ", clearable: true })));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([__assign({ 'onUpdate:colorData': {} }, { modelValue: (__VLS_ctx.form.color_id), label: "Màu chỉ", clearable: true })], __VLS_functionalComponentArgsRest(__VLS_22), false));
var __VLS_26;
var __VLS_27 = ({ 'update:colorData': {} },
    { 'onUpdate:colorData': (__VLS_ctx.handleColorChange) });
var __VLS_24;
var __VLS_25;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_28 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
    modelValue: (((_a = __VLS_ctx.selectedColorData) === null || _a === void 0 ? void 0 : _a.hex_code) || ''),
    label: "Mã màu",
    readonly: true,
    hint: "Tự động điền từ màu đã chọn",
}));
var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([{
        modelValue: (((_b = __VLS_ctx.selectedColorData) === null || _b === void 0 ? void 0 : _b.hex_code) || ''),
        label: "Mã màu",
        readonly: true,
        hint: "Tự động điền từ màu đã chọn",
    }], __VLS_functionalComponentArgsRest(__VLS_29), false));
var __VLS_33 = __VLS_31.slots.default;
{
    var __VLS_34 = __VLS_31.slots.append;
    if ((_c = __VLS_ctx.selectedColorData) === null || _c === void 0 ? void 0 : _c.hex_code) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-preview shadow-1" }, { style: ({ backgroundColor: __VLS_ctx.selectedColorData.hex_code }) }));
        /** @type {__VLS_StyleScopedClasses['color-preview']} */ ;
        /** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
    }
    // @ts-ignore
    [modelValue, title, loading, emit, onSubmit, onCancel, form, form, form, mode, handleColorChange, selectedColorData, selectedColorData, selectedColorData,];
}
// @ts-ignore
[];
var __VLS_31;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_35 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
    modelValue: (__VLS_ctx.form.material),
    options: (__VLS_ctx.materialOptions),
    label: "Chất liệu",
    required: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
    popupContentClass: "z-max",
    emitValue: true,
    mapOptions: true,
}));
var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.material),
        options: (__VLS_ctx.materialOptions),
        label: "Chất liệu",
        required: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        popupContentClass: "z-max",
        emitValue: true,
        mapOptions: true,
    }], __VLS_functionalComponentArgsRest(__VLS_36), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_40 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({
    modelValue: (__VLS_ctx.form.tex_number),
    label: "Tex",
    placeholder: "VD: 20/9, 40/3",
}));
var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.tex_number),
        label: "Tex",
        placeholder: "VD: 20/9, 40/3",
    }], __VLS_functionalComponentArgsRest(__VLS_41), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_45 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
    modelValue: (__VLS_ctx.form.density_grams_per_meter),
    modelModifiers: { number: true, },
    type: "number",
    label: "Mật độ (g/m)",
    required: true,
    step: (0.001),
    min: (0.001),
}));
var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.density_grams_per_meter),
        modelModifiers: { number: true, },
        type: "number",
        label: "Mật độ (g/m)",
        required: true,
        step: (0.001),
        min: (0.001),
    }], __VLS_functionalComponentArgsRest(__VLS_46), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_50 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
    modelValue: (__VLS_ctx.form.meters_per_cone),
    modelModifiers: { number: true, },
    type: "number",
    label: "Mét/cuộn",
    min: (1),
}));
var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.meters_per_cone),
        modelModifiers: { number: true, },
        type: "number",
        label: "Mét/cuộn",
        min: (1),
    }], __VLS_functionalComponentArgsRest(__VLS_51), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_55 = SupplierSelector_vue_1.default;
// @ts-ignore
var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55(__assign({ 'onUpdate:supplierData': {} }, { modelValue: (__VLS_ctx.form.supplier_id), label: "Nhà cung cấp", clearable: true })));
var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([__assign({ 'onUpdate:supplierData': {} }, { modelValue: (__VLS_ctx.form.supplier_id), label: "Nhà cung cấp", clearable: true })], __VLS_functionalComponentArgsRest(__VLS_56), false));
var __VLS_60;
var __VLS_61 = ({ 'update:supplierData': {} },
    { 'onUpdate:supplierData': (__VLS_ctx.handleSupplierChange) });
var __VLS_58;
var __VLS_59;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_62 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
    modelValue: (__VLS_ctx.form.reorder_level_meters),
    modelModifiers: { number: true, },
    type: "number",
    label: "Mức tái đặt hàng (m)",
    min: (0),
}));
var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.reorder_level_meters),
        modelModifiers: { number: true, },
        type: "number",
        label: "Mức tái đặt hàng (m)",
        min: (0),
    }], __VLS_functionalComponentArgsRest(__VLS_63), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_67 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({
    modelValue: (__VLS_ctx.form.lead_time_days),
    modelModifiers: { number: true, },
    type: "number",
    label: "Thời gian giao hàng (ngày)",
    hint: "Tự động cập nhật từ nhà cung cấp",
    min: (1),
}));
var __VLS_69 = __VLS_68.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.lead_time_days),
        modelModifiers: { number: true, },
        type: "number",
        label: "Thời gian giao hàng (ngày)",
        hint: "Tự động cập nhật từ nhà cung cấp",
        min: (1),
    }], __VLS_functionalComponentArgsRest(__VLS_68), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_72 = AppToggle_vue_1.default;
// @ts-ignore
var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
    modelValue: (__VLS_ctx.form.is_active),
    label: "Hoạt động",
}));
var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.is_active),
        label: "Hoạt động",
    }], __VLS_functionalComponentArgsRest(__VLS_73), false));
// @ts-ignore
[form, form, form, form, form, form, form, form, materialOptions, handleSupplierChange,];
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
