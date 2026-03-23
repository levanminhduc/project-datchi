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
var __VLS_props = withDefaults(defineProps(), {
    title: '',
    buttons: true,
    labelSet: 'Lưu',
    labelCancel: 'Hủy',
    autoSave: false,
    inputType: 'text',
    placeholder: ''
});
var emit = defineEmits();
var __VLS_defaults = {
    title: '',
    buttons: true,
    labelSet: 'Lưu',
    labelCancel: 'Hủy',
    autoSave: false,
    inputType: 'text',
    placeholder: ''
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit | typeof __VLS_components.qPopupEdit | typeof __VLS_components.QPopupEdit} */
qPopupEdit;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSave': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: (__VLS_ctx.title), buttons: (__VLS_ctx.buttons), labelSet: (__VLS_ctx.labelSet), labelCancel: (__VLS_ctx.labelCancel), autoSave: (__VLS_ctx.autoSave) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onSave': {} }), { 'onCancel': {} }), { modelValue: (__VLS_ctx.modelValue), title: (__VLS_ctx.title), buttons: (__VLS_ctx.buttons), labelSet: (__VLS_ctx.labelSet), labelCancel: (__VLS_ctx.labelCancel), autoSave: (__VLS_ctx.autoSave) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
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
            [modelValue, title, buttons, labelSet, labelCancel, autoSave, emit,];
        } });
var __VLS_7 = ({ save: {} },
    { onSave: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('save', $event);
            // @ts-ignore
            [emit,];
        } });
var __VLS_8 = ({ cancel: {} },
    { onCancel: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('cancel');
            // @ts-ignore
            [emit,];
        } });
var __VLS_9 = {};
{
    var __VLS_10 = __VLS_3.slots.default;
    var scope = __VLS_vSlot(__VLS_10)[0];
    if (__VLS_ctx.inputType === 'textarea') {
        var __VLS_11 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11(__assign({ 'onKeyup': {} }, { modelValue: (scope.value), type: "textarea", autogrow: true, placeholder: (__VLS_ctx.placeholder), rules: (__VLS_ctx.rules), autofocus: true, dense: true })));
        var __VLS_13 = __VLS_12.apply(void 0, __spreadArray([__assign({ 'onKeyup': {} }, { modelValue: (scope.value), type: "textarea", autogrow: true, placeholder: (__VLS_ctx.placeholder), rules: (__VLS_ctx.rules), autofocus: true, dense: true })], __VLS_functionalComponentArgsRest(__VLS_12), false));
        var __VLS_16 = void 0;
        var __VLS_17 = ({ keyup: {} },
            { onKeyup: (scope.set) });
        var __VLS_14;
        var __VLS_15;
    }
    else {
        var __VLS_18 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qInput | typeof __VLS_components.QInput} */
        qInput;
        // @ts-ignore
        var __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18(__assign({ 'onKeyup': {} }, { modelValue: (scope.value), type: (__VLS_ctx.inputType), placeholder: (__VLS_ctx.placeholder), rules: (__VLS_ctx.rules), autofocus: true, dense: true })));
        var __VLS_20 = __VLS_19.apply(void 0, __spreadArray([__assign({ 'onKeyup': {} }, { modelValue: (scope.value), type: (__VLS_ctx.inputType), placeholder: (__VLS_ctx.placeholder), rules: (__VLS_ctx.rules), autofocus: true, dense: true })], __VLS_functionalComponentArgsRest(__VLS_19), false));
        var __VLS_23 = void 0;
        var __VLS_24 = ({ keyup: {} },
            { onKeyup: (scope.set) });
        var __VLS_21;
        var __VLS_22;
    }
    // @ts-ignore
    [inputType, inputType, placeholder, placeholder, rules, rules,];
    __VLS_3.slots['' /* empty slot name completion */];
}
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
