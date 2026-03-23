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
var weeklyOrderService_1 = require("@/services/weeklyOrderService");
var useSnackbar_1 = require("@/composables/useSnackbar");
var AppDialog_vue_1 = require("@/components/ui/dialogs/AppDialog.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var thread_format_1 = require("@/utils/thread-format");
var props = defineProps();
var emit = defineEmits();
var snackbar = (0, useSnackbar_1.useSnackbar)();
var loading = (0, vue_1.ref)(false);
var weeksLoading = (0, vue_1.ref)(false);
var typesLoading = (0, vue_1.ref)(false);
var weeks = (0, vue_1.ref)([]);
var mergedRows = (0, vue_1.ref)([]);
var form = (0, vue_1.reactive)({
    from_week_id: null,
    reason: '',
});
var selectedCount = (0, vue_1.computed)(function () { return mergedRows.value.filter(function (r) { return r.selected; }).length; });
var totalCones = (0, vue_1.computed)(function () {
    return mergedRows.value.filter(function (r) { return r.selected; }).reduce(function (sum, r) { return sum + r.quantity; }, 0);
});
var isValid = (0, vue_1.computed)(function () {
    if (!form.from_week_id)
        return false;
    var selected = mergedRows.value.filter(function (r) { return r.selected; });
    if (selected.length === 0)
        return false;
    return selected.every(function (r) { return r.quantity > 0 && r.quantity <= r.max_borrowable; });
});
var weekOptions = (0, vue_1.computed)(function () {
    return weeks.value
        .filter(function (w) { return w.id !== props.toWeekId; })
        .map(function (w) { return ({ label: w.week_name, value: w.id }); });
});
var onCheckboxChange = function (row) {
    if (row.selected && row.quantity === 0) {
        row.quantity = 1;
    }
};
var resetForm = function () {
    form.from_week_id = null;
    form.reason = '';
    mergedRows.value = [];
};
var loadWeeks = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                weeksLoading.value = true;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, 4, 5]);
                _a = weeks;
                return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.getAll({ status: 'CONFIRMED' })];
            case 2:
                _a.value = _c.sent();
                return [3 /*break*/, 5];
            case 3:
                _b = _c.sent();
                weeks.value = [];
                return [3 /*break*/, 5];
            case 4:
                weeksLoading.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
var loadMergedData = function (fromWeekId) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, reservations, targetSummary, sourceMap, _i, _b, cone, tt, existing, displayName, targetMap, _c, targetSummary_1, s, rows, _d, sourceMap_1, _e, ttId, src, targetShortage, maxBorrowable, _f;
    var _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                typesLoading.value = true;
                _j.label = 1;
            case 1:
                _j.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, Promise.all([
                        weeklyOrderService_1.weeklyOrderService.getReservations(fromWeekId),
                        weeklyOrderService_1.weeklyOrderService.getReservationSummary(props.toWeekId),
                    ])];
            case 2:
                _a = _j.sent(), reservations = _a[0], targetSummary = _a[1];
                sourceMap = new Map();
                for (_i = 0, _b = reservations.cones; _i < _b.length; _i++) {
                    cone = _b[_i];
                    tt = cone.thread_type;
                    if (!tt)
                        continue;
                    existing = sourceMap.get(tt.id);
                    if (existing) {
                        existing.count++;
                    }
                    else {
                        displayName = (0, thread_format_1.formatThreadTypeDisplay)((_g = tt.supplier) === null || _g === void 0 ? void 0 : _g.name, tt.tex_number, tt.color_name, tt.name);
                        sourceMap.set(tt.id, { code: tt.code, name: tt.name, display_name: displayName, count: 1 });
                    }
                }
                targetMap = new Map();
                for (_c = 0, targetSummary_1 = targetSummary; _c < targetSummary_1.length; _c++) {
                    s = targetSummary_1[_c];
                    targetMap.set(s.thread_type_id, Math.max(0, s.shortage));
                }
                rows = [];
                for (_d = 0, sourceMap_1 = sourceMap; _d < sourceMap_1.length; _d++) {
                    _e = sourceMap_1[_d], ttId = _e[0], src = _e[1];
                    targetShortage = (_h = targetMap.get(ttId)) !== null && _h !== void 0 ? _h : 0;
                    maxBorrowable = Math.min(src.count, targetShortage);
                    rows.push({
                        thread_type_id: ttId,
                        code: src.code,
                        name: src.name,
                        display_name: src.display_name,
                        source_available: src.count,
                        target_shortage: targetShortage,
                        max_borrowable: maxBorrowable,
                        can_borrow: maxBorrowable > 0,
                        selected: false,
                        quantity: 0,
                    });
                }
                mergedRows.value = rows.sort(function (a, b) { return a.code.localeCompare(b.code); });
                return [3 /*break*/, 5];
            case 3:
                _f = _j.sent();
                mergedRows.value = [];
                return [3 /*break*/, 5];
            case 4:
                typesLoading.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
    var selectedItems, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isValid.value || !form.from_week_id)
                    return [2 /*return*/];
                selectedItems = mergedRows.value
                    .filter(function (r) { return r.selected && r.quantity > 0; })
                    .map(function (r) { return ({
                    thread_type_id: r.thread_type_id,
                    quantity_cones: r.quantity,
                }); });
                if (selectedItems.length === 0)
                    return [2 /*return*/];
                loading.value = true;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, weeklyOrderService_1.weeklyOrderService.createBatchLoan(props.toWeekId, {
                        from_week_id: form.from_week_id,
                        items: selectedItems,
                        reason: form.reason || undefined,
                    })];
            case 2:
                _a.sent();
                snackbar.success("M\u01B0\u1EE3n ".concat(selectedItems.length, " lo\u1EA1i ch\u1EC9 th\u00E0nh c\u00F4ng"));
                emit('created');
                resetForm();
                return [3 /*break*/, 5];
            case 3:
                err_1 = _a.sent();
                snackbar.error((err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || 'Không thể mượn chỉ');
                return [3 /*break*/, 5];
            case 4:
                loading.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
(0, vue_1.watch)(function () { return form.from_week_id; }, function (weekId) {
    mergedRows.value = [];
    if (weekId) {
        loadMergedData(weekId);
    }
});
(0, vue_1.watch)(function () { return props.modelValue; }, function (val) {
    if (val) {
        resetForm();
        loadWeeks();
    }
});
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = AppDialog_vue_1.default || AppDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), width: "700px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), width: "700px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
    (__VLS_ctx.toWeekName);
    // @ts-ignore
    [toWeekName,];
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['q-gutter-md']} */ ;
var __VLS_10 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
    modelValue: (__VLS_ctx.form.from_week_id),
    options: (__VLS_ctx.weekOptions),
    label: "Mượn từ tuần *",
    loading: (__VLS_ctx.weeksLoading),
    rules: ([function (val) { return !!val || 'Vui lòng chọn tuần cho mượn'; }]),
    emitValue: true,
    mapOptions: true,
}));
var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.from_week_id),
        options: (__VLS_ctx.weekOptions),
        label: "Mượn từ tuần *",
        loading: (__VLS_ctx.weeksLoading),
        rules: ([function (val) { return !!val || 'Vui lòng chọn tuần cho mượn'; }]),
        emitValue: true,
        mapOptions: true,
    }], __VLS_functionalComponentArgsRest(__VLS_11), false));
if (__VLS_ctx.form.from_week_id && !__VLS_ctx.typesLoading && __VLS_ctx.mergedRows.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_15 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qMarkupTable | typeof __VLS_components.QMarkupTable | typeof __VLS_components.qMarkupTable | typeof __VLS_components.QMarkupTable} */
    qMarkupTable;
    // @ts-ignore
    var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
        flat: true,
        bordered: true,
        dense: true,
        separator: "horizontal",
    }));
    var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
            dense: true,
            separator: "horizontal",
        }], __VLS_functionalComponentArgsRest(__VLS_16), false));
    var __VLS_20 = __VLS_18.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.thead, __VLS_intrinsics.thead)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.th)(__assign({ style: {} }));
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign({ class: "text-left" }));
    /** @type {__VLS_StyleScopedClasses['text-left']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign({ class: "text-right" }));
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign({ class: "text-right" }));
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.th, __VLS_intrinsics.th)(__assign({ class: "text-right" }, { style: {} }));
    /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.tbody, __VLS_intrinsics.tbody)({});
    var _loop_1 = function (row) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.tr, __VLS_intrinsics.tr)(__assign({ key: (row.thread_type_id) }, { class: ({ 'bg-grey-2': !row.can_borrow }) }));
        /** @type {__VLS_StyleScopedClasses['bg-grey-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        var __VLS_21 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qCheckbox | typeof __VLS_components.QCheckbox} */
        qCheckbox;
        // @ts-ignore
        var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (row.selected), disable: (!row.can_borrow), dense: true })));
        var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (row.selected), disable: (!row.can_borrow), dense: true })], __VLS_functionalComponentArgsRest(__VLS_22), false));
        var __VLS_26 = void 0;
        var __VLS_27 = ({ 'update:modelValue': {} },
            { 'onUpdate:modelValue': function () {
                    var _a = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _a[_i] = arguments[_i];
                    }
                    var $event = _a[0];
                    if (!(__VLS_ctx.form.from_week_id && !__VLS_ctx.typesLoading && __VLS_ctx.mergedRows.length > 0))
                        return;
                    __VLS_ctx.onCheckboxChange(row);
                    // @ts-ignore
                    [form, form, weekOptions, weeksLoading, typesLoading, mergedRows, mergedRows, onCheckboxChange,];
                } });
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)({});
        (row.display_name);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-right" }));
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        (row.source_available);
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-right" }));
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        var __VLS_28 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
        qBadge;
        // @ts-ignore
        var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
            color: (row.target_shortage > 0 ? 'orange' : 'grey'),
            label: (row.target_shortage),
        }));
        var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([{
                color: (row.target_shortage > 0 ? 'orange' : 'grey'),
                label: (row.target_shortage),
            }], __VLS_functionalComponentArgsRest(__VLS_29), false));
        __VLS_asFunctionalElement1(__VLS_intrinsics.td, __VLS_intrinsics.td)(__assign({ class: "text-right" }));
        /** @type {__VLS_StyleScopedClasses['text-right']} */ ;
        if (row.selected) {
            var __VLS_33 = AppInput_vue_1.default;
            // @ts-ignore
            var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ modelValue: (row.quantity), modelModifiers: { number: true, }, type: "number", dense: true, min: (1), max: (row.max_borrowable), rules: ([
                    function (v) { return v > 0 || 'Phải > 0'; },
                    function (v) { return v <= row.max_borrowable || "T\u1ED1i \u0111a ".concat(row.max_borrowable); },
                ]) }, { style: {} })));
            var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ modelValue: (row.quantity), modelModifiers: { number: true, }, type: "number", dense: true, min: (1), max: (row.max_borrowable), rules: ([
                        function (v) { return v > 0 || 'Phải > 0'; },
                        function (v) { return v <= row.max_borrowable || "T\u1ED1i \u0111a ".concat(row.max_borrowable); },
                    ]) }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_34), false));
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        }
        // @ts-ignore
        [];
    };
    var __VLS_24, __VLS_25;
    for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.mergedRows)); _i < _a.length; _i++) {
        var row = _a[_i][0];
        _loop_1(row);
    }
    // @ts-ignore
    [];
    var __VLS_18;
}
else if (__VLS_ctx.form.from_week_id && __VLS_ctx.typesLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-md" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    var __VLS_38 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
    qSpinner;
    // @ts-ignore
    var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38(__assign({ size: "24px" }, { class: "q-mr-sm" })));
    var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([__assign({ size: "24px" }, { class: "q-mr-sm" })], __VLS_functionalComponentArgsRest(__VLS_39), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
}
else if (__VLS_ctx.form.from_week_id && !__VLS_ctx.typesLoading && __VLS_ctx.mergedRows.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-md text-grey" }));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
}
var __VLS_43 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
    modelValue: (__VLS_ctx.form.reason),
    label: "Lý do",
    type: "textarea",
    autogrow: true,
}));
var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.reason),
        label: "Lý do",
        type: "textarea",
        autogrow: true,
    }], __VLS_functionalComponentArgsRest(__VLS_44), false));
{
    var __VLS_48 = __VLS_3.slots.actions;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between full-width" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    if (__VLS_ctx.selectedCount > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-grey-7" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
        (__VLS_ctx.selectedCount);
        (__VLS_ctx.totalCones);
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span)({});
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-gutter-x-sm" }));
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-sm']} */ ;
    var __VLS_49 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
        flat: true,
        label: "Hủy",
        disable: (__VLS_ctx.loading),
    }));
    var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([{
            flat: true,
            label: "Hủy",
            disable: (__VLS_ctx.loading),
        }], __VLS_functionalComponentArgsRest(__VLS_50), false));
    __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    var __VLS_54 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54(__assign({ 'onClick': {} }, { color: "primary", label: "Xác nhận mượn", loading: (__VLS_ctx.loading), disable: (!__VLS_ctx.isValid) })));
    var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Xác nhận mượn", loading: (__VLS_ctx.loading), disable: (!__VLS_ctx.isValid) })], __VLS_functionalComponentArgsRest(__VLS_55), false));
    var __VLS_59 = void 0;
    var __VLS_60 = ({ click: {} },
        { onClick: (__VLS_ctx.handleSubmit) });
    var __VLS_57;
    var __VLS_58;
    // @ts-ignore
    [form, form, form, typesLoading, typesLoading, mergedRows, selectedCount, selectedCount, totalCones, loading, loading, vClosePopup, isValid, handleSubmit,];
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
