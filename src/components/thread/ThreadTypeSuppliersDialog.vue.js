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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var composables_1 = require("@/composables");
var SupplierSelector_vue_1 = require("@/components/ui/inputs/SupplierSelector.vue");
var props = defineProps();
var emit = defineEmits();
// Composables
var _f = (0, composables_1.useThreadTypeSuppliers)(), suppliers = _f.suppliers, loading = _f.loading, fetchSuppliers = _f.fetchSuppliers, linkSupplier = _f.linkSupplier, updateLink = _f.updateLink, deleteLink = _f.deleteLink, reset = _f.reset;
var confirm = (0, composables_1.useConfirm)().confirm;
// Form state for adding new supplier
var newLink = (0, vue_1.reactive)({
    supplier_id: null,
    supplier_item_code: '',
    unit_price: undefined,
});
// Table columns
var supplierColumns = [
    {
        name: 'supplier',
        label: 'Nhà cung cấp',
        field: function (row) { var _a; return (_a = row.supplier) === null || _a === void 0 ? void 0 : _a.name; },
        align: 'left',
        sortable: true,
    },
    {
        name: 'supplier_item_code',
        label: 'Mã hàng NCC',
        field: 'supplier_item_code',
        align: 'left',
    },
    {
        name: 'unit_price',
        label: 'Đơn giá',
        field: 'unit_price',
        align: 'right',
    },
    {
        name: 'is_active',
        label: 'Trạng thái',
        field: 'is_active',
        align: 'center',
    },
    {
        name: 'actions',
        label: '',
        field: 'actions',
        align: 'center',
        style: 'width: 60px',
    },
];
// Computed: Get existing supplier IDs to exclude from selector
var existingSupplierIds = (0, vue_1.computed)(function () {
    return suppliers.value.map(function (s) { return s.supplier_id; });
});
// Helpers
function getInitials(name) {
    if (!name)
        return '?';
    var words = name.trim().split(/\s+/);
    if (words.length >= 2 && words[0] && words[1]) {
        return ((words[0][0] || '') + (words[1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}
function formatCurrency(value) {
    return "\u20AB".concat(value.toLocaleString('vi-VN'));
}
function resetNewLinkForm() {
    newLink.supplier_id = null;
    newLink.supplier_item_code = '';
    newLink.unit_price = undefined;
}
// Watch for dialog open
(0, vue_1.watch)(function () { return props.modelValue; }, function (isOpen) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!(isOpen && ((_a = props.threadType) === null || _a === void 0 ? void 0 : _a.id))) return [3 /*break*/, 2];
                reset();
                return [4 /*yield*/, fetchSuppliers(props.threadType.id)];
            case 1:
                _b.sent();
                return [3 /*break*/, 3];
            case 2:
                if (!isOpen) {
                    resetNewLinkForm();
                }
                _b.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); });
// Handlers
function handleAddSupplier() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!((_a = props.threadType) === null || _a === void 0 ? void 0 : _a.id) || !newLink.supplier_id)
                        return [2 /*return*/];
                    return [4 /*yield*/, linkSupplier(props.threadType.id, {
                            supplier_id: newLink.supplier_id,
                            supplier_item_code: newLink.supplier_item_code || undefined,
                            unit_price: newLink.unit_price || undefined,
                        })];
                case 1:
                    result = _b.sent();
                    if (result) {
                        resetNewLinkForm();
                        emit('updated');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function handleInlineUpdate(id, field, value) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, updateLink(id, (_a = {}, _a[field] = value || undefined, _a))];
                case 1:
                    _b.sent();
                    emit('updated');
                    return [2 /*return*/];
            }
        });
    });
}
function handleDeleteSupplier(id, supplierName) {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed, success;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, confirm({
                        title: 'Xóa liên kết nhà cung cấp?',
                        message: "B\u1EA1n c\u00F3 ch\u1EAFc mu\u1ED1n x\u00F3a li\u00EAn k\u1EBFt v\u1EDBi nh\u00E0 cung c\u1EA5p \"".concat(supplierName, "\"?"),
                        ok: 'Xóa',
                        type: 'warning',
                    })];
                case 1:
                    confirmed = _a.sent();
                    if (!confirmed) return [3 /*break*/, 3];
                    return [4 /*yield*/, deleteLink(id)];
                case 2:
                    success = _a.sent();
                    if (success) {
                        emit('updated');
                    }
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), persistent: true })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), persistent: true })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('update:modelValue', $event);
            // @ts-ignore
            [modelValue, emit,];
        } });
var __VLS_7 = {};
var __VLS_8 = __VLS_3.slots.default;
var __VLS_9;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9(__assign({ style: {} })));
var __VLS_11 = __VLS_10.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_10), false));
var __VLS_14 = __VLS_12.slots.default;
var __VLS_15;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15(__assign({ class: "row items-center q-pb-none" })));
var __VLS_17 = __VLS_16.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_16), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_20 = __VLS_18.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-7" }));
/** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
((_a = __VLS_ctx.threadType) === null || _a === void 0 ? void 0 : _a.code);
((_b = __VLS_ctx.threadType) === null || _b === void 0 ? void 0 : _b.name);
var __VLS_21;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({}));
var __VLS_23 = __VLS_22.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_22), false));
var __VLS_26;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
    icon: "close",
    flat: true,
    round: true,
    dense: true,
}));
var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([{
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_27), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[threadType, threadType, vClosePopup,];
var __VLS_18;
var __VLS_31;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({}));
var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_32), false));
var __VLS_36 = __VLS_34.slots.default;
var __VLS_37;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37(__assign({ flat: true, bordered: true, dense: true, rows: (__VLS_ctx.suppliers), columns: (__VLS_ctx.supplierColumns), rowKey: "id", loading: (__VLS_ctx.loading), hidePagination: true, rowsPerPageOptions: ([0]) }, { class: "suppliers-table" })));
var __VLS_39 = __VLS_38.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true, dense: true, rows: (__VLS_ctx.suppliers), columns: (__VLS_ctx.supplierColumns), rowKey: "id", loading: (__VLS_ctx.loading), hidePagination: true, rowsPerPageOptions: ([0]) }, { class: "suppliers-table" })], __VLS_functionalComponentArgsRest(__VLS_38), false));
/** @type {__VLS_StyleScopedClasses['suppliers-table']} */ ;
var __VLS_42 = __VLS_40.slots.default;
{
    var __VLS_43 = __VLS_40.slots.loading;
    var __VLS_44 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
    qInnerLoading;
    // @ts-ignore
    var __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
        showing: true,
    }));
    var __VLS_46 = __VLS_45.apply(void 0, __spreadArray([{
            showing: true,
        }], __VLS_functionalComponentArgsRest(__VLS_45), false));
    var __VLS_49 = __VLS_47.slots.default;
    var __VLS_50 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50({
        size: "40px",
        color: "primary",
    }));
    var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([{
            size: "40px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_51), false));
    // @ts-ignore
    [suppliers, supplierColumns, loading,];
    var __VLS_47;
    // @ts-ignore
    [];
}
{
    var __VLS_55 = __VLS_40.slots["body-cell-supplier"];
    var props_1 = __VLS_vSlot(__VLS_55)[0];
    var __VLS_56 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        props: (props_1),
    }));
    var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([{
            props: (props_1),
        }], __VLS_functionalComponentArgsRest(__VLS_57), false));
    var __VLS_61 = __VLS_59.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    var __VLS_62 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar | typeof __VLS_components.qAvatar | typeof __VLS_components.QAvatar} */
    qAvatar;
    // @ts-ignore
    var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62(__assign({ size: "24px", color: "primary", textColor: "white" }, { class: "q-mr-xs text-caption text-weight-bold" })));
    var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([__assign({ size: "24px", color: "primary", textColor: "white" }, { class: "q-mr-xs text-caption text-weight-bold" })], __VLS_functionalComponentArgsRest(__VLS_63), false));
    /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
    var __VLS_67 = __VLS_65.slots.default;
    (__VLS_ctx.getInitials((_c = props_1.row.supplier) === null || _c === void 0 ? void 0 : _c.name));
    // @ts-ignore
    [getInitials,];
    var __VLS_65;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    ((_d = props_1.row.supplier) === null || _d === void 0 ? void 0 : _d.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    ((_e = props_1.row.supplier) === null || _e === void 0 ? void 0 : _e.code);
    // @ts-ignore
    [];
    var __VLS_59;
    // @ts-ignore
    [];
}
{
    var __VLS_68 = __VLS_40.slots["body-cell-supplier_item_code"];
    var props_2 = __VLS_vSlot(__VLS_68)[0];
    var __VLS_69 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
        props: (props_2),
    }));
    var __VLS_71 = __VLS_70.apply(void 0, __spreadArray([{
            props: (props_2),
        }], __VLS_functionalComponentArgsRest(__VLS_70), false));
    var __VLS_74 = __VLS_72.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center no-wrap cursor-pointer" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    (props_2.row.supplier_item_code || '-');
    var __VLS_75 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75(__assign({ flat: true, round: true, dense: true, color: "grey-6", icon: "edit", size: "xs" }, { class: "q-ml-xs opacity-50" })));
    var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([__assign({ flat: true, round: true, dense: true, color: "grey-6", icon: "edit", size: "xs" }, { class: "q-ml-xs opacity-50" })], __VLS_functionalComponentArgsRest(__VLS_76), false));
    /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
    var __VLS_80 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
    qPopupEdit;
    // @ts-ignore
    var __VLS_81 = __VLS_asFunctionalComponent1(__VLS_80, new __VLS_80(__assign({ 'onSave': {} }, { modelValue: (props_2.row.supplier_item_code), autoSave: true, buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
    var __VLS_82 = __VLS_81.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_2.row.supplier_item_code), autoSave: true, buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_81), false));
    var __VLS_85 = void 0;
    var __VLS_86 = ({ save: {} },
        { onSave: (function (val) { return __VLS_ctx.handleInlineUpdate(props_2.row.id, 'supplier_item_code', val); }) });
    var __VLS_87 = __VLS_83.slots.default;
    var __VLS_88 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
        modelValue: (props_2.row.supplier_item_code),
        dense: true,
        autofocus: true,
        label: "Mã hàng NCC",
        hint: "Mã sản phẩm của nhà cung cấp",
    }));
    var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([{
            modelValue: (props_2.row.supplier_item_code),
            dense: true,
            autofocus: true,
            label: "Mã hàng NCC",
            hint: "Mã sản phẩm của nhà cung cấp",
        }], __VLS_functionalComponentArgsRest(__VLS_89), false));
    // @ts-ignore
    [handleInlineUpdate,];
    var __VLS_83;
    var __VLS_84;
    // @ts-ignore
    [];
    var __VLS_72;
    // @ts-ignore
    [];
}
{
    var __VLS_93 = __VLS_40.slots["body-cell-unit_price"];
    var props_3 = __VLS_vSlot(__VLS_93)[0];
    var __VLS_94 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
        props: (props_3),
        align: "right",
    }));
    var __VLS_96 = __VLS_95.apply(void 0, __spreadArray([{
            props: (props_3),
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_95), false));
    var __VLS_99 = __VLS_97.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-end no-wrap cursor-pointer" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
    /** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "font-mono" }));
    /** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
    (props_3.row.unit_price ? __VLS_ctx.formatCurrency(props_3.row.unit_price) : '-');
    var __VLS_100 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_101 = __VLS_asFunctionalComponent1(__VLS_100, new __VLS_100(__assign({ flat: true, round: true, dense: true, color: "grey-6", icon: "edit", size: "xs" }, { class: "q-ml-xs opacity-50" })));
    var __VLS_102 = __VLS_101.apply(void 0, __spreadArray([__assign({ flat: true, round: true, dense: true, color: "grey-6", icon: "edit", size: "xs" }, { class: "q-ml-xs opacity-50" })], __VLS_functionalComponentArgsRest(__VLS_101), false));
    /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
    /** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
    var __VLS_105 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
    qPopupEdit;
    // @ts-ignore
    var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ 'onSave': {} }, { modelValue: (props_3.row.unit_price), modelModifiers: { number: true, }, autoSave: true, buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })));
    var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ 'onSave': {} }, { modelValue: (props_3.row.unit_price), modelModifiers: { number: true, }, autoSave: true, buttons: true, labelSet: "Lưu", labelCancel: "Hủy" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
    var __VLS_110 = void 0;
    var __VLS_111 = ({ save: {} },
        { onSave: (function (val) { return __VLS_ctx.handleInlineUpdate(props_3.row.id, 'unit_price', val); }) });
    var __VLS_112 = __VLS_108.slots.default;
    var __VLS_113 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
    qInput;
    // @ts-ignore
    var __VLS_114 = __VLS_asFunctionalComponent1(__VLS_113, new __VLS_113({
        modelValue: (props_3.row.unit_price),
        modelModifiers: { number: true, },
        type: "number",
        dense: true,
        autofocus: true,
        label: "Đơn giá",
        prefix: "₫",
    }));
    var __VLS_115 = __VLS_114.apply(void 0, __spreadArray([{
            modelValue: (props_3.row.unit_price),
            modelModifiers: { number: true, },
            type: "number",
            dense: true,
            autofocus: true,
            label: "Đơn giá",
            prefix: "₫",
        }], __VLS_functionalComponentArgsRest(__VLS_114), false));
    // @ts-ignore
    [handleInlineUpdate, formatCurrency,];
    var __VLS_108;
    var __VLS_109;
    // @ts-ignore
    [];
    var __VLS_97;
    // @ts-ignore
    [];
}
{
    var __VLS_118 = __VLS_40.slots["body-cell-is_active"];
    var props_4 = __VLS_vSlot(__VLS_118)[0];
    var __VLS_119 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_120 = __VLS_asFunctionalComponent1(__VLS_119, new __VLS_119({
        props: (props_4),
        align: "center",
    }));
    var __VLS_121 = __VLS_120.apply(void 0, __spreadArray([{
            props: (props_4),
            align: "center",
        }], __VLS_functionalComponentArgsRest(__VLS_120), false));
    var __VLS_124 = __VLS_122.slots.default;
    var __VLS_125 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125({
        color: (props_4.row.is_active ? 'positive' : 'negative'),
    }));
    var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([{
            color: (props_4.row.is_active ? 'positive' : 'negative'),
        }], __VLS_functionalComponentArgsRest(__VLS_126), false));
    var __VLS_130 = __VLS_128.slots.default;
    (props_4.row.is_active ? 'Hoạt động' : 'Ngừng');
    // @ts-ignore
    [];
    var __VLS_128;
    // @ts-ignore
    [];
    var __VLS_122;
    // @ts-ignore
    [];
}
{
    var __VLS_131 = __VLS_40.slots["body-cell-actions"];
    var props_5 = __VLS_vSlot(__VLS_131)[0];
    var __VLS_132 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132(__assign({ props: (props_5) }, { class: "q-gutter-x-xs" })));
    var __VLS_134 = __VLS_133.apply(void 0, __spreadArray([__assign({ props: (props_5) }, { class: "q-gutter-x-xs" })], __VLS_functionalComponentArgsRest(__VLS_133), false));
    /** @type {__VLS_StyleScopedClasses['q-gutter-x-xs']} */ ;
    var __VLS_137 = __VLS_135.slots.default;
    if (props_5.row.is_active) {
        var __VLS_138 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn | typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138(__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "delete", size: "sm" })));
        var __VLS_140 = __VLS_139.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { flat: true, round: true, color: "negative", icon: "delete", size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_139), false));
        var __VLS_143 = void 0;
        var __VLS_144 = ({ click: {} },
            { onClick: function () {
                    var _a;
                    var _b = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        _b[_i] = arguments[_i];
                    }
                    var $event = _b[0];
                    if (!(props_5.row.is_active))
                        return;
                    __VLS_ctx.handleDeleteSupplier(props_5.row.id, ((_a = props_5.row.supplier) === null || _a === void 0 ? void 0 : _a.name) || '');
                    // @ts-ignore
                    [handleDeleteSupplier,];
                } });
        var __VLS_145 = __VLS_141.slots.default;
        var __VLS_146 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
        qTooltip;
        // @ts-ignore
        var __VLS_147 = __VLS_asFunctionalComponent1(__VLS_146, new __VLS_146({}));
        var __VLS_148 = __VLS_147.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_147), false));
        var __VLS_151 = __VLS_149.slots.default;
        // @ts-ignore
        [];
        var __VLS_149;
        // @ts-ignore
        [];
        var __VLS_141;
        var __VLS_142;
    }
    // @ts-ignore
    [];
    var __VLS_135;
    // @ts-ignore
    [];
}
{
    var __VLS_152 = __VLS_40.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "full-width column items-center q-pa-lg text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['column']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    var __VLS_153 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_154 = __VLS_asFunctionalComponent1(__VLS_153, new __VLS_153(__assign({ name: "store", size: "48px" }, { class: "q-mb-sm" })));
    var __VLS_155 = __VLS_154.apply(void 0, __spreadArray([__assign({ name: "store", size: "48px" }, { class: "q-mb-sm" })], __VLS_functionalComponentArgsRest(__VLS_154), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_40;
// @ts-ignore
[];
var __VLS_34;
var __VLS_158;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158(__assign({ class: "q-pt-none" })));
var __VLS_160 = __VLS_159.apply(void 0, __spreadArray([__assign({ class: "q-pt-none" })], __VLS_functionalComponentArgsRest(__VLS_159), false));
/** @type {__VLS_StyleScopedClasses['q-pt-none']} */ ;
var __VLS_163 = __VLS_161.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle2 q-mb-sm text-grey-8" }));
/** @type {__VLS_StyleScopedClasses['text-subtitle2']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-grey-8']} */ ;
var __VLS_164;
/** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
qIcon;
// @ts-ignore
var __VLS_165 = __VLS_asFunctionalComponent1(__VLS_164, new __VLS_164(__assign({ name: "add_circle" }, { class: "q-mr-xs" })));
var __VLS_166 = __VLS_165.apply(void 0, __spreadArray([__assign({ name: "add_circle" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_165), false));
/** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-sm" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-sm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
var __VLS_169 = SupplierSelector_vue_1.default;
// @ts-ignore
var __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169({
    modelValue: (__VLS_ctx.newLink.supplier_id),
    label: "Nhà cung cấp",
    dense: true,
    activeOnly: (true),
    excludeIds: (__VLS_ctx.existingSupplierIds),
}));
var __VLS_171 = __VLS_170.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.newLink.supplier_id),
        label: "Nhà cung cấp",
        dense: true,
        activeOnly: (true),
        excludeIds: (__VLS_ctx.existingSupplierIds),
    }], __VLS_functionalComponentArgsRest(__VLS_170), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-sm-5" }));
/** @type {__VLS_StyleScopedClasses['col-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-5']} */ ;
var __VLS_174;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174({
    modelValue: (__VLS_ctx.newLink.supplier_item_code),
    label: "Mã hàng NCC",
    dense: true,
    outlined: true,
    placeholder: "VD: SP-001",
}));
var __VLS_176 = __VLS_175.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.newLink.supplier_item_code),
        label: "Mã hàng NCC",
        dense: true,
        outlined: true,
        placeholder: "VD: SP-001",
    }], __VLS_functionalComponentArgsRest(__VLS_175), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-sm-4" }));
/** @type {__VLS_StyleScopedClasses['col-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-4']} */ ;
var __VLS_179;
/** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
qInput;
// @ts-ignore
var __VLS_180 = __VLS_asFunctionalComponent1(__VLS_179, new __VLS_179({
    modelValue: (__VLS_ctx.newLink.unit_price),
    modelModifiers: { number: true, },
    label: "Đơn giá",
    type: "number",
    dense: true,
    outlined: true,
    prefix: "₫",
    min: (0),
}));
var __VLS_181 = __VLS_180.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.newLink.unit_price),
        modelModifiers: { number: true, },
        label: "Đơn giá",
        type: "number",
        dense: true,
        outlined: true,
        prefix: "₫",
        min: (0),
    }], __VLS_functionalComponentArgsRest(__VLS_180), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-3" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-3']} */ ;
var __VLS_184;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_185 = __VLS_asFunctionalComponent1(__VLS_184, new __VLS_184(__assign(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm", unelevated: true }), { class: "full-width" }), { loading: (__VLS_ctx.loading), disable: (!__VLS_ctx.newLink.supplier_id) })));
var __VLS_186 = __VLS_185.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { color: "primary", icon: "add", label: "Thêm", unelevated: true }), { class: "full-width" }), { loading: (__VLS_ctx.loading), disable: (!__VLS_ctx.newLink.supplier_id) })], __VLS_functionalComponentArgsRest(__VLS_185), false));
var __VLS_189;
var __VLS_190 = ({ click: {} },
    { onClick: (__VLS_ctx.handleAddSupplier) });
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
var __VLS_187;
var __VLS_188;
// @ts-ignore
[loading, newLink, newLink, newLink, newLink, existingSupplierIds, handleAddSupplier,];
var __VLS_161;
var __VLS_191;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_192 = __VLS_asFunctionalComponent1(__VLS_191, new __VLS_191(__assign({ align: "right" }, { class: "q-px-md q-pb-md" })));
var __VLS_193 = __VLS_192.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md" })], __VLS_functionalComponentArgsRest(__VLS_192), false));
/** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
var __VLS_196 = __VLS_194.slots.default;
var __VLS_197;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_198 = __VLS_asFunctionalComponent1(__VLS_197, new __VLS_197({
    flat: true,
    label: "Đóng",
    color: "grey",
}));
var __VLS_199 = __VLS_198.apply(void 0, __spreadArray([{
        flat: true,
        label: "Đóng",
        color: "grey",
    }], __VLS_functionalComponentArgsRest(__VLS_198), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[vClosePopup,];
var __VLS_194;
// @ts-ignore
[];
var __VLS_12;
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
