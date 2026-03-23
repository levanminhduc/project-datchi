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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var useReports_1 = require("@/composables/useReports");
var useThreadTypes_1 = require("@/composables/thread/useThreadTypes");
var AppSelect_vue_1 = require("@/components/ui/inputs/AppSelect.vue");
var AppInput_vue_1 = require("@/components/ui/inputs/AppInput.vue");
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var utils_1 = require("@/utils");
// Composables
var _g = (0, useReports_1.useReports)(), isLoading = _g.isLoading, hasData = _g.hasData, summary = _g.summary, allocations = _g.allocations, fetchAllocationReport = _g.fetchAllocationReport, exportToXlsx = _g.exportToXlsx, clearReportFilters = _g.clearFilters;
var _h = (0, useThreadTypes_1.useThreadTypes)(), threadTypes = _h.threadTypes, fetchThreadTypes = _h.fetchThreadTypes;
// Filters
var filters = (0, vue_1.reactive)({
    from_date: undefined,
    to_date: undefined,
    thread_type_id: undefined,
    status: undefined,
});
// Options
var threadTypeOptions = (0, vue_1.computed)(function () {
    return threadTypes.value.map(function (t) { return ({
        label: "".concat(t.code, " - ").concat(t.name),
        value: t.id,
    }); });
});
var statusOptions = [
    { label: 'Chờ xử lý', value: 'PENDING' },
    { label: 'Phân bổ mềm', value: 'SOFT' },
    { label: 'Phân bổ cứng', value: 'HARD' },
    { label: 'Đã xuất', value: 'ISSUED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
    { label: 'Chờ hàng', value: 'WAITLISTED' },
];
// Table columns
var columns = [
    {
        name: 'order_id',
        label: 'Mã Đơn',
        field: 'order_id',
        align: 'left',
        sortable: true,
    },
    {
        name: 'thread_type_code',
        label: 'Mã Chỉ',
        field: 'thread_type_code',
        align: 'left',
        sortable: true,
    },
    {
        name: 'thread_type_name',
        label: 'Tên Loại Chỉ',
        field: 'thread_type_name',
        align: 'left',
    },
    {
        name: 'requested_meters',
        label: 'Yêu Cầu (m)',
        field: 'requested_meters',
        align: 'right',
        sortable: true,
        format: function (val) { return val.toLocaleString(); },
    },
    {
        name: 'allocated_meters',
        label: 'Đã Phân Bổ (m)',
        field: 'allocated_meters',
        align: 'right',
        sortable: true,
        format: function (val) { return val.toLocaleString(); },
    },
    {
        name: 'fulfillment_rate',
        label: 'Tỷ Lệ',
        field: 'fulfillment_rate',
        align: 'center',
        sortable: true,
    },
    {
        name: 'status',
        label: 'Trạng Thái',
        field: 'status',
        align: 'center',
        sortable: true,
    },
    {
        name: 'priority',
        label: 'Ưu Tiên',
        field: 'priority',
        align: 'center',
        sortable: true,
    },
    {
        name: 'created_at',
        label: 'Ngày Tạo',
        field: 'created_at',
        align: 'center',
        sortable: true,
    },
    {
        name: 'transition_hours',
        label: 'Thời Gian XL',
        field: 'transition_hours',
        align: 'right',
        sortable: true,
    },
];
// Computed
var fulfillmentRateColor = (0, vue_1.computed)(function () {
    var _a;
    var rate = ((_a = summary.value) === null || _a === void 0 ? void 0 : _a.fulfillmentRate) || 0;
    if (rate >= 90)
        return 'text-positive';
    if (rate >= 70)
        return 'text-warning';
    return 'text-negative';
});
// Methods
var handleGenerateReport = function () {
    fetchAllocationReport({
        from_date: filters.from_date,
        to_date: filters.to_date,
        thread_type_id: filters.thread_type_id,
        status: filters.status,
    });
};
var handleExport = function () {
    exportToXlsx();
};
var handleClearFilters = function () {
    filters.from_date = undefined;
    filters.to_date = undefined;
    filters.thread_type_id = undefined;
    filters.status = undefined;
    clearReportFilters();
};
var formatDate = function (dateStr) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};
var getRateColor = function (rate) {
    if (rate >= 90)
        return 'positive';
    if (rate >= 70)
        return 'warning';
    return 'negative';
};
var getStatusColor = function (status) {
    var colors = {
        PENDING: 'grey',
        SOFT: 'info',
        HARD: 'primary',
        ISSUED: 'positive',
        CANCELLED: 'negative',
        WAITLISTED: 'warning',
    };
    return colors[status] || 'grey';
};
var getStatusLabel = function (status) {
    var labels = {
        PENDING: 'Chờ xử lý',
        SOFT: 'Phân bổ mềm',
        HARD: 'Phân bổ cứng',
        ISSUED: 'Đã xuất',
        CANCELLED: 'Đã hủy',
        WAITLISTED: 'Chờ hàng',
    };
    return labels[status] || status;
};
var getPriorityColor = function (priority) {
    var colors = {
        URGENT: 'negative',
        HIGH: 'warning',
        NORMAL: 'primary',
        LOW: 'grey',
    };
    return colors[priority] || 'grey';
};
var getPriorityLabel = function (priority) {
    var labels = {
        URGENT: 'Khẩn cấp',
        HIGH: 'Cao',
        NORMAL: 'Bình thường',
        LOW: 'Thấp',
    };
    return labels[priority] || priority;
};
// Lifecycle
(0, vue_1.onMounted)(function () {
    fetchThreadTypes();
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center justify-between q-mb-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h5, __VLS_intrinsics.h5)(__assign({ class: "q-ma-none text-weight-bold text-primary" }));
/** @type {__VLS_StyleScopedClasses['q-ma-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-weight-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
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
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md" }));
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_19 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
    modelValue: (__VLS_ctx.filters.from_date),
    label: "Từ ngày",
    placeholder: "DD/MM/YYYY",
    rules: ([__VLS_ctx.dateRules.date]),
    dense: true,
    clearable: true,
}));
var __VLS_21 = __VLS_20.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.from_date),
        label: "Từ ngày",
        placeholder: "DD/MM/YYYY",
        rules: ([__VLS_ctx.dateRules.date]),
        dense: true,
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_20), false));
var __VLS_24 = __VLS_22.slots.default;
{
    var __VLS_25 = __VLS_22.slots.append;
    var __VLS_26 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_27), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_31 = __VLS_29.slots.default;
    var __VLS_32 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_34 = __VLS_33.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_33), false));
    var __VLS_37 = __VLS_35.slots.default;
    var __VLS_38 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
        modelValue: (__VLS_ctx.filters.from_date),
    }));
    var __VLS_40 = __VLS_39.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.filters.from_date),
        }], __VLS_functionalComponentArgsRest(__VLS_39), false));
    // @ts-ignore
    [filters, filters, utils_1.dateRules,];
    var __VLS_35;
    // @ts-ignore
    [];
    var __VLS_29;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_22;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_43 = AppInput_vue_1.default || AppInput_vue_1.default;
// @ts-ignore
var __VLS_44 = __VLS_asFunctionalComponent1(__VLS_43, new __VLS_43({
    modelValue: (__VLS_ctx.filters.to_date),
    label: "Đến ngày",
    placeholder: "DD/MM/YYYY",
    rules: ([__VLS_ctx.dateRules.date]),
    dense: true,
    clearable: true,
}));
var __VLS_45 = __VLS_44.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.to_date),
        label: "Đến ngày",
        placeholder: "DD/MM/YYYY",
        rules: ([__VLS_ctx.dateRules.date]),
        dense: true,
        clearable: true,
    }], __VLS_functionalComponentArgsRest(__VLS_44), false));
var __VLS_48 = __VLS_46.slots.default;
{
    var __VLS_49 = __VLS_46.slots.append;
    var __VLS_50 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon | typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_51 = __VLS_asFunctionalComponent1(__VLS_50, new __VLS_50(__assign({ name: "event" }, { class: "cursor-pointer" })));
    var __VLS_52 = __VLS_51.apply(void 0, __spreadArray([__assign({ name: "event" }, { class: "cursor-pointer" })], __VLS_functionalComponentArgsRest(__VLS_51), false));
    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
    var __VLS_55 = __VLS_53.slots.default;
    var __VLS_56 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
    qPopupProxy;
    // @ts-ignore
    var __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        cover: true,
        transitionShow: "scale",
        transitionHide: "scale",
    }));
    var __VLS_58 = __VLS_57.apply(void 0, __spreadArray([{
            cover: true,
            transitionShow: "scale",
            transitionHide: "scale",
        }], __VLS_functionalComponentArgsRest(__VLS_57), false));
    var __VLS_61 = __VLS_59.slots.default;
    var __VLS_62 = DatePicker_vue_1.default;
    // @ts-ignore
    var __VLS_63 = __VLS_asFunctionalComponent1(__VLS_62, new __VLS_62({
        modelValue: (__VLS_ctx.filters.to_date),
    }));
    var __VLS_64 = __VLS_63.apply(void 0, __spreadArray([{
            modelValue: (__VLS_ctx.filters.to_date),
        }], __VLS_functionalComponentArgsRest(__VLS_63), false));
    // @ts-ignore
    [filters, filters, utils_1.dateRules,];
    var __VLS_59;
    // @ts-ignore
    [];
    var __VLS_53;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_46;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_67 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_68 = __VLS_asFunctionalComponent1(__VLS_67, new __VLS_67({
    modelValue: (__VLS_ctx.filters.thread_type_id),
    options: (__VLS_ctx.threadTypeOptions),
    label: "Loại chỉ",
    emitValue: true,
    mapOptions: true,
    clearable: true,
    dense: true,
    outlined: true,
}));
var __VLS_69 = __VLS_68.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.thread_type_id),
        options: (__VLS_ctx.threadTypeOptions),
        label: "Loại chỉ",
        emitValue: true,
        mapOptions: true,
        clearable: true,
        dense: true,
        outlined: true,
    }], __VLS_functionalComponentArgsRest(__VLS_68), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-6 col-md-2" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-6']} */ ;
/** @type {__VLS_StyleScopedClasses['col-md-2']} */ ;
var __VLS_72 = AppSelect_vue_1.default;
// @ts-ignore
var __VLS_73 = __VLS_asFunctionalComponent1(__VLS_72, new __VLS_72({
    modelValue: (__VLS_ctx.filters.status),
    options: (__VLS_ctx.statusOptions),
    label: "Trạng thái",
    emitValue: true,
    mapOptions: true,
    clearable: true,
    dense: true,
    outlined: true,
}));
var __VLS_74 = __VLS_73.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.filters.status),
        options: (__VLS_ctx.statusOptions),
        label: "Trạng thái",
        emitValue: true,
        mapOptions: true,
        clearable: true,
        dense: true,
        outlined: true,
    }], __VLS_functionalComponentArgsRest(__VLS_73), false));
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
var __VLS_77;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77(__assign(__assign(__assign({ 'onClick': {} }, { label: "Tạo Báo Cáo", color: "primary", icon: "assessment", loading: (__VLS_ctx.isLoading) }), { class: "full-width-xs" }), { unelevated: true })));
var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onClick': {} }, { label: "Tạo Báo Cáo", color: "primary", icon: "assessment", loading: (__VLS_ctx.isLoading) }), { class: "full-width-xs" }), { unelevated: true })], __VLS_functionalComponentArgsRest(__VLS_78), false));
var __VLS_82;
var __VLS_83 = ({ click: {} },
    { onClick: (__VLS_ctx.handleGenerateReport) });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_80;
var __VLS_81;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-12 col-sm-auto" }));
/** @type {__VLS_StyleScopedClasses['col-12']} */ ;
/** @type {__VLS_StyleScopedClasses['col-sm-auto']} */ ;
var __VLS_84;
/** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
qBtn;
// @ts-ignore
var __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84(__assign(__assign({ 'onClick': {} }, { label: "Xóa Bộ Lọc", color: "grey", icon: "clear", flat: true }), { class: "full-width-xs" })));
var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([__assign(__assign({ 'onClick': {} }, { label: "Xóa Bộ Lọc", color: "grey", icon: "clear", flat: true }), { class: "full-width-xs" })], __VLS_functionalComponentArgsRest(__VLS_85), false));
var __VLS_89;
var __VLS_90 = ({ click: {} },
    { onClick: (__VLS_ctx.handleClearFilters) });
/** @type {__VLS_StyleScopedClasses['full-width-xs']} */ ;
var __VLS_87;
var __VLS_88;
// @ts-ignore
[filters, filters, threadTypeOptions, statusOptions, isLoading, handleGenerateReport, handleClearFilters,];
var __VLS_16;
// @ts-ignore
[];
var __VLS_10;
if (__VLS_ctx.hasData) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row q-col-gutter-md q-mb-md" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-col-gutter-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-md']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_91 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_92 = __VLS_asFunctionalComponent1(__VLS_91, new __VLS_91({
        flat: true,
        bordered: true,
    }));
    var __VLS_93 = __VLS_92.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_92), false));
    var __VLS_96 = __VLS_94.slots.default;
    var __VLS_97 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_98 = __VLS_asFunctionalComponent1(__VLS_97, new __VLS_97(__assign({ class: "text-center" })));
    var __VLS_99 = __VLS_98.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_98), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_102 = __VLS_100.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-primary" }));
    /** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
    (((_a = __VLS_ctx.summary) === null || _a === void 0 ? void 0 : _a.totalAllocations) || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    // @ts-ignore
    [hasData, summary,];
    var __VLS_100;
    // @ts-ignore
    [];
    var __VLS_94;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_103 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_104 = __VLS_asFunctionalComponent1(__VLS_103, new __VLS_103({
        flat: true,
        bordered: true,
    }));
    var __VLS_105 = __VLS_104.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_104), false));
    var __VLS_108 = __VLS_106.slots.default;
    var __VLS_109 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_110 = __VLS_asFunctionalComponent1(__VLS_109, new __VLS_109(__assign({ class: "text-center" })));
    var __VLS_111 = __VLS_110.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_110), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_114 = __VLS_112.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4" }, { class: (__VLS_ctx.fulfillmentRateColor) }));
    /** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
    (((_c = (_b = __VLS_ctx.summary) === null || _b === void 0 ? void 0 : _b.fulfillmentRate) === null || _c === void 0 ? void 0 : _c.toFixed(1)) || 0);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    // @ts-ignore
    [summary, fulfillmentRateColor,];
    var __VLS_112;
    // @ts-ignore
    [];
    var __VLS_106;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_115 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_116 = __VLS_asFunctionalComponent1(__VLS_115, new __VLS_115({
        flat: true,
        bordered: true,
    }));
    var __VLS_117 = __VLS_116.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_116), false));
    var __VLS_120 = __VLS_118.slots.default;
    var __VLS_121 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_122 = __VLS_asFunctionalComponent1(__VLS_121, new __VLS_121(__assign({ class: "text-center" })));
    var __VLS_123 = __VLS_122.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_122), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_126 = __VLS_124.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h4 text-info" }));
    /** @type {__VLS_StyleScopedClasses['text-h4']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-info']} */ ;
    (((_e = (_d = __VLS_ctx.summary) === null || _d === void 0 ? void 0 : _d.avgTransitionHours) === null || _e === void 0 ? void 0 : _e.toFixed(1)) || 'N/A');
    if ((_f = __VLS_ctx.summary) === null || _f === void 0 ? void 0 : _f.avgTransitionHours) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-body2" }));
        /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-caption text-grey" }));
    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    // @ts-ignore
    [summary, summary,];
    var __VLS_124;
    // @ts-ignore
    [];
    var __VLS_118;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col-6 col-md-3" }));
    /** @type {__VLS_StyleScopedClasses['col-6']} */ ;
    /** @type {__VLS_StyleScopedClasses['col-md-3']} */ ;
    var __VLS_127 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
    qCard;
    // @ts-ignore
    var __VLS_128 = __VLS_asFunctionalComponent1(__VLS_127, new __VLS_127({
        flat: true,
        bordered: true,
    }));
    var __VLS_129 = __VLS_128.apply(void 0, __spreadArray([{
            flat: true,
            bordered: true,
        }], __VLS_functionalComponentArgsRest(__VLS_128), false));
    var __VLS_132 = __VLS_130.slots.default;
    var __VLS_133 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_134 = __VLS_asFunctionalComponent1(__VLS_133, new __VLS_133(__assign({ class: "text-center" })));
    var __VLS_135 = __VLS_134.apply(void 0, __spreadArray([__assign({ class: "text-center" })], __VLS_functionalComponentArgsRest(__VLS_134), false));
    /** @type {__VLS_StyleScopedClasses['text-center']} */ ;
    var __VLS_138 = __VLS_136.slots.default;
    var __VLS_139 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
    qBtn;
    // @ts-ignore
    var __VLS_140 = __VLS_asFunctionalComponent1(__VLS_139, new __VLS_139(__assign({ 'onClick': {} }, { label: "Xuất Excel", color: "positive", icon: "download", unelevated: true, disable: (!__VLS_ctx.hasData) })));
    var __VLS_141 = __VLS_140.apply(void 0, __spreadArray([__assign({ 'onClick': {} }, { label: "Xuất Excel", color: "positive", icon: "download", unelevated: true, disable: (!__VLS_ctx.hasData) })], __VLS_functionalComponentArgsRest(__VLS_140), false));
    var __VLS_144 = void 0;
    var __VLS_145 = ({ click: {} },
        { onClick: (__VLS_ctx.handleExport) });
    var __VLS_142;
    var __VLS_143;
    // @ts-ignore
    [hasData, handleExport,];
    var __VLS_136;
    // @ts-ignore
    [];
    var __VLS_130;
}
var __VLS_146;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_147 = __VLS_asFunctionalComponent1(__VLS_146, new __VLS_146(__assign({ rows: (__VLS_ctx.allocations), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.isLoading), pagination: ({ rowsPerPage: 20 }), rowsPerPageOptions: ([10, 20, 50, 100]), flat: true, bordered: true }, { class: "shadow-1" })));
var __VLS_148 = __VLS_147.apply(void 0, __spreadArray([__assign({ rows: (__VLS_ctx.allocations), columns: (__VLS_ctx.columns), rowKey: "id", loading: (__VLS_ctx.isLoading), pagination: ({ rowsPerPage: 20 }), rowsPerPageOptions: ([10, 20, 50, 100]), flat: true, bordered: true }, { class: "shadow-1" })], __VLS_functionalComponentArgsRest(__VLS_147), false));
/** @type {__VLS_StyleScopedClasses['shadow-1']} */ ;
var __VLS_151 = __VLS_149.slots.default;
{
    var __VLS_152 = __VLS_149.slots.loading;
    var __VLS_153 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
    qInnerLoading;
    // @ts-ignore
    var __VLS_154 = __VLS_asFunctionalComponent1(__VLS_153, new __VLS_153({
        showing: true,
    }));
    var __VLS_155 = __VLS_154.apply(void 0, __spreadArray([{
            showing: true,
        }], __VLS_functionalComponentArgsRest(__VLS_154), false));
    var __VLS_158 = __VLS_156.slots.default;
    var __VLS_159 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_160 = __VLS_asFunctionalComponent1(__VLS_159, new __VLS_159({
        size: "50px",
        color: "primary",
    }));
    var __VLS_161 = __VLS_160.apply(void 0, __spreadArray([{
            size: "50px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_160), false));
    // @ts-ignore
    [isLoading, allocations, columns,];
    var __VLS_156;
    // @ts-ignore
    [];
}
{
    var __VLS_164 = __VLS_149.slots["body-cell-fulfillment_rate"];
    var props = __VLS_vSlot(__VLS_164)[0];
    var __VLS_165 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_166 = __VLS_asFunctionalComponent1(__VLS_165, new __VLS_165({
        props: (props),
    }));
    var __VLS_167 = __VLS_166.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_166), false));
    var __VLS_170 = __VLS_168.slots.default;
    var __VLS_171 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_172 = __VLS_asFunctionalComponent1(__VLS_171, new __VLS_171({
        color: (__VLS_ctx.getRateColor(props.row.fulfillment_rate)),
    }));
    var __VLS_173 = __VLS_172.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getRateColor(props.row.fulfillment_rate)),
        }], __VLS_functionalComponentArgsRest(__VLS_172), false));
    var __VLS_176 = __VLS_174.slots.default;
    (props.row.fulfillment_rate.toFixed(1));
    // @ts-ignore
    [getRateColor,];
    var __VLS_174;
    // @ts-ignore
    [];
    var __VLS_168;
    // @ts-ignore
    [];
}
{
    var __VLS_177 = __VLS_149.slots["body-cell-status"];
    var props = __VLS_vSlot(__VLS_177)[0];
    var __VLS_178 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_179 = __VLS_asFunctionalComponent1(__VLS_178, new __VLS_178({
        props: (props),
    }));
    var __VLS_180 = __VLS_179.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_179), false));
    var __VLS_183 = __VLS_181.slots.default;
    var __VLS_184 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_185 = __VLS_asFunctionalComponent1(__VLS_184, new __VLS_184({
        color: (__VLS_ctx.getStatusColor(props.row.status)),
    }));
    var __VLS_186 = __VLS_185.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getStatusColor(props.row.status)),
        }], __VLS_functionalComponentArgsRest(__VLS_185), false));
    var __VLS_189 = __VLS_187.slots.default;
    (__VLS_ctx.getStatusLabel(props.row.status));
    // @ts-ignore
    [getStatusColor, getStatusLabel,];
    var __VLS_187;
    // @ts-ignore
    [];
    var __VLS_181;
    // @ts-ignore
    [];
}
{
    var __VLS_190 = __VLS_149.slots["body-cell-priority"];
    var props = __VLS_vSlot(__VLS_190)[0];
    var __VLS_191 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_192 = __VLS_asFunctionalComponent1(__VLS_191, new __VLS_191({
        props: (props),
    }));
    var __VLS_193 = __VLS_192.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_192), false));
    var __VLS_196 = __VLS_194.slots.default;
    var __VLS_197 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qBadge | typeof __VLS_components.QBadge | typeof __VLS_components.qBadge | typeof __VLS_components.QBadge} */
    qBadge;
    // @ts-ignore
    var __VLS_198 = __VLS_asFunctionalComponent1(__VLS_197, new __VLS_197({
        color: (__VLS_ctx.getPriorityColor(props.row.priority)),
        outline: true,
    }));
    var __VLS_199 = __VLS_198.apply(void 0, __spreadArray([{
            color: (__VLS_ctx.getPriorityColor(props.row.priority)),
            outline: true,
        }], __VLS_functionalComponentArgsRest(__VLS_198), false));
    var __VLS_202 = __VLS_200.slots.default;
    (__VLS_ctx.getPriorityLabel(props.row.priority));
    // @ts-ignore
    [getPriorityColor, getPriorityLabel,];
    var __VLS_200;
    // @ts-ignore
    [];
    var __VLS_194;
    // @ts-ignore
    [];
}
{
    var __VLS_203 = __VLS_149.slots["body-cell-created_at"];
    var props = __VLS_vSlot(__VLS_203)[0];
    var __VLS_204 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_205 = __VLS_asFunctionalComponent1(__VLS_204, new __VLS_204({
        props: (props),
    }));
    var __VLS_206 = __VLS_205.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_205), false));
    var __VLS_209 = __VLS_207.slots.default;
    (__VLS_ctx.formatDate(props.row.created_at));
    // @ts-ignore
    [formatDate,];
    var __VLS_207;
    // @ts-ignore
    [];
}
{
    var __VLS_210 = __VLS_149.slots["body-cell-transition_hours"];
    var props = __VLS_vSlot(__VLS_210)[0];
    var __VLS_211 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
    qTd;
    // @ts-ignore
    var __VLS_212 = __VLS_asFunctionalComponent1(__VLS_211, new __VLS_211({
        props: (props),
    }));
    var __VLS_213 = __VLS_212.apply(void 0, __spreadArray([{
            props: (props),
        }], __VLS_functionalComponentArgsRest(__VLS_212), false));
    var __VLS_216 = __VLS_214.slots.default;
    if (props.row.transition_hours !== null) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
        (props.row.transition_hours.toFixed(1));
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey" }));
        /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    }
    // @ts-ignore
    [];
    var __VLS_214;
    // @ts-ignore
    [];
}
{
    var __VLS_217 = __VLS_149.slots["no-data"];
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "full-width row flex-center text-grey q-gutter-sm q-py-xl" }));
    /** @type {__VLS_StyleScopedClasses['full-width']} */ ;
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-py-xl']} */ ;
    var __VLS_218 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_219 = __VLS_asFunctionalComponent1(__VLS_218, new __VLS_218({
        size: "2em",
        name: "assessment",
    }));
    var __VLS_220 = __VLS_219.apply(void 0, __spreadArray([{
            size: "2em",
            name: "assessment",
        }], __VLS_functionalComponentArgsRest(__VLS_219), false));
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_149;
// @ts-ignore
[];
var __VLS_3;
// @ts-ignore
[];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({});
exports.default = {};
