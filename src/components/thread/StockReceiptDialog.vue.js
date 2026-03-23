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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var composables_1 = require("@/composables");
var FormDialog_vue_1 = require("@/components/ui/dialogs/FormDialog.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var props = withDefaults(defineProps(), {
    loading: false
});
var emit = defineEmits();
// Composables for fetching dropdown data
var _b = (0, composables_1.useWarehouses)(), warehouseOptions = _b.warehouseOptions, fetchWarehouses = _b.fetchWarehouses;
var _c = (0, composables_1.useThreadTypes)(), activeThreadTypes = _c.activeThreadTypes, fetchThreadTypes = _c.fetchThreadTypes;
var initialForm = {
    thread_type_id: null,
    warehouse_id: 1, // Default to first warehouse
    quantity_cones: 1,
    weight_per_cone_grams: undefined,
    lot_number: '',
    expiry_date: '',
    location: ''
};
var form = (0, vue_1.ref)(__assign({}, initialForm));
var resetForm = function () {
    form.value = __assign({}, initialForm);
};
(0, vue_1.watch)(function () { return props.modelValue; }, function (isOpen) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isOpen) return [3 /*break*/, 2];
                resetForm();
                // Fetch both warehouses and thread types when dialog opens
                return [4 /*yield*/, Promise.all([
                        fetchWarehouses(),
                        fetchThreadTypes()
                    ])];
            case 1:
                // Fetch both warehouses and thread types when dialog opens
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
var onSubmit = function () {
    emit('submit', __assign({}, form.value));
};
var onCancel = function () {
    emit('cancel');
};
var __VLS_defaults = {
    loading: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = FormDialog_vue_1.default || FormDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: "Nhập kho chỉ", submitText: "Nhập kho", loading: (__VLS_ctx.loading), maxWidth: "700px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: "Nhập kho chỉ", submitText: "Nhập kho", loading: (__VLS_ctx.loading), maxWidth: "700px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_11 = AppSelect_vue_1.default || AppSelect_vue_1.default;
// @ts-ignore
var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
    modelValue: (__VLS_ctx.form.thread_type_id),
    label: "Loại chỉ",
    options: (__VLS_ctx.activeThreadTypes),
    optionValue: "id",
    optionLabel: "name",
    required: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
    emitValue: true,
    mapOptions: true,
    popupContentClass: "z-max",
}));
var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.thread_type_id),
        label: "Loại chỉ",
        options: (__VLS_ctx.activeThreadTypes),
        optionValue: "id",
        optionLabel: "name",
        required: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        emitValue: true,
        mapOptions: true,
        popupContentClass: "z-max",
    }], __VLS_functionalComponentArgsRest(__VLS_12), false));
var __VLS_16 = __VLS_14.slots.default;
{
    var __VLS_17 = __VLS_14.slots.option;
    var _d = __VLS_vSlot(__VLS_17)[0], opt = _d.opt, itemProps = _d.itemProps;
    var __VLS_18 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18(__assign({}, (itemProps))));
    var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([__assign({}, (itemProps))], __VLS_functionalComponentArgsRest(__VLS_19), false));
    var __VLS_23 = __VLS_21.slots.default;
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        avatar: true,
    }));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{
            avatar: true,
        }], __VLS_functionalComponentArgsRest(__VLS_25), false));
    var __VLS_29 = __VLS_27.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div)(__assign({ class: "color-dot" }, { style: ({
            backgroundColor: ((_a = opt.color_data) === null || _a === void 0 ? void 0 : _a.hex_code) || '#ccc',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '1px solid rgba(0,0,0,0.1)'
        }) }));
    /** @type {__VLS_StyleScopedClasses['color-dot']} */ ;
    // @ts-ignore
    [modelValue, loading, emit, onSubmit, onCancel, form, activeThreadTypes,];
    var __VLS_27;
    var __VLS_30 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({}));
    var __VLS_32 = __VLS_31.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_31), false));
    var __VLS_35 = __VLS_33.slots.default;
    var __VLS_36 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({}));
    var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_37), false));
    var __VLS_41 = __VLS_39.slots.default;
    (opt.code);
    (opt.name);
    // @ts-ignore
    [];
    var __VLS_39;
    var __VLS_42 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
        caption: true,
    }));
    var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_43), false));
    var __VLS_47 = __VLS_45.slots.default;
    (opt.material);
    // @ts-ignore
    [];
    var __VLS_45;
    // @ts-ignore
    [];
    var __VLS_33;
    // @ts-ignore
    [];
    var __VLS_21;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_14;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_48 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
    modelValue: (__VLS_ctx.form.warehouse_id),
    label: "Kho",
    options: (__VLS_ctx.warehouseOptions),
    required: true,
    useInput: true,
    fillInput: true,
    hideSelected: true,
    emitValue: true,
    mapOptions: true,
    popupContentClass: "z-max",
}));
var __VLS_50 = __VLS_49.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.warehouse_id),
        label: "Kho",
        options: (__VLS_ctx.warehouseOptions),
        required: true,
        useInput: true,
        fillInput: true,
        hideSelected: true,
        emitValue: true,
        mapOptions: true,
        popupContentClass: "z-max",
    }], __VLS_functionalComponentArgsRest(__VLS_49), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_53 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
    modelValue: (__VLS_ctx.form.location),
    label: "Vị trí kho",
    placeholder: "VD: Kệ A1-01",
}));
var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.location),
        label: "Vị trí kho",
        placeholder: "VD: Kệ A1-01",
    }], __VLS_functionalComponentArgsRest(__VLS_54), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_58 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
    modelValue: (__VLS_ctx.form.quantity_cones),
    modelModifiers: { number: true, },
    type: "number",
    label: "Số lượng cuộn",
    required: true,
    rules: ([
        function (val) { return !!val || 'Vui lòng nhập số lượng'; },
        function (val) { return val >= 1 || 'Số lượng tối thiểu là 1'; },
        function (val) { return val <= 1000 || 'Số lượng tối đa là 1000'; }
    ]),
}));
var __VLS_60 = __VLS_59.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.quantity_cones),
        modelModifiers: { number: true, },
        type: "number",
        label: "Số lượng cuộn",
        required: true,
        rules: ([
            function (val) { return !!val || 'Vui lòng nhập số lượng'; },
            function (val) { return val >= 1 || 'Số lượng tối thiểu là 1'; },
            function (val) { return val <= 1000 || 'Số lượng tối đa là 1000'; }
        ]),
    }], __VLS_functionalComponentArgsRest(__VLS_59), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_63 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
    modelValue: (__VLS_ctx.form.weight_per_cone_grams),
    modelModifiers: { number: true, },
    type: "number",
    label: "Trọng lượng/cuộn (g)",
    suffix: "g",
    placeholder: "Tùy chọn",
}));
var __VLS_65 = __VLS_64.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.weight_per_cone_grams),
        modelModifiers: { number: true, },
        type: "number",
        label: "Trọng lượng/cuộn (g)",
        suffix: "g",
        placeholder: "Tùy chọn",
    }], __VLS_functionalComponentArgsRest(__VLS_64), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_68 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
    modelValue: (__VLS_ctx.form.lot_number),
    label: "Số lô",
    placeholder: "VD: LOT123456",
}));
var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.lot_number),
        label: "Số lô",
        placeholder: "VD: LOT123456",
    }], __VLS_functionalComponentArgsRest(__VLS_69), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
var __VLS_73 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_74 = __VLS_asFunctionalComponent1(__VLS_73, new __VLS_73({
    modelValue: (__VLS_ctx.form.expiry_date),
    label: "Ngày hết hạn",
    placeholder: "DD/MM/YYYY",
    clearable: true,
}));
var __VLS_75 = __VLS_74.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.expiry_date),
        label: "Ngày hết hạn",
        placeholder: "DD/MM/YYYY",
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_74), false));
var __VLS_78 = __VLS_76.slots.default;
{
    var __VLS_79 = __VLS_76.slots.append;
    var __VLS_80 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_81), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_85 = __VLS_83.slots.default;
    var __VLS_86 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_87 = __VLS_asFunctionalComponent1(__VLS_86, new __VLS_86({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_88 = __VLS_87.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_87), false));
    var __VLS_91 = __VLS_89.slots.default;
    var __VLS_92 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
        modelValue: (__VLS_ctx.form.expiry_date),
    }));
    var __VLS_94 = __VLS_93.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.form.expiry_date),
        }], __VLS_functionalComponentArgsRest(__VLS_93), false));
    // @ts-ignore
    [form, form, form, form, form, form, form, warehouseOptions,];
    var __VLS_89;
    // @ts-ignore
    [];
    var __VLS_83;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_76;
// @ts-ignore
[];
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
