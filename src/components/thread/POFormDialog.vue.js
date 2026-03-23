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
var AppTextarea_vue_1 = require("@/components/ui/inputs/AppTextarea.vue");
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var useSnackbar_1 = require("@/composables/useSnackbar");
var purchaseOrderService_1 = require("@/services/purchaseOrderService");
var enums_1 = require("@/types/thread/enums");
var props = withDefaults(defineProps(), {
    purchaseOrder: null
});
var emit = defineEmits();
var snackbar = (0, useSnackbar_1.useSnackbar)();
var loading = (0, vue_1.ref)(false);
var isEdit = (0, vue_1.computed)(function () { return !!props.purchaseOrder; });
var title = (0, vue_1.computed)(function () { return isEdit.value ? 'Chỉnh sửa PO' : 'Tạo PO mới'; });
var form = (0, vue_1.ref)({
    po_number: '',
    customer_name: '',
    week: '',
    order_date: null,
    delivery_date: null,
    status: enums_1.POStatus.PENDING,
    priority: 'NORMAL',
    notes: ''
});
var statusOptions = [
    { label: 'Chờ xử lý', value: enums_1.POStatus.PENDING },
    { label: 'Đã xác nhận', value: enums_1.POStatus.CONFIRMED },
    { label: 'Đang sản xuất', value: enums_1.POStatus.IN_PRODUCTION },
    { label: 'Hoàn thành', value: enums_1.POStatus.COMPLETED },
    { label: 'Đã hủy', value: enums_1.POStatus.CANCELLED }
];
var priorityOptions = [
    { label: 'Thấp', value: 'LOW' },
    { label: 'Bình thường', value: 'NORMAL' },
    { label: 'Cao', value: 'HIGH' },
    { label: 'Khẩn cấp', value: 'URGENT' }
];
function resetForm() {
    if (props.purchaseOrder) {
        form.value = {
            po_number: props.purchaseOrder.po_number,
            customer_name: props.purchaseOrder.customer_name || '',
            week: props.purchaseOrder.week || '',
            order_date: props.purchaseOrder.order_date,
            delivery_date: props.purchaseOrder.delivery_date,
            status: props.purchaseOrder.status,
            priority: props.purchaseOrder.priority,
            notes: props.purchaseOrder.notes || ''
        };
    }
    else {
        form.value = {
            po_number: '',
            customer_name: '',
            week: '',
            order_date: null,
            delivery_date: null,
            status: enums_1.POStatus.PENDING,
            priority: 'NORMAL',
            notes: ''
        };
    }
}
(0, vue_1.watch)(function () { return props.modelValue; }, function (newVal) {
    if (newVal) {
        resetForm();
    }
});
(0, vue_1.watch)(function () { return props.purchaseOrder; }, function () {
    if (props.modelValue) {
        resetForm();
    }
}, { deep: true });
function onSubmit() {
    return __awaiter(this, void 0, void 0, function () {
        var updateData, createData, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!form.value.po_number.trim()) {
                        snackbar.error('Vui lòng nhập số PO');
                        return [2 /*return*/];
                    }
                    loading.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    if (!(isEdit.value && props.purchaseOrder)) return [3 /*break*/, 3];
                    updateData = {
                        po_number: form.value.po_number,
                        customer_name: form.value.customer_name || undefined,
                        week: form.value.week || undefined,
                        order_date: form.value.order_date || undefined,
                        delivery_date: form.value.delivery_date || undefined,
                        status: form.value.status,
                        priority: form.value.priority,
                        notes: form.value.notes || undefined
                    };
                    return [4 /*yield*/, purchaseOrderService_1.purchaseOrderService.update(props.purchaseOrder.id, updateData)];
                case 2:
                    _a.sent();
                    snackbar.success('Cập nhật PO thành công');
                    return [3 /*break*/, 5];
                case 3:
                    createData = {
                        po_number: form.value.po_number,
                        customer_name: form.value.customer_name || undefined,
                        week: form.value.week || undefined,
                        order_date: form.value.order_date || undefined,
                        delivery_date: form.value.delivery_date || undefined,
                        status: form.value.status,
                        priority: form.value.priority,
                        notes: form.value.notes || undefined
                    };
                    return [4 /*yield*/, purchaseOrderService_1.purchaseOrderService.create(createData)];
                case 4:
                    _a.sent();
                    snackbar.success('Tạo PO thành công');
                    _a.label = 5;
                case 5:
                    emit('saved');
                    emit('update:modelValue', false);
                    return [3 /*break*/, 8];
                case 6:
                    err_1 = _a.sent();
                    snackbar.error(err_1.message || 'Có lỗi xảy ra');
                    return [3 /*break*/, 8];
                case 7:
                    loading.value = false;
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function onCancel() {
    emit('update:modelValue', false);
}
var __VLS_defaults = {
    purchaseOrder: null
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
    modelValue: (__VLS_ctx.form.po_number),
    label: "Số PO",
    required: true,
    disable: (__VLS_ctx.isEdit),
}));
var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.po_number),
        label: "Số PO",
        required: true,
        disable: (__VLS_ctx.isEdit),
    }], __VLS_functionalComponentArgsRest(__VLS_12), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_16 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.form.customer_name),
    label: "Khách hàng",
}));
var __VLS_18 = __VLS_17.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.customer_name),
        label: "Khách hàng",
    }], __VLS_functionalComponentArgsRest(__VLS_17), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_21 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
    modelValue: (__VLS_ctx.form.week),
    label: "Week",
    placeholder: "Ví dụ: W12-2026",
}));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.week),
        label: "Week",
        placeholder: "Ví dụ: W12-2026",
    }], __VLS_functionalComponentArgsRest(__VLS_22), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_26 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
    modelValue: (__VLS_ctx.form.order_date),
    label: "Ngày đặt",
    placeholder: "DD/MM/YYYY",
    readonly: true,
}));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.order_date),
        label: "Ngày đặt",
        placeholder: "DD/MM/YYYY",
        readonly: true,
    }], __VLS_functionalComponentArgsRest(__VLS_27), false));
var __VLS_31 = __VLS_29.slots.default;
{
    var __VLS_32 = __VLS_29.slots.append;
    var __VLS_33 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_34 = __VLS_asFunctionalComponent1(__VLS_33, new __VLS_33(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_35 = __VLS_34.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_34), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_38 = __VLS_36.slots.default;
    var __VLS_39 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_41 = __VLS_40.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_40), false));
    var __VLS_44 = __VLS_42.slots.default;
    var __VLS_45 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({
        modelValue: (__VLS_ctx.form.order_date),
    }));
    var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.form.order_date),
        }], __VLS_functionalComponentArgsRest(__VLS_46), false));
    // @ts-ignore
    [modelValue, title, loading, emit, onSubmit, onCancel, form, form, form, form, form, isEdit,];
    var __VLS_42;
    // @ts-ignore
    [];
    var __VLS_36;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_29;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_50 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
    modelValue: (__VLS_ctx.form.delivery_date),
    label: "Ngày giao",
    placeholder: "DD/MM/YYYY",
    readonly: true,
}));
var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.delivery_date),
        label: "Ngày giao",
        placeholder: "DD/MM/YYYY",
        readonly: true,
    }], __VLS_functionalComponentArgsRest(__VLS_51), false));
var __VLS_55 = __VLS_53.slots.default;
{
    var __VLS_56 = __VLS_53.slots.append;
    var __VLS_57 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_58), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_62 = __VLS_60.slots.default;
    var __VLS_63 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_64), false));
    var __VLS_68 = __VLS_66.slots.default;
    var __VLS_69 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
        modelValue: (__VLS_ctx.form.delivery_date),
    }));
    var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.form.delivery_date),
        }], __VLS_functionalComponentArgsRest(__VLS_70), false));
    // @ts-ignore
    [form, form,];
    var __VLS_66;
    // @ts-ignore
    [];
    var __VLS_60;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_53;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_74 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
    modelValue: (__VLS_ctx.form.status),
    options: (__VLS_ctx.statusOptions),
    label: "Trạng thái",
    emitValue: true,
    mapOptions: true,
}));
var __VLS_76 = __VLS_75.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.status),
        options: (__VLS_ctx.statusOptions),
        label: "Trạng thái",
        emitValue: true,
        mapOptions: true,
    }], __VLS_functionalComponentArgsRest(__VLS_75), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_79 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
    modelValue: (__VLS_ctx.form.priority),
    options: (__VLS_ctx.priorityOptions),
    label: "Ưu tiên",
    emitValue: true,
    mapOptions: true,
}));
var __VLS_81 = __VLS_80.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.priority),
        options: (__VLS_ctx.priorityOptions),
        label: "Ưu tiên",
        emitValue: true,
        mapOptions: true,
    }], __VLS_functionalComponentArgsRest(__VLS_80), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_84 = AppTextarea_vue_1.default;
// @ts-ignore
var __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
    modelValue: (__VLS_ctx.form.notes),
    label: "Ghi chú",
    rows: "2",
}));
var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.notes),
        label: "Ghi chú",
        rows: "2",
    }], __VLS_functionalComponentArgsRest(__VLS_85), false));
// @ts-ignore
[form, form, form, statusOptions, priorityOptions,];
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
