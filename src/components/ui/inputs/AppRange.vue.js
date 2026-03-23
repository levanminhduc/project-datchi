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
    min: 0,
    max: 100,
    step: 1,
    snap: false,
    vertical: false,
    reverse: false,
    color: 'primary',
    disable: false,
    readonly: false,
    dense: false,
    showLabel: false,
    labelAlways: false,
    switchMarkerLabelsSide: false,
    dragRange: false,
    dragOnlyRange: false,
});
var emit = defineEmits();
var __VLS_defaults = {
    min: 0,
    max: 100,
    step: 1,
    snap: false,
    vertical: false,
    reverse: false,
    color: 'primary',
    disable: false,
    readonly: false,
    dense: false,
    showLabel: false,
    labelAlways: false,
    switchMarkerLabelsSide: false,
    dragRange: false,
    dragOnlyRange: false,
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qRange | typeof __VLS_components.QRange} */
qRange;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onChange': {} }), { modelValue: (__VLS_ctx.modelValue), min: (__VLS_ctx.min), max: (__VLS_ctx.max), step: (__VLS_ctx.step), snap: (__VLS_ctx.snap), vertical: (__VLS_ctx.vertical), reverse: (__VLS_ctx.reverse), color: (__VLS_ctx.color), trackColor: (__VLS_ctx.trackColor), innerTrackColor: (__VLS_ctx.innerTrackColor), selectionColor: (__VLS_ctx.selectionColor), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), dense: (__VLS_ctx.dense), dark: (__VLS_ctx.dark), label: (__VLS_ctx.showLabel), leftLabelValue: (__VLS_ctx.leftLabelValue), rightLabelValue: (__VLS_ctx.rightLabelValue), leftLabelColor: (__VLS_ctx.leftLabelColor), rightLabelColor: (__VLS_ctx.rightLabelColor), leftLabelTextColor: (__VLS_ctx.leftLabelTextColor), rightLabelTextColor: (__VLS_ctx.rightLabelTextColor), labelAlways: (__VLS_ctx.labelAlways), markers: (__VLS_ctx.markers), markerLabels: (__VLS_ctx.markerLabels), markerLabelsClass: (__VLS_ctx.markerLabelsClass), switchMarkerLabelsSide: (__VLS_ctx.switchMarkerLabelsSide), trackSize: (__VLS_ctx.trackSize), leftThumbClass: (__VLS_ctx.leftThumbClass), rightThumbClass: (__VLS_ctx.rightThumbClass), leftThumbColor: (__VLS_ctx.leftThumbColor), rightThumbColor: (__VLS_ctx.rightThumbColor), dragRange: (__VLS_ctx.dragRange), dragOnlyRange: (__VLS_ctx.dragOnlyRange) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onUpdate:modelValue': {} }, { 'onChange': {} }), { modelValue: (__VLS_ctx.modelValue), min: (__VLS_ctx.min), max: (__VLS_ctx.max), step: (__VLS_ctx.step), snap: (__VLS_ctx.snap), vertical: (__VLS_ctx.vertical), reverse: (__VLS_ctx.reverse), color: (__VLS_ctx.color), trackColor: (__VLS_ctx.trackColor), innerTrackColor: (__VLS_ctx.innerTrackColor), selectionColor: (__VLS_ctx.selectionColor), disable: (__VLS_ctx.disable), readonly: (__VLS_ctx.readonly), dense: (__VLS_ctx.dense), dark: (__VLS_ctx.dark), label: (__VLS_ctx.showLabel), leftLabelValue: (__VLS_ctx.leftLabelValue), rightLabelValue: (__VLS_ctx.rightLabelValue), leftLabelColor: (__VLS_ctx.leftLabelColor), rightLabelColor: (__VLS_ctx.rightLabelColor), leftLabelTextColor: (__VLS_ctx.leftLabelTextColor), rightLabelTextColor: (__VLS_ctx.rightLabelTextColor), labelAlways: (__VLS_ctx.labelAlways), markers: (__VLS_ctx.markers), markerLabels: (__VLS_ctx.markerLabels), markerLabelsClass: (__VLS_ctx.markerLabelsClass), switchMarkerLabelsSide: (__VLS_ctx.switchMarkerLabelsSide), trackSize: (__VLS_ctx.trackSize), leftThumbClass: (__VLS_ctx.leftThumbClass), rightThumbClass: (__VLS_ctx.rightThumbClass), leftThumbColor: (__VLS_ctx.leftThumbColor), rightThumbColor: (__VLS_ctx.rightThumbColor), dragRange: (__VLS_ctx.dragRange), dragOnlyRange: (__VLS_ctx.dragOnlyRange) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
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
            [modelValue, min, max, step, snap, vertical, reverse, color, trackColor, innerTrackColor, selectionColor, disable, readonly, dense, dark, showLabel, leftLabelValue, rightLabelValue, leftLabelColor, rightLabelColor, leftLabelTextColor, rightLabelTextColor, labelAlways, markers, markerLabels, markerLabelsClass, switchMarkerLabelsSide, trackSize, leftThumbClass, rightThumbClass, leftThumbColor, rightThumbColor, dragRange, dragOnlyRange, $attrs, emit,];
        } });
var __VLS_7 = ({ change: {} },
    { onChange: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('change', $event);
            // @ts-ignore
            [emit,];
        } });
var __VLS_8 = {};
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
