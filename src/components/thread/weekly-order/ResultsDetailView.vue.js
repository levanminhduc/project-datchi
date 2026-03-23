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
var DatePicker_vue_1 = require("@/components/ui/pickers/DatePicker.vue");
var useAuth_1 = require("@/composables/useAuth");
var vuedraggable_1 = require("vuedraggable");
var props = defineProps();
var emit = defineEmits();
var _a = (0, useAuth_1.useAuth)(), isAdmin = _a.isAdmin, checkIsRoot = _a.checkIsRoot;
// Local copy for draggable to mutate
var localResults = (0, vue_1.ref)(__spreadArray([], props.results, true));
// Sync localResults when props.results changes
(0, vue_1.watch)(function () { return props.results; }, function (newResults) {
    localResults.value = __spreadArray([], newResults, true);
}, { deep: true });
// Debounce timer for recalculation
var reorderDebounceTimer = null;
function onDragChange() {
    // Debounce 300ms before emitting reorder
    if (reorderDebounceTimer) {
        clearTimeout(reorderDebounceTimer);
    }
    reorderDebounceTimer = setTimeout(function () {
        emit('reorder', __spreadArray([], localResults.value, true));
    }, 300);
}
var canEditDeliveryDate = (0, vue_1.ref)(false);
(0, vue_1.watch)(function () { return props.isSaved; }, function (saved) {
    canEditDeliveryDate.value = !saved || checkIsRoot() || isAdmin();
}, { immediate: true });
// Date conversion: YYYY-MM-DD ↔ DD/MM/YYYY
function formatDateDisplay(isoDate) {
    if (!isoDate)
        return '';
    var _a = isoDate.split('-'), y = _a[0], m = _a[1], d = _a[2];
    return "".concat(d, "/").concat(m, "/").concat(y);
}
function toIso(displayDate) {
    if (!displayDate)
        return '';
    var _a = displayDate.split('/'), d = _a[0], m = _a[1], y = _a[2];
    return "".concat(y, "-").concat(m, "-").concat(d);
}
function getEffectiveDate(row) {
    var _a;
    return (_a = row.delivery_date) !== null && _a !== void 0 ? _a : null;
}
function onDeliveryDateChange(specId, val) {
    if (!val)
        return;
    var isoDate = toIso(val);
    emit('update:delivery-date', specId, isoDate);
}
// Countdown logic
function formatCountdown(isoDate) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var delivery = new Date(isoDate);
    delivery.setHours(0, 0, 0, 0);
    var diffMs = delivery.getTime() - today.getTime();
    var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0)
        return "c\u00F2n ".concat(diffDays, " Ng\u00E0y");
    return 'Đã đến hạn Giao';
}
function countdownClass(isoDate) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var delivery = new Date(isoDate);
    delivery.setHours(0, 0, 0, 0);
    var diffMs = delivery.getTime() - today.getTime();
    var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0)
        return 'text-negative text-weight-bold';
    if (diffDays <= 3)
        return 'text-warning text-weight-medium';
    return 'text-positive';
}
function isLightColor(hex) {
    var color = hex.replace('#', '');
    var r = parseInt(color.substring(0, 2), 16);
    var g = parseInt(color.substring(2, 4), 16);
    var b = parseInt(color.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}
function getPoNumbers(styleId) {
    if (!props.orderEntries)
        return '';
    var entries = props.orderEntries.filter(function (e) { return e.style_id === styleId && e.po_number; });
    var uniquePos = __spreadArray([], new Set(entries.map(function (e) { return e.po_number; })), true).filter(Boolean);
    return uniquePos.join(', ');
}
function getColorNames(styleId) {
    if (!props.orderEntries)
        return [];
    var entries = props.orderEntries.filter(function (e) { return e.style_id === styleId; });
    var colorMap = new Map();
    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
        var entry = entries_1[_i];
        for (var _a = 0, _b = entry.colors; _a < _b.length; _a++) {
            var c = _b[_a];
            if (!colorMap.has(c.color_id)) {
                colorMap.set(c.color_id, { color_id: c.color_id, color_name: c.color_name, hex_code: c.hex_code });
            }
        }
    }
    return Array.from(colorMap.values());
}
function getColorGroups(result) {
    var hasColorBreakdown = result.calculations.some(function (c) { return c.color_breakdown && c.color_breakdown.length > 0; });
    if (!hasColorBreakdown)
        return null;
    var map = new Map();
    for (var _i = 0, _a = result.calculations; _i < _a.length; _i++) {
        var calc = _a[_i];
        if (!calc.color_breakdown)
            continue;
        for (var _b = 0, _c = calc.color_breakdown; _b < _c.length; _b++) {
            var cb = _c[_b];
            if (!map.has(cb.color_id)) {
                map.set(cb.color_id, { color_id: cb.color_id, color_name: cb.color_name, quantity: cb.quantity, rows: [] });
            }
            map.get(cb.color_id).rows.push(cb);
        }
    }
    return Array.from(map.values());
}
var colorGroupsMap = (0, vue_1.computed)(function () {
    var map = new Map();
    for (var _i = 0, _a = props.results; _i < _a.length; _i++) {
        var result = _a[_i];
        var groups = getColorGroups(result);
        if (groups)
            map.set(result.style_id, groups);
    }
    return map;
});
function getColorHex(result, colorId) {
    if (!props.orderEntries)
        return '#ccc';
    for (var _i = 0, _a = props.orderEntries; _i < _a.length; _i++) {
        var entry = _a[_i];
        if (entry.style_id !== result.style_id)
            continue;
        var c = entry.colors.find(function (c) { return c.color_id === colorId; });
        if (c)
            return c.hex_code || '#ccc';
    }
    return '#ccc';
}
var colorColumns = [
    { name: 'process_name', label: 'Công đoạn', field: 'process_name', align: 'left' },
    { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
    { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'left' },
    { name: 'meters_per_unit', label: 'Mét/SP', field: 'meters_per_unit', align: 'right', format: function (val) { return val.toFixed(2); } },
    {
        name: 'total_meters',
        label: 'Tổng mét',
        field: 'total_meters',
        align: 'right',
        format: function (val) { return val.toLocaleString('vi-VN', { maximumFractionDigits: 2 }); },
    },
    {
        name: 'total_cones',
        label: 'Tổng cuộn',
        field: function (row) {
            var r = row;
            if (!r.meters_per_cone || r.meters_per_cone <= 0)
                return null;
            return Math.ceil(r.total_meters / r.meters_per_cone);
        },
        align: 'right',
        format: function (val) { return (val !== null && val !== undefined) ? Number(val).toLocaleString('vi-VN') : '—'; },
    },
    { name: 'thread_color', label: 'Màu chỉ', field: 'thread_color', align: 'center' },
];
var columns = [
    { name: 'process_name', label: 'Công đoạn', field: 'process_name', align: 'left' },
    { name: 'supplier_name', label: 'NCC', field: 'supplier_name', align: 'left' },
    { name: 'tex_number', label: 'Tex', field: 'tex_number', align: 'left' },
    { name: 'meters_per_unit', label: 'Mét/SP', field: 'meters_per_unit', align: 'right', format: function (val) { return val.toFixed(2); } },
    {
        name: 'total_cones',
        label: 'Tổng cuộn',
        field: function (row) {
            var r = row;
            if (!r.meters_per_cone || r.meters_per_cone <= 0)
                return null;
            return Math.ceil(r.total_meters / r.meters_per_cone);
        },
        align: 'right',
        format: function (val) { return (val !== null && val !== undefined) ? Number(val).toLocaleString('vi-VN') : '—'; },
    },
    { name: 'thread_color', label: 'Màu chỉ', field: 'thread_color', align: 'center' },
    {
        name: 'inventory_available',
        label: 'Tồn Kho',
        field: 'inventory_available',
        align: 'right',
        format: function (val) { return (val !== null && val !== undefined) ? Number(val).toLocaleString('vi-VN') : '—'; },
    },
    {
        name: 'delivery_date',
        label: 'Ngày giao',
        field: 'delivery_date',
        align: 'center',
    },
];
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
/** @type {__VLS_StyleScopedClasses['drag-handle']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "relative-position" }));
/** @type {__VLS_StyleScopedClasses['relative-position']} */ ;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qInnerLoading | typeof __VLS_components.QInnerLoading} */
qInnerLoading;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    showing: (props.isReordering),
    label: "Đang cập nhật thứ tự ưu tiên...",
    labelClass: "text-primary",
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        showing: (props.isReordering),
        label: "Đang cập nhật thứ tự ưu tiên...",
        labelClass: "text-primary",
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
/** @ts-ignore @type {typeof __VLS_components.draggable | typeof __VLS_components.Draggable | typeof __VLS_components.draggable | typeof __VLS_components.Draggable} */
vuedraggable_1.default;
// @ts-ignore
var __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5(__assign({ 'onChange': {} }, { list: (__VLS_ctx.localResults), itemKey: "style_id", handle: ".drag-handle", ghostClass: "dragging-ghost", disabled: (props.isReordering) })));
var __VLS_7 = __VLS_6.apply(void 0, __spreadArray([__assign({ 'onChange': {} }, { list: (__VLS_ctx.localResults), itemKey: "style_id", handle: ".drag-handle", ghostClass: "dragging-ghost", disabled: (props.isReordering) })], __VLS_functionalComponentArgsRest(__VLS_6), false));
var __VLS_10;
var __VLS_11 = ({ change: {} },
    { onChange: (__VLS_ctx.onDragChange) });
var __VLS_12 = __VLS_8.slots.default;
{
    var __VLS_13 = __VLS_8.slots.item;
    var result = __VLS_vSlot(__VLS_13)[0].element;
    var __VLS_14 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppCard | typeof __VLS_components.AppCard} */
    AppCard;
    // @ts-ignore
    var __VLS_15 = __VLS_asFunctionalComponent1(__VLS_14, new __VLS_14(__assign({ flat: true, bordered: true }, { class: "q-mb-sm" })));
    var __VLS_16 = __VLS_15.apply(void 0, __spreadArray([__assign({ flat: true, bordered: true }, { class: "q-mb-sm" })], __VLS_functionalComponentArgsRest(__VLS_15), false));
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_19 = __VLS_17.slots.default;
    var __VLS_20 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_21 = __VLS_asFunctionalComponent1(__VLS_20, new __VLS_20({}));
    var __VLS_22 = __VLS_21.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_21), false));
    var __VLS_25 = __VLS_23.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-mb-sm" }));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
    var __VLS_26 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26(__assign(__assign({ name: "drag_indicator" }, { class: "drag-handle cursor-move q-mr-sm text-grey-6" }), { size: "sm" })));
    var __VLS_28 = __VLS_27.apply(void 0, __spreadArray([__assign(__assign({ name: "drag_indicator" }, { class: "drag-handle cursor-move q-mr-sm text-grey-6" }), { size: "sm" })], __VLS_functionalComponentArgsRest(__VLS_27), false));
    /** @type {__VLS_StyleScopedClasses['drag-handle']} */ ;
    /** @type {__VLS_StyleScopedClasses['cursor-move']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
    /** @type {__VLS_StyleScopedClasses['text-grey-6']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "col" }));
    /** @type {__VLS_StyleScopedClasses['col']} */ ;
    if (__VLS_ctx.getPoNumbers(result.style_id)) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-caption text-primary q-mr-sm" }));
        /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
        /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mr-sm']} */ ;
        (__VLS_ctx.getPoNumbers(result.style_id));
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium" }));
    /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
    (result.style_code);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-7 q-ml-sm" }));
    /** @type {__VLS_StyleScopedClasses['text-grey-7']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-ml-sm']} */ ;
    (result.style_name);
    if (__VLS_ctx.getColorNames(result.style_id).length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5 q-mx-xs" }));
        /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
        /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
        for (var _i = 0, _b = __VLS_vFor((__VLS_ctx.getColorNames(result.style_id))); _i < _b.length; _i++) {
            var _c = _b[_i], color = _c[0], idx = _c[1];
            (color.color_id);
            if (idx > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5 q-mx-xs" }));
                /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
                /** @type {__VLS_StyleScopedClasses['q-mx-xs']} */ ;
            }
            var __VLS_31 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.AppBadge} */
            AppBadge;
            // @ts-ignore
            var __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31(__assign(__assign({ style: ({ backgroundColor: color.hex_code || '#999' }) }, { class: (color.hex_code && __VLS_ctx.isLightColor(color.hex_code) ? 'text-dark' : 'text-white') }), { label: (color.color_name) })));
            var __VLS_33 = __VLS_32.apply(void 0, __spreadArray([__assign(__assign({ style: ({ backgroundColor: color.hex_code || '#999' }) }, { class: (color.hex_code && __VLS_ctx.isLightColor(color.hex_code) ? 'text-dark' : 'text-white') }), { label: (color.color_name) })], __VLS_functionalComponentArgsRest(__VLS_32), false));
            // @ts-ignore
            [localResults, onDragChange, getPoNumbers, getPoNumbers, getColorNames, getColorNames, isLightColor,];
        }
    }
    var __VLS_36 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.AppChip} */
    AppChip;
    // @ts-ignore
    var __VLS_37 = __VLS_asFunctionalComponent1(__VLS_36, new __VLS_36({
        color: "primary",
        textColor: "white",
        dense: true,
        label: ("".concat(result.total_quantity, " SP")),
    }));
    var __VLS_38 = __VLS_37.apply(void 0, __spreadArray([{
            color: "primary",
            textColor: "white",
            dense: true,
            label: ("".concat(result.total_quantity, " SP")),
        }], __VLS_functionalComponentArgsRest(__VLS_37), false));
    if (__VLS_ctx.colorGroupsMap.get(result.style_id)) {
        for (var _d = 0, _e = __VLS_vFor((__VLS_ctx.colorGroupsMap.get(result.style_id))); _d < _e.length; _d++) {
            var group = _e[_d][0];
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ key: (group.color_id) }, { class: "q-mb-sm" }));
            /** @type {__VLS_StyleScopedClasses['q-mb-sm']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "row items-center q-gutter-sm q-mb-xs" }));
            /** @type {__VLS_StyleScopedClasses['row']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-gutter-sm']} */ ;
            /** @type {__VLS_StyleScopedClasses['q-mb-xs']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span)(__assign({ style: ({
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: __VLS_ctx.getColorHex(result, group.color_id),
                    border: '1px solid #ccc',
                }) }));
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-weight-medium text-body2" }));
            /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
            /** @type {__VLS_StyleScopedClasses['text-body2']} */ ;
            (group.color_name);
            var __VLS_41 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.AppChip} */
            AppChip;
            // @ts-ignore
            var __VLS_42 = __VLS_asFunctionalComponent1(__VLS_41, new __VLS_41({
                dense: true,
                size: "sm",
                label: ("".concat(group.quantity, " SP")),
            }));
            var __VLS_43 = __VLS_42.apply(void 0, __spreadArray([{
                    dense: true,
                    size: "sm",
                    label: ("".concat(group.quantity, " SP")),
                }], __VLS_functionalComponentArgsRest(__VLS_42), false));
            var __VLS_46 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
            qTable;
            // @ts-ignore
            var __VLS_47 = __VLS_asFunctionalComponent1(__VLS_46, new __VLS_46({
                rows: (group.rows),
                columns: (__VLS_ctx.colorColumns),
                rowKey: "process_name",
                flat: true,
                bordered: true,
                dense: true,
                hideBottom: true,
                rowsPerPageOptions: ([0]),
            }));
            var __VLS_48 = __VLS_47.apply(void 0, __spreadArray([{
                    rows: (group.rows),
                    columns: (__VLS_ctx.colorColumns),
                    rowKey: "process_name",
                    flat: true,
                    bordered: true,
                    dense: true,
                    hideBottom: true,
                    rowsPerPageOptions: ([0]),
                }], __VLS_functionalComponentArgsRest(__VLS_47), false));
            var __VLS_51 = __VLS_49.slots.default;
            {
                var __VLS_52 = __VLS_49.slots["body-cell-thread_color"];
                var props_1 = __VLS_vSlot(__VLS_52)[0];
                var __VLS_53 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
                qTd;
                // @ts-ignore
                var __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
                    props: (props_1),
                }));
                var __VLS_55 = __VLS_54.apply(void 0, __spreadArray([{
                        props: (props_1),
                    }], __VLS_functionalComponentArgsRest(__VLS_54), false));
                var __VLS_58 = __VLS_56.slots.default;
                if (props_1.row.thread_color) {
                    var __VLS_59 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.AppBadge} */
                    AppBadge;
                    // @ts-ignore
                    var __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59(__assign(__assign({ style: ({ backgroundColor: props_1.row.thread_color_code || '#999' }) }, { class: (props_1.row.thread_color_code && __VLS_ctx.isLightColor(props_1.row.thread_color_code) ? 'text-dark' : 'text-white') }), { label: (props_1.row.thread_color) })));
                    var __VLS_61 = __VLS_60.apply(void 0, __spreadArray([__assign(__assign({ style: ({ backgroundColor: props_1.row.thread_color_code || '#999' }) }, { class: (props_1.row.thread_color_code && __VLS_ctx.isLightColor(props_1.row.thread_color_code) ? 'text-dark' : 'text-white') }), { label: (props_1.row.thread_color) })], __VLS_functionalComponentArgsRest(__VLS_60), false));
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
                    /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
                }
                // @ts-ignore
                [isLightColor, colorGroupsMap, colorGroupsMap, getColorHex, colorColumns,];
                var __VLS_56;
                // @ts-ignore
                [];
            }
            // @ts-ignore
            [];
            var __VLS_49;
            // @ts-ignore
            [];
        }
    }
    else {
        var __VLS_64 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qTable | typeof __VLS_components.QTable | typeof __VLS_components.qTable | typeof __VLS_components.QTable} */
        qTable;
        // @ts-ignore
        var __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
            rows: (result.calculations),
            columns: (__VLS_ctx.columns),
            rowKey: "spec_id",
            flat: true,
            bordered: true,
            dense: true,
            hideBottom: true,
            rowsPerPageOptions: ([0]),
        }));
        var __VLS_66 = __VLS_65.apply(void 0, __spreadArray([{
                rows: (result.calculations),
                columns: (__VLS_ctx.columns),
                rowKey: "spec_id",
                flat: true,
                bordered: true,
                dense: true,
                hideBottom: true,
                rowsPerPageOptions: ([0]),
            }], __VLS_functionalComponentArgsRest(__VLS_65), false));
        var __VLS_69 = __VLS_67.slots.default;
        {
            var __VLS_70 = __VLS_67.slots["body-cell-total_cones"];
            var props_2 = __VLS_vSlot(__VLS_70)[0];
            var __VLS_71 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_72 = __VLS_asFunctionalComponent1(__VLS_71, new __VLS_71({
                props: (props_2),
            }));
            var __VLS_73 = __VLS_72.apply(void 0, __spreadArray([{
                    props: (props_2),
                }], __VLS_functionalComponentArgsRest(__VLS_72), false));
            var __VLS_76 = __VLS_74.slots.default;
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({});
            (props_2.value);
            if (props_2.row.meters_per_cone) {
                var __VLS_77 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.AppTooltip | typeof __VLS_components.AppTooltip} */
                AppTooltip;
                // @ts-ignore
                var __VLS_78 = __VLS_asFunctionalComponent1(__VLS_77, new __VLS_77({}));
                var __VLS_79 = __VLS_78.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_78), false));
                var __VLS_82 = __VLS_80.slots.default;
                (props_2.row.total_meters.toFixed(2));
                (props_2.row.meters_per_cone);
                // @ts-ignore
                [columns,];
                var __VLS_80;
            }
            // @ts-ignore
            [];
            var __VLS_74;
            // @ts-ignore
            [];
        }
        {
            var __VLS_83 = __VLS_67.slots["body-cell-thread_color"];
            var props_3 = __VLS_vSlot(__VLS_83)[0];
            var __VLS_84 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
                props: (props_3),
            }));
            var __VLS_86 = __VLS_85.apply(void 0, __spreadArray([{
                    props: (props_3),
                }], __VLS_functionalComponentArgsRest(__VLS_85), false));
            var __VLS_89 = __VLS_87.slots.default;
            if (props_3.row.thread_color) {
                var __VLS_90 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.AppBadge} */
                AppBadge;
                // @ts-ignore
                var __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90(__assign(__assign({ style: ({ backgroundColor: props_3.row.thread_color_code || '#999' }) }, { class: (props_3.row.thread_color_code && __VLS_ctx.isLightColor(props_3.row.thread_color_code) ? 'text-dark' : 'text-white') }), { label: (props_3.row.thread_color) })));
                var __VLS_92 = __VLS_91.apply(void 0, __spreadArray([__assign(__assign({ style: ({ backgroundColor: props_3.row.thread_color_code || '#999' }) }, { class: (props_3.row.thread_color_code && __VLS_ctx.isLightColor(props_3.row.thread_color_code) ? 'text-dark' : 'text-white') }), { label: (props_3.row.thread_color) })], __VLS_functionalComponentArgsRest(__VLS_91), false));
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
                /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
            }
            // @ts-ignore
            [isLightColor,];
            var __VLS_87;
            // @ts-ignore
            [];
        }
        {
            var __VLS_95 = __VLS_67.slots["body-cell-delivery_date"];
            var props_4 = __VLS_vSlot(__VLS_95)[0];
            var __VLS_96 = void 0;
            /** @ts-ignore @type {typeof __VLS_components.qTd | typeof __VLS_components.QTd | typeof __VLS_components.qTd | typeof __VLS_components.QTd} */
            qTd;
            // @ts-ignore
            var __VLS_97 = __VLS_asFunctionalComponent1(__VLS_96, new __VLS_96({
                props: (props_4),
            }));
            var __VLS_98 = __VLS_97.apply(void 0, __spreadArray([{
                    props: (props_4),
                }], __VLS_functionalComponentArgsRest(__VLS_97), false));
            var __VLS_101 = __VLS_99.slots.default;
            if (props_4.row.is_fully_stocked) {
                var __VLS_102 = void 0;
                /** @ts-ignore @type {typeof __VLS_components.AppBadge} */
                AppBadge;
                // @ts-ignore
                var __VLS_103 = __VLS_asFunctionalComponent1(__VLS_102, new __VLS_102({
                    color: "positive",
                    textColor: "white",
                    label: "Sẵn Kho",
                }));
                var __VLS_104 = __VLS_103.apply(void 0, __spreadArray([{
                        color: "positive",
                        textColor: "white",
                        label: "Sẵn Kho",
                    }], __VLS_functionalComponentArgsRest(__VLS_103), false));
            }
            else if (props_4.row.shortage_cones && props_4.row.shortage_cones > 0) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "column items-center" }));
                /** @type {__VLS_StyleScopedClasses['column']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-warning text-weight-medium" }));
                /** @type {__VLS_StyleScopedClasses['text-warning']} */ ;
                /** @type {__VLS_StyleScopedClasses['text-weight-medium']} */ ;
                (props_4.row.shortage_cones);
                if (__VLS_ctx.getEffectiveDate(props_4.row) && __VLS_ctx.canEditDeliveryDate) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cursor-pointer text-primary text-caption" }));
                    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
                    (__VLS_ctx.formatDateDisplay(__VLS_ctx.getEffectiveDate(props_4.row)));
                    var __VLS_107 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
                    qIcon;
                    // @ts-ignore
                    var __VLS_108 = __VLS_asFunctionalComponent1(__VLS_107, new __VLS_107(__assign({ name: "edit_calendar", size: "xs" }, { class: "q-ml-xs" })));
                    var __VLS_109 = __VLS_108.apply(void 0, __spreadArray([__assign({ name: "edit_calendar", size: "xs" }, { class: "q-ml-xs" })], __VLS_functionalComponentArgsRest(__VLS_108), false));
                    /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
                    var __VLS_112 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
                    qPopupProxy;
                    // @ts-ignore
                    var __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
                        cover: true,
                        transitionShow: "scale",
                        transitionHide: "scale",
                    }));
                    var __VLS_114 = __VLS_113.apply(void 0, __spreadArray([{
                            cover: true,
                            transitionShow: "scale",
                            transitionHide: "scale",
                        }], __VLS_functionalComponentArgsRest(__VLS_113), false));
                    var __VLS_117 = __VLS_115.slots.default;
                    var __VLS_118 = DatePicker_vue_1.default;
                    // @ts-ignore
                    var __VLS_119 = __VLS_asFunctionalComponent1(__VLS_118, new __VLS_118(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.formatDateDisplay(__VLS_ctx.getEffectiveDate(props_4.row))) })));
                    var __VLS_120 = __VLS_119.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.formatDateDisplay(__VLS_ctx.getEffectiveDate(props_4.row))) })], __VLS_functionalComponentArgsRest(__VLS_119), false));
                    var __VLS_123 = void 0;
                    var __VLS_124 = ({ 'update:modelValue': {} },
                        { 'onUpdate:modelValue': (function (val) { return __VLS_ctx.onDeliveryDateChange(props_4.row.spec_id, val); }) });
                    var __VLS_121;
                    var __VLS_122;
                    // @ts-ignore
                    [getEffectiveDate, getEffectiveDate, getEffectiveDate, canEditDeliveryDate, formatDateDisplay, formatDateDisplay, onDeliveryDateChange,];
                    var __VLS_115;
                }
                else if (__VLS_ctx.getEffectiveDate(props_4.row)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (['text-caption', __VLS_ctx.countdownClass(__VLS_ctx.getEffectiveDate(props_4.row))]) }));
                    /** @type {__VLS_StyleScopedClasses['text-caption']} */ ;
                    (__VLS_ctx.formatCountdown(__VLS_ctx.getEffectiveDate(props_4.row)));
                }
            }
            else {
                if (!__VLS_ctx.getEffectiveDate(props_4.row)) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "text-grey-5" }));
                    /** @type {__VLS_StyleScopedClasses['text-grey-5']} */ ;
                }
                else if (__VLS_ctx.canEditDeliveryDate) {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: "cursor-pointer text-primary" }));
                    /** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
                    /** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
                    (__VLS_ctx.formatDateDisplay(__VLS_ctx.getEffectiveDate(props_4.row)));
                    var __VLS_125 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
                    qIcon;
                    // @ts-ignore
                    var __VLS_126 = __VLS_asFunctionalComponent1(__VLS_125, new __VLS_125(__assign({ name: "edit_calendar", size: "xs" }, { class: "q-ml-xs" })));
                    var __VLS_127 = __VLS_126.apply(void 0, __spreadArray([__assign({ name: "edit_calendar", size: "xs" }, { class: "q-ml-xs" })], __VLS_functionalComponentArgsRest(__VLS_126), false));
                    /** @type {__VLS_StyleScopedClasses['q-ml-xs']} */ ;
                    var __VLS_130 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy | typeof __VLS_components.qPopupProxy | typeof __VLS_components.QPopupProxy} */
                    qPopupProxy;
                    // @ts-ignore
                    var __VLS_131 = __VLS_asFunctionalComponent1(__VLS_130, new __VLS_130({
                        cover: true,
                        transitionShow: "scale",
                        transitionHide: "scale",
                    }));
                    var __VLS_132 = __VLS_131.apply(void 0, __spreadArray([{
                            cover: true,
                            transitionShow: "scale",
                            transitionHide: "scale",
                        }], __VLS_functionalComponentArgsRest(__VLS_131), false));
                    var __VLS_135 = __VLS_133.slots.default;
                    var __VLS_136 = DatePicker_vue_1.default;
                    // @ts-ignore
                    var __VLS_137 = __VLS_asFunctionalComponent1(__VLS_136, new __VLS_136(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.formatDateDisplay(__VLS_ctx.getEffectiveDate(props_4.row))) })));
                    var __VLS_138 = __VLS_137.apply(void 0, __spreadArray([__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.formatDateDisplay(__VLS_ctx.getEffectiveDate(props_4.row))) })], __VLS_functionalComponentArgsRest(__VLS_137), false));
                    var __VLS_141 = void 0;
                    var __VLS_142 = ({ 'update:modelValue': {} },
                        { 'onUpdate:modelValue': (function (val) { return __VLS_ctx.onDeliveryDateChange(props_4.row.spec_id, val); }) });
                    var __VLS_139;
                    var __VLS_140;
                    // @ts-ignore
                    [getEffectiveDate, getEffectiveDate, getEffectiveDate, getEffectiveDate, getEffectiveDate, getEffectiveDate, canEditDeliveryDate, formatDateDisplay, formatDateDisplay, onDeliveryDateChange, countdownClass, formatCountdown,];
                    var __VLS_133;
                }
                else {
                    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)(__assign({ class: (__VLS_ctx.countdownClass(__VLS_ctx.getEffectiveDate(props_4.row))) }));
                    (__VLS_ctx.formatCountdown(__VLS_ctx.getEffectiveDate(props_4.row)));
                    var __VLS_143 = void 0;
                    /** @ts-ignore @type {typeof __VLS_components.AppTooltip | typeof __VLS_components.AppTooltip} */
                    AppTooltip;
                    // @ts-ignore
                    var __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({}));
                    var __VLS_145 = __VLS_144.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_144), false));
                    var __VLS_148 = __VLS_146.slots.default;
                    (__VLS_ctx.formatDateDisplay(__VLS_ctx.getEffectiveDate(props_4.row)));
                    // @ts-ignore
                    [getEffectiveDate, getEffectiveDate, getEffectiveDate, formatDateDisplay, countdownClass, formatCountdown,];
                    var __VLS_146;
                }
            }
            // @ts-ignore
            [];
            var __VLS_99;
            // @ts-ignore
            [];
        }
        // @ts-ignore
        [];
        var __VLS_67;
    }
    // @ts-ignore
    [];
    var __VLS_23;
    // @ts-ignore
    [];
    var __VLS_17;
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_8;
var __VLS_9;
if (__VLS_ctx.results.length === 0) {
    var __VLS_149 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.EmptyState} */
    EmptyState;
    // @ts-ignore
    var __VLS_150 = __VLS_asFunctionalComponent1(__VLS_149, new __VLS_149({
        icon: "info",
        title: "Chưa có kết quả",
        subtitle: "Nhấn 'Tính toán' để xem chi tiết theo mã hàng",
        iconColor: "grey-4",
    }));
    var __VLS_151 = __VLS_150.apply(void 0, __spreadArray([{
            icon: "info",
            title: "Chưa có kết quả",
            subtitle: "Nhấn 'Tính toán' để xem chi tiết theo mã hàng",
            iconColor: "grey-4",
        }], __VLS_functionalComponentArgsRest(__VLS_150), false));
}
// @ts-ignore
[results,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
exports.default = {};
