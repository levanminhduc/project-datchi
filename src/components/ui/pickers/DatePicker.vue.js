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
var props = withDefaults(defineProps(), {
    mask: 'DD/MM/YYYY',
    landscape: false,
    color: 'primary',
    square: false,
    flat: false,
    bordered: true,
    readonly: false,
    disable: false,
    todayBtn: true,
    minimal: false,
    firstDayOfWeek: 1,
    multiple: false,
    range: false,
    emitImmediately: true,
    defaultView: 'Calendar',
    autoClose: true
});
var emit = defineEmits();
var $q = (0, quasar_1.useQuasar)();
var isDark = (0, vue_1.computed)(function () { var _a; return (_a = props.dark) !== null && _a !== void 0 ? _a : $q.dark.isActive; });
var instance = (0, vue_1.getCurrentInstance)();
var closeParentPopup = function () {
    if (!instance)
        return;
    var parent = instance.parent;
    while (parent) {
        var proxy = parent.proxy;
        if (proxy && typeof proxy.hide === 'function' && parent.type.name === 'QPopupProxy') {
            proxy.hide();
            return;
        }
        parent = parent.parent;
    }
};
var handleDateUpdate = function (value, reason, _details) {
    var isDaySelection = reason === 'add-day' || reason === 'remove-day';
    // Only update model when user selects a day, not when navigating months/years
    if (isDaySelection) {
        emit('update:modelValue', value);
        if (props.autoClose && !props.multiple && !props.range) {
            emit('date-selected', value);
            setTimeout(closeParentPopup, 0);
        }
    }
};
var viLocale = {
    days: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
    daysShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    months: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
    monthsShort: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12']
};
var __VLS_defaults = {
    mask: 'DD/MM/YYYY',
    landscape: false,
    color: 'primary',
    square: false,
    flat: false,
    bordered: true,
    readonly: false,
    disable: false,
    todayBtn: true,
    minimal: false,
    firstDayOfWeek: 1,
    multiple: false,
    range: false,
    emitImmediately: true,
    defaultView: 'Calendar',
    autoClose: true
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDate | typeof __VLS_components.QDate | typeof __VLS_components.qDate | typeof __VLS_components.QDate} */
qDate;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), mask: (__VLS_ctx.mask), locale: (__VLS_ctx.viLocale), landscape: (__VLS_ctx.landscape), color: (__VLS_ctx.color), textColor: (__VLS_ctx.textColor), dark: (__VLS_ctx.isDark), square: (__VLS_ctx.square), flat: (__VLS_ctx.flat), bordered: (__VLS_ctx.bordered), readonly: (__VLS_ctx.readonly), disable: (__VLS_ctx.disable), title: (__VLS_ctx.title), subtitle: (__VLS_ctx.subtitle), todayBtn: (__VLS_ctx.todayBtn), minimal: (__VLS_ctx.minimal), firstDayOfWeek: (__VLS_ctx.firstDayOfWeek), multiple: (__VLS_ctx.multiple), range: (__VLS_ctx.range), emitImmediately: (__VLS_ctx.emitImmediately), defaultYearMonth: (__VLS_ctx.defaultYearMonth), defaultView: (__VLS_ctx.defaultView) }), { class: "bg-surface" }), { class: ({ 'dark': __VLS_ctx.isDark }) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { modelValue: (__VLS_ctx.modelValue), mask: (__VLS_ctx.mask), locale: (__VLS_ctx.viLocale), landscape: (__VLS_ctx.landscape), color: (__VLS_ctx.color), textColor: (__VLS_ctx.textColor), dark: (__VLS_ctx.isDark), square: (__VLS_ctx.square), flat: (__VLS_ctx.flat), bordered: (__VLS_ctx.bordered), readonly: (__VLS_ctx.readonly), disable: (__VLS_ctx.disable), title: (__VLS_ctx.title), subtitle: (__VLS_ctx.subtitle), todayBtn: (__VLS_ctx.todayBtn), minimal: (__VLS_ctx.minimal), firstDayOfWeek: (__VLS_ctx.firstDayOfWeek), multiple: (__VLS_ctx.multiple), range: (__VLS_ctx.range), emitImmediately: (__VLS_ctx.emitImmediately), defaultYearMonth: (__VLS_ctx.defaultYearMonth), defaultView: (__VLS_ctx.defaultView) }), { class: "bg-surface" }), { class: ({ 'dark': __VLS_ctx.isDark }) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.handleDateUpdate) });
var __VLS_7 = {};
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['dark']} */ ;
var __VLS_8 = __VLS_3.slots.default;
for (var _i = 0, _a = __VLS_vFor((__VLS_ctx.$slots)); _i < _a.length; _i++) {
    var _b = _a[_i], _ = _b[0], name_1 = _b[1];
    {
        var _c = __VLS_3.slots, _d = __VLS_tryAsConstant(name_1), __VLS_9 = _c[_d];
        var slotData = __VLS_vSlot(__VLS_9)[0];
        var __VLS_10 = __assign({}, (slotData !== null && slotData !== void 0 ? slotData : {}));
        var __VLS_11 = __VLS_tryAsConstant(name_1);
        // @ts-ignore
        [modelValue, mask, viLocale, landscape, color, textColor, isDark, isDark, square, flat, bordered, readonly, disable, title, subtitle, todayBtn, minimal, firstDayOfWeek, multiple, range, emitImmediately, defaultYearMonth, defaultView, handleDateUpdate, $slots,];
    }
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_12 = __VLS_11, __VLS_13 = __VLS_10;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
