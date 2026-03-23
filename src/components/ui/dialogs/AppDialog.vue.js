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
    modelValue: false,
    persistent: false,
    maximized: false,
    fullWidth: false,
    fullHeight: false,
    transitionShow: 'slide-up',
    transitionHide: 'slide-down',
    noEscDismiss: false,
    noBackdropDismiss: false,
    position: 'standard'
});
var emit = defineEmits();
var dialogValue = (0, vue_1.computed)({
    get: function () { return props.modelValue; },
    set: function (val) { return emit('update:modelValue', val); }
});
// Optional: specific card styles if needed based on props
var cardStyle = (0, vue_1.computed)(function () {
    if (props.maximized)
        return {};
    return {
        minWidth: props.fullWidth ? '100%' : '400px',
        maxWidth: '90vw'
    };
});
var __VLS_defaults = {
    modelValue: false,
    persistent: false,
    maximized: false,
    fullWidth: false,
    fullHeight: false,
    transitionShow: 'slide-up',
    transitionHide: 'slide-down',
    noEscDismiss: false,
    noBackdropDismiss: false,
    position: 'standard'
};
var __VLS_ctx = __assign(__assign(__assign(__assign(__assign({}, {}), {}), {}), {}), {});
var __VLS_components;
var __VLS_intrinsics;
var __VLS_directives;
var __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.qDialog | typeof __VLS_components.QDialog | typeof __VLS_components.qDialog | typeof __VLS_components.QDialog} */
qDialog;
// @ts-ignore
var __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0(__assign(__assign({ 'onHide': {} }, { 'onShow': {} }), { modelValue: (__VLS_ctx.dialogValue), persistent: (__VLS_ctx.persistent), maximized: (__VLS_ctx.maximized), fullWidth: (__VLS_ctx.fullWidth), fullHeight: (__VLS_ctx.fullHeight), transitionShow: (__VLS_ctx.transitionShow), transitionHide: (__VLS_ctx.transitionHide), noEscDismiss: (__VLS_ctx.noEscDismiss), noBackdropDismiss: (__VLS_ctx.noBackdropDismiss), position: (__VLS_ctx.position) })));
var __VLS_2 = __VLS_1.apply(void 0, __spreadArray([__assign(__assign({ 'onHide': {} }, { 'onShow': {} }), { modelValue: (__VLS_ctx.dialogValue), persistent: (__VLS_ctx.persistent), maximized: (__VLS_ctx.maximized), fullWidth: (__VLS_ctx.fullWidth), fullHeight: (__VLS_ctx.fullHeight), transitionShow: (__VLS_ctx.transitionShow), transitionHide: (__VLS_ctx.transitionHide), noEscDismiss: (__VLS_ctx.noEscDismiss), noBackdropDismiss: (__VLS_ctx.noBackdropDismiss), position: (__VLS_ctx.position) })], __VLS_functionalComponentArgsRest(__VLS_1), false));
(__VLS_ctx.$attrs);
var __VLS_5;
var __VLS_6 = ({ hide: {} },
    { onHide: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('hide');
            // @ts-ignore
            [dialogValue, persistent, maximized, fullWidth, fullHeight, transitionShow, transitionHide, noEscDismiss, noBackdropDismiss, position, $attrs, emit,];
        } });
var __VLS_7 = ({ show: {} },
    { onShow: function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var $event = _a[0];
            __VLS_ctx.emit('show');
            // @ts-ignore
            [emit,];
        } });
var __VLS_8 = {};
var __VLS_9 = __VLS_3.slots.default;
var __VLS_10;
/** @ts-ignore @type {typeof __VLS_components.qCard | typeof __VLS_components.QCard | typeof __VLS_components.qCard | typeof __VLS_components.QCard} */
qCard;
// @ts-ignore
var __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10(__assign({ class: "column no-wrap" }, { style: (__VLS_ctx.cardStyle) })));
var __VLS_12 = __VLS_11.apply(void 0, __spreadArray([__assign({ class: "column no-wrap" }, { style: (__VLS_ctx.cardStyle) })], __VLS_functionalComponentArgsRest(__VLS_11), false));
/** @type {__VLS_StyleScopedClasses['column']} */ ;
/** @type {__VLS_StyleScopedClasses['no-wrap']} */ ;
var __VLS_15 = __VLS_13.slots.default;
if (__VLS_ctx.$slots.header) {
    var __VLS_16 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
    qCardSection;
    // @ts-ignore
    var __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16(__assign({ class: "row items-center q-pb-none" })));
    var __VLS_18 = __VLS_17.apply(void 0, __spreadArray([__assign({ class: "row items-center q-pb-none" })], __VLS_functionalComponentArgsRest(__VLS_17), false));
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pb-none']} */ ;
    var __VLS_21 = __VLS_19.slots.default;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)(__assign({ class: "text-h6" }));
    /** @type {__VLS_StyleScopedClasses['text-h6']} */ ;
    var __VLS_22 = {};
    var __VLS_24 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qSpace | typeof __VLS_components.QSpace} */
    qSpace;
    // @ts-ignore
    var __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({}));
    var __VLS_26 = __VLS_25.apply(void 0, __spreadArray([{}], __VLS_functionalComponentArgsRest(__VLS_25), false));
    if (!__VLS_ctx.persistent) {
        var __VLS_29 = void 0;
        /** @ts-ignore @type {typeof __VLS_components.qBtn | typeof __VLS_components.QBtn} */
        qBtn;
        // @ts-ignore
        var __VLS_30 = __VLS_asFunctionalComponent1(__VLS_29, new __VLS_29({
            icon: "close",
            flat: true,
            round: true,
            dense: true,
            'aria-label': "Đóng dialog",
        }));
        var __VLS_31 = __VLS_30.apply(void 0, __spreadArray([{
                icon: "close",
                flat: true,
                round: true,
                dense: true,
                'aria-label': "Đóng dialog",
            }], __VLS_functionalComponentArgsRest(__VLS_30), false));
        __VLS_asFunctionalDirective(__VLS_directives.vClosePopup, {})(null, __assign({}, __VLS_directiveBindingRestFields), null, null);
    }
    // @ts-ignore
    [persistent, cardStyle, $slots, vClosePopup,];
    var __VLS_19;
}
var __VLS_34;
/** @ts-ignore @type {typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection | typeof __VLS_components.qCardSection | typeof __VLS_components.QCardSection} */
qCardSection;
// @ts-ignore
var __VLS_35 = __VLS_asFunctionalComponent1(__VLS_34, new __VLS_34(__assign({ class: "col q-pt-md scroll" })));
var __VLS_36 = __VLS_35.apply(void 0, __spreadArray([__assign({ class: "col q-pt-md scroll" })], __VLS_functionalComponentArgsRest(__VLS_35), false));
/** @type {__VLS_StyleScopedClasses['col']} */ ;
/** @type {__VLS_StyleScopedClasses['q-pt-md']} */ ;
/** @type {__VLS_StyleScopedClasses['scroll']} */ ;
var __VLS_39 = __VLS_37.slots.default;
var __VLS_40 = {};
// @ts-ignore
[];
var __VLS_37;
if (__VLS_ctx.$slots.actions) {
    var __VLS_42 = void 0;
    /** @ts-ignore @type {typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions | typeof __VLS_components.qCardActions | typeof __VLS_components.QCardActions} */
    qCardActions;
    // @ts-ignore
    var __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42(__assign({ align: "right" }, { class: "q-px-md q-pb-md" })));
    var __VLS_44 = __VLS_43.apply(void 0, __spreadArray([__assign({ align: "right" }, { class: "q-px-md q-pb-md" })], __VLS_functionalComponentArgsRest(__VLS_43), false));
    /** @type {__VLS_StyleScopedClasses['q-px-md']} */ ;
    /** @type {__VLS_StyleScopedClasses['q-pb-md']} */ ;
    var __VLS_47 = __VLS_45.slots.default;
    var __VLS_48 = {};
    // @ts-ignore
    [$slots,];
    var __VLS_45;
}
// @ts-ignore
[];
var __VLS_13;
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
var __VLS_23 = __VLS_22, __VLS_41 = __VLS_40, __VLS_49 = __VLS_48;
// @ts-ignore
[];
var __VLS_base = (await Promise.resolve().then(function () { return require('vue'); })).defineComponent({
    __typeEmits: {},
    __defaults: __VLS_defaults,
    __typeProps: {},
});
var __VLS_export = {};
exports.default = {};
