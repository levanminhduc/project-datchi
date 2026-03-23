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
var props = withDefaults(defineProps(), {
    poQuantity: null,
    alreadyOrdered: 0,
    hasSubArts: false,
    initialSubArtCode: undefined,
});
var emit = defineEmits();
var selectedColorId = (0, vue_1.ref)(null);
var selectedSubArtCode = (0, vue_1.ref)(null);
(0, vue_1.watch)(function () { return props.initialSubArtCode; }, function (code) {
    if (code && props.hasSubArts && !selectedSubArtCode.value) {
        selectedSubArtCode.value = code;
    }
}, { immediate: true });
var subArtCodes = (0, vue_1.computed)(function () {
    if (!props.hasSubArts)
        return [];
    var codes = new Set();
    for (var _i = 0, _a = props.colorOptions; _i < _a.length; _i++) {
        var c = _a[_i];
        var idx = c.name.indexOf(' - ');
        if (idx > 0) {
            codes.add(c.name.substring(0, idx));
        }
    }
    return Array.from(codes).sort();
});
var subArtCodeOptions = (0, vue_1.computed)(function () {
    return subArtCodes.value.map(function (code) { return ({ label: code, value: code }); });
});
(0, vue_1.watch)(selectedSubArtCode, function () {
    selectedColorId.value = null;
});
var currentTotal = (0, vue_1.computed)(function () {
    return props.entry.colors.reduce(function (sum, c) { return sum + c.quantity; }, 0);
});
var maxAllowed = (0, vue_1.computed)(function () {
    return props.poQuantity != null ? props.poQuantity - (props.alreadyOrdered || 0) : null;
});
var remaining = (0, vue_1.computed)(function () {
    return maxAllowed.value != null ? maxAllowed.value - currentTotal.value : 0;
});
var isWarning = (0, vue_1.computed)(function () {
    return maxAllowed.value != null && remaining.value >= 0 && maxAllowed.value > 0 && remaining.value <= maxAllowed.value * 0.1;
});
var getMaxForColor = function (colorId) {
    if (maxAllowed.value == null)
        return undefined;
    var othersTotal = props.entry.colors
        .filter(function (c) { return c.color_id !== colorId; })
        .reduce(function (sum, c) { return sum + c.quantity; }, 0);
    return Math.max(0, maxAllowed.value - othersTotal);
};
var clampOnKeydown = function (e, colorId, currentValue) {
    var _a, _b;
    var max = getMaxForColor(colorId);
    if (max == null)
        return;
    if (e.key === 'ArrowUp' && currentValue >= max) {
        e.preventDefault();
        return;
    }
    var isDigit = /^[0-9]$/.test(e.key);
    if (!isDigit)
        return;
    var input = e.target;
    var selStart = (_a = input.selectionStart) !== null && _a !== void 0 ? _a : input.value.length;
    var selEnd = (_b = input.selectionEnd) !== null && _b !== void 0 ? _b : input.value.length;
    var before = input.value.slice(0, selStart);
    var after = input.value.slice(selEnd);
    var projected = parseInt(before + e.key + after, 10);
    if (!isNaN(projected) && projected > max) {
        e.preventDefault();
        if (parseInt(input.value, 10) !== max) {
            input.value = String(max);
            emit('update-quantity', props.entry.style_id, colorId, max, props.entry.po_id, props.entry.sub_art_id);
        }
    }
};
var clampOnPaste = function (e, colorId) {
    var _a, _b;
    var max = getMaxForColor(colorId);
    if (max == null)
        return;
    var pasted = (_b = (_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.getData('text')) !== null && _b !== void 0 ? _b : '';
    var val = parseInt(pasted, 10);
    if (!isNaN(val) && val > max) {
        e.preventDefault();
        var input = e.target;
        input.value = String(max);
        emit('update-quantity', props.entry.style_id, colorId, max, props.entry.po_id, props.entry.sub_art_id);
    }
};
var handleQuantityChange = function (colorId, rawQty) {
    var qty = Math.max(0, rawQty);
    var max = getMaxForColor(colorId);
    if (max != null) {
        qty = Math.min(qty, max);
    }
    emit('update-quantity', props.entry.style_id, colorId, qty, props.entry.po_id, props.entry.sub_art_id);
};
var availableColors = (0, vue_1.computed)(function () {
    var usedIds = new Set(props.entry.colors.map(function (c) { return c.color_id; }));
    var source = props.colorOptions;
    if (props.hasSubArts && selectedSubArtCode.value) {
        var prefix_1 = selectedSubArtCode.value + ' - ';
        source = source.filter(function (c) { return c.name.startsWith(prefix_1); });
    }
    return source
        .filter(function (c) { return !usedIds.has(c.id); })
        .map(function (c) { return ({ label: c.name, value: c.id }); });
});
var handleAddColor = function () {
    if (!selectedColorId.value)
        return;
    var color = props.colorOptions.find(function (c) { return c.id === selectedColorId.value; });
    if (!color)
        return;
    if (props.hasSubArts && !selectedSubArtCode.value) {
        var idx = color.name.indexOf(' - ');
        if (idx > 0) {
            selectedSubArtCode.value = color.name.substring(0, idx);
        }
    }
    emit('add-color', props.entry.style_id, {
        color_id: color.id,
        color_name: color.name,
        hex_code: color.hex_code,
        style_color_id: color.id,
    }, props.entry.po_id, props.entry.sub_art_id);
    selectedColorId.value = null;
};
var __VLS_defaults = {
    poQuantity: null,
    alreadyOrdered: 0,
    hasSubArts: false,
    initialSubArtCode: undefined,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
AppCard;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ flat: true, bordered: true }, { class: "q-mb-sm" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-sm" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
/** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
(__VLS_ctx.entry.style_code);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-7 q-ml-sm" }));
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
/** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
(__VLS_ctx.entry.style_name);
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.AppButton | typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", color: "negative", size: "sm" })));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "close", color: "negative", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_14), false));
var __VLS_18;
var __VLS_19 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$emit('remove', __VLS_ctx.entry.style_id, __VLS_ctx.entry.po_id, __VLS_ctx.entry.sub_art_id);
            // @ts-ignore
            [entry, entry, entry, entry, entry, $emit,];
        } });
var __VLS_20 = __VLS_16.slots.default;
var __VLS_21;
/** @ts-ignore @type {typeof __VLS_components.AppTooltip | typeof __VLS_components.AppTooltip} */
AppTooltip;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({}));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_22), false));
var __VLS_26 = __VLS_24.slots.default;
// @ts-ignore
[];
var __VLS_24;
// @ts-ignore
[];
var __VLS_16;
var __VLS_17;
if (__VLS_ctx.poQuantity != null) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-x-md text-caption" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-8" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.alreadyOrdered || 0);
    (__VLS_ctx.poQuantity);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-8" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.currentTotal);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (__VLS_ctx.isWarning ? 'text-warning text-weight-bold' : 'text-positive') }));
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.remaining);
    if (__VLS_ctx.isWarning) {
        var __VLS_27 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
        qBanner;
        // @ts-ignore
        var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27(__assign({ dense: true, rounded: true }, { class: "bg-orange-1 text-warning q-mt-xs" })));
        var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([__assign({ dense: true, rounded: true }, { class: "bg-orange-1 text-warning q-mt-xs" })], __VLS_functionalComponentArgsRest(__VLS_28), false));
        /** @type {__VLS_StyleScopedClasses['bg-orange-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
        var __VLS_32 = __VLS_30.slots.default;
        {
            var __VLS_33 = __VLS_30.slots.avatar;
            var __VLS_34 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({
                name: "warning",
                color: "warning",
                size: "sm",
            }));
            var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([{
                    name: "warning",
                    color: "warning",
                    size: "sm",
                }], __VLS_functionalComponentArgsRest(__VLS_35), false));
            // @ts-ignore
            [poQuantity, poQuantity, alreadyOrdered, currentTotal, isWarning, isWarning, remaining,];
        }
        (__VLS_ctx.remaining);
        // @ts-ignore
        [remaining,];
        var __VLS_30;
    }
}
if (__VLS_ctx.entry.sub_art_code && !__VLS_ctx.hasSubArts) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mb-sm text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.entry.sub_art_code);
}
if (__VLS_ctx.entry.colors.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var _loop_1 = function (color) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (color.color_id) }, { class: "row items-center q-mb-xs q-col-gutter-sm" }));
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-3 row items-center" }));
        /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['row']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)(__assign({ class: "q-mr-sm" }, { style: ({
                display: 'inline-block',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: color.hex_code,
                border: '1px solid #ccc'
            }) }));
        /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-body2" }));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        (color.color_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_39 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.AppInput} */
        AppInput;
        // @ts-ignore
        var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39(__assign(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onKeydown': {} }), { 'onPaste': {} }), { modelValue: (color.quantity), type: "number", dense: true, hideBottomSpace: true, label: "Số lượng (SP)", min: (0), max: (__VLS_ctx.getMaxForColor(color.color_id)) }), { style: {} })));
        var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onKeydown': {} }), { 'onPaste': {} }), { modelValue: (color.quantity), type: "number", dense: true, hideBottomSpace: true, label: "Số lượng (SP)", min: (0), max: (__VLS_ctx.getMaxForColor(color.color_id)) }), { style: {} })], __VLS_functionalComponentArgsRest(__VLS_40), false));
        var __VLS_44 = void 0;
        var __VLS_45 = ({ 'update:modelValue': {} },
            { 'onUpdate:modelValue': function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.entry.colors.length > 0))
                        return;
                    __VLS_ctx.handleQuantityChange(color.color_id, Number($event));
                    // @ts-ignore
                    [entry, entry, entry, entry, hasSubArts, getMaxForColor, handleQuantityChange,];
                } });
        var __VLS_46 = ({ keydown: {} },
            { onKeydown: (function (e) { return __VLS_ctx.clampOnKeydown(e, color.color_id, color.quantity); }) });
        var __VLS_47 = ({ paste: {} },
            { onPaste: (function (e) { return __VLS_ctx.clampOnPaste(e, color.color_id); }) });
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
        /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
        var __VLS_48 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.AppButton} */
        AppButton;
        // @ts-ignore
        var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "remove_circle_outline", color: "negative", size: "sm" })));
        var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "remove_circle_outline", color: "negative", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_49), false));
        var __VLS_53 = void 0;
        var __VLS_54 = ({ click: {} },
            { onClick: function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.entry.colors.length > 0))
                        return;
                    __VLS_ctx.$emit('remove-color', __VLS_ctx.entry.style_id, color.color_id, __VLS_ctx.entry.po_id, __VLS_ctx.entry.sub_art_id);
                    // @ts-ignore
                    [entry, entry, entry, $emit, clampOnKeydown, clampOnPaste,];
                } });
        // @ts-ignore
        [];
    };
    var __VLS_42, __VLS_43, __VLS_51, __VLS_52;
    for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.entry.colors)); _i < _a.length; _i++) {
        var color = _a[_i][0];
        _loop_1(color);
    }
}
if (__VLS_ctx.hasSubArts) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm items-end" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_55 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_56 = __VLS_asFunctionalComponent1(__VLS_55, new __VLS_55({
        modelValue: (__VLS_ctx.selectedSubArtCode),
        options: (__VLS_ctx.subArtCodeOptions),
        label: "Sub-art",
        dense: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        hideBottomSpace: true,
        clearable: true,
        optionValue: "value",
        optionLabel: "label",
        emitValue: true,
        mapOptions: true,
    }));
    var __VLS_57 = __VLS_56.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.selectedSubArtCode),
            options: (__VLS_ctx.subArtCodeOptions),
            label: "Sub-art",
            dense: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
            hideBottomSpace: true,
            clearable: true,
            optionValue: "value",
            optionLabel: "label",
            emitValue: true,
            mapOptions: true,
        }], __VLS_functionalComponentArgsRest(__VLS_56), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-5 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_60 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect | typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_61 = __VLS_asFunctionalComponent1(__VLS_60, new __VLS_60({
        modelValue: (__VLS_ctx.selectedColorId),
        options: (__VLS_ctx.availableColors),
        label: "Màu hàng",
        dense: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        hideBottomSpace: true,
        clearable: true,
        optionValue: "value",
        optionLabel: "label",
        emitValue: true,
        mapOptions: true,
    }));
    var __VLS_62 = __VLS_61.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.selectedColorId),
            options: (__VLS_ctx.availableColors),
            label: "Màu hàng",
            dense: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
            hideBottomSpace: true,
            clearable: true,
            optionValue: "value",
            optionLabel: "label",
            emitValue: true,
            mapOptions: true,
        }], __VLS_functionalComponentArgsRest(__VLS_61), false));
    var __VLS_65 = __VLS_63.slots.default;
    {
        var __VLS_66 = __VLS_63.slots["no-option"];
        var __VLS_67 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({}));
        var __VLS_69 = __VLS_68.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_68), false));
        var __VLS_72 = __VLS_70.slots.default;
        var __VLS_73 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73(__assign({ class: "text-grey" })));
        var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_74), false));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        var __VLS_78 = __VLS_76.slots.default;
        (__VLS_ctx.selectedSubArtCode ? 'Không còn màu cho sub-art này' : 'Chọn sub-art trước');
        // @ts-ignore
        [hasSubArts, selectedSubArtCode, selectedSubArtCode, subArtCodeOptions, selectedColorId, availableColors,];
        var __VLS_76;
        // @ts-ignore
        [];
        var __VLS_70;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_63;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_79 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79(__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "add", color: "primary", label: "Thêm", disable: (!__VLS_ctx.selectedColorId) })));
    var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "add", color: "primary", label: "Thêm", disable: (!__VLS_ctx.selectedColorId) })], __VLS_functionalComponentArgsRest(__VLS_80), false));
    var __VLS_84 = void 0;
    var __VLS_85 = ({ click: {} },
        { onClick: (__VLS_ctx.handleAddColor) });
    var __VLS_82;
    var __VLS_83;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm items-end" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-end']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-5 col-md-4" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-5']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
    var __VLS_86 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
        modelValue: (__VLS_ctx.selectedColorId),
        options: (__VLS_ctx.availableColors),
        label: "Thêm màu",
        dense: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        hideBottomSpace: true,
        clearable: true,
        optionValue: "value",
        optionLabel: "label",
        emitValue: true,
        mapOptions: true,
    }));
    var __VLS_88 = __VLS_87.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.selectedColorId),
            options: (__VLS_ctx.availableColors),
            label: "Thêm màu",
            dense: true,
            useInput: true,
            fillInput: true,
            hideSelected: true,
            hideBottomSpace: true,
            clearable: true,
            optionValue: "value",
            optionLabel: "label",
            emitValue: true,
            mapOptions: true,
        }], __VLS_functionalComponentArgsRest(__VLS_87), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
    /** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
    var __VLS_91 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppButton} */
    AppButton;
    // @ts-ignore
    var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91(__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "add", color: "primary", label: "Thêm", disable: (!__VLS_ctx.selectedColorId) })));
    var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "add", color: "primary", label: "Thêm", disable: (!__VLS_ctx.selectedColorId) })], __VLS_functionalComponentArgsRest(__VLS_92), false));
    var __VLS_96 = void 0;
    var __VLS_97 = ({ click: {} },
        { onClick: (__VLS_ctx.handleAddColor) });
    var __VLS_94;
    var __VLS_95;
}
// @ts-ignore
[selectedColorId, selectedColorId, selectedColorId, availableColors, handleAddColor, handleAddColor,];
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
