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
var FormDialog_vue_1 = require("@/components/ui/dialogs/FormDialog.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppWarehouseSelect_vue_1 = require("@/components/ui/inputs/AppWarehouseSelect.vue");
var AppTextarea_vue_1 = require("@/components/ui/inputs/AppTextarea.vue");
var SupplierSelector_vue_1 = require("@/components/ui/inputs/SupplierSelector.vue");
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var composables_1 = require("@/composables");
var useLots_1 = require("@/composables/useLots");
var props = withDefaults(defineProps(), {
    lot: null
});
var emit = defineEmits();
var _a = (0, composables_1.useThreadTypes)(), threadTypes = _a.threadTypes, fetchThreadTypes = _a.fetchThreadTypes;
var _b = (0, useLots_1.useLots)(), createLot = _b.createLot, updateLot = _b.updateLot, loading = _b.loading;
var isEdit = (0, vue_1.computed)(function () { return !!props.lot; });
var title = (0, vue_1.computed)(function () { return isEdit.value ? 'Chỉnh sửa lô' : 'Tạo lô mới'; });
var form = (0, vue_1.ref)({
    lot_number: '',
    thread_type_id: null,
    warehouse_id: null,
    production_date: null,
    expiry_date: null,
    supplier_id: null,
    notes: ''
});
// Thread type options for select
var threadTypeOptions = (0, vue_1.computed)(function () {
    return threadTypes.value.map(function (t) { return ({
        label: "".concat(t.name, " (").concat(t.code, ")"),
        value: t.id
    }); });
});
// Reset form when dialog opens
function resetForm() {
    if (props.lot) {
        form.value = {
            lot_number: props.lot.lot_number,
            thread_type_id: props.lot.thread_type_id,
            warehouse_id: props.lot.warehouse_id,
            production_date: props.lot.production_date,
            expiry_date: props.lot.expiry_date,
            supplier_id: props.lot.supplier_id,
            notes: props.lot.notes || ''
        };
    }
    else {
        form.value = {
            lot_number: '',
            thread_type_id: null,
            warehouse_id: null,
            production_date: null,
            expiry_date: null,
            supplier_id: null,
            notes: ''
        };
    }
}
(0, vue_1.watch)(function () { return props.modelValue; }, function (newVal) {
    if (newVal) {
        resetForm();
        if (threadTypes.value.length === 0) {
            fetchThreadTypes();
        }
    }
});
(0, vue_1.watch)(function () { return props.lot; }, function () {
    if (props.modelValue) {
        resetForm();
    }
}, { deep: true });
function onSubmit() {
    return __awaiter(this, void 0, void 0, function () {
        var updateData, result, createData, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(isEdit.value && props.lot)) return [3 /*break*/, 2];
                    updateData = {
                        production_date: form.value.production_date,
                        expiry_date: form.value.expiry_date,
                        supplier_id: form.value.supplier_id,
                        notes: form.value.notes || null
                    };
                    return [4 /*yield*/, updateLot(props.lot.id, updateData)];
                case 1:
                    result = _a.sent();
                    if (result) {
                        emit('saved');
                        emit('update:modelValue', false);
                    }
                    return [3 /*break*/, 4];
                case 2:
                    // Create new lot
                    if (!form.value.lot_number || !form.value.thread_type_id || !form.value.warehouse_id) {
                        return [2 /*return*/];
                    }
                    createData = {
                        lot_number: form.value.lot_number,
                        thread_type_id: form.value.thread_type_id,
                        warehouse_id: form.value.warehouse_id,
                        production_date: form.value.production_date || undefined,
                        expiry_date: form.value.expiry_date || undefined,
                        supplier_id: form.value.supplier_id || undefined,
                        notes: form.value.notes || undefined
                    };
                    return [4 /*yield*/, createLot(createData)];
                case 3:
                    result = _a.sent();
                    if (result) {
                        emit('saved');
                        emit('update:modelValue', false);
                    }
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function onCancel() {
    emit('update:modelValue', false);
}
var __VLS_defaults = {
    lot: null
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = FormDialog_vue_1.default || FormDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: (__VLS_ctx.title), loading: (__VLS_ctx.loading), maxWidth: "600px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: (__VLS_ctx.title), loading: (__VLS_ctx.loading), maxWidth: "600px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
    modelValue: (__VLS_ctx.form.lot_number),
    label: "Mã lô",
    required: true,
    disable: (__VLS_ctx.isEdit),
    hint: "Mã định danh duy nhất cho lô",
}));
var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.lot_number),
        label: "Mã lô",
        required: true,
        disable: (__VLS_ctx.isEdit),
        hint: "Mã định danh duy nhất cho lô",
    }], __VLS_functionalComponentArgsRest(__VLS_12), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_16 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.form.thread_type_id),
    options: (__VLS_ctx.threadTypeOptions),
    label: "Loại chỉ",
    required: true,
    disable: (__VLS_ctx.isEdit),
    useInput: true,
    fillInput: true,
    hideSelected: true,
    popupContentClass: "z-max",
    emitValue: true,
    mapOptions: true,
}));
var __VLS_18 = __VLS_17.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.thread_type_id),
        options: (__VLS_ctx.threadTypeOptions),
        label: "Loại chỉ",
        required: true,
        disable: (__VLS_ctx.isEdit),
        useInput: true,
        fillInput: true,
        hideSelected: true,
        popupContentClass: "z-max",
        emitValue: true,
        mapOptions: true,
    }], __VLS_functionalComponentArgsRest(__VLS_17), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_21 = AppWarehouseSelect_vue_1.default;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
    modelValue: (__VLS_ctx.form.warehouse_id),
    label: "Kho",
    required: true,
    disable: (__VLS_ctx.isEdit),
}));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.warehouse_id),
        label: "Kho",
        required: true,
        disable: (__VLS_ctx.isEdit),
    }], __VLS_functionalComponentArgsRest(__VLS_22), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_26 = SupplierSelector_vue_1.default;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
    modelValue: (__VLS_ctx.form.supplier_id),
    label: "Nhà cung cấp",
    clearable: true,
}));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.supplier_id),
        label: "Nhà cung cấp",
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_27), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_31 = DatePicker_vue_1.default;
// @ts-ignore
var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
    modelValue: (__VLS_ctx.form.production_date),
    label: "Ngày sản xuất",
}));
var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.production_date),
        label: "Ngày sản xuất",
    }], __VLS_functionalComponentArgsRest(__VLS_32), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_36 = DatePicker_vue_1.default;
// @ts-ignore
var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
    modelValue: (__VLS_ctx.form.expiry_date),
    label: "Ngày hết hạn",
}));
var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.expiry_date),
        label: "Ngày hết hạn",
    }], __VLS_functionalComponentArgsRest(__VLS_37), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_41 = AppTextarea_vue_1.default;
// @ts-ignore
var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
    modelValue: (__VLS_ctx.form.notes),
    label: "Ghi chú",
    rows: "2",
}));
var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.notes),
        label: "Ghi chú",
        rows: "2",
    }], __VLS_functionalComponentArgsRest(__VLS_42), false));
// @ts-ignore
[modelValue, title, loading, emit, onSubmit, onCancel, form, form, form, form, form, form, form, isEdit, isEdit, isEdit, threadTypeOptions,];
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
