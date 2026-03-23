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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var FormDialog_vue_1 = require("@/components/ui/dialogs/FormDialog.vue");
var AppTextarea_vue_1 = require("@/components/ui/inputs/AppTextarea.vue");
var WeightMeterDisplay_vue_1 = require("./WeightMeterDisplay.vue");
var qr_1 = require("@/components/qr");
var composables_1 = require("@/composables");
var props = defineProps();
// defineModel for v-model:modelValue
var isOpen = defineModel({ default: false });
var emit = defineEmits();
var barcodeInput = (0, vue_1.ref)('');
var selectedCones = (0, vue_1.ref)([]);
var notes = (0, vue_1.ref)('');
var showQrScanner = (0, vue_1.ref)(false);
var snackbar = (0, composables_1.useSnackbar)();
var totalMeters = (0, vue_1.computed)(function () {
    var _a;
    if (!((_a = props.allocation) === null || _a === void 0 ? void 0 : _a.allocated_cones))
        return 0;
    return props.allocation.allocated_cones
        .filter(function (ac) { var _a; return selectedCones.value.includes(((_a = ac.cone) === null || _a === void 0 ? void 0 : _a.cone_id) || ''); })
        .reduce(function (sum, ac) { return sum + ac.allocated_meters; }, 0);
});
var totalWeight = (0, vue_1.computed)(function () {
    var _a;
    if (!((_a = props.allocation) === null || _a === void 0 ? void 0 : _a.allocated_cones))
        return 0;
    return props.allocation.allocated_cones
        .filter(function (ac) { var _a; return selectedCones.value.includes(((_a = ac.cone) === null || _a === void 0 ? void 0 : _a.cone_id) || ''); })
        .reduce(function (sum, ac) { var _a; return sum + (((_a = ac.cone) === null || _a === void 0 ? void 0 : _a.weight_grams) || 0); }, 0);
});
var isFullySelected = (0, vue_1.computed)(function () {
    var _a;
    if (!((_a = props.allocation) === null || _a === void 0 ? void 0 : _a.allocated_cones))
        return false;
    return selectedCones.value.length === props.allocation.allocated_cones.length;
});
var addBarcode = function () {
    var code = barcodeInput.value.trim();
    if (!code)
        return;
    addConeByCode(code);
    barcodeInput.value = '';
};
var addConeByCode = function (code) {
    var _a, _b;
    var cone = (_b = (_a = props.allocation) === null || _a === void 0 ? void 0 : _a.allocated_cones) === null || _b === void 0 ? void 0 : _b.find(function (ac) { var _a; return ((_a = ac.cone) === null || _a === void 0 ? void 0 : _a.cone_id) === code; });
    if (cone && !selectedCones.value.includes(code)) {
        selectedCones.value.push(code);
        return true;
    }
    return false;
};
var handleQrConfirm = function (code) {
    var added = addConeByCode(code);
    if (added) {
        snackbar.success("\u0110\u00E3 th\u00EAm cone: ".concat(code));
    }
    else {
        var alreadySelected = selectedCones.value.includes(code);
        if (alreadySelected) {
            snackbar.warning("Cone ".concat(code, " \u0111\u00E3 c\u00F3 trong danh s\u00E1ch"));
        }
        else {
            snackbar.error("Cone ".concat(code, " kh\u00F4ng thu\u1ED9c phi\u1EBFu ph\u00E2n b\u1ED5 n\u00E0y"));
        }
    }
};
var removeCone = function (code) {
    selectedCones.value = selectedCones.value.filter(function (c) { return c !== code; });
};
var selectAll = function () {
    var _a;
    if (!((_a = props.allocation) === null || _a === void 0 ? void 0 : _a.allocated_cones))
        return;
    selectedCones.value = props.allocation.allocated_cones.map(function (ac) { var _a; return ((_a = ac.cone) === null || _a === void 0 ? void 0 : _a.cone_id) || ''; }).filter(Boolean);
};
var handleConfirm = function () {
    if (!props.allocation)
        return;
    emit('confirm', {
        allocation_id: props.allocation.id,
        cone_ids: selectedCones.value,
        notes: notes.value
    });
    isOpen.value = false;
    resetForm();
};
var resetForm = function () {
    barcodeInput.value = '';
    selectedCones.value = [];
    notes.value = '';
};
var onCancel = function () {
    isOpen.value = false;
    resetForm();
};
var __VLS_defaultModels = {
    'modelValue': false,
};
var __VLS_modelEmit;
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = FormDialog_vue_1.default || FormDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.isOpen), title: "Xác nhận xuất chỉ cho sản xuất", maxWidth: "600px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onSubmit': {} }, { 'onCancel': {} }), { modelValue: (__VLS_ctx.isOpen), title: "Xác nhận xuất chỉ cho sản xuất", maxWidth: "600px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.handleConfirm) });
var __VLS_7 = ({ cancel: {} },
    { onCancel: (__VLS_ctx.onCancel) });
var __VLS_8 = __VLS_3.slots.default;
if (__VLS_ctx.allocation) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-y-md" }));
    /** @type {__VLS_StyleScopedClasses['q-gutter-y-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "bg-blue-1 q-pa-md rounded-borders border-blue" }));
    /** @type {__VLS_StyleScopedClasses['bg-blue-1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    /** @type {__VLS_StyleScopedClasses['border-blue']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-bold text-blue-9" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-blue-9']} */ ;
    (__VLS_ctx.allocation.order_id);
    var __VLS_9 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
        color: "blue-9",
        textColor: "white",
        dense: true,
        size: "sm",
    }));
    var __VLS_11 = __VLS_10.apply(void 0, __spreadArray([{
            color: "blue-9",
            textColor: "white",
            dense: true,
            size: "sm",
        }], __VLS_functionalComponentArgsRest(__VLS_10), false));
    var __VLS_14 = __VLS_12.slots.default;
    ((_a = __VLS_ctx.allocation.thread_type) === null || _a === void 0 ? void 0 : _a.code);
    // @ts-ignore
    [isOpen, handleConfirm, onCancel, allocation, allocation, allocation,];
    var __VLS_12;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-mt-sm text-body2" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium q-ml-xs" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
    (__VLS_ctx.allocation.requested_meters.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium q-ml-xs text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (__VLS_ctx.allocation.allocated_meters.toLocaleString());
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "barcode-section" }));
    /** @type {__VLS_StyleScopedClasses['barcode-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-xs flex items-center" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    var __VLS_15 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15(__assign(__assign({ name: "qr_code_scanner" }, { class: "q-mr-xs" }), { color: "primary" })));
    var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([__assign(__assign({ name: "qr_code_scanner" }, { class: "q-mr-xs" }), { color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_16), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    var __VLS_20 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput | typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20(__assign({ 'onKeyup': {} }, { modelValue: (__VLS_ctx.barcodeInput), placeholder: "Nhập hoặc quét mã vạch...", outlined: true, dense: true })));
    var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([__assign({ 'onKeyup': {} }, { modelValue: (__VLS_ctx.barcodeInput), placeholder: "Nhập hoặc quét mã vạch...", outlined: true, dense: true })], __VLS_functionalComponentArgsRest(__VLS_21), false));
    var __VLS_25 = void 0;
    var __VLS_26 = ({ keyup: {} },
        { onKeyup: (__VLS_ctx.addBarcode) });
    var __VLS_27 = __VLS_23.slots.default;
    {
        var __VLS_28 = __VLS_23.slots.append;
        var __VLS_29 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29(__assign({ 'onClick': {} }, { icon: "add", flat: true, dense: true, color: "primary" })));
        var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "add", flat: true, dense: true, color: "primary" })], __VLS_functionalComponentArgsRest(__VLS_30), false));
        var __VLS_34 = void 0;
        var __VLS_35 = ({ click: {} },
            { onClick: (__VLS_ctx.addBarcode) });
        var __VLS_32;
        var __VLS_33;
        // @ts-ignore
        [allocation, allocation, barcodeInput, addBarcode, addBarcode,];
    }
    // @ts-ignore
    [];
    var __VLS_23;
    var __VLS_24;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_36 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36(__assign(__assign(__assign({ 'onClick': {} }, { icon: "qr_code_scanner", color: "primary", unelevated: true, dense: true }), { class: "full-height" }), { style: {} })));
    var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { icon: "qr_code_scanner", color: "primary", unelevated: true, dense: true }), { class: "full-height" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_37), false));
    var __VLS_41 = void 0;
    var __VLS_42 = ({ click: {} },
        { onClick: function () {
                var _a = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _a[_i] = arguments[_i];
                }
                var $event = _a[0];
                if (!(__VLS_ctx.allocation))
                    return;
                __VLS_ctx.showQrScanner = true;
                // @ts-ignore
                [showQrScanner,];
            } });
    /** @type {__VLS_StyleScopedClasses['full-height']} */ ;
    var __VLS_43 = __VLS_39.slots.default;
    var __VLS_44 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
    qTooltip;
    // @ts-ignore
    var __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({}));
    var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_45), false));
    var __VLS_49 = __VLS_47.slots.default;
    // @ts-ignore
    [];
    var __VLS_47;
    // @ts-ignore
    [];
    var __VLS_39;
    var __VLS_40;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-end q-mt-xs" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    var __VLS_50 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50(__assign({ 'onClick': {} }, { label: "Chọn tất cả", size: "sm", flat: true, color: "primary", noCaps: true, dense: true })));
    var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Chọn tất cả", size: "sm", flat: true, color: "primary", noCaps: true, dense: true })], __VLS_functionalComponentArgsRest(__VLS_51), false));
    var __VLS_55 = void 0;
    var __VLS_56 = ({ click: {} },
        { onClick: (__VLS_ctx.selectAll) });
    var __VLS_53;
    var __VLS_54;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "cones-list-section" }));
    /** @type {__VLS_StyleScopedClasses['cones-list-section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm flex items-center justify-between" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (__VLS_ctx.selectedCones.length);
    (((_b = __VLS_ctx.allocation.allocated_cones) === null || _b === void 0 ? void 0 : _b.length) || 0);
    if (__VLS_ctx.isFullySelected) {
        var __VLS_57 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
            name: "check_circle",
            color: "positive",
            size: "xs",
        }));
        var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([{
                name: "check_circle",
                color: "positive",
                size: "xs",
            }], __VLS_functionalComponentArgsRest(__VLS_58), false));
    }
    var __VLS_62 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qList | typeof __VLS_components.QList | typeof __VLS_components.qList | typeof __VLS_components.QList} */
    qList;
    // @ts-ignore
    var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62(__assign(__assign({ bordered: true, separator: true }, { class: "rounded-borders overflow-hidden" }), { style: {} })));
    var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([__assign(__assign({ bordered: true, separator: true }, { class: "rounded-borders overflow-hidden" }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_63), false));
    /** @type {__VLS_StyleScopedClasses['rounded-borders']} */ ;
    /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
    var __VLS_67 = __VLS_65.slots.default;
    if (__VLS_ctx.allocation.allocated_cones && __VLS_ctx.allocation.allocated_cones.length > 0) {
        var _loop_1 = function (ac) {
            var __VLS_68 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
            qItem;
            // @ts-ignore
            var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
                key: (ac.id),
                dense: true,
            }));
            var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([{
                    key: (ac.id),
                    dense: true,
                }], __VLS_functionalComponentArgsRest(__VLS_69), false));
            var __VLS_73 = __VLS_71.slots.default;
            var __VLS_74 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
                side: true,
            }));
            var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([{
                    side: true,
                }], __VLS_functionalComponentArgsRest(__VLS_75), false));
            var __VLS_79 = __VLS_77.slots.default;
            var __VLS_80 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox} */
            qCheckbox;
            // @ts-ignore
            var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80({
                modelValue: (__VLS_ctx.selectedCones),
                val: ((_c = ac.cone) === null || _c === void 0 ? void 0 : _c.cone_id),
                size: "sm",
            }));
            var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([{
                    modelValue: (__VLS_ctx.selectedCones),
                    val: ((_d = ac.cone) === null || _d === void 0 ? void 0 : _d.cone_id),
                    size: "sm",
                }], __VLS_functionalComponentArgsRest(__VLS_81), false));
            // @ts-ignore
            [allocation, allocation, allocation, allocation, selectAll, selectedCones, selectedCones, isFullySelected,];
            var __VLS_85 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({}));
            var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_86), false));
            var __VLS_90 = __VLS_88.slots.default;
            var __VLS_91 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
            qItemLabel;
            // @ts-ignore
            var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91(__assign({ class: "text-weight-medium" })));
            var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([__assign({ class: "text-weight-medium" })], __VLS_functionalComponentArgsRest(__VLS_92), false));
            /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
            var __VLS_96 = __VLS_94.slots.default;
            ((_e = ac.cone) === null || _e === void 0 ? void 0 : _e.cone_id);
            // @ts-ignore
            [];
            var __VLS_97 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
            qItemLabel;
            // @ts-ignore
            var __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97({
                caption: true,
            }));
            var __VLS_99 = __VLS_98.apply(void 0, __spreadArray([{
                    caption: true,
                }], __VLS_functionalComponentArgsRest(__VLS_98), false));
            var __VLS_102 = __VLS_100.slots.default;
            (((_f = ac.cone) === null || _f === void 0 ? void 0 : _f.lot_number) || 'N/A');
            (ac.allocated_meters.toLocaleString());
            // @ts-ignore
            [];
            // @ts-ignore
            [];
            var __VLS_103 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
            qItemSection;
            // @ts-ignore
            var __VLS_104 = __VLS_asFunctionalComponent1(__VLS_103, new __VLS_103({
                side: true,
            }));
            var __VLS_105 = __VLS_104.apply(void 0, __spreadArray([{
                    side: true,
                }], __VLS_functionalComponentArgsRest(__VLS_104), false));
            var __VLS_108 = __VLS_106.slots.default;
            var __VLS_109 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
            qBtn;
            // @ts-ignore
            var __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109(__assign({ 'onClick': {} }, { icon: "close", size: "xs", flat: true, round: true, dense: true, color: "grey-6" })));
            var __VLS_111 = __VLS_110.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { icon: "close", size: "xs", flat: true, round: true, dense: true, color: "grey-6" })], __VLS_functionalComponentArgsRest(__VLS_110), false));
            var __VLS_114 = void 0;
            var __VLS_115 = ({ click: {} },
                { onClick: function () {
                        var _a;
                        var _b = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _b[_i] = arguments[_i];
                        }
                        var $event = _b[0];
                        if (!(__VLS_ctx.allocation))
                            return;
                        if (!(__VLS_ctx.allocation.allocated_cones && __VLS_ctx.allocation.allocated_cones.length > 0))
                            return;
                        __VLS_ctx.removeCone(((_a = ac.cone) === null || _a === void 0 ? void 0 : _a.cone_id) || '');
                        // @ts-ignore
                        [removeCone,];
                    } });
            // @ts-ignore
            [];
            // @ts-ignore
            [];
            // @ts-ignore
            [];
        };
        var __VLS_77, __VLS_94, __VLS_100, __VLS_88, __VLS_112, __VLS_113, __VLS_106, __VLS_71;
        for (var _i = 0, _g = __VLS_vFor((__VLS_ctx.allocation.allocated_cones)); _i < _g.length; _i++) {
            var ac = _g[_i][0];
            _loop_1(ac);
        }
    }
    else {
        var __VLS_116 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116(__assign({ dense: true }, { class: "text-grey-6 italic text-center q-pa-md" })));
        var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([__assign({ dense: true }, { class: "text-grey-6 italic text-center q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_117), false));
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['italic']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
        var __VLS_121 = __VLS_119.slots.default;
        var __VLS_122 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122({}));
        var __VLS_124 = __VLS_123.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_123), false));
        var __VLS_127 = __VLS_125.slots.default;
        // @ts-ignore
        [];
        var __VLS_125;
        // @ts-ignore
        [];
        var __VLS_119;
    }
    // @ts-ignore
    [];
    var __VLS_65;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    var __VLS_128 = WeightMeterDisplay_vue_1.default;
    // @ts-ignore
    var __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128(__assign({ meters: (__VLS_ctx.totalMeters), weight: (__VLS_ctx.totalWeight), bordered: true, padding: true }, { class: "bg-grey-1" })));
    var __VLS_130 = __VLS_129.apply(void 0, __spreadArray([__assign({ meters: (__VLS_ctx.totalMeters), weight: (__VLS_ctx.totalWeight), bordered: true, padding: true }, { class: "bg-grey-1" })], __VLS_functionalComponentArgsRest(__VLS_129), false));
    /** @type {__VLS_StyleScopedClasses['bg-grey-1']} */ ;
    var __VLS_133 = AppTextarea_vue_1.default;
    // @ts-ignore
    var __VLS_134 = __VLS_asFunctionalComponent1(__VLS_133, new __VLS_133({
        modelValue: (__VLS_ctx.notes),
        label: "Ghi chú xuất kho",
        placeholder: "Ví dụ: Tình trạng bao bì, người nhận...",
        rows: "2",
    }));
    var __VLS_135 = __VLS_134.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.notes),
            label: "Ghi chú xuất kho",
            placeholder: "Ví dụ: Tình trạng bao bì, người nhận...",
            rows: "2",
        }], __VLS_functionalComponentArgsRest(__VLS_134), false));
}
// @ts-ignore
[totalMeters, totalWeight, notes,];
var __VLS_3;
var __VLS_4;
var __VLS_138;
/** @ts-ignore @type {typeof __VLS_components.QrScannerDialog} */
qr_1.QrScannerDialog;
// @ts-ignore
var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138(__assign({ 'onConfirm': {} }, { modelValue: (__VLS_ctx.showQrScanner), title: "Quét mã QR Cone", formats: (['qr_code', 'code_128', 'ean_13']), hint: "Đưa mã QR hoặc barcode của cuộn chỉ vào khung", closeOnDetect: (false) })));
var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([__assign({ 'onConfirm': {} }, { modelValue: (__VLS_ctx.showQrScanner), title: "Quét mã QR Cone", formats: (['qr_code', 'code_128', 'ean_13']), hint: "Đưa mã QR hoặc barcode của cuộn chỉ vào khung", closeOnDetect: (false) })], __VLS_functionalComponentArgsRest(__VLS_139), false));
var __VLS_143;
var __VLS_144 = ({ confirm: {} },
    { onConfirm: (__VLS_ctx.handleQrConfirm) });
var __VLS_141;
var __VLS_142;
// @ts-ignore
[showQrScanner, handleQrConfirm,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
