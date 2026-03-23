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
var StyleOrderCard_vue_1 = require("./StyleOrderCard.vue");
var styleService_1 = require("@/services/styleService");
var props = withDefaults(defineProps(), {
    orderedQuantities: function () { return new Map(); },
    subArtRequired: function () { return new Map(); },
});
var emit = defineEmits();
var selectedStyleId = (0, vue_1.ref)(null);
var selectedSubArt = (0, vue_1.ref)(null);
var hasAnySubArts = (0, vue_1.computed)(function () { var _a, _b; return (_b = (_a = props.po.items) === null || _a === void 0 ? void 0 : _a.some(function (item) { return item.has_sub_arts; })) !== null && _b !== void 0 ? _b : false; });
var subArtOptions = (0, vue_1.computed)(function () {
    if (!props.po.items)
        return [];
    var addedStyleIds = new Set(poEntries.value.map(function (e) { return e.style_id; }));
    return props.po.items
        .filter(function (item) { var _a; return ((_a = item.sub_arts) === null || _a === void 0 ? void 0 : _a.length) && !addedStyleIds.has(item.style_id); })
        .filter(function (item) { return !selectedStyleId.value || item.style_id === selectedStyleId.value; })
        .flatMap(function (item) {
        return item.sub_arts.map(function (sa) {
            var _a, _b;
            return ({
                label: "".concat(sa.code, " (").concat((_b = (_a = item.style) === null || _a === void 0 ? void 0 : _a.style_code) !== null && _b !== void 0 ? _b : '?', ")"),
                value: "".concat(item.style_id, "_").concat(sa.id),
                styleId: item.style_id,
                subArtId: sa.id,
                subArtCode: sa.code,
            });
        });
    });
});
(0, vue_1.watch)(selectedSubArt, function (compositeKey) {
    if (!compositeKey)
        return;
    var opt = subArtOptions.value.find(function (o) { return o.value === compositeKey; });
    if (opt)
        selectedStyleId.value = opt.styleId;
});
(0, vue_1.watch)(selectedStyleId, function (newStyleId) {
    if (!selectedSubArt.value)
        return;
    if (!newStyleId) {
        selectedSubArt.value = null;
        return;
    }
    var opt = subArtOptions.value.find(function (o) { return o.value === selectedSubArt.value; });
    if (!opt)
        selectedSubArt.value = null;
});
var specColorsCache = (0, vue_1.ref)({});
var fetchSpecColors = function (styleId) { return __awaiter(void 0, void 0, void 0, function () {
    var colors, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (styleId in specColorsCache.value)
                    return [2 /*return*/];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, styleService_1.styleService.getSpecColors(styleId)];
            case 2:
                colors = _a.sent();
                specColorsCache.value[styleId] = colors.map(function (c) { return ({ id: c.id, name: c.color_name, hex_code: c.hex_code }); });
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                console.error("Error fetching spec colors for style ".concat(styleId, ":"), err_1);
                specColorsCache.value[styleId] = [];
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
var poEntries = (0, vue_1.computed)(function () {
    return props.entries.filter(function (e) { return e.po_id === props.po.id; });
});
var getPoQuantity = function (styleId) {
    var _a, _b;
    var key = "".concat(props.po.id, "_").concat(styleId);
    var info = props.orderedQuantities.get(key);
    if (info)
        return info.po_quantity;
    var poItem = (_a = props.po.items) === null || _a === void 0 ? void 0 : _a.find(function (item) { return item.style_id === styleId; });
    return (_b = poItem === null || poItem === void 0 ? void 0 : poItem.quantity) !== null && _b !== void 0 ? _b : null;
};
var getAlreadyOrdered = function (styleId) {
    var _a, _b;
    var key = "".concat(props.po.id, "_").concat(styleId);
    return (_b = (_a = props.orderedQuantities.get(key)) === null || _a === void 0 ? void 0 : _a.ordered_quantity) !== null && _b !== void 0 ? _b : 0;
};
var availableStyleOptions = (0, vue_1.computed)(function () {
    if (!props.po.items)
        return [];
    var addedStyleIds = new Set(poEntries.value.map(function (e) { return e.style_id; }));
    return props.po.items
        .filter(function (item) { return !addedStyleIds.has(item.style_id); })
        .filter(function (item) { return item.style; })
        .map(function (item) {
        var key = "".concat(props.po.id, "_").concat(item.style_id);
        var info = props.orderedQuantities.get(key);
        var remaining = info ? info.remaining_quantity : item.quantity;
        return {
            label: "".concat(item.style.style_code, " - ").concat(item.style.style_name, " (SL: ").concat(item.quantity, " | C\u00F2n l\u1EA1i: ").concat(remaining, ")"),
            value: item.style_id,
        };
    });
});
var getColorOptionsForStyle = function (styleId) {
    return specColorsCache.value[styleId] || [];
};
var getHasSubArts = function (styleId) {
    if (!props.po.items)
        return false;
    var poItem = props.po.items.find(function (item) { return item.style_id === styleId; });
    return (poItem === null || poItem === void 0 ? void 0 : poItem.has_sub_arts) === true;
};
(0, vue_1.watch)(function () { return props.po.items; }, function (items) {
    if (!items)
        return;
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        if (item.has_sub_arts !== undefined) {
            props.subArtRequired.set(item.style_id, item.has_sub_arts);
        }
    }
}, { immediate: true });
(0, vue_1.watch)(poEntries, function (entries) {
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var entry = entries_1[_i];
        if (!(entry.style_id in specColorsCache.value)) {
            fetchSpecColors(entry.style_id);
        }
    }
}, { immediate: true });
var handleAddStyle = function () {
    if (!selectedStyleId.value || !props.po.items)
        return;
    var poItem = props.po.items.find(function (item) { return item.style_id === selectedStyleId.value; });
    if (!(poItem === null || poItem === void 0 ? void 0 : poItem.style))
        return;
    var subArtOpt = selectedSubArt.value
        ? subArtOptions.value.find(function (o) { return o.value === selectedSubArt.value; })
        : undefined;
    emit('add-style', {
        id: poItem.style.id,
        style_code: poItem.style.style_code,
        style_name: poItem.style.style_name,
        po_id: props.po.id,
        po_number: props.po.po_number,
        sub_art_id: subArtOpt === null || subArtOpt === void 0 ? void 0 : subArtOpt.subArtId,
        sub_art_code: subArtOpt === null || subArtOpt === void 0 ? void 0 : subArtOpt.subArtCode,
    });
    selectedStyleId.value = null;
    selectedSubArt.value = null;
};
var handleAddAllStyles = function () {
    if (!props.po.items)
        return;
    var addedStyleIds = new Set(poEntries.value.map(function (e) { return e.style_id; }));
    for (var _i = 0, _a = props.po.items; _i < _a.length; _i++) {
        var item = _a[_i];
        if (addedStyleIds.has(item.style_id) || !item.style)
            continue;
        emit('add-style', {
            id: item.style.id,
            style_code: item.style.style_code,
            style_name: item.style.style_name,
            po_id: props.po.id,
            po_number: props.po.po_number,
        });
    }
    selectedSubArt.value = null;
};
var __VLS_defaults = {
    orderedQuantities: function () { return new Map(); },
    subArtRequired: function () { return new Map(); },
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
AppCard;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ flat: true, bordered: true }, { class: "q-mb-md" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 text-weight-bold text-primary" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
(__VLS_ctx.po.po_number);
if (__VLS_ctx.po.customer_name) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    (__VLS_ctx.po.customer_name);
}
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.AppButton | typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13(__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "delete_outline", color: "negative", size: "sm" })));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, dense: true, icon: "delete_outline", color: "negative", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_14), false));
var __VLS_18;
var __VLS_19 = ({ click: {} },
    { onClick: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.$emit('remove-po', __VLS_ctx.po.id);
            // @ts-ignore
            [po, po, po, po, $emit,];
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm q-mb-md items-end" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
if (__VLS_ctx.hasAnySubArts) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-4 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_27 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppSelect | typeof __VLS_components.AppSelect} */
    AppSelect;
    // @ts-ignore
    var __VLS_28 = __VLS_asFunctionalComponent1(__VLS_27, new __VLS_27({
        modelValue: (__VLS_ctx.selectedSubArt),
        options: (__VLS_ctx.subArtOptions),
        label: "Tìm theo Sub-art",
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
    var __VLS_29 = __VLS_28.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.selectedSubArt),
            options: (__VLS_ctx.subArtOptions),
            label: "Tìm theo Sub-art",
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
        }], __VLS_functionalComponentArgsRest(__VLS_28), false));
    var __VLS_32 = __VLS_30.slots.default;
    {
        var __VLS_33 = __VLS_30.slots["no-option"];
        var __VLS_34 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({}));
        var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_35), false));
        var __VLS_39 = __VLS_37.slots.default;
        var __VLS_40 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40(__assign({ class: "text-grey" })));
        var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_41), false));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        var __VLS_45 = __VLS_43.slots.default;
        // @ts-ignore
        [hasAnySubArts, selectedSubArt, subArtOptions,];
        var __VLS_43;
        // @ts-ignore
        [];
        var __VLS_37;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_30;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-4" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-4']} */ ;
var __VLS_46;
/** @ts-ignore @type {typeof __VLS_components.AppSelect | typeof __VLS_components.AppSelect} */
AppSelect;
// @ts-ignore
var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
    modelValue: (__VLS_ctx.selectedStyleId),
    options: (__VLS_ctx.availableStyleOptions),
    label: "Thêm mã hàng từ PO",
    dense: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
    hideBottomSpace: true,
    clearable: true,
}));
var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.selectedStyleId),
        options: (__VLS_ctx.availableStyleOptions),
        label: "Thêm mã hàng từ PO",
        dense: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        hideBottomSpace: true,
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_47), false));
var __VLS_51 = __VLS_49.slots.default;
{
    var __VLS_52 = __VLS_49.slots["no-option"];
    var __VLS_53 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({}));
    var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_54), false));
    var __VLS_58 = __VLS_56.slots.default;
    var __VLS_59 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59(__assign({ class: "text-grey" })));
    var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_60), false));
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    var __VLS_64 = __VLS_62.slots.default;
    (((_b = (_a = __VLS_ctx.po.items) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) === 0 ? 'PO chưa có mã hàng' : 'Đã thêm hết mã hàng');
    // @ts-ignore
    [po, selectedStyleId, availableStyleOptions,];
    var __VLS_62;
    // @ts-ignore
    [];
    var __VLS_56;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_49;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
/** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
var __VLS_65;
/** @ts-ignore @type {typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_66 = __VLS_asFunctionalComponent1(__VLS_65, new __VLS_65(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm", dense: true, disable: (!__VLS_ctx.selectedStyleId) })));
var __VLS_67 = __VLS_66.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm", dense: true, disable: (!__VLS_ctx.selectedStyleId) })], __VLS_functionalComponentArgsRest(__VLS_66), false));
var __VLS_70;
var __VLS_71 = ({ click: {} },
    { onClick: (__VLS_ctx.handleAddStyle) });
var __VLS_68;
var __VLS_69;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-auto" }));
/** @type {__VLS_StyleScopedClasses['col-auto']} */ ;
var __VLS_72;
/** @ts-ignore @type {typeof __VLS_components.AppButton} */
AppButton;
// @ts-ignore
var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72(__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "playlist_add", color: "secondary", label: "Thêm tất cả", disable: (__VLS_ctx.availableStyleOptions.length === 0) })));
var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, dense: true, icon: "playlist_add", color: "secondary", label: "Thêm tất cả", disable: (__VLS_ctx.availableStyleOptions.length === 0) })], __VLS_functionalComponentArgsRest(__VLS_73), false));
var __VLS_77;
var __VLS_78 = ({ click: {} },
    { onClick: (__VLS_ctx.handleAddAllStyles) });
var __VLS_75;
var __VLS_76;
for (var _i = 0, _e = __VLS_vFor((__VLS_ctx.poEntries)); _i < _e.length; _i++) {
    var entry = _e[_i][0];
    var __VLS_79 = StyleOrderCard_vue_1.default;
    // @ts-ignore
    var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79(__assign(__assign(__assign(__assign(__assign({ 'onRemove': {} }, { 'onAddColor': {} }), { 'onRemoveColor': {} }), { 'onUpdateQuantity': {} }), { 'onUpdateSubArt': {} }), { key: ("".concat(entry.po_id, "_").concat(entry.style_id, "_").concat((_c = entry.sub_art_id) !== null && _c !== void 0 ? _c : 'null')), entry: (entry), colorOptions: (__VLS_ctx.getColorOptionsForStyle(entry.style_id)), poQuantity: (__VLS_ctx.getPoQuantity(entry.style_id)), alreadyOrdered: (__VLS_ctx.getAlreadyOrdered(entry.style_id)), hasSubArts: (__VLS_ctx.getHasSubArts(entry.style_id)), initialSubArtCode: (entry.sub_art_code) })));
    var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([__assign(__assign(__assign(__assign(__assign({ 'onRemove': {} }, { 'onAddColor': {} }), { 'onRemoveColor': {} }), { 'onUpdateQuantity': {} }), { 'onUpdateSubArt': {} }), { key: ("".concat(entry.po_id, "_").concat(entry.style_id, "_").concat((_d = entry.sub_art_id) !== null && _d !== void 0 ? _d : 'null')), entry: (entry), colorOptions: (__VLS_ctx.getColorOptionsForStyle(entry.style_id)), poQuantity: (__VLS_ctx.getPoQuantity(entry.style_id)), alreadyOrdered: (__VLS_ctx.getAlreadyOrdered(entry.style_id)), hasSubArts: (__VLS_ctx.getHasSubArts(entry.style_id)), initialSubArtCode: (entry.sub_art_code) })], __VLS_functionalComponentArgsRest(__VLS_80), false));
    var __VLS_84 = void 0;
    var __VLS_85 = ({ remove: {} },
        { onRemove: (function (styleId, poId, subArtId) { return __VLS_ctx.$emit('remove-style', styleId, poId, subArtId); }) });
    var __VLS_86 = ({ addColor: {} },
        { onAddColor: (function (styleId, color, poId, subArtId) { return __VLS_ctx.$emit('add-color', styleId, color, poId, subArtId); }) });
    var __VLS_87 = ({ removeColor: {} },
        { onRemoveColor: (function (styleId, colorId, poId, subArtId) { return __VLS_ctx.$emit('remove-color', styleId, colorId, poId, subArtId); }) });
    var __VLS_88 = ({ updateQuantity: {} },
        { onUpdateQuantity: (function (styleId, colorId, qty, poId, subArtId) { return __VLS_ctx.$emit('update-quantity', styleId, colorId, qty, poId, subArtId); }) });
    var __VLS_89 = ({ updateSubArt: {} },
        { onUpdateSubArt: (function (styleId, poId, subArtId, subArtCode, oldSubArtId) { return __VLS_ctx.$emit('update-sub-art', styleId, poId, subArtId, subArtCode, oldSubArtId); }) });
    var __VLS_82;
    var __VLS_83;
    // @ts-ignore
    [$emit, $emit, $emit, $emit, $emit, selectedStyleId, availableStyleOptions, handleAddStyle, handleAddAllStyles, poEntries, getColorOptionsForStyle, getPoQuantity, getAlreadyOrdered, getHasSubArts,];
}
if (__VLS_ctx.poEntries.length === 0) {
    var __VLS_90 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.EmptyState} */
    EmptyState;
    // @ts-ignore
    var __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90(__assign({ icon: "style", title: "Chưa chọn mã hàng", subtitle: "Chọn mã hàng từ danh sách PO items bên trên", iconColor: "grey-4" }, { class: "q-py-sm" })));
    var __VLS_92 = __VLS_91.apply(void 0, __spreadArray([__assign({ icon: "style", title: "Chưa chọn mã hàng", subtitle: "Chọn mã hàng từ danh sách PO items bên trên", iconColor: "grey-4" }, { class: "q-py-sm" })], __VLS_functionalComponentArgsRest(__VLS_91), false));
    /** @type {__VLS_StyleScopedClasses['q-py-sm']} */ ;
}
// @ts-ignore
[poEntries,];
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
