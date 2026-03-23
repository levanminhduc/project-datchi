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
var purchaseOrderService_1 = require("@/services/purchaseOrderService");
var props = defineProps();
var emit = defineEmits();
var history = (0, vue_1.ref)([]);
var loading = (0, vue_1.ref)(false);
var dialogValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); }
});
var columns = [
    { name: 'created_at', label: 'Thời gian', field: 'created_at', align: 'left' },
    { name: 'employee_name', label: 'Người thay đổi', field: 'employee_name', align: 'left' },
    { name: 'change_type', label: 'Loại', field: 'change_type', align: 'center' },
    { name: 'previous_quantity', label: 'SL cũ', field: 'previous_quantity', align: 'center' },
    { name: 'new_quantity', label: 'SL mới', field: 'new_quantity', align: 'center' }
];
function getChangeTypeColor(type) {
    var colors = {
        CREATE: 'positive',
        UPDATE: 'info',
        DELETE: 'negative'
    };
    return colors[type] || 'grey';
}
function getChangeTypeLabel(type) {
    var labels = {
        CREATE: 'Tạo mới',
        UPDATE: 'Cập nhật',
        DELETE: 'Xóa'
    };
    return labels[type] || type;
}
function formatDateTime(date) {
    return new Date(date).toLocaleString('vi-VN');
}
function getEmployeeName(row) {
    if (row.employee_name)
        return row.employee_name;
    var emp = row.employee;
    return (emp === null || emp === void 0 ? void 0 : emp.full_name) || '-';
}
function loadHistory() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!props.item)
                        return [2 /*return*/];
                    loading.value = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 3, 4]);
                    _a = history;
                    return [4 /*yield*/, purchaseOrderService_1.purchaseOrderService.getItemHistory(props.poId, props.item.id)];
                case 2:
                    _a.value = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    loading.value = false;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
(0, vue_1.watch)(function () { return props.modelValue; }, function (newVal) {
    if (newVal && props.item) {
        loadHistory();
    }
});
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.dialogValue),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.dialogValue),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ style: {} })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ style: {} })], __VLS_functionalComponentArgsRest(__VLS_8), false));
var __VLS_12 = __VLS_10.slots.default;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13(__assign({ class: "row items-center q-pb-none" })));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_14), false));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
var __VLS_18 = __VLS_16.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
/** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
((_b = (_a = __VLS_ctx.item) === null || _a === void 0 ? void 0 : _a.style) === null || _b === void 0 ? void 0 : _b.style_code);
var __VLS_19;
/** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
qSpace;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({}));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_20), false));
var __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    icon: "close",
    flat: true,
    round: true,
    dense: true,
}));
var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{
        icon: "close",
        flat: true,
        round: true,
        dense: true,
    }], __VLS_functionalComponentArgsRest(__VLS_25), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[dialogValue, item, vClosePopup,];
var __VLS_16;
var __VLS_29;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({}));
var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_30), false));
var __VLS_34 = __VLS_32.slots.default;
var __VLS_35;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
    flat: true,
    bordered: true,
    rows: (__VLS_ctx.history),
    columns: (__VLS_ctx.columns),
    loading: (__VLS_ctx.loading),
    rowKey: "id",
    pagination: ({ rowsPerPage: 0 }),
    hidePagination: true,
}));
var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([{
        flat: true,
        bordered: true,
        rows: (__VLS_ctx.history),
        columns: (__VLS_ctx.columns),
        loading: (__VLS_ctx.loading),
        rowKey: "id",
        pagination: ({ rowsPerPage: 0 }),
        hidePagination: true,
    }], __VLS_functionalComponentArgsRest(__VLS_36), false));
var __VLS_40 = __VLS_38.slots.default;
{
    var __VLS_41 = __VLS_38.slots["body-cell-created_at"];
    var props_1 = __VLS_vSlot(__VLS_41)[0];
    var __VLS_42 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
        props: (props_1),
    }));
    var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([{
            props: (props_1),
        }], __VLS_functionalComponentArgsRest(__VLS_43), false));
    var __VLS_47 = __VLS_45.slots.default;
    (__VLS_ctx.formatDateTime(props_1.row.created_at));
    // @ts-ignore
    [history, columns, loading, formatDateTime,];
    var __VLS_45;
    // @ts-ignore
    [];
}
{
    var __VLS_48 = __VLS_38.slots["body-cell-employee_name"];
    var props_2 = __VLS_vSlot(__VLS_48)[0];
    var __VLS_49 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
        props: (props_2),
    }));
    var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([{
            props: (props_2),
        }], __VLS_functionalComponentArgsRest(__VLS_50), false));
    var __VLS_54 = __VLS_52.slots.default;
    (__VLS_ctx.getEmployeeName(props_2.row));
    // @ts-ignore
    [getEmployeeName,];
    var __VLS_52;
    // @ts-ignore
    [];
}
{
    var __VLS_55 = __VLS_38.slots["body-cell-change_type"];
    var props_3 = __VLS_vSlot(__VLS_55)[0];
    var __VLS_56 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        props: (props_3),
    }));
    var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([{
            props: (props_3),
        }], __VLS_functionalComponentArgsRest(__VLS_57), false));
    var __VLS_61 = __VLS_59.slots.default;
    var __VLS_62 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
        color: (__VLS_ctx.getChangeTypeColor(props_3.row.change_type)),
        label: (__VLS_ctx.getChangeTypeLabel(props_3.row.change_type)),
    }));
    var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getChangeTypeColor(props_3.row.change_type)),
            label: (__VLS_ctx.getChangeTypeLabel(props_3.row.change_type)),
        }], __VLS_functionalComponentArgsRest(__VLS_63), false));
    // @ts-ignore
    [getChangeTypeColor, getChangeTypeLabel,];
    var __VLS_59;
    // @ts-ignore
    [];
}
{
    var __VLS_67 = __VLS_38.slots["body-cell-previous_quantity"];
    var props_4 = __VLS_vSlot(__VLS_67)[0];
    var __VLS_68 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
        props: (props_4),
    }));
    var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([{
            props: (props_4),
        }], __VLS_functionalComponentArgsRest(__VLS_69), false));
    var __VLS_73 = __VLS_71.slots.default;
    ((_c = props_4.row.previous_quantity) !== null && _c !== void 0 ? _c : '-');
    // @ts-ignore
    [];
    var __VLS_71;
    // @ts-ignore
    [];
}
{
    var __VLS_74 = __VLS_38.slots["body-cell-new_quantity"];
    var props_5 = __VLS_vSlot(__VLS_74)[0];
    var __VLS_75 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
        props: (props_5),
    }));
    var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([{
            props: (props_5),
        }], __VLS_functionalComponentArgsRest(__VLS_76), false));
    var __VLS_80 = __VLS_78.slots.default;
    ((_d = props_5.row.new_quantity) !== null && _d !== void 0 ? _d : '-');
    // @ts-ignore
    [];
    var __VLS_78;
    // @ts-ignore
    [];
}
{
    var __VLS_81 = __VLS_38.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-grey-6 q-pa-md text-center" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_38;
// @ts-ignore
[];
var __VLS_32;
var __VLS_82;
/** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
qCardActions;
// @ts-ignore
var __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82(__assign({ align: "right" }, { class: "q-pa-md" })));
var __VLS_84 = __VLS_83.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-pa-md" })], __VLS_functionalComponentArgsRest(__VLS_83), false));
/** @type {__VLS_StyleScopedClasses['q-pa-md']} */ ;
var __VLS_87 = __VLS_85.slots.default;
var __VLS_88;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_89 = __VLS_asFunctionalComponent1(__VLS_88, new __VLS_88({
    flat: true,
    label: "Đóng",
    color: "grey",
}));
var __VLS_90 = __VLS_89.apply(void 0, __spreadArray([{
        flat: true,
        label: "Đóng",
        color: "grey",
    }], __VLS_functionalComponentArgsRest(__VLS_89), false));
__VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
// @ts-ignore
[vClosePopup,];
var __VLS_85;
// @ts-ignore
[];
var __VLS_10;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
