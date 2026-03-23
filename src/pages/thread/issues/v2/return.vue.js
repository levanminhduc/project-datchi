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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var quasar_1 = require("quasar");
var useReturnV2_1 = require("@/composables/thread/useReturnV2");
var composables_1 = require("@/composables");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var snackbar = (0, composables_1.useSnackbar)();
var _c = (0, useReturnV2_1.useReturnV2)(), confirmedIssues = _c.confirmedIssues, selectedIssue = _c.selectedIssue, returnLogs = _c.returnLogs, isLoading = _c.isLoading, loadConfirmedIssues = _c.loadConfirmedIssues, loadIssueDetails = _c.loadIssueDetails, loadReturnLogs = _c.loadReturnLogs, submitReturn = _c.submitReturn, clearSelectedIssue = _c.clearSelectedIssue, validateReturnQuantities = _c.validateReturnQuantities;
var selectedIssueId = (0, vue_1.ref)(null);
var returnInputs = (0, vue_1.ref)(new Map());
var validationErrors = (0, vue_1.ref)([]);
var issueOptions = (0, vue_1.computed)(function () {
    return confirmedIssues.value.map(function (issue) { return ({
        value: issue.id,
        label: "".concat(issue.issue_code, " - ").concat(issue.department, " (").concat(formatDate(issue.created_at), ")"),
    }); });
});
var hasReturnInputs = (0, vue_1.computed)(function () {
    for (var _i = 0, _a = returnInputs.value; _i < _a.length; _i++) {
        var _b = _a[_i], value = _b[1];
        if (value.full > 0 || value.partial > 0) {
            return true;
        }
    }
    return false;
});
(0, vue_1.watch)(selectedIssueId, function (newId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!newId) return [3 /*break*/, 3];
                return [4 /*yield*/, loadIssueDetails(newId)];
            case 1:
                _a.sent();
                return [4 /*yield*/, loadReturnLogs(newId)];
            case 2:
                _a.sent();
                returnInputs.value = new Map();
                validationErrors.value = [];
                return [3 /*break*/, 4];
            case 3:
                clearSelectedIssue();
                returnInputs.value = new Map();
                validationErrors.value = [];
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
(0, vue_1.onMounted)(function () {
    loadConfirmedIssues();
});
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('vi-VN');
}
function getReturnInput(lineId) {
    if (!returnInputs.value.has(lineId)) {
        returnInputs.value.set(lineId, { full: 0, partial: 0 });
    }
    return returnInputs.value.get(lineId);
}
function updateReturnFull(lineId, value, line) {
    var input = getReturnInput(lineId);
    var totalRemaining = getTotalRemaining(line);
    var perTypeMax = line.issued_full - line.returned_full;
    var numValue = Math.max(0, Math.min(Number(value) || 0, perTypeMax, totalRemaining - input.partial));
    input.full = numValue;
    var newMaxPartial = totalRemaining - numValue;
    if (input.partial > newMaxPartial) {
        input.partial = Math.max(0, newMaxPartial);
    }
    returnInputs.value.set(lineId, input);
    validateInputs();
}
function updateReturnPartial(lineId, value, line) {
    var input = getReturnInput(lineId);
    var totalRemaining = getTotalRemaining(line);
    var numValue = Math.max(0, Math.min(Number(value) || 0, totalRemaining - input.full));
    input.partial = numValue;
    var perTypeMax = line.issued_full - line.returned_full;
    var newMaxFull = Math.min(perTypeMax, totalRemaining - numValue);
    if (input.full > newMaxFull) {
        input.full = Math.max(0, newMaxFull);
    }
    returnInputs.value.set(lineId, input);
    validateInputs();
}
function validateInputs() {
    if (!selectedIssue.value)
        return;
    var lines = [];
    for (var _i = 0, _a = returnInputs.value; _i < _a.length; _i++) {
        var _b = _a[_i], lineId = _b[0], input = _b[1];
        lines.push({
            line_id: lineId,
            returned_full: input.full,
            returned_partial: input.partial,
        });
    }
    var result = validateReturnQuantities(lines, selectedIssue.value.lines);
    validationErrors.value = result.errors;
}
function getTotalRemaining(line) {
    var totalIssued = line.issued_full + line.issued_partial;
    var totalReturned = line.returned_full + line.returned_partial;
    return totalIssued - totalReturned;
}
function getMaxReturnFull(line) {
    var perTypeMax = line.issued_full - line.returned_full;
    var totalRemaining = getTotalRemaining(line);
    var currentPartialInput = getReturnInput(line.id).partial;
    return Math.max(0, Math.min(perTypeMax, totalRemaining - currentPartialInput));
}
function getMaxReturnPartial(line) {
    var totalRemaining = getTotalRemaining(line);
    var currentFullInput = getReturnInput(line.id).full;
    return Math.max(0, totalRemaining - currentFullInput);
}
function hasOutstandingItems(line) {
    // Total-based: has outstanding if total remaining > 0
    return getTotalRemaining(line) > 0;
}
function handleSubmit() {
    return __awaiter(this, void 0, void 0, function () {
        var lines, _i, _a, _b, lineId, input, success;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!selectedIssue.value || !selectedIssueId.value)
                        return [2 /*return*/];
                    if (validationErrors.value.length > 0) {
                        snackbar.error('Vui lòng sửa các lỗi trước khi xác nhận');
                        return [2 /*return*/];
                    }
                    lines = [];
                    for (_i = 0, _a = returnInputs.value; _i < _a.length; _i++) {
                        _b = _a[_i], lineId = _b[0], input = _b[1];
                        if (input.full > 0 || input.partial > 0) {
                            lines.push({
                                line_id: lineId,
                                returned_full: input.full,
                                returned_partial: input.partial,
                            });
                        }
                    }
                    return [4 /*yield*/, submitReturn(selectedIssueId.value, lines)];
                case 1:
                    success = _c.sent();
                    if (!success) return [3 /*break*/, 5];
                    returnInputs.value = new Map();
                    validationErrors.value = [];
                    return [4 /*yield*/, loadIssueDetails(selectedIssueId.value)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, loadReturnLogs(selectedIssueId.value)];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, loadConfirmedIssues()];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function handleReset() {
    returnInputs.value = new Map();
    validationErrors.value = [];
}
var __VLS_ctx = __assign(__assign({}, {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPage | typeof __VLS_components.QPage | typeof __VLS_components.qPage | typeof __VLS_components.QPage} */
qPage;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    padding: true,
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        padding: true,
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_6 = __VLS_3.slots.default;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h5, __VLS_intrinsics.h5)(__assign({ class: "q-ma-none" }));
/** @type {__VLS_StyleScopedClasses['q-ma-none']} */ ;
var __VLS_7;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7(__assign({ flat: true, bordered: true }, { class: "q-mb-md" })));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_8), false));
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
var __VLS_12 = __VLS_10.slots.default;
var __VLS_13;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_14 = __VLS_asFunctionalComponent1(__VLS_13, new __VLS_13({}));
var __VLS_15 = __VLS_14.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_14), false));
var __VLS_18 = __VLS_16.slots.default;
var __VLS_19 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19(__assign({ modelValue: (__VLS_ctx.selectedIssueId), options: (__VLS_ctx.issueOptions), label: "Chọn phiếu xuất", loading: (__VLS_ctx.isLoading), clearable: true, useInput: true, fillInput: true, hideSelected: true }, { style: {} })));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([__assign({ modelValue: (__VLS_ctx.selectedIssueId), options: (__VLS_ctx.issueOptions), label: "Chọn phiếu xuất", loading: (__VLS_ctx.isLoading), clearable: true, useInput: true, fillInput: true, hideSelected: true }, { style: {} })], __VLS_functionalComponentArgsRest(__VLS_20), false));
// @ts-ignore
[selectedIssueId, issueOptions, isLoading,];
var __VLS_16;
// @ts-ignore
[];
var __VLS_10;
if (__VLS_ctx.selectedIssue) {
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
        flat: true,
        bordered: true,
    }));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_25), false));
    var __VLS_29 = __VLS_27.slots.default;
    var __VLS_30 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_31 = __VLS_asFunctionalComponent1(__VLS_30, new __VLS_30({}));
    var __VLS_32 = __VLS_31.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_31), false));
    var __VLS_35 = __VLS_33.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
    (__VLS_ctx.selectedIssue.issue_code);
    var __VLS_36 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36(__assign({ color: (__VLS_ctx.selectedIssue.status === 'CONFIRMED' ? 'positive' : 'grey') }, { class: "q-ml-sm" })));
    var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([__assign({ color: (__VLS_ctx.selectedIssue.status === 'CONFIRMED' ? 'positive' : 'grey') }, { class: "q-ml-sm" })], __VLS_functionalComponentArgsRest(__VLS_37), false));
    /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
    var __VLS_41 = __VLS_39.slots.default;
    (__VLS_ctx.selectedIssue.status);
    // @ts-ignore
    [selectedIssue, selectedIssue, selectedIssue, selectedIssue,];
    var __VLS_39;
    if (__VLS_ctx.validationErrors.length > 0) {
        var __VLS_42 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBanner | typeof __VLS_components.QBanner | typeof __VLS_components.qBanner | typeof __VLS_components.QBanner} */
        qBanner;
        // @ts-ignore
        var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42(__assign({ class: "bg-negative text-white q-mb-md" })));
        var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([__assign({ class: "bg-negative text-white q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_43), false));
        /** @type {__VLS_StyleScopedClasses['bg-negative']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-white']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
        var __VLS_47 = __VLS_45.slots.default;
        {
            var __VLS_48 = __VLS_45.slots.avatar;
            var __VLS_49 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
                name: "error",
            }));
            var __VLS_51 = __VLS_50.apply(void 0, __spreadArray([{
                    name: "error",
                }], __VLS_functionalComponentArgsRest(__VLS_50), false));
            // @ts-ignore
            [validationErrors,];
        }
        for (var _i = 0, _d = __VLS_vFor((__VLS_ctx.validationErrors)); _i < _d.length; _i++) {
            var _e = _d[_i], err = _e[0], idx = _e[1];
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (idx),
            });
            (err);
            // @ts-ignore
            [validationErrors,];
        }
        // @ts-ignore
        [];
        var __VLS_45;
    }
    var __VLS_54 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
        rows: (((_a = __VLS_ctx.selectedIssue) === null || _a === void 0 ? void 0 : _a.lines) || []),
        columns: ([
            { name: 'thread', label: 'Loại chỉ', field: 'thread_name', align: 'left' },
            { name: 'issued', label: 'Đã xuất', field: 'issued', align: 'center' },
            { name: 'returned', label: 'Đã trả', field: 'returned', align: 'center' },
            { name: 'outstanding', label: 'Còn lại', field: 'outstanding', align: 'center' },
            { name: 'return_input', label: 'Trả thêm', field: 'return_input', align: 'center' },
        ]),
        rowKey: "id",
        flat: true,
        bordered: true,
        pagination: ({ rowsPerPage: 0 }),
        hideBottom: true,
    }));
    var __VLS_56 = __VLS_55.apply(void 0, __spreadArray([{
            rows: (((_b = __VLS_ctx.selectedIssue) === null || _b === void 0 ? void 0 : _b.lines) || []),
            columns: ([
                { name: 'thread', label: 'Loại chỉ', field: 'thread_name', align: 'left' },
                { name: 'issued', label: 'Đã xuất', field: 'issued', align: 'center' },
                { name: 'returned', label: 'Đã trả', field: 'returned', align: 'center' },
                { name: 'outstanding', label: 'Còn lại', field: 'outstanding', align: 'center' },
                { name: 'return_input', label: 'Trả thêm', field: 'return_input', align: 'center' },
            ]),
            rowKey: "id",
            flat: true,
            bordered: true,
            pagination: ({ rowsPerPage: 0 }),
            hideBottom: true,
        }], __VLS_functionalComponentArgsRest(__VLS_55), false));
    var __VLS_59 = __VLS_57.slots.default;
    {
        var __VLS_60 = __VLS_57.slots["body-cell-thread"];
        var props = __VLS_vSlot(__VLS_60)[0];
        var __VLS_61 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_62 = __VLS_asFunctionalComponent1(__VLS_61, new __VLS_61({
            props: (props),
        }));
        var __VLS_63 = __VLS_62.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_62), false));
        var __VLS_66 = __VLS_64.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.strong, __VLS_intrinsics.strong)({});
        (props.row.thread_code);
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        (props.row.thread_name);
        if (props.row.po_number) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            (props.row.po_number);
            (props.row.style_code);
            (props.row.color_name);
        }
        // @ts-ignore
        [selectedIssue,];
        var __VLS_64;
        // @ts-ignore
        [];
    }
    {
        var __VLS_67 = __VLS_57.slots["body-cell-issued"];
        var props = __VLS_vSlot(__VLS_67)[0];
        var __VLS_68 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_69 = __VLS_asFunctionalComponent1(__VLS_68, new __VLS_68({
            props: (props),
        }));
        var __VLS_70 = __VLS_69.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_69), false));
        var __VLS_73 = __VLS_71.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (props.row.issued_full);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-mx-xs" }));
        /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (props.row.issued_partial);
        // @ts-ignore
        [];
        var __VLS_71;
        // @ts-ignore
        [];
    }
    {
        var __VLS_74 = __VLS_57.slots["body-cell-returned"];
        var props = __VLS_vSlot(__VLS_74)[0];
        var __VLS_75 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
            props: (props),
        }));
        var __VLS_77 = __VLS_76.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_76), false));
        var __VLS_80 = __VLS_78.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (props.row.returned_full);
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-mx-xs" }));
        /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (props.row.returned_partial);
        // @ts-ignore
        [];
        var __VLS_78;
        // @ts-ignore
        [];
    }
    {
        var __VLS_81 = __VLS_57.slots["body-cell-outstanding"];
        var props = __VLS_vSlot(__VLS_81)[0];
        var __VLS_82 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_83 = __VLS_asFunctionalComponent1(__VLS_82, new __VLS_82({
            props: (props),
        }));
        var __VLS_84 = __VLS_83.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_83), false));
        var __VLS_87 = __VLS_85.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: ({ 'text-positive': !__VLS_ctx.hasOutstandingItems(props.row) }) }));
        /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (__VLS_ctx.getMaxReturnFull(props.row));
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-mx-xs" }));
        /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (__VLS_ctx.getMaxReturnPartial(props.row));
        // @ts-ignore
        [hasOutstandingItems, getMaxReturnFull, getMaxReturnPartial,];
        var __VLS_85;
        // @ts-ignore
        [];
    }
    {
        var __VLS_88 = __VLS_57.slots["body-cell-return_input"];
        var props_1 = __VLS_vSlot(__VLS_88)[0];
        var __VLS_89 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
            props: (props_1),
        }));
        var __VLS_91 = __VLS_90.apply(void 0, __spreadArray([{
                props: (props_1),
            }], __VLS_functionalComponentArgsRest(__VLS_90), false));
        var __VLS_94 = __VLS_92.slots.default;
        if (__VLS_ctx.hasOutstandingItems(props_1.row)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm" }));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ style: {} }));
            var __VLS_95 = AppInput_vue_1.default;
            // @ts-ignore
            var __VLS_96 = __VLS_asFunctionalComponent1(__VLS_95, new __VLS_95(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.getReturnInput(props_1.row.id).full), type: "number", dense: true, min: (0), max: (__VLS_ctx.getMaxReturnFull(props_1.row)), disable: (__VLS_ctx.getMaxReturnFull(props_1.row) === 0) })));
            var __VLS_97 = __VLS_96.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.getReturnInput(props_1.row.id).full), type: "number", dense: true, min: (0), max: (__VLS_ctx.getMaxReturnFull(props_1.row)), disable: (__VLS_ctx.getMaxReturnFull(props_1.row) === 0) })], __VLS_functionalComponentArgsRest(__VLS_96), false));
            var __VLS_100 = void 0;
            var __VLS_101 = ({ 'update:modelValue': {} },
                { 'onUpdate:modelValue': function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(__VLS_ctx.selectedIssue))
                            return;
                        if (!(__VLS_ctx.hasOutstandingItems(props_1.row)))
                            return;
                        __VLS_ctx.updateReturnFull(props_1.row.id, $event, props_1.row);
                        // @ts-ignore
                        [hasOutstandingItems, getMaxReturnFull, getMaxReturnFull, getReturnInput, updateReturnFull,];
                    } });
            var __VLS_98;
            var __VLS_99;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "q-mx-xs" }));
            /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ style: {} }));
            var __VLS_102 = AppInput_vue_1.default;
            // @ts-ignore
            var __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.getReturnInput(props_1.row.id).partial), type: "number", dense: true, min: (0), max: (__VLS_ctx.getMaxReturnPartial(props_1.row)), disable: (__VLS_ctx.getMaxReturnPartial(props_1.row) === 0) })));
            var __VLS_104 = __VLS_103.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.getReturnInput(props_1.row.id).partial), type: "number", dense: true, min: (0), max: (__VLS_ctx.getMaxReturnPartial(props_1.row)), disable: (__VLS_ctx.getMaxReturnPartial(props_1.row) === 0) })], __VLS_functionalComponentArgsRest(__VLS_103), false));
            var __VLS_107 = void 0;
            var __VLS_108 = ({ 'update:modelValue': {} },
                { 'onUpdate:modelValue': function () {
                        var _a = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            _a[_i] = arguments[_i];
                        }
                        var $event = _a[0];
                        if (!(__VLS_ctx.selectedIssue))
                            return;
                        if (!(__VLS_ctx.hasOutstandingItems(props_1.row)))
                            return;
                        __VLS_ctx.updateReturnPartial(props_1.row.id, $event, props_1.row);
                        // @ts-ignore
                        [getMaxReturnPartial, getMaxReturnPartial, getReturnInput, updateReturnPartial,];
                    } });
            var __VLS_105;
            var __VLS_106;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-positive" }));
            /** @type {__VLS_StyleScopedClasses['text-positive']} */ ;
            var __VLS_109 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109({
                name: "check_circle",
            }));
            var __VLS_111 = __VLS_110.apply(void 0, __spreadArray([{
                    name: "check_circle",
                }], __VLS_functionalComponentArgsRest(__VLS_110), false));
        }
        // @ts-ignore
        [];
        var __VLS_92;
        // @ts-ignore
        [];
    }
    {
        var __VLS_114 = __VLS_57.slots["no-data"];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-lg text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_57;
    // @ts-ignore
    [];
    var __VLS_33;
    var __VLS_115 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_116 = __VLS_asFunctionalComponent1(__VLS_115, new __VLS_115({
        align: "right",
    }));
    var __VLS_117 = __VLS_116.apply(void 0, __spreadArray([{
            align: "right",
        }], __VLS_functionalComponentArgsRest(__VLS_116), false));
    var __VLS_120 = __VLS_118.slots.default;
    var __VLS_121 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_122 = __VLS_asFunctionalComponent1(__VLS_121, new __VLS_121(__assign({ 'onClick': {} }, { label: "Đặt lại", variant: "flat", color: "grey", disable: (!__VLS_ctx.hasReturnInputs) })));
    var __VLS_123 = __VLS_122.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Đặt lại", variant: "flat", color: "grey", disable: (!__VLS_ctx.hasReturnInputs) })], __VLS_functionalComponentArgsRest(__VLS_122), false));
    var __VLS_126 = void 0;
    var __VLS_127 = ({ click: {} },
        { onClick: (__VLS_ctx.handleReset) });
    var __VLS_124;
    var __VLS_125;
    var __VLS_128 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128(__assign({ 'onClick': {} }, { label: "Xác nhận nhập lại", icon: "assignment_return", color: "primary", loading: (__VLS_ctx.isLoading), disable: (!__VLS_ctx.hasReturnInputs || __VLS_ctx.validationErrors.length > 0) })));
    var __VLS_130 = __VLS_129.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Xác nhận nhập lại", icon: "assignment_return", color: "primary", loading: (__VLS_ctx.isLoading), disable: (!__VLS_ctx.hasReturnInputs || __VLS_ctx.validationErrors.length > 0) })], __VLS_functionalComponentArgsRest(__VLS_129), false));
    var __VLS_133 = void 0;
    var __VLS_134 = ({ click: {} },
        { onClick: (__VLS_ctx.handleSubmit) });
    var __VLS_131;
    var __VLS_132;
    // @ts-ignore
    [isLoading, validationErrors, hasReturnInputs, hasReturnInputs, handleReset, handleSubmit,];
    var __VLS_118;
    // @ts-ignore
    [];
    var __VLS_27;
}
if (__VLS_ctx.selectedIssue) {
    var __VLS_135 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_136 = __VLS_asFunctionalComponent1(__VLS_135, new __VLS_135(__assign({ flat: true, bordered: true }, { class: "q-mt-md" })));
    var __VLS_137 = __VLS_136.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mt-md" })], __VLS_functionalComponentArgsRest(__VLS_136), false));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    var __VLS_140 = __VLS_138.slots.default;
    var __VLS_141 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_142 = __VLS_asFunctionalComponent1(__VLS_141, new __VLS_141({}));
    var __VLS_143 = __VLS_142.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_142), false));
    var __VLS_146 = __VLS_144.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    var __VLS_147 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
    qTable;
    // @ts-ignore
    var __VLS_148 = __VLS_asFunctionalComponent1(__VLS_147, new __VLS_147({
        rows: (__VLS_ctx.returnLogs),
        columns: ([
            { name: 'index', label: 'Lần', field: 'id', align: 'center' },
            { name: 'thread', label: 'Loại chỉ', field: 'thread_name', align: 'left' },
            { name: 'returned_full', label: 'Nguyên', field: 'returned_full', align: 'center' },
            { name: 'returned_partial', label: 'Lẻ', field: 'returned_partial', align: 'center' },
            { name: 'created_at', label: 'Thời gian', field: 'created_at', align: 'left' },
        ]),
        rowKey: "id",
        flat: true,
        bordered: true,
        pagination: ({ rowsPerPage: 0 }),
        hideBottom: true,
    }));
    var __VLS_149 = __VLS_148.apply(void 0, __spreadArray([{
            rows: (__VLS_ctx.returnLogs),
            columns: ([
                { name: 'index', label: 'Lần', field: 'id', align: 'center' },
                { name: 'thread', label: 'Loại chỉ', field: 'thread_name', align: 'left' },
                { name: 'returned_full', label: 'Nguyên', field: 'returned_full', align: 'center' },
                { name: 'returned_partial', label: 'Lẻ', field: 'returned_partial', align: 'center' },
                { name: 'created_at', label: 'Thời gian', field: 'created_at', align: 'left' },
            ]),
            rowKey: "id",
            flat: true,
            bordered: true,
            pagination: ({ rowsPerPage: 0 }),
            hideBottom: true,
        }], __VLS_functionalComponentArgsRest(__VLS_148), false));
    var __VLS_152 = __VLS_150.slots.default;
    {
        var __VLS_153 = __VLS_150.slots["body-cell-index"];
        var props = __VLS_vSlot(__VLS_153)[0];
        var __VLS_154 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_155 = __VLS_asFunctionalComponent1(__VLS_154, new __VLS_154({
            props: (props),
        }));
        var __VLS_156 = __VLS_155.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_155), false));
        var __VLS_159 = __VLS_157.slots.default;
        (props.rowIndex + 1);
        // @ts-ignore
        [selectedIssue, returnLogs,];
        var __VLS_157;
        // @ts-ignore
        [];
    }
    {
        var __VLS_160 = __VLS_150.slots["body-cell-thread"];
        var props = __VLS_vSlot(__VLS_160)[0];
        var __VLS_161 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_162 = __VLS_asFunctionalComponent1(__VLS_161, new __VLS_161({
            props: (props),
        }));
        var __VLS_163 = __VLS_162.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_162), false));
        var __VLS_166 = __VLS_164.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
        (props.row.thread_code);
        (props.row.thread_name);
        if (props.row.color_name) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
            (props.row.color_name);
        }
        // @ts-ignore
        [];
        var __VLS_164;
        // @ts-ignore
        [];
    }
    {
        var __VLS_167 = __VLS_150.slots["body-cell-created_at"];
        var props = __VLS_vSlot(__VLS_167)[0];
        var __VLS_168 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_169 = __VLS_asFunctionalComponent1(__VLS_168, new __VLS_168({
            props: (props),
        }));
        var __VLS_170 = __VLS_169.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_169), false));
        var __VLS_173 = __VLS_171.slots.default;
        (__VLS_ctx.date.formatDate(props.row.created_at, 'HH:mm DD/MM/YYYY'));
        // @ts-ignore
        [quasar_1.date,];
        var __VLS_171;
        // @ts-ignore
        [];
    }
    {
        var __VLS_174 = __VLS_150.slots["no-data"];
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-center q-pa-lg text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-pa-lg']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_150;
    // @ts-ignore
    [];
    var __VLS_144;
    // @ts-ignore
    [];
    var __VLS_138;
}
else if (!__VLS_ctx.isLoading && !__VLS_ctx.selectedIssueId) {
    var __VLS_175 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_176 = __VLS_asFunctionalComponent1(__VLS_175, new __VLS_175({
        flat: true,
        bordered: true,
    }));
    var __VLS_177 = __VLS_176.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_176), false));
    var __VLS_180 = __VLS_178.slots.default;
    var __VLS_181 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_182 = __VLS_asFunctionalComponent1(__VLS_181, new __VLS_181(__assign({ class: "text-center text-grey q-pa-xl" })));
    var __VLS_183 = __VLS_182.apply(void 0, __spreadArray([__assign({ class: "text-center text-grey q-pa-xl" })], __VLS_functionalComponentArgsRest(__VLS_182), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    var __VLS_186 = __VLS_184.slots.default;
    var __VLS_187 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_188 = __VLS_asFunctionalComponent1(__VLS_187, new __VLS_187(__assign({ name: "assignment_return", size: "64px" }, { class: "q-mb-md" })));
    var __VLS_189 = __VLS_188.apply(void 0, __spreadArray([__assign({ name: "assignment_return", size: "64px" }, { class: "q-mb-md" })], __VLS_functionalComponentArgsRest(__VLS_188), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({});
    // @ts-ignore
    [selectedIssueId, isLoading,];
    var __VLS_184;
    // @ts-ignore
    [];
    var __VLS_178;
}
else if (__VLS_ctx.isLoading && __VLS_ctx.selectedIssueId) {
    var __VLS_192 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_193 = __VLS_asFunctionalComponent1(__VLS_192, new __VLS_192({
        flat: true,
        bordered: true,
    }));
    var __VLS_194 = __VLS_193.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_193), false));
    var __VLS_197 = __VLS_195.slots.default;
    var __VLS_198 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_199 = __VLS_asFunctionalComponent1(__VLS_198, new __VLS_198(__assign({ class: "text-center q-pa-xl" })));
    var __VLS_200 = __VLS_199.apply(void 0, __spreadArray([__assign({ class: "text-center q-pa-xl" })], __VLS_functionalComponentArgsRest(__VLS_199), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    var __VLS_203 = __VLS_201.slots.default;
    var __VLS_204 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinner | typeof __VLS_components.QSpinner} */
    qSpinner;
    // @ts-ignore
    var __VLS_205 = __VLS_asFunctionalComponent1(__VLS_204, new __VLS_204({
        color: "primary",
        size: "48px",
    }));
    var __VLS_206 = __VLS_205.apply(void 0, __spreadArray([{
            color: "primary",
            size: "48px",
        }], __VLS_functionalComponentArgsRest(__VLS_205), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-md text-grey" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    // @ts-ignore
    [selectedIssueId, isLoading,];
    var __VLS_201;
    // @ts-ignore
    [];
    var __VLS_195;
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
