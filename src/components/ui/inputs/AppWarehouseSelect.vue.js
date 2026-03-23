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
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var useWarehouses_1 = require("@/composables/useWarehouses");
defineOptions({
    name: 'AppWarehouseSelect',
    inheritAttrs: false
});
var props = withDefaults(defineProps(), {
    label: 'Chọn kho',
    storageOnly: true, // Default to storage only for inventory operations
    outlined: true,
    filled: false,
    dense: false,
    disable: false,
    readonly: false,
    clearable: false,
    loading: false,
    emitValue: true,
    mapOptions: true,
    useInput: false,
    inputDebounce: 0,
    behavior: 'menu',
    required: false,
    autoFetch: true,
});
var emit = defineEmits();
// Composables
var _a = (0, useWarehouses_1.useWarehouses)(), warehouses = _a.warehouses, warehouseTree = _a.warehouseTree, isLoading = _a.loading, fetchWarehouseTree = _a.fetchWarehouseTree, fetchWarehouses = _a.fetchWarehouses;
// Local state
var filterText = (0, vue_1.ref)('');
// Option accessors
var optionValue = 'id';
var optionLabel = function (opt) { return "".concat(opt.name, " (").concat(opt.code, ")"); };
var optionDisable = function (opt) { return opt.type === 'LOCATION'; };
/**
 * Build options list based on props
 */
var allOptions = (0, vue_1.computed)(function () {
    if (props.storageOnly) {
        // Return only STORAGE warehouses
        var storages = warehouses.value.filter(function (w) { return w.type === 'STORAGE'; });
        // Filter by location if specified
        if (props.locationId) {
            storages = storages.filter(function (w) { return w.parent_id === props.locationId; });
        }
        return storages;
    }
    // Return grouped list with LOCATION headers
    var options = [];
    for (var _i = 0, _a = warehouseTree.value; _i < _a.length; _i++) {
        var location_1 = _a[_i];
        // Add location as header
        options.push(location_1);
        // Add children
        for (var _b = 0, _c = location_1.children; _b < _c.length; _b++) {
            var storage = _c[_b];
            options.push(storage);
        }
    }
    return options;
});
/**
 * Filter options based on search text
 */
var filteredOptions = (0, vue_1.computed)(function () {
    if (!filterText.value) {
        return allOptions.value;
    }
    var search = filterText.value.toLowerCase();
    return allOptions.value.filter(function (w) {
        return w.name.toLowerCase().includes(search) ||
            w.code.toLowerCase().includes(search);
    });
});
/**
 * Validation rules
 */
var computedRules = (0, vue_1.computed)(function () {
    var rules = __spreadArray([], (props.rules || []), true);
    if (props.required) {
        rules.unshift(function (val) {
            return (val !== null && val !== undefined) || 'Vui lòng chọn kho';
        });
    }
    return rules;
});
/**
 * Handle model value update
 */
var handleUpdateModelValue = function (val) {
    emit('update:modelValue', val);
};
/**
 * Handle filter input
 */
var handleFilter = function (val, update) {
    update(function () {
        filterText.value = val;
    });
};
/**
 * Fetch data on mount
 */
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(props.autoFetch && warehouses.value.length === 0)) return [3 /*break*/, 4];
                if (!props.storageOnly) return [3 /*break*/, 2];
                return [4 /*yield*/, fetchWarehouses()];
            case 1:
                _a.sent();
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, fetchWarehouseTree()];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * Re-fetch when storageOnly changes
 */
(0, vue_1.watch)(function () { return props.storageOnly; }, function (newVal) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(!newVal && warehouseTree.value.length === 0)) return [3 /*break*/, 2];
                return [4 /*yield*/, fetchWarehouseTree()];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
var __VLS_defaults = {
    label: 'Chọn kho',
    storageOnly: true, // Default to storage only for inventory operations
    outlined: true,
    filled: false,
    dense: false,
    disable: false,
    readonly: false,
    clearable: false,
    loading: false,
    emitValue: true,
    mapOptions: true,
    useInput: false,
    inputDebounce: 0,
    behavior: 'menu',
    required: false,
    autoFetch: true,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['warehouse-storage-option']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect | typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onFilter': {} }), { modelValue: (__VLS_ctx.modelValue), options: (__VLS_ctx.filteredOptions), optionValue: (__VLS_ctx.optionValue), optionLabel: (__VLS_ctx.optionLabel), optionDisable: (__VLS_ctx.optionDisable), label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), clearable: (__VLS_ctx.clearable), loading: (__VLS_ctx.loading || __VLS_ctx.isLoading), emitValue: (__VLS_ctx.emitValue), mapOptions: (__VLS_ctx.mapOptions), useInput: (__VLS_ctx.useInput), inputDebounce: (__VLS_ctx.inputDebounce), behavior: (__VLS_ctx.behavior), popupContentClass: (__VLS_ctx.popupContentClass), rules: (__VLS_ctx.computedRules), error: (!!__VLS_ctx.errorMessage), errorMessage: (__VLS_ctx.errorMessage), lazyRules: true })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onFilter': {} }), { modelValue: (__VLS_ctx.modelValue), options: (__VLS_ctx.filteredOptions), optionValue: (__VLS_ctx.optionValue), optionLabel: (__VLS_ctx.optionLabel), optionDisable: (__VLS_ctx.optionDisable), label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), clearable: (__VLS_ctx.clearable), loading: (__VLS_ctx.loading || __VLS_ctx.isLoading), emitValue: (__VLS_ctx.emitValue), mapOptions: (__VLS_ctx.mapOptions), useInput: (__VLS_ctx.useInput), inputDebounce: (__VLS_ctx.inputDebounce), behavior: (__VLS_ctx.behavior), popupContentClass: (__VLS_ctx.popupContentClass), rules: (__VLS_ctx.computedRules), error: (!!__VLS_ctx.errorMessage), errorMessage: (__VLS_ctx.errorMessage), lazyRules: true })], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleUpdateModelValue) });
var __VLS_7 = ({ filter: {} },
    { onFilter: (__VLS_ctx.handleFilter) });
var __VLS_8 = {};
var __VLS_9 = __VLS_3.slots.default;
{
    var __VLS_10 = __VLS_3.slots.option;
    var _b = __VLS_vSlot(__VLS_10)[0], opt = _b.opt, itemProps = _b.itemProps;
    if (opt.type === 'LOCATION') {
        var __VLS_11 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11(__assign(__assign(__assign({}, (itemProps)), { class: "warehouse-location-header" }), { disable: true })));
        var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([__assign(__assign(__assign({}, (itemProps)), { class: "warehouse-location-header" }), { disable: true })], __VLS_functionalComponentArgsRest(__VLS_12), false));
        /** @type {__VLS_StyleScopedClasses['warehouse-location-header']} */ ;
        var __VLS_16 = __VLS_14.slots.default;
        var __VLS_17 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({}));
        var __VLS_19 = __VLS_18.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_18), false));
        var __VLS_22 = __VLS_20.slots.default;
        var __VLS_23 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23(__assign({ class: "text-weight-bold text-grey-8" })));
        var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([__assign({ class: "text-weight-bold text-grey-8" })], __VLS_functionalComponentArgsRest(__VLS_24), false));
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
        var __VLS_28 = __VLS_26.slots.default;
        var __VLS_29 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
        qIcon;
        // @ts-ignore
        var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29(__assign({ name: "location_on", size: "xs" }, { class: "q-mr-xs" })));
        var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([__assign({ name: "location_on", size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_30), false));
        /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
        (opt.name);
        // @ts-ignore
        [modelValue, filteredOptions, optionValue, optionLabel, optionDisable, label, hint, outlined, filled, dense, disable, readonly, clearable, loading, isLoading, emitValue, mapOptions, useInput, inputDebounce, behavior, popupContentClass, computedRules, errorMessage, errorMessage, $attrs, handleUpdateModelValue, handleFilter,];
        var __VLS_26;
        // @ts-ignore
        [];
        var __VLS_20;
        // @ts-ignore
        [];
        var __VLS_14;
    }
    else {
        var __VLS_34 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
        qItem;
        // @ts-ignore
        var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34(__assign(__assign({}, (itemProps)), { class: "warehouse-storage-option" })));
        var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([__assign(__assign({}, (itemProps)), { class: "warehouse-storage-option" })], __VLS_functionalComponentArgsRest(__VLS_35), false));
        /** @type {__VLS_StyleScopedClasses['warehouse-storage-option']} */ ;
        var __VLS_39 = __VLS_37.slots.default;
        var __VLS_40 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
        qItemSection;
        // @ts-ignore
        var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({}));
        var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_41), false));
        var __VLS_45 = __VLS_43.slots.default;
        var __VLS_46 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
        qItemLabel;
        // @ts-ignore
        var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({}));
        var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_47), false));
        var __VLS_51 = __VLS_49.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-ml-md" }));
        /** @type {__VLS_StyleScopedClasses['q-ml-md']} */ ;
        (opt.name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-6 q-ml-xs" }));
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
        (opt.code);
        // @ts-ignore
        [];
        var __VLS_49;
        // @ts-ignore
        [];
        var __VLS_43;
        // @ts-ignore
        [];
        var __VLS_37;
    }
    // @ts-ignore
    [];
}
{
    var __VLS_52 = __VLS_3.slots["selected-item"];
    var opt = __VLS_vSlot(__VLS_52)[0].opt;
    if (opt) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (opt.name);
        (opt.code);
    }
    // @ts-ignore
    [];
}
for (var _i = 0, _c = __VLS_vFor((__VLS_ctx.$slots)); _i < _c.length; _i++) {
    var _d = _c[_i], _ = _d[0], slotName = _d[1];
    {
        var _e = __VLS_3.slots, _f = __VLS_tryAsConstant(slotName), __VLS_53 = _e[_f];
        var slotProps = __VLS_vSlot(__VLS_53)[0];
        var __VLS_54 = __assign({}, (slotProps || {}));
        var __VLS_55 = __VLS_tryAsConstant(slotName);
        // @ts-ignore
        [$slots,];
    }
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_56 = __VLS_55, __VLS_57 = __VLS_54;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
