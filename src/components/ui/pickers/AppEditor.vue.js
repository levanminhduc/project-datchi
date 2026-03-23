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
    modelValue: '',
    readonly: false,
    disable: false,
    minHeight: '10rem',
    placeholder: 'Nhập nội dung...',
    toolbar: function () { return [
        ['bold', 'italic', 'strike', 'underline'],
        ['unordered', 'ordered'],
        ['link', 'quote', 'hr'],
        ['undo', 'redo'],
        ['viewsource']
    ]; },
    toolbarOutline: false,
    toolbarPush: false,
    toolbarRounded: false,
    square: false,
    flat: false,
    dense: false
});
var emit = defineEmits();
var editorValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); }
});
var __VLS_defaults = {
    modelValue: '',
    readonly: false,
    disable: false,
    minHeight: '10rem',
    placeholder: 'Nhập nội dung...',
    toolbar: function () { return [
        ['bold', 'italic', 'strike', 'underline'],
        ['unordered', 'ordered'],
        ['link', 'quote', 'hr'],
        ['undo', 'redo'],
        ['viewsource']
    ]; },
    toolbarOutline: false,
    toolbarPush: false,
    toolbarRounded: false,
    square: false,
    flat: false,
    dense: false
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qEditor | typeof __VLS_components.QEditor} */
qEditor;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.editorValue),
    readonly: (__VLS_ctx.readonly),
    disable: (__VLS_ctx.disable),
    minHeight: (__VLS_ctx.minHeight),
    maxHeight: (__VLS_ctx.maxHeight),
    height: (__VLS_ctx.height),
    placeholder: (__VLS_ctx.placeholder),
    toolbar: (__VLS_ctx.toolbar),
    toolbarTextColor: (__VLS_ctx.toolbarTextColor),
    toolbarColor: (__VLS_ctx.toolbarColor),
    toolbarBg: (__VLS_ctx.toolbarBg),
    toolbarOutline: (__VLS_ctx.toolbarOutline),
    toolbarPush: (__VLS_ctx.toolbarPush),
    toolbarRounded: (__VLS_ctx.toolbarRounded),
    contentStyle: (__VLS_ctx.contentStyle),
    contentClass: (__VLS_ctx.contentClass),
    square: (__VLS_ctx.square),
    flat: (__VLS_ctx.flat),
    dense: (__VLS_ctx.dense),
}));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([{
        modelValue: (__VLS_ctx.editorValue),
        readonly: (__VLS_ctx.readonly),
        disable: (__VLS_ctx.disable),
        minHeight: (__VLS_ctx.minHeight),
        maxHeight: (__VLS_ctx.maxHeight),
        height: (__VLS_ctx.height),
        placeholder: (__VLS_ctx.placeholder),
        toolbar: (__VLS_ctx.toolbar),
        toolbarTextColor: (__VLS_ctx.toolbarTextColor),
        toolbarColor: (__VLS_ctx.toolbarColor),
        toolbarBg: (__VLS_ctx.toolbarBg),
        toolbarOutline: (__VLS_ctx.toolbarOutline),
        toolbarPush: (__VLS_ctx.toolbarPush),
        toolbarRounded: (__VLS_ctx.toolbarRounded),
        contentStyle: (__VLS_ctx.contentStyle),
        contentClass: (__VLS_ctx.contentClass),
        square: (__VLS_ctx.square),
        flat: (__VLS_ctx.flat),
        dense: (__VLS_ctx.dense),
    }], __VLS_functionalComponentArgsRest(__VLS_1), false));
var __VLS_5 = {};
var __VLS_3;
// @ts-ignore
[editorValue, readonly, disable, minHeight, maxHeight, height, placeholder, toolbar, toolbarTextColor, toolbarColor, toolbarBg, toolbarOutline, toolbarPush, toolbarRounded, contentStyle, contentClass, square, flat, dense,];
var __VLS_export = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
exports.default = {};
