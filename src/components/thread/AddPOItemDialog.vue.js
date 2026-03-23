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
var core_1 = require("@vueuse/core");
var FormDialog_vue_1 = require("@/components/ui/dialogs/FormDialog.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var useSnackbar_1 = require("@/composables/useSnackbar");
var purchaseOrderService_1 = require("@/services/purchaseOrderService");
var styleService_1 = require("@/services/styleService");
var props = withDefaults(defineProps(), {
    existingStyleIds: function () { return []; }
});
var emit = defineEmits();
var snackbar = (0, useSnackbar_1.useSnackbar)();
var loading = (0, vue_1.ref)(false);
var loadingStyles = (0, vue_1.ref)(false);
var styles = (0, vue_1.ref)([]);
var searchText = (0, vue_1.ref)('');
var form = (0, vue_1.ref)({
    style_id: null,
    quantity: 1
});
function resetForm() {
    form.value = {
        style_id: null,
        quantity: 1
    };
    searchText.value = '';
    styles.value = [];
}
var searchStyles = (0, core_1.useDebounceFn)(function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                loadingStyles.value = true;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, 4, 5]);
                _a = styles;
                return [4 /*yield*/, styleService_1.styleService.search({
                        search: query,
                        limit: 50,
                        excludeIds: props.existingStyleIds
                    })];
            case 2:
                _a.value = _b.sent();
                return [3 /*break*/, 5];
            case 3:
                err_1 = _b.sent();
                console.error('Error searching styles:', err_1);
                styles.value = [];
                return [3 /*break*/, 5];
            case 4:
                loadingStyles.value = false;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); }, 300);
function loadInitialStyles() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    loadingStyles.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 3, 4]);
                    _a = styles;
                    return [4 /*yield*/, styleService_1.styleService.search({
                            limit: 50,
                            excludeIds: props.existingStyleIds
                        })];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    loadingStyles.value = false;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.watch)(function () { return props.modelValue; }, function (newVal) {
    if (newVal) {
        resetForm();
        loadInitialStyles();
    }
});
function handleFilter(val, update) {
    update(function () {
        searchText.value = val;
        if (val.length >= 1) {
            searchStyles(val);
        }
        else if (val === '') {
            loadInitialStyles();
        }
    });
}
function onSubmit() {
    return __awaiter(this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!form.value.style_id) {
                        snackbar.error('Vui lòng chọn mã hàng');
                        return [2 /*return*/];
                    }
                    if (!form.value.quantity || form.value.quantity <= 0) {
                        snackbar.error('Số lượng phải lớn hơn 0');
                        return [2 /*return*/];
                    }
                    loading.value = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, purchaseOrderService_1.purchaseOrderService.addItem(props.poId, {
                            style_id: form.value.style_id,
                            quantity: form.value.quantity
                        })];
                case 2:
                    _a.sent();
                    snackbar.success('Thêm mã hàng thành công');
                    emit('saved');
                    emit('update:modelValue', false);
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    snackbar.error(err_2.message || 'Không thể thêm mã hàng');
                    return [3 /*break*/, 5];
                case 4:
                    loading.value = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function onCancel() {
    emit('update:modelValue', false);
}
var __VLS_defaults = {
    existingStyleIds: function () { return []; }
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0 = FormDialog_vue_1.default || FormDialog_vue_1.default;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: "Thêm mã hàng", loading: (__VLS_ctx.loading), maxWidth: "500px" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSubmit': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: "Thêm mã hàng", loading: (__VLS_ctx.loading), maxWidth: "500px" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
var __VLS_11;
/** @ts-ignore @type {typeof __VLS_components.qSelect | typeof __VLS_components.QSelect | typeof __VLS_components.qSelect | typeof __VLS_components.QSelect} */
qSelect;
// @ts-ignore
var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11(__assign({ 'onFilter': {} }, { modelValue: (__VLS_ctx.form.style_id), options: (__VLS_ctx.styles), optionValue: "id", optionLabel: (function (opt) { return "".concat(opt.style_code, " - ").concat(opt.style_name); }), label: "Mã hàng", outlined: true, useInput: true, emitValue: true, mapOptions: true, loading: (__VLS_ctx.loadingStyles) })));
var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([__assign({ 'onFilter': {} }, { modelValue: (__VLS_ctx.form.style_id), options: (__VLS_ctx.styles), optionValue: "id", optionLabel: (function (opt) { return "".concat(opt.style_code, " - ").concat(opt.style_name); }), label: "Mã hàng", outlined: true, useInput: true, emitValue: true, mapOptions: true, loading: (__VLS_ctx.loadingStyles) })], __VLS_functionalComponentArgsRest(__VLS_12), false));
var __VLS_16;
var __VLS_17 = ({ filter: {} },
    { onFilter: (__VLS_ctx.handleFilter) });
var __VLS_18 = __VLS_14.slots.default;
{
    var __VLS_19 = __VLS_14.slots.option;
    var _a = __VLS_vSlot(__VLS_19)[0], opt = _a.opt, itemProps = _a.itemProps;
    var __VLS_20 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20(__assign({}, (itemProps))));
    var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([__assign({}, (itemProps))], __VLS_functionalComponentArgsRest(__VLS_21), false));
    var __VLS_25 = __VLS_23.slots.default;
    var __VLS_26 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({}));
    var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_27), false));
    var __VLS_31 = __VLS_29.slots.default;
    var __VLS_32 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({}));
    var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_33), false));
    var __VLS_37 = __VLS_35.slots.default;
    (opt.style_code);
    // @ts-ignore
    [modelValue, loading, emit, onSubmit, onCancel, form, styles, loadingStyles, handleFilter,];
    var __VLS_35;
    var __VLS_38 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel | typeof __VLS_components.qItemLabel | typeof __VLS_components.QItemLabel} */
    qItemLabel;
    // @ts-ignore
    var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
        caption: true,
    }));
    var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{
            caption: true,
        }], __VLS_functionalComponentArgsRest(__VLS_39), false));
    var __VLS_43 = __VLS_41.slots.default;
    (opt.style_name);
    // @ts-ignore
    [];
    var __VLS_41;
    // @ts-ignore
    [];
    var __VLS_29;
    // @ts-ignore
    [];
    var __VLS_23;
    // @ts-ignore
    [];
}
{
    var __VLS_44 = __VLS_14.slots["no-option"];
    var __VLS_45 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItem | typeof __VLS_components.QItem | typeof __VLS_components.qItem | typeof __VLS_components.QItem} */
    qItem;
    // @ts-ignore
    var __VLS_46 = __VLS_asFunctionalComponent1(__VLS_45, new __VLS_45({}));
    var __VLS_47 = __VLS_46.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_46), false));
    var __VLS_50 = __VLS_48.slots.default;
    var __VLS_51 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection | typeof __VLS_components.qItemSection | typeof __VLS_components.QItemSection} */
    qItemSection;
    // @ts-ignore
    var __VLS_52 = __VLS_asFunctionalComponent1(__VLS_51, new __VLS_51(__assign({ class: "text-grey" })));
    var __VLS_53 = __VLS_52.apply(void 0, __spreadArray([__assign({ class: "text-grey" })], __VLS_functionalComponentArgsRest(__VLS_52), false));
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    var __VLS_56 = __VLS_54.slots.default;
    (__VLS_ctx.searchText ? 'Không tìm thấy mã hàng' : 'Nhập để tìm kiếm...');
    // @ts-ignore
    [searchText,];
    var __VLS_54;
    // @ts-ignore
    [];
    var __VLS_48;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_14;
var __VLS_15;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_57 = AppInput_vue_1.default;
// @ts-ignore
var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
    modelValue: (__VLS_ctx.form.quantity),
    modelModifiers: { number: true, },
    label: "Số lượng SP",
    type: "number",
    required: true,
    min: (1),
}));
var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.form.quantity),
        modelModifiers: { number: true, },
        label: "Số lượng SP",
        type: "number",
        required: true,
        min: (1),
    }], __VLS_functionalComponentArgsRest(__VLS_58), false));
// @ts-ignore
[form,];
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
