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
var QrLabelSingle_vue_1 = require("./QrLabelSingle.vue");
var QrLabelGrid_vue_1 = require("./QrLabelGrid.vue");
var props = withDefaults(defineProps(), {
    title: 'In nhãn QR',
});
var emit = defineEmits();
// State
var selectedConeIds = (0, vue_1.ref)(new Set());
var printMode = (0, vue_1.ref)('grid');
// Computed
var dialogValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); },
});
var isSingleCone = (0, vue_1.computed)(function () { return props.cones.length === 1; });
var selectedCones = (0, vue_1.computed)(function () {
    if (isSingleCone.value)
        return props.cones;
    return props.cones.filter(function (c) { return selectedConeIds.value.has(c.cone_id); });
});
var allSelected = (0, vue_1.computed)(function () {
    return selectedConeIds.value.size === props.cones.length;
});
// Methods
var toggleSelectAll = function () {
    if (allSelected.value) {
        selectedConeIds.value.clear();
    }
    else {
        selectedConeIds.value = new Set(props.cones.map(function (c) { return c.cone_id; }));
    }
};
var toggleCone = function (coneId) {
    if (selectedConeIds.value.has(coneId)) {
        selectedConeIds.value.delete(coneId);
    }
    else {
        selectedConeIds.value.add(coneId);
    }
    // Trigger reactivity
    selectedConeIds.value = new Set(selectedConeIds.value);
};
var handlePrint = function () {
    window.print();
};
var close = function () {
    dialogValue.value = false;
};
// Initialize selection when dialog opens
(0, vue_1.watch)(dialogValue, function (val) {
    if (val) {
        selectedConeIds.value = new Set(props.cones.map(function (c) { return c.cone_id; }));
        printMode.value = props.cones.length > 1 ? 'grid' : 'single';
    }
});
var __VLS_defaults = {
    title: 'In nhãn QR',
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['print-dialog-card']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-area']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.dialogValue),
    maximized: true,
    transitionShow: "slide-up",
    transitionHide: "slide-down",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.dialogValue),
        maximized: true,
        transitionShow: "slide-up",
        transitionHide: "slide-down",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ class: "print-dialog-card" })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ class: "print-dialog-card" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
/** @type {__VLS_StyleScopedClasses['print-dialog-card']} */ ;
var __VLS_12 = __VLS_10.slots.default;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13(__assign({ class: "row items-center q-pb-none print-hide" })));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none print-hide" })], __VLS_functionalComponentArgsRest(__VLS_14), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
/** @type {__VLS_StyleScopedClasses['print-hide']} */ ;
var __VLS_18 = __VLS_16.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ name: "print" }, { class: "q-mr-sm" })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ name: "print" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_20), false));
/** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
(__VLS_ctx.title);
var __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_25), false));
if (!__VLS_ctx.isSingleCone) {
    var __VLS_29 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtnToggle | typeof __VLS_components.QBtnToggle} */
    qBtnToggle;
    // @ts-ignore
    var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29(__assign({ modelValue: (__VLS_ctx.printMode), options: ([
            { value: 'grid', label: 'Lưới A4', icon: 'grid_view' },
            { value: 'single', label: 'Từng nhãn', icon: 'crop_portrait' },
        ]), dense: true, flat: true, toggleColor: "primary" }, { class: "q-mr-md" })));
    var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.printMode), options: ([
                { value: 'grid', label: 'Lưới A4', icon: 'grid_view' },
                { value: 'single', label: 'Từng nhãn', icon: 'crop_portrait' },
            ]), dense: true, flat: true, toggleColor: "primary" }, { class: "q-mr-md" })], __VLS_functionalComponentArgsRest(__VLS_30), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-md']} */ ;
}
var __VLS_34;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
    icon: "close",
    flat: true,
    round: true,
    dense: true,
}));
var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([{
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_35), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[dialogValue, title, isSingleCone, printMode, vClosePopup,];
var __VLS_16;
if (!__VLS_ctx.isSingleCone) {
    var __VLS_39 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39(__assign({ class: "q-pt-sm print-hide" })));
    var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([__assign({ class: "q-pt-sm print-hide" })], __VLS_functionalComponentArgsRest(__VLS_40), false));
    /** @type {__VLS_StyleScopedClasses['q-pt-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['print-hide']} */ ;
    var __VLS_44 = __VLS_42.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    var __VLS_45 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox} */
    qCheckbox;
    // @ts-ignore
    var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.allSelected), label: "Chọn tất cả", dense: true })));
    var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.allSelected), label: "Chọn tất cả", dense: true })], __VLS_functionalComponentArgsRest(__VLS_46), false));
    var __VLS_50 = void 0;
    var __VLS_51 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.toggleSelectAll) });
    var __VLS_48;
    var __VLS_49;
    var __VLS_52 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
    qChip;
    // @ts-ignore
    var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52({
        dense: true,
        color: "primary",
        textColor: "white",
    }));
    var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([{
            dense: true,
            color: "primary",
            textColor: "white",
        }], __VLS_functionalComponentArgsRest(__VLS_53), false));
    var __VLS_57 = __VLS_55.slots.default;
    (__VLS_ctx.selectedCones.length);
    (__VLS_ctx.cones.length);
    // @ts-ignore
    [isSingleCone, allSelected, toggleSelectAll, selectedCones, cones,];
    var __VLS_55;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "selection-list q-mt-sm" }));
    /** @type {__VLS_StyleScopedClasses['selection-list']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-sm']} */ ;
    var _loop_1 = function (cone) {
        var __VLS_58 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qChip | typeof __VLS_components.QChip | typeof __VLS_components.qChip | typeof __VLS_components.QChip} */
        qChip;
        // @ts-ignore
        var __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58(__assign(__assign({ 'onClick': {} }, { key: (cone.cone_id), outline: (!__VLS_ctx.selectedConeIds.has(cone.cone_id)), color: (__VLS_ctx.selectedConeIds.has(cone.cone_id) ? 'primary' : 'grey-5'), textColor: (__VLS_ctx.selectedConeIds.has(cone.cone_id) ? 'white' : 'grey-8'), clickable: true, dense: true }), { class: "q-mr-xs q-mb-xs" })));
        var __VLS_60 = __VLS_59.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { key: (cone.cone_id), outline: (!__VLS_ctx.selectedConeIds.has(cone.cone_id)), color: (__VLS_ctx.selectedConeIds.has(cone.cone_id) ? 'primary' : 'grey-5'), textColor: (__VLS_ctx.selectedConeIds.has(cone.cone_id) ? 'white' : 'grey-8'), clickable: true, dense: true }), { class: "q-mr-xs q-mb-xs" })], __VLS_functionalComponentArgsRest(__VLS_59), false));
        var __VLS_63 = void 0;
        var __VLS_64 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(!__VLS_ctx.isSingleCone))
                        return;
                    __VLS_ctx.toggleCone(cone.cone_id);
                    // @ts-ignore
                    [cones, selectedConeIds, selectedConeIds, selectedConeIds, toggleCone,];
                } });
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
        var __VLS_65 = __VLS_61.slots.default;
        (cone.cone_id);
        // @ts-ignore
        [];
        // @ts-ignore
        [];
    };
    var __VLS_61, __VLS_62;
    for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.cones)); _i < _a.length; _i++) {
        var cone = _a[_i][0];
        _loop_1(cone);
    }
    // @ts-ignore
    [];
    var __VLS_42;
}
var __VLS_66;
/** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
qSeparator;
// @ts-ignore
var __VLS_67 = __VLS_asFunctionalComponent1(__VLS_66, new __VLS_66(__assign({ class: "print-hide" })));
var __VLS_68 = __VLS_67.apply(void 0, __spreadArray([__assign({ class: "print-hide" })], __VLS_functionalComponentArgsRest(__VLS_67), false));
/** @type {__VLS_StyleScopedClasses['print-hide']} */ ;
var __VLS_71;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71(__assign({ class: "preview-area" })));
var __VLS_73 = __VLS_72.apply(void 0, __spreadArray([__assign({ class: "preview-area" })], __VLS_functionalComponentArgsRest(__VLS_72), false));
/** @type {__VLS_StyleScopedClasses['preview-area']} */ ;
var __VLS_76 = __VLS_74.slots.default;
if (__VLS_ctx.selectedCones.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center text-grey-6 q-pa-xl" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    var __VLS_77 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({
        name: "print_disabled",
        size: "64px",
    }));
    var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([{
            name: "print_disabled",
            size: "64px",
        }], __VLS_functionalComponentArgsRest(__VLS_78), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
}
else if (__VLS_ctx.isSingleCone || __VLS_ctx.printMode === 'single') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "single-preview" }));
    /** @type {__VLS_StyleScopedClasses['single-preview']} */ ;
    for (var _b = 0, _c = __VLS_vFor((__VLS_ctx.selectedCones)); _b < _c.length; _b++) {
        var cone = _c[_b][0];
        var __VLS_82 = QrLabelSingle_vue_1.default;
        // @ts-ignore
        var __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82(__assign({ key: (cone.cone_id), cone: (cone) }, { class: "q-mb-md" })));
        var __VLS_84 = __VLS_83.apply(void 0, __spreadArray([__assign({ key: (cone.cone_id), cone: (cone) }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_83), false));
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
        // @ts-ignore
        [isSingleCone, printMode, selectedCones, selectedCones,];
    }
}
else {
    var __VLS_87 = QrLabelGrid_vue_1.default;
    // @ts-ignore
    var __VLS_88 = __VLS_asFunctionalComponent1(__VLS_87, new __VLS_87({
        cones: (__VLS_ctx.selectedCones),
    }));
    var __VLS_89 = __VLS_88.apply(void 0, __spreadArray([{
            cones: (__VLS_ctx.selectedCones),
        }], __VLS_functionalComponentArgsRest(__VLS_88), false));
}
// @ts-ignore
[selectedCones,];
var __VLS_74;
var __VLS_92;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92(__assign({ align: "right" }, { class: "q-px-md q-pb-md print-hide" })));
var __VLS_94 = __VLS_93.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md print-hide" })], __VLS_functionalComponentArgsRest(__VLS_93), false));
/** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['print-hide']} */ ;
var __VLS_97 = __VLS_95.slots.default;
var __VLS_98;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_99 = __VLS_asFunctionalComponent1(__VLS_98, new __VLS_98(__assign({ 'onClick': {} }, { flat: true, label: "Đóng", color: "grey-7" })));
var __VLS_100 = __VLS_99.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, label: "Đóng", color: "grey-7" })], __VLS_functionalComponentArgsRest(__VLS_99), false));
var __VLS_103;
var __VLS_104 = ({ click: {} },
    { onClick: (__VLS_ctx.close) });
var __VLS_101;
var __VLS_102;
var __VLS_105;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ 'onClick': {} }, { disable: (__VLS_ctx.selectedCones.length === 0), color: "primary", label: "In", icon: "print" })));
var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { disable: (__VLS_ctx.selectedCones.length === 0), color: "primary", label: "In", icon: "print" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
var __VLS_110;
var __VLS_111 = ({ click: {} },
    { onClick: (__VLS_ctx.handlePrint) });
var __VLS_108;
var __VLS_109;
// @ts-ignore
[selectedCones, close, handlePrint,];
var __VLS_95;
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
