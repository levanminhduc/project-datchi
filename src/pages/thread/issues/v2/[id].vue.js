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
var vue_router_1 = require("vue-router");
var useIssueV2_1 = require("@/composables/thread/useIssueV2");
var PageHeader_vue_1 = require("@/components/ui/layout/PageHeader.vue");
var DataTable_vue_1 = require("@/components/ui/tables/DataTable.vue");
var IssueV2StatusBadge_vue_1 = require("@/components/thread/IssueV2StatusBadge.vue");
var AppButton_vue_1 = require("@/components/ui/buttons/AppButton.vue");
function formatDateTime(dateStr) {
    if (!dateStr)
        return '-';
    var date = new Date(dateStr);
    return date.toLocaleString('vi-VN');
}
var route = (0, vue_router_1.useRoute)();
var router = (0, vue_router_1.useRouter)();
var _a = (0, useIssueV2_1.useIssueV2)(), currentIssue = _a.currentIssue, isLoading = _a.isLoading, fetchIssue = _a.fetchIssue;
var notFound = (0, vue_1.ref)(false);
var issueId = (0, vue_1.computed)(function () { return Number(route.params.id || '0'); });
var columns = [
    { name: 'thread_name', label: 'Loại Chỉ', field: 'thread_name', align: 'left' },
    { name: 'order_info', label: 'Đơn Hàng', field: 'po_number', align: 'left' },
    { name: 'quota_cones', label: 'Định Mức', field: 'quota_cones', align: 'center' },
    { name: 'issued', label: 'Đã Xuất', field: 'issued_full', align: 'center' },
    { name: 'returned', label: 'Đã Trả', field: 'returned_full', align: 'center' },
    { name: 'line_status', label: 'Trạng Thái', field: 'is_over_quota', align: 'center' },
];
var loadIssue = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!issueId.value || isNaN(issueId.value)) {
                    notFound.value = true;
                    return [2 /*return*/];
                }
                return [4 /*yield*/, fetchIssue(issueId.value)];
            case 1:
                _a.sent();
                if (!currentIssue.value) {
                    notFound.value = true;
                }
                return [2 /*return*/];
        }
    });
}); };
var formatOrderInfo = function (row) {
    var parts = [];
    if (row.po_number)
        parts.push(row.po_number);
    if (row.style_code)
        parts.push(row.style_code);
    if (row.sub_art_code)
        parts.push(row.sub_art_code);
    if (row.color_name)
        parts.push(row.color_name);
    return parts.length > 0 ? parts.join(' / ') : '-';
};
var formatIssued = function (row) {
    if (row.issued_full === 0 && row.issued_partial === 0)
        return '-';
    return "".concat(row.issued_full, " ng + ").concat(row.issued_partial, " l\u1EBB");
};
var formatReturned = function (row) {
    if (row.returned_full === 0 && row.returned_partial === 0)
        return '-';
    return "".concat(row.returned_full, " ng + ").concat(row.returned_partial, " l\u1EBB");
};
var getRemainingQuota = function (row) {
    if (row.quota_cones === null)
        return null;
    return Math.max(0, row.quota_cones - row.issued_equivalent);
};
var goBackToHistory = function () {
    router.push('/thread/issues/v2?tab=history');
};
(0, vue_1.onMounted)(function () {
    loadIssue();
});
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
var __VLS_7 = PageHeader_vue_1.default;
// @ts-ignore
var __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    title: "Chi Tiết Phiếu Xuất",
    subtitle: "Xem thông tin chi tiết phiếu xuất chỉ",
    showBack: true,
    backTo: "/thread/issues/v2?tab=history",
}));
var __VLS_9 = __VLS_8.apply(void 0, __spreadArray([{
        title: "Chi Tiết Phiếu Xuất",
        subtitle: "Xem thông tin chi tiết phiếu xuất chỉ",
        showBack: true,
        backTo: "/thread/issues/v2?tab=history",
    }], __VLS_functionalComponentArgsRest(__VLS_8), false));
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row justify-center q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_12 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        size: "50px",
        color: "primary",
    }));
    var __VLS_14 = __VLS_13.apply(void 0, __spreadArray([{
            size: "50px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_13), false));
}
else if (__VLS_ctx.notFound) {
    var __VLS_17 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17(__assign({ flat: true, bordered: true }, { class: "text-center q-pa-xl" })));
    var __VLS_19 = __VLS_18.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "text-center q-pa-xl" })], __VLS_functionalComponentArgsRest(__VLS_18), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pa-xl']} */ ;
    var __VLS_22 = __VLS_20.slots.default;
    var __VLS_23 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        name: "search_off",
        size: "64px",
        color: "grey-5",
    }));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
            name: "search_off",
            size: "64px",
            color: "grey-5",
        }], __VLS_functionalComponentArgsRest(__VLS_24), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 q-mt-md text-grey-7" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mt-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2 text-grey-6 q-mb-lg" }));
    /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
    var __VLS_28 = AppButton_vue_1.default;
    // @ts-ignore
    var __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28(__assign({ 'onClick': {} }, { color: "primary", label: "Quay lại danh sách", icon: "arrow_back" })));
    var __VLS_30 = __VLS_29.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { color: "primary", label: "Quay lại danh sách", icon: "arrow_back" })], __VLS_functionalComponentArgsRest(__VLS_29), false));
    var __VLS_33 = void 0;
    var __VLS_34 = ({ click: {} },
        { onClick: (__VLS_ctx.goBackToHistory) });
    var __VLS_31;
    var __VLS_32;
    // @ts-ignore
    [isLoading, notFound, goBackToHistory,];
    var __VLS_20;
}
else if (__VLS_ctx.currentIssue) {
    var __VLS_35 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35(__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })));
    var __VLS_37 = __VLS_36.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-lg" })], __VLS_functionalComponentArgsRest(__VLS_36), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-lg']} */ ;
    var __VLS_40 = __VLS_38.slots.default;
    var __VLS_41 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({}));
    var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_42), false));
    var __VLS_46 = __VLS_44.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1 text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (__VLS_ctx.currentIssue.issue_code);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.currentIssue.department);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "q-mt-xs" }));
    /** @type {__VLS_StyleScopedClasses['q-mt-xs']} */ ;
    var __VLS_47 = IssueV2StatusBadge_vue_1.default;
    // @ts-ignore
    var __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
        status: (__VLS_ctx.currentIssue.status),
    }));
    var __VLS_49 = __VLS_48.apply(void 0, __spreadArray([{
            status: (__VLS_ctx.currentIssue.status),
        }], __VLS_functionalComponentArgsRest(__VLS_48), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.formatDateTime(__VLS_ctx.currentIssue.created_at));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
    /** @type {__VLS_StyleScopedClasses['col-12']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-subtitle1" }));
    /** @type {__VLS_StyleScopedClasses['text-subtitle1']} */ ;
    (__VLS_ctx.currentIssue.created_by);
    if (__VLS_ctx.currentIssue.notes) {
        var __VLS_52 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qSeparator | typeof __VLS_components.QSeparator} */
        qSeparator;
        // @ts-ignore
        var __VLS_53 = __VLS_asFunctionalComponent1(__VLS_52, new __VLS_52(__assign({ class: "q-my-md" })));
        var __VLS_54 = __VLS_53.apply(void 0, __spreadArray([__assign({ class: "q-my-md" })], __VLS_functionalComponentArgsRest(__VLS_53), false));
        /** @type {__VLS_StyleScopedClasses['q-my-md']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-body2" }));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
        (__VLS_ctx.currentIssue.notes);
    }
    // @ts-ignore
    [currentIssue, currentIssue, currentIssue, currentIssue, currentIssue, currentIssue, currentIssue, currentIssue, formatDateTime,];
    var __VLS_44;
    // @ts-ignore
    [];
    var __VLS_38;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6 q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    (__VLS_ctx.currentIssue.lines.length);
    var __VLS_57 = DataTable_vue_1.default || DataTable_vue_1.default;
    // @ts-ignore
    var __VLS_58 = __VLS_asFunctionalComponent1(__VLS_57, new __VLS_57({
        rows: (__VLS_ctx.currentIssue.lines),
        columns: (__VLS_ctx.columns),
        rowKey: "id",
        hidePagination: true,
        emptyIcon: "list",
        emptyTitle: "Chưa có dòng nào",
        emptySubtitle: "Phiếu xuất này chưa có dòng chi tiết",
    }));
    var __VLS_59 = __VLS_58.apply(void 0, __spreadArray([{
            rows: (__VLS_ctx.currentIssue.lines),
            columns: (__VLS_ctx.columns),
            rowKey: "id",
            hidePagination: true,
            emptyIcon: "list",
            emptyTitle: "Chưa có dòng nào",
            emptySubtitle: "Phiếu xuất này chưa có dòng chi tiết",
        }], __VLS_functionalComponentArgsRest(__VLS_58), false));
    var __VLS_62 = __VLS_60.slots.default;
    {
        var __VLS_63 = __VLS_60.slots["body-cell-thread_name"];
        var props = __VLS_vSlot(__VLS_63)[0];
        var __VLS_64 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
            props: (props),
        }));
        var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_65), false));
        var __VLS_69 = __VLS_67.slots.default;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-weight-medium" }));
        /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
        (props.row.thread_name);
        if (props.row.thread_code) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey-6" }));
            /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
            (props.row.thread_code);
        }
        // @ts-ignore
        [currentIssue, currentIssue, columns,];
        var __VLS_67;
        // @ts-ignore
        [];
    }
    {
        var __VLS_70 = __VLS_60.slots["body-cell-order_info"];
        var props = __VLS_vSlot(__VLS_70)[0];
        var __VLS_71 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71({
            props: (props),
        }));
        var __VLS_73 = __VLS_72.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_72), false));
        var __VLS_76 = __VLS_74.slots.default;
        (__VLS_ctx.formatOrderInfo(props.row));
        // @ts-ignore
        [formatOrderInfo,];
        var __VLS_74;
        // @ts-ignore
        [];
    }
    {
        var __VLS_77 = __VLS_60.slots["body-cell-quota_cones"];
        var props = __VLS_vSlot(__VLS_77)[0];
        var __VLS_78 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_79 = __VLS_asFunctionalComponent1(__VLS_78, new __VLS_78({
            props: (props),
        }));
        var __VLS_80 = __VLS_79.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_79), false));
        var __VLS_83 = __VLS_81.slots.default;
        if (props.row.quota_cones !== null) {
            (props.row.quota_cones);
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
            /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
        }
        // @ts-ignore
        [];
        var __VLS_81;
        // @ts-ignore
        [];
    }
    {
        var __VLS_84 = __VLS_60.slots["body-cell-issued"];
        var props = __VLS_vSlot(__VLS_84)[0];
        var __VLS_85 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_86 = __VLS_asFunctionalComponent1(__VLS_85, new __VLS_85({
            props: (props),
        }));
        var __VLS_87 = __VLS_86.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_86), false));
        var __VLS_90 = __VLS_88.slots.default;
        (__VLS_ctx.formatIssued(props.row));
        // @ts-ignore
        [formatIssued,];
        var __VLS_88;
        // @ts-ignore
        [];
    }
    {
        var __VLS_91 = __VLS_60.slots["body-cell-returned"];
        var props = __VLS_vSlot(__VLS_91)[0];
        var __VLS_92 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_93 = __VLS_asFunctionalComponent1(__VLS_92, new __VLS_92({
            props: (props),
        }));
        var __VLS_94 = __VLS_93.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_93), false));
        var __VLS_97 = __VLS_95.slots.default;
        (__VLS_ctx.formatReturned(props.row));
        // @ts-ignore
        [formatReturned,];
        var __VLS_95;
        // @ts-ignore
        [];
    }
    {
        var __VLS_98 = __VLS_60.slots["body-cell-line_status"];
        var props = __VLS_vSlot(__VLS_98)[0];
        var __VLS_99 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
        qTd;
        // @ts-ignore
        var __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
            props: (props),
        }));
        var __VLS_101 = __VLS_100.apply(void 0, __spreadArray([{
                props: (props),
            }], __VLS_functionalComponentArgsRest(__VLS_100), false));
        var __VLS_104 = __VLS_102.slots.default;
        if (props.row.is_over_quota) {
            var __VLS_105 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105(__assign({ color: "warning", outline: true }, { class: "q-mr-xs" })));
            var __VLS_107 = __VLS_106.apply(void 0, __spreadArray([__assign({ color: "warning", outline: true }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_106), false));
            /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
            var __VLS_110 = __VLS_108.slots.default;
            var __VLS_111 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
            qIcon;
            // @ts-ignore
            var __VLS_112 = __VLS_asFunctionalComponent1(__VLS_111, new __VLS_111(__assign({ name: "warning", size: "xs" }, { class: "q-mr-xs" })));
            var __VLS_113 = __VLS_112.apply(void 0, __spreadArray([__assign({ name: "warning", size: "xs" }, { class: "q-mr-xs" })], __VLS_functionalComponentArgsRest(__VLS_112), false));
            /** @type {__VLS_StyleScopedClasses['q-mr-xs']} */ ;
            if (props.row.over_quota_notes) {
                var __VLS_116 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip | typeof __VLS_components.qTooltip | typeof __VLS_components.QTooltip} */
                qTooltip;
                // @ts-ignore
                var __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({}));
                var __VLS_118 = __VLS_117.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_117), false));
                var __VLS_121 = __VLS_119.slots.default;
                (props.row.over_quota_notes);
                // @ts-ignore
                [];
                var __VLS_119;
            }
            // @ts-ignore
            [];
            var __VLS_108;
        }
        if (__VLS_ctx.getRemainingQuota(props.row) !== null && __VLS_ctx.getRemainingQuota(props.row) > 0) {
            var __VLS_122 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
            qBadge;
            // @ts-ignore
            var __VLS_123 = __VLS_asFunctionalComponent1(__VLS_122, new __VLS_122({
                color: "info",
                outline: true,
            }));
            var __VLS_124 = __VLS_123.apply(void 0, __spreadArray([{
                    color: "info",
                    outline: true,
                }], __VLS_functionalComponentArgsRest(__VLS_123), false));
            var __VLS_127 = __VLS_125.slots.default;
            (__VLS_ctx.getRemainingQuota(props.row));
            // @ts-ignore
            [getRemainingQuota, getRemainingQuota, getRemainingQuota,];
            var __VLS_125;
        }
        if (!props.row.is_over_quota && (__VLS_ctx.getRemainingQuota(props.row) === null || __VLS_ctx.getRemainingQuota(props.row) === 0)) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
            /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
        }
        // @ts-ignore
        [getRemainingQuota, getRemainingQuota,];
        var __VLS_102;
        // @ts-ignore
        [];
    }
    // @ts-ignore
    [];
    var __VLS_60;
}
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
