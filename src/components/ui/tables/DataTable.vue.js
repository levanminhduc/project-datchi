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
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
var quasar_1 = require("quasar");
var EmptyState_vue_1 = require("../feedback/EmptyState.vue");
var $q = (0, quasar_1.useQuasar)();
var props = withDefaults(defineProps(), {
    rowKey: 'id',
    loading: false,
    filter: '',
    rowsPerPageOptions: function () { return [10, 25, 50, 100]; },
    selection: 'none',
    selected: function () { return []; },
    emptyIcon: 'inbox',
    emptyTitle: 'Không có dữ liệu',
    emptySubtitle: 'Chưa có dữ liệu để hiển thị',
    flat: true,
    bordered: true,
    square: false,
    dense: false,
    hideHeader: false,
    hideBottom: false,
    hidePagination: false,
    hideSelectedBanner: false,
    noDataLabel: 'Không có dữ liệu',
    noResultsLabel: 'Không tìm thấy kết quả',
    loadingLabel: 'Đang tải...',
    separator: 'horizontal',
    wrapCells: false,
    virtualScroll: false,
    binaryStateSort: false,
    columnSortOrder: 'ad',
    grid: false,
    gridHeader: false,
});
var emit = defineEmits();
var paginationModel = (0, vue_1.computed)({
    get: function () { var _a; return (_a = props.pagination) !== null && _a !== void 0 ? _a : { page: 1, rowsPerPage: 25 }; },
    set: function (value) { return emit('update:pagination', value); },
});
var selectedModel = (0, vue_1.computed)({
    get: function () { return props.selected; },
    set: function (value) { return emit('update:selected', value); },
});
// Auto-detect dark mode: use prop if explicitly set, otherwise follow global dark mode
var isDark = (0, vue_1.computed)(function () { var _a; return (_a = props.dark) !== null && _a !== void 0 ? _a : $q.dark.isActive; });
var __VLS_defaults = {
    rowKey: 'id',
    loading: false,
    filter: '',
    rowsPerPageOptions: function () { return [10, 25, 50, 100]; },
    selection: 'none',
    selected: function () { return []; },
    emptyIcon: 'inbox',
    emptyTitle: 'Không có dữ liệu',
    emptySubtitle: 'Chưa có dữ liệu để hiển thị',
    flat: true,
    bordered: true,
    square: false,
    dense: false,
    hideHeader: false,
    hideBottom: false,
    hidePagination: false,
    hideSelectedBanner: false,
    noDataLabel: 'Không có dữ liệu',
    noResultsLabel: 'Không tìm thấy kết quả',
    loadingLabel: 'Đang tải...',
    separator: 'horizontal',
    wrapCells: false,
    virtualScroll: false,
    binaryStateSort: false,
    columnSortOrder: 'ad',
    grid: false,
    gridHeader: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
qTable;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onRequest': {} }, { 'onRowClick': {} }), { pagination: (__VLS_ctx.paginationModel), selected: (__VLS_ctx.selectedModel), rows: (__VLS_ctx.rows), columns: (__VLS_ctx.columns), rowKey: (__VLS_ctx.rowKey), loading: (__VLS_ctx.loading), filter: (__VLS_ctx.filter), rowsPerPageOptions: (__VLS_ctx.rowsPerPageOptions), selection: (__VLS_ctx.selection), flat: (__VLS_ctx.flat), bordered: (__VLS_ctx.bordered), square: (__VLS_ctx.square), dense: (__VLS_ctx.dense), dark: (__VLS_ctx.isDark), hideHeader: (__VLS_ctx.hideHeader), hideBottom: (__VLS_ctx.hideBottom), hidePagination: (__VLS_ctx.hidePagination), hideSelectedBanner: (__VLS_ctx.hideSelectedBanner), noDataLabel: (__VLS_ctx.noDataLabel), noResultsLabel: (__VLS_ctx.noResultsLabel), loadingLabel: (__VLS_ctx.loadingLabel), separator: (__VLS_ctx.separator), wrapCells: (__VLS_ctx.wrapCells), virtualScroll: (__VLS_ctx.virtualScroll), virtualScrollSliceSize: (__VLS_ctx.virtualScrollSliceSize), virtualScrollItemSize: (__VLS_ctx.virtualScrollItemSize), binaryStateSort: (__VLS_ctx.binaryStateSort), columnSortOrder: (__VLS_ctx.columnSortOrder), sortMethod: (__VLS_ctx.sortMethod), title: (__VLS_ctx.title), grid: (__VLS_ctx.grid), gridHeader: (__VLS_ctx.gridHeader), cardContainerClass: (__VLS_ctx.cardContainerClass), cardContainerStyle: (__VLS_ctx.cardContainerStyle), cardClass: (__VLS_ctx.cardClass), cardStyle: (__VLS_ctx.cardStyle), tableClass: (__VLS_ctx.tableClass), tableStyle: (__VLS_ctx.tableStyle), tableHeaderClass: (__VLS_ctx.tableHeaderClass), tableHeaderStyle: (__VLS_ctx.tableHeaderStyle), color: (__VLS_ctx.color), iconFirstPage: (__VLS_ctx.iconFirstPage), iconPrevPage: (__VLS_ctx.iconPrevPage), iconNextPage: (__VLS_ctx.iconNextPage), iconLastPage: (__VLS_ctx.iconLastPage) }), { class: "app-data-table" })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onRequest': {} }, { 'onRowClick': {} }), { pagination: (__VLS_ctx.paginationModel), selected: (__VLS_ctx.selectedModel), rows: (__VLS_ctx.rows), columns: (__VLS_ctx.columns), rowKey: (__VLS_ctx.rowKey), loading: (__VLS_ctx.loading), filter: (__VLS_ctx.filter), rowsPerPageOptions: (__VLS_ctx.rowsPerPageOptions), selection: (__VLS_ctx.selection), flat: (__VLS_ctx.flat), bordered: (__VLS_ctx.bordered), square: (__VLS_ctx.square), dense: (__VLS_ctx.dense), dark: (__VLS_ctx.isDark), hideHeader: (__VLS_ctx.hideHeader), hideBottom: (__VLS_ctx.hideBottom), hidePagination: (__VLS_ctx.hidePagination), hideSelectedBanner: (__VLS_ctx.hideSelectedBanner), noDataLabel: (__VLS_ctx.noDataLabel), noResultsLabel: (__VLS_ctx.noResultsLabel), loadingLabel: (__VLS_ctx.loadingLabel), separator: (__VLS_ctx.separator), wrapCells: (__VLS_ctx.wrapCells), virtualScroll: (__VLS_ctx.virtualScroll), virtualScrollSliceSize: (__VLS_ctx.virtualScrollSliceSize), virtualScrollItemSize: (__VLS_ctx.virtualScrollItemSize), binaryStateSort: (__VLS_ctx.binaryStateSort), columnSortOrder: (__VLS_ctx.columnSortOrder), sortMethod: (__VLS_ctx.sortMethod), title: (__VLS_ctx.title), grid: (__VLS_ctx.grid), gridHeader: (__VLS_ctx.gridHeader), cardContainerClass: (__VLS_ctx.cardContainerClass), cardContainerStyle: (__VLS_ctx.cardContainerStyle), cardClass: (__VLS_ctx.cardClass), cardStyle: (__VLS_ctx.cardStyle), tableClass: (__VLS_ctx.tableClass), tableStyle: (__VLS_ctx.tableStyle), tableHeaderClass: (__VLS_ctx.tableHeaderClass), tableHeaderStyle: (__VLS_ctx.tableHeaderStyle), color: (__VLS_ctx.color), iconFirstPage: (__VLS_ctx.iconFirstPage), iconPrevPage: (__VLS_ctx.iconPrevPage), iconNextPage: (__VLS_ctx.iconNextPage), iconLastPage: (__VLS_ctx.iconLastPage) }), { class: "app-data-table" })], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5;
var __VLS_6 = ({ request: {} },
    { onRequest: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('request', $event);
            // @ts-ignore
            [paginationModel, selectedModel, rows, columns, rowKey, loading, filter, rowsPerPageOptions, selection, flat, bordered, square, dense, isDark, hideHeader, hideBottom, hidePagination, hideSelectedBanner, noDataLabel, noResultsLabel, loadingLabel, separator, wrapCells, virtualScroll, virtualScrollSliceSize, virtualScrollItemSize, binaryStateSort, columnSortOrder, sortMethod, title, grid, gridHeader, cardContainerClass, cardContainerStyle, cardClass, cardStyle, tableClass, tableStyle, tableHeaderClass, tableHeaderStyle, color, iconFirstPage, iconPrevPage, iconNextPage, iconLastPage, $attrs, emit,];
        } });
var __VLS_7 = ({ rowClick: {} },
    { onRowClick: (function (evt, row, index) { return __VLS_ctx.emit('rowClick', evt, row, index); }) });
var __VLS_8 = {};
/** @type {__VLS_StyleScopedClasses['app-data-table']} */ ;
var __VLS_9 = __VLS_3.slots.default;
{
    var __VLS_10 = __VLS_3.slots.loading;
    var __VLS_11 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading | typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
    qInnerLoading;
    // @ts-ignore
    var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
        showing: true,
    }));
    var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([{
            showing: true,
        }], __VLS_functionalComponentArgsRest(__VLS_12), false));
    var __VLS_16 = __VLS_14.slots.default;
    var __VLS_17 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpinnerDots | typeof __VLS_components.QSpinnerDots} */
    qSpinnerDots;
    // @ts-ignore
    var __VLS_18 = __VLS_asFunctionalComponent1(__VLS_17, new __VLS_17({
        size: "50px",
        color: "primary",
    }));
    var __VLS_19 = __VLS_18.apply(void 0, __spreadArray([{
            size: "50px",
            color: "primary",
        }], __VLS_functionalComponentArgsRest(__VLS_18), false));
    // @ts-ignore
    [emit,];
    var __VLS_14;
    // @ts-ignore
    [];
}
{
    var __VLS_22 = __VLS_3.slots["no-data"];
    var __VLS_23 = EmptyState_vue_1.default || EmptyState_vue_1.default;
    // @ts-ignore
    var __VLS_24 = __VLS_asFunctionalComponent1(__VLS_23, new __VLS_23({
        icon: (__VLS_ctx.emptyIcon),
        title: (__VLS_ctx.emptyTitle),
        subtitle: (__VLS_ctx.emptySubtitle),
    }));
    var __VLS_25 = __VLS_24.apply(void 0, __spreadArray([{
            icon: (__VLS_ctx.emptyIcon),
            title: (__VLS_ctx.emptyTitle),
            subtitle: (__VLS_ctx.emptySubtitle),
        }], __VLS_functionalComponentArgsRest(__VLS_24), false));
    var __VLS_28 = __VLS_26.slots.default;
    var __VLS_29 = {};
    // @ts-ignore
    [emptyIcon, emptyTitle, emptySubtitle,];
    var __VLS_26;
    // @ts-ignore
    [];
}
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.$slots)); _i < _a.length; _i++) {
    var _b = _a[_i], _ = _b[0], slotName = _b[1];
    {
        var _c = __VLS_3.slots, _d = __VLS_tryAsConstant(slotName), __VLS_31 = _c[_d];
        var slotProps = __VLS_vSlot(__VLS_31)[0];
        var __VLS_32 = __assign({}, (slotProps || {}));
        var __VLS_33 = __VLS_tryAsConstant(slotName);
        // @ts-ignore
        [$slots,];
    }
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_30 = __VLS_29, __VLS_34 = __VLS_33, __VLS_35 = __VLS_32;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
