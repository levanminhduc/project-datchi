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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var useLots_1 = require("@/composables/useLots");
var inventoryService_1 = require("@/services/inventoryService");
defineOptions({
    name: 'LotSelector',
    inheritAttrs: false
});
var props = withDefaults(defineProps(), {
    label: 'Chọn lô',
    activeOnly: true,
    includeUnassigned: true,
    outlined: true,
    filled: false,
    dense: false,
    disable: false,
    readonly: false,
    clearable: false,
    loading: false,
    emitValue: true,
    mapOptions: true,
    useInput: true,
    inputDebounce: 300,
    behavior: 'menu',
    required: false,
    autoFetch: true,
    popupContentClass: ''
});
var emit = defineEmits();
var _m = (0, useLots_1.useLots)(), lots = _m.lots, isLoading = _m.loading, fetchLots = _m.fetchLots;
var filterText = (0, vue_1.ref)('');
var unassignedGroups = (0, vue_1.ref)([]);
var loadingUnassigned = (0, vue_1.ref)(false);
var UNASSIGNED_PREFIX = 'unassigned:';
function isUnassignedGroup(opt) {
    return 'thread_type_id' in opt && 'cone_ids' in opt;
}
function getOptionValue(opt) {
    if (isUnassignedGroup(opt)) {
        return "".concat(UNASSIGNED_PREFIX).concat(opt.thread_type_id);
    }
    return opt.id;
}
function getOptionLabel(opt) {
    if (isUnassignedGroup(opt)) {
        return "".concat(opt.thread_type_name, " (Ch\u01B0a ph\u00E2n l\u00F4)");
    }
    return opt.lot_number;
}
var internalValue = (0, vue_1.computed)(function () {
    if (!props.modelValue)
        return null;
    if (typeof props.modelValue === 'string' && props.modelValue.startsWith(UNASSIGNED_PREFIX)) {
        var threadTypeId_1 = parseInt(props.modelValue.replace(UNASSIGNED_PREFIX, ''));
        return unassignedGroups.value.find(function (g) { return g.thread_type_id === threadTypeId_1; }) || null;
    }
    if (typeof props.modelValue === 'number') {
        return lots.value.find(function (l) { return l.id === props.modelValue; }) || null;
    }
    return null;
});
var allOptions = (0, vue_1.computed)(function () {
    var lotOptions = lots.value;
    if (props.activeOnly) {
        lotOptions = lotOptions.filter(function (l) { return l.status === 'ACTIVE'; });
    }
    if (props.threadTypeId) {
        lotOptions = lotOptions.filter(function (l) { return l.thread_type_id === props.threadTypeId; });
    }
    var combined = __spreadArray([], lotOptions, true);
    if (props.includeUnassigned && unassignedGroups.value.length > 0) {
        combined.push.apply(combined, unassignedGroups.value);
    }
    return combined;
});
var filteredOptions = (0, vue_1.computed)(function () {
    if (!filterText.value) {
        return allOptions.value;
    }
    var search = filterText.value.toLowerCase();
    return allOptions.value.filter(function (opt) {
        var _a, _b, _c, _d;
        if (isUnassignedGroup(opt)) {
            return opt.thread_type_name.toLowerCase().includes(search) ||
                opt.thread_type_code.toLowerCase().includes(search);
        }
        return opt.lot_number.toLowerCase().includes(search) ||
            ((_b = (_a = opt.thread_type) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(search)) ||
            ((_d = (_c = opt.warehouse) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(search));
    });
});
var computedRules = (0, vue_1.computed)(function () {
    var rules = __spreadArray([], (props.rules || []), true);
    if (props.required) {
        rules.unshift(function (val) {
            return (val !== null && val !== undefined) || 'Vui lòng chọn lô hoặc loại chỉ';
        });
    }
    return rules;
});
function getStatusColor(status) {
    var colors = {
        ACTIVE: 'positive',
        DEPLETED: 'grey',
        EXPIRED: 'negative',
        QUARANTINE: 'warning'
    };
    return colors[status];
}
function getStatusLabel(status) {
    var labels = {
        ACTIVE: 'Hoạt động',
        DEPLETED: 'Đã hết',
        EXPIRED: 'Hết hạn',
        QUARANTINE: 'Cách ly'
    };
    return labels[status];
}
var handleUpdateModelValue = function (opt) {
    if (!opt) {
        emit('update:modelValue', null);
        emit('lot-selected', null);
        emit('unassigned-selected', null);
        return;
    }
    if (isUnassignedGroup(opt)) {
        emit('update:modelValue', "".concat(UNASSIGNED_PREFIX).concat(opt.thread_type_id));
        emit('lot-selected', null);
        emit('unassigned-selected', opt);
    }
    else {
        emit('update:modelValue', opt.id);
        emit('lot-selected', opt);
        emit('unassigned-selected', null);
    }
};
var handleFilter = function (val, update) {
    update(function () {
        filterText.value = val;
    });
};
function loadLots() {
    return __awaiter(this, void 0, void 0, function () {
        var filters;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filters = {};
                    if (props.activeOnly) {
                        filters.status = 'ACTIVE';
                    }
                    if (props.warehouseId) {
                        filters.warehouse_id = props.warehouseId;
                    }
                    if (props.threadTypeId) {
                        filters.thread_type_id = props.threadTypeId;
                    }
                    return [4 /*yield*/, fetchLots(filters)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function loadUnassignedGroups() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!props.warehouseId || !props.includeUnassigned) {
                        unassignedGroups.value = [];
                        return [2 /*return*/];
                    }
                    loadingUnassigned.value = true;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    _a = unassignedGroups;
                    return [4 /*yield*/, inventoryService_1.inventoryService.getUnassignedByThreadType(props.warehouseId)];
                case 2:
                    _a.value = _c.sent();
                    return [3 /*break*/, 5];
                case 3:
                    _b = _c.sent();
                    unassignedGroups.value = [];
                    return [3 /*break*/, 5];
                case 4:
                    loadingUnassigned.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function loadAll() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all([loadLots(), loadUnassignedGroups()])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.onMounted)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!props.autoFetch) return [3 /*break*/, 2];
                return [4 /*yield*/, loadAll()];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
(0, vue_1.watch)([function () { return props.warehouseId; }, function () { return props.threadTypeId; }], function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, loadAll()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
var __VLS_exposed = {
    refresh: loadAll,
    getUnassignedConeIds: function (value) {
        if (typeof value === 'string' && value.startsWith(UNASSIGNED_PREFIX)) {
            var threadTypeId_2 = parseInt(value.replace(UNASSIGNED_PREFIX, ''));
            var group = unassignedGroups.value.find(function (g) { return g.thread_type_id === threadTypeId_2; });
            return (group === null || group === void 0 ? void 0 : group.cone_ids) || null;
        }
        return null;
    }
};
defineExpose(__VLS_exposed);
var __VLS_defaults = {
    label: 'Chọn lô',
    activeOnly: true,
    includeUnassigned: true,
    outlined: true,
    filled: false,
    dense: false,
    disable: false,
    readonly: false,
    clearable: false,
    loading: false,
    emitValue: true,
    mapOptions: true,
    useInput: true,
    inputDebounce: 300,
    behavior: 'menu',
    required: false,
    autoFetch: true,
    popupContentClass: ''
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['lot-option']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect | typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onFilter': {} }), { modelValue: (__VLS_ctx.internalValue), options: (__VLS_ctx.filteredOptions), optionValue: (__VLS_ctx.getOptionValue), optionLabel: (__VLS_ctx.getOptionLabel), label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), clearable: (__VLS_ctx.clearable), loading: (__VLS_ctx.loading || __VLS_ctx.isLoading), emitValue: (false), mapOptions: (false), useInput: (__VLS_ctx.useInput), inputDebounce: (__VLS_ctx.inputDebounce), behavior: (__VLS_ctx.behavior), popupContentClass: (__VLS_ctx.popupContentClass), rules: (__VLS_ctx.computedRules), error: (!!__VLS_ctx.errorMessage), errorMessage: (__VLS_ctx.errorMessage), lazyRules: true })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onFilter': {} }), { modelValue: (__VLS_ctx.internalValue), options: (__VLS_ctx.filteredOptions), optionValue: (__VLS_ctx.getOptionValue), optionLabel: (__VLS_ctx.getOptionLabel), label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), clearable: (__VLS_ctx.clearable), loading: (__VLS_ctx.loading || __VLS_ctx.isLoading), emitValue: (false), mapOptions: (false), useInput: (__VLS_ctx.useInput), inputDebounce: (__VLS_ctx.inputDebounce), behavior: (__VLS_ctx.behavior), popupContentClass: (__VLS_ctx.popupContentClass), rules: (__VLS_ctx.computedRules), error: (!!__VLS_ctx.errorMessage), errorMessage: (__VLS_ctx.errorMessage), lazyRules: true })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
    var _o = __VLS_vSlot(__VLS_10)[0], opt = _o.opt, itemProps = _o.itemProps;
    var __VLS_11 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11(__assign(__assign({}, (itemProps)), { class: "lot-option" })));
    var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([__assign(__assign({}, (itemProps)), { class: "lot-option" })], __VLS_functionalComponentArgsRest(__VLS_12), false));
    /** @type {__VLS_StyleScopedClasses['lot-option']} */ ;
    var __VLS_16 = __VLS_14.slots.default;
    var __VLS_17 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        avatar: true,
    }));
    var __VLS_19 = __VLS_18.apply(void 0, __spreadArray([{
            avatar: true,
        }], __VLS_functionalComponentArgsRest(__VLS_18), false));
    var __VLS_22 = __VLS_20.slots.default;
    if (__VLS_ctx.isUnassignedGroup(opt)) {
        var __VLS_23 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
            size: "32px",
            color: "orange-2",
            textColor: "orange-9",
            icon: "inventory_2",
        }));
        var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
                size: "32px",
                color: "orange-2",
                textColor: "orange-9",
                icon: "inventory_2",
            }], __VLS_functionalComponentArgsRest(__VLS_24), false));
    }
    else {
        var __VLS_28 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
        qAvatar;
        // @ts-ignore
        var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign({ size: "32px", color: (((_b = (_a = opt.thread_type) === null || _a === void 0 ? void 0 : _a.color_data) === null || _b === void 0 ? void 0 : _b.hex_code) ? undefined : 'grey-3') }, { style: (((_d = (_c = opt.thread_type) === null || _c === void 0 ? void 0 : _c.color_data) === null || _d === void 0 ? void 0 : _d.hex_code) ? { backgroundColor: opt.thread_type.color_data.hex_code } : undefined) })));
        var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign({ size: "32px", color: (((_f = (_e = opt.thread_type) === null || _e === void 0 ? void 0 : _e.color_data) === null || _f === void 0 ? void 0 : _f.hex_code) ? undefined : 'grey-3') }, { style: (((_h = (_g = opt.thread_type) === null || _g === void 0 ? void 0 : _g.color_data) === null || _h === void 0 ? void 0 : _h.hex_code) ? { backgroundColor: opt.thread_type.color_data.hex_code } : undefined) })], __VLS_functionalComponentArgsRest(__VLS_29), false));
        var __VLS_33 = __VLS_31.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-weight-bold text-white" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        ((((_j = opt.thread_type) === null || _j === void 0 ? void 0 : _j.code) || 'L').substring(0, 2).toUpperCase());
        // @ts-ignore
        [internalValue, filteredOptions, getOptionValue, getOptionLabel, label, hint, outlined, filled, dense, disable, readonly, clearable, loading, isLoading, useInput, inputDebounce, behavior, popupContentClass, computedRules, errorMessage, errorMessage, $attrs, handleUpdateModelValue, handleFilter, isUnassignedGroup,];
        var __VLS_31;
    }
    // @ts-ignore
    [];
    var __VLS_20;
    var __VLS_34 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34({}));
    var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_35), false));
    var __VLS_39 = __VLS_37.slots.default;
    var __VLS_40 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_41 = __VLS_asFunctionalComponent1(__VLS_40, new __VLS_40({}));
    var __VLS_42 = __VLS_41.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_41), false));
    var __VLS_45 = __VLS_43.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.isUnassignedGroup(opt) ? opt.thread_type_name : opt.lot_number);
    if (__VLS_ctx.isUnassignedGroup(opt)) {
        var __VLS_46 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46(__assign({ class: "q-ml-sm" }, { color: "orange", label: "Chưa phân lô" })));
        var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([__assign({ class: "q-ml-sm" }, { color: "orange", label: "Chưa phân lô" })], __VLS_functionalComponentArgsRest(__VLS_47), false));
        /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
    }
    // @ts-ignore
    [isUnassignedGroup, isUnassignedGroup,];
    var __VLS_43;
    var __VLS_51 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51({
        caption: true,
    }));
    var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_52), false));
    var __VLS_56 = __VLS_54.slots.default;
    if (__VLS_ctx.isUnassignedGroup(opt)) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (opt.thread_type_code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-mx-xs" }));
        /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (opt.cone_count);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (((_k = opt.thread_type) === null || _k === void 0 ? void 0 : _k.name) || '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-mx-xs" }));
        /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (((_l = opt.warehouse) === null || _l === void 0 ? void 0 : _l.name) || '-');
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-mx-xs" }));
        /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (opt.available_cones);
        (opt.total_cones);
    }
    // @ts-ignore
    [isUnassignedGroup,];
    var __VLS_54;
    // @ts-ignore
    [];
    var __VLS_37;
    var __VLS_57 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
        side: true,
    }));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([{
            side: true,
        }], __VLS_functionalComponentArgsRest(__VLS_58), false));
    var __VLS_62 = __VLS_60.slots.default;
    if (!__VLS_ctx.isUnassignedGroup(opt)) {
        var __VLS_63 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
            color: (__VLS_ctx.getStatusColor(opt.status)),
            label: (__VLS_ctx.getStatusLabel(opt.status)),
        }));
        var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([{
                color: (__VLS_ctx.getStatusColor(opt.status)),
                label: (__VLS_ctx.getStatusLabel(opt.status)),
            }], __VLS_functionalComponentArgsRest(__VLS_64), false));
    }
    // @ts-ignore
    [isUnassignedGroup, getStatusColor, getStatusLabel,];
    var __VLS_60;
    // @ts-ignore
    [];
    var __VLS_14;
    // @ts-ignore
    [];
}
{
    var __VLS_68 = __VLS_3.slots["selected-item"];
    var opt = __VLS_vSlot(__VLS_68)[0].opt;
    if (opt) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        if (__VLS_ctx.isUnassignedGroup(opt)) {
            (opt.thread_type_name);
            var __VLS_69 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69(__assign({ class: "q-ml-xs" }, { color: "orange", label: "Chưa phân lô" })));
            var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([__assign({ class: "q-ml-xs" }, { color: "orange", label: "Chưa phân lô" })], __VLS_functionalComponentArgsRest(__VLS_70), false));
            /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-6 q-ml-xs" }));
            /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
            (opt.cone_count);
        }
        else {
            (opt.lot_number);
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-6 q-ml-xs" }));
            /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
            (opt.available_cones);
        }
    }
    // @ts-ignore
    [isUnassignedGroup,];
}
for (var _i = 0, _p = __VLS_vFor((__VLS_ctx.$slots)); _i < _p.length; _i++) {
    var _q = _p[_i], _ = _q[0], slotName = _q[1];
    {
        var _r = __VLS_3.slots, _s = __VLS_tryAsConstant(slotName), __VLS_74 = _r[_s];
        var slotProps = __VLS_vSlot(__VLS_74)[0];
        var __VLS_75 = __assign({}, (slotProps || {}));
        var __VLS_76 = __VLS_tryAsConstant(slotName);
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
var __VLS_77 = __VLS_76, __VLS_78 = __VLS_75;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    setup: function () { return (__VLS_exposed); },
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
