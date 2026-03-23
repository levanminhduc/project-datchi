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
var props = withDefaults(defineProps(), {
    multiple: false,
    label: 'Chọn tệp',
    clearable: true,
    outlined: true,
    filled: false,
    dense: false,
    disable: false,
    readonly: false,
    color: 'primary',
    useChips: false,
    counter: false
});
var emit = defineEmits();
var fileValue = (0, vue_1.computed)({
    get: function () { var _a; return (_a = props.modelValue) !== null && _a !== void 0 ? _a : null; },
    set: function (val) { return emit('update:modelValue', val !== null && val !== void 0 ? val : null); }
});
var onRejected = function (rejectedEntries) {
    emit('rejected', rejectedEntries);
};
var __VLS_defaults = {
    multiple: false,
    label: 'Chọn tệp',
    clearable: true,
    outlined: true,
    filled: false,
    dense: false,
    disable: false,
    readonly: false,
    color: 'primary',
    useChips: false,
    counter: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qFile | typeof __VLS_components.QFile | typeof __VLS_components.qFile | typeof __VLS_components.QFile} */
qFile;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign({ 'onRejected': {} }, { modelValue: (__VLS_ctx.fileValue), accept: (__VLS_ctx.accept), multiple: (__VLS_ctx.multiple), maxFileSize: (__VLS_ctx.maxFileSize), maxTotalSize: (__VLS_ctx.maxTotalSize), maxFiles: (__VLS_ctx.maxFiles), label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), clearable: (__VLS_ctx.clearable), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), color: (__VLS_ctx.color), useChips: (__VLS_ctx.useChips), counter: (__VLS_ctx.counter) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign({ 'onRejected': {} }, { modelValue: (__VLS_ctx.fileValue), accept: (__VLS_ctx.accept), multiple: (__VLS_ctx.multiple), maxFileSize: (__VLS_ctx.maxFileSize), maxTotalSize: (__VLS_ctx.maxTotalSize), maxFiles: (__VLS_ctx.maxFiles), label: (__VLS_ctx.label), hint: (__VLS_ctx.hint), clearable: (__VLS_ctx.clearable), outlined: (__VLS_ctx.outlined), filled: (__VLS_ctx.filled), dense: (__VLS_ctx.dense), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), color: (__VLS_ctx.color), useChips: (__VLS_ctx.useChips), counter: (__VLS_ctx.counter) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5;
var __VLS_6 = ({ rejected: {} },
    { onRejected: (__VLS_ctx.onRejected) });
var __VLS_7 = {};
var __VLS_8 = __VLS_3.slots.default;
{
    var __VLS_9 = __VLS_3.slots.prepend;
    var __VLS_10 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qIcon | typeof __VLS_components.QIcon} */
    qIcon;
    // @ts-ignore
    var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
        name: "mdi-attachment",
    }));
    var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([{
            name: "mdi-attachment",
        }], __VLS_functionalComponentArgsRest(__VLS_11), false));
    // @ts-ignore
    [fileValue, accept, multiple, maxFileSize, maxTotalSize, maxFiles, label, hint, clearable, outlined, filled, dense, disable, readonly, color, useChips, counter, onRejected,];
}
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
